import React, { useState, useRef } from 'react';
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
  Layers,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  PaintBucket,
  Image as ImageIcon,
  Upload,
  Trash2,
  Undo2,
  Redo2,
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
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUpdateStyle: (key: string, style: Partial<TextStyleItem>) => void;
  onResetStyle?: (key: string) => void;
  onDeleteActiveElement?: (key: string) => void;
  onAddCustomText?: (type?: 'heading' | 'body' | 'badge' | 'accent' | 'box' | 'image', payload?: { imageUrl?: string }) => void;
  onAddCustomImage?: (fileOrUrl: string) => void;
  onSelectElement?: (key: string | null) => void;
  onUpdateBrand?: (field: keyof BrandInfo, value: any) => void;
  onUpdateSlideOverlayType?: (type: 'gradient' | 'solid' | 'card' | 'cinematic') => void;
  onUpdateSlideAccentColor?: (color: string) => void;
  onUpdateSlideBackgroundColor?: (color: string) => void;
  onUpdateTextPos?: (key: string | Record<string, { left: number; top: number } | null>, pos?: { left: number; top: number } | null) => void;
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

const isBrandKey = (key: string) =>
  key === 'brandName' || key === 'brandWeb' || key === 'brandHandle' || key === 'brandLogo';

const isLogoKey = (key: string | null) =>
  key === 'brandLogo' || key === 'cta-avatar' || Boolean(key && (key.startsWith('custom-img-') || key.startsWith('custom-image-')));

const isAccentKey = (key: string | null) => {
  if (!key) return false;
  return key.startsWith('custom-accent-') || key === 'quote-icon';
};

const isContainerKey = (key: string | null) => {
  if (!key) return false;
  return (
    key.includes('-card') ||
    key.includes('-box') ||
    key.includes('-container') ||
    key.includes('grid') ||
    key.startsWith('custom-box-')
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onUpdateStyle,
  onResetStyle,
  onDeleteActiveElement,
  onAddCustomText,
  onAddCustomImage,
  onSelectElement,
  onUpdateBrand,
  onUpdateSlideOverlayType,
  onUpdateSlideAccentColor,
  onUpdateSlideBackgroundColor,
  onUpdateTextPos,
  onUpdateSlideContentAlign,
  onToggleHideCardBoxes,
}) => {
  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';
  const [openSubmenu, setOpenSubmenu] = useState<'move' | 'layers' | 'outline' | 'shadow' | 'background' | null>(null);
  const [colorTargetMode, setColorTargetMode] = useState<'text' | 'fill'>('text');
  const [outlineTab, setOutlineTab] = useState<'text' | 'box'>('text');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (onAddCustomImage) {
          onAddCustomImage(result);
        } else if (onAddCustomText) {
          onAddCustomText('image', { imageUrl: result });
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setIsAddMenuOpen(false);
  };

  const isContainer = isContainerKey(activeKey);

  const currentItemStyle = activeKey
    ? isBrandKey(activeKey)
      ? brand.textStyle?.[activeKey]
      : slide.textStyle?.[activeKey]
    : undefined;

  const currentZIndex = currentItemStyle?.zIndex !== undefined ? currentItemStyle.zIndex : 30;

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

  const isLogo = isLogoKey(activeKey);
  const isAccent = isAccentKey(activeKey);

  const getSlideElements = () => {
    const list: { key: string; label: string; icon: string }[] = [];
    list.push({ key: 'brandLogo', label: 'Logo de Marca', icon: '🖼️' });
    list.push({ key: 'brandName', label: 'Nombre de Marca', icon: '🏷️' });
    list.push({ key: 'brandHandle', label: 'Usuario / Handle', icon: '👤' });

    if (slide.badge) list.push({ key: 'badge', label: 'Badge / Etiqueta', icon: '✨' });
    if (slide.subtag) list.push({ key: 'subtag', label: 'Sub-etiqueta', icon: '🏷️' });
    if (slide.title) list.push({ key: 'title', label: 'Título Principal', icon: '🔤' });
    if (slide.body) list.push({ key: 'body', label: 'Cuerpo de Texto', icon: '📄' });

    if (slide.bullets && slide.bullets.length > 0) {
      slide.bullets.forEach((_, i) => {
        list.push({ key: `bullet-${i}`, label: `Punto Clave ${i + 1}`, icon: '📌' });
      });
    }

    if (slide.layoutTemplate === 'quote' || slide.quote) {
      list.push({ key: 'quote-icon', label: 'Icono de Cita (Acento)', icon: '✨' });
      list.push({ key: 'quote-text', label: 'Texto de la Cita', icon: '💬' });
      list.push({ key: 'quote-author', label: 'Autor de la Cita', icon: '👤' });
      list.push({ key: 'quote-role', label: 'Cargo / Rol', icon: '🏷️' });
    }

    if (slide.layoutTemplate === 'big_number' || slide.stat) {
      list.push({ key: 'stat-number', label: 'Cifra / Métrica', icon: '📊' });
      list.push({ key: 'stat-label', label: 'Etiqueta Métrica', icon: '🏷️' });
      list.push({ key: 'stat-subtext-box', label: 'Recuadro Explicación', icon: '🔲' });
      list.push({ key: 'stat-subtext', label: 'Texto Explicativo', icon: '📄' });
    }

    if (slide.layoutTemplate === 'split_comparison' || slide.comparison) {
      list.push({ key: 'comp-left-card', label: 'Recuadro Tarjeta Izq', icon: '🔲' });
      list.push({ key: 'comp-leftTag', label: 'Etiqueta Izq (Acento)', icon: '✨' });
      list.push({ key: 'comp-leftTitle', label: 'Título Izq', icon: '🔤' });
      list.push({ key: 'comp-leftText', label: 'Texto Izq', icon: '📄' });
      list.push({ key: 'comp-right-card', label: 'Recuadro Tarjeta Der', icon: '🔲' });
      list.push({ key: 'comp-rightTag', label: 'Etiqueta Der (Acento)', icon: '✨' });
      list.push({ key: 'comp-rightTitle', label: 'Título Der', icon: '🔤' });
      list.push({ key: 'comp-rightText', label: 'Texto Der', icon: '📄' });
    }

    if (slide.layoutTemplate === 'cta_final' || slide.ctaFinal) {
      list.push({ key: 'cta-avatar', label: 'Avatar / Logo CTA', icon: '🖼️' });
      list.push({ key: 'cta-headline', label: 'Titular de Acción', icon: '📢' });
      list.push({ key: 'cta-subheadline-card', label: 'Recuadro Subtitular', icon: '🔲' });
      list.push({ key: 'cta-subheadline', label: 'Subtitular', icon: '📄' });
      list.push({ key: 'cta-pill', label: 'Botón Pill (Acento)', icon: '✨' });
    }

    if (slide.cta) list.push({ key: 'cta', label: 'Llamada al pie (CTA)', icon: '👉' });
    list.push({ key: 'brandWeb', label: 'Sitio Web / Enlace', icon: '🌐' });

    if (slide.customTexts && slide.customTexts.length > 0) {
      slide.customTexts.forEach((c) => {
        if (c.type === 'box' || c.id.startsWith('custom-box-')) {
          list.push({ key: c.id, label: `Recuadro: ${c.text?.slice(0, 16) || 'Caja'}...`, icon: '🔲' });
        } else if (c.type === 'accent' || c.id.startsWith('custom-accent-')) {
          list.push({ key: c.id, label: 'Línea / Acento Decorativo', icon: '✨' });
        } else if (c.type === 'image' || c.id.startsWith('custom-img-') || c.id.startsWith('custom-image-')) {
          list.push({ key: c.id, label: 'Imagen / Logo Subido', icon: '🖼️' });
        } else {
          list.push({ key: c.id, label: `Texto: ${c.text?.slice(0, 16) || 'Personalizado'}...`, icon: '✍️' });
        }
      });
    }

    const hiddenSet = new Set([...(slide.hiddenElements || []), ...(brand.hiddenElements || [])]);
    return list.filter((item) => !hiddenSet.has(item.key));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2.5">
      
      {/* ========================================================================= */}
      {/* FILA 1: MENÚ DESPLEGABLE AÑADIR ELEMENTO + SELECTOR + MOVER + CAPAS + FONDO */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 relative z-30 text-xs overflow-visible">
        
        {/* Menú Desplegable: + Añadir Elemento */}
        <div className="relative shrink-0 z-40">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddMenuOpen((prev) => !prev);
              setOpenSubmenu(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm border ${
              isAddMenuOpen
                ? 'bg-rose-600 border-rose-500 text-white shadow-rose-950/40 ring-2 ring-rose-500/30'
                : 'bg-rose-600 hover:bg-rose-500 border-rose-500/80 text-white'
            }`}
            title="Añadir nuevo elemento al lienzo (Texto, Titular, Badge, Acento, Recuadro, Imagen/Logo)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Elemento</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAddMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddMenuOpen(false);
                }}
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 border-b border-slate-800/80">
                  Incorporar al Lienzo
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    onAddCustomText?.('body');
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition text-left group"
                >
                  <div className="p-1 rounded-lg bg-slate-800 group-hover:bg-rose-600/30 text-rose-400">
                    <Type className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">Párrafo / Texto</div>
                    <div className="text-[10px] text-slate-400">Bloque de texto libre editable</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onAddCustomText?.('heading');
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition text-left group"
                >
                  <div className="p-1 rounded-lg bg-slate-800 group-hover:bg-purple-600/30 text-purple-400">
                    <Heading className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">Titular / Encabezado</div>
                    <div className="text-[10px] text-slate-400">Texto de gran tamaño e impacto</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onAddCustomText?.('badge');
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition text-left group"
                >
                  <div className="p-1 rounded-lg bg-slate-800 group-hover:bg-amber-600/30 text-amber-400">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">Badge / Etiqueta</div>
                    <div className="text-[10px] text-slate-400">Pastilla de categoría o highlight</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onAddCustomText?.('accent');
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition text-left group"
                >
                  <div className="p-1 rounded-lg bg-slate-800 group-hover:bg-emerald-600/30 text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">Línea de Acento</div>
                    <div className="text-[10px] text-slate-400">Barra decorativa con resplandor</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onAddCustomText?.('box');
                    setIsAddMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition text-left group"
                >
                  <div className="p-1 rounded-lg bg-slate-800 group-hover:bg-sky-600/30 text-sky-400">
                    <Square className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">Recuadro / Tarjeta</div>
                    <div className="text-[10px] text-slate-400">Caja de fondo con bordes y sombra</div>
                  </div>
                </button>

                <div className="pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl transition text-left group bg-slate-950/60 border border-slate-800"
                  >
                    <div className="p-1 rounded-lg bg-slate-800 group-hover:bg-pink-600/30 text-pink-400">
                      <Upload className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-pink-300 group-hover:text-pink-200 flex items-center gap-1">
                        <span>Imagen o Logo</span>
                        <span className="text-[9px] bg-pink-950/80 text-pink-400 border border-pink-500/40 px-1 rounded font-bold">Desde PC</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Subir PNG, JPG o SVG local</div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Botones Deshacer (Undo) y Rehacer (Redo) - Solo Iconos */}
        {(onUndo && onRedo) && (
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5 shrink-0 shadow-sm">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                canUndo
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="Deshacer último cambio (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-slate-800 mx-0.5" />

            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                canRedo
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="Rehacer cambio (Ctrl+Y o Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable toolbar items for secondary controls */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5 min-w-0 flex-1 whitespace-nowrap">
          {/* Selector Rápido de Capa / Elemento */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 shrink-0 text-slate-300 shadow-sm" title="Seleccionar cualquier capa o elemento del lienzo">
            <span className="text-[11px] font-bold text-slate-400">Capa:</span>
            <select
              value={activeKey || ''}
              onChange={(e) => onSelectElement?.(e.target.value || null)}
              className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer max-w-[130px] sm:max-w-[160px] truncate font-medium"
            >
              <option value="">🎯 Seleccionar...</option>
              {getSlideElements().map((el) => (
                <option key={el.key} value={el.key}>
                  {el.icon} {el.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Desplegable Mover */}
          {activeKey && (
            <button
              type="button"
              onClick={() => setOpenSubmenu((prev) => (prev === 'move' ? null : 'move'))}
              className={`flex items-center gap-1 border px-2.5 py-1 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm ${
                openSubmenu === 'move'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : slide.textPos?.[activeKey]
                  ? 'bg-slate-900 border-rose-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Desplegar controles de posición y movimiento"
            >
              <Move className="w-3.5 h-3.5 text-rose-400" />
              <span>Mover</span>
              {slide.textPos?.[activeKey] && (
                <span className="text-[10px] font-mono text-rose-300 bg-rose-950/80 px-1 rounded border border-rose-800/60 ml-0.5">
                  X:{Math.round(slide.textPos[activeKey].left)}% Y:{Math.round(slide.textPos[activeKey].top)}%
                </span>
              )}
            </button>
          )}

          {/* Botón Desplegable Capas (Ubicado justo después de Mover en Fila 1) */}
          {activeKey && (
            <button
              type="button"
              onClick={() => setOpenSubmenu((prev) => (prev === 'layers' ? null : 'layers'))}
              className={`flex items-center gap-1 border px-2.5 py-1 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm ${
                openSubmenu === 'layers'
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Desplegar control de capas (Atrás, Adelante, +, -)"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Capas</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 ml-0.5">
                C:{currentZIndex}
              </span>
            </button>
          )}

          {/* Ancho del Recuadro o Elemento en Fila 1 */}
          {activeKey && (
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 shrink-0 text-slate-300 shadow-sm" title="Ancho del recuadro o elemento">
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
                className="w-[60px] bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="auto">Auto</option>
                <option value="100">100%</option>
                <option value="80">80%</option>
                <option value="65">65%</option>
                <option value="50">50%</option>
                <option value="40">40%</option>
              </select>
            </div>
          )}

          {/* Botón Eliminar Elemento Activo en Fila 1 */}
          {activeKey && (
            <button
              type="button"
              onClick={() => onDeleteActiveElement?.(activeKey)}
              className="flex items-center gap-1 bg-rose-950/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/80 px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 shadow-sm"
              title="Eliminar este objeto del lienzo"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Eliminar</span>
            </button>
          )}

          {/* Solapa Fondo / Capa 0: Color de fondo sólido de la diapositiva */}
          <button
            type="button"
            onClick={() => setOpenSubmenu((prev) => (prev === 'background' ? null : 'background'))}
            className={`flex items-center gap-1 border px-2.5 py-1 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm ${
              openSubmenu === 'background'
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Color sólido de fondo de la diapositiva (Capa 0)"
          >
            <PaintBucket className="w-3.5 h-3.5 text-purple-400" />
            <span>Fondo</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-slate-700 ml-0.5 shadow-sm"
              style={{ backgroundColor: slide.backgroundColor || '#020617' }}
            />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILA 2: FORMATO DEL ELEMENTO SELECCIONADO (TEXTO, LOGO, ACENTO O RECUADRO) */}
      {/* ========================================================================= */}
      {activeKey ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1.5 border-t border-slate-800/80 bg-slate-950/60 p-2 rounded-xl text-xs whitespace-nowrap">

          {/* CASO 1: LOGO O IMAGEN (brandLogo, cta-avatar, custom-img-*) */}
          {isLogo ? (
            <>
              <div className="flex items-center gap-1 px-2 py-1 bg-rose-950/50 border border-rose-500/40 rounded-lg text-rose-300 font-bold shrink-0">
                <span>
                  {activeKey === 'brandLogo'
                    ? '🖼️ Logo Marca'
                    : activeKey === 'cta-avatar'
                    ? '🖼️ Avatar CTA'
                    : '🖼️ Imagen / Logo'}
                </span>
              </div>

              {/* Tamaño del Logo / Imagen - Stepper + Slider + Presets */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0" title="Tamaño (Altura / Escala)">
                <span className="text-[11px] font-bold text-slate-400">Tamaño:</span>
                <button
                  onClick={() => {
                    const cur = (isBrandKey(activeKey) ? brand.textStyle?.[activeKey]?.height : slide.textStyle?.[activeKey]?.height) || (activeKey === 'brandLogo' ? brand.logoSize || 24 : 80);
                    const next = Math.max(16, Number(cur) - 6);
                    onUpdateStyle(activeKey, { height: next });
                    if (activeKey === 'brandLogo' && onUpdateBrand) onUpdateBrand('logoSize', next);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
                  title="Reducir tamaño"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>

                <input
                  type="range"
                  min="16"
                  max={activeKey === 'brandLogo' ? '180' : '420'}
                  value={((isBrandKey(activeKey) ? brand.textStyle?.[activeKey]?.height : slide.textStyle?.[activeKey]?.height) || (activeKey === 'brandLogo' ? brand.logoSize || 24 : 80))}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateStyle(activeKey, { height: val });
                    if (activeKey === 'brandLogo' && onUpdateBrand) onUpdateBrand('logoSize', val);
                  }}
                  className="w-16 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  title="Deslizar para achicar o agrandar"
                />

                <span className="px-1 font-mono text-[11px] font-bold text-slate-200 min-w-[32px] text-center">
                  {((isBrandKey(activeKey) ? brand.textStyle?.[activeKey]?.height : slide.textStyle?.[activeKey]?.height) || (activeKey === 'brandLogo' ? brand.logoSize || 24 : 80))}px
                </span>

                <button
                  onClick={() => {
                    const cur = (isBrandKey(activeKey) ? brand.textStyle?.[activeKey]?.height : slide.textStyle?.[activeKey]?.height) || (activeKey === 'brandLogo' ? brand.logoSize || 24 : 80);
                    const maxH = activeKey === 'brandLogo' ? 180 : 420;
                    const next = Math.min(maxH, Number(cur) + 6);
                    onUpdateStyle(activeKey, { height: next });
                    if (activeKey === 'brandLogo' && onUpdateBrand) onUpdateBrand('logoSize', next);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
                  title="Aumentar tamaño"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>

                {/* Presets Rápidos de Tamaño */}
                <div className="flex items-center gap-0.5 ml-1 border-l border-slate-800 pl-1">
                  {[32, 64, 100, 160, 240].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        onUpdateStyle(activeKey, { height: sz });
                        if (activeKey === 'brandLogo' && onUpdateBrand) onUpdateBrand('logoSize', sz);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                        ((isBrandKey(activeKey) ? brand.textStyle?.[activeKey]?.height : slide.textStyle?.[activeKey]?.height) || (activeKey === 'brandLogo' ? brand.logoSize || 24 : 80)) === sz
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Forma y Redondeo de Esquinas */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0" title="Forma / Esquinas de la imagen">
                <span className="text-[11px] font-bold text-slate-400">Esquinas:</span>
                {[
                  { label: 'Recto', val: 0 },
                  { label: 'Suave', val: 12 },
                  { label: 'Redondo', val: 24 },
                  { label: 'Círculo', val: 9999 },
                ].map((shape) => (
                  <button
                    key={shape.val}
                    onClick={() => onUpdateStyle(activeKey, { borderRadius: shape.val })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                      (currentItemStyle?.borderRadius !== undefined ? currentItemStyle.borderRadius : 12) === shape.val
                        ? 'bg-rose-950 border border-rose-500 text-rose-200'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>

              {/* Opacidad / Transparencia */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0" title="Transparencia de la imagen">
                <span className="text-[11px] font-bold text-slate-400">Opacidad:</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={Math.round((currentItemStyle?.opacity !== undefined ? currentItemStyle.opacity : 1) * 100)}
                  onChange={(e) => {
                    const val = Number(e.target.value) / 100;
                    onUpdateStyle(activeKey, { opacity: val });
                  }}
                  className="w-14 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="font-mono text-[10px] text-slate-300 min-w-[28px] text-right">
                  {Math.round((currentItemStyle?.opacity !== undefined ? currentItemStyle.opacity : 1) * 100)}%
                </span>
              </div>

              {/* Fondo / Relleno del contenedor del Logo */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[11px] font-bold text-slate-400">Fondo:</span>
                {['transparent', '#020617', 'rgba(15,23,42,0.85)', primaryColor, '#ffffff'].map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateStyle(activeKey, { backgroundColor: c })}
                    className="w-4 h-4 rounded-full border border-slate-700 hover:scale-110 transition"
                    style={{ backgroundColor: c === 'transparent' ? '#1e293b' : c }}
                    title={`Fondo: ${c}`}
                  />
                ))}
              </div>

              {/* Borde del Marco del Logo */}
              <button
                onClick={() => {
                  setOpenSubmenu((prev) => (prev === 'outline' ? null : 'outline'));
                  setOutlineTab('box');
                }}
                className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  isBoxBorderActive ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
                title="Borde del marco del logo"
              >
                <Square className="w-3 h-3 text-emerald-400" />
                <span>Borde</span>
              </button>

              {/* Sombra / Glow del Logo */}
              <button
                onClick={() => setOpenSubmenu((prev) => (prev === 'shadow' ? null : 'shadow'))}
                className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  isShadowActive ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
                title="Resplandor / Sombra del logo"
              >
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Sombra / Glow</span>
              </button>
            </>
          ) : isAccent ? (
            /* CASO 2: ACENTO (custom-accent-*, quote-icon, badge, comp-leftTag, comp-rightTag, cta-pill) */
            <>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-emerald-300 font-bold shrink-0">
                <span>✨ Acento</span>
              </div>

              {/* Selector de Color del Acento */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[11px] font-bold text-slate-400">Color:</span>
                {[primaryColor, '#38bdf8', '#fbbf24', '#10b981', '#a855f7', '#ffffff', '#f43f5e'].map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateStyle(activeKey, { color: c, backgroundColor: c })}
                    className="w-4 h-4 rounded-full border border-slate-700 hover:scale-110 transition"
                    style={{ backgroundColor: c }}
                    title={`Color: ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={currentItemStyle?.color || primaryColor}
                  onChange={(e) => onUpdateStyle(activeKey, { color: e.target.value, backgroundColor: e.target.value })}
                  className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 ml-0.5"
                  title="Color personalizado"
                />
              </div>

              {/* Grosor / Altura del Acento */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[11px] font-bold text-slate-400">Grosor:</span>
                {[2, 4, 6, 8, 12].map((h) => (
                  <button
                    key={h}
                    onClick={() => onUpdateStyle(activeKey, { height: h })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                      (currentItemStyle?.height || 4) === h ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {h}px
                  </button>
                ))}
              </div>

              {/* Sombra / Glow Neón del Acento */}
              <button
                onClick={() => setOpenSubmenu((prev) => (prev === 'shadow' ? null : 'shadow'))}
                className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  isShadowActive ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
                title="Resplandor neón del acento"
              >
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Glow Neón</span>
              </button>
            </>
          ) : isContainer ? (
            /* CASO 3: RECUADRO / TARJETA (custom-box-*, cards, containers) */
            <>
              <div className="flex items-center gap-1 px-2 py-1 bg-sky-950/50 border border-sky-500/40 rounded-lg text-sky-300 font-bold shrink-0">
                <span>🔲 Recuadro</span>
              </div>

              {/* Relleno / Fondo del Recuadro */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[11px] font-bold text-slate-400">Relleno:</span>
                {['rgba(15,23,42,0.85)', '#09090b', 'rgba(0,0,0,0.6)', primaryColor, 'transparent'].map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateStyle(activeKey, { backgroundColor: c, transparentBox: c === 'transparent' })}
                    className="w-4 h-4 rounded-full border border-slate-700 hover:scale-110 transition"
                    style={{ backgroundColor: c === 'transparent' ? '#1e293b' : c }}
                    title={`Fondo: ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={currentItemStyle?.backgroundColor || '#09090b'}
                  onChange={(e) => onUpdateStyle(activeKey, { backgroundColor: e.target.value, transparentBox: false })}
                  className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 ml-0.5"
                  title="Color personalizado"
                />
              </div>

              {/* Borde del Marco del Recuadro */}
              <button
                onClick={() => {
                  setOpenSubmenu((prev) => (prev === 'outline' ? null : 'outline'));
                  setOutlineTab('box');
                }}
                className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  isBoxBorderActive ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
                title="Borde y esquinas del recuadro"
              >
                <Square className="w-3 h-3 text-emerald-400" />
                <span>Borde & Esquinas</span>
              </button>

              {/* Sombra del Recuadro */}
              <button
                onClick={() => setOpenSubmenu((prev) => (prev === 'shadow' ? null : 'shadow'))}
                className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  isShadowActive ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
                title="Sombra de la tarjeta"
              >
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Sombra</span>
              </button>
            </>
          ) : (
            /* CASO 4: TEXTO REGULAR (Título, Párrafo, Cita, etc.) */
            <>
              {/* Tipografía / Font Family (Selección Google Fonts) */}
              <select
                value={
                  (isBrandKey(activeKey)
                    ? brand.textStyle?.[activeKey]?.fontFamily
                    : slide.textStyle?.[activeKey]?.fontFamily) || "'Montserrat', sans-serif"
                }
                onChange={(e) => onUpdateStyle(activeKey, { fontFamily: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-rose-500 shrink-0 max-w-[140px] sm:max-w-[170px] truncate cursor-pointer font-medium"
              >
                <optgroup label="🔥 Impacto / Titulares">
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                  <option value="'Anton', sans-serif">Anton</option>
                  <option value="'Oswald', sans-serif">Oswald</option>
                  <option value="'Syne', sans-serif">Syne</option>
                </optgroup>
                <optgroup label="⚡ Modernas / Tech">
                  <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'Outfit', sans-serif">Outfit</option>
                  <option value="'Manrope', sans-serif">Manrope</option>
                  <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                  <option value="'Sora', sans-serif">Sora</option>
                  <option value="'Urbanist', sans-serif">Urbanist</option>
                  <option value="'Inter', sans-serif">Inter</option>
                </optgroup>
                <optgroup label="✨ Elegantes / Editorial (Serif)">
                  <option value="'Playfair Display', serif">Playfair Display</option>
                  <option value="'Cinzel', serif">Cinzel</option>
                  <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
                  <option value="'DM Serif Display', serif">DM Serif Display</option>
                  <option value="'Bodoni Moda', serif">Bodoni Moda</option>
                  <option value="Georgia, serif">Georgia</option>
                </optgroup>
                <optgroup label="✍️ Manuscritas / Acentos">
                  <option value="'Caveat', cursive">Caveat</option>
                  <option value="'Pacifico', cursive">Pacifico</option>
                  <option value="'Dancing Script', cursive">Dancing Script</option>
                </optgroup>
                <optgroup label="💻 Sistema">
                  <option value="system-ui, sans-serif">System UI</option>
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
            </>
          )}

        </div>

        {/* ========================================================================= */}
        {/* PANEL EXPANDIBLE DE MOVER (POSICIÓN, STEPPERS Y ALINEACIONES RÁPIDAS) */}
        {/* ========================================================================= */}
        {openSubmenu === 'move' && (() => {
          const getEffectiveTargetKey = (key: string): string => {
            if (key.startsWith('bullet-')) {
              return slide.layoutTemplate === 'checklist' ? 'checklist-container' : 'bullets-container';
            }
            if (key === 'stat-subtext') return 'stat-subtext-box';
            if (key === 'cta-subheadline') return 'cta-subheadline-card';
            if (key === 'comp-leftTag' || key === 'comp-leftTitle' || key === 'comp-leftText') return 'comp-grid';
            if (key === 'comp-rightTag' || key === 'comp-rightTitle' || key === 'comp-rightText') return 'comp-grid';
            if (key === 'quote-text' || key === 'quote-author' || key === 'quote-role' || key === 'quote-icon') return 'quote-container';
            return key;
          };

          const targetKey = getEffectiveTargetKey(activeKey);
          const hasPos = Boolean(slide.textPos && (slide.textPos[targetKey] || slide.textPos[activeKey]));

          const getElementPos = (): { left: number; top: number } => {
            let currentPos = slide.textPos?.[targetKey] || slide.textPos?.[activeKey];
            if (!currentPos && typeof document !== 'undefined') {
              const el = (document.querySelector(`[data-drag-key="${targetKey}"]`) || document.querySelector(`[data-drag-key="${activeKey}"]`)) as HTMLElement;
              const cont = document.getElementById('active-canvas-slide-container');
              if (el && cont) {
                const rEl = el.getBoundingClientRect();
                const rCont = cont.getBoundingClientRect();
                currentPos = {
                  left: Math.round((((rEl.left - rCont.left) / rCont.width) * 100) * 10) / 10,
                  top: Math.round((((rEl.top - rCont.top) / rCont.height) * 100) * 10) / 10,
                };
              }
            }
            return currentPos || { left: 5, top: 40 };
          };

          const getElementDimensions = (): { widthPct: number; heightPct: number } => {
            let widthPct = 85;
            let heightPct = 15;
            if (typeof document !== 'undefined') {
              const el = (document.querySelector(`[data-drag-key="${targetKey}"]`) || document.querySelector(`[data-drag-key="${activeKey}"]`)) as HTMLElement;
              const cont = document.getElementById('active-canvas-slide-container');
              if (el && cont) {
                const rEl = el.getBoundingClientRect();
                const rCont = cont.getBoundingClientRect();
                widthPct = Math.round(((rEl.width / rCont.width) * 100) * 10) / 10;
                heightPct = Math.round(((rEl.height / rCont.height) * 100) * 10) / 10;
              }
            }
            return { widthPct, heightPct };
          };

          return (
            <div className="bg-slate-950/95 border border-rose-500/40 rounded-xl p-3 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white">
                    {targetKey.startsWith('bullets-container') || targetKey.startsWith('checklist-container')
                      ? 'Posición Libre (Lista Completa de Puntos Clave)'
                      : targetKey.includes('card') || targetKey.includes('box') || targetKey.includes('grid')
                      ? 'Posición Libre del Recuadro / Tarjeta'
                      : 'Posición Libre en el Lienzo'}
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    {slide.textPos?.[targetKey]
                      ? `X: ${slide.textPos[targetKey]!.left}% | Y: ${slide.textPos[targetKey]!.top}%`
                      : 'Posición automática'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasPos && (
                    <button
                      onClick={() => onUpdateTextPos?.({ [targetKey]: null, [activeKey]: null } as any)}
                      className="text-[10px] bg-slate-900 hover:bg-rose-900 text-slate-300 hover:text-rose-200 px-2 py-1 rounded-lg font-bold border border-slate-800 transition"
                      title="Restablecer posición original"
                    >
                      Resetear Posición
                    </button>
                  )}
                  <button
                    onClick={() => setOpenSubmenu(null)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Cerrar panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Steppers con flechas */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Paso a Paso (Flechas):</span>
                  <div className="flex items-center justify-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        onUpdateTextPos?.(targetKey, { left: Math.max(-50, pos.left - 4), top: pos.top });
                      }}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                      title="Izquierda (←)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        onUpdateTextPos?.(targetKey, { left: Math.min(150, pos.left + 4), top: pos.top });
                      }}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                      title="Derecha (→)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        onUpdateTextPos?.(targetKey, { left: pos.left, top: Math.max(-50, pos.top - 4) });
                      }}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                      title="Arriba (↑)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        onUpdateTextPos?.(targetKey, { left: pos.left, top: Math.min(150, pos.top + 4) });
                      }}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                      title="Abajo (↓)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Rápido */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Horizontal:</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        onUpdateTextPos?.(targetKey, { left: 4, top: pos.top });
                      }}
                      className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition text-center"
                      title="Izquierda (X: 4%)"
                    >
                      Izquierda
                    </button>
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        const { widthPct } = getElementDimensions();
                        const centerLeft = Math.max(0, Math.round(((100 - widthPct) / 2) * 10) / 10);
                        onUpdateTextPos?.(targetKey, { left: centerLeft, top: pos.top });
                      }}
                      className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition text-center"
                      title="Centrar horizontalmente"
                    >
                      Centro
                    </button>
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        const { widthPct } = getElementDimensions();
                        const rightLeft = Math.max(8, Math.round((96 - widthPct) * 10) / 10);
                        onUpdateTextPos?.(targetKey, { left: rightLeft, top: pos.top });
                      }}
                      className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition text-center"
                      title="Derecha"
                    >
                      Derecha
                    </button>
                  </div>
                </div>

                {/* Vertical Rápido */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Vertical (Todo el Lienzo):</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        onUpdateTextPos?.(targetKey, { left: pos.left, top: 3 });
                      }}
                      className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition text-center"
                      title="Tope superior (Y: 3%)"
                    >
                      Arriba
                    </button>
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        const { heightPct } = getElementDimensions();
                        const centerTop = Math.max(0, Math.round(((100 - heightPct) / 2) * 10) / 10);
                        onUpdateTextPos?.(targetKey, { left: pos.left, top: centerTop });
                      }}
                      className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition text-center"
                      title="Centro vertical"
                    >
                      Medio
                    </button>
                    <button
                      onClick={() => {
                        const pos = getElementPos();
                        const { heightPct } = getElementDimensions();
                        const bottomTop = Math.max(4, Math.round((96 - heightPct) * 10) / 10);
                        onUpdateTextPos?.(targetKey, { left: pos.left, top: bottomTop });
                      }}
                      className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition text-center"
                      title="Fondo inferior (Y: 96% - alto)"
                    >
                      Abajo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* PANEL EXPANDIBLE DE CAPAS (4 BOTONES: ATRÁS, ADELANTE, +, -) */}
        {/* ========================================================================= */}
        {openSubmenu === 'layers' && (
          <div className="bg-slate-950/95 border border-indigo-500/40 rounded-xl p-3 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Orden de Capas (Superposición)</span>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-500/40">
                  Capa actual: {currentZIndex}
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Atrás (Fondo: Capa 15) */}
              <button
                onClick={() => onUpdateStyle(activeKey, { zIndex: 15 })}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-200 hover:text-indigo-300 transition group"
                title="Enviar Detrás de otros textos/logos (Capa 15)"
              >
                <span>Atrás</span>
              </button>

              {/* Adelante (Frente: Capa 50) */}
              <button
                onClick={() => onUpdateStyle(activeKey, { zIndex: 50 })}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-200 hover:text-indigo-300 transition group"
                title="Traer por encima de todos los elementos (Capa 50)"
              >
                <span>Adelante</span>
              </button>

              {/* - (Bajar 1 capa) */}
              <button
                onClick={() => onUpdateStyle(activeKey, { zIndex: Math.max(5, currentZIndex - 2) })}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-200 hover:text-indigo-300 transition group font-mono"
                title="Bajar 1 nivel de capa (-)"
              >
                <span className="text-base">-</span>
                <span className="font-sans text-[11px]">Bajar Capa</span>
              </button>

              {/* + (Subir 1 capa) */}
              <button
                onClick={() => onUpdateStyle(activeKey, { zIndex: Math.min(80, currentZIndex + 2) })}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-200 hover:text-indigo-300 transition group font-mono"
                title="Subir 1 nivel de capa (+)"
              >
                <span className="text-base">+</span>
                <span className="font-sans text-[11px]">Subir Capa</span>
              </button>
            </div>
          </div>
        )}

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

                  {/* Radio de Esquinas (Border Radius) */}
                  <div className="col-span-1 sm:col-span-2 space-y-1.5 pt-1 border-t border-slate-900">
                    <label className="text-[11px] font-semibold text-slate-400">Curvatura de Esquinas (Radio):</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: '0px (Recto)', val: 0 },
                        { label: '8px (Sutil)', val: 8 },
                        { label: '16px (Medio)', val: 16 },
                        { label: '24px (Curvo)', val: 24 },
                        { label: 'Pill (Total)', val: 9999 },
                      ].map((r) => (
                        <button
                          key={r.val}
                          onClick={() => onUpdateStyle(activeKey, { borderRadius: r.val })}
                          className={`py-1 px-2 rounded-lg text-xs font-bold transition border ${
                            (currentItemStyle?.borderRadius ?? (isContainer ? 16 : 8)) === r.val
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
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

        {/* ========================================================================= */}
        {/* PANEL EXPANDIBLE DE FONDO (CAPA 0: COLOR SÓLIDO DE LA DIAPOSITIVA) */}
        {/* ========================================================================= */}
        {openSubmenu === 'background' && (
          <div className="bg-slate-950/95 border border-purple-500/40 rounded-xl p-3 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <PaintBucket className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">Color de Fondo de la Diapositiva (Capa Base 0)</span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-500/40">
                  {slide.backgroundColor || '#020617'}
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

            {/* Selector de color personalizado + Paleta de colores rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Color Picker HTML5 */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shrink-0">
                <input
                  type="color"
                  value={slide.backgroundColor || '#020617'}
                  onChange={(e) => onUpdateSlideBackgroundColor?.(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                  title="Elegir color personalizado"
                />
                <span className="text-xs font-mono font-bold text-slate-200">
                  {slide.backgroundColor || '#020617'}
                </span>
              </div>

              {/* Presets de Color de Fondo para Redes Sociales */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { color: '#020617', name: 'Negro Obsidian' },
                  { color: '#09090b', name: 'Zinc Oscuro' },
                  { color: '#0f172a', name: 'Azul Noche' },
                  { color: '#1e1b4b', name: 'Índigo Profundo' },
                  { color: '#4c0519', name: 'Bordó Pasión' },
                  { color: '#18181b', name: 'Grafito' },
                  { color: '#ffffff', name: 'Blanco Puro' },
                  { color: '#f8fafc', name: 'Gris Nube' },
                  { color: '#e11d48', name: 'Rose Red' },
                  { color: '#2563eb', name: 'Azul Real' },
                  { color: '#059669', name: 'Esmeralda' },
                  { color: '#d97706', name: 'Ámbar' },
                ].map((item) => (
                  <button
                    key={item.color}
                    onClick={() => onUpdateSlideBackgroundColor?.(item.color)}
                    className={`w-7 h-7 rounded-xl border transition-all flex items-center justify-center relative ${
                      (slide.backgroundColor || '#020617').toLowerCase() === item.color.toLowerCase()
                        ? 'border-purple-400 ring-2 ring-purple-500/50 scale-110 shadow-lg'
                        : 'border-slate-700/80 hover:border-slate-400 hover:scale-105'
                    }`}
                    style={{ backgroundColor: item.color }}
                    title={item.name}
                  >
                    {(slide.backgroundColor || '#020617').toLowerCase() === item.color.toLowerCase() && (
                      <span className={`w-2 h-2 rounded-full ${item.color === '#ffffff' || item.color === '#f8fafc' ? 'bg-black' : 'bg-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              <span>El fondo actúa como una base fija independiente detrás de las fotos, videos y textos.</span>
              <button
                onClick={() => onUpdateSlideBackgroundColor?.('#020617')}
                className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded transition"
              >
                Restablecer a Negro Obsidian (#020617)
              </button>
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
