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
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore using specific databaseId if defined
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collection Helpers
let isQuotaExceeded = false;

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

export async function saveCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const colRef = collection(db, collectionName);
    const existingSnapshot = await getDocs(colRef);
    const validIds = new Set(items.map((item) => item.id));

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
    for (const item of items) {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item, { merge: true });
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
  if (isQuotaExceeded) return;
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
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
    const docRef = doc(db, collectionName, id);
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
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as T);
      });

      const isDataCleared = localStorage.getItem('vos_data_cleared') === 'true';

      if (items.length === 0) {
        if (isDataCleared) {
          onUpdate([]);
        } else if (initialFallbackItems && initialFallbackItems.length > 0) {
          // Firestore is empty and data was not explicitly cleared -> seed Firestore if quota allows!
          if (!isQuotaExceeded) {
            saveCollectionToFirestore(collectionName, initialFallbackItems);
          }
          onUpdate(initialFallbackItems);
        } else {
          onUpdate([]);
        }
      } else {
        onUpdate(items);
      }
    },
    (error) => {
      handleFirestoreError(error, `subscribeToCollection (${collectionName})`);
      console.warn(`Firestore snapshot subscription notice on ${collectionName}:`, error?.message || error);
    }
  );
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
