import React, { useState } from 'react';
import {
  Download,
  Archive,
  FileText,
  Save,
  FolderOpen,
  Check,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Slide, BrandInfo, AspectRatio, CarouselPostMeta } from '../types';
import {
  downloadSlideAsPng,
  downloadAllSlidesAsZip,
  formatAllSlidesForCanva
} from '../utils/exportUtils';
import confetti from 'canvas-confetti';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  currentSlide: Slide;
  brand: BrandInfo;
  aspectRatio: AspectRatio;
  postMeta: CarouselPostMeta;
  brief: string;
  visualStyle: string;
  onLoadProject: (projectData: any) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  slides,
  currentSlide,
  brand,
  aspectRatio,
  postMeta,
  brief,
  visualStyle,
  onLoadProject,
}) => {
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [copiedCanva, setCopiedCanva] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}
  };

  const handleDownloadCurrentPng = async () => {
    setIsExportingPng(true);
    try {
      await downloadSlideAsPng(currentSlide, brand, aspectRatio);
      triggerConfetti();
    } catch (err) {
      console.error(err);
      alert('Error al exportar la imagen de la diapositiva.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadAllSlidesAsZip(slides, brand, aspectRatio, postMeta);
      triggerConfetti();
    } catch (err) {
      console.error(err);
      alert('Error al generar el archivo ZIP del carrusel.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleCopyCanvaText = () => {
    const text = formatAllSlidesForCanva(slides, brand);
    navigator.clipboard.writeText(text);
    setCopiedCanva(true);
    setTimeout(() => setCopiedCanva(false), 2000);
  };

  const handleSaveProjectJson = () => {
    const project = {
      type: 'lavisualmk-carrusel-ia',
      version: 2,
      savedAt: new Date().toISOString(),
      brand,
      aspectRatio,
      brief,
      visualStyle,
      slides,
      postMeta,
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `carrusel_${brand.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleUploadProjectJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onLoadProject(parsed);
        triggerConfetti();
        onClose();
      } catch {
        alert('Archivo de proyecto inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Exportar Carrusel & Formatos
              </h3>
              <p className="text-xs text-slate-400">
                Descarga en alta resolución (2X), paquete ZIP completo o copia para Canva
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3.5">
          
          {/* Action 1: Download Full ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-700/50 rounded-xl transition text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition">
                  Descargar Carrusel Completo (.ZIP)
                </h4>
                <p className="text-xs text-slate-400">
                  {slides.length} diapositivas (PNG HD) + videos MP4 reales + audios MP3 + textos Canva y copy de redes
                </p>
              </div>
            </div>
            {isExportingZip ? (
              <RefreshCw className="w-5 h-5 text-rose-400 animate-spin" />
            ) : (
              <span className="text-xs bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg">
                Descargar ZIP
              </span>
            )}
          </button>

          {/* Action 2: Download Current PNG */}
          <button
            onClick={handleDownloadCurrentPng}
            disabled={isExportingPng}
            className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Descargar Diapositiva Actual #{currentSlide.id} (PNG)
                </h4>
                <p className="text-xs text-slate-400">
                  Formato {aspectRatio} en resolución 2X ultra nítida
                </p>
              </div>
            </div>
            {isExportingPng ? (
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            ) : (
              <span className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg">
                Bajar PNG
              </span>
            )}
          </button>

          {/* Action 3: Copy Formatted Text for Canva */}
          <button
            onClick={handleCopyCanvaText}
            className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Copiar Textos Formateados para Canva
                </h4>
                <p className="text-xs text-slate-400">
                  Estructura lista para pegar directo en plantillas de diseño
                </p>
              </div>
            </div>
            <span className="text-xs bg-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-lg">
              {copiedCanva ? '¡Copiado!' : 'Copiar'}
            </span>
          </button>

          {/* Action 4: Save / Load Project JSON */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={handleSaveProjectJson}
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition"
            >
              <Save className="w-4 h-4 text-rose-400" />
              <span>{copiedJson ? '¡Guardado!' : 'Guardar Proyecto (.JSON)'}</span>
            </button>

            <label className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer">
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              <span>Abrir Proyecto (.JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleUploadProjectJson}
                className="hidden"
              />
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
