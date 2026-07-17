import React, { useState, useEffect } from 'react';
import { Rental, Article } from '../types';
import { 
  Plus, 
  User, 
  Phone, 
  Check, 
  RefreshCw, 
  X, 
  AlertTriangle, 
  Instagram, 
  Home, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Trash2, 
  Printer, 
  Eye, 
  Edit3, 
  Clock, 
  Sparkles, 
  MapPin, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Lock 
} from 'lucide-react';
import { formatCurrency, formatDate, isValidAlgerianPhone } from '../utils/format';
import { isArticleBookedOnDates } from '../utils/availability';

interface RentalsComponentProps {
  rentals: Rental[];
  articles: Article[];
  onAddRental: (rental: Omit<Rental, 'id' | 'created_at' | 'is_returned'>) => Promise<boolean>;
  onUpdateRental?: (id: string, rental: Partial<Rental>) => Promise<boolean>;
  onMarkReturned: (id: string) => void;
  onDeleteRental: (id: string) => void;
  preselectedDate?: string | null;
  initialActiveDetailRentalId?: string | null;
  onClearInitialActiveDetailRentalId?: () => void;
  initialFilterType?: 'all' | 'active' | 'returned' | 'late' | null;
  onClearInitialFilterType?: () => void;
}

export default function RentalsComponent({ 
  rentals, 
  articles, 
  onAddRental, 
  onUpdateRental,
  onMarkReturned, 
  onDeleteRental, 
  preselectedDate,
  initialActiveDetailRentalId,
  onClearInitialActiveDetailRentalId,
  initialFilterType,
  onClearInitialFilterType
}: RentalsComponentProps) {
  const [filterType, setFilterType] = useState<'all' | 'active' | 'returned' | 'late'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Creation / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);

  // Detail Modal State
  const [activeDetailRental, setActiveDetailRental] = useState<Rental | null>(null);

  useEffect(() => {
    if (initialActiveDetailRentalId) {
      const found = rentals.find(r => r.id === initialActiveDetailRentalId);
      if (found) {
        setActiveDetailRental(found);
      }
      if (onClearInitialActiveDetailRentalId) {
        onClearInitialActiveDetailRentalId();
      }
    }
  }, [initialActiveDetailRentalId, rentals, onClearInitialActiveDetailRentalId]);

  useEffect(() => {
    if (initialFilterType) {
      setFilterType(initialFilterType);
      if (onClearInitialFilterType) {
        onClearInitialFilterType();
      }
    }
  }, [initialFilterType, onClearInitialFilterType]);

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientInstagram, setClientInstagram] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [dressIds, setDressIds] = useState<string[]>([]);
  const [jewelryIds, setJewelryIds] = useState<string[]>([]);
  const [outDate, setOutDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [depositPaid, setDepositPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('espèces');
  const [notes, setNotes] = useState('');

  // Caution States (Persisted inside notes with metadata tags)
  const [caution, setCaution] = useState<number>(0);
  const [cautionStatus, setCautionStatus] = useState<'non_recue' | 'recue' | 'restituee'>('non_recue');

  // Conflict warning state
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Custom confirmation modal states
  const [deleteRentalId, setDeleteRentalId] = useState<string | null>(null);
  const [deleteRentalName, setDeleteRentalName] = useState<string>('');
  
  const [returnRentalId, setReturnRentalId] = useState<string | null>(null);
  const [returnRentalName, setReturnRentalName] = useState<string>('');
  const [returnRemainingToPay, setReturnRemainingToPay] = useState<number>(0);
  
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);

  // Sync preselected date from calendar
  useEffect(() => {
    if (preselectedDate) {
      setEditingRental(null);
      setClientName('');
      setClientPhone('');
      setClientInstagram('');
      setClientAddress('');
      setDressIds([]);
      setJewelryIds([]);
      setOutDate(preselectedDate);
      setEventDate(preselectedDate);
      
      try {
        const d = new Date(preselectedDate);
        d.setDate(d.getDate() + 3);
        setReturnDate(d.toISOString().slice(0, 10));
      } catch (e) {}
      
      setPrice(0);
      setDepositPaid(0);
      setPaymentMethod('espèces');
      setNotes('');
      setCaution(0);
      setCautionStatus('non_recue');
      setIsFormOpen(true);
    }
  }, [preselectedDate]);

  // Handle article choices & auto-calculating pricing & caution (only during create, or with confirmation)
  useEffect(() => {
    // We only auto-calculate if creating a new rental OR if we are explicitly editing and haven't customized price yet
    if (!editingRental && (dressIds.length > 0 || jewelryIds.length > 0)) {
      let totalPrice = 0;
      let totalCaution = 0;
      
      dressIds.forEach(id => {
        const dress = articles.find(a => a.id === id);
        if (dress) {
          totalPrice += dress.rental_price;
          if (dress.deposit) totalCaution += dress.deposit;
        }
      });

      jewelryIds.forEach(id => {
        const jewelry = articles.find(a => a.id === id);
        if (jewelry) {
          totalPrice += jewelry.rental_price;
          if (jewelry.deposit) totalCaution += jewelry.deposit;
        }
      });

      setPrice(totalPrice);
      setDepositPaid(Math.min(totalPrice, Math.round(totalPrice / 2))); // Recommend 50% deposit
      setCaution(totalCaution);
      if (totalCaution > 0) {
        setCautionStatus('non_recue');
      }
    }
  }, [dressIds, jewelryIds, articles, editingRental]);

  // Check double bookings on dates change
  useEffect(() => {
    if (!outDate || !returnDate || (dressIds.length === 0 && jewelryIds.length === 0)) {
      setConflictWarning(null);
      return;
    }

    const collision = rentals.find(r => {
      // Don't collide with itself if we are editing
      if (editingRental && r.id === editingRental.id) return false;
      if (r.is_returned) return false;

      const rDressIds = r.dress_ids || (r.dress_id ? [r.dress_id] : []);
      const rJewelryIds = r.jewelry_ids || (r.jewelry_id ? [r.jewelry_id] : []);

      const matchesDress = dressIds.some(id => rDressIds.includes(id));
      const matchesJewelry = jewelryIds.some(id => rJewelryIds.includes(id));
      if (!matchesDress && !matchesJewelry) return false;

      // Overlap calculation
      const s1 = new Date(outDate).getTime();
      const e1 = new Date(returnDate).getTime();
      const s2 = new Date(r.out_date).getTime();
      const e2 = new Date(r.return_date).getTime();

      return s1 <= e2 && s2 <= e1;
    });

    if (collision) {
      setConflictWarning(`Attention: cet article est déjà réservé par ${collision.client_name} du ${formatDate(collision.out_date)} au ${formatDate(collision.return_date)}.`);
    } else {
      setConflictWarning(null);
    }
  }, [outDate, returnDate, dressIds, jewelryIds, rentals, editingRental]);

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setClientInstagram('');
    setClientAddress('');
    setDressIds([]);
    setJewelryIds([]);
    setOutDate('');
    setEventDate('');
    setReturnDate('');
    setPrice(0);
    setDepositPaid(0);
    setPaymentMethod('espèces');
    setNotes('');
    setCaution(0);
    setCautionStatus('non_recue');
    setEditingRental(null);
    setConflictWarning(null);
  };

  const openCreateForm = () => {
    setEditingRental(null);
    setClientName('');
    setClientPhone('');
    setClientInstagram('');
    setClientAddress('');
    setDressIds([]);
    setJewelryIds([]);
    setOutDate('2026-07-08');
    setEventDate('2026-07-11');
    setReturnDate('2026-07-13');
    setPrice(0);
    setDepositPaid(0);
    setPaymentMethod('espèces');
    setNotes('');
    setCaution(0);
    setCautionStatus('non_recue');
    setIsFormOpen(true);
  };

  const openEditForm = (rental: Rental) => {
    setEditingRental(rental);
    setClientName(rental.client_name);
    setClientPhone(rental.client_phone);
    setClientInstagram(rental.client_instagram || '');
    setClientAddress(rental.client_address || '');
    
    const initialDressIds = rental.dress_ids || (rental.dress_id ? [rental.dress_id] : []);
    const initialJewelryIds = rental.jewelry_ids || (rental.jewelry_id ? [rental.jewelry_id] : []);
    setDressIds(initialDressIds);
    setJewelryIds(initialJewelryIds);
    
    setOutDate(rental.out_date);
    setEventDate(rental.event_date);
    setReturnDate(rental.return_date);
    setPrice(rental.price);
    setDepositPaid(rental.deposit_paid);
    setPaymentMethod(rental.payment_method);
    
    // Parse caution metadata from notes if present
    const cautionMatch = rental.notes ? rental.notes.match(/\[Caution:\s*(\d+)\s*DA\s*-\s*Statut:\s*(\w+)\]/) : null;
    if (cautionMatch) {
      setCaution(Number(cautionMatch[1]));
      setCautionStatus(cautionMatch[2] as any);
      setNotes(rental.notes.replace(/\[Caution:\s*\d+\s*DA\s*-\s*Statut:\s*\w+\]/, '').trim());
    } else {
      // Fallback: calculate default caution
      let totalCaution = 0;
      initialDressIds.forEach(id => {
        const d = articles.find(a => a.id === id);
        if (d && d.deposit) totalCaution += d.deposit;
      });
      initialJewelryIds.forEach(id => {
        const j = articles.find(a => a.id === id);
        if (j && j.deposit) totalCaution += j.deposit;
      });
      setCaution(totalCaution);
      setCautionStatus(rental.is_returned ? 'restituee' : 'non_recue');
      setNotes(rental.notes || '');
    }
    
    setIsFormOpen(true);
  };

  const saveRental = async (payload: any) => {
    let success = false;
    if (editingRental) {
      if (onUpdateRental) {
        success = await onUpdateRental(editingRental.id, payload);
      } else {
        alert("La fonction de mise à jour n'est pas disponible.");
        return;
      }
    } else {
      success = await onAddRental(payload);
    }

    if (success) {
      setIsFormOpen(false);
      resetForm();
    }
  };

  const addDressLine = () => {
    setDressIds([...dressIds, '']);
  };

  const removeDressLine = (index: number) => {
    const newIds = [...dressIds];
    newIds.splice(index, 1);
    setDressIds(newIds);
  };

  const updateDressLine = (index: number, val: string) => {
    const newIds = [...dressIds];
    newIds[index] = val;
    setDressIds(newIds);
  };

  const addJewelryLine = () => {
    setJewelryIds([...jewelryIds, '']);
  };

  const removeJewelryLine = (index: number) => {
    const newIds = [...jewelryIds];
    newIds.splice(index, 1);
    setJewelryIds(newIds);
  };

  const updateJewelryLine = (index: number, val: string) => {
    const newIds = [...jewelryIds];
    newIds[index] = val;
    setJewelryIds(newIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !outDate || !returnDate) {
      alert('Veuillez remplir le nom, téléphone et les dates de réservation.');
      return;
    }

    if (!isValidAlgerianPhone(clientPhone)) {
      alert("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    const remaining = Math.max(0, price - depositPaid);

    // Append caution metadata cleanly to notes to persist it in DB
    let finalNotes = notes.trim();
    if (caution > 0) {
      finalNotes = `${finalNotes}\n\n[Caution: ${caution} DA - Statut: ${cautionStatus}]`.trim();
    }

    const payload = {
      client_name: clientName,
      client_phone: clientPhone,
      client_instagram: clientInstagram || undefined,
      client_address: clientAddress || undefined,
      dress_id: dressIds[0] || undefined,
      jewelry_id: jewelryIds[0] || undefined,
      dress_ids: dressIds,
      jewelry_ids: jewelryIds,
      out_date: outDate,
      event_date: eventDate || outDate,
      return_date: returnDate,
      price,
      deposit_paid: depositPaid,
      remaining_to_pay: remaining,
      payment_method: paymentMethod,
      notes: finalNotes
    };

    if (conflictWarning) {
      setPendingPayload(payload);
    } else {
      await saveRental(payload);
    }
  };

  const getFilteredRentals = () => {
    const todayStr = '2026-07-08';
    return rentals.filter(r => {
      // Search query filter
      const matchesSearch = 
        r.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.client_phone.includes(searchQuery) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status filters
      if (filterType === 'active') return !r.is_returned;
      if (filterType === 'returned') return r.is_returned;
      if (filterType === 'late') {
        const isOverdue = new Date(r.return_date).getTime() < new Date(todayStr).getTime();
        return !r.is_returned && isOverdue;
      }
      return true;
    });
  };

  const currentFilteredList = getFilteredRentals();

  const isLate = (returnDateStr: string) => {
    const todayStr = '2026-07-08';
    return new Date(returnDateStr).getTime() < new Date(todayStr).getTime();
  };

  // Helper to get remaining days countdown
  const getDaysRemainingText = (returnDateStr: string, isReturned: boolean) => {
    if (isReturned) return 'Restitué';
    const today = new Date('2026-07-08');
    const returnD = new Date(returnDateStr);
    const diffTime = returnD.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return "Retour prévu aujourd'hui";
    } else {
      return `Reste ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div id="rentals-section" className="space-y-6">
      {/* CSS Styles injection for custom printing and high fidelity typography */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&display=swap');
        
        .font-serif-luxury {
          font-family: 'Playfair Display', Georgia, serif;
        }

        @media print {
          body * {
            visibility: hidden;
            background: none !important;
            color: black !important;
          }
          #print-contract-area, #print-contract-area * {
            visibility: visible;
          }
          #print-contract-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header and Quick stats */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-neutral-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-600" />
              Registre des Locations & Réservations
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Créez de nouvelles fiches clients, suivez les dates de sortie, d'événement, et gérez les retours boutique avec fiches imprimables.</p>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-neutral-950 hover:bg-gold-600 hover:text-neutral-950 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nouvelle Réservation
          </button>
        </div>

        {/* Tab filters and search */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mt-6 gap-3 border-t border-neutral-100 pt-4">
          <div className="flex gap-1 overflow-x-auto bg-neutral-50 p-1 rounded-xl border border-neutral-100 self-start">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                filterType === 'all' ? 'bg-white text-black shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-black'
              }`}
            >
              Tous ({rentals.length})
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                filterType === 'active' ? 'bg-white text-orange-600 shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-orange-600'
              }`}
            >
              En cours ({rentals.filter(r => !r.is_returned).length})
            </button>
            <button
              onClick={() => setFilterType('late')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                filterType === 'late' ? 'bg-white text-red-600 shadow-sm border border-neutral-200/50 animate-pulse' : 'text-neutral-500 hover:text-red-500'
              }`}
            >
              En retard ({rentals.filter(r => !r.is_returned && isLate(r.return_date)).length})
            </button>
            <button
              onClick={() => setFilterType('returned')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                filterType === 'returned' ? 'bg-white text-emerald-600 shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-emerald-600'
              }`}
            >
              Rendu ({rentals.filter(r => r.is_returned).length})
            </button>
          </div>

          <div className="relative md:w-80">
            <input
              type="text"
              placeholder="Rechercher nom, téléphone, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-gold-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-neutral-400 hover:text-black p-1 rounded-full hover:bg-neutral-200/50 transition-all z-10"
                title="Effacer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rentals Grid */}
      {currentFilteredList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-neutral-200">
          <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-800">Aucune fiche de location trouvée</p>
          <p className="text-xs text-neutral-400 mt-1">Essayez d'ajuster vos filtres ou de créer une nouvelle réservation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentFilteredList.map((rental) => {
            const rDressIds = rental.dress_ids || (rental.dress_id ? [rental.dress_id] : []);
            const rJewelryIds = rental.jewelry_ids || (rental.jewelry_id ? [rental.jewelry_id] : []);
            const rentalDresses = rDressIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
            const rentalJewelries = rJewelryIds.map(id => articles.find(a => a.id === id)).filter(Boolean);

            const overdue = isLate(rental.return_date) && !rental.is_returned;
            const daysLeft = getDaysRemainingText(rental.return_date, rental.is_returned);

            return (
              <div 
                key={rental.id} 
                className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between hover:shadow-md ${
                  overdue 
                    ? 'border-red-200 bg-red-50/10 hover:border-red-300' 
                    : rental.is_returned 
                      ? 'border-emerald-100 bg-emerald-50/10 hover:border-emerald-200' 
                      : 'border-neutral-100 hover:border-gold-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0"></span>
                        <h3 className="font-display font-bold text-neutral-900 text-base">{rental.client_name}</h3>
                      </div>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        {rental.client_phone}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        rental.is_returned 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : overdue 
                            ? 'bg-red-100 text-red-800 animate-pulse' 
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rental.is_returned ? '🟢 Restitué' : overdue ? '🚨 En retard' : '🟠 En cours'}
                      </span>
                      <span className="text-[9px] font-semibold text-neutral-400 mt-0.5 font-mono">
                        {daysLeft}
                      </span>
                    </div>
                  </div>

                  {/* rented clothing items */}
                  <div className="space-y-1.5 my-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400 uppercase font-mono text-[9px] font-semibold">Garde-robe :</span>
                      <span className="text-neutral-400 uppercase font-mono text-[9px] font-semibold">Mode: {rental.payment_method}</span>
                    </div>
                    <div className="space-y-1">
                      {rentalDresses.map((dress: any, idx) => (
                        <div key={dress.id || idx} className="flex items-center justify-between text-xs text-neutral-800 font-semibold">
                          <span className="truncate">👗 {dress.name}</span>
                          <span className="text-[10px] text-neutral-400 font-normal">Taille {dress.size}</span>
                        </div>
                      ))}
                      {rentalJewelries.map((jewelry: any, idx) => (
                        <div key={jewelry.id || idx} className="flex items-center justify-between text-xs text-neutral-600">
                          <span className="truncate">💎 {jewelry.name}</span>
                        </div>
                      ))}
                      {rentalDresses.length === 0 && rentalJewelries.length === 0 && (
                        <p className="text-xs text-neutral-400 italic">Aucun article sélectionné</p>
                      )}
                    </div>
                  </div>

                  {/* timeline component */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] my-3 bg-neutral-50/50 p-2 rounded-xl border border-neutral-100/60">
                    <div>
                      <p className="text-neutral-400 uppercase font-semibold">Sortie</p>
                      <p className="font-bold text-neutral-800 mt-0.5 font-mono">{formatDate(rental.out_date)}</p>
                    </div>
                    <div className="border-x border-neutral-200">
                      <p className="text-neutral-400 uppercase font-semibold">Fête/Event</p>
                      <p className="font-bold text-neutral-800 mt-0.5 font-mono">{formatDate(rental.event_date)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 uppercase font-semibold">Retour</p>
                      <p className={`font-bold mt-0.5 font-mono ${overdue ? 'text-red-600' : 'text-neutral-800'}`}>
                        {formatDate(rental.return_date)}
                      </p>
                    </div>
                  </div>

                  {rental.notes && (
                    <p className="text-[11px] text-neutral-500 italic bg-amber-50/30 px-2.5 py-1.5 rounded-lg border border-amber-100/20 mb-3 truncate">
                      💡 {rental.notes}
                    </p>
                  )}
                </div>

                {/* financial footer of card */}
                <div className="border-t border-neutral-100 pt-4 mt-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[9px] text-neutral-400 uppercase font-semibold">Prix Total</p>
                      <p className="text-xs font-bold text-neutral-900 font-mono">{formatCurrency(rental.price)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-400 uppercase font-semibold">Acompte</p>
                      <p className="text-xs font-bold text-emerald-600 font-mono">{formatCurrency(rental.deposit_paid)}</p>
                    </div>
                    {rental.remaining_to_pay > 0 && (
                      <div>
                        <p className="text-[9px] text-red-500 font-semibold uppercase">Reste dû</p>
                        <p className="text-xs font-bold text-red-600 font-mono">{formatCurrency(rental.remaining_to_pay)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Sheet Button */}
                    <button
                      onClick={() => setActiveDetailRental(rental)}
                      className="p-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all"
                      title="Voir la Fiche de Location & Contrat"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => openEditForm(rental)}
                      className="p-2 text-gold-700 bg-gold-50 hover:bg-gold-100 rounded-xl transition-all"
                      title="Modifier la fiche"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {!rental.is_returned && (
                      <button
                        onClick={() => {
                          setReturnRentalId(rental.id);
                          setReturnRentalName(rental.client_name);
                          setReturnRemainingToPay(rental.remaining_to_pay);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                      >
                        <Check className="w-3 h-3" /> Retour
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setDeleteRentalId(rental.id);
                        setDeleteRentalName(rental.client_name);
                      }}
                      className="p-2 text-red-500 bg-red-50/70 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                      title="Supprimer la réservation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation / Editing Sidebar Modal */}
      {isFormOpen && (() => {
        // Compute form completeness meter
        let completeness = 0;
        if (clientName && clientName.trim().length >= 3) completeness += 20;
        if (clientPhone && isValidAlgerianPhone(clientPhone)) completeness += 20;
        if (dressIds.length > 0 || jewelryIds.length > 0) completeness += 20;
        if (outDate && returnDate && new Date(outDate) <= new Date(returnDate)) completeness += 20;
        if (price > 0) completeness += 20;

        const selectedDresses = dressIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
        const selectedJewelries = jewelryIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
        const remainingToPay = Math.max(0, price - depositPaid);

        // Payment status dynamic tag
        let paymentStatusLabel = "Aucun règlement";
        let paymentStatusColor = "bg-neutral-100 text-neutral-600 border-neutral-200";
        if (depositPaid > 0) {
          if (depositPaid >= price) {
            paymentStatusLabel = "Soldé / Payé en totalité";
            paymentStatusColor = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
          } else {
            paymentStatusLabel = "Acompte Payé (Partiel)";
            paymentStatusColor = "bg-amber-50 text-amber-700 border-amber-200/50";
          }
        }

        return (
          <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-10">
            <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-neutral-100 animate-scale-up">
              
              {/* Header */}
              <div className="px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 font-mono">
                    {editingRental ? "SOCIÉTÉ • MODIFICATION" : "SOCIÉTÉ • ENREGISTREMENT"}
                  </span>
                  <h3 className="text-xl font-display font-black text-neutral-900 tracking-tight">
                    {editingRental ? "Modifier la Fiche Location" : "Nouvelle Fiche Location Client"}
                  </h3>
                </div>
                
                <button 
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/50 p-2.5 rounded-full transition-all focus:outline-none border border-transparent hover:border-neutral-200/40"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Completeness Progress Bar */}
              <div className="bg-neutral-50 px-8 py-3.5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200 shadow-sm font-mono text-xs font-bold text-neutral-700">
                    {completeness}%
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-neutral-800">Complétion du dossier de location</p>
                    <p className="text-[10px] text-neutral-400">
                      {completeness < 100 
                        ? "Veuillez remplir tous les champs obligatoires (*) pour finaliser." 
                        : "Dossier 100% conforme • Prêt à être enregistré"
                      }
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-48 bg-neutral-200 h-2 rounded-full overflow-hidden shrink-0">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      completeness === 100 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                        : "bg-gradient-to-r from-amber-500 to-gold-600"
                    }`}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>

              {/* Content Area - Form (60%) + Live Receipt (40%) */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                
                {/* Form Column */}
                <form 
                  onSubmit={handleSubmit} 
                  className="flex-1 overflow-y-auto p-8 space-y-6 lg:border-r lg:border-neutral-100 bg-neutral-50/20"
                >
                  {/* Section 1: Informations Cliente */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <div className="p-1.5 bg-neutral-50 text-neutral-700 rounded-lg">
                        <User className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">1. Informations de la Cliente</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Nom Complet <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Sarah Amrani"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 transition-all"
                        />
                        {clientName && clientName.trim().length < 3 && (
                          <p className="text-[10px] font-medium text-amber-600">Le nom doit comporter au moins 3 caractères.</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Téléphone <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          required
                          placeholder="Ex: 0550123456, +213..., ou autre"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 font-mono transition-all"
                        />
                        {clientPhone && !isValidAlgerianPhone(clientPhone) && (
                          <p className="text-[10px] font-medium text-red-500">Le numéro de téléphone est trop court.</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Compte Instagram (@compte)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-[11px] text-xs text-neutral-400 font-mono">@</span>
                          <input
                            type="text"
                            placeholder="sarah_amr"
                            value={clientInstagram}
                            onChange={(e) => setClientInstagram(e.target.value)}
                            className="w-full pl-8 pr-3.5 py-2.5 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Adresse de résidence</label>
                        <input
                          type="text"
                          placeholder="Ex: Alger-Centre, Hydra..."
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Choix du Vestiaire */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-6">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <div className="p-1.5 bg-neutral-50 text-neutral-700 rounded-lg">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">2. Sélection des Articles</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Robes Area */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Robes Sélectionnées ({dressIds.length})</label>
                          <button
                            type="button"
                            onClick={addDressLine}
                            className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg transition-all"
                          >
                            <Plus className="w-3 h-3" /> Ajouter une robe
                          </button>
                        </div>

                        {dressIds.length === 0 ? (
                          <p className="text-[11px] text-neutral-400 italic bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">Aucune robe sélectionnée. Cliquez sur le bouton pour en ajouter.</p>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {dressIds.map((selectedId, idx) => {
                              // Filter out dresses selected in OTHER rows
                              const availableDresses = articles.filter(a => {
                                if (a.category !== 'robe') return false;
                                if (a.id === selectedId) return true; // Keep current selection
                                return !dressIds.includes(a.id); // Exclude other selections
                              });

                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <select
                                    value={selectedId}
                                    onChange={(e) => updateDressLine(idx, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 transition-all"
                                  >
                                    <option value="">-- Choisir une robe --</option>
                                    {availableDresses.map(a => {
                                      const isBooked = (outDate && returnDate) ? isArticleBookedOnDates(a.id, outDate, returnDate, rentals, editingRental?.id) : false;
                                      return (
                                        <option 
                                          key={a.id} 
                                          value={a.id} 
                                          disabled={isBooked}
                                        >
                                          {a.name} ({formatCurrency(a.rental_price)}) {isBooked ? '[⚠️ Occupée]' : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => removeDressLine(idx)}
                                    className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all shrink-0"
                                    title="Supprimer cette robe"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Bijoux Area */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Bijoux & Accessoires ({jewelryIds.length})</label>
                          <button
                            type="button"
                            onClick={addJewelryLine}
                            className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg transition-all"
                          >
                            <Plus className="w-3 h-3" /> Ajouter un bijou
                          </button>
                        </div>

                        {jewelryIds.length === 0 ? (
                          <p className="text-[11px] text-neutral-400 italic bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">Aucun bijou sélectionné. Cliquez sur le bouton pour en ajouter.</p>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {jewelryIds.map((selectedId, idx) => {
                              const availableJewelry = articles.filter(a => {
                                if (a.category !== 'bijou') return false;
                                if (a.id === selectedId) return true;
                                return !jewelryIds.includes(a.id);
                              });

                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <select
                                    value={selectedId}
                                    onChange={(e) => updateJewelryLine(idx, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 transition-all"
                                  >
                                    <option value="">-- Choisir un bijou --</option>
                                    {availableJewelry.map(a => {
                                      const isBooked = (outDate && returnDate) ? isArticleBookedOnDates(a.id, outDate, returnDate, rentals, editingRental?.id) : false;
                                      return (
                                        <option 
                                          key={a.id} 
                                          value={a.id} 
                                          disabled={isBooked}
                                        >
                                          {a.name} ({formatCurrency(a.rental_price)}) {isBooked ? '[⚠️ Occupé]' : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => removeJewelryLine(idx)}
                                    className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all shrink-0"
                                    title="Supprimer ce bijou"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Dates de Réservation & Visual Summary */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <div className="p-1.5 bg-neutral-50 text-neutral-700 rounded-lg">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">3. Calendrier de Réservation</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Sortie <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          required
                          value={outDate}
                          onChange={(e) => setOutDate(e.target.value)}
                          className="w-full px-2 py-2 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/5 font-mono transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Fête</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-2 py-2 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/5 font-mono transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Retour <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          required
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full px-2 py-2 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/5 font-mono transition-all"
                        />
                      </div>
                    </div>

                    {/* Timeline Summary Component */}
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-xs text-neutral-600 font-medium">
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5 text-center">Aperçu Chronologique de la Location</p>
                      <div className="flex items-center justify-between text-center">
                        <div className="flex-1">
                          <span className="text-[9px] text-neutral-400 uppercase font-semibold">1. Sortie</span>
                          <span className="block font-mono text-neutral-900 font-bold mt-1 text-[11px]">{outDate ? formatDate(outDate) : 'JJ/MM/AAAA'}</span>
                          <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold uppercase rounded mt-1">Retrait boutique</span>
                        </div>
                        <div className="w-8 h-px border-t border-dashed border-neutral-300 self-center mx-1 mt-4 shrink-0" />
                        <div className="flex-1">
                          <span className="text-[9px] text-neutral-400 uppercase font-semibold">2. Jour J</span>
                          <span className="block font-mono text-neutral-900 font-bold mt-1 text-[11px]">{eventDate ? formatDate(eventDate) : 'JJ/MM/AAAA'}</span>
                          <span className="inline-block px-1.5 py-0.5 bg-gold-50 text-gold-700 text-[8px] font-bold uppercase rounded mt-1">Événement</span>
                        </div>
                        <div className="w-8 h-px border-t border-dashed border-neutral-300 self-center mx-1 mt-4 shrink-0" />
                        <div className="flex-1">
                          <span className="text-[9px] text-neutral-400 uppercase font-semibold">3. Retour</span>
                          <span className="block font-mono text-neutral-900 font-bold mt-1 text-[11px]">{returnDate ? formatDate(returnDate) : 'JJ/MM/AAAA'}</span>
                          <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold uppercase rounded mt-1">Restitution</span>
                        </div>
                      </div>
                    </div>

                    {conflictWarning && (
                      <div className="flex items-start gap-2 bg-red-50 text-red-800 p-3.5 rounded-2xl border border-red-100 text-xs mt-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <p className="font-semibold">{conflictWarning}</p>
                      </div>
                    )}
                  </div>

                  {/* Section 4: Règlement & Tarification */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <div className="p-1.5 bg-neutral-50 text-neutral-700 rounded-lg">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">4. Tarification & Caisse</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Prix Total de Location (DA) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 font-bold font-mono text-amber-700 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Acompte Payé Initialement (DA)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={depositPaid}
                          onChange={(e) => setDepositPaid(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 font-bold font-mono text-emerald-700 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Mode de règlement (Acompte)</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 transition-all"
                        >
                          <option value="espèces">💵 Espèces (Caisse boutique)</option>
                          <option value="carte">💳 Carte bancaire</option>
                          <option value="virement">🏦 Virement bancaire</option>
                          <option value="chèque">✍️ Chèque</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Statut Comptable</label>
                        <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${paymentStatusColor}`}>
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>{paymentStatusLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-xs font-bold">
                      <span className="text-neutral-500">SOLDE DU RESTE À PAYER (Au retrait) :</span>
                      <span className={`font-mono text-base ${remainingToPay > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(remainingToPay)}
                      </span>
                    </div>
                  </div>

                  {/* Section 5: Caution & Garantie */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <div className="p-1.5 bg-neutral-50 text-neutral-700 rounded-lg">
                        <Lock className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">5. Dépôt de Garantie (Caution)</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Montant de la Caution (DA)</label>
                        <input
                          type="number"
                          min="0"
                          value={caution}
                          onChange={(e) => setCaution(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 font-mono text-neutral-700 transition-all"
                        />
                        <p className="text-[9px] text-neutral-400">Généré automatiquement selon le barème des articles.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Statut de la Caution</label>
                        <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setCautionStatus('non_recue')}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                              cautionStatus === 'non_recue' 
                                ? 'bg-white text-neutral-800 shadow-sm' 
                                : 'text-neutral-500 hover:bg-neutral-50'
                            }`}
                          >
                            Non Reçue
                          </button>
                          <button
                            type="button"
                            onClick={() => setCautionStatus('recue')}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                              cautionStatus === 'recue' 
                                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/10' 
                                : 'text-neutral-500 hover:bg-neutral-50'
                            }`}
                          >
                            Reçue
                          </button>
                          <button
                            type="button"
                            onClick={() => setCautionStatus('restituee')}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                              cautionStatus === 'restituee' 
                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10' 
                                : 'text-neutral-500 hover:bg-neutral-50'
                            }`}
                          >
                            Restituée
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Notes & Observations */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <div className="p-1.5 bg-neutral-50 text-neutral-700 rounded-lg">
                        <FileText className="w-4 h-4 text-neutral-600" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">6. Notes Particulières & Ajustements</h4>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Ajustements couture, retouches, demandes spéciales</label>
                      <textarea
                        placeholder="Ex: Retouche à la taille de 2cm, ajout d'une broche dorée, retard toléré d'une journée..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50/50 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 h-24 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Form actions */}
                  <div className="pt-6 flex gap-3 border-t border-neutral-100 bg-white p-4 -mx-8 -mb-8 sticky bottom-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        resetForm();
                      }}
                      className="flex-1 py-3 px-4 border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 transition-all text-neutral-700"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={completeness < 100}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                        completeness === 100
                          ? 'bg-gradient-to-r from-amber-500 via-gold-600 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                          : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {editingRental ? "Enregistrer les modifications" : "Créer la fiche de location"}
                    </button>
                  </div>
                </form>

                {/* Right Interactive Live Receipt Column */}
                <div className="hidden lg:flex lg:w-[380px] shrink-0 bg-neutral-50/60 border-l border-neutral-100 flex-col p-6 overflow-y-auto space-y-6">
                  <div className="space-y-1.5 pb-2 border-b border-neutral-200/60">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700">Aperçu en Temps Réel</h4>
                    <p className="text-[10px] text-neutral-400">Ce reçu officiel s'actualise au fur et à mesure de votre saisie.</p>
                  </div>

                  {/* Luxury Digital Ticket */}
                  <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-5 relative overflow-hidden space-y-5">
                    {/* Top ticket strip */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-gold-500 to-amber-600" />
                    
                    {/* Maison Head */}
                    <div className="text-center space-y-1 pt-2">
                      <h5 className="font-display font-black text-xs text-neutral-900 uppercase tracking-widest">Maison d'Élégance</h5>
                      <p className="text-[8px] text-neutral-400 uppercase tracking-widest">Location Haute Couture & Bijouterie • Alger</p>
                    </div>

                    {/* Dotted separator */}
                    <div className="border-t border-dashed border-neutral-200 my-3" />

                    {/* Client info */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Titulaire de la Location</p>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-neutral-800">{clientName || "— Sarah Amrani —"}</p>
                        {clientPhone && <p className="text-[10px] font-mono text-neutral-600">{clientPhone}</p>}
                        {clientInstagram && (
                          <p className="text-[9px] text-amber-700 font-medium flex items-center gap-1">
                            <Instagram className="w-3 h-3 shrink-0" />
                            <span>@{clientInstagram}</span>
                          </p>
                        )}
                        {clientAddress && <p className="text-[9px] text-neutral-500">{clientAddress}</p>}
                      </div>
                    </div>

                    {/* Selected vestiaire */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Vestiaire Loué</p>
                      <div className="space-y-2">
                        {selectedDresses.map((dress: any, idx) => (
                          <div key={dress.id || idx} className="flex justify-between text-xs p-2 bg-neutral-50 rounded-xl border border-neutral-100/60">
                            <div className="space-y-0.5">
                              <p className="font-bold text-neutral-800 text-[11px]">{dress.name}</p>
                              <p className="text-[9px] text-neutral-400 uppercase tracking-wider font-mono">ID: {dress.reference || dress.id.slice(0, 8)}</p>
                            </div>
                            <span className="font-mono font-bold text-neutral-700 shrink-0 text-[11px]">{formatCurrency(dress.rental_price)}</span>
                          </div>
                        ))}
                        {selectedDresses.length === 0 && (
                          <div className="text-[10px] text-neutral-400 italic p-2.5 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
                            Aucune robe sélectionnée
                          </div>
                        )}

                        {selectedJewelries.map((jewelry: any, idx) => (
                          <div key={jewelry.id || idx} className="flex justify-between text-xs p-2 bg-neutral-50 rounded-xl border border-neutral-100/60">
                            <div className="space-y-0.5">
                              <p className="font-bold text-neutral-800 text-[11px]">{jewelry.name}</p>
                              <p className="text-[9px] text-neutral-400 uppercase tracking-wider font-mono">ID: {jewelry.reference || jewelry.id.slice(0, 8)}</p>
                            </div>
                            <span className="font-mono font-bold text-neutral-700 shrink-0 text-[11px]">{formatCurrency(jewelry.rental_price)}</span>
                          </div>
                        ))}
                        {selectedJewelries.length === 0 && (
                          <div className="text-[10px] text-neutral-400 italic p-2.5 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
                            Aucun bijou sélectionné
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline dates */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Calendrier Contractuel</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-neutral-700 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                        <div>
                          <span className="block text-[8px] text-neutral-400 uppercase font-semibold">Date de Retrait</span>
                          <span className="font-mono text-neutral-900 font-bold mt-0.5 block">{outDate ? formatDate(outDate) : "—"}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-neutral-400 uppercase font-semibold">Date de Retour</span>
                          <span className="font-mono text-neutral-900 font-bold mt-0.5 block">{returnDate ? formatDate(returnDate) : "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Règlement & Solde</p>
                      <div className="space-y-1.5 text-xs text-neutral-700">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Total Location :</span>
                          <span className="font-mono font-semibold">{formatCurrency(price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Acompte initial :</span>
                          <span className="font-mono font-semibold text-emerald-600">-{formatCurrency(depositPaid)}</span>
                        </div>
                        <div className="border-t border-neutral-100 pt-1.5 flex justify-between font-bold text-neutral-800">
                          <span>Reste dû au retrait :</span>
                          <span className={`font-mono ${remainingToPay > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {formatCurrency(remainingToPay)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Caution Summary */}
                    {caution > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between items-center text-xs p-2.5 bg-amber-50/40 border border-amber-100/60 rounded-xl">
                          <div className="space-y-0.5 text-left">
                            <span className="block text-[8px] text-amber-800 uppercase font-bold tracking-wider">Caution Garantie</span>
                            <span className="font-mono text-neutral-900 font-extrabold">{formatCurrency(caution)}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            cautionStatus === 'recue' 
                              ? 'bg-amber-600 text-white' 
                              : cautionStatus === 'restituee'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}>
                            {cautionStatus === 'recue' ? 'Reçue' : cautionStatus === 'restituee' ? 'Restituée' : 'Non reçue'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Dotted bottom separator */}
                    <div className="border-t border-dashed border-neutral-200 my-2" />

                    {/* Footer instructions */}
                    <p className="text-[8px] text-neutral-400 text-center uppercase tracking-widest leading-normal">
                      Ce reçu fait foi de contrat de réservation officiel et garantit la disponibilité des articles pour les dates indiquées.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* Luxury Interactive Client Rental Detail Modal (ACTS AS OFFICIAL RECEIPT & CONTRACT SHEET) */}
      {activeDetailRental && (() => {
        const detailDressIds = activeDetailRental.dress_ids || (activeDetailRental.dress_id ? [activeDetailRental.dress_id] : []);
        const detailJewelryIds = activeDetailRental.jewelry_ids || (activeDetailRental.jewelry_id ? [activeDetailRental.jewelry_id] : []);
        const detailDresses = detailDressIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
        const detailJewelries = detailJewelryIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
        const overdue = isLate(activeDetailRental.return_date) && !activeDetailRental.is_returned;
        const daysText = getDaysRemainingText(activeDetailRental.return_date, activeDetailRental.is_returned);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden max-h-[92vh] animate-scale-up">
              
              {/* Modal controls */}
              <div className="p-4 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center no-print">
                <span className="text-xs font-mono font-bold text-neutral-500">Visualisation Fiche Client N° {activeDetailRental.id.slice(0, 8).toUpperCase()}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
                  </button>
                  <button
                    onClick={() => {
                      setIsFormOpen(false);
                      openEditForm(activeDetailRental);
                      setActiveDetailRental(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-50 hover:bg-gold-100 text-gold-800 border border-gold-200/50 rounded-lg text-xs font-bold transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => setActiveDetailRental(null)}
                    className="p-1.5 hover:bg-neutral-200 text-neutral-400 hover:text-black rounded-full transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div id="print-contract-area" className="p-8 overflow-y-auto space-y-6">
                
                {/* Store Branding Header */}
                <div className="text-center pb-6 border-b-2 border-double border-neutral-200">
                  <div className="flex justify-center items-center gap-1 text-gold-600 mb-1.5">
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <span className="font-serif-luxury uppercase tracking-[0.25em] text-lg font-bold">Maison d'Élégance</span>
                    <Sparkles className="w-5 h-5 shrink-0" />
                  </div>
                  <h1 className="text-xs uppercase tracking-[0.15em] text-neutral-400 font-mono">Alger • Hydra • Location Haute Couture</h1>
                  <p className="text-[10px] text-neutral-400 mt-1">Tél: 05 50 12 34 56 | Instagram: @maison_elegance_alger</p>
                  
                  <div className="mt-4 inline-block bg-neutral-950 text-white px-5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] rounded-full">
                    Fiche de Location & Contrat client
                  </div>
                </div>

                {/* Main Client and ID metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 pb-1">Bénéficiaire</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-neutral-900">{activeDetailRental.client_name}</p>
                      
                      <div className="text-xs text-neutral-600 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-mono">{activeDetailRental.client_phone}</span>
                        </p>
                        
                        {activeDetailRental.client_instagram && (
                          <p className="flex items-center gap-1.5">
                            <Instagram className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <a 
                              href={`https://instagram.com/${activeDetailRental.client_instagram.replace('@', '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-gold-700 hover:underline font-mono"
                            >
                              @{activeDetailRental.client_instagram.replace('@', '')}
                            </a>
                          </p>
                        )}

                        {activeDetailRental.client_address && (
                          <p className="flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{activeDetailRental.client_address}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 sm:border-l sm:border-neutral-100 sm:pl-4">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 pb-1">Référence Fiche</h4>
                    <div className="space-y-1.5 text-xs">
                      <p className="text-neutral-800 font-mono">
                        <span className="text-neutral-400">N° :</span> <span className="font-bold">LOC-{activeDetailRental.id.slice(0, 8).toUpperCase()}</span>
                      </p>
                      <p className="text-neutral-800">
                        <span className="text-neutral-400">Statut :</span>{' '}
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide ${
                          activeDetailRental.is_returned 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : overdue 
                              ? 'bg-red-100 text-red-800 animate-pulse' 
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {activeDetailRental.is_returned ? 'Restitué' : overdue ? 'En retard' : 'En cours'}
                        </span>
                      </p>
                      <p className="text-neutral-800 font-mono">
                        <span className="text-neutral-400">Date d'édition :</span> {formatDate(activeDetailRental.created_at || '2026-07-08')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wardrobe Items Details */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 pb-1">Articles Loués & Tarifs</h4>
                  
                  <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden bg-neutral-50/50">
                    {detailDresses.map((dress: any, idx) => (
                      <div key={dress.id || idx} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">👗</span>
                          <div>
                            <p className="font-bold text-neutral-900">{dress.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              Réf: {dress.reference} • Taille {dress.size} • Couleur {dress.color}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold font-mono text-neutral-800">{formatCurrency(dress.rental_price)}</p>
                      </div>
                    ))}
                    
                    {detailJewelries.map((jewelry: any, idx) => (
                      <div key={jewelry.id || idx} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💎</span>
                          <div>
                            <p className="font-bold text-neutral-900">{jewelry.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">Réf: {jewelry.reference}</p>
                          </div>
                        </div>
                        <p className="font-bold font-mono text-neutral-800">{formatCurrency(jewelry.rental_price)}</p>
                      </div>
                    ))}

                    {detailDresses.length === 0 && detailJewelries.length === 0 && (
                      <div className="p-4 text-center text-xs text-neutral-400 italic">
                        Aucun article n'est associé à cette fiche.
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline / Dates details */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 pb-1">Calendrier de Mise à Disposition</h4>
                  
                  <div className="grid grid-cols-3 gap-3 text-center bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Date de Sortie</p>
                      <p className="text-xs font-bold text-neutral-800 font-mono">{formatDate(activeDetailRental.out_date)}</p>
                      <p className="text-[9px] text-neutral-400 font-semibold italic">Enlèvement boutique</p>
                    </div>

                    <div className="border-x border-neutral-200 space-y-0.5">
                      <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Jour J (Événement)</p>
                      <p className="text-xs font-bold text-neutral-800 font-mono">{formatDate(activeDetailRental.event_date)}</p>
                      <p className="text-[9px] text-neutral-400 font-semibold italic">Fête de la cliente</p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Date de Retour</p>
                      <p className={`text-xs font-bold font-mono ${overdue ? 'text-red-600' : 'text-neutral-800'}`}>
                        {formatDate(activeDetailRental.return_date)}
                      </p>
                      <p className="text-[9px] text-neutral-400 font-semibold italic">Remise en stock</p>
                    </div>
                  </div>

                  {!activeDetailRental.is_returned && (
                    <div className="flex items-center gap-2 justify-center bg-gold-50/50 p-2.5 rounded-xl border border-gold-100/50 text-xs">
                      <Clock className="w-4 h-4 text-gold-600 shrink-0" />
                      <span className="font-semibold text-gold-800">Note de suivi : {daysText}</span>
                    </div>
                  )}
                </div>

                {/* Financial breakdown */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 pb-1">Suivi Financier</h4>
                  
                  <div className="bg-neutral-900 text-white p-4 rounded-2xl space-y-3 font-mono">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400">Total Prestation Location :</span>
                      <span className="font-bold text-sm text-neutral-200">{formatCurrency(activeDetailRental.price)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-400">Acompte d'Enregistrement :</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(activeDetailRental.deposit_paid)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-800">
                      <span className="text-neutral-400">Solde Restant dû (au retour) :</span>
                      <span className={`font-bold text-sm ${activeDetailRental.remaining_to_pay > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(activeDetailRental.remaining_to_pay)}
                      </span>
                    </div>

                    <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 font-sans">
                      <span>Moyen de règlement (acompte) : {activeDetailRental.payment_method}</span>
                      <span>Statut de caisse : {activeDetailRental.is_returned ? '🟢 Restitution réglée' : '🟠 Réservé'}</span>
                    </div>
                  </div>
                </div>

                {/* Notes and Particular Instructions */}
                {activeDetailRental.notes && (
                  <div className="space-y-1 bg-amber-50/40 p-4 rounded-2xl border border-amber-100 text-xs">
                    <h5 className="font-bold text-neutral-800">Notes d'ajustement boutique :</h5>
                    <p className="text-neutral-600 leading-relaxed italic">{activeDetailRental.notes}</p>
                  </div>
                )}

                {/* Contract terms to make it official */}
                <div className="pt-4 border-t border-dashed border-neutral-200 space-y-2.5">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Conditions Générales de Location (Extrait)</h4>
                  <ul className="text-[9px] text-neutral-400 space-y-1 list-disc list-inside">
                    <li>La cliente s'engage à restituer l'article dans son état d'origine à la date convenue.</li>
                    <li>Le nettoyage est exclusivement pris en charge par notre pressing partenaire (ne pas laver l'article).</li>
                    <li>Tout retard entraînera une pénalité automatique de <span className="font-bold text-neutral-600">2000 DA</span> par jour supplémentaire.</li>
                    <li>Toute dégradation majeure ou non-restitution sera facturée à hauteur de la valeur de l'article en stock.</li>
                  </ul>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">La Boutique (Maison d'Élégance)</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="text-[10px] text-neutral-300 italic">Signature & Cachet</p>
                    </div>
                    <div className="border-t border-neutral-200 mt-2"></div>
                  </div>

                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">La Cliente (Bon pour accord)</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="text-[10px] text-neutral-300 italic">Signature de la cliente</p>
                    </div>
                    <div className="border-t border-neutral-200 mt-2"></div>
                  </div>
                </div>

              </div>

              {/* Action footer */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2.5 no-print">
                <button
                  type="button"
                  onClick={() => setActiveDetailRental(null)}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-all"
                >
                  Fermer la vue
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Double Booking Confirmation Modal */}
      {pendingPayload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-neutral-100 shadow-2xl space-y-4 animate-scale-up text-center sm:text-left">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-100 mx-auto sm:mx-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-neutral-900 text-base">Double réservation détectée</h3>
              <p className="text-xs text-neutral-500">
                {conflictWarning}
              </p>
              <p className="text-[11px] text-neutral-400">
                Souhaitez-vous forcer l'enregistrement de cette réservation malgré tout ?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingPayload(null)}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  saveRental(pendingPayload);
                  setPendingPayload(null);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-amber-500/10"
              >
                Forcer l'enregistrement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {returnRentalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-neutral-100 shadow-2xl space-y-4 animate-scale-up text-center sm:text-left">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 mx-auto sm:mx-0">
              <Check className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-neutral-900 text-base">Enregistrer le retour boutique ?</h3>
              <p className="text-xs text-neutral-500">
                Confirmez-vous le retour boutique de l'article loué par <span className="font-bold text-neutral-800">"{returnRentalName}"</span> ?
              </p>
              {returnRemainingToPay > 0 && (
                <div className="bg-red-50 text-red-700 p-3 rounded-2xl border border-red-100 text-left mt-2 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider">⚠️ Solde restant dû</p>
                  <p className="text-xs font-semibold">
                    Le solde de <span className="font-mono font-bold text-sm">{formatCurrency(returnRemainingToPay)}</span> sera automatiquement ajouté aux encaissements de la caisse boutique.
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReturnRentalId(null);
                  setReturnRentalName('');
                  setReturnRemainingToPay(0);
                }}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onMarkReturned(returnRentalId);
                  setReturnRentalId(null);
                  setReturnRentalName('');
                  setReturnRemainingToPay(0);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-600/10"
              >
                Confirmer le Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteRentalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-neutral-100 shadow-2xl space-y-4 animate-scale-up text-center sm:text-left">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100 mx-auto sm:mx-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-neutral-900 text-base">Supprimer la réservation ?</h3>
              <p className="text-xs text-neutral-500">
                Êtes-vous sûr de vouloir supprimer définitivement la fiche de location de <span className="font-bold text-neutral-800">"{deleteRentalName}"</span> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteRentalId(null);
                  setDeleteRentalName('');
                }}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteRentalId) {
                    onDeleteRental(deleteRentalId);
                  }
                  setDeleteRentalId(null);
                  setDeleteRentalName('');
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
