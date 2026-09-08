import React, { useRef, useEffect } from 'react';
import { VoiceoverAvatar } from '../types';
import { Mic, Volume2, Sparkles, Radio, Play } from 'lucide-react';

interface VoiceoverAvatarBadgeProps {
  avatar: VoiceoverAvatar;
  isSpeaking: boolean;
  slideIndex?: number;
  onClick?: () => void;
  isInteractive?: boolean;
}

export const VoiceoverAvatarBadge: React.FC<VoiceoverAvatarBadgeProps> = ({
  avatar,
  isSpeaking,
  slideIndex = 0,
  onClick,
  isInteractive = true,
}) => {
  if (!avatar.enabled) return null;
  if (avatar.hideOnSlides && avatar.hideOnSlides.includes(slideIndex)) {
    return null;
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const sizePx = avatar.size || 96;
  const glowColor = avatar.borderGlowColor || '#e11d48';

  // Calibration: Mouth (Visemas)
  const mouthY = avatar.mouthPositionPercent ?? 68;
  const mouthXOffset = avatar.mouthOffsetXPercent ?? 0;
  const mouthScale = avatar.mouthScale ?? 1.0;
  const mouthSpeed = Math.max(0.2, avatar.mouthSpeed ?? 1.0);
  const mouthWidthPx = Math.max(12, Math.round(sizePx * 0.25 * mouthScale));
  const mouthHeightPx = Math.max(8, Math.round(sizePx * 0.16 * mouthScale));
  const mouthDurationSec = Number((0.38 / mouthSpeed).toFixed(3));

  // Calibration: Eyes & Eyelashes (Parpadeo)
  const eyesY = avatar.eyesPositionPercent ?? Math.max(15, mouthY - 27);
  const eyesXOffset = avatar.eyesOffsetXPercent ?? 0;
  const eyesSpacing = avatar.eyesSpacingPercent ?? 16;
  const eyesScale = avatar.eyesScale ?? 1.0;
  const blinkInterval = Math.max(1.0, avatar.blinkInterval ?? 4.2);
  const blinkSpeed = Math.max(0.3, avatar.blinkSpeed ?? 1.0);
  const blinkCycleSec = Number((blinkInterval / blinkSpeed).toFixed(2));
  const eyesWidthPx = Math.max(20, Math.round(sizePx * 0.46 * eyesScale));
  const eyesHeightPx = Math.max(6, Math.round(sizePx * 0.09 * eyesScale));

  const isLipSyncActive = isSpeaking && avatar.enableLipSync !== false;
  const isHeadMotionActive = isSpeaking && avatar.enableHeadMotion !== false;
  const isBlinkingActive = avatar.enableBlinking !== false;
  const isJawMotionActive = isSpeaking && avatar.enableJawMotion !== false;
  const isBreathingActive = avatar.enableBreathing !== false;
  const isVideoAvatar = avatar.avatarType === 'video' || Boolean(avatar.videoUrl);

  // Manage video playback based on speech state
  useEffect(() => {
    if (!videoRef.current || !isVideoAvatar) return;
    if (isSpeaking) {
      videoRef.current.play().catch(() => {});
    } else {
      // Pause or keep at gentle idle
      videoRef.current.pause();
    }
  }, [isSpeaking, isVideoAvatar]);

  // Shape class
  const getShapeClass = () => {
    switch (avatar.shape) {
      case 'rounded':
        return 'rounded-2xl';
      case 'pill':
        return 'rounded-3xl';
      case 'portrait':
        return 'rounded-2xl aspect-[3/4]';
      case 'half_body':
        return 'rounded-t-3xl rounded-b-none aspect-[3/4]';
      case 'cinema_wide':
        return 'rounded-2xl aspect-video';
      case 'circle':
      default:
        return 'rounded-full';
    }
  };

  // Position class
  const getPositionClass = () => {
    switch (avatar.position) {
      case 'bottom_left':
        return 'bottom-4 left-4 sm:bottom-6 sm:left-6 items-start';
      case 'top_right':
        return 'top-4 right-4 sm:top-6 sm:right-6 items-end';
      case 'top_left':
        return 'top-4 left-4 sm:top-6 sm:left-6 items-start';
      case 'center_right':
        return 'top-1/2 -translate-y-1/2 right-4 sm:right-6 items-end';
      case 'center_left':
        return 'top-1/2 -translate-y-1/2 left-4 sm:left-6 items-start';
      case 'bottom_center':
        return 'bottom-4 left-1/2 -translate-x-1/2 items-center';
      case 'fullscreen_host':
        return 'inset-y-6 right-6 items-end justify-center pointer-events-none';
      case 'bottom_right':
      default:
        return 'bottom-4 right-4 sm:bottom-6 sm:right-6 items-end';
    }
  };

  // Calculate dimensions based on shape
  const getDimensions = () => {
    if (avatar.position === 'fullscreen_host') {
      return {
        width: 'min(320px, 45%)',
        height: '80%',
      };
    }
    if (avatar.shape === 'portrait' || avatar.shape === 'half_body') {
      return {
        width: `${sizePx}px`,
        height: `${Math.round(sizePx * 1.3)}px`,
      };
    }
    if (avatar.shape === 'cinema_wide') {
      return {
        width: `${Math.round(sizePx * 1.4)}px`,
        height: `${sizePx}px`,
      };
    }
    return {
      width: `${sizePx}px`,
      height: `${sizePx}px`,
    };
  };

  const dims = getDimensions();

  return (
    <div
      className={`absolute z-40 flex flex-col pointer-events-auto select-none transition-all duration-300 ${getPositionClass()}`}
      onClick={isInteractive ? onClick : undefined}
      style={{ cursor: isInteractive && onClick ? 'pointer' : 'default' }}
      title={isInteractive ? 'Clic para configurar Avatar IA Ultra-Realista' : undefined}
    >
      {/* Outer Container with Breathing Motion & Audio Reactive Wave Rings */}
      <div
        className={`relative group/avatar flex flex-col items-center justify-center ${
          isBreathingActive ? 'animate-heygen-breathing' : ''
        }`}
      >
        {/* Cinematic Studio Voice Aura & Specular Rim Light */}
        {isSpeaking && avatar.animation !== 'none' && (
          <>
            {/* Ambient Backlight Diffusion */}
            <div
              className={`absolute -inset-4 opacity-40 blur-xl pointer-events-none transition-opacity duration-300 ${getShapeClass()}`}
              style={{ backgroundColor: glowColor }}
            />
            {/* Pulsing Voice Energy Ring */}
            <div
              className={`absolute -inset-1.5 opacity-85 animate-pulse pointer-events-none ${getShapeClass()}`}
              style={{
                border: `2px solid ${glowColor}`,
                boxShadow: `0 0 26px ${glowColor}aa, inset 0 0 14px ${glowColor}50`,
              }}
            />
          </>
        )}

        {/* Presenter Frame with Organic Head Sway & Studio Rim Lighting */}
        <div
          className={`relative overflow-hidden shadow-2xl transition-all duration-300 bg-slate-950 ${getShapeClass()} ${
            isHeadMotionActive ? 'animate-heygen-head' : isSpeaking ? 'scale-[1.025]' : 'scale-100'
          }`}
          style={{
            width: dims.width,
            height: dims.height,
            border: `2px solid ${isSpeaking ? glowColor : 'rgba(255, 255, 255, 0.28)'}`,
            boxShadow: isSpeaking
              ? `0 0 30px ${glowColor}70, 0 20px 45px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,255,255,0.4)`
              : '0 12px 30px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.25)',
          }}
        >
          {/* Main Presenter: Video Real or High-Res AI Portrait */}
          {isVideoAvatar && avatar.videoUrl ? (
            <video
              ref={videoRef}
              src={avatar.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none select-none"
            />
          ) : (
            <div className="relative w-full h-full">
              {/* High-Resolution Presenter Image */}
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                className="w-full h-full object-cover pointer-events-none select-none"
                referrerPolicy="no-referrer"
              />

              {/* Studio Key Light & Subtle Depth Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15 pointer-events-none" />

              {/* Anatomical Lip-Sync Engine with Feathered Skin Blend & Micro-Jaw Movement */}
              {isLipSyncActive && (
                <div
                  className={`absolute pointer-events-none z-10 flex items-center justify-center ${
                    isJawMotionActive ? 'animate-heygen-jaw' : ''
                  }`}
                  style={{
                    top: `${mouthY}%`,
                    left: `${50 + mouthXOffset}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${mouthWidthPx}px`,
                    height: `${mouthHeightPx}px`,
                    animationDuration: `${mouthDurationSec}s`,
                  }}
                >
                  {/* Organic Lip Aperture & Oral Cavity with Feathered Edges */}
                  <div
                    className="w-full h-full relative animate-heygen-mouth flex flex-col items-center justify-center"
                    style={{
                      animationDuration: `${mouthDurationSec}s`,
                      // Soft radial mask to seamlessly melt lip corners into skin without hard borders
                      maskImage: 'radial-gradient(ellipse at 50% 50%, black 55%, rgba(0,0,0,0.7) 80%, transparent 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 55%, rgba(0,0,0,0.7) 80%, transparent 100%)',
                    }}
                  >
                    {/* Natural Upper Lip Shading & Cupid's Bow Curve */}
                    <div
                      className="absolute inset-x-0 top-0 h-[22%] z-10 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(45, 14, 18, 0.6) 0%, rgba(25, 6, 10, 0.85) 100%)',
                        borderRadius: '40% 40% 0 0',
                      }}
                    />

                    {/* Oral Cavity Depth */}
                    <div
                      className="w-full h-full rounded-[45%] overflow-hidden relative flex flex-col items-center justify-center"
                      style={{
                        background: 'radial-gradient(ellipse at 50% 38%, #0f0305 0%, #1e050a 55%, #380b13 100%)',
                        boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.9), 0 0 4px rgba(45, 10, 15, 0.4)',
                      }}
                    >
                      {/* Natural Upper Dental Row (Soft Ivory with Incisor Shading & Upper-Lip Shadow) */}
                      <div
                        className="w-[78%] h-[32%] rounded-t-sm mb-auto mt-[1px] relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(250, 248, 245, 0.96) 0%, rgba(230, 225, 218, 0.88) 75%, rgba(175, 165, 155, 0.5) 100%)',
                          boxShadow: 'inset 0 1.5px 2px rgba(0,0,0,0.75)',
                        }}
                      >
                        {/* Subtle Interdental Micro-Separators */}
                        <div className="absolute inset-0 flex justify-center items-stretch opacity-20">
                          <span className="w-px h-full bg-slate-900 mx-[3px]" />
                          <span className="w-px h-full bg-slate-900 mx-[3px]" />
                          <span className="w-px h-full bg-slate-900 mx-[3px]" />
                        </div>
                      </div>

                      {/* Natural Tongue & Lower Oral Contour */}
                      <div
                        className="w-[58%] h-[36%] rounded-full mt-auto mb-[1px]"
                        style={{
                          background: 'radial-gradient(ellipse at 50% 80%, #d44d66 0%, #a82e46 70%, #5e1322 100%)',
                          boxShadow: '0 -1px 3px rgba(0,0,0,0.5)',
                        }}
                      />
                    </div>

                    {/* Lower Lip Fleshy Highlight & Shadow */}
                    <div
                      className="absolute inset-x-1 bottom-0 h-[24%] pointer-events-none rounded-b-full"
                      style={{
                        background: 'linear-gradient(to top, rgba(220, 80, 105, 0.4) 0%, rgba(170, 45, 65, 0.7) 60%, transparent 100%)',
                        filter: 'blur(0.4px)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Lifelike Natural Eyelid Blinks with Curved Lash Shadows */}
              {isBlinkingActive && (
                <div
                  className="absolute pointer-events-none z-10 animate-heygen-blink"
                  style={{
                    top: `${eyesY}%`,
                    left: `${50 + eyesXOffset}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${eyesWidthPx}px`,
                    height: `${eyesHeightPx}px`,
                    animationDuration: `${blinkCycleSec}s`,
                  }}
                >
                  <div
                    className="flex justify-between w-full h-full px-1 items-center"
                    style={{
                      columnGap: `${Math.max(2, Math.round(eyesWidthPx * (eyesSpacing / 100)))}px`,
                    }}
                  >
                    {/* Left Eye Eyelid Contour */}
                    <div
                      className="w-[42%] h-full rounded-[48%] relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(28, 16, 14, 0.88) 0%, rgba(55, 32, 28, 0.65) 75%, rgba(15, 8, 7, 0.95) 100%)',
                        boxShadow: '0 1.5px 3px rgba(0,0,0,0.8)',
                        filter: 'blur(0.3px)',
                      }}
                    >
                      {/* Eyelash Shadow Line */}
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/80" />
                    </div>

                    {/* Right Eye Eyelid Contour */}
                    <div
                      className="w-[42%] h-full rounded-[48%] relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(28, 16, 14, 0.88) 0%, rgba(55, 32, 28, 0.65) 75%, rgba(15, 8, 7, 0.95) 100%)',
                        boxShadow: '0 1.5px 3px rgba(0,0,0,0.8)',
                        filter: 'blur(0.3px)',
                      }}
                    >
                      {/* Eyelash Shadow Line */}
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/80" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Speaking Audio Equalizer Mini Overlay at bottom (only if explicitly enabled) */}
          {isSpeaking && avatar.showAudioEqualizer === true && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent py-1.5 flex items-center justify-center gap-1 z-20">
              <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-5 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-4 bg-rose-300 rounded-full animate-bounce [animation-delay:300ms]" />
              <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:75ms]" />
              <span className="w-1 h-4.5 bg-amber-300 rounded-full animate-bounce [animation-delay:225ms]" />
            </div>
          )}

          {/* Studio Watermark Pill (only if explicitly enabled) */}
          {avatar.showWatermark === true && (
            <div className="absolute top-1 left-1.5 z-20 pointer-events-none opacity-90">
              <span className="text-[8px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-slate-200 px-1.5 py-0.5 rounded-md border border-white/15 flex items-center gap-0.5 shadow-md">
                <Sparkles className="w-2 h-2 text-rose-400" />
                <span>{isVideoAvatar ? 'VIDEO REAL' : 'AVATAR IA'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Live Speaking / Mute Floating Indicator Pip */}
        <div
          className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow-xl border-2 border-slate-950 transition-colors z-30 ${
            isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}
          title={isSpeaking ? 'Avatar IA hablando en directo' : 'Avatar IA en silencio'}
        >
          {isSpeaking ? <Radio className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 opacity-60" />}
        </div>
      </div>

      {/* Name Tag Pill */}
      {avatar.showNameTag !== false && (
        <div className="mt-2 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold tracking-tight shadow-2xl whitespace-nowrap flex items-center gap-1.5 max-w-[190px] truncate">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
            }`}
          />
          <span className="truncate">{avatar.name}</span>
          {avatar.role && (
            <span className="text-[9px] text-slate-300 opacity-80 font-normal truncate hidden sm:inline">
              • {avatar.role}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

