import React, { useState, useEffect } from 'react';
import {
  Slide,
  BrandInfo,
  AspectRatio,
  MarketingDocument,
  CarouselPostMeta,
  TextStyleItem,
  MarketingAnalysisResult,
  SlideLayoutTemplate,
  ComparisonData,
  BigStatData,
  QuoteData,
  CtaFinalData,
  SavedCarouselProject
} from './types';
import {
  INITIAL_DEFAULT_SLIDES,
  DEFAULT_MARKETING_DOCUMENTS
} from './data/marketingPlaybooks';
import { applyLayoutTemplateToSlide, getTemplateLocalization } from './data/templateLocalizations';
import { AgencyClient, getFallbackAgencyClients } from './services/supabase';
import { findLogoForClient } from './services/clientLogosStorage';
import {
  getClientLanguage,
  saveClientLanguage,
  getStoredAppLanguage,
  setStoredAppLanguage,
  initClientLanguagesFromDB,
} from './services/clientLanguageStorage';
import { apiTranslateCarousel } from './services/api';
import { Header } from './components/Header';
import { CanvasSlide } from './components/CanvasSlide';
import { SlideNavigation } from './components/SlideNavigation';
import { TextStyleBar } from './components/TextStyleBar';
import { AiPanel } from './components/AiPanel';
import { MediaPanel } from './components/MediaPanel';
import { GridOverview } from './components/GridOverview';
import { SidebarAspect } from './components/SidebarAspect';
import { MobileTabBar, WorkspaceTab } from './components/MobileTabBar';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { HookOptimizerModal } from './components/HookOptimizerModal';
import { PostCaptionModal } from './components/PostCaptionModal';
import { ExportModal } from './components/ExportModal';
import { ClientSelectorModal } from './components/ClientSelectorModal';
import { ProjectsManagerModal } from './components/ProjectsManagerModal';
import { SlideAiRewriteModal } from './components/SlideAiRewriteModal';

const LOCAL_STORAGE_SLIDES_KEY = 'lavisualmk_carousel_slides_v3';
const LOCAL_STORAGE_BRAND_KEY = 'lavisualmk_carousel_brand_v3';
const LOCAL_STORAGE_DOCS_KEY = 'lavisualmk_carousel_docs_v3';
const LOCAL_STORAGE_POST_KEY = 'lavisualmk_carousel_post_v3';
const LOCAL_STORAGE_CLIENT_KEY = 'lavisualmk_carousel_client_v3';

export default function App() {
  // Agency Client State (Supabase connected)
  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(() => {
    let client: AgencyClient | null = null;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CLIENT_KEY);
      if (saved) client = JSON.parse(saved);
    } catch {}
    if (!client) {
      const fallbacks = getFallbackAgencyClients();
      client = fallbacks[0] || null;
    }
    if (client) {
      const resolvedLang = getClientLanguage(client.id, client.name, client.language || 'es');
      return { ...client, language: resolvedLang };
    }
    return null;
  });

  // Brand State
  const [brand, setBrand] = useState<BrandInfo>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BRAND_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'LA VISUAL MK',
      web: 'lavisualmk.com',
      logo: '',
      logoSize: 20,
      primaryColor: '#e11d48',
      handle: 'lavisualmk',
    };
  });

  // Carousel Slides State
  const [slides, setSlides] = useState<Slide[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SLIDES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DEFAULT_SLIDES;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [activeElementKey, setActiveElementKey] = useState<string | null>('title');
  const [mobileTab, setMobileTab] = useState<WorkspaceTab>('canvas');

  // AI & Marketing Strategist Controls State
  const [brief, setBrief] = useState<string>(
    'Agencia de marketing digital y producción de contenido que ayuda a pymes y profesionales a conseguir clientes calificados sin depender de la suerte.'
  );
  const [targetAudience, setTargetAudience] = useState<string>(
    'Dueños de negocios, emprendedores y profesionales que quieren vender más por redes'
  );
  const [visualStyle, setVisualStyle] = useState<string>(
    'La Visual MK (Bordó/Rose & Obsidian)'
  );
  const [slideCount, setSlideCount] = useState<number>(4);
  const [objective, setObjective] = useState<string>('ventas');
  const [hookType, setHookType] = useState<string>('pregunta_reflexiva');
  const [language, setLanguage] = useState<'es' | 'pt' | 'en'>(() => {
    let client: AgencyClient | null = null;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CLIENT_KEY);
      if (saved) client = JSON.parse(saved);
    } catch {}
    if (client) {
      return getClientLanguage(client.id, client.name, client.language || 'es');
    }
    return getStoredAppLanguage('es');
  });
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Reconcile languages from IndexedDB on startup
  useEffect(() => {
    initClientLanguagesFromDB().then((mapping) => {
      if (selectedClient) {
        const custom = mapping[selectedClient.id] || (selectedClient.name ? mapping[selectedClient.name.toLowerCase().trim()] : null);
        if (custom && custom !== language) {
          setLanguage(custom);
          setSelectedClient((prev) => prev ? { ...prev, language: custom } : prev);
        }
      }
    }).catch(console.warn);
  }, []);

  // Knowledge Base Documents
  const [documents, setDocuments] = useState<MarketingDocument[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MARKETING_DOCUMENTS;
  });

  // Social Post Copy & Hashtags
  const [postMeta, setPostMeta] = useState<CarouselPostMeta>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_POST_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      caption: `¿Por qué tu servicio es excelente pero tus ventas no despegan? 🛑\n\nEl 90% de los negocios comete el mismo error silencioso: publican sin una oferta clara y usan ganchos genéricos que nadie recuerda.\n\nDesliza para ver los 3 ajustes que puedes hacer esta semana para que tus clientes potenciales te elijan a ti antes que a tu competencia.\n\n💬 Si quieres una auditoría estratégica sin costo de tus publicaciones, escríbenos "CARRUSEL" por mensaje directo y te enviamos un diagnóstico en video.`,
      hashtags: ['marketingdigital', 'estrategiadeventas', 'emprendedores', 'negocioslocales', 'carruselestrategico']
    };
  });

  // Modals state
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [isHookLabOpen, setIsHookLabOpen] = useState(false);
  const [isPostCaptionOpen, setIsPostCaptionOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSlideRewriteOpen, setIsSlideRewriteOpen] = useState(false);

  // Load Saved Project Handler
  const handleLoadSavedProject = (proj: SavedCarouselProject) => {
    if (proj.slides && proj.slides.length > 0) setSlides(proj.slides);
    if (proj.brand) setBrand(proj.brand);
    if (proj.brief) setBrief(proj.brief);
    if (proj.targetAudience) setTargetAudience(proj.targetAudience);
    if (proj.postMeta) setPostMeta(proj.postMeta);
    if (proj.aspectRatio) setAspectRatio(proj.aspectRatio);
    setCurrentIndex(0);
  };

  const handleCreateNewBlankProject = () => {
    setSlides(INITIAL_DEFAULT_SLIDES);
    setBrief('');
    setCurrentIndex(0);
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SLIDES_KEY, JSON.stringify(slides));
      localStorage.setItem(LOCAL_STORAGE_BRAND_KEY, JSON.stringify(brand));
      localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(documents));
      localStorage.setItem(LOCAL_STORAGE_POST_KEY, JSON.stringify(postMeta));
      if (selectedClient) {
        localStorage.setItem(LOCAL_STORAGE_CLIENT_KEY, JSON.stringify(selectedClient));
      }
    } catch {}
  }, [slides, brand, documents, postMeta, selectedClient]);

  // Active slide safety check
  const currentSlide = slides[currentIndex] || slides[0] || INITIAL_DEFAULT_SLIDES[0];

  // Client Selection Handler (from Supabase)
  const handleSelectClient = (client: AgencyClient, context?: any) => {
    const resolvedLang = getClientLanguage(client.id, client.name, client.language || 'es');
    const updatedClient = { ...client, language: resolvedLang };
    setSelectedClient(updatedClient);
    saveClientLanguage(client.id, client.name, resolvedLang);

    // Update Brand Info
    const primaryCol = client.brand_color || '#e11d48';
    const logoToUse = client.logo_url || findLogoForClient(client.id, client.name) || '';
    setBrand((prev) => ({
      ...prev,
      name: client.name,
      web: client.website || prev.web,
      handle: client.instagram_handle || prev.handle,
      logo: logoToUse,
      primaryColor: primaryCol,
      clientId: client.id,
    }));

    // Update Language automatically from client profile
    const previousLang = language;
    setLanguage(resolvedLang);
    setStoredAppLanguage(resolvedLang);
    if (resolvedLang !== previousLang) {
      handleTranslateCarousel(resolvedLang);
    }

    // Update Brief & Audience
    if (client.business_type || client.industry) {
      setBrief(
        `${client.name} - ${client.business_type || client.industry}. ${
          client.knowledge_base ? client.knowledge_base.slice(0, 200) : ''
        }`
      );
    }
    if (client.target_audience) {
      setTargetAudience(client.target_audience);
    }

    // Update slides accent colors
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        accentColor: primaryCol,
      }))
    );

    // Add client knowledge base as an active marketing document if present
    if (client.knowledge_base || context?.knowledge_base) {
      const kbText = client.knowledge_base || context?.knowledge_base;
      const docId = `client-doc-${client.id}`;
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.id !== docId);
        const newDoc: MarketingDocument = {
          id: docId,
          name: `Base de Conocimiento: ${client.name}`,
          type: 'notes',
          content: kbText,
          addedAt: new Date().toLocaleDateString(),
          summary: `Perfil de cliente ${client.name} (${client.business_type || client.industry}). Audiencia: ${client.target_audience || 'General'}.`,
        };
        return [newDoc, ...filtered];
      });
    }
  };

  // Slide CRUD Handlers
  const handleUpdateSlideField = (field: keyof Slide, value: any) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      copy[currentIndex] = {
        ...copy[currentIndex],
        [field]: value,
      };
      return copy;
    });
  };

  const handleUpdateBullet = (bulletIndex: number, value: string) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const bullets = [...(copy[currentIndex].bullets || [])];
      bullets[bulletIndex] = value;
      copy[currentIndex] = {
        ...copy[currentIndex],
        bullets,
      };
      return copy;
    });
  };

  const handleUpdateSlidePartial = (partial: Partial<Slide>) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      copy[currentIndex] = {
        ...copy[currentIndex],
        ...partial,
      };
      return copy;
    });
  };

  const handleUpdateSlideLayout = (layout: SlideLayoutTemplate) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const targetLang = language || selectedClient?.language || 'es';
      const updated = applyLayoutTemplateToSlide(copy[currentIndex], layout, targetLang, brand.name);
      copy[currentIndex] = updated;
      return copy;
    });
  };

  const handleUpdateSlideOverlayType = (type: 'gradient' | 'solid' | 'card' | 'cinematic') => {
    handleUpdateSlideField('overlayType', type);
  };

  const handleUpdateSlideAccentColor = (color: string) => {
    handleUpdateSlideField('accentColor', color);
    setBrand((prev) => ({ ...prev, primaryColor: color }));
  };

  const handleUpdateComparison = (partial: Partial<ComparisonData>) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      copy[currentIndex] = {
        ...copy[currentIndex],
        comparison: {
          ...(copy[currentIndex].comparison || {}),
          ...partial,
        },
      };
      return copy;
    });
  };

  const handleUpdateStat = (partial: Partial<BigStatData>) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      copy[currentIndex] = {
        ...copy[currentIndex],
        stat: {
          ...(copy[currentIndex].stat || {}),
          ...partial,
        },
      };
      return copy;
    });
  };

  const handleUpdateQuote = (partial: Partial<QuoteData>) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      copy[currentIndex] = {
        ...copy[currentIndex],
        quote: {
          ...(copy[currentIndex].quote || {}),
          ...partial,
        },
      };
      return copy;
    });
  };

  const handleUpdateCtaFinal = (partial: Partial<CtaFinalData>) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      copy[currentIndex] = {
        ...copy[currentIndex],
        ctaFinal: {
          ...(copy[currentIndex].ctaFinal || {}),
          ...partial,
        },
      };
      return copy;
    });
  };

  const handleUpdateTextStyle = (key: string, stylePartial: Partial<TextStyleItem>) => {
    if (key === 'brandName' || key === 'brandWeb' || key === 'brandHandle') {
      setBrand((prev) => ({
        ...prev,
        textStyle: {
          ...prev.textStyle,
          [key]: {
            ...(prev.textStyle?.[key] || {}),
            ...stylePartial,
          },
        },
      }));
    } else {
      setSlides((prev) => {
        const copy = [...prev];
        if (!copy[currentIndex]) return prev;
        const currentStyles = copy[currentIndex].textStyle || {};
        copy[currentIndex] = {
          ...copy[currentIndex],
          textStyle: {
            ...currentStyles,
            [key]: {
              ...(currentStyles[key] || {}),
              ...stylePartial,
            },
          },
        };
        return copy;
      });
    }
  };

  const handleResetTextStyle = (key: string) => {
    if (key === 'brandName' || key === 'brandWeb' || key === 'brandHandle') {
      setBrand((prev) => {
        const textStyle = { ...(prev.textStyle || {}) };
        delete textStyle[key];
        return { ...prev, textStyle };
      });
    } else {
      setSlides((prev) => {
        const copy = [...prev];
        if (!copy[currentIndex]) return prev;
        const textStyle = { ...(copy[currentIndex].textStyle || {}) };
        delete textStyle[key];
        copy[currentIndex] = {
          ...copy[currentIndex],
          textStyle,
        };
        return copy;
      });
    }
  };

  const handleUpdateBrand = (field: keyof BrandInfo, value: any) => {
    setBrand((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeleteActiveElement = (key: string) => {
    if (!key) return;
    if (key === 'badge' || key === 'subtag' || key === 'title' || key === 'body' || key === 'cta') {
      handleUpdateSlideField(key as keyof Slide, '');
      setActiveElementKey(null);
    } else if (key === 'brandHandle') {
      handleUpdateBrand('handle', '');
      setActiveElementKey(null);
    } else if (key.startsWith('bullet-')) {
      const idx = parseInt(key.replace('bullet-', ''), 10);
      handleDeleteBullet(idx);
      setActiveElementKey(null);
    } else if (key.startsWith('custom-')) {
      handleDeleteCustomText(key);
      setActiveElementKey(null);
    } else if (key.startsWith('comp-')) {
      const field = key.replace('comp-', '') as keyof ComparisonData;
      handleUpdateComparison({ [field]: '' });
      setActiveElementKey(null);
    } else if (key.startsWith('quote-')) {
      if (key === 'quote-text') handleUpdateQuote({ quoteText: '' });
      if (key === 'quote-author') handleUpdateQuote({ authorName: '' });
      if (key === 'quote-role') handleUpdateQuote({ authorRole: '' });
      setActiveElementKey(null);
    } else if (key.startsWith('stat-')) {
      if (key === 'stat-number') handleUpdateStat({ statNumber: '' });
      if (key === 'stat-label') handleUpdateStat({ statLabel: '' });
      if (key === 'stat-subtext') handleUpdateStat({ statSubtext: '' });
      setActiveElementKey(null);
    } else if (key.startsWith('cta-')) {
      if (key === 'cta-headline') handleUpdateCtaFinal({ headline: '' });
      if (key === 'cta-subheadline') handleUpdateCtaFinal({ subheadline: '' });
      if (key === 'cta-pill') handleUpdateCtaFinal({ actionPill: '' });
      setActiveElementKey(null);
    }
  };

  const handleAddCustomText = (type: 'heading' | 'body' | 'badge' = 'body') => {
    const newId = `custom-${Date.now()}`;
    const newLayer = {
      id: newId,
      text: type === 'heading' ? 'NUEVO SUBTÍTULO O TITULAR' : type === 'badge' ? 'ETIQUETA DESTACADA' : 'Escribe aquí tu nuevo texto o aclaración adicional.',
      fontSize: type === 'heading' ? 20 : type === 'badge' ? 11 : 14,
      color: type === 'badge' ? (currentSlide.accentColor || brand.primaryColor || '#e11d48') : '#ffffff',
      align: 'left' as const,
    };
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const customTexts = [...(copy[currentIndex].customTexts || []), newLayer];
      copy[currentIndex] = { ...copy[currentIndex], customTexts };
      return copy;
    });
    setActiveElementKey(newId);
  };

  const handleUpdateCustomText = (id: string, text: string) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const customTexts = (copy[currentIndex].customTexts || []).map((ct) =>
        ct.id === id ? { ...ct, text } : ct
      );
      copy[currentIndex] = { ...copy[currentIndex], customTexts };
      return copy;
    });
  };

  const handleDeleteCustomText = (id: string) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const customTexts = (copy[currentIndex].customTexts || []).filter((ct) => ct.id !== id);
      copy[currentIndex] = { ...copy[currentIndex], customTexts };
      return copy;
    });
    if (activeElementKey === id) setActiveElementKey(null);
  };

  const handleDeleteBullet = (index: number) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const bullets = (copy[currentIndex].bullets || []).filter((_, i) => i !== index);
      copy[currentIndex] = { ...copy[currentIndex], bullets };
      return copy;
    });
  };

  const handleAddBullet = () => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const bullets = [...(copy[currentIndex].bullets || []), 'Nuevo punto clave destacado'];
      copy[currentIndex] = { ...copy[currentIndex], bullets };
      return copy;
    });
  };

  const handleUpdateSlideContentAlign = (align: 'top' | 'center' | 'bottom') => {
    handleUpdateSlideField('contentAlign', align);
  };

  const handleUpdateTextPos = (key: string, pos: { left: number; top: number } | null) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const currentPos = { ...(copy[currentIndex].textPos || {}) };
      if (pos === null) {
        delete currentPos[key];
      } else {
        currentPos[key] = pos;
      }
      copy[currentIndex] = {
        ...copy[currentIndex],
        textPos: currentPos,
      };
      return copy;
    });
  };

  const handleTranslateCarousel = async (targetLang: 'es' | 'pt' | 'en') => {
    setIsTranslating(true);
    setLanguage(targetLang);
    setStoredAppLanguage(targetLang);
    if (selectedClient) {
      saveClientLanguage(selectedClient.id, selectedClient.name, targetLang);
      setSelectedClient((prev) => (prev ? { ...prev, language: targetLang } : prev));
    }
    try {
      const translated = await apiTranslateCarousel({
        slides,
        targetLanguage: targetLang,
        postMeta,
      });
      if (translated && translated.slides && translated.slides.length > 0) {
        setSlides(translated.slides);
        if (translated.post) {
          setPostMeta(translated.post);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al traducir el carrusel: ' + (err.message || 'Intente nuevamente.'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddSlide = () => {
    const primaryCol = brand.primaryColor || '#e11d48';
    const loc = getTemplateLocalization(language);
    const newSlide: Slide = {
      id: slides.length + 1,
      _uid: `sl-${Date.now()}`,
      layoutTemplate: 'standard',
      badge: loc.standard.badge,
      subtag: loc.standard.subtag,
      title: language === 'pt' ? 'TÍTULO DO NOVO SLIDE' : language === 'en' ? 'NEW SLIDE HEADLINE' : 'TÍTULO DE LA NUEVA DIAPOSITIVA',
      body: language === 'pt' ? 'Escreva aqui a explicação clara e persuasiva.' : language === 'en' ? 'Write here the clear and persuasive explanation.' : 'Escribe aquí la explicación clara y persuasiva.',
      cta: loc.standard.cta,
      bullets: [],
      accentColor: primaryCol,
      image: currentSlide.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'image',
      fit: 'cover',
      zoom: 1,
      posX: 50,
      posY: 50,
      overlayIntensity: 85,
    };
    setSlides((prev) => [...prev, newSlide]);
    setCurrentIndex(slides.length);
  };

  const handleDuplicateSlide = () => {
    const clone: Slide = {
      ...JSON.parse(JSON.stringify(currentSlide)),
      id: slides.length + 1,
      _uid: `sl-${Date.now()}`,
    };
    setSlides((prev) => {
      const next = [...prev];
      next.splice(currentIndex + 1, 0, clone);
      return next.map((s, idx) => ({ ...s, id: idx + 1 }));
    });
    setCurrentIndex(currentIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides((prev) => {
      const next = prev.filter((_, i) => i !== currentIndex);
      return next.map((s, idx) => ({ ...s, id: idx + 1 }));
    });
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleResetCarousel = () => {
    if (confirm('¿Deseas reiniciar el carrusel a la plantilla por defecto?')) {
      setSlides(INITIAL_DEFAULT_SLIDES);
      setCurrentIndex(0);
    }
  };

  const handleApplyGeneratedCarousel = (newSlides: Slide[], newPostMeta?: CarouselPostMeta, _rationale?: string) => {
    if (newSlides && newSlides.length > 0) {
      const primaryCol = brand.primaryColor || '#e11d48';
      setSlides(newSlides.map((s, idx) => ({
        ...s,
        id: idx + 1,
        _uid: s._uid || `sl-${Date.now()}-${idx}`,
        layoutTemplate: s.layoutTemplate || (idx === 0 ? 'standard' : idx === newSlides.length - 1 ? 'cta_final' : 'standard'),
        accentColor: s.accentColor || primaryCol,
        overlayIntensity: s.overlayIntensity ?? 85,
        image: s.image || slides[idx]?.image || currentSlide.image || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
      })));
      setCurrentIndex(0);
      if (newPostMeta) {
        setPostMeta(newPostMeta);
      }
    }
  };

  const handleApplyAnalysisToBrief = (analysis: MarketingAnalysisResult) => {
    if (analysis.businessSummary) {
      setBrief(analysis.businessSummary);
    }
    if (analysis.targetAudience) {
      setTargetAudience(analysis.targetAudience);
    }
    if (analysis.recommendedHooks && analysis.recommendedHooks.length > 0) {
      // Apply first recommended hook to Slide 1
      setSlides((prev) => {
        const copy = [...prev];
        if (copy[0]) {
          copy[0] = {
            ...copy[0],
            badge: 'PREGUNTA CLAVE',
            title: analysis.recommendedHooks[0].toUpperCase(),
          };
        }
        return copy;
      });
    }
  };

  const handleApplyHookToSlide1 = (hookData: Partial<Slide>) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (copy[0]) {
        copy[0] = {
          ...copy[0],
          ...hookData,
        };
      }
      return copy;
    });
    setCurrentIndex(0);
  };

  const handleApplyRewrittenSlide = (updatedSlideData: Partial<Slide>) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (copy[currentIndex]) {
        copy[currentIndex] = {
          ...copy[currentIndex],
          ...updatedSlideData,
        };
      }
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      
      {/* Top Main Navigation Header */}
      <Header
        brand={brand}
        onUpdateBrand={handleUpdateBrand}
        aspectRatio={aspectRatio}
        onSelectAspect={setAspectRatio}
        selectedClientName={selectedClient?.name}
        selectedClientColor={selectedClient?.brand_color}
        language={language}
        onOpenClientSelector={() => setIsClientSelectorOpen(true)}
        onResetCarousel={handleResetCarousel}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-28 sm:pb-24 space-y-5">
        
        {isGridView || mobileTab === 'grid' ? (
          /* Grid View Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Vista Panorámica del Carrusel</span>
                <span className="text-[10px] bg-rose-950/70 border border-rose-600/40 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                  {slides.length} diapositivas
                </span>
              </div>
              <button
                onClick={() => {
                  setIsGridView(false);
                  setMobileTab('canvas');
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <span>Volver al Lienzo</span>
              </button>
            </div>
            <GridOverview
              slides={slides}
              brand={brand}
              aspectRatio={aspectRatio}
              currentIndex={currentIndex}
              onSelectSlide={(idx) => {
                setCurrentIndex(idx);
                setIsGridView(false);
                setMobileTab('canvas');
              }}
            />
          </div>
        ) : mobileTab === 'ai' ? (
          /* Full AI Strategist View Mode */
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Estratega de Marketing con IA</span>
              </div>
              <button
                onClick={() => setMobileTab('canvas')}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-600/30 px-3 py-1.5 rounded-xl transition"
              >
                Volver al Lienzo de Trabajo →
              </button>
            </div>
            <AiPanel
              brief={brief}
              onChangeBrief={setBrief}
              targetAudience={targetAudience}
              onChangeTargetAudience={setTargetAudience}
              visualStyle={visualStyle}
              onChangeVisualStyle={setVisualStyle}
              slideCount={slideCount}
              onChangeSlideCount={setSlideCount}
              objective={objective}
              onChangeObjective={setObjective}
              hookType={hookType}
              onChangeHookType={setHookType}
              brand={brand}
              activeDocuments={documents}
              selectedClient={selectedClient}
              language={language}
              onChangeLanguage={setLanguage}
              postMeta={postMeta}
              onOpenPostCaption={() => setIsPostCaptionOpen(true)}
              onOpenClientSelector={() => setIsClientSelectorOpen(true)}
              onOpenKnowledgeBase={() => setIsKnowledgeOpen(true)}
              onOpenHookLab={() => setIsHookLabOpen(true)}
              onApplyGeneratedCarousel={(newSlides, newPostMeta, rationale) => {
                handleApplyGeneratedCarousel(newSlides, newPostMeta, rationale);
                setMobileTab('canvas');
              }}
            />
          </div>
        ) : mobileTab === 'media' ? (
          /* Full Media & Visuals View Mode */
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Galería de Fondos, Imágenes & Efectos</span>
                <span className="text-[10px] text-slate-400">Diapositiva #{currentIndex + 1}</span>
              </div>
              <button
                onClick={() => setMobileTab('canvas')}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-600/30 px-3 py-1.5 rounded-xl transition"
              >
                Volver al Lienzo de Trabajo →
              </button>
            </div>
            <MediaPanel
              slide={currentSlide}
              brief={brief}
              visualStyle={visualStyle}
              aspectRatio={aspectRatio}
              onUpdateSlide={handleUpdateSlidePartial}
            />
          </div>
        ) : (
          /* Complete Focused Slide Editor Mode (Full Comfort Workspace on PC & Mobile) */
          <div className="flex flex-col lg:flex-row items-start gap-4">
            
            {/* Desktop Fixed Aspect Ratio & Brand Sidebar */}
            <SidebarAspect
              aspectRatio={aspectRatio}
              onSelectAspect={setAspectRatio}
              brand={brand}
              onUpdateBrand={handleUpdateBrand}
            />

            {/* Main Full-Width Slide Studio Workspace */}
            <div className="flex-1 min-w-0 w-full space-y-3.5 max-w-5xl mx-auto">
              
              {/* Text Style Bar */}
              <TextStyleBar
                activeKey={activeElementKey}
                slide={currentSlide}
                brand={brand}
                language={language}
                onChangeLanguage={setLanguage}
                onTranslateCarousel={handleTranslateCarousel}
                isTranslating={isTranslating}
                onUpdateStyle={handleUpdateTextStyle}
                onResetStyle={handleResetTextStyle}
                onDeleteActiveElement={handleDeleteActiveElement}
                onAddCustomText={handleAddCustomText}
                onUpdateSlideOverlayType={handleUpdateSlideOverlayType}
                onUpdateSlideAccentColor={handleUpdateSlideAccentColor}
                onUpdateTextPos={handleUpdateTextPos}
              />

              {/* Main Interactive Canvas - Spacious and Centered */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-3 sm:p-6 flex flex-col items-center justify-center min-h-[500px] shadow-2xl relative overflow-hidden">
                <CanvasSlide
                  slide={currentSlide}
                  brand={brand}
                  aspectRatio={aspectRatio}
                  zoomLevel={zoomLevel}
                  activeElementKey={activeElementKey}
                  language={language}
                  onSelectElement={setActiveElementKey}
                  onUpdateField={handleUpdateSlideField}
                  onUpdateBullet={handleUpdateBullet}
                  onDeleteBullet={handleDeleteBullet}
                  onAddBullet={handleAddBullet}
                  onUpdateBrand={handleUpdateBrand}
                  onUpdateCustomText={handleUpdateCustomText}
                  onDeleteCustomText={handleDeleteCustomText}
                  onAddCustomText={handleAddCustomText}
                  onDeleteElement={handleDeleteActiveElement}
                  onUpdateComparison={handleUpdateComparison}
                  onUpdateStat={handleUpdateStat}
                  onUpdateQuote={handleUpdateQuote}
                  onUpdateCtaFinal={handleUpdateCtaFinal}
                  onUpdateTextPos={handleUpdateTextPos}
                />
              </div>

              {/* Slide Carousel Navigation Strip */}
              <SlideNavigation
                slides={slides}
                currentIndex={currentIndex}
                isGridView={isGridView}
                language={language}
                onSelectSlide={setCurrentIndex}
                onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                onNext={() => setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                onAddSlide={handleAddSlide}
                onDuplicateSlide={handleDuplicateSlide}
                onDeleteSlide={handleDeleteSlide}
                onOpenAiRewriteSlide={() => setIsSlideRewriteOpen(true)}
                onUpdateSlideLayout={handleUpdateSlideLayout}
                onToggleGridView={() => {
                  setIsGridView(true);
                  setMobileTab('grid');
                }}
              />

            </div>

          </div>
        )}

      </main>

      {/* Persistent Bottom Tab Bar (Available on PC & Mobile) */}
      <MobileTabBar
        activeTab={isGridView ? 'grid' : mobileTab}
        onChangeTab={(tab) => {
          if (tab === 'grid') {
            setIsGridView(true);
            setMobileTab('grid');
          } else {
            setIsGridView(false);
            setMobileTab(tab);
          }
        }}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Strategic Modals */}
      <ClientSelectorModal
        isOpen={isClientSelectorOpen}
        onClose={() => setIsClientSelectorOpen(false)}
        selectedClientId={selectedClient?.id}
        onSelectClient={handleSelectClient}
        brand={brand}
        onUpdateBrand={handleUpdateBrand}
      />

      <ProjectsManagerModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        currentSlides={slides}
        currentBrand={brand}
        currentBrief={brief}
        currentTargetAudience={targetAudience}
        currentPostMeta={postMeta}
        currentAspectRatio={aspectRatio}
        onLoadProject={handleLoadSavedProject}
        onNewProject={handleCreateNewBlankProject}
        onUpdateBrand={handleUpdateBrand}
      />

      <KnowledgeBaseModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
        documents={documents}
        language={language}
        onAddDocument={(doc) => setDocuments((prev) => [doc, ...prev])}
        onRemoveDocument={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
        onApplyAnalysisToBrief={handleApplyAnalysisToBrief}
      />

      <HookOptimizerModal
        isOpen={isHookLabOpen}
        onClose={() => setIsHookLabOpen(false)}
        currentSlide1={slides[0] || currentSlide}
        brief={brief}
        targetAudience={targetAudience}
        activeDocuments={documents}
        onApplyHook={handleApplyHookToSlide1}
      />

      <PostCaptionModal
        isOpen={isPostCaptionOpen}
        onClose={() => setIsPostCaptionOpen(false)}
        postMeta={postMeta}
        onUpdatePostMeta={setPostMeta}
      />

      <SlideAiRewriteModal
        isOpen={isSlideRewriteOpen}
        onClose={() => setIsSlideRewriteOpen(false)}
        slide={currentSlide}
        slideIndex={currentIndex}
        totalSlides={slides.length}
        brand={brand}
        brief={brief}
        targetAudience={targetAudience}
        technicalTerms={selectedClient?.technical_terms}
        language={language}
        onApplyRewrittenSlide={handleApplyRewrittenSlide}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        slides={slides}
        currentSlide={currentSlide}
        brand={brand}
        aspectRatio={aspectRatio}
        postMeta={postMeta}
        brief={brief}
        visualStyle={visualStyle}
        onLoadProject={(data) => {
          if (data.slides) setSlides(data.slides);
          if (data.brand) setBrand(data.brand);
          if (data.aspectRatio) setAspectRatio(data.aspectRatio);
          if (data.brief) setBrief(data.brief);
          if (data.visualStyle) setVisualStyle(data.visualStyle);
          if (data.postMeta) setPostMeta(data.postMeta);
        }}
      />

    </div>
  );
}
