import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Globe,
  Instagram,
  Sparkles,
  Search,
  Database,
  Check,
  RefreshCw,
  X,
  Plus,
  Sliders,
  Flame,
  ArrowRight
} from 'lucide-react';
import {
  AgencyClient,
  fetchAgencyClients,
  getSupabaseConfig,
  saveSupabaseConfig,
  fetchClientContext
} from '../services/supabase';
import { BrandInfo, MarketingDocument } from '../types';

interface ClientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientId?: string;
  onSelectClient: (client: AgencyClient, context?: any) => void;
}

export const ClientSelectorModal: React.FC<ClientSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedClientId,
  onSelectClient,
}) => {
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [configSaved, setConfigSaved] = useState(false);
  const [activeClientPreview, setActiveClientPreview] = useState<AgencyClient | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadClients();
      const cfg = getSupabaseConfig();
      setSupabaseUrl(cfg.url);
      setSupabaseKey(cfg.key);
    }
  }, [isOpen]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAgencyClients();
      setClients(data);
      if (selectedClientId) {
        const found = data.find((c) => c.id === selectedClientId);
        if (found) setActiveClientPreview(found);
      } else if (data.length > 0 && !activeClientPreview) {
        setActiveClientPreview(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setConfigSaved(true);
    loadClients();
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfig(false);
    }, 1500);
  };

  const handleChooseClient = async (client: AgencyClient) => {
    setIsLoading(true);
    try {
      const context = await fetchClientContext(client.id);
      onSelectClient(client, context);
      onClose();
    } catch (err) {
      console.error(err);
      onSelectClient(client);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.business_type && c.business_type.toLowerCase().includes(q)) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Clientes de la Agencia (Supabase)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Conectado
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selecciona un cliente para cargar automáticamente su marca, audiencia, colores y banco de conocimientos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5 border border-slate-800"
              title="Configuración de Supabase"
            >
              <Database className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">BD Supabase</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Supabase Config Drawer if toggled */}
        {showConfig && (
          <div className="p-5 bg-slate-950/90 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-rose-400" />
                <span>Credenciales de Conexión Supabase</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Por defecto utiliza la base de datos central de La Visual MK
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">SUPABASE URL:</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
                  placeholder="https://xyz.supabase.co"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">ANON PUBLIC KEY:</label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
                  placeholder="eyJhbGci..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveConfig}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                {configSaved ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                <span>{configSaved ? '¡Guardado y Recargado!' : 'Guardar y Recargar Clientes'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Body: Split View (List of Clients + Detail Panel) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          
          {/* Left Column: Search & Client Cards (5 Cols) */}
          <div className="md:col-span-5 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-900/40">
            
            {/* Search Input */}
            <div className="p-3.5 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cliente, rubro o servicio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Clients List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="text-xs">Cargando clientes desde Supabase...</span>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No se encontraron clientes con "{searchQuery}".
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = selectedClientId === client.id;
                  const isPreviewed = activeClientPreview?.id === client.id;

                  return (
                    <button
                      key={client.id}
                      onClick={() => setActiveClientPreview(client)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between group ${
                        isPreviewed
                          ? 'bg-rose-950/40 border-rose-600/70 shadow-md ring-1 ring-rose-500/40'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                            style={{
                              backgroundColor: client.brand_color || '#e11d48',
                            }}
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{client.name}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {client.business_type || client.industry || 'Servicios'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isSelected ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                            Activo
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 group-hover:text-rose-400 transition">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Selected Client Detail & One-Click Apply (7 Cols) */}
          <div className="md:col-span-7 flex flex-col overflow-y-auto p-5 sm:p-6 bg-slate-900/90 scrollbar-thin">
            {activeClientPreview ? (
              <div className="space-y-5">
                
                {/* Client Banner Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3.5">
                    {activeClientPreview.logo_url ? (
                      <img
                        src={activeClientPreview.logo_url}
                        alt={activeClientPreview.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg"
                        style={{
                          backgroundColor: activeClientPreview.brand_color || '#e11d48',
                        }}
                      >
                        {activeClientPreview.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">
                          {activeClientPreview.name}
                        </h3>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: activeClientPreview.brand_color || '#e11d48' }}
                          title="Color principal de marca"
                        />
                      </div>
                      <p className="text-xs font-semibold text-rose-400">
                        {activeClientPreview.business_type || activeClientPreview.industry}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleChooseClient(activeClientPreview)}
                    className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-950/50 transition transform active:scale-95 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>Seleccionar para el Carrusel</span>
                  </button>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {activeClientPreview.website && (
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <Globe className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-slate-300 font-mono truncate">{activeClientPreview.website}</span>
                    </div>
                  )}
                  {activeClientPreview.instagram_handle && (
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className="text-slate-300 font-mono truncate">@{activeClientPreview.instagram_handle.replace(/^@/, '')}</span>
                    </div>
                  )}
                </div>

                {/* Target Audience */}
                <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Cliente Ideal / Audiencia Objetivo:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {activeClientPreview.target_audience || 'Dueños de negocios y clientes calificados del sector.'}
                  </p>
                </div>

                {/* Knowledge Base & Positioning */}
                {activeClientPreview.knowledge_base && (
                  <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Contexto y Base de Conocimientos:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto scrollbar-thin">
                      {activeClientPreview.knowledge_base}
                    </p>
                  </div>
                )}

                {/* Suggested Topics / Angles for this client */}
                {activeClientPreview.topics && activeClientPreview.topics.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      Ideas & Ganchos Estratégicos para {activeClientPreview.name}:
                    </span>
                    <div className="space-y-1.5">
                      {activeClientPreview.topics.map((topic, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200"
                        >
                          <span className="text-amber-500 font-bold">#{i + 1}</span>
                          <span className="flex-1">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                Selecciona un cliente de la lista para ver su perfil.
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{clients.length} clientes cargados desde Supabase</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
