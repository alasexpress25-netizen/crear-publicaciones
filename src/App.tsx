import React, { useState, useEffect } from 'react';
import {
  Slide,
  BrandInfo,
  AspectRatio,
  MarketingDocument,
  CarouselPostMeta,
  TextStyleItem,
  CustomTextLayer,
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
import { saveProjectDB } from './services/storageDb';
import { getActiveDirectoryHandle, saveProjectToDiskFolder } from './services/localFolderSync';
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
import { safeAlert, safeConfirm } from './utils/notifications';
import { ProjectsManagerModal } from './components/ProjectsManagerModal';
import { SlideAiRewriteModal } from './components/SlideAiRewriteModal';
import { FloatingMediaModal } from './components/FloatingMediaModal';

const LOCAL_STORAGE_SLIDES_KEY = 'lavisualmk_carousel_slides_v3';
const LOCAL_STORAGE_BRAND_KEY = 'lavisualmk_carousel_brand_v3';
const LOCAL_STORAGE_DOCS_KEY = 'lavisualmk_carousel_docs_v3';
const LOCAL_STORAGE_POST_KEY = 'lavisualmk_carousel_post_v3';
const LOCAL_STORAGE_CLIENT_KEY = 'lavisualmk_carousel_client_v3';
const SESSION_ACTIVE_KEY = 'lavisualmk_session_active_v1';

export default function App() {
  // Determine if this is a fresh application open (session start) vs page refresh
  const isExistingSession = typeof window !== 'undefined' && Boolean(sessionStorage.getItem(SESSION_ACTIVE_KEY));

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

  // Carousel Slides State: On fresh app startup, start with a fresh new project; on page reload/refresh, restore current work
  const [slides, setSlides] = useState<Slide[]>(() => {
    if (isExistingSession) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_SLIDES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_DEFAULT_SLIDES;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [activeElementKey, setActiveElementKey] = useState<string | null>('title');
  const [mobileTab, setMobileTab] = useState<WorkspaceTab>('canvas');

  // AI & Marketing Strategist Controls State
  const [brief, setBrief] = useState<string>(() => {
    if (isExistingSession) {
      try {
        const saved = localStorage.getItem('lavisualmk_carousel_brief_v3');
        if (saved) return saved;
      } catch {}
    }
    return '';
  });
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

  // Modals state: If opening the app fresh (session start), open Projects modal automatically
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(() => !isExistingSession);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [isHookLabOpen, setIsHookLabOpen] = useState(false);
  const [isPostCaptionOpen, setIsPostCaptionOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSlideRewriteOpen, setIsSlideRewriteOpen] = useState(false);
  const [isMediaPopupOpen, setIsMediaPopupOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    if (isExistingSession) {
      try {
        return localStorage.getItem('lavisualmk_current_project_id') || null;
      } catch {}
    }
    return null;
  });
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string | null>(() => {
    if (isExistingSession) {
      try {
        return localStorage.getItem('lavisualmk_current_project_title') || null;
      } catch {}
    }
    return null;
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Mark session as active in sessionStorage so F5 / reloads keep current work
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    } catch {}
  }, []);

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

  // Concrete Scene Memory for Art Director (Paso B memory across carousel)
  const [escenasPorDiapositiva, setEscenasPorDiapositiva] = useState<Record<string | number, string>>({});

  const handleSaveConcreteScene = (slideKey: string | number, scene: string) => {
    setEscenasPorDiapositiva((prev) => ({
      ...prev,
      [slideKey]: scene,
    }));
  };

  const handleSaveAllConcreteScenes = (scenesMap: Record<string | number, string>) => {
    setEscenasPorDiapositiva((prev) => ({
      ...prev,
      ...scenesMap,
    }));
  };

  // Load Saved Project Handler
  const handleLoadSavedProject = (proj: SavedCarouselProject) => {
    if (proj.slides && proj.slides.length > 0) setSlides(proj.slides);
    if (proj.brand) setBrand(proj.brand);
    if (proj.brief) setBrief(proj.brief);
    if (proj.targetAudience) setTargetAudience(proj.targetAudience);
    if (proj.postMeta) setPostMeta(proj.postMeta);
    if (proj.aspectRatio) setAspectRatio(proj.aspectRatio);
    setCurrentProjectId(proj.id);
    setCurrentProjectTitle(proj.title);
    setEscenasPorDiapositiva({});
    setCurrentIndex(0);
  };

  const handleCreateNewBlankProject = () => {
    setSlides(INITIAL_DEFAULT_SLIDES);
    setBrief('');
    setCurrentProjectId(null);
    setCurrentProjectTitle(null);
    setEscenasPorDiapositiva({});
    setCurrentIndex(0);
  };

  // Sync to LocalStorage (Reactive Persistence + Save on Blur / Visibility Change / Before Unload)
  const persistCurrentWorkspaceState = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SLIDES_KEY, JSON.stringify(slides));
      localStorage.setItem(LOCAL_STORAGE_BRAND_KEY, JSON.stringify(brand));
      localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(documents));
      localStorage.setItem(LOCAL_STORAGE_POST_KEY, JSON.stringify(postMeta));
      localStorage.setItem('lavisualmk_carousel_brief_v3', brief || '');
      if (currentProjectId) {
        localStorage.setItem('lavisualmk_current_project_id', currentProjectId);
      } else {
        localStorage.removeItem('lavisualmk_current_project_id');
      }
      if (currentProjectTitle) {
        localStorage.setItem('lavisualmk_current_project_title', currentProjectTitle);
      } else {
        localStorage.removeItem('lavisualmk_current_project_title');
      }
      if (selectedClient) {
        localStorage.setItem(LOCAL_STORAGE_CLIENT_KEY, JSON.stringify(selectedClient));
      }
    } catch {}
  };

  useEffect(() => {
    persistCurrentWorkspaceState();
  }, [slides, brand, documents, postMeta, selectedClient, brief, currentProjectId, currentProjectTitle]);

  // Debounced Auto-save to IndexedDB & Physical Disk Folder when editing an existing project
  useEffect(() => {
    if (!currentProjectId) {
      setAutoSaveStatus('idle');
      return;
    }

    setAutoSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const projToSave: SavedCarouselProject = {
          id: currentProjectId,
          title: currentProjectTitle || `Carrusel ${brand.name || 'Proyecto'}`,
          clientName: brand.name || 'General',
          clientId: brand.clientId,
          createdAt: new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          updatedAt: new Date().toISOString(),
          slides,
          brand,
          brief,
          targetAudience,
          postMeta,
          aspectRatio,
        };

        await saveProjectDB(projToSave);

        const dirHandle = getActiveDirectoryHandle();
        if (dirHandle) {
          saveProjectToDiskFolder(dirHandle, projToSave).catch(console.warn);
        }

        setAutoSaveStatus('saved');
        setTimeout(() => {
          setAutoSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
        }, 3000);
      } catch (e) {
        console.warn('Auto-save error', e);
        setAutoSaveStatus('idle');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [slides, brand, brief, targetAudience, postMeta, aspectRatio, currentProjectId, currentProjectTitle]);

  // Listeners for window blur, tab visibility change, and before page unload/refresh
  useEffect(() => {
    const handleSaveTrigger = () => {
      persistCurrentWorkspaceState();
    };

    window.addEventListener('blur', handleSaveTrigger);
    window.addEventListener('beforeunload', handleSaveTrigger);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleSaveTrigger();
      }
    });

    return () => {
      window.removeEventListener('blur', handleSaveTrigger);
      window.removeEventListener('beforeunload', handleSaveTrigger);
    };
  }, [slides, brand, documents, postMeta, selectedClient, brief, currentProjectId, currentProjectTitle]);

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
    if (client.business_type || client.industry || client.knowledge_base) {
      const defaultTopic = client.topics && client.topics.length > 0 ? client.topics[0] : '';
      const briefContent = defaultTopic || `${client.name} - ${client.business_type || client.industry}${client.knowledge_base ? `. ${client.knowledge_base}` : ''}`;
      setBrief(briefContent);
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
  };

  const handleUpdateSlideBackgroundColor = (color: string) => {
    handleUpdateSlideField('backgroundColor', color);
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
    if (key === 'brandName' || key === 'brandWeb' || key === 'brandHandle' || key === 'brandLogo') {
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
    if (key === 'brandName' || key === 'brandWeb' || key === 'brandHandle' || key === 'brandLogo') {
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

    // 1. Custom Text / Box / Image Layers
    if (key.startsWith('custom-')) {
      handleDeleteCustomText(key);
      handleUpdateTextPos(key, null);
      handleResetTextStyle(key);
      setActiveElementKey(null);
      return;
    }

    // 2. Individual Bullets
    if (key.startsWith('bullet-')) {
      const idx = parseInt(key.replace('bullet-', ''), 10);
      handleDeleteBullet(idx);
      handleUpdateTextPos(key, null);
      handleResetTextStyle(key);
      setActiveElementKey(null);
      return;
    }

    // 3. Bullets Container
    if (key === 'bullets-container' || key === 'bullets') {
      setSlides((prev) => {
        const copy = [...prev];
        if (!copy[currentIndex]) return prev;
        const hidden = Array.from(new Set([...(copy[currentIndex].hiddenElements || []), 'bullets-container', 'bullets']));
        copy[currentIndex] = { ...copy[currentIndex], bullets: [], hiddenElements: hidden };
        return copy;
      });
      handleUpdateTextPos('bullets-container', null);
      handleResetTextStyle('bullets-container');
      setActiveElementKey(null);
      return;
    }

    // 4. Brand Elements (Logo, Name, Handle, Web)
    if (key === 'brandLogo' || key === 'brandName' || key === 'brandHandle' || key === 'brandWeb') {
      setBrand((prev) => ({
        ...prev,
        hiddenElements: Array.from(new Set([...(prev.hiddenElements || []), key])),
      }));
      setSlides((prev) => {
        const copy = [...prev];
        if (!copy[currentIndex]) return prev;
        const hidden = Array.from(new Set([...(copy[currentIndex].hiddenElements || []), key]));
        copy[currentIndex] = { ...copy[currentIndex], hiddenElements: hidden };
        return copy;
      });
      handleUpdateTextPos(key, null);
      handleResetTextStyle(key);
      setActiveElementKey(null);
      return;
    }

    // 5. Comparison Layout Elements
    if (key.startsWith('comp-')) {
      setSlides((prev) => {
        const copy = [...prev];
        if (!copy[currentIndex]) return prev;
        const hidden = Array.from(new Set([...(copy[currentIndex].hiddenElements || []), key]));
        const comp = { ...(copy[currentIndex].comparison || {}) };
        if (key === 'comp-leftTag') comp.leftTag = '';
        if (key === 'comp-leftTitle') comp.leftTitle = '';
        if (key === 'comp-leftText') comp.leftText = '';
        if (key === 'comp-rightTag') comp.rightTag = '';
        if (key === 'comp-rightTitle') comp.rightTitle = '';
        if (key === 'comp-rightText') comp.rightText = '';
        copy[currentIndex] = { ...copy[currentIndex], hiddenElements: hidden, comparison: comp };
        return copy;
      });
      handleUpdateTextPos(key, null);
      handleResetTextStyle(key);
      setActiveElementKey(null);
      return;
    }

    // 6. Quote Layout Elements
    if (key.startsWith('quote-')) {
      setSlides((prev) => {
        const copy = [...prev];
        if (!copy[currentIndex]) return prev;
        const hidden = Array.from(new Set([...(copy[currentIndex].hiddenElements || []), key]));
        const quote = { ...(copy[currentIndex].quote || {}) };
        if (key === 'quote-text') quote.quoteText = '';
        if (key === 'quote-author') quote.authorName = '';
        if (key === 'quote-role') quote.authorRole = '';
        copy[currentIndex] = { ...copy[currentIndex], hiddenElements: hidden, quote };
        return copy;
      });
      handleUpdateTextPos(key, null);
      handleResetTextStyle(key);
      setActiveElementKey(null);
      return;
    }

    // 7. Stat Layout Elements
    if (key.startsWith('stat-')) {
      setSlides((prev) => {
        const copy = [...prev];
        if (!copy[currentIndex]) return prev;
        const hidden = Array.from(new Set([...(copy[currentIndex].hiddenElements || []), key]));
        const stat = { ...(copy[currentIndex].stat || {}) };
        if (key === 'stat-number') stat.statNumber = '';
        if (key === 'stat-label') stat.statLabel = '';
        if (key === 'stat-subtext') stat.statSubtext = '';
        copy[currentIndex] = { ...copy[currentIndex], hiddenElements: hidden, stat };
        return copy;
      });
      handleUpdateTextPos(key, null);
      handleResetTextStyle(key);
      setActiveElementKey(null);
      return;
    }

    // 8. CTA Final Elements (Avatar, Headline, Subheadline, Card, Pill/Button)
    if (key.startsWith('cta-')) {
      setSlides((prev) => {
        const copy = [...prev];
        if (!copy[currentIndex]) return prev;
        const hidden = Array.from(new Set([...(copy[currentIndex].hiddenElements || []), key]));
        const ctaFinal = { ...(copy[currentIndex].ctaFinal || {}) };
        if (key === 'cta-headline') ctaFinal.headline = '';
        if (key === 'cta-subheadline') ctaFinal.subheadline = '';
        if (key === 'cta-pill') ctaFinal.actionPill = '';
        copy[currentIndex] = { ...copy[currentIndex], hiddenElements: hidden, ctaFinal };
        return copy;
      });
      handleUpdateTextPos(key, null);
      handleResetTextStyle(key);
      setActiveElementKey(null);
      return;
    }

    // 9. Standard Slide Text Elements (badge, subtag, title, body, cta) and any other element
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const hidden = Array.from(new Set([...(copy[currentIndex].hiddenElements || []), key]));
      const updatedSlide: Slide = { ...copy[currentIndex], hiddenElements: hidden };
      if (key === 'badge') updatedSlide.badge = '';
      if (key === 'subtag') updatedSlide.subtag = '';
      if (key === 'title') updatedSlide.title = '';
      if (key === 'body') updatedSlide.body = '';
      if (key === 'cta') updatedSlide.cta = '';
      copy[currentIndex] = updatedSlide;
      return copy;
    });
    handleUpdateTextPos(key, null);
    handleResetTextStyle(key);
    setActiveElementKey(null);
  };

  const handleAddCustomText = (
    type: 'heading' | 'body' | 'badge' | 'accent' | 'box' | 'image' = 'body',
    payload?: { imageUrl?: string }
  ) => {
    const newId = type === 'box'
      ? `custom-box-${Date.now()}`
      : type === 'accent'
      ? `custom-accent-${Date.now()}`
      : type === 'image'
      ? `custom-img-${Date.now()}`
      : `custom-${Date.now()}`;
    
    const accentCol = currentSlide.accentColor || brand.primaryColor || '#e11d48';
    let newLayer: CustomTextLayer;

    if (type === 'image') {
      newLayer = {
        id: newId,
        type: 'image',
        imageUrl: payload?.imageUrl || '',
        boxWidth: 35,
        boxHeight: 35,
        borderRadius: 12,
      };
      const initPos = { left: 35, top: 35 };
      handleUpdateTextPos(newId, initPos);
      handleUpdateTextStyle(newId, {
        height: 90,
        borderRadius: 12,
        zIndex: 35,
        shadow: true,
        shadowType: 'soft',
        shadowColor: '#000000',
      });
    } else if (type === 'box') {
      newLayer = {
        id: newId,
        type: 'box',
        text: 'Recuadro contenedor editable',
        color: '#cbd5e1',
        fontSize: 13,
        boxWidth: 85,
        boxHeight: 80,
        borderRadius: 16,
      };
      handleUpdateTextStyle(newId, {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        boxBorder: true,
        boxBorderColor: 'rgba(51, 65, 85, 0.8)',
        boxBorderWidth: 1,
        borderRadius: 16,
        zIndex: 15,
        shadow: true,
        shadowType: 'soft',
        shadowColor: '#000000',
      });
    } else if (type === 'accent') {
      newLayer = {
        id: newId,
        type: 'accent',
        accentType: 'bar',
        color: accentCol,
        boxWidth: 40,
        boxHeight: 4,
        borderRadius: 9999,
      };
      handleUpdateTextStyle(newId, {
        backgroundColor: accentCol,
        zIndex: 25,
        shadow: true,
        shadowType: 'glow',
        shadowColor: accentCol,
      });
    } else {
      newLayer = {
        id: newId,
        type,
        text: type === 'heading' ? 'NUEVO SUBTÍTULO O TITULAR' : type === 'badge' ? 'ETIQUETA DESTACADA' : 'Escribe aquí tu nuevo texto o aclaración adicional.',
        fontSize: type === 'heading' ? 20 : type === 'badge' ? 11 : 14,
        color: type === 'badge' ? accentCol : '#ffffff',
        align: 'left' as const,
      };
      handleUpdateTextStyle(newId, {
        zIndex: 30,
      });
    }

    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const customTexts = [...(copy[currentIndex].customTexts || []), newLayer];
      copy[currentIndex] = { ...copy[currentIndex], customTexts };
      return copy;
    });
    setActiveElementKey(newId);
  };

  const handleAddCustomImage = (imageUrl: string) => {
    handleAddCustomText('image', { imageUrl });
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

  const handleAddBullet = (customText?: string) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const bullets = [...(copy[currentIndex].bullets || []), customText || 'Nuevo punto clave destacado'];
      copy[currentIndex] = { ...copy[currentIndex], bullets };
      return copy;
    });
  };

  const handleUpdateSlideContentAlign = (align: 'top' | 'center' | 'bottom') => {
    handleUpdateSlideField('contentAlign', align);
  };

  // Keyboard shortcut listener for 'Delete' / 'Supr' key to remove active element/object
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Do not intercept if user is typing inside an input, textarea, or contentEditable element
        const target = e.target as HTMLElement | null;
        if (target) {
          const isContentEditable = target.isContentEditable || target.getAttribute('contenteditable') === 'true';
          const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
          if (isContentEditable || isInput) {
            return;
          }
        }

        // If an active element is selected on the canvas, delete it with Delete key
        if (activeElementKey) {
          e.preventDefault();
          handleDeleteActiveElement(activeElementKey);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeElementKey, currentIndex, slides]);

  const handleToggleHideCardBoxes = () => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      copy[currentIndex] = {
        ...copy[currentIndex],
        hideCardBoxes: !copy[currentIndex].hideCardBoxes,
      };
      return copy;
    });
  };

  const handleUpdateTextPos = (
    key: string | Record<string, { left: number; top: number } | null>,
    pos?: { left: number; top: number } | null
  ) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[currentIndex]) return prev;
      const currentPos = { ...(copy[currentIndex].textPos || {}) };
      if (typeof key === 'object' && key !== null) {
        Object.entries(key).forEach(([k, p]) => {
          if (p === null) {
            delete currentPos[k];
          } else {
            currentPos[k] = p;
          }
        });
      } else if (typeof key === 'string') {
        if (pos === null || pos === undefined) {
          delete currentPos[key];
        } else {
          currentPos[key] = pos;
        }
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
      safeAlert('Error al traducir el carrusel: ' + (err.message || 'Intente nuevamente.'));
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
    if (safeConfirm('¿Deseas reiniciar el carrusel a la plantilla por defecto?')) {
      setSlides(INITIAL_DEFAULT_SLIDES);
      setCurrentIndex(0);
    }
  };

  const handleApplyGeneratedCarousel = (newSlides: Slide[], newPostMeta?: CarouselPostMeta, _rationale?: string) => {
    if (newSlides && newSlides.length > 0) {
      const primaryCol = brand.primaryColor || '#e11d48';
      setEscenasPorDiapositiva({});
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
        onChangeLanguage={setLanguage}
        onTranslateCarousel={handleTranslateCarousel}
        isTranslating={isTranslating}
        currentProjectTitle={currentProjectTitle}
        autoSaveStatus={autoSaveStatus}
        onOpenProjects={() => setIsProjectsOpen(true)}
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
              slides={slides}
              onUpdateAllSlides={setSlides}
              brief={brief}
              visualStyle={visualStyle}
              aspectRatio={aspectRatio}
              onUpdateSlide={handleUpdateSlidePartial}
              client={selectedClient}
              brand={brand}
              targetAudience={targetAudience}
              slideIndex={currentIndex}
              totalSlides={slides.length}
              escenasPorDiapositiva={escenasPorDiapositiva}
              onSaveConcreteScene={handleSaveConcreteScene}
              onSaveAllConcreteScenes={handleSaveAllConcreteScenes}
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
                onAddCustomImage={handleAddCustomImage}
                onSelectElement={setActiveElementKey}
                onUpdateBrand={handleUpdateBrand}
                onUpdateSlideOverlayType={handleUpdateSlideOverlayType}
                onUpdateSlideAccentColor={handleUpdateSlideAccentColor}
                onUpdateSlideBackgroundColor={handleUpdateSlideBackgroundColor}
                onUpdateTextPos={handleUpdateTextPos}
                onUpdateSlideContentAlign={handleUpdateSlideContentAlign}
                onToggleHideCardBoxes={handleToggleHideCardBoxes}
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
                  onUpdateTextStyle={handleUpdateTextStyle}
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
        activeTab={isGridView ? 'grid' : (isMediaPopupOpen && mobileTab === 'canvas') ? 'media' : mobileTab}
        onChangeTab={(tab) => {
          if (tab === 'media') {
            if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
              // PC / Desktop: Abrir modal flotante arrastrable para seguir viendo el editor en tiempo real
              setIsMediaPopupOpen((prev) => !prev);
              setIsGridView(false);
              setMobileTab('canvas');
              return;
            }
          }
          if (tab === 'grid') {
            setIsGridView(true);
            setMobileTab('grid');
            setIsMediaPopupOpen(false);
          } else {
            setIsGridView(false);
            setMobileTab(tab);
            if (tab === 'canvas' && typeof window !== 'undefined' && window.innerWidth >= 1024) {
              // Keep canvas active
            }
          }
        }}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Floating Draggable Media & Backgrounds Modal for PC */}
      <FloatingMediaModal
        isOpen={isMediaPopupOpen}
        onClose={() => setIsMediaPopupOpen(false)}
        slide={currentSlide}
        slides={slides}
        onUpdateSlide={handleUpdateSlidePartial}
        onUpdateAllSlides={setSlides}
        brief={brief}
        visualStyle={visualStyle}
        aspectRatio={aspectRatio}
        client={selectedClient}
        brand={brand}
        targetAudience={targetAudience}
        slideIndex={currentIndex}
        totalSlides={slides.length}
        escenasPorDiapositiva={escenasPorDiapositiva}
        onSaveConcreteScene={handleSaveConcreteScene}
        onSaveAllConcreteScenes={handleSaveAllConcreteScenes}
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
        currentProjectId={currentProjectId}
        currentProjectTitle={currentProjectTitle}
        onLoadProject={handleLoadSavedProject}
        onNewProject={handleCreateNewBlankProject}
        onProjectSaved={(p) => {
          setCurrentProjectId(p.id);
          setCurrentProjectTitle(p.title);
        }}
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
