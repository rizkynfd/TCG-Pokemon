-- Migration 003_add_flair_level.sql
-- Run this in your Supabase SQL Editor to support Option B (Card Flair Upgrades)

ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS flair_level INT DEFAULT 0;

-- Optional: If you want to limit the max flair level at DB level, uncomment below:
-- ALTER TABLE inventory ADD CONSTRAINT check_flair_level CHECK (flair_level >= 0 AND flair_level <= 3);
