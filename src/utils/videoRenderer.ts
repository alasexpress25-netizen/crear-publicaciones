import { Slide, BrandInfo, AspectRatio, TransitionType, SceneMotionEffect, VideoAudioTrack, SubtitleItem, VoiceoverTrack } from '../types';
import { renderSlideToCanvas } from './exportUtils';
import { generateProceduralAudioBuffer, generateProceduralSFXBuffer } from './audioLibrary';
import { toBlob } from 'html-to-image';
import { apiSynthesizeVoiceover } from '../services/api';

export interface RenderProgress {
  currentFrame: number;
  totalFrames: number;
  percent: number;
  currentSlideIndex: number;
  statusText: string;
}

export interface RenderOptions {
  aspectRatio: AspectRatio;
  quality: '720p' | '1080p' | '4k';
  fps?: number;
  audioTrack?: VideoAudioTrack | null;
  subtitles?: SubtitleItem[];
  voiceoverTrack?: VoiceoverTrack | null;
  extraAudioTracks?: VideoAudioTrack[];
  onProgress?: (p: RenderProgress) => void;
  shouldCancel?: () => boolean;
}

export interface RenderResult {
  blob: Blob;
  url: string;
  durationSeconds: number;
  mimeType: string;
  filename: string;
}

// Resolution map based on AspectRatio and Quality
export function getVideoDimensions(aspect: AspectRatio, quality: '720p' | '1080p' | '4k' = '1080p') {
  const base1080: Record<AspectRatio, { width: number; height: number }> = {
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '4:5': { width: 1080, height: 1350 },
    '1:1': { width: 1080, height: 1080 },
  };

  const base = base1080[aspect] || base1080['16:9'];
  const multiplier = quality === '4k' ? 2 : quality === '720p' ? 0.666 : 1;

  // Ensure dimensions are even numbers for encoder compatibility
  let w = Math.round(base.width * multiplier);
  let h = Math.round(base.height * multiplier);
  if (w % 2 !== 0) w += 1;
  if (h % 2 !== 0) h += 1;

  return { width: w, height: h };
}

/**
 * Capture or render a slide to an HTMLImageElement for high-speed offline frame compositing.
 */
export async function prepareSlideBitmap(
  slide: Slide,
  brand: BrandInfo,
  aspectRatio: AspectRatio,
  domElement?: HTMLElement | null
): Promise<HTMLImageElement> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataUrl = '';
      if (domElement) {
        try {
          const blob = await toBlob(domElement, {
            pixelRatio: 2,
            cacheBust: true,
            skipFonts: true,
            filter: (node) => {
              if (node instanceof HTMLElement) {
                if (node.classList.contains('no-export') || node.getAttribute('data-no-export') === 'true') {
                  return false;
                }
              }
              return true;
            },
          });
          if (blob) {
            dataUrl = URL.createObjectURL(blob);
          }
        } catch (domErr) {
          console.warn('DOM capture fallback to canvas', domErr);
        }
      }

      if (!dataUrl) {
        const canvas = await renderSlideToCanvas(slide, brand, aspectRatio, 2);
        dataUrl = canvas.toDataURL('image/png');
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo cargar la imagen de la diapositiva ${slide.id}`));
      img.src = dataUrl;
    } catch (err) {
      reject(err);
    }
  });
}

export interface SlideRenderAssets {
  slide: Slide;
  fullBitmap: HTMLImageElement;
  overlayBitmap: HTMLImageElement | null;
  videoElement: HTMLVideoElement | null;
  isVideo: boolean;
  videoLoaded: boolean;
}

/**
 * Prepares complete render assets for a slide, including HTMLVideoElements for dynamic video backgrounds
 * and transparent foreground overlays containing all typography, badges, cards, and custom elements.
 */
export async function prepareSlideAssets(
  slide: Slide,
  brand: BrandInfo,
  aspectRatio: AspectRatio,
  domElement?: HTMLElement | null
): Promise<SlideRenderAssets> {
  const isVideo = slide.mediaType === 'video' && Boolean(slide.image);
  let videoEl: HTMLVideoElement | null = null;
  let videoLoaded = false;
  let overlayImg: HTMLImageElement | null = null;

  // 1. Prepare video element if slide has a video background
  if (isVideo && slide.image) {
    try {
      videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.preload = 'auto';
      videoEl.src = slide.image;

      await new Promise<void>((resolve) => {
        let done = false;
        const onReady = () => {
          if (!done) {
            done = true;
            videoLoaded = true;
            cleanup();
            resolve();
          }
        };
        const onFail = () => {
          if (!done) {
            done = true;
            cleanup();
            resolve();
          }
        };
        const cleanup = () => {
          videoEl?.removeEventListener('loadeddata', onReady);
          videoEl?.removeEventListener('canplay', onReady);
          videoEl?.removeEventListener('error', onFail);
        };
        videoEl?.addEventListener('loadeddata', onReady);
        videoEl?.addEventListener('canplay', onReady);
        videoEl?.addEventListener('error', onFail);
        setTimeout(onReady, 3500); // 3.5s timeout safety fallback
      });
    } catch (err) {
      console.warn('Video background element notice:', err);
    }
  }

  // 2. Capture transparent overlay of text, cards, and UI elements (excluding video and base background)
  if (isVideo && domElement) {
    try {
      const overlayBlob = await toBlob(domElement, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains('no-export') || node.getAttribute('data-no-export') === 'true') {
              return false;
            }
            if (node.getAttribute('data-is-media') === 'true') {
              return false; // Skip video/image element
            }
            if (node.getAttribute('data-is-bg-base') === 'true') {
              return false; // Skip background color base
            }
            if (node.getAttribute('data-is-overlay') === 'true') {
              return false; // Skip dark overlay div (composited separately on canvas)
            }
          }
          return true;
        },
      });

      if (overlayBlob) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((res) => {
          img.onload = () => res();
          img.onerror = () => res();
          img.src = URL.createObjectURL(overlayBlob);
        });
        overlayImg = img;
      }
    } catch (overlayErr) {
      console.warn('Overlay DOM extraction fallback:', overlayErr);
    }
  }

  // 3. Fallback: complete static bitmap capture
  const fullBitmap = await prepareSlideBitmap(slide, brand, aspectRatio, domElement);

  return {
    slide,
    fullBitmap,
    overlayBitmap: overlayImg,
    videoElement: videoEl,
    isVideo,
    videoLoaded: Boolean(videoEl && videoLoaded),
  };
}

/**
 * Calculate timeline layout in seconds
 */
export function calculateTimelineInfo(slides: Slide[]) {
  const defaultSlideDuration = 3.5;
  const defaultTransitionDuration = 0.6;

  let totalTime = 0;
  const slideTimings = slides.map((s) => {
    const rawDur = s.duration || defaultSlideDuration;
    const speed = s.speed || 1;
    const duration = Math.max(1, rawDur / speed);
    const transType = s.transition || 'crossfade';
    const transDur = transType !== 'none'
      ? Math.min(duration * 0.4, s.transitionDuration || defaultTransitionDuration)
      : 0;

    const startTime = totalTime;
    totalTime += duration;
    const endTime = totalTime;

    return {
      slideId: s.id,
      duration,
      transDur,
      startTime,
      endTime,
      transition: transType,
      effect: s.effect || 'ken_burns_zoom_in',
    };
  });

  return { totalTime, slideTimings };
}

function drawSubtitleOnCanvas(
  ctx: CanvasRenderingContext2D,
  sub: SubtitleItem,
  cw: number,
  ch: number
) {
  ctx.save();
  const text = (sub.text || '').trim();
  if (!text) {
    ctx.restore();
    return;
  }

  const preset = sub.stylePreset || 'hormozi';
  const fontSize = Math.round(cw * (preset === 'hormozi' ? 0.046 : 0.04));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, sans-serif`;

  const yPos = ch * 0.82;
  const xPos = cw / 2;

  if (preset === 'hormozi') {
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(6, Math.round(fontSize * 0.22));
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text.toUpperCase(), xPos, yPos);

    ctx.fillStyle = '#fde047'; // Hormozi vibrant yellow
    ctx.fillText(text.toUpperCase(), xPos, yPos);
  } else if (preset === 'neon') {
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 16;
    ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.16));
    ctx.strokeStyle = '#083344';
    ctx.strokeText(text.toUpperCase(), xPos, yPos);

    ctx.fillStyle = '#67e8f9';
    ctx.fillText(text.toUpperCase(), xPos, yPos);
  } else if (preset === 'box') {
    const metrics = ctx.measureText(text.toUpperCase());
    const boxW = metrics.width + fontSize * 1.4;
    const boxH = fontSize * 1.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(xPos - boxW / 2, yPos - boxH / 2, boxW, boxH, fontSize * 0.25);
    } else {
      ctx.rect(xPos - boxW / 2, yPos - boxH / 2, boxW, boxH);
    }
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.fillText(text.toUpperCase(), xPos, yPos);
  } else {
    // Classic / Clean Subtitle
    const metrics = ctx.measureText(text);
    const boxW = metrics.width + fontSize * 1.4;
    const boxH = fontSize * 1.5;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(xPos - boxW / 2, yPos - boxH / 2, boxW, boxH, fontSize * 0.35);
    } else {
      ctx.rect(xPos - boxW / 2, yPos - boxH / 2, boxW, boxH);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, xPos, yPos);
  }

  ctx.restore();
}

/**
 * Render complete video with transitions, motion effects, and audio
 */
export async function renderCarouselToVideo(
  slides: Slide[],
  brand: BrandInfo,
  options: RenderOptions,
  slideDomMap?: Record<number, HTMLElement | null>
): Promise<RenderResult> {
  const fps = options.fps || 30;
  const dims = getVideoDimensions(options.aspectRatio, options.quality);
  const { totalTime, slideTimings } = calculateTimelineInfo(slides);

  options.onProgress?.({
    currentFrame: 0,
    totalFrames: Math.ceil(totalTime * fps),
    percent: 2,
    currentSlideIndex: 0,
    statusText: 'Preparando fotogramas y escenas...',
  });

  // 1. Prepare assets (videos, transparent overlays, and full bitmaps) for all slides
  const slideAssets: SlideRenderAssets[] = [];
  for (let i = 0; i < slides.length; i++) {
    if (options.shouldCancel?.()) {
      throw new Error('Render cancelado por el usuario');
    }
    const s = slides[i];
    const dom = slideDomMap?.[s.id] || null;
    options.onProgress?.({
      currentFrame: 0,
      totalFrames: Math.ceil(totalTime * fps),
      percent: Math.round(5 + (i / slides.length) * 15),
      currentSlideIndex: i,
      statusText: s.mediaType === 'video'
        ? `Cargando video de fondo y capas de Diapositiva ${i + 1} de ${slides.length}...`
        : `Procesando Diapositiva ${i + 1} de ${slides.length}...`,
    });
    const assets = await prepareSlideAssets(s, brand, options.aspectRatio, dom);
    slideAssets.push(assets);
  }

  // 2. Setup offline rendering canvas
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D');

  // Fill initial background
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Audio Setup using Web Audio API
  let audioContext: AudioContext | null = null;
  let audioStreamNode: MediaStreamAudioDestinationNode | null = null;
  let audioSourceNode: AudioBufferSourceNode | null = null;
  let voSourceNode: AudioBufferSourceNode | null = null;
  const extraSourceNodes: { source: AudioBufferSourceNode; startOffset: number }[] = [];

  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioContext = new AudioCtxClass();
      audioStreamNode = audioContext.createMediaStreamDestination();

      let audioBuffer: AudioBuffer | null = null;

      if (options.audioTrack?.url) {
        if (options.audioTrack.url.startsWith('preset:')) {
          const presetId = options.audioTrack.url.replace('preset:', '');
          audioBuffer = generateProceduralAudioBuffer(audioContext, presetId, Math.max(30, totalTime + 2));
        } else {
          try {
            const resp = await fetch(options.audioTrack.url);
            const arrayBuf = await resp.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuf);
          } catch (fetchErr) {
            console.warn('Audio fetch error, falling back to preset', fetchErr);
            audioBuffer = generateProceduralAudioBuffer(audioContext, 'corporate_uplifting', Math.max(30, totalTime + 2));
          }
        }
      }

      if (audioBuffer) {
        const track = options.audioTrack;
        const gainNode = audioContext.createGain();
        const baseVolume = track?.isMuted ? 0 : (track?.volume ?? 0.85);
        gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);

        // Apply audio fade in/out envelopes
        if (track?.fadeIn && track.fadeIn > 0) {
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(baseVolume, audioContext.currentTime + track.fadeIn);
        }
        if (track?.fadeOut && track.fadeOut > 0 && totalTime > track.fadeOut) {
          const fadeStartTime = audioContext.currentTime + (totalTime - track.fadeOut);
          gainNode.gain.setValueAtTime(baseVolume, fadeStartTime);
          gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + totalTime);
        }

        // Auto-ducking during export if voiceover is present and active
        if (options.voiceoverTrack && !options.voiceoverTrack.isMuted && options.voiceoverTrack.scriptText) {
          const duckedVol = baseVolume * 0.28;
          const voDur = options.voiceoverTrack.duration || Math.min(totalTime, 10);
          gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(duckedVol, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(duckedVol, audioContext.currentTime + Math.max(0.4, voDur - 0.4));
          gainNode.gain.linearRampToValueAtTime(baseVolume, audioContext.currentTime + voDur);
        }

        audioSourceNode = audioContext.createBufferSource();
        audioSourceNode.buffer = audioBuffer;
        audioSourceNode.playbackRate.value = track?.speed || 1;
        audioSourceNode.loop = track?.loop !== false; // Loop by default or user preference

        // Apply DSP audio filter effects
        let lastNode: AudioNode = audioSourceNode;
        if (track?.audioEffect === 'bass_boost') {
          const lowShelf = audioContext.createBiquadFilter();
          lowShelf.type = 'lowshelf';
          lowShelf.frequency.value = 100;
          lowShelf.gain.value = 7.5;
          lastNode.connect(lowShelf);
          lastNode = lowShelf;
        } else if (track?.audioEffect === 'lowpass_filter') {
          const lpf = audioContext.createBiquadFilter();
          lpf.type = 'lowpass';
          lpf.frequency.value = 850;
          lastNode.connect(lpf);
          lastNode = lpf;
        } else if (track?.audioEffect === 'vintage_radio') {
          const bpf = audioContext.createBiquadFilter();
          bpf.type = 'bandpass';
          bpf.frequency.value = 1600;
          bpf.Q.value = 2.0;
          lastNode.connect(bpf);
          lastNode = bpf;
        } else if (track?.audioEffect === 'high_energy') {
          const highs = audioContext.createBiquadFilter();
          highs.type = 'highshelf';
          highs.frequency.value = 4000;
          highs.gain.value = 4.5;
          lastNode.connect(highs);
          lastNode = highs;
        }

        lastNode.connect(gainNode);
        gainNode.connect(audioStreamNode);
      }

      // Voiceover Track Mixing (Track A2)
      if (options.voiceoverTrack && !options.voiceoverTrack.isMuted) {
        let voBuffer: AudioBuffer | null = null;
        let voAudioUrl = options.voiceoverTrack.audioUrl;

        // If voiceover is TTS without a pre-rendered audio file, synthesize it on the fly!
        const needsSynthesis = (!voAudioUrl || voAudioUrl === 'voiceover://tts' || voAudioUrl.startsWith('voiceover://')) &&
          Boolean(options.voiceoverTrack.scriptText?.trim());

        if (needsSynthesis) {
          try {
            if (options.onProgress) {
              options.onProgress({
                currentFrame: 0,
                totalFrames: Math.ceil(totalTime * fps),
                percent: 3,
                currentSlideIndex: 0,
                statusText: 'Sintetizando locución de IA para el video...',
              });
            }
            const synthRes = await apiSynthesizeVoiceover({
              text: options.voiceoverTrack.scriptText!,
              voiceName: options.voiceoverTrack.voiceName || 'Kore',
              language: options.voiceoverTrack.language || 'es-ES',
            });
            if (synthRes && synthRes.audioUrl) {
              voAudioUrl = synthRes.audioUrl;
              options.voiceoverTrack.audioUrl = synthRes.audioUrl;
              if (synthRes.duration) {
                options.voiceoverTrack.duration = synthRes.duration;
              }
            }
          } catch (synthErr) {
            console.warn('Auto-synthesize voiceover error during export:', synthErr);
          }
        }

        if (voAudioUrl && !voAudioUrl.startsWith('voiceover://')) {
          try {
            const voResp = await fetch(voAudioUrl);
            const voArr = await voResp.arrayBuffer();
            voBuffer = await audioContext.decodeAudioData(voArr);
          } catch (voErr) {
            console.warn('Voiceover audio fetch/decode error:', voErr);
          }
        }

        if (voBuffer) {
          const voGainNode = audioContext.createGain();
          const voVol = options.voiceoverTrack.volume ?? 1.0;
          voGainNode.gain.setValueAtTime(voVol, audioContext.currentTime);

          voSourceNode = audioContext.createBufferSource();
          voSourceNode.buffer = voBuffer;
          voSourceNode.playbackRate.value = options.voiceoverTrack.rate || 1;
          voSourceNode.connect(voGainNode);
          voGainNode.connect(audioStreamNode);
        }
      }

      // Extra Audio Tracks Mixing (A3: SFX, A4: Ambiente / Sonido secundario)
      if (options.extraAudioTracks && options.extraAudioTracks.length > 0) {
        for (const extra of options.extraAudioTracks) {
          if (!extra.url || extra.isMuted) continue;
          let extraBuffer: AudioBuffer | null = null;
          if (extra.url.startsWith('sfx:')) {
            const sfxId = extra.url.replace('sfx:', '');
            extraBuffer = generateProceduralSFXBuffer(audioContext, sfxId);
          } else if (extra.url.startsWith('preset:')) {
            const presetId = extra.url.replace('preset:', '');
            extraBuffer = generateProceduralAudioBuffer(audioContext, presetId, Math.max(30, totalTime + 2));
          } else {
            try {
              const res = await fetch(extra.url);
              const ab = await res.arrayBuffer();
              extraBuffer = await audioContext.decodeAudioData(ab);
            } catch (err) {
              console.warn('Failed to load extra audio track buffer:', extra.name, err);
            }
          }

          if (extraBuffer) {
            const extraGainNode = audioContext.createGain();
            const vol = extra.volume ?? 0.85;
            extraGainNode.gain.setValueAtTime(vol, audioContext.currentTime);

            const src = audioContext.createBufferSource();
            src.buffer = extraBuffer;
            src.playbackRate.value = extra.speed || 1;
            src.loop = extra.loop === true;
            src.connect(extraGainNode);
            extraGainNode.connect(audioStreamNode);

            extraSourceNodes.push({
              source: src,
              startOffset: Math.max(0, extra.startOffset || 0),
            });
          }
        }
      }
    }
  } catch (audioErr) {
    console.warn('Audio setup notice:', audioErr);
  }

  // 4. Setup MediaRecorder with canvas stream and audio
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream();
  canvasStream.getVideoTracks().forEach((vt) => combinedStream.addTrack(vt));

  if (audioStreamNode) {
    audioStreamNode.stream.getAudioTracks().forEach((at) => combinedStream.addTrack(at));
  }

  // Detect supported mime type
  const mimeCandidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  let selectedMime = '';
  for (const candidate of mimeCandidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      selectedMime = candidate;
      break;
    }
  }

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMime || undefined,
    videoBitsPerSecond: options.quality === '4k' ? 16000000 : options.quality === '1080p' ? 8000000 : 4000000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(recordedChunks, { type: selectedMime || 'video/mp4' });
      resolve(finalBlob);
    };
    recorder.onerror = (e) => reject(e);
  });

  // Start recorder
  recorder.start(100);
  if (audioSourceNode) {
    try {
      audioSourceNode.start(0);
    } catch {}
  }
  if (voSourceNode) {
    try {
      const voOffset = options.voiceoverTrack?.startOffset || 0;
      voSourceNode.start(audioContext ? audioContext.currentTime + voOffset : 0);
    } catch (voStartErr) {
      console.warn('Error starting voiceover source node:', voStartErr);
    }
  }
  extraSourceNodes.forEach(({ source, startOffset }) => {
    try {
      source.start(audioContext ? audioContext.currentTime + startOffset : 0);
    } catch (e) {
      console.warn('Error starting extra source node:', e);
    }
  });

  // 5. Draw Frame Compositor Loop
  const totalFrames = Math.ceil(totalTime * fps);
  const frameIntervalMs = 1000 / fps;

  // Helper to seek video background to the exact timestamp needed for this frame
  const syncVideoTime = async (assets: SlideRenderAssets, timeInSlide: number) => {
    if (assets.isVideo && assets.videoElement && assets.videoLoaded) {
      const video = assets.videoElement;
      const dur = video.duration || 1;
      const speed = assets.slide.speed || 1;
      const targetTime = (timeInSlide * speed) % dur;
      if (Math.abs(video.currentTime - targetTime) > 0.035) {
        try {
          video.currentTime = targetTime;
          await new Promise<void>((res) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              res();
            };
            video.addEventListener('seeked', onSeeked);
            setTimeout(res, 45); // fast timeout so export remains smooth
          });
        } catch {}
      }
    }
  };

  const drawSlideLayer = (
    assets: SlideRenderAssets,
    effect: SceneMotionEffect,
    progress: number, // 0 to 1 across the slide duration
    alpha: number = 1
  ) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const cw = canvas.width;
    const ch = canvas.height;

    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;
    let rotation = 0;

    if (effect === 'ken_burns_zoom_in') {
      scale = 1.0 + progress * 0.12; // Zoom in 12%
    } else if (effect === 'ken_burns_zoom_out') {
      scale = 1.12 - progress * 0.12; // Zoom out 12%
    } else if (effect === 'pan_left_right') {
      scale = 1.06;
      translateX = (progress - 0.5) * (cw * 0.06); // Smooth pan
    } else if (effect === 'pan_right_left') {
      scale = 1.06;
      translateX = (0.5 - progress) * (cw * 0.06);
    } else if (effect === 'cinematic_float') {
      scale = 1.04;
      translateY = Math.sin(progress * Math.PI * 2) * (ch * 0.02);
      rotation = Math.sin(progress * Math.PI) * 0.008;
    } else if (effect === 'pulse') {
      scale = 1.0 + Math.sin(progress * Math.PI * 6) * 0.025;
    } else if (effect === 'fade_elements') {
      scale = 1.0 + progress * 0.03;
    } else if (effect === 'parallax_drift') {
      scale = 1.08;
      translateX = (progress - 0.5) * (cw * 0.04);
      translateY = (progress - 0.5) * (ch * 0.03);
      rotation = (progress - 0.5) * 0.015;
    } else if (effect === 'shaky_cam') {
      scale = 1.05;
      translateX = (Math.sin(progress * 48) * 0.6 + Math.cos(progress * 90) * 0.4) * (cw * 0.005);
      translateY = (Math.cos(progress * 52) * 0.6 + Math.sin(progress * 85) * 0.4) * (ch * 0.005);
    } else if (effect === 'tilt_perspective') {
      scale = 1.04;
      translateY = (progress - 0.5) * (ch * 0.015);
      rotation = (progress - 0.5) * 0.018;
    }

    const hasLiveVideo = assets.isVideo && assets.videoElement && assets.videoLoaded && assets.overlayBitmap;

    if (hasLiveVideo && assets.videoElement) {
      const video = assets.videoElement;
      const slide = assets.slide;

      // 1. Solid background base
      ctx.fillStyle = slide.backgroundColor || '#020617';
      ctx.fillRect(0, 0, cw, ch);

      // 2. Video frame with free motion, zoom and orientation
      ctx.save();
      ctx.translate(cw / 2 + translateX, ch / 2 + translateY);
      if (rotation !== 0) ctx.rotate(rotation);
      ctx.scale(scale, scale);

      const vw = video.videoWidth || cw;
      const vh = video.videoHeight || ch;
      const vRatio = vw / vh;
      const cRatio = cw / ch;

      let dw = cw;
      let dh = ch;
      if (vRatio > cRatio) {
        dh = ch;
        dw = dh * vRatio;
      } else {
        dw = cw;
        dh = dw / vRatio;
      }

      const zoom = slide.zoom || 1;
      const posX = slide.posX !== undefined ? slide.posX : 50;
      const posY = slide.posY !== undefined ? slide.posY : 50;
      const offX = ((posX - 50) * 0.6 * cw) / 100;
      const offY = ((posY - 50) * 0.6 * ch) / 100;

      dw *= zoom;
      dh *= zoom;

      if (slide.blur && slide.blur > 0) {
        ctx.filter = `blur(${slide.blur}px)`;
      }

      try {
        ctx.drawImage(video, -dw / 2 + offX, -dh / 2 + offY, dw, dh);
      } catch {
        ctx.drawImage(assets.fullBitmap, -cw / 2, -ch / 2, cw, ch);
      }
      ctx.restore();

      // 3. Dark Overlay
      const overlayIntensity = slide.overlayIntensity !== undefined ? slide.overlayIntensity : 85;
      const overlayOpacity = overlayIntensity / 100;
      if (slide.overlayType === 'solid') {
        ctx.fillStyle = `rgba(2, 6, 23, ${overlayOpacity})`;
        ctx.fillRect(0, 0, cw, ch);
      } else if (slide.overlayType === 'card') {
        ctx.fillStyle = `rgba(2, 6, 23, ${overlayOpacity * 0.75})`;
        ctx.fillRect(0, 0, cw, ch);
      } else {
        const grad = ctx.createLinearGradient(0, ch, 0, 0);
        grad.addColorStop(0, `rgba(2, 6, 23, ${overlayOpacity})`);
        grad.addColorStop(0.5, `rgba(2, 6, 23, ${overlayOpacity * 0.85})`);
        grad.addColorStop(1, `rgba(2, 6, 23, ${overlayOpacity * 0.45})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      }

      // 4. Foreground overlay (text, titles, cards, badges, graphics)
      ctx.save();
      ctx.translate(cw / 2 + translateX, ch / 2 + translateY);
      if (rotation !== 0) ctx.rotate(rotation);
      ctx.scale(scale, scale);
      if (assets.overlayBitmap) {
        ctx.drawImage(assets.overlayBitmap, -cw / 2, -ch / 2, cw, ch);
      }
      ctx.restore();
    } else {
      // Static image or fallback bitmap
      ctx.translate(cw / 2 + translateX, ch / 2 + translateY);
      if (rotation !== 0) ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.drawImage(assets.fullBitmap, -cw / 2, -ch / 2, cw, ch);
    }

    // RGB chromatic aberration / glitch pulse
    if (effect === 'rgb_glitch' && Math.sin(progress * Math.PI * 8) > 0.8) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.25;
      ctx.drawImage(hasLiveVideo && assets.overlayBitmap ? assets.overlayBitmap : assets.fullBitmap, -cw / 2 + 4, -ch / 2, cw, ch);
      ctx.restore();
    }

    // Vignette pulse
    if (effect === 'vignette_pulse') {
      const vigGrad = ctx.createRadialGradient(0, 0, cw * 0.35, 0, 0, cw * 0.7);
      const vigAlpha = 0.3 + Math.sin(progress * Math.PI * 4) * 0.15;
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, `rgba(0,0,0,${vigAlpha.toFixed(2)})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
    }

    ctx.restore();
  };

  // Render loop
  for (let frame = 0; frame < totalFrames; frame++) {
    if (options.shouldCancel?.()) {
      recorder.stop();
      if (audioSourceNode) try { audioSourceNode.stop(); } catch {}
      throw new Error('Render cancelado');
    }

    const currentTime = frame / fps;

    // Find current active slide timing
    let activeTimingIndex = 0;
    for (let i = 0; i < slideTimings.length; i++) {
      if (currentTime >= slideTimings[i].startTime && currentTime < slideTimings[i].endTime) {
        activeTimingIndex = i;
        break;
      }
      if (i === slideTimings.length - 1) {
        activeTimingIndex = i;
      }
    }

    const currentTiming = slideTimings[activeTimingIndex];
    const nextTiming = slideTimings[activeTimingIndex + 1];
    const currentAssets = slideAssets[activeTimingIndex];
    const nextAssets = nextTiming ? slideAssets[activeTimingIndex + 1] : null;

    const timeInSlide = currentTime - currentTiming.startTime;
    const slideProgress = Math.min(1, Math.max(0, timeInSlide / currentTiming.duration));

    // Synchronize video background time for current slide
    await syncVideoTime(currentAssets, timeInSlide);

    // Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const isTransitioning = nextAssets && currentTiming.transDur > 0 && timeInSlide >= (currentTiming.duration - currentTiming.transDur);

    if (!isTransitioning || !nextAssets) {
      // Single slide rendering
      drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1);
    } else {
      // Transition compositing
      const transProgress = (timeInSlide - (currentTiming.duration - currentTiming.transDur)) / currentTiming.transDur;
      const t = Math.max(0, Math.min(1, transProgress));
      const transitionType = currentTiming.transition;
      const nextTimeInSlide = t * currentTiming.transDur;

      // Synchronize video background time for incoming next slide
      await syncVideoTime(nextAssets, nextTimeInSlide);

      if (transitionType === 'crossfade') {
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1 - t);
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, t);
      } else if (transitionType === 'fade_black') {
        if (t < 0.5) {
          const fadeOutAlpha = 1 - t * 2;
          drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, fadeOutAlpha);
        } else {
          const fadeInAlpha = (t - 0.5) * 2;
          drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, fadeInAlpha);
        }
      } else if (transitionType === 'fade_white') {
        if (t < 0.5) {
          drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1);
          ctx.fillStyle = `rgba(255, 255, 255, ${t * 2})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, 1);
          ctx.fillStyle = `rgba(255, 255, 255, ${(1 - t) * 2})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (transitionType === 'slide_left') {
        ctx.save();
        ctx.translate(-canvas.width * t, 0);
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1);
        ctx.restore();

        ctx.save();
        ctx.translate(canvas.width * (1 - t), 0);
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, 1);
        ctx.restore();
      } else if (transitionType === 'slide_right') {
        ctx.save();
        ctx.translate(canvas.width * t, 0);
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1);
        ctx.restore();

        ctx.save();
        ctx.translate(-canvas.width * (1 - t), 0);
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, 1);
        ctx.restore();
      } else if (transitionType === 'slide_up') {
        ctx.save();
        ctx.translate(0, -canvas.height * t);
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1);
        ctx.restore();

        ctx.save();
        ctx.translate(0, canvas.height * (1 - t));
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, 1);
        ctx.restore();
      } else if (transitionType === 'slide_down') {
        ctx.save();
        ctx.translate(0, canvas.height * t);
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1);
        ctx.restore();

        ctx.save();
        ctx.translate(0, -canvas.height * (1 - t));
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, 1);
        ctx.restore();
      } else if (transitionType === 'zoom_in') {
        ctx.save();
        const scaleOut = 1 + t * 0.4;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scaleOut, scaleOut);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1 - t);
        ctx.restore();

        ctx.save();
        const scaleIn = 0.8 + t * 0.2;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scaleIn, scaleIn);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, t);
        ctx.restore();
      } else if (transitionType === 'zoom_out') {
        ctx.save();
        const scaleOut = 1 - t * 0.3;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scaleOut, scaleOut);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1 - t);
        ctx.restore();

        ctx.save();
        const scaleIn = 1.3 - t * 0.3;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scaleIn, scaleIn);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, t);
        ctx.restore();
      } else if (transitionType === 'wipe_left') {
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width * t, canvas.height);
        ctx.clip();
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, 1);
        ctx.restore();
      } else if (transitionType === 'wipe_right') {
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(canvas.width * (1 - t), 0, canvas.width * t, canvas.height);
        ctx.clip();
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, 1);
        ctx.restore();
      } else if (transitionType === 'spin_zoom') {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(t * 0.4);
        ctx.scale(1 + t * 0.5, 1 + t * 0.5);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1 - t);
        ctx.restore();

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((1 - t) * -0.4);
        ctx.scale(0.6 + t * 0.4, 0.6 + t * 0.4);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, t);
        ctx.restore();
      } else if (transitionType === 'light_leak') {
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1 - t);
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, t);
        // Golden lens flare flash
        const leakGrad = ctx.createRadialGradient(canvas.width * t, canvas.height * 0.3, 20, canvas.width * t, canvas.height * 0.3, canvas.width * 0.8);
        const flashAlpha = Math.sin(t * Math.PI) * 0.7;
        leakGrad.addColorStop(0, `rgba(255, 230, 180, ${flashAlpha})`);
        leakGrad.addColorStop(0.5, `rgba(255, 140, 50, ${flashAlpha * 0.5})`);
        leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = leakGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Fallback crossfade
        drawSlideLayer(currentAssets, currentTiming.effect, slideProgress, 1 - t);
        drawSlideLayer(nextAssets, nextTiming.effect, t * 0.15, t);
      }
    }

    // 5. Draw Dynamic Multi-track Subtitles / Captions if active at currentTime
    if (options.subtitles && options.subtitles.length > 0) {
      const activeSub = options.subtitles.find(
        (s) => currentTime >= s.startTime && currentTime <= s.endTime
      );
      if (activeSub && activeSub.text) {
        drawSubtitleOnCanvas(ctx, activeSub, canvas.width, canvas.height);
      }
    }

    // Yield control to let MediaRecorder record the frame
    await new Promise((r) => setTimeout(r, frameIntervalMs));

    if (frame % 5 === 0 || frame === totalFrames - 1) {
      const renderPercent = Math.round(20 + (frame / totalFrames) * 78);
      options.onProgress?.({
        currentFrame: frame + 1,
        totalFrames,
        percent: renderPercent,
        currentSlideIndex: activeTimingIndex,
        statusText: `Codificando video en tiempo real: ${Math.round((currentTime / totalTime) * 100)}% (${currentTime.toFixed(1)}s / ${totalTime.toFixed(1)}s)`,
      });
    }
  }

  // Wait a small buffer before stopping
  await new Promise((r) => setTimeout(r, 200));

  options.onProgress?.({
    currentFrame: totalFrames,
    totalFrames,
    percent: 99,
    currentSlideIndex: slides.length - 1,
    statusText: 'Finalizando archivo de video y pistas de audio...',
  });

  recorder.stop();
  if (audioSourceNode) {
    try { audioSourceNode.stop(); } catch {}
  }
  if (audioContext) {
    try { audioContext.close(); } catch {}
  }

  const finalBlob = await recordingPromise;
  const videoUrl = URL.createObjectURL(finalBlob);

  const cleanBrand = (brand.name || 'carrusel-video').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const extension = selectedMime.includes('mp4') ? 'mp4' : 'webm';
  const filename = `${cleanBrand}_${options.aspectRatio.replace(':', 'x')}_${Date.now()}.${extension}`;

  return {
    blob: finalBlob,
    url: videoUrl,
    durationSeconds: totalTime,
    mimeType: selectedMime || 'video/mp4',
    filename,
  };
}
