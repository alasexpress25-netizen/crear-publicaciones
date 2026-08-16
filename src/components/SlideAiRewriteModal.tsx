import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Scissors,
  Flame,
  HelpCircle,
  Hash,
  BookOpen,
  ListOrdered,
  Layers,
  Check,
  X,
  Loader2,
  ArrowRight,
  RotateCcw,
  Tag
} from 'lucide-react';
import { Slide, BrandInfo } from '../types';
import { apiRewriteSlide } from '../services/api';

interface SlideAiRewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  brand: BrandInfo;
  brief: string;
  targetAudience: string;
  technicalTerms?: string[];
  language?: 'es' | 'pt' | 'en';
  onApplyRewrittenSlide: (updatedSlideData: Partial<Slide>) => void;
}

const REWRITE_PRESETS = [
  {
    id: 'make_shorter',
    label: 'Más Corto y Directo',
    icon: Scissors,
    desc: 'Reduce palabras, aumenta la pegada y lectura rápida.',
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40',
  },
  {
    id: 'more_provocative',
    label: 'Más Provocador / Polémico',
    icon: Flame,
    desc: 'Quiebre de creencias, gancho magnético y alto impacto.',
    color: 'text-rose-400 border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40',
  },
  {
    id: 'add_technical_data',
    label: 'Añadir Jerga y Datos Técnicos',
    icon: Hash,
    desc: 'Inyecta términos del nicho y métricas de autoridad.',
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40',
  },
  {
    id: 'reflexive_question',
    label: 'Pregunta Reflexiva',
    icon: HelpCircle,
    desc: 'Convierte el titular en una pregunta que interpele al lector.',
    color: 'text-sky-400 border-sky-500/40 bg-sky-950/20 hover:bg-sky-950/40',
  },
  {
    id: 'storytelling',
    label: 'Micro-Storytelling / Empático',
    icon: BookOpen,
    desc: 'Estructura humana basada en situación real y conflicto.',
    color: 'text-purple-400 border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/40',
  },
  {
    id: 'actionable_steps',
    label: 'Pasos Accionables (1, 2, 3)',
    icon: ListOrdered,
    desc: 'Organiza el mensaje en viñetas directas de ejecución rápida.',
    color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-950/40',
  },
];

export const SlideAiRewriteModal: React.FC<SlideAiRewriteModalProps> = ({
  isOpen,
  onClose,
  slide,
  slideIndex,
  totalSlides,
  brand,
  brief,
  targetAudience,
  technicalTerms = [],
  language = 'es',
  onApplyRewrittenSlide,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('make_shorter');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<Partial<Slide> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (presetId: string = selectedPreset) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const res = await apiRewriteSlide({
        slide,
        instruction: presetId,
        customPrompt: presetId === 'custom' ? customPrompt : undefined,
        brief,
        targetAudience,
        technicalTerms,
        language,
      });

      if (res) {
        setPreviewResult(res);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error al re-escribir la diapositiva con IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (previewResult) {
      onApplyRewrittenSlide(previewResult);
      onClose();
      setPreviewResult(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Re-escribir Diapositiva con IA
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60">
                  Slide {slideIndex + 1} de {totalSlides}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mejora el gancho, síntesis o autoridad de esta diapositiva específica sin alterar el resto del carrusel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin">
          
          {/* Slide Current Content Summary */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="uppercase tracking-wider">Texto Actual de la Diapositiva #{slideIndex + 1}:</span>
              {slide.badge && <span className="text-rose-400">{slide.badge}</span>}
            </div>
            <h4 className="text-sm font-bold text-white line-clamp-2">
              {slide.title || 'Sin título'}
            </h4>
            {slide.body && (
              <p className="text-xs text-slate-300 line-clamp-2">
                {slide.body}
              </p>
            )}
            {slide.bullets && slide.bullets.length > 0 && (
              <p className="text-[11px] text-slate-400">
                • {slide.bullets.length} viñetas / puntos clave
              </p>
            )}
          </div>

          {/* Preset Buttons Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
              <span>Elige el estilo de re-escritura:</span>
              <span className="text-[10px] text-slate-400 font-normal">Pulsa para generar con 1 clic</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {REWRITE_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      handleGenerate(preset.id);
                    }}
                    disabled={isGenerating}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 group ${
                      isSelected
                        ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500/40 shadow-md'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border ${preset.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-rose-300 transition">
                        {preset.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {preset.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Instruction Input */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>O escribe tu propia instrucción personalizada:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPrompt.trim()) {
                    setSelectedPreset('custom');
                    handleGenerate('custom');
                  }
                }}
                placeholder="Ej: Haz que mencione el dolor de no tener tiempo y añade una analogía con un Ferrari..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={() => {
                  setSelectedPreset('custom');
                  handleGenerate('custom');
                }}
                disabled={isGenerating || !customPrompt.trim()}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generar</span>
              </button>
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Loading state */}
          {isGenerating && (
            <div className="p-8 bg-slate-950/80 rounded-2xl border border-rose-900/40 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-xs font-bold text-white">
                Re-escribiendo diapositiva #{slideIndex + 1} con IA estratégica...
              </p>
              <p className="text-[11px] text-slate-400">
                Aplicando enfoque: {REWRITE_PRESETS.find(p => p.id === selectedPreset)?.label || 'Personalizado'}
              </p>
            </div>
          )}

          {/* Result Preview */}
          {previewResult && !isGenerating && (
            <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/30 rounded-2xl border border-rose-500/60 shadow-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Propuesta Generada por la IA:
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  Listo para aplicar
                </span>
              </div>

              <div className="space-y-2">
                {previewResult.badge && (
                  <span className="inline-block bg-rose-600/30 text-rose-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-rose-500/40">
                    {previewResult.badge}
                  </span>
                )}
                {previewResult.subtag && (
                  <p className="text-xs font-bold text-rose-400">
                    {previewResult.subtag}
                  </p>
                )}
                <h4 className="text-sm font-black text-white leading-tight">
                  {previewResult.title}
                </h4>
                {previewResult.body && (
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {previewResult.body}
                  </p>
                )}
                {previewResult.bullets && previewResult.bullets.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {previewResult.bullets.map((b: string, i: number) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
                {previewResult.cta && (
                  <p className="text-[11px] text-slate-400 italic pt-1">
                    {previewResult.cta}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Cancelar
          </button>

          {previewResult ? (
            <button
              onClick={handleApply}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-950/50 transition transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar a la Diapositiva #{slideIndex + 1}</span>
            </button>
          ) : (
            <button
              onClick={() => handleGenerate(selectedPreset)}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-950/50 transition"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generar Re-escritura</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
