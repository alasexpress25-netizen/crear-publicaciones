import { SubtitleItem, VoiceoverTrack } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;
let onSpeechEndCallback: (() => void) | null = null;

export interface SpeechReaderOptions {
  voiceURI?: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Check if the browser supports SpeechSynthesis
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Retrieve available system and browser voices safely
 */
export function getAvailableSpeechVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices() || [];
}

/**
 * Find the best voice matching a given language code (e.g. 'es', 'pt', 'en')
 */
export function findBestVoiceForLang(langCode: string = 'es'): SpeechSynthesisVoice | null {
  const voices = getAvailableSpeechVoices();
  if (voices.length === 0) return null;

  const normalized = langCode.toLowerCase().slice(0, 2);

  // 1. Exact match with region if provided, or startsWith
  const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(normalized));
  if (matching.length > 0) {
    // Prefer natural/neural/Google/premium voices if available
    const premium = matching.find(
      (v) =>
        v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Microsoft') ||
        v.name.includes('Premium')
    );
    return premium || matching[0];
  }

  // Fallback to first voice
  return voices[0] || null;
}

/**
 * Stop any current speech playback immediately
 */
export function stopSubtitleSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    if (onSpeechEndCallback) {
      onSpeechEndCallback();
      onSpeechEndCallback = null;
    }
    currentUtterance = null;
  } catch (err) {
    console.warn('[subtitleSpeechReader] Error stopping speech:', err);
  }
}

/**
 * Check if speech is actively speaking
 */
export function isSpeakingSubtitles(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Speak a single subtitle or text chunk out loud
 */
export function speakSubtitleText(text: string, options: SpeechReaderOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('[subtitleSpeechReader] SpeechSynthesis not supported');
      resolve();
      return;
    }

    if (!text || !text.trim()) {
      resolve();
      return;
    }

    try {
      // Cancel previous speech to avoid queue buildup
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = options.rate ?? 1.05;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      const targetLang = options.lang || 'es-ES';
      utterance.lang = targetLang;

      if (options.voiceURI) {
        const voices = getAvailableSpeechVoices();
        const chosen = voices.find((v) => v.voiceURI === options.voiceURI);
        if (chosen) utterance.voice = chosen;
      } else {
        const fallback = findBestVoiceForLang(targetLang);
        if (fallback) utterance.voice = fallback;
      }

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        currentUtterance = null;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        currentUtterance = null;
        options.onError?.(e);
        resolve(); // resolve rather than reject to avoid crashing callers
      };

      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[subtitleSpeechReader] Error in speakSubtitleText:', err);
      resolve();
    }
  });
}

/**
 * Read all subtitles sequentially in order
 */
export async function readAllSubtitlesSequentially(
  subtitles: SubtitleItem[],
  options: SpeechReaderOptions & { onProgress?: (index: number, sub: SubtitleItem) => void } = {},
  isCancelled?: () => boolean
): Promise<void> {
  if (!subtitles || subtitles.length === 0) return;

  const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);

  for (let i = 0; i < sorted.length; i++) {
    if (isCancelled && isCancelled()) {
      stopSubtitleSpeech();
      break;
    }

    const sub = sorted[i];
    options.onProgress?.(i, sub);

    await speakSubtitleText(sub.text, {
      ...options,
      onStart: () => {
        if (i === 0) options.onStart?.();
      },
    });

    // Small natural pause between subtitle phrases
    await new Promise((r) => setTimeout(r, 180));
  }

  options.onEnd?.();
}

/**
 * Converts a list of subtitles into a VoiceoverTrack (A2 Locución)
 */
export function convertSubtitlesToVoiceoverTrack(
  subtitles: SubtitleItem[],
  totalDuration: number,
  language: string = 'es-ES'
): VoiceoverTrack {
  const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
  const fullScript = sorted.map((s) => s.text.trim()).filter(Boolean).join('. ');

  return {
    id: `vo-subs-${Date.now()}`,
    audioUrl: 'voiceover://tts',
    name: `Locución de Subtítulos (${sorted.length} subtítulos)`,
    scriptText: fullScript,
    language: language,
    duration: totalDuration,
    volume: 1.0,
    rate: 1.05,
    pitch: 1.0,
    isMuted: false,
  };
}
