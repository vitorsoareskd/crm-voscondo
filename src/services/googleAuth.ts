import { GoogleConfig } from '../types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';

declare global {
  interface Window {
    google?: any;
  }
}

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export const DEFAULT_GOOGLE_CONFIG: GoogleConfig = {
  clientId: '',
  accessToken: '',
  tokenExpiresAt: 0,
  userEmail: '',
  userName: '',
  userPicture: ''
};

export const getStoredGoogleConfig = (): GoogleConfig => {
  return loadFromStorage<GoogleConfig>(STORAGE_KEYS.GOOGLE_CONFIG, DEFAULT_GOOGLE_CONFIG);
};

export const saveGoogleConfig = (config: GoogleConfig): void => {
  saveToStorage(STORAGE_KEYS.GOOGLE_CONFIG, config);
};

export const isGoogleTokenValid = (config?: GoogleConfig): boolean => {
  const current = config || getStoredGoogleConfig();
  if (!current.accessToken) return false;
  if (!current.tokenExpiresAt) return true; // If no expiry recorded, assume valid
  return Date.now() < current.tokenExpiresAt - 60000; // 1 min safety margin
};

let gisScriptLoadingPromise: Promise<void> | null = null;

export const loadGisScript = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (gisScriptLoadingPromise) {
    return gisScriptLoadingPromise;
  }

  gisScriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-gis-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error(`Falha ao carregar script do Google Identity Services: ${err}`));
    document.body.appendChild(script);
  });

  return gisScriptLoadingPromise;
};

export const fetchGoogleUserInfo = async (accessToken: string): Promise<{ email?: string; name?: string; picture?: string }> => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      email: data.email,
      name: data.name,
      picture: data.picture
    };
  } catch (err) {
    console.warn('Erro ao obter perfil do usuário Google:', err);
    return {};
  }
};

export const requestGoogleAccessToken = async (customClientId?: string): Promise<GoogleConfig> => {
  await loadGisScript();

  const config = getStoredGoogleConfig();
  const clientId = (customClientId || config.clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '').trim();

  if (!clientId) {
    throw new Error('CLIENT_ID_MISSING');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = Number(tokenResponse.expires_in) || 3599;
          const tokenExpiresAt = Date.now() + expiresIn * 1000;

          // Fetch user info
          const userInfo = await fetchGoogleUserInfo(accessToken);

          const updatedConfig: GoogleConfig = {
            clientId,
            accessToken,
            tokenExpiresAt,
            userEmail: userInfo.email || config.userEmail || 'Conectado',
            userName: userInfo.name || config.userName,
            userPicture: userInfo.picture || config.userPicture
          };

          saveGoogleConfig(updatedConfig);
          resolve(updatedConfig);
        },
      });

      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
};

export const logoutGoogle = (): GoogleConfig => {
  const current = getStoredGoogleConfig();
  if (current.accessToken && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(current.accessToken, () => {});
    } catch (e) {
      console.warn('Erro ao revogar token Google:', e);
    }
  }

  const resetConfig: GoogleConfig = {
    clientId: current.clientId,
    accessToken: '',
    tokenExpiresAt: 0,
    userEmail: '',
    userName: '',
    userPicture: ''
  };

  saveGoogleConfig(resetConfig);
  return resetConfig;
};
