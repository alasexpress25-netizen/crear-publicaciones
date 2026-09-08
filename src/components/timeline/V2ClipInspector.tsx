import React from 'react';
import { X, Trash2, Sliders, Film, Eye, Sparkles } from 'lucide-react';
import { CustomTextLayer } from '../../types';

interface V2ClipInspectorProps {
  clip: CustomTextLayer;
  slideIndex: number;
  onUpdateClip: (slideIndex: number, updated: CustomTextLayer) => void;
  onDeleteClip: (slideIndex: number, clipId: string) => void;
  onClose: () => void;
}

export const V2ClipInspector: React.FC<V2ClipInspectorProps> = ({
  clip,
  slideIndex,
  onUpdateClip,
  onDeleteClip,
  onClose,
}) => {
  return (
    <div className="bg-slate-900 border border-purple-900/60 rounded-2xl p-4 shadow-xl mb-3 animate-fadeIn space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-600/30">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              Inspector de Medio V2 • Escena {slideIndex + 1}
            </h4>
            <span className="text-[10px] text-slate-400">
              Personaliza tamaño, transparencia y tiempos de entrada/salida
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDeleteClip(slideIndex, clip.id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
            title="Eliminar capa superpuesta V2"
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Width / Scale */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
            <span>Escala / Ancho</span>
            <span className="text-purple-400 font-mono">{clip.boxWidth || 45}%</span>
          </div>
          <input
            type="range"
            min="15"
            max="100"
            value={clip.boxWidth || 45}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateClip(slideIndex, { ...clip, boxWidth: val, boxHeight: val });
            }}
            className="w-full accent-purple-500 h-1.5"
          />
        </div>

        {/* Opacity / Transparency */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
            <span>Opacidad</span>
            <span className="text-purple-400 font-mono">
              {Math.round((clip.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round((clip.opacity ?? 1) * 100)}
            onChange={(e) => {
              const val = Number(e.target.value) / 100;
              onUpdateClip(slideIndex, { ...clip, opacity: val });
            }}
            className="w-full accent-purple-500 h-1.5"
          />
        </div>

        {/* Border Radius */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
            <span>Borde Redondeado</span>
            <span className="text-purple-400 font-mono">{clip.borderRadius ?? 16}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="48"
            value={clip.borderRadius ?? 16}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateClip(slideIndex, { ...clip, borderRadius: val });
            }}
            className="w-full accent-purple-500 h-1.5"
          />
        </div>

        {/* Entrance delay */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Entrada (Delay):
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0"
              max="15"
              value={clip.inDelay ?? 0.2}
              onChange={(e) =>
                onUpdateClip(slideIndex, { ...clip, inDelay: Number(e.target.value) })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <span className="text-xs text-slate-400">s</span>
          </div>
        </div>

        {/* Exit time */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Salida (Duración):
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="30"
              value={clip.outTime ?? 3.5}
              onChange={(e) =>
                onUpdateClip(slideIndex, { ...clip, outTime: Number(e.target.value) })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <span className="text-xs text-slate-400">s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
