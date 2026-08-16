import React, { useState, useEffect, useRef } from 'react';
import {
  GripHorizontal,
  X,
  Minimize2,
  Maximize2,
  ImageIcon,
  Sparkles,
  Layers,
  PanelRight,
  Move,
  RotateCcw,
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
      return { x: initialX, y: 70 };
    }
    return { x: 500, y: 70 };
  });

  const [isMinimized, setIsMinimized] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [isExpandedHeight, setIsExpandedHeight] = useState(false);
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
    if (isDocked) return;
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
      if (!isDragging || isDocked) return;
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const modalWidth = isMinimized ? 240 : 540;
      const modalHeight = isMinimized ? 50 : 500;

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
  }, [isDragging, isMinimized, isDocked]);

  const handleResetPosition = () => {
    setIsDocked(false);
    setIsMinimized(false);
    if (typeof window !== 'undefined') {
      setPosition({
        x: Math.max(20, window.innerWidth - 560),
        y: 70,
      });
    }
  };

  if (!isOpen) return null;

  // Dynamic inline styles depending on docked / floating / minimized states
  const modalStyle: React.CSSProperties = isDocked
    ? {
        position: 'fixed',
        right: '12px',
        top: '65px',
        bottom: '75px',
        width: '540px',
        maxWidth: 'calc(100vw - 24px)',
        zIndex: 50,
      }
    : {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '280px' : '540px',
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: isMinimized
          ? 'auto'
          : isExpandedHeight
          ? 'calc(100vh - 85px)'
          : `min(calc(100vh - ${Math.max(10, position.y)}px - 20px), calc(100vh - 80px))`,
        height: isExpandedHeight ? 'calc(100vh - 85px)' : undefined,
        zIndex: 50,
        boxShadow: isDragging
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(225, 29, 72, 0.3)'
          : '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      };

  return (
    <div
      id="floating-media-modal"
      className="select-none shadow-2xl rounded-2xl border border-slate-700/90 bg-slate-900/95 backdrop-blur-xl flex flex-col transition-all duration-200"
      style={modalStyle}
    >
      {/* Header Bar - Draggable Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 rounded-t-2xl ${
          isDocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        } ${isDragging ? 'cursor-grabbing border-rose-500/50' : ''}`}
        title={isDocked ? 'Panel anclado al marco derecho' : 'Arrastra esta ventana desde aquí para moverla libremente'}
      >
        <div className="flex items-center gap-2 min-w-0">
          {!isDocked && <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" />}
          <div className="flex items-center gap-1.5 min-w-0">
            <ImageIcon className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-xs font-bold text-white truncate">
              Fondos & Media
            </span>
            <span className="text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-600/40 px-1.5 py-0.2 rounded-full shrink-0 font-mono">
              #{slideIndex + 1}/{totalSlides}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Dock / Auto-fit to Frame Toggle */}
          <button
            onClick={() => {
              setIsDocked(!isDocked);
              setIsMinimized(false);
            }}
            className={`p-1.5 rounded-lg transition text-xs flex items-center gap-1 ${
              isDocked
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isDocked ? 'Desanclar (Hacer flotante libre)' : 'Autoajustar y anclar al marco derecho'}
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>

          {/* Expand Height / Standard Height */}
          {!isDocked && (
            <button
              onClick={() => {
                setIsExpandedHeight(!isExpandedHeight);
                setIsMinimized(false);
              }}
              className={`p-1.5 rounded-lg transition ${
                isExpandedHeight
                  ? 'bg-slate-800 text-rose-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isExpandedHeight ? 'Altura estándar' : 'Expandir al alto máximo de la pantalla'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Reset position if moved far */}
          {!isDocked && (
            <button
              onClick={handleResetPosition}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Restablecer posición inicial"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Minimize / Expand Button */}
          {!isDocked && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title={isMinimized ? 'Expandir contenido' : 'Minimizar ventana'}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
            title="Cerrar panel de medios"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content with prominent vertical scrollbar */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 select-text bg-slate-900/70 rounded-b-2xl min-h-0">
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

