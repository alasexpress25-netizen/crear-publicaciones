import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Maximize2,
  Minimize2,
  Music,
  Video,
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Layout,
  Download,
  Scissors,
  Layers,
  Volume2,
  VolumeX,
  Clock,
  Film,
  Zap,
  Type,
} from 'lucide-react';
import { Slide, BrandInfo, AspectRatio, TransitionType, SceneMotionEffect, VideoAudioTrack, SubtitleItem, VoiceoverTrack, AudioChannelLane } from '../types';
import { CanvasSlide } from './CanvasSlide';
import { Timeline } from './Timeline';
import { getActiveTransitionState, VideoPreviewPlayer } from '../utils/transitionEngine';

interface VideoStudioViewProps {
  slides: Slide[];
  currentIndex: number;
  brand: BrandInfo;
  aspectRatio: AspectRatio;
  audioTrack: VideoAudioTrack | null;
  subtitles?: SubtitleItem[];
  onUpdateSubtitles?: (subtitles: SubtitleItem[]) => void;
  voiceoverTrack?: VoiceoverTrack | null;
  onUpdateVoiceoverTrack?: (track: VoiceoverTrack | null) => void;
  sfxClips?: VideoAudioTrack[];
  onUpdateSfxClips?: (clips: VideoAudioTrack[]) => void;
  audioChannels?: AudioChannelLane[];
  onUpdateAudioChannels?: (channels: AudioChannelLane[]) => void;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSelectSlide: (index: number) => void;
  onUpdateSlide: (index: number, partial: Partial<Slide>) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onReorderSlides: (startIndex: number, endIndex: number) => void;
  onUpdateAudioTrack: (track: VideoAudioTrack | null) => void;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  onSwitchToSlideEditor: (index?: number) => void;
  onOpenExportVideo: () => void;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  slides,
  currentIndex,
  brand,
  aspectRatio,
  audioTrack,
  subtitles = [],
  onUpdateSubtitles,
  voiceoverTrack = null,
  onUpdateVoiceoverTrack,
  sfxClips,
  onUpdateSfxClips,
  audioChannels,
  onUpdateAudioChannels,
  isPlaying,
  currentTime,
  onTogglePlay,
  onSeek,
  onSelectSlide,
  onUpdateSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides,
  onUpdateAudioTrack,
  onChangeAspectRatio,
  onSwitchToSlideEditor,
  onOpenExportVideo,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Arrow keys to step back/forward 1s
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(currentTime + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSeek, currentTime]);

  // Compute exact timings for all slides
  const { slideTimings, slidesDuration, totalDuration } = useMemo(() => {
    let accumulated = 0;
    const timings = slides.map((s, idx) => {
      const raw = s.duration || 3.5;
      const sp = s.speed || 1;
      const dur = Math.max(1, raw / sp);
      const start = accumulated;
      accumulated += dur;
      const end = accumulated;

      // Next slide duration for transition calculation
      const nextDur = slides[idx + 1] ? Math.max(1, (slides[idx + 1].duration || 3.5) / (slides[idx + 1].speed || 1)) : 3.5;
      const transitionType = s.transition || 'crossfade';
      const transDur = transitionType !== 'none'
        ? Math.min(1.2, dur * 0.45, nextDur * 0.45)
        : 0;

      return {
        index: idx,
        slide: s,
        duration: dur,
        startTime: start,
        endTime: end,
        transition: transitionType,
        transDuration: transDur,
        effect: s.effect || 'ken_burns_zoom_in',
      };
    });

    const sDur = Math.max(1, accumulated);
    const audioEnd = audioTrack ? (audioTrack.startOffset || 0) + (audioTrack.duration || sDur) : 0;
    const tDur = Math.max(1, sDur, audioEnd);

    return { slideTimings: timings, slidesDuration: sDur, totalDuration: tDur };
  }, [slides, audioTrack]);

  // Active slide & transition state from unified engine
  const transitionInfo = useMemo(() => {
    return getActiveTransitionState(slides, currentTime);
  }, [slides, currentTime]);

  const activeSlideIndex = transitionInfo.slideIndexA;
  const transitionState = transitionInfo.isTransitioning ? transitionInfo : null;

  // Format time mm:ss.d
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  };

  // Aspect ratio class helper - explicit max widths ensure CSS aspect-ratio remains solid during transitions across all formats
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '4:5':
        return 'aspect-[4/5] max-h-[540px] w-full max-w-[432px]';
      case '9:16':
        return 'aspect-[9/16] max-h-[580px] w-full max-w-[326px]';
      case '1:1':
        return 'aspect-square max-h-[520px] w-full max-w-[520px]';
      case '16:9':
        return 'aspect-[16/9] max-h-[440px] w-full max-w-3xl';
      default:
        return 'aspect-[4/5] max-h-[540px] w-full max-w-[432px]';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 overflow-y-auto pb-24">
      {/* Top Header Bar inside Video Studio */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onSwitchToSlideEditor(activeSlideIndex)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            title="Volver a la vista del lienzo para editar textos y elementos"
          >
            <Layout className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Volver a</span>
            <span>Lienzo</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <Film className="w-4 h-4 text-rose-500" />
              <span>Estudio de Video & Animación</span>
            </h2>
            <span className="bg-rose-950/80 border border-rose-600/40 text-rose-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* Aspect Ratio Picker & Export Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs font-bold">
            {(['4:5', '9:16', '1:1', '16:9'] as AspectRatio[]).map((r) => (
              <button
                key={r}
                onClick={() => onChangeAspectRatio(r)}
                className={`px-2 py-1 rounded-lg transition text-[11px] ${
                  aspectRatio === r
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenExportVideo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black shadow-lg shadow-rose-950/50 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar MP4</span>
          </button>
        </div>
      </div>

      {/* Main Theater Player Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 min-h-[440px]">
        {/* Theater Monitor Frame */}
        <div
          ref={playerContainerRef}
          className="relative w-full flex flex-col items-center justify-center group"
        >
          <div
            className={`relative rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-slate-800/80 bg-slate-950 flex items-center justify-center transition-all ${getAspectClass()}`}
          >
            {/* Active Video Surface */}
            <VideoPreviewPlayer
              slides={slides}
              brand={brand}
              aspectRatio={aspectRatio}
              currentTime={currentTime}
              subtitles={subtitles}
            />

            {/* Click-to-Play Overlay */}
            <div
              onClick={onTogglePlay}
              className="absolute inset-0 bg-transparent flex items-center justify-center cursor-pointer z-20 group/overlay"
            >
              {!isPlaying && (
                <div className="w-16 h-16 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-950/80 transition transform group-hover/overlay:scale-110">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              )}
            </div>

            {/* Top Scene Info Badge inside Theater */}
            <div className="absolute top-3 left-3 z-30 pointer-events-none flex items-center gap-2">
              <span className="bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-lg">
                Escena {activeSlideIndex + 1} de {slides.length}
              </span>
              {transitionState && (
                <span className="bg-rose-950/90 backdrop-blur-md border border-rose-500/60 text-rose-300 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg animate-pulse flex items-center gap-1">
                  <Zap className="w-3 h-3 text-rose-400" />
                  Transición: {transitionState.type} ({Math.round(transitionState.progress * 100)}%)
                </span>
              )}
            </div>

            {/* Edit Current Slide Floating Shortcut */}
            <button
              onClick={() => onSwitchToSlideEditor(activeSlideIndex)}
              className="absolute top-3 right-3 z-30 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <Scissors className="w-3 h-3 text-rose-400" />
              <span>Editar Diapositiva</span>
            </button>
          </div>

          {/* Floating Player Control Bar */}
          <div className="w-full max-w-xl mt-4 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 shadow-xl flex flex-col gap-2">
            {/* Scrubber Progress Bar */}
            <div
              className="w-full h-2 bg-slate-950 rounded-full overflow-hidden cursor-pointer relative group/bar"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                onSeek(ratio * totalDuration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-pink-500 rounded-full transition-all duration-75"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>

            {/* Transport Buttons */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Skip back scene */}
                <button
                  onClick={() => {
                    const prevIdx = Math.max(0, activeSlideIndex - 1);
                    onSeek(slideTimings[prevIdx]?.startTime || 0);
                  }}
                  disabled={activeSlideIndex === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                  title="Escena anterior"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Rewind 2s */}
                <button
                  onClick={() => onSeek(Math.max(0, currentTime - 2))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer flex items-center text-[10px] font-bold"
                  title="Retroceder 2 segundos"
                >
                  <Rewind className="w-3.5 h-3.5 mr-0.5" />
                  -2s
                </button>

                {/* Main Play / Pause */}
                <button
                  onClick={onTogglePlay}
                  className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 transition cursor-pointer"
                  title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Forward 2s */}
                <button
                  onClick={() => onSeek(Math.min(totalDuration, currentTime + 2))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer flex items-center text-[10px] font-bold"
                  title="Avanzar 2 segundos"
                >
                  +2s
                  <FastForward className="w-3.5 h-3.5 ml-0.5" />
                </button>

                {/* Skip next scene */}
                <button
                  onClick={() => {
                    const nextIdx = Math.min(slides.length - 1, activeSlideIndex + 1);
                    onSeek(slideTimings[nextIdx]?.startTime || 0);
                  }}
                  disabled={activeSlideIndex >= slides.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                  title="Siguiente escena"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Restart from beginning */}
                <button
                  onClick={() => onSeek(0)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                  title="Reiniciar desde el inicio"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Timecode & Audio / Subtitle Pills */}
              <div className="flex items-center gap-2">
                {subtitles && subtitles.length > 0 && (
                  <div className="hidden md:flex items-center gap-1 text-[11px] text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded-lg shadow-sm">
                    <Type className="w-3 h-3 text-amber-400" />
                    <span>{subtitles.length} Subs (TTS)</span>
                  </div>
                )}
                {audioTrack && (
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-lg">
                    <Music className="w-3 h-3" />
                    <span className="truncate max-w-[110px]">{audioTrack.name}</span>
                    <span className="font-bold">({(audioTrack.duration || totalDuration).toFixed(0)}s)</span>
                  </div>
                )}
                <span className="font-mono text-xs font-black text-slate-200">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large Multi-Track Timeline & Audio Studio Integration */}
      <div className="w-full border-t border-slate-800/80 bg-slate-950">
        <div className="p-2 sm:px-6 sm:py-3 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              Línea de Tiempo Multitrack
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({slides.length} escenas • {totalDuration.toFixed(1)}s en total)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Tip: Haz clic en cualquier escena para editar duración o efectos</span>
          </div>
        </div>

        <Timeline
          slides={slides}
          currentIndex={activeSlideIndex}
          aspectRatio={aspectRatio}
          audioTrack={audioTrack}
          subtitles={subtitles}
          onUpdateSubtitles={onUpdateSubtitles}
          voiceoverTrack={voiceoverTrack}
          onUpdateVoiceoverTrack={onUpdateVoiceoverTrack}
          sfxClips={sfxClips}
          onUpdateSfxClips={onUpdateSfxClips}
          audioChannels={audioChannels}
          onUpdateAudioChannels={onUpdateAudioChannels}
          onSelectSlide={(idx) => {
            onSelectSlide(idx);
            onSeek(slideTimings[idx]?.startTime || 0);
          }}
          onUpdateSlide={onUpdateSlide}
          onAddSlide={onAddSlide}
          onDuplicateSlide={onDuplicateSlide}
          onDeleteSlide={onDeleteSlide}
          onReorderSlides={onReorderSlides}
          onUpdateAudioTrack={onUpdateAudioTrack}
          onOpenExportVideo={onOpenExportVideo}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          currentTime={currentTime}
          onSeek={onSeek}
        />
      </div>
    </div>
  );
};
