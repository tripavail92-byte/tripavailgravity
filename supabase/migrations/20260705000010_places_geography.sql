-- ============================================================================
-- Phase 0 · Layer 1 — Canonical geography (Country → Region → City)
-- Date: 2026-07-05
--
-- Introduces a single normalized `places` hierarchy and nullable place_id FKs on
-- the listing tables, so geography stops being free-text scattered across
-- tours.location JSONB / hotels.city|country / tour_pickup_locations.
--
-- Fully ADDITIVE + IDEMPOTENT: new table, nullable columns, seed of known
-- markets, and a CONSERVATIVE backfill that links ONLY exact city-name matches
-- (leaves place_id NULL where ambiguous — full curation is a follow-up via an
-- admin tool). Nothing existing is dropped or made stricter.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.places (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         text NOT NULL CHECK (kind IN ('country', 'region', 'city')),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  parent_id    uuid REFERENCES public.places(id) ON DELETE SET NULL,
  country_code text,                       -- ISO-3166-1 alpha-2, e.g. 'PK','AE'
  lat          double precision,
  lng          double precision,
  timezone     text,                       -- IANA tz, e.g. 'Asia/Karachi'
  hero_media   text,                       -- storage/CDN key for the region hero image
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at   timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_places_kind         ON public.places (kind);
CREATE INDEX IF NOT EXISTS idx_places_parent       ON public.places (parent_id);
CREATE INDEX IF NOT EXISTS idx_places_country_code ON public.places (country_code);

-- RLS: anyone may read active places; only admins may write.
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='places' AND policyname='places_public_read') THEN
    CREATE POLICY places_public_read ON public.places FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='places' AND policyname='places_admin_write') THEN
    CREATE POLICY places_admin_write ON public.places FOR ALL
      USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Listings point at a place (nullable during rollout; backfilled below).
ALTER TABLE public.tours    ADD COLUMN IF NOT EXISTS place_id uuid REFERENCES public.places(id) ON DELETE SET NULL;
ALTER TABLE public.hotels   ADD COLUMN IF NOT EXISTS place_id uuid REFERENCES public.places(id) ON DELETE SET NULL;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS place_id uuid REFERENCES public.places(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tours_place    ON public.tours (place_id);
CREATE INDEX IF NOT EXISTS idx_hotels_place   ON public.hotels (place_id);
CREATE INDEX IF NOT EXISTS idx_packages_place ON public.packages (place_id);

-- ── Seed known markets (base = Pakistan, first expansion = UAE) + seeded demo geos ──
INSERT INTO public.places (kind, name, slug, country_code, lat, lng, timezone) VALUES
  ('country','Pakistan',            'pakistan',              'PK', 30.3753, 69.3451, 'Asia/Karachi'),
  ('country','United Arab Emirates','united-arab-emirates',  'AE', 23.4241, 53.8478, 'Asia/Dubai'),
  ('country','Saudi Arabia',        'saudi-arabia',          'SA', 23.8859, 45.0792, 'Asia/Riyadh'),
  ('country','Indonesia',           'indonesia',             'ID', -0.7893,113.9213, 'Asia/Jakarta'),
  ('country','Maldives',            'maldives',              'MV',  3.2028, 73.2207, 'Indian/Maldives'),
  ('country','Greece',              'greece',                'GR', 39.0742, 21.8243, 'Europe/Athens'),
  ('country','Japan',               'japan',                 'JP', 36.2048,138.2529, 'Asia/Tokyo'),
  ('country','France',              'france',                'FR', 46.2276,  2.2137, 'Europe/Paris'),
  ('country','United States',       'united-states',         'US', 37.0902,-95.7129, 'America/New_York')
ON CONFLICT (slug) DO NOTHING;

-- Cities (country_code links them to their country; parent_id set in a follow-up pass).
INSERT INTO public.places (kind, name, slug, country_code, lat, lng, timezone) VALUES
  ('city','Hunza',        'hunza-pk',        'PK', 36.3167, 74.6500, 'Asia/Karachi'),
  ('city','Skardu',       'skardu-pk',       'PK', 35.2971, 75.6333, 'Asia/Karachi'),
  ('city','Gilgit',       'gilgit-pk',       'PK', 35.9200, 74.3080, 'Asia/Karachi'),
  ('city','Fairy Meadows','fairy-meadows-pk','PK', 35.3869, 74.5772, 'Asia/Karachi'),
  ('city','Naran',        'naran-pk',        'PK', 34.9042, 73.6506, 'Asia/Karachi'),
  ('city','Swat',         'swat-pk',         'PK', 35.2227, 72.4258, 'Asia/Karachi'),
  ('city','Islamabad',    'islamabad-pk',    'PK', 33.6844, 73.0479, 'Asia/Karachi'),
  ('city','Lahore',       'lahore-pk',       'PK', 31.5204, 74.3587, 'Asia/Karachi'),
  ('city','Karachi',      'karachi-pk',      'PK', 24.8607, 67.0011, 'Asia/Karachi'),
  ('city','Dubai',        'dubai-ae',        'AE', 25.2048, 55.2708, 'Asia/Dubai'),
  ('city','Abu Dhabi',    'abu-dhabi-ae',    'AE', 24.4539, 54.3773, 'Asia/Dubai'),
  ('city','Ubud',         'ubud-id',         'ID', -8.5069,115.2625, 'Asia/Makassar'),
  ('city','Bali',         'bali-id',         'ID', -8.4095,115.1889, 'Asia/Makassar'),
  ('city','Malé',         'male-mv',         'MV',  4.1755, 73.5093, 'Indian/Maldives'),
  ('city','Santorini',    'santorini-gr',    'GR', 36.3932, 25.4615, 'Europe/Athens'),
  ('city','Kyoto',        'kyoto-jp',        'JP', 35.0116,135.7681, 'Asia/Tokyo'),
  ('city','Tokyo',        'tokyo-jp',        'JP', 35.6762,139.6503, 'Asia/Tokyo'),
  ('city','Paris',        'paris-fr',        'FR', 48.8566,  2.3522, 'Europe/Paris'),
  ('city','New York',     'new-york-us',     'US', 40.7128,-74.0060, 'America/New_York')
ON CONFLICT (slug) DO NOTHING;

-- Link each seeded city to its country.
UPDATE public.places c
SET parent_id = p.id
FROM public.places p
WHERE c.kind = 'city' AND p.kind = 'country'
  AND c.country_code = p.country_code AND c.parent_id IS NULL;

-- ── Backfill of place_id is DELIBERATELY NOT done here ──────────────────────
-- A bulk `UPDATE tours/hotels SET place_id` fires the existing AFTER-UPDATE
-- commercial/finance provisioning triggers on those tables, which fail for demo/
-- seed listings whose owners lack a tour_operator_profiles row (FK 23503). So the
-- backfill is a separate, trigger-aware step (run per-row via the app on next edit,
-- or a maintenance script that scopes to fully-provisioned owners). This migration
-- only establishes the schema + seed; existing rows keep place_id = NULL until then.
