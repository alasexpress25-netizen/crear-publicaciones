import { VideoAudioTrack, AudioEffectType } from '../types';
import { generateProceduralAudioBuffer } from './audioLibrary';

class PreviewAudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNodes: AudioNode[] = [];
  private cachedBuffers: Map<string, AudioBuffer> = new Map();
  private isCurrentlyPlaying: boolean = false;
  private activeTrack: VideoAudioTrack | null = null;
  private playStartTimeAudioCtx: number = 0;
  private playOffsetSeconds: number = 0;

  public getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Resume audio context synchronously upon user gesture
   */
  public async resumeContext(): Promise<AudioContext> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume error:', err);
      }
    }
    return ctx;
  }

  /**
   * Load or retrieve an AudioBuffer for a track
   */
  public async getAudioBuffer(track: VideoAudioTrack): Promise<AudioBuffer | null> {
    try {
      const ctx = this.getAudioContext();
      const cacheKey = track.url;

      if (this.cachedBuffers.has(cacheKey)) {
        return this.cachedBuffers.get(cacheKey)!;
      }

      if (track.url.startsWith('preset:')) {
        const presetId = track.url.replace('preset:', '');
        const buffer = generateProceduralAudioBuffer(ctx, presetId, 60);
        this.cachedBuffers.set(cacheKey, buffer);
        return buffer;
      }

      // Fetch external or blob audio
      const response = await fetch(track.url);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      this.cachedBuffers.set(cacheKey, decoded);
      return decoded;
    } catch (err) {
      console.warn('Error loading audio track buffer:', err);
      return null;
    }
  }

  /**
   * Apply DSP Audio Effects (Equalizer, Reverb, Filters)
   */
  private buildEffectChain(
    ctx: AudioContext,
    effect: AudioEffectType | undefined,
    source: AudioNode,
    destination: AudioNode
  ): AudioNode[] {
    const nodes: AudioNode[] = [];

    if (!effect || effect === 'none') {
      source.connect(destination);
      return nodes;
    }

    if (effect === 'bass_boost') {
      // Sub-Bass + Low Shelf Boost +6dB at 90Hz
      const lowShelf = ctx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 100;
      lowShelf.gain.value = 7.5;

      const peak = ctx.createBiquadFilter();
      peak.type = 'peaking';
      peak.frequency.value = 60;
      peak.gain.value = 4;
      peak.Q.value = 1.2;

      source.connect(lowShelf);
      lowShelf.connect(peak);
      peak.connect(destination);
      nodes.push(lowShelf, peak);
    } else if (effect === 'lowpass_filter') {
      // Underwater / Muffled intro filter
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 850;
      lpf.Q.value = 2.0;

      source.connect(lpf);
      lpf.connect(destination);
      nodes.push(lpf);
    } else if (effect === 'high_energy') {
      // Dynamic compressor + treble sizzle
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.003;
      comp.release.value = 0.25;

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 4500;
      highShelf.gain.value = 4;

      source.connect(highShelf);
      highShelf.connect(comp);
      comp.connect(destination);
      nodes.push(highShelf, comp);
    } else if (effect === 'vintage_radio') {
      // Bandpass / Phone speaker
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1600;
      bpf.Q.value = 1.8;

      source.connect(bpf);
      bpf.connect(destination);
      nodes.push(bpf);
    } else if (effect === 'reverb_hall') {
      // Simulated Acoustic Reverb
      const convolver = ctx.createConvolver();
      const rate = ctx.sampleRate;
      const length = rate * 1.8;
      const decay = 2.2;
      const impulse = ctx.createBuffer(2, length, rate);
      for (let c = 0; c < 2; c++) {
        const channel = impulse.getChannelData(c);
        for (let i = 0; i < length; i++) {
          channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      convolver.buffer = impulse;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.75;
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.35;

      source.connect(dryGain);
      dryGain.connect(destination);

      source.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(destination);
      nodes.push(convolver, dryGain, wetGain);
    } else {
      source.connect(destination);
    }

    return nodes;
  }

  /**
   * Start or sync audio playback at a given timeline position
   */
  public async syncPlayback(
    track: VideoAudioTrack | null,
    currentTimeSeconds: number,
    isPlaying: boolean,
    totalVideoDuration: number = 30
  ) {
    if (!track || !isPlaying || track.isMuted || (track.volume ?? 1) <= 0) {
      this.stop();
      return;
    }

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const buffer = await this.getAudioBuffer(track);
    if (!buffer) {
      this.stop();
      return;
    }

    // Calculate effective time offset in audio
    const startOffset = track.startOffset || 0;
    const speed = track.speed || 1;
    const audioTrimDuration = track.duration || buffer.duration;

    // Relative timeline position
    const relativeTime = currentTimeSeconds - startOffset;

    if (relativeTime < 0) {
      // Playhead is before the audio starts
      this.stop();
      return;
    }

    const isLooping = track.loop !== false; // Loop by default for background soundtrack
    if (relativeTime > audioTrimDuration && !isLooping) {
      // Audio trimmed out
      this.stop();
      return;
    }

    const durationLimit = audioTrimDuration || buffer.duration;
    const rawOffset = isLooping ? (relativeTime % durationLimit) : relativeTime;
    const offsetInAudio = Math.max(0, Math.min(Math.max(0, buffer.duration - 0.05), rawOffset));

    // If already playing smoothly and difference is tiny (<0.15s), avoid restarting source
    if (this.isCurrentlyPlaying && this.currentSource && this.activeTrack?.url === track.url) {
      const elapsedSinceStart = (ctx.currentTime - this.playStartTimeAudioCtx) * speed;
      const estimatedCurrentAudioTime = this.playOffsetSeconds + elapsedSinceStart;
      const drift = Math.abs(estimatedCurrentAudioTime - offsetInAudio);
      if (drift < 0.2) {
        // Just update volume / gains
        this.updateGain(track, currentTimeSeconds, totalVideoDuration);
        return;
      }
    }

    // Restart source at exact offset
    this.stop();

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = speed;
      source.loop = isLooping;
      if (isLooping) {
        source.loopStart = 0;
        source.loopEnd = Math.min(buffer.duration, durationLimit);
      }

      const masterGain = ctx.createGain();
      this.gainNode = masterGain;

      // Connect effect chain -> masterGain -> destination
      this.filterNodes = this.buildEffectChain(ctx, track.audioEffect, source, masterGain);
      masterGain.connect(ctx.destination);

      this.updateGain(track, currentTimeSeconds, totalVideoDuration);

      // Start buffer playback
      const playDuration = Math.max(0.1, durationLimit - offsetInAudio);
      source.start(0, offsetInAudio, isLooping ? undefined : playDuration);

      this.currentSource = source;
      this.isCurrentlyPlaying = true;
      this.activeTrack = track;
      this.playStartTimeAudioCtx = ctx.currentTime;
      this.playOffsetSeconds = offsetInAudio;

      source.onended = () => {
        if (this.currentSource === source) {
          this.isCurrentlyPlaying = false;
        }
      };
    } catch (err) {
      console.warn('Error starting audio source:', err);
    }
  }

  /**
   * Update gain envelope with hardware parameter automation (volume, mute, fade-in, fade-out)
   */
  public updateGain(track: VideoAudioTrack, currentTimeSeconds: number, totalVideoDuration: number) {
    if (!this.gainNode || !this.ctx) return;

    const now = this.ctx.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);

    if (track.isMuted) {
      this.gainNode.gain.setValueAtTime(0, now);
      return;
    }

    const baseVol = Math.max(0, Math.min(1, track.volume ?? 0.85));
    const startOffset = track.startOffset || 0;
    const timeInAudio = Math.max(0, currentTimeSeconds - startOffset);
    const speed = track.speed || 1;

    const fadeIn = track.fadeIn || 0;
    const fadeOut = track.fadeOut || 0;
    const audioLen = track.duration || (totalVideoDuration - startOffset);
    const timeLeftInAudio = Math.max(0, audioLen - timeInAudio);
    const timeLeftInVideo = Math.max(0, totalVideoDuration - currentTimeSeconds);
    const playRemaining = Math.min(timeLeftInAudio, timeLeftInVideo);

    if (fadeIn > 0 && timeInAudio < fadeIn) {
      const currentStart = baseVol * (timeInAudio / fadeIn);
      this.gainNode.gain.setValueAtTime(Math.max(0.0001, currentStart), now);
      const rampTime = (fadeIn - timeInAudio) / speed;
      this.gainNode.gain.linearRampToValueAtTime(baseVol, now + rampTime);
    } else {
      this.gainNode.gain.setValueAtTime(baseVol, now);
    }

    if (fadeOut > 0 && playRemaining > fadeOut) {
      const fadeStartAudioCtx = now + (playRemaining - fadeOut) / speed;
      this.gainNode.gain.setValueAtTime(baseVol, Math.max(now, fadeStartAudioCtx));
      this.gainNode.gain.linearRampToValueAtTime(0.0001, now + playRemaining / speed);
    }
  }

  /**
   * Preview a quick sample of a track even when timeline is stopped
   */
  public async previewSample(track: VideoAudioTrack, durationSeconds: number = 3.5) {
    const ctx = await this.resumeContext();
    this.stop();
    const buffer = await this.getAudioBuffer(track);
    if (!buffer) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      const vol = Math.max(0.1, track.volume ?? 0.85);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + durationSeconds);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0, 0, durationSeconds);
      this.currentSource = source;
      this.gainNode = gain;
      this.isCurrentlyPlaying = true;
      source.onended = () => {
        if (this.currentSource === source) {
          this.isCurrentlyPlaying = false;
        }
      };
    } catch (e) {
      console.warn('Error previewing sample:', e);
    }
  }

  /**
   * Stop audio playback
   */
  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
    this.filterNodes.forEach((n) => {
      try { n.disconnect(); } catch {}
    });
    this.filterNodes = [];
    this.isCurrentlyPlaying = false;
  }

  /**
   * Pause audio playback (alias for stop in Web Audio API context)
   */
  public pause() {
    this.stop();
  }
}

export const previewAudio = new PreviewAudioEngine();
