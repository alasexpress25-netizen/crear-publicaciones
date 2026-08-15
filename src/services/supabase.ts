import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Agency Supabase configuration
export const DEFAULT_SUPABASE_URL = 'https://redaqqxoeciycqgjhpbv.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZGFxcXhvZWNpeWNxZ2pocGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDcyMjEsImV4cCI6MjA5MzY4MzIyMX0.HqpOrWPtbYImgy57TafbaB4qriqmq4FI9GIa4Vg9FhI';

export const LOCAL_STORAGE_SUPABASE_URL = 'lavisualmk_supabase_url';
export const LOCAL_STORAGE_SUPABASE_KEY = 'lavisualmk_supabase_key';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; key: string } {
  try {
    const url = localStorage.getItem(LOCAL_STORAGE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    const key = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY) || DEFAULT_SUPABASE_ANON_KEY;
    return { url, key };
  } catch {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY };
  }
}

export function saveSupabaseConfig(url: string, key: string) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL, url.trim());
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, key.trim());
    supabaseInstance = null; // reset client to re-init
  } catch (err) {
    console.error('Error saving Supabase config', err);
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const { url, key } = getSupabaseConfig();
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
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
  tone?: string;
  mission?: string;
  pain_points?: string | string[];
  offers?: string | string[];
  knowledge_base?: string;
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
 * Fetch list of clients from Supabase
 * Tries RPC list_socialbot_clients_for_editor first, then fallback to direct table queries
 */
export async function fetchAgencyClients(): Promise<AgencyClient[]> {
  const supabase = getSupabaseClient();

  // 1. Try RPC function 'list_socialbot_clients_for_editor'
  try {
    const { data, error } = await supabase.rpc('list_socialbot_clients_for_editor');
    if (!error && Array.isArray(data) && data.length > 0) {
      return normalizeClients(data);
    }
  } catch (err) {
    console.warn('RPC list_socialbot_clients_for_editor failed, trying table queries', err);
  }

  // 2. Try direct table query 'socialbot_clients'
  try {
    const { data, error } = await supabase
      .from('socialbot_clients')
      .select('*')
      .order('name', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return normalizeClients(data);
    }
  } catch (err) {
    console.warn('Table socialbot_clients query failed, trying clients', err);
  }

  // 3. Try table 'clients'
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return normalizeClients(data);
    }
  } catch (err) {
    console.warn('Table clients query failed, trying agency_clients', err);
  }

  // 4. Try table 'agency_clients'
  try {
    const { data, error } = await supabase
      .from('agency_clients')
      .select('*')
      .order('name', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return normalizeClients(data);
    }
  } catch (err) {
    console.warn('All client queries failed or tables empty', err);
  }

  // Return curated fallback agency clients if database is unreachable or empty
  return getFallbackAgencyClients();
}

/**
 * Fetch detailed context for a specific client
 */
export async function fetchClientContext(clientId: string): Promise<ClientEditorContext | null> {
  const supabase = getSupabaseClient();

  // Try RPC get_impacto_editor_context
  try {
    const { data, error } = await supabase.rpc('get_impacto_editor_context', {
      client_id: clientId,
    });
    if (!error && data) {
      return data as ClientEditorContext;
    }
  } catch (err) {
    console.warn('RPC get_impacto_editor_context failed, building context from client record', err);
  }

  // Fallback: fetch client single row
  try {
    const { data } = await supabase
      .from('socialbot_clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (data) {
      const normalized = normalizeClient(data);
      return {
        client: normalized,
        knowledge_base: normalized.knowledge_base,
        topics: normalized.topics || [],
      };
    }
  } catch (err) {
    console.warn('Failed fallback fetch for client', clientId, err);
  }

  return null;
}

function normalizeClients(list: any[]): AgencyClient[] {
  return list.map(normalizeClient);
}

function normalizeClient(item: any): AgencyClient {
  const raw = item.raw_data || item;
  return {
    id: item.id || String(Math.random()),
    name: item.name || item.client_name || item.brand_name || 'Cliente sin nombre',
    business_type: item.business_type || item.niche || item.rubro || item.industry || 'Servicios Profesionales',
    industry: item.industry || item.rubro || item.niche || 'Marketing & Negocios',
    target_audience: item.target_audience || item.audience || item.ideal_customer || 'Dueños de negocios y clientes calificados',
    brand_voice: item.brand_voice || item.tone || 'Profesional, persuasivo y directo',
    instagram_handle: item.instagram_handle || item.instagram || item.handle || '',
    website: item.website || item.web || item.url || '',
    brand_color: item.brand_color || item.primary_color || item.color || '#e11d48',
    secondary_color: item.secondary_color || '#0f172a',
    logo_url: item.logo_url || item.logo || '',
    tone: item.tone || item.brand_voice || 'Estratégico y cercano',
    mission: item.mission || item.description || '',
    pain_points: item.pain_points || item.pains || [],
    offers: item.offers || item.services || item.products || [],
    knowledge_base: item.knowledge_base || item.context || item.notes || '',
    topics: item.topics || item.suggested_topics || [],
    created_at: item.created_at || new Date().toISOString(),
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
      topics: [
        '¿Por qué tu servicio es excelente pero tus ventas no despegan?',
        'Los 3 errores que comete el 90% al publicar en Instagram',
        'Cómo conseguir clientes calificados sin depender de la suerte ni bailar en reels',
        'La anatomía del carrusel que genera consultas todos los días'
      ],
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
      topics: [
        '¿Miedo al dentista? Descubre cómo tratamos caries sin dolor en 20 minutos',
        'Alineadores invisibles vs brackets tradicionales: ¿cuál te conviene?',
        '3 señales silenciosas de que necesitas revisar tus encías hoy',
        'Cómo recuperar una pieza dental en un solo día'
      ],
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
      topics: [
        'Los 4 errores más costosos al comprar tu primera propiedad',
        'Invertir en pozo vs comprar terminado: la guía definitiva para no perder dinero',
        'Cómo saber si una propiedad está en precio antes de ofertar',
        '3 zonas con mayor proyección de plusvalía este año'
      ],
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
      topics: [
        'Por qué hacer horas de cardio no te está haciendo quemar grasa abdominal',
        'La regla del 80/20 para comer lo que te gusta y seguir bajando de peso',
        '3 hábitos nocturnos que están saboteando tu metabolismo',
        'Rutina express de 30 minutos para gente con poco tiempo'
      ],
    },
  ];
}
