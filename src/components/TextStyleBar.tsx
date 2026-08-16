import React from 'react';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Heading,
  Tag,
  Move,
  Bold,
  Italic,
  Sparkles,
  Languages,
  Loader2
} from 'lucide-react';
import { Slide, BrandInfo, TextStyleItem, SlideLayoutTemplate } from '../types';

interface TextStyleBarProps {
  activeKey: string | null;
  slide: Slide;
  brand: BrandInfo;
  language?: 'es' | 'pt' | 'en';
  onChangeLanguage?: (lang: 'es' | 'pt' | 'en') => void;
  onTranslateCarousel?: (lang: 'es' | 'pt' | 'en') => void;
  isTranslating?: boolean;
  onUpdateStyle: (key: string, style: Partial<TextStyleItem>) => void;
  onResetStyle: (key: string) => void;
  onDeleteActiveElement?: (key: string) => void;
  onAddCustomText?: (type?: 'heading' | 'body' | 'badge') => void;
  onUpdateSlideOverlayType?: (type: 'gradient' | 'solid' | 'card' | 'cinematic') => void;
  onUpdateSlideAccentColor?: (color: string) => void;
  onUpdateTextPos?: (key: string, pos: { left: number; top: number } | null) => void;
  onUpdateSlideContentAlign?: (align: 'top' | 'center' | 'bottom') => void;
  onUpdateSlideLayout?: (layout: SlideLayoutTemplate) => void;
  onOpenAiRewriteSlide?: () => void;
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
  language,
  onChangeLanguage,
  onTranslateCarousel,
  isTranslating = false,
  onUpdateStyle,
  onResetStyle,
  onDeleteActiveElement,
  onAddCustomText,
  onUpdateSlideOverlayType,
  onUpdateSlideAccentColor,
  onUpdateTextPos,
}) => {
  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2.5">
      
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR: AÑADIR TEXTOS + SOMBREADO/FONDO + COLOR DE ACENTO */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        
        {/* Añadir Textos (+ Texto, Titular, Badge) */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
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
        </div>

        {/* Controles de Fondo, Acento e Idioma */}
        <div className="flex items-center gap-2">
          
          {/* Overlay / Fondo */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-1 hidden sm:inline">Fondo:</span>
            <button
              onClick={() => onUpdateSlideOverlayType?.('gradient')}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition ${
                (slide.overlayType || 'gradient') === 'gradient' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Sombreado degradado"
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
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Acento:</span>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onUpdateSlideAccentColor?.(e.target.value)}
              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
              title="Color de acento de la diapositiva"
            />
          </div>

          {/* Compact Google-Style Language Selector & Translator */}
          {onChangeLanguage && (
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
              <Languages className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <select
                value={language || 'es'}
                onChange={(e) => onChangeLanguage(e.target.value as any)}
                className="bg-transparent text-slate-200 font-bold text-xs focus:outline-none cursor-pointer pr-0.5"
                title="Seleccionar idioma"
              >
                <option value="es" className="bg-slate-900 text-white">ES</option>
                <option value="pt" className="bg-slate-900 text-white">PT</option>
                <option value="en" className="bg-slate-900 text-white">EN</option>
              </select>

              {onTranslateCarousel && (
                <button
                  onClick={() => onTranslateCarousel(language || 'es')}
                  disabled={isTranslating}
                  className="p-1 hover:bg-slate-800 rounded text-rose-400 hover:text-rose-300 transition"
                  title={`Traducir carrusel a ${language === 'pt' ? 'Portugués' : language === 'en' ? 'Inglés' : 'Español'}`}
                >
                  {isTranslating ? (
                    <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-rose-400" />
                  )}
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* BARRA CONTEXTUAL: EDICIÓN DEL ELEMENTO SELECCIONADO (O GUÍA DE USO) */}
      {/* ========================================================================= */}
      {activeKey ? (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1.5 border-t border-slate-800/80 bg-slate-950/60 p-2 rounded-xl text-xs">
          
          {/* Target Element Name */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-rose-400 text-xs truncate max-w-[110px]">
              {ELEMENT_LABELS[activeKey] || activeKey}
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
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-rose-500 shrink-0 max-w-[130px] sm:max-w-[150px] truncate"
          >
            <optgroup label="De la Marca">
              <option value="'Montserrat', sans-serif">Montserrat</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta</option>
              <option value="'Outfit', sans-serif">Outfit</option>
            </optgroup>
            <optgroup label="Del Sistema">
              <option value="'Inter', sans-serif">Inter</option>
              <option value="system-ui, sans-serif">System UI</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Courier New', monospace">Monospace</option>
            </optgroup>
          </select>

          {/* Font Size Stepper */}
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => {
                const cur = (activeKey === 'brandName' || activeKey === 'brandWeb'
                  ? brand.textStyle?.[activeKey]?.fontSize
                  : slide.textStyle?.[activeKey]?.fontSize) || (activeKey === 'title' ? 24 : 14);
                onUpdateStyle(activeKey, { fontSize: Math.max(8, cur - 2) });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
              title="Reducir tamaño"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
            <span className="px-1 font-mono text-[11px] font-bold text-slate-200 min-w-[28px] text-center">
              {(activeKey === 'brandName' || activeKey === 'brandWeb'
                ? brand.textStyle?.[activeKey]?.fontSize
                : slide.textStyle?.[activeKey]?.fontSize) || (activeKey === 'title' ? 24 : 14)}p
            </span>
            <button
              onClick={() => {
                const cur = (activeKey === 'brandName' || activeKey === 'brandWeb'
                  ? brand.textStyle?.[activeKey]?.fontSize
                  : slide.textStyle?.[activeKey]?.fontSize) || (activeKey === 'title' ? 24 : 14);
                onUpdateStyle(activeKey, { fontSize: Math.min(72, cur + 2) });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
              title="Aumentar tamaño"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Color Presets */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 shrink-0">
            {PRESET_COLORS.slice(0, 5).map((c) => (
              <button
                key={c}
                onClick={() => onUpdateStyle(activeKey, { color: c })}
                className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-110 transition"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <input
              type="color"
              onChange={(e) => onUpdateStyle(activeKey, { color: e.target.value })}
              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 ml-0.5"
              title="Color personalizado"
            />
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => onUpdateStyle(activeKey, { align: 'left' })}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Izquierda"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => onUpdateStyle(activeKey, { align: 'center' })}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Centrar"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              onClick={() => onUpdateStyle(activeKey, { align: 'right' })}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Derecha"
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>

          {/* Bold / Italic */}
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => {
                const cur = (activeKey === 'brandName' || activeKey === 'brandWeb'
                  ? brand.textStyle?.[activeKey]?.fontWeight
                  : slide.textStyle?.[activeKey]?.fontWeight) || 'normal';
                onUpdateStyle(activeKey, { fontWeight: cur === 'bold' || cur === '800' || cur === '900' ? 'normal' : 'bold' });
              }}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Negrita / Bold"
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                const cur = (activeKey === 'brandName' || activeKey === 'brandWeb'
                  ? brand.textStyle?.[activeKey]?.fontStyle
                  : slide.textStyle?.[activeKey]?.fontStyle) || 'normal';
                onUpdateStyle(activeKey, { fontStyle: cur === 'italic' ? 'normal' : 'italic' });
              }}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Cursiva / Italic"
            >
              <Italic className="w-3 h-3" />
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
            className="flex items-center gap-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 px-2 py-1 rounded-lg text-slate-300 transition shrink-0"
            title="Sombra de texto"
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Sombra</span>
          </button>

          {/* Posición / Nudge libre (Mover con precisión) */}
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-0.5 text-slate-300 shrink-0">
            <Move className="w-3 h-3 text-rose-400 mr-0.5" />
            <button
              onClick={() => {
                const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                onUpdateTextPos?.(activeKey, { left: currentPos.left, top: Math.max(5, currentPos.top - 3) });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Mover arriba"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                onUpdateTextPos?.(activeKey, { left: currentPos.left, top: Math.min(95, currentPos.top + 3) });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Mover abajo"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                onUpdateTextPos?.(activeKey, { left: Math.max(5, currentPos.left - 3), top: currentPos.top });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Mover izquierda"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                onUpdateTextPos?.(activeKey, { left: Math.min(95, currentPos.left + 3), top: currentPos.top });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Mover derecha"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            {slide.textPos?.[activeKey] && (
              <button
                onClick={() => onUpdateTextPos?.(activeKey, null)}
                className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1 py-0.5 rounded ml-0.5"
                title="Restablecer posición al centro"
              >
                Reset
              </button>
            )}
          </div>

          {/* Delete Element Button */}
          {onDeleteActiveElement && (
            <button
              onClick={() => onDeleteActiveElement(activeKey)}
              className="flex items-center gap-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ml-auto"
              title="Eliminar este texto de la diapositiva"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Eliminar</span>
            </button>
          )}

          {/* Reset */}
          <button
            onClick={() => onResetStyle(activeKey)}
            className="p-1 text-slate-500 hover:text-rose-400 transition shrink-0"
            title="Restablecer formato por defecto"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/60 px-1">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-rose-500" />
            <span>Haz clic sobre cualquier título o texto en la diapositiva para personalizarlo, o usa <strong>+ Texto</strong> arriba.</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Tip: Puedes arrastrar y mover libremente los textos sobre el lienzo
          </span>
        </div>
      )}

    </div>
  );
};
