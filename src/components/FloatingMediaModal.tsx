import React, { useState, useEffect, useRef } from 'react';
import {
  GripHorizontal,
  X,
  Minimize2,
  Maximize2,
  ImageIcon,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Slide, AspectRatio, BrandInfo } from '../types';
import { AgencyClient } from '../services/supabase';
import { MediaPanel } from './MediaPanel';

interface FloatingMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  slide: Slide;
  slides: Slide[];
  onUpdateSlide: (partial: Partial<Slide>) => void;
  onUpdateAllSlides?: (slides: Slide[]) => void;
  brief: string;
  visualStyle: string;
  aspectRatio: AspectRatio;
  client?: AgencyClient | null;
  brand?: BrandInfo;
  targetAudience?: string;
  slideIndex: number;
  totalSlides: number;
  escenasPorDiapositiva?: Record<string | number, string>;
  onSaveConcreteScene?: (slideKey: string | number, scene: string) => void;
  onSaveAllConcreteScenes?: (scenesMap: Record<string | number, string>) => void;
}

export const FloatingMediaModal: React.FC<FloatingMediaModalProps> = ({
  isOpen,
  onClose,
  slide,
  slides,
  onUpdateSlide,
  onUpdateAllSlides,
  brief,
  visualStyle,
  aspectRatio,
  client,
  brand,
  targetAudience,
  slideIndex,
  totalSlides,
  escenasPorDiapositiva,
  onSaveConcreteScene,
  onSaveAllConcreteScenes,
}) => {
  // Default position: top right corner of desktop screen
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const initialX = Math.max(20, window.innerWidth - 560);
      return { x: initialX, y: 75 };
    }
    return { x: 500, y: 75 };
  });

  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
  });

  // Keep inside screen when window resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(10, window.innerWidth - 300);
        const maxY = Math.max(10, window.innerHeight - 100);
        return {
          x: Math.min(Math.max(10, prev.x), maxX),
          y: Math.min(Math.max(10, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking the header bar, not buttons or inputs inside it
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const modalWidth = isMinimized ? 240 : 540;
      const modalHeight = isMinimized ? 50 : 600;

      const newX = Math.max(10, Math.min(window.innerWidth - modalWidth, dragStartRef.current.posX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - modalHeight, dragStartRef.current.posY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMinimized]);

  if (!isOpen) return null;

  return (
    <div
      id="floating-media-modal"
      className="fixed z-50 select-none shadow-2xl rounded-2xl border border-slate-700/90 bg-slate-900/95 backdrop-blur-xl flex flex-col transition-shadow duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '280px' : '540px',
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: isMinimized ? 'auto' : 'calc(100vh - 100px)',
        boxShadow: isDragging
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(225, 29, 72, 0.3)'
          : '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Header Bar - Draggable Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 rounded-t-2xl cursor-grab active:cursor-grabbing ${
          isDragging ? 'cursor-grabbing border-rose-500/50' : ''
        }`}
        title="Arrastra esta ventana desde aquí para moverla libremente por la pantalla"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <ImageIcon className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-xs font-bold text-white truncate">
              Fondos & Media
            </span>
            <span className="text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-600/40 px-1.5 py-0.2 rounded-full shrink-0">
              #{slideIndex + 1}/{totalSlides}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Minimize / Expand Button */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title={isMinimized ? 'Expandir ventana de medios' : 'Minimizar ventana para ver más lienzo'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
            title="Cerrar panel flotante de medios"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content (Hidden when minimized) */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 select-text bg-slate-900/60 rounded-b-2xl">
          <MediaPanel
            slide={slide}
            slides={slides}
            onUpdateAllSlides={onUpdateAllSlides}
            brief={brief}
            visualStyle={visualStyle}
            aspectRatio={aspectRatio}
            onUpdateSlide={onUpdateSlide}
            client={client}
            brand={brand}
            targetAudience={targetAudience}
            slideIndex={slideIndex}
            totalSlides={totalSlides}
            escenasPorDiapositiva={escenasPorDiapositiva}
            onSaveConcreteScene={onSaveConcreteScene}
            onSaveAllConcreteScenes={onSaveAllConcreteScenes}
          />
        </div>
      )}
    </div>
  );
};
