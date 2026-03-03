-- ============================================================================
-- Pickup Locations (Exact Map Pin)
-- Date: 2026-03-03
--
-- Adds:
-- - public.tour_pickup_locations table
-- - indexes + one-primary constraint
-- - updated_at trigger
-- - RLS policies (operator CRUD, public read for visible tours)
-- - RPCs:
--   - public.search_tours_by_nearest_pickup(...)
--   - public.set_primary_pickup(p_tour_id, p_pickup_id)
-- ============================================================================

BEGIN;

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_pickup_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  title text NOT NULL,
  formatted_address text NOT NULL,
  city text NULL,
  country text NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  google_place_id text NULL,
  pickup_time time NULL,
  notes text NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tour_pickup_locations_tour_id
  ON public.tour_pickup_locations (tour_id);

CREATE INDEX IF NOT EXISTS idx_tour_pickup_locations_lat_lng
  ON public.tour_pickup_locations (latitude, longitude);

-- Enforce max one primary pickup per tour
CREATE UNIQUE INDEX IF NOT EXISTS tour_one_primary_pickup
  ON public.tour_pickup_locations (tour_id)
  WHERE is_primary = true;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pickup_updated ON public.tour_pickup_locations;
CREATE TRIGGER trg_pickup_updated
BEFORE UPDATE ON public.tour_pickup_locations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.tour_pickup_locations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.tour_pickup_locations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.tour_pickup_locations TO authenticated;
GRANT ALL ON TABLE public.tour_pickup_locations TO service_role;

DO $$
BEGIN
  -- Operator CRUD: only for tours they own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Operators manage own tour pickups'
      AND tablename = 'tour_pickup_locations'
      AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Operators manage own tour pickups" ON public.tour_pickup_locations
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.tours t
          WHERE t.id = tour_pickup_locations.tour_id
            AND t.operator_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.tours t
          WHERE t.id = tour_pickup_locations.tour_id
            AND t.operator_id = auth.uid()
        )
      );
  END IF;

  -- Public/Traveller read: only for visible tours
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Anyone can view pickups for visible tours'
      AND tablename = 'tour_pickup_locations'
      AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Anyone can view pickups for visible tours" ON public.tour_pickup_locations
      FOR SELECT
      TO public
      USING (
        EXISTS (
          SELECT 1
          FROM public.tours t
          WHERE t.id = tour_pickup_locations.tour_id
            AND t.is_active = true
            AND t.is_published = true
            AND t.status = 'live'
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RPC: nearest pickup per tour within radius
-- Pattern A: returns ordered tour IDs + nearest pickup metadata
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_tours_by_nearest_pickup(
  p_user_lat double precision,
  p_user_lng double precision,
  p_radius_km double precision DEFAULT 200,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  tour_id uuid,
  pickup_id uuid,
  pickup_title text,
  formatted_address text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  google_place_id text,
  pickup_time time,
  notes text,
  nearest_distance_km double precision
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_radius_km double precision;
  v_limit integer;
  v_offset integer;
  v_lat_delta double precision;
  v_lng_delta double precision;
  v_cos_lat double precision;
BEGIN
  IF p_user_lat IS NULL OR p_user_lng IS NULL THEN
    RAISE EXCEPTION 'p_user_lat and p_user_lng are required';
  END IF;

  v_radius_km := GREATEST(0.1, COALESCE(p_radius_km, 200));
  v_limit := LEAST(200, GREATEST(1, COALESCE(p_limit, 50)));
  v_offset := GREATEST(0, COALESCE(p_offset, 0));

  -- ~111.32km per degree latitude
  v_lat_delta := v_radius_km / 111.32;

  -- longitude delta depends on latitude
  v_cos_lat := cos(radians(p_user_lat));
  v_lng_delta := v_radius_km / (111.32 * GREATEST(0.01, abs(v_cos_lat)));

  RETURN QUERY
  WITH candidates AS (
    SELECT
      pl.tour_id,
      pl.id AS pickup_id,
      pl.title AS pickup_title,
      pl.formatted_address,
      pl.city,
      pl.country,
      pl.latitude,
      pl.longitude,
      pl.google_place_id,
      pl.pickup_time,
      pl.notes,
      (
        2 * 6371 * asin(
          LEAST(
            1,
            sqrt(
              power(sin(radians(pl.latitude - p_user_lat) / 2), 2)
              + cos(radians(p_user_lat))
                * cos(radians(pl.latitude))
                * power(sin(radians(pl.longitude - p_user_lng) / 2), 2)
            )
          )
        )
      ) AS nearest_distance_km
    FROM public.tour_pickup_locations pl
    JOIN public.tours t ON t.id = pl.tour_id
    WHERE t.is_active = true
      AND t.is_published = true
      AND t.status = 'live'
      AND pl.latitude BETWEEN (p_user_lat - v_lat_delta) AND (p_user_lat + v_lat_delta)
      AND pl.longitude BETWEEN (p_user_lng - v_lng_delta) AND (p_user_lng + v_lng_delta)
  ),
  nearest_per_tour AS (
    SELECT DISTINCT ON (tour_id)
      *
    FROM candidates
    ORDER BY tour_id, nearest_distance_km ASC
  )
  SELECT
    n.tour_id,
    n.pickup_id,
    n.pickup_title,
    n.formatted_address,
    n.city,
    n.country,
    n.latitude,
    n.longitude,
    n.google_place_id,
    n.pickup_time,
    n.notes,
    n.nearest_distance_km
  FROM nearest_per_tour n
  ORDER BY n.nearest_distance_km ASC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_tours_by_nearest_pickup(double precision, double precision, double precision, integer, integer)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RPC: safely set primary pickup (max-one enforced by partial unique index)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_primary_pickup(
  p_tour_id uuid,
  p_pickup_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists boolean;
BEGIN
  IF p_tour_id IS NULL OR p_pickup_id IS NULL THEN
    RAISE EXCEPTION 'p_tour_id and p_pickup_id are required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.tour_pickup_locations pl
    WHERE pl.id = p_pickup_id
      AND pl.tour_id = p_tour_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Pickup not found for tour';
  END IF;

  UPDATE public.tour_pickup_locations
  SET is_primary = false
  WHERE tour_id = p_tour_id
    AND is_primary = true;

  UPDATE public.tour_pickup_locations
  SET is_primary = true
  WHERE id = p_pickup_id
    AND tour_id = p_tour_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_primary_pickup(uuid, uuid)
  TO authenticated, service_role;

COMMIT;
