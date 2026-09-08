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
 * Normalizes known badge phrases across languages
 */
export function resolveLocalizedBadge(badge?: string, layout?: SlideLayoutTemplate, lang: string = 'es'): string {
  const safeLang = (lang === 'pt' ? 'pt' : lang === 'en' ? 'en' : 'es') as AppLanguage;
  const loc = TEMPLATE_LOCALIZATIONS[safeLang];

  if (!badge) {
    if (layout === 'checklist') return loc.checklist.badge;
    if (layout === 'split_comparison') return loc.standard.badge;
    if (layout === 'big_number') return loc.stat.badge;
    if (layout === 'cta_final') return loc.ctaFinal.badge;
    return loc.standard.badge;
  }

  const b = badge.trim().toUpperCase();

  const BADGE_MAP: Record<string, Record<AppLanguage, string>> = {
    'ALERTA DE NEGOCIO': { es: 'ALERTA DE NEGOCIO', pt: 'ALERTA DE NEGÓCIO', en: 'BUSINESS ALERT' },
    'ALERTA DE NEGÓCIO': { es: 'ALERTA DE NEGOCIO', pt: 'ALERTA DE NEGÓCIO', en: 'BUSINESS ALERT' },
    'BUSINESS ALERT': { es: 'ALERTA DE NEGOCIO', pt: 'ALERTA DE NEGÓCIO', en: 'BUSINESS ALERT' },

    'EL ERROR OCULTO': { es: 'EL ERROR OCULTO', pt: 'O ERRO OCULTO', en: 'THE HIDDEN MISTAKE' },
    'O ERRO OCULTO': { es: 'EL ERROR OCULTO', pt: 'O ERRO OCULTO', en: 'THE HIDDEN MISTAKE' },
    'THE HIDDEN MISTAKE': { es: 'EL ERROR OCULTO', pt: 'O ERRO OCULTO', en: 'THE HIDDEN MISTAKE' },

    'LA SOLUCIÓN': { es: 'LA SOLUCIÓN', pt: 'A SOLUÇÃO', en: 'THE SOLUTION' },
    'A SOLUÇÃO': { es: 'LA SOLUCIÓN', pt: 'A SOLUÇÃO', en: 'THE SOLUTION' },
    'THE SOLUTION': { es: 'LA SOLUCIÓN', pt: 'A SOLUÇÃO', en: 'THE SOLUTION' },

    'LLAMADO A LA ACCIÓN': { es: 'LLAMADO A LA ACCIÓN', pt: 'CHAMADA PARA AÇÃO', en: 'CALL TO ACTION' },
    'CHAMADA PARA AÇÃO': { es: 'LLAMADO A LA ACCIÓN', pt: 'CHAMADA PARA AÇÃO', en: 'CALL TO ACTION' },
    'CALL TO ACTION': { es: 'LLAMADO A LA ACCIÓN', pt: 'CHAMADA PARA AÇÃO', en: 'CALL TO ACTION' },

    'CHECKLIST ESTRATÉGICO': { es: 'CHECKLIST ESTRATÉGICO', pt: 'CHECKLIST ESTRATÉGICO', en: 'STRATEGIC CHECKLIST' },
    'STRATEGIC CHECKLIST': { es: 'CHECKLIST ESTRATÉGICO', pt: 'CHECKLIST ESTRATÉGICO', en: 'STRATEGIC CHECKLIST' },

    'RESULTADO COMPROBADO': { es: 'RESULTADO COMPROBADO', pt: 'RESULTADO COMPROVADO', en: 'PROVEN RESULT' },
    'RESULTADO COMPROVADO': { es: 'RESULTADO COMPROBADO', pt: 'RESULTADO COMPROVADO', en: 'PROVEN RESULT' },
    'PROVEN RESULT': { es: 'RESULTADO COMPROBADO', pt: 'RESULTADO COMPROVADO', en: 'PROVEN RESULT' },

    '¿LISTO PARA ESCALAR?': { es: '¿LISTO PARA ESCALAR?', pt: 'PRONTO PARA ESCALAR?', en: 'READY TO SCALE?' },
    'PRONTO PARA ESCALAR?': { es: '¿LISTO PARA ESCALAR?', pt: 'PRONTO PARA ESCALAR?', en: 'READY TO SCALE?' },
    'READY TO SCALE?': { es: '¿LISTO PARA ESCALAR?', pt: 'PRONTO PARA ESCALAR?', en: 'READY TO SCALE?' },

    'ESTRATEGIA': { es: 'ESTRATEGIA', pt: 'ESTRATÉGIA', en: 'STRATEGY' },
    'ESTRATÉGIA': { es: 'ESTRATEGIA', pt: 'ESTRATÉGIA', en: 'STRATEGY' },
    'STRATEGY': { es: 'ESTRATEGIA', pt: 'ESTRATÉGIA', en: 'STRATEGY' },

    'NUEVO PUNTO': { es: 'NUEVO PUNTO', pt: 'NOVO PONTO', en: 'NEW POINT' },
    'NOVO PONTO': { es: 'NUEVO PUNTO', pt: 'NOVO PONTO', en: 'NEW POINT' },
    'NEW POINT': { es: 'NUEVO PUNTO', pt: 'NOVO PONTO', en: 'NEW POINT' },
  };

  if (BADGE_MAP[b]) {
    return BADGE_MAP[b][safeLang];
  }

  return badge;
}

/**
 * Normalizes known subtag phrases across languages
 */
export function resolveLocalizedSubtag(subtag?: string, lang: string = 'es'): string {
  if (!subtag) return '';
  const safeLang = (lang === 'pt' ? 'pt' : lang === 'en' ? 'en' : 'es') as AppLanguage;

  const SUBTAG_MAP: Record<string, Record<AppLanguage, string>> = {
    '¿Te suena familiar?': { es: '¿Te suena familiar?', pt: 'Parece familiar?', en: 'Sound familiar?' },
    'Parece familiar?': { es: '¿Te suena familiar?', pt: 'Parece familiar?', en: 'Sound familiar?' },
    'Sound familiar?': { es: '¿Te suena familiar?', pt: 'Parece familiar?', en: 'Sound familiar?' },

    'El error #1': { es: 'El error #1', pt: 'O erro #1', en: 'Mistake #1' },
    'O erro #1': { es: 'El error #1', pt: 'O erro #1', en: 'Mistake #1' },
    'Mistake #1': { es: 'El error #1', pt: 'O erro #1', en: 'Mistake #1' },

    'El cambio de juego': { es: 'El cambio de juego', pt: 'A virada de jogo', en: 'The game changer' },
    'A virada de jogo': { es: 'El cambio de juego', pt: 'A virada de jogo', en: 'The game changer' },
    'The game changer': { es: 'El cambio de juego', pt: 'A virada de jogo', en: 'The game changer' },

    'Da el siguiente paso': { es: 'Da el siguiente paso', pt: 'Dê o próximo passo', en: 'Take the next step' },
    'Dê o próximo passo': { es: 'Da el siguiente paso', pt: 'Dê o próximo passo', en: 'Take the next step' },
    'Take the next step': { es: 'Da el siguiente paso', pt: 'Dê o próximo passo', en: 'Take the next step' },

    'Paso siguiente': { es: 'Paso siguiente', pt: 'Próximo passo', en: 'Next step' },
    'Próximo passo': { es: 'Paso siguiente', pt: 'Próximo passo', en: 'Next step' },
    'Next step': { es: 'Paso siguiente', pt: 'Próximo passo', en: 'Next step' },

    'Punto Clave': { es: 'Punto Clave', pt: 'Ponto Chave', en: 'Key Takeaway' },
    'Ponto Chave': { es: 'Punto Clave', pt: 'Ponto Chave', en: 'Key Takeaway' },
    'Key Takeaway': { es: 'Punto Clave', pt: 'Ponto Chave', en: 'Key Takeaway' },
  };

  const trim = subtag.trim();
  if (SUBTAG_MAP[trim]) {
    return SUBTAG_MAP[trim][safeLang];
  }

  return subtag;
}

/**
 * Normalizes known CTA strings across languages
 */
export function resolveLocalizedCta(cta?: string, lang: string = 'es'): string {
  const safeLang = (lang === 'pt' ? 'pt' : lang === 'en' ? 'en' : 'es') as AppLanguage;
  const loc = TEMPLATE_LOCALIZATIONS[safeLang];
  if (!cta) return loc.standard.cta;

  const CTA_MAP: Record<string, Record<AppLanguage, string>> = {
    'Desliza para ver la verdad 👉': { es: 'Desliza para ver la verdad 👉', pt: 'Arraste para ver a verdade 👉', en: 'Swipe to see the truth 👉' },
    'Arraste para ver a verdade 👉': { es: 'Desliza para ver la verdad 👉', pt: 'Arraste para ver a verdade 👉', en: 'Swipe to see the truth 👉' },
    'Swipe to see the truth 👉': { es: 'Desliza para ver la verdad 👉', pt: 'Arraste para ver a verdade 👉', en: 'Swipe to see the truth 👉' },

    'Desliza para ver más': { es: 'Desliza para ver más', pt: 'Arraste para ver mais', en: 'Swipe to see more' },
    '👉 Desliza para ver más': { es: '👉 Desliza para ver más', pt: '👉 Arraste para ver mais', en: '👉 Swipe to see more' },
    '👉 Arraste para ver mais': { es: '👉 Desliza para ver más', pt: '👉 Arraste para ver mais', en: '👉 Swipe to see more' },
    '👉 Swipe to see more': { es: '👉 Desliza para ver más', pt: '👉 Arraste para ver mais', en: '👉 Swipe to see more' },

    'Mira el siguiente error 👉': { es: 'Mira el siguiente error 👉', pt: 'Veja o próximo erro 👉', en: 'See the next mistake 👉' },
    'Veja o próximo erro 👉': { es: 'Mira el siguiente error 👉', pt: 'Veja o próximo erro 👉', en: 'See the next mistake 👉' },
    'See the next mistake 👉': { es: 'Mira el siguiente error 👉', pt: 'Veja o próximo erro 👉', en: 'See the next mistake 👉' },

    'Aplica esto hoy 👉': { es: 'Aplica esto hoy 👉', pt: 'Aplique isso hoje 👉', en: 'Apply this today 👉' },
    'Aplique isso hoje 👉': { es: 'Aplica esto hoy 👉', pt: 'Aplique isso hoje 👉', en: 'Apply this today 👉' },
    'Apply this today 👉': { es: 'Aplica esto hoy 👉', pt: 'Aplique isso hoje 👉', en: 'Apply this today 👉' },

    '💬 Envíanos un DM ahora': { es: '💬 Envíanos un DM ahora', pt: '💬 Envie uma DM agora', en: '💬 Send us a DM now' },
    '💬 Envie uma DM agora': { es: '💬 Envíanos un DM ahora', pt: '💬 Envie uma DM agora', en: '💬 Send us a DM now' },
    '💬 Send us a DM now': { es: '💬 Envíanos un DM ahora', pt: '💬 Envie uma DM agora', en: '💬 Send us a DM now' },
  };

  const trim = cta.trim();
  if (CTA_MAP[trim]) {
    return CTA_MAP[trim][safeLang];
  }

  return cta;
}

/**
 * Normalizes and translates Checklist Bullets across languages.
 */
export function resolveChecklistBullets(bullets?: string[], lang: string = 'es'): string[] {
  const safeLang = (lang === 'pt' ? 'pt' : lang === 'en' ? 'en' : 'es') as AppLanguage;
  const loc = TEMPLATE_LOCALIZATIONS[safeLang];

  if (!bullets || bullets.length === 0) {
    return [...loc.checklist.bullets];
  }

  // Comprehensive bidirectional dictionary for all default & common bullet points
  const CHECKLIST_DICTIONARY: Record<string, Record<AppLanguage, string>> = {
    // Checklist Item 1
    'Paso 1: Define el dolor número 1 que le quita el sueño a tu cliente.': {
      es: 'Paso 1: Define el dolor número 1 que le quita el sueño a tu cliente.',
      pt: 'Passo 1: Defina a dor número 1 que tira o sono do seu cliente.',
      en: 'Step 1: Identify the #1 pain point keeping your ideal client awake.'
    },
    'Passo 1: Defina a dor número 1 que tira o sono do seu cliente.': {
      es: 'Paso 1: Define el dolor número 1 que le quita el sueño a tu cliente.',
      pt: 'Passo 1: Defina a dor número 1 que tira o sono do seu cliente.',
      en: 'Step 1: Identify the #1 pain point keeping your ideal client awake.'
    },
    'Step 1: Identify the #1 pain point keeping your ideal client awake.': {
      es: 'Paso 1: Define el dolor número 1 que le quita el sueño a tu cliente.',
      pt: 'Passo 1: Defina a dor número 1 que tira o sono do seu cliente.',
      en: 'Step 1: Identify the #1 pain point keeping your ideal client awake.'
    },

    // Checklist Item 2
    'Paso 2: Usa un gancho de pregunta reflexiva en la primera diapositiva.': {
      es: 'Paso 2: Usa un gancho de pregunta reflexiva en la primera diapositiva.',
      pt: 'Passo 2: Use um gancho de pergunta reflexiva no primeiro slide.',
      en: 'Step 2: Use a thought-provoking question hook on the first slide.'
    },
    'Passo 2: Use um gancho de pergunta reflexiva no primeiro slide.': {
      es: 'Paso 2: Usa un gancho de pregunta reflexiva en la primera diapositiva.',
      pt: 'Passo 2: Use um gancho de pergunta reflexiva no primeiro slide.',
      en: 'Step 2: Use a thought-provoking question hook on the first slide.'
    },
    'Step 2: Use a thought-provoking question hook on the first slide.': {
      es: 'Paso 2: Usa un gancho de pregunta reflexiva en la primera diapositiva.',
      pt: 'Passo 2: Use um gancho de pergunta reflexiva no primeiro slide.',
      en: 'Step 2: Use a thought-provoking question hook on the first slide.'
    },

    // Checklist Item 3
    'Paso 3: Entrega la solución en 3 puntos y remata con un CTA a mensaje directo.': {
      es: 'Paso 3: Entrega la solución en 3 puntos y remata con un CTA a mensaje directo.',
      pt: 'Passo 3: Entregue a solução em 3 pontos e finalize com um CTA para o direct.',
      en: 'Step 3: Deliver the solution in 3 points and end with a DM call to action.'
    },
    'Passo 3: Entregue a solução em 3 pontos e finalize com um CTA para o direct.': {
      es: 'Paso 3: Entrega la solución en 3 puntos y remata con un CTA a mensaje directo.',
      pt: 'Passo 3: Entregue a solução em 3 pontos e finalize com um CTA para o direct.',
      en: 'Step 3: Deliver the solution in 3 points and end with a DM call to action.'
    },
    'Passo 3: Entregue a solução em 3 puntos e finalize com um CTA para o direct.': {
      es: 'Paso 3: Entrega la solución en 3 puntos y remata con un CTA a mensaje directo.',
      pt: 'Passo 3: Entregue a solução em 3 pontos e finalize com um CTA para o direct.',
      en: 'Step 3: Deliver the solution in 3 points and end with a DM call to action.'
    },
    'Step 3: Deliver the solution in 3 points and end with a DM call to action.': {
      es: 'Paso 3: Entrega la solución en 3 puntos y remata con un CTA a mensaje directo.',
      pt: 'Passo 3: Entregue a solução em 3 pontos e finalize com um CTA para o direct.',
      en: 'Step 3: Deliver the solution in 3 points and end with a DM call to action.'
    },

    // Default Slide 2 bullets
    'Publicas frases inspiracionales sin oferta': {
      es: 'Publicas frases inspiracionales sin oferta',
      pt: 'Você posta frases inspiracionais sem oferta clara',
      en: 'Posting motivational quotes without a clear offer'
    },
    'Você posta frases inspiracionais sem oferta clara': {
      es: 'Publicas frases inspiracionales sin oferta',
      pt: 'Você posta frases inspiracionais sem oferta clara',
      en: 'Posting motivational quotes without a clear offer'
    },
    'Posting motivational quotes without a clear offer': {
      es: 'Publicas frases inspiracionales sin oferta',
      pt: 'Você posta frases inspiracionais sem oferta clara',
      en: 'Posting motivational quotes without a clear offer'
    },

    'Tu biografía no explica qué problema resuelves': {
      es: 'Tu biografía no explica qué problema resuelves',
      pt: 'Sua biografia não explica qual problema você resolve',
      en: 'Your bio does not explain what problem you solve'
    },
    'Sua biografia não explica qual problema você resolve': {
      es: 'Tu biografía no explica qué problema resuelves',
      pt: 'Sua biografia não explica qual problema você resolve',
      en: 'Your bio does not explain what problem you solve'
    },
    'Your bio does not explain what problem you solve': {
      es: 'Tu biografía no explica qué problema resuelves',
      pt: 'Sua biografia não explica qual problema você resolve',
      en: 'Your bio does not explain what problem you solve'
    },

    'Compites por precio en vez de por valor real': {
      es: 'Compites por precio en vez de por valor real',
      pt: 'Você compete por preço em vez de valor real',
      en: 'Competing on price instead of actual value'
    },
    'Você compete por preço em vez de valor real': {
      es: 'Compites por precio en vez de por valor real',
      pt: 'Você compete por preço em vez de valor real',
      en: 'Competing on price instead of actual value'
    },
    'Competing on price instead of actual value': {
      es: 'Compites por precio en vez de por valor real',
      pt: 'Você compete por preço em vez de valor real',
      en: 'Competing on price instead of actual value'
    },

    // Default Slide 3 bullets
    '1. Toca un dolor específico en la primera frase': {
      es: '1. Toca un dolor específico en la primera frase',
      pt: '1. Toque em uma dor específica na primeira frase',
      en: '1. Touch a specific pain point in the first line'
    },
    '1. Toque em uma dor específica na primeira frase': {
      es: '1. Toca un dolor específico en la primera frase',
      pt: '1. Toque em uma dor específica na primeira frase',
      en: '1. Touch a specific pain point in the first line'
    },
    '1. Touch a specific pain point in the first line': {
      es: '1. Toca un dolor específico en la primera frase',
      pt: '1. Toque em uma dor específica na primeira frase',
      en: '1. Touch a specific pain point in the first line'
    },

    '2. Muestra pruebas reales de tu trabajo': {
      es: '2. Muestra pruebas reales de tu trabajo',
      pt: '2. Mostre provas reais do seu trabalho',
      en: '2. Show real proof of your work'
    },
    '2. Mostre provas reais do seu trabalho': {
      es: '2. Muestra pruebas reales de tu trabajo',
      pt: '2. Mostre provas reais do seu trabalho',
      en: '2. Show real proof of your work'
    },
    '2. Show real proof of your work': {
      es: '2. Muestra pruebas reales de tu trabajo',
      pt: '2. Mostre provas reais do seu trabalho',
      en: '2. Show real proof of your work'
    },

    '3. Haz un llamado a la acción simple y sin rodeos': {
      es: '3. Haz un llamado a la acción simple y sin rodeos',
      pt: '3. Faça uma chamada para ação simples e direta',
      en: '3. Make a simple, direct call to action'
    },
    '3. Faça uma chamada para ação simples e direta': {
      es: '3. Haz un llamado a la acción simple y sin rodeos',
      pt: '3. Faça uma chamada para ação simples e direta',
      en: '3. Make a simple, direct call to action'
    },
    '3. Make a simple, direct call to action': {
      es: '3. Haz un llamado a la acción simple y sin rodeos',
      pt: '3. Faça uma chamada para ação simples e direta',
      en: '3. Make a simple, direct call to action'
    },

    // New item placeholder
    'Nuevo punto clave destacado': {
      es: 'Nuevo punto clave destacado',
      pt: 'Novo ponto-chave destacado',
      en: 'New key takeaway point'
    },
    'Novo ponto-chave destacado': {
      es: 'Nuevo punto clave destacado',
      pt: 'Novo ponto-chave destacado',
      en: 'New key takeaway point'
    },
    'New key takeaway point': {
      es: 'Nuevo punto clave destacado',
      pt: 'Novo ponto-chave destacado',
      en: 'New key takeaway point'
    }
  };

  return bullets.map((b) => {
    const trimmed = b.trim();
    if (CHECKLIST_DICTIONARY[trimmed]) {
      return CHECKLIST_DICTIONARY[trimmed][safeLang];
    }

    // Dynamic prefix replacement: Paso X: / Passo X: / Step X:
    let result = trimmed;
    if (safeLang === 'pt') {
      result = result.replace(/^Paso\s+(\d+)[:\.-]?\s*/i, 'Passo $1: ');
      result = result.replace(/^Step\s+(\d+)[:\.-]?\s*/i, 'Passo $1: ');
      result = result.replace(/^Punto\s+(\d+)[:\.-]?\s*/i, 'Ponto $1: ');
      result = result.replace(/^Point\s+(\d+)[:\.-]?\s*/i, 'Ponto $1: ');
    } else if (safeLang === 'en') {
      result = result.replace(/^Paso\s+(\d+)[:\.-]?\s*/i, 'Step $1: ');
      result = result.replace(/^Passo\s+(\d+)[:\.-]?\s*/i, 'Step $1: ');
      result = result.replace(/^Punto\s+(\d+)[:\.-]?\s*/i, 'Point $1: ');
      result = result.replace(/^Ponto\s+(\d+)[:\.-]?\s*/i, 'Point $1: ');
    } else {
      result = result.replace(/^Passo\s+(\d+)[:\.-]?\s*/i, 'Paso $1: ');
      result = result.replace(/^Step\s+(\d+)[:\.-]?\s*/i, 'Paso $1: ');
      result = result.replace(/^Ponto\s+(\d+)[:\.-]?\s*/i, 'Punto $1: ');
      result = result.replace(/^Point\s+(\d+)[:\.-]?\s*/i, 'Punto $1: ');
    }

    return result;
  });
}

/**
 * Checks if a title is a standard default slide or template title
 */
export function isDefaultSlideTitle(title?: string): boolean {
  if (!title) return true;
  const t = title.trim().toUpperCase();
  return (
    t.includes('POR QUÉ NO TIENES CLIENTES') ||
    t.includes('POR QUE VOCÊ NÃO TEM CLIENTES') ||
    t.includes("WHY DON'T YOU HAVE CLIENTS") ||
    t.includes('LE HABLAS A TODO EL MUNDO') ||
    t.includes('VOCÊ FALA COM TODO MUNDO') ||
    t.includes('YOU SPEAK TO EVERYONE') ||
    t.includes('PASOS PARA QUE VENGAN') ||
    t.includes('PASSOS PARA QUE VENHAM') ||
    t.includes('STEPS SO THEY COME') ||
    t.includes('QUIERES QUE AUDITEMOS') ||
    t.includes('QUER UMA AUDITORIA') ||
    t.includes('WANT US TO AUDIT') ||
    t.includes('PASOS PARA EJECUTAR') ||
    t.includes('PASSOS PARA EXECUTAR') ||
    t.includes('STEPS TO EXECUTE') ||
    t.includes('COMPARACIÓN CLAVE') ||
    t.includes('COMPARAÇÃO ESTRATÉGICA') ||
    t.includes('KEY COMPARISON') ||
    t.includes('PASO') ||
    t.includes('PASOS') ||
    t.includes('PASSO') ||
    t.includes('PASSOS') ||
    t.includes('STEP') ||
    t.includes('STEPS') ||
    t.includes('CHECKLIST')
  );
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
  const safeLang = (lang === 'pt' ? 'pt' : lang === 'en' ? 'en' : 'es') as AppLanguage;
  const loc = TEMPLATE_LOCALIZATIONS[safeLang];

  const updated: Slide = {
    ...slide,
    layoutTemplate: newLayout,
  };

  switch (newLayout) {
    case 'quote': {
      const isDefaultQuote = !slide.quote?.quoteText ||
        slide.quote.quoteText === TEMPLATE_LOCALIZATIONS.es.quote.quoteText ||
        slide.quote.quoteText === TEMPLATE_LOCALIZATIONS.pt.quote.quoteText ||
        slide.quote.quoteText === TEMPLATE_LOCALIZATIONS.en.quote.quoteText;

      const quoteText = isDefaultQuote ? loc.quote.quoteText : (slide.quote?.quoteText || loc.quote.quoteText);
      const authorName = slide.quote?.authorName || brandName || 'LA VISUAL MK';
      const isDefaultRole = !slide.quote?.authorRole ||
        slide.quote.authorRole === TEMPLATE_LOCALIZATIONS.es.quote.authorRole ||
        slide.quote.authorRole === TEMPLATE_LOCALIZATIONS.pt.quote.authorRole ||
        slide.quote.authorRole === TEMPLATE_LOCALIZATIONS.en.quote.authorRole;
      const authorRole = isDefaultRole ? loc.quote.authorRole : slide.quote.authorRole;

      updated.quote = {
        quoteText,
        authorName,
        authorRole,
      };
      break;
    }

    case 'split_comparison': {
      updated.comparison = {
        leftTag: slide.comparison?.leftTag && !isDefaultComparisonTag(slide.comparison.leftTag) ? slide.comparison.leftTag : loc.comparison.leftTag,
        leftTitle: slide.comparison?.leftTitle && !isDefaultComparisonTitle(slide.comparison.leftTitle) ? slide.comparison.leftTitle : loc.comparison.leftTitle,
        leftText: slide.comparison?.leftText && !isDefaultComparisonText(slide.comparison.leftText) ? slide.comparison.leftText : loc.comparison.leftText,
        rightTag: slide.comparison?.rightTag && !isDefaultComparisonTag(slide.comparison.rightTag) ? slide.comparison.rightTag : loc.comparison.rightTag,
        rightTitle: slide.comparison?.rightTitle && !isDefaultComparisonTitle(slide.comparison.rightTitle) ? slide.comparison.rightTitle : loc.comparison.rightTitle,
        rightText: slide.comparison?.rightText && !isDefaultComparisonText(slide.comparison.rightText) ? slide.comparison.rightText : loc.comparison.rightText,
      };
      if (isDefaultSlideTitle(updated.title) || updated.title === 'COMPARACIÓN CLAVE' || updated.title === 'COMPARAÇÃO ESTRATÉGICA' || updated.title === 'KEY COMPARISON') {
        updated.title = loc.comparison.title;
      }
      break;
    }

    case 'big_number': {
      updated.stat = {
        statNumber: slide.stat?.statNumber || loc.stat.statNumber,
        statLabel: slide.stat?.statLabel && !isDefaultStatLabel(slide.stat.statLabel) ? slide.stat.statLabel : loc.stat.statLabel,
        statSubtext: slide.stat?.statSubtext && !isDefaultStatSubtext(slide.stat.statSubtext) ? slide.stat.statSubtext : loc.stat.statSubtext,
      };
      updated.badge = resolveLocalizedBadge(updated.badge, 'big_number', safeLang);
      break;
    }

    case 'checklist': {
      // When switching to checklist, if bullets are empty or match any default, apply current language checklist bullets
      const hasCustomBullets = updated.bullets && updated.bullets.length > 0 && !areDefaultChecklistBullets(updated.bullets);
      if (!hasCustomBullets) {
        updated.bullets = [...loc.checklist.bullets];
      } else {
        updated.bullets = resolveChecklistBullets(updated.bullets, safeLang);
      }
      updated.badge = loc.checklist.badge;
      if (isDefaultSlideTitle(updated.title)) {
        updated.title = loc.checklist.title;
      }
      break;
    }

    case 'cta_final': {
      updated.ctaFinal = {
        headline: slide.ctaFinal?.headline && !isDefaultCtaHeadline(slide.ctaFinal.headline) ? slide.ctaFinal.headline : loc.ctaFinal.headline,
        subheadline: slide.ctaFinal?.subheadline && !isDefaultCtaSubheadline(slide.ctaFinal.subheadline) ? slide.ctaFinal.subheadline : loc.ctaFinal.subheadline,
        actionPill: slide.ctaFinal?.actionPill && !isDefaultCtaPill(slide.ctaFinal.actionPill) ? slide.ctaFinal.actionPill : loc.ctaFinal.actionPill,
      };
      updated.badge = loc.ctaFinal.badge;
      break;
    }

    case 'standard':
    default: {
      updated.cta = resolveLocalizedCta(updated.cta, safeLang);
      updated.badge = resolveLocalizedBadge(updated.badge, 'standard', safeLang);
      updated.subtag = resolveLocalizedSubtag(updated.subtag, safeLang);
      break;
    }
  }

  return updated;
}

/**
 * Localizes an entire slide dynamically
 */
export function localizeSlide(slide: Slide, lang: string = 'es', brandName?: string): Slide {
  const safeLang = (lang === 'pt' ? 'pt' : lang === 'en' ? 'en' : 'es') as AppLanguage;
  const layout = slide.layoutTemplate || 'standard';

  const updated: Slide = {
    ...slide,
    badge: resolveLocalizedBadge(slide.badge, layout, safeLang),
    subtag: resolveLocalizedSubtag(slide.subtag, safeLang),
    cta: resolveLocalizedCta(slide.cta, safeLang),
    bullets: resolveChecklistBullets(slide.bullets, safeLang),
  };

  return applyLayoutTemplateToSlide(updated, layout, safeLang, brandName);
}

/**
 * Localizes an entire array of slides
 */
export function localizeSlidesArray(slides: Slide[], lang: string = 'es', brandName?: string): Slide[] {
  return slides.map((slide) => localizeSlide(slide, lang, brandName));
}

// Helpers to check default values
function areDefaultChecklistBullets(bullets: string[]): boolean {
  if (bullets.length === 0) return true;
  return bullets.some(b => 
    b.includes('Paso 1: Define') || 
    b.includes('Passo 1: Defina') || 
    b.includes('Step 1: Identify') ||
    b.includes('Paso 2: Usa') ||
    b.includes('Passo 2: Use') ||
    b.includes('Step 2: Use') ||
    b.includes('Paso 3: Entrega') ||
    b.includes('Passo 3: Entregue') ||
    b.includes('Step 3: Deliver') ||
    b.includes('Publicas frases') ||
    b.includes('Você posta frases') ||
    b.includes('Posting motivational') ||
    b.includes('Tu biografía no explica') ||
    b.includes('Sua biografia não explica') ||
    b.includes('Your bio does not explain') ||
    b.includes('Compites por precio') ||
    b.includes('Você compete por preço') ||
    b.includes('Competing on price') ||
    b.includes('1. Toca un dolor') ||
    b.includes('1. Toque em uma dor') ||
    b.includes('1. Touch a specific') ||
    b.includes('2. Muestra pruebas') ||
    b.includes('2. Mostre provas') ||
    b.includes('2. Show real proof') ||
    b.includes('3. Haz un llamado') ||
    b.includes('3. Faça uma chamada') ||
    b.includes('3. Make a simple')
  );
}

function isDefaultComparisonTag(text: string): boolean {
  return ['El Error Común', 'O Erro Comum', 'The Common Mistake', 'La Estrategia Real', 'A Estratégia Real', 'The Real Strategy'].includes(text.trim());
}

function isDefaultComparisonTitle(text: string): boolean {
  return ['Publicar sin estrategia ni oferta clara', 'Postar sem estratégia nem oferta clara', 'Posting without strategy or a clear offer', 'Carruseles con ganchos de dolor & solución', 'Carrosséis com ganchos de dor & solução', 'Carousels with pain & solution hooks'].includes(text.trim());
}

function isDefaultComparisonText(text: string): boolean {
  return ['Atrae solo curiosos y nadie pregunta por el servicio.', 'Atrai apenas curiosos e ninguém pergunta pelo serviço.', 'Attracts only window shoppers and no real inquiries.', 'Filtra clientes calificados listos para comprar.', 'Filtra clientes qualificados prontos para comprar.', 'Filters high-intent qualified buyers ready to close.'].includes(text.trim());
}

function isDefaultStatLabel(text: string): boolean {
  return ['MÁS CONSULTAS CALIFICADAS', 'MAIS CONTATOS QUALIFICADOS', 'MORE QUALIFIED INQUIRIES'].includes(text.trim());
}

function isDefaultStatSubtext(text: string): boolean {
  return ['Al cambiar publicaciones genéricas por carruseles con ganchos de problema y solución directa.', 'Ao trocar postagens genéricas por carrosséis com ganchos de problema e solução direta.', 'By replacing generic content with carousels engineered around problem-solution hooks.'].includes(text.trim());
}

function isDefaultCtaHeadline(text: string): boolean {
  return ['COMENZÁ A RECIBIR CLIENTES ESTA SEMANA', 'COMECE A RECEBER CLIENTES ESTA SEMANA', 'START GETTING QUALIFIED CLIENTS THIS WEEK'].includes(text.trim());
}

function isDefaultCtaSubheadline(text: string): boolean {
  return ['Envíanos un mensaje directo o comenta con la palabra clave para recibir la guía completa.', 'Envie uma mensagem direta ou comente com a palavra-chave para receber o guia completo.', 'Send us a direct message or comment with the keyword to receive the complete playbook.'].includes(text.trim());
}

function isDefaultCtaPill(text: string): boolean {
  return ['Comenta "CARRUSEL" y te escribimos', 'Comente "CARROSSEL" e te chamamos', 'Comment "CAROUSEL" and we will DM you'].includes(text.trim());
}
