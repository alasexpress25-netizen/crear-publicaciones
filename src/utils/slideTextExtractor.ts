import { Slide } from '../types';

/**
 * Extracts all textual content placed on a specific slide/fotograma.
 * Gathers titles, bodies, badges, custom text layers placed on canvas, quotes, stats, etc.
 */
export function extractSlideAllText(slide: Slide): string {
  if (!slide) return '';
  const parts: string[] = [];

  // Badge / Subtag
  if (slide.badge?.trim() && !slide.hiddenElements?.includes('badge')) {
    parts.push(slide.badge.trim());
  }
  if (slide.subtag?.trim() && !slide.hiddenElements?.includes('subtag')) {
    parts.push(slide.subtag.trim());
  }

  // Main Title & Body
  if (slide.title?.trim() && !slide.hiddenElements?.includes('title')) {
    parts.push(slide.title.trim());
  }
  if (slide.body?.trim() && !slide.hiddenElements?.includes('body')) {
    parts.push(slide.body.trim());
  }

  // Bullets
  if (slide.bullets && slide.bullets.length > 0 && !slide.hiddenElements?.includes('bullets')) {
    slide.bullets.forEach((b) => {
      if (b?.trim()) parts.push(b.trim());
    });
  }

  // Stat layout
  if (slide.stat) {
    if (slide.stat.statNumber?.trim() && !slide.hiddenElements?.includes('stat-number')) {
      parts.push(slide.stat.statNumber.trim());
    }
    if (slide.stat.statLabel?.trim() && !slide.hiddenElements?.includes('stat-label')) {
      parts.push(slide.stat.statLabel.trim());
    }
    if (slide.stat.statSubtext?.trim() && !slide.hiddenElements?.includes('stat-subtext')) {
      parts.push(slide.stat.statSubtext.trim());
    }
  }

  // Quote layout
  if (slide.quote) {
    if (slide.quote.quoteText?.trim() && !slide.hiddenElements?.includes('quote-text')) {
      parts.push(`"${slide.quote.quoteText.trim()}"`);
    }
    if (slide.quote.authorName?.trim() && !slide.hiddenElements?.includes('quote-author')) {
      parts.push(slide.quote.authorName.trim());
    }
  }

  // Comparison layout
  if (slide.comparison) {
    if (slide.comparison.leftTitle?.trim()) parts.push(slide.comparison.leftTitle.trim());
    if (slide.comparison.leftText?.trim()) parts.push(slide.comparison.leftText.trim());
    if (slide.comparison.rightTitle?.trim()) parts.push(slide.comparison.rightTitle.trim());
    if (slide.comparison.rightText?.trim()) parts.push(slide.comparison.rightText.trim());
  }

  // CTA Final layout
  if (slide.ctaFinal) {
    if (slide.ctaFinal.headline?.trim() && !slide.hiddenElements?.includes('cta-headline')) {
      parts.push(slide.ctaFinal.headline.trim());
    }
    if (slide.ctaFinal.subheadline?.trim() && !slide.hiddenElements?.includes('cta-subheadline')) {
      parts.push(slide.ctaFinal.subheadline.trim());
    }
    if (slide.ctaFinal.actionPill?.trim() && !slide.hiddenElements?.includes('cta-pill')) {
      parts.push(slide.ctaFinal.actionPill.trim());
    }
  }

  // Custom text layers placed on the canvas
  if (slide.customTexts && slide.customTexts.length > 0) {
    slide.customTexts.forEach((ct) => {
      // Exclude media layers, only pick text layers
      const isMedia =
        ct.type === 'video' ||
        ct.type === 'image' ||
        Boolean(ct.videoUrl) ||
        Boolean(ct.imageUrl) ||
        ct.id.startsWith('v2-') ||
        ct.id.startsWith('custom-vid-') ||
        ct.id.startsWith('custom-img-');

      if (!isMedia && ct.text?.trim()) {
        parts.push(ct.text.trim());
      }
    });
  }

  return parts.join('. ');
}

/**
 * Extracts all text across all slides/scenes in the presentation.
 */
export function extractAllSlidesText(slides: Slide[]): string {
  return slides
    .map((s, idx) => {
      const slideText = extractSlideAllText(s);
      return slideText ? `[Escena ${idx + 1}] ${slideText}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}
