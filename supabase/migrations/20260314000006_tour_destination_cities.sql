-- ============================================================
-- Tour destination_cities: multi-city destination support
-- Date: 2026-03-14
--
-- Adds destination_cities text[] so tour operators can specify
-- multiple cities for a tour (e.g. Lahore → Naran → Hunza).
-- location.city remains the primary/base city for backward compat.
-- ============================================================

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS destination_cities text[] NOT NULL DEFAULT '{}';

-- Backfill: seed destination_cities from location->>'city' for existing tours
-- so the new column is already populated for tours already in DB.
UPDATE public.tours
SET destination_cities = ARRAY[location->>'city']
WHERE destination_cities = '{}'
  AND location->>'city' IS NOT NULL
  AND location->>'city' <> '';

-- Index for filtering by destination city
CREATE INDEX IF NOT EXISTS idx_tours_destination_cities
  ON public.tours USING GIN (destination_cities);
