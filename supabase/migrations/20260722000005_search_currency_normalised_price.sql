-- ============================================================================
-- Search compared prices across currencies as bare numbers
--
-- THE BUG, observed live on 2026-07-22 by asking the assistant for the cheapest tours:
--
--     20 USD  →  33 PKR  →  47 USD  →  100 PKR  →  107.91 USD
--
-- That is `ORDER BY price` with no conversion. 33 PKR is about 12 US cents, so it should have
-- been first; instead a $20 tour outranked it. The same flaw applies to the FILTERS:
-- `p_max_price = 20000` intending "under PKR 20,000" also matches a listing priced at 20,000 USD,
-- and `search_listings_facets` reports a price range mixing units, so the price slider's own
-- bounds are meaningless.
--
-- `_search_listings_base` selects tours.price and packages.base_price_per_night alongside their
-- own currency column, then compares those raw numbers. `fx_rates`, `fx_convert()` and the worker
-- that populates every currency pair nightly have existed since 20260705000011 and were never
-- wired in.
--
-- THE FIX: normalise every price to PKR (BASE_CURRENCY in packages/shared) for FILTERING and
-- SORTING, while still returning the listing's own price and currency for DISPLAY. A price is
-- charged in the currency the partner set; only comparison needs a common unit.
--
-- p_price_currency says what unit p_min_price / p_max_price are expressed in, so a traveller
-- browsing in USD can filter in USD against a catalogue priced in PKR. It defaults to PKR, which
-- matches the previous behaviour for a PKR-priced catalogue.
--
-- WHEN A RATE IS MISSING the raw price is used rather than dropping the row. Hiding real, bookable
-- inventory because an FX row is stale is worse than ranking it imprecisely — and the fallback can
-- only be reached if the worker has failed for every pair involving that currency.
--
-- These are DROP + CREATE, not CREATE OR REPLACE: both the return shape and the parameter list
-- change, and Postgres permits neither in place.
-- ============================================================================

BEGIN;

-- Dependents first.
DROP FUNCTION IF EXISTS public.search_listings_facets(text, double precision, double precision, double precision, numeric, numeric, numeric, text, text);
DROP FUNCTION IF EXISTS public.search_listings_unified(text, text[], double precision, double precision, double precision, numeric, numeric, numeric, text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public._search_listings_base(text, double precision, double precision, double precision, numeric, numeric, numeric, text, text);

-- ---------------------------------------------------------------------------
-- Base: adds price_base (PKR) and currency-aware bounds.
-- ---------------------------------------------------------------------------
CREATE FUNCTION public._search_listings_base(
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
    LEFT JOIN public.hotels h ON h.id = p.hotel_id
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

-- ---------------------------------------------------------------------------
-- Paginated page — now sorts on the normalised price.
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.search_listings_unified(
  p_query          text              DEFAULT NULL,
  p_types          text[]            DEFAULT ARRAY['tour','package'],
  p_lat            double precision  DEFAULT NULL,
  p_lng            double precision  DEFAULT NULL,
  p_radius_km      double precision  DEFAULT NULL,
  p_min_price      numeric           DEFAULT NULL,
  p_max_price      numeric           DEFAULT NULL,
  p_min_rating     numeric           DEFAULT NULL,
  p_country        text              DEFAULT NULL,
  p_category       text              DEFAULT NULL,
  p_sort           text              DEFAULT 'relevance',
  p_limit          integer           DEFAULT 24,
  p_offset         integer           DEFAULT 0,
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
  created_at     timestamptz,
  total_count    bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH rows AS (
    SELECT * FROM public._search_listings_base(
      p_query, p_lat, p_lng, p_radius_km, p_min_price, p_max_price,
      p_min_rating, p_country, p_category, p_price_currency
    )
    WHERE listing_type = ANY(coalesce(p_types, ARRAY['tour','package']))
  )
  SELECT
    r.listing_id, r.listing_type, r.slug, r.title, r.subtitle, r.location_label,
    r.country, r.price, r.currency, r.price_base, r.rating, r.review_count, r.images,
    r.duration_days, r.badge, r.is_featured, r.distance_km, r.relevance, r.created_at,
    count(*) OVER() AS total_count
  FROM rows r
  ORDER BY
    CASE WHEN p_sort = 'relevance'  THEN r.relevance   END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating'     THEN r.rating      END DESC NULLS LAST,
    -- price_base, NOT price. This line is the bug.
    CASE WHEN p_sort = 'price_asc'  THEN r.price_base  END ASC  NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN r.price_base  END DESC NULLS LAST,
    CASE WHEN p_sort = 'nearest'    THEN r.distance_km END ASC  NULLS LAST,
    CASE WHEN p_sort = 'newest'     THEN r.created_at  END DESC NULLS LAST,
    r.is_featured DESC, r.rating DESC NULLS LAST, r.created_at DESC NULLS LAST
  LIMIT greatest(coalesce(p_limit, 24), 0)
  OFFSET greatest(coalesce(p_offset, 0), 0)
$$;

-- ---------------------------------------------------------------------------
-- Facets — price range now in a single unit.
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.search_listings_facets(
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
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH rows AS (
    SELECT * FROM public._search_listings_base(
      p_query, p_lat, p_lng, p_radius_km, p_min_price, p_max_price,
      p_min_rating, p_country, p_category, p_price_currency
    )
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM rows),
    'types', coalesce((
      SELECT jsonb_object_agg(listing_type, c)
      FROM (SELECT listing_type, count(*) AS c FROM rows GROUP BY listing_type) t
    ), '{}'::jsonb),
    'countries', coalesce((
      SELECT jsonb_agg(jsonb_build_object('country', country, 'count', c) ORDER BY c DESC)
      FROM (
        SELECT country, count(*) AS c FROM rows
        WHERE country IS NOT NULL GROUP BY country ORDER BY c DESC LIMIT 12
      ) t
    ), '[]'::jsonb),
    -- Reported in PKR, and labelled as such. Previously min()/max() ran across mixed currencies,
    -- so the slider's own endpoints were a number with no unit behind them.
    'price_currency', 'PKR',
    'price_min', (SELECT min(price_base) FROM rows WHERE price_base IS NOT NULL),
    'price_max', (SELECT max(price_base) FROM rows WHERE price_base IS NOT NULL)
  )
$$;

-- ---------------------------------------------------------------------------
-- Re-grant. DROP FUNCTION discards the grants with the function, and these are called from the
-- browser with the anon key — without this, search returns 403 for every visitor, logged in or
-- not. Mirrors 20260706000001:359-362 exactly, including keeping the internal base function
-- revoked from PUBLIC.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public._search_listings_base(text, double precision, double precision, double precision, numeric, numeric, numeric, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public._search_listings_base(text, double precision, double precision, double precision, numeric, numeric, numeric, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_listings_unified(text, text[], double precision, double precision, double precision, numeric, numeric, numeric, text, text, text, integer, integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_listings_facets(text, double precision, double precision, double precision, numeric, numeric, numeric, text, text, text) TO anon, authenticated, service_role;

COMMIT;

-- ============================================================================
-- FIRST, confirm the grants survived. All three must appear for anon:
--
--   SELECT p.proname, r.grantee
--   FROM information_schema.routine_privileges r
--   JOIN pg_proc p ON p.proname = r.routine_name
--   WHERE r.routine_name IN ('search_listings_unified','search_listings_facets','_search_listings_base')
--     AND r.grantee = 'anon'
--   GROUP BY 1,2;
--
-- Verify — the sort that exposed this. Expect ascending TRUE PKR value, so a
-- 33 PKR listing now leads a 20 USD one:
--
--   SELECT title, price, currency, round(price_base) AS pkr
--   FROM public.search_listings_unified(
--     p_types := ARRAY['tour'], p_sort := 'price_asc', p_limit := 8);
--
-- And the filter. "Under PKR 20,000" must exclude a 20,000 USD listing:
--
--   SELECT title, price, currency, round(price_base) AS pkr
--   FROM public.search_listings_unified(p_max_price := 20000, p_limit := 50);
--
-- Same bound expressed in USD — should return a much smaller set:
--
--   SELECT count(*) FROM public.search_listings_unified(
--     p_max_price := 20000, p_price_currency := 'USD', p_limit := 200);
--
-- If fx_rates is empty, price_base falls back to the raw price and the old behaviour returns.
-- Check the table is current:
--
--   SELECT base, quote, rate, as_of FROM public.fx_rates
--   WHERE quote = 'PKR' ORDER BY as_of DESC LIMIT 10;
-- ============================================================================
