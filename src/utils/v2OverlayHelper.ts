import { Slide, CustomTextLayer, TextStyleItem, TextPosition } from '../types';

export interface ResolvedV2Clip {
  id: string;
  originSlideIndex: number;
  clip: CustomTextLayer;
  startGlobalTime: number;
  duration: number;
  endGlobalTime: number;
  coveredSlideIndices: number[];
  isCrossSlide: boolean;
}

/**
 * Checks whether a CustomTextLayer is a media layer intended for Track V2 / media overlay.
 */
export function isV2MediaLayer(layer: CustomTextLayer): boolean {
  return (
    layer.type === 'video' ||
    layer.type === 'image' ||
    Boolean(layer.videoUrl) ||
    Boolean(layer.imageUrl) ||
    layer.id.startsWith('v2-') ||
    layer.id.startsWith('custom-vid-') ||
    layer.id.startsWith('custom-video-') ||
    layer.id.startsWith('custom-img-') ||
    layer.id.startsWith('custom-image-')
  );
}

/**
 * Computes the global timeline start time and duration of each slide in seconds.
 */
export function getSlideTimings(slides: Slide[]): Array<{
  slideIndex: number;
  startTime: number;
  duration: number;
  endTime: number;
}> {
  let accumulatedTime = 0;
  return slides.map((s, idx) => {
    const rawDur = s.duration || 3.5;
    const speed = s.speed || 1;
    const dur = Math.max(0.5, rawDur / speed);
    const start = accumulatedTime;
    accumulatedTime += dur;
    return {
      slideIndex: idx,
      startTime: start,
      duration: dur,
      endTime: accumulatedTime,
    };
  });
}

/**
 * Collects and resolves all V2 media layers across all slides,
 * calculating their startGlobalTime, total duration, endGlobalTime,
 * and which slides they span over.
 */
export function getAllResolvedV2Clips(slides: Slide[]): ResolvedV2Clip[] {
  const timings = getSlideTimings(slides);
  const resolvedList: ResolvedV2Clip[] = [];

  slides.forEach((s, idx) => {
    const slideTiming = timings[idx];
    if (!slideTiming) return;

    const mediaLayers = (s.customTexts || []).filter(isV2MediaLayer);

    mediaLayers.forEach((layer) => {
      const inOffset = Math.max(0, layer.inDelay || 0);
      const specifiedDur =
        layer.duration !== undefined && layer.duration > 0
          ? layer.duration
          : layer.outTime !== undefined && layer.outTime > inOffset
          ? layer.outTime - inOffset
          : slideTiming.duration - inOffset;

      const clipDuration = Math.max(0.5, specifiedDur);
      const startGlobal = slideTiming.startTime + inOffset;
      const endGlobal = startGlobal + clipDuration;

      // Determine which slides this clip covers
      const coveredSlideIndices: number[] = [];
      timings.forEach((t) => {
        if (startGlobal < t.endTime && endGlobal > t.startTime) {
          coveredSlideIndices.push(t.slideIndex);
        }
      });

      const isCrossSlide = coveredSlideIndices.length > 1;

      resolvedList.push({
        id: layer.id,
        originSlideIndex: idx,
        clip: layer,
        startGlobalTime: startGlobal,
        duration: clipDuration,
        endGlobalTime: endGlobal,
        coveredSlideIndices,
        isCrossSlide,
      });
    });
  });

  return resolvedList;
}

/**
 * Returns all V2 clips that should be visible on the given slide,
 * either during interactive editing (by overlapping slide duration)
 * or during playback (by exact currentTimeInSlide).
 */
export function getActiveV2ClipsForSlide(
  slides: Slide[],
  currentSlideIndex: number,
  currentTimeInSlide?: number
): Array<{
  resolved: ResolvedV2Clip;
  clip: CustomTextLayer;
  originSlideIndex: number;
  isCrossSlide: boolean;
  timeInClip: number;
  textPos?: TextPosition;
  textStyle?: TextStyleItem;
}> {
  const allResolved = getAllResolvedV2Clips(slides);
  const timings = getSlideTimings(slides);
  const currentTiming = timings[currentSlideIndex];

  if (!currentTiming) return [];

  const results: Array<{
    resolved: ResolvedV2Clip;
    clip: CustomTextLayer;
    originSlideIndex: number;
    isCrossSlide: boolean;
    timeInClip: number;
    textPos?: TextPosition;
    textStyle?: TextStyleItem;
  }> = [];

  allResolved.forEach((item) => {
    let isActive = false;
    let timeInClip = 0;

    if (currentTimeInSlide !== undefined) {
      const globalTime = currentTiming.startTime + currentTimeInSlide;
      if (globalTime >= item.startGlobalTime && globalTime <= item.endGlobalTime) {
        isActive = true;
        timeInClip = Math.max(0, globalTime - item.startGlobalTime);
      }
    } else {
      // In editor mode (static frame viewing), active if overlaps this slide
      if (item.startGlobalTime < currentTiming.endTime && item.endGlobalTime > currentTiming.startTime) {
        isActive = true;
        const approximateGlobal = Math.max(item.startGlobalTime, currentTiming.startTime);
        timeInClip = approximateGlobal - item.startGlobalTime;
      }
    }

    if (isActive) {
      const originSlide = slides[item.originSlideIndex];
      const textPos = originSlide?.textPos?.[item.id];
      const textStyle = originSlide?.textStyle?.[item.id];

      results.push({
        resolved: item,
        clip: item.clip,
        originSlideIndex: item.originSlideIndex,
        isCrossSlide: item.isCrossSlide,
        timeInClip,
        textPos,
        textStyle,
      });
    }
  });

  return results;
}
