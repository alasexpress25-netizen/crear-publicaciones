import React, { useState } from 'react';
import { Share2, Copy, Check, Hash, MessageSquare, X, Sparkles } from 'lucide-react';
import { CarouselPostMeta } from '../types';

interface PostCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  postMeta: CarouselPostMeta;
  onUpdatePostMeta: (meta: CarouselPostMeta) => void;
}

export const PostCaptionModal: React.FC<PostCaptionModalProps> = ({
  isOpen,
  onClose,
  postMeta,
  onUpdatePostMeta,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const caption = postMeta.caption || '';
  const hashtagsString = (postMeta.hashtags || []).map((h) => `#${h.replace(/^#/, '')}`).join(' ');

  const fullCopyText = [caption, hashtagsString].filter(Boolean).join('\n\n');

  const handleCopy = () => {
    if (!fullCopyText.trim()) return;
    navigator.clipboard.writeText(fullCopyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Texto del Post & Hashtags para Redes Sociales
              </h3>
              <p className="text-xs text-slate-400">
                Redactado con ganchos de lectura y llamado a la acción para Instagram, LinkedIn o Facebook
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
        <div className="p-6 space-y-4">
          
          {/* Caption textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>Descripción del Post (Caption):</span>
            </label>
            <textarea
              rows={8}
              value={caption}
              onChange={(e) => onUpdatePostMeta({ ...postMeta, caption: e.target.value })}
              placeholder="El texto persuasivo generado para el post aparecerá aquí..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
            />
          </div>

          {/* Hashtags input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-rose-400" />
              <span>Hashtags Estratégicos del Nicho:</span>
            </label>
            <input
              type="text"
              value={hashtagsString}
              onChange={(e) => {
                const tags = e.target.value
                  .split(' ')
                  .map((t) => t.trim().replace(/^#/, ''))
                  .filter(Boolean);
                onUpdatePostMeta({ ...postMeta, hashtags: tags });
              }}
              placeholder="#marketing #negocios #ventasonline..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-rose-300 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {caption ? `${caption.length} caracteres` : 'Listo para copiar'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Todo el Post</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
