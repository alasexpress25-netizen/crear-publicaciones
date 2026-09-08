import React from 'react';
import {
  Sparkles,
  Layout,
  ImageIcon,
  Grid3X3,
  Download,
  FolderArchive,
  Film,
} from 'lucide-react';

export type WorkspaceTab = 'canvas' | 'video' | 'ai' | 'media' | 'grid';

interface MobileTabBarProps {
  activeTab: WorkspaceTab;
  onChangeTab: (tab: WorkspaceTab) => void;
  onOpenExport: () => void;
  onOpenProjects: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onChangeTab,
  onOpenExport,
  onOpenProjects,
}) => {
  return (
    <div
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-3 py-2 flex items-center justify-center shadow-2xl safe-bottom"
    >
      <div className="w-full max-w-3xl flex items-center justify-around sm:justify-center sm:gap-3 md:gap-5">
        
        {/* 1. Canvas / Editor */}
        <button
          id="nav-btn-canvas"
          onClick={() => onChangeTab('canvas')}
          className={`flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition ${
            activeTab === 'canvas'
              ? 'text-rose-500 font-bold bg-rose-950/40 border border-rose-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'canvas' ? 'bg-rose-950/80 border border-rose-600/50 text-rose-400' : ''}`}>
            <Layout className="w-4 h-4" />
          </div>
          <span style={{ fontSize: '8px' }} className="font-semibold tracking-wide uppercase">Lienzo</span>
        </button>

        {/* 2. Video Studio / Editar Video */}
        <button
          id="nav-btn-video"
          onClick={() => onChangeTab('video')}
          className={`flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition relative group ${
            activeTab === 'video'
              ? 'text-rose-400 font-bold bg-rose-950/50 border border-rose-500/40 shadow-lg shadow-rose-950/50'
              : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900/50'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'video' ? 'bg-rose-600 text-white shadow-sm shadow-rose-950' : 'group-hover:text-rose-400'}`}>
            <Film className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-0.5">
            <span style={{ fontSize: '8px' }} className="font-semibold tracking-wide uppercase">Editar Video</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse hidden sm:inline-block" />
          </div>
        </button>

        {/* 3. AI Strategist */}
        <button
          id="nav-btn-ai"
          onClick={() => onChangeTab('ai')}
          className={`flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition ${
            activeTab === 'ai'
              ? 'text-rose-500 font-bold bg-rose-950/40 border border-rose-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'ai' ? 'bg-rose-950/80 border border-rose-600/50 text-rose-400' : ''}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <span style={{ fontSize: '8px' }} className="font-semibold tracking-wide uppercase">Estratega IA</span>
        </button>

        {/* 4. Media & Fondo */}
        <button
          id="nav-btn-media"
          onClick={() => onChangeTab('media')}
          className={`flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition ${
            activeTab === 'media'
              ? 'text-rose-500 font-bold bg-rose-950/40 border border-rose-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'media' ? 'bg-rose-950/80 border border-rose-600/50 text-rose-400' : ''}`}>
            <ImageIcon className="w-4 h-4" />
          </div>
          <span style={{ fontSize: '8px' }} className="font-semibold tracking-wide uppercase">Fondos</span>
        </button>

        {/* 5. Grid Overview */}
        <button
          id="nav-btn-grid"
          onClick={() => onChangeTab('grid')}
          className={`flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition ${
            activeTab === 'grid'
              ? 'text-rose-500 font-bold bg-rose-950/40 border border-rose-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'grid' ? 'bg-rose-950/80 border border-rose-600/50 text-rose-400' : ''}`}>
            <Grid3X3 className="w-4 h-4" />
          </div>
          <span style={{ fontSize: '8px' }} className="font-semibold tracking-wide uppercase">Grilla</span>
        </button>

        {/* 5. Projects Button */}
        <button
          id="nav-btn-projects"
          onClick={onOpenProjects}
          className="flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-1.5 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-900/50 transition group"
          title="Mis Carruseles Guardados / Cargar o Guardar Proyecto"
        >
          <div className="p-1 rounded-lg group-hover:scale-110 transition-transform">
            <FolderArchive className="w-4 h-4 text-indigo-400" />
          </div>
          <span style={{ fontSize: '8px' }} className="font-semibold tracking-wide uppercase">Proyectos</span>
        </button>

        {/* 6. Export Quick Button */}
        <button
          id="nav-btn-export"
          onClick={onOpenExport}
          className="flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900/50 transition group"
          title="Exportar diapositivas"
        >
          <div className="p-1 rounded-lg bg-gradient-to-tr from-rose-600 to-pink-600 text-white shadow-md group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <span style={{ fontSize: '8px' }} className="font-bold text-rose-400 uppercase tracking-wide">Exportar</span>
        </button>

      </div>
    </div>
  );
};
