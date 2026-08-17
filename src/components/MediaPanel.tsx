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
  AlertTriangle,
  Play,
  Layers,
  Radio,
  Youtube,
  Download,
  Terminal,
  FileCode,
  HelpCircle,
  Building2,
  User,
  Info,
  Lightbulb,
  Camera,
  Compass,
  Film,
  Sparkle
} from 'lucide-react';
import { Slide, AspectRatio, BrandInfo } from '../types';
import { AgencyClient } from '../services/supabase';
import { CURATED_STOCK_PHOTOS } from '../data/marketingPlaybooks';
import { apiBuildConcreteScene, apiEnhanceImagePrompt, EnhanceImagePromptResult } from '../services/api';
import { checkSceneSimilarity } from '../utils/sceneSimilarity';
import { safeAlert } from '../utils/notifications';

interface MediaPanelProps {
  slide: Slide;
  brief: string;
  visualStyle: string;
  aspectRatio: AspectRatio;
  onUpdateSlide: (partial: Partial<Slide>) => void;
  onUpdateAllSlides?: (slides: Slide[]) => void;
  slides?: Slide[];
  client?: AgencyClient | null;
  brand?: BrandInfo;
  targetAudience?: string;
  slideIndex?: number;
  totalSlides?: number;
  escenasPorDiapositiva?: Record<string | number, string>;
  onSaveConcreteScene?: (slideKey: string | number, scene: string) => void;
  onSaveAllConcreteScenes?: (scenesMap: Record<string | number, string>) => void;
}

// Default Pixabay demo/public key fallback
const DEFAULT_PIXABAY_KEY = '48866504-20b1dbd83f36a58bc283f5c71';
const PIXABAY_STORAGE_KEY = 'lavisualmk_pixabay_api_key';
const YT2MP3_LOCAL_SERVER = 'http://localhost:5057';

const LOCAL_PYTHON_SCRIPT_CODE = `#!/usr/bin/env python3
import os
import re
import tempfile
import sys
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

try:
    import yt_dlp
except ImportError:
    print("\\n[!] Falta yt-dlp. Instálalo con: pip install yt-dlp flask flask-cors\\n")
    sys.exit(1)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_pna_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, *"
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition, X-Audio-Title"
    return response

def sanitize_filename(name):
    clean = re.sub(r'[^\\w\\s-]', '', name).strip()
    return re.sub(r'[-\\s]+', '_', clean).lower()

@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return ('', 204)
    return jsonify({"status": "ok", "service": "La Visual MK - YT2MP3", "port": 5057})

@app.route('/convert', methods=['POST', 'OPTIONS'])
def convert_to_mp3():
    if request.method == 'OPTIONS':
        return ('', 204)

    data = request.get_json(silent=True) or {}
    url = data.get('url', '').strip()
    if not url:
        return jsonify({"error": "Falta la URL de YouTube"}), 400

    temp_dir = tempfile.mkdtemp(prefix="lavisualmk_yt_")
    out_template = os.path.join(temp_dir, '%(title)s.%(ext)s')

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': out_template,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'no_warnings': True,
    }

    try:
        print(f"[*] Extrayendo audio de: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            raw_title = info.get('title', 'youtube_audio')
            clean_title = sanitize_filename(raw_title)

        generated_files = [f for f in os.listdir(temp_dir) if f.endswith('.mp3')]
        if not generated_files:
            return jsonify({"error": "No se generó el MP3. Verifica tener ffmpeg instalado."}), 500

        mp3_path = os.path.join(temp_dir, generated_files[0])
        final_filename = f"{clean_title}.mp3"
        print(f"[✓] MP3 listo: {final_filename}")

        return send_file(
            mp3_path,
            as_attachment=True,
            download_name=final_filename,
            mimetype="audio/mpeg"
        )
    except Exception as e:
        print(f"[!] Error: {str(e)}")
        return jsonify({"error": f"Error procesando video: {str(e)}"}), 500

if __name__ == '__main__':
    print("=========================================================")
    print(" 🎵 La Visual MK - Servidor Local YouTube -> MP3")
    print(" Escuchando en: http://127.0.0.1:5057")
    print("=========================================================")
    app.run(host='0.0.0.0', port=5057, debug=False)
`;

const ART_DIRECTION_STYLES = [
  { id: 'photorealistic', label: '📸 Fotorrealista', desc: 'Fotografía comercial auténtica de alta definición' },
  { id: 'visual_metaphor', label: '🎭 Metáfora Visual', desc: 'Simbolismo conceptual de alto impacto' },
  { id: 'action_workspace', label: '🏢 Entorno de Trabajo', desc: 'Personas reales en acción en su oficio' },
  { id: 'dark_cinematic', label: '🌙 Dark Minimalist', desc: 'Atmósfera cinematográfica de alto contraste' },
  { id: 'editorial_light', label: '🎨 Editorial & Luz Natural', desc: 'Estilo revista con paleta limpia y cálida' },
  { id: 'tech_modern', label: '⚡ Tech & Vanguardia', desc: 'Estilo moderno con tecnología y pantallas' },
];

export const MediaPanel: React.FC<MediaPanelProps> = ({
  slide,
  brief,
  visualStyle,
  aspectRatio,
  onUpdateSlide,
  onUpdateAllSlides,
  slides = [],
  client,
  brand,
  targetAudience,
  slideIndex = 0,
  totalSlides = 5,
  escenasPorDiapositiva = {},
  onSaveConcreteScene,
  onSaveAllConcreteScenes,
}) => {
  const [tab, setTab] = useState<'pixabay' | 'presets' | 'custom' | 'ai-prompt' | 'music'>('pixabay');
  
  // Custom URL & Upload State
  const [customUrl, setCustomUrl] = useState(slide.image || '');
  
  // AI Prompt & Chained Art Direction State
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhancingAll, setIsEnhancingAll] = useState(false);
  const [enhancingStatusText, setEnhancingStatusText] = useState<string>('');
  const [concreteScene, setConcreteScene] = useState<string>('');
  const [similarityWarning, setSimilarityWarning] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState(slide.imageSuggestion || '');
  const [artDirectionNotes, setArtDirectionNotes] = useState<string | null>(null);
  const [alternativeConcepts, setAlternativeConcepts] = useState<{ title: string; prompt: string }[]>([]);
  const [artDirectionMode, setArtDirectionMode] = useState<string>('photorealistic');
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

  // Music & YouTube MP3 State
  const [audioUrlInput, setAudioUrlInput] = useState(slide.musicUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isConvertingYt, setIsConvertingYt] = useState(false);
  const [ytConvertStatus, setYtConvertStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string } | null>(null);
  const [showYtServerHelp, setShowYtServerHelp] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [audioWarning, setAudioWarning] = useState<string | null>(null);

  const handleDownloadScript = () => {
    const blob = new Blob([LOCAL_PYTHON_SCRIPT_CODE], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yt2mp3_server.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(LOCAL_PYTHON_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const isVideo = slide.mediaType === 'video';
  const overlayIntensity = slide.overlayIntensity !== undefined ? slide.overlayIntensity : 85;
  const zoom = Math.round((slide.zoom || 1) * 100);
  const posX = slide.posX !== undefined ? slide.posX : 50;
  const posY = slide.posY !== undefined ? slide.posY : 50;
  const fit = slide.fit || 'cover';

  const currentSlideNumber = slideIndex + 1;
  const slideKey = slide._uid || slide.id || slideIndex;

  // Extract a clean snippet describing this slide's core message
  const slideHeadline = slide.title || slide.subtag || slide.badge || `Diapositiva #${currentSlideNumber}`;
  const clientName = client?.name || brand?.name || 'Marca Profesional';
  const clientIndustry = client?.industry || client?.business_type || brief || 'Servicios Profesionales';

  // Sync enhanced prompt & concrete scene when slide or slideIndex changes
  useEffect(() => {
    const fallbackPrompt = slide.imageSuggestion || `Fotografía fotorrealista para ${clientIndustry}, escena que ilustra el mensaje de "${slideHeadline}". Iluminación cinematográfica, sin texto en la imagen, fotorrealismo premium.`;
    setEnhancedPrompt(slide.imageSuggestion || fallbackPrompt);
    setCustomUrl(slide.image || '');
    setAudioUrlInput(slide.musicUrl || '');
    setArtDirectionNotes(null);
    setAlternativeConcepts([]);
    
    // Look up saved concrete scene in memory
    const savedScene = escenasPorDiapositiva[slideKey] || '';
    setConcreteScene(savedScene);
    
    if (savedScene) {
      const sim = checkSceneSimilarity(savedScene, slideKey, escenasPorDiapositiva, slides);
      setSimilarityWarning(sim?.isTooSimilar ? sim.message : null);
    } else {
      setSimilarityWarning(null);
    }
  }, [slideIndex, slide._uid, slide.id, slide.imageSuggestion, slide.image, slide.musicUrl, escenasPorDiapositiva]);

  // Pre-fill Pixabay search when slide changes using Media Director Keywords or intelligent fallback
  useEffect(() => {
    if (slide.mediaSearchKeywords && slide.mediaSearchKeywords.length > 0) {
      const bestKeyword = slide.mediaSearchKeywords[0];
      setSearchQuery(bestKeyword);
      if (tab === 'pixabay') {
        handleSearchPixabay(bestKeyword);
      }
      return;
    }

    const defaultSearch = (slide.subtag || slide.badge || slide.title || clientIndustry || 'business workspace')
      .replace(/[^\w\s]/gi, ' ')
      .trim()
      .toLowerCase()
      .split(' ')
      .slice(0, 3)
      .join(' ');
    setSearchQuery(defaultSearch || 'business workspace');
  }, [slideIndex, slide.id, slide.mediaSearchKeywords, slide.subtag, slide.badge, slide.title, clientIndustry]);

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
      safeAlert('Por favor selecciona un archivo de audio válido (.mp3, .wav, .m4a, etc.)');
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

  // Convert YouTube to MP3 via Cloud API or local Python server (yt2mp3_server.py)
  const handleYoutubeToMp3 = async () => {
    const url = youtubeUrl.trim();
    if (!url) {
      setYtConvertStatus({
        type: 'error',
        message: 'Por favor ingresa primero un enlace de YouTube válido.',
      });
      return;
    }

    setIsConvertingYt(true);
    setYtConvertStatus({
      type: 'loading',
      message: 'Extrayendo audio en MP3 desde YouTube (servidor en la nube)...',
    });

    let success = false;

    // Strategy 1: Server-Side Cloud API (/api/convert-youtube-mp3)
    try {
      const res = await fetch('/api/convert-youtube-mp3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const contentDisposition = res.headers.get('Content-Disposition') || '';
        const xTitle = res.headers.get('X-Audio-Title');
        let fileName = xTitle ? decodeURIComponent(xTitle) + '.mp3' : '';
        if (!fileName) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          fileName = match ? decodeURIComponent(match[1]) : `youtube_audio_${Date.now()}.mp3`;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          onUpdateSlide({
            includeMusic: true,
            musicUrl: dataUrl,
            musicName: fileName,
          });
          setYtConvertStatus({
            type: 'success',
            message: `✓ "${fileName}" descargado y cargado en tu carrusel con éxito.`,
          });
          setYoutubeUrl('');
        };
        reader.readAsDataURL(blob);
        success = true;
        setIsConvertingYt(false);
        return;
      }
    } catch (cloudErr: any) {
      console.warn('Cloud YouTube conversion failed, attempting local server fallback:', cloudErr);
    }

    // Strategy 2: Local Python Server (http://127.0.0.1:5057 or http://localhost:5057)
    setYtConvertStatus({
      type: 'loading',
      message: 'Intentando conexión con tu servidor local Python en PC (puerto 5057)...',
    });

    const localEndpoints = [
      'http://127.0.0.1:5057/convert',
      'http://localhost:5057/convert',
    ];

    for (const endpoint of localEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const contentDisposition = res.headers.get('Content-Disposition') || '';
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          const fileName = match ? decodeURIComponent(match[1]) : `youtube_audio_${Date.now()}.mp3`;

          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            onUpdateSlide({
              includeMusic: true,
              musicUrl: dataUrl,
              musicName: fileName,
            });
            setYtConvertStatus({
              type: 'success',
              message: `✓ "${fileName}" procesado por tu servidor local y cargado con éxito.`,
            });
            setYoutubeUrl('');
          };
          reader.readAsDataURL(blob);
          success = true;
          break;
        }
      } catch (localErr: any) {
        console.warn(`Local endpoint ${endpoint} unreachable:`, localErr);
      }
    }

    if (!success) {
      setYtConvertStatus({
        type: 'error',
        message:
          'No se pudo extraer el audio automáticamente. Esto puede deberse a bloqueos de seguridad del navegador (HTTPS vs HTTP localhost) o restricciones del video. Te recomendamos descargar el script "yt2mp3_server.py" actualizado o subir directamente el archivo MP3 con el botón inferior.',
      });
      setShowYtServerHelp(true);
    }

    setIsConvertingYt(false);
  };

  // Enhance Image Prompt with AI Art Director (Contextualized to this specific slide + client)
  // ARCHITECTURE: STEP B (Director de Arte con memoria) -> Pure JS Similarity Check -> STEP C (Redactor Técnico)
  const handleEnhancePrompt = async (customStyleMode?: string) => {
    setIsEnhancing(true);
    setEnhancingStatusText('Paso B: Diseñando escena concreta única...');
    setSimilarityWarning(null);
    const modeToUse = customStyleMode || artDirectionMode;
    const currentSlideKey = slide._uid || slide.id || slideIndex;

    try {
      // 1. Gather scenes already used in other slides of this carousel
      const escenasYaUsadas: string[] = Object.entries(escenasPorDiapositiva || {})
        .filter(([k]) => String(k) !== String(currentSlideKey))
        .map(([_, v]) => String(v))
        .filter(Boolean);

      const abstractIdea = slide.imageSuggestion || slide.title || slide.subtag || slide.badge || `Diapositiva #${currentSlideNumber} de ${clientIndustry}`;

      // 2. PASO B — Director de Arte
      const resEscena = await apiBuildConcreteScene({
        imageSuggestion: abstractIdea,
        brief: clientIndustry || brief,
        escenasYaUsadas,
      });

      const resolvedScene = resEscena || abstractIdea;
      setConcreteScene(resolvedScene);
      if (onSaveConcreteScene) {
        onSaveConcreteScene(currentSlideKey, resolvedScene);
      }

      // 3. Chequeo de similitud liviano en JS puro (sin IA)
      const sim = checkSceneSimilarity(resolvedScene, currentSlideKey, escenasPorDiapositiva || {}, slides);
      if (sim?.isTooSimilar) {
        setSimilarityWarning(sim.message);
      } else {
        setSimilarityWarning(null);
      }

      // 4. PASO C — Redactor de Prompt Técnico
      setEnhancingStatusText('Paso C: Ajustando parámetros técnicos de cámara e iluminación...');
      const res: EnhanceImagePromptResult = await apiEnhanceImagePrompt({
        slide,
        escenaConcreta: resolvedScene,
        slideIndex: currentSlideNumber,
        totalSlides,
        clientInfo: client,
        brand,
        brief,
        targetAudience,
        visualStyle,
        artDirectionMode: modeToUse,
        isVideo,
        aspect: aspectRatio,
      });

      setEnhancedPrompt(res.enhancedPrompt);
      setArtDirectionNotes(res.artDirectionNotes || null);
      setAlternativeConcepts(res.alternativeConcepts || []);

      const updates: Partial<Slide> = {
        imageSuggestion: res.enhancedPrompt,
      };

      if (res.mediaSearchKeywords && res.mediaSearchKeywords.length > 0) {
        updates.mediaSearchKeywords = res.mediaSearchKeywords;
        setSearchQuery(res.mediaSearchKeywords[0]);
      }

      onUpdateSlide(updates);
    } catch (err: any) {
      console.error('Error enhancing prompt for slide:', err);
    } finally {
      setIsEnhancing(false);
      setEnhancingStatusText('');
    }
  };

  // Enhance All Prompts sequentially through the Paso B -> Paso C chain with persistent memory
  const handleEnhanceAllPrompts = async () => {
    if (!slides || slides.length === 0 || !onUpdateAllSlides) return;
    setIsEnhancingAll(true);
    setEnhancingStatusText('Iniciando dirección visual en cadena para todo el carrusel...');

    try {
      const newScenesMap: Record<string | number, string> = { ...(escenasPorDiapositiva || {}) };
      const updatedSlides = [...slides];

      for (let i = 0; i < slides.length; i++) {
        const curSlide = slides[i];
        const curKey = curSlide._uid || curSlide.id || i;
        setEnhancingStatusText(`Slide #${i + 1} de ${slides.length}: Paso B (Diseñando escena)...`);

        const previousScenes: string[] = Object.entries(newScenesMap)
          .filter(([k]) => String(k) !== String(curKey))
          .map(([_, v]) => String(v))
          .filter(Boolean);

        const abstractIdea = curSlide.imageSuggestion || curSlide.title || curSlide.subtag || curSlide.badge || `Diapositiva #${i + 1}`;

        // Paso B
        const escena = await apiBuildConcreteScene({
          imageSuggestion: abstractIdea,
          brief: clientIndustry || brief,
          escenasYaUsadas: previousScenes,
        });

        newScenesMap[curKey] = escena;

        setEnhancingStatusText(`Slide #${i + 1} de ${slides.length}: Paso C (Generando prompt técnico)...`);
        // Paso C
        const promptRes = await apiEnhanceImagePrompt({
          slide: curSlide,
          escenaConcreta: escena,
          slideIndex: i + 1,
          totalSlides: slides.length,
          clientInfo: client,
          brand,
          brief,
          targetAudience,
          visualStyle,
          artDirectionMode,
          isVideo,
          aspect: aspectRatio,
        });

        updatedSlides[i] = {
          ...curSlide,
          imageSuggestion: promptRes.enhancedPrompt,
          mediaSearchKeywords: promptRes.mediaSearchKeywords || curSlide.mediaSearchKeywords,
        };
      }

      if (onSaveAllConcreteScenes) {
        onSaveAllConcreteScenes(newScenesMap);
      }
      onUpdateAllSlides(updatedSlides);

      const currentUpdated = updatedSlides[slideIndex];
      if (currentUpdated) {
        setEnhancedPrompt(currentUpdated.imageSuggestion || '');
        if (currentUpdated.mediaSearchKeywords && currentUpdated.mediaSearchKeywords.length > 0) {
          setSearchQuery(currentUpdated.mediaSearchKeywords[0]);
        }
      }

      const activeKey = slide._uid || slide.id || slideIndex;
      if (newScenesMap[activeKey]) {
        setConcreteScene(newScenesMap[activeKey]);
        const sim = checkSceneSimilarity(newScenesMap[activeKey], activeKey, newScenesMap, updatedSlides);
        setSimilarityWarning(sim?.isTooSimilar ? sim.message : null);
      }
    } catch (err: any) {
      console.error('Error generating all image prompts:', err);
      safeAlert(err.message || 'Error al generar dirección visual para todo el carrusel');
    } finally {
      setIsEnhancingAll(false);
      setEnhancingStatusText('');
    }
  };

  // Copy Prompt with 2s visual feedback
  const handleCopyPrompt = (promptText?: string) => {
    const textToCopy = promptText || enhancedPrompt;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-rose-400 shrink-0">
            {tab === 'music' ? <Music className="w-4 h-4 text-emerald-400" /> : <ImageIcon className="w-4 h-4 text-rose-500" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {tab === 'music' ? 'Música de Fondo' : `Medios & Dirección Visual`}
              </h4>
              <span className="text-[10px] bg-rose-950/80 border border-rose-600/40 text-rose-300 px-2 py-0.2 rounded-full font-mono font-bold">
                Slide #{currentSlideNumber} de {totalSlides}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
              {tab === 'music' ? 'Pista de audio para exportación' : `Adaptado a: "${slideHeadline.slice(0, 45)}..."`}
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

      {/* Context Badge: Active Client & Slide Message */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5 px-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-slate-400">Cliente:</span>
          <span className="font-bold text-white">{clientName}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 truncate max-w-[180px]">{clientIndustry}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
          <Compass className="w-3 h-3 text-indigo-400 shrink-0" />
          <span>
            {currentSlideNumber === 1
              ? 'Rol: Gancho / Scroll-Stopper'
              : currentSlideNumber === totalSlides
              ? 'Rol: Cierre / Llamado a la Acción'
              : 'Rol: Tensión / Contenido de Valor'}
          </span>
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
          onClick={() => setTab('ai-prompt')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
            tab === 'ai-prompt'
              ? 'bg-gradient-to-r from-rose-900 to-pink-900 text-rose-200 border border-rose-600/70 shadow'
              : 'bg-slate-950 hover:bg-slate-800 text-rose-400 border border-rose-950/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Prompt IA (Director de Arte)</span>
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
                  placeholder="Buscar fotos de stock (ej: workspace, strategy, client meet)..."
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

            {/* AI Media Director Suggested Keywords Chips tailored to this slide */}
            <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5 pb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Sugerencias Slide #{currentSlideNumber}:</span>
                </span>
                {slide.mediaSearchKeywords && slide.mediaSearchKeywords.length > 0 ? (
                  slide.mediaSearchKeywords.map((kw, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(kw);
                        handleSearchPixabay(kw);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                        searchQuery.toLowerCase() === kw.toLowerCase()
                          ? 'bg-rose-600 text-white border-rose-500 font-bold shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      {kw}
                    </button>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-500 italic">Genera con IA para obtener palabras clave exactas</span>
                )}
              </div>

              <button
                onClick={() => handleEnhancePrompt()}
                disabled={isEnhancing}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition shrink-0"
              >
                {isEnhancing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                <span>{isEnhancing ? 'Analizando...' : 'Auto-sugerir con IA'}</span>
              </button>
            </div>
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
                Escribe un término o haz clic en las sugerencias de la IA para ver fotos de alta calidad libres de derechos.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ART DIRECTOR AI PROMPT (GEMINI / VEO FLOW)          */}
      {/* ========================================================= */}
      {tab === 'ai-prompt' && (
        <div className="space-y-3.5 bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
          
          {/* Active Slide Psychological Context Banner */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/60">
                  Diapositiva #{currentSlideNumber} de {totalSlides}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[280px]">
                  {slideHeadline}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {currentSlideNumber === 1
                  ? '🎯 Momento Gancho: Tensión, curiosidad y quiebre de creencia para detener el scroll.'
                  : currentSlideNumber === totalSlides
                  ? '🏁 Momento Cierre: Claridad, éxito, solución y llamada a la acción.'
                  : '💡 Momento Desarrollo: Explicación del problema, método, datos o contraste del cliente.'}
              </p>
            </div>

            {/* Batch generation button if all slides available */}
            {slides.length > 1 && onUpdateAllSlides && (
              <button
                onClick={handleEnhanceAllPrompts}
                disabled={isEnhancingAll || isEnhancing}
                className="text-[10px] bg-gradient-to-r from-amber-600/90 to-rose-600/90 hover:from-amber-500 hover:to-rose-500 text-white font-bold px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-sm flex items-center gap-1.5 transition shrink-0 self-start sm:self-auto disabled:opacity-50"
                title="Genera escenas y prompts únicos para cada diapositiva en cadena, recordando las escenas anteriores para no repetirlas jamás"
              >
                {isEnhancingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isEnhancingAll ? 'Creando todo el carrusel...' : '✨ Prompts Únicos para Todo el Carrusel'}</span>
              </button>
            )}
          </div>

          {/* Active Generation Progress Indicator */}
          {(isEnhancing || isEnhancingAll) && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-600/40 rounded-xl flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-rose-400 shrink-0" />
              <div className="text-xs text-rose-200 font-medium">
                {enhancingStatusText || 'Generando dirección de arte...'}
              </div>
            </div>
          )}

          {/* Style Mode Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Estilo de Dirección de Arte para Diapositiva #{currentSlideNumber}:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ART_DIRECTION_STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setArtDirectionMode(st.id);
                    handleEnhancePrompt(st.id);
                  }}
                  disabled={isEnhancing || isEnhancingAll}
                  className={`p-2 rounded-xl border text-left transition flex flex-col justify-center disabled:opacity-50 ${
                    artDirectionMode === st.id
                      ? 'bg-rose-950/80 border-rose-500/80 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-[11px] font-bold">{st.label}</span>
                  <span className="text-[9px] text-slate-400 truncate">{st.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PASO B: Escena Concreta Resuelta (Director de Arte con Memoria) */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>Paso B — Escena Concreta Resuelta (Director de Arte):</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 font-mono">
                Máx 25 palabras • Anti-clichés
              </span>
            </div>
            {concreteScene ? (
              <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                "{concreteScene}"
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                Presiona "Generar para Slide" o "Prompts Únicos para Todo el Carrusel" para que el Director de Arte resuelva la escena específica sin clichés de oficina.
              </p>
            )}
          </div>

          {/* AVISO DE SIMILITUD (Chequeo liviano en JS puro) */}
          {similarityWarning && (
            <div className="p-2.5 bg-amber-950/50 border border-amber-500/60 rounded-xl flex items-start gap-2 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block">Aviso de Similitud:</span>
                {similarityWarning}
              </div>
            </div>
          )}

          {/* PASO C: Prompt Técnico Final Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>{isVideo ? `Paso C — Prompt Técnico de Video (Diapositiva #${currentSlideNumber}):` : `Paso C — Prompt Técnico Fotorrealista (Diapositiva #${currentSlideNumber}):`}</span>
            </span>
            <button
              onClick={() => handleEnhancePrompt()}
              disabled={isEnhancing || isEnhancingAll}
              className="text-[10px] bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 hover:text-rose-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition disabled:opacity-50"
            >
              {isEnhancing ? <RefreshCw className="w-3 h-3 animate-spin text-rose-400" /> : <Sparkles className="w-3 h-3 text-rose-400" />}
              <span>{isEnhancing ? 'Creando escena...' : `Generar para Slide #${currentSlideNumber}`}</span>
            </button>
          </div>

          {/* Prompt Textarea */}
          <textarea
            rows={4}
            value={enhancedPrompt}
            onChange={(e) => {
              const val = e.target.value;
              setEnhancedPrompt(val);
              onUpdateSlide({ imageSuggestion: val });
            }}
            placeholder="Haz clic en 'Generar para Slide' para que la IA diseñe la escena exacta combinando el texto de este slide con la identidad de tu cliente..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
          />

          {/* Art Direction Notes Card */}
          {artDirectionNotes && (
            <div className="p-2.5 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400">
                <Lightbulb className="w-3 h-3" />
                <span>Psicología Visual del Slide:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {artDirectionNotes}
              </p>
            </div>
          )}

          {/* Alternative Concepts */}
          {alternativeConcepts.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Conceptos Visuales Alternativos para este Slide:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alternativeConcepts.map((alt, i) => (
                  <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-400">{alt.title}</span>
                      <button
                        onClick={() => {
                          setEnhancedPrompt(alt.prompt);
                          onUpdateSlide({ imageSuggestion: alt.prompt });
                          handleCopyPrompt(alt.prompt);
                        }}
                        className="text-[9px] bg-slate-800 hover:bg-slate-700 text-white px-2 py-0.5 rounded font-semibold transition"
                      >
                        Usar y Copiar
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {alt.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: Copiar Prompt & Abrir Gemini / Veo */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-500 max-w-[220px]">
              {isVideo
                ? 'Genera el video en Veo y sube el archivo MP4.'
                : 'Pega el prompt en Gemini / Imagen 3 y descarga tu imagen favorita.'}
            </span>

            <div className="flex items-center gap-2">
              {/* Copy Prompt Button with 2s visual feedback */}
              <button
                onClick={() => handleCopyPrompt()}
                disabled={!enhancedPrompt}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition"
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
                  Se empaquetará el archivo .mp3 real dentro de la exportación ZIP
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

          {/* Section: YouTube to MP3 Converter */}
          <div className="p-3 bg-gradient-to-br from-red-950/30 to-slate-900 border border-red-900/40 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <Youtube className="w-4 h-4" />
                <span>Descargar MP3 desde YouTube</span>
              </div>
              <button
                type="button"
                onClick={() => setShowYtServerHelp(!showYtServerHelp)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                title="Ver cómo funciona el servidor local Python"
              >
                <HelpCircle className="w-3.5 h-3.5 text-red-400" />
                <span>¿Cómo funciona?</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pega un enlace de YouTube o descarga el MP3 en 1 clic con los servicios recomendados a continuación.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isConvertingYt}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={handleYoutubeToMp3}
                disabled={isConvertingYt || !youtubeUrl.trim()}
                className="bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shrink-0"
              >
                {isConvertingYt ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extrayendo...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Convertir</span>
                  </>
                )}
              </button>
            </div>

            {/* Acceso Rápido a Convertidores Web y Descarga Inmediata */}
            {youtubeUrl.trim() && (
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-[11px]">
                <span className="text-slate-400">¿Descarga externa directa?</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://cobalt.tools/#${encodeURIComponent(youtubeUrl.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold bg-slate-900 border border-emerald-500/30 px-2 py-1 rounded-lg transition"
                  >
                    Abrir en Cobalt.tools ↗
                  </a>
                  <a
                    href={`https://y2meta.tube/en/youtube-to-mp3?url=${encodeURIComponent(youtubeUrl.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 font-bold bg-slate-900 border border-red-500/30 px-2 py-1 rounded-lg transition"
                  >
                    Abrir en Y2Meta ↗
                  </a>
                </div>
              </div>
            )}

            {/* YouTube Convert Status */}
            {ytConvertStatus && (
              <div
                className={`p-2.5 rounded-xl text-[11px] flex items-start gap-2 ${
                  ytConvertStatus.type === 'loading'
                    ? 'bg-blue-950/40 border border-blue-800/50 text-blue-300'
                    : ytConvertStatus.type === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
                    : 'bg-red-950/40 border border-red-800/50 text-red-300'
                }`}
              >
                {ytConvertStatus.type === 'loading' && <RefreshCw className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-spin text-blue-400" />}
                {ytConvertStatus.type === 'success' && <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />}
                {ytConvertStatus.type === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />}
                <span className="flex-1">{ytConvertStatus.message}</span>
              </div>
            )}

            {/* YouTube Server Help Modal / Drawer */}
            {showYtServerHelp && (
              <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl space-y-2.5 text-[11px] text-slate-300">
                <div className="flex items-center justify-between font-bold text-white flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Servidor Python Local (Puerto 5057)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-lg border border-slate-700 transition"
                      title="Copiar código Python al portapapeles"
                    >
                      {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedScript ? 'Copiado' : 'Copiar Código'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadScript}
                      className="flex items-center gap-1 text-[10px] bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 px-2 py-1 rounded-lg border border-emerald-700/60 transition font-bold"
                    >
                      <Download className="w-3 h-3" />
                      <span>Descargar .py Limpio</span>
                    </button>
                  </div>
                </div>
                <p className="text-slate-400">
                  Para convertir videos de YouTube a MP3 directamente en tu máquina:
                </p>
                <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[10px] text-slate-300 space-y-1 border border-slate-800">
                  <div className="text-slate-500"># 1. Instalar dependencias en tu consola (Windows CMD / PowerShell):</div>
                  <div className="text-emerald-400 select-all">pip install flask flask-cors yt-dlp</div>
                  <div className="text-slate-500 pt-1"># 2. Iniciar el servidor en tu carpeta E:\local-server\:</div>
                  <div className="text-emerald-400 select-all">python yt2mp3_server.py</div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Upload Local Audio or Paste MP3 URL */}
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
                placeholder="O pega una URL directa de audio (.mp3)..."
                value={audioUrlInput}
                onChange={(e) => setAudioUrlInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
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
                  type="button"
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
