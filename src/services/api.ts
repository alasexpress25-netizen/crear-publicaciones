import {
  CarouselGenerationResponse,
  HookVariation,
  MarketingAnalysisResult,
  BrandInfo
} from '../types';

export async function apiAnalyzeMarketingSource(
  source: { url?: string; rawText?: string; documentName?: string }
): Promise<MarketingAnalysisResult> {
  const res = await fetch('/api/analyze-marketing-source', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al analizar fuente de marketing`);
  }

  const data = await res.json();
  return data.data;
}

export async function apiGenerateCarousel(params: {
  brief: string;
  slideCount: number;
  objective: string;
  hookType: string;
  targetAudience?: string;
  knowledgeBase?: string;
  brand: BrandInfo;
  language?: string;
}): Promise<CarouselGenerationResponse> {
  const res = await fetch('/api/generate-carousel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al generar carrusel`);
  }

  const data = await res.json();
  return data.data;
}

export async function apiGenerateHooks(params: {
  brief: string;
  targetAudience?: string;
  knowledgeBase?: string;
  language?: string;
}): Promise<HookVariation[]> {
  const res = await fetch('/api/generate-hooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al generar ganchos`);
  }

  const data = await res.json();
  return data.data.hooks || [];
}

export async function apiEnhanceImagePrompt(params: {
  slideText: string;
  brief: string;
  visualStyle: string;
  isVideo: boolean;
  aspect: string;
}): Promise<{ enhancedPrompt: string; artDirectionNotes: string }> {
  const res = await fetch('/api/enhance-image-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al mejorar prompt`);
  }

  const data = await res.json();
  return data.data;
}
