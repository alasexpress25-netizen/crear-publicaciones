import {
  getClientMemoryDB,
  saveClientMemoryDB,
  deleteClientMemoryDB,
} from './storageDb';

export interface ClientMemoryItem {
  id: string;
  clientName: string;
  clientId?: string;
  timestamp: string;
  topic?: string;
  hookTitle?: string;
  slideHeadlines: string[];
  visualScenes: string[];
  prompts: string[];
}

export interface ClientMemory {
  clientName: string;
  clientId?: string;
  usedTopics: string[];
  usedHooks: string[];
  usedHeadlines: string[];
  usedVisualScenes: string[];
  usedPrompts: string[];
  history: ClientMemoryItem[];
  lastUpdated: string;
}

const STORAGE_PREFIX = 'lavisualmk_client_memory_';

// Cache en memoria para acceso síncrono ultrarrápido durante el ciclo de vida de React
const memoryCache = new Map<string, ClientMemory>();

/**
 * Normaliza el nombre del cliente para usarlo como clave segura
 */
function normalizeKey(clientName: string): string {
  return (clientName || 'default_client')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/gi, '_');
}

/**
 * Carga e inicializa la memoria desde IndexedDB (con migración transparente de localStorage si existiera)
 */
export async function loadClientMemoryFromDB(clientName: string): Promise<ClientMemory> {
  const normKey = normalizeKey(clientName);
  
  try {
    // 1. Intentar leer de IndexedDB (almacenamiento masivo y persistente)
    const dbRecord = await getClientMemoryDB(clientName);
    if (dbRecord && (dbRecord.usedHooks || dbRecord.usedVisualScenes || dbRecord.history)) {
      const parsed: ClientMemory = {
        clientName: dbRecord.clientName || clientName,
        clientId: dbRecord.clientId,
        usedTopics: Array.isArray(dbRecord.usedTopics) ? dbRecord.usedTopics : [],
        usedHooks: Array.isArray(dbRecord.usedHooks) ? dbRecord.usedHooks : [],
        usedHeadlines: Array.isArray(dbRecord.usedHeadlines) ? dbRecord.usedHeadlines : [],
        usedVisualScenes: Array.isArray(dbRecord.usedVisualScenes) ? dbRecord.usedVisualScenes : [],
        usedPrompts: Array.isArray(dbRecord.usedPrompts) ? dbRecord.usedPrompts : [],
        history: Array.isArray(dbRecord.history) ? dbRecord.history : [],
        lastUpdated: dbRecord.lastUpdated || new Date().toISOString(),
      };
      memoryCache.set(normKey, parsed);
      return parsed;
    }

    // 2. Si no está en IndexedDB, verificar si existe un registro legacy en localStorage y migrarlo
    if (typeof window !== 'undefined') {
      const localData = localStorage.getItem(`${STORAGE_PREFIX}${normKey}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        const mem: ClientMemory = {
          clientName: parsed.clientName || clientName,
          clientId: parsed.clientId,
          usedTopics: Array.isArray(parsed.usedTopics) ? parsed.usedTopics : [],
          usedHooks: Array.isArray(parsed.usedHooks) ? parsed.usedHooks : [],
          usedHeadlines: Array.isArray(parsed.usedHeadlines) ? parsed.usedHeadlines : [],
          usedVisualScenes: Array.isArray(parsed.usedVisualScenes) ? parsed.usedVisualScenes : [],
          usedPrompts: Array.isArray(parsed.usedPrompts) ? parsed.usedPrompts : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        // Guardar inmediatamente en IndexedDB
        await saveClientMemoryDB(mem);
        memoryCache.set(normKey, mem);
        return mem;
      }
    }
  } catch (err) {
    console.warn('Error cargando memoria desde IndexedDB:', err);
  }

  const empty = createEmptyMemory(clientName);
  memoryCache.set(normKey, empty);
  return empty;
}

/**
 * Obtiene la memoria acumulada para un cliente específico (síncrona para hooks y llamadas inmediatas)
 */
export function getClientMemory(clientName: string): ClientMemory {
  const normKey = normalizeKey(clientName);

  // 1. Revisar cache en memoria
  if (memoryCache.has(normKey)) {
    return memoryCache.get(normKey)!;
  }

  // 2. Revisar localStorage inicial
  if (typeof window !== 'undefined') {
    try {
      const key = `${STORAGE_PREFIX}${normKey}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        const mem: ClientMemory = {
          clientName: parsed.clientName || clientName,
          clientId: parsed.clientId,
          usedTopics: Array.isArray(parsed.usedTopics) ? parsed.usedTopics : [],
          usedHooks: Array.isArray(parsed.usedHooks) ? parsed.usedHooks : [],
          usedHeadlines: Array.isArray(parsed.usedHeadlines) ? parsed.usedHeadlines : [],
          usedVisualScenes: Array.isArray(parsed.usedVisualScenes) ? parsed.usedVisualScenes : [],
          usedPrompts: Array.isArray(parsed.usedPrompts) ? parsed.usedPrompts : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        memoryCache.set(normKey, mem);
        // Sincronizar en segundo plano con IndexedDB
        saveClientMemoryDB(mem).catch(() => {});
        return mem;
      }
    } catch (err) {
      console.warn('Error reading client memory fallback:', err);
    }
  }

  // Iniciar carga asíncrona de IndexedDB para hidratar cache
  loadClientMemoryFromDB(clientName).catch(() => {});

  const empty = createEmptyMemory(clientName);
  memoryCache.set(normKey, empty);
  return empty;
}

function createEmptyMemory(clientName: string): ClientMemory {
  return {
    clientName: clientName || 'Cliente',
    usedTopics: [],
    usedHooks: [],
    usedHeadlines: [],
    usedVisualScenes: [],
    usedPrompts: [],
    history: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Guarda o actualiza la memoria de un cliente en IndexedDB (y espejo local)
 */
export function saveClientMemory(memory: ClientMemory): void {
  const normKey = normalizeKey(memory.clientName);
  memoryCache.set(normKey, memory);

  // 1. Guardar de forma robusta en IndexedDB (sin límites de cuota de 5MB)
  saveClientMemoryDB(memory).catch((err) => {
    console.warn('Error persistiendo memoria en IndexedDB:', err);
  });

  // 2. Mantener un espejo ligero en localStorage como fallback
  if (typeof window !== 'undefined') {
    try {
      const key = `${STORAGE_PREFIX}${normKey}`;
      localStorage.setItem(key, JSON.stringify(memory));
    } catch {
      // Si localStorage está lleno, IndexedDB ya tiene los datos completos a salvo
    }
  }
}

/**
 * Registra un carrusel generado en la memoria del cliente
 */
export function recordCarouselGeneration(
  clientName: string,
  data: {
    topic?: string;
    slides: Array<{ title?: string; headline?: string; imageSuggestion?: string }>;
    prompts?: string[];
  }
): ClientMemory {
  const mem = getClientMemory(clientName);

  const headlines: string[] = [];
  const scenes: string[] = [];

  data.slides.forEach((s) => {
    const title = (s.headline || s.title || '').trim();
    if (title && !headlines.includes(title)) {
      headlines.push(title);
    }
    const scene = (s.imageSuggestion || '').trim();
    if (scene && !scenes.includes(scene)) {
      scenes.push(scene);
    }
  });

  const hookTitle = headlines.length > 0 ? headlines[0] : '';
  const newTopic = (data.topic || '').trim();

  // Deduplicar arrays acumulados
  if (newTopic && !mem.usedTopics.includes(newTopic)) {
    mem.usedTopics.unshift(newTopic);
  }
  if (hookTitle && !mem.usedHooks.includes(hookTitle)) {
    mem.usedHooks.unshift(hookTitle);
  }

  headlines.forEach((h) => {
    if (h && !mem.usedHeadlines.includes(h)) {
      mem.usedHeadlines.unshift(h);
    }
  });

  scenes.forEach((sc) => {
    if (sc && !mem.usedVisualScenes.includes(sc)) {
      mem.usedVisualScenes.unshift(sc);
    }
  });

  if (Array.isArray(data.prompts)) {
    data.prompts.forEach((p) => {
      const promptClean = (p || '').trim();
      if (promptClean && !mem.usedPrompts.includes(promptClean)) {
        mem.usedPrompts.unshift(promptClean);
      }
    });
  }

  // Con IndexedDB podemos almacenar un historial mucho más amplio de temas y conceptos
  mem.usedTopics = mem.usedTopics.slice(0, 100);
  mem.usedHooks = mem.usedHooks.slice(0, 100);
  mem.usedHeadlines = mem.usedHeadlines.slice(0, 150);
  mem.usedVisualScenes = mem.usedVisualScenes.slice(0, 120);
  mem.usedPrompts = mem.usedPrompts.slice(0, 100);

  const historyItem: ClientMemoryItem = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    clientName,
    timestamp: new Date().toISOString(),
    topic: newTopic,
    hookTitle,
    slideHeadlines: headlines,
    visualScenes: scenes,
    prompts: data.prompts || [],
  };

  mem.history.unshift(historyItem);
  mem.history = mem.history.slice(0, 50);
  mem.lastUpdated = new Date().toISOString();

  saveClientMemory(mem);
  return mem;
}

/**
 * Registra una escena visual resuelta por el Director de Arte
 */
export function recordVisualScene(
  clientName: string,
  scene: string,
  prompt?: string
): ClientMemory {
  const mem = getClientMemory(clientName);
  const cleanScene = (scene || '').trim();
  const cleanPrompt = (prompt || '').trim();

  if (cleanScene && !mem.usedVisualScenes.includes(cleanScene)) {
    mem.usedVisualScenes.unshift(cleanScene);
    mem.usedVisualScenes = mem.usedVisualScenes.slice(0, 120);
  }

  if (cleanPrompt && !mem.usedPrompts.includes(cleanPrompt)) {
    mem.usedPrompts.unshift(cleanPrompt);
    mem.usedPrompts = mem.usedPrompts.slice(0, 100);
  }

  mem.lastUpdated = new Date().toISOString();
  saveClientMemory(mem);
  return mem;
}

/**
 * Limpia la memoria de un cliente si el usuario desea reiniciar el historial
 */
export function clearClientMemory(clientName: string): void {
  const normKey = normalizeKey(clientName);
  memoryCache.delete(normKey);

  // Eliminar de IndexedDB
  deleteClientMemoryDB(clientName).catch(() => {});

  // Eliminar de localStorage
  if (typeof window !== 'undefined') {
    const key = `${STORAGE_PREFIX}${normKey}`;
    localStorage.removeItem(key);
  }
}
