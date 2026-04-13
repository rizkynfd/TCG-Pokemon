-- ================================================================
-- PokéVault TCG — Supabase Database Migration
-- Copy-paste seluruh file ini ke Supabase SQL Editor lalu RUN
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- TABLE: profiles (extends auth.users)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  title TEXT DEFAULT 'Rookie Trainer',
  coins INTEGER DEFAULT 500 CHECK (coins >= 0),
  dust INTEGER DEFAULT 0 CHECK (dust >= 0),
  gems INTEGER DEFAULT 50 CHECK (gems >= 0),
  pity_rare INTEGER DEFAULT 0,
  pity_ultra INTEGER DEFAULT 0,
  total_pulls INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_daily_claimed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE: cards (catalog dari pokemontcg.io)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  set_id TEXT NOT NULL,
  set_name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  rarity_tier INTEGER NOT NULL CHECK (rarity_tier BETWEEN 1 AND 5),
  type TEXT,
  hp INTEGER,
  image_url TEXT NOT NULL,
  image_url_hires TEXT,
  dust_value INTEGER NOT NULL DEFAULT 5,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE: packs
-- ================================================================
CREATE TABLE IF NOT EXISTS public.packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cost_coins INTEGER NOT NULL DEFAULT 100,
  cost_gems INTEGER DEFAULT 0,
  cards_count INTEGER DEFAULT 5,
  set_filter TEXT[],
  rarity_boost JSONB,
  is_limited BOOLEAN DEFAULT FALSE,
  limited_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE: inventory
-- ================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT REFERENCES public.cards(id) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  is_favorite BOOLEAN DEFAULT FALSE,
  in_wishlist BOOLEAN DEFAULT FALSE,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- ================================================================
-- TABLE: pull_history
-- ================================================================
CREATE TABLE IF NOT EXISTS public.pull_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pack_id UUID REFERENCES public.packs(id) NOT NULL,
  card_id TEXT REFERENCES public.cards(id) NOT NULL,
  is_duplicate BOOLEAN DEFAULT FALSE,
  dust_received INTEGER DEFAULT 0,
  is_pity BOOLEAN DEFAULT FALSE,
  pulled_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE: quests
-- ================================================================
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'achievement')),
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 1,
  reward_coins INTEGER DEFAULT 0,
  reward_dust INTEGER DEFAULT 0,
  reward_gems INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- ================================================================
-- TABLE: user_quests
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES public.quests(id) NOT NULL,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  resets_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- ================================================================
-- TABLE: transactions
-- ================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  coins_delta INTEGER DEFAULT 0,
  dust_delta INTEGER DEFAULT 0,
  gems_delta INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE: crafting_recipes
-- ================================================================
CREATE TABLE IF NOT EXISTS public.crafting_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id TEXT REFERENCES public.cards(id) NOT NULL,
  dust_cost INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE(card_id)
);

-- ================================================================
-- INDEXES (untuk performa query)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_card_id ON public.inventory(card_id);
CREATE INDEX IF NOT EXISTS idx_pull_history_user_id ON public.pull_history(user_id);
CREATE INDEX IF NOT EXISTS idx_pull_history_pulled_at ON public.pull_history(pulled_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_rarity_tier ON public.cards(rarity_tier);
CREATE INDEX IF NOT EXISTS idx_cards_set_id ON public.cards(set_id);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pull_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa akses milik sendiri
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Inventory: private per user
CREATE POLICY "Users access own inventory"
  ON public.inventory FOR ALL USING (auth.uid() = user_id);

-- Pull history: private per user
CREATE POLICY "Users access own pull history"
  ON public.pull_history FOR ALL USING (auth.uid() = user_id);

-- User quests: private per user
CREATE POLICY "Users access own quests"
  ON public.user_quests FOR ALL USING (auth.uid() = user_id);

-- Transactions: private per user
CREATE POLICY "Users access own transactions"
  ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Public read-only untuk catalog
CREATE POLICY "Public read cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Public read packs" ON public.packs FOR SELECT USING (true);
CREATE POLICY "Public read quests" ON public.quests FOR SELECT USING (true);

-- ================================================================
-- TRIGGER: Auto-create profile saat user register
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- SEED DATA: Default packs
-- ================================================================
INSERT INTO public.packs (name, description, cost_coins, cost_gems, cards_count, is_active)
VALUES
  ('Standard Pack', 'Buka 5 kartu dari koleksi umum. Cocok untuk pemula!', 100, 0, 5, true),
  ('Premium Pack', 'Buka 5 kartu dengan peluang Rare lebih tinggi!', 250, 0, 5, true),
  ('Ultra Pack', 'Buka 10 kartu! Dijamin minimal 1 Ultra Rare.', 600, 0, 10, true),
  ('Gem Pack', 'Pack eksklusif dengan kartu terlangka!', 0, 10, 5, true)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED DATA: Daily Quests
-- ================================================================
INSERT INTO public.quests (title, description, type, condition_type, condition_value, reward_coins, reward_dust, reward_gems)
VALUES
  ('Pembuka Pack', 'Buka 1 pack hari ini', 'daily', 'pack_open', 1, 50, 0, 0),
  ('Kolektor Rajin', 'Dapatkan 5 kartu baru hari ini', 'daily', 'pull_count', 5, 75, 10, 0),
  ('Pemburu Rare', 'Dapatkan 1 kartu Rare atau lebih tinggi', 'daily', 'rare_pull', 1, 100, 25, 0),
  ('Login Harian', 'Login dan klaim reward harian', 'daily', 'daily_login', 1, 30, 0, 0),
  ('Master Koleksi', 'Kumpulkan 50 kartu berbeda', 'achievement', 'unique_cards', 50, 500, 100, 5),
  ('Penakluk Pack', 'Buka total 100 pack', 'achievement', 'total_pack_open', 100, 1000, 200, 10)
ON CONFLICT DO NOTHING;
