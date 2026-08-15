import React, { useRef } from 'react';
import {
  Slide,
  BrandInfo,
  AspectRatio,
  ComparisonData,
  BigStatData,
  QuoteData,
  CtaFinalData,
  SlideLayoutTemplate
} from '../types';
import {
  Quote,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Send,
  MessageCircle,
  Bookmark,
  Heart
} from 'lucide-react';

interface CanvasSlideProps {
  slide: Slide;
  brand: BrandInfo;
  aspectRatio: AspectRatio;
  zoomLevel: number;
  activeElementKey: string | null;
  onSelectElement: (key: string) => void;
  onUpdateField: (field: keyof Slide, value: any) => void;
  onUpdateBullet: (index: number, value: string) => void;
  onUpdateBrand: (field: keyof BrandInfo, value: any) => void;
  onUpdateComparison?: (partial: Partial<ComparisonData>) => void;
  onUpdateStat?: (partial: Partial<BigStatData>) => void;
  onUpdateQuote?: (partial: Partial<QuoteData>) => void;
  onUpdateCtaFinal?: (partial: Partial<CtaFinalData>) => void;
}

export const CanvasSlide: React.FC<CanvasSlideProps> = ({
  slide,
  brand,
  aspectRatio,
  zoomLevel,
  activeElementKey,
  onSelectElement,
  onUpdateField,
  onUpdateBullet,
  onUpdateBrand,
  onUpdateComparison,
  onUpdateStat,
  onUpdateQuote,
  onUpdateCtaFinal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';

  // Aspect ratio map
  const aspectClassMap = {
    '4:5': 'aspect-[4/5] max-w-[450px]',
    '1:1': 'aspect-square max-w-[450px]',
    '9:16': 'aspect-[9/16] max-w-[370px]',
    '16:9': 'aspect-[16/9] max-w-[550px]',
  };

  const getStyleFor = (key: string) => {
    const custom = (slide.textStyle && slide.textStyle[key]) || (brand.textStyle && brand.textStyle[key]) || {};
    const pos = slide.textPos && slide.textPos[key];

    const styleObj: React.CSSProperties = {};

    if (custom.fontSize) styleObj.fontSize = `${custom.fontSize}px`;
    if (custom.color) styleObj.color = custom.color;
    if (custom.fontFamily) styleObj.fontFamily = custom.fontFamily;
    if (custom.fontWeight) styleObj.fontWeight = custom.fontWeight;
    if (custom.fontStyle) styleObj.fontStyle = custom.fontStyle;
    if (custom.align) styleObj.textAlign = custom.align;
    if (custom.width) styleObj.width = `${custom.width}px`;
    if (custom.letterSpacing) styleObj.letterSpacing = custom.letterSpacing;
    if (custom.textTransform) styleObj.textTransform = custom.textTransform;

    if (custom.outline) {
      const col = custom.outlineColor || '#000000';
      styleObj.textShadow = `
        -1.5px -1.5px 0 ${col},
         1.5px -1.5px 0 ${col},
        -1.5px  1.5px 0 ${col},
         1.5px  1.5px 0 ${col},
         0px 2px 4px rgba(0,0,0,0.8)
      `;
    }

    if (pos) {
      styleObj.position = 'absolute';
      styleObj.left = `${pos.left}%`;
      styleObj.top = `${pos.top}%`;
      styleObj.zIndex = 20;
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
          className={`flex items-center gap-2 cursor-pointer transition rounded-xl px-2 py-1 ${
            activeElementKey === 'brandName' ? 'ring-2 ring-rose-500 bg-slate-900/80' : 'hover:bg-slate-900/40'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement('brandName');
          }}
        >
          {brand.logo ? (
            <img
              src={brand.logo}
              alt="Logo"
              className="w-5 h-5 rounded-md object-cover border border-slate-700"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-black shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {brand.name ? brand.name.charAt(0).toUpperCase() : '★'}
            </div>
          )}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdateBrand('name', e.currentTarget.innerText)}
            className="text-xs font-bold text-slate-200 uppercase tracking-wider outline-none"
            style={getStyleFor('brandName')}
          >
            {brand.name || 'LA VISUAL MK'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            SLIDE {slide.id}
          </span>
        </div>
      </div>

      {/* Main Content Body: Adaptive by Layout Template */}
      <div className="relative z-10 w-full flex-1 px-5 sm:px-6 py-3 flex flex-col justify-center overflow-y-auto scrollbar-none">
        
        {/* ==================================================================== */}
        {/* LAYOUT 1: STANDARD (Title + Subtag + Body + Bullets) */}
        {/* ==================================================================== */}
        {layout === 'standard' && (
          <div className="space-y-3 my-auto">
            {slide.badge && (
              <div
                className={`inline-block cursor-pointer transition rounded-lg ${
                  activeElementKey === 'badge' ? 'ring-2 ring-rose-500' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('badge');
                }}
                style={getStyleFor('badge')}
              >
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('badge', e.currentTarget.innerText)}
                  className="text-white font-black text-[10px] sm:text-[11px] px-3 py-1 rounded-md uppercase tracking-wider inline-block outline-none shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {slide.badge}
                </span>
              </div>
            )}

            {slide.subtag && (
              <div
                className={`cursor-pointer transition rounded-md p-1 ${
                  activeElementKey === 'subtag' ? 'ring-2 ring-rose-500 bg-slate-900/60' : 'hover:bg-slate-900/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('subtag');
                }}
              >
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('subtag', e.currentTarget.innerText)}
                  className="font-bold text-xs sm:text-sm tracking-wide outline-none"
                  style={{ color: primaryColor, ...getStyleFor('subtag') }}
                >
                  {slide.subtag}
                </p>
              </div>
            )}

            <div
              className={`cursor-pointer transition rounded-xl p-1.5 ${
                activeElementKey === 'title' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement('title');
              }}
            >
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateField('title', e.currentTarget.innerText)}
                className="font-black text-lg sm:text-2xl text-white leading-tight uppercase outline-none drop-shadow-md"
                style={getStyleFor('title')}
              >
                {slide.title || 'ESCRIBE AQUÍ EL TÍTULO O GANCHO'}
              </h2>
            </div>

            {slide.body && (
              <div
                className={`cursor-pointer transition rounded-xl p-1.5 ${
                  activeElementKey === 'body' ? 'ring-2 ring-rose-500 bg-slate-900/60' : 'hover:bg-slate-900/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('body');
                }}
              >
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateField('body', e.currentTarget.innerText)}
                  className="text-xs sm:text-sm text-slate-300 leading-relaxed outline-none"
                  style={getStyleFor('body')}
                >
                  {slide.body}
                </p>
              </div>
            )}

            {slide.bullets && slide.bullets.length > 0 && (
              <div className="space-y-2 pt-1">
                {slide.bullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 cursor-pointer shadow-sm transition ${
                      activeElementKey === `bullet-${idx}` ? 'ring-2 ring-rose-500' : 'hover:border-slate-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(`bullet-${idx}`);
                    }}
                  >
                    <span
                      className="font-bold text-sm leading-none"
                      style={{ color: primaryColor }}
                    >
                      •
                    </span>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateBullet(idx, e.currentTarget.innerText)}
                      className="flex-1 outline-none"
                      style={getStyleFor(`bullet-${idx}`)}
                    >
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 2: SPLIT COMPARISON (Antes vs Después / Error vs Solución) */}
        {/* ==================================================================== */}
        {layout === 'split_comparison' && (
          <div className="space-y-3.5 my-auto">
            <div className="text-center space-y-1">
              {slide.badge && (
                <span
                  className="text-white font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider inline-block"
                  style={{ backgroundColor: primaryColor }}
                >
                  {slide.badge}
                </span>
              )}
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateField('title', e.currentTarget.innerText)}
                className="font-black text-base sm:text-xl text-white leading-tight uppercase outline-none"
              >
                {slide.title || 'COMPARACIÓN CLAVE'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Left Column (Mistake / Before) */}
              <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-3 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-red-400 font-black text-[11px] uppercase">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateComparison?.({ leftTag: e.currentTarget.innerText })}
                    className="outline-none"
                  >
                    {slide.comparison?.leftTag || 'El Error Común'}
                  </span>
                </div>
                <h4
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateComparison?.({ leftTitle: e.currentTarget.innerText })}
                  className="text-xs font-bold text-white leading-snug outline-none"
                >
                  {slide.comparison?.leftTitle || 'Publicar sin estrategia ni oferta clara'}
                </h4>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateComparison?.({ leftText: e.currentTarget.innerText })}
                  className="text-[11px] text-slate-300 leading-relaxed outline-none"
                >
                  {slide.comparison?.leftText || 'Atrae solo curiosos y nadie pregunta por el servicio.'}
                </p>
              </div>

              {/* Right Column (Solution / After) */}
              <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-2xl p-3 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-emerald-400 font-black text-[11px] uppercase">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateComparison?.({ rightTag: e.currentTarget.innerText })}
                    className="outline-none"
                  >
                    {slide.comparison?.rightTag || 'La Estrategia Real'}
                  </span>
                </div>
                <h4
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateComparison?.({ rightTitle: e.currentTarget.innerText })}
                  className="text-xs font-bold text-white leading-snug outline-none"
                >
                  {slide.comparison?.rightTitle || 'Carruseles con ganchos de dolor & solución'}
                </h4>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateComparison?.({ rightText: e.currentTarget.innerText })}
                  className="text-[11px] text-slate-300 leading-relaxed outline-none"
                >
                  {slide.comparison?.rightText || 'Filtra clientes calificados listos para comprar.'}
                </p>
              </div>
            </div>

            {slide.body && (
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateField('body', e.currentTarget.innerText)}
                className="text-xs text-center text-slate-300 leading-relaxed pt-1 outline-none"
              >
                {slide.body}
              </p>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 3: QUOTE / TESTIMONIAL (Cita de Autoridad) */}
        {/* ==================================================================== */}
        {layout === 'quote' && (
          <div className="space-y-4 my-auto text-center px-2">
            <div className="flex justify-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl"
                style={{ backgroundColor: primaryColor }}
              >
                <Quote className="w-6 h-6" />
              </div>
            </div>

            <div className="relative">
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateQuote?.({ quoteText: e.currentTarget.innerText })}
                className="text-base sm:text-xl font-bold text-white italic leading-relaxed outline-none font-serif"
              >
                "{slide.quote?.quoteText || slide.body || 'No necesitas más seguidores, necesitas una oferta que no puedan rechazar y un gancho que los detenga.'}"
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 inline-block px-4 space-y-0.5">
              <h4
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateQuote?.({ authorName: e.currentTarget.innerText })}
                className="text-xs font-black text-white uppercase tracking-wider outline-none"
              >
                {slide.quote?.authorName || brand.name || 'LA VISUAL MK'}
              </h4>
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateQuote?.({ authorRole: e.currentTarget.innerText })}
                className="text-[11px] font-semibold text-rose-400 outline-none"
              >
                {slide.quote?.authorRole || 'Estrategia de Crecimiento & Ventas'}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 4: BIG STAT / MÉTRICA */}
        {/* ==================================================================== */}
        {layout === 'big_number' && (
          <div className="space-y-3.5 my-auto text-center">
            {slide.badge && (
              <span
                className="text-white font-black text-[9px] px-3 py-1 rounded uppercase tracking-wider inline-block shadow"
                style={{ backgroundColor: primaryColor }}
              >
                {slide.badge}
              </span>
            )}

            <div className="py-1">
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateStat?.({ statNumber: e.currentTarget.innerText })}
                className="text-5xl sm:text-7xl font-black text-white tracking-tight outline-none block drop-shadow-lg"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  color: primaryColor,
                }}
              >
                {slide.stat?.statNumber || '+350%'}
              </span>
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateStat?.({ statLabel: e.currentTarget.innerText })}
                className="text-xs sm:text-sm font-black text-white uppercase tracking-widest outline-none mt-1"
              >
                {slide.stat?.statLabel || slide.title || 'MÁS CONSULTAS CALIFICADAS'}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-left space-y-1">
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateStat?.({ statSubtext: e.currentTarget.innerText })}
                className="text-xs text-slate-300 leading-relaxed outline-none"
              >
                {slide.stat?.statSubtext || slide.body || 'Al cambiar publicaciones genéricas por carruseles con ganchos de problema y solución directa.'}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 5: CHECKLIST / STEPS (Paso a Paso) */}
        {/* ==================================================================== */}
        {layout === 'checklist' && (
          <div className="space-y-3 my-auto">
            <div className="space-y-1 text-center">
              <span
                className="text-white font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider inline-block"
                style={{ backgroundColor: primaryColor }}
              >
                {slide.badge || 'CHECKLIST ESTRATÉGICO'}
              </span>
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateField('title', e.currentTarget.innerText)}
                className="font-black text-base sm:text-xl text-white leading-tight uppercase outline-none"
              >
                {slide.title || '3 PASOS PARA EJECUTAR HOY'}
              </h2>
            </div>

            <div className="space-y-2 pt-1">
              {(slide.bullets && slide.bullets.length > 0 ? slide.bullets : [
                'Paso 1: Define el dolor número 1 que le quita el sueño a tu cliente.',
                'Paso 2: Usa un gancho de pregunta reflexiva en la primera diapositiva.',
                'Paso 3: Entrega la solución en 3 puntos y remata con un CTA a mensaje directo.'
              ]).map((bullet, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-slate-900/85 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 shadow-sm"
                >
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LAYOUT 6: CTA FINAL / CONVERSIÓN */}
        {/* ==================================================================== */}
        {layout === 'cta_final' && (
          <div className="space-y-4 my-auto text-center">
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
              <span
                className="text-white font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-wider inline-block shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {slide.badge || '¿LISTO PARA ESCALAR?'}
              </span>
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateCtaFinal?.({ headline: e.currentTarget.innerText })}
                className="font-black text-lg sm:text-2xl text-white leading-tight uppercase outline-none"
              >
                {slide.ctaFinal?.headline || slide.title || 'COMENZÁ A RECIBIR CLIENTES ESTA SEMANA'}
              </h2>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateCtaFinal?.({ subheadline: e.currentTarget.innerText })}
                className="text-xs text-slate-300 leading-relaxed outline-none"
              >
                {slide.ctaFinal?.subheadline || slide.body || 'Envíanos un mensaje directo o comenta con la palabra clave para recibir la guía completa.'}
              </p>

              {/* Action Trigger Button Simulation */}
              <div
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle className="w-4 h-4" />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateCtaFinal?.({ actionPill: e.currentTarget.innerText })}
                  className="outline-none"
                >
                  {slide.ctaFinal?.actionPill || 'Comenta "CARRUSEL" y te escribimos'}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Footer Bar (CTA & Web) */}
      <div className="relative z-10 w-full p-5 sm:p-6 pt-2 flex items-center justify-between gap-3 border-t border-slate-800/50 text-xs">
        <div
          className={`cursor-pointer transition rounded-lg px-2 py-0.5 ${
            activeElementKey === 'cta' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement('cta');
          }}
        >
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdateField('cta', e.currentTarget.innerText)}
            className="text-xs font-semibold text-slate-300 outline-none flex items-center gap-1.5"
            style={getStyleFor('cta')}
          >
            {slide.cta || '👉 Desliza para ver más'}
          </span>
        </div>

        <div
          className={`cursor-pointer transition rounded-lg px-2 py-0.5 ${
            activeElementKey === 'brandWeb' ? 'ring-2 ring-rose-500 bg-slate-900/70' : 'hover:bg-slate-900/40'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement('brandWeb');
          }}
        >
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdateBrand('web', e.currentTarget.innerText)}
            className="text-xs font-bold outline-none hover:underline"
            style={{ color: primaryColor, ...getStyleFor('brandWeb') }}
          >
            {brand.web || (brand.handle ? `@${brand.handle.replace(/^@/, '')}` : 'lavisualmk.com')}
          </span>
        </div>
      </div>

    </div>
  );
};
