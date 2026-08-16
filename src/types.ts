export type AspectRatio = '4:5' | '1:1' | '9:16' | '16:9';

export type MediaType = 'image' | 'video';

export type MediaFit = 'cover' | 'contain';

export type SlideLayoutTemplate =
  | 'standard'
  | 'split_comparison'
  | 'quote'
  | 'big_number'
  | 'checklist'
  | 'cta_final';

export interface TextStyleItem {
  fontSize?: number;
  width?: number;
  color?: string;
  outline?: boolean; // Contorno del texto (stroke de letras)
  outlineColor?: string;
  outlineWidth?: number;
  boxBorder?: boolean; // Contorno del marco / recuadro contenedor
  boxBorderColor?: string;
  boxBorderWidth?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowType?: 'soft' | 'subtle' | 'hard' | 'glow';
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: string;
  lineHeight?: number;
  textTransform?: 'uppercase' | 'none' | 'capitalize';
  transparentBox?: boolean;
  backgroundColor?: string;
}

export interface TextPosition {
  left: number; // percentage of canvas (0-100)
  top: number;  // percentage of canvas (0-100)
}

export interface ComparisonData {
  leftTag?: string;
  leftTitle?: string;
  leftText?: string;
  rightTag?: string;
  rightTitle?: string;
  rightText?: string;
}

export interface BigStatData {
  statNumber?: string;
  statLabel?: string;
  statSubtext?: string;
}

export interface QuoteData {
  quoteText?: string;
  authorName?: string;
  authorRole?: string;
}

export interface CtaFinalData {
  headline?: string;
  subheadline?: string;
  checklist?: string[];
  actionPill?: string;
  profileHandle?: string;
}

export interface CustomTextLayer {
  id: string;
  text: string;
  type?: 'heading' | 'body' | 'badge' | 'tag' | 'cta';
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontWeight?: string;
  isUppercase?: boolean;
  bgPill?: boolean;
}

export interface Slide {
  id: number;
  _uid?: string;
  layoutTemplate?: SlideLayoutTemplate;
  contentAlign?: 'top' | 'center' | 'bottom';
  badge: string;
  subtag: string;
  title: string;
  body: string;
  cta: string;
  bullets?: string[];
  customTexts?: CustomTextLayer[];
  comparison?: ComparisonData;
  stat?: BigStatData;
  quote?: QuoteData;
  ctaFinal?: CtaFinalData;
  image: string;
  mediaType?: MediaType;
  fit?: MediaFit;
  zoom?: number;
  posX?: number;
  posY?: number;
  overlayIntensity?: number; // 0 - 100
  overlayType?: 'gradient' | 'solid' | 'card' | 'cinematic';
  cardBackground?: 'translucent' | 'transparent' | 'solid';
  hideCardBoxes?: boolean;
  accentColor?: string;
  imageSuggestion?: string;
  mediaSearchKeywords?: string[]; // Media Director Keywords (English/Spanish) for auto stock photo matching
  textPos?: Record<string, TextPosition>;
  textStyle?: Record<string, TextStyleItem>;
  includeMusic?: boolean;
  musicUrl?: string;
  musicName?: string;
}

export interface BrandInfo {
  name: string;
  web: string;
  logo: string;
  logoSize: number;
  primaryColor?: string;
  secondaryColor?: string;
  handle?: string;
  fontFamily?: string;
  clientId?: string;
  textStyle?: Record<string, TextStyleItem>;
  technicalTerms?: string[];
}

export interface MarketingDocument {
  id: string;
  name: string;
  type: 'document' | 'url' | 'notes' | 'niche_generator';
  url?: string;
  content: string;
  addedAt: string;
  summary?: string;
  extractedAngles?: string[];
  extractedPains?: string[];
  technicalTerms?: string[];
}

export interface HookVariation {
  type: string;
  categoryName: string;
  badge: string;
  subtag: string;
  title: string;
  body: string;
  whyItWorks: string;
}

export interface CarouselPostMeta {
  caption: string;
  hashtags: string[];
}

export interface MarketingAnalysisResult {
  businessSummary: string;
  targetAudience: string;
  painPoints: string[];
  commonMistakes: string[];
  uniqueAngles: string[];
  recommendedHooks: string[];
  brandTone: string;
  technicalTerms?: string[];
  industryJargon?: string[];
}

export interface CarouselGenerationResponse {
  strategySummary?: string;
  hookRationale?: string;
  slides: Slide[];
  post?: CarouselPostMeta;
}

export interface SavedCarouselProject {
  id: string;
  title: string;
  clientName: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
  brand: BrandInfo;
  brief: string;
  targetAudience: string;
  postMeta: CarouselPostMeta;
  aspectRatio: AspectRatio;
}
