import React, { useState } from 'react';
import { Rental, Article } from '../types';
import { Calendar as CalendarIcon, Clock, User, Phone, Tag, DollarSign, FileText, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface CalendarProps {
  rentals: Rental[];
  articles: Article[];
  onAddRental: (date: string) => void;
  onViewRental: (rental: Rental) => void;
}

export default function CalendarComponent({ rentals, articles, onAddRental, onViewRental }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 8)); // July 2026 (align with hardcoded reference date)
  const [selectedDayRentals, setSelectedDayRentals] = useState<{
    date: string;
    rentals: Rental[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    // 0 is Sunday, 1 is Monday... adapt to Mon-Sun layout
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayRentals(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayRentals(null);
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Helper to find activities on a specific date string (YYYY-MM-DD)
  const getActivitiesForDate = (dateStr: string) => {
    const list: { type: 'event' | 'out' | 'return'; rental: Rental }[] = [];
    rentals.forEach(r => {
      if (r.event_date === dateStr) list.push({ type: 'event', rental: r });
      if (r.out_date === dateStr) list.push({ type: 'out', rental: r });
      if (r.return_date === dateStr) list.push({ type: 'return', rental: r });
    });
    return list;
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayActs = rentals.filter(r => r.event_date === dateStr || r.out_date === dateStr || r.return_date === dateStr);
    setSelectedDayRentals({
      date: dateStr,
      rentals: dayActs
    });
  };

  return (
    <div id="calendar-section" className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gold-500" />
            Calendrier des Locations
          </h2>
          <p className="text-xs text-gray-400 mt-1">Consultez et planifiez les sorties, événements et retours</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 self-stretch sm:self-auto justify-between">
          <button 
            onClick={prevMonth} 
            className="p-1.5 hover:bg-white rounded-lg transition-all hover:shadow-sm text-gray-600"
            title="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold px-4 text-gray-800 min-w-[120px] text-center font-display uppercase tracking-wider">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={nextMonth} 
            className="p-1.5 hover:bg-white rounded-lg transition-all hover:shadow-sm text-gray-600"
            title="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center mb-6 text-[11px] text-gray-500 uppercase tracking-widest font-semibold bg-gold-50/40 px-4 py-2.5 rounded-xl border border-gold-100/50">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200"></span>
          🟢 Jour d'Événement
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-200"></span>
          🟠 Sortie de la robe
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span>
          🔵 Retour boutique
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-6 flex-1">
        {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1 font-display tracking-wider">
            {d}
          </div>
        ))}

        {blanks.map(b => (
          <div key={`blank-${b}`} className="min-h-[75px] bg-gray-50/30 rounded-xl border border-gray-100/30"></div>
        ))}

        {days.map(day => {
          const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const acts = getActivitiesForDate(dayStr);
          const isToday = dayStr === '2026-07-08';
          const isSelected = selectedDayRentals?.date === dayStr;

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDayClick(day)}
              className={`min-h-[75px] border rounded-xl p-1.5 flex flex-col justify-between transition-all text-left focus:outline-none relative group ${
                isSelected 
                  ? 'border-gold-500 bg-gold-50/30 ring-1 ring-gold-500/50' 
                  : isToday 
                    ? 'border-black bg-neutral-900 text-white shadow-md' 
                    : 'border-gray-100 hover:border-gold-300 hover:bg-gray-50 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold font-mono ${isToday ? 'text-gold-500' : 'text-gray-900'}`}>
                  {day}
                </span>
                {isToday && (
                  <span className="text-[8px] font-bold px-1 py-0.5 bg-gold-500 text-black rounded font-sans leading-none">
                    AUJ
                  </span>
                )}
              </div>

              {/* Dots of Activities */}
              {acts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {acts.slice(0, 3).map((act, index) => {
                    let dotColor = 'bg-green-500';
                    if (act.type === 'out') dotColor = 'bg-orange-500';
                    if (act.type === 'return') dotColor = 'bg-blue-500';
                    return (
                      <span 
                        key={index} 
                        className={`w-2 h-2 rounded-full ${dotColor}`}
                        title={`${act.type === 'event' ? 'Événement' : act.type === 'out' ? 'Sortie' : 'Retour'}: ${act.rental.client_name}`}
                      />
                    );
                  })}
                  {acts.length > 3 && (
                    <span className="text-[8px] font-bold text-gray-500 leading-none">+{acts.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Details Panel */}
      {selectedDayRentals && (
        <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 transition-all animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 font-display">
              Activités du {new Date(selectedDayRentals.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddRental(selectedDayRentals.date)}
                className="flex items-center gap-1 text-[11px] font-bold text-gold-600 hover:text-gold-700 bg-gold-100/50 hover:bg-gold-100 px-2.5 py-1 rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Réserver ce jour
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayRentals(null)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-200/50 rounded-lg transition-all focus:outline-none"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedDayRentals.rentals.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2 text-center">Aucune activité enregistrée pour ce jour.</p>
          ) : (
            <div className="space-y-3">
              {selectedDayRentals.rentals.map((rental) => {
                const isOuting = rental.out_date === selectedDayRentals.date;
                const isEvent = rental.event_date === selectedDayRentals.date;
                const isReturn = rental.return_date === selectedDayRentals.date;

                const dress = articles.find(a => a.id === rental.dress_id);
                const jewelry = articles.find(a => a.id === rental.jewelry_id);

                return (
                  <div 
                    key={rental.id} 
                    onClick={() => onViewRental(rental)}
                    className="p-3 bg-white hover:bg-neutral-50 rounded-xl border border-gray-200/60 shadow-sm cursor-pointer transition-all hover:border-gold-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {isOuting && <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">🟠 Sortie</span>}
                        {isEvent && <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 rounded-md">🟢 Événement</span>}
                        {isReturn && <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">🔵 Retour</span>}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {rental.id.slice(0, 5)}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {rental.client_name}
                        </p>
                        <p className="text-gray-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {rental.client_phone}
                        </p>
                        {rental.client_instagram && (
                          <p className="text-gold-600 font-medium">📷 {rental.client_instagram}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-gray-800 font-semibold truncate flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-gold-500" />
                          {dress?.name || 'Pas de robe'}
                        </p>
                        {jewelry && (
                          <p className="text-gray-600 truncate">💎 {jewelry.name}</p>
                        )}
                        <p className="text-gray-900 font-bold flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-green-600" />
                          {formatCurrency(rental.price)} <span className="text-[10px] text-gray-400 font-normal ml-1">({formatCurrency(rental.deposit_paid)} acompte)</span>
                        </p>
                      </div>
                    </div>

                    {rental.notes && (
                      <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg mt-2 border-l-2 border-gold-400 italic">
                        "{rental.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
