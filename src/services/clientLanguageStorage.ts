import { getMetaDB, setMetaDB } from './storageDb';

export type AppLanguage = 'es' | 'pt' | 'en';

const CLIENT_LANGUAGES_STORAGE_KEY = 'lavisualmk_client_languages_v1';
const CURRENT_APP_LANGUAGE_KEY = 'lavisualmk_current_language_v1';
const META_KEY_CLIENT_LANGUAGES = 'client_languages_map';

/**
 * In-memory cache for fast synchronous access
 */
let memoryLanguageMap: Record<string, AppLanguage> | null = null;

/**
 * Gets all saved client language preferences as a synchronous dictionary
 */
export function getClientLanguagesMap(): Record<string, AppLanguage> {
  if (memoryLanguageMap) {
    return memoryLanguageMap;
  }

  try {
    const raw = localStorage.getItem(CLIENT_LANGUAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryLanguageMap = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading client languages from localStorage', err);
  }

  memoryLanguageMap = {};
  return memoryLanguageMap;
}

/**
 * Gets the preferred language for a specific client (by ID or name)
 */
export function getClientLanguage(
  clientId?: string,
  clientName?: string,
  fallbackLang: AppLanguage = 'es'
): AppLanguage {
  const map = getClientLanguagesMap();

  if (clientId && map[clientId]) {
    return map[clientId];
  }

  if (clientName) {
    const norm = clientName.trim().toLowerCase();
    if (map[norm]) {
      return map[norm];
    }
  }

  return fallbackLang;
}

/**
 * Gets the last used active language in the application
 */
export function getStoredAppLanguage(fallback: AppLanguage = 'es'): AppLanguage {
  try {
    const saved = localStorage.getItem(CURRENT_APP_LANGUAGE_KEY);
    if (saved === 'es' || saved === 'pt' || saved === 'en') {
      return saved;
    }
  } catch {}
  return fallback;
}

/**
 * Sets the active global application language
 */
export function setStoredAppLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(CURRENT_APP_LANGUAGE_KEY, lang);
  } catch (err) {
    console.warn('Error saving current app language to localStorage', err);
  }
}

/**
 * Saves a client's language preference to both LocalStorage (instant sync)
 * and IndexedDB (durable long-term backup).
 */
export async function saveClientLanguage(
  clientId?: string,
  clientName?: string,
  lang: AppLanguage = 'es'
): Promise<void> {
  const map = { ...getClientLanguagesMap() };

  if (clientId) {
    map[clientId] = lang;
  }
  if (clientName) {
    map[clientName.trim().toLowerCase()] = lang;
  }

  memoryLanguageMap = map;

  // 1. Save to LocalStorage
  try {
    localStorage.setItem(CLIENT_LANGUAGES_STORAGE_KEY, JSON.stringify(map));
    localStorage.setItem(CURRENT_APP_LANGUAGE_KEY, lang);
  } catch (err) {
    console.warn('LocalStorage quota or write warning, persisting to IndexedDB', err);
  }

  // 2. Dual-sync to IndexedDB metadata store for long-term safety
  try {
    await setMetaDB(META_KEY_CLIENT_LANGUAGES, map);
  } catch (err) {
    console.warn('IndexedDB language map backup error', err);
  }
}

/**
 * Initializes and reconciles languages from IndexedDB into LocalStorage on app load
 */
export async function initClientLanguagesFromDB(): Promise<Record<string, AppLanguage>> {
  try {
    const dbMap = await getMetaDB<Record<string, AppLanguage>>(META_KEY_CLIENT_LANGUAGES);
    if (dbMap && typeof dbMap === 'object') {
      const localMap = getClientLanguagesMap();
      const merged = { ...dbMap, ...localMap };
      memoryLanguageMap = merged;
      try {
        localStorage.setItem(CLIENT_LANGUAGES_STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (err) {
    console.warn('Error checking IndexedDB for client languages', err);
  }
  return getClientLanguagesMap();
}

/**
 * Calculates current LocalStorage usage and quota metrics
 * Standard browser localStorage limit is ~5MB (5,242,880 bytes).
 */
export interface LocalStorageStats {
  usedBytes: number;
  usedKB: number;
  usedMB: number;
  maxMB: number;
  percentUsed: number;
  isSafe: boolean;
  itemCount: number;
  breakdown: Array<{ key: string; sizeKB: number }>;
}

export function getLocalStorageStats(): LocalStorageStats {
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  let totalBytes = 0;
  const breakdown: Array<{ key: string; sizeKB: number }> = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        // 2 bytes per UTF-16 character
        const itemBytes = (key.length + val.length) * 2;
        totalBytes += itemBytes;
        breakdown.push({
          key,
          sizeKB: Math.round((itemBytes / 1024) * 10) / 10,
        });
      }
    }
  } catch (e) {
    console.warn('Error reading localStorage stats', e);
  }

  breakdown.sort((a, b) => b.sizeKB - a.sizeKB);

  const usedKB = Math.round((totalBytes / 1024) * 10) / 10;
  const usedMB = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;
  const percentUsed = Math.round((totalBytes / MAX_BYTES) * 1000) / 10;

  return {
    usedBytes: totalBytes,
    usedKB,
    usedMB,
    maxMB: 5,
    percentUsed,
    isSafe: percentUsed < 80, // Safe if under 80% of 5MB
    itemCount: breakdown.length,
    breakdown,
  };
}
