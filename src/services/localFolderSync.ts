import { SavedCarouselProject } from '../types';
import { getMetaDB, setMetaDB } from './storageDb';

// Extend window for File System Access API types
declare global {
  interface Window {
    showDirectoryPicker?: (options?: any) => Promise<FileSystemDirectoryHandle>;
    showSaveFilePicker?: (options?: any) => Promise<FileSystemFileHandle>;
  }
}

let activeDirectoryHandle: FileSystemDirectoryHandle | null = null;
const FOLDER_NAME_KEY = 'lavisualmk_linked_folder_name';
const META_DIR_HANDLE_KEY = 'linked_dir_handle';

/**
 * Comprueba si el navegador actual soporta la File System Access API nativa
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Obtiene el nombre de la carpeta vinculada previamente (si existe en memoria/sesión/localStorage)
 */
export function getLinkedFolderName(): string | null {
  if (activeDirectoryHandle) {
    return activeDirectoryHandle.name;
  }
  return localStorage.getItem(FOLDER_NAME_KEY) || null;
}

export function getActiveDirectoryHandle(): FileSystemDirectoryHandle | null {
  return activeDirectoryHandle;
}

/**
 * Restaura automáticamente el handle guardado previamente en IndexedDB sin requerir que el usuario vuelva a navegar por sus carpetas
 */
export async function restorePersistedDirectoryHandle(): Promise<{ handle: FileSystemDirectoryHandle; name: string } | null> {
  if (activeDirectoryHandle) {
    return { handle: activeDirectoryHandle, name: activeDirectoryHandle.name };
  }

  try {
    const savedHandle = await getMetaDB<FileSystemDirectoryHandle>(META_DIR_HANDLE_KEY);
    if (savedHandle && typeof (savedHandle as any).queryPermission === 'function') {
      const permission = await (savedHandle as any).queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        activeDirectoryHandle = savedHandle;
        localStorage.setItem(FOLDER_NAME_KEY, savedHandle.name);
        return { handle: savedHandle, name: savedHandle.name };
      }
    }
  } catch (err) {
    console.warn('No se pudo restaurar el handle persistido de la carpeta:', err);
  }

  return null;
}

/**
 * Solicita al usuario seleccionar una carpeta real de su disco rígido y la guarda permanentemente
 */
export async function pickLocalFolder(): Promise<{ handle: FileSystemDirectoryHandle; name: string } | null> {
  if (!isFileSystemAccessSupported() || !window.showDirectoryPicker) {
    throw new Error('Tu navegador no soporta selección directa de carpetas del sistema. Usa Google Chrome, Edge o navegadores Chromium.');
  }

  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });

    activeDirectoryHandle = dirHandle;
    localStorage.setItem(FOLDER_NAME_KEY, dirHandle.name);
    await setMetaDB(META_DIR_HANDLE_KEY, dirHandle);
    return { handle: dirHandle, name: dirHandle.name };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null; // El usuario canceló la selección
    }
    throw err;
  }
}

/**
 * Desvincula la carpeta activa de la sesión y almacenamiento permanente
 */
export async function unlinkLocalFolder(): Promise<void> {
  activeDirectoryHandle = null;
  localStorage.removeItem(FOLDER_NAME_KEY);
  await setMetaDB(META_DIR_HANDLE_KEY, null);
}

/**
 * Limpia y genera un nombre de archivo seguro
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

/**
 * Guarda un proyecto individual directamente como archivo .json en la carpeta física del disco
 */
export async function saveProjectToDiskFolder(
  dirHandle: FileSystemDirectoryHandle,
  project: SavedCarouselProject
): Promise<string> {
  const clientPrefix = sanitizeFileName(project.clientName || 'general');
  const titlePart = sanitizeFileName(project.title || 'carrusel');
  const fileName = `${clientPrefix}_${titlePart}.carousel.json`;

  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  // @ts-ignore - createWritable is standard on FileSystemFileHandle
  const writable = await fileHandle.createWritable();
  const content = JSON.stringify(project, null, 2);
  await writable.write(content);
  await writable.close();

  return fileName;
}

/**
 * Lee todos los archivos .json y .carousel.json de la carpeta física del disco
 */
export async function readProjectsFromDiskFolder(
  dirHandle: FileSystemDirectoryHandle
): Promise<SavedCarouselProject[]> {
  const projects: SavedCarouselProject[] = [];

  try {
    // @ts-ignore - entries() is standard on FileSystemDirectoryHandle in ES2020+
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && (name.endsWith('.json') || name.endsWith('.carousel'))) {
        try {
          const file = await (handle as FileSystemFileHandle).getFile();
          const text = await file.text();
          const parsed = JSON.parse(text);

          // Verificar si es un proyecto individual válido o un array de proyectos
          if (parsed && parsed.slides && Array.isArray(parsed.slides)) {
            projects.push({
              ...parsed,
              id: parsed.id || `disk-${name.replace(/\.[^/.]+$/, '')}`,
              title: parsed.title || name.replace(/\.[^/.]+$/, ''),
              clientName: parsed.clientName || 'General',
            });
          } else if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              if (p && p.slides && Array.isArray(p.slides)) {
                projects.push(p);
              }
            });
          }
        } catch (fileErr) {
          console.warn(`No se pudo leer el archivo ${name} como proyecto:`, fileErr);
        }
      }
    }
  } catch (err) {
    console.error('Error leyendo la carpeta de disco:', err);
  }

  return projects;
}

/**
 * Descarga directamente un archivo .json del proyecto individual al disco del usuario (Fallback universal)
 */
export function downloadSingleProjectFile(project: SavedCarouselProject): void {
  const clientPrefix = sanitizeFileName(project.clientName || 'general');
  const titlePart = sanitizeFileName(project.title || 'carrusel');
  const fileName = `${clientPrefix}_${titlePart}.carousel.json`;

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
