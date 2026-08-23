import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Agency Supabase configuration
export const DEFAULT_SUPABASE_URL = 'https://redaqqxoeciycqgjhpbv.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_XYeljNeSm2awnovoTvzXiQ_va4cFyvU';

export const LOCAL_STORAGE_SUPABASE_URL = 'lavisualmk_supabase_url';
export const LOCAL_STORAGE_SUPABASE_KEY = 'lavisualmk_supabase_key';
export const LOCAL_STORAGE_SUPABASE_TABLE = 'lavisualmk_supabase_table';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; key: string; table: string } {
  try {
    const url = localStorage.getItem(LOCAL_STORAGE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    const key = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY) || DEFAULT_SUPABASE_ANON_KEY;
    const table = localStorage.getItem(LOCAL_STORAGE_SUPABASE_TABLE) || 'socialbot_clients';
    return { url: url.trim(), key: key.trim(), table: table.trim() };
  } catch {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY, table: 'socialbot_clients' };
  }
}

export function saveSupabaseConfig(url: string, key: string, table?: string) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL, url.trim());
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, key.trim());
    if (table) localStorage.setItem(LOCAL_STORAGE_SUPABASE_TABLE, table.trim());
    supabaseInstance = null; // reset client to re-init
  } catch (err) {
    console.error('Error saving Supabase config', err);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  try {
    const { url, key } = getSupabaseConfig();
    if (!url || !key || !url.startsWith('http')) {
      return null;
    }
    if (!supabaseInstance) {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false },
      });
    }
    return supabaseInstance;
  } catch (err) {
    console.warn('Error creating Supabase client instance:', err);
    return null;
  }
}

export interface AgencyClient {
  id: string;
  name: string;
  business_type?: string;
  industry?: string;
  target_audience?: string;
  brand_voice?: string;
  instagram_handle?: string;
  website?: string;
  brand_color?: string;
  secondary_color?: string;
  logo_url?: string;
  language?: 'es' | 'pt' | 'en';
  tone?: string;
  mission?: string;
  pain_points?: string[];
  offers?: string[];
  knowledge_base?: string;
  technical_terms?: string[];
  topics?: string[];
  created_at?: string;
  raw_data?: any;
}

export interface ClientEditorContext {
  client: AgencyClient;
  topics?: string[];
  recent_posts?: any[];
  knowledge_base?: string;
  brand_guidelines?: any;
  style?: any;
}

/**
 * Diagnostic function to test live Supabase connection with aggressive timeout
 */
export async function testSupabaseConnection(urlInput?: string, keyInput?: string, customTable?: string): Promise<{
  success: boolean;
  message: string;
  tableUsed?: string;
  count?: number;
  sampleClients?: AgencyClient[];
}> {
  try {
    const { url: storedUrl, key: storedKey, table: storedTable } = getSupabaseConfig();
    const url = (urlInput || storedUrl || '').trim();
    const key = (keyInput || storedKey || '').trim();
    const targetTable = (customTable || storedTable || 'socialbot_clients').trim();

    if (!url || !key || !url.startsWith('http')) {
      return { success: false, message: 'Falta la URL (debe iniciar con https://) o la Anon Key de Supabase.' };
    }

    let testClient: SupabaseClient;
    try {
      testClient = createClient(url, key, { auth: { persistSession: false } });
    } catch (e: any) {
      return { success: false, message: `Error al inicializar cliente: ${e.message || String(e)}` };
    }

    const candidateTables = Array.from(new Set([
      targetTable,
      'socialbot_clients',
      'clients',
      'clientes',
      'agency_clients',
      'profiles',
      'users'
    ].filter(Boolean)));

    for (const table of candidateTables) {
      try {
        const queryPromise = testClient.from(table).select('*').limit(10);
        const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout de 4 segundos')), 4000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
        if (!error && Array.isArray(data)) {
          const normalized = normalizeClients(data);
          return {
            success: true,
            message: `¡Conexión exitosa! Se leyeron ${data.length} registros en la tabla "${table}".`,
            tableUsed: table,
            count: data.length,
            sampleClients: normalized,
          };
        }
      } catch (e) {
        // try next
      }
    }

    // Try RPC
    try {
      const rpcPromise = testClient.rpc('list_socialbot_clients_for_editor');
      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de 4 segundos')), 4000)
      );
      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
      if (!error && Array.isArray(data)) {
        return {
          success: true,
          message: `¡Conexión exitosa mediante RPC list_socialbot_clients_for_editor! Se leyeron ${data.length} clientes.`,
          tableUsed: 'RPC list_socialbot_clients_for_editor',
          count: data.length,
          sampleClients: normalizeClients(data),
        };
      }
    } catch (e) {}

    return {
      success: false,
      message: 'No se pudo leer ninguna tabla de clientes. Verifica el nombre de la tabla o las políticas RLS en Supabase.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error de conexión: ${err.message || String(err)}`,
    };
  }
}

/**
 * Fetch list of clients from Supabase with safe timeouts and robust fallbacks
 */
export async function fetchAgencyClients(): Promise<AgencyClient[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return getFallbackAgencyClients();
  }

  // 1. Try RPC function 'list_socialbot_clients_for_editor' (max 2.5s)
  try {
    const rpcPromise = supabase.rpc('list_socialbot_clients_for_editor');
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('RPC timeout')), 2500)
    );
    const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);
    if (!error && Array.isArray(data) && data.length > 0) {
      return normalizeClients(data);
    }
  } catch (err) {
    // continue to table
  }

  // 2. Try configured table or 'socialbot_clients' (max 2.5s)
  const { table: customTable } = getSupabaseConfig();
  const tablesToTry = Array.from(new Set([customTable, 'socialbot_clients', 'clients', 'agency_clients'].filter(Boolean)));

  for (const tableName of tablesToTry) {
    try {
      const tablePromise = supabase.from(tableName).select('*').order('name', { ascending: true }).limit(50);
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Table query timeout')), 2500)
      );
      const { data, error } = await Promise.race([tablePromise, timeoutPromise]);
      if (!error && Array.isArray(data) && data.length > 0) {
        return normalizeClients(data);
      }
    } catch (err) {
      // try next table
    }
  }

  // Return curated fallback agency clients if database is unreachable or empty
  return getFallbackAgencyClients();
}

/**
 * Fetch detailed context for a specific client safely
 */
export async function fetchClientContext(clientId: string): Promise<ClientEditorContext | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !clientId) return null;

  try {
    const rpcPromise = supabase.rpc('get_impacto_editor_context', { client_id: clientId });
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('Context timeout')), 2000)
    );
    const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);
    if (!error && data) {
      return data as ClientEditorContext;
    }
  } catch (err) {
    // continue to fallback
  }

  try {
    const { table: customTable } = getSupabaseConfig();
    const queryPromise = supabase.from(customTable || 'socialbot_clients').select('*').eq('id', clientId).maybeSingle();
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('Client fetch timeout')), 2000)
    );
    const { data } = await Promise.race([queryPromise, timeoutPromise]);
    if (data) {
      const normalized = normalizeClient(data);
      return {
        client: normalized,
        knowledge_base: normalized.knowledge_base,
        topics: normalized.topics || [],
      };
    }
  } catch (err) {
    console.warn('Failed fallback fetch for client', clientId);
  }

  return null;
}

export function normalizeClients(list: any[]): AgencyClient[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeClient).filter(Boolean);
}

export function normalizeClient(item: any): AgencyClient {
  if (!item || typeof item !== 'object') {
    return {
      id: `client-${Math.random().toString(36).substring(2, 9)}`,
      name: 'Cliente sin nombre',
      topics: [],
      pain_points: [],
      offers: [],
    };
  }

  const raw = item.raw_data && typeof item.raw_data === 'object' ? item.raw_data : item;

  // Safe string array converter
  const toStringArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v || '').trim()).filter(Boolean);
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.map((v) => String(v || '').trim()).filter(Boolean);
      } catch {}
      return val.split(/[\n,;]+/).map((v) => v.trim()).filter(Boolean);
    }
    return [];
  };

  const safeString = (val: any, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    return String(val).trim();
  };

  const name = safeString(item.name || item.client_name || item.brand_name || raw.name || raw.client_name, 'Cliente');
  const id = safeString(item.id || raw.id, `client-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`);

  return {
    id,
    name,
    business_type: safeString(item.business_type || item.niche || item.rubro || item.industry || raw.business_type, 'Servicios Profesionales'),
    industry: safeString(item.industry || item.rubro || item.niche || raw.industry, 'Marketing & Negocios'),
    target_audience: safeString(item.target_audience || item.audience || item.ideal_customer || raw.target_audience, 'Dueños de negocios y clientes calificados'),
    brand_voice: safeString(item.brand_voice || item.tone || raw.brand_voice, 'Profesional, persuasivo y directo'),
    instagram_handle: safeString(item.instagram_handle || item.instagram || item.handle || raw.instagram_handle, '').replace(/^@/, ''),
    website: safeString(item.website || item.web || item.url || raw.website, '').replace(/^https?:\/\//, ''),
    brand_color: safeString(item.brand_color || item.primary_color || item.color || raw.brand_color, '#e11d48'),
    secondary_color: safeString(item.secondary_color || raw.secondary_color, '#0f172a'),
    logo_url: safeString(item.logo_url || item.logo || raw.logo_url, ''),
    language: (['es', 'pt', 'en'].includes(item.language || item.lang || raw.language || raw.lang) ? (item.language || item.lang || raw.language || raw.lang) : 'es') as 'es' | 'pt' | 'en',
    tone: safeString(item.tone || item.brand_voice || raw.tone, 'Estratégico y cercano'),
    mission: safeString(item.mission || item.description || raw.mission, ''),
    pain_points: toStringArray(item.pain_points || item.pains || raw.pain_points),
    offers: toStringArray(item.offers || item.services || item.products || raw.offers),
    knowledge_base: safeString(item.knowledge_base || item.context || item.notes || raw.knowledge_base, ''),
    topics: toStringArray(item.topics || item.suggested_topics || raw.topics || [
      `¿Por qué tu servicio es excelente pero tus ventas no despegan?`,
      `Los 3 errores más comunes en tu sector`,
      `Cómo conseguir clientes calificados paso a paso`
    ]),
    created_at: safeString(item.created_at || raw.created_at, new Date().toISOString()),
    raw_data: item,
  };
}

export function getFallbackAgencyClients(): AgencyClient[] {
  return [
    {
      id: 'client-lavisualmk',
      name: 'La Visual MK',
      business_type: 'Agencia de Marketing Digital & Producción',
      industry: 'Marketing Digital & Content',
      target_audience: 'Dueños de negocios, emprendedores y profesionales que quieren vender más por redes con carruseles y anuncios',
      brand_voice: 'Estratégico, persuasivo, directo y de alto impacto',
      instagram_handle: 'lavisualmk',
      website: 'lavisualmk.com',
      brand_color: '#e11d48',
      logo_url: '',
      knowledge_base: 'Especialistas en embudos de ventas, carruseles de alta conversión, copywriting de respuesta directa y anuncios en Meta Ads. Transformamos seguidores pasivos en clientes que compran.',
      technical_terms: ['Pixel de Meta', 'Landing Page', 'CTR', 'ROAS', 'CPA', 'SEO On-Page', 'Retargeting', 'Lead Magnet', 'Tasa de Conversión', 'Inbound'],
      topics: [
        '¿Por qué tu servicio es excelente pero tus ventas no despegan?',
        'Los 3 errores que comete el 90% al publicar en Instagram',
        'Cómo conseguir clientes calificados sin depender de la suerte ni bailar en reels',
        'La anatomía del carrusel que genera consultas todos los días'
      ],
      pain_points: ['Poco alcance orgánico', 'Publicaciones sin conversión', 'Falta de tiempo para crear contenido de valor'],
      offers: ['Gestión integral de redes', 'Producción de carruseles de impacto', 'Campañas de Meta Ads'],
    },
    {
      id: 'client-dentist-pro',
      name: 'Clínica Dental Sonrisas',
      business_type: 'Clínica Odontológica & Estética Dental',
      industry: 'Salud & Odontología',
      target_audience: 'Personas de 25-55 años que buscan implantes, ortodoncia invisible o diseño de sonrisa sin dolor',
      brand_voice: 'Empático, seguro, higiénico y moderno',
      instagram_handle: 'clinica.sonrisas',
      website: 'clinicasonrisas.com',
      brand_color: '#0284c7',
      logo_url: '',
      knowledge_base: 'Tratamientos dentales sin dolor, tecnología 3D guiada, implantes en un solo día y ortodoncia invisible con alineadores transparentes. Facilidades de pago y diagnóstico inicial digital.',
      technical_terms: ['Alineadores invisibles', 'Implante osteointegrado', 'Escaneo intraoral 3D', 'Carillas de porcelana', 'Periodoncia', 'Endodoncia rotatoria', 'Blanqueamiento LED'],
      topics: [
        '¿Miedo al dentista? Descubre cómo tratamos caries sin dolor en 20 minutos',
        'Alineadores invisibles vs brackets tradicionales: ¿cuál te conviene?',
        '3 señales silenciosas de que necesitas revisar tus encías hoy',
        'Cómo recuperar una pieza dental en un solo día'
      ],
      pain_points: ['Miedo al dolor dental', 'Dudas sobre precios de implantes', 'Falta de tiempo para tratamientos largos'],
      offers: ['Ortodoncia invisible', 'Implantes en 24h', 'Blanqueamiento láser'],
    },
    {
      id: 'client-real-estate',
      name: 'Horizonte Inmobiliaria',
      business_type: 'Bienes Raíces & Inversiones Inmobiliarias',
      industry: 'Real Estate',
      target_audience: 'Inversionistas, familias y compradores primerizos que buscan propiedades rentables o su nuevo hogar',
      brand_voice: 'Confiable, analítico, profesional y seguro',
      instagram_handle: 'horizonte.propiedades',
      website: 'horizontepropiedades.com',
      brand_color: '#d97706',
      logo_url: '',
      knowledge_base: 'Asesoría integral en compra, venta y alquiler de inmuebles. Análisis de plusvalía, créditos hipotecarios y oportunidades de inversión en pozo con alta rentabilidad.',
      technical_terms: ['Plusvalía', 'Inversión en Pozo / Preventa', 'Cap Rate', 'Crédito Hipotecario UVA', 'Rentabilidad Anual', 'Escrituración', 'Due Diligence Inmobiliario'],
      topics: [
        'Los 4 errores más costosos al comprar tu primera propiedad',
        'Invertir en pozo vs comprar terminado: la guía definitiva para no perder dinero',
        'Cómo saber si una propiedad está en precio antes de ofertar',
        '3 zonas con mayor proyección de plusvalía este año'
      ],
      pain_points: ['Inseguridad jurídica al comprar', 'Miedo a comprar sobrevalorado', 'Trámites bancarios engorrosos'],
      offers: ['Departamentos en preventa', 'Tasación digital gratuita', 'Asesoría hipotecaria personalizada'],
    },
    {
      id: 'client-fitness-coach',
      name: 'FitPro Transformation',
      business_type: 'Entrenamiento Online & Nutrición Personalizada',
      industry: 'Fitness & Salud',
      target_audience: 'Hombres y mujeres ocupados que quieren perder grasa y ganar energía sin dietas extremas',
      brand_voice: 'Motivador, científico, disciplinado pero flexible',
      instagram_handle: 'fitpro.coach',
      website: 'fitprocoaching.com',
      brand_color: '#10b981',
      logo_url: '',
      knowledge_base: 'Planes de nutrición flexible sin eliminar carbohidratos, rutinas de 40 minutos en casa o gimnasio y seguimiento semanal por WhatsApp con métricas reales.',
      technical_terms: ['Déficit Calórico', 'Macronutrientes (Macros)', 'Sobrecarga Progresiva', 'NEAT', 'Tasa Metabólica Basal', 'Composición Corporal', 'Periodización del Entrenamiento'],
      topics: [
        'Por qué hacer horas de cardio no te está haciendo quemar grasa abdominal',
        'La regla del 80/20 para comer lo que te gusta y seguir bajando de peso',
        '3 hábitos nocturnos que están saboteando tu metabolismo',
        'Rutina express de 30 minutos para gente con poco tiempo'
      ],
      pain_points: ['Falta de constancia', 'Efecto rebote en dietas restrictivas', 'Poco tiempo disponible'],
      offers: ['Plan Transformación 90 Días', 'App de entrenamiento guiado', 'Comunidad y soporte 24/7'],
    },
  ];
}
