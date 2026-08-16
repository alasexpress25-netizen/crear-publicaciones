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
  Flame,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import {
  AgencyClient,
  fetchAgencyClients,
  getSupabaseConfig,
  saveSupabaseConfig,
  fetchClientContext,
  testSupabaseConnection,
  getFallbackAgencyClients
} from '../services/supabase';
import { BrandInfo } from '../types';

interface ClientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientId?: string;
  onSelectClient: (client: AgencyClient, context?: any) => void;
  brand: BrandInfo;
  onUpdateBrand: (field: keyof BrandInfo, value: any) => void;
}

const LOCAL_STORAGE_CUSTOM_CLIENTS = 'lavisualmk_custom_clients_list';

export const ClientSelectorModal: React.FC<ClientSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedClientId,
  onSelectClient,
  brand,
  onUpdateBrand,
}) => {
  const [clients, setClients] = useState<AgencyClient[]>(() => getFallbackAgencyClients());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseTable, setSupabaseTable] = useState('socialbot_clients');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [activeClientPreview, setActiveClientPreview] = useState<AgencyClient | null>(null);

  // New Client Form Modal State
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientBusiness, setNewClientBusiness] = useState('');
  const [newClientAudience, setNewClientAudience] = useState('');
  const [newClientWeb, setNewClientWeb] = useState('');
  const [newClientInstagram, setNewClientInstagram] = useState('');
  const [newClientColor, setNewClientColor] = useState('#e11d48');
  const [newClientLogo, setNewClientLogo] = useState('');
  const [newClientKB, setNewClientKB] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setSupabaseUrl(cfg.url);
      setSupabaseKey(cfg.key);
      setSupabaseTable(cfg.table || 'socialbot_clients');
      loadClients();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseKey, supabaseTable);
      setTestResult(res);
      if (res.success && res.sampleClients && res.sampleClients.length > 0) {
        setClients((prev) => {
          const combined = [...res.sampleClients!, ...prev];
          return combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
        });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Error de red o conexión' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey, supabaseTable);
    setConfigSaved(true);
    loadClients();
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfig(false);
    }, 1200);
  };

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAgencyClients();
      
      // Load custom local clients created by user
      let customClients: AgencyClient[] = [];
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_CLIENTS);
        if (saved) customClients = JSON.parse(saved);
      } catch {}

      const combined = [...customClients, ...(Array.isArray(data) ? data : getFallbackAgencyClients())];
      // Deduplicate safely by ID
      const uniqueClients = combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
      setClients(uniqueClients);

      if (selectedClientId) {
        const found = uniqueClients.find((c) => c.id === selectedClientId);
        if (found) setActiveClientPreview(found);
        else if (uniqueClients.length > 0) setActiveClientPreview(uniqueClients[0]);
      } else if (uniqueClients.length > 0) {
        setActiveClientPreview((prev) => prev || uniqueClients[0]);
      }
    } catch (err) {
      console.warn('Error loading clients, falling back to local list', err);
      setClients(getFallbackAgencyClients());
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseClient = async (client: AgencyClient) => {
    if (!client) return;
    setIsLoading(true);
    try {
      const context = await fetchClientContext(client.id);
      onSelectClient(client, context);
      onClose();
    } catch (err) {
      console.warn('Fallback selecting client without full context', err);
      onSelectClient(client);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newClient: AgencyClient = {
      id: `custom-client-${Date.now()}`,
      name: newClientName.trim(),
      business_type: newClientBusiness.trim() || 'Servicios Profesionales',
      industry: newClientBusiness.trim() || 'Negocios',
      target_audience: newClientAudience.trim() || 'Clientes potenciales calificados',
      website: newClientWeb.trim() ? newClientWeb.replace(/^https?:\/\//, '') : '',
      instagram_handle: newClientInstagram.trim().replace(/^@/, ''),
      brand_color: newClientColor || '#e11d48',
      logo_url: newClientLogo,
      knowledge_base: newClientKB.trim(),
      topics: [
        `¿Por qué tu servicio es excelente pero tus ventas no despegan?`,
        `Los 3 errores más comunes en ${newClientBusiness || 'tu sector'}`,
        `Cómo conseguir resultados garantizados paso a paso`
      ],
      pain_points: ['Poco alcance', 'Falta de clientes'],
      offers: [newClientBusiness.trim() || 'Servicios principales'],
    };

    let customList: AgencyClient[] = [];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_CLIENTS);
      if (saved) customList = JSON.parse(saved);
    } catch {}

    const updatedCustom = [newClient, ...customList];
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_CLIENTS, JSON.stringify(updatedCustom));
    } catch {}

    setClients((prev) => [newClient, ...prev]);
    setActiveClientPreview(newClient);
    setIsCreatingClient(false);
    
    // Auto-select newly created client
    handleChooseClient(newClient);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const res = ev.target.result as string;
          setNewClientLogo(res);
          onUpdateBrand('logo', res);
          if (activeClientPreview) {
            setActiveClientPreview({
              ...activeClientPreview,
              logo_url: res,
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const safeClients = Array.isArray(clients) ? clients : [];
  const filteredClients = safeClients.filter((c) => {
    if (!c) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const busMatch = (c.business_type || '').toLowerCase().includes(q);
    const indMatch = (c.industry || '').toLowerCase().includes(q);
    return nameMatch || busMatch || indMatch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Clientes & Identidad de Marca
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Supabase + Local
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selecciona o crea el cliente para sincronizar su logo, web, público objetivo y colores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingClient(true)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition"
              title="Agregar un cliente nuevo"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Cliente</span>
            </button>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 border ${
                showConfig
                  ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Configuración de conexión Supabase"
            >
              <Database className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">BD Supabase</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Supabase Config Drawer if toggled */}
        {showConfig && (
          <div className="p-4 sm:p-5 bg-slate-950/95 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-rose-400" />
                <span>Credenciales de Conexión Supabase</span>
              </h4>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Configura tu proyecto de Supabase (URL, Anon Key y Tabla)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">TABLA DE CLIENTES:</label>
                <input
                  type="text"
                  value={supabaseTable}
                  onChange={(e) => setSupabaseTable(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
                  placeholder="socialbot_clients, clients o clientes"
                />
              </div>
            </div>

            {/* Test result feedback banner */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                }`}
              >
                <span>{testResult.message}</span>
                {testResult.success && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-rose-400" />}
                <span>{isTesting ? 'Probando Conexión...' : 'Probar Conexión en Vivo'}</span>
              </button>

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

        {/* Modal Body */}
        {isCreatingClient ? (
          /* CREATE CLIENT FORM */
          <form onSubmit={handleCreateCustomClient} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-900/90 scrollbar-thin">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-500" />
                <span>Registrar Nuevo Cliente / Marca</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingClient(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nombre de la Marca o Negocio *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Clínica Dental Sonrisas, La Visual MK"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Rubro, Nicho o Servicio Principal
                </label>
                <input
                  type="text"
                  value={newClientBusiness}
                  onChange={(e) => setNewClientBusiness(e.target.value)}
                  placeholder="Ej: Odontología y Estética, Agencia de Marketing"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Página Web (Aparece al pie del carrusel)
                </label>
                <input
                  type="text"
                  value={newClientWeb}
                  onChange={(e) => setNewClientWeb(e.target.value)}
                  placeholder="Ej: lavisualmk.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Usuario de Instagram
                </label>
                <input
                  type="text"
                  value={newClientInstagram}
                  onChange={(e) => setNewClientInstagram(e.target.value)}
                  placeholder="Ej: @lavisualmk"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Color Principal de Marca
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newClientColor}
                    onChange={(e) => setNewClientColor(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-700"
                  />
                  <input
                    type="text"
                    value={newClientColor}
                    onChange={(e) => setNewClientColor(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono w-28"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Logo del Cliente (PNG transparente o JPG)
                </label>
                <div className="flex items-center gap-3">
                  {newClientLogo ? (
                    <img
                      src={newClientLogo}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-contain bg-slate-950 border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl cursor-pointer transition border border-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Logo desde PC</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Público Objetivo / Cliente Ideal
              </label>
              <input
                type="text"
                value={newClientAudience}
                onChange={(e) => setNewClientAudience(e.target.value)}
                placeholder="Ej: Dueños de negocios y emprendedores que quieren vender más"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Contexto, Propuesta de Valor y Oferta (Para que la IA aprenda del cliente)
              </label>
              <textarea
                rows={3}
                value={newClientKB}
                onChange={(e) => setNewClientKB(e.target.value)}
                placeholder="Describe qué vende el cliente, garantías, precios o detalles clave..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingClient(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-rose-950/50 transition"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Aplicar Cliente</span>
              </button>
            </div>
          </form>
        ) : (
          /* SPLIT VIEW CLIENT SELECTOR */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
            
            {/* Left Column: Search & Client Cards */}
            <div className="md:col-span-5 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-900/40">
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

              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                    <span className="text-xs">Sincronizando clientes...</span>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs px-4">
                    No se encontraron clientes con "{searchQuery}".
                    <button
                      onClick={() => setIsCreatingClient(true)}
                      className="mt-2 text-rose-400 underline block mx-auto text-xs"
                    >
                      + Crear este cliente ahora
                    </button>
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
                              alt={client.name || 'Cliente'}
                              className="w-9 h-9 rounded-xl object-contain bg-slate-950 border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                              style={{
                                backgroundColor: client.brand_color || '#e11d48',
                              }}
                            >
                              {(client.name || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{client.name || 'Cliente'}</span>
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

            {/* Right Column: Selected Client Detail */}
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
                          className="w-14 h-14 rounded-2xl object-contain bg-slate-950 border border-slate-700 shadow-md p-1"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg"
                          style={{
                            backgroundColor: activeClientPreview.brand_color || '#e11d48',
                          }}
                        >
                          {(activeClientPreview.name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white">
                            {activeClientPreview.name || 'Cliente'}
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
                      <span>Seleccionar Cliente</span>
                    </button>
                  </div>

                  {/* Logo Uploader for Current Client */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-rose-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Logo de Marca</span>
                        <span className="text-[10px] text-slate-400 block">Aparece en la esquina superior de cada slide</span>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer border border-slate-700 transition">
                      <Upload className="w-3.5 h-3.5 text-rose-400" />
                      <span>{brand.logo || activeClientPreview.logo_url ? 'Cambiar Logo' : 'Subir Logo PNG'}</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
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
                  {Array.isArray(activeClientPreview.topics) && activeClientPreview.topics.length > 0 && (
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
        )}

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{safeClients.length} clientes disponibles</span>
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
