import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  BookOpen,
  Target,
  Layers,
  Palette,
  RefreshCw,
  Zap,
  HelpCircle,
  Flame,
  Users
} from 'lucide-react';
import { MarketingDocument, BrandInfo } from '../types';
import { AgencyClient } from '../services/supabase';
import { apiGenerateCarousel } from '../services/api';

interface AiPanelProps {
  brief: string;
  onChangeBrief: (val: string) => void;
  targetAudience: string;
  onChangeTargetAudience: (val: string) => void;
  visualStyle: string;
  onChangeVisualStyle: (val: string) => void;
  slideCount: number;
  onChangeSlideCount: (val: number) => void;
  objective: string;
  onChangeObjective: (val: string) => void;
  hookType: string;
  onChangeHookType: (val: string) => void;
  brand: BrandInfo;
  activeDocuments: MarketingDocument[];
  selectedClient?: AgencyClient | null;
  onOpenClientSelector?: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenHookLab: () => void;
  onApplyGeneratedCarousel: (slides: any[], postMeta?: any, rationale?: string) => void;
}

const OBJECTIVES = [
  { id: 'ventas', label: '💰 Vender / Conseguir Clientes', desc: 'Enfoque directo en oferta, dolor y llamado a comprar o agendar' },
  { id: 'interaccion', label: '💬 Más Comentarios / Debate', desc: 'Preguntas y comparaciones fáciles de responder en comentarios' },
  { id: 'guardados', label: '📌 Más Guardados / Tips Útiles', desc: 'Listas, pasos y checklists de referencia de alto valor' },
  { id: 'alcance', label: '🚀 Más Alcance / Compartidos', desc: 'Ganchos de quiebre de creencias y contrastes de impacto' },
  { id: 'marca', label: '👑 Autoridad / Marca Personal', desc: 'Posicionamiento como el experto o líder del sector' },
];

const HOOK_STRATEGIES = [
  { id: 'pregunta_reflexiva', label: '🎯 Pregunta Reflexiva / Dedo en la Llaga', desc: 'Toca una frustración que no deja dormir al cliente' },
  { id: 'error_costoso', label: '⚠️ Errores Costosos & Trampas', desc: 'Alerta sobre algo que están haciendo mal hoy' },
  { id: 'quiebre_creencia', label: '⚡ Quiebre de Creencias (Contrarian)', desc: 'Desafía lo que todo el mundo asume como verdad' },
  { id: 'contraste_antes_despues', label: '🔄 Contraste Antes vs Después', desc: 'Muestra el abismo entre quienes triunfan y quienes no' },
  { id: 'analogia', label: '♟️ Analogía Memorable', desc: 'Compara el problema con una situación cotidiana' },
];

export const AiPanel: React.FC<AiPanelProps> = ({
  brief,
  onChangeBrief,
  targetAudience,
  onChangeTargetAudience,
  visualStyle,
  onChangeVisualStyle,
  slideCount,
  onChangeSlideCount,
  objective,
  onChangeObjective,
  hookType,
  onChangeHookType,
  brand,
  activeDocuments,
  selectedClient,
  onOpenClientSelector,
  onOpenKnowledgeBase,
  onOpenHookLab,
  onApplyGeneratedCarousel,
}) => {
  const [isDictating, setIsDictating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationRationale, setGenerationRationale] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Voice dictation handling using SpeechRecognition API
  const handleToggleDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado por voz. Recomendamos usar Google Chrome o Microsoft Edge.');
      return;
    }

    if (isDictating && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictating(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => setIsDictating(true);
      recognition.onend = () => {
        setIsDictating(false);
        recognitionRef.current = null;
      };
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsDictating(false);
        recognitionRef.current = null;
      };

      const baseText = brief;
      recognition.onresult = (event: any) => {
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          finalChunk += event.results[i][0].transcript;
        }
        if (finalChunk.trim()) {
          onChangeBrief(baseText ? `${baseText} ${finalChunk}`.trim() : finalChunk.trim());
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Error launching speech recognition:', err);
      setIsDictating(false);
      recognitionRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleGenerate = async (customBrief?: string) => {
    const textToUse = customBrief || brief;
    if (!textToUse.trim()) {
      setError('Por favor describe primero el negocio, servicio o promoción a comunicar.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const knowledgeContext = activeDocuments
        .map((d) => `Documento [${d.name}]: ${d.summary || d.content.slice(0, 1500)}`)
        .join('\n\n');

      const response = await apiGenerateCarousel({
        brief: textToUse,
        slideCount,
        objective,
        hookType,
        targetAudience,
        knowledgeBase: knowledgeContext,
        brand,
      });

      if (response.slides && response.slides.length > 0) {
        onApplyGeneratedCarousel(response.slides, response.post, response.hookRationale || response.strategySummary);
        setGenerationRationale(response.hookRationale || response.strategySummary || 'Carrusel generado con éxito');
      }
    } catch (err: any) {
      setError(err.message || 'Error al generar el carrusel con IA');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
      
      {/* Panel Header & Client Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Estratega de Carruseles con IA
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Crea ganchos psicológicos que detienen el scroll
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenClientSelector && (
            <button
              onClick={onOpenClientSelector}
              className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-xs font-semibold transition"
              title="Cambiar cliente de Supabase"
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Clientes</span>
            </button>
          )}

          <button
            onClick={onOpenKnowledgeBase}
            className="flex items-center gap-1 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 px-2.5 py-1 rounded-xl text-xs font-semibold transition"
            title="Ver o agregar documentos de marketing y URLs para entrenar la IA"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Docs ({activeDocuments.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Suggested Topics from Client if available */}
      {selectedClient?.topics && selectedClient.topics.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>Ganchos Sugeridos para {selectedClient.name}:</span>
            </span>
            <span className="text-[10px] text-slate-500">Haz clic para generar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedClient.topics.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  onChangeBrief(t);
                  handleGenerate(t);
                }}
                className="text-left text-[11px] bg-slate-900 hover:bg-rose-950/50 hover:border-rose-600/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 hover:text-white transition flex items-center gap-1.5 group"
              >
                <span className="text-amber-500 font-bold text-[10px]">#{i + 1}</span>
                <span className="truncate max-w-[280px]">{t}</span>
                <Zap className="w-3 h-3 text-rose-500 opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brief Input with Voice Dictation */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span>Tema, Servicio u Oferta a Comunicar:</span>
          </label>
          <button
            onClick={handleToggleDictation}
            className={`flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg font-semibold transition ${
              isDictating
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isDictating ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-rose-400" />}
            <span>{isDictating ? 'Detener dictado' : 'Dictar por voz'}</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={brief}
          onChange={(e) => onChangeBrief(e.target.value)}
          placeholder="Ej: Agencia de marketing para pymes. El cliente promedio pierde dinero porque publica sin oferta clara o paga publicidad sin embudo..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed resize-none"
        />
      </div>

      {/* Target Audience */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-rose-400" />
          <span>Audiencia Objetivo / Cliente Ideal:</span>
        </label>
        <input
          type="text"
          value={targetAudience}
          onChange={(e) => onChangeTargetAudience(e.target.value)}
          placeholder="Ej: Dueños de negocios y profesionales que quieren más clientes sin perder tiempo"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
        />
      </div>

      {/* Strategy & Hook Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
        
        {/* Objective */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300">Objetivo del Carrusel:</label>
          <select
            value={objective}
            onChange={(e) => onChangeObjective(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            {OBJECTIVES.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hook Type on Slide 1 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">Gancho Slide 1:</label>
            <button
              onClick={onOpenHookLab}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
            >
              Lab Ganchos
            </button>
          </div>
          <select
            value={hookType}
            onChange={(e) => onChangeHookType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-300 font-semibold focus:outline-none focus:border-rose-500"
          >
            {HOOK_STRATEGIES.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Slide Count & Visual Style */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>N° Diapositivas:</span>
          </label>
          <select
            value={slideCount}
            onChange={(e) => onChangeSlideCount(parseInt(e.target.value, 10))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value={3}>3 Diapositivas (Express)</option>
            <option value={4}>4 Diapositivas (Estándar)</option>
            <option value={5}>5 Diapositivas (Profundo)</option>
            <option value={6}>6 Diapositivas (Guía Completa)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <span>Estilo Visual:</span>
          </label>
          <select
            value={visualStyle}
            onChange={(e) => onChangeVisualStyle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="La Visual MK (Bordó/Rose & Obsidian)">La Visual MK (Bordó & Obsidian)</option>
            <option value="Luxury Gold & Dark (Elegante)">Luxury Gold & Dark (Elegante)</option>
            <option value="Cyber Cobalt & Slate (Tech)">Cyber Cobalt & Slate (Tech)</option>
            <option value="Electric Emerald & Forest (Crecimiento)">Electric Emerald (Crecimiento)</option>
            <option value="Minimalist Monochrome (Limpio)">Minimalist Monochrome (Limpio)</option>
          </select>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        onClick={() => handleGenerate()}
        disabled={isGenerating}
        className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-rose-950/60 transition transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Creando Estrategia & Ganchos Persuasivos...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generar Carrusel Estratégico Completo</span>
          </>
        )}
      </button>

      {/* Generation Rationale Box */}
      {generationRationale && (
        <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-1 text-xs">
          <span className="font-bold text-rose-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Justificación Estratégica:</span>
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {generationRationale}
          </p>
        </div>
      )}

    </div>
  );
};
