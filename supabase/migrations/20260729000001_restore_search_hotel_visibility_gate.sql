-- ============================================================================
-- P1 — Restore the hotel visibility gate in unified search
--
-- REGRESSION. 20260706000002_search_hotel_visibility_fix.sql closed a
-- SECURITY DEFINER leak: _search_listings_base joined packages to hotels with a bare
-- LEFT JOIN, so an anonymous caller could read an UNPUBLISHED hotel's name, city, country,
-- rating and coordinates whenever a live package referenced it. That migration switched the
-- join to
--
--     INNER JOIN public.hotels h ON h.id = p.hotel_id AND h.is_published = true
--
-- 20260722000005_search_currency_normalised_price.sql then rebuilt the whole function to add
-- price_base, and reintroduced the bare
--
--     LEFT JOIN public.hotels h ON h.id = p.hotel_id
--
-- silently reverting the security fix. The migration ran clean and the currency work it shipped
-- is correct — nothing re-checked the join. This restores it.
--
-- CONFIRMED LIVE before writing this file, via the public anon key:
--
--   POST /rest/v1/rpc/search_listings_unified {"p_types":["package"],"p_limit":50}
--     → "Romance & Roses Package"  subtitle: "Untitled Hotel"
--
-- "Untitled Hotel" is an unpublished draft row. Its name is being served to anonymous
-- traffic in production search results right now.
--
-- WHAT ELSE THIS FIXES. Besides the leak, the INNER JOIN drops packages whose hotel_id is
-- NULL or points at a hidden/deleted hotel. Those render as broken cards — no location, no
-- rating — because every one of those columns comes from the hotel side of the join.
--
-- CREATE OR REPLACE, not DROP + CREATE: the signature is unchanged, so the existing grants to
-- anon/authenticated/service_role survive. (20260722000005 used DROP FUNCTION and had to
-- re-issue all three GRANTs at the end; there is no need to repeat that here.)
--
-- Body below is byte-identical to 20260722000005 except for the single join line, marked <<<<.
-- ============================================================================

CREATE OR REPLACE FUNCTION public._search_listings_base(
  p_query          text              DEFAULT NULL,
  p_lat            double precision  DEFAULT NULL,
  p_lng            double precision  DEFAULT NULL,
  p_radius_km      double precision  DEFAULT NULL,
  p_min_price      numeric           DEFAULT NULL,
  p_max_price      numeric           DEFAULT NULL,
  p_min_rating     numeric           DEFAULT NULL,
  p_country        text              DEFAULT NULL,
  p_category       text              DEFAULT NULL,
  p_price_currency text              DEFAULT 'PKR'
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
  price_base     numeric,
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
  -- One row per source currency: how many PKR one unit buys, newest rate on or before today.
  -- Joined once rather than calling fx_convert() per row.
  fx AS (
    SELECT DISTINCT ON (r.base) r.base AS src, r.rate
    FROM public.fx_rates r
    WHERE r.quote = 'PKR' AND r.as_of <= CURRENT_DATE
    ORDER BY r.base, r.as_of DESC
  ),
  -- The caller's bounds, restated in PKR. COALESCE keeps the filter active with the raw number if
  -- the rate is missing — silently dropping a filter the traveller set would be worse.
  bounds AS (
    SELECT
      COALESCE(
        public.fx_convert(p_min_price, upper(COALESCE(p_price_currency, 'PKR')), 'PKR'),
        p_min_price
      ) AS min_base,
      COALESCE(
        public.fx_convert(p_max_price, upper(COALESCE(p_price_currency, 'PKR')), 'PKR'),
        p_max_price
      ) AS max_base
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

    -- PACKAGES
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
           ELSE ts_rank(p.search_vector, (SELECT tsq FROM q))
                + coalesce(ts_rank(h.search_vector, (SELECT tsq FROM q)), 0) END AS relevance,
      p.created_at::timestamptz AS created_at,
      (p.search_vector || coalesce(h.search_vector, ''::tsvector)) AS sv
    FROM public.packages p
    -- <<<< THE FIX. Was: LEFT JOIN public.hotels h ON h.id = p.hotel_id
    -- INNER JOIN + h.is_published enforces the same visibility RLS would, and drops packages
    -- whose hotel_id is NULL or points at a hidden/deleted hotel (those rendered as broken,
    -- locationless, ratingless cards). Restores 20260706000002.
    INNER JOIN public.hotels h ON h.id = p.hotel_id AND h.is_published = true
    WHERE p.is_published = true AND p.status = 'live'
  ),
  -- Every price restated in PKR, so filtering and sorting compare like with like.
  priced AS (
    SELECT b.*, COALESCE(b.price * fx.rate, b.price) AS price_base
    FROM base b
    LEFT JOIN fx ON fx.src = b.currency
  )
  SELECT
    b.listing_id, b.listing_type, b.slug, b.title, b.subtitle, b.location_label,
    b.country, b.price, b.currency, b.price_base, b.rating, b.review_count, b.images,
    b.duration_days, b.badge, b.is_featured, b.distance_km, b.relevance, b.created_at
  FROM priced b
  WHERE ((SELECT tsq FROM q) IS NULL OR b.sv @@ (SELECT tsq FROM q))
    AND ((SELECT min_base FROM bounds) IS NULL
         OR (b.price_base IS NOT NULL AND b.price_base >= (SELECT min_base FROM bounds)))
    AND ((SELECT max_base FROM bounds) IS NULL
         OR (b.price_base IS NOT NULL AND b.price_base <= (SELECT max_base FROM bounds)))
    AND (p_min_rating IS NULL OR (b.rating IS NOT NULL AND b.rating >= p_min_rating))
    AND (p_country    IS NULL OR lower(b.country) = lower(p_country))
    AND (p_category   IS NULL OR lower(b.badge)   = lower(p_category))
    AND (p_radius_km  IS NULL OR (b.distance_km IS NOT NULL AND b.distance_km <= p_radius_km))
$$;


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY — run after applying. Both must hold.
-- ──────────────────────────────────────────────────────────────────────────

-- (1) No published package may surface a hidden hotel. Expect 0 rows.
SELECT p.id, p.name AS package, h.name AS hotel, h.is_published AS hotel_published
FROM public.packages p
LEFT JOIN public.hotels h ON h.id = p.hotel_id
WHERE p.is_published = true
  AND (h.id IS NULL OR h.is_published = false);

-- (2) Same call the site makes. "Untitled Hotel" must NOT appear in subtitle.
--     Live package count should drop from 4 to 3 until the orphan is resolved.
SELECT listing_type, title, subtitle
FROM public.search_listings_unified(p_types := ARRAY['package'], p_limit := 50);

-- ============================================================================
-- FOLLOW-UP, not fixed here — tracked separately.
--
-- The `hotels` table itself lets anon read unpublished rows. Verified with the public
-- anon key:
--
--   GET /rest/v1/hotels?select=id,name,is_published&is_published=eq.false
--     → 22 rows, including owner_id
--
-- The sampled rows are near-empty "Untitled Hotel" drafts (contact_email, contact_phone,
-- latitude, longitude all NULL), so the exposure is low — but a table-wide anon SELECT
-- grant is the same shape as the operator KYC leak. It needs an RLS policy limiting anon
-- to is_published = true, which is a separate migration because it may break partner-side
-- reads that currently rely on the loose grant.
-- ============================================================================
