import React from 'react';
import { Slide, BrandInfo, AspectRatio, TransitionType, SceneMotionEffect, SubtitleItem, VoiceoverAvatar } from '../types';
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

  let accumulated = 0;
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const rawDur = s.duration || 3.5;
    const speed = s.speed || 1;
    const dur = Math.max(1, rawDur / speed);
    const startTime = accumulated;
    accumulated += dur;
    const endTime = accumulated;

    // Check if transition to next slide is active
    if (i < slides.length - 1) {
      const nextSlide = slides[i + 1];
      const transType = s.transition || 'crossfade';
      // Transition duration between 0.5s and 1.0s, max 35% of slide duration
      const transDur = transType !== 'none'
        ? Math.min(1.0, dur * 0.35, s.transitionDuration || 0.8)
        : 0;

      const tStart = endTime - transDur;
      const tEnd = endTime;

      if (transDur > 0 && currentTime >= tStart && currentTime < tEnd) {
        const progress = Math.max(0, Math.min(1, (currentTime - tStart) / transDur));
        const timeInA = currentTime - startTime;
        const timeInB = currentTime - tStart;
        const progA = Math.min(1, timeInA / dur);
        const progB = progress * 0.15; // Smooth start of slide B

        return {
          isTransitioning: true,
          slideIndexA: i,
          slideIndexB: i + 1,
          slideA: s,
          slideB: nextSlide,
          progress,
          type: transType as TransitionType,
          effectA: (s.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
          effectB: (nextSlide.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
          progA,
          progB,
          timeInA,
          timeInB,
        };
      }
    }

    // Inside current slide, not in transition
    if (currentTime >= startTime && currentTime < endTime) {
      const timeInSlide = currentTime - startTime;
      const prog = Math.min(1, timeInSlide / dur);
      return {
        isTransitioning: false,
        slideIndexA: i,
        slideIndexB: i,
        slideA: s,
        slideB: s,
        progress: 0,
        type: 'none',
        effectA: (s.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
        effectB: (s.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
        progA: prog,
        progB: 0,
        timeInA: timeInSlide,
        timeInB: 0,
      };
    }
  }

  // Clamped at end of project: display final slide
  const lastIdx = Math.max(0, slides.length - 1);
  const lastSlide = slides[lastIdx];
  const lastDur = (lastSlide?.duration || 3.5) / (lastSlide?.speed || 1);
  return {
    isTransitioning: false,
    slideIndexA: lastIdx,
    slideIndexB: lastIdx,
    slideA: lastSlide,
    slideB: lastSlide,
    progress: 0,
    type: 'none',
    effectA: (lastSlide?.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
    effectB: (lastSlide?.effect || 'ken_burns_zoom_in') as SceneMotionEffect,
    progA: 1,
    progB: 0,
    timeInA: lastDur,
    timeInB: 0,
  };
}

/**
 * Generates continuous motion transforms and filters for a slide
 */
export function getMotionStyle(effect: SceneMotionEffect, progress: number): React.CSSProperties {
  const p = Math.max(0, Math.min(1, progress));
  switch (effect) {
    case 'ken_burns_zoom_in':
      return { transform: `scale(${1.0 + p * 0.12})`, transformOrigin: 'center center' };
    case 'ken_burns_zoom_out':
      return { transform: `scale(${1.12 - p * 0.12})`, transformOrigin: 'center center' };
    case 'pan_left_right':
      return { transform: `scale(1.06) translateX(${(p - 0.5) * 6}%)`, transformOrigin: 'center center' };
    case 'pan_right_left':
      return { transform: `scale(1.06) translateX(${(0.5 - p) * 6}%)`, transformOrigin: 'center center' };
    case 'cinematic_float':
      return {
        transform: `scale(1.04) translateY(${Math.sin(p * Math.PI * 2) * 2}%) rotate(${Math.sin(p * Math.PI) * 0.6}deg)`,
        transformOrigin: 'center center',
      };
    case 'pulse':
      return { transform: `scale(${1.0 + Math.sin(p * Math.PI * 6) * 0.025})`, transformOrigin: 'center center' };
    case 'fade_elements':
      return { transform: `scale(${1.0 + p * 0.03})`, transformOrigin: 'center center' };
    case 'parallax_drift':
      return {
        transform: `scale(1.08) translate(${(p - 0.5) * 4}%, ${(p - 0.5) * 3}%) rotate(${(p - 0.5) * 1}deg)`,
        transformOrigin: 'center center',
      };
    case 'shaky_cam': {
      const rx = (Math.sin(p * 48) * 0.6 + Math.cos(p * 90) * 0.4) * 0.5;
      const ry = (Math.cos(p * 52) * 0.6 + Math.sin(p * 85) * 0.4) * 0.5;
      return { transform: `scale(1.05) translate(${rx}%, ${ry}%)`, transformOrigin: 'center center' };
    }
    case 'tilt_perspective':
      return {
        transform: `scale(1.04) perspective(900px) rotateY(${(p - 0.5) * 5}deg) rotateX(${(0.5 - p) * 3}deg)`,
        transformOrigin: 'center center',
      };
    case 'rgb_glitch':
      return {
        transform: `scale(1.03) translateX(${Math.sin(p * 40) > 0.8 ? (Math.random() - 0.5) * 6 : 0}px)`,
        filter: Math.sin(p * 30) > 0.85 ? 'drop-shadow(3px 0 0 rgba(239, 68, 68, 0.6)) drop-shadow(-3px 0 0 rgba(6, 182, 212, 0.6))' : 'none',
      };
    case 'vignette_pulse':
      return { transform: `scale(${1.02 + Math.sin(p * Math.PI * 4) * 0.02})`, transformOrigin: 'center center' };
    default:
      return {};
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
  voiceoverAvatar?: VoiceoverAvatar | null;
  isVoiceoverActive?: boolean;
  onOpenAvatarModal?: () => void;
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
  voiceoverAvatar = null,
  isVoiceoverActive = false,
  onOpenAvatarModal,
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
            voiceoverAvatar={voiceoverAvatar}
            isVoiceoverActive={isVoiceoverActive}
            onOpenAvatarModal={onOpenAvatarModal}
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
            voiceoverAvatar={voiceoverAvatar}
            isVoiceoverActive={isVoiceoverActive}
            onOpenAvatarModal={onOpenAvatarModal}
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
          voiceoverAvatar={voiceoverAvatar}
          isVoiceoverActive={isVoiceoverActive}
          onOpenAvatarModal={onOpenAvatarModal}
        />
      </div>
    </div>
  );
};
