import { SavedCarouselProject, Slide, BrandInfo, CarouselPostMeta, AspectRatio, MarketingDocument } from '../types';
import { AgencyClient } from './supabase';

const DB_NAME = 'LaVisualMK_CarouselDB';
const DB_VERSION = 2;
const STORE_PROJECTS = 'projects';
const STORE_META = 'metadata';
const STORE_LOGOS = 'client_logos';
const LEGACY_STORAGE_KEY = 'lavisualmk_saved_projects_v2';
const ACTIVE_WORKSPACE_KEY = 'lavisualmk_active_workspace_v1';

export interface ActiveWorkspaceData {
  slides: Slide[];
  brand: BrandInfo;
  brief: string;
  targetAudience: string;
  postMeta: CarouselPostMeta;
  aspectRatio: AspectRatio;
  documents?: MarketingDocument[];
  selectedClient?: AgencyClient | null;
  updatedAt: string;
}

export function openAppDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no está soportado en este navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('clientName', 'clientName', { unique: false });
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_LOGOS)) {
        const logoStore = db.createObjectStore(STORE_LOGOS, { keyPath: 'id' });
        logoStore.createIndex('clientName', 'clientName', { unique: false });
        logoStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDB(): Promise<IDBDatabase> {
  return openAppDB();
}

/**
 * Migra automáticamente datos de localStorage a IndexedDB si existen
 */
export async function migrateLegacyLocalStorage(): Promise<SavedCarouselProject[]> {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];

    const parsed: SavedCarouselProject[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      await saveAllProjectsDB(parsed);
      // Mantenemos una copia ligera o respaldo
      return parsed;
    }
  } catch (err) {
    console.warn('Error al migrar localStorage a IndexedDB:', err);
  }
  return [];
}

/**
 * Obtiene todos los proyectos guardados en IndexedDB
 */
export async function getAllProjectsDB(): Promise<SavedCarouselProject[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readonly');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.getAll();

      request.onsuccess = async () => {
        let results = (request.result as SavedCarouselProject[]) || [];
        
        // Si IndexedDB está vacío, intentar migrar de localStorage
        if (results.length === 0) {
          const migrated = await migrateLegacyLocalStorage();
          if (migrated.length > 0) {
            results = migrated;
          }
        }

        // Ordenar por updatedAt o createdAt descendente
        results.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime() || 0;
          const timeB = new Date(b.updatedAt || b.createdAt).getTime() || 0;
          return timeB - timeA;
        });

        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error leyendo proyectos de IndexedDB:', err);
    // Fallback a localStorage
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  }
}

/**
 * Guarda o actualiza un proyecto en IndexedDB
 */
export async function saveProjectDB(project: SavedCarouselProject): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.put(project);

      request.onsuccess = () => {
        // También actualizamos una copia segura en localStorage si el tamaño lo permite
        syncToLocalStorageFallback();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error guardando proyecto en IndexedDB:', err);
    // Fallback
    try {
      const all = await getAllProjectsDB();
      const updated = [project, ...all.filter(p => p.id !== project.id)];
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Fallo también el fallback de localStorage:', e);
    }
  }
}

/**
 * Guarda una lista completa de proyectos (para importaciones / respaldos)
 */
export async function saveAllProjectsDB(projects: SavedCarouselProject[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = transaction.objectStore(STORE_PROJECTS);

    projects.forEach((proj) => {
      store.put(proj);
    });

    transaction.oncomplete = () => {
      syncToLocalStorageFallback();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Elimina un proyecto por ID
 */
export async function deleteProjectDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.delete(id);

      request.onsuccess = () => {
        syncToLocalStorageFallback();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error eliminando proyecto de IndexedDB:', err);
  }
}

/**
 * Guarda un objeto metadata o handle en IndexedDB
 */
export async function setMetaDB(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_META, 'readwrite');
      const store = transaction.objectStore(STORE_META);
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error guardando metadata en IndexedDB:', err);
  }
}

/**
 * Obtiene un objeto metadata o handle desde IndexedDB
 */
export async function getMetaDB<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_META, 'readonly');
      const store = transaction.objectStore(STORE_META);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error leyendo metadata de IndexedDB:', err);
    return null;
  }
}

/**
 * Sincroniza un subconjunto ligero con localStorage como respaldo secundario
 */
async function syncToLocalStorageFallback() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_PROJECTS, 'readonly');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result;
      if (all) {
        try {
          localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(all));
        } catch (e) {
          console.warn('localStorage lleno, los datos continúan seguros en IndexedDB.');
        }
      }
    };
  } catch {
    // ignore
  }
}

/**
 * Guarda el estado activo de la mesa de trabajo (incluidas imágenes pesadas en base64 de la PC) en IndexedDB
 */
export async function saveActiveWorkspaceDB(data: Omit<ActiveWorkspaceData, 'updatedAt'>): Promise<void> {
  try {
    const fullData: ActiveWorkspaceData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setMetaDB(ACTIVE_WORKSPACE_KEY, fullData);
  } catch (err) {
    console.warn('Error guardando active workspace en IndexedDB:', err);
  }
}

/**
 * Restaura el estado activo de la mesa de trabajo desde IndexedDB
 */
export async function getActiveWorkspaceDB(): Promise<ActiveWorkspaceData | null> {
  try {
    const data = await getMetaDB<ActiveWorkspaceData>(ACTIVE_WORKSPACE_KEY);
    if (data && data.slides && Array.isArray(data.slides) && data.slides.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Error leyendo active workspace de IndexedDB:', err);
  }
  return null;
}
