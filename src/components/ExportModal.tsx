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
  captureSlideDomToBlob,
  getExportFilePrefix,
  renderSlideToCanvas,
  formatAllSlidesForCanva
} from '../utils/exportUtils';
import { safeAlert } from '../utils/notifications';
import { CanvasSlide } from './CanvasSlide';
import JSZip from 'jszip';
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
  const [exportProgress, setExportProgress] = useState<string>('');
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
      // Find rendered slide container for 100% WYSIWYG match
      const targetDom =
        document.getElementById(`export-dom-slide-${currentSlide.id}`) ||
        document.getElementById('active-canvas-slide-container');

      let blob: Blob | null = null;
      if (targetDom) {
        blob = await captureSlideDomToBlob(targetDom, 2.5);
      } else {
        const canvas = await renderSlideToCanvas(currentSlide, brand, aspectRatio, 2);
        blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      }

      if (!blob) throw new Error('No se pudo generar la imagen');

      const prefix = getExportFilePrefix(brand.name);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${prefix}_slide_${currentSlide.id}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      triggerConfetti();
    } catch (err) {
      console.error(err);
      safeAlert('Error al exportar la imagen de la diapositiva.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    setExportProgress('Iniciando empaquetado...');
    try {
      const zip = new JSZip();
      const prefix = getExportFilePrefix(brand.name);

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        setExportProgress(`Renderizando diapositiva ${i + 1} de ${slides.length}...`);

        const domEl = document.getElementById(`export-dom-slide-${s.id}`);
        let slideBlob: Blob | null = null;

        if (domEl) {
          slideBlob = await captureSlideDomToBlob(domEl, 2.5).catch(() => null);
        }

        if (!slideBlob) {
          const canvas = await renderSlideToCanvas(s, brand, aspectRatio, 2);
          slideBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
        }

        if (slideBlob) {
          zip.file(`${prefix}_slide_${i + 1}.png`, slideBlob);
        }

        // Add media if present
        if (s.mediaType === 'video' && s.image) {
          try {
            const resp = await fetch(s.image);
            if (resp.ok) {
              const videoBlob = await resp.blob();
              zip.file(`${prefix}_slide_${i + 1}_video.mp4`, videoBlob);
            }
          } catch {}
        }
      }

      // Add Canva-formatted texts
      setExportProgress('Agregando textos estructurados...');
      const canvaText = formatAllSlidesForCanva(slides, brand);
      zip.file(`${prefix}_textos_canva.txt`, canvaText);

      // Add background music audio file if present
      const slideWithMusic = slides.find((s) => s.includeMusic && s.musicUrl) || slides.find((s) => s.musicUrl);
      if (slideWithMusic && slideWithMusic.musicUrl) {
        setExportProgress('Empaquetando pista de audio MP3...');
        try {
          let audioBlob: Blob | null = null;
          if (slideWithMusic.musicUrl.startsWith('data:')) {
            const res = await fetch(slideWithMusic.musicUrl);
            audioBlob = await res.blob();
          } else {
            const res = await fetch(slideWithMusic.musicUrl, { mode: 'cors' });
            if (res.ok) {
              audioBlob = await res.blob();
            }
          }

          if (audioBlob) {
            const cleanAudioName = slideWithMusic.musicName
              ? slideWithMusic.musicName.replace(/[^\w.-]/g, '_')
              : 'audio_fondo.mp3';
            const audioFileName = cleanAudioName.endsWith('.mp3') || cleanAudioName.endsWith('.m4a') || cleanAudioName.endsWith('.wav')
              ? `${prefix}_${cleanAudioName}`
              : `${prefix}_${cleanAudioName}.mp3`;
            zip.file(audioFileName, audioBlob);
          }
        } catch (audioErr) {
          console.warn('No se pudo empaquetar el audio en el ZIP:', audioErr);
        }
      }

      // Add Instagram / social post caption
      if (postMeta && postMeta.caption) {
        let postContent = `${postMeta.caption}\n\n`;
        if (postMeta.hashtags && postMeta.hashtags.length > 0) {
          postContent += postMeta.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ');
        }
        zip.file(`${prefix}_copy_redes.txt`, postContent);
      }

      setExportProgress('Comprimiendo archivo ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `${prefix}_carrusel_completo.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);

      triggerConfetti();
    } catch (err) {
      console.error(err);
      safeAlert('Error al generar el archivo ZIP del carrusel.');
    } finally {
      setIsExportingZip(false);
      setExportProgress('');
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
        safeAlert('Archivo de proyecto inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      {/* Hidden Offscreen DOM slides container for 100% WYSIWYG direct export */}
      <div
        aria-hidden="true"
        className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-100 flex flex-col gap-10"
        style={{
          width: aspectRatio === '9:16' ? '370px' : aspectRatio === '16:9' ? '550px' : '450px',
        }}
      >
        {slides.map((s) => (
          <div
            key={s.id}
            id={`export-dom-slide-${s.id}`}
            style={{
              width: aspectRatio === '9:16' ? '370px' : aspectRatio === '16:9' ? '550px' : '450px',
            }}
          >
            <CanvasSlide
              slide={s}
              brand={brand}
              aspectRatio={aspectRatio}
              zoomLevel={1}
              activeElementKey={null}
              onSelectElement={() => {}}
              onUpdateField={() => {}}
              onUpdateBullet={() => {}}
              onUpdateBrand={() => {}}
              isExportMode={true}
            />
          </div>
        ))}
      </div>

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
                Descarga en alta fidelidad 1:1, paquete ZIP completo o copia para Canva
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
                  {slides.length} diapositivas (PNG HD) + videos MP4 + audios MP3 + textos Canva y copy de redes
                </p>
                {exportProgress && isExportingZip && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 animate-pulse">
                    {exportProgress}
                  </p>
                )}
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
                  Formato {aspectRatio} con 100% de fidelidad de sombras, posición y estilos
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
