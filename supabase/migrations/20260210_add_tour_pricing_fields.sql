-- Migration to add missing pricing and policy columns to tours table

ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS group_discounts BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS seasonal_pricing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS peak_season_multiplier NUMERIC DEFAULT 1.2,
ADD COLUMN IF NOT EXISTS off_season_multiplier NUMERIC DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'flexible';
