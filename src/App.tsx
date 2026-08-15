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
import { AgencyClient, getFallbackAgencyClients } from './services/supabase';
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

const LOCAL_STORAGE_SLIDES_KEY = 'lavisualmk_carousel_slides_v3';
const LOCAL_STORAGE_BRAND_KEY = 'lavisualmk_carousel_brand_v3';
const LOCAL_STORAGE_DOCS_KEY = 'lavisualmk_carousel_docs_v3';
const LOCAL_STORAGE_POST_KEY = 'lavisualmk_carousel_post_v3';
const LOCAL_STORAGE_CLIENT_KEY = 'lavisualmk_carousel_client_v3';

export default function App() {
  // Agency Client State (Supabase connected)
  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CLIENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    const fallbacks = getFallbackAgencyClients();
    return fallbacks[0] || null;
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
    setSelectedClient(client);

    // Update Brand Info
    const primaryCol = client.brand_color || '#e11d48';
    setBrand((prev) => ({
      ...prev,
      name: client.name,
      web: client.website || prev.web,
      handle: client.instagram_handle || prev.handle,
      logo: client.logo_url || prev.logo,
      primaryColor: primaryCol,
      clientId: client.id,
    }));

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
    handleUpdateSlideField('layoutTemplate', layout);
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
    if (key === 'brandName' || key === 'brandWeb') {
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
    if (key === 'brandName' || key === 'brandWeb') {
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

  const handleAddSlide = () => {
    const primaryCol = brand.primaryColor || '#e11d48';
    const newSlide: Slide = {
      id: slides.length + 1,
      _uid: `sl-${Date.now()}`,
      layoutTemplate: 'standard',
      badge: 'NUEVO PUNTO',
      subtag: 'Paso siguiente',
      title: 'TÍTULO DE LA NUEVA DIAPOSITIVA',
      body: 'Escribe aquí la explicación clara y persuasiva.',
      cta: '👉 Desliza para ver más',
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

  const handleApplyGeneratedCarousel = (newSlides: Slide[], newPostMeta?: CarouselPostMeta) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      
      {/* Top Main Navigation Header */}
      <Header
        brand={brand}
        onUpdateBrand={handleUpdateBrand}
        aspectRatio={aspectRatio}
        onSelectAspect={setAspectRatio}
        activeDocumentsCount={documents.length}
        selectedClientName={selectedClient?.name}
        selectedClientColor={selectedClient?.brand_color}
        onOpenClientSelector={() => setIsClientSelectorOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeOpen(true)}
        onOpenHookLab={() => setIsHookLabOpen(true)}
        onOpenPostCaption={() => setIsPostCaptionOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onResetCarousel={handleResetCarousel}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 lg:pb-6 space-y-5">
        
        {isGridView ? (
          /* Grid View Mode */
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsGridView(false)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Volver a Edición Individual
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
              }}
            />
          </div>
        ) : (
          /* Single Slide Editor Mode with Fixed Aspect Sidebar */
          <div className="flex flex-col lg:flex-row items-start gap-4">
            
            {/* Desktop Fixed Aspect Ratio Sidebar */}
            <SidebarAspect
              aspectRatio={aspectRatio}
              onSelectAspect={setAspectRatio}
              brand={brand}
              onUpdateBrand={handleUpdateBrand}
            />

            {/* Main Center + Right Studio Workspace */}
            <div className="flex-1 min-w-0 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              
              {/* Center Column: Canvas Preview & Quick Styling (7 Cols) */}
              <div className={`xl:col-span-7 space-y-3.5 ${mobileTab === 'canvas' ? 'block' : 'hidden xl:block'}`}>
                
                {/* Text Style & Layout Templates Bar */}
                <TextStyleBar
                  activeKey={activeElementKey}
                  slide={currentSlide}
                  brand={brand}
                  onUpdateStyle={handleUpdateTextStyle}
                  onResetStyle={handleResetTextStyle}
                  onUpdateSlideLayout={handleUpdateSlideLayout}
                  onUpdateSlideOverlayType={handleUpdateSlideOverlayType}
                  onUpdateSlideAccentColor={handleUpdateSlideAccentColor}
                />

                {/* Main Interactive Canvas */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-center min-h-[480px] shadow-2xl relative overflow-hidden">
                  <CanvasSlide
                    slide={currentSlide}
                    brand={brand}
                    aspectRatio={aspectRatio}
                    zoomLevel={zoomLevel}
                    activeElementKey={activeElementKey}
                    onSelectElement={setActiveElementKey}
                    onUpdateField={handleUpdateSlideField}
                    onUpdateBullet={handleUpdateBullet}
                    onUpdateBrand={handleUpdateBrand}
                    onUpdateComparison={handleUpdateComparison}
                    onUpdateStat={handleUpdateStat}
                    onUpdateQuote={handleUpdateQuote}
                    onUpdateCtaFinal={handleUpdateCtaFinal}
                  />
                </div>

                {/* Slide Carousel Navigation Strip */}
                <SlideNavigation
                  slides={slides}
                  currentIndex={currentIndex}
                  isGridView={isGridView}
                  onSelectSlide={setCurrentIndex}
                  onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  onNext={() => setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  onAddSlide={handleAddSlide}
                  onDuplicateSlide={handleDuplicateSlide}
                  onDeleteSlide={handleDeleteSlide}
                  onToggleGridView={() => {
                    setIsGridView(true);
                    setMobileTab('grid');
                  }}
                />

              </div>

              {/* Right Column: AI Strategist & Media Control Studio (5 Cols) */}
              <div className="xl:col-span-5 space-y-5">
                
                {/* AI Strategist Generator Panel (Visible in 'ai' tab on mobile, always visible on XL) */}
                <div className={`${mobileTab === 'ai' ? 'block' : 'hidden xl:block'}`}>
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
                    onOpenClientSelector={() => setIsClientSelectorOpen(true)}
                    onOpenKnowledgeBase={() => setIsKnowledgeOpen(true)}
                    onOpenHookLab={() => setIsHookLabOpen(true)}
                    onApplyGeneratedCarousel={(newSlides) => {
                      handleApplyGeneratedCarousel(newSlides);
                      setMobileTab('canvas');
                    }}
                  />
                </div>

                {/* Background Media & Visual Enhancer Panel (Visible in 'media' tab on mobile, always visible on XL) */}
                <div className={`${mobileTab === 'media' ? 'block' : 'hidden xl:block'}`}>
                  <MediaPanel
                    slide={currentSlide}
                    brief={brief}
                    visualStyle={visualStyle}
                    aspectRatio={aspectRatio}
                    onUpdateSlide={handleUpdateSlidePartial}
                  />
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Mobile Sticky Navigation Tab Bar */}
      <MobileTabBar
        activeTab={isGridView ? 'grid' : mobileTab}
        onChangeTab={(tab) => {
          if (tab === 'grid') {
            setIsGridView(true);
          } else {
            setIsGridView(false);
            setMobileTab(tab);
          }
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenPostCaption={() => setIsPostCaptionOpen(true)}
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
      />

      <KnowledgeBaseModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
        documents={documents}
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
