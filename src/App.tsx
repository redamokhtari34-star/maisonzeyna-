import React, { useState, useEffect } from 'react';
import { Article, Rental, CashTransaction, Expense, Settings, DashboardStats, AlertData } from './types';
import CalendarComponent from './components/CalendarComponent';
import CatalogComponent from './components/CatalogComponent';
import RentalsComponent from './components/RentalsComponent';
import CashExpensesComponent from './components/CashExpensesComponent';
import { formatCurrency, formatDate } from './utils/format';

// Recharts for statistics
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

import { 
  TrendingUp, TrendingDown, Users, Package, AlertCircle, ShoppingBag, 
  Settings as SettingsIcon, Bell, Search, RefreshCw, Layers, Sparkles, BookOpen, Clock, Heart, X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'rentals' | 'catalog' | 'cash' | 'stats' | 'settings'>('dashboard');

  // Database core states
  const [articles, setArticles] = useState<Article[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>({
    id: 'default',
    categories: ['Robe de mariée', 'Robe de soirée', 'Kaftan', 'Collier', 'Couronne', 'Parure'],
    logo_url: '',
    store_name: 'Maison Zeyna'
  });

  // Derived / Dynamic states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    revenueToday: 840,
    revenueMonth: 12450,
    activeRentalsCount: 4,
    returnsTodayCount: 1,
    outingsTodayCount: 1,
    expensesMonth: 255,
    currentCashInRegister: 2480,
    treasuryBalance: 0
  });
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [statsData, setStatsData] = useState<any>({
    year: '2026',
    chartData: [],
    totalAnnual: 12450,
    totalRentals: 4,
    averageBasket: 310,
    evolution: 15
  });

  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Dashboard Modals
  const [dashboardModal, setDashboardModal] = useState<'ca_jour' | 'ca_mois' | 'locations_en_cours' | 'depenses_mois' | null>(null);
  const [targetRentalId, setTargetRentalId] = useState<string | null>(null);
  const [targetFilterType, setTargetFilterType] = useState<'all' | 'active' | 'returned' | 'late' | null>(null);
  const [expenseForm, setExpenseForm] = useState<{
    id?: string;
    category: string;
    amount: number;
    description: string;
    date: string;
    person: string;
    payment_source?: 'caisse' | 'tresorerie';
  } | null>(null);

  // Global search query
  const [globalSearch, setGlobalSearch] = useState('');
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState(false);

  // Quick reservation preselected date
  const [preselectedDateForRental, setPreselectedDateForRental] = useState<string | null>(null);

  // Load everything on start
  const fetchData = async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const [artRes, rentRes, cashRes, expRes, setRes, dashRes, alertRes, statRes] = await Promise.all([
        fetch('/api/articles').then(r => r.json()),
        fetch('/api/rentals').then(r => r.json()),
        fetch('/api/cash').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/alerts').then(r => r.json()),
        fetch('/api/statistics?year=2026').then(r => r.json())
      ]);

      setArticles(artRes);
      setRentals(rentRes);
      setTransactions(cashRes);
      setExpenses(expRes);
      if (setRes) setSettings(setRes);
      setDashboardStats(dashRes);
      setAlerts(alertRes);
      setStatsData(statRes);
    } catch (e) {
      console.error('Error fetching API data:', e);
      setErrorBanner('La connexion au serveur local a échoué. Mode local hors ligne actif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Helper to get article names from array or legacy ID fields
  const getArticleNames = (ids?: string[], fallbackId?: string) => {
    const list = ids && ids.length > 0 ? ids : (fallbackId ? [fallbackId] : []);
    return list.map(id => {
      const art = articles.find(a => a.id === id);
      return art ? art.name : `Réf: ${id.slice(0, 6)}`;
    }).join(', ');
  };

  // --- API Mutators ---

  const handleAddArticle = async (payload: any) => {
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('Article créé avec succès dans le catalogue !');
        fetchData();
      }
    } catch (e) {
      setErrorBanner('Erreur lors de la création de l\'article.');
    }
  };

  const handleUpdateArticle = async (id: string, payload: any) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('Article mis à jour avec succès.');
        fetchData();
      }
    } catch (e) {
      setErrorBanner('Erreur lors de la mise à jour.');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('Article supprimé du catalogue.');
        fetchData();
      }
    } catch (e) {
      setErrorBanner('Erreur lors de la suppression.');
    }
  };

  const handleAddRental = async (payload: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('Fiche de location client créée avec succès !');
        setPreselectedDateForRental(null);
        fetchData();
        return true;
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la création de la réservation.');
        return false;
      }
    } catch (e) {
      setErrorBanner('Erreur réseau lors de la réservation.');
      return false;
    }
  };

  const handleMarkReturned = async (id: string) => {
    try {
      const res = await fetch(`/api/rentals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_returned: true })
      });
      if (res.ok) {
        triggerToast('Retour enregistré. Caisse créditée du solde restant.');
        fetchData();
      }
    } catch (e) {
      setErrorBanner('Erreur lors du retour.');
    }
  };

  const handleDeleteRental = async (id: string) => {
    try {
      const res = await fetch(`/api/rentals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('Réservation annulée et supprimée.');
        fetchData();
      }
    } catch (e) {
      setErrorBanner('Erreur lors de la suppression de la location.');
    }
  };

  const handleUpdateRental = async (id: string, payload: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/rentals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('Fiche de location client mise à jour !');
        fetchData();
        return true;
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la modification de la réservation.');
        return false;
      }
    } catch (e) {
      setErrorBanner('Erreur lors de la mise à jour de la location.');
      return false;
    }
  };

  const handleAddTransaction = async (payload: any) => {
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('Opération financière de retrait enregistrée.');
        fetchData();
      }
    } catch (e) {
      setErrorBanner('Erreur lors de l\'enregistrement de retrait.');
    }
  };

  const handleAddExpense = async (payload: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('💰 Dépense de caisse enregistrée avec succès.');
        fetchData();
        return true;
      } else {
        const err = await res.json();
        console.error('Erreur lors de l\'enregistrement de la dépense:', err);
        alert(`❌ Échec de l'enregistrement de la dépense :\n${err.error || 'Erreur inconnue'}`);
        return false;
      }
    } catch (e: any) {
      console.error('Exception lors de l\'enregistrement de la dépense:', e);
      setErrorBanner(`Erreur de connexion lors de l'enregistrement : ${e.message || e}`);
      alert(`❌ Erreur de connexion lors de l'enregistrement de la dépense :\n${e.message || e}`);
      return false;
    }
  };

  const handleDeleteExpense = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('🗑️ Dépense supprimée et recréditée.');
        fetchData();
        return true;
      } else {
        const err = await res.json();
        console.error('Erreur lors de la suppression de la dépense:', err);
        alert(`❌ Échec de la suppression de la dépense :\n${err.error || 'Erreur inconnue'}`);
        return false;
      }
    } catch (e: any) {
      console.error('Exception lors de la suppression de la dépense:', e);
      setErrorBanner(`Erreur de connexion lors de la suppression : ${e.message || e}`);
      alert(`❌ Erreur de connexion lors de la suppression de la dépense :\n${e.message || e}`);
      return false;
    }
  };

  const handleUpdateExpense = async (id: string, payload: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('📝 Dépense mise à jour avec succès.');
        fetchData();
        return true;
      } else {
        const err = await res.json();
        console.error('Erreur lors de la modification de la dépense:', err);
        alert(`❌ Échec de la modification de la dépense :\n${err.error || 'Erreur inconnue'}`);
        return false;
      }
    } catch (e: any) {
      console.error('Exception lors de la modification de la dépense:', e);
      setErrorBanner(`Erreur de connexion lors de la modification : ${e.message || e}`);
      alert(`❌ Erreur de connexion lors de la modification de la dépense :\n${e.message || e}`);
      return false;
    }
  };

  const handleSaveSettings = async (payload: any) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast('Paramètres généraux de Maison Zeyna enregistrés !');
        fetchData();
      }
    } catch (e) {
      setErrorBanner('Erreur lors de la sauvegarde des paramètres.');
    }
  };

  // Filter rentals and articles based on Global search
  const getGlobalSearchResults = () => {
    if (!globalSearch.trim()) return { rentals: [], articles: [] };
    const query = globalSearch.toLowerCase();

    const matchedRentals = rentals.filter(r => 
      r.client_name.toLowerCase().includes(query) ||
      r.client_phone.includes(query) ||
      (r.client_instagram && r.client_instagram.toLowerCase().includes(query)) ||
      r.out_date.includes(query) ||
      r.return_date.includes(query)
    );

    const matchedArticles = articles.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.reference.toLowerCase().includes(query) ||
      (a.color && a.color.toLowerCase().includes(query))
    );

    return { rentals: matchedRentals, articles: matchedArticles };
  };

  const globalResults = getGlobalSearchResults();

  // Helper for quick actions
  const triggerQuickNewRental = (dateStr: string) => {
    setPreselectedDateForRental(dateStr);
    setActiveTab('rentals');
  };

  // Get count of outputs & returns today for notification highlights
  const outingsToday = alerts.filter(a => a.type === 'outing_today');
  const returnsToday = alerts.filter(a => a.type === 'return_today');

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F9F9F9] text-[#111111] overflow-x-hidden font-sans">
      
      {/* 1. Left Sidebar Navigation */}
      <nav className="w-full lg:w-[260px] bg-[#111111] lg:min-h-screen flex flex-col justify-between py-8 px-6 shadow-2xl z-20 shrink-0 text-white">
        <div>
          <div className="mb-10 text-center">
            <h1 className="text-[#D4AF37] font-display text-2xl tracking-widest uppercase font-bold">Maison Zeyna</h1>
            <p className="text-[9px] text-gray-500 tracking-[0.25em] mt-1.5 uppercase font-medium">Luxe, Location & Bijoux</p>
          </div>
          
          <div className="space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setShowGlobalSearchResults(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-gold-500 text-black font-extrabold shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">⬚</span> Tableau de bord
            </button>

            <button 
              onClick={() => { setActiveTab('calendar'); setShowGlobalSearchResults(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'calendar' 
                  ? 'bg-gold-500 text-black font-extrabold shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">📅</span> Calendrier
            </button>

            <button 
              onClick={() => { setActiveTab('rentals'); setShowGlobalSearchResults(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'rentals' 
                  ? 'bg-gold-500 text-black font-extrabold shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">👗</span> Locations ({rentals.filter(r => !r.is_returned).length})
            </button>

            <button 
              onClick={() => { setActiveTab('catalog'); setShowGlobalSearchResults(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'catalog' 
                  ? 'bg-gold-500 text-black font-extrabold shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">🛍️</span> Catalogue ({articles.length})
            </button>

            <button 
              onClick={() => { setActiveTab('cash'); setShowGlobalSearchResults(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'cash' 
                  ? 'bg-gold-500 text-black font-extrabold shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">👛</span> Caisse & Dépenses
            </button>

            <button 
              onClick={() => { setActiveTab('stats'); setShowGlobalSearchResults(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'stats' 
                  ? 'bg-gold-500 text-black font-extrabold shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">📊</span> Statistiques CA
            </button>

            <button 
              onClick={() => { setActiveTab('settings'); setShowGlobalSearchResults(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'settings' 
                  ? 'bg-gold-500 text-black font-extrabold shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">⚙️</span> Paramètres
            </button>
          </div>
        </div>

        {/* Database status widget */}
        <div className="space-y-4 mt-8">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Base de données</p>
              <button onClick={fetchData} className="text-gold-500 hover:text-white" title="Synchroniser">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-300"></div>
              <div>
                <p className="text-xs text-white font-semibold">Supabase connecté</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Tables & RLS Actifs</p>
              </div>
            </div>
          </div>
          
          <p className="text-center text-[9px] text-gray-500 uppercase">Maison Zeyna v1.0.8</p>
        </div>
      </nav>

      {/* 2. Main content container */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Header toolbar */}
        <header className="h-[90px] bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 shrink-0 z-10 gap-4">
          
          {/* Global search bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Recherche globale cliente, téléphone, référence..." 
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowGlobalSearchResults(e.target.value.length > 0);
              }}
              className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-full text-xs focus:outline-none focus:border-gold-500 focus:bg-white transition-all shadow-inner"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearch('');
                  setShowGlobalSearchResults(false);
                }}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-black p-0.5 rounded-full hover:bg-gray-200/50 transition-all z-10"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick info widgets */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="hidden sm:flex flex-col items-end border-r border-gray-200 pr-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">💰 Caisse</p>
              <p className="text-xs font-bold text-gray-950 font-mono">{formatCurrency(dashboardStats.currentCashInRegister)}</p>
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">💼 Trésorerie</p>
              <p className="text-xs font-bold text-gray-950 font-mono">{formatCurrency(dashboardStats.treasuryBalance)}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative p-2 hover:bg-gray-50 rounded-full transition-all cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <Bell className="w-5 h-5 text-gray-600" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </div>

              <div className="w-[42px] h-[42px] bg-[#111111] text-[#D4AF37] border border-gold-500/30 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-md">
                MZ
              </div>
            </div>
          </div>
        </header>

        {/* Real-time Alerts / Notification Banner */}
        {(outingsToday.length > 0 || returnsToday.length > 0) && (
          <div className="bg-gold-500 text-black px-6 py-3 font-semibold text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gold-600/30">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔔</span>
              <p>
                <span className="font-extrabold uppercase">Maison Zeyna :</span> Aujourd'hui, il y a{' '}
                <span className="underline font-bold">{outingsToday.length} sortie(s)</span> et{' '}
                <span className="underline font-bold">{returnsToday.length} retour(s)</span> prévus boutique.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 rounded text-[10px] font-bold uppercase tracking-wider"
            >
              Voir les fiches
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorBanner && (
          <div className="bg-red-500 text-white px-6 py-3.5 text-xs font-semibold flex justify-between items-center gap-4">
            <p className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorBanner}
            </p>
            <button onClick={() => setErrorBanner(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Main interactive area */}
        <div className="flex-1 p-6 lg:p-8 space-y-6">

          {/* Toast Notification popups */}
          {successToast && (
            <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border-l-4 border-gold-500 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
              <span className="text-gold-500 text-lg">💎</span>
              <div>
                <p className="text-xs font-bold uppercase text-gold-400">Confirmation</p>
                <p className="text-xs text-gray-200">{successToast}</p>
              </div>
            </div>
          )}

          {/* 3. Global search results view (overriding normal view if searching) */}
          {showGlobalSearchResults ? (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-gray-950">Résultats de la Recherche Globale</h2>
                  <p className="text-xs text-gray-500 mt-1">Recherche pour : "{globalSearch}"</p>
                </div>
                <button 
                  onClick={() => { setGlobalSearch(''); setShowGlobalSearchResults(false); }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg"
                >
                  Fermer
                </button>
              </div>

              {/* Matched Rentals */}
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Locations correspondantes ({globalResults.rentals.length})</h3>
                {globalResults.rentals.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Aucune fiche de location trouvée.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {globalResults.rentals.map(rental => (
                      <div 
                        key={rental.id} 
                        onClick={() => { setActiveTab('rentals'); setShowGlobalSearchResults(false); }}
                        className="p-4 bg-gray-50 hover:bg-gold-50/20 border border-gray-200/60 rounded-2xl cursor-pointer transition-all"
                      >
                        <p className="font-bold text-sm text-gray-900">{rental.client_name}</p>
                        <p className="text-xs text-gray-500">{rental.client_phone}</p>
                        <p className="text-xs text-gold-700 font-semibold mt-1">Sortie: {formatDate(rental.out_date)} | Retour: {formatDate(rental.return_date)}</p>
                        <p className="text-xs text-gray-700 mt-1">Total: {formatCurrency(rental.price)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Articles */}
              <div className="pt-4">
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Articles correspondants ({globalResults.articles.length})</h3>
                {globalResults.articles.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Aucun article trouvé dans le catalogue.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {globalResults.articles.map(art => (
                      <div 
                        key={art.id} 
                        onClick={() => { setActiveTab('catalog'); setShowGlobalSearchResults(false); }}
                        className="p-4 bg-gray-50 hover:bg-gold-50/20 border border-gray-200/60 rounded-2xl cursor-pointer transition-all flex gap-3 items-center"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                          <img src={art.image_url} alt={art.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-gray-900 line-clamp-1">{art.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{art.reference}</p>
                          <p className="text-xs text-gold-600 font-bold font-mono">{formatCurrency(art.rental_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            
            // 4. Tab router
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  
                  {/* Bento Grid layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Stat Card 1: CA Jour */}
                    <div 
                      onClick={() => setDashboardModal('ca_jour')}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-green-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest font-display">Chiffre d'affaires du jour</p>
                        <p className="text-2xl font-bold text-[#111111] mt-1 font-mono">{formatCurrency(dashboardStats.revenueToday)}</p>
                        <p className="text-[10px] text-green-600 font-semibold mt-1">Acomptes reçus aujourd'hui</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDashboardModal('ca_jour'); }}
                        className="w-11 h-11 bg-green-50 hover:bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-lg shadow-sm transition-colors"
                      >
                        📈
                      </button>
                    </div>

                    {/* Stat Card 2: CA Mois */}
                    <div 
                      onClick={() => setDashboardModal('ca_mois')}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-gold-200/60 flex items-center justify-between text-[#D4AF37] cursor-pointer hover:border-gold-400 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest font-display">Chiffre d'affaires mensuel</p>
                        <p className="text-2xl font-bold text-black mt-1 font-mono">{formatCurrency(dashboardStats.revenueMonth)}</p>
                        <p className="text-[10px] text-gold-600 font-semibold mt-1 font-sans">Cumulé sur Juillet 2026</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDashboardModal('ca_mois'); }}
                        className="w-11 h-11 bg-gold-50 hover:bg-gold-100 rounded-2xl flex items-center justify-center text-gold-500 text-lg shadow-sm transition-colors"
                      >
                        💎
                      </button>
                    </div>

                    {/* Stat Card 3: Locations en cours */}
                    <div 
                      onClick={() => setDashboardModal('locations_en_cours')}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest font-display">Locations en cours</p>
                        <p className="text-2xl font-bold text-[#111111] mt-1 font-mono">{dashboardStats.activeRentalsCount}</p>
                        <p className="text-[10px] text-orange-600 font-semibold mt-1">Vestiaires hors boutique</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDashboardModal('locations_en_cours'); }}
                        className="w-11 h-11 bg-orange-50 hover:bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-lg shadow-sm transition-colors"
                      >
                        👗
                      </button>
                    </div>

                    {/* Stat Card 4: Dépenses du mois */}
                    <div 
                      onClick={() => setDashboardModal('depenses_mois')}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-red-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest font-display">Dépenses du mois</p>
                        <p className="text-2xl font-bold text-[#111111] mt-1 font-mono">{formatCurrency(dashboardStats.expensesMonth)}</p>
                        <p className="text-[10px] text-red-500 font-semibold mt-1">Pressing & Entretien</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDashboardModal('depenses_mois'); }}
                        className="w-11 h-11 bg-red-50 hover:bg-red-100 rounded-2xl flex items-center justify-center text-red-500 text-lg shadow-sm transition-colors"
                      >
                        🧾
                      </button>
                    </div>
                  </div>

                  {/* Large Bento row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left: Quick Actions Box */}
                    <div className="lg:col-span-2 bg-[#111111] text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-gold-500/20">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-gold-400 font-display text-xl font-bold">Maison Zeyna – Système de Gestion de Luxe</h3>
                            <p className="text-gray-400 text-xs mt-1">Contrôlez les réservations, le catalogue et la caisse en temps réel.</p>
                          </div>
                          <span className="text-[10px] bg-gold-500 text-black px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold">Boutique</span>
                        </div>

                        {/* Store parameters info overlay */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Sorties aujourd'hui</p>
                            <p className="text-lg font-bold text-white mt-1 font-mono">{dashboardStats.outingsTodayCount} fiche(s)</p>
                          </div>
                          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Retours aujourd'hui</p>
                            <p className="text-lg font-bold text-white mt-1 font-mono">{dashboardStats.returnsTodayCount} fiche(s)</p>
                          </div>
                          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Solde Caisse Net</p>
                            <p className="text-lg font-bold text-gold-400 mt-1 font-mono">{formatCurrency(dashboardStats.currentCashInRegister)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                        <button 
                          onClick={() => triggerQuickNewRental('2026-07-08')}
                          className="py-3 px-4 bg-gold-500 hover:bg-gold-600 text-black rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          ➕ Créer Location
                        </button>
                        <button 
                          onClick={() => setActiveTab('cash')}
                          className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          💵 Vider la Caisse
                        </button>
                        <button 
                          onClick={() => setActiveTab('catalog')}
                          className="py-3 px-4 bg-[#222222] hover:bg-neutral-800 text-gold-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          👗 Catalogue
                        </button>
                      </div>
                    </div>

                    {/* Right: Real-time Alerts listing block */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#111111] mb-4 flex items-center justify-between">
                          <span>⚠️ Alertes d'activité</span>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{alerts.length}</span>
                        </h3>
                        
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {alerts.map((al) => {
                            let severityColor = 'bg-blue-50 border-blue-400 text-blue-900';
                            if (al.type === 'outing_today') severityColor = 'bg-orange-50 border-orange-400 text-orange-900';
                            if (al.type === 'late_return') severityColor = 'bg-red-50 border-red-400 text-red-900';
                            if (al.type === 'remaining_payment') severityColor = 'bg-amber-50 border-amber-400 text-amber-900';

                            return (
                              <div key={al.id} className={`p-3 border-l-4 rounded-xl text-xs flex flex-col justify-between ${severityColor}`}>
                                <div className="flex justify-between items-center mb-1">
                                  <p className="font-bold uppercase text-[9px]">{al.title}</p>
                                  <span className="text-[8px] font-mono opacity-60">{al.date}</span>
                                </div>
                                <p className="text-[11px] font-medium leading-relaxed">{al.description}</p>
                              </div>
                            );
                          })}

                          {alerts.length === 0 && (
                            <p className="text-xs text-gray-400 italic text-center py-6">Aucune alerte à signaler aujourd'hui.</p>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveTab('rentals')}
                        className="w-full text-center text-xs font-bold text-gold-600 hover:text-gold-700 mt-4 border-t border-gray-50 pt-3"
                      >
                        Consulter toutes les fiches clients →
                      </button>
                    </div>
                  </div>

                  {/* Calendar Widget integration for Bento Grid */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <CalendarComponent 
                      rentals={rentals}
                      articles={articles}
                      onAddRental={triggerQuickNewRental}
                      onViewRental={() => setActiveTab('rentals')}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <CalendarComponent 
                    rentals={rentals}
                    articles={articles}
                    onAddRental={triggerQuickNewRental}
                    onViewRental={() => setActiveTab('rentals')}
                  />
                </div>
              )}

              {activeTab === 'rentals' && (
                <RentalsComponent 
                  rentals={rentals}
                  articles={articles}
                  onAddRental={handleAddRental}
                  onUpdateRental={handleUpdateRental}
                  onMarkReturned={handleMarkReturned}
                  onDeleteRental={handleDeleteRental}
                  preselectedDate={preselectedDateForRental}
                  initialActiveDetailRentalId={targetRentalId}
                  onClearInitialActiveDetailRentalId={() => setTargetRentalId(null)}
                  initialFilterType={targetFilterType}
                  onClearInitialFilterType={() => setTargetFilterType(null)}
                />
              )}

              {activeTab === 'catalog' && (
                <CatalogComponent 
                  articles={articles}
                  rentals={rentals}
                  onAddArticle={handleAddArticle}
                  onUpdateArticle={handleUpdateArticle}
                  onDeleteArticle={handleDeleteArticle}
                />
              )}

              {activeTab === 'cash' && (
                <CashExpensesComponent 
                  transactions={transactions}
                  expenses={expenses}
                  currentCashInRegister={dashboardStats.currentCashInRegister}
                  treasuryBalance={dashboardStats.treasuryBalance}
                  onAddTransaction={handleAddTransaction}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'stats' && (
                <div className="space-y-6">
                  {/* Stats KPIs banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Chiffre d'affaires Annuel</span>
                      <p className="text-2xl font-bold font-mono text-black mt-1">{formatCurrency(statsData.totalAnnual)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Total Réservations</span>
                      <p className="text-2xl font-bold font-mono text-black mt-1">{statsData.totalRentals} fiches</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Panier Moyen</span>
                      <p className="text-2xl font-bold font-mono text-gold-600 mt-1">{formatCurrency(statsData.averageBasket)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-gold-200 bg-gold-50/10 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Évolution vs Mois précédent</span>
                      <p className="text-2xl font-bold font-mono text-green-600 mt-1">+{statsData.evolution} %</p>
                    </div>
                  </div>

                  {/* Recharts Bar and Area chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="font-display font-bold text-gray-950 text-base">Évolution des encaissements mensuels (DA)</h3>
                          <p className="text-xs text-gray-400 mt-1">Année {statsData.year}</p>
                        </div>
                        <select className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold">
                          <option>2026</option>
                          <option>2025</option>
                        </select>
                      </div>

                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={statsData.chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.6}/>
                                <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis 
                              stroke="#94a3b8" 
                              fontSize={10} 
                              tickLine={false} 
                              domain={[0, 350000]} 
                              tickFormatter={(val) => formatCurrency(val)}
                              width={85}
                            />
                            <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenus']} />
                            <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="font-display font-bold text-gray-950 text-base mb-6">Volume de locations</h3>
                      
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <Tooltip formatter={(value) => [value, 'Locations']} />
                            <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Store info forms */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-display font-bold text-gray-950 text-base">Configuration Générale</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nom de la boutique</label>
                        <input
                          type="text"
                          value={settings.store_name}
                          onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Logo officiel (URL)</label>
                        <input
                          type="url"
                          placeholder="Ex: https://maisonzeyna.com/logo.png"
                          value={settings.logo_url}
                          onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Catégories de robes & bijoux autorisées</label>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {settings.categories.map((cat, idx) => (
                            <span key={idx} className="bg-gold-100 text-gold-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSaveSettings(settings)}
                        className="w-full py-3 bg-[#111111] hover:bg-gold-500 hover:text-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Sauvegarder les paramètres
                      </button>
                    </div>
                  </div>

                  {/* Supabase developer integration assistant */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-display font-bold text-gray-950 text-base flex items-center gap-1.5">
                      <span>⚡ Assistant Supabase Live</span>
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      L'application est entièrement prête pour la production. Pour connecter votre base de données Supabase cloud définitive, configurez simplement les clés dans votre panneau de Secrets :
                    </p>

                    <div className="bg-neutral-950 text-white p-4 rounded-2xl font-mono text-[10px] space-y-2 overflow-x-auto">
                      <p className="text-[#D4AF37]"># Variables d'environnement à configurer :</p>
                      <p>VITE_SUPABASE_URL="https://your-project.supabase.co"</p>
                      <p>VITE_SUPABASE_ANON_KEY="your-anon-key"</p>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
                      <p className="font-bold text-amber-900 flex items-center gap-1.5">
                        <span>💡 Astuce d'intégration</span>
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        Copiez le fichier de structure <code className="bg-white px-1.5 py-0.5 rounded border font-mono">/supabase_schema.sql</code> disponible dans la racine de votre espace et exécutez-le dans l'éditeur SQL de votre console Supabase. Toutes les tables seront créées avec leurs politiques d'accès (RLS) !
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals overlays for dashboard cards */}
        {dashboardModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              
              {/* MODAL 1: CA JOUR */}
              {dashboardModal === 'ca_jour' && (() => {
                const rentalsToday = rentals.filter(r => r.out_date === '2026-07-08');
                const allEntreesToday = transactions.filter(t => t.date === '2026-07-08' && t.type === 'entree');
                const totalEntreesToday = allEntreesToday.reduce((sum, t) => sum + t.amount, 0);

                const clientsInvolved = Array.from(new Set([
                  ...rentalsToday.map(r => r.client_name),
                  ...allEntreesToday.map(t => t.person)
                ]));

                return (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                      <div>
                        <h3 className="font-display font-bold text-gray-950 text-lg flex items-center gap-2">
                          <span className="text-xl">📈</span> Chiffre d'affaires du jour (08 Juillet 2026)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Toutes les locations du jour, acomptes encaissés et clients concernés.
                        </p>
                      </div>
                      <button 
                        onClick={() => setDashboardModal(null)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-6">
                      {/* KPI Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                          <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Encaissé Réel</p>
                          <p className="text-2xl font-bold font-mono text-emerald-950 mt-1">{formatCurrency(totalEntreesToday)}</p>
                          <p className="text-[10px] text-emerald-600 mt-1">Acomptes & paiements physiques reçus</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                          <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Contrats Actifs du Jour</p>
                          <p className="text-2xl font-bold font-mono text-blue-950 mt-1">{rentalsToday.length} contrats</p>
                          <p className="text-[10px] text-blue-600 mt-1">Nouveaux départs aujourd'hui</p>
                        </div>
                        <div className="bg-gold-50 border border-gold-100 p-4 rounded-2xl">
                          <p className="text-[10px] text-gold-800 font-bold uppercase tracking-wider">Clientes Concernées</p>
                          <p className="text-2xl font-bold font-mono text-gold-950 mt-1">{clientsInvolved.length} clientes</p>
                          <p className="text-[10px] text-gold-600 mt-1">Enregistrées en magasin</p>
                        </div>
                      </div>

                      {/* Clientes List */}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Clientes concernées</h4>
                        <div className="flex flex-wrap gap-2">
                          {clientsInvolved.map((c, idx) => {
                            const matchingRental = rentals.find(r => r.client_name === c);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (matchingRental) {
                                    setActiveTab('rentals');
                                    setTargetRentalId(matchingRental.id);
                                    setDashboardModal(null);
                                  } else {
                                    triggerToast(`Pas de fiche de location active pour ${c}`);
                                  }
                                }}
                                className="bg-white hover:bg-gold-500 hover:text-black hover:border-gold-500 text-xs px-3 py-1.5 rounded-xl border border-gray-200 font-medium transition-all flex items-center gap-1.5"
                              >
                                👤 {c} {matchingRental && <span className="text-[9px] font-mono opacity-60">→ Ouvrir Fiche</span>}
                              </button>
                            );
                          })}
                          {clientsInvolved.length === 0 && (
                            <p className="text-xs text-gray-400 italic">Aucune cliente enregistrée aujourd'hui.</p>
                          )}
                        </div>
                      </div>

                      {/* Rentals table */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                          👗 Locations du jour ({rentalsToday.length})
                        </h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 uppercase font-semibold text-[10px] border-b border-gray-100">
                                <th className="p-3">Cliente</th>
                                <th className="p-3">Robes & Accessoires</th>
                                <th className="p-3 text-right">Prix Total</th>
                                <th className="p-3 text-right">Acompte payé</th>
                                <th className="p-3 text-right">Reste à régler</th>
                                <th className="p-3 text-center">Fiche</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {rentalsToday.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-semibold text-gray-900">{r.client_name}</td>
                                  <td className="p-3 text-gray-600">{getArticleNames(r.dress_ids, r.dress_id)}</td>
                                  <td className="p-3 text-right font-mono font-bold text-gray-900">{formatCurrency(r.price)}</td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(r.deposit_paid)}</td>
                                  <td className="p-3 text-right font-mono font-bold text-red-500">{formatCurrency(r.remaining_to_pay)}</td>
                                  <td className="p-3 text-center">
                                    <button 
                                      onClick={() => {
                                        setActiveTab('rentals');
                                        setTargetRentalId(r.id);
                                        setDashboardModal(null);
                                      }}
                                      className="px-2.5 py-1 bg-neutral-900 hover:bg-gold-500 hover:text-black text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all"
                                    >
                                      Ouvrir
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {rentalsToday.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="p-4 text-center text-gray-400 italic">Aucune location initiée ce jour.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Cash entrees list */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                          💵 Acomptes & Règlements encaissés ({allEntreesToday.length})
                        </h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 uppercase font-semibold text-[10px] border-b border-gray-100">
                                <th className="p-3">Heure</th>
                                <th className="p-3">Personne</th>
                                <th className="p-3">Motif de règlement</th>
                                <th className="p-3 text-right">Montant encaissé</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {allEntreesToday.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-mono text-gray-400">{t.time}</td>
                                  <td className="p-3 font-semibold text-gray-900">{t.person}</td>
                                  <td className="p-3 text-gray-600">{t.reason}</td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-600">+{formatCurrency(t.amount)}</td>
                                </tr>
                              ))}
                              {allEntreesToday.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-gray-400 italic">Aucune transaction d'encaissement aujourd'hui.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* MODAL 2: CA MOIS */}
              {dashboardModal === 'ca_mois' && (() => {
                const transactionsMonth = transactions.filter(t => t.type === 'entree' && t.date.startsWith('2026-07'));
                const rentalsMonth = rentals.filter(r => r.out_date.startsWith('2026-07'));
                const totalRevenueMonth = transactionsMonth.reduce((sum, t) => sum + t.amount, 0);
                const countRentalsMonth = rentalsMonth.length;
                const totalContractsMonth = rentalsMonth.reduce((sum, r) => sum + r.price, 0);
                const averageBasketMonth = countRentalsMonth > 0 ? Math.round(totalContractsMonth / countRentalsMonth) : 0;

                const weeklyRevenue = [
                  { name: 'S1 (01-07)', start: '2026-07-01', end: '2026-07-07', amount: 0 },
                  { name: 'S2 (08-14)', start: '2026-07-08', end: '2026-07-14', amount: 0 },
                  { name: 'S3 (15-21)', start: '2026-07-15', end: '2026-07-21', amount: 0 },
                  { name: 'S4 (22-31)', start: '2026-07-22', end: '2026-07-31', amount: 0 },
                ];
                weeklyRevenue.forEach(w => {
                  w.amount = transactionsMonth
                    .filter(t => t.date >= w.start && t.date <= w.end)
                    .reduce((sum, t) => sum + t.amount, 0);
                });

                return (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                      <div>
                        <h3 className="font-display font-bold text-gray-950 text-lg flex items-center gap-2">
                          <span className="text-xl">💎</span> Chiffre d'affaires mensuel (Juillet 2026)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Indicateurs de performance, volume de ventes, panier moyen et graphique d'évolution hebdomadaire.
                        </p>
                      </div>
                      <button 
                        onClick={() => setDashboardModal(null)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-6">
                      {/* KPIs Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CA Réel Encaissé</p>
                          <p className="text-xl font-bold font-mono text-[#111111] mt-1">{formatCurrency(totalRevenueMonth)}</p>
                          <p className="text-[9px] text-green-600 mt-1">Liquide réel reçu</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Valeur Contrats Signés</p>
                          <p className="text-xl font-bold font-mono text-[#111111] mt-1">{formatCurrency(totalContractsMonth)}</p>
                          <p className="text-[9px] text-gold-600 mt-1">Volume engagé ce mois</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nombre de Locations</p>
                          <p className="text-xl font-bold font-mono text-gold-600 mt-1">{countRentalsMonth} fiches</p>
                          <p className="text-[9px] text-gray-500 mt-1">Nombre de réservations</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Panier moyen</p>
                          <p className="text-xl font-bold font-mono text-gold-600 mt-1">{formatCurrency(averageBasketMonth)}</p>
                          <p className="text-[9px] text-gray-500 mt-1">Moyenne par contrat</p>
                        </div>
                      </div>

                      {/* Weekly Breakdown and Chart */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Weekly List */}
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Évolution par semaine</h4>
                          <div className="space-y-3">
                            {weeklyRevenue.map((w, idx) => (
                              <div key={idx} className="bg-white p-3.5 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{w.name}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Période : {w.start.split('-')[2]}/{w.start.split('-')[1]} au {w.end.split('-')[2]}/{w.end.split('-')[1]}</p>
                                </div>
                                <span className="font-mono font-bold text-gold-600 text-sm">{formatCurrency(w.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between shadow-sm">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Graphique des encaissements (DA)</h4>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={weeklyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} tickFormatter={(v) => `${v}`} />
                                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Encaissé']} />
                                <Bar dataKey="amount" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* MODAL 3: LOCATIONS EN COURS */}
              {dashboardModal === 'locations_en_cours' && (() => {
                const activeRentals = rentals.filter(r => !r.is_returned);

                return (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                      <div>
                        <h3 className="font-display font-bold text-gray-950 text-lg flex items-center gap-2">
                          <span className="text-xl">👗</span> Locations actuellement en cours ({activeRentals.length})
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Toutes les fiches clients actives pour les robes et bijoux actuellement sortis de la boutique.
                        </p>
                      </div>
                      <button 
                        onClick={() => setDashboardModal(null)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-4">
                      <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 uppercase font-semibold text-[10px] border-b border-gray-100">
                              <th className="p-3.5">Cliente</th>
                              <th className="p-3.5">Robes louées</th>
                              <th className="p-3.5">Bijoux loués</th>
                              <th className="p-3.5">Date sortie</th>
                              <th className="p-3.5">Retour prévu</th>
                              <th className="p-3.5">Reste à payer</th>
                              <th className="p-3.5">Statut</th>
                              <th className="p-3.5 text-center">Fiche</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {activeRentals.map(r => {
                              const isOverdue = new Date(r.return_date) < new Date('2026-07-08');
                              return (
                                <tr key={r.id} className="hover:bg-gray-50/50">
                                  <td className="p-3.5">
                                    <p className="font-bold text-gray-900">{r.client_name}</p>
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{r.client_phone}</p>
                                  </td>
                                  <td className="p-3.5 max-w-[150px] truncate font-medium text-gray-700">
                                    {getArticleNames(r.dress_ids, r.dress_id) || <span className="text-gray-300 italic">Aucune</span>}
                                  </td>
                                  <td className="p-3.5 max-w-[150px] truncate text-gray-600">
                                    {getArticleNames(r.jewelry_ids, r.jewelry_id) || <span className="text-gray-300 italic">Aucun</span>}
                                  </td>
                                  <td className="p-3.5 font-mono text-gray-600">{formatDate(r.out_date)}</td>
                                  <td className="p-3.5 font-mono text-gray-600">{formatDate(r.return_date)}</td>
                                  <td className="p-3.5">
                                    <span className={`font-bold font-mono text-xs ${r.remaining_to_pay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatCurrency(r.remaining_to_pay)}
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      isOverdue 
                                        ? 'bg-red-50 text-red-700 border border-red-200' 
                                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                                    }`}>
                                      {isOverdue ? '⚠️ En retard' : '👗 Sortie'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <button 
                                      onClick={() => {
                                        setActiveTab('rentals');
                                        setTargetRentalId(r.id);
                                        setTargetFilterType('active');
                                        setDashboardModal(null);
                                      }}
                                      className="px-3 py-1.5 bg-neutral-900 hover:bg-gold-500 hover:text-black text-white text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all"
                                    >
                                      Ouvrir
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {activeRentals.length === 0 && (
                              <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-400 italic">Aucune location en cours actuellement.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* MODAL 4: DEPENSES DU MOIS */}
              {dashboardModal === 'depenses_mois' && (() => {
                const julyExpenses = expenses.filter(e => e.date.startsWith('2026-07'));
                const totalExpenses = julyExpenses.reduce((sum, e) => sum + e.amount, 0);

                const categories = ['Pressing', 'Entretien', 'Achat Robe', 'Marketing', 'Boutique', 'Autre'];

                const categoryTotals = julyExpenses.reduce((acc, exp) => {
                  const cat = exp.category || 'Autre';
                  acc[cat] = (acc[cat] || 0) + exp.amount;
                  return acc;
                }, {} as Record<string, number>);

                return (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                      <div>
                        <h3 className="font-display font-bold text-gray-950 text-lg flex items-center gap-2">
                          <span className="text-xl">🧾</span> Dépenses du mois (Juillet 2026)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Suivi et modification de toutes les dépenses, pressing, entretien et fournitures de la boutique.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setDashboardModal(null);
                          setExpenseForm(null);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-6">
                      {/* KPI card & Category list */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                          <div>
                            <p className="text-[10px] text-red-800 font-bold uppercase tracking-wider">Total dépenses du mois</p>
                            <p className="text-3xl font-bold font-mono text-red-950 mt-1">{formatCurrency(totalExpenses)}</p>
                          </div>
                          <button
                            onClick={() => setExpenseForm({ category: 'Pressing', amount: 0, description: '', date: '2026-07-08', person: 'Gérante', payment_source: 'caisse' })}
                            className="mt-6 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                          >
                            ➕ Enregistrer une dépense
                          </button>
                        </div>

                        <div className="md:col-span-2 bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Total par catégorie</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {categories.map((cat, idx) => {
                              const val = categoryTotals[cat] || 0;
                              const percent = totalExpenses > 0 ? Math.round((val / totalExpenses) * 100) : 0;
                              return (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">{cat}</p>
                                  <div className="flex justify-between items-baseline mt-1">
                                    <p className="text-sm font-mono font-bold text-gray-900">{formatCurrency(val)}</p>
                                    <span className="text-[10px] text-gray-500 font-bold font-mono">{percent}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Expenses List */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Liste détaillée</h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 uppercase font-semibold text-[10px] border-b border-gray-100">
                                <th className="p-3">Date</th>
                                <th className="p-3">Catégorie</th>
                                <th className="p-3">Source</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Payeur</th>
                                <th className="p-3 text-right">Montant</th>
                                <th className="p-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {julyExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-mono text-gray-500">{formatDate(exp.date)}</td>
                                  <td className="p-3">
                                    <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      {exp.category}
                                    </span>
                                  </td>
                                  <td className="p-3 text-xs">
                                    {exp.payment_source === 'tresorerie' ? (
                                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                        💼 Trésor.
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                        💰 Caisse
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-gray-700 font-medium">{exp.description}</td>
                                  <td className="p-3 text-gray-500">{exp.person}</td>
                                  <td className="p-3 text-right font-mono font-bold text-red-600">-{formatCurrency(exp.amount)}</td>
                                  <td className="p-3 text-center space-x-1">
                                    <button
                                      onClick={() => setExpenseForm({
                                        id: exp.id,
                                        category: exp.category,
                                        amount: exp.amount,
                                        description: exp.description,
                                        date: exp.date,
                                        person: exp.person,
                                        payment_source: exp.payment_source || 'caisse'
                                      })}
                                      className="px-2 py-1 bg-gray-100 hover:bg-neutral-900 hover:text-white text-gray-700 text-[10px] font-bold rounded uppercase tracking-wider transition-all"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
                                          handleDeleteExpense(exp.id);
                                        }
                                      }}
                                      className="px-2 py-1 bg-gray-100 hover:bg-red-600 hover:text-white text-red-600 text-[10px] font-bold rounded uppercase tracking-wider transition-all"
                                    >
                                      Supprimer
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {julyExpenses.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="p-4 text-center text-gray-400 italic">Aucune dépense enregistrée ce mois-ci.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* Modal form for adding / modifying expenses */}
        {expenseForm && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-[#111111] text-base">
                  {expenseForm.id ? '📝 Modifier la dépense' : '➕ Enregistrer une dépense'}
                </h3>
                <button 
                  onClick={() => setExpenseForm(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Catégorie</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="Pressing">Pressing</option>
                    <option value="Entretien">Entretien</option>
                    <option value="Achat Robe">Achat Robe</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Boutique">Boutique</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Montant (DA)</label>
                  <input
                    type="number"
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    placeholder="Ex: 500"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Description / Motif</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="Ex: Nettoyage à sec robe"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Auteur du paiement</label>
                  <input
                    type="text"
                    value={expenseForm.person}
                    onChange={(e) => setExpenseForm({ ...expenseForm, person: e.target.value })}
                    placeholder="Ex: Gérante"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Source de paiement *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExpenseForm({ ...expenseForm, payment_source: 'caisse' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        (expenseForm.payment_source || 'caisse') === 'caisse'
                          ? 'bg-[#111111] border-[#111111] text-white shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      💰 Caisse ({formatCurrency(dashboardStats.currentCashInRegister)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseForm({ ...expenseForm, payment_source: 'tresorerie' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        expenseForm.payment_source === 'tresorerie'
                          ? 'bg-[#111111] border-[#111111] text-white shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      💼 Trésorerie ({formatCurrency(dashboardStats.treasuryBalance)})
                    </button>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!expenseForm.amount || !expenseForm.description) {
                      alert('Veuillez remplir le montant et la description de la dépense.');
                      return;
                    }
                    let success = false;
                    if (expenseForm.id) {
                      success = await handleUpdateExpense(expenseForm.id, expenseForm);
                    } else {
                      success = await handleAddExpense(expenseForm);
                    }
                    if (success) {
                      setExpenseForm(null);
                    }
                  }}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all mt-4"
                >
                  {expenseForm.id ? '💾 Mettre à jour' : '💾 Enregistrer la dépense'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info bar */}
        <footer className="h-[50px] bg-white border-t border-gray-100 px-6 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider shrink-0">
          <p>© 2026 Maison Zeyna Luxe & Location. Tous droits réservés.</p>
          <p className="hidden sm:inline">Dernière synchronisation : En temps réel (Supabase Cloud + Local SQLite Fallback)</p>
        </footer>
      </main>
    </div>
  );
}
