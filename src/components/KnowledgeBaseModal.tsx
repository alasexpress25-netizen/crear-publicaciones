import React, { useState } from 'react';
import {
  BookOpen,
  Link,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  RefreshCw,
  X,
  Globe,
  Sparkles,
  Check,
  Zap,
  Tag,
  Flame,
  ArrowRight
} from 'lucide-react';
import { MarketingDocument, MarketingAnalysisResult } from '../types';
import { apiAnalyzeMarketingSource, apiGenerateNicheKnowledge } from '../services/api';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: MarketingDocument[];
  onAddDocument: (doc: MarketingDocument) => void;
  onRemoveDocument: (id: string) => void;
  onApplyAnalysisToBrief?: (analysis: MarketingAnalysisResult) => void;
  language?: 'es' | 'pt' | 'en';
}

const POPULAR_NICHES = [
  'Logística, Transporte & Envíos',
  'Marketing Digital & Performance',
  'Clínica Odontológica & Salud',
  'Bienes Raíces & Inversiones Inmobiliarias',
  'Ecommerce & Tiendas Online',
  'Finanzas, Inversiones & Cripto',
  'Fitness, Nutrición & Coaching',
  'Software B2B & Tecnología / SaaS',
  'Arquitectura, Diseño & Construcción',
  'Abogacía & Servicios Jurídicos',
  'Consultoría de Negocios & RRHH',
  'Estética, Belleza & Cosmetología',
];

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  documents,
  onAddDocument,
  onRemoveDocument,
  onApplyAnalysisToBrief,
  language = 'es',
}) => {
  const [tab, setTab] = useState<'niche' | 'url' | 'text' | 'library'>('niche');
  
  // AI Niche Generator form
  const [nicheInput, setNicheInput] = useState('');
  const [isGeneratingNiche, setIsGeneratingNiche] = useState(false);

  // URL form
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  
  // Text form
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MarketingAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateNicheKnowledge = async (nicheToGenerate?: string) => {
    const targetNiche = nicheToGenerate || nicheInput;
    if (!targetNiche.trim()) {
      setError('Por favor escribe o selecciona una industria o nicho.');
      return;
    }

    setIsGeneratingNiche(true);
    setError(null);
    try {
      const result = await apiGenerateNicheKnowledge({
        niche: targetNiche.trim(),
        language,
      });

      const analysisObj: MarketingAnalysisResult = {
        businessSummary: result.businessSummary,
        targetAudience: result.targetAudience,
        painPoints: result.painPoints,
        commonMistakes: result.commonMistakes,
        uniqueAngles: result.uniqueAngles,
        recommendedHooks: result.recommendedHooks,
        brandTone: result.brandTone,
        technicalTerms: result.technicalTerms,
      };

      setAnalysisResult(analysisObj);

      // Save document to library
      const newDoc: MarketingDocument = {
        id: `doc-niche-${Date.now()}`,
        name: result.title || `Guía & Glosario: ${targetNiche.trim()}`,
        type: 'niche_generator',
        content: JSON.stringify(result, null, 2),
        addedAt: new Date().toISOString().slice(0, 10),
        summary: result.businessSummary,
        extractedAngles: result.uniqueAngles,
        extractedPains: result.painPoints,
        technicalTerms: result.technicalTerms,
      };

      onAddDocument(newDoc);
    } catch (err: any) {
      setError(err.message || 'Error al generar conocimiento técnico del nicho');
    } finally {
      setIsGeneratingNiche(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!urlInput.trim()) {
      setError('Por favor ingresa una URL válida de marketing o sitio web.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await apiAnalyzeMarketingSource({
        url: urlInput.trim(),
        documentName: urlName || urlInput.trim(),
      });

      setAnalysisResult(result);

      // Save document to library
      const newDoc: MarketingDocument = {
        id: `doc-${Date.now()}`,
        name: urlName.trim() || `Web: ${urlInput.replace(/^https?:\/\//, '')}`,
        type: 'url',
        url: urlInput.trim(),
        content: JSON.stringify(result, null, 2),
        addedAt: new Date().toISOString().slice(0, 10),
        summary: result.businessSummary,
        extractedAngles: result.uniqueAngles,
        extractedPains: result.painPoints,
        technicalTerms: result.technicalTerms,
      };

      onAddDocument(newDoc);
    } catch (err: any) {
      setError(err.message || 'Error al analizar la URL con IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTextDocument = async () => {
    if (!textContent.trim() || !textTitle.trim()) {
      setError('Por favor completa el título y el contenido del documento.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await apiAnalyzeMarketingSource({
        rawText: textContent.trim(),
        documentName: textTitle.trim(),
      });

      setAnalysisResult(result);

      const newDoc: MarketingDocument = {
        id: `doc-${Date.now()}`,
        name: textTitle.trim(),
        type: 'notes',
        content: textContent.trim(),
        addedAt: new Date().toISOString().slice(0, 10),
        summary: result.businessSummary,
        extractedAngles: result.uniqueAngles,
        extractedPains: result.painPoints,
        technicalTerms: result.technicalTerms,
      };

      onAddDocument(newDoc);
      setTextTitle('');
      setTextContent('');
    } catch (err: any) {
      setError(err.message || 'Error al procesar el documento');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Capacitación de IA & Glosario Técnico
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Jerga Especializada
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Entrena a la IA con términos técnicos, ganchos y dolores de cada industria para sonar como un profesional senior
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-900/40 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setTab('niche')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
              tab === 'niche'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Generador de Nicho con IA (1 Clic)</span>
          </button>
          <button
            onClick={() => setTab('url')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
              tab === 'url'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Escanear Web / Landing Page</span>
          </button>
          <button
            onClick={() => setTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
              tab === 'text'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pegar Documento / Guía</span>
          </button>
          <button
            onClick={() => setTab('library')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
              tab === 'library'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Glosarios & Fuentes Activas ({documents.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* TAB 0: 1-CLICK AI NICHE GENERATOR */}
          {tab === 'niche' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-indigo-900/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Generador Automático de Glosario y Estrategia por Nicho
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      La IA creará la jerga técnica, métricas clave, objeciones y ganchos ideales para cualquier industria en segundos.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-slate-300 font-semibold block">
                    Escribe el rubro o trabajo de tu cliente:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Logística y distribución internacional, Clínica estética, Agencia de branding, Consultoría financiera..."
                      value={nicheInput}
                      onChange={(e) => setNicheInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGenerateNicheKnowledge();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleGenerateNicheKnowledge()}
                      disabled={isGeneratingNiche}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition disabled:opacity-50 shrink-0"
                    >
                      {isGeneratingNiche ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Generando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generar con IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Nicho Buttons */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    O selecciona un nicho pre-configurado:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_NICHES.map((n, i) => (
                      <button
                        key={i}
                        disabled={isGeneratingNiche}
                        onClick={() => {
                          setNicheInput(n);
                          handleGenerateNicheKnowledge(n);
                        }}
                        className="text-[11px] bg-slate-900/90 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-600/50 text-slate-300 hover:text-indigo-200 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
                      >
                        <span>{n}</span>
                        <ArrowRight className="w-3 h-3 text-indigo-400 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analysis & Vocabulary Result Card */}
              {analysisResult && (
                <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-indigo-800/40 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Conocimiento & Glosario Generado con Éxito
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Guardado en tu base activa. La IA ya puede usarlo para redactar carruseles.
                        </span>
                      </div>
                    </div>
                    {onApplyAnalysisToBrief && (
                      <button
                        onClick={() => {
                          onApplyAnalysisToBrief(analysisResult);
                          onClose();
                        }}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aplicar al Brief</span>
                      </button>
                    )}
                  </div>

                  {/* Technical Terms Tags */}
                  {analysisResult.technicalTerms && analysisResult.technicalTerms.length > 0 && (
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-900/50 space-y-2">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        Vocabulario Técnico & Jerga Clave Extraída:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.technicalTerms.map((term, i) => (
                          <span
                            key={i}
                            className="bg-indigo-950/70 border border-indigo-600/40 text-indigo-200 text-xs px-2.5 py-1 rounded-lg font-medium"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1.5">
                        Frustraciones & Dolores del Cliente:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {analysisResult.painPoints.map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                        Ganchos Recomendados para Slide 1:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {analysisResult.recommendedHooks.map((h, i) => (
                          <li key={i}>• {h}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: ANALYZE URL */}
          {tab === 'url' && (
            <div className="space-y-5">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Ingresa la URL del cliente o de un referente de marketing:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">URL del Sitio o Landing Page</label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/servicios o landing page"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nombre o Etiqueta (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Web Principal Cliente"
                      value={urlName}
                      onChange={(e) => setUrlName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAnalyzeUrl}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extrayendo términos y propuesta con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analizar & Capacitar a la IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Result Card */}
              {analysisResult && (
                <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Conocimiento Extraído con Éxito
                    </span>
                    {onApplyAnalysisToBrief && (
                      <button
                        onClick={() => {
                          onApplyAnalysisToBrief(analysisResult);
                          onClose();
                        }}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1 rounded-lg transition"
                      >
                        Copiar al Brief de IA
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Resumen:</strong> {analysisResult.businessSummary}
                  </p>

                  {analysisResult.technicalTerms && analysisResult.technicalTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysisResult.technicalTerms.map((t, i) => (
                        <span key={i} className="bg-indigo-950 text-indigo-300 border border-indigo-700 text-[11px] px-2 py-0.5 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {tab === 'text' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Título del Documento / Guía</label>
                  <input
                    type="text"
                    placeholder="Ej: Glosario técnico de logística, Manual de ventas o Guía de producto"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Contenido, Glosario o Notas Estratégicas</label>
                  <textarea
                    rows={6}
                    placeholder="Pega aquí listas de términos técnicos (ej: SKU, Cross-docking, Lead time), testimonios, transcripciones de ventas, o notas de la industria..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleAddTextDocument}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Guardar & Entrenar Modelo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS LIBRARY */}
          {tab === 'library' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Base de Conocimiento Actual ({documents.length} fuentes activas):
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-400">No hay documentos de marketing ni glosarios agregados todavía.</p>
                  <button
                    onClick={() => setTab('niche')}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    + Generar tu primer glosario técnico con IA en 1 clic
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-indigo-600/30 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded">
                            {doc.type === 'niche_generator' ? 'GLOSARIO IA' : doc.type.toUpperCase()}
                          </span>
                          <h5 className="text-xs font-bold text-white">{doc.name}</h5>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-slate-500 hover:text-indigo-400 underline"
                            >
                              Ver enlace
                            </a>
                          )}
                        </div>

                        {doc.summary && (
                          <p className="text-xs text-slate-300 leading-relaxed">{doc.summary}</p>
                        )}

                        {/* Technical Terms Pill display */}
                        {doc.technicalTerms && doc.technicalTerms.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            <span className="text-[10px] font-bold text-amber-400 mr-1 flex items-center gap-1">
                              <Tag className="w-3 h-3" /> Jerga:
                            </span>
                            {doc.technicalTerms.map((t, i) => (
                              <span
                                key={i}
                                className="bg-indigo-950/80 border border-indigo-800/40 text-indigo-300 text-[10px] px-2 py-0.5 rounded-md"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {doc.extractedPains && doc.extractedPains.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {doc.extractedPains.slice(0, 3).map((pain, i) => (
                              <span
                                key={i}
                                className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-md"
                              >
                                🎯 {pain}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onRemoveDocument(doc.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition shrink-0"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400">
          <span>
            🧠 La IA inyecta estos documentos y términos automáticamente en cada generación para crear textos precisos.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};

