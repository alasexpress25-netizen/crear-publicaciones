import React from 'react';
import { Slide, BrandInfo, AspectRatio, TransitionType, SceneMotionEffect, SubtitleItem } from '../types';
import { CanvasSlide } from '../components/CanvasSlide';

export interface TransitionState {
  isTransitioning: boolean;
  slideIndexA: number;
  slideIndexB: number;
  slideA: Slide;
  slideB: Slide;
  progress: number; // 0 to 1
  type: TransitionType;
  effectA: SceneMotionEffect;
  effectB: SceneMotionEffect;
  progA: number; // Progress within slide A's motion effect
  progB: number; // Progress within slide B's motion effect
  timeInA?: number; // Exact second in slide A
  timeInB?: number; // Exact second in slide B
}

/**
 * Calculates current playback slide and transition state at any given timestamp
 */
export function getActiveTransitionState(slides: Slide[], currentTime: number): TransitionState {
  if (!slides || slides.length === 0) {
    const emptySlide: Slide = {
      id: 1,
      badge: '',
      subtag: '',
      title: '',
      body: '',
      cta: '',
      image: '',
    };
    return {
      isTransitioning: false,
      slideIndexA: 0,
      slideIndexB: 0,
      slideA: emptySlide,
      slideB: emptySlide,
      progress: 0,
      type: 'none',
      effectA: 'none',
      effectB: 'none',
      progA: 0,
      progB: 0,
    };
  }

  // Precompute exact slide timings
  let accumulated = 0;
  const timings = slides.map((s, idx) => {
    const rawDur = s.duration || 3.5;
    const speed = s.speed || 1;
    const dur = Math.max(1, rawDur / speed);
    const start = accumulated;
    accumulated += dur;
    const end = accumulated;

    const transType = s.transition || 'crossfade';
    const transDur = idx < slides.length - 1 && transType !== 'none'
      ? Math.min(1.0, dur * 0.35, s.transitionDuration || 0.8)
      : 0;

    return {
      index: idx,
      slide: s,
      dur,
      start,
      end,
      transType,
      transDur,
    };
  });

  // Calculate seamless visible windows [visibleStart, visibleEnd] for each slide
  // Slide i becomes visible when the previous slide begins transitioning into it
  const visibleWindows = timings.map((t, idx) => {
    const prev = idx > 0 ? timings[idx - 1] : null;
    const transInDur = prev && prev.transDur > 0 ? prev.transDur : 0;
    const visibleStart = t.start - transInDur;
    const visibleEnd = t.end;
    const totalVisibleDur = Math.max(0.1, visibleEnd - visibleStart);
    return { visibleStart, visibleEnd, totalVisibleDur };
  });

  // Check if currentTime is within an active transition between slide i and slide i+1
  for (let i = 0; i < timings.length - 1; i++) {
    const t = timings[i];
    if (t.transDur > 0) {
      const tStart = t.end - t.transDur;
      const tEnd = t.end;
      if (currentTime >= tStart && currentTime < tEnd) {
        const transProgress = Math.max(0, Math.min(1, (currentTime - tStart) / t.transDur));
        const winA = visibleWindows[i];
        const winB = visibleWindows[i + 1];
        const progA = Math.max(0, Math.min(1, (currentTime - winA.visibleStart) / winA.totalVisibleDur));
        const progB = Math.max(0, Math.min(1, (currentTime - winB.visibleStart) / winB.totalVisibleDur));
        const timeInA = currentTime - t.start;
        const timeInB = currentTime - tStart;

        return {
          isTransitioning: true,
          slideIndexA: i,
          slideIndexB: i + 1,
          slideA: t.slide,
          slideB: timings[i + 1].slide,
          progress: transProgress,
          type: t.transType as TransitionType,
          effectA: (t.slide.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
          effectB: (timings[i + 1].slide.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
          progA,
          progB,
          timeInA,
          timeInB,
        };
      }
    }
  }

  // Inside current slide, not in transition
  for (let i = 0; i < timings.length; i++) {
    const t = timings[i];
    if (currentTime >= t.start && currentTime < t.end) {
      const win = visibleWindows[i];
      const prog = Math.max(0, Math.min(1, (currentTime - win.visibleStart) / win.totalVisibleDur));
      const timeInSlide = currentTime - t.start;

      return {
        isTransitioning: false,
        slideIndexA: i,
        slideIndexB: i,
        slideA: t.slide,
        slideB: t.slide,
        progress: 0,
        type: 'none',
        effectA: (t.slide.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
        effectB: (t.slide.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
        progA: prog,
        progB: 0,
        timeInA: timeInSlide,
        timeInB: 0,
      };
    }
  }

  // Clamped at end of project: display final slide
  const lastIdx = Math.max(0, timings.length - 1);
  const lastTiming = timings[lastIdx];
  return {
    isTransitioning: false,
    slideIndexA: lastIdx,
    slideIndexB: lastIdx,
    slideA: lastTiming.slide,
    slideB: lastTiming.slide,
    progress: 0,
    type: 'none',
    effectA: (lastTiming.slide.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
    effectB: (lastTiming.slide.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
    progA: 1,
    progB: 0,
    timeInA: lastTiming.dur,
    timeInB: 0,
  };
}

/**
 * Generates continuous motion transforms and filters for a slide
 * Designed to start seamlessly at identity (scale: 1, translate: 0) without any initial jump
 */
export function getMotionStyle(effect: SceneMotionEffect, progress: number): React.CSSProperties {
  const p = Math.max(0, Math.min(1, progress));
  switch (effect) {
    case 'ken_burns_zoom_in':
      return { transform: `scale(${1.0 + p * 0.10})`, transformOrigin: 'center center' };
    case 'ken_burns_zoom_out':
      return { transform: `scale(${1.08 - p * 0.08})`, transformOrigin: 'center center' };
    case 'pan_left_right':
      return { transform: `scale(${1.0 + p * 0.05}) translateX(${p * 3.5}%)`, transformOrigin: 'center center' };
    case 'pan_right_left':
      return { transform: `scale(${1.0 + p * 0.05}) translateX(${-p * 3.5}%)`, transformOrigin: 'center center' };
    case 'cinematic_float':
      return {
        transform: `scale(${1.0 + Math.sin(p * Math.PI) * 0.03}) translateY(${Math.sin(p * Math.PI * 2) * 1.5}%) rotate(${Math.sin(p * Math.PI * 2) * 0.4}deg)`,
        transformOrigin: 'center center',
      };
    case 'pulse':
      return { transform: `scale(${1.0 + Math.sin(p * Math.PI * 4) * 0.02})`, transformOrigin: 'center center' };
    case 'fade_elements':
      return { transform: `scale(${1.0 + p * 0.03})`, transformOrigin: 'center center' };
    case 'parallax_drift':
      return {
        transform: `scale(${1.0 + p * 0.05}) translate(${p * 2.5}%, ${p * 1.8}%) rotate(${p * 0.5}deg)`,
        transformOrigin: 'center center',
      };
    case 'shaky_cam': {
      const env = Math.min(1, p * 5);
      const rx = (Math.sin(p * 48) * 0.6 + Math.cos(p * 90) * 0.4) * 0.4 * env;
      const ry = (Math.cos(p * 52) * 0.6 + Math.sin(p * 85) * 0.4) * 0.4 * env;
      return { transform: `scale(${1.0 + env * 0.03}) translate(${rx}%, ${ry}%)`, transformOrigin: 'center center' };
    }
    case 'tilt_perspective':
      return {
        transform: `scale(${1.0 + p * 0.04}) perspective(900px) rotateY(${p * 3.5}deg) rotateX(${-p * 2}deg)`,
        transformOrigin: 'center center',
      };
    case 'rgb_glitch': {
      const isGlitch = Math.sin(p * 32) > 0.88;
      return {
        transform: isGlitch ? `scale(1.02) translateX(${Math.sin(p * 50) * 4}px)` : 'scale(1.0)',
        filter: isGlitch ? 'drop-shadow(3px 0 0 rgba(239, 68, 68, 0.6)) drop-shadow(-3px 0 0 rgba(6, 182, 212, 0.6))' : 'none',
      };
    }
    case 'vignette_pulse':
      return { transform: `scale(${1.0 + Math.sin(p * Math.PI * 4) * 0.02})`, transformOrigin: 'center center' };
    case 'none':
    default:
      return { transform: 'scale(1)', transformOrigin: 'center center' };
  }
}

/**
 * Calculates transition styles between Slide A and Slide B
 */
export function getTransitionStyles(
  type: TransitionType,
  progress: number,
  motionStyleA: React.CSSProperties,
  motionStyleB: React.CSSProperties
): {
  styleA: React.CSSProperties;
  styleB: React.CSSProperties;
  overlayNode: React.ReactNode;
} {
  const p = Math.max(0, Math.min(1, progress));
  let styleA: React.CSSProperties = { ...motionStyleA };
  let styleB: React.CSSProperties = { ...motionStyleB };
  let overlayNode: React.ReactNode = null;

  switch (type) {
    case 'crossfade':
      styleA = { ...motionStyleA, opacity: 1 - p };
      styleB = { ...motionStyleB, opacity: p };
      break;

    case 'fade_black':
      styleA = { ...motionStyleA, opacity: p < 0.5 ? 1 - p * 2 : 0 };
      styleB = { ...motionStyleB, opacity: p >= 0.5 ? (p - 0.5) * 2 : 0 };
      overlayNode = (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-30 transition-none"
          style={{ opacity: p < 0.5 ? p * 2 : (1 - p) * 2 }}
        />
      );
      break;

    case 'fade_white':
      styleA = { ...motionStyleA, opacity: p < 0.5 ? 1 : 0 };
      styleB = { ...motionStyleB, opacity: p >= 0.5 ? 1 : 0 };
      overlayNode = (
        <div
          className="absolute inset-0 bg-white pointer-events-none z-30 transition-none"
          style={{ opacity: Math.sin(p * Math.PI) }}
        />
      );
      break;

    case 'slide_left':
      styleA = { ...motionStyleA, transform: `${motionStyleA.transform || ''} translateX(${-p * 100}%)` };
      styleB = { ...motionStyleB, transform: `${motionStyleB.transform || ''} translateX(${(1 - p) * 100}%)` };
      break;

    case 'slide_right':
      styleA = { ...motionStyleA, transform: `${motionStyleA.transform || ''} translateX(${p * 100}%)` };
      styleB = { ...motionStyleB, transform: `${motionStyleB.transform || ''} translateX(${-(1 - p) * 100}%)` };
      break;

    case 'slide_up':
      styleA = { ...motionStyleA, transform: `${motionStyleA.transform || ''} translateY(${-p * 100}%)` };
      styleB = { ...motionStyleB, transform: `${motionStyleB.transform || ''} translateY(${(1 - p) * 100}%)` };
      break;

    case 'slide_down':
      styleA = { ...motionStyleA, transform: `${motionStyleA.transform || ''} translateY(${p * 100}%)` };
      styleB = { ...motionStyleB, transform: `${motionStyleB.transform || ''} translateY(${-(1 - p) * 100}%)` };
      break;

    case 'zoom_in':
      styleA = { ...motionStyleA, transform: `${motionStyleA.transform || ''} scale(${1 + p * 0.35})`, opacity: 1 - p };
      styleB = { ...motionStyleB, transform: `${motionStyleB.transform || ''} scale(${0.8 + p * 0.2})`, opacity: p };
      break;

    case 'zoom_out':
      styleA = { ...motionStyleA, transform: `${motionStyleA.transform || ''} scale(${1 - p * 0.3})`, opacity: 1 - p };
      styleB = { ...motionStyleB, transform: `${motionStyleB.transform || ''} scale(${1.3 - p * 0.3})`, opacity: p };
      break;

    case 'wipe_left':
      styleA = { ...motionStyleA };
      styleB = { ...motionStyleB, clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` };
      break;

    case 'wipe_right':
      styleA = { ...motionStyleA };
      styleB = { ...motionStyleB, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` };
      break;

    case 'spin_zoom':
      styleA = { ...motionStyleA, transform: `${motionStyleA.transform || ''} rotate(${p * 16}deg) scale(${1 + p * 0.25})`, opacity: 1 - p };
      styleB = { ...motionStyleB, transform: `${motionStyleB.transform || ''} rotate(${-(1 - p) * 16}deg) scale(${0.8 + p * 0.2})`, opacity: p };
      break;

    case 'blur_dissolve':
      styleA = { ...motionStyleA, filter: `blur(${p * 14}px)`, opacity: 1 - p };
      styleB = { ...motionStyleB, filter: `blur(${(1 - p) * 14}px)`, opacity: p };
      break;

    case 'light_leak':
      styleA = { ...motionStyleA, opacity: 1 - p * 0.7 };
      styleB = { ...motionStyleB, opacity: p };
      overlayNode = (
        <div
          className="absolute inset-0 pointer-events-none z-30 mix-blend-screen"
          style={{
            background: `radial-gradient(ellipse at ${p * 100}% 35%, rgba(255,230,170,${Math.sin(p * Math.PI) * 0.95}) 0%, rgba(255,120,40,${Math.sin(p * Math.PI) * 0.6}) 45%, transparent 80%)`,
          }}
        />
      );
      break;

    case 'glitch':
      styleA = {
        ...motionStyleA,
        opacity: p < 0.5 ? 1 : 0,
        filter: 'drop-shadow(4px 0 0 rgba(239, 68, 68, 0.7)) drop-shadow(-4px 0 0 rgba(6, 182, 212, 0.7))',
        transform: `${motionStyleA.transform || ''} translateX(${Math.sin(p * 50) * 8}px)`,
      };
      styleB = {
        ...motionStyleB,
        opacity: p >= 0.5 ? 1 : 0,
        filter: 'drop-shadow(4px 0 0 rgba(239, 68, 68, 0.7)) drop-shadow(-4px 0 0 rgba(6, 182, 212, 0.7))',
        transform: `${motionStyleB.transform || ''} translateX(${Math.sin(p * 50) * 8}px)`,
      };
      break;

    default:
      styleA = { ...motionStyleA, opacity: 1 - p };
      styleB = { ...motionStyleB, opacity: p };
      break;
  }

  return { styleA, styleB, overlayNode };
}

interface VideoPreviewPlayerProps {
  slides: Slide[];
  brand: BrandInfo;
  aspectRatio: AspectRatio;
  currentTime: number;
  subtitles?: SubtitleItem[];
}

/**
 * Universal Video Preview Player component
 * Seamlessly renders individual slide motion and dual-slide transitions
 */
export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  slides,
  brand,
  aspectRatio,
  currentTime,
  subtitles,
}) => {
  const transState = getActiveTransitionState(slides, currentTime);
  const activeSubtitle = subtitles?.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  ) || null;

  if (transState.isTransitioning) {
    const motionStyleA = getMotionStyle(transState.effectA, transState.progA);
    const motionStyleB = getMotionStyle(transState.effectB, transState.progB);
    const { styleA, styleB, overlayNode } = getTransitionStyles(
      transState.type,
      transState.progress,
      motionStyleA,
      motionStyleB
    );

    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-950">
        {/* Outgoing Slide A */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none select-none will-change-transform"
          style={styleA}
        >
          <CanvasSlide
            slide={transState.slideA}
            brand={brand}
            aspectRatio={aspectRatio}
            isExportMode={true}
            currentTimeInSlide={transState.timeInA}
            currentSubtitle={activeSubtitle}
            activeElementKey={null}
            onSelectElement={() => {}}
            allSlides={slides}
            slideIndex={transState.slideIndexA}
          />
        </div>

        {/* Incoming Slide B */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none select-none will-change-transform"
          style={styleB}
        >
          <CanvasSlide
            slide={transState.slideB}
            brand={brand}
            aspectRatio={aspectRatio}
            isExportMode={true}
            currentTimeInSlide={transState.timeInB}
            currentSubtitle={activeSubtitle}
            activeElementKey={null}
            onSelectElement={() => {}}
            allSlides={slides}
            slideIndex={transState.slideIndexB}
          />
        </div>

        {/* Overlay node (flash, leak, dip) */}
        {overlayNode}
      </div>
    );
  }

  // Normal single slide playback
  const motionStyle = getMotionStyle(transState.effectA, transState.progA);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 w-full h-full pointer-events-none select-none will-change-transform"
        style={motionStyle}
      >
        <CanvasSlide
          slide={transState.slideA}
          brand={brand}
          aspectRatio={aspectRatio}
          isExportMode={true}
          currentTimeInSlide={transState.timeInA}
          currentSubtitle={activeSubtitle}
          activeElementKey={null}
          onSelectElement={() => {}}
          allSlides={slides}
          slideIndex={transState.slideIndexA}
        />
      </div>
    </div>
  );
};
