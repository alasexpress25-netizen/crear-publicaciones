/**
 * Utilidad de comparación liviana en JavaScript puro (sin backend, sin IA)
 * para detectar si dos escenas de diapositivas en el mismo carrusel se parecen demasiado.
 */

const COMMON_STOPWORDS = new Set([
  // Español
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'en', 'con', 'su', 'sus', 'por', 'para',
  'como', 'muy', 'esta', 'este', 'estos', 'estas', 'ese', 'esa',
  'esos', 'esas', 'aquel', 'aquella', 'sin', 'sobre', 'entre',
  'que', 'mas', 'pero', 'o', 'y', 'e', 'ni', 'cual', 'quien',
  'donde', 'cuando', 'ser', 'estar', 'hacer', 'tener', 'todo',
  'toda', 'todos', 'todas', 'otro', 'otra', 'otros', 'otras',
  // Português
  'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
  'em', 'sua', 'seu', 'suas', 'seus', 'um', 'uma', 'uns', 'umas',
  'mais', 'com', 'sem', 'sobre', 'entre', 'para', 'por', 'que'
]);

/**
 * Normaliza y extrae las palabras clave relevantes de una frase de escena.
 * - Minúsculas
 * - Quita tildes/acentos
 * - Quita signos de puntuación / caracteres no alfanuméricos
 * - Ignora palabras <= 3 letras y conectores comunes
 */
export function extractRelevantKeywords(text: string): string[] {
  if (!text) return [];

  // Normalizar: minúsculas, sacar tildes y caracteres especiales
  const clean = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);
  const relevant: string[] = [];

  for (const word of words) {
    if (word.length <= 3) continue;
    if (COMMON_STOPWORDS.has(word)) continue;
    relevant.push(word);
  }

  // Devolver conjunto único
  return Array.from(new Set(relevant));
}

export interface SimilarityCheckResult {
  isTooSimilar: boolean;
  duplicateSlideIndex: number;
  duplicateSlideId?: string | number;
  matchingWords: string[];
  overlapPercentage: number;
  message: string;
}

/**
 * Compara la escena nueva contra cada escena ya guardada de OTRA diapositiva del carrusel actual (nunca contra sí misma).
 * Umbral: si la superposición es >= 50% de las palabras clave relevantes de la escena más corta de las dos.
 */
export function checkSceneSimilarity(
  newScene: string,
  currentSlideKey: string | number,
  allScenesRecord: Record<string | number, string>,
  slidesList?: { id: string | number; _uid?: string }[]
): SimilarityCheckResult | null {
  const newKeywords = extractRelevantKeywords(newScene);
  if (newKeywords.length === 0) return null;

  const newSet = new Set(newKeywords);

  for (const [key, savedScene] of Object.entries(allScenesRecord)) {
    // Nunca comparar contra sí misma
    if (String(key) === String(currentSlideKey)) continue;
    if (!savedScene || typeof savedScene !== 'string') continue;

    const savedKeywords = extractRelevantKeywords(savedScene);
    if (savedKeywords.length === 0) continue;

    // Calcular intersección
    const matchingWords = savedKeywords.filter((w) => newSet.has(w));
    const minLength = Math.min(newKeywords.length, savedKeywords.length);

    if (minLength === 0) continue;

    const overlapRatio = matchingWords.length / minLength;
    const overlapPercentage = Math.round(overlapRatio * 100);

    if (overlapPercentage >= 50) {
      // Determinar número humano de diapositiva
      let slideNumDisplay = 1;
      if (slidesList && slidesList.length > 0) {
        const foundIdx = slidesList.findIndex(
          (s, idx) => String(s.id) === String(key) || String(s._uid) === String(key) || String(idx) === String(key)
        );
        if (foundIdx !== -1) {
          slideNumDisplay = foundIdx + 1;
        } else {
          const parsed = parseInt(key, 10);
          slideNumDisplay = !isNaN(parsed) ? (parsed < 100 ? parsed + 1 : 1) : 1;
        }
      } else {
        const parsed = parseInt(key, 10);
        slideNumDisplay = !isNaN(parsed) ? (parsed < 100 ? parsed + 1 : 1) : 1;
      }

      return {
        isTooSimilar: true,
        duplicateSlideIndex: slideNumDisplay,
        duplicateSlideId: key,
        matchingWords,
        overlapPercentage,
        message: `⚠️ Esta escena se parece mucho a la diapositiva #${slideNumDisplay} (${overlapPercentage}% de coincidencia en: "${matchingWords.join(', ')}")`,
      };
    }
  }

  return null;
}
