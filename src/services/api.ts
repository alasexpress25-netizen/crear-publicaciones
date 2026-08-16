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
  technicalTerms?: string[];
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

export async function apiGenerateNicheKnowledge(params: {
  niche: string;
  language?: string;
}): Promise<{
  title: string;
  businessSummary: string;
  targetAudience: string;
  technicalTerms: string[];
  painPoints: string[];
  commonMistakes: string[];
  uniqueAngles: string[];
  recommendedHooks: string[];
  brandTone: string;
}> {
  const res = await fetch('/api/generate-niche-knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al generar conocimiento del nicho`);
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

export async function apiTranslateCarousel(params: {
  slides: any[];
  postMeta?: any;
  targetLanguage: 'es' | 'pt' | 'en';
}): Promise<{ slides: any[]; post?: any }> {
  const res = await fetch('/api/translate-carousel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al traducir carrusel`);
  }

  const data = await res.json();
  return data.data;
}

export async function apiRewriteSlide(params: {
  slide: any;
  instruction: string;
  customPrompt?: string;
  brief?: string;
  targetAudience?: string;
  technicalTerms?: string[];
  language?: string;
}): Promise<Partial<any>> {
  const res = await fetch('/api/rewrite-slide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al re-escribir la diapositiva`);
  }

  const data = await res.json();
  return data.data;
}

