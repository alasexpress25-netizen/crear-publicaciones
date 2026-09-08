import React from 'react';
import { Film, Plus, Image as ImageIcon, Layers } from 'lucide-react';
import { Slide, CustomTextLayer } from '../../types';
import { getAllResolvedV2Clips } from '../../utils/v2OverlayHelper';

interface V2OverlayTrackProps {
  slides: Slide[];
  pxPerSec: number;
  totalDuration: number;
  selectedV2Clip: { slideIndex: number; clipId: string } | null;
  onSelectV2Clip: (slideIndex: number, clipId: string) => void;
  onOpenAddV2Modal: () => void;
}

export const V2OverlayTrack: React.FC<V2OverlayTrackProps> = ({
  slides,
  pxPerSec,
  totalDuration,
  selectedV2Clip,
  onSelectV2Clip,
  onOpenAddV2Modal,
}) => {
  // Collect all resolved V2 clips across the entire global timeline
  const v2ClipsList = getAllResolvedV2Clips(slides);

  return (
    <div className="flex items-center relative py-1 border-b border-slate-800/60">
      {/* Track Label Badge */}
      <div className="absolute -left-1 sm:left-0 -top-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
        <span className="text-[9px] font-black uppercase tracking-wider bg-purple-950/90 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-md shadow flex items-center gap-1">
          <Film className="w-2.5 h-2.5 text-purple-400" />
          <span>V2 • Superposición Global B-Roll</span>
        </span>
      </div>

      {/* Track Timeline Lane */}
      <div
        className="h-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 relative flex items-center transition-all overflow-visible group"
        style={{ width: `${Math.max(100, totalDuration * pxPerSec)}px` }}
      >
        {v2ClipsList.map((item) => {
          const isSelected =
            selectedV2Clip?.clipId === item.id;
          const leftPx = item.startGlobalTime * pxPerSec;
          const widthPx = Math.max(36, item.duration * pxPerSec);

          return (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectV2Clip(item.originSlideIndex, item.id);
              }}
              style={{
                left: `${leftPx}px`,
                width: `${widthPx}px`,
              }}
              className={`absolute top-1 bottom-1 rounded-xl px-2 flex items-center gap-1.5 text-[11px] font-bold cursor-pointer select-none transition-all shadow-md overflow-hidden ${
                isSelected
                  ? 'bg-purple-600 text-white ring-2 ring-purple-300 shadow-purple-500/30'
                  : 'bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-700/50'
              }`}
              title={`Medio V2: ${item.clip.text || 'Clip'} (${item.duration.toFixed(1)}s)${
                item.isCrossSlide
                  ? ` • Superposición global sobre escenas: ${item.coveredSlideIndices.map((i) => i + 1).join(', ')}`
                  : ''
              }`}
            >
              {item.clip.imageUrl ? (
                <img
                  src={item.clip.imageUrl}
                  alt="V2 thumb"
                  className="w-5 h-5 rounded object-cover shrink-0 border border-purple-400/40"
                />
              ) : item.clip.videoUrl ? (
                <div className="w-5 h-5 rounded bg-purple-900 border border-purple-400/40 flex items-center justify-center shrink-0">
                  <Film className="w-3 h-3 text-purple-200" />
                </div>
              ) : (
                <Film className="w-3.5 h-3.5 shrink-0 text-purple-300" />
              )}
              <div className="flex items-center gap-1 min-w-0 truncate">
                <span className="truncate text-[10px]">
                  {item.clip.text || `V2 Media Escena ${item.originSlideIndex + 1}`}
                </span>
                {item.isCrossSlide && (
                  <span className="shrink-0 text-[8px] bg-purple-500/30 text-purple-200 px-1 py-0.2 rounded border border-purple-400/30 flex items-center gap-0.5">
                    <Layers className="w-2 h-2" />
                    <span>{item.coveredSlideIndices.length} esc.</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state prompt */}
        {v2ClipsList.length === 0 && (
          <div className="w-full h-full flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold">
            <span>Arrastra o</span>
            <button
              onClick={onOpenAddV2Modal}
              className="text-purple-400 hover:text-purple-300 underline font-bold cursor-pointer"
            >
              + Superponer video o foto en Pista V2
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenAddV2Modal();
        }}
        className="ml-2 px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
        title="Superponer clip de video o foto encima del lienzo"
      >
        <Plus className="w-3 h-3" />
        <span>+ Video V2</span>
      </button>
    </div>
  );
};
