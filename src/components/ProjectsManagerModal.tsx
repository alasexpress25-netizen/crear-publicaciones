import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  Check,
  X,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Users,
  HardDrive,
  FolderSync,
  FolderCheck,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { Slide, BrandInfo, CarouselPostMeta, AspectRatio, SavedCarouselProject } from '../types';
import {
  getAllProjectsDB,
  saveProjectDB,
  deleteProjectDB,
  saveAllProjectsDB
} from '../services/storageDb';
import {
  isFileSystemAccessSupported,
  pickLocalFolder,
  unlinkLocalFolder,
  getLinkedFolderName,
  getActiveDirectoryHandle,
  restorePersistedDirectoryHandle,
  saveProjectToDiskFolder,
  readProjectsFromDiskFolder,
  downloadSingleProjectFile
} from '../services/localFolderSync';

interface ProjectsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlides: Slide[];
  currentBrand: BrandInfo;
  currentBrief: string;
  currentTargetAudience: string;
  currentPostMeta: CarouselPostMeta;
  currentAspectRatio: AspectRatio;
  onLoadProject: (project: SavedCarouselProject) => void;
  onNewProject: () => void;
}

export const ProjectsManagerModal: React.FC<ProjectsManagerModalProps> = ({
  isOpen,
  onClose,
  currentSlides,
  currentBrand,
  currentBrief,
  currentTargetAudience,
  currentPostMeta,
  currentAspectRatio,
  onLoadProject,
  onNewProject,
}) => {
  const [projects, setProjects] = useState<SavedCarouselProject[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [activeProject, setActiveProject] = useState<SavedCarouselProject | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveDiskStatus, setSaveDiskStatus] = useState<string | null>(null);
  const [linkedFolderName, setLinkedFolderName] = useState<string | null>(null);
  const [isSyncingFolder, setIsSyncingFolder] = useState(false);
  const [folderNotification, setFolderNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjectsFromStorage();
      setLinkedFolderName(getLinkedFolderName());

      // Intentar restaurar el handle persistido de la carpeta automáticamente
      restorePersistedDirectoryHandle().then((res) => {
        if (res) {
          setLinkedFolderName(res.name);
        }
      });

      // Pre-fill title suggestion from slide 1 or brief
      const slide1 = currentSlides[0];
      const defaultTitle = slide1?.title || currentBrief?.slice(0, 40) || `Carrusel ${currentBrand.name || 'Proyecto'}`;
      setNewTitle(defaultTitle.replace(/[^\w\s\sáéíóúÁÉÍÓÚñÑüÜ.,-]/gi, '').slice(0, 50).trim());
    }
  }, [isOpen, currentSlides, currentBrief, currentBrand.name]);

  const loadProjectsFromStorage = async () => {
    try {
      const stored = await getAllProjectsDB();
      setProjects(stored);
      if (stored.length > 0) {
        setActiveProject((prev) => {
          if (prev && stored.some(p => p.id === prev.id)) return prev;
          return stored[0];
        });
      } else {
        setActiveProject(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLinkFolder = async () => {
    try {
      const res = await pickLocalFolder();
      if (res) {
        setLinkedFolderName(res.name);
        setFolderNotification(`¡Carpeta "${res.name}" vinculada con éxito!`);
        setTimeout(() => setFolderNotification(null), 4000);

        // Scan folder for any existing carousels
        await handleScanFolder(res.handle);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo vincular la carpeta.');
    }
  };

  const handleUnlinkFolder = () => {
    unlinkLocalFolder();
    setLinkedFolderName(null);
    setFolderNotification('Carpeta local desvinculada.');
    setTimeout(() => setFolderNotification(null), 3000);
  };

  const handleScanFolder = async (handleOverride?: FileSystemDirectoryHandle) => {
    const handle = handleOverride || getActiveDirectoryHandle();
    if (!handle) {
      handleLinkFolder();
      return;
    }

    setIsSyncingFolder(true);
    try {
      const diskProjects = await readProjectsFromDiskFolder(handle);
      if (diskProjects.length > 0) {
        const merged = [...diskProjects, ...projects];
        const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        await saveAllProjectsDB(unique);
        setProjects(unique);
        setFolderNotification(`Se sincronizaron ${diskProjects.length} archivo(s) desde tu carpeta local.`);
        setTimeout(() => setFolderNotification(null), 4000);
      } else {
        setFolderNotification('Carpeta vacía o sin archivos de carrusel reconocidos.');
        setTimeout(() => setFolderNotification(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error leyendo los archivos de la carpeta vinculada.');
    } finally {
      setIsSyncingFolder(false);
    }
  };

  const handleSaveCurrentProject = async () => {
    const titleToUse = newTitle.trim() || `Carrusel ${currentBrand.name || 'Sin título'}`;
    const newProj: SavedCarouselProject = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: titleToUse,
      clientName: currentBrand.name || 'General',
      clientId: currentBrand.clientId,
      createdAt: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      updatedAt: new Date().toISOString(),
      slides: currentSlides,
      brand: currentBrand,
      brief: currentBrief,
      targetAudience: currentTargetAudience,
      postMeta: currentPostMeta,
      aspectRatio: currentAspectRatio,
    };

    // 1. Guardar en IndexedDB (Almacenamiento Ilimitado de Disco)
    await saveProjectDB(newProj);
    const updated = [newProj, ...projects.filter(p => p.id !== newProj.id)];
    setProjects(updated);
    setActiveProject(newProj);
    setSaveSuccess(true);

    // 2. Si hay carpeta vinculada, escribir archivo físico en disco
    const dirHandle = getActiveDirectoryHandle();
    if (dirHandle) {
      try {
        const savedFileName = await saveProjectToDiskFolder(dirHandle, newProj);
        setSaveDiskStatus(`Guardado en tu carpeta "${dirHandle.name}": ${savedFileName}`);
        setTimeout(() => setSaveDiskStatus(null), 5000);
      } catch (err) {
        console.warn('No se pudo guardar automáticamente en la carpeta física:', err);
      }
    }

    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDuplicateProject = async (project: SavedCarouselProject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cloned: SavedCarouselProject = {
      ...JSON.parse(JSON.stringify(project)),
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: `${project.title} (Copia)`,
      createdAt: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      updatedAt: new Date().toISOString(),
    };

    await saveProjectDB(cloned);
    const updated = [cloned, ...projects];
    setProjects(updated);
    setActiveProject(cloned);

    // Guardar también en carpeta de disco si está vinculada
    const dirHandle = getActiveDirectoryHandle();
    if (dirHandle) {
      saveProjectToDiskFolder(dirHandle, cloned).catch(console.warn);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Deseas eliminar este carrusel guardado de tu biblioteca?')) {
      await deleteProjectDB(id);
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      if (activeProject?.id === id) {
        setActiveProject(updated[0] || null);
      }
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `carruseles_lavisualmk_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          const merged = [...parsed, ...projects];
          const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          await saveAllProjectsDB(unique);
          setProjects(unique);
          alert(`¡${parsed.length} carruseles importados y guardados en tu disco!`);
        } else if (parsed && parsed.slides) {
          // Es un solo proyecto
          await saveProjectDB(parsed);
          await loadProjectsFromStorage();
          alert('¡Proyecto importado correctamente a tu biblioteca!');
        }
      } catch (err) {
        alert('Archivo JSON no válido.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  // Extract unique client names for filter tags
  const clientNames = Array.from(new Set(projects.map((p) => p.clientName || 'General'))).filter(Boolean);

  const filtered = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      (p.brief && p.brief.toLowerCase().includes(q));

    const matchesClient =
      selectedClientFilter === 'all' || p.clientName === selectedClientFilter;

    return matchesSearch && matchesClient;
  });

  const fsSupported = isFileSystemAccessSupported();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Biblioteca & Almacenamiento en Disco
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  IndexedDB Ilimitado
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {projects.length} Carruseles
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tus carruseles se almacenan en el motor de base de datos de tu disco rígido sin límites de tamaño
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5 border border-slate-800"
              title="Descargar copia de seguridad en JSON de todos tus proyectos"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Backup Total</span>
            </button>
            <label
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5 border border-slate-800 cursor-pointer"
              title="Importar proyectos desde JSON"
            >
              <Upload className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Importar</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real Hard Drive Local Folder Integration Banner */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              {linkedFolderName ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-semibold">
                    Carpeta Física de tu PC vinculada:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/50 flex items-center gap-1">
                    <FolderCheck className="w-3.5 h-3.5" />
                    📁 {linkedFolderName}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300 font-medium">
                    ¿Quieres sincronizar automáticamente con una carpeta en tu disco rígido (C:\, Documentos, etc.)?
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {linkedFolderName ? (
              <>
                <button
                  onClick={() => handleScanFolder()}
                  disabled={isSyncingFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition border border-slate-700"
                  title="Volver a escanear archivos en la carpeta de tu PC"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFolder ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>Sincronizar</span>
                </button>
                <button
                  onClick={handleUnlinkFolder}
                  className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition text-[11px]"
                  title="Desvincular carpeta de la sesión"
                >
                  Desvincular
                </button>
              </>
            ) : (
              <button
                onClick={handleLinkFolder}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold transition shadow-sm border border-indigo-500/30"
                title="Selecciona una carpeta de tu ordenador para guardar archivos .json reales"
              >
                <FolderSync className="w-3.5 h-3.5" />
                <span>Vincular Carpeta de mi PC</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications & Status */}
        {(folderNotification || saveDiskStatus) && (
          <div className="px-6 py-2 bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{folderNotification || saveDiskStatus}</span>
          </div>
        )}

        {/* Quick Save Current Carousel Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <Save className="w-4 h-4 text-rose-400 shrink-0" />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nombre para guardar el carrusel actual..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCurrentProject}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-rose-950/50 transition transform active:scale-95"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? '¡Guardado en Disco!' : 'Guardar Carrusel Actual'}</span>
            </button>

            <button
              onClick={() => {
                if (confirm('¿Deseas vaciar el lienzo y empezar un carrusel nuevo en blanco?')) {
                  onNewProject();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-700 transition"
              title="Limpiar y crear uno nuevo"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo en Blanco</span>
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          
          {/* Left: Project List */}
          <div className="md:col-span-5 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-900/40">
            <div className="p-3 border-b border-slate-800 space-y-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título o cliente..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              {/* Client Filter Tags */}
              {clientNames.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <button
                    onClick={() => setSelectedClientFilter('all')}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
                      selectedClientFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Todos ({projects.length})
                  </button>
                  {clientNames.map((cName) => {
                    const count = projects.filter((p) => (p.clientName || 'General') === cName).length;
                    return (
                      <button
                        key={cName}
                        onClick={() => setSelectedClientFilter(cName)}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
                          selectedClientFilter === cName
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {cName} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {searchQuery ? 'No se encontraron proyectos con ese criterio.' : 'Aún no has guardado ningún carrusel.'}
                </div>
              ) : (
                filtered.map((proj) => {
                  const isSelected = activeProject?.id === proj.id;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => setActiveProject(proj)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-2 group ${
                        isSelected
                          ? 'border-indigo-500/80 bg-indigo-950/30 shadow-md ring-1 ring-indigo-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
                            {proj.clientName || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {proj.createdAt}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                          {proj.title}
                        </h4>

                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            {proj.slides.length} slides
                          </span>
                          <span>•</span>
                          <span>{proj.aspectRatio || '4:5'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadSingleProjectFile(proj);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition"
                          title="Descargar archivo .json individual a tu PC"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicateProject(proj, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/40 transition"
                          title="Duplicar carrusel"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(proj.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          title="Eliminar de la biblioteca"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Project Details & Preview */}
          <div className="md:col-span-7 flex flex-col overflow-hidden bg-slate-900/80 p-5">
            {activeProject ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                
                {/* Active Project Card Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-400">
                        {activeProject.clientName}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">
                        Creado: {activeProject.createdAt}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {activeProject.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Proporción: <span className="text-slate-200 font-mono">{activeProject.aspectRatio}</span> | {activeProject.slides.length} diapositivas
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => downloadSingleProjectFile(activeProject)}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition"
                      title="Descargar archivo individual .carousel.json a tu disco"
                    >
                      <FileDown className="w-4 h-4 text-emerald-400" />
                      <span className="hidden sm:inline">Descargar .JSON</span>
                    </button>
                    <button
                      onClick={() => handleDuplicateProject(activeProject)}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition"
                      title="Crear una copia de este proyecto"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Duplicar</span>
                    </button>
                    <button
                      onClick={() => {
                        onLoadProject(activeProject);
                        onClose();
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-950/50 transition transform active:scale-95 shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Abrir en el Editor</span>
                    </button>
                  </div>
                </div>

                {/* Slides Thumbnail Preview Strip */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-2">
                    Diapositivas ({activeProject.slides.length}):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {activeProject.slides.map((s, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[10px] space-y-1 relative group overflow-hidden"
                      >
                        <span className="text-[9px] font-black text-rose-400 block">
                          #{idx + 1}
                        </span>
                        <p className="font-bold text-white line-clamp-2 leading-tight">
                          {s.title || s.badge || 'Sin título'}
                        </p>
                        {s.body && (
                          <p className="text-slate-400 line-clamp-1 text-[9px]">
                            {s.body}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Post Caption Preview */}
                {activeProject.postMeta?.caption && (
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Pie de Foto / Copywriting del Post:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed max-h-28 overflow-y-auto scrollbar-thin whitespace-pre-line font-sans">
                      {activeProject.postMeta.caption}
                    </p>
                    {activeProject.postMeta.hashtags && activeProject.postMeta.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {activeProject.postMeta.hashtags.map((h, i) => (
                          <span key={i} className="text-[10px] text-rose-400 font-mono">
                            #{h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Brief used */}
                {activeProject.brief && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Brief / Instrucción de IA:
                    </span>
                    <p className="text-slate-300 text-[11px] line-clamp-2">
                      {activeProject.brief}
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                Selecciona un carrusel de la izquierda para ver su contenido.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            Almacenamiento seguro en disco (IndexedDB) + soporte de archivos físicos en tiempo real.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
