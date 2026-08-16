import React, { useState, useRef } from 'react';
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
  Layers,
  Trash2,
  Plus,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  ChevronLeft,
  ChevronRight,
  Heading,
  Tag
} from 'lucide-react';
import { Slide, BrandInfo, TextStyleItem, SlideLayoutTemplate } from '../types';

interface TextStyleBarProps {
  activeKey: string | null;
  slide: Slide;
  brand: BrandInfo;
  onUpdateStyle: (key: string, style: Partial<TextStyleItem>) => void;
  onResetStyle: (key: string) => void;
  onDeleteActiveElement?: (key: string) => void;
  onAddCustomText?: (type?: 'heading' | 'body' | 'badge') => void;
  onUpdateSlideContentAlign?: (align: 'top' | 'center' | 'bottom') => void;
  onUpdateSlideLayout?: (layout: SlideLayoutTemplate) => void;
  onUpdateSlideOverlayType?: (type: 'gradient' | 'solid' | 'card' | 'cinematic') => void;
  onUpdateSlideAccentColor?: (color: string) => void;
}

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

const LAYOUT_TEMPLATES: { id: SlideLayoutTemplate; label: string; icon: any; desc: string }[] = [
  { id: 'standard', label: 'Estándar', icon: LayoutGrid, desc: 'Título, cuerpo y puntos clave' },
  { id: 'split_comparison', label: 'Comparativa', icon: Columns2, desc: 'Antes vs Después / Bien vs Mal' },
  { id: 'quote', label: 'Cita / Autoridad', icon: Quote, desc: 'Frase célebre con autor y rol' },
  { id: 'big_number', label: 'Gran Cifra / Métrica', icon: Hash, desc: 'Estadística de impacto con contexto' },
  { id: 'checklist', label: 'Checklist / Pasos', icon: ListOrdered, desc: 'Pasos secuenciales 1, 2, 3...' },
  { id: 'cta_final', label: 'Conversión / CTA', icon: Send, desc: 'Slide final con botones de interacción' },
];

const ELEMENT_LABELS: Record<string, string> = {
  badge: 'Insignia / Badge',
  subtag: 'Subtítulo',
  title: 'Título Principal',
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
  onDeleteActiveElement,
  onAddCustomText,
  onUpdateSlideContentAlign,
  onUpdateSlideLayout,
  onUpdateSlideOverlayType,
  onUpdateSlideAccentColor,
}) => {
  const currentLayout = slide.layoutTemplate || 'standard';
  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';
  const contentAlign = slide.contentAlign || 'center';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const scrollFormats = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-xl space-y-3">
      
      {/* ========================================================================= */}
      {/* LÍNEA 1: SELECTOR DE FORMATO/PLANTILLA CON SCROLLBAR VISIBLE + BOTONES DE NAVEGACIÓN */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
        
        {/* Plantillas de Formato con scrollbar horizontal suave */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Formato:</span>
          </span>

          {/* Flecha izquierda */}
          <button
            onClick={() => scrollFormats('left')}
            className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 shrink-0 transition"
            title="Desplazar a la izquierda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Contenedor deslizante con scrollbar visible y elegante */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1.5 pt-0.5 max-w-full flex-1"
          >
            {LAYOUT_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              const isActive = currentLayout === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => onUpdateSlideLayout?.(tmpl.id)}
                  title={tmpl.desc}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap shadow-sm ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-rose-900/30'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tmpl.label}</span>
                </button>
              );
            })}
          </div>

          {/* Flecha derecha */}
          <button
            onClick={() => scrollFormats('right')}
            className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 shrink-0 transition"
            title="Desplazar a la derecha"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Botón "+ Añadir Texto" destacado y 100% visible */}
        <div className="relative shrink-0 flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onAddCustomText?.('body')}
              className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-sm"
              title="Añadir un bloque de párrafo de texto libre"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Texto</span>
            </button>
            <button
              onClick={() => onAddCustomText?.('heading')}
              className="flex items-center gap-1 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg text-xs font-medium transition"
              title="Añadir un nuevo titular"
            >
              <Heading className="w-3.5 h-3.5 text-rose-400" />
              <span>Titular</span>
            </button>
            <button
              onClick={() => onAddCustomText?.('badge')}
              className="flex items-center gap-1 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg text-xs font-medium transition"
              title="Añadir una etiqueta destacada"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Badge</span>
            </button>
          </div>

          {/* Botón móvil */}
          <button
            onClick={() => onAddCustomText?.('body')}
            className="sm:hidden flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition w-full shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Añadir Bloque de Texto</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* LÍNEA 2: AJUSTES DE SLIDE (ALINEACIÓN VERTICAL, SOMBREADO/FONDO, COLOR) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        
        {/* Controles de Diapositiva */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Posición vertical */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-1.5 flex items-center gap-1">
              <span>Posición:</span>
            </span>
            <button
              onClick={() => onUpdateSlideContentAlign?.('top')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition ${
                contentAlign === 'top' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Alinear contenido arriba"
            >
              <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Arriba</span>
            </button>
            <button
              onClick={() => onUpdateSlideContentAlign?.('center')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition ${
                contentAlign === 'center' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Alinear contenido al centro"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Centro</span>
            </button>
            <button
              onClick={() => onUpdateSlideContentAlign?.('bottom')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition ${
                contentAlign === 'bottom' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Alinear contenido abajo"
            >
              <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Abajo</span>
            </button>
          </div>

          {/* Overlay / Fondo */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-1.5 hidden sm:inline">Fondo:</span>
            <button
              onClick={() => onUpdateSlideOverlayType?.('gradient')}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition ${
                (slide.overlayType || 'gradient') === 'gradient' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Sombreado degradado de cine"
            >
              Degradado
            </button>
            <button
              onClick={() => onUpdateSlideOverlayType?.('solid')}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition ${
                slide.overlayType === 'solid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Fondo sólido"
            >
              Sólido
            </button>
            <button
              onClick={() => onUpdateSlideOverlayType?.('card')}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition ${
                slide.overlayType === 'card' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Efecto tarjeta Glassmorphism"
            >
              Tarjeta
            </button>
          </div>

          {/* Accent Color Dot & Picker */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400">Color Acento:</span>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onUpdateSlideAccentColor?.(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
              title="Color de acento de la diapositiva"
            />
          </div>

        </div>

        {/* Indicador de estado */}
        <div className="text-[11px] text-slate-500 font-mono hidden lg:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Editor en vivo activo</span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* LÍNEA 3: BARRA CONTEXTUAL DE EDICIÓN DE TEXTO */}
      {/* ========================================================================= */}
      {activeKey ? (
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pt-2 border-t border-slate-800/80 bg-slate-950/40 p-2 rounded-xl">
          {/* Target Element Name */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-slate-800 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-white text-[11px]">
              Editando: <span className="text-rose-400">{ELEMENT_LABELS[activeKey] || activeKey}</span>
            </span>
          </div>

          {/* Font Family */}
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
              title="Reducir tamaño de fuente"
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
              title="Aumentar tamaño de fuente"
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

          {/* Outline / Sombra */}
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

          {/* Delete Element Button */}
          {onDeleteActiveElement && (
            <button
              onClick={() => onDeleteActiveElement(activeKey)}
              className="flex items-center gap-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white px-2.5 py-1 rounded-xl text-xs font-semibold transition shadow-sm"
              title="Eliminar este texto de la diapositiva"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Eliminar</span>
            </button>
          )}

          {/* Reset */}
          <button
            onClick={() => onResetStyle(activeKey)}
            className="p-1 text-slate-500 hover:text-rose-400 transition"
            title="Restablecer formato"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-rose-500" />
            <span>Haz clic sobre cualquier título o texto en el carrusel para personalizarlo, o usa <strong>+ Texto</strong> arriba.</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Formato: <strong className="text-slate-300 uppercase">{currentLayout}</strong>
          </span>
        </div>
      )}

    </div>
  );
};
