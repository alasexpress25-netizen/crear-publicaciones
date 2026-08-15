import React from 'react';
import { Slide, BrandInfo, AspectRatio } from '../types';
import { Edit2 } from 'lucide-react';

interface GridOverviewProps {
  slides: Slide[];
  brand: BrandInfo;
  aspectRatio: AspectRatio;
  currentIndex: number;
  onSelectSlide: (index: number) => void;
}

export const GridOverview: React.FC<GridOverviewProps> = ({
  slides,
  brand,
  aspectRatio,
  currentIndex,
  onSelectSlide,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Vista Panorámica del Carrusel ({slides.length} Diapositivas)
          </h3>
          <p className="text-xs text-slate-400">
            Revisa el flujo narrativo y la consistencia visual de principio a fin. Haz clic en cualquiera para editarla.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {slides.map((slide, idx) => (
          <div
            key={slide._uid || slide.id || idx}
            onClick={() => onSelectSlide(idx)}
            className={`relative rounded-2xl overflow-hidden border cursor-pointer group transition-all duration-200 aspect-[4/5] bg-slate-950 p-4 flex flex-col justify-between shadow-xl ${
              currentIndex === idx
                ? 'border-rose-500 ring-2 ring-rose-500/60 shadow-rose-950/40'
                : 'border-slate-800 hover:border-slate-700 hover:scale-[1.02]'
            }`}
          >
            {/* Slide Background Image */}
            {slide.image && (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105 duration-300"
                style={{
                  backgroundImage: `url("${slide.image}")`,
                }}
              />
            )}

            {/* Dark Overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50 pointer-events-none"
              style={{
                opacity: (slide.overlayIntensity !== undefined ? slide.overlayIntensity : 85) / 100,
              }}
            />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between text-[10px]">
              <span className="bg-rose-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                Slide {idx + 1}
              </span>
              <span className="text-slate-300 font-bold uppercase tracking-wider truncate max-w-[100px]">
                {brand.name || 'LA VISUAL MK'}
              </span>
            </div>

            {/* Center Content */}
            <div className="relative z-10 space-y-1.5 my-auto py-2">
              {slide.badge && (
                <span className="text-[9px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.5 rounded uppercase inline-block">
                  {slide.badge}
                </span>
              )}
              {slide.subtag && (
                <p className="text-[10px] font-semibold text-rose-300 line-clamp-1">{slide.subtag}</p>
              )}
              <h4 className="text-xs font-black text-white leading-tight uppercase line-clamp-3">
                {slide.title || 'SIN TÍTULO'}
              </h4>
              {slide.body && (
                <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">{slide.body}</p>
              )}
            </div>

            {/* Footer Bar */}
            <div className="relative z-10 flex items-center justify-between text-[9px] border-t border-slate-800/80 pt-2 text-slate-400">
              <span className="truncate max-w-[60%]">{slide.cta || '👉 Desliza'}</span>
              <span className="text-rose-400 font-bold truncate max-w-[35%]">{brand.web || 'lavisualmk.com'}</span>
            </div>

            {/* Edit overlay icon on hover */}
            <div className="absolute inset-0 bg-rose-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
              <span className="flex items-center gap-1 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Diapositiva #{idx + 1}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
