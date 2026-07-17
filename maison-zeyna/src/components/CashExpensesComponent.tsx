import React, { useState } from 'react';
import { CashTransaction, Expense } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Plus, Wallet, Trash2, Calendar, FileText, User, Filter, Search, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';

interface CashExpensesComponentProps {
  transactions: CashTransaction[];
  expenses: Expense[];
  currentCashInRegister: number;
  treasuryBalance: number;
  onAddTransaction: (tx: Omit<CashTransaction, 'id' | 'created_at'>) => void;
  onAddExpense: (exp: Omit<Expense, 'id' | 'created_at'>) => Promise<boolean>;
  onDeleteExpense: (id: string) => void;
}

export default function CashExpensesComponent({ 
  transactions, 
  expenses, 
  currentCashInRegister, 
  treasuryBalance,
  onAddTransaction, 
  onAddExpense,
  onDeleteExpense
}: CashExpensesComponentProps) {
  
  // Tab selector inside Caisse & Depenses
  const [activeTab, setActiveTab] = useState<'caisse' | 'depenses'>('caisse');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  // "Vider la caisse" Modal Form State
  const [isCaisseModalOpen, setIsCaisseModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawPerson, setWithdrawPerson] = useState('');
  const [withdrawDate, setWithdrawDate] = useState('2026-07-08');

  // "Ajouter dépense" Modal Form State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState('Pressing');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('2026-07-08');
  const [expensePerson, setExpensePerson] = useState('');
  const [expensePaymentSource, setExpensePaymentSource] = useState<'caisse' | 'tresorerie'>('caisse');

  // Custom confirmation modal states
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [deleteExpenseCategory, setDeleteExpenseCategory] = useState<string>('');
  const [deleteExpenseAmount, setDeleteExpenseAmount] = useState<number>(0);
  const [forceWithdrawPayload, setForceWithdrawPayload] = useState<{ amount: number, person: string, date: string } | null>(null);

  // Auto-calculated totals
  const totalExpensesMonth = expenses
    .filter(e => e.date.startsWith('2026-07'))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpensesYear = expenses
    .filter(e => e.date.startsWith('2026'))
    .reduce((sum, e) => sum + e.amount, 0);

  const saveWithdrawal = (amount: number, person: string, date: string) => {
    onAddTransaction({
      type: 'sortie',
      amount: Number(amount),
      person: person,
      date: date,
      time: new Date().toTimeString().slice(0, 5),
      reason: 'Retrait caisse'
    });

    setIsCaisseModalOpen(false);
    setWithdrawAmount(0);
    setWithdrawPerson('');
    setWithdrawDate('2026-07-08');
  };

  const handleViderCaisse = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || !withdrawPerson || !withdrawDate) {
      alert('Veuillez remplir correctement tous les champs.');
      return;
    }

    if (withdrawAmount > currentCashInRegister) {
      setForceWithdrawPayload({
        amount: withdrawAmount,
        person: withdrawPerson,
        date: withdrawDate
      });
    } else {
      saveWithdrawal(withdrawAmount, withdrawPerson, withdrawDate);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expensePerson || !expenseDescription) {
      alert('Veuillez remplir correctement le montant, la personne et le descriptif.');
      return;
    }

    const success = await onAddExpense({
      amount: Number(expenseAmount),
      category: expenseCategory,
      description: expenseDescription,
      date: expenseDate,
      person: expensePerson,
      payment_source: expensePaymentSource
    });

    if (success) {
      setIsExpenseModalOpen(false);
      setExpenseAmount(0);
      setExpenseDescription('');
      setExpensePerson('');
      setExpensePaymentSource('caisse');
    }
  };

  const uniqueExpenseCategories = Array.from(new Set(expenses.map(e => e.category)));

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.person.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCategory = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="cash-expenses-section" className="space-y-6">
      {/* Mini tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('caisse')}
          className={`pb-3 px-6 text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'caisse' 
              ? 'border-gold-500 text-gold-600 font-extrabold' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Wallet className="w-4 h-4" /> 👛 Gestion de la Caisse
        </button>
        <button
          onClick={() => setActiveTab('depenses')}
          className={`pb-3 px-6 text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'depenses' 
              ? 'border-gold-500 text-gold-600 font-extrabold' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <TrendingDown className="w-4 h-4" /> 🧾 Dépenses & Pressing
        </button>
      </div>

      {activeTab === 'caisse' ? (
        <div className="space-y-6">
          {/* Caisse Balance dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Caisse du Magasin */}
            <div className="bg-[#111111] text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-gold-500/20 relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400">💰 Caisse du Magasin</span>
                <h3 className="text-3xl font-mono font-bold tracking-tight text-white flex items-center">
                  {formatCurrency(currentCashInRegister)}
                </h3>
                <p className="text-[11px] text-gray-400 leading-normal">Argent physique dans le tiroir-caisse boutique.</p>
              </div>

              <button
                onClick={() => setIsCaisseModalOpen(true)}
                className="mt-4 px-4 py-2.5 bg-gold-500 text-black hover:bg-gold-600 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-md self-stretch text-center"
              >
                💸 Vider la Caisse
              </button>
            </div>

            {/* Card 2: Trésorerie */}
            <div className="bg-[#18181b] text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-neutral-800 relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400">💼 Trésorerie (Espèces disponibles)</span>
                <h3 className="text-3xl font-mono font-bold tracking-tight text-white flex items-center">
                  {formatCurrency(treasuryBalance)}
                </h3>
                <p className="text-[11px] text-gray-400 leading-normal">Argent retiré de la caisse pour le règlement futur des charges.</p>
              </div>
              
              <div className="mt-4 text-[10px] text-gray-400 bg-neutral-800/40 py-2.5 px-3 rounded-lg flex justify-between items-center font-semibold border border-neutral-800">
                <span>Alimentation par retrait :</span>
                <span className="font-mono text-gold-400">Automatique</span>
              </div>
            </div>

            {/* Card 3: Contrôle de Caisse */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">📊 Contrôle des flux</span>
              <div className="space-y-1.5 py-1">
                <p className="text-xs text-gray-600 flex justify-between">
                  <span>Entrées (Caisse) :</span>
                  <span className="font-mono font-bold text-green-600">
                    +{formatCurrency(transactions.filter(t => t.type === 'entree').reduce((s, t) => s + t.amount, 0))}
                  </span>
                </p>
                <p className="text-xs text-gray-600 flex justify-between">
                  <span>Transferts (Retraits) :</span>
                  <span className="font-mono font-bold text-red-500">
                    -{formatCurrency(transactions.filter(t => t.type === 'sortie' && (t.reason === 'Retrait caisse' || t.reason.startsWith('Retrait'))).reduce((s, t) => s + t.amount, 0))}
                  </span>
                </p>
                <p className="text-xs text-gray-600 flex justify-between border-t border-gray-100 pt-1.5 mt-1">
                  <span>Dépenses via Trésorerie :</span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatCurrency(expenses.filter(e => e.payment_source === 'tresorerie').reduce((s, e) => s + e.amount, 0))}
                  </span>
                </p>
              </div>
              <p className="text-[10px] text-gray-400 italic mt-1 text-center bg-gray-50 py-1 rounded-lg">Données en temps réel</p>
            </div>
          </div>

          {/* Ledger table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-display font-bold text-gray-950 text-base">Historique Complet des Mouvements de Caisse</h3>
              <span className="text-xs text-gray-500 font-mono">Nombre d'opérations: {transactions.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100/60 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Montant (DA)</th>
                    <th className="py-3 px-6">Date & Heure</th>
                    <th className="py-3 px-6">Intervenant</th>
                    <th className="py-3 px-6">Description / Motif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="py-4 px-6 font-bold">
                        {tx.type === 'entree' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-bold">
                            <TrendingUp className="w-3.5 h-3.5" /> ENTRÉE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-full font-bold">
                            <TrendingDown className="w-3.5 h-3.5" /> RETRAIT
                          </span>
                        )}
                      </td>
                      <td className={`py-4 px-6 font-mono font-bold text-sm ${tx.type === 'entree' ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.type === 'entree' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">
                        <span className="font-semibold text-gray-800">{formatDate(tx.date)}</span> <span className="text-gray-400 ml-1 font-mono">{tx.time}</span>
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-gray-800 flex items-center gap-1.5 mt-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {tx.person}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-600 italic">
                        {tx.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Expenses Dashboard summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Dépenses du Mois (Juillet)</span>
              <p className="text-3xl font-mono font-bold text-red-500 mt-2">{formatCurrency(totalExpensesMonth)}</p>
              <p className="text-[10px] text-gray-400 mt-1">Pressing, entretien, fournitures boutique</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Cumul Annuel (2026)</span>
              <p className="text-3xl font-mono font-bold text-black mt-2">{formatCurrency(totalExpensesYear)}</p>
              <p className="text-[10px] text-gray-400 mt-1">Tous mois confondus</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between items-start">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Nouvelle Charge</span>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="mt-3 w-full py-3 bg-[#111111] hover:bg-gold-500 hover:text-black text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm"
              >
                ➕ Ajouter une Dépense
              </button>
            </div>
          </div>

          {/* Expenses table with search & filter */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <h3 className="font-display font-bold text-gray-950 text-base">Fiches de Justificatifs des Dépenses</h3>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Rechercher descriptif..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                />

                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="all">Toutes les catégories</option>
                  {uniqueExpenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100/60 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-6">Catégorie</th>
                    <th className="py-3 px-6">Montant (DA)</th>
                    <th className="py-3 px-6">Date d'effet</th>
                    <th className="py-3 px-6">Réglé par</th>
                    <th className="py-3 px-6">Source</th>
                    <th className="py-3 px-6">Détails / Descriptif</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50/50 transition-all text-xs">
                      <td className="py-4 px-6 font-semibold">
                        <span className="bg-amber-100/60 text-amber-800 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide text-[9px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-sm text-red-600">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td className="py-4 px-6 text-gray-500 font-medium">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-4 px-6 text-gray-700 font-semibold">
                        {exp.person}
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        {exp.payment_source === 'tresorerie' ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            💼 Trésorerie
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            💰 Caisse
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600 italic">
                        {exp.description}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setDeleteExpenseId(exp.id);
                            setDeleteExpenseCategory(exp.category);
                            setDeleteExpenseAmount(exp.amount);
                          }}
                          className="p-1.5 text-red-500 bg-red-50/70 hover:bg-red-500 hover:text-white border border-red-100/50 hover:border-red-500 rounded-xl shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center inline-flex"
                          title="Supprimer la dépense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* "Vider la caisse" Withdrawal Modal */}
      {isCaisseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-gray-100 animate-zoom-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-display font-bold text-gray-950 flex items-center gap-1.5">
                <span>💸 Retrait Coffre / Vider la Caisse</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsCaisseModalOpen(false)} 
                className="text-gray-400 hover:text-black hover:bg-gray-100 p-1.5 rounded-full transition-all focus:outline-none"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleViderCaisse} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Montant à retirer (DA) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Ex: 500"
                  value={withdrawAmount || ''}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Retiré par (Nom de l'intervenant) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Zeyna (Gérante)"
                  value={withdrawPerson}
                  onChange={(e) => setWithdrawPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date du retrait *</label>
                <input
                  type="date"
                  required
                  value={withdrawDate}
                  onChange={(e) => setWithdrawDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none font-mono focus:border-gold-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCaisseModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all text-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Confirmer le Retrait
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "Ajouter Dépense" Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-gray-100 animate-zoom-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-display font-bold text-gray-950">➕ Enregistrer une nouvelle charge</h3>
              <button 
                type="button"
                onClick={() => setIsExpenseModalOpen(false)} 
                className="text-gray-400 hover:text-black hover:bg-gray-100 p-1.5 rounded-full transition-all focus:outline-none"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Montant (DA) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 85"
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none font-bold font-mono text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Catégorie *</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold-500"
                  >
                    <option value="Pressing">🧺 Pressing</option>
                    <option value="Marketing">📢 Marketing / Publicité</option>
                    <option value="Achat Robe">👗 Achat de Robe</option>
                    <option value="Loyer">🏢 Loyer & Électricité</option>
                    <option value="Frais de port">📦 Frais de port</option>
                    <option value="Autre">💡 Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Acheteur / Payé par *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Yasmine (Employée)"
                  value={expensePerson}
                  onChange={(e) => setExpensePerson(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Source de paiement *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpensePaymentSource('caisse')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      expensePaymentSource === 'caisse'
                        ? 'bg-[#111111] border-[#111111] text-white shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    💰 Caisse ({formatCurrency(currentCashInRegister)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpensePaymentSource('tresorerie')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      expensePaymentSource === 'tresorerie'
                        ? 'bg-[#111111] border-[#111111] text-white shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    💼 Trésorerie ({formatCurrency(treasuryBalance)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date d'effet *</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Détails / Descriptif précis *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Nettoyage à sec robe Princesse Diana suite retour taches..."
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all text-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#111111] hover:bg-gold-500 hover:text-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Force Withdrawal Confirmation Modal */}
      {forceWithdrawPayload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-neutral-100 shadow-2xl space-y-4 animate-scale-up text-center sm:text-left">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-100 mx-auto sm:mx-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-neutral-900 text-base">Caisse insuffisante</h3>
              <p className="text-xs text-neutral-500">
                Le montant demandé (<span className="font-mono font-bold text-neutral-800">{formatCurrency(forceWithdrawPayload.amount)}</span>) dépasse l'argent disponible actuellement dans la caisse boutique (<span className="font-mono font-bold text-neutral-800">{formatCurrency(currentCashInRegister)}</span>).
              </p>
              <p className="text-[11px] text-amber-600 font-semibold">
                Souhaitez-vous tout de même forcer ce retrait de caisse ? (Le solde de caisse deviendra négatif).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setForceWithdrawPayload(null)}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  saveWithdrawal(forceWithdrawPayload.amount, forceWithdrawPayload.person, forceWithdrawPayload.date);
                  setForceWithdrawPayload(null);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-amber-500/10"
              >
                Forcer le Retrait
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {deleteExpenseId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-neutral-100 shadow-2xl space-y-4 animate-scale-up text-center sm:text-left">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100 mx-auto sm:mx-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-neutral-900 text-base">Supprimer la dépense ?</h3>
              <p className="text-xs text-neutral-500">
                Êtes-vous sûr de vouloir supprimer définitivement cette dépense de catégorie <span className="font-bold text-neutral-800">"{deleteExpenseCategory}"</span> d'un montant de <span className="font-mono font-bold text-neutral-800">{formatCurrency(deleteExpenseAmount)}</span> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteExpenseId(null);
                  setDeleteExpenseCategory('');
                  setDeleteExpenseAmount(0);
                }}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs uppercase tracking-wide transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteExpenseId) {
                    onDeleteExpense(deleteExpenseId);
                  }
                  setDeleteExpenseId(null);
                  setDeleteExpenseCategory('');
                  setDeleteExpenseAmount(0);
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
