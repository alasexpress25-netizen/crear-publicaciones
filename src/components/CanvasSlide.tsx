import React, { useRef } from 'react';
import {
  Slide,
  BrandInfo,
  AspectRatio,
  ComparisonData,
  BigStatData,
  QuoteData,
  CtaFinalData,
  SlideLayoutTemplate,
  CustomTextLayer
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
  GripVertical
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
  onAddBullet?: () => void;
  onUpdateBrand: (field: keyof BrandInfo, value: any) => void;
  onUpdateCustomText?: (id: string, text: string) => void;
  onDeleteCustomText?: (id: string) => void;
  onAddCustomText?: (type?: 'heading' | 'body' | 'badge') => void;
  onDeleteElement?: (key: string) => void;
  onUpdateComparison?: (partial: Partial<ComparisonData>) => void;
  onUpdateStat?: (partial: Partial<BigStatData>) => void;
  onUpdateQuote?: (partial: Partial<QuoteData>) => void;
  onUpdateCtaFinal?: (partial: Partial<CtaFinalData>) => void;
  onUpdateTextPos?: (key: string, pos: { left: number; top: number } | null) => void;
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
  isExportMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loc = getTemplateLocalization(language);

  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';

  // Aspect ratio map
  const aspectClassMap = {
    '4:5': 'aspect-[4/5] max-w-[450px]',
    '1:1': 'aspect-square max-w-[450px]',
    '9:16': 'aspect-[9/16] max-w-[370px]',
    '16:9': 'aspect-[16/9] max-w-[550px]',
  };

  const startDrag = (key: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current || isExportMode) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const currentPos = slide.textPos?.[key] || {
      left: Math.round(((e.clientX - containerRect.left) / containerRect.width) * 100),
      top: Math.round(((e.clientY - containerRect.top) / containerRect.height) * 100),
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const deltaXPct = (deltaX / containerRect.width) * 100;
      const deltaYPct = (deltaY / containerRect.height) * 100;

      const newLeft = Math.max(5, Math.min(95, Math.round(currentPos.left + deltaXPct)));
      const newTop = Math.max(5, Math.min(95, Math.round(currentPos.top + deltaYPct)));

      onUpdateTextPos?.(key, { left: newLeft, top: newTop });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const renderActiveControls = (key: string) => {
    if (activeElementKey !== key || isExportMode) return null;
    const hasPos = Boolean(slide.textPos && slide.textPos[key]);

    return (
      <div
        className="no-export absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-slate-900/95 border border-rose-500 shadow-2xl px-2 py-0.5 rounded-full text-[10px] font-bold text-white select-none whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onPointerDown={(e) => startDrag(key, e)}
          className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-rose-300 hover:text-white px-1 py-0.5 transition"
          title="Mantén presionado y arrastra para mover este texto libremente por la diapositiva"
        >
          <Move className="w-3 h-3 text-rose-400" />
          <span>Mover</span>
        </div>
        {hasPos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateTextPos?.(key, null);
            }}
            className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-1.5 py-0.5 rounded border border-slate-700 transition"
            title="Restablecer a posición por defecto"
          >
            Restablecer
          </button>
        )}
      </div>
    );
  };

  const getDefaultsForElement = (key: string, pColor: string): React.CSSProperties => {
    if (key === 'brandName') return { color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' };
    if (key === 'brandHandle') return { color: '#94a3b8', fontSize: '11px', fontWeight: 500, letterSpacing: '0.025em' };
    if (key === 'brandWeb') return { color: pColor, fontSize: '11px', fontWeight: 'bold' };
    if (key === 'badge') return { color: '#ffffff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' };
    if (key === 'subtag') return { color: pColor, fontSize: '13px', fontWeight: 'bold' };
    if (key === 'title') return { color: '#ffffff', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.25 };
    if (key === 'body') return { color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6 };
    if (key.startsWith('bullet-')) return { color: '#e2e8f0', fontSize: '12px', lineHeight: 1.5 };
    if (key === 'cta') return { color: '#cbd5e1', fontSize: '12px', fontWeight: 600 };
    
    if (key === 'quote-text') return { color: '#ffffff', fontSize: '18px', fontWeight: 'bold', fontStyle: 'italic', lineHeight: 1.5 };
    if (key === 'quote-author') return { color: '#ffffff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' };
    if (key === 'quote-role') return { color: '#fb7185', fontSize: '11px', fontWeight: 600 };

    if (key === 'stat-number') return { color: pColor, fontSize: '60px', fontWeight: 900, lineHeight: 1 };
    if (key === 'stat-label') return { color: '#ffffff', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' };
    if (key === 'stat-subtext') return { color: '#cbd5e1', fontSize: '12px', lineHeight: 1.5 };

    if (key === 'comp-leftTag') return { color: '#f87171', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' };
    if (key === 'comp-leftTitle') return { color: '#ffffff', fontSize: '13px', fontWeight: 'bold', lineHeight: 1.3 };
    if (key === 'comp-leftText') return { color: '#cbd5e1', fontSize: '11px', lineHeight: 1.4 };
    if (key === 'comp-rightTag') return { color: '#34d399', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' };
    if (key === 'comp-rightTitle') return { color: '#ffffff', fontSize: '13px', fontWeight: 'bold', lineHeight: 1.3 };
    if (key === 'comp-rightText') return { color: '#cbd5e1', fontSize: '11px', lineHeight: 1.4 };

    if (key === 'cta-headline') return { color: '#ffffff', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.25 };
    if (key === 'cta-subheadline') return { color: '#cbd5e1', fontSize: '12px', lineHeight: 1.5 };
    if (key === 'cta-pill') return { color: '#ffffff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' };

    return { color: '#ffffff', fontSize: '13px' };
  };

  const getStyleFor = (key: string, baseStyle?: React.CSSProperties) => {
    const customTextLayer = slide.customTexts?.find((c) => c.id === key);
    const custom = (slide.textStyle && slide.textStyle[key]) || (brand.textStyle && brand.textStyle[key]) || {};
    const pos = slide.textPos && slide.textPos[key];
    const def = getDefaultsForElement(key, primaryColor);

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
    if (custom.width) styleObj.width = `${custom.width}px`;
    if (custom.letterSpacing) styleObj.letterSpacing = custom.letterSpacing;
    if (custom.textTransform) styleObj.textTransform = custom.textTransform;

    const shadowParts: string[] = [];

    // 1. Contorno de texto (Stroke / Outline)
    if (custom.outline) {
      const outCol = custom.outlineColor || '#000000';
      const outW = custom.outlineWidth || 2;
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
      (styleObj as any).WebkitTextStroke = `${Math.max(1, outW * 0.8)}px ${outCol}`;
      (styleObj as any).paintOrder = 'stroke fill';
    }

    // 2. Sombra de texto (Drop Shadow)
    if (custom.shadow) {
      const shCol = custom.shadowColor || '#000000';
      const shType = custom.shadowType || 'soft';
      
      if (shType === 'soft') {
        // Sombra difusa y envolvente para legibilidad
        shadowParts.push(`0px 6px 16px ${shCol}`, `0px 2px 6px ${shCol}`);
      } else if (shType === 'subtle') {
        // Sombra sutil y elegante
        shadowParts.push(`0px 3px 8px ${shCol}cc`);
      } else if (shType === 'hard') {
        // Sombra recta / sólida 3D retro
        shadowParts.push(`3.5px 3.5px 0px ${shCol}`);
      } else if (shType === 'glow') {
        // Resplandor / Neón difuso
        shadowParts.push(`0px 0px 10px ${shCol}`, `0px 0px 24px ${shCol}`);
      }
    }

    if (shadowParts.length > 0) {
      styleObj.textShadow = shadowParts.join(', ');
    }

    if (pos) {
      styleObj.position = 'absolute';
      styleObj.left = `${pos.left}%`;
      styleObj.top = `${pos.top}%`;
      styleObj.transform = 'translate(-50%, -50%)';
      styleObj.zIndex = 30;
      const isInline = ['brandName', 'brandHandle', 'brandWeb', 'badge', 'cta', 'cta-pill', 'comp-leftTag', 'comp-rightTag', 'quote-author', 'quote-role'].includes(key) || key.startsWith('bullet-');
      styleObj.width = styleObj.width || (isInline ? 'auto' : '85%');
    }

    return styleObj;
  };

  const overlayIntensity = slide.overlayIntensity !== undefined ? slide.overlayIntensity : 85;
  const overlayOpacity = overlayIntensity / 100;

  const bgZoom = slide.zoom || 1;
  const bgPosX = slide.posX !== undefined ? slide.posX : 50;
  const bgPosY = slide.posY !== undefined ? slide.posY : 50;
  const bgFit = slide.fit || 'cover';
  const layout = slide.layoutTemplate || 'standard';

  return (
    <div
      ref={containerRef}
      id={isExportMode ? undefined : 'active-canvas-slide-container'}
      data-slide-id={slide.id}
      className={`relative w-full ${aspectClassMap[aspectRatio] || aspectClassMap['4:5']} mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 select-none transition-transform duration-150 flex flex-col justify-between`}
      style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top center',
      }}
    >
      {/* Background Media */}
      {slide.mediaType === 'video' && slide.image ? (
        <video
          src={slide.image}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-200"
          style={{
            objectFit: bgFit,
            objectPosition: `${bgPosX}% ${bgPosY}%`,
            transform: `scale(${bgZoom})`,
          }}
        />
      ) : slide.image ? (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none bg-center bg-no-repeat transition-all duration-200"
          style={{
            backgroundImage: `url("${slide.image}")`,
            backgroundSize: bgFit,
            backgroundPosition: `${bgPosX}% ${bgPosY}%`,
            transform: `scale(${bgZoom})`,
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at top right, ${primaryColor}22, #020617 80%)`,
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

      {/* Top Header Bar */}
      <div className="relative z-10 w-full p-5 sm:p-6 pb-2 flex items-center justify-between gap-3 border-b border-slate-800/50">
        <div
          className={`group relative flex items-center gap-2 cursor-pointer transition rounded-xl px-2 py-1 ${
            activeElementKey === 'brandName' ? 'ring-2 ring-rose-500 bg-slate-900/80' : 'hover:bg-slate-900/40'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement('brandName');
          }}
          style={getStyleFor('brandName')}
        >
          {renderActiveControls('brandName')}
          {brand.logo ? (
            <img
              src={brand.logo}
              alt="Logo"
              className="rounded-lg object-contain border border-slate-700/80 bg-slate-950/60 p-0.5 transition-all"
              style={{
                height: `${brand.logoSize || 24}px`,
                maxWidth: `${Math.max(60, (brand.logoSize || 24) * 3)}px`,
              }}
            />
          ) : (
            <div
              className="rounded-lg flex items-center justify-center text-white font-black shadow-sm transition-all shrink-0"
              style={{
                backgroundColor: primaryColor,
                width: `${brand.logoSize || 24}px`,
                height: `${brand.logoSize || 24}px`,
                fontSize: `${Math.max(9, Math.round((brand.logoSize || 24) * 0.45))}px`,
              }}
            >
              {brand.name ? brand.name.charAt(0).toUpperCase() : '★'}
            </div>
          )}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdateBrand('name', e.currentTarget.innerText)}
            className="outline-none"
          >
            {brand.name || 'LA VISUAL MK'}
          </span>
        </div>

        <div
          className={`group relative flex items-center gap-1.5 cursor-pointer transition rounded-xl px-2 py-1 ${
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
      </div>

      {/* Main Content Body: Adaptive by Layout Template */}
      <div className={`relative z-10 w-full flex-1 px-5 sm:px-6 py-3 flex flex-col ${
        slide.contentAlign === 'top' ? 'justify-start' : slide.contentAlign === 'bottom' ? 'justify-end' : 'justify-center'
      } overflow-y-auto scrollbar-none`}>
        
        {/* ==================================================================== */}
        {/* LAYOUT 1: STANDARD (Title + Subtag + Body + Bullets) */}
        {/* ==================================================================== */}
        {layout === 'standard' && (
          <div className="space-y-3 my-auto w-full">
            {slide.badge && (
              <div
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
                  style={{ backgroundColor: primaryColor }}
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

            {slide.subtag && (
              <div
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

            <div
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

            {slide.body && (
              <div
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

            {slide.bullets && slide.bullets.length > 0 && (
              <div className="space-y-2 pt-1">
                {slide.bullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className={`group relative flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 cursor-pointer shadow-sm transition ${
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
                ))}

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
        {/* ==================================================================== */}
        {/* LAYOUT 2: SPLIT COMPARISON (Antes vs Después / Error vs Solución) */}
        {/* ==================================================================== */}
        {layout === 'split_comparison' && (
          <div className="space-y-3.5 my-auto w-full">
            <div className="text-center space-y-1">
              {slide.badge && (
                <div
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
                    style={{ backgroundColor: primaryColor }}
                  >
                    {slide.badge}
                  </span>
                </div>
              )}
              <div
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
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Left Column (Mistake / Before) */}
              <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-3 space-y-1.5 text-left relative">
                <div
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
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateComparison?.({ leftTag: e.currentTarget.innerText })}
                    className="outline-none"
                  >
                    {slide.comparison?.leftTag || loc.comparison.leftTag}
                  </span>
                </div>

                <div
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

                <div
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
              </div>

              {/* Right Column (Solution / After) */}
              <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-2xl p-3 space-y-1.5 text-left relative">
                <div
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
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateComparison?.({ rightTag: e.currentTarget.innerText })}
                    className="outline-none"
                  >
                    {slide.comparison?.rightTag || loc.comparison.rightTag}
                  </span>
                </div>

                <div
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

                <div
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
              </div>
            </div>

            {slide.body && (
              <div
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
        {/* ==================================================================== */}
        {/* LAYOUT 3: QUOTE / TESTIMONIAL (Cita de Autoridad) */}
        {/* ==================================================================== */}
        {layout === 'quote' && (
          <div className="space-y-4 my-auto text-center px-2 w-full">
            <div className="flex justify-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl"
                style={{ backgroundColor: primaryColor }}
              >
                <Quote className="w-6 h-6" />
              </div>
            </div>

            <div
              className={`group relative cursor-pointer transition rounded-2xl p-2 ${
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

            <div className="pt-2 border-t border-slate-800/80 inline-block px-4 space-y-0.5">
              <div
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

              <div
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
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 4: BIG STAT / MÉTRICA */}
        {/* ==================================================================== */}
        {layout === 'big_number' && (
          <div className="space-y-3.5 my-auto text-center w-full">
            {slide.badge && (
              <div
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
                  style={{ backgroundColor: primaryColor }}
                >
                  {slide.badge || loc.stat.badge}
                </span>
              </div>
            )}

            <div className="py-1 space-y-1">
              <div
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

              <div
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
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-left relative">
              <div
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
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 5: CHECKLIST / STEPS (Paso a Paso) */}
        {/* ==================================================================== */}
        {layout === 'checklist' && (
          <div className="space-y-3 my-auto w-full">
            <div className="space-y-1 text-center">
              {slide.badge && (
                <div
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
                    style={{ backgroundColor: primaryColor }}
                  >
                    {slide.badge || loc.checklist.badge}
                  </span>
                </div>
              )}
              <div
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
            </div>

            <div className="space-y-2 pt-1">
              {(slide.bullets && slide.bullets.length > 0
                ? resolveChecklistBullets(slide.bullets, language)
                : loc.checklist.bullets
              ).map((bullet, idx, arr) => (
                <div
                  key={idx}
                  className={`group relative flex items-start gap-3 bg-slate-900/85 border border-slate-800 rounded-2xl p-3 shadow-sm cursor-pointer transition ${
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
              ))}

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
        {layout === 'cta_final' && (
          <div className="space-y-4 my-auto text-center w-full">
            {/* Avatar or Logo Icon */}
            <div className="flex justify-center">
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-16 h-16 rounded-3xl object-cover border-2 border-white/20 shadow-xl"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {brand.name ? brand.name.charAt(0).toUpperCase() : '★'}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              {slide.badge && (
                <div
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
                    style={{ backgroundColor: primaryColor }}
                  >
                    {slide.badge || loc.ctaFinal.badge}
                  </span>
                </div>
              )}

              <div
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
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 relative">
              <div
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

              {/* Action Trigger Button Simulation */}
              <div
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
                  style={{ backgroundColor: primaryColor }}
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
            </div>
          </div>
        )}

        {/* Dynamic Custom Text Layers Added by User */}
        {slide.customTexts && slide.customTexts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/40 mt-2">
            {slide.customTexts.map((custom) => (
              <div
                key={custom.id}
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
            ))}
          </div>
        )}

      </div>

      {/* Bottom Footer Bar (CTA & Web) */}
      <div className="relative z-10 w-full p-5 sm:p-6 pt-2 flex items-center justify-between gap-3 border-t border-slate-800/50 text-xs">
        <div
          className={`group relative cursor-pointer transition rounded-lg px-2 py-0.5 ${
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

        <div
          className={`group relative cursor-pointer transition rounded-lg px-2 py-0.5 ${
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
      </div>

    </div>
  );
};
