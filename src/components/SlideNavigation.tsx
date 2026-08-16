import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Grid,
  Wand2,
  Layers,
  LayoutGrid,
  Columns2,
  Quote,
  Hash,
  ListOrdered,
  Send
} from 'lucide-react';
import { Slide, SlideLayoutTemplate } from '../types';
import { getTemplateLocalization } from '../data/templateLocalizations';

interface SlideNavigationProps {
  slides: Slide[];
  currentIndex: number;
  isGridView: boolean;
  language?: 'es' | 'pt' | 'en';
  onSelectSlide: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onToggleGridView: () => void;
  onOpenAiRewriteSlide?: () => void;
  onUpdateSlideLayout?: (layout: SlideLayoutTemplate) => void;
}

export const SlideNavigation: React.FC<SlideNavigationProps> = ({
  slides,
  currentIndex,
  isGridView,
  language = 'es',
  onSelectSlide,
  onPrev,
  onNext,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onToggleGridView,
  onOpenAiRewriteSlide,
  onUpdateSlideLayout,
}) => {
  const currentSlide = slides[currentIndex] || slides[0];
  const currentLayout = currentSlide?.layoutTemplate || 'standard';
  const loc = getTemplateLocalization(language);

  const layoutTemplates: { id: SlideLayoutTemplate; label: string; icon: any; desc: string }[] = [
    { id: 'standard', label: loc.uiLabels.standard, icon: LayoutGrid, desc: 'Título, cuerpo y viñetas' },
    { id: 'split_comparison', label: loc.uiLabels.split_comparison, icon: Columns2, desc: 'Antes vs Después / Bien vs Mal' },
    { id: 'quote', label: loc.uiLabels.quote, icon: Quote, desc: 'Frase de autoridad con autor' },
    { id: 'big_number', label: loc.uiLabels.big_number, icon: Hash, desc: 'Métrica o estadística de impacto' },
    { id: 'checklist', label: loc.uiLabels.checklist, icon: ListOrdered, desc: 'Pasos secuenciales 1, 2, 3...' },
    { id: 'cta_final', label: loc.uiLabels.cta_final, icon: Send, desc: 'Slide final con llamados a la acción' },
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-xl space-y-3">
      
      {/* LÍNEA 1: NAVEGACIÓN DE DIAPOSITIVAS + MINIATURAS + ACCIONES RÁPIDAS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3.5">
        
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

        {/* Slide Actions (AI Rewrite, Add, Duplicate, Delete, View Mode) */}
        <div className="flex items-center gap-1.5">
          {onOpenAiRewriteSlide && (
            <button
              onClick={onOpenAiRewriteSlide}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600/90 to-amber-600/90 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-sm transition transform active:scale-95"
              title="Re-escribir y optimizar esta diapositiva con IA"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Mejorar con IA</span>
            </button>
          )}

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
            <span>{isGridView ? 'Vista Individual' : 'Ver Todo'}</span>
          </button>
        </div>

      </div>

      {/* LÍNEA 2: SELECTOR DE PLANTILLA / FORMATO DE LA DIAPOSITIVA */}
      {onUpdateSlideLayout && (
        <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5 max-w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              <span>{loc.uiLabels.template}</span>
            </span>

            {layoutTemplates.map((tmpl) => {
              const Icon = tmpl.icon;
              const isActive = currentLayout === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => onUpdateSlideLayout(tmpl.id)}
                  title={tmpl.desc}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap shadow-sm ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-rose-900/30'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tmpl.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono shrink-0">
            <span>{loc.uiLabels.design}</span>
            <strong className="text-slate-300 uppercase">
              {layoutTemplates.find((t) => t.id === currentLayout)?.label || currentLayout}
            </strong>
          </div>

        </div>
      )}

    </div>
  );
};
