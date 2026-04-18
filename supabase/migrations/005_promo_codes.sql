-- Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('coins', 'gems', 'dust')),
    reward_amount INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,      -- if NULL, unlimited uses
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Redemption History (To prevent users from redeeming the same code twice)
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(promo_code_id, user_id) -- One redemption per user per code
);

-- Setup RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Everyone can SELECT active promo codes to validate them
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Users can only see their own redemptions
CREATE POLICY "Users can view their own redemptions" ON public.promo_redemptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only admins can write to promo_codes, but we use Service Role for creations so we don't strictly need insert policies.
