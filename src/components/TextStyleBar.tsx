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
  Blend,
  Palette,
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
  onToggleHideCardBoxes?: () => void;
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

const isContainerKey = (key: string | null) => {
  if (!key) return false;
  return (
    key.includes('-card') ||
    key.includes('-box') ||
    key.includes('-container') ||
    key.includes('grid')
  );
};

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
  onUpdateSlideContentAlign,
  onToggleHideCardBoxes,
}) => {
  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';
  const [openSubmenu, setOpenSubmenu] = useState<'outline' | 'shadow' | null>(null);
  const [colorTargetMode, setColorTargetMode] = useState<'text' | 'fill'>('text');
  const [outlineTab, setOutlineTab] = useState<'text' | 'box'>('text');

  const isContainer = isContainerKey(activeKey);

  const currentItemStyle = activeKey
    ? isBrandKey(activeKey)
      ? brand.textStyle?.[activeKey]
      : slide.textStyle?.[activeKey]
    : undefined;

  const isOutlineActive = Boolean(currentItemStyle?.outline);
  const currentOutlineColor = currentItemStyle?.outlineColor || '#000000';
  const currentOutlineWidth = currentItemStyle?.outlineWidth || 2;

  const isBoxBorderActive = Boolean(
    currentItemStyle?.boxBorder || (isContainer && currentItemStyle?.outline)
  );
  const currentBoxBorderColor =
    currentItemStyle?.boxBorderColor ||
    (isContainer ? currentItemStyle?.outlineColor : undefined) ||
    '#000000';
  const currentBoxBorderWidth =
    currentItemStyle?.boxBorderWidth ||
    (isContainer ? currentItemStyle?.outlineWidth : undefined) ||
    2;

  const isShadowActive = Boolean(currentItemStyle?.shadow);
  const currentShadowColor = currentItemStyle?.shadowColor || '#000000';
  const currentShadowType = currentItemStyle?.shadowType || 'soft';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2.5">
      
      {/* ========================================================================= */}
      {/* FILA 1: AÑADIR TEXTOS (+ Texto, Titular, Badge) + MOVER + RECUADROS + ALINEACIÓN + ACENTO + IDIOMA */}
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
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-slate-300 shrink-0 shadow-sm">
            <Move className="w-3.5 h-3.5 text-rose-400 mr-0.5 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 mr-0.5">Mover:</span>

            {/* Steppers de posición con 5% de salto libre horizontal y vertical */}
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: Math.max(0, currentPos.left - 5), top: currentPos.top });
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Mover a la izquierda (←)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: Math.min(100, currentPos.left + 5), top: currentPos.top });
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Mover a la derecha (→)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: currentPos.left, top: Math.max(0, currentPos.top - 5) });
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Mover arriba (↑)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: currentPos.left, top: Math.min(100, currentPos.top + 5) });
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Mover abajo (↓)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Presets Horizontales rápidos */}
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: 25, top: currentPos.top });
                }}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Colocar horizontalmente a la izquierda (X: 25%)"
              >
                Izq
              </button>
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: 50, top: currentPos.top });
                }}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Centrar horizontalmente (X: 50%)"
              >
                Centro
              </button>
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: 75, top: currentPos.top });
                }}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Colocar horizontalmente a la derecha (X: 75%)"
              >
                Der
              </button>
            </div>

            {/* Presets Verticales rápidos */}
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: currentPos.left, top: 22 });
                }}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Colocar arriba (Y: 22%)"
              >
                Arriba
              </button>
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: currentPos.left, top: 50 });
                }}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Centrar verticalmente (Y: 50%)"
              >
                Medio
              </button>
              <button
                onClick={() => {
                  const currentPos = slide.textPos?.[activeKey] || { left: 50, top: 50 };
                  onUpdateTextPos?.(activeKey, { left: currentPos.left, top: 78 });
                }}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                title="Colocar abajo (Y: 78%)"
              >
                Abajo
              </button>
            </div>

            {slide.textPos?.[activeKey] && (
              <span className="text-[10px] font-mono text-slate-400 px-1 bg-slate-900 border border-slate-800 rounded">
                X:{Math.round(slide.textPos[activeKey].left)}% Y:{Math.round(slide.textPos[activeKey].top)}%
              </span>
            )}

            {slide.textPos?.[activeKey] && (
              <button
                onClick={() => onUpdateTextPos?.(activeKey, null)}
                className="text-[9px] bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-rose-200 px-1.5 py-0.5 rounded font-bold transition"
                title="Restablecer posición original"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Ancho del Recuadro o Elemento en Fila 1 */}
        {activeKey && (
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 shrink-0 text-slate-300 shadow-sm" title="Ancho del recuadro o elemento (reduce el ancho para colocarlo a un lado y no tapar personas)">
            <span className="text-[11px] font-bold text-slate-400">Ancho:</span>
            <select
              value={
                (isBrandKey(activeKey)
                  ? brand.textStyle?.[activeKey]?.width
                  : slide.textStyle?.[activeKey]?.width) ?? 'auto'
              }
              onChange={(e) => {
                const val = e.target.value === 'auto' ? undefined : Number(e.target.value);
                onUpdateStyle(activeKey, { width: val });
              }}
              className="w-[64px] bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="auto">Auto (100%)</option>
              <option value="100">100% (Completo)</option>
              <option value="80">80% (Ancho)</option>
              <option value="65">65% (Medio)</option>
              <option value="50">50% (Mitad / Lateral)</option>
              <option value="40">40% (Compacto)</option>
            </select>
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

          {/* Paleta de Colores con Selector de Modo (Texto / Relleno) */}
          {(() => {
            const currentTextColor = (isBrandKey(activeKey)
              ? brand.textStyle?.[activeKey]?.color
              : slide.textStyle?.[activeKey]?.color) || getDefaultColorForKey(activeKey, primaryColor);

            const isBoxTransparent = Boolean(
              currentItemStyle?.transparentBox || currentItemStyle?.backgroundColor === 'transparent'
            );
            const currentFillColor = isBoxTransparent
              ? 'transparent'
              : currentItemStyle?.backgroundColor || 'transparent';

            const activeDisplayColor = colorTargetMode === 'text' ? currentTextColor : currentFillColor;

            const textPaletteColors = [
              'transparent',
              '#ffffff',
              primaryColor,
              '#38bdf8',
              '#fbbf24',
              '#10b981',
              '#000000',
            ];

            const fillPaletteColors = [
              'transparent',
              '#e11d48',
              '#0f172a',
              '#000000',
              '#ffffff',
              '#38bdf8',
              '#10b981',
              '#fbbf24',
            ];

            return (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0">
                {/* Badge selector: Texto vs Relleno */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5 shrink-0">
                  <button
                    onClick={() => setColorTargetMode('text')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                      colorTargetMode === 'text'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Modo: Cambiar color del texto seleccionado"
                  >
                    Texto
                  </button>
                  <button
                    onClick={() => setColorTargetMode('fill')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                      colorTargetMode === 'fill'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Modo: Cambiar color de fondo / relleno del recuadro del elemento"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full border border-white/30"
                      style={{
                        backgroundColor:
                          currentFillColor === 'transparent' ? 'rgba(255,255,255,0.2)' : currentFillColor,
                      }}
                    />
                    <span>Relleno</span>
                  </button>
                </div>

                {/* Swatches de colores para Texto o Relleno */}
                <div className="flex items-center gap-1">
                  {colorTargetMode === 'text' ? (
                    <>
                      {textPaletteColors.map((c) => {
                        const isTrans = c === 'transparent';
                        const isSelected = currentTextColor.toLowerCase() === c.toLowerCase();
                        if (isTrans) {
                          return (
                            <button
                              key="text-trans"
                              onClick={() => onUpdateStyle(activeKey, { color: 'transparent' })}
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition relative overflow-hidden ${
                                isSelected
                                  ? 'ring-2 ring-rose-500 scale-110 border-white bg-slate-900'
                                  : 'border-slate-600 bg-slate-900 hover:scale-110'
                              }`}
                              title="Color de Texto Transparente (Hueco / Transparente)"
                            >
                              <span className="w-full h-0.5 bg-rose-500 rotate-45 transform origin-center" />
                            </button>
                          );
                        }

                        return (
                          <button
                            key={c}
                            onClick={() => onUpdateStyle(activeKey, { color: c })}
                            className={`w-3.5 h-3.5 rounded-full border transition relative ${
                              isSelected
                                ? 'ring-2 ring-rose-500 scale-110 border-white'
                                : 'border-slate-700 hover:scale-110'
                            }`}
                            style={{ backgroundColor: c }}
                            title={`Color de texto: ${c}`}
                          />
                        );
                      })}
                      <input
                        type="color"
                        value={
                          currentTextColor.startsWith('#') && currentTextColor.length === 7
                            ? currentTextColor
                            : '#ffffff'
                        }
                        onChange={(e) => onUpdateStyle(activeKey, { color: e.target.value })}
                        className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 ml-0.5"
                        title="Selector personalizado de color de texto"
                      />
                    </>
                  ) : (
                    <>
                      {fillPaletteColors.map((c) => {
                        const isTrans = c === 'transparent';
                        const isSelected = isTrans
                          ? isBoxTransparent
                          : !isBoxTransparent && currentFillColor.toLowerCase() === c.toLowerCase();

                        if (isTrans) {
                          return (
                            <button
                              key="trans"
                              onClick={() =>
                                onUpdateStyle(activeKey, {
                                  backgroundColor: 'transparent',
                                  transparentBox: true,
                                })
                              }
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition relative overflow-hidden ${
                                isSelected
                                  ? 'ring-2 ring-rose-500 scale-110 border-white bg-slate-900'
                                  : 'border-slate-600 bg-slate-900 hover:scale-110'
                              }`}
                              title="Relleno Transparente (Sin fondo)"
                            >
                              <span className="w-full h-0.5 bg-rose-500 rotate-45 transform origin-center" />
                            </button>
                          );
                        }

                        return (
                          <button
                            key={c}
                            onClick={() =>
                              onUpdateStyle(activeKey, {
                                backgroundColor: c,
                                transparentBox: false,
                              })
                            }
                            className={`w-3.5 h-3.5 rounded-full border transition relative ${
                              isSelected
                                ? 'ring-2 ring-rose-500 scale-110 border-white'
                                : 'border-slate-700 hover:scale-110'
                            }`}
                            style={{ backgroundColor: c }}
                            title={`Relleno de fondo: ${c}`}
                          />
                        );
                      })}
                      <input
                        type="color"
                        value={
                          currentFillColor.startsWith('#') && currentFillColor.length === 7
                            ? currentFillColor
                            : '#e11d48'
                        }
                        onChange={(e) =>
                          onUpdateStyle(activeKey, {
                            backgroundColor: e.target.value,
                            transparentBox: false,
                          })
                        }
                        className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 ml-0.5"
                        title="Selector personalizado de color de relleno"
                      />
                    </>
                  )}
                </div>
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

          {/* Contorno (Borde de texto / Borde de marco) */}
          <button
            onClick={() => {
              setOpenSubmenu((prev) => (prev === 'outline' ? null : 'outline'));
              if (isContainer) {
                setOutlineTab('box');
              }
            }}
            className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
              isOutlineActive || isBoxBorderActive
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : openSubmenu === 'outline'
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Personalizar contorno de letras y/o borde del marco"
          >
            <Square className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Contorno</span>
            {(isOutlineActive || isBoxBorderActive) && (
              <span
                className="w-2 h-2 rounded-full border border-slate-900 ml-0.5"
                style={{
                  backgroundColor: isOutlineActive ? currentOutlineColor : currentBoxBorderColor,
                }}
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
        {/* PANEL EXPANDIBLE DE CONTORNO (STROKE DE LETRAS Y BORDE DEL MARCO) */}
        {/* ========================================================================= */}
        {openSubmenu === 'outline' && (
          <div className="bg-slate-950/95 border border-emerald-500/40 rounded-xl p-3 shadow-2xl space-y-3">
            {/* Header del Panel */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  {isContainer ? 'Borde del Recuadro / Caja' : 'Contorno de Letras y Borde del Marco'}
                </span>
              </div>
              <button
                onClick={() => setOpenSubmenu(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Cerrar panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pestañas de Selección (Letras vs Marco) para textos */}
            {!isContainer && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOutlineTab('text')}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    outlineTab === 'text'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🔤 Contorno de Letras</span>
                  {isOutlineActive && (
                    <span
                      className="w-2 h-2 rounded-full border border-slate-900"
                      style={{ backgroundColor: currentOutlineColor }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOutlineTab('box')}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    outlineTab === 'box'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🔲 Borde del Marco (Recuadro)</span>
                  {isBoxBorderActive && (
                    <span
                      className="w-2 h-2 rounded-full border border-slate-900"
                      style={{ backgroundColor: currentBoxBorderColor }}
                    />
                  )}
                </button>
              </div>
            )}

            {/* CONTENIDO: CONTORNO DE LETRAS (STROKE) */}
            {!isContainer && outlineTab === 'text' && (
              <div className="space-y-3 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Trazo sobre las letras del texto (sin marcar el recuadro)
                  </span>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Grosor de Contorno de Letras */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Grosor de Letras:</label>
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

                  {/* Color del Contorno de Letras */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Color de Letras:</label>
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
                          title={`Color contorno letras: ${c}`}
                        />
                      ))}
                      <label
                        className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500 transition"
                        title="Color personalizado de letras"
                      >
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

            {/* CONTENIDO: BORDE DEL MARCO / RECUADRO */}
            {(isContainer || outlineTab === 'box') && (
              <div className="space-y-3 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Borde exterior del marco o caja contenedora
                  </span>
                  <button
                    onClick={() => {
                      if (isContainer) {
                        onUpdateStyle(activeKey, {
                          outline: !isBoxBorderActive,
                          outlineColor: currentBoxBorderColor,
                          outlineWidth: currentBoxBorderWidth,
                          boxBorder: !isBoxBorderActive,
                          boxBorderColor: currentBoxBorderColor,
                          boxBorderWidth: currentBoxBorderWidth,
                        });
                      } else {
                        onUpdateStyle(activeKey, {
                          boxBorder: !isBoxBorderActive,
                          boxBorderColor: currentBoxBorderColor,
                          boxBorderWidth: currentBoxBorderWidth,
                        });
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      isBoxBorderActive
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isBoxBorderActive ? 'Activo' : 'Desactivado'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Grosor del Marco */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Grosor del Marco:</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 6].map((w) => (
                        <button
                          key={w}
                          onClick={() => {
                            if (isContainer) {
                              onUpdateStyle(activeKey, {
                                outline: true,
                                outlineWidth: w,
                                boxBorder: true,
                                boxBorderWidth: w,
                              });
                            } else {
                              onUpdateStyle(activeKey, { boxBorder: true, boxBorderWidth: w });
                            }
                          }}
                          className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold transition border ${
                            currentBoxBorderWidth === w && isBoxBorderActive
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {w}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color del Marco */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Color del Marco:</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['#000000', '#ffffff', primaryColor, '#ef4444', '#f59e0b', '#38bdf8', '#10b981', '#a855f7'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            if (isContainer) {
                              onUpdateStyle(activeKey, {
                                outline: true,
                                outlineColor: c,
                                boxBorder: true,
                                boxBorderColor: c,
                              });
                            } else {
                              onUpdateStyle(activeKey, { boxBorder: true, boxBorderColor: c });
                            }
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                            currentBoxBorderColor === c && isBoxBorderActive
                              ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-110'
                              : 'border-slate-700'
                          }`}
                          style={{ backgroundColor: c }}
                          title={`Color borde marco: ${c}`}
                        />
                      ))}
                      <label
                        className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-500 transition"
                        title="Color personalizado del marco"
                      >
                        <input
                          type="color"
                          value={currentBoxBorderColor.startsWith('#') ? currentBoxBorderColor : '#000000'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isContainer) {
                              onUpdateStyle(activeKey, {
                                outline: true,
                                outlineColor: val,
                                boxBorder: true,
                                boxBorderColor: val,
                              });
                            } else {
                              onUpdateStyle(activeKey, { boxBorder: true, boxBorderColor: val });
                            }
                          }}
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
