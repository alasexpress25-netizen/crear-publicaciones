import React, { useState } from 'react';
import {
  Music,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Play,
  Sliders,
  Edit2,
  Check
} from 'lucide-react';
import { AudioChannelLane, VideoAudioTrack, Slide } from '../../types';
import { previewAudio } from '../../utils/previewAudioEngine';
import { AddAudioClipModal } from './AddAudioClipModal';

interface DynamicAudioTracksProps {
  channels: AudioChannelLane[];
  pxPerSec: number;
  totalDuration: number;
  currentTime: number;
  slides: Slide[];
  onAddChannel: () => void;
  onRemoveChannel: (channelId: string) => void;
  onUpdateChannel: (channelId: string, partial: Partial<AudioChannelLane>) => void;
  onAddClipToChannel: (channelId: string, clip: VideoAudioTrack) => void;
  onUpdateClipInChannel: (channelId: string, clipId: string, partial: Partial<VideoAudioTrack>) => void;
  onDeleteClipFromChannel: (channelId: string, clipId: string) => void;
}

export const DynamicAudioTracks: React.FC<DynamicAudioTracksProps> = ({
  channels,
  pxPerSec,
  totalDuration,
  currentTime,
  slides,
  onAddChannel,
  onRemoveChannel,
  onUpdateChannel,
  onAddClipToChannel,
  onUpdateClipInChannel,
  onDeleteClipFromChannel,
}) => {
  const [activeModalChannelId, setActiveModalChannelId] = useState<string | null>(null);
  const [editingNameChannelId, setEditingNameChannelId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const activeModalChannel = channels.find((c) => c.id === activeModalChannelId) || null;

  return (
    <div className="space-y-1">
      {/* List of Dynamic Channels */}
      {channels.map((channel, cIdx) => {
        const channelNum = channel.channelNumber || (cIdx + 4);
        const hasClips = channel.clips && channel.clips.length > 0;
        const isEditingName = editingNameChannelId === channel.id;

        return (
          <div
            key={channel.id}
            className="flex items-center relative py-1 border-b border-slate-800/60 group"
          >
            {/* Track Header Badge & Controls */}
            <div className="absolute -left-1 sm:left-0 -top-2.5 z-10 flex items-center gap-1.5">
              <div className="bg-slate-900/95 border border-slate-700/80 px-2 py-0.5 rounded-md shadow flex items-center gap-1.5">
                <Music className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-300">
                  A{channelNum} •
                </span>

                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempName}
                      autoFocus
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateChannel(channel.id, { name: tempName.trim() || `Canal ${channelNum}` });
                          setEditingNameChannelId(null);
                        } else if (e.key === 'Escape') {
                          setEditingNameChannelId(null);
                        }
                      }}
                      className="bg-slate-950 border border-purple-500 rounded px-1 py-0 text-[9px] text-white focus:outline-none w-24"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateChannel(channel.id, { name: tempName.trim() || `Canal ${channelNum}` });
                        setEditingNameChannelId(null);
                      }}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(channel.name);
                      setEditingNameChannelId(channel.id);
                    }}
                    className="text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 group/name"
                    title="Haz clic para renombrar pista"
                  >
                    <span>{channel.name}</span>
                    <Edit2 className="w-2 h-2 opacity-0 group-hover/name:opacity-100 text-slate-400" />
                  </button>
                )}

                {hasClips && (
                  <span className="bg-purple-950/80 text-purple-200 px-1 rounded text-[8px] font-mono border border-purple-800/50">
                    {channel.clips.length}
                  </span>
                )}

                {/* Track Quick Actions: Mute & Delete */}
                <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                  <button
                    type="button"
                    onClick={() => onUpdateChannel(channel.id, { isMuted: !channel.isMuted })}
                    className={`p-0.5 rounded transition ${
                      channel.isMuted
                        ? 'text-amber-400 bg-amber-950/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={channel.isMuted ? 'Desmutear canal' : 'Mutear canal'}
                  >
                    {channel.isMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar la pista de audio "${channel.name}"?`)) {
                        onRemoveChannel(channel.id);
                      }
                    }}
                    className="p-0.5 rounded text-slate-500 hover:text-red-400 transition"
                    title="Eliminar esta pista de audio"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Track Timeline Lane */}
            <div
              className="h-12 relative flex items-center"
              style={{ width: `${Math.max(100, totalDuration * pxPerSec)}px` }}
            >
              {/* Clips inside this dynamic channel */}
              {channel.clips.map((clip) => {
                const clipId = clip.id || clip.url;
                const leftPx = Math.max(0, (clip.startOffset || 0) * pxPerSec);
                const clipDur = clip.duration || 3.0;
                const widthPx = Math.max(70, clipDur * pxPerSec);

                return (
                  <div
                    key={clipId}
                    className="absolute top-1 bottom-1 rounded-xl px-2 py-1 border border-purple-900/60 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 hover:border-purple-600 transition-all flex items-center justify-between shadow-md cursor-pointer select-none group/clip z-10"
                    style={{
                      left: `${leftPx}px`,
                      width: `${widthPx}px`,
                    }}
                    title={`${clip.name} (${(clip.startOffset || 0).toFixed(1)}s - ${((clip.startOffset || 0) + clipDur).toFixed(1)}s)`}
                  >
                    {/* Left Trim Handle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStart = Math.max(0, (clip.startOffset || 0) - 0.5);
                        onUpdateClipInChannel(channel.id, clipId, { startOffset: Math.round(newStart * 10) / 10 });
                      }}
                      className="w-3.5 h-full -ml-1.5 rounded-l-lg bg-purple-800/30 hover:bg-purple-600 flex items-center justify-center text-[9px] text-white opacity-0 group-hover/clip:opacity-100 transition-opacity"
                      title="Mover 0.5s antes"
                    >
                      ◀
                    </button>

                    <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate px-1">
                      <Music className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="text-[10px] font-black truncate text-white">
                        {clip.name}
                      </span>
                      <span className="text-[8px] font-mono text-purple-300/80 bg-purple-900/50 px-1 rounded shrink-0">
                        {clipDur.toFixed(1)}s
                      </span>
                    </div>

                    {/* Actions on hover */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/clip:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewAudio.previewSample(clip, Math.min(5.0, clipDur));
                        }}
                        className="p-1 rounded-md bg-slate-800 hover:bg-purple-700 text-white"
                        title="Escuchar muestra"
                      >
                        <Play className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClipFromChannel(channel.id, clipId);
                        }}
                        className="p-1 rounded-md bg-slate-800 hover:bg-red-700 text-slate-300 hover:text-white"
                        title="Eliminar clip"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Right Trim Handle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newDur = Math.max(0.5, clipDur + 0.5);
                        onUpdateClipInChannel(channel.id, clipId, { duration: Math.round(newDur * 10) / 10 });
                      }}
                      className="w-3.5 h-full -mr-1.5 rounded-r-lg bg-purple-800/30 hover:bg-purple-600 flex items-center justify-center text-[9px] text-white opacity-0 group-hover/clip:opacity-100 transition-opacity"
                      title="Alargar duración (+0.5s)"
                    >
                      ▶
                    </button>
                  </div>
                );
              })}

              {/* Add Clip Button / Lane placeholder */}
              {!hasClips ? (
                <button
                  type="button"
                  onClick={() => setActiveModalChannelId(channel.id)}
                  className="h-10 rounded-xl px-3 border border-dashed border-purple-900/50 hover:border-purple-500/70 text-purple-400/80 hover:text-purple-300 bg-purple-950/10 hover:bg-purple-950/30 flex items-center gap-2 cursor-pointer transition-all"
                  style={{ width: `${Math.max(200, totalDuration * pxPerSec)}px` }}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-bold truncate">
                    + Añadir audio a {channel.name} (MP3, WAV, fondo secundario o ambiente)
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveModalChannelId(channel.id)}
                  className="absolute right-2 top-1.5 bottom-1.5 px-2 rounded-lg bg-slate-900/90 hover:bg-purple-900/80 border border-slate-700/80 hover:border-purple-500 text-slate-200 hover:text-white text-[10px] font-bold flex items-center gap-1 transition shadow z-30"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  <span>+ Añadir Clip</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Button to Add a New Audio Channel */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onAddChannel}
          className="h-9 px-3 rounded-xl border border-dashed border-slate-700/80 hover:border-purple-500/80 bg-slate-900/40 hover:bg-purple-950/20 text-slate-400 hover:text-purple-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-purple-400" />
          <span>+ Agregar canal de audio libre (A{channels.length + 4})</span>
        </button>
      </div>

      {/* Modal for adding audio clip to selected channel */}
      {activeModalChannel && (
        <AddAudioClipModal
          isOpen={Boolean(activeModalChannel)}
          onClose={() => setActiveModalChannelId(null)}
          channelName={activeModalChannel.name}
          channelNumber={activeModalChannel.channelNumber || 4}
          currentTime={currentTime}
          totalDuration={totalDuration}
          slides={slides}
          onAddClip={(clip) => onAddClipToChannel(activeModalChannel.id, clip)}
        />
      )}
    </div>
  );
};
