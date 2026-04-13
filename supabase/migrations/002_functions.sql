-- ================================================================
-- Migration 002: Helper functions
-- Copy-paste ke Supabase SQL Editor dan RUN
-- ================================================================

-- Function: increment card quantity in inventory
CREATE OR REPLACE FUNCTION public.increment_card_quantity(
  p_user_id UUID,
  p_card_id TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.inventory
  SET quantity = quantity + 1
  WHERE user_id = p_user_id AND card_id = p_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: claim daily reward (atomic update)
CREATE OR REPLACE FUNCTION public.claim_daily_reward(
  p_user_id UUID,
  p_coins INTEGER,
  p_gems INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    coins = coins + p_coins,
    gems  = gems + p_gems,
    streak_days = CASE
      WHEN last_daily_claimed > NOW() - INTERVAL '36 hours'
      THEN streak_days + 1
      ELSE 1
    END,
    last_daily_claimed = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
