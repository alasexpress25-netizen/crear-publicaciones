import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Sparkles,
  Sliders,
  RefreshCw,
  Check,
  Copy,
  ExternalLink,
  Search,
  Key,
  Music,
  Volume2,
  Trash2,
  AlertCircle,
  Play,
  Layers,
  Radio
} from 'lucide-react';
import { Slide, AspectRatio } from '../types';
import { CURATED_STOCK_PHOTOS } from '../data/marketingPlaybooks';
import { apiEnhanceImagePrompt } from '../services/api';

interface MediaPanelProps {
  slide: Slide;
  brief: string;
  visualStyle: string;
  aspectRatio: AspectRatio;
  onUpdateSlide: (partial: Partial<Slide>) => void;
}

// Default Pixabay demo/public key fallback
const DEFAULT_PIXABAY_KEY = '48866504-20b1dbd83f36a58bc283f5c71';
const PIXABAY_STORAGE_KEY = 'lavisualmk_pixabay_api_key';

export const MediaPanel: React.FC<MediaPanelProps> = ({
  slide,
  brief,
  visualStyle,
  aspectRatio,
  onUpdateSlide,
}) => {
  const [tab, setTab] = useState<'pixabay' | 'presets' | 'custom' | 'ai-prompt' | 'music'>('pixabay');
  
  // Custom URL & Upload State
  const [customUrl, setCustomUrl] = useState(slide.image || '');
  
  // AI Prompt State
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState(slide.imageSuggestion || '');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Pixabay State
  const [pixabayKey, setPixabayKey] = useState<string>(() => {
    try {
      return localStorage.getItem(PIXABAY_STORAGE_KEY) || DEFAULT_PIXABAY_KEY;
    } catch {
      return DEFAULT_PIXABAY_KEY;
    }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pixabayResults, setPixabayResults] = useState<{ id: number; previewURL: string; largeImageURL: string; tags: string }[]>([]);
  const [isSearchingPixabay, setIsSearchingPixabay] = useState(false);
  const [pixabayError, setPixabayError] = useState<string | null>(null);

  // Music State
  const [audioUrlInput, setAudioUrlInput] = useState(slide.musicUrl || '');
  const [audioWarning, setAudioWarning] = useState<string | null>(null);

  const isVideo = slide.mediaType === 'video';
  const overlayIntensity = slide.overlayIntensity !== undefined ? slide.overlayIntensity : 85;
  const zoom = Math.round((slide.zoom || 1) * 100);
  const posX = slide.posX !== undefined ? slide.posX : 50;
  const posY = slide.posY !== undefined ? slide.posY : 50;
  const fit = slide.fit || 'cover';

  // Sync enhanced prompt if slide changes
  useEffect(() => {
    setEnhancedPrompt(slide.imageSuggestion || '');
    setCustomUrl(slide.image || '');
    setAudioUrlInput(slide.musicUrl || '');
  }, [slide.id, slide.imageSuggestion, slide.image, slide.musicUrl]);

  // Pre-fill Pixabay search when slide changes using Media Director Keywords or Intelligent Fallback
  useEffect(() => {
    if (slide.mediaSearchKeywords && slide.mediaSearchKeywords.length > 0) {
      const bestKeyword = slide.mediaSearchKeywords[0];
      setSearchQuery(bestKeyword);
      if (tab === 'pixabay') {
        handleSearchPixabay(bestKeyword);
      }
      return;
    }

    const defaultSearch = (slide.subtag || slide.badge || slide.title || 'business workspace')
      .replace(/[^\w\s]/gi, ' ')
      .trim()
      .toLowerCase()
      .split(' ')
      .slice(0, 3)
      .join(' ');
    setSearchQuery(defaultSearch || 'business workspace');
  }, [slide.id, slide.mediaSearchKeywords, slide.subtag, slide.badge, slide.title]);

  // Save Pixabay Key to localStorage
  const handleSavePixabayKey = (val: string) => {
    setPixabayKey(val);
    try {
      localStorage.setItem(PIXABAY_STORAGE_KEY, val);
    } catch {}
  };

  // Perform Pixabay Search
  const handleSearchPixabay = async (customQ?: string) => {
    const q = (customQ || searchQuery).trim();
    if (!q) return;

    setIsSearchingPixabay(true);
    setPixabayError(null);

    const keyToUse = pixabayKey.trim() || DEFAULT_PIXABAY_KEY;

    try {
      const url = `https://pixabay.com/api/?key=${encodeURIComponent(keyToUse)}&q=${encodeURIComponent(
        q
      )}&image_type=photo&safesearch=true&per_page=9`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error de API Pixabay (${res.status}). Verifica tu clave API.`);
      }
      const data = await res.json();
      if (data.hits && data.hits.length > 0) {
        setPixabayResults(data.hits);
      } else {
        setPixabayResults([]);
        setPixabayError('No se encontraron fotos para esa búsqueda. Te sugerimos probar con términos en inglés (ej: "workspace", "marketing", "success").');
      }
    } catch (err: any) {
      setPixabayError(err.message || 'Error al conectar con Pixabay. Prueba buscar en inglés o verifica tu clave.');
    } finally {
      setIsSearchingPixabay(false);
    }
  };

  // Trigger Pixabay initial search once on mount or when tab becomes pixabay
  useEffect(() => {
    if (tab === 'pixabay' && pixabayResults.length === 0) {
      handleSearchPixabay();
    }
  }, [tab]);

  // File Upload for Image / Video
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateSlide({
        image: dataUrl,
        mediaType: isVideoFile ? 'video' : 'image',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // File Upload for Background Music
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Por favor selecciona un archivo de audio válido (.mp3, .wav, .m4a, etc.)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAudioWarning('El archivo pesa más de 15MB. Funcionará correctamente pero puede demorar un momento al exportar.');
    } else {
      setAudioWarning(null);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateSlide({
        includeMusic: true,
        musicUrl: dataUrl,
        musicName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Enhance Image Prompt with AI Art Director
  const handleEnhancePrompt = async () => {
    setIsEnhancing(true);
    try {
      const slideText = [slide.badge, slide.subtag, slide.title, slide.body, slide.cta]
        .filter(Boolean)
        .join(' | ');

      const res = await apiEnhanceImagePrompt({
        slideText: slideText || 'Negocio y servicios profesionales',
        brief,
        visualStyle,
        isVideo,
        aspect: aspectRatio,
      });

      setEnhancedPrompt(res.enhancedPrompt);
      onUpdateSlide({ imageSuggestion: res.enhancedPrompt });
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Copy Prompt with 2s visual feedback
  const handleCopyPrompt = () => {
    if (!enhancedPrompt) return;
    navigator.clipboard.writeText(enhancedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Open Gemini / Veo in named reusable tab
  const handleOpenGemini = () => {
    const targetUrl = isVideo ? 'https://deepmind.google/technologies/veo/' : 'https://gemini.google.com/';
    const tabName = isVideo ? 'veo_video_generator_tab' : 'gemini_art_director_tab';
    window.open(targetUrl, tabName);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
      
      {/* Header & Media Toggle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-rose-400">
            {tab === 'music' ? <Music className="w-4 h-4 text-emerald-400" /> : <ImageIcon className="w-4 h-4 text-rose-500" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {tab === 'music' ? 'Música de Fondo' : `Medios & Fondo (Slide #${slide.id})`}
            </h4>
            <p className="text-[10px] text-slate-400">
              {tab === 'music' ? 'Pista de audio para exportación' : 'Fotos de stock, videos o prompts de IA'}
            </p>
          </div>
        </div>

        {/* Media type toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => onUpdateSlide({ mediaType: 'image' })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition ${
              !isVideo ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Foto</span>
          </button>
          <button
            onClick={() => onUpdateSlide({ mediaType: 'video' })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition ${
              isVideo ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>Video</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setTab('pixabay')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            tab === 'pixabay'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Pixabay Stock</span>
        </button>

        <button
          onClick={() => setTab('presets')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
            tab === 'presets'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Fotos Rápidas
        </button>

        <button
          onClick={() => setTab('custom')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
            tab === 'custom'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Upload className="w-3 h-3" />
          <span>Subir / URL</span>
        </button>

        <button
          onClick={() => setTab('ai-prompt')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            tab === 'ai-prompt'
              ? 'bg-gradient-to-r from-rose-900 to-pink-900 text-rose-200 border border-rose-600/70 shadow'
              : 'bg-slate-950 hover:bg-slate-800 text-rose-400 border border-rose-950/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Prompt IA</span>
        </button>

        <button
          onClick={() => setTab('music')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            tab === 'music'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow'
              : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-950/60'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Música {slide.includeMusic ? '✓' : ''}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PIXABAY REAL STOCK SEARCH                          */}
      {/* ========================================================= */}
      {tab === 'pixabay' && (
        <div className="space-y-3">
          
          {/* Search Bar & Pixabay API Key Config */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPixabay()}
                  placeholder="Buscar fotos de stock (ej: oficina, equipo, tecnologia)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={() => handleSearchPixabay()}
                disabled={isSearchingPixabay}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                {isSearchingPixabay ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Buscar</span>
              </button>

              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className={`p-2 rounded-xl border text-xs transition shrink-0 ${
                  showKeyInput
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                }`}
                title="Configurar clave de API Pixabay personal"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Optional Pixabay Key Input */}
            {showKeyInput && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <Key className="w-3 h-3 text-rose-400" />
                    <span>Clave API Pixabay (Gratis):</span>
                  </span>
                  <a
                    href="https://pixabay.com/api/docs/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Obtener clave gratis</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  value={pixabayKey}
                  onChange={(e) => handleSavePixabayKey(e.target.value)}
                  placeholder="Pega tu API Key de Pixabay..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            )}
            {/* AI Media Director Suggested Keywords Chips */}
            {slide.mediaSearchKeywords && slide.mediaSearchKeywords.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
                <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Media Director:</span>
                </span>
                {slide.mediaSearchKeywords.map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(kw);
                      handleSearchPixabay(kw);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                      searchQuery === kw
                        ? 'bg-rose-600 text-white border-rose-500 font-bold shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error / Feedback */}
          {pixabayError && (
            <div className="p-2.5 bg-amber-950/30 border border-amber-800/50 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{pixabayError}</span>
            </div>
          )}

          {/* Results Grid 3x3 */}
          {pixabayResults.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {pixabayResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    onUpdateSlide({
                      image: item.largeImageURL || item.previewURL,
                      mediaType: 'image',
                    })
                  }
                  className={`relative aspect-square rounded-xl overflow-hidden border transition group ${
                    slide.image === item.largeImageURL
                      ? 'border-rose-500 ring-2 ring-rose-500'
                      : 'border-slate-800 hover:border-rose-400'
                  }`}
                  style={{
                    backgroundImage: `url("${item.previewURL}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  title={item.tags}
                >
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-1">
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full shadow">
                      Aplicar
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : !isSearchingPixabay && (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-400">
                Escribe un término en el buscador para ver 9 fotos de alta calidad libres de derechos.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CURATED PRESETS                                    */}
      {/* ========================================================= */}
      {tab === 'presets' && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {CURATED_STOCK_PHOTOS.map((photo, i) => (
              <button
                key={i}
                onClick={() => onUpdateSlide({ image: photo.url, mediaType: 'image' })}
                className={`relative aspect-video rounded-xl overflow-hidden border transition group ${
                  slide.image === photo.url ? 'border-rose-500 ring-2 ring-rose-500' : 'border-slate-800 hover:border-slate-600'
                }`}
                style={{
                  backgroundImage: `url("${photo.url}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition flex items-end p-1.5">
                  <span className="text-[9px] font-bold text-white truncate drop-shadow">{photo.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: UPLOAD OR CUSTOM URL                               */}
      {/* ========================================================= */}
      {tab === 'custom' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-semibold cursor-pointer transition">
              <Upload className="w-4 h-4 text-rose-400" />
              <span>Subir {isVideo ? 'video (MP4)' : 'foto'} desde tu PC</span>
              <input
                type="file"
                accept={isVideo ? 'video/*' : 'image/*'}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="O pega una URL de imagen/video..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={() => onUpdateSlide({ image: customUrl })}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ART DIRECTOR AI PROMPT (GEMINI / VEO FLOW)          */}
      {/* ========================================================= */}
      {tab === 'ai-prompt' && (
        <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>{isVideo ? 'Prompt Cinematográfico para Veo:' : 'Prompt Fotográfico para Gemini / Imagen:'}</span>
            </span>
            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
            >
              {isEnhancing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>{isEnhancing ? 'Diseñando...' : 'Mejorar Prompt'}</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={enhancedPrompt}
            onChange={(e) => setEnhancedPrompt(e.target.value)}
            placeholder="Haz clic en 'Mejorar Prompt' para que el Director de Arte IA diseñe la escena exacta..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
          />

          {/* Action Buttons: Copiar Prompt & Abrir Gemini / Veo */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-slate-500 max-w-[200px]">
              {isVideo
                ? 'Genera el video en Veo y sube el archivo MP4.'
                : 'Pega el prompt en Gemini y descarga tu imagen favorita.'}
            </span>

            <div className="flex items-center gap-2">
              {/* Copy Prompt Button with 2s visual feedback */}
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-rose-400" />
                    <span>Copiar Prompt</span>
                  </>
                )}
              </button>

              {/* Open Gemini / Veo Button in named tab */}
              <button
                onClick={handleOpenGemini}
                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-md transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isVideo ? 'Abrir Veo' : 'Abrir Gemini'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: BACKGROUND MUSIC & AUDIO CONTROLS                  */}
      {/* ========================================================= */}
      {tab === 'music' && (
        <div className="space-y-4 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
          
          {/* Include Music Toggle */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Incluir Música de Fondo
                </span>
                <span className="text-[10px] text-slate-400">
                  Se incluirá la pista de audio real en la exportación ZIP
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!slide.includeMusic}
                onChange={(e) => onUpdateSlide({ includeMusic: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {audioWarning && (
            <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{audioWarning}</span>
            </div>
          )}

          {/* Upload MP3 button */}
          <div className="space-y-2">
            <label className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-3 text-xs text-white font-bold cursor-pointer transition">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Subir MP3 / Audio desde tu PC</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
            </label>

            {/* Or Paste Audio URL */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="O pega una URL directa de audio (MP3)..."
                value={audioUrlInput}
                onChange={(e) => setAudioUrlInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() =>
                  onUpdateSlide({
                    includeMusic: true,
                    musicUrl: audioUrlInput,
                    musicName: 'audio_enlace.mp3',
                  })
                }
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Free Royalty-Free Audio Libraries Quick Links */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bibliotecas de Música Libre de Derechos:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <a
                href="https://pixabay.com/music/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white p-2 rounded-xl transition text-center"
              >
                <span>Pixabay Music</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href="https://www.youtube.com/audiolibrary"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white p-2 rounded-xl transition text-center"
              >
                <span>YouTube Audio</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href="https://freemusicarchive.org/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white p-2 rounded-xl transition text-center"
              >
                <span>Free Music Arc</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Audio Player if URL is loaded */}
          {slide.musicUrl && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 truncate max-w-[240px]">
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{slide.musicName || 'Pista de Audio Cargada'}</span>
                </span>
                <button
                  onClick={() =>
                    onUpdateSlide({
                      includeMusic: false,
                      musicUrl: undefined,
                      musicName: undefined,
                    })
                  }
                  className="text-slate-400 hover:text-red-400 p-1 rounded-lg transition"
                  title="Quitar audio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <audio controls src={slide.musicUrl} className="w-full h-8 rounded-lg" />
            </div>
          )}

        </div>
      )}

      {/* Adjustments: Darkness Overlay, Zoom, Pan (Always Accessible) */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Oscurecido para legibilidad:</span>
          </span>
          <span className="font-mono text-slate-200 font-bold">{overlayIntensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={overlayIntensity}
          onChange={(e) => onUpdateSlide({ overlayIntensity: parseInt(e.target.value, 10) })}
          className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* Zoom Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Zoom</span>
              <span className="font-mono">{zoom}%</span>
            </div>
            <input
              type="range"
              min={fit === 'cover' ? 100 : 50}
              max="250"
              value={zoom}
              onChange={(e) => onUpdateSlide({ zoom: parseInt(e.target.value, 10) / 100 })}
              className="w-full accent-rose-600 cursor-pointer h-1 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Pan X Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Posición X</span>
              <span className="font-mono">{posX}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={posX}
              onChange={(e) => onUpdateSlide({ posX: parseInt(e.target.value, 10) })}
              className="w-full accent-rose-600 cursor-pointer h-1 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Pan Y Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Posición Y</span>
              <span className="font-mono">{posY}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={posY}
              onChange={(e) => onUpdateSlide({ posY: parseInt(e.target.value, 10) })}
              className="w-full accent-rose-600 cursor-pointer h-1 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
