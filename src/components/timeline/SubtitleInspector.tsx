import React, { useState, useEffect } from 'react';
import { X, Trash2, Type, Sparkles, Sliders, Volume2, Square, Play, FastForward } from 'lucide-react';
import { SubtitleItem } from '../../types';
import { speakSubtitleText, stopSubtitleSpeech } from '../../utils/subtitleSpeechReader';

interface SubtitleInspectorProps {
  subtitle: SubtitleItem;
  totalDuration: number;
  onUpdateSubtitle: (updated: SubtitleItem) => void;
  onDeleteSubtitle: (id: string) => void;
  onClose: () => void;
}

export const SubtitleInspector: React.FC<SubtitleInspectorProps> = ({
  subtitle,
  totalDuration,
  onUpdateSubtitle,
  onDeleteSubtitle,
  onClose,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.05);

  useEffect(() => {
    return () => {
      stopSubtitleSpeech();
    };
  }, []);

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSubtitleSpeech();
      setIsSpeaking(false);
      return;
    }

    if (!subtitle.text.trim()) return;

    setIsSpeaking(true);
    speakSubtitleText(subtitle.text, {
      rate: speechRate,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };
  return (
    <div className="bg-slate-900 border border-amber-900/60 rounded-2xl p-4 shadow-xl mb-3 animate-fadeIn space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              Inspector de Subtítulo Dinámico
            </h4>
            <span className="text-[10px] text-slate-400">
              Modifica el texto, estilo viral y sincronización temporal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDeleteSubtitle(subtitle.id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
            title="Eliminar este subtítulo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Text Area */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-semibold text-slate-300">
            Texto del Subtítulo (Impacto Viral):
          </label>
          <div className="flex items-center gap-2">
            {/* Speed selector for speech reading */}
            <div className="flex items-center gap-1 text-[10px] bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-0.5 text-slate-400">
              <FastForward className="w-2.5 h-2.5 text-amber-400" />
              <span>Vel:</span>
              {[0.9, 1.05, 1.25].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeechRate(spd)}
                  className={`px-1 py-0.2 rounded transition cursor-pointer font-bold ${
                    speechRate === spd
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Read / Listen to Subtitle Button */}
            <button
              type="button"
              onClick={handleToggleSpeak}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-300'
              }`}
              title="Leer este subtítulo en voz alta con síntesis de voz (TTS)"
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>Detener</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Leer Subtítulo</span>
                </>
              )}
            </button>
          </div>
        </div>
        <input
          type="text"
          value={subtitle.text}
          onChange={(e) => onUpdateSubtitle({ ...subtitle, text: e.target.value })}
          placeholder="Texto del subtítulo..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-yellow-300 focus:border-amber-400 focus:outline-none"
        />
      </div>

      {/* Timing and Style Preset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Start Time */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Inicio (segundos):
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0"
              max={totalDuration}
              value={subtitle.startTime}
              onChange={(e) =>
                onUpdateSubtitle({ ...subtitle, startTime: Math.max(0, Number(e.target.value)) })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <span className="text-xs text-slate-400">s</span>
          </div>
        </div>

        {/* End Time */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Fin (segundos):
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min={subtitle.startTime + 0.2}
              max={totalDuration}
              value={subtitle.endTime}
              onChange={(e) =>
                onUpdateSubtitle({
                  ...subtitle,
                  endTime: Math.min(totalDuration, Number(e.target.value)),
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <span className="text-xs text-slate-400">s</span>
          </div>
        </div>

        {/* Style Preset */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Estilo Visual:
          </label>
          <select
            value={subtitle.stylePreset || 'hormozi'}
            onChange={(e) =>
              onUpdateSubtitle({ ...subtitle, stylePreset: e.target.value as any })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
          >
            <option value="hormozi">Alex Hormozi (Amarillo + Sombra 3D)</option>
            <option value="neon">Neón Resplandeciente (Cian)</option>
            <option value="box">Caja de Contraste (Fondo Sólido)</option>
            <option value="minimal">Minimalista (Blanco)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
