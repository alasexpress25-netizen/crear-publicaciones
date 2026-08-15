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
  ExternalLink
} from 'lucide-react';
import { Slide, BrandInfo, CarouselPostMeta, AspectRatio, SavedCarouselProject } from '../types';

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

const LOCAL_STORAGE_PROJECTS_KEY = 'lavisualmk_saved_projects_v2';

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
  const [activeProject, setActiveProject] = useState<SavedCarouselProject | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      // Pre-fill title suggestion from slide 1 or brief
      const slide1 = currentSlides[0];
      const defaultTitle = slide1?.title || currentBrief?.slice(0, 40) || `Carrusel ${currentBrand.name || 'Proyecto'}`;
      setNewTitle(defaultTitle.replace(/[^\w\s\sáéíóúÁÉÍÓÚñÑüÜ.,-]/gi, '').slice(0, 50).trim());
    }
  }, [isOpen, currentSlides, currentBrief, currentBrand.name]);

  const loadProjects = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setProjects(parsed);
          if (parsed.length > 0) setActiveProject(parsed[0]);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setProjects([]);
  };

  const handleSaveCurrentProject = () => {
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

    const updated = [newProj, ...projects];
    setProjects(updated);
    setActiveProject(newProj);
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updated));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Deseas eliminar este carrusel guardado?')) {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updated));
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
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          const merged = [...parsed, ...projects];
          // deduplicate by ID
          const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setProjects(unique);
          localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(unique));
          alert(`¡${parsed.length} carruseles importados correctamente!`);
        }
      } catch (err) {
        alert('Archivo JSON no válido.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const filtered = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      (p.brief && p.brief.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Proyectos & Carruseles Guardados
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {projects.length} Guardados
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Guarda tus carruseles completos (diapositivas, fotos, copy del post, hashtags e indicaciones de IA)
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
              <span className="hidden sm:inline">Backup</span>
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
              <span>{saveSuccess ? '¡Guardado con éxito!' : 'Guardar Carrusel Actual'}</span>
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
            <div className="p-3 border-b border-slate-800">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título o cliente..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs px-4">
                  No hay carruseles guardados todavía. Usa el botón superior para guardar el carrusel en el que estás trabajando.
                </div>
              ) : (
                filtered.map((proj) => {
                  const isSelected = activeProject?.id === proj.id;
                  const slide1 = proj.slides[0];

                  return (
                    <div
                      key={proj.id}
                      onClick={() => setActiveProject(proj)}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer group ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {slide1?.image ? (
                          <img
                            src={slide1.image}
                            alt=""
                            className="w-10 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-12 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: proj.brand.primaryColor || '#e11d48' }}
                          >
                            <Layers className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition">
                            {proj.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-rose-400 font-bold truncate max-w-[100px]">
                              {proj.clientName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              • {proj.slides.length} diap.
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {proj.createdAt}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition shrink-0"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Project Preview & Load */}
          <div className="md:col-span-7 flex flex-col overflow-y-auto p-5 sm:p-6 bg-slate-900/90 scrollbar-thin">
            {activeProject ? (
              <div className="space-y-4">
                
                {/* Title & Load Action */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                      Cliente: {activeProject.clientName} ({activeProject.brand.web || activeProject.brand.handle || 'web'})
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5">
                      {activeProject.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Guardado el {activeProject.createdAt}</span>
                      <span>• Formato: {activeProject.aspectRatio || '4:5'}</span>
                    </p>
                  </div>

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
          <span>Tus carruseles se guardan automáticamente y no se borran al cerrar el navegador.</span>
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
