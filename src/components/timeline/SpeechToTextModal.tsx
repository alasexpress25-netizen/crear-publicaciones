import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Type,
  Loader2,
  Volume2,
  Wand2,
  Check,
  RefreshCw,
  Music,
  FileAudio,
  Play,
  Square,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SubtitleItem, Slide, VoiceoverTrack, VideoAudioTrack } from '../../types';
import { apiGenerateSubtitlesAI } from '../../services/api';
import { extractSlideAllText, extractAllSlidesText } from '../../utils/slideTextExtractor';

export interface SpeechToTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  totalDuration: number;
  currentSlideIndex?: number;
  audioTrack?: VideoAudioTrack | null;
  voiceoverTrack?: VoiceoverTrack | null;
  onSaveSubtitles: (subtitles: SubtitleItem[]) => void;
  onUpdateVoiceoverTrack?: (track: VoiceoverTrack | null) => void;
}

export const SpeechToTextModal: React.FC<SpeechToTextModalProps> = ({
  isOpen,
  onClose,
  slides,
  totalDuration,
  currentSlideIndex = 0,
  audioTrack,
  voiceoverTrack,
  onSaveSubtitles,
  onUpdateVoiceoverTrack,
}) => {
  // Default to timeline audio if an audio/voiceover track exists on timeline, otherwise frame_ai
  const hasTimelineAudio = Boolean(voiceoverTrack || audioTrack);
  const [activeTab, setActiveTab] = useState<'timeline_audio' | 'frame_ai' | 'mic'>(
    hasTimelineAudio ? 'timeline_audio' : 'frame_ai'
  );

  const [scriptText, setScriptText] = useState<string>('');
  const [stylePreset, setStylePreset] = useState<'hormozi' | 'neon' | 'box' | 'minimal'>('hormozi');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCreatingAudio, setIsCreatingAudio] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Live Speech Recognition (Microphone STT) state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recordedPhrases, setRecordedPhrases] = useState<{ text: string; time: number }[]>([]);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Default to loading text from current slide (or whole carousel)
      const currentSlide = slides[currentSlideIndex] || slides[0];
      const slideText = currentSlide ? extractSlideAllText(currentSlide) : '';
      const allText = extractAllSlidesText(slides);
      setScriptText(slideText || allText || '');
      setRecordedPhrases([]);
      setIsListening(false);
      setIsPlayingPreview(false);

      if (voiceoverTrack || audioTrack) {
        setActiveTab('timeline_audio');
      } else {
        setActiveTab('frame_ai');
      }
    }
  }, [isOpen, slides, currentSlideIndex, voiceoverTrack, audioTrack]);

  // Clean up speech synthesis on close or unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Toggle audio preview of current text
  const handleTogglePreviewSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz (SpeechSynthesis).');
      return;
    }

    if (isPlayingPreview) {
      window.speechSynthesis.cancel();
      setIsPlayingPreview(false);
      return;
    }

    if (!scriptText.trim()) {
      alert('No hay texto para escuchar. Escribe o extrae los textos del fotograma.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith('es') || v.lang.startsWith('ES'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onend = () => setIsPlayingPreview(false);
    utterance.onerror = () => setIsPlayingPreview(false);

    setIsPlayingPreview(true);
    window.speechSynthesis.speak(utterance);
  };

  // 1. Create Audio (Voiceover) from frame texts and add to timeline
  const handleCreateAudioFromText = (withSubtitles: boolean = false) => {
    if (!scriptText.trim()) {
      alert('Por favor introduce o extrae los textos del fotograma primero.');
      return;
    }

    setIsCreatingAudio(true);
    try {
      const currentSlide = slides[currentSlideIndex];
      const trackName = currentSlide?.title
        ? `Locución: ${currentSlide.title.slice(0, 24)}...`
        : `Voz de Fotograma ${currentSlideIndex + 1}`;

      const newVoiceover: VoiceoverTrack = {
        id: `vo-${Date.now()}`,
        name: trackName,
        scriptText: scriptText.trim(),
        language: 'es-ES',
        duration: totalDuration,
        volume: 1,
        rate: 1.05,
        pitch: 1.0,
        isMuted: false,
      };

      if (onUpdateVoiceoverTrack) {
        onUpdateVoiceoverTrack(newVoiceover);
      }

      if (withSubtitles) {
        // Also generate matching synchronized subtitles
        handleGenerateSubtitlesFromText(scriptText);
      } else {
        alert('¡Pista de locución creada con éxito en la línea de tiempo a partir de los textos del fotograma!');
        setActiveTab('timeline_audio');
      }
    } catch (err: any) {
      alert('Error creando el audio: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsCreatingAudio(false);
    }
  };

  // 2. Generate subtitles from text helper
  const handleGenerateSubtitlesFromText = async (textToProcess: string) => {
    if (!textToProcess.trim()) {
      alert('Por favor introduce un texto para subtitular.');
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await apiGenerateSubtitlesAI({
        text: textToProcess,
        totalDuration: totalDuration,
        stylePreset: stylePreset,
      });

      if (Array.isArray(generated) && generated.length > 0) {
        const formatted: SubtitleItem[] = generated.map((item, idx) => ({
          id: item.id || `sub-ai-${Date.now()}-${idx}`,
          text: item.text || '',
          startTime: typeof item.startTime === 'number' ? item.startTime : (idx * (totalDuration / generated.length)),
          endTime: typeof item.endTime === 'number' ? item.endTime : ((idx + 1) * (totalDuration / generated.length)),
          stylePreset: (item.stylePreset as any) || stylePreset,
        }));
        onSaveSubtitles(formatted);
        onClose();
        return;
      }

      // Fallback: rule-based chunking
      applyFallbackSubtitles(textToProcess);
    } catch (err: any) {
      console.warn('AI subtitle generation fallback:', err);
      applyFallbackSubtitles(textToProcess);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyFallbackSubtitles = (textToProcess: string) => {
    const words = textToProcess.split(/\s+/).filter(Boolean);
    const chunkSize = 4;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    const chunkDur = totalDuration / Math.max(1, chunks.length);
    const fallbackSubs: SubtitleItem[] = chunks.map((chunk, idx) => ({
      id: `sub-auto-${Date.now()}-${idx}`,
      text: chunk.toUpperCase(),
      startTime: Number((idx * chunkDur).toFixed(2)),
      endTime: Number(Math.min(totalDuration, (idx + 1) * chunkDur - 0.1).toFixed(2)),
      stylePreset: stylePreset,
    }));

    onSaveSubtitles(fallbackSubs);
    onClose();
  };

  // 3. Create Subtitles from Timeline Audio (Voiceover or AudioTrack)
  const handleGenerateFromTimelineAudio = async () => {
    // If voiceover track exists with scriptText, use that directly
    if (voiceoverTrack?.scriptText?.trim()) {
      await handleGenerateSubtitlesFromText(voiceoverTrack.scriptText);
      return;
    }

    // If audio track has a title or name, or voiceover has a name
    const audioName = voiceoverTrack?.name || audioTrack?.name || 'Música de Fondo';
    const slideTexts = slides
      .map((s) => extractSlideAllText(s))
      .filter(Boolean)
      .join('. ');

    const promptText = slideTexts || `Ritmo de ${audioName}`;
    await handleGenerateSubtitlesFromText(promptText);
  };

  // 4. Live Microphone Recognition
  const handleToggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta Reconocimiento de Voz (Web Speech Recognition). Prueba con Chrome o Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recordingStartTimeRef.current = Date.now();

      recognition.onresult = (event: any) => {
        const currentIdx = event.resultIndex;
        const transcript = event.results[currentIdx][0]?.transcript?.trim();
        if (transcript) {
          const elapsedSec = (Date.now() - recordingStartTimeRef.current) / 1000;
          setRecordedPhrases((prev) => [
            ...prev,
            { text: transcript, time: Math.min(totalDuration, elapsedSec) },
          ]);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err: any) {
      alert('No se pudo iniciar el micrófono: ' + err.message);
      setIsListening(false);
    }
  };

  const handleApplyRecordedSpeech = () => {
    if (recordedPhrases.length === 0) {
      alert('No se ha detectado ninguna frase grabada por micrófono aún.');
      return;
    }

    const newSubs: SubtitleItem[] = [];
    for (let i = 0; i < recordedPhrases.length; i++) {
      const current = recordedPhrases[i];
      const next = recordedPhrases[i + 1];
      const startTime = Math.max(0, current.time - 1.5);
      const endTime = next ? Math.min(totalDuration, next.time - 0.2) : Math.min(totalDuration, startTime + 2.5);

      newSubs.push({
        id: `sub-stt-${Date.now()}-${i}`,
        text: current.text.toUpperCase(),
        startTime: Math.max(0, startTime),
        endTime: Math.max(startTime + 0.8, endTime),
        stylePreset: stylePreset,
      });
    }

    onSaveSubtitles(newSubs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-rose-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Modo IA: Subtítulos & Audio Inteligente
              </h3>
              <p className="text-xs text-slate-400">
                Genera subtítulos desde audio incorporado o crea locuciones desde los textos del fotograma
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isListening && recognitionRef.current) {
                recognitionRef.current.stop();
              }
              if (isPlayingPreview && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Interactive Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('timeline_audio')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'timeline_audio'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>Audio de la Timeline</span>
            {(voiceoverTrack || audioTrack) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('frame_ai')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'frame_ai'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Textos del Fotograma / IA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mic')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'mic'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Dictado en Vivo</span>
          </button>
        </div>

        {/* TAB 1: Timeline Audio Subtitles */}
        {activeTab === 'timeline_audio' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                Pistas de Audio Detectadas en la Línea de Tiempo
              </h4>

              {voiceoverTrack || audioTrack ? (
                <div className="space-y-3">
                  {/* Voiceover Track detected */}
                  {voiceoverTrack && (
                    <div className="p-3.5 bg-slate-900 border border-amber-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-white">{voiceoverTrack.name}</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                            Locución / Voz
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {voiceoverTrack.duration.toFixed(1)}s
                        </span>
                      </div>

                      {voiceoverTrack.scriptText && (
                        <p className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-lg line-clamp-2 border border-slate-800">
                          "{voiceoverTrack.scriptText}"
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleGenerateFromTimelineAudio}
                          disabled={isGenerating}
                          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generando Subtítulos...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Crear Subtítulos de esta Locución</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Background Music Audio Track detected */}
                  {audioTrack && (
                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">{audioTrack.name}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            Música / Audio
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          Vol: {Math.round(audioTrack.volume * 100)}%
                        </span>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleGenerateFromTimelineAudio}
                          disabled={isGenerating}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Generar Subtítulos Rítmicos desde este Audio</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      No hay audio incorporado en la línea de tiempo aún
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Puedes crear una pista de audio (locución) directamente usando los textos colocados en tu fotograma.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('frame_ai')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 transition cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Crear Audio desde Textos del Fotograma</span>
                  </button>
                </div>
              )}
            </div>

            {/* Subtitle Visual Style Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Estilo Visual del Subtítulo (Viral Reels / Shorts):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setStylePreset('hormozi')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    stylePreset === 'hormozi'
                      ? 'bg-amber-950/90 border-amber-400 text-yellow-300 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black uppercase text-yellow-300">Alex Hormozi</span>
                  <span className="text-[9px] text-slate-400">Amarillo + Sombra 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStylePreset('neon')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    stylePreset === 'neon'
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black uppercase text-cyan-300">Neón Glow</span>
                  <span className="text-[9px] text-slate-400">Cian Resplandeciente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStylePreset('box')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    stylePreset === 'box'
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-md ring-1 ring-emerald-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black uppercase text-emerald-300">Caja Opaca</span>
                  <span className="text-[9px] text-slate-400">Fondo Oscuro + Contraste</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStylePreset('minimal')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    stylePreset === 'minimal'
                      ? 'bg-purple-950/90 border-purple-400 text-purple-300 shadow-md ring-1 ring-purple-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black uppercase text-purple-300">Minimalista</span>
                  <span className="text-[9px] text-slate-400">Borde Suave Elegante</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Textos del Fotograma & Crear Audio / Subtítulos */}
        {activeTab === 'frame_ai' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Quick Extraction Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-300">
                Textos colocados en el lienzo / fotograma:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const currentSlide = slides[currentSlideIndex] || slides[0];
                    if (currentSlide) {
                      const text = extractSlideAllText(currentSlide);
                      setScriptText(text);
                    }
                  }}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  title="Extrae títulos, cuerpos, recuadros y textos personalizados del fotograma actual"
                >
                  🖼️ Fotograma Actual ({currentSlideIndex + 1})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = extractAllSlidesText(slides);
                    setScriptText(text);
                  }}
                  className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  title="Extrae todos los textos colocados a lo largo de todo el carrusel"
                >
                  🎞️ Todas las Escenas
                </button>
              </div>
            </div>

            {/* Editable Text Area */}
            <div className="relative">
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={4}
                placeholder="Textos del fotograma listos para convertir en audio o subtítulos sincronizados..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none resize-none leading-relaxed font-medium"
              />

              {/* Audio Listen / Preview button inside textarea */}
              {scriptText.trim() && (
                <div className="absolute right-2.5 bottom-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePreviewSpeech}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer ${
                      isPlayingPreview
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Escuchar cómo suena este texto en voz alta"
                  >
                    {isPlayingPreview ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Detener</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Escuchar Voz</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Audio Creation Action Cards */}
            <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  ¿Deseas crear el Audio (Locución) a partir de estos Textos?
                </span>
                <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md font-bold">
                  Timeline V1/A1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Genera una pista de voz en off sintetizada colocada en la línea de tiempo. También puedes crear tanto el audio como los subtítulos al mismo tiempo.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCreateAudioFromText(false)}
                  disabled={isCreatingAudio || !scriptText.trim()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-slate-700 disabled:opacity-50"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>🎙️ Crear Pista de Audio en Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateAudioFromText(true)}
                  disabled={isCreatingAudio || isGenerating || !scriptText.trim()}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Crear Audio y Subtítulos a la vez</span>
                </button>
              </div>
            </div>

            {/* Subtitle Visual Style Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Estilo Visual para los Subtítulos:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setStylePreset('hormozi')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    stylePreset === 'hormozi'
                      ? 'bg-amber-950/90 border-amber-400 text-yellow-300 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black uppercase text-yellow-300">Alex Hormozi</span>
                  <span className="text-[9px] text-slate-400">Amarillo + Sombra 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStylePreset('neon')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    stylePreset === 'neon'
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black uppercase text-cyan-300">Neón Glow</span>
                  <span className="text-[9px] text-slate-400">Cian Resplandeciente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStylePreset('box')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    stylePreset === 'box'
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-md ring-1 ring-emerald-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black uppercase text-emerald-300">Caja Opaca</span>
                  <span className="text-[9px] text-slate-400">Fondo Oscuro + Contraste</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStylePreset('minimal')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    stylePreset === 'minimal'
                      ? 'bg-purple-950/90 border-purple-400 text-purple-300 shadow-md ring-1 ring-purple-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black uppercase text-purple-300">Minimalista</span>
                  <span className="text-[9px] text-slate-400">Borde Suave Elegante</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Dictado en Vivo con Micrófono */}
        {activeTab === 'mic' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="text-center py-6 space-y-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={handleToggleListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition shadow-2xl cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-4 ring-amber-500/10'
                }`}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              <div>
                <p className="text-sm font-bold text-white">
                  {isListening ? 'Escuchando tu voz en vivo...' : 'Toca el micrófono y empieza a hablar'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  El audio de tu micrófono se convertirá en subtítulos sincronizados automáticamente.
                </p>
              </div>
            </div>

            {recordedPhrases.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Frases detectadas ({recordedPhrases.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecordedPhrases([])}
                    className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Borrar todas
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {recordedPhrases.map((phrase, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                    >
                      <span className="font-medium truncate pr-2">"{phrase.text}"</span>
                      <span className="text-[10px] font-mono text-amber-400 shrink-0 bg-slate-950 px-1.5 py-0.5 rounded">
                        +{phrase.time.toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>

          {activeTab === 'timeline_audio' && (
            <button
              type="button"
              onClick={handleGenerateFromTimelineAudio}
              disabled={isGenerating || (!voiceoverTrack && !audioTrack)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Subtítulos desde Audio</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'frame_ai' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerateSubtitlesFromText(scriptText)}
                disabled={isGenerating || !scriptText.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando Subtítulos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar solo Subtítulos</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'mic' && (
            <button
              type="button"
              onClick={handleApplyRecordedSpeech}
              disabled={recordedPhrases.length === 0}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar {recordedPhrases.length} Subtítulos Dictados</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
