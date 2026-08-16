import {
  SlideLayoutTemplate,
  Slide,
  ComparisonData,
  BigStatData,
  QuoteData,
  CtaFinalData
} from '../types';

export type AppLanguage = 'es' | 'pt' | 'en';

export interface TemplateLocalization {
  quote: {
    quoteText: string;
    authorRole: string;
  };
  comparison: {
    title: string;
    leftTag: string;
    leftTitle: string;
    leftText: string;
    rightTag: string;
    rightTitle: string;
    rightText: string;
  };
  stat: {
    badge: string;
    statNumber: string;
    statLabel: string;
    statSubtext: string;
  };
  checklist: {
    badge: string;
    title: string;
    bullets: string[];
  };
  ctaFinal: {
    badge: string;
    headline: string;
    subheadline: string;
    actionPill: string;
  };
  standard: {
    badge: string;
    subtag: string;
    cta: string;
  };
  uiLabels: {
    template: string;
    standard: string;
    split_comparison: string;
    quote: string;
    big_number: string;
    checklist: string;
    cta_final: string;
    slide: string;
    of: string;
    rewriteAi: string;
    new: string;
    duplicate: string;
    delete: string;
    gridMode: string;
    singleMode: string;
    design: string;
    addBullet: string;
    noLogo: string;
    linked: string;
    move: string;
    reset: string;
  };
}

export const TEMPLATE_LOCALIZATIONS: Record<AppLanguage, TemplateLocalization> = {
  es: {
    quote: {
      quoteText: 'No necesitas más seguidores, necesitas una oferta que no puedan rechazar y un gancho que los detenga.',
      authorRole: 'Estrategia de Crecimiento & Ventas',
    },
    comparison: {
      title: 'COMPARACIÓN CLAVE',
      leftTag: 'El Error Común',
      leftTitle: 'Publicar sin estrategia ni oferta clara',
      leftText: 'Atrae solo curiosos y nadie pregunta por el servicio.',
      rightTag: 'La Estrategia Real',
      rightTitle: 'Carruseles con ganchos de dolor & solución',
      rightText: 'Filtra clientes calificados listos para comprar.',
    },
    stat: {
      badge: 'RESULTADO COMPROBADO',
      statNumber: '+350%',
      statLabel: 'MÁS CONSULTAS CALIFICADAS',
      statSubtext: 'Al cambiar publicaciones genéricas por carruseles con ganchos de problema y solución directa.',
    },
    checklist: {
      badge: 'CHECKLIST ESTRATÉGICO',
      title: '3 PASOS PARA EJECUTAR HOY',
      bullets: [
        'Paso 1: Define el dolor número 1 que le quita el sueño a tu cliente.',
        'Paso 2: Usa un gancho de pregunta reflexiva en la primera diapositiva.',
        'Paso 3: Entrega la solución en 3 puntos y remata con un CTA a mensaje directo.',
      ],
    },
    ctaFinal: {
      badge: '¿LISTO PARA ESCALAR?',
      headline: 'COMENZÁ A RECIBIR CLIENTES ESTA SEMANA',
      subheadline: 'Envíanos un mensaje directo o comenta con la palabra clave para recibir la guía completa.',
      actionPill: 'Comenta "CARRUSEL" y te escribimos',
    },
    standard: {
      badge: 'ESTRATEGIA',
      subtag: 'Punto Clave',
      cta: 'Desliza para ver la verdad 👉',
    },
    uiLabels: {
      template: 'Plantilla:',
      standard: 'Estándar',
      split_comparison: 'Comparativa',
      quote: 'Cita / Frase',
      big_number: 'Gran Cifra',
      checklist: 'Checklist',
      cta_final: 'Conversión CTA',
      slide: 'Diapositiva',
      of: 'de',
      rewriteAi: 'Mejorar con IA',
      new: 'Nueva',
      duplicate: 'Duplicar',
      delete: 'Eliminar',
      gridMode: 'Ver Todo',
      singleMode: 'Vista Individual',
      design: 'Diseño:',
      addBullet: '+ Añadir Punto a la Lista',
      noLogo: 'Sin logo',
      linked: 'Vinculado',
      move: 'Mover',
      reset: 'Restablecer',
    },
  },
  pt: {
    quote: {
      quoteText: 'Você não precisa de mais seguidores, precisa de uma oferta irrecusável e de um gancho que prenda a atenção.',
      authorRole: 'Estratégia de Crescimento & Vendas',
    },
    comparison: {
      title: 'COMPARAÇÃO ESTRATÉGICA',
      leftTag: 'O Erro Comum',
      leftTitle: 'Postar sem estratégia nem oferta clara',
      leftText: 'Atrai apenas curiosos e ninguém pergunta pelo serviço.',
      rightTag: 'A Estratégia Real',
      rightTitle: 'Carrosséis com ganchos de dor & solução',
      rightText: 'Filtra clientes qualificados prontos para comprar.',
    },
    stat: {
      badge: 'RESULTADO COMPROVADO',
      statNumber: '+350%',
      statLabel: 'MAIS CONTATOS QUALIFICADOS',
      statSubtext: 'Ao trocar postagens genéricas por carrosséis com ganchos de problema e solução direta.',
    },
    checklist: {
      badge: 'CHECKLIST ESTRATÉGICO',
      title: '3 PASSOS PARA EXECUTAR HOJE',
      bullets: [
        'Passo 1: Defina a dor número 1 que tira o sono do seu cliente.',
        'Passo 2: Use um gancho de pergunta reflexiva no primeiro slide.',
        'Passo 3: Entregue a solução em 3 pontos e finalize com um CTA para o direct.',
      ],
    },
    ctaFinal: {
      badge: 'PRONTO PARA ESCALAR?',
      headline: 'COMECE A RECEBER CLIENTES ESTA SEMANA',
      subheadline: 'Envie uma mensagem direta ou comente com a palavra-chave para receber o guia completo.',
      actionPill: 'Comente "CARROSSEL" e te chamamos',
    },
    standard: {
      badge: 'ESTRATÉGIA',
      subtag: 'Ponto Chave',
      cta: 'Arraste para ver a verdade 👉',
    },
    uiLabels: {
      template: 'Modelo:',
      standard: 'Padrão',
      split_comparison: 'Comparativa',
      quote: 'Citação / Frase',
      big_number: 'Grande Número',
      checklist: 'Checklist',
      cta_final: 'Conversão CTA',
      slide: 'Slide',
      of: 'de',
      rewriteAi: 'Melhorar com IA',
      new: 'Novo',
      duplicate: 'Duplicar',
      delete: 'Excluir',
      gridMode: 'Ver Todos',
      singleMode: 'Visão Individual',
      design: 'Design:',
      addBullet: '+ Adicionar Ponto à Lista',
      noLogo: 'Sem logo',
      linked: 'Vinculado',
      move: 'Mover',
      reset: 'Redefinir',
    },
  },
  en: {
    quote: {
      quoteText: "You don't need more followers, you need an irresistible offer and a hook that stops the scroll.",
      authorRole: 'Growth & Sales Strategy',
    },
    comparison: {
      title: 'KEY COMPARISON',
      leftTag: 'The Common Mistake',
      leftTitle: 'Posting without strategy or a clear offer',
      leftText: 'Attracts only window shoppers and no real inquiries.',
      rightTag: 'The Real Strategy',
      rightTitle: 'Carousels with pain & solution hooks',
      rightText: 'Filters high-intent qualified buyers ready to close.',
    },
    stat: {
      badge: 'PROVEN RESULT',
      statNumber: '+350%',
      statLabel: 'MORE QUALIFIED INQUIRIES',
      statSubtext: 'By replacing generic content with carousels engineered around problem-solution hooks.',
    },
    checklist: {
      badge: 'STRATEGIC CHECKLIST',
      title: '3 STEPS TO EXECUTE TODAY',
      bullets: [
        'Step 1: Identify the #1 pain point keeping your ideal client awake.',
        'Step 2: Use a thought-provoking question hook on the first slide.',
        'Step 3: Deliver the solution in 3 points and end with a DM call to action.',
      ],
    },
    ctaFinal: {
      badge: 'READY TO SCALE?',
      headline: 'START GETTING QUALIFIED CLIENTS THIS WEEK',
      subheadline: 'Send us a direct message or comment with the keyword to receive the complete playbook.',
      actionPill: 'Comment "CAROUSEL" and we will DM you',
    },
    standard: {
      badge: 'STRATEGY',
      subtag: 'Key Takeaway',
      cta: 'Swipe to see the truth 👉',
    },
    uiLabels: {
      template: 'Template:',
      standard: 'Standard',
      split_comparison: 'Comparison',
      quote: 'Quote / Phrase',
      big_number: 'Big Stat',
      checklist: 'Checklist',
      cta_final: 'Conversion CTA',
      slide: 'Slide',
      of: 'of',
      rewriteAi: 'Improve with AI',
      new: 'New',
      duplicate: 'Duplicate',
      delete: 'Delete',
      gridMode: 'View All',
      singleMode: 'Single Slide',
      design: 'Layout:',
      addBullet: '+ Add Item to List',
      noLogo: 'No logo',
      linked: 'Linked',
      move: 'Move',
      reset: 'Reset',
    },
  },
};

export function getTemplateLocalization(lang: string = 'es'): TemplateLocalization {
  const safeLang = (lang === 'pt' ? 'pt' : lang === 'en' ? 'en' : 'es') as AppLanguage;
  return TEMPLATE_LOCALIZATIONS[safeLang];
}

/**
 * Transforms or initializes a slide's specialized template fields according to layout & language.
 */
export function applyLayoutTemplateToSlide(
  slide: Slide,
  newLayout: SlideLayoutTemplate,
  lang: string = 'es',
  brandName?: string
): Slide {
  const loc = getTemplateLocalization(lang);

  const updated: Slide = {
    ...slide,
    layoutTemplate: newLayout,
  };

  switch (newLayout) {
    case 'quote': {
      const existingQuoteText = slide.quote?.quoteText || slide.body || '';
      // If the quoteText is completely empty or matched another language default, set localized default
      const quoteText = existingQuoteText.trim().length > 5 ? existingQuoteText : loc.quote.quoteText;
      const authorName = slide.quote?.authorName || brandName || 'LA VISUAL MK';
      const authorRole = slide.quote?.authorRole || loc.quote.authorRole;

      updated.quote = {
        quoteText,
        authorName,
        authorRole,
      };
      break;
    }

    case 'split_comparison': {
      updated.comparison = {
        leftTag: slide.comparison?.leftTag || loc.comparison.leftTag,
        leftTitle: slide.comparison?.leftTitle || loc.comparison.leftTitle,
        leftText: slide.comparison?.leftText || loc.comparison.leftText,
        rightTag: slide.comparison?.rightTag || loc.comparison.rightTag,
        rightTitle: slide.comparison?.rightTitle || loc.comparison.rightTitle,
        rightText: slide.comparison?.rightText || loc.comparison.rightText,
      };
      if (!updated.title || updated.title === 'COMPARACIÓN CLAVE' || updated.title === 'COMPARAÇÃO ESTRATÉGICA' || updated.title === 'KEY COMPARISON') {
        updated.title = loc.comparison.title;
      }
      break;
    }

    case 'big_number': {
      updated.stat = {
        statNumber: slide.stat?.statNumber || loc.stat.statNumber,
        statLabel: slide.stat?.statLabel || slide.title || loc.stat.statLabel,
        statSubtext: slide.stat?.statSubtext || slide.body || loc.stat.statSubtext,
      };
      if (!updated.badge) {
        updated.badge = loc.stat.badge;
      }
      break;
    }

    case 'checklist': {
      if (!updated.bullets || updated.bullets.length === 0) {
        updated.bullets = [...loc.checklist.bullets];
      }
      if (!updated.badge) {
        updated.badge = loc.checklist.badge;
      }
      if (!updated.title || updated.title.includes('PASOS') || updated.title.includes('STEPS') || updated.title.includes('PASSOS')) {
        updated.title = loc.checklist.title;
      }
      break;
    }

    case 'cta_final': {
      updated.ctaFinal = {
        headline: slide.ctaFinal?.headline || slide.title || loc.ctaFinal.headline,
        subheadline: slide.ctaFinal?.subheadline || slide.body || loc.ctaFinal.subheadline,
        actionPill: slide.ctaFinal?.actionPill || loc.ctaFinal.actionPill,
      };
      if (!updated.badge) {
        updated.badge = loc.ctaFinal.badge;
      }
      break;
    }

    case 'standard':
    default: {
      if (!updated.cta) {
        updated.cta = loc.standard.cta;
      }
      break;
    }
  }

  return updated;
}
