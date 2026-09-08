import React, { useState, useRef } from 'react';
import { X, Upload, Film, Image as ImageIcon, Sparkles, Sliders, Eye } from 'lucide-react';
import { Slide, CustomTextLayer } from '../../types';

interface AddMediaV2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  currentSlideIndex: number;
  onAddV2Layer: (slideIndex: number, layer: CustomTextLayer, pos?: { left: number; top: number }) => void;
}

export const AddMediaV2Modal: React.FC<AddMediaV2ModalProps> = ({
  isOpen,
  onClose,
  slides,
  currentSlideIndex,
  onAddV2Layer,
}) => {
  const [targetSlideIdx, setTargetSlideIdx] = useState<number>(currentSlideIndex || 0);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('video');
  const [boxWidth, setBoxWidth] = useState<number>(45); // 45% of screen width
  const [boxHeight, setBoxHeight] = useState<number>(45);
  const [opacity, setOpacity] = useState<number>(100);
  const [posX, setPosX] = useState<number>(27); // Default centered-ish overlay
  const [posY, setPosY] = useState<number>(27);
  const [borderRadius, setBorderRadius] = useState<number>(16);
  const [inAnimation, setInAnimation] = useState<'fade_in' | 'zoom_in' | 'slide_up' | 'pop_in'>('zoom_in');
  const [inDelay, setInDelay] = useState<number>(0.2);
  const [outTime, setOutTime] = useState<number>(3.5);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video');
    setMediaType(isVid ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setMediaUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!mediaUrl.trim()) {
      alert('Por favor sube o proporciona una URL de video o imagen.');
      return;
    }

    const isVid =
      mediaType === 'video' ||
      mediaUrl.startsWith('data:video/') ||
      /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(mediaUrl);

    const newLayer: CustomTextLayer = {
      id: `v2-${Date.now()}`,
      text: isVid ? 'Video V2' : 'Imagen V2',
      type: isVid ? 'video' : 'image',
      videoUrl: isVid ? mediaUrl : undefined,
      imageUrl: isVid ? undefined : mediaUrl,
      boxWidth: boxWidth,
      boxHeight: boxHeight,
      borderRadius: borderRadius,
      opacity: opacity / 100,
      isMuted: true,
      animationIn: (inAnimation as any) || 'zoom_in',
      animationInDuration: 0.5,
      inDelay: inDelay,
      animationOut: 'fade_out',
      animationOutDuration: 0.4,
      outTime: outTime,
    };

    onAddV2Layer(targetSlideIdx, newLayer, { left: posX, top: posY });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Pista Video 2 (V2 / B-Roll Superpuesto)
              </h3>
              <p className="text-xs text-slate-400">
                Superpón un video o imagen sobre la escena sin modificar el lienzo principal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Media Type Selector Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMediaType('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mediaType === 'video'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Video B-Roll (V2)</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType('image')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mediaType === 'image'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Imagen Superpuesta</span>
            </button>
          </div>

          {/* Target Slide Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Escena objetivo donde se superpone:
            </label>
            <select
              value={targetSlideIdx}
              onChange={(e) => setTargetSlideIdx(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              {slides.map((s, idx) => (
                <option key={idx} value={idx}>
                  Escena {idx + 1}: {s.title ? s.title.slice(0, 35) + '...' : `Escena ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Media Upload / URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {mediaType === 'video' ? 'Archivo de Video (MP4, WebM):' : 'Archivo de Imagen (PNG, JPG, WebP):'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setMediaUrl(val);
                  if (val.startsWith('data:video/') || /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(val)) {
                    setMediaType('video');
                  } else if (val.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(val)) {
                    setMediaType('image');
                  }
                }}
                placeholder={mediaType === 'video' ? 'https://ejemplo.com/clip.mp4 o sube un video...' : 'https://ejemplo.com/foto.png o sube una imagen...'}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === 'video' ? 'video/mp4,video/webm,video/*' : 'image/*'}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Preview if mediaUrl exists */}
          {mediaUrl && (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="V2 Preview"
                  className="max-h-full max-w-full object-contain"
                />
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-purple-300">
                {mediaType.toUpperCase()} V2
              </div>
            </div>
          )}

          {/* Controls: Size, Opacity, Border Radius */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Ancho / Escala</span>
                <span className="text-purple-400">{boxWidth}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="100"
                value={boxWidth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBoxWidth(val);
                  setBoxHeight(val);
                }}
                className="w-full accent-purple-500 h-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Opacidad</span>
                <span className="text-purple-400">{opacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Bordes Redondos</span>
                <span className="text-purple-400">{borderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5"
              />
            </div>
          </div>

          {/* Position Controls: PosX and PosY */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Posición X (Horizontal)</span>
                <span className="text-purple-400 font-mono">{posX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                value={posX}
                onChange={(e) => setPosX(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Posición Y (Vertical)</span>
                <span className="text-purple-400 font-mono">{posY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                value={posY}
                onChange={(e) => setPosY(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5"
              />
            </div>
          </div>

          {/* Timing & Entrance Animation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Animación de Entrada:
              </label>
              <select
                value={inAnimation}
                onChange={(e) => setInAnimation(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="zoom_in">🔍 Zoom In (Agrandar)</option>
                <option value="fade">✨ Desvanecer (Fade In)</option>
                <option value="slide_up">⬆ Subir desde Abajo</option>
                <option value="pop">💥 Pop Rebotante</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Aparece al:
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={inDelay}
                    onChange={(e) => setInDelay(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400">s</span>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Desaparece al:
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="30"
                    value={outTime}
                    onChange={(e) => setOutTime(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400">s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>Superponer en Pista V2</span>
          </button>
        </div>
      </div>
    </div>
  );
};
