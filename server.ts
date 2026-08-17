import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import ytdl from "@distube/ytdl-core";

dotenv.config();

let aiClients: GoogleGenAI[] = [];
let currentKeyIndex = 0;

function getAI(): GoogleGenAI {
  if (aiClients.length === 0) {
    // Read single key or comma-separated list of keys, or GEMINI_API_KEY_2, etc.
    const rawKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_BACKUP,
    ].filter(Boolean) as string[];

    // Also support comma-separated keys inside GEMINI_API_KEY
    const allKeys: string[] = [];
    rawKeys.forEach(k => {
      k.split(",").forEach(item => {
        const trimmed = item.trim();
        if (trimmed && !allKeys.includes(trimmed)) {
          allKeys.push(trimmed);
        }
      });
    });

    if (allKeys.length === 0) {
      console.warn("No GEMINI_API_KEY found in environment.");
      allKeys.push("");
    }

    aiClients = allKeys.map(key => new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    }));
  }

  return aiClients[currentKeyIndex % aiClients.length];
}

// Official supported Gemini models for current SDK
const SUPPORTED_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash"
];

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// Executes an AI call with automatic failover to backup keys AND alternative models if rate limited or high demand
async function executeWithFallback<T>(fn: (ai: GoogleGenAI, modelName: string) => Promise<T>): Promise<T> {
  const totalKeys = Math.max(1, aiClients.length);
  let lastError: any = null;

  for (let modelIdx = 0; modelIdx < SUPPORTED_MODELS.length; modelIdx++) {
    const currentModel = SUPPORTED_MODELS[modelIdx];

    for (let attempt = 0; attempt < totalKeys; attempt++) {
      const ai = getAI();
      try {
        return await fn(ai, currentModel);
      } catch (err: any) {
        lastError = err;
        const errStr = JSON.stringify(err?.message || err || "");
        const isRateOrAuthError = 
          err?.status === 429 || 
          errStr.includes("429") || 
          errStr.includes("quota") || 
          errStr.includes("RESOURCE_EXHAUSTED") ||
          err?.status === 403 ||
          errStr.includes("API_KEY_INVALID");

        const isHighDemandOrNotFound =
          err?.status === 503 ||
          err?.status === 404 ||
          errStr.includes("503") ||
          errStr.includes("404") ||
          errStr.includes("high demand") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("not found") ||
          errStr.includes("overloaded");

        if (isRateOrAuthError && aiClients.length > 1) {
          console.warn(`[Gemini Fallback] Key #${currentKeyIndex + 1} rate limited. Switching to backup key...`);
          currentKeyIndex = (currentKeyIndex + 1) % aiClients.length;
          await wait(500);
          continue;
        }

        if (isHighDemandOrNotFound) {
          console.warn(`[Gemini Model Fallover] Model ${currentModel} returned ${err?.status || 'error'}. Trying fallback model...`);
          await wait(600);
          break; // Break key loop to try next supported model
        }

        if (attempt < totalKeys - 1) {
          currentKeyIndex = (currentKeyIndex + 1) % aiClients.length;
          await wait(500);
          continue;
        }
      }
    }
  }

  throw lastError;
}

// Built-in marketing expert knowledge base injected into system prompts
const MARKETING_PSYCHOLOGY_FRAMEWORK = `
ERES UN DIRECTOR ESTRATÉGICO DE MARKETING Y COPYWRITER SENIOR DE RESPUESTA DIRECTA.
Tu especialidad es crear publicaciones y carruseles para redes sociales (Instagram, LinkedIn, TikTok) que DETIENEN EL SCROLL en el primer segundo y convierten desconocidos en clientes.

FILOSOFÍA DEL "MARKETING DE CONFIANZA Y PSICOLOGÍA DEL SCROLL":
1. En redes, nadie entra a ver anuncios genéricos ("Vendemos esto", "Somos los mejores", "Conoce nuestros servicios"). El usuario promedio scrollea a 2 metros de pantalla por minuto.
2. Si la DIAPOSITIVA 1 suena a vendedor tradicional, el usuario se va en 0.5 segundos.
3. La DIAPOSITIVA 1 TIENE UN SOLO TRABAJO: Romper el patrón mental, generar tensión, tocar un dolor latente o abrir una brecha de curiosidad irresistible que OBLIGUE a deslizar a la siguiente diapositiva.
4. ESTRUCTURAS DE GANCHO PARA LA DIAPOSITIVA 1 (SCROLL-STOPPERS):
   - 🎯 PREGUNTA DE REFLEXIÓN / DEDO EN LA LLAGA: No "¿Quieres vender más?", sino "¿Por qué tu competencia vende el doble cobrando más caro?", "¿Por qué publicas todos los días y nadie te pregunta el precio?", "¿Por qué tus clientes desaparecen cuando les pasas el presupuesto?".
   - ⚠️ ERRORES COSTOSOS Y TRAMPAS: "Cometes alguno de estos 4 errores al cotizar?", "El error silencioso que hace que tu negocio parezca amateur", "3 cosas que estás haciendo que espantan a tus mejores clientes".
   - ⚡ QUIEBRE DE CREENCIA (CONTRARIAN): "Tener más seguidores no te va a salvar", "El contenido de valor ya no funciona como antes (a menos que hagas esto)", "Dejá de bajar tus precios para competir".
   - 🔄 CONTRASTE ANTES VS DESPUÉS / EL ABISMO: "Muchos buscan likes. Los negocios reales buscan facturación.", "La diferencia entre un negocio que sobrevive y uno que escala".
   - ♟️ ANALOGÍA DE ALTO IMPACTO: "Hacer marketing sin estrategia es como jugar ajedrez a oscuras: solo te das cuenta del error en el jaque mate."
   - 🧪 CASO DE ESTUDIO / EXPERIMENTO: "Analizamos 50 negocios de tu rubro: esto es lo único que tenían en común los que crecían."

REGLAS DE FORMATO Y REDACCIÓN PARA CADA DIAPOSITIVA:
- Brevedad implacable: Esto se lee en pantallas de celular. Textos concisos, de alto impacto.
- Título (title): 3 a 8 palabras en MAYÚSCULAS o impacto.
- Subtítulo / Gancho secundario (subtag): 2 a 6 palabras.
- Cuerpo (body): 1 a 2 frases contundentes (máximo 15 palabras).
- Insignia (badge): Etiqueta corta opcional (ej: "ERROR COMÚN", "SECRETO", "GUÍA", "ATENCIÓN").
- Puntos clave (bullets): Opcional para diapositivas de tips/pasos, frases directas de 3 a 6 palabras.
- Llamado a la acción (cta): Claro, conversacional y motivador.
- imageSuggestion: Descripción exacta en español de la escena fotográfica o visual para esa diapositiva.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Analyze Marketing Source (URL or Document text)
  app.post("/api/analyze-marketing-source", async (req, res) => {
    try {
      const { url, rawText, documentName } = req.body;

      let contextToAnalyze = rawText || "";
      if (url && !rawText) {
        try {
          const fetchRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (fetchRes.ok) {
            const html = await fetchRes.text();
            // Basic extraction of readable text from html
            contextToAnalyze = html
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .slice(0, 15000);
          }
        } catch (fetchErr) {
          console.warn("Could not fetch URL directly, will analyze URL string itself:", fetchErr);
          contextToAnalyze = `URL del negocio: ${url}`;
        }
      }

      const prompt = `
Analiza la siguiente información de marketing / negocio proveniente de "${documentName || url || 'Documento de estrategia'}":
"""
${contextToAnalyze.slice(0, 8000)}
"""

Extrae y sintetiza un perfil estratégico de marketing de alto valor para entrenar a la IA en la creación de carruseles.
Identifica especialmente el vocabulario técnico, métricas, acrónimos o jerga profesional propios de esta industria.
Devuelve un JSON con:
{
  "businessSummary": "Resumen claro del negocio y propuesta de valor (2-3 líneas)",
  "targetAudience": "A quién se dirige y qué nivel de consciencia tienen",
  "painPoints": ["Dolor o frustración 1", "Dolor 2", "Dolor 3", "Dolor 4"],
  "commonMistakes": ["Error común que comete el cliente ideal 1", "Error 2", "Error 3"],
  "uniqueAngles": ["Ángulo diferenciador o propuesta única 1", "Ángulo 2", "Ángulo 3"],
  "technicalTerms": ["Término técnico/jerga 1", "Término 2", "Término 3", "Término 4", "Término 5", "Término 6"],
  "recommendedHooks": [
    "Pregunta provocadora de scroll-stopper 1",
    "Pregunta o gancho de error 2",
    "Gancho de creencia errónea 3"
  ],
  "brandTone": "Tono de comunicación recomendado (ej: Directo, empático, autoritario, disruptivo)"
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: MARKETING_PSYCHOLOGY_FRAMEWORK,
            temperature: 0.5,
          },
        })
      );

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error analyzing marketing source:", err);
      res.status(500).json({ error: err.message || "Error al analizar fuente de marketing" });
    }
  });

  // 2. Generate Carousel with Advanced Strategy
  app.post("/api/generate-carousel", async (req, res) => {
    try {
      const {
        brief,
        slideCount = 5,
        objective = "ventas",
        hookType = "pregunta_reflexiva",
        targetAudience = "",
        knowledgeBase = "",
        technicalTerms = [],
        brand = { name: "LA VISUAL MK", web: "lavisualmk.com" },
        language = "es"
      } = req.body;

      const languageName = language === "pt" ? "Portugués (Brasil - pt-BR)" : language === "en" ? "English (US - en-US)" : "Español (es)";
      
      const technicalTermsList = Array.isArray(technicalTerms) && technicalTerms.length > 0
        ? technicalTerms.join(", ")
        : (brand.technicalTerms && brand.technicalTerms.length > 0 ? brand.technicalTerms.join(", ") : "");

      const prompt = `
CREAR UN CARRUSEL DE REDES SOCIALES ESTRATÉGICO DE EXACTAMENTE ${slideCount} DIAPOSITIVAS.

DATOS DEL NEGOCIO / BRIEF:
${brief}

AUDIENCIA OBJETIVO:
${targetAudience || "Clientes potenciales que buscan solucionar un problema real"}

DOCUMENTOS / CONOCIMIENTO DE MARKETING AGREGADO:
${knowledgeBase || "Sin documentos adicionales"}

${technicalTermsList ? `VOCABULARIO TÉCNICO, JERGA O TÉRMINOS OBLIGATORIOS DEL SECTOR A INCLUIR NATURALMENTE:
${technicalTermsList}
-> INSTRUCCIÓN CRÍTICA DE VOCABULARIO: Incorpora de 2 a 4 de estos términos técnicos especializados de forma orgánica en los títulos, bullets o cuerpo de las diapositivas para transmitir autoridad, dominio profesional y experiencia real en el nicho.` : ''}

OBJETIVO DEL CARRUSEL:
${objective} (ventas, interacción/comentarios, guardados/tips, autoridad/marca, o alcance)

TIPO DE GANCHO PRIORITARIO PARA LA DIAPOSITIVA 1:
${hookType} (pregunta_reflexiva, error_costoso, quiebre_creencia, contraste_antes_despues, analogia, caso_revelado)

NOMBRE DE MARCA: ${brand.name} | WEB: ${brand.web}
IDIOMA DE REDACCIÓN OBLIGATORIO: ${languageName}
¡TODOS los textos (títulos, subtítulos, cuerpo, badges, bullets, cta, caption y hashtags) DEBEN ESTAR EN ${languageName}!

REQUISITOS CRÍTICOS:
1. DIAPOSITIVA 1 (EL SCROLL-STOPPER):
   - Debe frenar el scroll de inmediato.
   - NADA de "Vendemos esto" ni frases genéricas.
   - Debe usar preguntas reflexivas que duelan o generen intriga (Ej: "¿Por qué no tienes clientes?", "¿Cometes alguno de estos errores al vender?", "¿Por qué tu competencia cobra el doble?").
   - Título impactante de 4 a 8 palabras en MAYÚSCULAS.
2. DIAPOSITIVAS INTERMEDIAS (EL DESARROLLO DEL VALOR / TENSIÓN):
   - Desarrollan la idea con lógica implacable, datos concretos, errores específicos o pasos accionables.
   - Si corresponde, usar "bullets" con 2 a 3 puntos concisos.
   - Usa la jerga o términos del sector para diferenciar este contenido de contenido genérico de novatos.
3. DIAPOSITIVA FINAL (EL CIERRE / CTA):
   - Llamado a la acción inequívoco y natural para ${objective}.
4. DIRECTOR DE MEDIOS & FONDOS VISUALES ESPECÍFICOS PARA CADA DIAPOSITIVA (STOCK & IA):
   - ¡PROHIBIDO REPETIR PROMPTS O PALABRAS CLAVE ENTRE DIAPOSITIVAS!
   - CADA DIAPOSITIVA ES UN ESCENARIO VISUAL DISTINTO:
     * Slide 1: Gancho de alta tensión / emoción / duda / metáfora que frena el scroll.
     * Slides intermedias: Problema específico, error en acción, datos, herramientas de trabajo, personas debatiendo o analizando el proceso del nicho.
     * Slide final: Cierre, éxito, claridad, llamada a la acción o resultado satisfactorio.
   - "imageSuggestion": Prompt fotográfico fotorrealista/cinematográfico ÚNICO y altamente personalizado para ESTA diapositiva, de 2 a 3 frases describiendo la escena, personajes, iluminación, colores y ambiente del rubro "${brand.name} / ${brief}". SIEMPRE terminar con "sin texto en la imagen, sin marcas de agua, fotorrealismo premium".
   - "mediaSearchKeywords": 3 a 4 palabras clave en INGLÉS precisas para Pixabay acordes a la escena específica de esta diapositiva (ej: para Slide 1 de error: ["frustrated business owner", "dark office desk", "financial stress"]; para Slide de crecimiento: ["modern skyscraper interior", "confident professional", "sunset window"]).
5. POST CAPTION & HASHTAGS:
   - Redactar el texto completo para el pie de foto de Instagram/LinkedIn con gancho de lectura, espaciado elegante y llamada a la acción.
   - Lista de 5-10 hashtags ultra-específicos del nicho (sin el caracter #, en minúsculas).

Devuelve EXCLUSIVAMENTE un JSON con esta estructura exacta:
{
  "strategySummary": "Explicación de 1 frase del ángulo psicológico utilizado",
  "hookRationale": "Por qué este gancho de la Diapositiva 1 detiene el scroll",
  "slides": [
    {
      "id": 1,
      "badge": "ETIQUETA CORTA O VACÍO",
      "subtag": "Subtítulo de tensión",
      "title": "TÍTULO GANCHO EN MAYÚSCULAS",
      "body": "Cuerpo de 1 frase concisa o vacío si el título es autosuficiente",
      "cta": "Desliza para ver la verdad 👉",
      "bullets": [],
      "imageSuggestion": "Descripción concreta de la escena visual/foto profesional única para esta diapositiva",
      "mediaSearchKeywords": ["dark office", "businessman thinking", "cinematic lighting"]
    }
  ],
  "post": {
    "caption": "Texto completo del post para redes con saltos de línea...",
    "hashtags": ["marketingdigital", "negocios", "ventasonline"]
  }
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: MARKETING_PSYCHOLOGY_FRAMEWORK,
            temperature: 0.7,
          },
        })
      );

      const parsed = JSON.parse(response.text || "{}");

      // Validate & guarantee 100% distinct prompts for every slide
      if (parsed && Array.isArray(parsed.slides)) {
        const seenPrompts = new Set<string>();
        parsed.slides = parsed.slides.map((s: any, idx: number) => {
          const slideNum = idx + 1;
          const total = parsed.slides.length;
          let promptText = (s.imageSuggestion || "").trim();

          const headline = s.title || s.subtag || s.badge || `Diapositiva #${slideNum}`;
          const isHook = slideNum === 1;
          const isFinal = slideNum === total;

          if (!promptText || seenPrompts.has(promptText.toLowerCase()) || promptText.length < 25) {
            if (isHook) {
              promptText = `Fotografía cinematográfica dramática de alto impacto para ${brief}. Persona profesional con expresión de profunda reflexión frente a un problema crucial en su negocio o trabajo, luz lateral de claroscuro, fondo de oficina moderna en desenfoque suave, sin texto en la imagen, sin tipografías, sin marcas de agua, fotorrealismo premium.`;
            } else if (isFinal) {
              promptText = `Fotografía publicitaria luminosa y triunfante para ${brief}. Profesional o cliente satisfecho en un entorno de éxito y claridad, luz natural cálida de atardecer, atmósfera de confianza y solución lograda, sin texto en la imagen, sin marcas de agua, 8k fotorrealista.`;
            } else {
              promptText = `Fotografía editorial fotorrealista capturando la acción de "${headline.slice(0, 60)}" en el rubro de ${brief}. Enfoque nítido en el proceso y detalles auténticos del oficio, iluminación equilibrada de estudio, sin texto en la imagen, sin tipografías, estilo publicitario de alta gama.`;
            }
          }
          seenPrompts.add(promptText.toLowerCase());

          let keywords = Array.isArray(s.mediaSearchKeywords) && s.mediaSearchKeywords.length > 0 ? s.mediaSearchKeywords : [];
          if (keywords.length === 0) {
            const baseWords = headline
              .toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(' ')
              .filter((w: string) => w.length > 3)
              .slice(0, 3);
            keywords = baseWords.length > 0 ? baseWords : (isHook ? ['business strategy', 'thinking', 'stress'] : isFinal ? ['success', 'handshake', 'growth'] : ['workspace', 'teamwork', 'analytics']);
          }

          return {
            ...s,
            id: slideNum,
            imageSuggestion: promptText,
            mediaSearchKeywords: keywords,
          };
        });
      }

      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error generating carousel:", err);
      res.status(500).json({ error: err.message || "Error al generar carrusel" });
    }
  });

  // 2.5 Generate Niche Knowledge & Technical Glossary with 1 Click
  app.post("/api/generate-niche-knowledge", async (req, res) => {
    try {
      const { niche, language = "es" } = req.body;
      if (!niche || typeof niche !== "string" || !niche.trim()) {
        return res.status(400).json({ error: "Por favor especifica el nicho o industria" });
      }

      const langName = language === "pt" ? "Portugués (Brasil - pt-BR)" : language === "en" ? "English (US - en-US)" : "Español (es)";

      const prompt = `
Actúa como Consultor Senior de Estrategia de Contenidos y Experto en la Industria: "${niche}".
Genera un Dossier de Conocimiento de Marketing y Glosario Técnico Completo para capacitar a la IA y crear carruseles de alta conversión para clientes de este sector.

IDIOMA: ${langName}

Devuelve EXCLUSIVAMENTE un JSON con:
{
  "title": "Guía Estratégica & Glosario: ${niche}",
  "businessSummary": "Resumen de cómo opera esta industria, propuesta de valor y modelo de monetización (2-3 párrafos)",
  "targetAudience": "Perfil detallado del cliente ideal (dolores, nivel de consciencia, qué busca)",
  "technicalTerms": [
    "Término 1 (ej: KPI, sigla o concepto clave)",
    "Término 2",
    "Término 3",
    "Término 4",
    "Término 5",
    "Término 6",
    "Término 7",
    "Término 8",
    "Término 9",
    "Término 10"
  ],
  "painPoints": [
    "Frustración real o dolor que vive el cliente en este nicho 1",
    "Dolor 2",
    "Dolor 3",
    "Dolor 4"
  ],
  "commonMistakes": [
    "Error común de los clientes que contratan este servicio 1",
    "Error 2",
    "Error 3"
  ],
  "uniqueAngles": [
    "Ángulo de venta diferenciador 1",
    "Ángulo 2",
    "Ángulo 3"
  ],
  "recommendedHooks": [
    "Pregunta de shock para Slide 1",
    "Gancho de error costoso para Slide 1",
    "Gancho de quiebre de mito/creencia para Slide 1"
  ],
  "brandTone": "Tono recomendado (ej: Corporativo y analítico / Cercano y empático / Directo y retador)"
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: MARKETING_PSYCHOLOGY_FRAMEWORK,
            temperature: 0.6,
          },
        })
      );

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error generating niche knowledge:", err);
      res.status(500).json({ error: err.message || "Error al generar conocimiento del nicho" });
    }
  });

  // 3.5 Rewrite Individual Slide with AI (Shorter, more provocative, add data/jargon, etc.)
  app.post("/api/rewrite-slide", async (req, res) => {
    try {
      const {
        slide,
        instruction = "make_shorter",
        customPrompt = "",
        brief = "",
        targetAudience = "",
        technicalTerms = [],
        language = "es"
      } = req.body;

      if (!slide) {
        return res.status(400).json({ error: "Slide no proporcionado" });
      }

      const langName = language === "pt" ? "Portugués (Brasil - pt-BR)" : language === "en" ? "English (US - en-US)" : "Español (es)";
      const termsList = Array.isArray(technicalTerms) ? technicalTerms.join(", ") : "";

      let instructionDirective = "";
      switch (instruction) {
        case "make_shorter":
          instructionDirective = "Haz el texto más conciso, directo al grano y de lectura ultra-rápida (menos palabras, máxima claridad).";
          break;
        case "more_provocative":
          instructionDirective = "Haz el gancho y el texto mucho más provocador, disruptivo, de quiebre de creencias y de alto impacto emocional.";
          break;
        case "add_technical_data":
          instructionDirective = `Añade datos concretos, estadísticas o vocabulario técnico especializado del sector (${termsList || 'métricas del nicho'}) para proyectar autoridad senior.`;
          break;
        case "reflexive_question":
          instructionDirective = "Reformula el título y el enfoque como una pregunta reflexiva que haga que el lector se sienta inmediatamente aludido.";
          break;
        case "storytelling":
          instructionDirective = "Aplica una estructura de micro-storytelling (situación real, conflicto o revelación) con empatía y cercanía.";
          break;
        case "actionable_steps":
          instructionDirective = "Estructura el contenido en viñetas o pasos ultra-accionables (1, 2, 3) que el lector pueda aplicar de inmediato.";
          break;
        case "custom":
          instructionDirective = `Aplica exactamente esta instrucción del usuario: "${customPrompt}"`;
          break;
        default:
          instructionDirective = "Mejora la redacción para que sea más persuasiva y de alto impacto.";
      }

      const prompt = `
Actúa como Director Creativo y Copywriter de Élite para Redes Sociales.
Re-escribe y optimiza esta DIAPOSITIVA ESPECÍFICA siguiendo el objetivo solicitado.

IDIOMA: ${langName}
INSTRUCCIÓN ESPECÍFICA:
${instructionDirective}

CONTEXTO GENERAL DEL CARRUSEL:
${brief || "Carrusel de marketing de alta conversión"}

PÚBLICO OBJETIVO:
${targetAudience || "Público profesional o clientes ideales"}

${termsList ? `VOCABULARIO TÉCNICO DISPONIBLE:
${termsList}` : ""}

DIAPOSITIVA ORIGINAL:
${JSON.stringify(slide, null, 2)}

REGLAS:
1. Conserva la misma estructura básica (badge, subtag, title, body, cta, bullets si aplica, comparison si aplica, stat si aplica, quote si aplica, ctaFinal si aplica) pero con textos totalmente renovados, más potentes y magnéticos.
2. Mantén los títulos concisos y con impacto visual.
3. Genera un prompt fotográfico ("imageSuggestion") fotorrealista ÚNICO y adaptado al nuevo texto de esta diapositiva, terminando con "sin texto en la imagen, sin marcas de agua, fotorrealismo premium".
4. Genera 3-4 palabras clave en inglés ("mediaSearchKeywords") para Pixabay acordes a esta escena.
5. Devuelve EXCLUSIVAMENTE un JSON con la estructura actualizada de la diapositiva:
{
  "badge": "...",
  "subtag": "...",
  "title": "...",
  "body": "...",
  "cta": "...",
  "bullets": [...],
  "imageSuggestion": "...",
  "mediaSearchKeywords": ["keyword1", "keyword2", "keyword3"],
  "comparison": { ... }, // si la diapositiva original lo tenía
  "stat": { ... }, // si la diapositiva original lo tenía
  "quote": { ... }, // si la diapositiva original lo tenía
  "ctaFinal": { ... } // si la diapositiva original lo tenía
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: MARKETING_PSYCHOLOGY_FRAMEWORK,
            temperature: 0.7,
          },
        })
      );

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error rewriting slide:", err);
      res.status(500).json({ error: err.message || "Error al re-escribir la diapositiva" });
    }
  });

  // 3. Generate 5-6 Scroll-Stopping Hook Variations for Slide 1
  app.post("/api/generate-hooks", async (req, res) => {
    try {
      const { brief, targetAudience, knowledgeBase, language = "es" } = req.body;
      const targetLang = language === "pt" ? "Portugués (Brasil - pt-BR)" : language === "en" ? "English (US - en-US)" : "Español (es)";

      const prompt = `
Genera 6 ganchos psicológicos alternativos de alto impacto para la DIAPOSITIVA 1 de un carrusel de redes sociales.
Todos deben frenar el scroll instantáneamente, evitando frases genéricas.

BRIEF DEL NEGOCIO:
${brief}

AUDIENCIA / CONTEXTO:
${targetAudience || ""}
${knowledgeBase || ""}

IDIOMA OBLIGATORIO: ${targetLang}

Genera exactamente 6 tipos de ganchos con su estructura correspondiente:
1. "pregunta_reflexiva": Pregunta que pone el dedo en la llaga o toca una frustración común.
2. "error_costoso": Alerta sobre un error común o invisible que el cliente está cometiendo.
3. "quiebre_creencia": Revela una verdad contraria a lo que la mayoría cree.
4. "contraste_antes_despues": Opone dos realidades (los que pierden vs los que ganan).
5. "analogia_impacto": Compara la situación con algo visual y memorable.
6. "curiosidad_numero": Promete revelar N cosas que cambiarán sus resultados.

Devuelve un JSON con:
{
  "hooks": [
    {
      "type": "pregunta_reflexiva",
      "categoryName": "Pregunta Reflexiva / Dedo en la Llaga",
      "badge": "REFLEXIÓN",
      "subtag": "Lo que nadie te dice...",
      "title": "TEXTO DEL TÍTULO EN MAYÚSCULAS",
      "body": "Frase complementaria opcional",
      "whyItWorks": "Por qué este gancho psicológico detiene el scroll"
    }
  ]
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: MARKETING_PSYCHOLOGY_FRAMEWORK,
            temperature: 0.8,
          },
        })
      );

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error generating hooks:", err);
      res.status(500).json({ error: err.message || "Error al generar ganchos" });
    }
  });

  // 4. Translate Entire Carousel to Spanish, Portuguese or English
  app.post("/api/translate-carousel", async (req, res) => {
    try {
      const { slides, postMeta, targetLanguage = "es" } = req.body;
      const langName = targetLanguage === "pt" ? "Portugués (Brasil - pt-BR)" : targetLanguage === "en" ? "English (US - en-US)" : "Español (es)";

      const prompt = `
Actúa como Traductor Publicitario Experto y Copywriter de Redes Sociales de Alto Impacto.
Traduce y adapta estratégicamente este carrusel completo de diapositivas y el copy del post al idioma: ${langName}.

REGLAS CRÍTICAS DE TRADUCCIÓN:
1. Mantén el gancho emocional, la fuerza persuasiva, el ritmo y el tono publicitario de cada diapositiva.
2. Traduce rigurosamente TODOS los campos de texto estándar y plantillas especializadas:
   - Campos estándar: badge, subtag, title, body, cta, bullets
   - Plantilla Cita / Quote: quote.quoteText, quote.authorRole (mantén quote.authorName o el nombre del cliente intacto)
   - Plantilla Comparativa / Comparison: comparison.title, comparison.leftTag, comparison.leftTitle, comparison.leftText, comparison.rightTag, comparison.rightTitle, comparison.rightText
   - Plantilla Gran Cifra / Stat: stat.badge, stat.statLabel, stat.statSubtext
   - Plantilla Checklist: bullets, title, badge
   - Plantilla CTA Final: ctaFinal.badge, ctaFinal.headline, ctaFinal.subheadline, ctaFinal.actionPill
   - Capas personalizadas: customTexts (traducir el campo text de cada capa)
   - Post: caption y hashtags (hashtags relevantes y en el idioma de destino)
3. Conserva intactos los IDs (_uid, id), URLs de imágenes, colores, posiciones numéricas (posX, posY, zoom, textPos) y configuraciones de diseño.

CARRUSEL ORIGINAL A TRADUCIR:
${JSON.stringify({ slides, postMeta }, null, 2)}

Devuelve EXCLUSIVAMENTE un JSON válido con la estructura exacta:
{
  "slides": [
    ... // array de slides con TODOS sus campos y plantillas traducidos al ${langName}
  ],
  "post": {
    "caption": "...", // post caption adaptado al ${langName}
    "hashtags": [...] // hashtags en minúsculas en el idioma ${langName}
  }
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: MARKETING_PSYCHOLOGY_FRAMEWORK,
            temperature: 0.3,
          },
        })
      );

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error translating carousel:", err);
      res.status(500).json({ error: err.message || "Error al traducir carrusel" });
    }
  });

  // 4. PASO B — Director de Arte: Convierte una idea abstracta en UNA ESCENA CONCRETA (máx 25 palabras)
  // con memoria del carrusel completo para evitar repetir sujeto, acción o entorno.
  app.post("/api/build-concrete-scene", async (req, res) => {
    try {
      const {
        imageSuggestion = "",
        brief = "",
        escenasYaUsadas = [],
      } = req.body;

      const escenasList = Array.isArray(escenasYaUsadas) && escenasYaUsadas.length > 0
        ? `Estas son las escenas YA usadas en otras diapositivas de este mismo carrusel — tu escena nueva NO puede repetir el mismo sujeto, la misma acción ni el mismo entorno que ninguna de estas:\n${escenasYaUsadas.map((e: string, idx: number) => `${idx + 1}. ${e}`).join("\n")}`
        : "No hay escenas previas registradas aún para este carrusel.";

      const prompt = `Sos el "Director de Arte" de una agencia de marketing: tu único trabajo es convertir una idea ABSTRACTA de qué imagen poner en UNA ESCENA CONCRETA de una sola frase, en español, de máximo 25 palabras. Rubro/negocio real (ancla siempre a esto, nunca a una interpretación genérica del beneficio): ${brief || "Servicios profesionales"}. ${escenasList}

Una escena concreta tiene SIEMPRE estas 4 partes en la misma frase: (1) un sujeto específico (no "una persona", sí "una vendedora" / "un cliente" / "el dueño del local"), (2) una acción específica y puntual (no "usando el producto", sí "entregando una bolsa en el mostrador"), (3) un entorno específico real de ese rubro (no "un lugar", sí "el mostrador del local" / "la vereda del gimnasio"), y (4) la prueba visual del beneficio (qué se ve en la imagen que demuestra, sin texto, que el beneficio es real).

PROHIBIDO devolver algo abstracto tipo "representa la idea del ahorro" o "mostrar el producto de forma clara". PROHIBIDO usar clichés genéricos de banco de imágenes: apretón de manos de stock, gente sonriendo a cámara sin contexto, oficina con laptop sin relación al rubro, iconos o elementos flotantes. PROHIBIDO repetir el sujeto/acción/entorno de las escenas ya usadas listadas arriba.

IDEA ABSTRACTA O CONTENIDO DE LA DIAPOSITIVA:
"${imageSuggestion || brief || "Profesional trabajando en su rubro"}"

Respondé SOLO con la escena final (una frase, sin comillas, sin explicaciones, sin prefijos tipo "Escena:").`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.5,
          },
        })
      );

      let escena = (response.text || "").trim();
      escena = escena.replace(/^["'«“]|["'»”]$/g, '').replace(/^(Escena:\s*|Scene:\s*)/i, '').trim();

      res.json({ success: true, data: { escenaConcreta: escena } });
    } catch (err: any) {
      console.error("Error building concrete scene:", err);
      res.status(500).json({ error: err.message || "Error al construir escena concreta" });
    }
  });

  // 5. PASO C — Redactor de Prompt Técnico para Gemini / Imagen 3 / Veo / Nano Banana
  // Toma la escena YA concreta resuelta por el Director de Arte y le agrega encuadre, cámara, luz, estilo y aspect ratio.
  app.post("/api/enhance-image-prompt", async (req, res) => {
    try {
      const {
        slide,
        escenaConcreta,
        slideText: rawSlideText,
        slideIndex = 1,
        totalSlides = 5,
        clientInfo,
        brand,
        brief,
        targetAudience,
        visualStyle = "Fotografía profesional con iluminación cinematográfica, paleta de colores moderna y coherente",
        artDirectionMode = "photorealistic",
        isVideo = false,
        aspect = "4:5"
      } = req.body;

      // Extract rich text representation of the slide if slide object was passed
      let compiledSlideContent = rawSlideText || "";
      if (slide) {
        const parts: string[] = [];
        if (slide.badge) parts.push(`[Etiqueta / Badge]: ${slide.badge}`);
        if (slide.subtag) parts.push(`[Subtítulo / Gancho]: ${slide.subtag}`);
        if (slide.title) parts.push(`[Título Principal]: ${slide.title}`);
        if (slide.body) parts.push(`[Cuerpo]: ${slide.body}`);
        if (slide.bullets && slide.bullets.length > 0) parts.push(`[Puntos Clave / Bullets]: ${slide.bullets.join('; ')}`);
        
        // Handle specialized templates
        if (slide.comparison) {
          parts.push(`[Comparativa]: Lado A (${slide.comparison.leftTag || 'Antes'}): ${slide.comparison.leftTitle || ''} - ${slide.comparison.leftText || ''} VS Lado B (${slide.comparison.rightTag || 'Después'}): ${slide.comparison.rightTitle || ''} - ${slide.comparison.rightText || ''}`);
        }
        if (slide.stat) {
          parts.push(`[Estadística / Cifra]: ${slide.stat.statNumber || ''} - ${slide.stat.statLabel || ''} (${slide.stat.statSubtext || ''})`);
        }
        if (slide.quote) {
          parts.push(`[Cita / Testimonio]: "${slide.quote.quoteText || ''}" por ${slide.quote.authorName || ''} (${slide.quote.authorRole || ''})`);
        }
        if (slide.ctaFinal) {
          parts.push(`[Cierre / CTA Final]: ${slide.ctaFinal.headline || ''} - ${slide.ctaFinal.subheadline || ''} | Acción: ${slide.ctaFinal.actionPill || ''}`);
        }
        if (slide.customTexts && slide.customTexts.length > 0) {
          parts.push(`[Capas de texto adicionales]: ${slide.customTexts.map((c: any) => c.text).join(' | ')}`);
        }
        if (slide.cta) parts.push(`[Llamado]: ${slide.cta}`);
        
        compiledSlideContent = parts.join("\n");
      }

      const escenaMandatoria = escenaConcreta || rawSlideText || compiledSlideContent;

      // Compile Client Dossier
      const clientDetails = clientInfo ? `
DATOS DEL CLIENTE / MARCA:
- Nombre: ${clientInfo.name || brand?.name || 'Cliente'}
- Rubro / Industria: ${clientInfo.industry || clientInfo.business_type || 'Servicios Profesionales'}
- Público Objetivo: ${clientInfo.target_audience || targetAudience || 'Clientes potenciales'}
- Propuesta / Oferta: ${Array.isArray(clientInfo.offers) ? clientInfo.offers.join(', ') : clientInfo.offers || 'Servicios especializados'}
- Dolores que resuelve: ${Array.isArray(clientInfo.pain_points) ? clientInfo.pain_points.join(', ') : clientInfo.pain_points || ''}
- Tono de Marca: ${clientInfo.tone || clientInfo.brand_voice || 'Profesional de alto valor'}
` : `
DATOS DE LA MARCA:
- Nombre: ${brand?.name || 'Marca'} | Web: ${brand?.web || ''}
- Público Objetivo: ${targetAudience || 'Profesionales y clientes ideales'}
`;

      const prompt = `
ACTÚA COMO UN REDACTOR TÉCNICO DE PROMPTS Y DIRECTOR DE FOTOGRAFÍA PUBLICITARIA SENIOR (para Gemini, Imagen 3, Veo, Midjourney).
Tu objetivo es tomar una ESCENA CONCRETA ya definida y convertirla en un PROMPT FOTOGRÁFICO/CINEMATOGRÁFICO DE MÁXIMA CALIDAD para la DIAPOSITIVA #${slideIndex} (de un total de ${totalSlides}).

Escena concreta a representar (definida por el Director de Arte a partir de la estrategia del carrusel): ${escenaMandatoria}. Esta es la base obligatoria de la imagen, no la cambies por otra idea.

${clientDetails}

TEMA / BRIEF GENERAL DEL CARRUSEL:
${brief || "Carrusel de marketing estratégico"}

CONTENIDO DE ESTA DIAPOSITIVA #${slideIndex}:
"""
${compiledSlideContent || "Diapositiva del carrusel"}
"""

ROL DE ESTA DIAPOSITIVA EN LA NARRATIVA:
${
  slideIndex === 1
    ? "-> DIAPOSITIVA 1 (GANCHO / DETENER EL SCROLL): Momento de alta tensión, curiosidad, emoción fuerte o duda que frena el scroll."
    : slideIndex === totalSlides
    ? "-> DIAPOSITIVA FINAL (CIERRE / CTA / VICTORIA): Momento de claridad, solución, éxito, confianza, avance y llamado a la acción."
    : "-> DIAPOSITIVA INTERMEDIA (VALOR / CONFLICTO / ANÁLISIS / PROCESO): Ejecución real, contraste, métrica, error o técnica del oficio."
}

ESTILO VISUAL / ATMÓSFERA SOLICITADA:
${visualStyle}
Modo de Dirección de Arte: ${artDirectionMode}
FORMATO: ${aspect} (${isVideo ? "Video en bucle cinematográfico de 4-6 segundos" : "Fotografía realista publicitaria de ultra alta definición"})

REGLAS TÉCNICAS DE GENERACIÓN:
1. Toma la ESCENA CONCRETA obligatoria y amplíala con detalles técnicos de: tipo de lente (ej: 35mm / 50mm f/1.8), encuadre, iluminación (luz natural de ventana, luz cenital, claroscuro), paleta de colores y ambiente fotorrealista.
2. Composición equilibrada para asegurar espacio limpio donde el texto del carrusel superpuesto se lea nítidamente.
3. Evita clichés de stock (no apretones de manos aislados, no personas sonriendo forzadamente a cámara sin contexto).
4. Termina el prompt SIEMPRE con: "sin texto en la imagen, sin tipografías, sin marcas de agua, sin logos superpuestos, estilo fotorrealista premium, iluminación cinematográfica".
5. Provee también 3 a 4 palabras clave en INGLÉS (mediaSearchKeywords) exactas y descriptivas para buscar imágenes reales de stock en Pixabay acordes a esta escena particular.
6. Provee 2 conceptos visuales alternativos breves (uno metafórico/simbólico y uno de acción real).

Devuelve EXCLUSIVAMENTE un JSON con:
{
  "enhancedPrompt": "Prompt maestro completo en español para Gemini / Imagen 3 / Veo...",
  "mediaSearchKeywords": ["specific english keyword 1", "keyword 2", "keyword 3", "keyword 4"],
  "artDirectionNotes": "Explicación de 1-2 frases de cómo la escena representa fielmente el mensaje",
  "alternativeConcepts": [
    {
      "title": "Metáfora Visual / Simbólico",
      "prompt": "Descripción del concepto alternativo 1..."
    },
    {
      "title": "Escena Humana / Acción Real",
      "prompt": "Descripción del concepto alternativo 2..."
    }
  ]
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.65,
          },
        })
      );

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error enhancing image prompt:", err);
      res.status(500).json({ error: err.message || "Error al mejorar prompt" });
    }
  });

  // 5. Enhance All Image Prompts for the Entire Carousel in One Go (Zero Repetition Guarantee)
  app.post("/api/enhance-all-image-prompts", async (req, res) => {
    try {
      const {
        slides = [],
        clientInfo,
        brand,
        brief,
        targetAudience,
        visualStyle = "Fotografía profesional con iluminación cinematográfica, paleta de colores moderna y coherente",
        artDirectionMode = "photorealistic",
        isVideo = false,
        aspect = "4:5",
      } = req.body;

      if (!Array.isArray(slides) || slides.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron diapositivas" });
      }

      const slidesSummary = slides.map((s, i) => {
        const parts: string[] = [];
        if (s.badge) parts.push(`Badge: ${s.badge}`);
        if (s.subtag) parts.push(`Subtag: ${s.subtag}`);
        if (s.title) parts.push(`Título: ${s.title}`);
        if (s.body) parts.push(`Cuerpo: ${s.body}`);
        if (s.bullets && s.bullets.length > 0) parts.push(`Bullets: ${s.bullets.join(', ')}`);
        return `[DIAPOSITIVA #${i + 1} (${i === 0 ? 'Gancho inicial' : i === slides.length - 1 ? 'Cierre/CTA' : 'Desarrollo/Valor'})]:\n${parts.join(' | ')}`;
      }).join("\n\n");

      const clientDetails = clientInfo ? `
CLIENTE / MARCA: ${clientInfo.name || brand?.name || 'Marca'}
RUBRO / INDUSTRIA: ${clientInfo.industry || clientInfo.business_type || 'Servicios Profesionales'}
PÚBLICO: ${clientInfo.target_audience || targetAudience || 'Clientes'}
OFERTA: ${Array.isArray(clientInfo.offers) ? clientInfo.offers.join(', ') : clientInfo.offers || ''}
      ` : `MARCA: ${brand?.name || 'Marca'} | AUDIENCIA: ${targetAudience || 'Profesionales'}`;

      const prompt = `
ACTÚA COMO DIRECTOR DE ARTE FOTOGRÁFICO PUBLICITARIO SENIOR.
Diseña la dirección de arte visual completa para este carrusel de ${slides.length} diapositivas.

¡REGLA FUNDAMENTAL DE ORO!:
¡ESTÁ COMPLETAMENTE PROHIBIDO REPETIR PROMPTS, CONCEPTOS O PALABRAS CLAVE ENTRE DIAPOSITIVAS!
CADA diapositiva DEBE tener una escena visual fotorrealista completamente DISTINTA y PERSONALIZADA según su texto específico:
- Diapositiva 1 (Gancho): Tensión, conflicto, duda, metáfora visual o problema del cliente en su entorno.
- Diapositivas intermedias: Proceso técnico real, personas debatiendo, herramientas del oficio, análisis de métricas o error en acción.
- Diapositiva final: Victoria, solución, éxito, claridad o llamado a la acción.

${clientDetails}
TEMA GENERAL: ${brief || "Carrusel de marketing"}
ESTILO VISUAL: ${visualStyle}
MODO DE DIRECCIÓN: ${artDirectionMode}
FORMATO: ${aspect} (${isVideo ? "Video bucle cinematográfico" : "Fotografía publicitaria de ultra alta definición"})

CONTENIDO DE CADA DIAPOSITIVA:
${slidesSummary}

Devuelve EXCLUSIVAMENTE un JSON con:
{
  "slides": [
    {
      "slideIndex": 1,
      "enhancedPrompt": "Prompt fotográfico cinematográfico completo en español de 2 a 3 frases para Diapositiva 1... sin texto en la imagen, sin marcas de agua, fotorrealismo premium",
      "mediaSearchKeywords": ["english keyword 1", "keyword 2", "keyword 3"],
      "artDirectionNotes": "Por qué esta composición visual representa exactamente el mensaje de la Diapositiva 1"
    }
  ]
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.65,
          },
        })
      );

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error enhancing all prompts:", err);
      res.status(500).json({ error: err.message || "Error al mejorar prompts del carrusel" });
    }
  });

  // Dedicated download route for yt2mp3_server.py
  app.get(["/yt2mp3_server.py", "/api/download-python-script"], (_req, res) => {
    const scriptPath = path.join(process.cwd(), "public", "yt2mp3_server.py");
    res.setHeader("Content-Type", "text/x-python");
    res.setHeader("Content-Disposition", 'attachment; filename="yt2mp3_server.py"');
    res.sendFile(scriptPath);
  });

  // 6. Direct YouTube to MP3 Audio Extraction API
  app.post("/api/convert-youtube-mp3", async (req, res) => {
    try {
      const { url } = req.body || {};
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Falta el enlace de YouTube" });
      }

      const cleanUrl = url.trim();
      if (!ytdl.validateURL(cleanUrl)) {
        return res.status(400).json({ error: "La URL ingresada no es un enlace válido de YouTube." });
      }

      console.log(`[YouTube MP3] Procesando enlace: ${cleanUrl}`);
      const info = await ytdl.getInfo(cleanUrl);
      const rawTitle = info.videoDetails?.title || "youtube_audio";
      const cleanTitle = rawTitle.replace(/[^\w\s-]/gi, "").trim() || "youtube_audio";

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(cleanTitle)}.mp3"`);
      res.setHeader("X-Audio-Title", encodeURIComponent(cleanTitle));

      const audioStream = ytdl(cleanUrl, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
      });

      audioStream.on("error", (streamErr) => {
        console.error("Error en streaming de audio:", streamErr);
        if (!res.headersSent) {
          res.status(500).json({ error: `Error extrayendo audio: ${streamErr.message}` });
        }
      });

      audioStream.pipe(res);
    } catch (err: any) {
      console.error("Error en /api/convert-youtube-mp3:", err);
      res.status(500).json({
        error: err.message || "No se pudo extraer el audio de YouTube desde el servidor en la nube.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
