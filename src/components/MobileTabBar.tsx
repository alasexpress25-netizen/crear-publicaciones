import React from 'react';
import {
  Sparkles,
  Layout,
  ImageIcon,
  Grid3X3,
  Download,
  FileText,
  Users
} from 'lucide-react';

export type WorkspaceTab = 'canvas' | 'ai' | 'media' | 'grid';

interface MobileTabBarProps {
  activeTab: WorkspaceTab;
  onChangeTab: (tab: WorkspaceTab) => void;
  onOpenExport: () => void;
  onOpenPostCaption: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onChangeTab,
  onOpenExport,
  onOpenPostCaption,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl safe-bottom">
      
      {/* 1. Canvas / Editor */}
      <button
        onClick={() => onChangeTab('canvas')}
        className={`flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl transition ${
          activeTab === 'canvas'
            ? 'text-rose-500 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'canvas' ? 'bg-rose-950/60 border border-rose-600/40' : ''}`}>
          <Layout className="w-4 h-4" />
        </div>
        <span className="text-[10px]">Lienzo</span>
      </button>

      {/* 2. AI Strategist */}
      <button
        onClick={() => onChangeTab('ai')}
        className={`flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl transition ${
          activeTab === 'ai'
            ? 'text-rose-500 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'ai' ? 'bg-rose-950/60 border border-rose-600/40' : ''}`}>
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-[10px]">Estratega IA</span>
      </button>

      {/* 3. Media & Fondo */}
      <button
        onClick={() => onChangeTab('media')}
        className={`flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl transition ${
          activeTab === 'media'
            ? 'text-rose-500 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'media' ? 'bg-rose-950/60 border border-rose-600/40' : ''}`}>
          <ImageIcon className="w-4 h-4" />
        </div>
        <span className="text-[10px]">Fondos/Música</span>
      </button>

      {/* 4. Grid Overview */}
      <button
        onClick={() => onChangeTab('grid')}
        className={`flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl transition ${
          activeTab === 'grid'
            ? 'text-rose-500 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'grid' ? 'bg-rose-950/60 border border-rose-600/40' : ''}`}>
          <Grid3X3 className="w-4 h-4" />
        </div>
        <span className="text-[10px]">Grilla</span>
      </button>

      {/* 5. Post Caption Quick Button */}
      <button
        onClick={onOpenPostCaption}
        className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-slate-400 hover:text-indigo-300 transition"
      >
        <div className="p-1 rounded-lg">
          <FileText className="w-4 h-4 text-indigo-400" />
        </div>
        <span className="text-[10px]">Copy</span>
      </button>

      {/* 6. Export Quick Button */}
      <button
        onClick={onOpenExport}
        className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-slate-400 hover:text-rose-300 transition"
      >
        <div className="p-1 rounded-lg bg-gradient-to-tr from-rose-600 to-pink-600 text-white shadow-md">
          <Download className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold text-rose-400">Exportar</span>
      </button>

    </div>
  );
};
