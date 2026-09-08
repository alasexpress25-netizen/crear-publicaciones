import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Plus,
  Volume2,
  VolumeX,
  Music,
  Video,
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Upload,
  Layers,
  Clock,
  Zap,
  Film,
  X,
  Check,
  Split
} from 'lucide-react';
import { Slide, AspectRatio, TransitionType, SceneMotionEffect, VideoAudioTrack } from '../types';
import { AUDIO_PRESETS } from '../utils/audioLibrary';
import { previewAudio } from '../utils/previewAudioEngine';

interface TimelineProps {
  slides: Slide[];
  currentIndex: number;
  aspectRatio: AspectRatio;
  audioTrack: VideoAudioTrack | null;
  onSelectSlide: (index: number) => void;
  onUpdateSlide: (index: number, partial: Partial<Slide>) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onReorderSlides: (startIndex: number, endIndex: number) => void;
  onUpdateAudioTrack: (track: VideoAudioTrack | null) => void;
  onOpenExportVideo: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number; // in seconds
  onSeek: (time: number) => void;
}

const TRANSITIONS: { id: TransitionType; name: string; icon: string }[] = [
  { id: 'crossfade', name: 'Disolución (Crossfade)', icon: '⤭' },
  { id: 'fade_black', name: 'Fundido a Negro', icon: '◾' },
  { id: 'fade_white', name: 'Flash Blanco', icon: '◽' },
  { id: 'slide_left', name: 'Barrido Izquierda', icon: '◀' },
  { id: 'slide_right', name: 'Barrido Derecha', icon: '▶' },
  { id: 'slide_up', name: 'Desplazar Arriba', icon: '▲' },
  { id: 'slide_down', name: 'Desplazar Abajo', icon: '▼' },
  { id: 'zoom_in', name: 'Zoom Dinámico', icon: '⊕' },
  { id: 'zoom_out', name: 'Alejamiento (Zoom Out)', icon: '⊖' },
  { id: 'wipe_left', name: 'Cortinilla Izquierda', icon: '❚' },
  { id: 'wipe_right', name: 'Cortinilla Derecha', icon: '❙' },
  { id: 'spin_zoom', name: 'Giro Espiral 3D', icon: '⟳' },
  { id: 'glitch', name: 'Glitch Digital', icon: '⚡' },
  { id: 'blur_dissolve', name: 'Desenfoque Óptico', icon: '◌' },
  { id: 'light_leak', name: 'Fuga de Luz (Light Leak)', icon: '✦' },
  { id: 'none', name: 'Corte Directo', icon: '✕' },
];

const EFFECTS: { id: SceneMotionEffect; name: string; desc: string }[] = [
  { id: 'ken_burns_zoom_in', name: 'Ken Burns (Zoom In)', desc: 'Acercamiento cinematográfico suave del 12%' },
  { id: 'ken_burns_zoom_out', name: 'Ken Burns (Zoom Out)', desc: 'Alejamiento suave para revelar contexto' },
  { id: 'pan_left_right', name: 'Paneo Izq. a Der.', desc: 'Desplazamiento sutil de izquierda a derecha' },
  { id: 'pan_right_left', name: 'Paneo Der. a Izq.', desc: 'Desplazamiento sutil de derecha a izquierda' },
  { id: 'cinematic_float', name: 'Flotación Suave', desc: 'Movimiento sinusoidal premium de cámara lenta' },
  { id: 'pulse', name: 'Pulso Rítmico', desc: 'Micro-pulsos coordinados al ritmo musical' },
  { id: 'fade_elements', name: 'Aparición Progresiva', desc: 'Crecimiento de escala enfocado' },
  { id: 'parallax_drift', name: 'Deriva Parallax', desc: 'Movimiento diagonal con rotación angular sutil' },
  { id: 'shaky_cam', name: 'Cámara en Mano', desc: 'Vibración orgánica realista de cámara manual' },
  { id: 'rgb_glitch', name: 'Aberración Cromática', desc: 'Pulso RGB estilo cyberpunk / tecnológico' },
  { id: 'tilt_perspective', name: 'Perspectiva 3D', desc: 'Inclinación angular tridimensional de escena' },
  { id: 'vignette_pulse', name: 'Viñeta Rítmica', desc: 'Bordes oscuros cinematográficos pulsantes' },
  { id: 'none', name: 'Sin Movimiento (Fijo)', desc: 'Fotograma estático' },
];

export const Timeline: React.FC<TimelineProps> = ({
  slides,
  currentIndex,
  aspectRatio,
  audioTrack,
  onSelectSlide,
  onUpdateSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides,
  onUpdateAudioTrack,
  onOpenExportVideo,
  isPlaying,
  onTogglePlay,
  currentTime,
  onSeek,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 0.7x to 2.5x pixels per second
  const [selectedTransitionIdx, setSelectedTransitionIdx] = useState<number | null>(null);
  const [editingSlideIdx, setEditingSlideIdx] = useState<number | null>(null);
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [isAudioEditorOpen, setIsAudioEditorOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlayingAudition, setIsPlayingAudition] = useState(false);

  const handleAudition = async (trackToTest: VideoAudioTrack) => {
    setIsPlayingAudition(true);
    await previewAudio.previewSample(trackToTest, 3.5);
    setTimeout(() => setIsPlayingAudition(false), 3500);
  };
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to open inspector panel while closing others to prevent layout stacking
  const openInspector = (type: 'audio' | 'slide' | 'transition' | 'picker', index?: number) => {
    if (type === 'audio') {
      setIsAudioEditorOpen((prev) => !prev);
      setEditingSlideIdx(null);
      setSelectedTransitionIdx(null);
      setIsAudioPickerOpen(false);
    } else if (type === 'slide') {
      const target = index ?? currentIndex;
      setEditingSlideIdx((prev) => (prev === target ? null : target));
      setIsAudioEditorOpen(false);
      setSelectedTransitionIdx(null);
      setIsAudioPickerOpen(false);
    } else if (type === 'transition') {
      const target = index ?? 0;
      setSelectedTransitionIdx((prev) => (prev === target ? null : target));
      setIsAudioEditorOpen(false);
      setEditingSlideIdx(null);
      setIsAudioPickerOpen(false);
    } else if (type === 'picker') {
      setIsAudioPickerOpen((prev) => !prev);
      setIsAudioEditorOpen(false);
      setEditingSlideIdx(null);
      setSelectedTransitionIdx(null);
    }
  };

  // Pixels per second calculation
  const pxPerSec = 55 * zoomLevel;

  // Compute slide timings
  let accumulatedTime = 0;
  const slideTimings = slides.map((s) => {
    const rawDur = s.duration || 3.5;
    const speed = s.speed || 1;
    const duration = Math.max(1, rawDur / speed);
    const startTime = accumulatedTime;
    accumulatedTime += duration;
    const endTime = accumulatedTime;
    return {
      duration,
      startTime,
      endTime,
      widthPx: Math.max(80, duration * pxPerSec),
    };
  });

  const slidesDuration = Math.max(1, accumulatedTime);
  const audioEnd = audioTrack ? (audioTrack.startOffset || 0) + (audioTrack.duration || slidesDuration) : 0;
  const totalDuration = Math.max(1, slidesDuration, audioEnd);

  // Format seconds to mm:ss.d
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  };

  // Handle ruler / track clicking for scrubber seeking
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackContainerRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.no-scrub')) return;

    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + trackContainerRef.current.scrollLeft;
    const newTime = Math.max(0, Math.min(totalDuration, clickX / pxPerSec));
    onSeek(newTime);

    // Synchronize active slide with time
    let foundIndex = 0;
    for (let i = 0; i < slideTimings.length; i++) {
      if (newTime >= slideTimings[i].startTime && newTime <= slideTimings[i].endTime) {
        foundIndex = i;
        break;
      }
    }
    if (foundIndex !== currentIndex) {
      onSelectSlide(foundIndex);
    }
  };

  // Split slide at current playhead
  const handleSplitSlide = () => {
    const currentSlide = slides[currentIndex];
    if (!currentSlide) return;
    const timing = slideTimings[currentIndex];
    const currentSlideDur = timing.duration;
    if (currentSlideDur <= 2) {
      alert('La escena es demasiado corta para dividirse (mínimo 2 segundos).');
      return;
    }
    const elapsedInSlide = Math.max(1, Math.min(currentSlideDur - 1, currentTime - timing.startTime));
    const remainingDur = Math.max(1, currentSlideDur - elapsedInSlide);

    // Update current slide duration
    onUpdateSlide(currentIndex, { duration: elapsedInSlide });

    // Duplicate slide with remaining duration
    onDuplicateSlide(currentIndex);
    setTimeout(() => {
      onUpdateSlide(currentIndex + 1, { duration: remainingDur });
    }, 50);
  };

  // Upload custom audio file
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateAudioTrack({
        url,
        name: file.name.replace(/\.[^/.]+$/, ''),
        volume: 0.85,
        isMuted: false,
      });
      setIsAudioPickerOpen(false);
    }
  };

  return (
    <div
      id="video-timeline-container"
      className="w-full bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 min-h-[260px] h-auto overflow-hidden"
    >
      {/* 1. Header Toolbar (Clipchamp Style) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs shrink-0">
        
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Rewind */}
          <button
            onClick={() => onSeek(0)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm"
            title="Rebobinar al inicio (00:00.0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={() => {
              previewAudio.resumeContext().catch(() => {});
              onTogglePlay();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black transition shadow-lg cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
            }`}
            title="Reproducir / Pausar (Barra Espaciadora)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play Video</span>
              </>
            )}
          </button>

          {/* Time Counter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[11px] text-slate-200 shadow-inner">
            <span className="text-rose-400 font-bold">{formatTime(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatTime(totalDuration)}</span>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-sans font-bold ml-1">
              30 FPS
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* Split / Scissors Tool */}
          <button
            onClick={handleSplitSlide}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Dividir escena en la posición actual del cursor (Split)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-bold">Dividir</span>
          </button>

          {/* Add Scene */}
          <button
            onClick={onAddSlide}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Añadir nueva diapositiva / escena al carrusel"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline text-[11px] font-bold">Añadir Escena</span>
          </button>
        </div>

        {/* Right: Aspect Ratio Info, Audio, Zoom & Render Button */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Badge */}
          <span className="hidden md:inline-flex items-center gap-1 bg-slate-950 text-slate-400 border border-slate-800 px-2 py-1 rounded-lg text-[10px] font-mono">
            <Video className="w-3 h-3 text-rose-400" />
            <span>{aspectRatio === '16:9' ? '16:9 TV/LED (1920x1080)' : aspectRatio}</span>
          </span>

          {/* Audio Track Menu Toggle */}
          <button
            onClick={() => openInspector('picker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              audioTrack
                ? 'bg-indigo-950/70 text-indigo-300 border-indigo-600/40 hover:bg-indigo-900/60'
                : 'bg-slate-800/70 text-slate-300 border-slate-700/80 hover:bg-slate-700'
            }`}
            title="Configurar pista de audio / música de fondo"
          >
            <Music className="w-3.5 h-3.5 text-indigo-400" />
            <span className="max-w-[120px] truncate">{audioTrack ? audioTrack.name : 'Música'}</span>
          </button>

          {/* Slide/Fotograma Inspector Toggle */}
          <button
            onClick={() => openInspector('slide', currentIndex)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              editingSlideIdx !== null
                ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                : 'bg-slate-800/70 text-slate-300 border-slate-700/80 hover:bg-slate-700'
            }`}
            title="Editar duración y efectos del fotograma actual"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Editar Fotograma</span>
          </button>

          {/* Timeline Zoom Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Alejar línea de tiempo"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Acercar línea de tiempo"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expand/Collapse Timeline Height */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title={isExpanded ? 'Reducir altura' : 'Expandir altura de línea de tiempo'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* PRIMARY: Export Video MP4 Button */}
          <button
            onClick={onOpenExportVideo}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg shadow-rose-950/60 transition group cursor-pointer"
            title="Renderizar y exportar video profesional (MP4 / WebM)"
          >
            <Film className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Renderizar Video</span>
          </button>
        </div>
      </div>

      {/* 2. Audio Library Drawer Popover */}
      {isAudioPickerOpen && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">Pista Musical:</span>
            <span className="text-slate-400">
              {audioTrack ? `${audioTrack.name} (Vol: ${Math.round((audioTrack.volume ?? 0.8) * 100)}%)` : 'Sin audio seleccionado'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Presets Select */}
            <select
              value={audioTrack?.url.startsWith('preset:') ? audioTrack.url.replace('preset:', '') : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onUpdateAudioTrack(null);
                  return;
                }
                const preset = AUDIO_PRESETS.find((p) => p.id === val);
                if (preset) {
                  const newT: VideoAudioTrack = {
                    url: `preset:${preset.id}`,
                    name: preset.name,
                    volume: 0.85,
                    isMuted: false,
                    loop: true,
                  };
                  onUpdateAudioTrack(newT);
                  handleAudition(newT);
                }
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Elegir Pista de la Galería --</option>
              {AUDIO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.bpm} BPM)
                </option>
              ))}
            </select>

            {/* Quick Audition Sample Button */}
            {audioTrack && (
              <button
                onClick={() => handleAudition(audioTrack)}
                className="flex items-center gap-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Escuchar una muestra de audio"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudition ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} />
                <span>{isPlayingAudition ? 'Sonando muestra...' : 'Probar Audio'}</span>
              </button>
            )}

            {/* Upload MP3/WAV Button */}
            <input
              ref={audioFileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioUpload}
            />
            <button
              onClick={() => audioFileInputRef.current?.click()}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Subir MP3 / WAV</span>
            </button>

            {/* Advanced Audio Editor Toggle */}
            {audioTrack && (
              <button
                onClick={() => openInspector('audio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  isAudioEditorOpen
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-indigo-950/60 border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/60'
                }`}
                title="Editar recorte (achicar/agrandar), velocidad, fade in/out y efectos de audio"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isAudioEditorOpen ? 'Ocultar Estudio de Audio' : 'Ajustes, Recorte y Efectos'}</span>
              </button>
            )}

            {/* Volume Slider if audio is active */}
            {audioTrack && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl">
                <button
                  onClick={() => onUpdateAudioTrack({ ...audioTrack, isMuted: !audioTrack.isMuted })}
                  className="text-slate-400 hover:text-white"
                >
                  {audioTrack.isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioTrack.isMuted ? 0 : (audioTrack.volume ?? 0.85)}
                  onChange={(e) => onUpdateAudioTrack({ ...audioTrack, volume: parseFloat(e.target.value), isMuted: false })}
                  className="w-16 accent-indigo-500 cursor-pointer"
                  title={`Volumen: ${Math.round((audioTrack.volume ?? 0.85) * 100)}%`}
                />
                <button
                  onClick={() => {
                    onUpdateAudioTrack(null);
                    setIsAudioEditorOpen(false);
                  }}
                  className="text-slate-500 hover:text-rose-400 ml-1"
                  title="Quitar audio"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsAudioPickerOpen(false)}
              className="text-slate-400 hover:text-white text-xs underline ml-2 cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>
        </div>
      )}

      {/* 2.1 Full Audio Trimming, Speed, Fade & Effects Studio Panel */}
      {audioTrack && isAudioEditorOpen && (
        <div className="bg-slate-900/95 border-b border-indigo-900/50 p-4 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="font-bold text-white text-sm">Estudio de Audio Profesional:</span>
              <span className="text-indigo-300 font-medium">{audioTrack.name}</span>
            </div>
            <button
              onClick={() => setIsAudioEditorOpen(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cerrar Panel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Box 1: Recorte y Duración (Achicar / Agrandar) */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-indigo-400" />
                  Achicar / Agrandar Audio
                </span>
                <span className="text-[11px] font-bold text-indigo-400">
                  {audioTrack.duration ? `${audioTrack.duration.toFixed(1)}s` : `${totalDuration.toFixed(1)}s`}
                </span>
              </div>

              {/* Start Offset */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Punto de Inicio (Corte inicial):</span>
                  <span className="font-bold text-slate-200">{(audioTrack.startOffset || 0).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(10, totalDuration)}
                  step="0.5"
                  value={audioTrack.startOffset || 0}
                  onChange={(e) => onUpdateAudioTrack({ ...audioTrack, startOffset: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Duration Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Duración en Video:</span>
                  <span className="font-bold text-indigo-300">
                    {(audioTrack.duration || totalDuration).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(120, Math.ceil(totalDuration) + 30)}
                  step="0.5"
                  value={audioTrack.duration || totalDuration}
                  onChange={(e) => onUpdateAudioTrack({ ...audioTrack, duration: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  onClick={() => onUpdateAudioTrack({ ...audioTrack, startOffset: 0, duration: slidesDuration })}
                  className="flex-1 min-w-[100px] bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 text-indigo-300 py-1 px-2 rounded-lg text-[10px] font-bold text-center transition"
                  title="Ajustar la duración exacta de todas las diapositivas juntas"
                >
                  Ajustar a Escenas ({slidesDuration.toFixed(1)}s)
                </button>
                <button
                  onClick={() => onUpdateAudioTrack({ ...audioTrack, duration: 15 })}
                  className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition ${
                    audioTrack.duration === 15 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  15s
                </button>
                <button
                  onClick={() => onUpdateAudioTrack({ ...audioTrack, duration: 30 })}
                  className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition ${
                    audioTrack.duration === 30 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  30s
                </button>
                <button
                  onClick={() => onUpdateAudioTrack({ ...audioTrack, duration: 60 })}
                  className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition ${
                    audioTrack.duration === 60 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  60s
                </button>
                <button
                  onClick={() => onUpdateAudioTrack({ ...audioTrack, loop: !audioTrack.loop })}
                  className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition ${
                    audioTrack.loop
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Repetir audio en bucle automáticamente"
                >
                  Loop {audioTrack.loop ? '✓' : ''}
                </button>
              </div>
            </div>

            {/* Box 2: Velocidad de Reproducción */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Velocidad de Audio
                </span>
                <span className="text-[11px] font-bold text-amber-400">
                  {audioTrack.speed || 1}x
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => {
                  const isActive = (audioTrack.speed || 1.0) === spd;
                  return (
                    <button
                      key={spd}
                      onClick={() => onUpdateAudioTrack({ ...audioTrack, speed: spd })}
                      className={`py-1.5 rounded-xl border text-[11px] font-black transition ${
                        isActive
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-500">
                Ajusta el tempo musical. Valores más altos aceleran el ritmo para videos dinámicos; valores más bajos dan calma.
              </p>
            </div>

            {/* Box 3: Fundidos Profesionales (Fades) */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl space-y-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Fundidos (Fades Suaves)
              </span>

              {/* Fade In */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Fade In (Aparición gradual):</span>
                  <span className="font-bold text-emerald-400">{(audioTrack.fadeIn || 0).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.2"
                  value={audioTrack.fadeIn || 0}
                  onChange={(e) => onUpdateAudioTrack({ ...audioTrack, fadeIn: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Fade Out */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Fade Out (Desvanecimiento final):</span>
                  <span className="font-bold text-emerald-400">{(audioTrack.fadeOut || 0).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.2"
                  value={audioTrack.fadeOut || 0}
                  onChange={(e) => onUpdateAudioTrack({ ...audioTrack, fadeOut: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1 pt-1">
                <button
                  onClick={() => onUpdateAudioTrack({ ...audioTrack, fadeIn: 1.5, fadeOut: 2.0 })}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1 px-2 rounded-lg text-[10px] font-bold text-center transition"
                >
                  Fade Óptimo (1.5s / 2.0s)
                </button>
              </div>
            </div>

            {/* Box 4: Efectos DSP y Ecualización */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl space-y-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Efectos DSP & Masterización
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'none', label: 'Natural / Puro', desc: 'Sin procesar' },
                  { id: 'bass_boost', label: 'Graves Potentes', desc: '+7.5dB Bass' },
                  { id: 'reverb_hall', label: 'Reverb Espacial', desc: 'Sala acústica' },
                  { id: 'lowpass_filter', label: 'Filtro Sumergido', desc: 'Intro suave' },
                  { id: 'high_energy', label: 'Punch Comercial', desc: 'Compresor master' },
                  { id: 'vintage_radio', label: 'Radio Retro', desc: 'Filtro de época' },
                ].map((eff) => {
                  const isActive = (audioTrack.audioEffect || 'none') === eff.id;
                  return (
                    <button
                      key={eff.id}
                      onClick={() => onUpdateAudioTrack({ ...audioTrack, audioEffect: eff.id as any })}
                      className={`p-1.5 rounded-xl border text-[10px] text-left transition ${
                        isActive
                          ? 'bg-pink-600 border-pink-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="font-bold truncate">{eff.label}</div>
                      <div className="text-[9px] opacity-75 truncate">{eff.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2.2 Inspector Panel for Slide / Fotograma Editor */}
      {editingSlideIdx !== null && slides[editingSlideIdx] && (
        <div className="bg-slate-900/98 border-b border-rose-900/60 p-4 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-bold text-white text-sm">
                Editor de Fotograma: Escena {editingSlideIdx + 1} ({slides[editingSlideIdx].badge || 'Diapositiva'})
              </span>
              <span className="text-slate-400">
                • {slides[editingSlideIdx].title ? `"${slides[editingSlideIdx].title.substring(0, 35)}..."` : ''}
              </span>
            </div>
            <button
              onClick={() => setEditingSlideIdx(null)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cerrar Panel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Box 1: Duración del Fotograma */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  Duración del Fotograma
                </span>
                <span className="text-xs font-bold text-rose-400 font-mono">
                  {(slides[editingSlideIdx].duration || 3.5).toFixed(1)}s
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={slides[editingSlideIdx].duration || 3.5}
                onChange={(e) =>
                  onUpdateSlide(editingSlideIdx, { duration: parseFloat(e.target.value) })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />

              <div className="flex items-center justify-between gap-1 pt-1">
                {[2, 3.5, 5, 8, 12, 20].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => onUpdateSlide(editingSlideIdx, { duration: dur })}
                    className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition ${
                      Math.abs((slides[editingSlideIdx].duration || 3.5) - dur) < 0.1
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            {/* Box 2: Animación y Efecto de Cámara */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl space-y-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Animación / Movimiento de Cámara
                </span>
                <span className="text-[11px] text-slate-400">
                  {EFFECTS.find((e) => e.id === (slides[editingSlideIdx].effect || 'ken_burns_zoom_in'))?.desc}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                {EFFECTS.map((eff) => {
                  const isActive = (slides[editingSlideIdx].effect || 'ken_burns_zoom_in') === eff.id;
                  return (
                    <button
                      key={eff.id}
                      onClick={() => onUpdateSlide(editingSlideIdx, { effect: eff.id })}
                      className={`p-1.5 rounded-xl border text-[10px] text-left transition flex items-center justify-between ${
                        isActive
                          ? 'bg-rose-600 border-rose-500 text-white font-bold shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                      title={eff.desc}
                    >
                      <span className="truncate">{eff.name}</span>
                      {isActive && <Check className="w-3 h-3 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Box 3: Transición de Unión con Siguiente Escena & Acciones */}
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  Transición hacia Sig. Escena
                </span>
              </div>

              <select
                value={slides[editingSlideIdx].transition || 'crossfade'}
                onChange={(e) =>
                  onUpdateSlide(editingSlideIdx, { transition: e.target.value as TransitionType })
                }
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
              >
                {TRANSITIONS.map((trans) => (
                  <option key={trans.id} value={trans.id}>
                    {trans.icon} {trans.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onDuplicateSlide(editingSlideIdx)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition flex items-center justify-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicar</span>
                </button>
                {slides.length > 1 && (
                  <button
                    onClick={() => {
                      onDeleteSlide(editingSlideIdx);
                      setEditingSlideIdx(null);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 font-bold text-[11px] transition flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2.3 Inspector Panel for Transition Selection */}
      {selectedTransitionIdx !== null && (
        <div className="bg-slate-900/98 border-b border-rose-900/60 p-4 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="font-bold text-white text-sm">
                Transición de Unión: Escena {selectedTransitionIdx + 1} ➔ Escena {selectedTransitionIdx + 2}
              </span>
              <span className="text-slate-400">
                (Actúa en la unión entre el final de la escena {selectedTransitionIdx + 1} y el inicio de la escena {selectedTransitionIdx + 2})
              </span>
            </div>
            <button
              onClick={() => setSelectedTransitionIdx(null)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cerrar Panel</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TRANSITIONS.map((trans) => {
              const currentTrans = slides[selectedTransitionIdx]?.transition || 'crossfade';
              const isActive = currentTrans === trans.id;
              return (
                <button
                  key={trans.id}
                  onClick={() => {
                    onUpdateSlide(selectedTransitionIdx, { transition: trans.id });
                    setSelectedTransitionIdx(null);
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{trans.icon}</span>
                  <span>{trans.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Multi-Track Scrollable Timeline */}
      <div
        ref={trackContainerRef}
        onPointerDown={handleTrackPointerDown}
        className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative select-none cursor-pointer bg-slate-950 border-t border-slate-800/80"
        style={{ minHeight: isExpanded ? '300px' : '220px', height: isExpanded ? '310px' : '230px' }}
      >
        {/* Playhead Red Cursor Line (Syncs smoothly with currentTime) */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
          style={{
            left: `${currentTime * pxPerSec}px`,
            transition: isPlaying ? 'none' : 'left 0.05s ease-out',
          }}
        >
          {/* Scrubber Pin / Head */}
          <div className="w-3.5 h-3.5 bg-rose-500 rotate-45 -mt-1.5 shadow-md shadow-rose-950 ring-2 ring-white" />
          <div className="w-[2px] h-full bg-rose-500 shadow-sm shadow-rose-950" />
        </div>

        {/* Dynamic Time Ruler Header */}
        <div
          className="sticky top-0 z-20 h-7 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm flex items-end"
          style={{ width: `${totalDuration * pxPerSec + 200}px` }}
        >
          {Array.from({ length: Math.ceil(totalDuration) + 2 }).map((_, sec) => {
            const leftPos = sec * pxPerSec;
            return (
              <div
                key={`ruler-${sec}`}
                className="absolute bottom-0 flex flex-col items-start border-l border-slate-700/60 pl-1 pb-0.5 text-[9px] font-mono text-slate-400"
                style={{ left: `${leftPos}px`, height: sec % 5 === 0 ? '100%' : '50%' }}
              >
                {sec % (zoomLevel < 1 ? 5 : 2) === 0 && `${sec}s`}
              </div>
            );
          })}
        </div>

        {/* Tracks Workspace */}
        <div
          className="p-3 space-y-2 relative"
          style={{ width: `${totalDuration * pxPerSec + 200}px` }}
        >
          {/* TRACK 1: Video / Scenes Clips */}
          <div className="flex items-center">
            {slides.map((slide, idx) => {
              const timing = slideTimings[idx];
              const isSelected = currentIndex === idx;
              const hasEffect = slide.effect && slide.effect !== 'none';
              const effectLabel = EFFECTS.find((e) => e.id === slide.effect)?.name || 'Ken Burns';

              return (
                <React.Fragment key={`slide-clip-${slide.id}-${idx}`}>
                  {/* Scene Clip Block */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSlide(idx);
                    }}
                    className={`h-24 rounded-2xl p-2 border-2 transition-all flex flex-col justify-between relative group cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'border-rose-500 bg-slate-900 shadow-lg shadow-rose-950/40'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                    style={{ width: `${timing.widthPx}px` }}
                  >
                    {/* Background Preview Thumbnail */}
                    {slide.image && (
                      <div
                        className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none group-hover:opacity-30 transition-opacity"
                        style={{ backgroundImage: `url(${slide.image})` }}
                      />
                    )}

                    {/* Clip Top Bar */}
                    <div className="flex items-center justify-between gap-1 z-10">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950/90 text-rose-300 px-2 py-0.5 rounded-lg border border-slate-800">
                        {slide.badge || `Escena ${idx + 1}`}
                      </span>

                      {/* Quick Duration + / - */}
                      <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-lg px-1 py-0.5 text-[10px] font-mono text-slate-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateSlide(idx, { duration: Math.max(1, timing.duration - 0.5) });
                          }}
                          className="hover:text-rose-400 font-bold px-0.5"
                          title="Reducir 0.5s"
                        >
                          -
                        </button>
                        <span>{timing.duration.toFixed(1)}s</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateSlide(idx, { duration: timing.duration + 0.5 });
                          }}
                          className="hover:text-rose-400 font-bold px-0.5"
                          title="Aumentar 0.5s"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Clip Title Excerpt */}
                    <div className="z-10 text-[11px] font-bold text-slate-200 truncate max-w-full">
                      {slide.title || 'Diapositiva'}
                    </div>

                    {/* Clip Bottom: Motion Effect Pill & Tools */}
                    <div className="flex items-center justify-between gap-1 z-10 pt-1 border-t border-slate-800/80">
                      {/* Effect Pill (Click to choose motion / fotograma effect) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInspector('slide', idx);
                        }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 transition ${
                          hasEffect
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40 hover:bg-rose-900'
                            : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                        title="Configurar efecto de cámara / animación de fotogramas"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                        <span className="truncate max-w-[80px]">{hasEffect ? effectLabel : 'Fotograma'}</span>
                      </button>

                      {/* Quick Duplicate / Delete on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateSlide(idx);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Duplicar escena"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                        {slides.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSlide(idx);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                            title="Eliminar escena"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transition Pill Between Slides */}
                  {idx < slides.length - 1 && (
                    <div className="relative flex items-center justify-center -mx-1 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInspector('transition', idx);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all shadow-md border ${
                          slide.transition && slide.transition !== 'none'
                            ? 'bg-rose-600 border-rose-400 text-white hover:scale-110'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                        title={`Transición hacia escena ${idx + 2}: ${slide.transition || 'Crossfade'}`}
                      >
                        {TRANSITIONS.find((t) => t.id === slide.transition)?.icon || '⤭'}
                      </button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Audio Extended Hold Zone */}
            {totalDuration > slidesDuration && (
              <div
                className="h-24 rounded-2xl p-2 border border-dashed border-indigo-700/50 bg-indigo-950/20 text-indigo-300 flex flex-col justify-center items-center text-center select-none shrink-0"
                style={{ width: `${Math.max(120, (totalDuration - slidesDuration) * pxPerSec)}px` }}
                title="La última escena se mantiene en pantalla mientras el audio continúa sonando"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                  <Music className="w-3 h-3 animate-pulse" />
                  <span>Audio Extendido</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-mono">
                  +{(totalDuration - slidesDuration).toFixed(1)}s (Hold)
                </span>
              </div>
            )}
          </div>

          {/* TRACK 2: Audio Track Representation */}
          <div className="flex items-center relative py-1">
            {audioTrack ? (
              <div
                className="relative group transition-all"
                style={{
                  marginLeft: `${Math.max(0, (audioTrack.startOffset || 0) * pxPerSec)}px`,
                  width: `${Math.max(120, ((audioTrack.duration || (totalDuration - (audioTrack.startOffset || 0)))) * pxPerSec)}px`,
                }}
              >
                {/* Main Audio Block */}
                <div
                  onClick={() => openInspector('audio')}
                  className="h-14 rounded-2xl px-3 py-1.5 border border-indigo-500/50 bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-indigo-950/80 text-indigo-200 flex items-center justify-between shadow-lg shadow-indigo-950/40 cursor-pointer hover:border-indigo-400 transition"
                  title="Haz clic para abrir el Estudio de Audio Profesional (Recorte, Velocidad, Fades y Efectos)"
                >
                  {/* Left Trim Handle Button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const curStart = audioTrack.startOffset || 0;
                      onUpdateAudioTrack({ ...audioTrack, startOffset: Math.max(0, curStart - 0.5) });
                    }}
                    className="w-4 h-full -ml-2.5 rounded-l-xl bg-indigo-600/30 hover:bg-indigo-500 flex items-center justify-center text-indigo-200 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Alargar inicio (-0.5s)"
                  >
                    ◀
                  </div>

                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-xs font-black text-white truncate">
                        {audioTrack.name}
                      </span>
                    </div>

                    {/* Meta tags (Speed, Fades, Effects) */}
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-bold">
                      <span className="bg-indigo-900/60 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-700/50">
                        {audioTrack.duration ? `${audioTrack.duration.toFixed(1)}s` : `${totalDuration.toFixed(1)}s`}
                      </span>
                      {audioTrack.speed && audioTrack.speed !== 1 && (
                        <span className="bg-amber-950/80 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700/50">
                          {audioTrack.speed}x
                        </span>
                      )}
                      {((audioTrack.fadeIn || 0) > 0 || (audioTrack.fadeOut || 0) > 0) && (
                        <span className="bg-emerald-950/80 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/50">
                          Fades: {audioTrack.fadeIn || 0}s / {audioTrack.fadeOut || 0}s
                        </span>
                      )}
                      {audioTrack.audioEffect && audioTrack.audioEffect !== 'none' && (
                        <span className="bg-pink-950/80 text-pink-300 px-1.5 py-0.2 rounded border border-pink-700/50">
                          FX: {audioTrack.audioEffect}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Waveform graphic visualization */}
                  <div className="flex items-center gap-0.5 opacity-70 shrink-0">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={`wave-${i}`}
                        className="w-1 rounded-full bg-indigo-400"
                        style={{
                          height: `${8 + Math.sin(i * 0.7) * 9 + (i % 4 === 0 ? 8 : 2)}px`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Right Trim Handle Button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const curDur = audioTrack.duration || totalDuration;
                      onUpdateAudioTrack({ ...audioTrack, duration: Math.max(1, curDur + 0.5) });
                    }}
                    className="w-4 h-full -mr-2.5 rounded-r-xl bg-indigo-600/30 hover:bg-indigo-500 flex items-center justify-center text-indigo-200 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Agrandar duración (+0.5s)"
                  >
                    ▶
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsAudioPickerOpen(true)}
                className="h-12 rounded-xl px-3 py-1.5 border border-dashed border-slate-800 text-slate-500 hover:border-indigo-600/50 hover:text-indigo-400 bg-slate-900/30 flex items-center justify-between cursor-pointer transition-all"
                style={{ width: `${totalDuration * pxPerSec}px` }}
              >
                <div className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-bold">
                    + Añadir pista de audio / música de fondo
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
