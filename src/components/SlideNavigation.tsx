import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  ArrowLeftRight,
  Eye,
  Grid
} from 'lucide-react';
import { Slide } from '../types';

interface SlideNavigationProps {
  slides: Slide[];
  currentIndex: number;
  isGridView: boolean;
  onSelectSlide: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onToggleGridView: () => void;
}

export const SlideNavigation: React.FC<SlideNavigationProps> = ({
  slides,
  currentIndex,
  isGridView,
  onSelectSlide,
  onPrev,
  onNext,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onToggleGridView,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Controls: Prev / Stepper / Next */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={slides.length <= 1}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 transition disabled:opacity-40"
          title="Diapositiva anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span>Diapositiva</span>
          <span className="text-rose-500 font-mono text-sm">{currentIndex + 1}</span>
          <span className="text-slate-500">de</span>
          <span className="font-mono text-sm">{slides.length}</span>
        </div>

        <button
          onClick={onNext}
          disabled={slides.length <= 1}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 transition disabled:opacity-40"
          title="Siguiente diapositiva"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnails strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full md:max-w-md scrollbar-thin">
        {slides.map((s, idx) => (
          <button
            key={s._uid || s.id || idx}
            onClick={() => onSelectSlide(idx)}
            className={`relative shrink-0 w-10 h-12 rounded-lg border overflow-hidden transition ${
              currentIndex === idx
                ? 'border-rose-500 ring-2 ring-rose-500/50 scale-105 shadow-md'
                : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
            }`}
            style={{
              backgroundImage: s.image ? `url("${s.image}")` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#020617',
            }}
          >
            <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
              <span className={`text-[10px] font-black ${currentIndex === idx ? 'text-rose-400' : 'text-white'}`}>
                {idx + 1}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Slide Actions (Add, Duplicate, Delete, View Mode) */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onAddSlide}
          className="flex items-center gap-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition"
          title="Agregar nueva diapositiva en blanco"
        >
          <Plus className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Nueva</span>
        </button>

        <button
          onClick={onDuplicateSlide}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
          title="Duplicar diapositiva actual"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDeleteSlide}
          disabled={slides.length <= 1}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-400 transition disabled:opacity-40"
          title="Eliminar diapositiva actual"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-slate-800 mx-1" />

        <button
          onClick={onToggleGridView}
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition ${
            isGridView
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>{isGridView ? 'Vista Individual' : 'Ver Todo el Carrusel'}</span>
        </button>
      </div>

    </div>
  );
};
