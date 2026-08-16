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
  Users,
  Languages,
  Tag,
  MessageSquare,
  Copy,
  Check,
  Hash,
  ExternalLink
} from 'lucide-react';
import { MarketingDocument, BrandInfo, CarouselPostMeta } from '../types';
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
  language: 'es' | 'pt' | 'en';
  onChangeLanguage: (lang: 'es' | 'pt' | 'en') => void;
  postMeta?: CarouselPostMeta;
  onOpenPostCaption?: () => void;
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
  language,
  onChangeLanguage,
  postMeta,
  onOpenPostCaption,
  onOpenClientSelector,
  onOpenKnowledgeBase,
  onOpenHookLab,
  onApplyGeneratedCarousel,
}) => {
  const [isDictating, setIsDictating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [generationRationale, setGenerationRationale] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const handleCopyFullPost = async () => {
    if (!postMeta?.caption) return;
    const fullText = `${postMeta.caption}\n\n${(postMeta.hashtags || []).map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`.trim();
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedPost(true);
      setTimeout(() => setCopiedPost(false), 2000);
    } catch {
      alert('Texto copiado al portapapeles.');
    }
  };

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
      recognition.lang = language === 'pt' ? 'pt-BR' : language === 'en' ? 'en-US' : 'es-ES';
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

      // Gather technical terms from active client and active documents
      const clientTerms = selectedClient?.technical_terms || [];
      const docTerms = activeDocuments.flatMap((d) => d.technicalTerms || []);
      const combinedTerms = Array.from(new Set([...clientTerms, ...docTerms]));

      const response = await apiGenerateCarousel({
        brief: textToUse,
        slideCount,
        objective,
        hookType,
        targetAudience,
        knowledgeBase: knowledgeContext,
        technicalTerms: combinedTerms,
        brand,
        language,
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
            className="flex items-center gap-1.5 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 px-2.5 py-1 rounded-xl text-xs font-semibold transition"
            title="Ver o agregar documentos de marketing y URLs para entrenar la IA"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Capacitar IA ({activeDocuments.length})</span>
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

          {/* Active Technical Terms Pills if present */}
          {selectedClient?.technical_terms && selectedClient.technical_terms.length > 0 && (
            <div className="pt-2 border-t border-slate-800/70 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" /> Jerga activa:
              </span>
              {selectedClient.technical_terms.slice(0, 5).map((term, i) => (
                <span
                  key={i}
                  className="bg-amber-950/50 border border-amber-800/40 text-amber-200 text-[10px] px-2 py-0.5 rounded-md"
                >
                  {term}
                </span>
              ))}
              {selectedClient.technical_terms.length > 5 && (
                <span className="text-[10px] text-slate-500">
                  +{selectedClient.technical_terms.length - 5} más
                </span>
              )}
            </div>
          )}
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
              type="button"
              onClick={onOpenHookLab}
              className="flex items-center gap-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/50 text-rose-300 hover:text-white px-2.5 py-0.5 rounded-xl text-xs font-semibold transition shadow-sm"
              title="Laboratorio de Ganchos para Slide 1"
            >
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>Lab de Ganchos</span>
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

      {/* Language Selector Selector Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-rose-400" />
            <span>Idioma de Publicación:</span>
          </label>
          <span className="text-[10px] text-slate-500">Textos generados en este idioma</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChangeLanguage('es')}
            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              language === 'es'
                ? 'bg-rose-950/70 border-rose-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-sm">🇪🇸</span>
            <span>Español</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeLanguage('pt')}
            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              language === 'pt'
                ? 'bg-rose-950/70 border-rose-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-sm">🇧🇷</span>
            <span>Português</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeLanguage('en')}
            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              language === 'en'
                ? 'bg-rose-950/70 border-rose-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-sm">🇺🇸</span>
            <span>English</span>
          </button>
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

      {/* Social Media Post & Hashtags Card (Copywriting) */}
      {postMeta && (
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Texto del Post & Hashtags
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyFullPost}
                className="flex items-center gap-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 hover:text-white px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-sm"
                title="Copiar texto y hashtags al portapapeles"
              >
                {copiedPost ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Post</span>
                  </>
                )}
              </button>
              {onOpenPostCaption && (
                <button
                  type="button"
                  onClick={onOpenPostCaption}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition"
                  title="Abrir editor completo del post"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Caption preview snippet */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar">
            {postMeta.caption || 'Genera un carrusel para redactar automáticamente el texto del post.'}
          </div>

          {/* Hashtags display */}
          {postMeta.hashtags && postMeta.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-slate-800/60">
              <Hash className="w-3 h-3 text-rose-400 shrink-0" />
              {postMeta.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold bg-rose-950/40 border border-rose-800/30 text-rose-300 px-2 py-0.5 rounded-lg"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
