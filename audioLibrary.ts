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
