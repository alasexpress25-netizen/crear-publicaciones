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

// Model fallback chain if a model experiences 503 / High Demand
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

// Executes an AI call with automatic failover across models AND backup keys
async function executeWithFallback<T>(fn: (ai: GoogleGenAI, modelName: string) => Promise<T>): Promise<T> {
  const totalKeys = Math.max(1, aiClients.length);
  let lastError: any = null;

  for (let modelIdx = 0; modelIdx < FALLBACK_MODELS.length; modelIdx++) {
    const currentModel = FALLBACK_MODELS[modelIdx];

    for (let keyAttempt = 0; keyAttempt < totalKeys; keyAttempt++) {
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

        const isHighDemandOrUnavailable =
          err?.status === 503 ||
          errStr.includes("503") ||
          errStr.includes("high demand") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("overloaded");

        if (isRateOrAuthError && aiClients.length > 1) {
          console.warn(`[Gemini Key Failover] Key #${currentKeyIndex + 1} exhausted. Switching to next key...`);
          currentKeyIndex = (currentKeyIndex + 1) % aiClients.length;
          continue;
        }

        if (isHighDemandOrUnavailable) {
          console.warn(`[Gemini Model Failover] Model ${currentModel} returned 503 High Demand. Switching to alternative model...`);
          break; // Try next model in chain
        }

        if (keyAttempt < totalKeys - 1) {
          currentKeyIndex = (currentKeyIndex + 1) % aiClients.length;
          continue;
        }
      }
    }
  }

  throw lastError;
}

const MARKETING_PSYCHOLOGY_FRAMEWORK = `
Eres un Director Creativo Senior y Estratega de Contenido para Redes Sociales de Élite con más de 12 años de experiencia creando carruseles virales de alta retención para Instagram y LinkedIn.
Tus principios fundamentales son:
1. PSICOLOGÍA DEL SCROLL STOPPING: La primera diapositiva (gancho) debe romper el patrón visual y mental en menos de 1.5 segundos.
2. NARRATIVA DE RETENCIÓN (LOOP DE CURIOSIDAD): Cada diapositiva debe terminar con una micro-tensión o conexión que obligue al usuario a deslizar a la siguiente.
3. CONCISIÓN RADICAL: Menos texto, mayor impacto tipográfico. Máximo 15-25 palabras por diapositiva. Usa contrastes de palabras clave en negrita/color.
4. ESTRUCTURA PROBADA:
   - Diapositiva 1: Gancho de Alto Impacto (Problema doloroso, Error común, Contrarian, o Pregunta reveladora).
   - Diapositivas Intermedias: Desarrollo paso a paso o contraste con valor accionable y masticable.
   - Penúltima Diapositiva: Clímax o Resumen revelador.
   - Última Diapositiva: Llamado a la Acción (CTA) claro y específico (Guardar, Compartir, Comentar).
5. INDICADORES VISUALES DE NAVEGACIÓN: Añadir micro-textos como "Desliza 👉", "Paso 2/5", "Guarda este post 📌".
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/analyze-marketing-source", async (req, res) => {
    try {
      const { url, rawText } = req.body;
      let contextToAnalyze = rawText || "";
      if (url && !rawText) {
        contextToAnalyze = `Enlace/Web del cliente: ${url}`;
      }

      const prompt = `
Analiza la siguiente información de marca/cliente y extrae una base de conocimiento estratégica para crear contenido de redes sociales de alto impacto:

CONTENIDO A ANALIZAR:
"""
${contextToAnalyze}
"""

Responde estrictamente en formato JSON con la siguiente estructura:
{
  "summary": "Resumen ejecutivo de 2 oraciones sobre la propuesta de valor",
  "targetAudience": "Descripción detallada del avatar/cliente ideal con sus frustraciones y deseos",
  "painPoints": ["Dolor o frustración 1", "Dolor 2", "Dolor 3", "Dolor 4"],
  "contentPillars": ["Pilar de contenido 1", "Pilar 2", "Pilar 3"],
  "recommendedHooks": [
    "Gancho 1 estilo problema",
    "Gancho 2 estilo error común",
    "Gancho 3 estilo pregunta contraria",
    "Gancho 4 estilo historia personal",
    "Gancho 5 estilo checklist o paso a paso"
  ],
  "brandVoice": "Tono y voz de la marca (ej: Autoridad cercana, Disruptivo y directo, Empático y técnico)"
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
    } catch (error: any) {
      console.error("Error analyzing source:", error);
      res.status(500).json({ error: error.message || "Error analyzing marketing source" });
    }
  });

  app.post("/api/generate-carousel", async (req, res) => {
    try {
      const {
        brief,
        targetAudience,
        visualStyle = "Modern Minimalist",
        slideCount = 4,
        brandName = "Marca",
        brandHandle = "@marca",
        objective = "Vender / Conseguir Clientes",
        hookType = "Pregunta Reflexiva",
        knowledgeBase = [],
        clientContext = "",
        language = "es"
      } = req.body;

      const prompt = `
CREAR UN CARRUSEL DE REDES SOCIALES ESTRATÉGICO DE EXACTAMENTE ${slideCount} DIAPOSITIVAS.

TEMA / BRIEF: "${brief}"
AUDIENCIA OBJETIVO: "${targetAudience || 'Dueños de negocios y emprendedores'}"
ESTILO VISUAL: "${visualStyle}"
OBJETIVO DEL POST: "${objective}"
TIPO DE GANCHO: "${hookType}"
NOMBRE DE MARCA: "${brandName}" (${brandHandle})
IDIOMA: "${language}"

${clientContext ? `CONTEXTO DEL CLIENTE:\n${clientContext}\n` : ""}
${knowledgeBase && knowledgeBase.length > 0 ? `BASE DE CONOCIMIENTO:\n${JSON.stringify(knowledgeBase)}\n` : ""}

REGLAS ESTRUCTURALES:
1. DIAPOSITIVA 1 (GANCHO DE ALTO IMPACTO):
   - Título rotundo de 5 a 8 palabras. Subtítulo que genere tensión o intriga.
   - Badge superior (ej: "ESTRATEGIA 2025" o "ERROR CRÍTICO"). Micro-texto inferior: "Desliza 👉".
2. DIAPOSITIVAS 2 A ${slideCount - 1} (VALOR ACCIONABLE):
   - 1 solo concepto por diapositiva con texto conciso (15-20 palabras max).
3. DIAPOSITIVA ${slideCount} (CIERRE & CTA):
   - Conclusión memorable + Llamado a la acción específico para ${objective}.
4. DIRECTOR DE MEDIOS (STOCK FOTOGRÁFICO):
   - Provee "mediaSearchKeywords": lista de 2 a 3 palabras clave EN INGLÉS ultra-precisas para buscar fondos fotográficos de stock en Pixabay (ej: ["luxury office", "confident executive", "dark workspace"]).
   - "imageSuggestion": Prompt detallado en español para dirección de arte.
5. POST CAPTION & HASHTAGS:
   - Copywriting completo para el feed de Instagram/LinkedIn con gancho de lectura y llamada a la acción.
   - Lista de 5-10 hashtags ultra-específicos (sin el #, en minúsculas).

FORMATO JSON OBLIGATORIO:
{
  "slides": [
    {
      "slideNumber": 1,
      "badge": "ERROR CRÍTICO",
      "title": "Título del Gancho en 5 a 8 palabras",
      "body": "Subtítulo intrigante o problema que retenga al usuario.",
      "cta": "Desliza para ver la verdad 👉",
      "bullets": [],
      "imageSuggestion": "Descripción concreta de la escena visual/foto profesional",
      "mediaSearchKeywords": ["dark office", "businessman thinking", "cinematic lighting"]
    }
  ],
  "post": {
    "caption": "Texto completo del post...",
    "hashtags": ["marketingdigital", "negocios", "ventas"]
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
    } catch (error: any) {
      console.error("Error generating carousel:", error);
      res.status(500).json({ error: error.message || "Error generating carousel with Gemini" });
    }
  });

  app.post("/api/generate-hooks", async (req, res) => {
    try {
      const { brief, targetAudience, language = "es" } = req.body;

      const prompt = `
Genera 6 ganchos psicológicos alternativos para la Diapositiva 1 de un carrusel de redes sociales.
TEMA: "${brief}"
AUDIENCIA: "${targetAudience || 'General'}"
IDIOMA: "${language}"

Genera 1 gancho para cada tipo:
1. "Pain Point / Dolor Agudo"
2. "Contrarian / Contra-intuitivo"
3. "Error Costoso"
4. "Pregunta Reveladora"
5. "Transformación / Caso de Estudio"
6. "Paso a Paso / Cheatsheet"

Responde en formato JSON:
{
  "hooks": [
    {
      "type": "Pain Point",
      "tagline": "BADGE SUPERIOR",
      "title": "Título gancho de 6 a 9 palabras",
      "body": "Subtítulo complementario",
      "rationale": "Por qué funciona este gancho psicológicamente"
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
    } catch (error: any) {
      console.error("Error generating hooks:", error);
      res.status(500).json({ error: error.message || "Error generating hooks" });
    }
  });

  app.post("/api/enhance-image-prompt", async (req, res) => {
    try {
      const { slideText, brief, visualStyle, isVideo, aspect = "4:5" } = req.body;

      const prompt = `
Actúa como Director de Arte Publicitario.
Genera un prompt en INGLÉS para generar una ${isVideo ? 'animación de fondo de video sutil en bucle' : 'fotografía/fondo visual de stock limpio'} para un carrusel.
CONTEXTO: "${slideText}" | TEMA: "${brief}" | ESTILO: "${visualStyle}" | FORMATO: "${aspect}"

Responde en JSON:
{
  "imagePrompt": "Prompt detallado en inglés para stock o IA",
  "searchKeywords": ["keyword1", "keyword2", "keyword3"]
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
    } catch (error: any) {
      console.error("Error enhancing image prompt:", error);
      res.status(500).json({ error: error.message || "Error enhancing prompt" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Carousel Marketing Suite running on http://localhost:${PORT}`);
  });
}

startServer();
