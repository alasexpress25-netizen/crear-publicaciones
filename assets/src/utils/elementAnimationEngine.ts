import { ElementAnimationIn, ElementAnimationOut, TextStyleItem } from '../types';

export interface ElementAnimationState {
  isVisible: boolean;
  opacity: number;
  translateX: number; // in pixels
  translateY: number; // in pixels
  scale: number;
  filter?: string;
  cssTransform: string;
}

export interface AnimationPresetInfo {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const ANIMATION_IN_PRESETS: AnimationPresetInfo[] = [
  { id: 'none', label: 'Ninguno (Fijo)', icon: '⏹️', description: 'Permanece siempre visible sin efecto' },
  { id: 'fade_in', label: 'Desvanecer', icon: '✨', description: 'Aparece suavemente con opacidad gradual' },
  { id: 'slide_up', label: 'Deslizar desde Abajo', icon: '⬆️', description: 'Sube suavemente hacia su posición' },
  { id: 'slide_down', label: 'Deslizar desde Arriba', icon: '⬇️', description: 'Baja suavemente hacia su posición' },
  { id: 'slide_left', label: 'Deslizar desde Derecha', icon: '⬅️', description: 'Entra deslizándose desde la derecha' },
  { id: 'slide_right', label: 'Deslizar desde Izquierda', icon: '➡️', description: 'Entra deslizándose desde la izquierda' },
  { id: 'zoom_in', label: 'Zoom In (Acercar)', icon: '🔍', description: 'Aparece creciendo desde el fondo' },
  { id: 'bounce_in', label: 'Pop Rebote', icon: '🏀', description: 'Efecto elástico y dinámico con rebote' },
  { id: 'pop_in', label: 'Pop Impacto', icon: '💥', description: 'Impacto rápido con sobre-escala sutil' },
  { id: 'blur_in', label: 'Desenfoque Nítido', icon: '🌫️', description: 'De desenfocado a perfectamente nítido' },
];

export const ANIMATION_OUT_PRESETS: AnimationPresetInfo[] = [
  { id: 'none', label: 'Ninguno (Hasta el final)', icon: '♾️', description: 'Permanece visible hasta que cambie la diapositiva' },
  { id: 'fade_out', label: 'Desvanecer', icon: '✨', description: 'Se desvanece suavemente antes de salir' },
  { id: 'slide_down', label: 'Deslizar hacia Abajo', icon: '⬇️', description: 'Baja y desaparece hacia el fondo' },
  { id: 'slide_up', label: 'Deslizar hacia Arriba', icon: '⬆️', description: 'Sube y desaparece hacia arriba' },
  { id: 'slide_left', label: 'Deslizar hacia Izquierda', icon: '⬅️', description: 'Sale hacia la izquierda' },
  { id: 'slide_right', label: 'Deslizar hacia Derecha', icon: '➡️', description: 'Sale hacia la derecha' },
  { id: 'zoom_out', label: 'Zoom Out (Alejar)', icon: '🔍', description: 'Se reduce hasta desaparecer' },
  { id: 'blur_out', label: 'Difuminar / Blur', icon: '🌫️', description: 'Se desenfoca y desaparece' },
];

// Easing formulas
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInQuad(t: number): number {
  return t * t;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

/**
 * Computes the visual animation state of an element at a specific timestamp inside the slide.
 * @param style The element's TextStyleItem or custom layer with animation properties
 * @param timeInSlide Seconds elapsed since the start of this slide (e.g. 1.25s)
 * @param slideDuration Total duration of the slide in seconds (default 3.5s)
 */
export function computeElementAnimation(
  style: TextStyleItem | undefined,
  timeInSlide: number,
  slideDuration: number = 3.5
): ElementAnimationState {
  // If no style or invalid time, visible by default
  if (!style) {
    return {
      isVisible: true,
      opacity: 1,
      translateX: 0,
      translateY: 0,
      scale: 1,
      cssTransform: 'none',
    };
  }

  const inType: ElementAnimationIn = style.animationIn || 'none';
  const inDelay = Math.max(0, style.inDelay ?? 0);
  const inDuration = Math.max(0.1, style.animationInDuration ?? 0.5);

  const outType: ElementAnimationOut = style.animationOut || 'none';
  const outTime = style.outTime !== undefined && style.outTime !== null ? Math.max(inDelay + 0.1, style.outTime) : null;
  const outDuration = Math.max(0.1, style.animationOutDuration ?? 0.4);

  // Check if element has any animation configured at all
  const hasInAnim = inType !== 'none' || inDelay > 0;
  const hasOutAnim = outType !== 'none' && outTime !== null;

  if (!hasInAnim && !hasOutAnim) {
    return {
      isVisible: true,
      opacity: 1,
      translateX: 0,
      translateY: 0,
      scale: 1,
      cssTransform: 'none',
    };
  }

  // 1. Before entrance delay
  if (timeInSlide < inDelay) {
    return {
      isVisible: false,
      opacity: 0,
      translateX: 0,
      translateY: 0,
      scale: 0.8,
      cssTransform: 'scale(0.8)',
    };
  }

  // 2. Entering phase: [inDelay, inDelay + inDuration]
  if (timeInSlide < inDelay + inDuration) {
    const rawP = Math.min(1, Math.max(0, (timeInSlide - inDelay) / inDuration));
    const p = easeOutCubic(rawP);

    let opacity = p;
    let translateX = 0;
    let translateY = 0;
    let scale = 1;
    let filter: string | undefined = undefined;

    switch (inType) {
      case 'fade_in':
        opacity = p;
        break;
      case 'slide_up':
        opacity = p;
        translateY = Math.round((1 - p) * 36);
        break;
      case 'slide_down':
        opacity = p;
        translateY = Math.round(-(1 - p) * 36);
        break;
      case 'slide_left':
        opacity = p;
        translateX = Math.round((1 - p) * 44);
        break;
      case 'slide_right':
        opacity = p;
        translateX = Math.round(-(1 - p) * 44);
        break;
      case 'zoom_in':
        opacity = p;
        scale = 0.65 + p * 0.35;
        break;
      case 'bounce_in':
        opacity = Math.min(1, rawP * 2);
        scale = easeOutBack(rawP);
        break;
      case 'pop_in':
        opacity = Math.min(1, rawP * 2.5);
        if (rawP < 0.65) {
          scale = (rawP / 0.65) * 1.1;
        } else {
          scale = 1.1 - ((rawP - 0.65) / 0.35) * 0.1;
        }
        break;
      case 'blur_in':
        opacity = p;
        filter = `blur(${Math.round((1 - p) * 10)}px)`;
        break;
      case 'none':
      default:
        opacity = 1;
        break;
    }

    const cssTransform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    return {
      isVisible: true,
      opacity,
      translateX,
      translateY,
      scale,
      filter,
      cssTransform,
    };
  }

  // 3. Middle phase: fully active and displayed
  if (outTime === null || timeInSlide < outTime) {
    return {
      isVisible: true,
      opacity: 1,
      translateX: 0,
      translateY: 0,
      scale: 1,
      cssTransform: 'none',
    };
  }

  // 4. Exiting phase: [outTime, outTime + outDuration]
  if (timeInSlide < outTime + outDuration) {
    const rawOutP = Math.min(1, Math.max(0, (timeInSlide - outTime) / outDuration));
    const p = easeInQuad(rawOutP);

    let opacity = 1 - p;
    let translateX = 0;
    let translateY = 0;
    let scale = 1;
    let filter: string | undefined = undefined;

    switch (outType) {
      case 'fade_out':
        opacity = 1 - p;
        break;
      case 'slide_down':
        opacity = 1 - p;
        translateY = Math.round(p * 36);
        break;
      case 'slide_up':
        opacity = 1 - p;
        translateY = Math.round(-p * 36);
        break;
      case 'slide_left':
        opacity = 1 - p;
        translateX = Math.round(-p * 44);
        break;
      case 'slide_right':
        opacity = 1 - p;
        translateX = Math.round(p * 44);
        break;
      case 'zoom_out':
        opacity = 1 - p;
        scale = 1 - p * 0.35;
        break;
      case 'blur_out':
        opacity = 1 - p;
        filter = `blur(${Math.round(p * 10)}px)`;
        break;
      case 'none':
      default:
        opacity = 1;
        break;
    }

    const cssTransform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    return {
      isVisible: true,
      opacity,
      translateX,
      translateY,
      scale,
      filter,
      cssTransform,
    };
  }

  // 5. Finished exiting: completely hidden
  return {
    isVisible: false,
    opacity: 0,
    translateX: 0,
    translateY: 0,
    scale: 0.8,
    cssTransform: 'scale(0.8)',
  };
}

/**
 * Checks if a slide has any element with entrance, delay, or exit animations configured.
 */
export function slideHasElementAnimations(slideTextStyle?: Record<string, TextStyleItem>): boolean {
  if (!slideTextStyle) return false;
  return Object.values(slideTextStyle).some(
    (item) =>
      (item.animationIn && item.animationIn !== 'none') ||
      (item.inDelay !== undefined && item.inDelay > 0) ||
      (item.animationOut && item.animationOut !== 'none' && item.outTime !== undefined)
  );
}
