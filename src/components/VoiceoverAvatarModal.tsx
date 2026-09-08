import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Sparkles,
  Upload,
  Sliders,
  Check,
  Play,
  Pause,
  Volume2,
  Mic,
  Palette,
  Eye,
  EyeOff,
  Wand2,
  Loader2,
  Radio,
  FileText,
  AudioLines,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Smile,
} from 'lucide-react';
import {
  VoiceoverAvatar,
  AvatarPosition,
  AvatarShape,
  Slide,
} from '../types';
import {
  AVATAR_PRESETS,
  DEFAULT_VOICEOVER_AVATAR,
  AvatarPresetItem,
} from '../data/avatarPresets';
import {
  apiGenerateAiAvatar,
  apiGenerateAvatarScript,
  apiSynthesizeVoiceover,
} from '../services/api';
import { extractAllSlidesText } from '../utils/slideTextExtractor';
import { VoiceoverAvatarBadge } from './VoiceoverAvatarBadge';

interface VoiceoverAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: VoiceoverAvatar | null;
  slides: Slide[];
  language?: 'es' | 'pt' | 'en' | string;
  onSaveAvatar: (avatar: VoiceoverAvatar | null) => void;
  onSelectRecommendedVoice?: (voiceName: string) => void;
  onApplyVoiceoverTrack?: (track: { audioUrl: string; name: string; duration: number; script?: string }) => void;
}

export const VoiceoverAvatarModal: React.FC<VoiceoverAvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  slides,
  language,
  onSaveAvatar,
  onSelectRecommendedVoice,
  onApplyVoiceoverTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'ai_generate' | 'script_voice' | 'settings' | 'custom'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Language auto-detection
  const isPortugueseText = (txt: string) => {
    if (!txt) return false;
    return /[ãõçê]/i.test(txt) || /\b(você|voces|vocês|não|está|estão|são|para|com|trabalho|serviço|servicos|clientes|negócio|negocio|estratégia|estrategia|então|entao|também|tambem|mais|como|fazer|conteúdo|conteudo|atenção|atencao|porque|por que|isso|este|esta|muito|muita|neste|nesta|pode|podem|sua|seu|seus|suas|nosso|nossa|ações|acoes|solução|solucao|aprenda|clique|arraste|salve|comente|seja|olá|ola|aqui|temos|quando|onde|qual|tudo|agora)\b/i.test(txt);
  };

  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    if (language === 'pt' || language === 'pt-BR') return 'pt-BR';
    if (language === 'en' || language === 'en-US') return 'en-US';
    const allSlides = extractAllSlidesText(slides);
    if (isPortugueseText(allSlides)) return 'pt-BR';
    return 'es-ES';
  });

  // Working Avatar State
  const [avatar, setAvatar] = useState<VoiceoverAvatar>(
    currentAvatar || DEFAULT_VOICEOVER_AVATAR
  );
  const [isEnabled, setIsEnabled] = useState<boolean>(
    currentAvatar ? currentAvatar.enabled : true
  );

  // AI Avatar Generator Form
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiStyle, setAiStyle] = useState<string>('fotorrealista de estudio');
  const [aiRole, setAiRole] = useState<string>('Presentador');
  const [aiAttire, setAiAttire] = useState<string>('Traje ejecutivo formal');
  const [aiLighting, setAiLighting] = useState<string>('Iluminación de estudio softbox');
  const [aiName, setAiName] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Script & Voice Generator
  const [scriptText, setScriptText] = useState<string>(avatar.script || '');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState<boolean>(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewAudioDuration, setPreviewAudioDuration] = useState<number>(0);
  const [scriptSuccessMessage, setScriptSuccessMessage] = useState<string | null>(null);

  // Custom Upload / URL
  const [customUrl, setCustomUrl] = useState<string>('');

  // Interactive Live Sandbox State
  const [isTestSpeaking, setIsTestSpeaking] = useState<boolean>(true);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AvatarPresetItem) => {
    setAvatar((prev) => ({
      ...prev,
      enabled: true,
      avatarId: preset.id,
      name: preset.name,
      role: preset.role,
      imageUrl: preset.imageUrl,
      avatarType: preset.avatarType || (preset.videoUrl ? 'video' : 'image'),
      videoUrl: preset.videoUrl,
      borderGlowColor: preset.styleColor || prev.borderGlowColor,
      mouthPositionPercent: preset.mouthPositionPercent ?? 68,
      script: preset.sampleScript || prev.script,
      enableJawMotion: true,
      enableBreathing: true,
      renderQuality: 'ultra_real',
    }));
    setIsEnabled(true);
    if (preset.sampleScript && !scriptText) {
      setScriptText(preset.sampleScript);
    }
    if (preset.recommendedVoice) {
      setSelectedVoice(preset.recommendedVoice);
      onSelectRecommendedVoice?.(preset.recommendedVoice);
    }
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Ingresa una descripción del avatar (ej. "Médico cardiólogo con bata blanca").');
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const compositePrompt = `${aiPrompt}. Atuendo: ${aiAttire}. Iluminación: ${aiLighting}`;
      const res = await apiGenerateAiAvatar({
        prompt: compositePrompt,
        style: aiStyle,
        role: aiRole || 'Presentador',
        name: aiName || 'Locutor IA',
      });

      if (res && res.imageUrl) {
        setAvatar((prev) => ({
          ...prev,
          enabled: true,
          avatarId: `ai-${Date.now()}`,
          name: res.name || aiName || 'Locutor IA',
          role: res.role || aiRole || 'Presentador',
          imageUrl: res.imageUrl,
        }));
        setIsEnabled(true);

        if (res.suggestedVoice) {
          setSelectedVoice(res.suggestedVoice);
          onSelectRecommendedVoice?.(res.suggestedVoice);
        }

        setActiveTab('settings');
      }
    } catch (err: any) {
      console.error('Error generating AI avatar:', err);
      setAiError(err.message || 'No se pudo generar el avatar con IA. Intenta con otra descripción.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGenerateScriptWithAi = async () => {
    setIsGeneratingScript(true);
    setScriptSuccessMessage(null);
    try {
      const allSlidesText = extractAllSlidesText(slides);
      const isPt = selectedLanguage.startsWith('pt') || isPortugueseText(allSlidesText);
      const effectiveLang = isPt ? 'pt-BR' : selectedLanguage.startsWith('en') ? 'en-US' : 'es-ES';

      const res = await apiGenerateAvatarScript({
        slides,
        presenterName: avatar.name || 'Elena',
        presenterRole: avatar.role || 'Presentadora',
        tone: 'dinámico, claro y persuasivo',
        language: effectiveLang,
      });

      if (res && res.script) {
        setScriptText(res.script);
        setAvatar((prev) => ({ ...prev, script: res.script }));
        setScriptSuccessMessage(
          effectiveLang.startsWith('pt')
            ? '¡Roteiro gerado com sucesso em Português adaptado às diapositivas!'
            : '¡Guión generado con éxito adaptado a las diapositivas!'
        );
      }
    } catch (err: any) {
      console.error('Error generating script with AI:', err);
      setScriptSuccessMessage('No se pudo generar el guión. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleSynthesizeAndPreviewVoice = async () => {
    if (!scriptText.trim()) return;

    setIsSynthesizingVoice(true);
    try {
      const isPt = selectedLanguage.startsWith('pt') || isPortugueseText(scriptText);
      const effectiveLang = isPt ? 'pt-BR' : selectedLanguage.startsWith('en') ? 'en-US' : 'es-ES';

      const res = await apiSynthesizeVoiceover({
        text: scriptText,
        voice: selectedVoice,
        language: effectiveLang,
      });

      if (res && res.audioUrl) {
        setPreviewAudioUrl(res.audioUrl);
        setPreviewAudioDuration(res.duration || 15);

        // Play audio directly and trigger lip-sync
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = res.audioUrl;
          audioPlayerRef.current.play().catch(console.warn);
          setIsTestSpeaking(true);
        }
      }
    } catch (err: any) {
      console.error('Error synthesizing voice:', err);
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  const handleApplyAsVoiceoverTrack = () => {
    if (!previewAudioUrl && !scriptText) return;
    if (onApplyVoiceoverTrack) {
      onApplyVoiceoverTrack({
        audioUrl: previewAudioUrl || '',
        name: `Locución ${avatar.name} (${selectedVoice})`,
        duration: previewAudioDuration || 20,
        script: scriptText,
      });
      setScriptSuccessMessage('¡Pista de voz sincronizada como Canal A2 en la línea de tiempo!');
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setAvatar((prev) => ({
          ...prev,
          enabled: true,
          avatarId: `upload-${Date.now()}`,
          imageUrl: dataUrl,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 20),
        }));
        setIsEnabled(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setAvatar((prev) => ({
      ...prev,
      enabled: true,
      avatarId: `url-${Date.now()}`,
      imageUrl: customUrl.trim(),
    }));
    setIsEnabled(true);
  };

  const handleToggleHideOnSlide = (slideIdx: number) => {
    const currentHidden = avatar.hideOnSlides || [];
    if (currentHidden.includes(slideIdx)) {
      setAvatar((prev) => ({
        ...prev,
        hideOnSlides: currentHidden.filter((i) => i !== slideIdx),
      }));
    } else {
      setAvatar((prev) => ({
        ...prev,
        hideOnSlides: [...currentHidden, slideIdx],
      }));
    }
  };

  const handleSave = () => {
    if (!isEnabled) {
      onSaveAvatar(null);
    } else {
      onSaveAvatar({
        ...avatar,
        script: scriptText,
        enabled: true,
      });
    }
    onClose();
  };

  const filteredPresets = AVATAR_PRESETS.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const COLOR_PALETTES = [
    { name: 'Carmesí HeyGen', color: '#e11d48' },
    { name: 'Azul Pro', color: '#2563eb' },
    { name: 'Cian Neón', color: '#06b6d4' },
    { name: 'Esmeralda', color: '#10b981' },
    { name: 'Púrpura Tech', color: '#8b5cf6' },
    { name: 'Dorado Luxury', color: '#f59e0b' },
  ];

  const VOICE_OPTIONS = [
    { id: 'Kore', label: 'Kore (Femenina, Corporativa y Clara)' },
    { id: 'Fenrir', label: 'Fenrir (Masculina, Profunda y de Autoridad)' },
    { id: 'Puck', label: 'Puck (Femenina, Dinámica y Creadora)' },
    { id: 'Zephyr', label: 'Zephyr (Moderna, Neutra y Tech)' },
    { id: 'Charon', label: 'Charon (Masculina, Cálida y Pedagógica)' },
    { id: 'Aoede', label: 'Aoede (Femenina, Suave y Empática)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Hidden audio element for TTS preview */}
      <audio
        ref={audioPlayerRef}
        onPlay={() => setIsTestSpeaking(true)}
        onEnded={() => setIsTestSpeaking(false)}
        onPause={() => setIsTestSpeaking(false)}
        className="hidden"
      />

      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl shadow-black overflow-hidden text-slate-100">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-500 text-white shadow-lg shadow-rose-950/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>Avatares IA de Locución</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Estilo HeyGen Pro
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Presentadores digitales con sincronización labial (lip-sync), micro-gestos y voz en off
              </p>
            </div>
          </div>

          {/* Master Toggle & Close */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isEnabled
                  ? 'bg-rose-950/80 border-rose-600/70 text-rose-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {isEnabled ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isEnabled ? 'Avatar Activo' : 'Desactivado'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Controls Tabs, Right Real-time HeyGen Stage */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Main Controls Panel */}
          <div className="flex-1 flex flex-col min-h-0 border-r border-slate-800/80">
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800/80 px-4 bg-slate-950/60 overflow-x-auto gap-1">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'presets'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Presentadores</span>
              </button>

              <button
                onClick={() => setActiveTab('ai_generate')}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'ai_generate'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Crear con IA</span>
              </button>

              <button
                onClick={() => setActiveTab('script_voice')}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'script_voice'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Guión & Voz</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Animación & Formato</span>
              </button>

              <button
                onClick={() => setActiveTab('custom')}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'custom'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Foto</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-5 overflow-y-auto min-h-0 space-y-4">
              {/* TAB 1: PRESETS GALLERY */}
              {activeTab === 'presets' && (
                <div className="space-y-4">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'video_real', label: '🎬 Video Real 4K' },
                      { id: 'executive', label: 'Ejecutivos' },
                      { id: 'tech', label: 'Tech & Startups' },
                      { id: 'casual', label: 'Creadores UGC' },
                      { id: 'healthcare', label: 'Salud & Medicina' },
                      { id: 'educator', label: 'Educadores' },
                      { id: 'news', label: 'Noticias' },
                      { id: '3d', label: 'Digital Twins 3D' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Preset Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredPresets.map((preset) => {
                      const isSelected = avatar.avatarId === preset.id;
                      const isVideoPreset = preset.avatarType === 'video' || Boolean(preset.videoUrl);
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center ${
                            isSelected
                              ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700'
                          }`}
                        >
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-slate-700 group-hover:border-rose-400 transition shadow-md">
                            <img
                              src={preset.imageUrl}
                              alt={preset.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {isVideoPreset && (
                              <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-black text-rose-300 border border-rose-500/50">
                                4K VIDEO
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-rose-600/60 flex items-center justify-center text-white backdrop-blur-[1px]">
                                <Check className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-300 transition">
                                {preset.name}
                              </h4>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{preset.role}</p>
                            {preset.attire && (
                              <p className="text-[9px] text-slate-500 truncate mt-0.5">
                                {preset.attire}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 font-mono border border-slate-700">
                                Voz: {preset.recommendedVoice}
                              </span>
                              {isVideoPreset ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 font-bold border border-rose-800">
                                  Humano Real
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 font-bold border border-emerald-800">
                                  Ultra-Real
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: AI GENERATION */}
              {activeTab === 'ai_generate' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-700/40">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs mb-1">
                      <Wand2 className="w-4 h-4 text-rose-400" />
                      <span>Generador de Presentador de Estudio HeyGen con Gemini</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Crea un avatar personalizado con iluminación fotográfica de estudio, contacto visual directo y vestuario a medida.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Descripción del Presentador:
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ej. Abogada corporativa joven con traje sastre azul marino, expresión segura y amable, cabello recogido..."
                      className="w-full h-24 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Estilo Visual:
                      </label>
                      <select
                        value={aiStyle}
                        onChange={(e) => setAiStyle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="fotorrealista de estudio 8k">Fotorrealista de Estudio 8K</option>
                        <option value="cinematográfico elegante">Cinematográfico Elegante</option>
                        <option value="avatar 3D futurista digital twin">Avatar 3D Digital Twin</option>
                        <option value="casual creador tiktok">Casual Creador UGC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Vestuario / Atuendo:
                      </label>
                      <select
                        value={aiAttire}
                        onChange={(e) => setAiAttire(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="Traje ejecutivo formal">Traje Ejecutivo Formal (Blazer)</option>
                        <option value="Smart casual con camisa">Smart Casual con Camisa</option>
                        <option value="Bata médica profesional">Bata Médica Profesional</option>
                        <option value="Camiseta tech minimalista">Camiseta Tech Minimalista</option>
                        <option value="Hoodie moderno">Hoodie Moderno de Creador</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Iluminación de Estudio:
                      </label>
                      <select
                        value={aiLighting}
                        onChange={(e) => setAiLighting(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="Iluminación de estudio softbox">Softbox Suave de Estudio</option>
                        <option value="Luz lateral de contraste dramático">Luz Lateral Dramática</option>
                        <option value="Neón cyberpunk azul y magenta">Neón Cyberpunk</option>
                        <option value="Luz natural cálida">Luz Natural Cálida</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Nombre del Presentador:
                      </label>
                      <input
                        type="text"
                        value={aiName}
                        onChange={(e) => setAiName(e.target.value)}
                        placeholder="Ej. Sofía Martín"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {aiError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                      {aiError}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi || !aiPrompt.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando presentador con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Crear Avatar con IA</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 3: SCRIPT & VOICE */}
              {activeTab === 'script_voice' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Guión de Locución para {avatar.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Redacta o genera con IA lo que dirá el avatar durante la presentación
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                        {[
                          { id: 'pt-BR', label: '🇧🇷 PT', full: 'Português' },
                          { id: 'es-ES', label: '🇪🇸 ES', full: 'Español' },
                          { id: 'en-US', label: '🇺🇸 EN', full: 'English' },
                        ].map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setSelectedLanguage(l.id)}
                            title={`Idioma de locución: ${l.full}`}
                            className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                              selectedLanguage.startsWith(l.id.slice(0, 2))
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleGenerateScriptWithAi}
                        disabled={isGeneratingScript}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingScript ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        <span>Redactar Guión con IA</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    placeholder="Escribe el guión que hablará el presentador... Ej: Hola, hoy te revelo la estrategia exacta para triplicar conversiones..."
                    className="w-full h-28 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition resize-none"
                  />

                  {scriptSuccessMessage && (
                    <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                      {scriptSuccessMessage}
                    </div>
                  )}

                  {/* Voice Selector */}
                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Seleccionar Voz IA para {avatar.name}:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {VOICE_OPTIONS.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVoice(v.id);
                            onSelectRecommendedVoice?.(v.id);
                          }}
                          className={`p-2 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                            selectedVoice === v.id
                              ? 'bg-rose-950/70 border-rose-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{v.label}</span>
                          {selectedVoice === v.id && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        </button>
                      ))}
                    </div>

                    {/* Preview Voice & Apply Actions */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        onClick={handleSynthesizeAndPreviewVoice}
                        disabled={isSynthesizingVoice || !scriptText.trim()}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                      >
                        {isSynthesizingVoice ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>Sintetizar & Probar en Vivo</span>
                      </button>

                      <button
                        onClick={handleApplyAsVoiceoverTrack}
                        disabled={!scriptText.trim()}
                        className="py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        title="Sincroniza este audio y guión directamente en la pista de locución A2"
                      >
                        <AudioLines className="w-3.5 h-3.5" />
                        <span>Sincronizar a Pista A2</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS & DISPLAY */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Dinámica Facial & Interruptores Anatómicos */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>Dinámica Facial & Lip-Sync HeyGen</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Fotorrealismo 4K</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatar.enableLipSync !== false}
                          onChange={(e) =>
                            setAvatar((prev) => ({ ...prev, enableLipSync: e.target.checked }))
                          }
                          className="accent-rose-500 rounded"
                        />
                        <span className="text-xs text-slate-200 font-bold">
                          Sincronización Labial (Visemas)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatar.enableJawMotion !== false}
                          onChange={(e) =>
                            setAvatar((prev) => ({ ...prev, enableJawMotion: e.target.checked }))
                          }
                          className="accent-rose-500 rounded"
                        />
                        <span className="text-xs text-slate-200 font-bold">
                          Micro-mandíbula Anatómica
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatar.enableBreathing !== false}
                          onChange={(e) =>
                            setAvatar((prev) => ({ ...prev, enableBreathing: e.target.checked }))
                          }
                          className="accent-rose-500 rounded"
                        />
                        <span className="text-xs text-slate-200 font-bold">
                          Respiración Diafragmática
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatar.enableHeadMotion !== false}
                          onChange={(e) =>
                            setAvatar((prev) => ({ ...prev, enableHeadMotion: e.target.checked }))
                          }
                          className="accent-rose-500 rounded"
                        />
                        <span className="text-xs text-slate-200 font-bold">
                          Balanceo Orgánico de Cabeza
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatar.enableBlinking !== false}
                          onChange={(e) =>
                            setAvatar((prev) => ({ ...prev, enableBlinking: e.target.checked }))
                          }
                          className="accent-rose-500 rounded"
                        />
                        <span className="text-xs text-slate-200 font-bold">
                          Parpadeo Natural con Pestañas
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* CALIBRACIÓN ANATÓMICA DE BOCA (VISEMAS) */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <Smile className="w-4 h-4" />
                        <span>Calibración de Boca & Visemas (Mover, Achicar y Velocidad)</span>
                      </div>
                      <button
                        onClick={() =>
                          setAvatar((prev) => ({
                            ...prev,
                            mouthPositionPercent: 68,
                            mouthOffsetXPercent: 0,
                            mouthScale: 1.0,
                            mouthSpeed: 1.0,
                          }))
                        }
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-300 font-bold transition cursor-pointer"
                        title="Restablecer boca a valores anatómicos estándar"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restablecer</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Altura Y */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Altura Vertical (Y):</span>
                          <span className="text-rose-400 font-mono">{avatar.mouthPositionPercent ?? 68}%</span>
                        </div>
                        <input
                          type="range"
                          min="45"
                          max="85"
                          step="1"
                          value={avatar.mouthPositionPercent ?? 68}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              mouthPositionPercent: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Arriba (45%)</span>
                          <span>Abajo (85%)</span>
                        </div>
                      </div>

                      {/* Desplazamiento Horizontal X */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Posición Horizontal (X):</span>
                          <span className="text-rose-400 font-mono">
                            {(avatar.mouthOffsetXPercent ?? 0) > 0 ? '+' : ''}
                            {avatar.mouthOffsetXPercent ?? 0}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-25"
                          max="25"
                          step="1"
                          value={avatar.mouthOffsetXPercent ?? 0}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              mouthOffsetXPercent: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Izquierda (-25%)</span>
                          <span>Derecha (+25%)</span>
                        </div>
                      </div>

                      {/* Escala / Tamaño (Achicar o Agrandar) */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Tamaño de Boca (Escala):</span>
                          <span className="text-rose-400 font-mono">
                            {(avatar.mouthScale ?? 1.0).toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.4"
                          max="1.8"
                          step="0.05"
                          value={avatar.mouthScale ?? 1.0}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              mouthScale: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Achicar (0.4x)</span>
                          <span>Agrandar (1.8x)</span>
                        </div>
                      </div>

                      {/* Velocidad de Articulación */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Velocidad de Visemas:</span>
                          <span className="text-rose-400 font-mono">
                            {(avatar.mouthSpeed ?? 1.0).toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.4"
                          max="2.5"
                          step="0.1"
                          value={avatar.mouthSpeed ?? 1.0}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              mouthSpeed: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Lento (0.4x)</span>
                          <span>Rápido (2.5x)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CALIBRACIÓN ANATÓMICA DE PESTAÑAS Y OJOS */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <Eye className="w-4 h-4" />
                        <span>Calibración de Pestañas & Ojos (Mover, Achicar y Velocidad)</span>
                      </div>
                      <button
                        onClick={() =>
                          setAvatar((prev) => ({
                            ...prev,
                            eyesPositionPercent: 41,
                            eyesOffsetXPercent: 0,
                            eyesSpacingPercent: 16,
                            eyesScale: 1.0,
                            blinkInterval: 4.2,
                            blinkSpeed: 1.0,
                          }))
                        }
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-300 font-bold transition cursor-pointer"
                        title="Restablecer ojos a valores anatómicos estándar"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restablecer</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Altura Y de Ojos */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Altura de Ojos (Y):</span>
                          <span className="text-rose-400 font-mono">{avatar.eyesPositionPercent ?? 41}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="60"
                          step="1"
                          value={avatar.eyesPositionPercent ?? 41}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              eyesPositionPercent: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Arriba (20%)</span>
                          <span>Abajo (60%)</span>
                        </div>
                      </div>

                      {/* Desplazamiento Horizontal X de Ojos */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Posición Horizontal (X):</span>
                          <span className="text-rose-400 font-mono">
                            {(avatar.eyesOffsetXPercent ?? 0) > 0 ? '+' : ''}
                            {avatar.eyesOffsetXPercent ?? 0}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          step="1"
                          value={avatar.eyesOffsetXPercent ?? 0}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              eyesOffsetXPercent: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Izquierda (-20%)</span>
                          <span>Derecha (+20%)</span>
                        </div>
                      </div>

                      {/* Separación entre Ojos */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Separación entre Ojos:</span>
                          <span className="text-rose-400 font-mono">{avatar.eyesSpacingPercent ?? 16}%</span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="26"
                          step="1"
                          value={avatar.eyesSpacingPercent ?? 16}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              eyesSpacingPercent: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Juntos (8%)</span>
                          <span>Separados (26%)</span>
                        </div>
                      </div>

                      {/* Tamaño de Pestañas y Párpados */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Tamaño de Pestañas (Escala):</span>
                          <span className="text-rose-400 font-mono">
                            {(avatar.eyesScale ?? 1.0).toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.4"
                          max="1.8"
                          step="0.05"
                          value={avatar.eyesScale ?? 1.0}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              eyesScale: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Achicar (0.4x)</span>
                          <span>Agrandar (1.8x)</span>
                        </div>
                      </div>

                      {/* Intervalo entre Parpadeos */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Frecuencia (Cada cuántos seg.):</span>
                          <span className="text-rose-400 font-mono">
                            {(avatar.blinkInterval ?? 4.2).toFixed(1)}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1.5"
                          max="7.0"
                          step="0.1"
                          value={avatar.blinkInterval ?? 4.2}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              blinkInterval: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Frecuente (1.5s)</span>
                          <span>Espaciado (7.0s)</span>
                        </div>
                      </div>

                      {/* Velocidad del Parpadeo */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/70">
                        <div className="flex justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span>Velocidad de Cierre de Ojos:</span>
                          <span className="text-rose-400 font-mono">
                            {(avatar.blinkSpeed ?? 1.0).toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={avatar.blinkSpeed ?? 1.0}
                          onChange={(e) =>
                            setAvatar((prev) => ({
                              ...prev,
                              blinkSpeed: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-rose-500"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                          <span>Suave (0.5x)</span>
                          <span>Rápido (2.0x)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ELEMENTOS VISUALES & PLACAS */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <div className="text-rose-400 font-bold text-xs flex items-center gap-2">
                      <Sliders className="w-4 h-4" />
                      <span>Elementos Visuales del Avatar</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatar.showNameTag !== false}
                          onChange={(e) =>
                            setAvatar((prev) => ({ ...prev, showNameTag: e.target.checked }))
                          }
                          className="accent-rose-500 rounded"
                        />
                        <span className="text-xs text-slate-200 font-bold">
                          Placa de Nombre & Rol
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatar.showWatermark === true}
                          onChange={(e) =>
                            setAvatar((prev) => ({ ...prev, showWatermark: e.target.checked }))
                          }
                          className="accent-rose-500 rounded"
                        />
                        <span className="text-xs text-slate-200 font-bold">
                          Etiqueta "Avatar IA"
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatar.showAudioEqualizer === true}
                          onChange={(e) =>
                            setAvatar((prev) => ({ ...prev, showAudioEqualizer: e.target.checked }))
                          }
                          className="accent-rose-500 rounded"
                        />
                        <span className="text-xs text-slate-200 font-bold">
                          Barra de Colores Ecualizador
                        </span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-0.5">
                      La etiqueta "Avatar IA" y la barra de colores están desactivadas para un avatar limpio y profesional.
                    </p>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Ubicación en Pantalla:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'bottom_right', label: 'Inf. Derecha' },
                        { id: 'bottom_left', label: 'Inf. Izquierda' },
                        { id: 'bottom_center', label: 'Inf. Centro' },
                        { id: 'center_right', label: 'Centro Der.' },
                        { id: 'center_left', label: 'Centro Izq.' },
                        { id: 'top_right', label: 'Sup. Derecha' },
                        { id: 'top_left', label: 'Sup. Izquierda' },
                        { id: 'fullscreen_host', label: 'Anfitrión Completo' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() =>
                            setAvatar((prev) => ({
                              ...prev,
                              position: pos.id as AvatarPosition,
                            }))
                          }
                          className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                            avatar.position === pos.id
                              ? 'bg-rose-950/70 border-rose-500 text-rose-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shape & Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Formato del Marco HeyGen:
                      </label>
                      <select
                        value={avatar.shape || 'circle'}
                        onChange={(e) =>
                          setAvatar((prev) => ({
                            ...prev,
                            shape: e.target.value as AvatarShape,
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="circle">Burbuja Circular Clásica</option>
                        <option value="rounded">Cuadrado Redondeado (Squircle)</option>
                        <option value="pill">Pill / Cápsula</option>
                        <option value="portrait">Tarjeta de Retrato Estudio 3:4</option>
                        <option value="half_body">Busto Medio Cuerpo</option>
                        <option value="cinema_wide">Panorámico 16:9</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Tamaño del Presentador ({avatar.size || 96}px):
                      </label>
                      <input
                        type="range"
                        min="64"
                        max="160"
                        step="4"
                        value={avatar.size || 96}
                        onChange={(e) =>
                          setAvatar((prev) => ({
                            ...prev,
                            size: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-rose-500 mt-2"
                      />
                    </div>
                  </div>

                  {/* Glow Color Palette */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Color del Halo y Ondas Reactivas de Voz:
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PALETTES.map((cp) => (
                        <button
                          key={cp.color}
                          onClick={() =>
                            setAvatar((prev) => ({
                              ...prev,
                              borderGlowColor: cp.color,
                            }))
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition cursor-pointer ${
                            avatar.borderGlowColor === cp.color
                              ? 'border-white text-white bg-slate-900'
                              : 'border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cp.color }}
                          />
                          <span>{cp.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hide on specific slides */}
                  {slides.length > 0 && (
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Ocultar avatar en diapositivas específicas (ej. CTA final):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {slides.map((s, idx) => {
                          const isHidden = avatar.hideOnSlides?.includes(idx);
                          return (
                            <button
                              key={`hide-slide-${idx}`}
                              onClick={() => handleToggleHideOnSlide(idx)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                isHidden
                                  ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              Escena {idx + 1} {isHidden ? '(Oculto)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CUSTOM UPLOAD */}
              {activeTab === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Subir foto de rostro propia:
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-rose-500 rounded-2xl p-6 bg-slate-900/40 hover:bg-slate-900/80 transition cursor-pointer group">
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-rose-400 mb-2 transition" />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                        Seleccionar imagen de rostro (JPG, PNG, WebP)
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Ideal foto centrada con buena iluminación y mirada a cámara
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      O pegar URL directa de imagen:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                      <button
                        onClick={handleApplyCustomUrl}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Usar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Stage: Interactive Real-time HeyGen Preview */}
          <div className="w-full md:w-80 lg:w-96 bg-slate-900/50 p-5 flex flex-col items-center justify-between border-t md:border-t-0 border-slate-800">
            <div className="w-full flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  <span>Estudio HeyGen en Directo</span>
                </span>

                <button
                  onClick={() => setIsTestSpeaking(!isTestSpeaking)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                    isTestSpeaking
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Simular habla para ver la animación de boca y ondas en tiempo real"
                >
                  {isTestSpeaking ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Hablando</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>En Pausa</span>
                    </>
                  )}
                </button>
              </div>

              {/* Theater Monitor Screen */}
              <div className="relative w-full aspect-[9/16] max-h-[340px] rounded-2xl bg-slate-950 border-2 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
                {/* Background sample mimicking a slide */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 opacity-95" />
                <div className="absolute inset-0 flex flex-col justify-center p-6 text-center pointer-events-none opacity-30">
                  <div className="w-20 h-2 rounded bg-rose-500 mb-3 mx-auto" />
                  <div className="w-40 h-3 rounded bg-slate-300 mb-2 mx-auto" />
                  <div className="w-48 h-2 rounded bg-slate-600 mb-1 mx-auto" />
                  <div className="w-36 h-2 rounded bg-slate-700 mx-auto" />
                </div>

                {/* Live Avatar Badge with full HeyGen lipsync */}
                {isEnabled ? (
                  <VoiceoverAvatarBadge
                    avatar={avatar}
                    isSpeaking={isTestSpeaking}
                    slideIndex={0}
                    isInteractive={false}
                  />
                ) : (
                  <div className="text-slate-600 text-xs font-bold text-center px-4">
                    Avatar Desactivado
                  </div>
                )}
              </div>

              {/* Active Profile Info Box */}
              <div className="w-full mt-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <div className="text-xs font-bold text-white truncate">{avatar.name}</div>
                <div className="text-[10px] text-rose-300 truncate font-medium">{avatar.role || 'Locutor IA'}</div>
                <div className="mt-1 flex items-center justify-center gap-2 text-[9px] text-slate-400 font-mono">
                  <span>Voz: {selectedVoice}</span>
                  <span>•</span>
                  <span>Lip-Sync: {avatar.enableLipSync !== false ? 'Activo' : 'Off'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="w-full space-y-2 mt-4">
              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Avatar y Aplicar</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
