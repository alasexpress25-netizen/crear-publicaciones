import JSZip from 'jszip';
import { toBlob, toPng } from 'html-to-image';
import { Slide, BrandInfo } from '../types';

export function getExportFilePrefix(brandName: string): string {
  const clean = (brandName || 'carrusel')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const dateStamp = new Date().toISOString().slice(0, 10);
  return `${clean || 'carrusel'}_${dateStamp}`;
}

export function formatSlideTextForCanva(slide: Slide, brand: BrandInfo, slideIndex: number, totalSlides: number): string {
  let text = `========================================\n`;
  text += `SLIDE ${slideIndex + 1} DE ${totalSlides} — ${brand.name.toUpperCase()}\n`;
  text += `========================================\n\n`;
  if (slide.badge) text += `[INSIGNIA / BADGE]: ${slide.badge}\n`;
  if (slide.subtag) text += `[SUBTÍTULO]: ${slide.subtag}\n`;
  text += `[TÍTULO / GANCHO]: ${slide.title}\n`;
  if (slide.body) text += `[DESCRIPCIÓN]: ${slide.body}\n`;
  if (slide.bullets && slide.bullets.length > 0) {
    text += `[PUNTOS CLAVE]:\n` + slide.bullets.map(b => `  • ${b}`).join('\n') + `\n`;
  }
  if (slide.cta) text += `[LLAMADO A LA ACCIÓN]: ${slide.cta}\n`;
  if (brand.web) text += `[SITIO WEB / MARCA]: ${brand.web}\n`;
  if (slide.imageSuggestion) text += `[SUGERENCIA DE IMAGEN]: ${slide.imageSuggestion}\n`;
  text += `\n`;
  return text;
}

export function formatAllSlidesForCanva(slides: Slide[], brand: BrandInfo): string {
  return slides.map((s, idx) => formatSlideTextForCanva(s, brand, idx, slides.length)).join('\n');
}

/**
 * Capture an actual DOM slide element directly so all fonts, shadows, colors,
 * drag coordinates and layout templates match the editor with 100% pixel fidelity.
 */
export async function captureSlideDomToBlob(element: HTMLElement, scale: number = 2): Promise<Blob> {
  const blob = await toBlob(element, {
    pixelRatio: scale,
    cacheBust: true,
    skipFonts: true,
    fontEmbedCSS: '',
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.classList.contains('no-export') || node.getAttribute('data-no-export') === 'true') {
          return false;
        }
      }
      return true;
    }
  });

  if (!blob) throw new Error('No se pudo generar la imagen de la diapositiva.');
  return blob;
}

// Render a slide element directly to an HTML Canvas (2D) fallback
export async function renderSlideToCanvas(
  slide: Slide,
  brand: BrandInfo,
  aspectRatio: '4:5' | '1:1' | '9:16' | '16:9',
  scale: number = 2
): Promise<HTMLCanvasElement> {
  const aspectDimensions = {
    '4:5': { width: 1080, height: 1350 },
    '1:1': { width: 1080, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
  };

  const baseDim = aspectDimensions[aspectRatio] || aspectDimensions['4:5'];
  const canvas = document.createElement('canvas');
  canvas.width = baseDim.width * (scale / 2);
  canvas.height = baseDim.height * (scale / 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  const width = canvas.width;
  const height = canvas.height;
  const primaryColor = slide.accentColor || brand.primaryColor || '#e11d48';

  // 1. Draw Background Image
  if (slide.image) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // fallback gracefully
        img.src = slide.image;
      });

      if (img.width && img.height) {
        const iw = img.width;
        const ih = img.height;
        const canvasRatio = width / height;
        const imgRatio = iw / ih;
        let drawW: number, drawH: number;

        if (slide.fit === 'contain') {
          if (imgRatio > canvasRatio) {
            drawW = width;
            drawH = width / imgRatio;
          } else {
            drawH = height;
            drawW = height * imgRatio;
          }
        } else {
          // cover
          if (imgRatio > canvasRatio) {
            drawH = height;
            drawW = height * imgRatio;
          } else {
            drawW = width;
            drawH = width / imgRatio;
          }
        }

        const zoom = slide.zoom || 1;
        drawW *= zoom;
        drawH *= zoom;

        const posX = (slide.posX !== undefined ? slide.posX : 50) / 100;
        const posY = (slide.posY !== undefined ? slide.posY : 50) / 100;
        const dx = (width - drawW) * posX;
        const dy = (height - drawH) * posY;

        ctx.drawImage(img, dx, dy, drawW, drawH);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }
    } catch {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    // Default dark gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Dark Overlay Gradient for text readability
  const intensity = (slide.overlayIntensity !== undefined ? slide.overlayIntensity : 85) / 100;
  if (intensity > 0) {
    const overlayGrad = ctx.createLinearGradient(0, height, 0, 0);
    overlayGrad.addColorStop(0, `rgba(2, 6, 23, ${1.0 * intensity})`);
    overlayGrad.addColorStop(0.5, `rgba(2, 6, 23, ${0.85 * intensity})`);
    overlayGrad.addColorStop(1, `rgba(2, 6, 23, ${0.65 * intensity})`);
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Render Top Brand Bar (NO SLIDE NUMBER)
  const padX = width * 0.08;
  const padY = height * 0.06;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(width * 0.028)}px 'Inter', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Brand Name
  if (brand.name) {
    ctx.fillText(brand.name.toUpperCase(), padX, padY);
  }

  // 4. Render Main Content (Badge, Subtag, Title, Body, Bullets)
  let currentY = height * 0.28;

  // Badge pill
  if (slide.badge) {
    ctx.font = `bold ${Math.round(width * 0.026)}px 'Montserrat', sans-serif`;
    const badgeText = slide.badge.toUpperCase();
    const badgeWidth = ctx.measureText(badgeText).width + 30;
    const badgeHeight = Math.round(width * 0.05);

    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(padX, currentY - badgeHeight / 2, badgeWidth, badgeHeight, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, padX + 15, currentY);
    currentY += badgeHeight + 25;
  }

  // Subtag
  if (slide.subtag) {
    const subtagStyle = slide.textStyle?.subtag || {};
    ctx.font = `600 ${Math.round(width * 0.032)}px ${subtagStyle.fontFamily || "'Inter', sans-serif"}`;
    ctx.fillStyle = subtagStyle.color || primaryColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(slide.subtag, padX, currentY);
    currentY += Math.round(width * 0.06);
  }

  // Title / Hook
  if (slide.title) {
    const titleStyle = slide.textStyle?.title || {};
    const fontSize = titleStyle.fontSize ? Math.round(titleStyle.fontSize * (scale * 0.9)) : Math.round(width * 0.058);
    ctx.font = `900 ${fontSize}px ${titleStyle.fontFamily || "'Montserrat', sans-serif"}`;
    ctx.fillStyle = titleStyle.color || '#ffffff';
    ctx.textAlign = titleStyle.align || 'left';
    ctx.textBaseline = 'top';

    const maxTitleWidth = width - padX * 2;
    const words = slide.title.split(' ');
    let line = '';
    const titleLineHeight = Math.round(fontSize * 1.25);
    const alignX = titleStyle.align === 'center' ? width / 2 : titleStyle.align === 'right' ? width - padX : padX;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && i > 0) {
        ctx.fillText(line.trim(), alignX, currentY);
        line = words[i] + ' ';
        currentY += titleLineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), alignX, currentY);
    currentY += titleLineHeight + 20;
  }

  // Body
  if (slide.body) {
    const bodyStyle = slide.textStyle?.body || {};
    const fontSize = bodyStyle.fontSize ? Math.round(bodyStyle.fontSize * (scale * 0.9)) : Math.round(width * 0.034);
    ctx.font = `400 ${fontSize}px ${bodyStyle.fontFamily || "'Inter', sans-serif"}`;
    ctx.fillStyle = bodyStyle.color || '#cbd5e1';
    ctx.textAlign = bodyStyle.align || 'left';
    ctx.textBaseline = 'top';

    const maxBodyWidth = width - padX * 2;
    const bodyWords = slide.body.split(' ');
    let bodyLine = '';
    const bodyLineHeight = Math.round(fontSize * 1.35);
    const alignX = bodyStyle.align === 'center' ? width / 2 : bodyStyle.align === 'right' ? width - padX : padX;

    for (let i = 0; i < bodyWords.length; i++) {
      const testLine = bodyLine + bodyWords[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxBodyWidth && i > 0) {
        ctx.fillText(bodyLine.trim(), alignX, currentY);
        bodyLine = bodyWords[i] + ' ';
        currentY += bodyLineHeight;
      } else {
        bodyLine = testLine;
      }
    }
    ctx.fillText(bodyLine.trim(), alignX, currentY);
    currentY += bodyLineHeight + 25;
  }

  // Bullets
  if (slide.bullets && slide.bullets.length > 0) {
    slide.bullets.forEach((bullet) => {
      const bulletHeight = Math.round(width * 0.065);
      const boxWidth = width - padX * 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(padX, currentY, boxWidth, bulletHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Dot
      ctx.fillStyle = primaryColor;
      ctx.font = `bold ${Math.round(width * 0.036)}px 'Inter', sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('•', padX + 15, currentY + bulletHeight / 2);

      // Bullet Text
      ctx.fillStyle = '#f1f5f9';
      ctx.font = `500 ${Math.round(width * 0.03)}px 'Inter', sans-serif`;
      ctx.fillText(bullet, padX + 35, currentY + bulletHeight / 2);

      currentY += bulletHeight + 12;
    });
  }

  // 5. Bottom Footer Bar (CTA & Web Watermark)
  const footerY = height - padY;

  // Horizontal divider
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, footerY - 30);
  ctx.lineTo(width - padX, footerY - 30);
  ctx.stroke();

  // CTA
  if (slide.cta) {
    ctx.font = `bold ${Math.round(width * 0.03)}px 'Inter', sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(slide.cta, padX, footerY);
  }

  // Web Watermark
  if (brand.web) {
    ctx.font = `bold ${Math.round(width * 0.03)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(brand.web, width - padX, footerY);
  }

  return canvas;
}

export async function downloadSlideAsPng(
  slide: Slide,
  brand: BrandInfo,
  aspectRatio: '4:5' | '1:1' | '9:16' | '16:9'
): Promise<void> {
  const canvas = await renderSlideToCanvas(slide, brand, aspectRatio, 2);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create image blob');

  const prefix = getExportFilePrefix(brand.name);
  const link = document.createElement('a');
  link.download = `${prefix}_slide_${slide.id}.png`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

// Helper to convert base64 data URL or remote URL to Blob
export async function urlOrDataToBlob(url: string): Promise<{ blob: Blob; mimeType: string } | null> {
  if (!url) return null;
  try {
    if (url.startsWith('data:')) {
      const parts = url.split(';base64,');
      const mimeType = parts[0].replace('data:', '');
      const byteCharacters = atob(parts[1] || '');
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return { blob, mimeType };
    } else {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      return { blob, mimeType: blob.type || 'application/octet-stream' };
    }
  } catch (err) {
    console.warn('Could not extract blob from url:', url, err);
    return null;
  }
}

export function getFileExtension(mimeType: string, fallback: string): string {
  if (mimeType.includes('video/mp4')) return 'mp4';
  if (mimeType.includes('video/webm')) return 'webm';
  if (mimeType.includes('video/quicktime')) return 'mov';
  if (mimeType.includes('audio/mpeg') || mimeType.includes('audio/mp3')) return 'mp3';
  if (mimeType.includes('audio/wav')) return 'wav';
  if (mimeType.includes('audio/ogg')) return 'ogg';
  if (mimeType.includes('audio/x-m4a') || mimeType.includes('audio/m4a')) return 'm4a';
  if (mimeType.includes('image/png')) return 'png';
  if (mimeType.includes('image/jpeg')) return 'jpg';
  if (mimeType.includes('image/webp')) return 'webp';
  return fallback;
}

export async function downloadAllSlidesAsZip(
  slides: Slide[],
  brand: BrandInfo,
  aspectRatio: '4:5' | '1:1' | '9:16' | '16:9',
  postMeta?: { caption?: string; hashtags?: string[] }
): Promise<void> {
  const zip = new JSZip();
  const prefix = getExportFilePrefix(brand.name);

  // Render each slide
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    
    // 1. Render PNG design preview
    const canvas = await renderSlideToCanvas(slide, brand, aspectRatio, 2);
    const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (imageBlob) {
      zip.file(`${prefix}_slide_${i + 1}.png`, imageBlob);
    }

    // 2. Include actual video file if slide has video media
    if (slide.mediaType === 'video' && slide.image) {
      const videoData = await urlOrDataToBlob(slide.image);
      if (videoData) {
        const ext = getFileExtension(videoData.mimeType, 'mp4');
        zip.file(`${prefix}_slide_${i + 1}_video.${ext}`, videoData.blob);
      }
    }

    // 3. Include background music file if attached to slide
    if (slide.includeMusic && slide.musicUrl) {
      const audioData = await urlOrDataToBlob(slide.musicUrl);
      if (audioData) {
        const ext = getFileExtension(audioData.mimeType, 'mp3');
        const cleanAudioName = (slide.musicName || `pista_slide_${i + 1}`).replace(/\.[^/.]+$/, '');
        zip.file(`${prefix}_audio_${cleanAudioName}.${ext}`, audioData.blob);
      }
    }
  }

  // Add Canva-ready formatted text
  const canvaText = formatAllSlidesForCanva(slides, brand);
  zip.file(`${prefix}_textos_canva.txt`, canvaText);

  // Add Instagram post caption & hashtags
  if (postMeta && postMeta.caption) {
    let postContent = `${postMeta.caption}\n\n`;
    if (postMeta.hashtags && postMeta.hashtags.length > 0) {
      postContent += postMeta.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ');
    }
    zip.file(`${prefix}_copy_redes.txt`, postContent);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = `${prefix}_carrusel_completo.zip`;
  link.href = URL.createObjectURL(zipBlob);
  link.click();
  URL.revokeObjectURL(link.href);
}
