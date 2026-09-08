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
  clientInfo?: any;
  clientMemory?: any;
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

export interface EnhanceImagePromptResult {
  enhancedPrompt: string;
  mediaSearchKeywords?: string[];
  artDirectionNotes: string;
  alternativeConcepts?: { title: string; prompt: string }[];
}

/**
 * PASO B — Director de Arte: Convierte una idea abstracta en UNA ESCENA CONCRETA (máx 25 palabras)
 * con memoria del carrusel completo para evitar repetir sujeto, acción o entorno.
 */
export async function apiBuildConcreteScene(params: {
  imageSuggestion: string;
  brief: string;
  escenasYaUsadas: string[];
  clientInfo?: any;
  brand?: any;
  targetAudience?: string;
  slide?: any;
  clientMemory?: any;
}): Promise<string> {
  const res = await fetch('/api/build-concrete-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al construir escena concreta`);
  }

  const data = await res.json();
  return data.data.escenaConcreta || '';
}

/**
 * PASO C — Redactor de Prompt Técnico para Gemini / Imagen 3 / Veo / Nano Banana
 * Toma la escena YA concreta y le agrega encuadre, cámara, luz, estilo visual y aspect ratio.
 */
export async function apiEnhanceImagePrompt(params: {
  slide?: any;
  escenaConcreta?: string;
  slideText?: string;
  slideIndex?: number;
  totalSlides?: number;
  clientInfo?: any;
  brand?: any;
  brief?: string;
  targetAudience?: string;
  visualStyle?: string;
  artDirectionMode?: string;
  isVideo?: boolean;
  aspect?: string;
  clientMemory?: any;
}): Promise<EnhanceImagePromptResult> {
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

export async function apiEnhanceAllImagePrompts(params: {
  slides: any[];
  clientInfo?: any;
  brand?: any;
  brief?: string;
  targetAudience?: string;
  visualStyle?: string;
  artDirectionMode?: string;
  isVideo?: boolean;
  aspect?: string;
  clientMemory?: any;
}): Promise<{
  slides: Array<{
    slideIndex: number;
    enhancedPrompt: string;
    mediaSearchKeywords?: string[];
    artDirectionNotes?: string;
  }>;
}> {
  const res = await fetch('/api/enhance-all-image-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status} al mejorar prompts de todo el carrusel`);
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

