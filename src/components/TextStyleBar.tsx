import React from 'react';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Palette,
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCcw,
  LayoutGrid,
  Columns2,
  Quote,
  Hash,
  ListOrdered,
  Send,
  Layers
} from 'lucide-react';
import { Slide, BrandInfo, TextStyleItem, SlideLayoutTemplate } from '../types';

interface TextStyleBarProps {
  activeKey: string | null;
  slide: Slide;
  brand: BrandInfo;
  onUpdateStyle: (key: string, style: Partial<TextStyleItem>) => void;
  onResetStyle: (key: string) => void;
  onUpdateSlideLayout?: (layout: SlideLayoutTemplate) => void;
  onUpdateSlideOverlayType?: (type: 'gradient' | 'solid' | 'card' | 'cinematic') => void;
  onUpdateSlideAccentColor?: (color: string) => void;
}

const FONT_FAMILIES = [
  { label: 'Montserrat (Display / Impacto)', value: "'Montserrat', sans-serif" },
  { label: 'Inter (Moderno / Limpio)', value: "'Inter', sans-serif" },
  { label: 'Playfair Display (Elegante / Editorial)', value: "'Playfair Display', serif" },
  { label: 'Plus Jakarta Sans (SaaS / Tech)', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Outfit (Dinámico / Bold)', value: "'Outfit', sans-serif" },
];

const PRESET_COLORS = [
  '#ffffff',
  '#e11d48',
  '#f43f5e',
  '#38bdf8',
  '#fbbf24',
  '#10b981',
  '#a855f7',
  '#0f172a',
];

const LAYOUT_TEMPLATES: { id: SlideLayoutTemplate; label: string; icon: any }[] = [
  { id: 'standard', label: 'Estándar', icon: LayoutGrid },
  { id: 'split_comparison', label: 'Antes vs Después', icon: Columns2 },
  { id: 'quote', label: 'Cita / Autoridad', icon: Quote },
  { id: 'big_number', label: 'Métrica / Stat', icon: Hash },
  { id: 'checklist', label: 'Checklist / Pasos', icon: ListOrdered },
  { id: 'cta_final', label: 'Conversión / CTA', icon: Send },
];

const ELEMENT_LABELS: Record<string, string> = {
  badge: 'Insignia / Badge',
  subtag: 'Subtítulo',
  title: 'Título / Gancho Principal',
  body: 'Cuerpo de Texto',
  cta: 'Llamado a la Acción',
  brandName: 'Nombre de Marca',
  brandWeb: 'Sitio Web / Watermark',
};

export const TextStyleBar: React.FC<TextStyleBarProps> = ({
  activeKey,
  slide,
  brand,
  onUpdateStyle,
  onResetStyle,
  onUpdateSlideLayout,
  onUpdateSlideOverlayType,
  onUpdateSlideAccentColor,
}) => {
  const currentLayout = slide.layoutTemplate || 'standard';
  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-2.5">
      
      {/* Top Row: Layout Templates & Format Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        
        {/* Layout Template Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>Formato:</span>
          </span>
          {LAYOUT_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isActive = currentLayout === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => onUpdateSlideLayout?.(tmpl.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tmpl.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overlay Style & Accent Color */}
        <div className="flex items-center gap-2">
          {/* Overlay Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => onUpdateSlideOverlayType?.('gradient')}
              className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                (slide.overlayType || 'gradient') === 'gradient' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Sombreado degradado de cine"
            >
              Degradado
            </button>
            <button
              onClick={() => onUpdateSlideOverlayType?.('solid')}
              className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                slide.overlayType === 'solid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Fondo sólido"
            >
              Sólido
            </button>
            <button
              onClick={() => onUpdateSlideOverlayType?.('card')}
              className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                slide.overlayType === 'card' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Efecto tarjeta Glassmorphism"
            >
              Tarjeta
            </button>
          </div>

          {/* Accent Color Dot & Picker */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400">Color:</span>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onUpdateSlideAccentColor?.(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
              title="Color de acento de la diapositiva"
            />
          </div>
        </div>

      </div>

      {/* Bottom Row: Text Styling Bar (Active when element selected) */}
      {activeKey ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-0.5">
          {/* Target Element Name */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-white text-[11px]">
              Editando: <span className="text-rose-400">{ELEMENT_LABELS[activeKey] || activeKey}</span>
            </span>
          </div>

          {/* Font Family (Grouped) */}
          <select
            value={
              (activeKey === 'brandName' || activeKey === 'brandWeb'
                ? brand.textStyle?.[activeKey]?.fontFamily
                : slide.textStyle?.[activeKey]?.fontFamily) || "'Montserrat', sans-serif"
            }
            onChange={(e) => onUpdateStyle(activeKey, { fontFamily: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <optgroup label="De la Marca (Recomendadas)">
              <option value="'Montserrat', sans-serif">Montserrat (Display / Impacto)</option>
              <option value="'Playfair Display', serif">Playfair Display (Editorial / Elegante)</option>
              <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (SaaS / Tech)</option>
              <option value="'Outfit', sans-serif">Outfit (Dinámico / Bold)</option>
            </optgroup>
            <optgroup label="Del Sistema">
              <option value="'Inter', sans-serif">Inter (Moderno / Neutro)</option>
              <option value="system-ui, sans-serif">System UI (Nativo)</option>
              <option value="Georgia, serif">Georgia (Clásica)</option>
              <option value="'Courier New', monospace">Courier (Monospace)</option>
            </optgroup>
          </select>

          {/* Font Size Stepper */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => {
                const cur = (activeKey === 'brandName' || activeKey === 'brandWeb'
                  ? brand.textStyle?.[activeKey]?.fontSize
                  : slide.textStyle?.[activeKey]?.fontSize) || (activeKey === 'title' ? 24 : 14);
                onUpdateStyle(activeKey, { fontSize: Math.max(8, cur - 2) });
              }}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-bold text-slate-200">
              {(activeKey === 'brandName' || activeKey === 'brandWeb'
                ? brand.textStyle?.[activeKey]?.fontSize
                : slide.textStyle?.[activeKey]?.fontSize) || (activeKey === 'title' ? 24 : 14)}px
            </span>
            <button
              onClick={() => {
                const cur = (activeKey === 'brandName' || activeKey === 'brandWeb'
                  ? brand.textStyle?.[activeKey]?.fontSize
                  : slide.textStyle?.[activeKey]?.fontSize) || (activeKey === 'title' ? 24 : 14);
                onUpdateStyle(activeKey, { fontSize: Math.min(72, cur + 2) });
              }}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color Presets */}
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onUpdateStyle(activeKey, { color: c })}
                className="w-4 h-4 rounded-full border border-slate-700 hover:scale-110 transition"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <input
              type="color"
              onChange={(e) => onUpdateStyle(activeKey, { color: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 ml-1"
              title="Color personalizado"
            />
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => onUpdateStyle(activeKey, { align: 'left' })}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              title="Izquierda"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateStyle(activeKey, { align: 'center' })}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              title="Centrar"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateStyle(activeKey, { align: 'right' })}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              title="Derecha"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Outline */}
          <button
            onClick={() => {
              const cur = (activeKey === 'brandName' || activeKey === 'brandWeb'
                ? brand.textStyle?.[activeKey]?.outline
                : slide.textStyle?.[activeKey]?.outline);
              onUpdateStyle(activeKey, { outline: !cur, outlineColor: '#000000' });
            }}
            className="flex items-center gap-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 px-2 py-1 rounded-xl text-slate-300 transition"
            title="Contorno y sombra de texto"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Sombra</span>
          </button>

          {/* Reset */}
          <button
            onClick={() => onResetStyle(activeKey)}
            className="p-1 text-slate-500 hover:text-rose-400 transition"
            title="Restablecer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
          <span className="flex items-center gap-1.5">
            <Type className="w-4 h-4 text-rose-500" />
            <span>Haz clic sobre cualquier título o texto en el carrusel para personalizarlo.</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Formato activo: <strong className="text-slate-300 uppercase">{currentLayout}</strong>
          </span>
        </div>
      )}

    </div>
  );
};
