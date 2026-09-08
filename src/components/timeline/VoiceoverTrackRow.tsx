import React from 'react';
import { Mic, Volume2, VolumeX, Settings, Plus, User } from 'lucide-react';
import { VoiceoverTrack, VoiceoverAvatar } from '../../types';

interface VoiceoverTrackRowProps {
  voiceoverTrack: VoiceoverTrack | null;
  pxPerSec: number;
  totalDuration: number;
  voiceoverAvatar?: VoiceoverAvatar | null;
  onOpenVoiceoverModal: () => void;
  onOpenAvatarModal?: () => void;
  onUpdateVoiceoverTrack: (track: VoiceoverTrack | null) => void;
}

export const VoiceoverTrackRow: React.FC<VoiceoverTrackRowProps> = ({
  voiceoverTrack,
  pxPerSec,
  totalDuration,
  voiceoverAvatar = null,
  onOpenVoiceoverModal,
  onOpenAvatarModal,
  onUpdateVoiceoverTrack,
}) => {
  return (
    <div className="flex items-center relative py-1 border-b border-slate-800/60">
      {/* Track Label Badge */}
      <div className="absolute -left-1 sm:left-0 -top-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
        <span className="text-[9px] font-black uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-700/60 px-2 py-0.5 rounded-md shadow flex items-center gap-1">
          <Mic className="w-2.5 h-2.5 text-rose-400" />
          <span>A2 • Locución & Voz en Off</span>
        </span>
      </div>

      {/* Track Lane */}
      <div
        className="h-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 relative flex items-center transition-all overflow-visible group"
        style={{ width: `${Math.max(100, totalDuration * pxPerSec)}px` }}
      >
        {voiceoverTrack ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenVoiceoverModal();
            }}
            style={{ width: `${totalDuration * pxPerSec}px` }}
            className="h-full rounded-2xl px-3 py-1.5 bg-gradient-to-r from-rose-950/90 via-purple-950/80 to-rose-950/90 border border-rose-600/50 hover:border-rose-400 flex items-center justify-between cursor-pointer transition-all shadow-md group/vo select-none"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-rose-600/30 text-rose-300">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    {voiceoverTrack.name || 'Voz en Off (Locución IA)'}
                  </span>
                  <span className="text-[9px] bg-rose-900/80 text-rose-200 px-1.5 py-0.5 rounded font-mono">
                    {voiceoverTrack.language || 'es-ES'}
                  </span>
                </div>
                {voiceoverTrack.scriptText && (
                  <p className="text-[10px] text-slate-300 max-w-sm truncate italic">
                    "{voiceoverTrack.scriptText}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Waveform graphic */}
              <div className="flex items-center gap-0.5 opacity-60">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={`vowave-${i}`}
                    className="w-1 rounded-full bg-rose-400"
                    style={{
                      height: `${6 + Math.sin(i * 0.9) * 8 + (i % 3 === 0 ? 5 : 2)}px`,
                    }}
                  />
                ))}
              </div>

              {/* Mute button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateVoiceoverTrack({
                    ...voiceoverTrack,
                    isMuted: !voiceoverTrack.isMuted,
                  });
                }}
                className={`p-1 rounded-lg transition ${
                  voiceoverTrack.isMuted
                    ? 'bg-rose-900 text-rose-200'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
                title={voiceoverTrack.isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {voiceoverTrack.isMuted ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVoiceoverModal();
                }}
                className="p-1 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white transition"
                title="Configurar voz, tono o guión"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={onOpenVoiceoverModal}
            className="w-full h-full flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold cursor-pointer hover:text-rose-400 transition"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>+ Añadir Locución / Voz en Off con IA (TTS)</span>
          </div>
        )}
      </div>

      {/* Action Buttons: Avatar IA & Voiceover */}
      <div className="flex items-center gap-1.5 ml-2 shrink-0">
        {onOpenAvatarModal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAvatarModal();
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              voiceoverAvatar && voiceoverAvatar.enabled
                ? 'bg-rose-950/80 hover:bg-rose-900/90 text-rose-200 border-rose-700/60 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Presentador / Avatar de Locución en video"
          >
            {voiceoverAvatar && voiceoverAvatar.enabled ? (
              <>
                <div className="relative w-4 h-4 rounded-full overflow-hidden border border-rose-400 shrink-0">
                  <img
                    src={voiceoverAvatar.imageUrl}
                    alt={voiceoverAvatar.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="max-w-[70px] truncate">{voiceoverAvatar.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-rose-400" />
                <span>+ Avatar IA</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenVoiceoverModal();
          }}
          className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
          title="Configurar pista de locución o texto a voz"
        >
          <Plus className="w-3 h-3" />
          <span>+ Voz en Off</span>
        </button>
      </div>
    </div>
  );
};
