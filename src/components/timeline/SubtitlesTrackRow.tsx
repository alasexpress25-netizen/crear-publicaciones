import React, { useState, useEffect, useRef } from 'react';
import { Type, Sparkles, Plus, Mic, Volume2, Square, Wand2, AudioWaveform } from 'lucide-react';
import { SubtitleItem } from '../../types';
import { readAllSubtitlesSequentially, stopSubtitleSpeech } from '../../utils/subtitleSpeechReader';

interface SubtitlesTrackRowProps {
  subtitles: SubtitleItem[];
  pxPerSec: number;
  totalDuration: number;
  selectedSubtitleId: string | null;
  onSelectSubtitle: (id: string) => void;
  onAddSubtitle: () => void;
  onAutoGenerateSubtitles: () => void;
  onOpenSpeechToText?: () => void;
  isAutoReadSubtitles?: boolean;
  onToggleAutoReadSubtitles?: () => void;
  onConvertToVoiceover?: () => void;
}

export const SubtitlesTrackRow: React.FC<SubtitlesTrackRowProps> = ({
  subtitles,
  pxPerSec,
  totalDuration,
  selectedSubtitleId,
  onSelectSubtitle,
  onAddSubtitle,
  onAutoGenerateSubtitles,
  onOpenSpeechToText,
  isAutoReadSubtitles = false,
  onToggleAutoReadSubtitles,
  onConvertToVoiceover,
}) => {
  const [isReadingAll, setIsReadingAll] = useState<boolean>(false);
  const cancelReadRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      cancelReadRef.current = true;
      stopSubtitleSpeech();
    };
  }, []);

  const handleToggleReadAll = async () => {
    if (isReadingAll) {
      cancelReadRef.current = true;
      stopSubtitleSpeech();
      setIsReadingAll(false);
      return;
    }

    if (!subtitles || subtitles.length === 0) return;

    cancelReadRef.current = false;
    setIsReadingAll(true);

    try {
      await readAllSubtitlesSequentially(
        subtitles,
        {
          onStart: () => setIsReadingAll(true),
          onProgress: (_idx, sub) => {
            onSelectSubtitle(sub.id);
          },
          onEnd: () => setIsReadingAll(false),
          onError: () => setIsReadingAll(false),
        },
        () => cancelReadRef.current
      );
    } catch {
      setIsReadingAll(false);
    }
  };

  return (
    <div className="flex items-center relative py-1 border-b border-slate-800/60">
      {/* Track Label Badge */}
      <div className="absolute -left-1 sm:left-0 -top-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-md shadow flex items-center gap-1">
          <Type className="w-2.5 h-2.5" />
          <span>SUB • Subtítulos Dinámicos</span>
        </span>
      </div>

      {/* Track Lane */}
      <div
        className="h-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 relative flex items-center transition-all overflow-visible group"
        style={{ width: `${Math.max(100, totalDuration * pxPerSec)}px` }}
      >
        {subtitles.map((sub) => {
          const isSelected = selectedSubtitleId === sub.id;
          const leftPx = sub.startTime * pxPerSec;
          const duration = Math.max(0.4, sub.endTime - sub.startTime);
          const widthPx = Math.max(28, duration * pxPerSec);

          return (
            <div
              key={sub.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSubtitle(sub.id);
              }}
              style={{
                left: `${leftPx}px`,
                width: `${widthPx}px`,
              }}
              className={`absolute top-1 bottom-1 rounded-xl px-2 flex items-center justify-center text-[10px] font-black uppercase tracking-wider cursor-pointer select-none transition-all shadow-md overflow-hidden ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-extrabold shadow-amber-400/30'
                  : 'bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border border-amber-700/50'
              }`}
              title={`"${sub.text}" (${sub.startTime.toFixed(1)}s - ${sub.endTime.toFixed(1)}s)`}
            >
              <span className="truncate">{sub.text || 'SUB'}</span>
            </div>
          );
        })}

        {/* Empty state */}
        {subtitles.length === 0 && (
          <div className="w-full h-full flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold flex-wrap px-2">
            {onOpenSpeechToText && (
              <button
                onClick={onOpenSpeechToText}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs transition cursor-pointer font-bold shadow-md"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>🎤 Voz a Texto / Dictado en Vivo</span>
              </button>
            )}
            <button
              onClick={onAutoGenerateSubtitles}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 border border-amber-800/60 text-xs transition cursor-pointer font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Generar con IA</span>
            </button>
            <button
              onClick={onAddSubtitle}
              className="hover:text-amber-400 text-slate-400 transition underline cursor-pointer text-xs"
            >
              + Manual
            </button>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      {subtitles.length > 0 && (
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {/* PRIMARY: Read Subtitles in Audio */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleReadAll();
            }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer shadow-md ${
              isReadingAll
                ? 'bg-amber-400 text-slate-950 animate-pulse ring-2 ring-amber-300'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
            }`}
            title="Leer todos los subtítulos en voz alta con síntesis de voz (TTS)"
          >
            {isReadingAll ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Detener Lectura</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 fill-current" />
                <span>🔊 Leer Subtítulos</span>
              </>
            )}
          </button>

          {/* Toggle Auto-Read when playing video */}
          {onToggleAutoReadSubtitles && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAutoReadSubtitles();
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                isAutoReadSubtitles
                  ? 'bg-amber-950/90 text-amber-300 border-amber-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Leer automáticamente en voz alta cada subtítulo mientras reproduces el video"
            >
              <span>🗣️ Auto-leer:</span>
              <span className={`font-black ${isAutoReadSubtitles ? 'text-amber-300' : 'text-slate-500'}`}>
                {isAutoReadSubtitles ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Convert Subtitles to Voiceover A2 track */}
          {onConvertToVoiceover && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConvertToVoiceover();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border border-purple-700/60 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Convertir todos los subtítulos en una pista de Voz en Off (A2)"
            >
              <Mic className="w-3 h-3 text-purple-400" />
              <span className="hidden sm:inline">A Locución</span>
            </button>
          )}

          {onOpenSpeechToText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSpeechToText();
              }}
              className="px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Dictar subtítulos con micrófono (Voz a Texto)"
            >
              <Mic className="w-3 h-3" />
              <span className="hidden md:inline">Dictar</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtitle();
            }}
            className="px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/80 text-amber-400 border border-slate-800 hover:border-amber-600/40 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            title="Añadir un nuevo bloque de subtítulo"
          >
            <Plus className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAutoGenerateSubtitles();
            }}
            className="px-2 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            title="Regenerar subtítulos con IA"
          >
            <Sparkles className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
