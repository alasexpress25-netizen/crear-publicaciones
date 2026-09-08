import React, { useState, useRef } from 'react';
import {
  X,
  Film,
  Download,
  CheckCircle2,
  Tv,
  Smartphone,
  Square,
  Clapperboard,
  Sparkles,
  Music,
  Loader2,
  AlertCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { Slide, BrandInfo, AspectRatio, VideoAudioTrack, SubtitleItem, VoiceoverTrack } from '../types';
import { renderCarouselToVideo, RenderResult, RenderProgress } from '../utils/videoRenderer';
import { CanvasSlide } from './CanvasSlide';
import confetti from 'canvas-confetti';

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  brand: BrandInfo;
  currentAspectRatio: AspectRatio;
  audioTrack: VideoAudioTrack | null;
  subtitles?: SubtitleItem[];
  voiceoverTrack?: VoiceoverTrack | null;
  extraAudioTracks?: VideoAudioTrack[];
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  slides,
  brand,
  currentAspectRatio,
  audioTrack,
  subtitles,
  voiceoverTrack,
  extraAudioTracks,
}) => {
  const [aspect, setAspect] = useState<AspectRatio>(currentAspectRatio);
  const [quality, setQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setError(null);
    setResult(null);
    cancelRef.current = false;

    try {
      // Gather any existing DOM slide nodes
      const domMap: Record<number, HTMLElement | null> = {};
      slides.forEach((s) => {
        domMap[s.id] = document.getElementById(`export-dom-slide-${s.id}`) || null;
      });

      const res = await renderCarouselToVideo(
        slides,
        brand,
        {
          aspectRatio: aspect,
          quality,
          fps,
          audioTrack,
          subtitles,
          voiceoverTrack,
          extraAudioTracks,
          onProgress: (p) => setProgress(p),
          shouldCancel: () => cancelRef.current,
        },
        domMap
      );

      setResult(res);

      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      if (err?.message !== 'Render cancelado por el usuario') {
        setError(err?.message || 'Error durante el renderizado del video.');
      }
    } finally {
      setIsRendering(false);
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setIsRendering(false);
    setProgress(null);
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.filename;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Offscreen DOM container for pixel-perfect 1:1 render extraction */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0 overflow-hidden" aria-hidden="true">
        {slides.map((s) => (
          <div
            key={s.id}
            id={`export-dom-slide-${s.id}`}
            style={{
              width: aspect === '9:16' ? '370px' : aspect === '16:9' ? '550px' : '450px',
            }}
          >
            <CanvasSlide
              slide={s}
              brand={brand}
              aspectRatio={aspect}
              zoomLevel={1}
              activeElementKey={null}
              onSelectElement={() => {}}
              onUpdateField={() => {}}
              onUpdateBullet={() => {}}
              onUpdateBrand={() => {}}
              isExportMode={true}
            />
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/60">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Renderizador de Video Profesional</span>
                <span className="text-[10px] bg-rose-600/30 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                  ESTILO CLIPCHAMP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Convierte tus diapositivas con transiciones, efectos y audio en video de alta fidelidad
              </p>
            </div>
          </div>
          {!isRendering && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 1. Configuration State (when not rendering and no result yet) */}
        {!isRendering && !result && (
          <div className="space-y-4 text-xs">
            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-slate-300 font-bold mb-2">Formato de Salida del Video:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '16:9' as AspectRatio, name: '16:9 TV/LEDs', sub: '1920×1080', icon: Tv },
                  { id: '9:16' as AspectRatio, name: '9:16 Reel/TikTok', sub: '1080×1920', icon: Clapperboard },
                  { id: '4:5' as AspectRatio, name: '4:5 Instagram', sub: '1080×1350', icon: Smartphone },
                  { id: '1:1' as AspectRatio, name: '1:1 Cuadrado', sub: '1080×1080', icon: Square },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = aspect === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAspect(item.id)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-rose-950/60 border-rose-500 text-white shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-[11px]">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality & Framerate Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Resolución / Calidad:</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="1080p">1080p Full HD (Recomendado)</option>
                  <option value="720p">720p HD (Rápido)</option>
                  <option value="4k">4K Ultra HD (Máxima nitidez)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Fotogramas por Segundo (FPS):</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value={30}>30 FPS (Estándar Instagram/TV)</option>
                  <option value={60}>60 FPS (Ultra Fluido)</option>
                </select>
              </div>
            </div>

            {/* Summary info box */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Total de Escenas / Diapositivas:</span>
                <span className="font-bold text-white">{slides.length} diapositivas</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Pista de Audio:</span>
                <span className="font-bold text-indigo-400 flex items-center gap-1">
                  <Music className="w-3 h-3" />
                  {audioTrack ? audioTrack.name : 'Silenciado / Sin música'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Efectos aplicados:</span>
                <span className="text-slate-300 font-bold">Ken Burns, Transiciones cruzadas & Fade</span>
              </div>
            </div>

            {error && (
              <div className="bg-rose-950/50 border border-rose-600/50 p-3 rounded-xl flex items-center gap-2 text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Start Render Button */}
            <button
              onClick={handleStartRender}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm transition shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Comenzar Renderizado del Video</span>
            </button>
          </div>
        )}

        {/* 2. Rendering Progress State */}
        {isRendering && progress && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center mx-auto animate-spin">
              <Loader2 className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Generando tu Video...</h3>
              <p className="text-xs text-slate-400 font-medium">{progress.statusText}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-600 to-pink-500 h-full transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
              <span>Fotograma {progress.currentFrame} / {progress.totalFrames}</span>
              <span className="font-bold text-rose-400">{progress.percent}%</span>
            </div>

            <button
              onClick={handleCancel}
              className="text-xs text-slate-400 hover:text-rose-400 underline font-semibold transition"
            >
              Cancelar Renderizado
            </button>
          </div>
        )}

        {/* 3. Finished Result State */}
        {result && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">¡Video Renderizado con Éxito!</h3>
              <p className="text-xs text-slate-400">
                Formato {aspect} • Duración: {result.durationSeconds.toFixed(1)}s • Listo para descargar
              </p>
            </div>

            {/* Video Preview Player */}
            <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl max-h-64 flex items-center justify-center">
              <video
                src={result.url}
                controls
                autoPlay
                loop
                className="max-h-60 max-w-full rounded-xl"
              />
            </div>

            {/* Download Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Video ({result.filename.endsWith('mp4') ? 'MP4' : 'WebM'})</span>
              </button>

              <button
                onClick={() => {
                  setResult(null);
                  setProgress(null);
                }}
                className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition"
                title="Renderizar nuevamente"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
