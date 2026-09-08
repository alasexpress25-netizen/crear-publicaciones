import React, { useState, useRef } from 'react';
import {
  X,
  Music,
  Upload,
  Play,
  Square,
  Sparkles,
  Clock,
  Volume2,
  Plus
} from 'lucide-react';
import { VideoAudioTrack, Slide } from '../../types';
import { AUDIO_PRESETS, AudioPreset } from '../../utils/audioLibrary';
import { previewAudio } from '../../utils/previewAudioEngine';

interface AddAudioClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  channelNumber: number;
  currentTime: number;
  totalDuration: number;
  slides: Slide[];
  onAddClip: (clip: VideoAudioTrack) => void;
}

export const AddAudioClipModal: React.FC<AddAudioClipModalProps> = ({
  isOpen,
  onClose,
  channelName,
  channelNumber,
  currentTime,
  totalDuration,
  slides,
  onAddClip,
}) => {
  const [tab, setTab] = useState<'upload' | 'library'>('upload');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('lofi_chill_focus');
  const [volume, setVolume] = useState<number>(0.85);
  const [startOffset, setStartOffset] = useState<number>(() => Math.round(currentTime * 10) / 10);
  const [duration, setDuration] = useState<number>(() => Math.max(2, Math.round((totalDuration - currentTime) * 10) / 10));
  const [loop, setLoop] = useState<boolean>(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Upload state
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePreviewPreset = async (preset: AudioPreset) => {
    if (previewingId === preset.id) {
      previewAudio.stop();
      setPreviewingId(null);
      return;
    }

    setPreviewingId(preset.id);
    await previewAudio.previewSample({
      url: `preset:${preset.id}`,
      name: preset.name,
      volume,
    }, 6.0);

    setTimeout(() => {
      setPreviewingId((curr) => (curr === preset.id ? null : curr));
    }, 6000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setCustomUrl(url);
    setCustomName(cleanName);

    const temp = new Audio(url);
    temp.onloadedmetadata = () => {
      if (temp.duration && !isNaN(temp.duration)) {
        setDuration(Math.round(temp.duration * 10) / 10);
      }
    };
  };

  const handleConfirmAdd = () => {
    const safeOffset = Math.max(0, Math.min(totalDuration, startOffset));
    const safeDur = Math.max(0.5, duration);

    if (tab === 'upload' && customUrl) {
      const newClip: VideoAudioTrack = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        url: customUrl,
        name: customName || `Clip ${channelName}`,
        volume,
        startOffset: safeOffset,
        duration: safeDur,
        loop,
        channelType: 'custom',
        color: '#8b5cf6',
      };
      onAddClip(newClip);
    } else if (tab === 'library') {
      const preset = AUDIO_PRESETS.find((p) => p.id === selectedPresetId) || AUDIO_PRESETS[0];
      const newClip: VideoAudioTrack = {
        id: `clip-preset-${Date.now()}-${preset.id}`,
        url: `preset:${preset.id}`,
        name: preset.name,
        volume,
        startOffset: safeOffset,
        duration: Math.min(safeDur, preset.duration),
        loop,
        channelType: 'custom',
        color: '#8b5cf6',
      };
      onAddClip(newClip);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Añadir Audio a Canal Libre
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-600/40 text-purple-300">
                  A{channelNumber} • {channelName}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sube pistas de ambiente, música secundaria, testimonios o doblajes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 pt-3 gap-2">
          <button
            onClick={() => setTab('upload')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              tab === 'upload'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Archivo de Audio (MP3, WAV, OGG)</span>
          </button>
          <button
            onClick={() => setTab('library')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              tab === 'library'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biblioteca de Fondos & Texturas</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {tab === 'upload' ? (
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
                className="border-2 border-dashed border-slate-800 hover:border-purple-500/60 rounded-3xl p-6 text-center cursor-pointer bg-slate-950/40 transition flex flex-col items-center justify-center gap-2.5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block">
                    {customName || 'Haz clic para seleccionar tu archivo de audio'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Formatos compatibles: MP3, WAV, OGG, M4A
                  </span>
                </div>
              </div>

              {customUrl && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">{customName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Duración detectada: {duration}s
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      previewAudio.previewSample({
                        url: customUrl,
                        name: customName,
                        volume,
                      }, 5.0);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Escuchar 5s</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AUDIO_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                const isPlaying = previewingId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>{preset.name}</span>
                          <span className="text-[9px] font-mono text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/60">
                            {preset.bpm} BPM
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                          {preset.description}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewPreset(preset);
                        }}
                        className={`p-2 rounded-xl transition shrink-0 ${
                          isPlaying
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title={isPlaying ? 'Detener' : 'Escuchar muestra'}
                      >
                        {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Timeline Placement Settings */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Segundo de Inicio en Timeline
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={totalDuration}
                    value={startOffset}
                    onChange={(e) => setStartOffset(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-xs text-slate-400 font-mono">s</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Duración del Clip
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max={totalDuration}
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-xs text-slate-400 font-mono">s</span>
                </div>
              </div>
            </div>

            {/* Volume and Loop */}
            <div className="pt-2 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200 shrink-0">Volumen:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-32 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-300 w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer self-start sm:self-center">
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  Repetir en bucle (Loop)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={tab === 'upload' && !customUrl}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg ${
              tab === 'upload' && !customUrl
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50 cursor-pointer'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Clip al Canal {channelNumber}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
