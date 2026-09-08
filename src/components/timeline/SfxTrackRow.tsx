import React, { useState, useRef } from 'react';
import {
  Zap,
  Volume2,
  VolumeX,
  Plus,
  Play,
  Trash2,
  Copy,
  Sliders,
  MoveLeft,
  MoveRight,
  Clock,
  Check,
  X
} from 'lucide-react';
import { VideoAudioTrack } from '../../types';
import { previewAudio } from '../../utils/previewAudioEngine';

interface SfxTrackRowProps {
  sfxClips: VideoAudioTrack[];
  pxPerSec: number;
  totalDuration: number;
  selectedSfxId: string | null;
  onSelectSfx: (id: string | null) => void;
  onOpenAddSfxModal: (targetTime?: number) => void;
  onUpdateSfxClip: (id: string, partial: Partial<VideoAudioTrack>) => void;
  onDeleteSfxClip: (id: string) => void;
  onDuplicateSfxClip?: (id: string) => void;
}

export const SfxTrackRow: React.FC<SfxTrackRowProps> = ({
  sfxClips,
  pxPerSec,
  totalDuration,
  selectedSfxId,
  onSelectSfx,
  onOpenAddSfxModal,
  onUpdateSfxClip,
  onDeleteSfxClip,
  onDuplicateSfxClip,
}) => {
  const hasClips = sfxClips.length > 0;
  const laneRef = useRef<HTMLDivElement>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  // Dragging state for clips
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; initialOffset: number }>({ startX: 0, initialOffset: 0 });

  const handleLanePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!laneRef.current) return;
    const rect = laneRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = Math.max(0, Math.min(totalDuration, clickX / pxPerSec));
    setHoveredTime(Math.round(time * 10) / 10);
  };

  const handleLaneClick = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Don't open if clicked inside an existing clip or button
    if (target.closest('.sfx-clip-block') || target.closest('button')) return;

    if (!laneRef.current) return;
    const rect = laneRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetTime = Math.max(0, Math.min(totalDuration, clickX / pxPerSec));
    onOpenAddSfxModal(Math.round(targetTime * 10) / 10);
  };

  const handleStartDrag = (e: React.PointerEvent, clip: VideoAudioTrack) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setDraggingId(clip.id);
    dragStartRef.current = {
      startX: e.clientX,
      initialOffset: clip.startOffset || 0,
    };

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const deltaX = moveEvt.clientX - dragStartRef.current.startX;
      const deltaTime = deltaX / pxPerSec;
      const newOffset = Math.max(0, Math.min(totalDuration - (clip.duration || 0.5), dragStartRef.current.initialOffset + deltaTime));
      onUpdateSfxClip(clip.id, { startOffset: Math.round(newOffset * 10) / 10 });
    };

    const handlePointerUp = () => {
      setDraggingId(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const selectedClip = sfxClips.find((c) => c.id === selectedSfxId);

  return (
    <div className="flex flex-col relative py-1 border-b border-slate-800/60 group">
      {/* Track Label Badge & Add Button */}
      <div className="flex items-center gap-2 mb-1 z-20">
        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-900/95 text-rose-300 border border-slate-700/80 px-2 py-0.5 rounded-md shadow flex items-center gap-1.5">
          <Zap className="w-2.5 h-2.5 text-rose-400" />
          <span>A3 • Efectos de Sonido (SFX)</span>
          <span className="bg-rose-950/90 text-rose-200 px-1.5 py-0.2 rounded text-[8px] font-mono border border-rose-800/60">
            {sfxClips.length} {sfxClips.length === 1 ? 'efecto' : 'efectos'}
          </span>
        </span>

        {/* Primary "+ Añadir SFX" button always visible on track bar */}
        <button
          type="button"
          onClick={() => onOpenAddSfxModal()}
          className="px-2 py-0.5 rounded-md bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 hover:border-rose-500 text-rose-200 hover:text-white text-[10px] font-bold flex items-center gap-1 transition shadow cursor-pointer"
          title="Añadir un nuevo efecto de sonido SFX (puedes agregar múltiples en distintos segundos)"
        >
          <Plus className="w-3 h-3 text-rose-400" />
          <span>+ Añadir SFX</span>
        </button>

        <span className="text-[9px] text-slate-500 hidden sm:inline">
          Haz clic en cualquier punto del carril o arrastra los clips para colocarlos en el segundo exacto
        </span>
      </div>

      {/* Track Lane with Interactive Canvas */}
      <div
        ref={laneRef}
        onPointerMove={handleLanePointerMove}
        onPointerLeave={() => setHoveredTime(null)}
        onClick={handleLaneClick}
        className="h-12 relative flex items-center bg-slate-950/40 hover:bg-slate-950/60 rounded-xl border border-dashed border-slate-800/80 hover:border-rose-900/50 transition-colors cursor-crosshair overflow-hidden"
        style={{ width: `${Math.max(200, totalDuration * pxPerSec)}px` }}
        title="Haz clic aquí para añadir un efecto en este segundo exacto"
      >
        {/* Hover Time Ghost Indicator */}
        {hoveredTime !== null && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none border-l border-rose-500/40 flex flex-col justify-start z-10 pl-1"
            style={{ left: `${hoveredTime * pxPerSec}px` }}
          >
            <span className="text-[8px] font-mono font-bold text-rose-300 bg-slate-950/90 px-1 rounded border border-rose-800/50 shadow">
              + {hoveredTime.toFixed(1)}s
            </span>
          </div>
        )}

        {/* Empty state notice if 0 clips */}
        {!hasClips && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-rose-400/80">
              <Plus className="w-3.5 h-3.5" />
              Haz clic en cualquier punto de la pista para añadir tu primer efecto SFX
            </span>
          </div>
        )}

        {/* Render Multiple SFX Clips */}
        {sfxClips.map((clip, idx) => {
          const clipId = clip.id;
          const isSelected = selectedSfxId === clipId;
          const isDragging = draggingId === clipId;
          const leftPx = Math.max(0, (clip.startOffset || 0) * pxPerSec);
          const clipDur = clip.duration || 1.0;
          const widthPx = Math.max(76, clipDur * pxPerSec);

          return (
            <div
              key={clipId}
              onPointerDown={(e) => handleStartDrag(e, clip)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSfx(isSelected ? null : clipId);
              }}
              className={`sfx-clip-block absolute top-1 bottom-1 rounded-xl px-2 py-0.5 border transition-all flex items-center justify-between shadow-md select-none group/clip cursor-grab active:cursor-grabbing ${
                isSelected
                  ? 'border-rose-400 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 text-white ring-2 ring-rose-400/60 shadow-lg shadow-rose-950/80 z-30'
                  : 'border-rose-800/70 bg-gradient-to-r from-rose-950/70 to-rose-900/60 hover:from-rose-900 hover:to-rose-850 text-rose-200 hover:border-rose-500 z-20'
              } ${isDragging ? 'opacity-80 scale-102 ring-2 ring-rose-400' : ''}`}
              style={{
                left: `${leftPx}px`,
                width: `${widthPx}px`,
              }}
              title={`${clip.name} • Inicio: ${(clip.startOffset || 0).toFixed(1)}s (Arrastra para mover)`}
            >
              {/* Left Trim/Nudge Handle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newStart = Math.max(0, (clip.startOffset || 0) - 0.2);
                  onUpdateSfxClip(clipId, { startOffset: Math.round(newStart * 10) / 10 });
                }}
                className="w-3.5 h-full -ml-1 rounded-l-lg bg-rose-800/40 hover:bg-rose-600 flex items-center justify-center text-[9px] text-white opacity-0 group-hover/clip:opacity-100 transition-opacity"
                title="Mover 0.2s antes"
              >
                ◀
              </button>

              <div className="flex items-center gap-1 min-w-0 flex-1 truncate px-1 pointer-events-none">
                <Zap className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="text-[10px] font-black truncate text-white">
                  {clip.name}
                </span>
                <span className="text-[8px] font-mono text-rose-300/90 bg-rose-950 px-1 py-0.2 rounded shrink-0 border border-rose-800/40">
                  {(clip.startOffset || 0).toFixed(1)}s
                </span>
              </div>

              {/* Quick Action Controls on Hover */}
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/clip:opacity-100 transition-opacity">
                {/* Audition / Preview */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    previewAudio.previewSample(clip, clipDur);
                  }}
                  className="p-1 rounded bg-slate-900/90 hover:bg-rose-600 text-white transition"
                  title="Escuchar este efecto"
                >
                  <Play className="w-2.5 h-2.5" />
                </button>

                {/* Duplicate Clip */}
                {onDuplicateSfxClip && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSfxClip(clipId);
                    }}
                    className="p-1 rounded bg-slate-900/90 hover:bg-indigo-600 text-white transition"
                    title="Duplicar este efecto en otro momento"
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* Delete Clip */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSfxClip(clipId);
                  }}
                  className="p-1 rounded bg-slate-900/90 hover:bg-red-600 text-slate-300 hover:text-white transition"
                  title="Eliminar este efecto"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Right Trim/Nudge Handle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newStart = Math.min(totalDuration, (clip.startOffset || 0) + 0.2);
                  onUpdateSfxClip(clipId, { startOffset: Math.round(newStart * 10) / 10 });
                }}
                className="w-3.5 h-full -mr-1 rounded-r-lg bg-rose-800/40 hover:bg-rose-600 flex items-center justify-center text-[9px] text-white opacity-0 group-hover/clip:opacity-100 transition-opacity"
                title="Mover 0.2s después"
              >
                ▶
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Clip Quick Inspector Bar */}
      {selectedClip && (
        <div className="mt-2 p-2 rounded-xl bg-slate-900/95 border border-rose-600/50 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-950 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white block text-xs leading-none">
                {selectedClip.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Duración: {(selectedClip.duration || 1).toFixed(1)}s
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timestamp Precision Adjuster */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <Clock className="w-3 h-3 text-rose-400" />
              <span className="text-[11px] text-slate-400 font-bold">Inicio:</span>
              <button
                type="button"
                onClick={() => {
                  const newOffset = Math.max(0, (selectedClip.startOffset || 0) - 0.5);
                  onUpdateSfxClip(selectedClip.id, { startOffset: Math.round(newOffset * 10) / 10 });
                }}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold"
                title="-0.5 segundos"
              >
                -0.5s
              </button>
              <input
                type="number"
                step="0.1"
                min="0"
                max={totalDuration}
                value={selectedClip.startOffset ?? 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onUpdateSfxClip(selectedClip.id, { startOffset: Math.max(0, Math.min(totalDuration, val)) });
                }}
                className="w-14 bg-slate-900 border border-slate-700 rounded px-1 text-center font-mono text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <span className="text-[10px] font-mono text-slate-400">s</span>
              <button
                type="button"
                onClick={() => {
                  const newOffset = Math.min(totalDuration, (selectedClip.startOffset || 0) + 0.5);
                  onUpdateSfxClip(selectedClip.id, { startOffset: Math.round(newOffset * 10) / 10 });
                }}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold"
                title="+0.5 segundos"
              >
                +0.5s
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <Volume2 className="w-3 h-3 text-rose-400" />
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={selectedClip.volume ?? 0.9}
                onChange={(e) => onUpdateSfxClip(selectedClip.id, { volume: parseFloat(e.target.value) })}
                className="w-16 accent-rose-500"
              />
              <span className="text-[10px] font-mono text-slate-300 w-7">
                {Math.round((selectedClip.volume ?? 0.9) * 100)}%
              </span>
            </div>

            {/* Audition */}
            <button
              type="button"
              onClick={() => previewAudio.previewSample(selectedClip, selectedClip.duration || 1.5)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-white transition flex items-center gap-1 text-[11px] font-bold"
              title="Escuchar efecto"
            >
              <Play className="w-3 h-3" />
              <span>Escuchar</span>
            </button>

            {/* Duplicate */}
            {onDuplicateSfxClip && (
              <button
                type="button"
                onClick={() => onDuplicateSfxClip(selectedClip.id)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-white transition flex items-center gap-1 text-[11px] font-bold"
                title="Crear una copia de este efecto en otro momento"
              >
                <Copy className="w-3 h-3" />
                <span>Duplicar</span>
              </button>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDeleteSfxClip(selectedClip.id)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-bold"
              title="Eliminar efecto"
            >
              <Trash2 className="w-3 h-3" />
              <span>Eliminar</span>
            </button>

            {/* Close Inspector */}
            <button
              type="button"
              onClick={() => onSelectSfx(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Cerrar barra"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
