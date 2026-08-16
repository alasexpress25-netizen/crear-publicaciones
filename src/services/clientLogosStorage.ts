import { openAppDB } from './storageDb';

export interface ClientLogoAsset {
  id: string;
  clientId?: string;
  clientName: string;
  logoUrl: string; // Base64 data URL or external URL
  createdAt: string;
  fileName?: string;
  fileSize?: string;
}

const LOGOS_STORAGE_KEY = 'lavisualmk_client_logos_v1';
const CLIENT_LOGOS_MAP_KEY = 'lavisualmk_client_logos_map_v1';
const STORE_LOGOS = 'client_logos';

export function getClientLogoMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CLIENT_LOGOS_MAP_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveClientLogoMapping(clientId: string, clientName: string, logoUrl: string): void {
  try {
    const map = getClientLogoMap();
    if (clientId) map[clientId] = logoUrl;
    if (clientName) map[clientName.trim().toLowerCase()] = logoUrl;
    localStorage.setItem(CLIENT_LOGOS_MAP_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Error saving client logo mapping', err);
  }
}

export function removeClientLogoMapping(clientId: string, clientName: string): void {
  try {
    const map = getClientLogoMap();
    if (clientId && map[clientId]) delete map[clientId];
    if (clientName && map[clientName.trim().toLowerCase()]) delete map[clientName.trim().toLowerCase()];
    localStorage.setItem(CLIENT_LOGOS_MAP_KEY, JSON.stringify(map));
  } catch {}
}

export function findLogoForClient(
  clientId?: string,
  clientName?: string,
  storedLogos?: ClientLogoAsset[]
): string | null {
  const map = getClientLogoMap();
  
  if (clientId && map[clientId]) {
    return map[clientId];
  }
  if (clientName && map[clientName.trim().toLowerCase()]) {
    return map[clientName.trim().toLowerCase()];
  }

  if (storedLogos && storedLogos.length > 0) {
    if (clientId) {
      const match = storedLogos.find((l) => l.clientId === clientId);
      if (match?.logoUrl) return match.logoUrl;
    }
    if (clientName) {
      const norm = clientName.trim().toLowerCase();
      const match = storedLogos.find(
        (l) => (l.clientName && l.clientName.trim().toLowerCase() === norm) ||
               (l.fileName && l.fileName.toLowerCase().includes(norm))
      );
      if (match?.logoUrl) return match.logoUrl;
    }
  }

  return null;
}

function openLogosDB(): Promise<IDBDatabase> {
  return openAppDB();
}

export async function getAllClientLogosDB(): Promise<ClientLogoAsset[]> {
  try {
    const db = await openLogosDB();
    if (!db.objectStoreNames.contains(STORE_LOGOS)) {
      return getLogosLocalStorage();
    }
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(STORE_LOGOS, 'readonly');
        const store = transaction.objectStore(STORE_LOGOS);
        const request = store.getAll();
        request.onsuccess = () => {
          const res = (request.result as ClientLogoAsset[]) || [];
          if (res.length === 0) {
            resolve(getLogosLocalStorage());
          } else {
            resolve(res);
          }
        };
        request.onerror = () => resolve(getLogosLocalStorage());
      } catch {
        resolve(getLogosLocalStorage());
      }
    });
  } catch {
    return getLogosLocalStorage();
  }
}

export async function saveClientLogoDB(logo: ClientLogoAsset): Promise<void> {
  // Save to LocalStorage fallback
  try {
    const current = getLogosLocalStorage();
    const filtered = current.filter((l) => l.id !== logo.id && l.clientName.toLowerCase() !== logo.clientName.toLowerCase());
    const updated = [logo, ...filtered];
    localStorage.setItem(LOGOS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('LocalStorage logo save fallback error', err);
  }

  // Save to IndexedDB
  try {
    const db = await openLogosDB();
    if (db.objectStoreNames.contains(STORE_LOGOS)) {
      const transaction = db.transaction(STORE_LOGOS, 'readwrite');
      const store = transaction.objectStore(STORE_LOGOS);
      store.put(logo);
    }
  } catch (err) {
    console.warn('IndexedDB logo save error', err);
  }
}

export async function deleteClientLogoDB(id: string): Promise<void> {
  try {
    const current = getLogosLocalStorage();
    const updated = current.filter((l) => l.id !== id);
    localStorage.setItem(LOGOS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  try {
    const db = await openLogosDB();
    if (db.objectStoreNames.contains(STORE_LOGOS)) {
      const transaction = db.transaction(STORE_LOGOS, 'readwrite');
      const store = transaction.objectStore(STORE_LOGOS);
      store.delete(id);
    }
  } catch {}
}

export function downloadLogoFile(logo: ClientLogoAsset): void {
  const link = document.createElement('a');
  link.href = logo.logoUrl;
  const safeName = (logo.clientName || 'logo').toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.download = `${safeName}_logo.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getLogosLocalStorage(): ClientLogoAsset[] {
  try {
    const raw = localStorage.getItem(LOGOS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}
