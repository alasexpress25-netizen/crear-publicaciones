import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Upload,
  Play,
  Square,
  Check,
  Zap,
  Layers,
  Clock,
  Music,
  Plus,
  Copy,
  Trash2
} from 'lucide-react';
import { VideoAudioTrack, Slide } from '../../types';
import { SFX_PRESETS, SfxPreset } from '../../utils/audioLibrary';
import { previewAudio } from '../../utils/previewAudioEngine';

interface SfxPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  initialTime?: number | null;
  totalDuration: number;
  slides: Slide[];
  existingClips?: VideoAudioTrack[];
  onAddSfxClip: (clip: VideoAudioTrack) => void;
  onDeleteSfxClip?: (id: string) => void;
  onDuplicateSfxClip?: (id: string) => void;
}

export const SfxPickerModal: React.FC<SfxPickerModalProps> = ({
  isOpen,
  onClose,
  currentTime,
  initialTime,
  totalDuration,
  slides,
  existingClips = [],
  onAddSfxClip,
  onDeleteSfxClip,
  onDuplicateSfxClip,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('swoosh');
  const [tab, setTab] = useState<'presets' | 'upload'>('presets');
  const [volume, setVolume] = useState<number>(0.9);
  const [startOffset, setStartOffset] = useState<number>(() => {
    if (initialTime !== undefined && initialTime !== null) return initialTime;
    return Math.round(currentTime * 10) / 10;
  });
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [lastAddedFeedback, setLastAddedFeedback] = useState<string | null>(null);

  // Sync startOffset whenever modal opens or initialTime changes
  useEffect(() => {
    if (isOpen) {
      if (initialTime !== undefined && initialTime !== null) {
        setStartOffset(initialTime);
      } else {
        setStartOffset(Math.round(currentTime * 10) / 10);
      }
      setLastAddedFeedback(null);
    }
  }, [isOpen, initialTime, currentTime]);

  // Upload state
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('');
  const [customDuration, setCustomDuration] = useState<number>(1.5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Calculate slide start times for quick snapping
  let accumTime = 0;
  const slideSnaps = slides.map((s, idx) => {
    const st = accumTime;
    accumTime += s.duration || 3.5;
    return {
      index: idx,
      label: s.badge || `Escena ${idx + 1}`,
      time: Math.round(st * 10) / 10,
    };
  });

  const handlePreviewPreset = async (preset: SfxPreset) => {
    if (previewingId === preset.id) {
      previewAudio.stop();
      setPreviewingId(null);
      return;
    }

    setPreviewingId(preset.id);
    await previewAudio.previewSample({
      url: `sfx:${preset.id}`,
      name: preset.name,
      volume,
    }, preset.duration);

    setTimeout(() => {
      setPreviewingId((curr) => (curr === preset.id ? null : curr));
    }, preset.duration * 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomAudioName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomAudioUrl(dataUrl);

        // Probe duration
        const tempAudio = new Audio(dataUrl);
        tempAudio.onloadedmetadata = () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration)) {
            setCustomDuration(Math.round(tempAudio.duration * 10) / 10);
          }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const createClipObject = (): VideoAudioTrack => {
    const safeOffset = Math.max(0, Math.min(totalDuration, startOffset));

    if (tab === 'presets') {
      const preset = SFX_PRESETS.find((p) => p.id === selectedPresetId) || SFX_PRESETS[0];
      return {
        id: `sfx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        url: `sfx:${preset.id}`,
        name: preset.name,
        volume,
        startOffset: safeOffset,
        duration: preset.duration,
        channelType: 'sfx',
        loop: false,
        color: '#f43f5e',
      };
    } else {
      return {
        id: `sfx-custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        url: customAudioUrl || '',
        name: customAudioName || 'Efecto Personalizado',
        volume,
        startOffset: safeOffset,
        duration: customDuration,
        channelType: 'sfx',
        loop: false,
        color: '#f43f5e',
      };
    }
  };

  const handleAddAndClose = () => {
    const clip = createClipObject();
    onAddSfxClip(clip);
    onClose();
  };

  const handleAddAndKeepOpen = () => {
    const clip = createClipObject();
    onAddSfxClip(clip);
    setLastAddedFeedback(`¡"${clip.name}" agregado con éxito a los ${clip.startOffset?.toFixed(1)}s!`);

    // Auto-advance timestamp for convenience to the next scene or +2 seconds
    const currentOff = clip.startOffset || 0;
    const nextSnap = slideSnaps.find((s) => s.time > currentOff + 0.5);
    if (nextSnap) {
      setStartOffset(nextSnap.time);
    } else {
      setStartOffset(Math.min(totalDuration - 0.5, Math.round((currentOff + 2.0) * 10) / 10));
    }

    setTimeout(() => {
      setLastAddedFeedback(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Añadir Efectos de Sonido (SFX)
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-600/40 text-rose-300">
                  Canal A3 • Múltiples Efectos
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Puedes agregar tantos efectos como quieras en diferentes momentos y segundos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert if clip was just added */}
        {lastAddedFeedback && (
          <div className="bg-emerald-950/90 border-b border-emerald-600/60 px-4 py-2 flex items-center justify-between text-emerald-200 text-xs font-bold animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{lastAddedFeedback}</span>
            </div>
            <span className="text-[10px] text-emerald-300 font-medium">
              Puedes seleccionar otro efecto abajo para seguir enriqueciendo tu video
            </span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setTab('presets')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              tab === 'presets'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biblioteca de Presets SFX (8)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              tab === 'upload'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Audio Personalizado</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {tab === 'presets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SFX_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                const isPlaying = previewingId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{preset.icon}</span>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>{preset.name}</span>
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {preset.duration}s
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {preset.description}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewPreset(preset);
                        }}
                        className={`p-1.5 rounded-xl border transition shrink-0 ${
                          isPlaying
                            ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isPlaying ? 'Detener muestra' : 'Escuchar muestra'}
                      >
                        {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850">
                      <span className="text-[9px] uppercase font-mono text-rose-400/80">
                        {preset.category}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Seleccionado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-rose-500/60 rounded-3xl p-6 text-center cursor-pointer bg-slate-950/40 transition flex flex-col items-center justify-center gap-2.5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block">
                    {customAudioName || 'Haz clic para seleccionar un archivo de audio / SFX'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Soporta formatos MP3, WAV, OGG y M4A
                  </span>
                </div>
              </div>

              {customAudioUrl && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-rose-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">{customAudioName}</span>
                      <span className="text-[10px] font-mono text-slate-400">Duración: {customDuration}s</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      previewAudio.previewSample({
                        url: customAudioUrl,
                        name: customAudioName,
                        volume,
                      }, customDuration);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Escuchar</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timing & Position Adjuster */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                ¿En qué segundo de la línea de tiempo sonará este efecto?
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={totalDuration}
                  value={startOffset}
                  onChange={(e) => setStartOffset(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 text-white text-xs font-mono text-center rounded-lg px-1 py-1 focus:outline-none focus:border-rose-500"
                />
                <span className="text-xs text-slate-400 font-mono">s</span>
              </div>
            </div>

            {/* Quick Snap Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Alineación Rápida a Escenas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setStartOffset(Math.round(currentTime * 10) / 10)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-600/40 text-[10px] text-slate-300 font-bold transition flex items-center gap-1"
                >
                  <span>Cabezal actual ({currentTime.toFixed(1)}s)</span>
                </button>
                {slideSnaps.map((snap) => (
                  <button
                    key={`snap-${snap.index}`}
                    type="button"
                    onClick={() => setStartOffset(snap.time)}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition ${
                      Math.abs(startOffset - snap.time) < 0.1
                        ? 'bg-rose-950 border-rose-600/70 text-rose-300 font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    {snap.label} ({snap.time}s)
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Slider */}
            <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                Volumen del efecto
              </span>
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-300 w-10 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Existing Clips in Timeline List (Visibility & Management) */}
          {existingClips.length > 0 && (
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-rose-400" />
                  <span>Efectos ya colocados en la pista A3 ({existingClips.length})</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  Puedes seguir sumando más efectos arriba
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                {existingClips.map((clip) => {
                  const clipDur = clip.duration || 1.0;
                  return (
                    <div
                      key={clip.id}
                      className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                          {clip.name}
                        </span>
                        <span className="text-[10px] font-mono text-rose-300 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800/50 shrink-0">
                          {clip.startOffset?.toFixed(1)}s - {((clip.startOffset || 0) + clipDur).toFixed(1)}s
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => previewAudio.previewSample(clip, clipDur)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-white transition"
                          title="Escuchar"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        {onDuplicateSfxClip && (
                          <button
                            type="button"
                            onClick={() => onDuplicateSfxClip(clip.id)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-white transition"
                            title="Duplicar"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteSfxClip && (
                          <button
                            type="button"
                            onClick={() => onDeleteSfxClip(clip.id)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Multiple Add Options */}
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Listo / Cerrar
          </button>

          <div className="flex items-center gap-2">
            {/* Add and keep open button to add multiple effects in one session */}
            <button
              type="button"
              onClick={handleAddAndKeepOpen}
              disabled={tab === 'upload' && !customAudioUrl}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                tab === 'upload' && !customAudioUrl
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  : 'bg-rose-950/80 hover:bg-rose-900 border-rose-600/60 text-rose-200 hover:text-white'
              }`}
              title="Añade este efecto y mantén la ventana abierta para añadir otro efecto en otro segundo"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Añadir y Seguir Agregando</span>
            </button>

            {/* Add and Close */}
            <button
              type="button"
              onClick={handleAddAndClose}
              disabled={tab === 'upload' && !customAudioUrl}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg cursor-pointer ${
                tab === 'upload' && !customAudioUrl
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Añadir y Salir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
