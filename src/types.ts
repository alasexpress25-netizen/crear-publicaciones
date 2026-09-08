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

export type ElementAnimationIn =
  | 'none'
  | 'fade_in'
  | 'slide_up'
  | 'slide_down'
  | 'slide_left'
  | 'slide_right'
  | 'zoom_in'
  | 'bounce_in'
  | 'pop_in'
  | 'blur_in';

export type ElementAnimationOut =
  | 'none'
  | 'fade_out'
  | 'slide_up'
  | 'slide_down'
  | 'slide_left'
  | 'slide_right'
  | 'zoom_out'
  | 'blur_out';

export interface TextStyleItem {
  fontSize?: number;
  width?: number;
  height?: number;
  color?: string;
  outline?: boolean; // Contorno del texto (stroke de letras)
  outlineColor?: string;
  outlineWidth?: number;
  boxBorder?: boolean; // Contorno del marco / recuadro contenedor
  boxBorderColor?: string;
  boxBorderWidth?: number;
  borderRadius?: number;
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
  opacity?: number;
  zIndex?: number; // Capas: orden de apilamiento / superposición (1-100)

  // Animaciones y Tiempos de Entrada y Salida (Video y Lienzo)
  animationIn?: ElementAnimationIn;
  animationInDuration?: number; // Duración en segundos (ej. 0.5)
  inDelay?: number; // Segundo exacto de entrada en la diapositiva (ej. 0.0, 0.8, 1.5)
  animationOut?: ElementAnimationOut;
  animationOutDuration?: number; // Duración en segundos de salida (ej. 0.4)
  outTime?: number; // Segundo exacto en que comienza la salida (ej. 3.0). Si es undefined, dura hasta el final.
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
  text?: string;
  type?: 'heading' | 'body' | 'badge' | 'tag' | 'cta' | 'accent' | 'box' | 'image' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  volume?: number;
  isMuted?: boolean;
  opacity?: number;
  scale?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontWeight?: string;
  isUppercase?: boolean;
  bgPill?: boolean;
  boxWidth?: number;
  boxHeight?: number;
  borderRadius?: number;
  accentType?: 'bar' | 'glow' | 'badge' | 'line' | 'dot';

  // Animaciones y Tiempos
  animationIn?: ElementAnimationIn;
  animationInDuration?: number;
  inDelay?: number;
  animationOut?: ElementAnimationOut;
  animationOutDuration?: number;
  outTime?: number;
}

export interface SubtitleItem {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  stylePreset?: 'hormozi' | 'minimal' | 'neon' | 'box';
  color?: string;
  backgroundColor?: string;
}

export interface VoiceoverTrack {
  id?: string;
  url?: string;
  audioUrl?: string;
  name: string;
  volume: number;
  isMuted?: boolean;
  duration?: number;
  startOffset?: number;
  text?: string;
  scriptText?: string;
  language?: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
}

export type TransitionType =
  | 'crossfade'
  | 'fade_black'
  | 'fade_white'
  | 'slide_left'
  | 'slide_right'
  | 'slide_up'
  | 'slide_down'
  | 'zoom_in'
  | 'zoom_out'
  | 'wipe_left'
  | 'wipe_right'
  | 'spin_zoom'
  | 'glitch'
  | 'blur_dissolve'
  | 'light_leak'
  | 'none';

export type SceneMotionEffect =
  | 'none'
  | 'ken_burns_zoom_in'
  | 'ken_burns_zoom_out'
  | 'pan_left_right'
  | 'pan_right_left'
  | 'cinematic_float'
  | 'fade_elements'
  | 'pulse'
  | 'parallax_drift'
  | 'shaky_cam'
  | 'rgb_glitch'
  | 'tilt_perspective'
  | 'vignette_pulse';

export type AudioEffectType =
  | 'none'
  | 'bass_boost'
  | 'reverb_hall'
  | 'lowpass_filter'
  | 'high_energy'
  | 'vintage_radio';

export interface VideoAudioTrack {
  id?: string;
  url: string;
  name: string;
  volume: number; // 0 - 1
  isMuted?: boolean;
  duration?: number; // Duración recortada del audio en segundos
  startOffset?: number; // Inicio recortado en segundos (trim start)
  speed?: number; // Velocidad de reproducción (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
  fadeIn?: number; // Segundos de fundido de entrada (0 a 5s)
  fadeOut?: number; // Segundos de fundido de salida (0 a 5s)
  loop?: boolean; // Repetir en bucle si el video es más largo
  audioEffect?: AudioEffectType; // Filtros y efectos de masterización
  channelType?: 'music' | 'voiceover' | 'sfx' | 'ambient' | 'custom';
  color?: string;
}

export interface AudioChannelLane {
  id: string;
  name: string;
  channelNumber?: number; // ej. 4, 5, 6...
  volume: number;
  isMuted?: boolean;
  color?: string;
  clips: VideoAudioTrack[];
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
  blur?: number; // 0 - 25px blur / out of focus
  overlayIntensity?: number; // 0 - 100
  overlayType?: 'gradient' | 'solid' | 'card' | 'cinematic';
  backgroundColor?: string; // Color sólido de fondo de la diapositiva (Capa 0)
  cardBackground?: 'translucent' | 'transparent' | 'solid';
  hideCardBoxes?: boolean;
  hiddenElements?: string[]; // Array of element keys that the user explicitly deleted/hidden
  accentColor?: string;
  imageSuggestion?: string;
  mediaSearchKeywords?: string[]; // Media Director Keywords (English/Spanish) for auto stock photo matching
  textPos?: Record<string, TextPosition>;
  textStyle?: Record<string, TextStyleItem>;
  includeMusic?: boolean;
  musicUrl?: string;
  musicName?: string;
  // Video Timeline & Motion Properties
  duration?: number; // Duración de la escena en segundos (ej. 3.5s)
  transition?: TransitionType; // Efecto de transición hacia la siguiente escena
  transitionDuration?: number; // Duración de la transición en segundos (ej. 0.6s)
  effect?: SceneMotionEffect; // Efecto de movimiento / fotograma (Ken Burns, Pan, Fade...)
  speed?: number; // Multiplicador de velocidad (0.5x, 1x, 1.5x, 2x)
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
  hiddenElements?: string[]; // Array of brand element keys (brandLogo, brandName, etc.) that the user explicitly deleted/hidden
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
  audioTrack?: VideoAudioTrack;
  subtitles?: SubtitleItem[];
  voiceoverTrack?: VoiceoverTrack;
  sfxClips?: VideoAudioTrack[];
  extraAudioTracks?: VideoAudioTrack[];
  extraAudioChannels?: AudioChannelLane[];
}
