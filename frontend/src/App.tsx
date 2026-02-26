import {
  TrendingUp, RefreshCw, ChevronRight,
  Plus,
  ArrowLeft, Sun, Moon, Users, LayoutDashboard, Briefcase, ChevronDown, ChevronUp, Loader2, SortAsc,
  Settings, Grid, ShoppingBag, UserCheck, FileText, BarChart3, ShieldCheck, LogOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import vendorProfile from './assets/vendor_profile.png'

const API_BASE_URL = 'http://localhost:3333/api';

// --- TIPOS ---
type UserRole = 'gerente' | 'supervisor' | 'vendedor';
type AppView = 'dashboard' | 'menu' | 'settings' | 'suppliers' | 'performance_geral';

const App = () => {
  // --- UI STATE ---
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [currentPage, setCurrentPage] = useState<AppView>('dashboard')
  const [loading, setLoading] = useState(true)
  const [loadingItemsId, setLoadingItemsId] = useState<number | null>(null)
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // --- IMPERSONATION / SIMULATION STATE ---
  const [simulationProfile, setSimulationProfile] = useState<{ id: string | null, name: string, role: UserRole }>({
    id: '300', // Código de Vendedor Padrão
    name: 'SERGIO ARTHUR',
    role: 'vendedor'
  })

  // --- HIERARCHY STATE ---
  const [viewLevel, setViewLevel] = useState<UserRole>('gerente')
  const [selectedVendedorId, setSelectedVendedorId] = useState<string | null>(null)
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [vendorsOfSupervisor, setVendorsOfSupervisor] = useState<any[]>([])
  const [selectedSupervisor, setSelectedSupervisor] = useState<any>(null)

  // Opções de simulação
  const [simGerentes, setSimGerentes] = useState<any[]>([])
  const [simSupervisores, setSimSupervisores] = useState<any[]>([])

  // --- DATA STATE ---
  const [perspective, setPerspective] = useState<'valor' | 'positivacao' | 'mix' | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: 'code' | 'name' | 'value'; direction: 'asc' | 'desc' }>({ key: 'value', direction: 'desc' })
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null)
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null)
  const [clientItems, setClientItems] = useState<Record<number, any[]>>({})
  const [productPrices, setProductPrices] = useState<Record<number, any[]>>({})

  const [stats, setStats] = useState<any>({ nome_vendedor: 'Carregando...', valor_total: 0 })
  const [suppliers, setSuppliers] = useState<any[]>([])

  // --- CACHE STATE ---
  const [cachedData, setCachedData] = useState<Record<string, any>>({})

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const pureDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = pureDate.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  }

  // --- DATA LOADING ---
  const loadAllData = async (forceRefresh = false, targetRca?: string) => {
    const rca = targetRca || selectedVendedorId || (simulationProfile.role === 'vendedor' ? simulationProfile.id : null);
    if (!rca) return;

    // CHECK CACHE
    if (!forceRefresh && cachedData[`dash_${rca}`]) {
      setStats(cachedData[`dash_${rca}`].stats);
      setSuppliers(cachedData[`dash_${rca}`].suppliers);
      return;
    }

    setLoading(true);
    setStats({ nome_vendedor: 'Carregando...', valor_total: 0, positivacao: 0, mix: 0 });
    setSuppliers([]);
    try {
      const rf = forceRefresh ? '&refresh=true' : '';

      // Carrega performance principal (Dashboard) - SEMPRE RCA do VENDEDOR
      const dashRes = await fetch(`${API_BASE_URL}/proxy/metafornecedor?RCA=${rca}${rf}`);

      if (dashRes.ok) {
        const raw = await dashRes.json();
        const data = raw.data || [];
        if (data.length > 0) {
          const totalValor = data.reduce((acc: any, curr: any) => acc + (curr.VlrVendido || 0), 0);
          const totalMetaValor = data.reduce((acc: any, curr: any) => acc + (curr.MetaValor || 0), 0);
          const totalPos = data.reduce((acc: any, curr: any) => acc + (curr.Positivacao || 0), 0);
          const totalMetaPos = data.reduce((acc: any, curr: any) => acc + (curr.PosMeta || 0), 0);
          const totalMix = data.reduce((acc: any, curr: any) => acc + (curr.MIX || 0), 0);
          const totalMetaMix = data.reduce((acc: any, curr: any) => acc + (curr.MixMeta || 0), 0);

          const getField = (obj: any, key: string, fallback: any = 0) => {
            const upperKey = key.toUpperCase();
            const lowerKey = key.toLowerCase();
            return obj[key] ?? obj[upperKey] ?? obj[lowerKey] ?? fallback;
          };

          const newSuppliers = data.map((s: any) => {
            return {
              id: s.CODFORNEC || s.codfornec,
              nome_fornecedor: s.FANTASIA || s.fantasia || s.NOMEFORNEC,
              valor: getField(s, "VlrVendido"),
              meta_valor: getField(s, "MetaValor"),
              perc_venda: getField(s, "percVenda"),
              positivados: getField(s, "Positivacao"),
              meta_pos: getField(s, "PosMeta"),
              perc_pos: getField(s, "percPos"),
              mix: getField(s, "MIX"),
              meta_mix: getField(s, "MixMeta"),
              perc_mix: getField(s, "percMix"),
              progresso: getField(s, "percGeral")
            };
          });

          const newStats = {
            vendedor_id: data[0].CODUSUR,
            nome_vendedor: data[0].NOME || 'Vendedor',
            valor_total: totalValor,
            meta_valor_total: totalMetaValor,
            positivacao: totalPos,
            meta_pos_total: totalMetaPos,
            mix: totalMix,
            meta_mix_total: totalMetaMix,
            perc_venda_total: totalMetaValor > 0 ? Math.round((totalValor / totalMetaValor) * 100) : 0,
            perc_pos_total: totalMetaPos > 0 ? Math.round((totalPos / totalMetaPos) * 100) : 0,
            perc_mix_total: totalMetaMix > 0 ? Math.round((totalMix / totalMetaMix) * 100) : 0,
            status: 'ATIVO',
            equipe: 'SMART'
          };

          setStats(newStats);
          setSuppliers(newSuppliers);
          setCachedData(prev => ({ ...prev, [`dash_${rca}`]: { stats: newStats, suppliers: newSuppliers } }));
        } else {
          setStats({ nome_vendedor: 'Sem dados', valor_total: 0, meta_valor_total: 0, positivacao: 0, meta_pos_total: 0, mix: 0, meta_mix_total: 0 });
          setSuppliers([]);
        }
      }
    } catch (err) {
      console.warn("API Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Inicializa a hierarquia conforme o papel simulado
  const initHierarchy = async () => {
    setLoading(true);
    setSupervisors([]); // Clear previous
    setVendorsOfSupervisor([]); // Clear previous
    try {
      if (simulationProfile.role === 'vendedor') {
        setViewLevel('vendedor');
        setSelectedVendedorId(simulationProfile.id);
        await loadAllData(false, simulationProfile.id || undefined);
      }
      else if (simulationProfile.role === 'supervisor') {
        setSelectedVendedorId(null); // Reset detail RCA
        // Busca apenas os vendedores deste supervisor
        const res = await fetch(`${API_BASE_URL}/hierarchy/vendors/${simulationProfile.id}?COD_CADRCA=${simulationProfile.id}`);
        if (res.ok) {
          setVendorsOfSupervisor(await res.json());
          setViewLevel('supervisor');
          setSelectedSupervisor({ id: simulationProfile.id, name: simulationProfile.name });
        }
      }
      else {
        setSelectedVendedorId(null); // Reset detail RCA
        setSelectedSupervisor(null);
        // Gerente ou Master - Busca supervisores
        const url = `${API_BASE_URL}/hierarchy/supervisors?COD_CADRCA=${simulationProfile.id}`;
        const res = await fetch(url);
        if (res.ok) {
          setSupervisors(await res.json());
          setViewLevel('gerente');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert("Para instalar:\n1. Clique nos 3 pontinhos (⋮) do seu navegador.\n2. Escolha 'Instalar Aplicativo' ou 'Adicionar à tela de início'.");
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // Carrega listas para configuração (Simulação Master)
  const loadSimulationLists = async () => {
    try {
      const [gRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hierarchy/gerentes`),
        fetch(`${API_BASE_URL}/hierarchy/supervisors`)
      ]);
      if (gRes.ok) setSimGerentes(await gRes.json());
      if (sRes.ok) setSimSupervisores(await sRes.json());
    } catch (e) { console.error(e); }
  }

  const loadVendorsList = async (sup: any) => {
    setLoading(true);
    setVendorsOfSupervisor([]); // Clear old list immediately
    try {
      const res = await fetch(`${API_BASE_URL}/hierarchy/vendors/${sup.id}`);
      if (res.ok) {
        setVendorsOfSupervisor(await res.json());
        setSelectedSupervisor(sup);
        setViewLevel('supervisor');
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const openSupplierAnalysis = async (sup: any, forceRefresh = false) => {
    setLoading(true);
    setAnalysisData(null); // CLEAR OLD DATA
    setExpandedClientId(null); setExpandedProductId(null);
    setClientItems({}); setProductPrices({});
    const rca = selectedVendedorId || (simulationProfile.role === 'vendedor' ? simulationProfile.id : '300');
    const cacheKey = `analysis_${rca}_${sup.id}`;

    if (!forceRefresh && cachedData[cacheKey]) {
      setAnalysisData(cachedData[cacheKey]);
      setSelectedSupplier(sup);
      setLoading(false); // Ensure loading is turned off if data is from cache
      return;
    }

    try {
      const rf = forceRefresh ? '&refresh=true' : '';
      const [vRes, , , sRes, nRes, mnRes] = await Promise.all([
        fetch(`${API_BASE_URL}/proxy/metafornecedorvalor?RCA=${rca}&CODFORNEC=${sup.id}${rf}`),
        fetch(`${API_BASE_URL}/proxy/metafornecedorpos?RCA=${rca}&CODFORNEC=${sup.id}${rf}`),
        fetch(`${API_BASE_URL}/proxy/metafornecedorMIX?RCA=${rca}&CODFORNEC=${sup.id}${rf}`),
        fetch(`${API_BASE_URL}/proxy/metafornecedorposSKILL?RCA=${rca}&CODFORNEC=${sup.id}${rf}`),
        fetch(`${API_BASE_URL}/proxy/metafornecedorPOSdetailnew?CODUSUR=${rca}&CODFORNEC=${sup.id}${rf}`),
        fetch(`${API_BASE_URL}/proxy/metafornecedorMIXdetailnew?CODUSUR=${rca}&CODFORNEC=${sup.id}${rf}`)
      ]);

      const skillData = sRes.ok ? (await sRes.json()).data[0] : null;
      const newData = {
        header: skillData,
        valor: vRes.ok ? (await vRes.json()).data.map((v: any) => ({ id: v.CODPROD, cliente: v.DESCRICAO, total: v.VALOR || v.VAL0OR, positivados: v.POS, ultimo_mes: formatDate(v.ULTVENDA) })) : [],
        nao_positivados: nRes.ok ? (await nRes.json()).data.map((p: any) => ({ id: p.CODCLI, cliente: p.CLIENTE, ultimo_mes: formatDate(p.ULTVENDA), total_historico: p.VLATEND, qt_itens: p.MIX })) : [],
        nao_mix: mnRes.ok ? (await mnRes.json()).data.map((m: any) => ({ id: m.CODPROD, produto: m.DESCRICAO, ultimo_mes: formatDate(m.ULTVENDA), total_historico: m.VLATEND, qt_itens: m.POS, estoque: m.ESTOQUE })) : []
      };

      setAnalysisData(newData);
      setCachedData(prev => ({ ...prev, [cacheKey]: newData }));
      setSelectedSupplier(sup);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const loadClientItems = async (clientId: number, forceRefresh = false) => {
    if (!forceRefresh && expandedClientId === clientId) { setExpandedClientId(null); return; }
    if (!forceRefresh && clientItems[clientId]) { setExpandedClientId(clientId); return; }
    setLoadingItemsId(clientId);
    const rca = selectedVendedorId || (simulationProfile.role === 'vendedor' ? simulationProfile.id : '300');
    try {
      const rf = forceRefresh ? '&refresh=true' : '';
      const res = await fetch(`${API_BASE_URL}/proxy/metafornecedorPOSdetaildetail?CODCLI=${clientId}&CODFORNEC=${selectedSupplier.id}&CODUSUR=${rca}${rf}`);
      if (res.ok) {
        const json = await res.json();
        setClientItems(prev => ({ ...prev, [clientId]: json.data || [] }));
        setExpandedClientId(clientId);
      }
    } catch (err) { console.error(err); } finally { setLoadingItemsId(null); }
  }

  const loadProductPrices = async (productId: number, forceRefresh = false) => {
    if (!forceRefresh && expandedProductId === productId) { setExpandedProductId(null); return; }
    if (!forceRefresh && productPrices[productId]) { setExpandedProductId(productId); return; }
    setLoadingItemsId(productId);
    try {
      const rf = forceRefresh ? '&refresh=true' : '';
      const res = await fetch(`${API_BASE_URL}/proxy/metafornecedorMIXdetailTABELA?CODPROD=${productId}${rf}`);
      if (res.ok) {
        const json = await res.json();
        setProductPrices(prev => ({ ...prev, [productId]: json.data || [] }));
        setExpandedProductId(productId);
      }
    } catch (err) { console.error(err); } finally { setLoadingItemsId(null); }
  }

  const handleGlobalSync = async () => {
    if (selectedSupplier) await openSupplierAnalysis(selectedSupplier, true);
    else await loadAllData(true);
  }

  useEffect(() => { initHierarchy(); }, [simulationProfile]);
  useEffect(() => { if (currentPage === 'settings') loadSimulationLists(); }, [currentPage]);

  const sortedList = useMemo(() => {
    if (!analysisData) return [];
    let list = perspective === 'positivacao' ? [...analysisData.nao_positivados] : perspective === 'mix' ? [...analysisData.nao_mix] : [...analysisData.valor];
    return list.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === 'code') { valA = a.id; valB = b.id; }
      else if (sortConfig.key === 'name') { valA = (a.cliente || a.produto || "").toUpperCase(); valB = (b.cliente || b.produto || "").toUpperCase(); }
      else { valA = a.total || a.total_historico || 0; valB = b.total || b.total_historico || 0; }
      return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [analysisData, perspective, sortConfig]);

  return (
    <div className={`flex flex-col min-h-screen font-sans max-w-md mx-auto relative overflow-x-hidden pb-40 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0F172A] text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* GLOBAL LOADING OVERLAY */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[2000] flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#0F172A]/80' : 'bg-slate-50/80'} backdrop-blur-md`}
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-[2.5rem] border-t-4 border-l-4 border-blue-600 shadow-2xl shadow-blue-600/40"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-600/10 rounded-full animate-pulse blur-xl" />
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse"
            >
              Sincronizando dados
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIMULATION INDICATOR */}
      <AnimatePresence>
        {simulationProfile.id !== '300' && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} className="bg-amber-500 text-black text-[10px] font-black uppercase text-center py-2 sticky top-0 z-[1000] shadow-lg">
            SIMULANDO VISUALIZAÇÃO: {simulationProfile.name} ({simulationProfile.role})
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`px-6 py-4 flex items-center justify-between sticky top-[24px] z-[100] backdrop-blur-3xl border-b transition-all ${theme === 'dark' ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 rounded-2xl bg-black/5 hover:bg-blue-600/10 transition-all text-blue-500">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="font-black text-xs tracking-tighter uppercase text-blue-500 flex items-center gap-2">
            <LayoutDashboard size={16} /> SMART VENDAS
          </div>
        </div>
        <button onClick={() => {
          if (selectedSupplier) setSelectedSupplier(null);
          else if (selectedVendedorId && simulationProfile.role !== 'vendedor') { setSelectedVendedorId(null); setViewLevel('supervisor'); }
          else if (selectedSupervisor && simulationProfile.role === 'gerente') { setSelectedSupervisor(null); setViewLevel('gerente'); }
          else setCurrentPage('menu');
        }} className={`p-3 rounded-2xl transition-all ${currentPage === 'dashboard' && viewLevel === simulationProfile.role && !selectedSupplier ? 'bg-blue-600/10 text-blue-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
          {currentPage === 'dashboard' && viewLevel === simulationProfile.role && !selectedSupplier ? <Grid size={20} /> : <ArrowLeft size={20} />}
        </button>
      </nav>

      <AnimatePresence mode="wait">

        {/* --- TELA: MENU PRINCIPAL (GRID) --- */}
        {currentPage === 'menu' && (
          <motion.main key="menu" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="p-8 space-y-12">
            <header className="py-6">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Menu</h2>
              <div className="h-1 w-12 bg-blue-600 rounded-full mt-3" />
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2">{simulationProfile.name}</p>
            </header>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { title: 'ACOMP. FORNEC.', icon: <ShoppingBag />, color: 'blue', view: 'dashboard' },
                  { title: 'METAS GERAL', icon: <BarChart3 />, color: 'emerald', msg: 'Em Breve' },
                  { title: 'CLIENTES', icon: <Users />, color: 'amber', msg: 'Em Breve' },
                  { title: 'PEDIDOS', icon: <FileText />, color: 'purple', msg: 'Em Breve' },
                  { title: 'PREÇO MERCADO', icon: <TrendingUp />, color: 'rose', msg: 'Em Breve' },
                  { title: 'CONFIGURAÇÕES', icon: <Settings />, color: 'slate', view: 'settings' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => item.view && setCurrentPage(item.view as AppView)}
                    className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95 text-center ${theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-xl'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-${item.color}-500 bg-${item.color}-500/10`}>{item.icon}</div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-tight leading-tight block">{item.title}</span>
                      {item.msg && <span className="text-[8px] font-black text-slate-500 uppercase block">{item.msg}</span>}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleInstallClick}
                className={`w-full p-8 rounded-[3rem] flex items-center justify-center gap-4 transition-all shadow-2xl ${installPrompt ? 'bg-blue-600 text-white shadow-blue-600/30 animate-pulse' : 'bg-slate-200 text-slate-500 border-2 border-slate-300'}`}
              >
                <LayoutDashboard size={24} />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                    {installPrompt ? 'Instalar SmartVendas' : 'Instalação PWA'}
                  </span>
                  <span className="text-[8px] font-bold opacity-80 uppercase">
                    {installPrompt ? 'Clique para Adicionar à Tela' : 'Disponível no menu do navegador (⋮)'}
                  </span>
                </div>
              </button>

              {!installPrompt && (
                <p className="text-[9px] font-black text-slate-400 uppercase text-center px-10 leading-tight">
                  Se o botão não funcionar, clique nos <span className="text-blue-600">3 pontinhos</span> do navegador e escolha <span className="text-blue-600">"Instalar Aplicativo"</span>
                </p>
              )}
            </div>

            <button className="w-full p-8 rounded-[3rem] border-2 border-red-500/10 text-red-500/50 flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest mt-8">
              <LogOut size={16} /> Sair da Conta
            </button>
          </motion.main>
        )}

        {/* --- TELA: CONFIGURAÇÕES / SIMULAÇÃO --- */}
        {currentPage === 'settings' && (
          <motion.main key="settings" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-8 space-y-12">
            <header className="py-6">
              <div className="flex items-center gap-3 text-blue-500 mb-2">
                <ShieldCheck size={20} />
                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Centro de Controle</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Simulação Master</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Vincule ou simule visualizações de outros colaboradores</p>
            </header>

            <section className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-blue-600 pl-4">Simular como Gerente</h4>
                <div className="space-y-3">
                  {simGerentes.map(g => (
                    <button key={g.id} onClick={() => setSimulationProfile({ id: g.cod_cadrca, name: g.name, role: 'gerente' })} className={`w-full p-5 rounded-3xl border text-left flex items-center justify-between transition-all ${simulationProfile.id === g.cod_cadrca ? 'bg-blue-600 text-white border-blue-600' : (theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm')}`}>
                      <span className="text-[10px] font-black uppercase truncate">{g.name}</span>
                      {simulationProfile.id === g.cod_cadrca ? <UserCheck size={16} /> : <Plus size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-emerald-600 pl-4">Simular como Supervisor</h4>
                <div className="space-y-3">
                  {simSupervisores.slice(0, 5).map(s => (
                    <button key={s.id} onClick={() => setSimulationProfile({ id: s.cod_cadrca, name: s.name, role: 'supervisor' })} className={`w-full p-5 rounded-3xl border text-left flex items-center justify-between transition-all ${simulationProfile.id === s.cod_cadrca ? 'bg-emerald-600 text-white border-emerald-600' : (theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm')}`}>
                      <span className="text-[10px] font-black uppercase truncate">{s.name}</span>
                      {simulationProfile.id === s.cod_cadrca ? <UserCheck size={16} /> : <Plus size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSimulationProfile({ id: '300', name: 'SERGIO ARTHUR (MASTER)', role: 'gerente' })}
                className="w-full p-6 text-[10px] font-black uppercase tracking-widest border-2 border-slate-500/20 text-slate-500 rounded-[2rem]"
              >
                Resetar para Visualização Master
              </button>
            </section>
          </motion.main>
        )}

        {/* --- TELA: DASHBOARD (PADRÃO) --- */}
        {currentPage === 'dashboard' && (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* ... Conteúdo do Dashboard (Padrão: similar ao App anterior, mas adaptado para perspective/viewLevel) ... */}
            {viewLevel === 'gerente' && !selectedSupplier && (
              <main className="p-8 space-y-12">
                <header className="py-6">
                  <h2 className="text-4xl font-black uppercase tracking-tighter">Supervisores</h2>
                  <div className="h-1 w-12 bg-blue-600 rounded-full mt-3" />
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">{simulationProfile.name}</p>
                </header>
                <div className="space-y-5">
                  {supervisors.map((s) => (
                    <div key={s.id} onClick={() => loadVendorsList(s)} className={`p-7 rounded-[3rem] border-2 flex items-center justify-between cursor-pointer group transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-white/[0.02] border-white/5 hover:border-blue-500/30' : 'bg-white border-slate-200 shadow-md'}`}>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[2rem] bg-blue-600/10 flex items-center justify-center text-blue-600"><Briefcase size={28} /></div>
                        <div className="flex flex-col"><span className="text-base font-black uppercase tracking-tight">{s.name}</span><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.team} • Cód. {s.id}</span></div>
                      </div>
                      <ChevronRight size={20} className="text-slate-400" />
                    </div>
                  ))}
                </div>
              </main>
            )}

            {viewLevel === 'supervisor' && !selectedSupplier && (
              <main className="p-8 space-y-12">
                <header className="py-6">
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{selectedSupervisor?.name}</h2>
                  <div className="h-1 w-12 bg-emerald-500 rounded-full mt-3" />
                  <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-3">RCA Ativos</p>
                </header>
                <div className="space-y-5">
                  {vendorsOfSupervisor.map((v) => (
                    <div key={v.id} onClick={() => { setSelectedVendedorId(v.id); setViewLevel('vendedor'); loadAllData(false, v.id); }} className={`p-7 rounded-[3.5rem] border-2 flex items-center justify-between cursor-pointer group transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-md'}`}>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[2rem] bg-emerald-600/10 flex items-center justify-center text-emerald-500"><Users size={28} /></div>
                        <div className="flex flex-col"><span className="text-base font-black uppercase tracking-tight">{v.name}</span><span className="text-[10px] font-black uppercase text-emerald-500">Cód. {v.id}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </main>
            )}

            {viewLevel === 'vendedor' && !selectedSupplier && (
              <div className="space-y-8">
                <section className="relative w-full h-[400px] flex flex-col justify-end p-8 overflow-hidden rounded-b-[4rem] shadow-2xl">
                  <img src={vendorProfile} className="absolute inset-0 w-full h-full object-cover brightness-50" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-[#0F172A]' : 'from-slate-50'} via-transparent`} />
                  <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`relative p-8 rounded-[3.5rem] border backdrop-blur-3xl shadow-2xl ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white/70 border-white/40'}`}>
                    <h2 className="text-4xl font-black tracking-tighter leading-none uppercase">{stats.nome_vendedor}</h2>
                    <div className="flex items-center gap-5 mt-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <span>Cód.: <span className="text-blue-500">{stats.vendedor_id || simulationProfile.id}</span></span>
                      <div className="px-4 py-1.5 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20 uppercase">Vendedor</div>
                    </div>
                  </motion.div>
                </section>

                <main className="p-8 space-y-16">
                  <div className="grid grid-cols-3 gap-6">
                    {(['valor', 'positivacao', 'mix'] as const).map(tab => {
                      const isActive = perspective === tab;
                      const perc = tab === 'valor' ? stats.perc_venda_total : tab === 'positivacao' ? stats.perc_pos_total : stats.perc_mix_total;
                      const value = tab === 'valor' ? formatBRL(stats.valor_total).replace('R$', '').trim() : tab === 'positivacao' ? stats.positivacao : stats.mix;
                      const meta = tab === 'valor' ? formatBRL(stats.meta_valor_total).replace('R$', '').trim() : tab === 'positivacao' ? stats.meta_pos_total : stats.meta_mix_total;

                      return (
                        <button key={tab} onClick={() => setPerspective(prev => prev === tab ? null : tab)} className="flex flex-col items-center gap-5 group relative">
                          <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-slate-500 opacity-50'}`}>
                            {tab === 'positivacao' ? 'POSITIV.' : tab.toUpperCase()}
                          </span>
                          <div className={`w-full aspect-square rounded-[3.5rem] border-2 flex items-center justify-center transition-all relative overflow-hidden ${isActive ? 'bg-blue-600/10 border-blue-600 shadow-xl scale-105' : (theme === 'dark' ? 'bg-white/[0.03] border-white/5 opacity-60' : 'bg-white border-slate-200 shadow-lg opacity-60')}`}>
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="6" className={theme === 'dark' ? 'text-white/5' : 'text-slate-100'} />
                              <motion.circle
                                cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="6"
                                strokeDasharray="276.46"
                                initial={{ strokeDashoffset: 276.46 }}
                                animate={{ strokeDashoffset: 276.46 * (1 - Math.min((perc || 0) / 100, 1)) }}
                                strokeLinecap="round"
                                className={tab === 'valor' ? 'text-blue-600' : tab === 'positivacao' ? 'text-emerald-500' : 'text-amber-500'}
                              />
                            </svg>
                            <div className="flex flex-col items-center relative z-10">
                              <span className={`text-base font-black ${isActive ? (theme === 'dark' ? 'text-white' : 'text-blue-600') : 'text-slate-400'}`}>
                                {value}
                              </span>
                              <span className="text-[8px] font-black text-slate-500 opacity-60 mt-1 uppercase tracking-tighter">Meta: {meta}</span>
                            </div>
                            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-black text-white ${tab === 'valor' ? 'bg-blue-600' : tab === 'positivacao' ? 'bg-emerald-500' : 'bg-amber-500'} ${isActive ? 'scale-110' : 'opacity-50'}`}>
                              {perc}%
                            </div>
                          </div>
                          {isActive && <motion.div layoutId="dash-indicator" className="w-2 h-2 rounded-full bg-blue-600 absolute -bottom-4" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-5">
                    {suppliers.map(s => (
                      <div key={s.id} onClick={() => openSupplierAnalysis(s)} className={`p-8 rounded-[3.5rem] border-2 flex flex-col cursor-pointer group transition-all ${theme === 'dark' ? 'bg-white/[0.02] border-white/5 hover:border-blue-500/30' : 'bg-white border-slate-200 shadow-xl'}`}>
                        {/* HEADER DA LINHA: NOME + SETA */}
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-base font-black text-slate-400 uppercase tracking-tight leading-none">{s.nome_fornecedor}</span>
                          <ChevronRight size={24} className="text-blue-500" />
                        </div>

                        <div className="w-full">
                          {!perspective ? (
                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Venda</span>
                                  <span className="text-[11px] font-black text-blue-500">{Math.round(s.perc_venda)}%</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-sm font-black block leading-none">{formatBRL(s.valor).replace('R$', '').trim()}</span>
                                  <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-100'}`}>
                                    <div className="h-full bg-blue-600 shadow-sm" style={{ width: `${Math.min(s.perc_venda, 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-500 opacity-50 block pt-1">Meta: {formatBRL(s.meta_valor).replace('R$', '').trim()}</span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Pos.</span>
                                  <span className="text-[11px] font-black text-emerald-500">{Math.round(s.perc_pos)}%</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-sm font-black block leading-none">{s.positivados}</span>
                                  <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-100'}`}>
                                    <div className="h-full bg-emerald-500 shadow-sm" style={{ width: `${Math.min(s.perc_pos, 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-500 opacity-50 block pt-1">Meta: {s.meta_pos}</span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Mix</span>
                                  <span className="text-[11px] font-black text-amber-500">{Math.round(s.perc_mix)}%</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-sm font-black block leading-none">{s.mix}</span>
                                  <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-100'}`}>
                                    <div className="h-full bg-amber-500 shadow-sm" style={{ width: `${Math.min(s.perc_mix, 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-500 opacity-50 block pt-1">Meta: {s.meta_mix}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                    {perspective === 'valor' ? 'Venda' : perspective === 'positivacao' ? 'Positivação' : 'Mix'}
                                  </span>
                                  <span className="text-2xl font-black block text-blue-600 leading-none">
                                    {perspective === 'valor' ? formatBRL(s.valor).replace('R$', '').trim() : perspective === 'positivacao' ? s.positivados : s.mix}
                                  </span>
                                </div>
                                <span className="text-lg font-black text-blue-500/50">
                                  {Math.round(perspective === 'valor' ? s.perc_venda : perspective === 'positivacao' ? s.perc_pos : s.perc_mix)}%
                                </span>
                              </div>
                              <div className={`h-2.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-100'}`}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((perspective === 'valor' ? s.perc_venda : perspective === 'positivacao' ? s.perc_pos : s.perc_mix) ?? 0, 100)}%` }}
                                  className="h-full bg-blue-600 shadow-lg shadow-blue-600/40"
                                />
                              </div>
                              <span className="text-xs font-black text-slate-500 opacity-60 block">
                                Meta: {perspective === 'valor' ? formatBRL(s.meta_valor).replace('R$', '').trim() : perspective === 'positivacao' ? s.meta_pos : s.meta_mix}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </main>
              </div>
            )}

            {selectedSupplier && analysisData && (
              <div className="p-8 space-y-12 min-h-screen">
                {/* ... Continua mesma lógica de Drill-down com sortedList ... */}
                <header className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                        {perspective === 'positivacao' ? 'POSITIVAÇÃO' : perspective === 'mix' ? 'MIX DE PRODUTOS' : 'TOTAL VENDIDO'}
                      </h2>
                      <div className="flex flex-col">
                        <span className="text-4xl font-black text-blue-600 tracking-tighter leading-none">
                          {perspective === 'mix' ? (analysisData.header?.MIX || '0') : perspective === 'positivacao' ? (analysisData.header?.POSITIVACAO || '0') : formatBRL(selectedSupplier.valor)}
                        </span>
                        {(perspective === 'valor' || !perspective) && (
                          <span className="text-[11px] font-black text-emerald-500 mt-2">
                            {(selectedSupplier.perc_venda ?? 0)}% DA META ({formatBRL(selectedSupplier.meta_valor)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-blue-600/10" />
                        <circle cx="56" cy="56" r="48" fill="transparent" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray="301.6" strokeDashoffset={301.6 * (1 - ((perspective === 'valor' || !perspective ? (selectedSupplier.perc_venda ?? 0) : perspective === 'positivacao' ? (selectedSupplier.perc_pos ?? 0) : (selectedSupplier.perc_mix ?? 0)) / 100))} className="text-blue-600 filter drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-blue-600 leading-none">{(perspective === 'valor' || !perspective ? (selectedSupplier.perc_venda ?? 0) : perspective === 'positivacao' ? (selectedSupplier.perc_pos ?? 0) : (selectedSupplier.perc_mix ?? 0))}%</span>
                      </div>
                    </div>
                  </div>
                </header>

                <div className={`grid grid-cols-3 p-3 rounded-[3rem] border backdrop-blur-md ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
                  {(['valor', 'positivacao', 'mix'] as const).map(tab => {
                    const isActive = perspective === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => { setPerspective(tab); setExpandedClientId(null); setExpandedProductId(null); }}
                        className={`py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widst transition-all relative ${isActive ? 'text-white scale-105' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {isActive && <motion.div layoutId="drill-pill" className="absolute inset-0 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-600/40" />}
                        <span className="relative z-10">{tab === 'positivacao' ? 'POSITIV.' : tab.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center px-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {perspective === 'positivacao' ? 'Não positivados' : perspective === 'mix' ? 'Mix pendente' : 'Performance'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <SortAsc size={14} className="text-blue-500" />
                    <select
                      value={sortConfig.key}
                      onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value as any }))}
                      className={`text-[9px] font-black uppercase tracking-wider bg-transparent border-none focus:ring-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      <option value="value">Valor</option>
                      <option value="code">Código</option>
                      <option value="name">Descrição</option>
                    </select>
                    <button
                      onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                      className="p-1.5 rounded-lg bg-blue-600/10 text-blue-500"
                    >
                      {sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-6 pb-20 mt-4">
                  {sortedList.map((item: any) => (
                    <div key={item.id} className={`rounded-[3rem] border-2 overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
                      <div className="p-8 flex justify-between items-start">
                        <div className="space-y-1 text-left flex-1 pr-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase leading-tight">{item.id} - {item.cliente || item.produto}</span>
                          <div className="text-[10px] font-black text-slate-400 flex flex-col gap-0.5 mt-1">
                            {perspective === 'valor' ? (
                              <span>Positivados: <span className="text-blue-500">{item.positivados} CLIENTES</span></span>
                            ) : perspective === 'mix' ? (
                              <span>Estoque Disponível: <span className="text-amber-500">{item.estoque} UN</span></span>
                            ) : (
                              <span>Qtd. Mix Pendente: <span className="text-emerald-500">{item.qt_itens || 0} PROD.</span></span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right">
                          <span className={`text-xl font-black ${perspective === 'valor' ? 'text-emerald-500' : perspective === 'mix' ? 'text-blue-500' : 'text-slate-400'}`}>
                            {perspective === 'mix' ? `${item.qt_itens} CLIENTES` : formatBRL(item.total_historico || item.total)}
                          </span>
                          {perspective === 'valor' && <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Venda Total</span>}
                        </div>
                      </div>
                      <button
                        disabled={loadingItemsId === item.id}
                        onClick={() => {
                          if (perspective === 'valor') setExpandedClientId(expandedClientId === item.id ? null : item.id);
                          else if (perspective === 'positivacao') loadClientItems(item.id);
                          else if (perspective === 'mix') loadProductPrices(item.id);
                        }}
                        className={`w-full py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${(expandedClientId === item.id || expandedProductId === item.id) ? 'bg-blue-600 text-white shadow-lg' : 'bg-black/5 text-slate-400 hover:bg-black/10'
                          }`}
                      >
                        {loadingItemsId === item.id ? <Loader2 className="animate-spin" size={14} /> : ((expandedClientId === item.id || expandedProductId === item.id) ? 'Fechar' : perspective === 'valor' ? 'Ver Histórico de Clientes' : perspective === 'mix' ? 'Ver Tabela de Preços' : 'Ver Histórico de Itens')}
                      </button>

                      <AnimatePresence>
                        {(expandedClientId === item.id || expandedProductId === item.id) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={`overflow-hidden ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-50'}`}>
                            <div className="p-6 space-y-4">
                              {(perspective === 'mix' ? (productPrices[item.id] || []) : (perspective === 'positivacao' ? (clientItems[item.id] || []) : [])).map((detail: any, idx: number) => (
                                <div key={idx} className={`p-5 rounded-[1.5rem] border ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                  {/* ... existing detail content ... */}
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate mb-1">
                                    {perspective === 'mix' ? `REGIÃO: ${detail.REGIAO}` : `${detail.CODPROD || detail.id} - ${detail.DESCRICAO || detail.nome}`}
                                  </p>
                                  <div className="flex justify-between items-end">
                                    <div className="text-[10px] font-black text-slate-500 uppercase flex gap-x-3">
                                      {perspective === 'mix' ? (
                                        <span>Max Desc: {detail.PERDESCMAX}%</span>
                                      ) : (
                                        <>
                                          <span>Qtde: {detail.QT || detail.qtd} UN</span>
                                          <span className="text-slate-300 opacity-50">•</span>
                                          <span>{formatDate(detail.DTSAIDA || 'N/A')}</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-xs font-black text-blue-500">
                                        {formatBRL(detail.PVENDA1 || detail.PVENDA || detail.TOTAL || (detail.valor_unit * detail.qtd))}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {((perspective === 'mix' && productPrices[item.id]?.length === 0) ||
                                (perspective === 'positivacao' && clientItems[item.id]?.length === 0) ||
                                perspective === 'valor') && (
                                  <div className="text-center py-10 space-y-6">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                      <LayoutDashboard size={32} className="text-blue-500" />
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recurso em Desenvolvimento</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 px-6 leading-relaxed italic">
                                      Estamos trabalhando para trazer o detalhamento completo de clientes para este produto em tempo real.
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const btn = e.currentTarget;
                                        btn.innerHTML = "SOLICITAÇÃO ENVIADA! ✅";
                                        btn.classList.add("bg-emerald-500", "text-white");
                                        btn.classList.remove("bg-blue-600/10", "text-blue-500");
                                      }}
                                      className="px-6 py-3 rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                                    >
                                      Tenho Interesse
                                    </button>
                                  </div>
                                )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIXED FOOTER NAV */}
      <div className="fixed bottom-0 left-0 right-0 p-12 z-[110] pointer-events-none">
        <div className={`absolute inset-x-0 bottom-0 h-48 pointer-events-none transition-all duration-1000 ${theme === 'dark' ? 'bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent' : 'bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent'}`} />
        <nav className={`max-w-[360px] mx-auto pointer-events-auto p-3 rounded-[3.5rem] border-2 backdrop-blur-3xl flex shadow-2xl transition-all ${theme === 'dark' ? 'bg-[#1e293b]/70 border-white/10' : 'bg-white/95 border-slate-200'}`}>
          <button onClick={() => { setCurrentPage('dashboard'); setSelectedSupplier(null); setViewLevel(simulationProfile.role); }} className={`flex-1 py-5 flex items-center justify-center gap-3 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all ${currentPage === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
            <LayoutDashboard size={18} /> Dash
          </button>
          <button onClick={() => setCurrentPage('menu')} className={`flex-1 py-5 flex items-center justify-center gap-3 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all ${currentPage === 'menu' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
            <Grid size={18} /> Menu
          </button>
          <button onClick={handleGlobalSync} className="flex-1 py-5 text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3">
            <RefreshCw size={18} className={loading ? 'animate-spin text-blue-500' : ''} />
          </button>
        </nav>
      </div>
    </div>
  )
}

export default App
