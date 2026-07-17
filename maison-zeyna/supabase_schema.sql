-- ==========================================
-- MAISON ZEYNA - SUPABASE DATABASE SCHEMA
-- ==========================================
-- Copiez-collez ce script dans l'éditeur SQL de votre projet Supabase pour créer toutes les tables et activer la sécurité.

-- Activer l'extension uuid-ossp si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Articles (Catalogue)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    reference VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('robe', 'bijou')),
    color VARCHAR(100),
    size VARCHAR(50),
    rental_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deposit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    state VARCHAR(50) NOT NULL DEFAULT 'excellent', -- excellent, tres_bon, bon, use
    status VARCHAR(50) NOT NULL DEFAULT 'disponible', -- disponible, loue
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Table des Locations
CREATE TABLE IF NOT EXISTS public.rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(100) NOT NULL,
    client_instagram VARCHAR(255),
    client_address TEXT,
    dress_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    jewelry_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    dress_ids UUID[] DEFAULT ARRAY[]::UUID[],
    jewelry_ids UUID[] DEFAULT ARRAY[]::UUID[],
    out_date DATE NOT NULL,
    event_date DATE NOT NULL,
    return_date DATE NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deposit_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    remaining_to_pay DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(100) NOT NULL, -- especes, carte, virement, chèque
    notes TEXT,
    is_returned BOOLEAN NOT NULL DEFAULT FALSE,
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Table de l'historique de Caisse
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('entree', 'sortie')),
    amount DECIMAL(10, 2) NOT NULL,
    person VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Table des Dépenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    person VARCHAR(255) NOT NULL,
    payment_source VARCHAR(50) NOT NULL DEFAULT 'caisse' CHECK (payment_source IN ('caisse', 'tresorerie')),
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Table des Paramètres
CREATE TABLE IF NOT EXISTS public.settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    categories TEXT[] NOT NULL DEFAULT ARRAY['Robe de mariée', 'Robe de soirée', 'Kaftan', 'Collier', 'Couronne', 'Parure'],
    logo_url TEXT,
    store_name VARCHAR(255) NOT NULL DEFAULT 'Maison Zeyna'
);

-- Insérer les paramètres par défaut
INSERT INTO public.settings (id, categories, store_name)
VALUES ('default', ARRAY['Robe de mariée', 'Robe de soirée', 'Kaftan', 'Collier', 'Couronne', 'Parure'], 'Maison Zeyna')
ON CONFLICT (id) DO NOTHING;

-- Activer la sécurité de niveau ligne (Row Level Security - RLS) sur toutes les tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité (RLS) permissives pour simplifier la communication via l'API Node.js
-- (À restreindre en production selon les besoins d'authentification des employés)
CREATE POLICY "Access All Articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Access All Rentals" ON public.rentals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Access All Cash Transactions" ON public.cash_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Access All Expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Access All Settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
