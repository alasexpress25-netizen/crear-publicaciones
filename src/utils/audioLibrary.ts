// Audio tracks library for Video Timeline
export interface AudioPreset {
  id: string;
  name: string;
  category: 'energetico' | 'corporativo' | 'lofi' | 'cinematico' | 'minimalista';
  bpm: number;
  duration: number; // in seconds
  description: string;
}

export const AUDIO_PRESETS: AudioPreset[] = [
  {
    id: 'corporate_uplifting',
    name: 'Impacto Corporativo & Éxito',
    category: 'corporativo',
    bpm: 120,
    duration: 60,
    description: 'Tonos claros de piano, pulso moderno y sensación de liderazgo estratégico.',
  },
  {
    id: 'energetic_marketing',
    name: 'Ritmo Dinámico High-Energy',
    category: 'energetico',
    bpm: 128,
    duration: 60,
    description: 'Beat moderno estilo Reel/TikTok para captar atención en los primeros 3 segundos.',
  },
  {
    id: 'lofi_chill_focus',
    name: 'Lo-Fi Chill & Autoridad',
    category: 'lofi',
    bpm: 90,
    duration: 60,
    description: 'Graves cálidos y ritmo envolvente, ideal para carruseles educativos y B2B.',
  },
  {
    id: 'cinematic_inspiring',
    name: 'Cinemático & Marca Personal',
    category: 'cinematico',
    bpm: 105,
    duration: 60,
    description: 'Crescendo elegante con cuerdas y sintetizadores para storytelling de alto valor.',
  },
  {
    id: 'minimal_tech',
    name: 'Minimal Tech & Futurismo',
    category: 'minimalista',
    bpm: 115,
    duration: 60,
    description: 'Pulsos electrónicos limpios ideales para marcas de innovación, software y SaaS.',
  },
];

/**
 * Generate a high quality royalty-free musical audio buffer in-browser using Web Audio API.
 * This guarantees 100% offline, zero-latency, cross-origin safe audio rendering for video export.
 */
export function generateProceduralAudioBuffer(
  audioCtx: AudioContext,
  presetId: string,
  totalDurationSeconds: number = 30
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const numChannels = 2;
  const numSamples = Math.ceil(sampleRate * totalDurationSeconds);
  const buffer = audioCtx.createBuffer(numChannels, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const preset = AUDIO_PRESETS.find((p) => p.id === presetId) || AUDIO_PRESETS[0];
  const bpm = preset.bpm;
  const beatInterval = 60 / bpm;

  // Chord frequencies based on category
  let chords: number[][] = [];
  if (preset.category === 'corporativo') {
    // C - G - Am - F (warm positive)
    chords = [
      [261.63, 329.63, 392.0],       // C
      [196.0, 246.94, 293.66],       // G
      [220.0, 261.63, 329.63],       // Am
      [174.61, 220.0, 261.63],       // F
    ];
  } else if (preset.category === 'energetico') {
    // Dm - Bb - F - C (driving pulse)
    chords = [
      [146.83, 220.0, 293.66],       // Dm
      [116.54, 174.61, 233.08],      // Bb
      [174.61, 261.63, 349.23],      // F
      [130.81, 196.0, 261.63],       // C
    ];
  } else if (preset.category === 'lofi') {
    // Fmaj7 - Em7 - Dm7 - Cmaj7 (chill jazz)
    chords = [
      [174.61, 220.0, 261.63, 329.63],
      [164.81, 196.0, 246.94, 293.66],
      [146.83, 174.61, 220.0, 261.63],
      [130.81, 164.81, 196.0, 246.94],
    ];
  } else if (preset.category === 'cinematico') {
    // Am - F - C - Em (deep storytelling)
    chords = [
      [110.0, 220.0, 261.63, 329.63],
      [87.31, 174.61, 220.0, 261.63],
      [130.81, 196.0, 261.63, 329.63],
      [82.41, 164.81, 196.0, 246.94],
    ];
  } else {
    // Minimal Tech: A minor electronic pulse
    chords = [
      [110.0, 164.81, 220.0, 329.63],
      [98.0, 146.83, 196.0, 293.66],
      [87.31, 130.81, 174.61, 261.63],
      [110.0, 164.81, 220.0, 329.63],
    ];
  }

  const chordDuration = beatInterval * 4; // 1 measure per chord

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const currentMeasure = Math.floor(t / chordDuration);
    const chord = chords[currentMeasure % chords.length];
    const timeInMeasure = t % chordDuration;
    const timeInBeat = t % beatInterval;

    let sampleL = 0;
    let sampleR = 0;

    // 1. Kick / Bass Beat (at each beat)
    const kickEnv = Math.max(0, 1 - timeInBeat * 12);
    if (kickEnv > 0) {
      const kickFreq = 55 + 110 * Math.max(0, 1 - timeInBeat * 30);
      const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.28;
      sampleL += kick;
      sampleR += kick;
    }

    // 2. Subtle Hi-Hat / Shaker (on 16th or 8th notes)
    const subBeat = t % (beatInterval / 2);
    const hatEnv = Math.max(0, 1 - subBeat * 40);
    if (hatEnv > 0) {
      const noise = (Math.random() * 2 - 1) * hatEnv * 0.05;
      sampleL += noise * 0.8;
      sampleR += noise * 1.2;
    }

    // 3. Melodic Chord Layer (warm sine / triangle mix)
    const chordEnvelope = Math.sin((timeInMeasure / chordDuration) * Math.PI);
    for (let fIndex = 0; fIndex < chord.length; fIndex++) {
      const freq = chord[fIndex];
      const sine = Math.sin(2 * Math.PI * freq * t);
      const harmonics = Math.sin(2 * Math.PI * freq * 2 * t) * 0.25;
      const noteSample = (sine + harmonics) * chordEnvelope * (0.12 / chord.length);

      // Stereo spread
      sampleL += noteSample * (fIndex % 2 === 0 ? 0.9 : 0.6);
      sampleR += noteSample * (fIndex % 2 === 0 ? 0.6 : 0.9);
    }

    // Master Soft Limiter
    left[i] = Math.tanh(sampleL * 0.85);
    right[i] = Math.tanh(sampleR * 0.85);
  }

  return buffer;
}

export interface SfxPreset {
  id: string;
  name: string;
  category: 'transicion' | 'impacto' | 'atencion' | 'ui' | 'magia' | 'social';
  duration: number;
  description: string;
  icon?: string;
}

export const SFX_PRESETS: SfxPreset[] = [
  {
    id: 'swoosh',
    name: 'Swoosh Dinámico',
    category: 'transicion',
    duration: 0.7,
    description: 'Brisa rápida ideal para cambios de diapositiva y transiciones.',
    icon: '💨',
  },
  {
    id: 'impact',
    name: 'Impacto Cinematográfico',
    category: 'impacto',
    duration: 1.4,
    description: 'Golpe de graves profundo para estadísticas clave o ganchos fuertes.',
    icon: '💥',
  },
  {
    id: 'bell',
    name: 'Campana / Tip Revelador',
    category: 'atencion',
    duration: 1.2,
    description: 'Timbre cristalino para destacar consejos, aprendizajes y llamadas a la acción.',
    icon: '🔔',
  },
  {
    id: 'magic',
    name: 'Destello Mágico (Shimmer)',
    category: 'magia',
    duration: 1.8,
    description: 'Arpegio brillante para momentos de revelación, valor e innovación.',
    icon: '✨',
  },
  {
    id: 'pop',
    name: 'Pop Burbuja Divertido',
    category: 'ui',
    duration: 0.25,
    description: 'Sonido alegre y ágil para aparición de textos, stickers o viñetas.',
    icon: '🫧',
  },
  {
    id: 'click',
    name: 'Clic / Tape Mecánico',
    category: 'ui',
    duration: 0.15,
    description: 'Clic nítido de precisión para botones, títulos o elementos sutiles.',
    icon: '🔘',
  },
  {
    id: 'riser',
    name: 'Riser / Subida de Tensión',
    category: 'transicion',
    duration: 2.2,
    description: 'Efecto de acumulación que aumenta el suspenso antes de la conclusión.',
    icon: '📈',
  },
  {
    id: 'applause',
    name: 'Aplausos & Éxito',
    category: 'social',
    duration: 2.5,
    description: 'Celebración para la diapositiva final de CTA, testimonios o victoria.',
    icon: '👏',
  },
];

/**
 * Procedural SFX generator using Web Audio API in-memory buffers.
 * Zero-latency, 100% royalty-free, works entirely in browser and export pipeline.
 */
export function generateProceduralSFXBuffer(
  audioCtx: AudioContext,
  sfxId: string
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const targetPreset = SFX_PRESETS.find((s) => s.id === sfxId) || SFX_PRESETS[0];
  const duration = targetPreset.duration;
  const numSamples = Math.ceil(sampleRate * duration);
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sL = 0;
    let sR = 0;

    if (sfxId === 'swoosh') {
      // Sweeping whoosh + filtered noise transition
      const env = Math.sin((t / duration) * Math.PI);
      const sweepFreq = 180 + 1600 * Math.sin((t / duration) * Math.PI * 0.95);
      const noise = (Math.random() * 2 - 1) * 0.65;
      const tone = Math.sin(2 * Math.PI * sweepFreq * t) * 0.45;
      const combined = (noise * 0.55 + tone * 0.5) * Math.pow(env, 1.2) * 1.3;
      const pan = (t / duration) * 1.4 - 0.7; // Stereo motion
      sL = combined * Math.max(0.25, 1 - pan);
      sR = combined * Math.max(0.25, 1 + pan);
    } else if (sfxId === 'impact') {
      // Deep sub-bass drop + high transient crack
      const subEnv = Math.exp(-t * 3.8);
      const subFreq = 85 * Math.exp(-t * 6.5) + 40;
      const sub = Math.sin(2 * Math.PI * subFreq * t) * subEnv * 0.88;
      const punchEnv = Math.exp(-t * 18.0);
      const punch = Math.sin(2 * Math.PI * 140 * t) * punchEnv * 0.4;
      const clickEnv = Math.exp(-t * 50.0);
      const crack = (Math.random() * 2 - 1) * clickEnv * 0.45;
      sL = (sub + punch + crack) * 1.1;
      sR = (sub + punch + crack * 0.9) * 1.1;
    } else if (sfxId === 'bell') {
      // Crystal chime bell with 5 harmonious resonant partials
      const partials = [
        { f: 659.25, a: 0.45, d: 2.2 },
        { f: 987.77, a: 0.35, d: 2.6 },
        { f: 1318.51, a: 0.28, d: 3.0 },
        { f: 1975.53, a: 0.20, d: 3.5 },
        { f: 2637.02, a: 0.14, d: 4.2 },
      ];
      partials.forEach((p, idx) => {
        const env = Math.exp(-t * p.d);
        const wave = Math.sin(2 * Math.PI * p.f * t) * p.a * env;
        sL += wave * (idx % 2 === 0 ? 0.95 : 0.75);
        sR += wave * (idx % 2 === 0 ? 0.75 : 0.95);
      });
      sL *= 1.25;
      sR *= 1.25;
    } else if (sfxId === 'pop') {
      // Bubble pop: rapid pitch rise then drop with punch
      const env = Math.max(0, 1 - t / duration);
      const popFreq = 380 + 750 * Math.sin((t / duration) * (Math.PI / 2));
      const wave = Math.sin(2 * Math.PI * popFreq * t) * Math.pow(env, 1.8) * 0.85;
      sL = wave * 1.2;
      sR = wave * 1.2;
    } else if (sfxId === 'click') {
      // Mechanical snap / clean UI click
      const env = Math.exp(-t * 75.0);
      const noise = (Math.random() * 2 - 1) * env * 0.55;
      const snap = Math.sin(2 * Math.PI * 2100 * t) * env * 0.45;
      sL = (noise + snap) * 1.2;
      sR = (noise + snap) * 1.2;
    } else if (sfxId === 'magic') {
      // Sparkle shimmer arpeggio with high harmonic sparkle
      const notes = [659.25, 783.99, 987.77, 1318.51, 1567.98, 1975.53];
      const stepDur = duration / notes.length;
      notes.forEach((freq, idx) => {
        const noteStart = idx * stepDur * 0.65;
        if (t >= noteStart) {
          const noteT = t - noteStart;
          const noteEnv = Math.exp(-noteT * 3.2);
          const sine = Math.sin(2 * Math.PI * freq * noteT) * noteEnv * 0.28;
          const shimmer = Math.sin(2 * Math.PI * (freq * 2) * noteT) * noteEnv * 0.15;
          const pan = (idx % 2 === 0 ? 0.35 : 0.75);
          sL += (sine + shimmer) * (1 - pan);
          sR += (sine + shimmer) * pan;
        }
      });
      sL *= 1.2;
      sR *= 1.2;
    } else if (sfxId === 'riser') {
      // Ascending tension sweep with rushing air
      const prog = t / duration;
      const curFreq = 120 + Math.pow(prog, 2.2) * 1350;
      const env = Math.pow(prog, 1.3);
      const sine = Math.sin(2 * Math.PI * curFreq * t) * env * 0.5;
      const noise = (Math.random() * 2 - 1) * env * 0.35;
      sL = (sine * 0.85 + noise * 0.5) * 1.1;
      sR = (sine * 0.85 + noise * 0.5) * 1.1;
    } else if (sfxId === 'applause') {
      // Natural clapping texture with rhythm and stereo spread
      const clapEnv = Math.min(1, t * 3.0) * Math.max(0, 1 - t / duration);
      const density = 26;
      const clapPhase = (t * density) % 1;
      const singleClap = Math.exp(-clapPhase * 16);
      const randNoise = (Math.random() * 2 - 1) * 0.4;
      const val = (singleClap * 0.5 + randNoise * 0.65) * clapEnv * 0.75;
      sL = val * (0.8 + Math.random() * 0.4);
      sR = val * (0.8 + Math.random() * 0.4);
    } else {
      // Default ping
      const env = Math.exp(-t * 5);
      const wave = Math.sin(2 * Math.PI * 880 * t) * env * 0.7;
      sL = wave;
      sR = wave;
    }

    left[i] = Math.max(-0.95, Math.min(0.95, sL));
    right[i] = Math.max(-0.95, Math.min(0.95, sR));
  }

  return buffer;
}
