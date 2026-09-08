import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Volume2, Play, Square, Sparkles, Upload, Music, Loader2, Check, Wand2, Type, Circle } from 'lucide-react';
import { VoiceoverTrack, Slide, SubtitleItem } from '../../types';
import { apiOptimizeVoiceoverScript, apiSynthesizeVoiceover } from '../../services/api';
import { extractSlideAllText, extractAllSlidesText } from '../../utils/slideTextExtractor';

interface TtsVoiceoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  totalDuration: number;
  currentVoiceoverTrack: VoiceoverTrack | null;
  currentSlideIndex?: number;
  subtitles?: SubtitleItem[];
  onSaveVoiceoverTrack: (track: VoiceoverTrack | null) => void;
  onSaveSubtitles?: (subtitles: SubtitleItem[]) => void;
}

export const TtsVoiceoverModal: React.FC<TtsVoiceoverModalProps> = ({
  isOpen,
  onClose,
  slides,
  totalDuration,
  currentVoiceoverTrack,
  currentSlideIndex = 0,
  subtitles = [],
  onSaveVoiceoverTrack,
  onSaveSubtitles,
}) => {
  const [scriptText, setScriptText] = useState<string>(currentVoiceoverTrack?.scriptText || '');
  const [voiceName, setVoiceName] = useState<string>(currentVoiceoverTrack?.voiceName || 'Kore');
  const [language, setLanguage] = useState<string>(currentVoiceoverTrack?.language || 'es-ES');
  const [rate, setRate] = useState<number>(currentVoiceoverTrack?.rate || 1.05);
  const [pitch, setPitch] = useState<number>(currentVoiceoverTrack?.pitch || 1.0);
  const [volume, setVolume] = useState<number>(currentVoiceoverTrack?.volume ?? 1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioFileUrl, setAudioFileUrl] = useState<string>(currentVoiceoverTrack?.audioUrl || '');
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [isOptimizingScript, setIsOptimizingScript] = useState<boolean>(false);
  const [generateSubtitlesAlso, setGenerateSubtitlesAlso] = useState<boolean>(true);

  // Gemini Studio AI voice state
  const [voiceEngine, setVoiceEngine] = useState<'gemini' | 'browser'>('gemini');
  const [geminiVoice, setGeminiVoice] = useState<string>(
    currentVoiceoverTrack?.voiceName && ['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'].includes(currentVoiceoverTrack.voiceName)
      ? currentVoiceoverTrack.voiceName
      : 'Kore'
  );
  const [isGeneratingAiVoice, setIsGeneratingAiVoice] = useState<boolean>(false);
  const [aiGeneratedInfo, setAiGeneratedInfo] = useState<{ duration: number; voiceName: string } | null>(
    currentVoiceoverTrack?.audioUrl && !currentVoiceoverTrack.audioUrl.startsWith('voiceover://')
      ? { duration: currentVoiceoverTrack.duration, voiceName: currentVoiceoverTrack.voiceName || 'Kore' }
      : null
  );
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState<boolean>(false);
  const audioPreviewPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Live microphone recording
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [micSeconds, setMicSeconds] = useState<number>(0);
  const micMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micTimerRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
          const esVoice = v.find((voice) => voice.lang.startsWith('es') || voice.lang.startsWith('ES'));
          if (esVoice && !selectedVoiceURI) {
            setSelectedVoiceURI(esVoice.voiceURI);
            setVoiceName(esVoice.name);
          }
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (isOpen && !scriptText) {
      // Auto-extract script from current carousel slides text
      const extracted = slides
        .map((s, idx) => {
          const title = s.title ? s.title.trim() : '';
          const body = s.body ? s.body.trim() : '';
          return `${title ? title + '.' : ''} ${body}`.trim();
        })
        .filter(Boolean)
        .join(' \n');
      setScriptText(extracted);
    }
  }, [isOpen, slides]);

  useEffect(() => {
    return () => {
      if (micTimerRef.current) clearInterval(micTimerRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioPreviewPlayerRef.current) {
        try {
          audioPreviewPlayerRef.current.pause();
        } catch {}
      }
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setAudioFileUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyFromCurrentSlide = () => {
    const cur = slides[currentSlideIndex] || slides[0];
    if (cur) {
      const text = extractSlideAllText(cur);
      setScriptText(text);
    }
  };

  const handleCopyFromSlides = () => {
    const text = extractAllSlidesText(slides);
    setScriptText(text);
  };

  const handleCopyFromSubtitles = () => {
    if (subtitles && subtitles.length > 0) {
      const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
      const text = sorted.map((s) => s.text.trim()).filter(Boolean).join('. ');
      setScriptText(text);
    }
  };

  const handleOptimizeWithAI = async () => {
    if (!scriptText.trim()) {
      alert('Por favor escribe o copia primero el texto a optimizar.');
      return;
    }
    try {
      setIsOptimizingScript(true);
      const optimized = await apiOptimizeVoiceoverScript({
        script: scriptText,
        language: language,
        tone: 'energético, claro y persuasivo para video corto',
      });
      if (optimized) {
        setScriptText(optimized);
      }
    } catch (err: any) {
      alert(err.message || 'Error al optimizar guión');
    } finally {
      setIsOptimizingScript(false);
    }
  };

  const startMicRecording = async () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      micMediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioFileUrl(url);
        setAudioFileName(`Grabación de voz (${Math.max(1, micSeconds)}s)`);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecordingMic(true);
      setMicSeconds(0);
      micTimerRef.current = setInterval(() => {
        setMicSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('No se pudo acceder al micrófono. Por favor permite el acceso al micrófono en el navegador.');
    }
  };

  const stopMicRecording = () => {
    if (micMediaRecorderRef.current && micMediaRecorderRef.current.state !== 'inactive') {
      micMediaRecorderRef.current.stop();
    }
    if (micTimerRef.current) {
      clearInterval(micTimerRef.current);
    }
    setIsRecordingMic(false);
  };

  const playAudioFile = (url: string) => {
    if (audioPreviewPlayerRef.current) {
      audioPreviewPlayerRef.current.pause();
      audioPreviewPlayerRef.current = null;
    }
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.playbackRate = rate;
      audioPreviewPlayerRef.current = audio;
      setIsPlayingAudioPreview(true);

      audio.onended = () => {
        setIsPlayingAudioPreview(false);
      };
      audio.onerror = () => {
        setIsPlayingAudioPreview(false);
      };
      audio.play().catch(() => {
        setIsPlayingAudioPreview(false);
      });
    } catch {
      setIsPlayingAudioPreview(false);
    }
  };

  const stopAudioPreview = () => {
    if (audioPreviewPlayerRef.current) {
      try {
        audioPreviewPlayerRef.current.pause();
      } catch {}
      audioPreviewPlayerRef.current = null;
    }
    setIsPlayingAudioPreview(false);
  };

  const handleGenerateAiAudio = async (autoPlay: boolean = false): Promise<string | null> => {
    if (!scriptText.trim()) {
      alert('Por favor introduce o extrae un guión antes de generar la locución con IA.');
      return null;
    }

    stopAudioPreview();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    setIsGeneratingAiVoice(true);
    try {
      const res = await apiSynthesizeVoiceover({
        text: scriptText.trim(),
        voiceName: geminiVoice,
        language: language,
      });

      if (res && res.audioUrl) {
        setAudioFileUrl(res.audioUrl);
        setAudioFileName(`Locución IA - ${res.voiceName} (${res.duration}s)`);
        setAiGeneratedInfo({
          duration: res.duration,
          voiceName: res.voiceName,
        });

        if (autoPlay) {
          playAudioFile(res.audioUrl);
        }
        return res.audioUrl;
      }
      return null;
    } catch (err: any) {
      console.error('Error generating AI voiceover:', err);
      alert(err.message || 'Error al sintetizar locución de IA. Comprueba tu conexión.');
      return null;
    } finally {
      setIsGeneratingAiVoice(false);
    }
  };

  const handleTestSpeech = async () => {
    if (isPlayingAudioPreview) {
      stopAudioPreview();
      return;
    }
    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (!scriptText.trim()) {
      alert('Por favor ingresa un guión de texto a pronunciar');
      return;
    }

    // If an audio file or AI synthesis is already generated/uploaded, play it directly
    if (audioFileUrl && !audioFileUrl.startsWith('voiceover://')) {
      playAudioFile(audioFileUrl);
      return;
    }

    // If using Gemini AI Studio voice and not generated yet, synthesize and play
    if (voiceEngine === 'gemini') {
      await handleGenerateAiAudio(true);
      return;
    }

    // Browser Web Speech API fallback
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz Web Speech API');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (selectedVoiceURI) {
      const foundVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (foundVoice) {
        utterance.voice = foundVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSave = async () => {
    stopAudioPreview();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    let finalAudioUrl = audioFileUrl;
    let finalDuration = totalDuration;

    // Auto-generate AI audio if using Gemini engine and haven't generated yet
    if (voiceEngine === 'gemini' && (!finalAudioUrl || finalAudioUrl === 'voiceover://tts') && scriptText.trim()) {
      setIsGeneratingAiVoice(true);
      try {
        const res = await apiSynthesizeVoiceover({
          text: scriptText.trim(),
          voiceName: geminiVoice,
          language: language,
        });
        if (res && res.audioUrl) {
          finalAudioUrl = res.audioUrl;
          finalDuration = res.duration || totalDuration;
        }
      } catch (e) {
        console.warn('Fallback voiceover synthesis on save:', e);
      } finally {
        setIsGeneratingAiVoice(false);
      }
    }

    // Synthesize audio tone or save voiceover track configuration
    const trackToSave: VoiceoverTrack = {
      id: currentVoiceoverTrack?.id || `vo-${Date.now()}`,
      audioUrl: finalAudioUrl || 'voiceover://tts',
      name: audioFileName || (voiceEngine === 'gemini' ? `Locución IA: ${geminiVoice}` : `Voz Sistema (${language})`),
      scriptText: scriptText,
      language: language,
      voiceName: voiceEngine === 'gemini' ? geminiVoice : voiceName,
      duration: aiGeneratedInfo?.duration || finalDuration,
      volume: volume,
      rate: rate,
      pitch: pitch,
      isMuted: false,
    };

    onSaveVoiceoverTrack(trackToSave);

    if (generateSubtitlesAlso && onSaveSubtitles && scriptText.trim()) {
      const words = scriptText.split(/\s+/).filter(Boolean);
      const chunkSize = 4;
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
      }
      const dur = aiGeneratedInfo?.duration || finalDuration;
      const chunkDur = dur / Math.max(1, chunks.length);
      const newSubs: SubtitleItem[] = chunks.map((chunk, idx) => ({
        id: `sub-tts-${Date.now()}-${idx}`,
        text: chunk.toUpperCase(),
        startTime: Number((idx * chunkDur).toFixed(2)),
        endTime: Number(Math.min(dur, (idx + 1) * chunkDur - 0.1).toFixed(2)),
        stylePreset: 'hormozi',
      }));
      onSaveSubtitles(newSubs);
    }

    onClose();
  };

  const handleRemoveTrack = () => {
    stopAudioPreview();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onSaveVoiceoverTrack(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Pista de Locución & Voz en Off (Texto a Voz / TTS)
              </h3>
              <p className="text-xs text-slate-400">
                Añade una voz que narre el contenido del video con síntesis inteligente o archivo de audio
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Script Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs font-semibold text-slate-300">
                Guión de la Narración (Texto a Voz):
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyFromCurrentSlide}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/70 border border-amber-800/50 px-2 py-0.5 rounded-lg transition cursor-pointer"
                  title="Extrae todos los textos del fotograma actual (títulos, textos, recuadros colocados en el lienzo)"
                >
                  🖼️ Fotograma Actual ({currentSlideIndex + 1})
                </button>
                <button
                  type="button"
                  onClick={handleCopyFromSlides}
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-lg transition cursor-pointer"
                  title="Extrae los textos colocados a lo largo de todas las escenas"
                >
                  🎞️ Todas las Escenas
                </button>
                {subtitles && subtitles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyFromSubtitles}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Cargar y leer el texto exacto de los subtítulos generados"
                  >
                    <span>💬 Subtítulos ({subtitles.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOptimizeWithAI}
                  disabled={isOptimizingScript}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Optimizar el guión con IA para que suene dinámico y natural al leerse"
                >
                  {isOptimizingScript ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  <span>Optimizar con IA</span>
                </button>
              </div>
            </div>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={4}
              placeholder="Introduce aquí el guión que la voz en off leerá a lo largo del video..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none leading-relaxed font-medium"
            />
          </div>

          {/* Voice Engine Tabs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setVoiceEngine('gemini')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  voiceEngine === 'gemini'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Voces IA de Estudio (Gemini TTS)</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full font-mono">Previa + Render</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceEngine('browser')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  voiceEngine === 'browser'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Voz del Navegador</span>
              </button>
            </div>

            {voiceEngine === 'gemini' ? (
              <div className="p-3.5 bg-gradient-to-br from-purple-950/40 via-slate-950 to-indigo-950/30 border border-purple-800/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Selecciona una Voz Neuronal de IA:
                  </span>
                  <span className="text-[10px] text-purple-300 font-medium">
                    Audio real exportable en el video
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'Kore', name: 'Kore', gender: 'Femenina', style: 'Cálida y Profesional' },
                    { id: 'Fenrir', name: 'Fenrir', gender: 'Masculina', style: 'Firme y Enérgica' },
                    { id: 'Puck', name: 'Puck', gender: 'Joven', style: 'Dinámica y Fresca' },
                    { id: 'Charon', name: 'Charon', gender: 'Formal', style: 'Profunda y Calma' },
                    { id: 'Zephyr', name: 'Zephyr', gender: 'Suave', style: 'Cercana y Amable' },
                  ].map((v) => {
                    const isSelected = geminiVoice === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setGeminiVoice(v.id);
                          setVoiceName(v.id);
                        }}
                        className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm ring-1 ring-purple-400'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{v.name}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                            v.gender === 'Femenina' ? 'bg-pink-950/70 text-pink-300' : 'bg-blue-950/70 text-blue-300'
                          }`}>
                            {v.gender}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                          {v.style}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Synthesis trigger and status banner */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateAiAudio(true)}
                    disabled={isGeneratingAiVoice || !scriptText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAiVoice ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>
                      {isGeneratingAiVoice
                        ? 'Sintetizando locución con IA...'
                        : audioFileUrl && !audioFileUrl.startsWith('voiceover://')
                        ? '⚡ Volver a Generar con IA'
                        : '⚡ Generar Audio con IA (Estudio)'}
                    </span>
                  </button>

                  {audioFileUrl && !audioFileUrl.startsWith('voiceover://') && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1.5 rounded-xl">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">
                        Audio generado ({aiGeneratedInfo?.duration || totalDuration}s) — Activo en Previa y Render
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Voice Browser Selector */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Idioma de Locución:
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="es-ES">Español (España / Neutro)</option>
                    <option value="es-MX">Español (México / Latam)</option>
                    <option value="en-US">English (US)</option>
                    <option value="pt-BR">Português (Brasil)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Voz del Sistema (Navegador):
                  </label>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => {
                      setSelectedVoiceURI(e.target.value);
                      const v = availableVoices.find((item) => item.voiceURI === e.target.value);
                      if (v) setVoiceName(v.name);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    {availableVoices.length > 0 ? (
                      availableVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))
                    ) : (
                      <option value="default">Voz por Defecto del Navegador</option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Sliders: Rate, Pitch, Volume */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Velocidad</span>
                <span className="text-purple-400 font-mono">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Tono</span>
                <span className="text-purple-400 font-mono">{pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Volumen</span>
                <span className="text-purple-400 font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5"
              />
            </div>
          </div>

          {/* Test Speech Button & Custom Audio Upload & Mic Recording Options */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTestSpeech}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                isSpeaking || isPlayingAudioPreview
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-purple-500/30'
              }`}
            >
              {isSpeaking || isPlayingAudioPreview ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSpeaking || isPlayingAudioPreview ? 'Detener Prueba' : 'Probar Locución (Audio)'}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Mic Recording Button */}
              <button
                type="button"
                onClick={isRecordingMic ? stopMicRecording : startMicRecording}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isRecordingMic
                    ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/40'
                    : 'bg-rose-950/70 hover:bg-rose-900 border-rose-800/60 text-rose-300'
                }`}
                title="Graba tu propia voz en directo desde tu micrófono"
              >
                <Circle className={`w-3 h-3 ${isRecordingMic ? 'fill-white' : 'fill-rose-500 text-rose-500'}`} />
                <span>{isRecordingMic ? `Grabando... (${micSeconds}s) [Parar]` : '🎙️ Grabar Voz'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-950 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Sube tu propia grabación de voz en MP3 o WAV"
              >
                <Upload className="w-3 h-3 text-purple-400" />
                <span>{audioFileName ? 'Cambiar Audio' : 'Subir Grabación'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {audioFileName && (
            <div className="p-2.5 bg-purple-950/40 border border-purple-800/50 rounded-xl flex items-center justify-between text-xs text-purple-200">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">{audioFileName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAudioFileName(null);
                  setAudioFileUrl('');
                }}
                className="text-[10px] text-rose-400 hover:underline"
              >
                Quitar archivo
              </button>
            </div>
          )}
          {/* Auto-generate Subtitles Synchronized Toggle */}
          <div className="p-3 bg-purple-950/30 border border-purple-900/50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs font-bold text-white">Generar Subtítulos Sincronizados</p>
                <p className="text-[10px] text-slate-400">Crea subtítulos automáticos en la pista de subtítulos con el texto de la locución</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={generateSubtitlesAlso}
                onChange={(e) => setGenerateSubtitlesAlso(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            {currentVoiceoverTrack && (
              <button
                type="button"
                onClick={handleRemoveTrack}
                className="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/50 text-xs font-semibold transition"
              >
                Eliminar Locución
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Locución</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
