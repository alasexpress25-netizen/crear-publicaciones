import React, { useRef, useState } from 'react';
import {
  Slide,
  BrandInfo,
  AspectRatio,
  ComparisonData,
  BigStatData,
  QuoteData,
  CtaFinalData,
  SlideLayoutTemplate,
  CustomTextLayer,
  TextStyleItem
} from '../types';
import { getTemplateLocalization, resolveChecklistBullets } from '../data/templateLocalizations';
import {
  Quote,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Send,
  MessageCircle,
  Bookmark,
  Heart,
  X,
  Trash2,
  Plus,
  Move,
  Maximize2,
  GripVertical,
  Image as ImageIcon
} from 'lucide-react';

interface CanvasSlideProps {
  slide: Slide;
  brand: BrandInfo;
  aspectRatio: AspectRatio;
  zoomLevel: number;
  activeElementKey: string | null;
  language?: 'es' | 'pt' | 'en';
  onSelectElement: (key: string) => void;
  onUpdateField: (field: keyof Slide, value: any) => void;
  onUpdateBullet: (index: number, value: string) => void;
  onDeleteBullet?: (index: number) => void;
  onAddBullet?: (customText?: string) => void;
  onUpdateBrand: (field: keyof BrandInfo, value: any) => void;
  onUpdateCustomText?: (id: string, text: string) => void;
  onDeleteCustomText?: (id: string) => void;
  onAddCustomText?: (type?: 'heading' | 'body' | 'badge') => void;
  onDeleteElement?: (key: string) => void;
  onUpdateComparison?: (partial: Partial<ComparisonData>) => void;
  onUpdateStat?: (partial: Partial<BigStatData>) => void;
  onUpdateQuote?: (partial: Partial<QuoteData>) => void;
  onUpdateCtaFinal?: (partial: Partial<CtaFinalData>) => void;
  onUpdateTextPos?: (key: string | Record<string, { left: number; top: number } | null>, pos?: { left: number; top: number } | null) => void;
  onUpdateTextStyle?: (key: string, style: Partial<TextStyleItem>) => void;
  isExportMode?: boolean;
}

export const CanvasSlide: React.FC<CanvasSlideProps> = ({
  slide,
  brand,
  aspectRatio,
  zoomLevel,
  activeElementKey,
  language = 'es',
  onSelectElement,
  onUpdateField,
  onUpdateBullet,
  onDeleteBullet,
  onAddBullet,
  onUpdateBrand,
  onUpdateCustomText,
  onDeleteCustomText,
  onAddCustomText,
  onDeleteElement,
  onUpdateComparison,
  onUpdateStat,
  onUpdateQuote,
  onUpdateCtaFinal,
  onUpdateTextPos,
  onUpdateTextStyle,
  isExportMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loc = getTemplateLocalization(language);

  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';

  const isHidden = (key: string): boolean => {
    if (slide.hiddenElements && slide.hiddenElements.includes(key)) return true;
    if (brand.hiddenElements && brand.hiddenElements.includes(key)) return true;
    const custom = (slide.textStyle && slide.textStyle[key]) || (brand.textStyle && brand.textStyle[key]);
    if (custom && custom.opacity === 0) return true;
    return false;
  };

  const getNumericHeight = (key: string): number => {
    const custom = (slide.textStyle && slide.textStyle[key]) || (brand.textStyle && brand.textStyle[key]) || {};
    if (custom.height !== undefined && custom.height !== null) {
      const parsed = typeof custom.height === 'number' ? custom.height : parseInt(String(custom.height), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (key === 'brandLogo') {
      return brand.logoSize || 28;
    }
    return 90;
  };

  const getNumericBorderRadius = (key: string, defaultRadius: number = 12): number => {
    const custom = (slide.textStyle && slide.textStyle[key]) || (brand.textStyle && brand.textStyle[key]) || {};
    if (custom.borderRadius !== undefined && custom.borderRadius !== null) {
      const parsed = typeof custom.borderRadius === 'number' ? custom.borderRadius : parseInt(String(custom.borderRadius), 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return defaultRadius;
  };

  // Aspect ratio map
  const aspectClassMap = {
    '4:5': 'aspect-[4/5] max-w-[450px]',
    '1:1': 'aspect-square max-w-[450px]',
    '9:16': 'aspect-[9/16] max-w-[370px]',
    '16:9': 'aspect-[16/9] max-w-[550px]',
  };

  const getDragTargetKey = (key: string): string => {
    if (key.startsWith('bullet-')) {
      return slide.layoutTemplate === 'checklist' ? 'checklist-container' : 'bullets-container';
    }
    if (key === 'stat-subtext') return 'stat-subtext-box';
    if (key === 'cta-subheadline' || key === 'cta-pill') return 'cta-subheadline-card';
    if (key === 'comp-leftTag' || key === 'comp-leftTitle' || key === 'comp-leftText') return 'comp-left-card';
    if (key === 'comp-rightTag' || key === 'comp-rightTitle' || key === 'comp-rightText') return 'comp-right-card';
    if (key === 'quote-text' || key === 'quote-author' || key === 'quote-role' || key === 'quote-icon') return 'quote-container';
    return key;
  };

  const isInnerChildElement = (key: string): boolean => {
    return getDragTargetKey(key) !== key;
  };

  const startDrag = (rawKey: string, e: React.PointerEvent) => {
    // If clicking on resize handles or buttons, do not initiate element drag
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle') || target.closest('button') || target.closest('input')) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current || isExportMode) return;

    const key = getDragTargetKey(rawKey);
    const containerRect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    // Find the target element using data-drag-key or direct ref
    const targetEl = (containerRef.current.querySelector(`[data-drag-key="${key}"]`) || e.currentTarget.closest(`[data-drag-key="${key}"]`) || e.currentTarget) as HTMLElement;
    const elemRect = targetEl.getBoundingClientRect();

    // Calculate the element's actual position relative to the container right now
    const initialLeftPct = slide.textPos?.[key]?.left !== undefined
      ? slide.textPos[key]!.left
      : Math.round((((elemRect.left - containerRect.left) / containerRect.width) * 100) * 10) / 10;

    const initialTopPct = slide.textPos?.[key]?.top !== undefined
      ? slide.textPos[key]!.top
      : Math.round((((elemRect.top - containerRect.top) / containerRect.height) * 100) * 10) / 10;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const deltaXPct = (deltaX / containerRect.width) * 100;
      const deltaYPct = (deltaY / containerRect.height) * 100;

      // Smooth, zero-snap freeform movement
      const newLeft = Math.round((initialLeftPct + deltaXPct) * 10) / 10;
      const newTop = Math.round((initialTopPct + deltaYPct) * 10) / 10;

      onUpdateTextPos?.(key, { left: newLeft, top: newTop });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const startResize = (rawKey: string, e: React.PointerEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current || isExportMode) return;

    const key = getDragTargetKey(rawKey);
    const containerRect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    // Find the target element using data-drag-key to get its current size and aspect ratio
    const targetEl = (containerRef.current.querySelector(`[data-drag-key="${key}"]`) || e.currentTarget.parentElement) as HTMLElement | null;
    const elemRect = targetEl ? targetEl.getBoundingClientRect() : null;

    const startH = getNumericHeight(key);
    const startW = elemRect && elemRect.width > 0 ? elemRect.width : startH;
    const elemAspect = startW > 0 && startH > 0 ? startW / startH : 1;
    const currentZoom = zoomLevel || 1;

    // Starting position of element in %
    const curLeftPct = slide.textPos?.[key]?.left !== undefined
      ? slide.textPos[key]!.left
      : (elemRect ? Math.round((((elemRect.left - containerRect.left) / containerRect.width) * 100) * 10) / 10 : 35);
    const curTopPct = slide.textPos?.[key]?.top !== undefined
      ? slide.textPos[key]!.top
      : (elemRect ? Math.round((((elemRect.top - containerRect.top) / containerRect.height) * 100) * 10) / 10 : 35);

    if (!slide.textPos?.[key]) {
      onUpdateTextPos?.(key, { left: curLeftPct, top: curTopPct });
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const deltaX = (moveEvent.clientX - startX) / currentZoom;
      const deltaY = (moveEvent.clientY - startY) / currentZoom;

      let deltaH = 0;
      if (corner === 'se') {
        deltaH = (deltaX / elemAspect + deltaY) / 2;
      } else if (corner === 'sw') {
        deltaH = (-deltaX / elemAspect + deltaY) / 2;
      } else if (corner === 'ne') {
        deltaH = (deltaX / elemAspect - deltaY) / 2;
      } else if (corner === 'nw') {
        deltaH = (-deltaX / elemAspect - deltaY) / 2;
      }

      const newHeight = Math.round(Math.max(16, Math.min(600, startH + deltaH)));
      const actualDeltaH = newHeight - startH;
      const actualDeltaW = actualDeltaH * elemAspect;

      // When dragging top/left corners, adjust the top/left position accordingly so opposite corner stays anchored
      let newLeftPct = curLeftPct;
      let newTopPct = curTopPct;

      if (corner === 'nw') {
        newLeftPct = curLeftPct - ((actualDeltaW / (containerRect.width / currentZoom)) * 100);
        newTopPct = curTopPct - ((actualDeltaH / (containerRect.height / currentZoom)) * 100);
      } else if (corner === 'ne') {
        newTopPct = curTopPct - ((actualDeltaH / (containerRect.height / currentZoom)) * 100);
      } else if (corner === 'sw') {
        newLeftPct = curLeftPct - ((actualDeltaW / (containerRect.width / currentZoom)) * 100);
      }

      onUpdateTextStyle?.(key, { height: newHeight });
      if (key === 'brandLogo' && onUpdateBrand) {
        onUpdateBrand('logoSize', newHeight);
      }

      if (corner === 'nw' || corner === 'ne' || corner === 'sw') {
        onUpdateTextPos?.(key, {
          left: Math.round(newLeftPct * 10) / 10,
          top: Math.round(newTopPct * 10) / 10,
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const startScaleDirect = (key: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current || isExportMode) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startH = getNumericHeight(key);
    const currentZoom = zoomLevel || 1;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const deltaX = (moveEvent.clientX - startX) / currentZoom;
      const deltaY = (moveEvent.clientY - startY) / currentZoom;
      const delta = (deltaX + deltaY) / 1.5;
      const newHeight = Math.round(Math.max(16, Math.min(600, startH + delta)));
      onUpdateTextStyle?.(key, { height: newHeight });
      if (key === 'brandLogo' && onUpdateBrand) {
        onUpdateBrand('logoSize', newHeight);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const isCardBoxTransparent = (key?: string) => {
    if (slide.hideCardBoxes) return true;
    if (key && (slide.textStyle?.[key]?.transparentBox || slide.textStyle?.[key]?.backgroundColor === 'transparent')) return true;
    return false;
  };

  const getBadgeStyle = (key: string = 'badge'): React.CSSProperties => {
    const custom = (slide.textStyle && slide.textStyle[key]) || (brand.textStyle && brand.textStyle[key]);
    const bg = (custom?.transparentBox || custom?.backgroundColor === 'transparent')
      ? 'transparent'
      : (custom?.backgroundColor || primaryColor);

    const style: React.CSSProperties = {
      backgroundColor: bg,
    };

    if (custom?.boxBorder) {
      const boxCol = custom.boxBorderColor || '#000000';
      const boxW = custom.boxBorderWidth || 2;
      style.border = `${boxW}px solid ${boxCol}`;
      style.borderColor = boxCol;
      style.borderWidth = `${boxW}px`;
      style.borderStyle = 'solid';
    } else if (custom?.outline && (custom?.backgroundColor !== undefined || custom?.transparentBox)) {
      const outCol = custom.outlineColor || '#000000';
      const outW = custom.outlineWidth || 2;
      style.border = `${outW}px solid ${outCol}`;
      style.borderColor = outCol;
      style.borderWidth = `${outW}px`;
      style.borderStyle = 'solid';
    }

    if (custom?.shadow) {
      const shCol = custom.shadowColor || '#000000';
      const shType = custom.shadowType || 'soft';
      if (shType === 'soft') style.boxShadow = `0px 6px 16px ${shCol}, 0px 2px 6px ${shCol}`;
      else if (shType === 'subtle') style.boxShadow = `0px 3px 8px ${shCol}cc`;
      else if (shType === 'hard') style.boxShadow = `3.5px 3.5px 0px ${shCol}`;
      else if (shType === 'glow') style.boxShadow = `0px 0px 10px ${shCol}, 0px 0px 24px ${shCol}`;
    }

    return style;
  };

  const getCtaPillStyle = (): React.CSSProperties => {
    const custom = (slide.textStyle && slide.textStyle['cta-pill']) || (brand.textStyle && brand.textStyle['cta-pill']);
    const bg = (custom?.transparentBox || custom?.backgroundColor === 'transparent')
      ? 'transparent'
      : (custom?.backgroundColor || primaryColor);

    const style: React.CSSProperties = {
      backgroundColor: bg,
    };

    if (custom?.boxBorder) {
      const boxCol = custom.boxBorderColor || '#000000';
      const boxW = custom.boxBorderWidth || 2;
      style.border = `${boxW}px solid ${boxCol}`;
      style.borderColor = boxCol;
      style.borderWidth = `${boxW}px`;
      style.borderStyle = 'solid';
    } else if (custom?.outline && (custom?.backgroundColor !== undefined || custom?.transparentBox)) {
      const outCol = custom.outlineColor || '#000000';
      const outW = custom.outlineWidth || 2;
      style.border = `${outW}px solid ${outCol}`;
      style.borderColor = outCol;
      style.borderWidth = `${outW}px`;
      style.borderStyle = 'solid';
    }

    if (custom?.shadow) {
      const shCol = custom.shadowColor || '#000000';
      const shType = custom.shadowType || 'soft';
      if (shType === 'soft') style.boxShadow = `0px 6px 16px ${shCol}, 0px 2px 6px ${shCol}`;
      else if (shType === 'subtle') style.boxShadow = `0px 3px 8px ${shCol}cc`;
      else if (shType === 'hard') style.boxShadow = `3.5px 3.5px 0px ${shCol}`;
      else if (shType === 'glow') style.boxShadow = `0px 0px 10px ${shCol}, 0px 0px 24px ${shCol}`;
    }

    return style;
  };

  const renderActiveControls = (key: string, label?: string) => {
    if (activeElementKey !== key || isExportMode) return null;
    const targetKey = getDragTargetKey(key);
    const hasPos = Boolean(slide.textPos && (slide.textPos[targetKey] || slide.textPos[key]));

    return (
      <div
        className="no-export absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-slate-950/95 border border-rose-500/80 shadow-2xl px-2 py-0.5 rounded-full text-[11px] font-bold text-white select-none whitespace-nowrap backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onPointerDown={(e) => startDrag(key, e)}
          className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-rose-300 hover:text-white px-1 py-0.5 transition"
          title="Mantén presionado y arrastra para mover libremente"
        >
          <Move className="w-3 h-3 text-rose-400" />
          <span>{label || (key.startsWith('bullet-') ? 'Mover Lista' : 'Mover')}</span>
        </div>

        {hasPos && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateTextPos?.({ [targetKey]: null, [key]: null } as any);
            }}
            className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-1.5 py-0.5 rounded-full border border-slate-700 transition"
            title="Restablecer a posición por defecto"
          >
            Restablecer
          </button>
        )}

        {onDeleteElement && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteElement(key);
            }}
            className="text-[9px] bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white px-1.5 py-0.5 rounded-full border border-rose-700/60 transition flex items-center gap-0.5"
            title="Eliminar objeto (o presiona tecla Supr/Delete)"
          >
            <X className="w-2.5 h-2.5" />
            <span>Eliminar</span>
          </button>
        )}
      </div>
    );
  };

  const getDefaultZIndex = (key: string): number => {
    if (key === 'brandLogo' || key === 'cta-avatar') return 35;
    if (key.includes('-card') || key.includes('-box') || key.includes('-container') || key.includes('grid') || key.startsWith('custom-box-')) return 20;
    if (key.includes('accent') || key === 'quote-icon' || key === 'badge' || key === 'cta-pill' || key.startsWith('custom-accent-')) return 28;
    if (key === 'title' || key === 'cta-headline' || key === 'stat-number') return 32;
    return 30;
  };

  const getDefaultsForElement = (key: string, pColor: string): React.CSSProperties => {
    if (key === 'brandLogo') return { zIndex: 35 };
    if (key === 'brandName') return { color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 30 };
    if (key === 'brandHandle') return { color: '#94a3b8', fontSize: '11px', fontWeight: 500, letterSpacing: '0.025em', zIndex: 30 };
    if (key === 'brandWeb') return { color: pColor, fontSize: '11px', fontWeight: 'bold', zIndex: 30 };
    if (key === 'badge') return { color: '#ffffff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 28 };
    if (key === 'subtag') return { color: pColor, fontSize: '13px', fontWeight: 'bold', zIndex: 30 };
    if (key === 'title') return { color: '#ffffff', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.25, zIndex: 32 };
    if (key === 'body') return { color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6, zIndex: 30 };
    if (key.startsWith('bullet-')) return { color: '#e2e8f0', fontSize: '12px', lineHeight: 1.5, zIndex: 30 };
    if (key === 'cta') return { color: '#cbd5e1', fontSize: '12px', fontWeight: 600, zIndex: 30 };
    
    if (key === 'quote-icon') return { zIndex: 28 };
    if (key === 'quote-text') return { color: '#ffffff', fontSize: '18px', fontWeight: 'bold', fontStyle: 'italic', lineHeight: 1.5, zIndex: 30 };
    if (key === 'quote-author') return { color: '#ffffff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 30 };
    if (key === 'quote-role') return { color: '#fb7185', fontSize: '11px', fontWeight: 600, zIndex: 30 };

    if (key === 'stat-number') return { color: pColor, fontSize: '60px', fontWeight: 900, lineHeight: 1, zIndex: 32 };
    if (key === 'stat-label') return { color: '#ffffff', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 30 };
    if (key === 'stat-subtext') return { color: '#cbd5e1', fontSize: '12px', lineHeight: 1.5, zIndex: 30 };

    if (key === 'comp-leftTag') return { color: '#f87171', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', zIndex: 28 };
    if (key === 'comp-leftTitle') return { color: '#ffffff', fontSize: '13px', fontWeight: 'bold', lineHeight: 1.3, zIndex: 30 };
    if (key === 'comp-leftText') return { color: '#cbd5e1', fontSize: '11px', lineHeight: 1.4, zIndex: 30 };
    if (key === 'comp-rightTag') return { color: '#34d399', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', zIndex: 28 };
    if (key === 'comp-rightTitle') return { color: '#ffffff', fontSize: '13px', fontWeight: 'bold', lineHeight: 1.3, zIndex: 30 };
    if (key === 'comp-rightText') return { color: '#cbd5e1', fontSize: '11px', lineHeight: 1.4, zIndex: 30 };

    if (key === 'cta-avatar') return { zIndex: 35 };
    if (key === 'cta-headline') return { color: '#ffffff', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.25, zIndex: 32 };
    if (key === 'cta-subheadline') return { color: '#cbd5e1', fontSize: '12px', lineHeight: 1.5, zIndex: 30 };
    if (key === 'cta-pill') return { color: '#ffffff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 28 };

    return { color: '#ffffff', fontSize: '13px', zIndex: 30 };
  };

  const getStyleFor = (key: string, baseStyle?: React.CSSProperties) => {
    const customTextLayer = slide.customTexts?.find((c) => c.id === key);
    const custom = (slide.textStyle && slide.textStyle[key]) || (brand.textStyle && brand.textStyle[key]) || {};
    // Inner child elements (like individual bullets, stat subtext, quote text) belong to their container layout and must not receive individual position: absolute
    const targetKey = getDragTargetKey(key);
    
    // Ignore parent container position if any child card/element has its own position (prevents nested coordinate trap from older saves)
    const hasChildPosition =
      (key === 'cta-container' && Boolean(slide.textPos?.['cta-subheadline-card'] || slide.textPos?.['cta-headline'] || slide.textPos?.['cta-avatar'])) ||
      (key === 'comp-grid' && Boolean(slide.textPos?.['comp-left-card'] || slide.textPos?.['comp-right-card'])) ||
      (key === 'stat-container' && Boolean(slide.textPos?.['stat-subtext-box'] || slide.textPos?.['stat-number']));

    const pos = (isInnerChildElement(key) || hasChildPosition)
      ? undefined
      : (slide.textPos?.[key] || (key === targetKey ? slide.textPos?.[targetKey] : undefined));
    const def = getDefaultsForElement(key, primaryColor);

    const isImageElement =
      key === 'brandLogo' ||
      key === 'cta-avatar' ||
      key.startsWith('custom-img-') ||
      key.startsWith('custom-image-') ||
      key.startsWith('custom-photo-') ||
      customTextLayer?.type === 'image' ||
      Boolean(customTextLayer?.imageUrl);

    const isContainer =
      key.includes('-card') ||
      key.includes('-box') ||
      key.includes('-container') ||
      key.includes('grid') ||
      key.startsWith('custom-box-') ||
      key === 'cta-avatar' ||
      key === 'brandLogo' ||
      isImageElement;

    const styleObj: React.CSSProperties = {
      ...def,
      ...baseStyle,
    };

    const fontSize = custom.fontSize || customTextLayer?.fontSize;
    if (fontSize) styleObj.fontSize = `${fontSize}px`;

    const color = custom.color || customTextLayer?.color;
    if (color) styleObj.color = color;

    const align = custom.align || customTextLayer?.align;
    if (align) styleObj.textAlign = align;

    if (custom.fontFamily) styleObj.fontFamily = custom.fontFamily;
    if (custom.fontWeight) styleObj.fontWeight = custom.fontWeight;
    if (custom.fontStyle) styleObj.fontStyle = custom.fontStyle;
    if (custom.width !== undefined && custom.width !== null) {
      styleObj.width = typeof custom.width === 'number' && custom.width <= 100 ? `${custom.width}%` : `${custom.width}px`;
      styleObj.maxWidth = '100%';
    }
    if (custom.height !== undefined && custom.height !== null) {
      styleObj.height = typeof custom.height === 'number' ? `${custom.height}px` : custom.height;
    }
    if (custom.borderRadius !== undefined && custom.borderRadius !== null) {
      const bRad = typeof custom.borderRadius === 'number' ? `${custom.borderRadius}px` : String(custom.borderRadius).endsWith('px') ? custom.borderRadius : `${custom.borderRadius}px`;
      styleObj.borderRadius = bRad;
    }
    if (custom.opacity !== undefined && custom.opacity !== null) {
      styleObj.opacity = custom.opacity;
    }
    if (custom.letterSpacing) styleObj.letterSpacing = custom.letterSpacing;
    if (custom.textTransform) styleObj.textTransform = custom.textTransform;

    if (custom.backgroundColor !== undefined) {
      styleObj.backgroundColor = custom.backgroundColor;
      if (custom.backgroundColor === 'transparent') {
        if (!custom.boxBorder && (!isContainer || !custom.outline)) {
          styleObj.borderColor = 'transparent';
        }
      } else {
        styleObj.borderRadius = styleObj.borderRadius || '10px';
      }
    } else if (custom.transparentBox) {
      styleObj.backgroundColor = 'transparent';
      if (!custom.boxBorder && (!isContainer || !custom.outline)) {
        styleObj.borderColor = 'transparent';
      }
    }

    const shadowParts: string[] = [];

    // 1. Contorno de texto (Stroke exclusivo para letras)
    if (custom.outline) {
      const outCol = custom.outlineColor || '#000000';
      const outW = custom.outlineWidth || 2;
      const isTransparentColor = custom.color === 'transparent' || styleObj.color === 'transparent';

      if (isContainer) {
        // Si el elemento seleccionado es una tarjeta / caja contenedora pura (ej. comp-left-card), outline actúa como borde de marco
        styleObj.borderWidth = `${outW}px`;
        styleObj.borderStyle = 'solid';
        styleObj.borderColor = outCol;
      } else {
        // Para elementos de TEXTO: aplica ÚNICAMENTE stroke en las letras sin dibujar ningún marco o recuadro
        if (!isTransparentColor) {
          shadowParts.push(
            `-${outW}px -${outW}px 0 ${outCol}`,
            `0px -${outW}px 0 ${outCol}`,
            `${outW}px -${outW}px 0 ${outCol}`,
            `-${outW}px 0px 0 ${outCol}`,
            `${outW}px 0px 0 ${outCol}`,
            `-${outW}px ${outW}px 0 ${outCol}`,
            `0px ${outW}px 0 ${outCol}`,
            `${outW}px ${outW}px 0 ${outCol}`
          );
        }
        (styleObj as any).WebkitTextStroke = `${Math.max(1, outW * 0.8)}px ${outCol}`;
        (styleObj as any).paintOrder = 'stroke fill';
      }
    }

    // 2. Contorno del marco / recuadro contenedor (Borde exterior de la caja)
    if (custom.boxBorder) {
      const boxCol = custom.boxBorderColor || '#000000';
      const boxW = custom.boxBorderWidth || 2;
      styleObj.borderWidth = `${boxW}px`;
      styleObj.borderStyle = 'solid';
      styleObj.borderColor = boxCol;
      styleObj.borderRadius = styleObj.borderRadius || '10px';
    }

    // 3. Sombra de texto o caja (Drop Shadow / Box Shadow)
    if (custom.shadow) {
      const shCol = custom.shadowColor || '#000000';
      const shType = custom.shadowType || 'soft';
      
      if (isContainer || (custom.backgroundColor && custom.backgroundColor !== 'transparent')) {
        if (shType === 'soft') {
          styleObj.boxShadow = `0px 6px 16px ${shCol}, 0px 2px 6px ${shCol}`;
        } else if (shType === 'subtle') {
          styleObj.boxShadow = `0px 3px 8px ${shCol}cc`;
        } else if (shType === 'hard') {
          styleObj.boxShadow = `3.5px 3.5px 0px ${shCol}`;
        } else if (shType === 'glow') {
          styleObj.boxShadow = `0px 0px 10px ${shCol}, 0px 0px 24px ${shCol}`;
        }
      } else {
        if (shType === 'soft') {
          shadowParts.push(`0px 6px 16px ${shCol}`, `0px 2px 6px ${shCol}`);
        } else if (shType === 'subtle') {
          shadowParts.push(`0px 3px 8px ${shCol}cc`);
        } else if (shType === 'hard') {
          shadowParts.push(`3.5px 3.5px 0px ${shCol}`);
        } else if (shType === 'glow') {
          shadowParts.push(`0px 0px 10px ${shCol}`, `0px 0px 24px ${shCol}`);
        }
      }
    }

    if (shadowParts.length > 0) {
      styleObj.textShadow = shadowParts.join(', ');
    }

    if (custom.width) {
      styleObj.width = typeof custom.width === 'number'
        ? (custom.width <= 100 ? `${custom.width}%` : `${custom.width}px`)
        : custom.width;
      styleObj.maxWidth = '100%';
    }

    const defaultZ = getDefaultZIndex(key);
    const resolvedZIndex = custom.zIndex !== undefined ? custom.zIndex : defaultZ;

    if (pos) {
      styleObj.position = 'absolute';
      styleObj.left = `${pos.left}%`;
      styleObj.top = `${pos.top}%`;
      styleObj.margin = 0;
      styleObj.marginTop = 0;
      styleObj.marginBottom = 0;
      styleObj.marginLeft = 0;
      styleObj.marginRight = 0;
      // Use direct top-left coordinate positioning without center-pivot magnetism
      styleObj.transform = 'none';
      styleObj.zIndex = resolvedZIndex;

      // Prevent squishing: maintain generous proportional width when dragged freely
      if (!custom.width) {
        if (key.startsWith('bullet-')) {
          styleObj.width = '88%';
          styleObj.maxWidth = '92%';
        } else if (['title', 'cta-headline'].includes(key)) {
          styleObj.width = '90%';
          styleObj.maxWidth = '94%';
        } else if (['body', 'stat-subtext', 'cta-subheadline'].includes(key)) {
          styleObj.width = '88%';
          styleObj.maxWidth = '92%';
        } else if (['comp-grid', 'stat-container', 'quote-container', 'checklist-container', 'cta-container', 'bullets-container'].includes(key)) {
          styleObj.width = '92%';
          styleObj.maxWidth = '96%';
        } else if (['comp-left-card', 'comp-right-card'].includes(key)) {
          styleObj.width = '46%';
          styleObj.maxWidth = '48%';
        } else if (['stat-subtext-box', 'cta-subheadline-card'].includes(key)) {
          styleObj.width = '88%';
          styleObj.maxWidth = '92%';
        } else if (['brandName', 'brandHandle', 'brandWeb', 'badge', 'subtag', 'cta', 'cta-pill', 'comp-leftTag', 'comp-rightTag', 'quote-author', 'quote-role'].includes(key)) {
          styleObj.width = 'fit-content';
          styleObj.maxWidth = '92%';
        } else if (['cta-avatar', 'brandLogo'].includes(key) || key.startsWith('custom-img-') || key.startsWith('custom-image-') || key.startsWith('custom-accent-')) {
          styleObj.width = 'auto';
          styleObj.maxWidth = '100%';
        } else {
          styleObj.width = '85%';
          styleObj.maxWidth = '90%';
        }
      }
    } else {
      styleObj.zIndex = resolvedZIndex;
    }

    return styleObj;
  };

  const overlayIntensity = slide.overlayIntensity !== undefined ? slide.overlayIntensity : 85;
  const overlayOpacity = overlayIntensity / 100;

  const bgZoom = slide.zoom || 1;
  const bgPosX = slide.posX !== undefined ? slide.posX : 50;
  const bgPosY = slide.posY !== undefined ? slide.posY : 50;
  const bgFit = slide.fit || 'cover';
  const bgBlur = slide.blur !== undefined ? slide.blur : 0;
  const layout = slide.layoutTemplate || 'standard';

  // Apply slight scale bump when blurred so outer edges don't show gradient/white blur bleed
  const effectiveZoom = bgBlur > 0 ? bgZoom * 1.06 : bgZoom;

  return (
    <div
      ref={containerRef}
      id={isExportMode ? undefined : 'active-canvas-slide-container'}
      data-slide-id={slide.id}
      className={`relative w-full ${aspectClassMap[aspectRatio] || aspectClassMap['4:5']} mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-800 select-none transition-transform duration-150 flex flex-col justify-between`}
      style={{
        backgroundColor: slide.backgroundColor || '#020617',
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top center',
      }}
    >
      {/* CAPA 0: Base sólida inmutable (Color de Fondo) */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ backgroundColor: slide.backgroundColor || '#020617' }}
      />

      {/* CAPA 1: Objeto Independiente de Media (Imagen / Video con movimiento libre y encuadre fluido) */}
      {slide.mediaType === 'video' && slide.image ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            src={slide.image}
            autoPlay
            loop
            muted
            playsInline
            className="absolute -inset-[30%] w-[160%] h-[160%] max-w-none object-cover pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${(bgPosX - 50) * 0.6}%, ${(bgPosY - 50) * 0.6}%) scale(${effectiveZoom})`,
              transformOrigin: 'center center',
              filter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined,
            }}
          />
        </div>
      ) : slide.image ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src={slide.image}
            alt=""
            crossOrigin="anonymous"
            className="absolute -inset-[30%] w-[160%] h-[160%] max-w-none object-cover pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${(bgPosX - 50) * 0.6}%, ${(bgPosY - 50) * 0.6}%) scale(${effectiveZoom})`,
              transformOrigin: 'center center',
              filter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined,
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: slide.backgroundColor
              ? undefined
              : `radial-gradient(circle at top right, ${primaryColor}22, #020617 80%)`,
          }}
        />
      )}

      {/* Dark Overlay Variations */}
      {slide.overlayType === 'solid' ? (
        <div
          className="absolute inset-0 bg-slate-950 pointer-events-none transition-opacity duration-200"
          style={{ opacity: overlayOpacity }}
        />
      ) : slide.overlayType === 'card' ? (
        <div
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm pointer-events-none transition-opacity duration-200"
          style={{ opacity: overlayOpacity }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/45 pointer-events-none transition-opacity duration-200"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Unified Canvas Canvas Body (Sin header ni footer compartimentados, sin líneas divisorias) */}
      <div className="z-10 w-full h-full relative overflow-visible flex flex-col justify-between p-5 sm:p-6">
        {/* Top Brand Elements (Posicionados en flujo natural arriba, pero libres para trasladarse a cualquier punto) */}
        <div className="w-full flex items-center justify-between gap-3 pointer-events-none mb-1">
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Elemento Independiente 1: LOGO DE MARCA */}
            {!isHidden('brandLogo') && (
              <div
                data-drag-key="brandLogo"
                className={`group relative pointer-events-auto cursor-grab active:cursor-grabbing rounded-xl p-1 select-none ${
                  activeElementKey === 'brandLogo'
                    ? 'ring-2 ring-rose-500 bg-slate-900/90'
                    : 'hover:bg-slate-900/40'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('brandLogo');
                }}
                onPointerDown={(e) => {
                  onSelectElement('brandLogo');
                  startDrag('brandLogo', e);
                }}
                style={{
                  ...getStyleFor('brandLogo'),
                  borderRadius: `${getNumericBorderRadius('brandLogo', 12)}px`,
                }}
                title="Haz clic o arrastra para mover el logo libremente"
              >
                {renderActiveControls('brandLogo', 'Logo')}
                {activeElementKey === 'brandLogo' && !isExportMode && (
                  <>
                    <div
                      onPointerDown={(e) => startResize('brandLogo', e, 'nw')}
                      className="resize-handle no-export absolute -top-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                      title="Arrastrar esquina para redimensionar"
                    />
                    <div
                      onPointerDown={(e) => startResize('brandLogo', e, 'ne')}
                      className="resize-handle no-export absolute -top-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full shadow-md cursor-nesw-resize z-50 hover:scale-125 transition-transform"
                      title="Arrastrar esquina para redimensionar"
                    />
                    <div
                      onPointerDown={(e) => startResize('brandLogo', e, 'sw')}
                      className="resize-handle no-export absolute -bottom-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full shadow-md cursor-nesw-resize z-50 hover:scale-125 transition-transform"
                      title="Arrastrar esquina para redimensionar"
                    />
                    <div
                      onPointerDown={(e) => startResize('brandLogo', e, 'se')}
                      className="resize-handle no-export absolute -bottom-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                      title="Arrastrar esquina para redimensionar"
                    />
                  </>
                )}
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt="Logo"
                    className="object-contain pointer-events-none"
                    style={{
                      height: `${getNumericHeight('brandLogo')}px`,
                      width: 'auto',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      borderRadius: `${getNumericBorderRadius('brandLogo', 12)}px`,
                    }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center text-white font-black shadow-sm shrink-0"
                    style={{
                      backgroundColor: (getStyleFor('brandLogo').backgroundColor as any) || primaryColor,
                      width: `${getNumericHeight('brandLogo')}px`,
                      height: `${getNumericHeight('brandLogo')}px`,
                      fontSize: `${Math.max(9, Math.round(getNumericHeight('brandLogo') * 0.45))}px`,
                      borderRadius: `${getNumericBorderRadius('brandLogo', 12)}px`,
                    }}
                  >
                    {brand.name ? brand.name.charAt(0).toUpperCase() : '★'}
                  </div>
                )}
              </div>
            )}

            {/* Elemento Independiente 2: NOMBRE DE MARCA */}
            {!isHidden('brandName') && (
              <div
                data-drag-key="brandName"
                className={`group relative pointer-events-auto flex items-center gap-1.5 cursor-pointer transition rounded-xl px-2 py-1 ${
                  activeElementKey === 'brandName' ? 'ring-2 ring-rose-500 bg-slate-900/80' : 'hover:bg-slate-900/40'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('brandName');
                }}
                style={getStyleFor('brandName')}
              >
                {renderActiveControls('brandName')}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateBrand('name', e.currentTarget.innerText)}
                  className="outline-none font-bold"
                >
                  {brand.name || 'LA VISUAL MK'}
                </span>
              </div>
            )}
          </div>

          {/* Elemento Independiente 3: USUARIO/HANDLE */}
          {!isHidden('brandHandle') && (
            <div
              data-drag-key="brandHandle"
              className={`group relative pointer-events-auto flex items-center gap-1.5 cursor-pointer transition rounded-xl px-2 py-1 ${
                activeElementKey === 'brandHandle' ? 'ring-2 ring-rose-500 bg-slate-900/80' : 'hover:bg-slate-900/40'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement('brandHandle');
              }}
              style={getStyleFor('brandHandle')}
            >
              {renderActiveControls('brandHandle')}
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const val = e.currentTarget.innerText.trim();
                  onUpdateBrand('handle', val.startsWith('@') ? val : (val ? `@${val}` : ''));
                }}
                className="outline-none tracking-wide"
              >
                {brand.handle ? (brand.handle.startsWith('@') ? brand.handle : `@${brand.handle}`) : '@lavisualmk'}
              </span>
            </div>
          )}
        </div>

        {/* Main Content Body: Adaptive by Layout Template */}
        <div className={`w-full flex-1 py-1 flex flex-col ${
          slide.contentAlign === 'top' ? 'justify-start' : slide.contentAlign === 'bottom' ? 'justify-end' : 'justify-center'
        } overflow-visible`}>
           {/* ==================================================================== */}
        {/* LAYOUT 1: STANDARD (Título + Puntos/Cuerpo) */}
        {/* ==================================================================== */}
        {layout === 'standard' && (
          <div className="space-y-3 my-auto w-full">
            {!isHidden('badge') && slide.badge && (
              <div
                data-drag-key="badge"
                className={`group relative inline-block cursor-pointer transition rounded-lg ${
                  activeElementKey === 'badge' ? 'ring-2 ring-rose-500' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('badge');
                }}
                style={getStyleFor('badge')}
              >
                {renderActiveControls('badge')}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('badge', e.currentTarget.innerText)}
                  className="px-3 py-1 rounded-md inline-block outline-none shadow-md"
                  style={getBadgeStyle('badge')}
                >
                  {slide.badge}
                </span>
                {onDeleteElement && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement('badge');
                    }}
                    className="no-export absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition"
                    title="Eliminar badge"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {!isHidden('subtag') && slide.subtag && (
              <div
                data-drag-key="subtag"
                className={`group relative cursor-pointer transition rounded-md p-1 ${
                  activeElementKey === 'subtag' ? 'ring-2 ring-rose-500 bg-slate-900/60' : 'hover:bg-slate-900/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('subtag');
                }}
                style={getStyleFor('subtag')}
              >
                {renderActiveControls('subtag')}
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('subtag', e.currentTarget.innerText)}
                  className="outline-none"
                >
                  {slide.subtag}
                </p>
                {onDeleteElement && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement('subtag');
                    }}
                    className="no-export absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition"
                    title="Eliminar subtítulo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {!isHidden('title') && (
              <div
                data-drag-key="title"
                className={`group relative cursor-pointer transition rounded-xl p-1.5 ${
                  activeElementKey === 'title' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('title');
                }}
                style={getStyleFor('title')}
              >
                {renderActiveControls('title')}
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('title', e.currentTarget.innerText)}
                  className="outline-none drop-shadow-md"
                >
                  {slide.title || 'ESCRIBE AQUÍ EL TÍTULO O GANCHO'}
                </h2>
              </div>
            )}

            {!isHidden('body') && slide.body && (
              <div
                data-drag-key="body"
                className={`group relative cursor-pointer transition rounded-xl p-1.5 ${
                  activeElementKey === 'body' ? 'ring-2 ring-rose-500 bg-slate-900/60' : 'hover:bg-slate-900/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('body');
                }}
                style={getStyleFor('body')}
              >
                {renderActiveControls('body')}
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('body', e.currentTarget.innerText)}
                  className="outline-none"
                >
                  {slide.body}
                </p>
                {onDeleteElement && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement('body');
                    }}
                    className="no-export absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition"
                    title="Eliminar cuerpo de texto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {!isHidden('bullets-container') && slide.bullets && slide.bullets.length > 0 && (
              <div
                data-drag-key="bullets-container"
                className="space-y-2 pt-1"
                style={getStyleFor('bullets-container')}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    e.stopPropagation();
                    onSelectElement('bullets-container');
                  }
                }}
              >
                {renderActiveControls('bullets-container', 'Mover Lista')}
                {slide.bullets.map((bullet, idx) => {
                  if (isHidden(`bullet-${idx}`)) return null;
                  return (
                    <div
                      key={idx}
                      data-drag-key={`bullet-${idx}`}
                      className={`group relative flex items-center gap-2.5 rounded-xl px-3.5 py-2 cursor-pointer shadow-sm transition ${
                        isCardBoxTransparent(`bullet-${idx}`)
                          ? 'bg-transparent border border-slate-700/40 shadow-none'
                          : 'bg-slate-900/80 border border-slate-800'
                      } ${
                        activeElementKey === `bullet-${idx}` ? 'ring-2 ring-rose-500' : 'hover:border-slate-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement(`bullet-${idx}`);
                      }}
                      style={getStyleFor(`bullet-${idx}`)}
                    >
                      {renderActiveControls(`bullet-${idx}`)}
                      <span
                        className="font-bold text-sm leading-none shrink-0"
                        style={{ color: primaryColor }}
                      >
                        •
                      </span>
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => onUpdateBullet(idx, e.currentTarget.innerText)}
                        className="flex-1 outline-none"
                      >
                        {bullet}
                      </span>
                      {onDeleteBullet && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBullet(idx);
                          }}
                          className="no-export opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition rounded"
                          title="Eliminar este punto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {onAddBullet && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddBullet();
                    }}
                    className="no-export flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-400 transition px-2 py-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{loc.uiLabels?.addBullet || '+ Añadir Punto a la Lista'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 2: SPLIT COMPARISON (Antes vs Después / Error vs Solución) */}
        {/* ==================================================================== */}
        {layout === 'split_comparison' && (
          <div className="space-y-3.5 my-auto w-full">
            <div className="text-center space-y-1">
              {!isHidden('badge') && slide.badge && (
                <div
                  data-drag-key="badge"
                  className={`group relative inline-block cursor-pointer transition rounded-lg ${
                    activeElementKey === 'badge' ? 'ring-2 ring-rose-500' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('badge');
                  }}
                  style={getStyleFor('badge')}
                >
                  {renderActiveControls('badge')}
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateField('badge', e.currentTarget.innerText)}
                    className="px-2.5 py-0.5 rounded uppercase tracking-wider inline-block outline-none"
                    style={getBadgeStyle('badge')}
                  >
                    {slide.badge}
                  </span>
                </div>
              )}
              {!isHidden('title') && (
                <div
                  data-drag-key="title"
                  className={`group relative cursor-pointer transition rounded-xl p-1 ${
                    activeElementKey === 'title' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('title');
                  }}
                  style={getStyleFor('title')}
                >
                  {renderActiveControls('title')}
                  <h2
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateField('title', e.currentTarget.innerText)}
                    className="outline-none"
                  >
                    {slide.title || loc.comparison.title}
                  </h2>
                </div>
              )}
            </div>

            {/* Comparison Grid (Movable Grid) */}
            {!isHidden('comp-grid') && (
              <div
                data-drag-key="comp-grid"
                className={`group/grid transition-all rounded-2xl ${
                  activeElementKey === 'comp-grid' ? 'ring-2 ring-rose-500 bg-slate-900/30' : ''
                }`}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    e.stopPropagation();
                    onSelectElement('comp-grid');
                  }
                }}
                style={getStyleFor('comp-grid')}
              >
                {renderActiveControls('comp-grid', 'Mover Comparativa')}

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Left Column (Mistake / Before) */}
                  {!isHidden('comp-left-card') && (
                    <div
                      data-drag-key="comp-left-card"
                      className={`rounded-2xl p-3 space-y-1.5 text-left transition group/card ${
                        isCardBoxTransparent('comp-left-card')
                          ? 'bg-transparent border border-red-500/30 shadow-none'
                          : 'bg-red-950/40 border border-red-800/50 backdrop-blur-xs'
                      } ${activeElementKey === 'comp-left-card' ? 'ring-2 ring-rose-500' : 'hover:border-red-500/60'}`}
                      onClick={(e) => {
                        if (e.target === e.currentTarget) {
                          e.stopPropagation();
                          onSelectElement('comp-left-card');
                        }
                      }}
                      style={getStyleFor('comp-left-card')}
                    >
                      {renderActiveControls('comp-left-card', 'Mover Recuadro')}

                      {/* Drag Handle on hover for the card */}
                      <div
                        onPointerDown={(e) => startDrag('comp-left-card', e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectElement('comp-left-card');
                        }}
                        className="no-export absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 p-1 rounded bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white cursor-grab active:cursor-grabbing transition"
                        title="Arrastrar recuadro izquierdo"
                      >
                        <Move className="w-2.5 h-2.5" />
                      </div>

                      {!isHidden('comp-leftTag') && (
                        <div
                          data-drag-key="comp-leftTag"
                          className={`group relative inline-flex items-center gap-1.5 cursor-pointer rounded p-0.5 ${
                            activeElementKey === 'comp-leftTag' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/30'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement('comp-leftTag');
                          }}
                          style={getStyleFor('comp-leftTag')}
                        >
                          {renderActiveControls('comp-leftTag')}
                          <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateComparison?.({ leftTag: e.currentTarget.innerText })}
                            className="outline-none"
                          >
                            {slide.comparison?.leftTag || loc.comparison.leftTag}
                          </span>
                        </div>
                      )}

                      {!isHidden('comp-leftTitle') && (
                        <div
                          data-drag-key="comp-leftTitle"
                          className={`group relative cursor-pointer rounded p-0.5 transition ${
                            activeElementKey === 'comp-leftTitle' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/30'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement('comp-leftTitle');
                          }}
                          style={getStyleFor('comp-leftTitle')}
                        >
                          {renderActiveControls('comp-leftTitle')}
                          <h4
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateComparison?.({ leftTitle: e.currentTarget.innerText })}
                            className="outline-none"
                          >
                            {slide.comparison?.leftTitle || loc.comparison.leftTitle}
                          </h4>
                        </div>
                      )}

                      {!isHidden('comp-leftText') && (
                        <div
                          data-drag-key="comp-leftText"
                          className={`group relative cursor-pointer rounded p-0.5 transition ${
                            activeElementKey === 'comp-leftText' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/30'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement('comp-leftText');
                          }}
                          style={getStyleFor('comp-leftText')}
                        >
                          {renderActiveControls('comp-leftText')}
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateComparison?.({ leftText: e.currentTarget.innerText })}
                            className="outline-none"
                          >
                            {slide.comparison?.leftText || loc.comparison.leftText}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Right Column (Solution / After) */}
                  {!isHidden('comp-right-card') && (
                    <div
                      data-drag-key="comp-right-card"
                      className={`rounded-2xl p-3 space-y-1.5 text-left transition group/card ${
                        isCardBoxTransparent('comp-right-card')
                          ? 'bg-transparent border border-emerald-500/30 shadow-none'
                          : 'bg-emerald-950/40 border border-emerald-700/60 backdrop-blur-xs'
                      } ${activeElementKey === 'comp-right-card' ? 'ring-2 ring-rose-500' : 'hover:border-emerald-500/60'}`}
                      onClick={(e) => {
                        if (e.target === e.currentTarget) {
                          e.stopPropagation();
                          onSelectElement('comp-right-card');
                        }
                      }}
                      style={getStyleFor('comp-right-card')}
                    >
                      {renderActiveControls('comp-right-card', 'Mover Recuadro')}

                      {/* Drag Handle on hover for the card */}
                      <div
                        onPointerDown={(e) => startDrag('comp-right-card', e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectElement('comp-right-card');
                        }}
                        className="no-export absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 p-1 rounded bg-slate-900/80 hover:bg-emerald-600 text-slate-300 hover:text-white cursor-grab active:cursor-grabbing transition"
                        title="Arrastrar recuadro derecho"
                      >
                        <Move className="w-2.5 h-2.5" />
                      </div>

                      {!isHidden('comp-rightTag') && (
                        <div
                          data-drag-key="comp-rightTag"
                          className={`group relative inline-flex items-center gap-1.5 cursor-pointer rounded p-0.5 ${
                            activeElementKey === 'comp-rightTag' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/30'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement('comp-rightTag');
                          }}
                          style={getStyleFor('comp-rightTag')}
                        >
                          {renderActiveControls('comp-rightTag')}
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateComparison?.({ rightTag: e.currentTarget.innerText })}
                            className="outline-none"
                          >
                            {slide.comparison?.rightTag || loc.comparison.rightTag}
                          </span>
                        </div>
                      )}

                      {!isHidden('comp-rightTitle') && (
                        <div
                          data-drag-key="comp-rightTitle"
                          className={`group relative cursor-pointer rounded p-0.5 transition ${
                            activeElementKey === 'comp-rightTitle' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/30'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement('comp-rightTitle');
                          }}
                          style={getStyleFor('comp-rightTitle')}
                        >
                          {renderActiveControls('comp-rightTitle')}
                          <h4
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateComparison?.({ rightTitle: e.currentTarget.innerText })}
                            className="outline-none"
                          >
                            {slide.comparison?.rightTitle || loc.comparison.rightTitle}
                          </h4>
                        </div>
                      )}

                      {!isHidden('comp-rightText') && (
                        <div
                          data-drag-key="comp-rightText"
                          className={`group relative cursor-pointer rounded p-0.5 transition ${
                            activeElementKey === 'comp-rightText' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/30'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement('comp-rightText');
                          }}
                          style={getStyleFor('comp-rightText')}
                        >
                          {renderActiveControls('comp-rightText')}
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateComparison?.({ rightText: e.currentTarget.innerText })}
                            className="outline-none"
                          >
                            {slide.comparison?.rightText || loc.comparison.rightText}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isHidden('body') && slide.body && (
              <div
                data-drag-key="body"
                className={`group relative cursor-pointer transition rounded-xl p-1 text-center ${
                  activeElementKey === 'body' ? 'ring-2 ring-rose-500 bg-slate-900/60' : 'hover:bg-slate-900/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('body');
                }}
                style={getStyleFor('body')}
              >
                {renderActiveControls('body')}
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('body', e.currentTarget.innerText)}
                  className="outline-none"
                >
                  {slide.body}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 3: QUOTE / TESTIMONIAL (Cita de Autoridad) */}
        {/* ==================================================================== */}
        {layout === 'quote' && !isHidden('quote-container') && (
          <div
            data-drag-key="quote-container"
            className="space-y-4 my-auto text-center px-2 w-full"
            style={getStyleFor('quote-container')}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.stopPropagation();
                onSelectElement('quote-container');
              }
            }}
          >
            {renderActiveControls('quote-container', 'Mover Cita')}
            <div className="flex justify-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl"
                style={{ backgroundColor: primaryColor }}
              >
                <Quote className="w-6 h-6" />
              </div>
            </div>

            {!isHidden('quote-text') && !isHidden('body') && (
              <div
                data-drag-key="quote-text"
                className={`group relative cursor-pointer transition rounded-2xl p-2 ${
                  isCardBoxTransparent('quote-text')
                    ? 'bg-transparent border-0'
                    : ''
                } ${
                  activeElementKey === 'quote-text' || activeElementKey === 'body'
                    ? 'ring-2 ring-rose-500 bg-slate-900/60'
                    : 'hover:bg-slate-900/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('quote-text');
                }}
                style={getStyleFor('quote-text')}
              >
                {renderActiveControls('quote-text')}
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.innerText.replace(/^["“”]/, '').replace(/["“”]$/, '');
                    onUpdateQuote?.({ quoteText: val });
                  }}
                  className="outline-none font-serif"
                >
                  "{slide.quote?.quoteText || slide.body || loc.quote.quoteText}"
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 inline-block px-4 space-y-0.5">
              {!isHidden('quote-author') && (
                <div
                  data-drag-key="quote-author"
                  className={`group relative cursor-pointer transition rounded-md p-1 ${
                    activeElementKey === 'quote-author' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/30'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('quote-author');
                  }}
                  style={getStyleFor('quote-author')}
                >
                  {renderActiveControls('quote-author')}
                  <h4
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateQuote?.({ authorName: e.currentTarget.innerText })}
                    className="outline-none"
                  >
                    {slide.quote?.authorName || brand.name || 'LA VISUAL MK'}
                  </h4>
                </div>
              )}

              {!isHidden('quote-role') && (
                <div
                  data-drag-key="quote-role"
                  className={`group relative cursor-pointer transition rounded-md p-1 ${
                    activeElementKey === 'quote-role' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/30'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('quote-role');
                  }}
                  style={getStyleFor('quote-role')}
                >
                  {renderActiveControls('quote-role')}
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateQuote?.({ authorRole: e.currentTarget.innerText })}
                    className="outline-none"
                  >
                    {slide.quote?.authorRole || loc.quote.authorRole}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 4: BIG STAT / MÉTRICA */}
        {/* ==================================================================== */}
        {layout === 'big_number' && !isHidden('stat-container') && (
          <div
            data-drag-key="stat-container"
            className="space-y-3.5 my-auto text-center w-full"
            style={getStyleFor('stat-container')}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.stopPropagation();
                onSelectElement('stat-container');
              }
            }}
          >
            {renderActiveControls('stat-container', 'Mover Métrica')}
            {!isHidden('badge') && slide.badge && (
              <div
                data-drag-key="badge"
                className={`group relative inline-block cursor-pointer transition rounded-lg ${
                  activeElementKey === 'badge' ? 'ring-2 ring-rose-500' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('badge');
                }}
                style={getStyleFor('badge')}
              >
                {renderActiveControls('badge')}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('badge', e.currentTarget.innerText)}
                  className="px-3 py-1 rounded uppercase tracking-wider inline-block shadow outline-none"
                  style={getBadgeStyle('badge')}
                >
                  {slide.badge || loc.stat.badge}
                </span>
              </div>
            )}

            <div className="py-1 space-y-1">
              {!isHidden('stat-number') && (
                <div
                  data-drag-key="stat-number"
                  className={`group relative cursor-pointer transition rounded-2xl p-1 inline-block ${
                    activeElementKey === 'stat-number' ? 'ring-2 ring-rose-500 bg-slate-900/60' : 'hover:bg-slate-900/30'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('stat-number');
                  }}
                  style={getStyleFor('stat-number')}
                >
                  {renderActiveControls('stat-number')}
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateStat?.({ statNumber: e.currentTarget.innerText })}
                    className="tracking-tight outline-none block drop-shadow-lg"
                  >
                    {slide.stat?.statNumber || loc.stat.statNumber}
                  </span>
                </div>
              )}

              {!isHidden('stat-label') && (
                <div
                  data-drag-key="stat-label"
                  className={`group relative cursor-pointer transition rounded-xl p-1 ${
                    activeElementKey === 'stat-label' ? 'ring-2 ring-rose-500 bg-slate-900/60' : 'hover:bg-slate-900/30'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('stat-label');
                  }}
                  style={getStyleFor('stat-label')}
                >
                  {renderActiveControls('stat-label')}
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateStat?.({ statLabel: e.currentTarget.innerText })}
                    className="outline-none"
                  >
                    {slide.stat?.statLabel || slide.title || loc.stat.statLabel}
                  </p>
                </div>
              )}
            </div>

            {!isHidden('stat-subtext-box') && (
              <div
                data-drag-key="stat-subtext-box"
                className={`rounded-2xl p-3.5 text-left transition ${
                  isCardBoxTransparent('stat-subtext-box')
                    ? 'bg-transparent border border-slate-700/40 shadow-none'
                    : 'bg-slate-900/80 border border-slate-800'
                }`}
                style={getStyleFor('stat-subtext-box')}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    e.stopPropagation();
                    onSelectElement('stat-subtext-box');
                  }
                }}
              >
                {renderActiveControls('stat-subtext-box', 'Mover Recuadro')}
                {!isHidden('stat-subtext') && (
                  <div
                    data-drag-key="stat-subtext"
                    className={`group relative cursor-pointer transition rounded-xl p-1 ${
                      activeElementKey === 'stat-subtext' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement('stat-subtext');
                    }}
                    style={getStyleFor('stat-subtext')}
                  >
                    {renderActiveControls('stat-subtext')}
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateStat?.({ statSubtext: e.currentTarget.innerText })}
                      className="outline-none"
                    >
                      {slide.stat?.statSubtext || slide.body || loc.stat.statSubtext}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 5: CHECKLIST / STEPS (Paso a Paso) */}
        {/* ==================================================================== */}
        {layout === 'checklist' && !isHidden('checklist-container') && (
          <div
            data-drag-key="checklist-container"
            className="space-y-3 my-auto w-full"
            style={getStyleFor('checklist-container')}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.stopPropagation();
                onSelectElement('checklist-container');
              }
            }}
          >
            {renderActiveControls('checklist-container', 'Mover Pasos')}
            <div className="space-y-1 text-center">
              {!isHidden('badge') && slide.badge && (
                <div
                  data-drag-key="badge"
                  className={`group relative inline-block cursor-pointer transition rounded-lg ${
                    activeElementKey === 'badge' ? 'ring-2 ring-rose-500' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('badge');
                  }}
                  style={getStyleFor('badge')}
                >
                  {renderActiveControls('badge')}
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateField('badge', e.currentTarget.innerText)}
                    className="px-2.5 py-0.5 rounded uppercase tracking-wider inline-block outline-none"
                    style={getBadgeStyle('badge')}
                  >
                    {slide.badge || loc.checklist.badge}
                  </span>
                </div>
              )}
              {!isHidden('title') && (
                <div
                  data-drag-key="title"
                  className={`group relative cursor-pointer transition rounded-xl p-1 ${
                    activeElementKey === 'title' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('title');
                  }}
                  style={getStyleFor('title')}
                >
                  {renderActiveControls('title')}
                  <h2
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateField('title', e.currentTarget.innerText)}
                    className="outline-none"
                  >
                    {slide.title || loc.checklist.title}
                  </h2>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {(slide.bullets && slide.bullets.length > 0
                ? resolveChecklistBullets(slide.bullets, language)
                : loc.checklist.bullets
              ).map((bullet, idx, arr) => {
                if (isHidden(`bullet-${idx}`)) return null;
                return (
                  <div
                    key={idx}
                    data-drag-key={`bullet-${idx}`}
                    className={`group relative flex items-start gap-3 rounded-2xl p-3 shadow-sm cursor-pointer transition ${
                      isCardBoxTransparent(`bullet-${idx}`)
                        ? 'bg-transparent border border-slate-700/40 shadow-none'
                        : 'bg-slate-900/85 border border-slate-800'
                    } ${
                      activeElementKey === `bullet-${idx}` ? 'ring-2 ring-rose-500 bg-slate-900' : 'hover:border-slate-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(`bullet-${idx}`);
                    }}
                    style={getStyleFor(`bullet-${idx}`)}
                  >
                    {renderActiveControls(`bullet-${idx}`)}
                    <div
                      className="w-6 h-6 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0 mt-0.5 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      0{idx + 1}
                    </div>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateBullet(idx, e.currentTarget.innerText)}
                      className="flex-1 outline-none leading-relaxed"
                    >
                      {bullet}
                    </span>
                    {onDeleteBullet && arr.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBullet(idx);
                        }}
                        className="no-export opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition rounded"
                        title={language === 'pt' ? 'Excluir este ponto' : language === 'en' ? 'Delete this step' : 'Eliminar este punto'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {onAddBullet && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentCount = (slide.bullets && slide.bullets.length > 0 ? slide.bullets.length : loc.checklist.bullets.length);
                    const nextNum = currentCount + 1;
                    const defaultPrefix = language === 'pt' ? `Passo ${nextNum}: ` : language === 'en' ? `Step ${nextNum}: ` : `Paso ${nextNum}: `;
                    const defaultText = language === 'pt' ? 'Novo passo estratégico para executar...' : language === 'en' ? 'New strategic step to execute...' : 'Nuevo paso estratégico para ejecutar...';
                    onAddBullet(defaultPrefix + defaultText);
                  }}
                  className="no-export flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-400 transition px-2 py-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{loc.uiLabels?.addBullet || (language === 'pt' ? '+ Adicionar Ponto à Lista' : language === 'en' ? '+ Add Step to List' : '+ Añadir Punto a la Lista')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 6: CTA FINAL / CONVERSIÓN */}
        {/* ==================================================================== */}
        {layout === 'cta_final' && !isHidden('cta-container') && (
          <div
            data-drag-key="cta-container"
            className="space-y-4 my-auto text-center w-full"
            style={getStyleFor('cta-container')}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.stopPropagation();
                onSelectElement('cta-container');
              }
            }}
          >
            {renderActiveControls('cta-container', 'Mover CTA')}
            {/* Avatar or Logo Icon */}
            {!isHidden('cta-avatar') && (
              <div
                data-drag-key="cta-avatar"
                className={`group relative inline-flex justify-center cursor-pointer transition rounded-3xl mx-auto ${
                  activeElementKey === 'cta-avatar' ? 'ring-2 ring-rose-500' : 'hover:opacity-90'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('cta-avatar');
                }}
                style={getStyleFor('cta-avatar')}
              >
                {renderActiveControls('cta-avatar', 'Mover Logo')}
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-16 h-16 rounded-3xl object-cover transition-all"
                    style={{
                      boxShadow: getStyleFor('cta-avatar').boxShadow || '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                      borderColor: getStyleFor('cta-avatar').borderColor || 'rgba(255, 255, 255, 0.2)',
                      borderWidth: getStyleFor('cta-avatar').borderWidth || '2px',
                      borderStyle: (getStyleFor('cta-avatar').borderStyle as any) || 'solid',
                    }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black text-white transition-all"
                    style={{
                      backgroundColor: getStyleFor('cta-avatar').backgroundColor || primaryColor,
                      boxShadow: getStyleFor('cta-avatar').boxShadow || '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                      borderColor: getStyleFor('cta-avatar').borderColor || 'rgba(255, 255, 255, 0.2)',
                      borderWidth: getStyleFor('cta-avatar').borderWidth || '2px',
                      borderStyle: (getStyleFor('cta-avatar').borderStyle as any) || 'solid',
                    }}
                  >
                    {brand.name ? brand.name.charAt(0).toUpperCase() : '★'}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              {!isHidden('badge') && slide.badge && (
                <div
                  data-drag-key="badge"
                  className={`group relative inline-block cursor-pointer transition rounded-lg ${
                    activeElementKey === 'badge' ? 'ring-2 ring-rose-500' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('badge');
                  }}
                  style={getStyleFor('badge')}
                >
                  {renderActiveControls('badge')}
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateField('badge', e.currentTarget.innerText)}
                    className="px-3 py-1 rounded-full uppercase tracking-wider inline-block shadow-sm outline-none"
                    style={getBadgeStyle('badge')}
                  >
                    {slide.badge || loc.ctaFinal.badge}
                  </span>
                </div>
              )}

              {!isHidden('cta-headline') && (
                <div
                  data-drag-key="cta-headline"
                  className={`group relative cursor-pointer transition rounded-xl p-1 ${
                    activeElementKey === 'cta-headline' || activeElementKey === 'title'
                      ? 'ring-2 ring-rose-500 bg-slate-900/70'
                      : 'hover:bg-slate-900/40'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('cta-headline');
                  }}
                  style={getStyleFor('cta-headline')}
                >
                  {renderActiveControls('cta-headline')}
                  <h2
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateCtaFinal?.({ headline: e.currentTarget.innerText })}
                    className="outline-none"
                  >
                    {slide.ctaFinal?.headline || slide.title || loc.ctaFinal.headline}
                  </h2>
                </div>
              )}
            </div>

            {!isHidden('cta-subheadline-card') && (
              <div
                data-drag-key="cta-subheadline-card"
                className={`rounded-2xl p-3.5 space-y-2 transition ${
                  isCardBoxTransparent('cta-subheadline-card')
                    ? 'bg-transparent border border-slate-700/40 shadow-none'
                    : 'bg-slate-900/90 border border-slate-800'
                }`}
                style={getStyleFor('cta-subheadline-card')}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    e.stopPropagation();
                    onSelectElement('cta-subheadline-card');
                  }
                }}
              >
                {renderActiveControls('cta-subheadline-card', 'Mover Recuadro')}
                {!isHidden('cta-subheadline') && (
                  <div
                    data-drag-key="cta-subheadline"
                    className={`group relative cursor-pointer transition rounded-xl p-1 ${
                      activeElementKey === 'cta-subheadline' || activeElementKey === 'body'
                        ? 'ring-2 ring-rose-500 bg-slate-900/70'
                        : 'hover:bg-slate-900/30'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement('cta-subheadline');
                    }}
                    style={getStyleFor('cta-subheadline')}
                  >
                    {renderActiveControls('cta-subheadline')}
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateCtaFinal?.({ subheadline: e.currentTarget.innerText })}
                      className="outline-none"
                    >
                      {slide.ctaFinal?.subheadline || slide.body || loc.ctaFinal.subheadline}
                    </p>
                  </div>
                )}

                {/* Action Trigger Button Simulation */}
                {!isHidden('cta-pill') && (
                  <div
                    data-drag-key="cta-pill"
                    className={`group relative cursor-pointer transition rounded-xl ${
                      activeElementKey === 'cta-pill' ? 'ring-2 ring-rose-500' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement('cta-pill');
                    }}
                    style={getStyleFor('cta-pill')}
                  >
                    {renderActiveControls('cta-pill')}
                    <div
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-lg"
                      style={getCtaPillStyle()}
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => onUpdateCtaFinal?.({ actionPill: e.currentTarget.innerText })}
                        className="outline-none"
                      >
                        {slide.ctaFinal?.actionPill || loc.ctaFinal.actionPill}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Custom Elements Added by User (Textos, Acentos, Recuadros e Imágenes) */}
        {slide.customTexts && slide.customTexts.length > 0 && (
          <div className="space-y-2 pointer-events-auto overflow-visible">
            {slide.customTexts.map((custom) => {
              const isBox = custom.type === 'box' || custom.id.startsWith('custom-box-');
              const isAccent = custom.type === 'accent' || custom.id.startsWith('custom-accent-');
              const isImage = custom.type === 'image' || custom.id.startsWith('custom-img-') || custom.id.startsWith('custom-image-');

              if (isImage) {
                const itemStyle = getStyleFor(custom.id);
                const heightVal = getNumericHeight(custom.id);
                const isActive = activeElementKey === custom.id;
                return (
                  <div
                    key={custom.id}
                    data-drag-key={custom.id}
                    className={`group relative cursor-grab active:cursor-grabbing p-0.5 inline-flex items-center justify-center select-none ${
                      isActive
                        ? 'ring-2 ring-rose-500 rounded-xl bg-slate-900/40'
                        : 'hover:opacity-95'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(custom.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      // Double click quick toggle
                    }}
                    onPointerDown={(e) => {
                      onSelectElement(custom.id);
                      startDrag(custom.id, e);
                    }}
                    style={{
                      ...itemStyle,
                      borderRadius: `${getNumericBorderRadius(custom.id, 12)}px`,
                    }}
                    title="Haz clic o arrastra para mover la imagen a cualquier lugar"
                  >
                    {renderActiveControls(custom.id, 'Imagen')}
                    {/* 4 Interactive Corner Resize Handles when active */}
                    {isActive && !isExportMode && (
                      <>
                        <div
                          onPointerDown={(e) => startResize(custom.id, e, 'nw')}
                          className="resize-handle no-export absolute -top-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full shadow-lg cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                          title="Arrastrar esquina para redimensionar"
                        />
                        <div
                          onPointerDown={(e) => startResize(custom.id, e, 'ne')}
                          className="resize-handle no-export absolute -top-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full shadow-lg cursor-nesw-resize z-50 hover:scale-125 transition-transform"
                          title="Arrastrar esquina para redimensionar"
                        />
                        <div
                          onPointerDown={(e) => startResize(custom.id, e, 'sw')}
                          className="resize-handle no-export absolute -bottom-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full shadow-lg cursor-nesw-resize z-50 hover:scale-125 transition-transform"
                          title="Arrastrar esquina para redimensionar"
                        />
                        <div
                          onPointerDown={(e) => startResize(custom.id, e, 'se')}
                          className="resize-handle no-export absolute -bottom-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-slate-950 rounded-full shadow-lg cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                          title="Arrastrar esquina para redimensionar"
                        />
                      </>
                    )}
                    {custom.imageUrl ? (
                      <img
                        src={custom.imageUrl}
                        alt="Capa personalizada"
                        referrerPolicy="no-referrer"
                        className="object-contain pointer-events-none"
                        style={{
                          height: `${heightVal}px`,
                          width: 'auto',
                          maxWidth: 'none',
                          maxHeight: 'none',
                          borderRadius: `${getNumericBorderRadius(custom.id, 12)}px`,
                          opacity: itemStyle.opacity !== undefined ? itemStyle.opacity : 1,
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-800/90 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    {onDeleteCustomText && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomText(custom.id);
                        }}
                        className="no-export absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition"
                        title="Eliminar imagen o logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              }

              if (isBox) {
                return (
                  <div
                    key={custom.id}
                    data-drag-key={custom.id}
                    className={`group relative cursor-pointer transition rounded-2xl p-4 shadow-lg ${
                      activeElementKey === custom.id
                        ? 'ring-2 ring-rose-500 bg-slate-900/90'
                        : 'bg-slate-900/70 hover:border-slate-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(custom.id);
                    }}
                    style={{
                      border: '1px solid rgba(51, 65, 85, 0.8)',
                      minHeight: '60px',
                      ...getStyleFor(custom.id),
                    }}
                  >
                    {renderActiveControls(custom.id, 'Mover Recuadro')}
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateCustomText?.(custom.id, e.currentTarget.innerText)}
                      className="outline-none leading-relaxed text-sm text-slate-300"
                    >
                      {custom.text || 'Recuadro contenedor editable (puedes moverlo, cambiar su fondo, borde, o enviarlo atrás).'}
                    </div>
                    {onDeleteCustomText && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomText(custom.id);
                        }}
                        className="no-export absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition"
                        title="Eliminar recuadro"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              }

              if (isAccent) {
                return (
                  <div
                    key={custom.id}
                    data-drag-key={custom.id}
                    className={`group relative cursor-pointer transition rounded-full my-1.5 ${
                      activeElementKey === custom.id
                        ? 'ring-2 ring-rose-500'
                        : 'hover:opacity-90'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(custom.id);
                    }}
                    style={{
                      height: '4px',
                      width: '45%',
                      backgroundColor: custom.color || primaryColor,
                      boxShadow: `0 0 14px ${(custom.color || primaryColor)}90`,
                      ...getStyleFor(custom.id),
                    }}
                  >
                    {renderActiveControls(custom.id, 'Mover Acento')}
                    {onDeleteCustomText && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomText(custom.id);
                        }}
                        className="no-export absolute -top-2.5 -right-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition"
                        title="Eliminar acento"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={custom.id}
                  data-drag-key={custom.id}
                  className={`group relative cursor-pointer transition rounded-xl p-2 bg-slate-900/60 border border-slate-800/80 shadow-sm ${
                    activeElementKey === custom.id ? 'ring-2 ring-rose-500 bg-slate-900/90' : 'hover:bg-slate-900/80'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement(custom.id);
                  }}
                  style={getStyleFor(custom.id)}
                >
                  {renderActiveControls(custom.id)}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateCustomText?.(custom.id, e.currentTarget.innerText)}
                    className="outline-none leading-relaxed"
                  >
                    {custom.text}
                  </div>
                  {onDeleteCustomText && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomText(custom.id);
                      }}
                      className="no-export absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition"
                      title="Eliminar capa de texto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

        {/* Bottom Elements (CTA & Web sin barra divisoria, libres para trasladarse) */}
        <div className="w-full flex items-center justify-between gap-3 pointer-events-none text-xs mt-1">
          {!isHidden('cta') && (
            <div
              data-drag-key="cta"
              className={`group relative pointer-events-auto cursor-pointer transition rounded-lg px-2 py-0.5 ${
                activeElementKey === 'cta' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement('cta');
              }}
              style={getStyleFor('cta')}
            >
              {renderActiveControls('cta')}
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateField('cta', e.currentTarget.innerText)}
                className="outline-none flex items-center gap-1.5"
              >
                {slide.cta || loc.standard.cta}
              </span>
            </div>
          )}

          {!isHidden('brandWeb') && (
            <div
              data-drag-key="brandWeb"
              className={`group relative pointer-events-auto cursor-pointer transition rounded-lg px-2 py-0.5 ${
                activeElementKey === 'brandWeb' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement('brandWeb');
              }}
              style={getStyleFor('brandWeb')}
            >
              {renderActiveControls('brandWeb')}
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateBrand('web', e.currentTarget.innerText)}
                className="outline-none hover:underline"
              >
                {brand.web || (brand.handle ? `@${brand.handle.replace(/^@/, '')}` : 'lavisualmk.com')}
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
