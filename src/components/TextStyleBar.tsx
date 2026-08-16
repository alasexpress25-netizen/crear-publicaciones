import React, { useState } from 'react';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Square,
  Maximize2,
  Minimize2,
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
  Loader2,
  X,
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
  onResetStyle?: (key: string) => void;
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

const isBrandKey = (key: string) => key === 'brandName' || key === 'brandWeb' || key === 'brandHandle';

const getDefaultSizeForKey = (key: string): number => {
  if (key === 'stat-number') return 60;
  if (key === 'title' || key === 'cta-headline') return 22;
  if (key === 'quote-text') return 18;
  if (key === 'subtag' || key === 'comp-leftTitle' || key === 'comp-rightTitle' || key === 'stat-label' || key === 'body') return 13;
  if (key === 'cta' || key === 'cta-pill' || key === 'stat-subtext' || key === 'cta-subheadline' || key.startsWith('bullet-')) return 12;
  if (key === 'comp-leftText' || key === 'comp-rightText' || key === 'quote-role' || key === 'brandWeb' || key === 'brandHandle') return 11;
  if (key === 'badge' || key === 'comp-leftTag' || key === 'comp-rightTag') return 10;
  return 13;
};

const getDefaultColorForKey = (key: string, primaryColor: string): string => {
  if (key === 'subtag' || key === 'stat-number' || key === 'brandWeb') return primaryColor;
  if (key === 'brandHandle') return '#94a3b8';
  if (key === 'quote-role') return '#fb7185';
  if (key === 'comp-leftTag') return '#f87171';
  if (key === 'comp-rightTag') return '#34d399';
  if (key === 'body' || key === 'stat-subtext' || key === 'comp-leftText' || key === 'comp-rightText' || key === 'cta' || key === 'cta-subheadline') return '#cbd5e1';
  return '#ffffff';
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
  onAddCustomText,
  onUpdateSlideOverlayType,
  onUpdateSlideAccentColor,
  onUpdateTextPos,
}) => {
  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';
  const [openSubmenu, setOpenSubmenu] = useState<'outline' | 'shadow' | null>(null);

  const currentItemStyle = activeKey
    ? isBrandKey(activeKey)
      ? brand.textStyle?.[activeKey]
      : slide.textStyle?.[activeKey]
    : undefined;

  const isOutlineActive = Boolean(currentItemStyle?.outline);
  const currentOutlineColor = currentItemStyle?.outlineColor || '#000000';
  const currentOutlineWidth = currentItemStyle?.outlineWidth || 2;

  const isShadowActive = Boolean(currentItemStyle?.shadow);
  const currentShadowColor = currentItemStyle?.shadowColor || '#000000';
  const currentShadowType = currentItemStyle?.shadowType || 'soft';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2.5">
      
      {/* ========================================================================= */}
      {/* FILA 1: AÑADIR TEXTOS (+ Texto, Titular, Badge) + MOVER + ACENTO + IDIOMA */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs whitespace-nowrap">
        
        {/* Añadir Textos (+ Texto, Titular, Badge) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => onAddCustomText?.('body')}
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-sm shrink-0"
            title="Añadir un bloque de párrafo de texto libre"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Texto</span>
          </button>
          <button
            onClick={() => onAddCustomText?.('heading')}
            className="flex items-center gap-1 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg text-xs font-medium transition shrink-0"
            title="Añadir un nuevo titular"
          >
            <Heading className="w-3.5 h-3.5 text-rose-400" />
            <span>Titular</span>
          </button>
          <button
            onClick={() => onAddCustomText?.('badge')}
            className="flex items-center gap-1 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg text-xs font-medium transition shrink-0"
            title="Añadir una etiqueta destacada"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Badge</span>
          </button>
        </div>

        {/* Posición / Mover texto libre */}
        {activeKey && (
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-slate-300 shrink-0 shadow-sm">
            <Move className="w-3.5 h-3.5 text-rose-400 mr-1" />
            <span className="text-[11px] font-bold text-slate-400 mr-0.5">Mover:</span>
            <button
              onClick={() => {
                const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                onUpdateTextPos?.(activeKey, { left: currentPos.left, top: Math.max(5, currentPos.top - 3) });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              title="Mover arriba"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                onUpdateTextPos?.(activeKey, { left: currentPos.left, top: Math.min(95, currentPos.top + 3) });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              title="Mover abajo"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                onUpdateTextPos?.(activeKey, { left: Math.max(5, currentPos.left - 3), top: currentPos.top });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              title="Mover izquierda"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                onUpdateTextPos?.(activeKey, { left: Math.min(95, currentPos.left + 3), top: currentPos.top });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              title="Mover derecha"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {slide.textPos?.[activeKey] && (
              <button
                onClick={() => onUpdateTextPos?.(activeKey, null)}
                className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold ml-0.5 transition"
                title="Restablecer posición por defecto"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Accent Color Dot & Picker (Acento a continuación de Mover) */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 shrink-0">
          <span className="text-[11px] font-bold text-slate-400">Acento:</span>
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => onUpdateSlideAccentColor?.(e.target.value)}
            className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
            title="Color de acento de la diapositiva"
          />
        </div>

        {/* Selector de Idioma y Traductor (A continuación de Acento) */}
        {onChangeLanguage && (
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs shrink-0">
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

      {/* ========================================================================= */}
      {/* FILA 2: FORMATO DEL TEXTO SELECCIONADO (CON BARRA DESLIZADORA PARA MÓVIL) */}
      {/* ========================================================================= */}
      {activeKey ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1.5 border-t border-slate-800/80 bg-slate-950/60 p-2 rounded-xl text-xs whitespace-nowrap">

          {/* Tipografía / Font Family */}
          <select
            value={
              (isBrandKey(activeKey)
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

          {/* Tamaño / Font Size Stepper */}
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => {
                const cur = (isBrandKey(activeKey)
                  ? brand.textStyle?.[activeKey]?.fontSize
                  : slide.textStyle?.[activeKey]?.fontSize) || getDefaultSizeForKey(activeKey);
                onUpdateStyle(activeKey, { fontSize: Math.max(8, cur - 2) });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
              title="Reducir tamaño"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
            <span className="px-1 font-mono text-[11px] font-bold text-slate-200 min-w-[28px] text-center">
              {(isBrandKey(activeKey)
                ? brand.textStyle?.[activeKey]?.fontSize
                : slide.textStyle?.[activeKey]?.fontSize) || getDefaultSizeForKey(activeKey)}p
            </span>
            <button
              onClick={() => {
                const cur = (isBrandKey(activeKey)
                  ? brand.textStyle?.[activeKey]?.fontSize
                  : slide.textStyle?.[activeKey]?.fontSize) || getDefaultSizeForKey(activeKey);
                onUpdateStyle(activeKey, { fontSize: Math.min(84, cur + 2) });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
              title="Aumentar tamaño"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Color Presets */}
          {(() => {
            const currentColor = (isBrandKey(activeKey)
              ? brand.textStyle?.[activeKey]?.color
              : slide.textStyle?.[activeKey]?.color) || getDefaultColorForKey(activeKey, primaryColor);
            return (
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 shrink-0">
                {PRESET_COLORS.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateStyle(activeKey, { color: c })}
                    className={`w-3.5 h-3.5 rounded-full border transition ${
                      currentColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-rose-500 scale-110 border-white' : 'border-slate-700 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#ffffff'}
                  onChange={(e) => onUpdateStyle(activeKey, { color: e.target.value })}
                  className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 ml-0.5"
                  title="Color personalizado"
                />
              </div>
            );
          })()}

          {/* Alineación / Alignment */}
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

          {/* Negrita / Cursiva */}
          <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => {
                const cur = (isBrandKey(activeKey)
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
                const cur = (isBrandKey(activeKey)
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

          {/* Contorno (Borde de texto) */}
          <button
            onClick={() => setOpenSubmenu((prev) => (prev === 'outline' ? null : 'outline'))}
            className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
              isOutlineActive
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : openSubmenu === 'outline'
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Personalizar contorno (borde de texto)"
          >
            <Square className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Contorno</span>
            {isOutlineActive && (
              <span
                className="w-2 h-2 rounded-full border border-slate-900 ml-0.5"
                style={{ backgroundColor: currentOutlineColor }}
              />
            )}
          </button>

          {/* Sombra de texto */}
          <button
            onClick={() => setOpenSubmenu((prev) => (prev === 'shadow' ? null : 'shadow'))}
            className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
              isShadowActive
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : openSubmenu === 'shadow'
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Personalizar sombra de texto (difusa, recta, neón, etc.)"
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Sombra</span>
            {isShadowActive && (
              <span
                className="w-2 h-2 rounded-full border border-slate-900 ml-0.5"
                style={{ backgroundColor: currentShadowColor }}
              />
            )}
          </button>

        </div>

        {/* ========================================================================= */}
        {/* PANEL EXPANDIBLE DE CONTORNO (STROKE) */}
        {/* ========================================================================= */}
        {openSubmenu === 'outline' && (
          <div className="bg-slate-950/95 border border-emerald-500/40 rounded-xl p-3 shadow-2xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Contorno de Texto (Borde / Trazo)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onUpdateStyle(activeKey, {
                      outline: !isOutlineActive,
                      outlineColor: currentOutlineColor,
                      outlineWidth: currentOutlineWidth,
                    });
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    isOutlineActive
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isOutlineActive ? 'Activo' : 'Desactivado'}
                </button>
                <button
                  onClick={() => setOpenSubmenu(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Cerrar panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              {/* Grosor de Contorno */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Grosor del Contorno:</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 6].map((w) => (
                    <button
                      key={w}
                      onClick={() => onUpdateStyle(activeKey, { outline: true, outlineWidth: w })}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold transition border ${
                        currentOutlineWidth === w && isOutlineActive
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Color del Contorno */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Color del Contorno:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['#000000', '#ffffff', primaryColor, '#ef4444', '#f59e0b', '#38bdf8', '#10b981', '#a855f7'].map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateStyle(activeKey, { outline: true, outlineColor: c })}
                      className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                        currentOutlineColor === c && isOutlineActive
                          ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-110'
                          : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Color contorno: ${c}`}
                    />
                  ))}
                  <label className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500 transition" title="Selector de color de contorno personalizado">
                    <input
                      type="color"
                      value={currentOutlineColor.startsWith('#') ? currentOutlineColor : '#000000'}
                      onChange={(e) => onUpdateStyle(activeKey, { outline: true, outlineColor: e.target.value })}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-slate-300">+</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL EXPANDIBLE DE SOMBRA (DROP SHADOW) */}
        {/* ========================================================================= */}
        {openSubmenu === 'shadow' && (
          <div className="bg-slate-950/95 border border-amber-500/40 rounded-xl p-3 shadow-2xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Sombra de Texto (Efecto de Profundidad)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onUpdateStyle(activeKey, {
                      shadow: !isShadowActive,
                      shadowColor: currentShadowColor,
                      shadowType: currentShadowType,
                    });
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    isShadowActive
                      ? 'bg-amber-600 text-white hover:bg-amber-500'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isShadowActive ? 'Activa' : 'Desactivada'}
                </button>
                <button
                  onClick={() => setOpenSubmenu(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Cerrar panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              {/* Estilo / Tipo de Sombra */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Tipo de Sombra:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'soft', label: 'Difusa (Suave)' },
                    { id: 'subtle', label: 'Sutil (Tenue)' },
                    { id: 'hard', label: 'Recta / 3D' },
                    { id: 'glow', label: 'Neón / Glow' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => onUpdateStyle(activeKey, { shadow: true, shadowType: type.id as any })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition text-left border ${
                        currentShadowType === type.id && isShadowActive
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color de la Sombra */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Color de la Sombra:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['#000000', primaryColor, '#ffffff', '#f43f5e', '#38bdf8', '#fbbf24', '#8b5cf6', '#10b981'].map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateStyle(activeKey, { shadow: true, shadowColor: c })}
                      className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                        currentShadowColor === c && isShadowActive
                          ? 'border-amber-400 ring-2 ring-amber-500/50 scale-110'
                          : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Color sombra: ${c}`}
                    />
                  ))}
                  <label className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500 transition" title="Selector de color de sombra personalizado">
                    <input
                      type="color"
                      value={currentShadowColor.startsWith('#') ? currentShadowColor : '#000000'}
                      onChange={(e) => onUpdateStyle(activeKey, { shadow: true, shadowColor: e.target.value })}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-slate-300">+</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/60 px-1 overflow-x-auto custom-scrollbar whitespace-nowrap">
          <span className="flex items-center gap-1.5 shrink-0">
            <Type className="w-3.5 h-3.5 text-rose-500" />
            <span>Haz clic sobre cualquier título o texto en la diapositiva para personalizarlo, o usa <strong>+ Texto</strong> arriba.</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline shrink-0 ml-2">
            Tip: Puedes arrastrar y mover libremente los textos sobre el lienzo
          </span>
        </div>
      )}

    </div>
  );
};
