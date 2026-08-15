import React from 'react';
import { Smartphone, Square, Tv, Clapperboard, Sparkles } from 'lucide-react';
import { AspectRatio, BrandInfo } from '../types';

interface SidebarAspectProps {
  aspectRatio: AspectRatio;
  onSelectAspect: (aspect: AspectRatio) => void;
  brand: BrandInfo;
}

const FORMAT_OPTIONS: {
  id: AspectRatio;
  name: string;
  subtext: string;
  dimension: string;
  icon: any;
}[] = [
  {
    id: '4:5',
    name: '4:5 Instagram',
    subtext: 'Feed / Carrusel',
    dimension: '1080 × 1350',
    icon: Smartphone,
  },
  {
    id: '1:1',
    name: '1:1 Cuadrado',
    subtext: 'Feed / LinkedIn',
    dimension: '1080 × 1080',
    icon: Square,
  },
  {
    id: '9:16',
    name: '9:16 Story / Reel',
    subtext: 'TikTok / Shorts',
    dimension: '1080 × 1920',
    icon: Clapperboard,
  },
];

export const SidebarAspect: React.FC<SidebarAspectProps> = ({
  aspectRatio,
  onSelectAspect,
  brand,
}) => {
  const primaryColor = brand.primaryColor || '#e11d48';

  return (
    <aside className="hidden lg:flex flex-col w-48 shrink-0 sticky top-16 h-fit bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-3xl p-3.5 space-y-3 shadow-xl">
      
      {/* Title */}
      <div className="border-b border-slate-800/80 pb-2">
        <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>Formato de diapositiva</span>
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Dimensiones de salida
        </p>
      </div>

      {/* Vertical Options Stack */}
      <div className="space-y-2">
        {FORMAT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = aspectRatio === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => onSelectAspect(opt.id)}
              className={`w-full text-left p-2.5 rounded-2xl border transition flex items-start gap-2.5 group relative ${
                isActive
                  ? 'bg-slate-800/90 text-white shadow-lg'
                  : 'bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-800/80'
              }`}
              style={{
                borderColor: isActive ? primaryColor : undefined,
              }}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}

              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                  isActive
                    ? 'text-white'
                    : 'bg-slate-900 text-slate-400 group-hover:text-white'
                }`}
                style={{
                  backgroundColor: isActive ? primaryColor : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block truncate">
                  {opt.name}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {opt.subtext}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                  {opt.dimension}
                </span>
              </div>
            </button>
          );
        })}
      </div>

    </aside>
  );
};
