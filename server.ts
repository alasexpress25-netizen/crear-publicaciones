import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClients: GoogleGenAI[] = [];
let currentKeyIndex = 0;

function getAI(): GoogleGenAI {
  if (aiClients.length === 0) {
    const rawKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_BACKUP,
    ].filter(Boolean) as string[];

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
- Resaltar ideas clave: Títulos contundentes, subtítulos que despiertan curiosidad y llamadas a la acción naturales.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Analyze Marketing Sources (Website URL or Raw Copy)
  app.post("/api/analyze-marketing-source", async (req, res) => {
    try {
      const { url, rawText, documentName } = req.body;

      let contextToAnalyze = rawText || "";
      if (url && !rawText) {
        try {
          const fetchRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (fetchRes.ok) {
            const html = await fetchRes.text();
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
Devuelve un JSON con:
{
  "businessSummary": "Resumen claro del negocio y propuesta de valor (2-3 líneas)",
  "targetAudience": "A quién se dirige y qué nivel de consciencia tienen",
  "painPoints": ["Dolor o frustración 1", "Dolor 2", "Dolor 3", "Dolor 4"],
  "commonMistakes": ["Error común que comete el cliente ideal 1", "Error 2", "Error 3"],
  "uniqueAngles": ["Ángulo diferenciador o propuesta única 1", "Ángulo 2", "Ángulo 3"],
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
        brand = { name: "LA VISUAL MK", web: "lavisualmk.com" },
        language = "es"
      } = req.body;

      const prompt = `
CREAR UN CARRUSEL DE REDES SOCIALES ESTRATÉGICO DE EXACTAMENTE ${slideCount} DIAPOSITIVAS.

DATOS DEL NEGOCIO / BRIEF:
${brief}

AUDIENCIA OBJETIVO:
${targetAudience || "Clientes potenciales que buscan solucionar un problema real"}

DOCUMENTOS / CONOCIMIENTO DE MARKETING AGREGADO:
${knowledgeBase || "Sin documentos adicionales"}

PARÁMETROS DEL POST:
- Objetivo principal: ${objective}
- Tipo de gancho para Slide 1: ${hookType}
- Idioma de redacción: ${language === "pt" ? "Portugués (pt-BR)" : "Español (es)"}
- Marca / Firma: "${brand?.name || 'LA VISUAL MK'}" (Web/Usuario: "${brand?.web || 'lavisualmk.com'}")

ESTRUCTURA OBLIGATORIA DE CADA DIAPOSITIVA:
1. DIAPOSITIVA 1 (EL GANCHO SCROLL-STOPPER):
   - Tipo de gancho: "${hookType}".
   - "badge": Etiqueta superior corta y llamativa en MAYÚSCULAS (ej: "ERROR #1", "NO HAGAS ESTO", "SECRETO DE AGENCIA", "CASO REAL").
   - "subtag": Frase de entrada intrigante (ej: "El problema casi nunca es el precio...", "Si tu servicio es bueno pero nadie te compra...").
   - "title": FRASE DE ALTO IMPACTO (8-14 palabras).
   - "cta": Micro-llamada al pie para deslizar (ej: "Desliza para entender por qué 👉", "Pasa a la siguiente si te pasa esto ➡️").
2. DIAPOSITIVAS INTERMEDIAS (2 a ${slideCount - 1}):
   - Un solo punto de aprendizaje por diapositiva. No sobrecargar.
   - "badge": "PASO 01", "EL ERROR", "LA VERDAD", etc.
   - "title": Idea central o revelación directa.
   - "body": Explicación masticable de 1 a 2 oraciones.
   - Si corresponde, usar "bullets" con 2 a 3 puntos concisos.
3. DIAPOSITIVA FINAL (EL CIERRE / CTA):
   - Llamado a la acción inequívoco y natural para ${objective}.
4. DIRECTOR DE MEDIOS & FONDOS VISUALES (STOCK & IA):
   - Para CADA diapositiva, provee "mediaSearchKeywords": lista de 2 a 3 palabras clave EN INGLÉS ultra-precisas para buscar fondos fotográficos de stock en Pixabay (ej: ["luxury office", "confident executive", "dark workspace"]).
   - "imageSuggestion": Prompt detallado en español para dirección de arte.
5. POST CAPTION & HASHTAGS:
   - Redactar el texto completo para el pie de foto de Instagram/LinkedIn con gancho de lectura, espaciado elegante y llamada a la acción.
   - Lista de 5-10 hashtags ultra-específicos del nicho (sin el #, en minúsculas).

FORMATO JSON ESTRICTO:
{
  "slides": [
    {
      "slideNumber": 1,
      "badge": "ERROR CRÍTICO",
      "subtag": "Lo que casi nadie te dice sobre...",
      "title": "EL TÍTULO DE IMPACTO EN MAYÚSCULAS",
      "body": "Cuerpo de 1 frase concisa o vacío si el título es autosuficiente",
      "cta": "Desliza para ver la verdad 👉",
      "bullets": [],
      "imageSuggestion": "Descripción concreta de la escena visual/foto profesional para esta diapositiva",
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
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error generating carousel:", err);
      res.status(500).json({ error: err.message || "Error al generar carrusel" });
    }
  });

  // 3. Generate 5-6 Scroll-Stopping Hook Variations for Slide 1
  app.post("/api/generate-hooks", async (req, res) => {
    try {
      const { brief, targetAudience, knowledgeBase, language = "es" } = req.body;

      const prompt = `
Genera 6 ganchos psicológicos alternativos de alto impacto para la DIAPOSITIVA 1 de un carrusel de redes sociales.
Todos deben frenar el scroll instantáneamente, evitando frases genéricas.

BRIEF DEL NEGOCIO:
${brief}

AUDIENCIA / CONTEXTO:
${targetAudience || ""}
${knowledgeBase || ""}

IDIOMA: ${language === "pt" ? "Portugués (pt-BR)" : "Español (es)"}

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

  // 4. Enhance Image/Video Prompt with Art Director
  app.post("/api/enhance-image-prompt", async (req, res) => {
    try {
      const { slideText, brief, visualStyle, isVideo, aspect = "4:5" } = req.body;

      const prompt = `
Actúa como Director de Arte Publicitario.
Convierte los siguientes textos de una diapositiva en un PROMPT FOTOGRÁFICO REALISTA O DE VIDEO para generar la imagen de fondo perfecta.

TEXTO DE LA DIAPOSITIVA:
${slideText}

NEGOCIO / RUBRO:
${brief || "Negocio profesional"}

ESTILO VISUAL / ILUMINACIÓN SOLICITADO:
${visualStyle || "Fotografía profesional con iluminación cinematográfica, paleta de colores moderna y coherente"}

FORMATO: ${aspect} (${isVideo ? "Video en bucle de 4-6 segundos" : "Fotografía realista de alta definición"})

REGLAS:
- Describe una escena humana, auténtica y con significado real (NO un cliché genérico ni un apretón de manos de stock).
- Encuadre, ángulo de cámara, iluminación, paleta cromática y atmósfera.
- Terminar SIEMPRE con: "sin texto en la imagen, sin marcas de agua, sin logos, sin deformaciones anatómicas, estilo fotorrealista premium".

Devuelve JSON:
{
  "enhancedPrompt": "Texto completo del prompt en español listo para copiar o generar...",
  "artDirectionNotes": "Breve nota de por qué esta composición complementa el mensaje del texto"
}
`;

      const response = await executeWithFallback((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.6,
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
