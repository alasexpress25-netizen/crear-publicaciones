import React, { useState } from 'react';
import { BookOpen, Link, FileText, Plus, Trash2, CheckCircle, RefreshCw, X, Globe, Sparkles, Check } from 'lucide-react';
import { MarketingDocument, MarketingAnalysisResult } from '../types';
import { apiAnalyzeMarketingSource } from '../services/api';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: MarketingDocument[];
  onAddDocument: (doc: MarketingDocument) => void;
  onRemoveDocument: (id: string) => void;
  onApplyAnalysisToBrief?: (analysis: MarketingAnalysisResult) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  documents,
  onAddDocument,
  onRemoveDocument,
  onApplyAnalysisToBrief,
}) => {
  const [tab, setTab] = useState<'url' | 'text' | 'library'>('url');
  
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Centro de Conocimiento y Entrenamiento de la IA
              </h3>
              <p className="text-xs text-slate-400">
                Alimenta a la IA con páginas web, documentos o guías de marketing para crear diapositivas más inteligentes
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
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => setTab('url')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === 'url'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Analizar URL o Landing Page</span>
          </button>
          <button
            onClick={() => setTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === 'text'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pegar Documento / Guía</span>
          </button>
          <button
            onClick={() => setTab('library')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === 'library'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Documentos Activos ({documents.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* TAB 1: ANALYZE URL */}
          {tab === 'url' && (
            <div className="space-y-5">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
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
                      <span>Extrayendo ángulos y dolores con IA...</span>
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
                <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-xl p-4 space-y-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] font-bold text-rose-400 uppercase">Dolores Clave:</span>
                      <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
                        {analysisResult.painPoints.map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase">Ganchos Sugeridos:</span>
                      <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
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

          {/* TAB 2: PASTE TEXT */}
          {tab === 'text' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Título del Documento / Guía</label>
                  <input
                    type="text"
                    placeholder="Ej: Manual de objeciones del cliente o Guía de producto"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Contenido o Notas Estratégicas</label>
                  <textarea
                    rows={6}
                    placeholder="Pega aquí textos de folletos, testimonios, transcripciones de ventas, o notas sobre por qué los clientes compran..."
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
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-400">No hay documentos de marketing agregados todavía.</p>
                  <button
                    onClick={() => setTab('url')}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    + Agregar tu primera URL o documento
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-600/30 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded">
                            {doc.type.toUpperCase()}
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
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>
            🧠 La IA inyecta estos documentos automáticamente en cada generación para crear textos precisos.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
