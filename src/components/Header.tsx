import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Layers,
  Smartphone,
  Tv,
  Users,
} from 'lucide-react';
import { AspectRatio, BrandInfo } from '../types';

interface HeaderProps {
  brand: BrandInfo;
  onUpdateBrand: (field: keyof BrandInfo, value: any) => void;
  aspectRatio: AspectRatio;
  onSelectAspect: (aspect: AspectRatio) => void;
  selectedClientName?: string;
  selectedClientColor?: string;
  language?: 'es' | 'pt' | 'en';
  onOpenClientSelector: () => void;
  onOpenProjects?: () => void;
  onOpenExport?: () => void;
  onResetCarousel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brand,
  onUpdateBrand,
  aspectRatio,
  onSelectAspect,
  selectedClientName,
  selectedClientColor,
  language = 'es',
  onOpenClientSelector,
  onResetCarousel,
}) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert('Para instalar en iPhone/iPad: toca el botón "Compartir" en Safari y selecciona "Agregar al inicio". En Android/PC: toca el menú de tres puntos y selecciona "Instalar aplicación".');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Client Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                <span>LA VISUAL MK</span>
                <span className="text-[9px] bg-rose-600/30 text-rose-300 font-bold px-1.5 py-0.5 rounded border border-rose-500/30">
                  ESTUDIO DE IMPACTO
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">
              Generador de Carruseles con IA Estratégica
            </p>
          </div>

          {/* Client Switcher Pill Button */}
          <button
            onClick={onOpenClientSelector}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 hover:border-rose-500/50 rounded-xl px-3 py-1.5 transition ml-2 shadow-sm group"
            title="Cambiar cliente de la agencia conectado a Supabase e idioma"
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-black"
              style={{ backgroundColor: selectedClientColor || brand.primaryColor || '#e11d48' }}
            >
              {selectedClientName ? selectedClientName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-400 block uppercase font-bold leading-none">
                  Cliente Supabase
                </span>
                <span className="text-[9px] bg-slate-950 px-1 py-0.2 rounded text-slate-300 font-bold border border-slate-800">
                  {language === 'pt' ? '🇧🇷 PT' : language === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
                </span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-rose-400 transition truncate max-w-[120px] block">
                {selectedClientName || brand.name || 'Seleccionar...'}
              </span>
            </div>
            <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
          </button>
        </div>

        {/* Aspect Ratio Switcher (Mobile Only, Desktop uses Sidebar) */}
        <div className="lg:hidden flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => onSelectAspect('4:5')}
            className={`px-2.5 py-1 rounded-lg transition ${
              aspectRatio === '4:5'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Instagram Feed Vertical (1080x1350)"
          >
            4:5
          </button>
          <button
            onClick={() => onSelectAspect('1:1')}
            className={`px-2.5 py-1 rounded-lg transition ${
              aspectRatio === '1:1'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Cuadrado (1080x1080)"
          >
            1:1
          </button>
          <button
            onClick={() => onSelectAspect('9:16')}
            className={`px-2.5 py-1 rounded-lg transition ${
              aspectRatio === '9:16'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Story / Reel (1080x1920)"
          >
            9:16
          </button>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-2">
          
          {/* PWA Install Button (When not yet running in standalone) */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 hover:text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl transition shadow-sm"
              title="Instalar como App en Celular o Computadora (PWA)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Instalar App</span>
            </button>
          )}

          {/* Reset Carousel */}
          <button
            onClick={onResetCarousel}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Empezar carrusel nuevo desde cero"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </header>
  );
};
