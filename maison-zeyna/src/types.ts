export interface Article {
  id: string;
  name: string;
  reference: string;
  category: 'robe' | 'bijou';
  color: string;
  size: string;
  rental_price: number;
  deposit: number;
  state: 'excellent' | 'tres_bon' | 'bon' | 'use';
  status: 'disponible' | 'loue';
  image_url: string;
  notes: string;
  created_at: string;
}

export interface Rental {
  id: string;
  client_name: string;
  client_phone: string;
  client_instagram?: string;
  client_address?: string;
  dress_id?: string; // ID of the rented dress
  jewelry_id?: string; // ID of the rented jewelry
  dress_ids?: string[]; // IDs of rented dresses
  jewelry_ids?: string[]; // IDs of rented jewelries
  out_date: string; // YYYY-MM-DD
  event_date: string; // YYYY-MM-DD
  return_date: string; // YYYY-MM-DD
  price: number;
  deposit_paid: number; // Acompte
  remaining_to_pay: number; // Reste à payer
  payment_method: string; // especes, carte, virement, chèque, etc.
  notes: string;
  is_returned: boolean;
  returned_at?: string;
  created_at: string;
}

export interface CashTransaction {
  id: string;
  type: 'entree' | 'sortie';
  amount: number;
  person: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  person: string;
  receipt_url?: string;
  payment_source?: 'caisse' | 'tresorerie';
  created_at: string;
}

export interface Settings {
  id: string;
  categories: string[];
  logo_url: string;
  store_name: string;
}

export interface DashboardStats {
  revenueToday: number;
  revenueMonth: number;
  activeRentalsCount: number;
  returnsTodayCount: number;
  outingsTodayCount: number;
  expensesMonth: number;
  currentCashInRegister: number;
  treasuryBalance: number;
}

export interface AlertData {
  id: string;
  type: 'outing_today' | 'return_today' | 'late_return' | 'remaining_payment' | 'tomorrow_booking';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  date: string;
  rentalId?: string;
}
