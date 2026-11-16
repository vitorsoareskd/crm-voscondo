import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  firestoreDatabaseId: appletConfig.firestoreDatabaseId
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore using specific databaseId if defined
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Firestore Collection Helpers - Cache of last serialized collection to prevent feedback loops / flickering
let isQuotaExceeded = false;
const lastSerializedCache: Record<string, string> = {};
const initialWatchFired: Record<string, boolean> = {};

function handleFirestoreError(error: any, action: string) {
  if (
    error?.code === 'resource-exhausted' ||
    (typeof error?.message === 'string' && error.message.includes('Quota limit exceeded'))
  ) {
    if (!isQuotaExceeded) {
      isQuotaExceeded = true;
      console.warn(`[Firestore Quota] Limite diário do Firestore atingido durante ${action}. A aplicação continuará operando normalmente com salvamento local (localStorage).`);
    }
    return true;
  }
  return false;
}

// Sanitize object to remove undefined properties (which cause Firestore SDK to throw)
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function stableSerialize<T extends { id: string }>(items: T[]): string {
  try {
    const sorted = [...items]
      .filter((i) => i && typeof i === 'object' && i.id != null)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return JSON.stringify(sorted);
  } catch {
    return '';
  }
}

export async function saveCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (isQuotaExceeded || !Array.isArray(items)) return;

  // Skip initial mount effect so we don't overwrite or trigger feedback loops before user edits
  if (!initialWatchFired[collectionName]) {
    initialWatchFired[collectionName] = true;
    lastSerializedCache[collectionName] = stableSerialize(items);
    return;
  }

  const serialized = stableSerialize(items);
  if (lastSerializedCache[collectionName] === serialized) {
    return;
  }
  lastSerializedCache[collectionName] = serialized;

  try {
    const safeItems = items.filter((item) => item && typeof item === 'object' && item.id != null);
    const colRef = collection(db, collectionName);
    const existingSnapshot = await getDocs(colRef);
    const validIds = new Set(safeItems.map((item) => String(item.id)));

    let batch = writeBatch(db);
    let count = 0;

    // Delete documents in Firestore that are no longer present in local items
    for (const docSnap of existingSnapshot.docs) {
      if (!validIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
    }

    // Write/update current items with full detail
    for (const item of safeItems) {
      const docRef = doc(db, collectionName, String(item.id));
      batch.set(docRef, sanitizeForFirestore(item));
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    if (!handleFirestoreError(error, `saveCollectionToFirestore (${collectionName})`)) {
      console.error(`Error saving collection ${collectionName} to Firestore:`, error);
    }
  }
}

export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  if (isQuotaExceeded || !item || item.id == null) return;
  try {
    const docRef = doc(db, collectionName, String(item.id));
    await setDoc(docRef, sanitizeForFirestore(item), { merge: true });
  } catch (error) {
    if (!handleFirestoreError(error, `saveDocumentToFirestore (${collectionName})`)) {
      console.error(`Error saving document ${item.id} to ${collectionName}:`, error);
    }
  }
}

export async function deleteDocumentFromFirestore(
  collectionName: string,
  id: string
): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
  } catch (error) {
    if (!handleFirestoreError(error, `deleteDocumentFromFirestore (${collectionName})`)) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
    }
  }
}

export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  initialFallbackItems?: T[]
): () => void {
  if (isQuotaExceeded) {
    return () => {};
  }
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        // Ignore local pending echoes to prevent input flickering while user is typing or saving
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data === 'object') {
            items.push({
              ...data,
              id: data.id != null ? String(data.id) : docSnap.id,
            } as T);
          }
        });

        const isDataCleared = localStorage.getItem('vos_data_cleared') === 'true';
        let finalItems: T[] = items;

        if (items.length === 0) {
          if (isDataCleared) {
            finalItems = [];
          } else if (initialFallbackItems && initialFallbackItems.length > 0) {
            finalItems = initialFallbackItems;
          } else {
            finalItems = [];
          }
        } else if (!isDataCleared && initialFallbackItems && initialFallbackItems.length > 0) {
          const mergedMap = new Map<string, T>();
          for (const item of items) {
            mergedMap.set(String(item.id), item);
          }
          for (const initItem of initialFallbackItems) {
            const existing = mergedMap.get(String(initItem.id));
            if (!existing) {
              mergedMap.set(String(initItem.id), initItem);
            } else if (
              (initItem as any).templatesRelatorio &&
              !(existing as any).templatesRelatorio
            ) {
              mergedMap.set(String(initItem.id), {
                ...initItem,
                ...existing,
                templatesRelatorio: (initItem as any).templatesRelatorio,
                anotacoes: (existing as any).anotacoes || (initItem as any).anotacoes,
                historicoCaixa:
                  (existing as any).historicoCaixa?.length > 0
                    ? (existing as any).historicoCaixa
                    : (initItem as any).historicoCaixa,
              });
            }
          }
          finalItems = Array.from(mergedMap.values());
        }

        const incomingSerialized = stableSerialize(finalItems);
        if (lastSerializedCache[collectionName] === incomingSerialized) {
          return;
        }
        lastSerializedCache[collectionName] = incomingSerialized;
        onUpdate(finalItems);
      },
      (error) => {
        handleFirestoreError(error, `subscribeToCollection (${collectionName})`);
        console.warn(`Firestore snapshot subscription notice on ${collectionName}:`, error?.message || error);
      }
    );
  } catch (err) {
    console.warn(`Could not subscribe to Firestore collection ${collectionName}:`, err);
    return () => {};
  }
}

export async function clearFirestoreCollection(collectionName: string): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    if (!handleFirestoreError(error, `clearFirestoreCollection (${collectionName})`)) {
      console.error(`Error clearing collection ${collectionName}:`, error);
    }
  }
}
