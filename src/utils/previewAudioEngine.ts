import { VideoAudioTrack, AudioEffectType, VoiceoverTrack } from '../types';
import { generateProceduralAudioBuffer, generateProceduralSFXBuffer } from './audioLibrary';

interface MultiTrackSyncParams {
  trackA1: VideoAudioTrack | null;
  voiceoverTrack?: VoiceoverTrack | null;
  extraTracks?: VideoAudioTrack[];
  currentTimeSeconds: number;
  isPlaying: boolean;
  totalDuration?: number;
}

interface ActiveChannel {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  filterNodes: AudioNode[];
  trackUrl: string;
  playStartTimeAudioCtx: number;
  playOffsetSeconds: number;
  isLooping: boolean;
  speed: number;
}

class PreviewAudioEngine {
  private ctx: AudioContext | null = null;
  private cachedBuffers: Map<string, AudioBuffer> = new Map();
  private isCurrentlyPlaying: boolean = false;

  // Active Channels
  private channelA1: ActiveChannel | null = null;
  private channelA2Voice: ActiveChannel | null = null;
  private channelExtra: Map<string, ActiveChannel> = new Map();

  // Voiceover Web Speech state
  private isTtsSpeaking: boolean = false;
  private lastTtsSpokenId: string | null = null;
  private ttsCurrentUtterance: SpeechSynthesisUtterance | null = null;

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
   * Load or retrieve an AudioBuffer for any track (music, preset, sfx, blob, or url)
   */
  public async getAudioBuffer(track: { url: string }): Promise<AudioBuffer | null> {
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

      if (track.url.startsWith('sfx:')) {
        const sfxId = track.url.replace('sfx:', '');
        const buffer = generateProceduralSFXBuffer(ctx, sfxId);
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
      console.warn('Error loading audio buffer for:', track.url, err);
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
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 850;
      lpf.Q.value = 2.0;

      source.connect(lpf);
      lpf.connect(destination);
      nodes.push(lpf);
    } else if (effect === 'high_energy') {
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
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1600;
      bpf.Q.value = 1.8;

      source.connect(bpf);
      bpf.connect(destination);
      nodes.push(bpf);
    } else if (effect === 'reverb_hall') {
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
   * Synchronize multiple audio tracks simultaneously (A1 Music + A2 Voiceover + A3 SFX + A4 Ambient)
   */
  public async syncMultiTrackPlayback(params: MultiTrackSyncParams) {
    const {
      trackA1,
      voiceoverTrack,
      extraTracks = [],
      currentTimeSeconds,
      isPlaying,
      totalDuration = 30,
    } = params;

    if (!isPlaying) {
      this.stop();
      return;
    }

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
    this.isCurrentlyPlaying = true;

    // 1. Synchronize Channel A2: Voiceover / Locución
    await this.syncVoiceoverChannel(voiceoverTrack, currentTimeSeconds, isPlaying, totalDuration);

    // 2. Synchronize Channel A1: Background Music (with Auto-Ducking if voice is speaking)
    await this.syncChannelA1(trackA1, currentTimeSeconds, isPlaying, totalDuration);

    // 3. Synchronize Extra Audio Channels (A3 SFX, A4 Foley/Ambient, etc.)
    await this.syncExtraChannels(extraTracks, currentTimeSeconds, isPlaying, totalDuration);
  }

  /**
   * Channel A1: Background Music playback and sync
   */
  private async syncChannelA1(
    track: VideoAudioTrack | null,
    currentTimeSeconds: number,
    isPlaying: boolean,
    totalDuration: number
  ) {
    if (!track || !isPlaying || track.isMuted || (track.volume ?? 1) <= 0) {
      this.stopChannelA1();
      return;
    }

    const ctx = this.getAudioContext();
    const buffer = await this.getAudioBuffer(track);
    if (!buffer) {
      this.stopChannelA1();
      return;
    }

    const startOffset = track.startOffset || 0;
    const speed = track.speed || 1;
    const audioTrimDuration = track.duration || buffer.duration;
    const durationLimit = audioTrimDuration || buffer.duration;
    const relativeTime = currentTimeSeconds - startOffset;
    const isLooping = track.loop !== false;

    // If track is scheduled to start in the future relative to currentTimeSeconds
    if (relativeTime < 0) {
      const delay = (startOffset - currentTimeSeconds) / speed;
      const startTimeAudioCtx = ctx.currentTime + delay;

      if (this.channelA1 && this.channelA1.source && this.channelA1.trackUrl === track.url) {
        const drift = Math.abs(this.channelA1.playStartTimeAudioCtx - startTimeAudioCtx);
        if (drift < 0.2) {
          return;
        }
      }

      this.stopChannelA1();

      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = speed;
        source.loop = isLooping;
        if (isLooping) {
          source.loopStart = 0;
          source.loopEnd = Math.min(buffer.duration, durationLimit);
        }

        const gain = ctx.createGain();
        const filterNodes = this.buildEffectChain(ctx, track.audioEffect, source, gain);
        gain.connect(ctx.destination);

        const playDuration = Math.max(0.1, durationLimit);
        source.start(startTimeAudioCtx, 0, isLooping ? undefined : playDuration);

        this.channelA1 = {
          source,
          gainNode: gain,
          filterNodes,
          trackUrl: track.url,
          playStartTimeAudioCtx: startTimeAudioCtx,
          playOffsetSeconds: 0,
          isLooping,
          speed,
        };

        this.updateGainA1(track, startOffset, totalDuration);

        source.onended = () => {
          if (this.channelA1?.source === source) {
            this.channelA1 = null;
          }
        };
      } catch (err) {
        console.warn('Error scheduling future Channel A1:', err);
      }
      return;
    }

    if (relativeTime > audioTrimDuration && !isLooping) {
      this.stopChannelA1();
      return;
    }

    const rawOffset = isLooping ? (relativeTime % durationLimit) : relativeTime;
    const offsetInAudio = Math.max(0, Math.min(Math.max(0, buffer.duration - 0.05), rawOffset));

    // Smooth drift check: if playing and aligned within 0.2s, just update volume
    if (this.channelA1 && this.channelA1.source && this.channelA1.trackUrl === track.url) {
      const elapsedSinceStart = (ctx.currentTime - this.channelA1.playStartTimeAudioCtx) * speed;
      const estimatedAudioTime = this.channelA1.playOffsetSeconds + elapsedSinceStart;
      const drift = Math.abs(estimatedAudioTime - offsetInAudio);
      if (drift < 0.25) {
        this.updateGainA1(track, currentTimeSeconds, totalDuration);
        return;
      }
    }

    // Restart A1 at exact offset
    this.stopChannelA1();

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = speed;
      source.loop = isLooping;
      if (isLooping) {
        source.loopStart = 0;
        source.loopEnd = Math.min(buffer.duration, durationLimit);
      }

      const gain = ctx.createGain();
      const filterNodes = this.buildEffectChain(ctx, track.audioEffect, source, gain);
      gain.connect(ctx.destination);

      const playDuration = Math.max(0.1, durationLimit - offsetInAudio);
      source.start(0, offsetInAudio, isLooping ? undefined : playDuration);

      this.channelA1 = {
        source,
        gainNode: gain,
        filterNodes,
        trackUrl: track.url,
        playStartTimeAudioCtx: ctx.currentTime,
        playOffsetSeconds: offsetInAudio,
        isLooping,
        speed,
      };

      this.updateGainA1(track, currentTimeSeconds, totalDuration);

      source.onended = () => {
        if (this.channelA1?.source === source) {
          this.channelA1 = null;
        }
      };
    } catch (err) {
      console.warn('Error starting Channel A1:', err);
    }
  }

  /**
   * Update gain envelope for Channel A1 (with smart Auto-Ducking when Voiceover is speaking)
   */
  private updateGainA1(track: VideoAudioTrack, currentTimeSeconds: number, totalDuration: number) {
    if (!this.channelA1?.gainNode || !this.ctx) return;

    const now = this.ctx.currentTime;
    const gainParam = this.channelA1.gainNode.gain;
    gainParam.cancelScheduledValues(now);

    if (track.isMuted) {
      gainParam.setValueAtTime(0, now);
      return;
    }

    let baseVol = Math.max(0, Math.min(1, track.volume ?? 0.85));

    // Smart Auto-Ducking: If Voiceover is speaking, duck music down by 50%
    if (this.isTtsSpeaking) {
      baseVol *= 0.45;
    }

    const startOffset = track.startOffset || 0;
    const timeInAudio = Math.max(0, currentTimeSeconds - startOffset);
    const speed = track.speed || 1;
    const fadeIn = track.fadeIn || 0;
    const fadeOut = track.fadeOut || 0;
    const audioLen = track.duration || (totalDuration - startOffset);
    const timeLeftInAudio = Math.max(0, audioLen - timeInAudio);
    const timeLeftInVideo = Math.max(0, totalDuration - currentTimeSeconds);
    const playRemaining = Math.min(timeLeftInAudio, timeLeftInVideo);

    if (fadeIn > 0 && timeInAudio < fadeIn) {
      const currentStart = baseVol * (timeInAudio / fadeIn);
      gainParam.setValueAtTime(Math.max(0.0001, currentStart), now);
      const rampTime = (fadeIn - timeInAudio) / speed;
      gainParam.linearRampToValueAtTime(baseVol, now + rampTime);
    } else {
      gainParam.setValueAtTime(baseVol, now);
    }

    if (fadeOut > 0 && playRemaining > fadeOut) {
      const fadeStartAudioCtx = now + (playRemaining - fadeOut) / speed;
      gainParam.setValueAtTime(baseVol, Math.max(now, fadeStartAudioCtx));
      gainParam.linearRampToValueAtTime(0.0001, now + playRemaining / speed);
    }
  }

  /**
   * Channel A2: Voiceover / Locución playback and sync (TTS or Audio File)
   */
  private async syncVoiceoverChannel(
    voTrack: VoiceoverTrack | null | undefined,
    currentTimeSeconds: number,
    isPlaying: boolean,
    totalDuration: number
  ) {
    if (!voTrack || !isPlaying || voTrack.isMuted || (voTrack.volume ?? 1) <= 0) {
      this.stopChannelA2();
      return;
    }

    const startOffset = voTrack.startOffset || 0;
    const voDuration = voTrack.duration || (totalDuration - startOffset);
    const timeInVo = currentTimeSeconds - startOffset;

    // CASE 1: Audio file (uploaded MP3/WAV, blob, or audio URL)
    const isRealAudioFile =
      voTrack.audioUrl &&
      !voTrack.audioUrl.startsWith('voiceover://') &&
      voTrack.audioUrl.trim().length > 0;

    // If voiceover starts in the future
    if (timeInVo < 0) {
      if (isRealAudioFile) {
        const ctx = this.getAudioContext();
        const buffer = await this.getAudioBuffer({ url: voTrack.audioUrl! });
        if (!buffer) {
          this.stopChannelA2();
          return;
        }

        const speed = voTrack.rate || 1;
        const delay = (startOffset - currentTimeSeconds) / speed;
        const startTimeAudioCtx = ctx.currentTime + delay;

        if (this.channelA2Voice && this.channelA2Voice.source && this.channelA2Voice.trackUrl === voTrack.audioUrl) {
          const drift = Math.abs(this.channelA2Voice.playStartTimeAudioCtx - startTimeAudioCtx);
          if (drift < 0.2) return;
        }

        this.stopChannelA2();

        try {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = speed;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(voTrack.volume ?? 1, startTimeAudioCtx);
          source.connect(gain);
          gain.connect(ctx.destination);

          source.start(startTimeAudioCtx, 0, buffer.duration);

          this.channelA2Voice = {
            source,
            gainNode: gain,
            filterNodes: [],
            trackUrl: voTrack.audioUrl!,
            playStartTimeAudioCtx: startTimeAudioCtx,
            playOffsetSeconds: 0,
            isLooping: false,
            speed,
          };

          source.onended = () => {
            if (this.channelA2Voice?.source === source) {
              this.channelA2Voice = null;
              this.isTtsSpeaking = false;
            }
          };
        } catch (err) {
          console.warn('Error scheduling future voiceover channel:', err);
        }
        return;
      }

      this.stopChannelA2();
      return;
    }

    // Already ended
    if (timeInVo > voDuration) {
      this.stopChannelA2();
      return;
    }

    if (isRealAudioFile) {
      const ctx = this.getAudioContext();
      const buffer = await this.getAudioBuffer({ url: voTrack.audioUrl! });
      if (!buffer) {
        this.stopChannelA2();
        return;
      }

      const speed = voTrack.rate || 1;
      const offsetInAudio = Math.max(0, Math.min(buffer.duration - 0.05, timeInVo));

      if (this.channelA2Voice && this.channelA2Voice.source && this.channelA2Voice.trackUrl === voTrack.audioUrl) {
        const elapsedSinceStart = (ctx.currentTime - this.channelA2Voice.playStartTimeAudioCtx) * speed;
        const estimatedVoTime = this.channelA2Voice.playOffsetSeconds + elapsedSinceStart;
        if (Math.abs(estimatedVoTime - offsetInAudio) < 0.25) {
          if (this.channelA2Voice.gainNode) {
            this.channelA2Voice.gainNode.gain.setValueAtTime(voTrack.volume ?? 1, ctx.currentTime);
          }
          this.isTtsSpeaking = true;
          return;
        }
      }

      this.stopChannelA2();

      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = speed;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(voTrack.volume ?? 1, ctx.currentTime);
        source.connect(gain);
        gain.connect(ctx.destination);

        const playDur = Math.max(0.1, buffer.duration - offsetInAudio);
        source.start(0, offsetInAudio, playDur);

        this.channelA2Voice = {
          source,
          gainNode: gain,
          filterNodes: [],
          trackUrl: voTrack.audioUrl!,
          playStartTimeAudioCtx: ctx.currentTime,
          playOffsetSeconds: offsetInAudio,
          isLooping: false,
          speed,
        };

        this.isTtsSpeaking = true;

        source.onended = () => {
          if (this.channelA2Voice?.source === source) {
            this.channelA2Voice = null;
            this.isTtsSpeaking = false;
          }
        };
      } catch (err) {
        console.warn('Error playing voiceover audio:', err);
      }
      return;
    }

    // CASE 2: Text-To-Speech (Web Speech Synthesis)
    const scriptText = voTrack.scriptText || voTrack.text;
    if (scriptText && scriptText.trim()) {
      // If playhead was scrubbed back or restarted near beginning, allow re-trigger
      if (timeInVo < 0.3) {
        this.lastTtsSpokenId = null;
      }

      // If within speech range and hasn't spoken for this track run
      const trackUid = `${voTrack.id || 'vo'}-${scriptText.slice(0, 15)}`;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (!this.isTtsSpeaking && this.lastTtsSpokenId !== trackUid && timeInVo >= 0 && timeInVo <= 1.5) {
          this.lastTtsSpokenId = trackUid;
          try {
            window.speechSynthesis.cancel();
          } catch {}

          const utterance = new SpeechSynthesisUtterance(scriptText);
          utterance.lang = voTrack.language || 'es-ES';
          utterance.rate = voTrack.rate || 1.05;
          utterance.pitch = voTrack.pitch || 1.0;
          utterance.volume = voTrack.volume ?? 1.0;

          if (voTrack.voiceName) {
            const voices = window.speechSynthesis.getVoices();
            const matching = voices.find((v) => v.name === voTrack.voiceName || v.voiceURI === voTrack.voiceName);
            if (matching) utterance.voice = matching;
          }

          utterance.onstart = () => {
            this.isTtsSpeaking = true;
          };
          utterance.onend = () => {
            this.isTtsSpeaking = false;
          };
          utterance.onerror = () => {
            this.isTtsSpeaking = false;
          };

          this.ttsCurrentUtterance = utterance;
          try {
            window.speechSynthesis.speak(utterance);
          } catch (speakErr) {
            console.warn('Error initiating speech synthesis:', speakErr);
          }
        }
      }
    }
  }

  /**
   * Channel A3 & A4: Extra audio tracks (SFX, Ambient, Secondary music)
   */
  private async syncExtraChannels(
    extraTracks: VideoAudioTrack[],
    currentTimeSeconds: number,
    isPlaying: boolean,
    totalDuration: number
  ) {
    if (!extraTracks || extraTracks.length === 0 || !isPlaying) {
      this.stopAllExtraChannels();
      return;
    }

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const activeTrackKeys = new Set<string>();

    for (const track of extraTracks) {
      const trackKey = track.id || `${track.url}-${track.startOffset || 0}`;
      activeTrackKeys.add(trackKey);

      if (track.isMuted || (track.volume ?? 1) <= 0) {
        this.stopExtraChannel(trackKey);
        continue;
      }

      const startOffset = track.startOffset || 0;
      const speed = track.speed || 1;
      const buffer = await this.getAudioBuffer(track);
      if (!buffer) {
        this.stopExtraChannel(trackKey);
        continue;
      }

      const trimDur = track.duration || buffer.duration;
      const isLoop = !!track.loop;

      // Case 1: Clip is scheduled to start in the future relative to currentTimeSeconds
      if (currentTimeSeconds < startOffset) {
        const delaySec = (startOffset - currentTimeSeconds) / speed;
        const startTimeAudioCtx = ctx.currentTime + delaySec;

        const existing = this.channelExtra.get(trackKey);
        if (existing && existing.source && existing.trackUrl === track.url) {
          const expectedDiff = Math.abs(existing.playStartTimeAudioCtx - startTimeAudioCtx);
          if (expectedDiff < 0.2) {
            if (existing.gainNode) {
              existing.gainNode.gain.setValueAtTime(track.volume ?? 0.95, ctx.currentTime);
            }
            continue;
          }
        }

        this.stopExtraChannel(trackKey);

        try {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = speed;
          source.loop = isLoop;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(track.volume ?? 0.95, startTimeAudioCtx);
          source.connect(gain);
          gain.connect(ctx.destination);

          source.start(startTimeAudioCtx, 0, isLoop ? undefined : trimDur);

          this.channelExtra.set(trackKey, {
            source,
            gainNode: gain,
            filterNodes: [],
            trackUrl: track.url,
            playStartTimeAudioCtx: startTimeAudioCtx,
            playOffsetSeconds: 0,
            isLooping: isLoop,
            speed,
          });

          source.onended = () => {
            if (this.channelExtra.get(trackKey)?.source === source) {
              this.channelExtra.delete(trackKey);
            }
          };
        } catch (err) {
          console.warn(`Error scheduling future extra channel ${trackKey}:`, err);
        }
        continue;
      }

      // Case 2: Clip has already finished in the past
      const relTime = currentTimeSeconds - startOffset;
      if (relTime >= trimDur && !isLoop) {
        this.stopExtraChannel(trackKey);
        continue;
      }

      // Case 3: Clip should be playing right now (active)
      const durationLimit = trimDur || buffer.duration;
      const rawOffset = isLoop ? (relTime % durationLimit) : relTime;
      const offsetInAudio = Math.max(0, Math.min(buffer.duration - 0.05, rawOffset));

      const existing = this.channelExtra.get(trackKey);
      if (existing && existing.source && existing.trackUrl === track.url) {
        const elapsed = (ctx.currentTime - existing.playStartTimeAudioCtx) * speed;
        const estTime = existing.playOffsetSeconds + elapsed;
        if (Math.abs(estTime - offsetInAudio) < 0.25) {
          if (existing.gainNode) {
            existing.gainNode.gain.setValueAtTime(track.volume ?? 0.95, ctx.currentTime);
          }
          continue;
        }
      }

      this.stopExtraChannel(trackKey);

      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = speed;
        source.loop = isLoop;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(track.volume ?? 0.95, ctx.currentTime);
        source.connect(gain);
        gain.connect(ctx.destination);

        const playDur = Math.max(0.05, trimDur - offsetInAudio);
        source.start(0, offsetInAudio, isLoop ? undefined : playDur);

        this.channelExtra.set(trackKey, {
          source,
          gainNode: gain,
          filterNodes: [],
          trackUrl: track.url,
          playStartTimeAudioCtx: ctx.currentTime,
          playOffsetSeconds: offsetInAudio,
          isLooping: isLoop,
          speed,
        });

        source.onended = () => {
          if (this.channelExtra.get(trackKey)?.source === source) {
            this.channelExtra.delete(trackKey);
          }
        };
      } catch (err) {
        console.warn(`Error playing current extra channel ${trackKey}:`, err);
      }
    }

    // Stop any stale channels that are no longer in extraTracks
    for (const [key] of this.channelExtra.entries()) {
      if (!activeTrackKeys.has(key)) {
        this.stopExtraChannel(key);
      }
    }
  }

  /**
   * Wrapper for syncPlayback supporting music + voiceover + extra tracks
   */
  public async syncPlayback(
    track: VideoAudioTrack | null,
    currentTimeSeconds: number,
    isPlaying: boolean,
    totalVideoDuration: number = 30,
    voiceoverTrack?: VoiceoverTrack | null,
    extraTracks: VideoAudioTrack[] = []
  ) {
    return this.syncMultiTrackPlayback({
      trackA1: track,
      voiceoverTrack,
      extraTracks,
      currentTimeSeconds,
      isPlaying,
      totalDuration: totalVideoDuration,
    });
  }

  /**
   * Audition / Preview a sample of any audio track or SFX
   */
  public async previewSample(track: VideoAudioTrack, durationSeconds: number = 3.5) {
    const ctx = await this.resumeContext();
    this.stop();
    const buffer = await this.getAudioBuffer(track);
    if (!buffer) return;

    const actualDur = Math.min(buffer.duration, Math.max(0.1, durationSeconds));

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      const vol = Math.max(0.2, track.volume ?? 0.95);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      const fadeStart = Math.max(0, actualDur - 0.04);
      gain.gain.setValueAtTime(vol, ctx.currentTime + fadeStart);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + actualDur);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0, 0, actualDur);

      this.channelA1 = {
        source,
        gainNode: gain,
        filterNodes: [],
        trackUrl: track.url,
        playStartTimeAudioCtx: ctx.currentTime,
        playOffsetSeconds: 0,
        isLooping: false,
        speed: 1,
      };
      this.isCurrentlyPlaying = true;

      source.onended = () => {
        if (this.channelA1?.source === source) {
          this.channelA1 = null;
          this.isCurrentlyPlaying = false;
        }
      };
    } catch (e) {
      console.warn('Error previewing sample:', e);
    }
  }

  /**
   * Stop all playback across all channels (A1, A2, A3, A4, TTS)
   */
  public stop() {
    this.stopChannelA1();
    this.stopChannelA2();
    this.stopAllExtraChannels();
    this.isCurrentlyPlaying = false;
    this.lastTtsSpokenId = null;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  public pause() {
    this.stop();
  }

  private stopChannelA1() {
    if (this.channelA1?.source) {
      try {
        this.channelA1.source.stop();
        this.channelA1.source.disconnect();
      } catch {}
    }
    if (this.channelA1?.gainNode) {
      try {
        this.channelA1.gainNode.disconnect();
      } catch {}
    }
    this.channelA1 = null;
  }

  private stopChannelA2() {
    if (this.channelA2Voice?.source) {
      try {
        this.channelA2Voice.source.stop();
        this.channelA2Voice.source.disconnect();
      } catch {}
    }
    if (this.channelA2Voice?.gainNode) {
      try {
        this.channelA2Voice.gainNode.disconnect();
      } catch {}
    }
    this.channelA2Voice = null;
    this.isTtsSpeaking = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  private stopExtraChannel(key: string) {
    const ch = this.channelExtra.get(key);
    if (ch) {
      try {
        ch.source?.stop();
        ch.source?.disconnect();
        ch.gainNode?.disconnect();
      } catch {}
      this.channelExtra.delete(key);
    }
  }

  private stopAllExtraChannels() {
    this.channelExtra.forEach((ch) => {
      try {
        ch.source?.stop();
        ch.source?.disconnect();
        ch.gainNode?.disconnect();
      } catch {}
    });
    this.channelExtra.clear();
  }
}

export const previewAudio = new PreviewAudioEngine();
