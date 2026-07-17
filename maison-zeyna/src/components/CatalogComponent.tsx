import React, { useState } from 'react';
import { Article, Rental } from '../types';
import { 
  Tag, Search, Filter, Plus, Edit2, Trash2, CheckCircle, XCircle, Info, Sparkles, X, 
  Palette, Ruler, ShieldCheck, Camera, FileText, DollarSign, Activity, Eye, HelpCircle, ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { isArticleCurrentlyRented } from '../utils/availability';

interface CatalogComponentProps {
  articles: Article[];
  rentals: Rental[];
  onAddArticle: (article: Omit<Article, 'id' | 'created_at'>) => void;
  onUpdateArticle: (id: string, article: Partial<Article>) => void;
  onDeleteArticle: (id: string) => void;
}

export default function CatalogComponent({ articles, rentals, onAddArticle, onUpdateArticle, onDeleteArticle }: CatalogComponentProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'robe' | 'bijou'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all'); // all, disponible, loue
  
  // Create / Edit article form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  // Custom delete confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formCategory, setFormCategory] = useState<'robe' | 'bijou'>('robe');
  const [formColor, setFormColor] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formRentalPrice, setFormRentalPrice] = useState<number>(150);
  const [formDeposit, setFormDeposit] = useState<number>(300);
  const [formState, setFormState] = useState<'excellent' | 'tres_bon' | 'bon' | 'use'>('excellent');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("L'image choisie est trop grande. Veuillez choisir une image de moins de 10 Mo.");
      return;
    }

    // Convert to base64 for immediate preview and upload
    const reader = new FileReader();
    reader.onloadstart = () => {
      setIsUploading(true);
    };
    reader.onload = async () => {
      const base64 = reader.result as string;
      setFormImageUrl(base64); // Show immediate local preview

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileData: base64,
            fileName: file.name,
            fileType: file.type
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            setFormImageUrl(data.imageUrl); // Save URL
          }
        } else {
          console.error("Failed to upload image to server, keeping local preview");
        }
      } catch (uploadErr) {
        console.error("Image upload exception:", uploadErr);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };
  
  // Active tab in slide-over form (to keep details clean and organized)
  const [formTab, setFormTab] = useState<'general' | 'specs' | 'pricing' | 'media'>('general');

  const openAddForm = () => {
    setEditingArticle(null);
    setFormName('');
    setFormReference(`REF-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory('robe');
    setFormColor('');
    setFormSize('');
    setFormRentalPrice(25000); // realistic default in DA
    setFormDeposit(15000);
    setFormState('excellent');
    setFormImageUrl('');
    setFormNotes('');
    setFormTab('general');
    setIsFormOpen(true);
  };

  const openEditForm = (article: Article) => {
    setEditingArticle(article);
    setFormName(article.name);
    setFormReference(article.reference);
    setFormCategory(article.category);
    setFormColor(article.color || '');
    setFormSize(article.size || '');
    setFormRentalPrice(article.rental_price);
    setFormDeposit(article.deposit);
    setFormState(article.state);
    setFormImageUrl(article.image_url || '');
    setFormNotes(article.notes || '');
    setFormTab('general');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formReference) {
      alert('Veuillez remplir le nom de l\'article et sa référence.');
      return;
    }

    const defaultDressImg = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80';
    const defaultBijouImg = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80';

    const payload = {
      name: formName,
      reference: formReference,
      category: formCategory,
      color: formColor,
      size: formSize,
      rental_price: Number(formRentalPrice),
      deposit: Number(formDeposit),
      state: formState,
      image_url: formImageUrl || (formCategory === 'robe' ? defaultDressImg : defaultBijouImg),
      notes: formNotes,
      status: editingArticle ? editingArticle.status : 'disponible' as 'disponible' | 'loue'
    };

    if (editingArticle) {
      onUpdateArticle(editingArticle.id, payload);
    } else {
      onAddArticle(payload);
    }
    setIsFormOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterColor('all');
    setFilterSize('all');
    setFilterState('all');
    setFilterAvailability('all');
  };

  const hasActiveFilters = searchQuery !== '' || filterColor !== 'all' || filterSize !== 'all' || filterState !== 'all' || filterAvailability !== 'all';

  // Extract unique filter lists
  const colors = Array.from(new Set(articles.map(a => a.color).filter(Boolean)));
  const sizes = Array.from(new Set(articles.map(a => a.size).filter(Boolean)));

  // Filter logic
  const filteredArticles = articles.filter(a => {
    const matchesCategory = activeCategory === 'all' || a.category === activeCategory;
    const matchesSearch = 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.color && a.color.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.size && a.size.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesColor = filterColor === 'all' || a.color === filterColor;
    const matchesSize = filterSize === 'all' || a.size === filterSize;
    const matchesState = filterState === 'all' || a.state === filterState;
    
    const isRented = isArticleCurrentlyRented(a.id, rentals);
    const matchesAvail = 
      filterAvailability === 'all' || 
      (filterAvailability === 'disponible' && !isRented) ||
      (filterAvailability === 'loue' && isRented);

    return matchesCategory && matchesSearch && matchesColor && matchesSize && matchesState && matchesAvail;
  });

  // Count Stats
  const totalCount = articles.length;
  const robesCount = articles.filter(a => a.category === 'robe').length;
  const bijouxCount = articles.filter(a => a.category === 'bijou').length;
  const availableCount = articles.filter(a => !isArticleCurrentlyRented(a.id, rentals)).length;
  const rentedCount = articles.filter(a => isArticleCurrentlyRented(a.id, rentals)).length;

  const getFrenchState = (s: string) => {
    switch (s) {
      case 'excellent': return 'Excellent état';
      case 'tres_bon': return 'Très bon état';
      case 'bon': return 'Bon état';
      case 'use': return 'État d\'usage';
      default: return s;
    }
  };

  const getStateColor = (s: string) => {
    switch (s) {
      case 'excellent': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'tres_bon': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'bon': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'use': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div id="catalog-section" className="space-y-6">
      
      {/* Premium Header and Overview Cards */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 rounded-3xl p-6 text-white border border-neutral-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Collection Maison Zeyna
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight text-neutral-50">
              Catalogue de Stock Premium
            </h2>
            <p className="text-xs text-neutral-400 max-w-xl">
              Gérez, suivez et louez vos plus beaux Caftans de Haute Couture algerienne et parures précieuses au showroom.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="self-start lg:self-center flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Nouvel Article
          </button>
        </div>

        {/* Mini stats embedded for a luxury dash feel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Collection</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-neutral-50">{totalCount}</span>
              <span className="text-xs text-neutral-500">modèles</span>
            </div>
          </div>
          <div className="space-y-1 border-l border-white/5 pl-4">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Robes & Caftans</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-300">{robesCount}</span>
              <span className="text-xs text-neutral-500">pièces</span>
            </div>
          </div>
          <div className="space-y-1 border-l border-white/5 pl-4">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Bijoux Précieux</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-300">{bijouxCount}</span>
              <span className="text-xs text-neutral-500">parures</span>
            </div>
          </div>
          <div className="space-y-1 border-l border-white/5 pl-4">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Statut Disponible</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">{availableCount}</span>
              <span className="text-xs text-neutral-500">prêts ({rentedCount} loués)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tabs & Filters Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm space-y-4">
        
        {/* Category filters */}
        <div className="flex justify-between items-center border-b border-neutral-100 pb-3 flex-wrap gap-3">
          <div className="flex overflow-x-auto gap-1.5 scrollbar-thin">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeCategory === 'all' 
                  ? 'bg-neutral-900 text-amber-400 shadow-sm' 
                  : 'bg-neutral-50 text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Tous ({articles.length})
            </button>
            <button
              onClick={() => setActiveCategory('robe')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                activeCategory === 'robe' 
                  ? 'bg-neutral-900 text-amber-400 shadow-sm' 
                  : 'bg-neutral-50 text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>👗</span> Robes & Caftans ({articles.filter(a => a.category === 'robe').length})
            </button>
            <button
              onClick={() => setActiveCategory('bijou')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                activeCategory === 'bijou' 
                  ? 'bg-neutral-900 text-amber-400 shadow-sm' 
                  : 'bg-neutral-50 text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>💎</span> Bijoux & Parures ({articles.filter(a => a.category === 'bijou').length})
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all"
            >
              <X className="w-3.5 h-3.5" /> Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Detailed inputs filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search bar */}
          <div className="relative lg:col-span-1.5 col-span-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher (Nom, ref, couleur, taille)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-neutral-200/70 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-800 p-0.5 rounded-full hover:bg-neutral-200 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Color filter */}
          <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 rounded-xl">
            <Palette className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="bg-transparent border-none text-xs w-full focus:outline-none text-neutral-700 cursor-pointer"
            >
              <option value="all">Couleurs (Toutes)</option>
              {colors.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Size filter */}
          <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 rounded-xl">
            <Ruler className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="bg-transparent border-none text-xs w-full focus:outline-none text-neutral-700 cursor-pointer"
            >
              <option value="all">Tailles (Toutes)</option>
              {sizes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* State/Condition filter */}
          <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="bg-transparent border-none text-xs w-full focus:outline-none text-neutral-700 cursor-pointer"
            >
              <option value="all">États (Tous)</option>
              <option value="excellent">Excellent état</option>
              <option value="tres_bon">Très bon état</option>
              <option value="bon">Bon état</option>
              <option value="use">État d'usage</option>
            </select>
          </div>

          {/* Availability filter */}
          <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 rounded-xl">
            <Activity className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="bg-transparent border-none text-xs w-full focus:outline-none text-neutral-700 cursor-pointer"
            >
              <option value="all">Disponibilités (Toutes)</option>
              <option value="disponible">🟢 Uniquement disponibles</option>
              <option value="loue">🟠 Uniquement réservés / loués</option>
            </select>
          </div>

        </div>

      </div>

      {/* Catalog Grid View */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white text-center py-16 rounded-3xl border border-neutral-100 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-neutral-50 text-neutral-300 rounded-full flex items-center justify-center mx-auto border border-neutral-100">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-neutral-800">Aucun article trouvé</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Nous n'avons trouvé aucun vêtement ou bijou correspondant à vos critères de recherche.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-all"
          >
            Réinitialiser la recherche
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArticles.map((article) => (
            <div 
              key={article.id} 
              className="bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm flex flex-col group hover:shadow-xl hover:border-amber-200 transition-all duration-300 relative"
            >
              {/* Product Image Stage */}
              <div className="relative h-72 bg-neutral-50 overflow-hidden">
                <img 
                  src={article.image_url} 
                  alt={article.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                
                {/* Luxury Vignette and status shadows */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-60 pointer-events-none" />

                {/* Status Badges overlays */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {(() => {
                    const isRentedNow = isArticleCurrentlyRented(article.id, rentals);
                    return (
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 border ${
                        !isRentedNow 
                          ? 'bg-emerald-500/95 text-white border-emerald-400' 
                          : 'bg-amber-500/95 text-neutral-950 border-amber-400'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {!isRentedNow ? 'Disponible' : 'Loué'}
                      </span>
                    );
                  })()}
                  
                  <span className="text-[10px] font-bold bg-neutral-900/95 text-amber-400 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border border-neutral-800">
                    {article.category === 'robe' ? '👗 Caftan / Robe' : '💎 Bijou / Diadème'}
                  </span>
                </div>

                {/* Condition Overlay Badge on bottom-left */}
                <div className="absolute bottom-3 left-3 z-10">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-sm ${getStateColor(article.state)}`}>
                    {getFrenchState(article.state)}
                  </span>
                </div>

                {/* Edit & Delete Action overlay (Visible clearly on hover) */}
                <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                  <button
                    onClick={() => openEditForm(article)}
                    className="p-2 bg-white/95 backdrop-blur-sm text-neutral-800 hover:text-amber-600 hover:bg-white rounded-xl shadow-lg transition-all duration-200 active:scale-90 border border-neutral-100"
                    title="Modifier l'article"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTargetId(article.id);
                      setDeleteTargetName(article.name);
                    }}
                    className="p-2 text-red-500 bg-red-50/90 backdrop-blur-sm hover:bg-red-500 hover:text-white border border-red-100/50 hover:border-red-500 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-90 flex items-center justify-center"
                    title="Supprimer l'article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Product Metadata Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-display font-bold text-neutral-900 group-hover:text-amber-700 transition-colors duration-200 line-clamp-1 text-sm lg:text-base">
                      {article.name}
                    </h3>
                  </div>

                  <p className="text-[10px] text-neutral-400 font-mono tracking-wider bg-neutral-50 border border-neutral-100 px-2 py-0.5 rounded-md inline-block">
                    REF: {article.reference}
                  </p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 border-t border-neutral-100/80 text-xs">
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <Palette className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span className="truncate text-neutral-800 font-medium">{article.color || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <Ruler className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span className="truncate text-neutral-800 font-medium">{article.size || 'N/A'}</span>
                    </div>
                  </div>

                  {article.notes && (
                    <p className="text-xs text-neutral-400 italic line-clamp-2 bg-neutral-50/50 p-2 rounded-xl mt-2 border border-dashed border-neutral-100">
                      {article.notes}
                    </p>
                  )}
                </div>

                {/* Rent Price and Deposit Panel */}
                <div className="border-t border-neutral-100/80 pt-3.5 mt-2 flex justify-between items-center bg-neutral-50/70 p-3 rounded-2xl border border-neutral-100">
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-semibold block">Garantie Caution</span>
                    <span className="text-xs font-semibold text-neutral-600 font-mono">{formatCurrency(article.deposit)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider block">Tarif Location</span>
                    <span className="text-base font-bold text-neutral-950 font-mono">{formatCurrency(article.rental_price)}</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Luxury Slide-Over Panel Form for Create / Edit */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/50 backdrop-blur-sm flex justify-end">
          
          {/* Main Slide-Over Drawer Container */}
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col transition-all duration-300 transform animate-slide-left border-l border-neutral-100">
            
            {/* Form Header */}
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600">Formulaire Catalogue</span>
                <h3 className="text-lg font-display font-bold text-neutral-900 mt-0.5">
                  {editingArticle ? "Modifier l'Article de Prestige" : "Ajouter une Création Premium"}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 p-2 rounded-full transition-all duration-200 focus:outline-none"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs navigation inside form to avoid a super long scrolling page */}
            <div className="flex border-b border-neutral-100 bg-neutral-50/50 px-4 pt-1">
              <button
                type="button"
                onClick={() => setFormTab('general')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  formTab === 'general' 
                    ? 'border-amber-500 text-neutral-900 font-bold' 
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                1. Général
              </button>
              <button
                type="button"
                onClick={() => setFormTab('specs')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  formTab === 'specs' 
                    ? 'border-amber-500 text-neutral-900 font-bold' 
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                2. Attributs
              </button>
              <button
                type="button"
                onClick={() => setFormTab('pricing')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  formTab === 'pricing' 
                    ? 'border-amber-500 text-neutral-900 font-bold' 
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                3. Tarifs
              </button>
              <button
                type="button"
                onClick={() => setFormTab('media')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  formTab === 'media' 
                    ? 'border-amber-500 text-neutral-900 font-bold' 
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                4. Photo & Notes
              </button>
            </div>

            {/* Form Fields Wrapper */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
              
              {/* Tab 1: General Details */}
              {formTab === 'general' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/50 space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Étape 1 : Informations Principales
                    </h4>
                    <p className="text-[11px] text-neutral-500">Définissez la désignation de l'article de haute couture et la référence de suivi.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                      Nom de la création <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Caftan Karakou Royale Or & Vert"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                        Référence unique <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: R-KAR-01"
                        value={formReference}
                        onChange={(e) => setFormReference(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800 font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                        Catégorie d'article <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as 'robe' | 'bijou')}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800 font-medium"
                      >
                        <option value="robe">👗 Caftan / Robe de Soirée</option>
                        <option value="bijou">💎 Bijou / Diadème / Parure</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFormTab('specs')}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md shadow-neutral-950/10"
                    >
                      Suivant : Attributs <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Specs Attributes */}
              {formTab === 'specs' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/50 space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Étape 2 : Caractéristiques de Style
                    </h4>
                    <p className="text-[11px] text-neutral-500">Mentionnez les détails physiques, la taille, et l'état de conservation actuel.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">Couleur</label>
                      <input
                        type="text"
                        placeholder="Ex: Rose poudré, Vert Émeraude"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">Taille (uniquement pour Robe)</label>
                      <input
                        type="text"
                        disabled={formCategory !== 'robe'}
                        placeholder={formCategory === 'robe' ? "Ex: 38, 40, L, Ajustable" : "Non applicable pour Bijoux"}
                        value={formCategory === 'robe' ? formSize : ''}
                        onChange={(e) => setFormSize(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:bg-white transition-all text-neutral-800 ${
                          formCategory !== 'robe' 
                            ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed' 
                            : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 focus:border-amber-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">État général actuel</label>
                    <select
                      value={formState}
                      onChange={(e) => setFormState(e.target.value as any)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800 font-medium"
                    >
                      <option value="excellent">✨ Excellent état (Quasi neuf)</option>
                      <option value="tres_bon">✨ Très bon état</option>
                      <option value="bon">👍 Bon état</option>
                      <option value="use">⚠️ État d'usage (Usures légères)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFormTab('general')}
                      className="px-5 py-2.5 border border-neutral-200 rounded-xl text-xs font-bold uppercase transition-all hover:bg-neutral-50 text-neutral-600"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTab('pricing')}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md shadow-neutral-950/10"
                    >
                      Suivant : Tarifs <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Pricing and Deposit */}
              {formTab === 'pricing' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/50 space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Étape 3 : Conditions de Location (DA)
                    </h4>
                    <p className="text-[11px] text-neutral-500">Entrez les montants financiers correspondants à la location par week-end ou événement.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                        Prix de Location (DA) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-neutral-400 font-bold text-xs font-mono">DA</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formRentalPrice || ''}
                          onChange={(e) => setFormRentalPrice(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800 font-mono font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400">Recommandé pour un Caftan standard : entre 15 000 DA et 35 000 DA.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                        Garantie Caution (DA) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-neutral-400 font-bold text-xs font-mono">DA</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formDeposit || ''}
                          onChange={(e) => setFormDeposit(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800 font-mono font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400">Montant de sécurité retenu lors de la sortie, restitué au retour en bon état.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFormTab('specs')}
                      className="px-5 py-2.5 border border-neutral-200 rounded-xl text-xs font-bold uppercase transition-all hover:bg-neutral-50 text-neutral-600"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTab('media')}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md shadow-neutral-950/10"
                    >
                      Suivant : Médias <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: Media Photo and Notes */}
              {formTab === 'media' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/50 space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Étape 4 : Visuels & Notes d'entretien
                    </h4>
                    <p className="text-[11px] text-neutral-500">Ajoutez une photo représentative de l'habit de gala et les consignes de repassage ou pressing.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                      Photo de l'article <span className="text-red-500">*</span>
                    </label>
                    
                    <input
                      type="file"
                      id="catalog-image-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Drag and Drop Container or Active Image Display */}
                    <div className="relative border-2 border-dashed border-neutral-200 hover:border-amber-400 rounded-2xl bg-neutral-50/50 hover:bg-white transition-all p-4 flex flex-col items-center justify-center min-h-[220px]">
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl animate-fade-in">
                          <span className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin"></span>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Téléchargement en cours...</p>
                        </div>
                      )}

                      {formImageUrl ? (
                        <div className="w-full space-y-3 text-center">
                          {/* Image Preview */}
                          <div className="relative w-full h-44 bg-neutral-100 rounded-xl overflow-hidden shadow-inner border border-neutral-200/60">
                            <img 
                              src={formImageUrl} 
                              alt="Aperçu de la création"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setFormImageUrl('')}
                              className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                              title="Supprimer la photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Action Buttons below preview */}
                          <div className="flex items-center justify-center gap-2">
                            <label
                              htmlFor="catalog-image-upload"
                              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer transition-all inline-flex items-center gap-1.5 hover:shadow-md"
                            >
                              <Camera className="w-3.5 h-3.5" /> Changer la photo
                            </label>
                            <button
                              type="button"
                              onClick={() => setFormImageUrl('')}
                              className="px-4 py-2 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold uppercase tracking-wide transition-all inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Supprimer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label 
                          htmlFor="catalog-image-upload"
                          className="w-full h-full py-8 flex flex-col items-center justify-center cursor-pointer text-center space-y-3 select-none"
                        >
                          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-100">
                            <Camera className="w-6 h-6 stroke-1.5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-neutral-800">📷 Choisir une photo</p>
                            <p className="text-[10px] text-neutral-400 font-medium">Parcourez les dossiers de votre ordinateur</p>
                            <p className="text-[9px] text-neutral-300 uppercase tracking-widest font-mono">JPG, PNG, WEBP • Max 10 Mo</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                      Consignes de pressing / Notes d'atelier
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Nettoyage à sec impératif, tissu en soie fragile, perles délicates cousues main."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800"
                    />
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFormTab('pricing')}
                      className="px-5 py-2.5 border border-neutral-200 rounded-xl text-xs font-bold uppercase transition-all hover:bg-neutral-50 text-neutral-600"
                    >
                      Précédent
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs uppercase transition-all"
                      >
                        Fermer
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/10"
                      >
                        {editingArticle ? "Enregistrer" : "Créer l'Article"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form persistent actions footer fallback if they want to quick-submit from tabs */}
              <div className="mt-8 pt-4 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-400 bg-neutral-50/50 p-4 rounded-2xl">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  Remplissez toutes les étapes.
                </span>
                {formTab !== 'media' && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-[11px] uppercase tracking-wide transition-all"
                  >
                    Enregistrer l'article maintenant
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-neutral-100 shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100 mx-auto sm:mx-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="font-display font-bold text-neutral-900 text-base">Supprimer l'article ?</h3>
              <p className="text-xs text-neutral-500">
                Êtes-vous sûr de vouloir retirer définitivement <span className="font-bold text-neutral-800">"{deleteTargetName}"</span> de votre catalogue de stock ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetId(null);
                  setDeleteTargetName('');
                }}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTargetId) {
                    onDeleteArticle(deleteTargetId);
                  }
                  setDeleteTargetId(null);
                  setDeleteTargetName('');
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-red-600/10"
              >
                Confirmer la Suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
