import React, { useState } from 'react';
import { Sparkles, Check, RefreshCw, X, Lightbulb, Target, AlertTriangle, Zap, Split, Award } from 'lucide-react';
import { HookVariation, Slide, MarketingDocument } from '../types';
import { HOOK_CATEGORY_TEMPLATES } from '../data/marketingPlaybooks';
import { apiGenerateHooks } from '../services/api';

interface HookOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlide1: Slide;
  brief: string;
  targetAudience: string;
  activeDocuments: MarketingDocument[];
  onApplyHook: (hook: Partial<Slide>) => void;
}

export const HookOptimizerModal: React.FC<HookOptimizerModalProps> = ({
  isOpen,
  onClose,
  currentSlide1,
  brief,
  targetAudience,
  activeDocuments,
  onApplyHook,
}) => {
  const [generatedHooks, setGeneratedHooks] = useState<HookVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleGenerateHooks = async () => {
    if (!brief.trim()) {
      setError('Por favor escribe primero una breve descripción del negocio o promoción en el panel de IA.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const knowledgeContext = activeDocuments
        .map((d) => `Documento [${d.name}]: ${d.summary || d.content.slice(0, 1000)}`)
        .join('\n\n');

      const hooks = await apiGenerateHooks({
        brief,
        targetAudience,
        knowledgeBase: knowledgeContext,
      });

      setGeneratedHooks(hooks);
    } catch (err: any) {
      setError(err.message || 'Error al generar ganchos psicológicos');
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'pregunta_reflexiva':
        return <Target className="w-4 h-4 text-rose-400" />;
      case 'error_costoso':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'quiebre_creencia':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'contraste_antes_despues':
        return <Split className="w-4 h-4 text-purple-400" />;
      default:
        return <Award className="w-4 h-4 text-emerald-400" />;
    }
  };

  const applySelected = (hook: HookVariation) => {
    onApplyHook({
      badge: hook.badge || 'ATENCIÓN',
      subtag: hook.subtag || '',
      title: hook.title,
      body: hook.body || '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Laboratorio de Ganchos que Frenan el Scroll (Diapositiva 1)
              </h3>
              <p className="text-xs text-slate-400">
                Preguntas de reflexión, errores costosos y quiebres de creencias para maximizar la retención
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Current Slide 1 Hook Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Gancho actual de la Diapositiva 1:
              </span>
              <h4 className="text-sm md:text-base font-black text-rose-300 mt-0.5">
                {currentSlide1.title || 'Sin título aún'}
              </h4>
              {currentSlide1.body && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{currentSlide1.body}</p>
              )}
            </div>
            <button
              onClick={handleGenerateHooks}
              disabled={isLoading}
              className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ideando ganchos con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar 6 Ganchos Estratégicos</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Generated Hooks Grid */}
          {generatedHooks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Ganchos Psicológicos Generados con IA:
                </span>
                <span className="text-[11px] text-slate-500">
                  Haz clic en "Aplicar a Diapositiva 1" en el que más te guste
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedHooks.map((hook, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-950/80 border rounded-xl p-4 flex flex-col justify-between transition hover:border-slate-700 ${
                      selectedHookIndex === idx ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded-md">
                          {getIconForType(hook.type)}
                          {hook.categoryName}
                        </span>
                        {hook.badge && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-600/30 text-rose-300 px-1.5 py-0.5 rounded">
                            {hook.badge}
                          </span>
                        )}
                      </div>

                      {hook.subtag && (
                        <p className="text-xs font-semibold text-rose-400/90 mb-1">{hook.subtag}</p>
                      )}

                      <h5 className="text-sm font-black text-white leading-snug uppercase mb-2">
                        {hook.title}
                      </h5>

                      {hook.body && (
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">{hook.body}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-900 mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-start gap-1 text-[10px] text-slate-400 max-w-[65%]">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{hook.whyItWorks}</span>
                      </div>
                      <button
                        onClick={() => applySelected(hook)}
                        className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aplicar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Educational Hook Formulas & Examples */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Estructuras y Fórmulas Comprobadas para la Diapositiva 1</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {HOOK_CATEGORY_TEMPLATES.map((cat) => (
                  <div key={cat.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <h5 className="text-xs font-bold text-slate-200">{cat.name}</h5>
                    <p className="text-[11px] text-slate-400">{cat.description}</p>
                    <div className="space-y-1 pt-1">
                      {cat.examples.map((ex, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            onApplyHook({
                              badge: 'REFLEXIÓN',
                              subtag: '¿Te pasa esto?',
                              title: ex,
                              body: 'La mayoría de negocios comete este error sin darse cuenta...',
                            });
                            onClose();
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-rose-950/40 hover:border-rose-700/50 border border-slate-800 rounded-lg text-[10px] text-rose-300 font-semibold cursor-pointer transition flex items-center justify-between group"
                        >
                          <span className="truncate">{ex}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-white text-[9px]">Usar</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>
            💡 <strong>Tip Pro:</strong> Los mejores ganchos no venden el producto en el título, despiertan una duda urgente.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
