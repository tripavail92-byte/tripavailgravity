-- Phase 3 follow-up — fix a SECURITY DEFINER visibility leak + relevance skew found in
-- adversarial review of 20260706000001.
--
-- (1) SECURITY DEFINER bypasses RLS, and the package→hotel join was a bare LEFT JOIN with
--     no visibility gate, so an anonymous caller could read an UNPUBLISHED hotel's name,
--     exact lat/lng, city/country and rating whenever a live package referenced it. Switch
--     to INNER JOIN ... AND h.is_published = true — the RLS-equivalent gate — which also
--     drops packages whose hotel_id is NULL or points at a hidden/deleted hotel (those
--     rendered as broken, locationless, ratingless cards).
-- (2) Package relevance summed two separate ts_rank() calls (package + hotel), biasing the
--     'relevance' sort toward packages. Rank once on the same combined vector used for the
--     @@ match so tours and packages score comparably.
--
-- CREATE OR REPLACE preserves the existing grants. Only the packages branch changes.

CREATE OR REPLACE FUNCTION public._search_listings_base(
  p_query      text              DEFAULT NULL,
  p_lat        double precision  DEFAULT NULL,
  p_lng        double precision  DEFAULT NULL,
  p_radius_km  double precision  DEFAULT NULL,
  p_min_price  numeric           DEFAULT NULL,
  p_max_price  numeric           DEFAULT NULL,
  p_min_rating numeric           DEFAULT NULL,
  p_country    text              DEFAULT NULL,
  p_category   text              DEFAULT NULL
)
RETURNS TABLE (
  listing_id     uuid,
  listing_type   text,
  slug           text,
  title          text,
  subtitle       text,
  location_label text,
  country        text,
  price          numeric,
  currency       text,
  rating         numeric,
  review_count   integer,
  images         jsonb,
  duration_days  integer,
  badge          text,
  is_featured    boolean,
  distance_km    double precision,
  relevance      real,
  created_at     timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH q AS (
    SELECT CASE
      WHEN p_query IS NULL OR btrim(p_query) = '' THEN NULL
      ELSE websearch_to_tsquery('english', p_query)
    END AS tsq
  ),
  base AS (
    -- TOURS
    SELECT
      t.id AS listing_id,
      'tour'::text AS listing_type,
      t.slug,
      t.title,
      NULLIF(coalesce(t.location ->> 'city', ''), '') AS subtitle,
      NULLIF(btrim(
        coalesce(t.location ->> 'city', '') ||
        CASE WHEN coalesce(t.location ->> 'country', '') <> ''
             THEN ', ' || (t.location ->> 'country') ELSE '' END
      ), '') AS location_label,
      NULLIF(t.location ->> 'country', '') AS country,
      t.price::numeric AS price,
      coalesce(t.currency, 'PKR') AS currency,
      t.rating::numeric AS rating,
      t.review_count::int AS review_count,
      coalesce(t.images::jsonb, '[]'::jsonb) AS images,
      t.duration_days::int AS duration_days,
      coalesce(NULLIF(t.tour_type, ''), 'Tour') AS badge,
      coalesce(t.is_featured, false) AS is_featured,
      -- Nearest of the tour's own coords and its closest pickup point (LEAST skips
      -- NULLs), so a tour with pickups but no location coords still geo-ranks.
      LEAST(
        public.haversine_km(
          p_lat, p_lng,
          public.safe_to_double(t.location ->> 'lat'),
          public.safe_to_double(t.location ->> 'lng')
        ),
        (SELECT min(public.haversine_km(p_lat, p_lng, pl.latitude, pl.longitude))
           FROM public.tour_pickup_locations pl
          WHERE pl.tour_id = t.id)
      ) AS distance_km,
      CASE WHEN (SELECT tsq FROM q) IS NULL THEN 0::real
           ELSE ts_rank(t.search_vector, (SELECT tsq FROM q)) END AS relevance,
      t.created_at::timestamptz AS created_at,
      t.search_vector AS sv
    FROM public.tours t
    WHERE t.is_active = true AND t.is_published = true AND t.status = 'live'

    UNION ALL

    -- PACKAGES (hotel join supplies rating / coords / country + enriches relevance).
    -- INNER JOIN + h.is_published enforces the same visibility RLS would, and drops
    -- packages with a NULL / hidden / dangling hotel.
    SELECT
      p.id AS listing_id,
      'package'::text AS listing_type,
      p.slug,
      p.name AS title,
      h.name AS subtitle,
      NULLIF(btrim(
        coalesce(h.city, '') ||
        CASE WHEN coalesce(h.country, '') <> '' THEN ', ' || h.country ELSE '' END
      ), '') AS location_label,
      NULLIF(h.country, '') AS country,
      p.base_price_per_night::numeric AS price,
      coalesce(p.currency, 'PKR') AS currency,
      h.rating::numeric AS rating,
      h.review_count::int AS review_count,
      coalesce(to_jsonb(p.media_urls), '[]'::jsonb) AS images,
      NULL::int AS duration_days,
      coalesce(NULLIF(p.package_type, ''), 'Stay') AS badge,
      false AS is_featured,
      public.haversine_km(p_lat, p_lng, h.latitude, h.longitude) AS distance_km,
      CASE WHEN (SELECT tsq FROM q) IS NULL THEN 0::real
           ELSE ts_rank(p.search_vector || coalesce(h.search_vector, ''::tsvector), (SELECT tsq FROM q)) END AS relevance,
      p.created_at::timestamptz AS created_at,
      (p.search_vector || coalesce(h.search_vector, ''::tsvector)) AS sv
    FROM public.packages p
    INNER JOIN public.hotels h ON h.id = p.hotel_id AND h.is_published = true
    WHERE p.is_published = true AND p.status = 'live'
  )
  SELECT
    b.listing_id, b.listing_type, b.slug, b.title, b.subtitle, b.location_label,
    b.country, b.price, b.currency, b.rating, b.review_count, b.images,
    b.duration_days, b.badge, b.is_featured, b.distance_km, b.relevance, b.created_at
  FROM base b
  WHERE ((SELECT tsq FROM q) IS NULL OR b.sv @@ (SELECT tsq FROM q))
    AND (p_min_price  IS NULL OR (b.price  IS NOT NULL AND b.price  >= p_min_price))
    AND (p_max_price  IS NULL OR (b.price  IS NOT NULL AND b.price  <= p_max_price))
    AND (p_min_rating IS NULL OR (b.rating IS NOT NULL AND b.rating >= p_min_rating))
    AND (p_country    IS NULL OR lower(b.country) = lower(p_country))
    AND (p_category   IS NULL OR lower(b.badge)   = lower(p_category))
    AND (p_radius_km  IS NULL OR (b.distance_km IS NOT NULL AND b.distance_km <= p_radius_km))
$$;
