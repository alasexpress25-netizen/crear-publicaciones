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

// Executes an AI call with automatic failover to backup keys if rate limit or quota is exceeded
async function executeWithFallback<T>(fn: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  const total = Math.max(1, aiClients.length);
  let lastError: any = null;

  for (let attempt = 0; attempt < total; attempt++) {
    const ai = getAI();
    try {
      return await fn(ai);
    } catch (err: any) {
      lastError = err;
      const isRateOrAuthError = 
        err?.status === 429 || 
        err?.message?.includes("429") || 
        err?.message?.includes("quota") || 
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.status === 403 ||
        err?.message?.includes("API_KEY_INVALID");

      if (isRateOrAuthError && aiClients.length > 1) {
        console.warn(`[Gemini Fallback] Key #${currentKeyIndex + 1} exhausted or failed (${err?.message || 'Error'}). Switching to backup key...`);
        currentKeyIndex = (currentKeyIndex + 1) % aiClients.length;
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// Built-in marketing expert knowledge base injected into system prompts
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

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Analyze Marketing Sources / URL / Documents to extract audience pain points and positioning
  app.post("/api/analyze-marketing-source", async (req, res) => {
    try {
      const { url, rawText, documentName } = req.body;

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

      const response = await executeWithFallback(ai =>
        ai.models.generateContent({
          model: "gemini-3.7-flash",
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

  // Generate Full Strategic Carousel with Structured JSON
  app.post("/api/generate-carousel", async (req, res) => {
    try {
      const {
        brief,
        targetAudience,
        visualStyle = "Modern Minimalist",
        slideCount = 5,
        brandName = "Marca",
        brandHandle = "@marca",
        objective = "Retención y Guardados",
        hookType = "Pain Point / Contrarian",
        knowledgeBase = [],
        clientContext = "",
        language = "es"
      } = req.body;

      const prompt = `
CREAR UN CARRUSEL DE REDES SOCIALES ESTRATÉGICO DE EXACTAMENTE ${slideCount} DIAPOSITIVAS.

TEMA / BRIEF: "${brief}"
AUDIENCIA OBJETIVO: "${targetAudience || 'Emprendedores, profesionales y creadores'}"
ESTILO VISUAL: "${visualStyle}"
OBJETIVO DEL POST: "${objective}"
TIPO DE GANCHO DESEADO: "${hookType}"
NOMBRE DE MARCA: "${brandName}" (${brandHandle})
IDIOMA: "${language}"

${clientContext ? `CONTEXTO DEL CLIENTE / AGENCIA:\n${clientContext}\n` : ""}
${knowledgeBase && knowledgeBase.length > 0 ? `BASE DE CONOCIMIENTO EXTRAÍDA:\n${JSON.stringify(knowledgeBase)}\n` : ""}

REGLAS DE COPYWRITING PARA CADA DIAPOSITIVA:
1. Diapositiva 1 (Gancho): Título potente de máximo 6-8 palabras. Subtítulo que genere intriga. Tagline o Badge superior (ej: "ESTRATEGIA 2025" o "ERROR #1"). Micro-texto inferior: "Desliza 👉".
2. Diapositivas 2 a ${slideCount - 1} (Desarrollo): Cada diapositiva enseña UN SOLO concepto o paso claro. Texto principal conciso (15-20 palabras max) con palabras clave resaltadas.
3. Diapositiva ${slideCount} (Cierre & CTA): Título memorable de conclusión + Llamado a la acción enfocado en guardar o compartir.

FORMATO DE SALIDA (JSON ÚNICAMENTE):
{
  "slides": [
    {
      "slideNumber": 1,
      "tagline": "MICRO-BADGE SUPERIOR (ej: ERROR CRÍTICO)",
      "title": "Título del Gancho en 5 a 8 palabras",
      "body": "Subtítulo intrigante o problema que retenga al usuario.",
      "footer": "Desliza para ver la solución 👉",
      "imagePrompt": "Descripción concisa en inglés para buscar una imagen de stock o fondo limpio acorde al tema",
      "suggestedLayout": "title-body"
    }
  ],
  "postCaption": {
    "hook": "Gancho de 1 línea para el feed de Instagram/LinkedIn",
    "body": "Texto del post desglosado con viñetas y emojis estratégicos (máximo 3 párrafos)",
    "cta": "Llamado a la acción para comentar o guardar",
    "hashtags": ["#estrategiadigital", "#marketingdecontenidos", "#creadordecontenido", "#crecimiento"]
  }
}
`;

      const response = await executeWithFallback(ai =>
        ai.models.generateContent({
          model: "gemini-3.7-flash",
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

  // Generate Alternative Hooks (Hook Optimizer)
  app.post("/api/generate-hooks", async (req, res) => {
    try {
      const { brief, targetAudience, knowledgeBase, language = "es" } = req.body;

      const prompt = `
Genera 6 ganchos psicológicos alternativos de alto impacto para la DIAPOSITIVA 1 de un carrusel de redes sociales.
TEMA: "${brief}"
AUDIENCIA: "${targetAudience || 'General'}"
IDIOMA: "${language}"

Debes generar 1 gancho para cada uno de estos 6 tipos psicológicos:
1. "Pain Point / Dolor Agudo"
2. "Contrarian / Contra-intuitivo" (Cuestionar una creencia común)
3. "Error Costoso" (Lo que están haciendo mal sin saberlo)
4. "Pregunta Reveladora" (Despertar curiosidad instantánea)
5. "Transformación / Caso de Estudio" (Antes vs Después)
6. "Estructura Paso a Paso / Cheatsheet" (Guía accionable rápida)

Responde estrictamente en formato JSON:
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

      const response = await executeWithFallback(ai =>
        ai.models.generateContent({
          model: "gemini-3.7-flash",
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

  // Enhance Background Visual Prompt
  app.post("/api/enhance-image-prompt", async (req, res) => {
    try {
      const { slideText, brief, visualStyle, isVideo, aspect = "4:5" } = req.body;

      const prompt = `
Actúa como Director de Arte Publicitario.
Genera un prompt en INGLÉS altamente detallado y estético para generar una ${isVideo ? 'animación de fondo de video sutil en bucle' : 'fotografía/fondo visual de stock limpio'} para una diapositiva de carrusel en redes sociales.

CONTEXTO DE LA DIAPOSITIVA:
"${slideText}"
TEMA GENERAL: "${brief}"
ESTILO DESEADO: "${visualStyle}"
FORMATO: "${aspect}"

REGLAS DE DIRECCIÓN DE ARTE:
- Debe tener espacio negativo o baja saturación para permitir texto legible encima.
- Sin tipografía generada dentro de la imagen ni personas deformadas.
- Enfoque limpio, moderno, con iluminación cinemática y paleta armoniosa.

Responde estrictamente en JSON:
{
  "imagePrompt": "Prompt detallado en inglés para Gemini/Imagen/Pixabay",
  "searchKeywords": ["palabra_clave_1", "palabra_clave_2", "palabra_clave_3"]
}
`;

      const response = await executeWithFallback(ai =>
        ai.models.generateContent({
          model: "gemini-3.7-flash",
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

  // Vite middleware for development vs static build for production
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
