-- ================================================================
-- Migration 004: Fix duplicate card inventory logic
-- Memberikan dukungan operasi atomik untuk penambahan quantity
-- ================================================================

-- Function: Upsert inventory card with atomic increment
-- Menjamin quantity = quantity + p_inc_qty jika kartu sudah dimiliki
CREATE OR REPLACE FUNCTION public.upsert_inventory_card(
  p_user_id UUID,
  p_card_id TEXT,
  p_inc_qty INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.inventory (user_id, card_id, quantity)
  VALUES (p_user_id, p_card_id, p_inc_qty)
  ON CONFLICT (user_id, card_id)
  DO UPDATE SET 
    quantity = inventory.quantity + EXCLUDED.quantity,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Socratic Comment: 
-- Menggunakan INSERT ... ON CONFLICT (user_id, card_id) DO UPDATE 
-- adalah cara standard di PostgreSQL untuk menangani race conditions 
-- dan memastikan data integrity tanpa harus melakukan SELECT terlebih dahulu.
