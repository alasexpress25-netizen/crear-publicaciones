import { Slide, MarketingDocument } from '../types';

export const DEFAULT_MARKETING_DOCUMENTS: MarketingDocument[] = [
  {
    id: 'doc-hook-bible',
    name: '📖 Biblia de Ganchos que Frenan el Scroll (Direct Response)',
    type: 'document',
    content: `
REGLAS MAESTRAS DE GANCHOS PARA LA DIAPOSITIVA 1:
1. El usuario promedio decide en 0.4 segundos si sigue o desliza.
2. Si la diapositiva 1 habla de "Nosotros" o dice "Vendemos X", el cerebro del lector lo filtra como spam.
3. Fórmula "Dedo en la Llaga": Identifica la frustración diaria no resuelta y conviértela en pregunta directa.
   Ej: "¿Por qué trabajas 12 horas al día y tu cuenta bancaria sigue igual?", "¿Por qué tus clientes te piden presupuesto y nunca más contestan?".
4. Fórmula "El Error Invisible": Apunta a un error que el lector comete sin saberlo.
   Ej: "5 errores que hacen que tu servicio parezca de aficionados", "El error en tu precio que te hace perder a los mejores clientes".
5. Fórmula "Quiebre de Creencias": Destruye un mito popular del rubro.
   Ej: "Publicar todos los días no te va a conseguir clientes si te falta esto", "Tener el precio más bajo es la forma más rápida de quebrar".
6. Fórmula "El Contraste": Muestra el abismo entre quienes triunfan y quienes se quedan estancados.
   Ej: "Los que sobreviven vs los que escalan: la única diferencia que importa".
    `,
    addedAt: '2026-08-15',
    summary: 'Guía de persuasión y psicología para hooks de alta retención.',
    extractedAngles: ['Preguntas de dolor profundo', 'Errores no evidentes', 'Mitos derribados', 'Comparaciones antes/después'],
    extractedPains: ['Poco alcance', 'Falta de ventas', 'Clientes que no pagan bien', 'Pérdida de tiempo en redes']
  },
  {
    id: 'doc-trust-framework',
    name: '🛡️ Marco de Marketing de Confianza (Trust-First)',
    type: 'document',
    content: `
FILOSOFÍA DE CONFIANZA:
En mercados saturados, los compradores no tienen falta de opciones, tienen MIEDO A SER ESTAFADOS o a perder dinero.
Para generar confianza instantánea en un carrusel:
- Sé hiper-específico: En lugar de "atención rápida", usa "instalación en 24 horas y respuesta en menos de 15 minutos".
- Admite lo que no haces: Decir a quién NO le sirve tu producto genera 10x más credibilidad con tu cliente ideal.
- Muestra el proceso detrás de escena: Los carruseles educativos que enseñan "el cómo" posicionan como autoridad absoluta.
- CTA sin fricción: No pidas "Comprar ahora" de golpe en la primera interacción; pide "Guardar para consultarlo", "Comenta 'GUIA' para recibir el checklist", o "Escríbenos para un diagnóstico sin cargo".
    `,
    addedAt: '2026-08-15',
    summary: 'Estrategia para derribar objeciones y escepticismo.',
    extractedAngles: ['Especificidad radical', 'Descalificación estratégica', 'Proceso transparente'],
    extractedPains: ['Miedo a equivocarse al contratar', 'Desconfianza en promesas vacías']
  }
];

export const HOOK_CATEGORY_TEMPLATES = [
  {
    id: 'pregunta_reflexiva',
    name: '🎯 Pregunta Reflexiva / Dedo en la Llaga',
    description: 'Toca una frustración cotidiana o una duda que no deja dormir a tu cliente.',
    examples: [
      '¿POR QUÉ TUS CLIENTES DESAPARECEN TRAS EL PRESUPUESTO?',
      '¿POR QUÉ TU COMPETENCIA COBRA EL DOBLE Y TIENE COLA?',
      '¿PUBLICAS TODOS LOS DÍAS Y NADIE PREGUNTA PRECIOS?'
    ]
  },
  {
    id: 'error_costoso',
    name: '⚠️ Errores Costosos & Trampas Ocultas',
    description: 'Advierte sobre algo que están haciendo mal ahora mismo y les cuesta dinero.',
    examples: [
      '¿COMETES ALGUNO DE ESTOS 4 ERRORES AL VENDER?',
      'EL ERROR SILENCIOSO QUE TE HACE VER AMATEUR',
      '3 COSAS QUE ESPANTAN A TUS MEJORES CLIENTES'
    ]
  },
  {
    id: 'quiebre_creencia',
    name: '⚡ Quiebre de Creencias (Contrarian)',
    description: 'Desafía lo que todo el mundo asume como verdad para llamar la atención.',
    examples: [
      'BAJAR PRECIOS ES LA FORMA MÁS RÁPIDA DE QUEBRAR',
      'EL CONTENIDO DE VALOR YA NO ALCANZA (A MENOS QUE HAGAS ESTO)',
      'TENER MÁS SEGUIDORES NO TE VA A SALVAR EL MES'
    ]
  },
  {
    id: 'contraste_antes_despues',
    name: '🔄 Contraste & La Gran Diferencia',
    description: 'Compara dos caminos o mentalidades con alto impacto visual.',
    examples: [
      'LOS QUE BUSCAN LIKES VS LOS QUE BUSCAN FACTURAR',
      'CÓMO VENDÍAS ANTES VS CÓMO SE VENDE HOY',
      'LA DIFERENCIA ENTRE UN NEGOCIO QUE SOBREVIVE Y UNO QUE ESCALA'
    ]
  },
  {
    id: 'analogia_impacto',
    name: '♟️ Analogía Memorable',
    description: 'Usa una metáfora visual que se comprende en una fracción de segundo.',
    examples: [
      'HACER MARKETING SIN ESTRATEGIA ES JUGAR AJEDREZ A OSCURAS',
      'TU WEB ES COMO UN LOCAL SIN CARTEL EN EL DESIERTO',
      'VENDER SIN OFERTA CLARA ES PESCAR SIN ANZUELO'
    ]
  }
];

export const INITIAL_DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    _uid: 'sl-1',
    badge: 'ALERTA DE NEGOCIO',
    subtag: '¿Te suena familiar?',
    title: '¿POR QUÉ NO TIENES CLIENTES SI TU SERVICIO ES BUENO?',
    body: 'El problema casi nunca es la calidad de lo que haces, sino esto que estás ignorando...',
    cta: 'Desliza para ver la verdad 👉',
    bullets: [],
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
    mediaType: 'image',
    fit: 'cover',
    zoom: 1,
    posX: 50,
    posY: 50,
    overlayIntensity: 85,
    imageSuggestion: 'Persona profesional mirando con expresión de reflexión y frustración estratégica en su oficina'
  },
  {
    id: 2,
    _uid: 'sl-2',
    badge: 'EL ERROR OCULTO',
    subtag: 'El error #1',
    title: 'LE HABLAS A TODO EL MUNDO (Y POR ESO NADIE TE ESCUCHA)',
    body: 'Cuando tu mensaje intenta convencer a cualquiera, se vuelve genérico e invisible en el feed.',
    cta: 'Mira el siguiente error 👉',
    bullets: [
      'Publicas frases inspiracionales sin oferta',
      'Tu biografía no explica qué problema resuelves',
      'Compites por precio en vez de por valor real'
    ],
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop',
    mediaType: 'image',
    fit: 'cover',
    zoom: 1,
    posX: 50,
    posY: 50,
    overlayIntensity: 85,
    imageSuggestion: 'Oficina moderna con gráficos en pizarra y estrategia de clientes'
  },
  {
    id: 3,
    _uid: 'sl-3',
    badge: 'LA SOLUCIÓN',
    subtag: 'El cambio de juego',
    title: '3 PASOS PARA QUE VENGAN A BUSCARTE A TI',
    body: 'Aplica este marco simple para posicionarte como la única opción lógica en tu ciudad o nicho:',
    cta: 'Aplica esto hoy 👉',
    bullets: [
      '1. Toca un dolor específico en la primera frase',
      '2. Muestra pruebas reales de tu trabajo',
      '3. Haz un llamado a la acción simple y sin rodeos'
    ],
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
    mediaType: 'image',
    fit: 'cover',
    zoom: 1,
    posX: 50,
    posY: 50,
    overlayIntensity: 85,
    imageSuggestion: 'Equipo de trabajo cerrando acuerdos y revisando resultados exitosos'
  },
  {
    id: 4,
    _uid: 'sl-4',
    badge: 'LLAMADO A LA ACCIÓN',
    subtag: 'Da el siguiente paso',
    title: '¿QUIERES QUE AUDITEMOS TU ESTRATEGIA SIN COSTO?',
    body: 'Escríbenos "CARRUSEL" por mensaje directo y te mostramos qué ajustar en tus redes esta semana.',
    cta: '💬 Envíanos un DM ahora',
    bullets: [],
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop',
    mediaType: 'image',
    fit: 'cover',
    zoom: 1,
    posX: 50,
    posY: 50,
    overlayIntensity: 90,
    imageSuggestion: 'Pantalla de smartphone con chat abierto y café en mesa ejecutiva'
  }
];

export const CURATED_STOCK_PHOTOS = [
  { label: 'Negocios / Ejecutivo', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Estrategia / Reunión', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Creatividad / Laptop', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Local Comercial / Tienda', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Fitness / Gimnasio', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Gastronomía / Café', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Tecnología / Pantallas', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Finanzas / Crecimiento', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200&auto=format&fit=crop' }
];
