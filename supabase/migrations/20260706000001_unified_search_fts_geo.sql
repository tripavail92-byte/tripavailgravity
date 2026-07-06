-- Phase 3 — Unified search: full-text (tsvector) + geo-ranking across tours & packages.
--
-- Adds weighted tsvector search columns + GIN indexes to tours, hotels and packages,
-- and three functions:
--   * haversine_km / safe_to_double  — small immutable helpers
--   * _search_listings_base(...)      — the shared, filtered, normalised result set
--   * search_listings_unified(...)    — the paginated, sorted result page (+ total_count)
--   * search_listings_facets(...)     — type counts, country counts, price range
--
-- Result "types" are 'tour' and 'package' (the bookable, slug-routed, currency-aware
-- entities). A package borrows its hotel's name / city / country / coords / rating via a
-- join, and the hotel's tsvector enriches package relevance. Everything is additive and
-- non-destructive; charges/settlement are untouched (search is display/discovery only).

-- ---------------------------------------------------------------------------
-- 1. Helpers
-- ---------------------------------------------------------------------------

-- Great-circle distance in km. NULL if any coordinate is missing.
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) RETURNS double precision
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE
    WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN NULL
    ELSE 6371.0 * 2 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    ))
  END
$$;

-- Tolerant text->double cast: bad/blank values become NULL instead of erroring the
-- whole query (tour coordinates live as free-text inside the location JSONB).
CREATE OR REPLACE FUNCTION public.safe_to_double(t text)
RETURNS double precision
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
BEGIN
  IF t IS NULL OR btrim(t) = '' THEN RETURN NULL; END IF;
  RETURN t::double precision;
EXCEPTION WHEN others THEN
  RETURN NULL;
END
$$;

-- IMMUTABLE wrapper around to_tsvector with a pinned config. The bare
-- to_tsvector('english', …) is only STABLE (config-name resolution), so it cannot
-- be used directly in a GENERATED column. plpgsql (not a SQL body) prevents inlining,
-- so the planner trusts the IMMUTABLE label as an opaque black box.
CREATE OR REPLACE FUNCTION public.imm_to_tsvector(t text)
RETURNS tsvector
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
BEGIN
  RETURN to_tsvector('english'::regconfig, coalesce(t, ''));
END
$$;

-- Array variant. array_to_string is only STABLE, so it likewise cannot appear directly
-- in a GENERATED column; wrapping it in an IMMUTABLE plpgsql function makes it usable
-- (element type here is text, whose output is effectively immutable).
CREATE OR REPLACE FUNCTION public.imm_to_tsvector_arr(t text[])
RETURNS tsvector
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
BEGIN
  RETURN to_tsvector('english'::regconfig, coalesce(array_to_string(t, ' '), ''));
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Weighted tsvector columns (A = name/title, B = description, C = place/type)
-- ---------------------------------------------------------------------------

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(public.imm_to_tsvector(title), 'A') ||
  setweight(public.imm_to_tsvector(coalesce(short_description, '') || ' ' || coalesce(description, '')), 'B') ||
  setweight(public.imm_to_tsvector_arr(destination_cities), 'B') ||
  setweight(public.imm_to_tsvector(
    coalesce(location ->> 'city', '') || ' ' ||
    coalesce(location ->> 'country', '') || ' ' ||
    coalesce(tour_type, '')), 'C')
) STORED;

ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(public.imm_to_tsvector(name), 'A') ||
  setweight(public.imm_to_tsvector(description), 'B') ||
  setweight(public.imm_to_tsvector(
    coalesce(city, '') || ' ' || coalesce(country, '') || ' ' ||
    coalesce(area, '') || ' ' || coalesce(location, '')), 'C')
) STORED;

ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(public.imm_to_tsvector(name), 'A') ||
  setweight(public.imm_to_tsvector(description), 'B') ||
  setweight(public.imm_to_tsvector_arr(highlights), 'C') ||
  setweight(public.imm_to_tsvector(package_type), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_tours_search_vector    ON public.tours    USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_hotels_search_vector   ON public.hotels   USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_packages_search_vector ON public.packages USING gin (search_vector);

-- ---------------------------------------------------------------------------
-- 3. Shared base: filtered, normalised rows for both tours and packages.
--    Applies text-match + price/rating/country/category/geo filters. Does NOT
--    apply the listing-type filter (so facets can count every type) and does
--    NOT sort/paginate. SECURITY DEFINER + explicit published filters so anon
--    search works and the hotel join is never dropped by RLS.
-- ---------------------------------------------------------------------------

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

    -- PACKAGES (hotel join supplies rating / coords / country + enriches relevance)
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

-- ---------------------------------------------------------------------------
-- 4. Paginated, sorted result page (+ window total_count for pagination).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_listings_unified(
  p_query      text              DEFAULT NULL,
  p_types      text[]            DEFAULT ARRAY['tour','package'],
  p_lat        double precision  DEFAULT NULL,
  p_lng        double precision  DEFAULT NULL,
  p_radius_km  double precision  DEFAULT NULL,
  p_min_price  numeric           DEFAULT NULL,
  p_max_price  numeric           DEFAULT NULL,
  p_min_rating numeric           DEFAULT NULL,
  p_country    text              DEFAULT NULL,
  p_category   text              DEFAULT NULL,
  p_sort       text              DEFAULT 'relevance',
  p_limit      integer           DEFAULT 24,
  p_offset     integer           DEFAULT 0
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
  created_at     timestamptz,
  total_count    bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH rows AS (
    SELECT * FROM public._search_listings_base(
      p_query, p_lat, p_lng, p_radius_km, p_min_price, p_max_price,
      p_min_rating, p_country, p_category
    )
    WHERE listing_type = ANY(coalesce(p_types, ARRAY['tour','package']))
  )
  SELECT
    r.listing_id, r.listing_type, r.slug, r.title, r.subtitle, r.location_label,
    r.country, r.price, r.currency, r.rating, r.review_count, r.images,
    r.duration_days, r.badge, r.is_featured, r.distance_km, r.relevance, r.created_at,
    count(*) OVER() AS total_count
  FROM rows r
  ORDER BY
    CASE WHEN p_sort = 'relevance'  THEN r.relevance   END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating'     THEN r.rating      END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_asc'  THEN r.price       END ASC  NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN r.price       END DESC NULLS LAST,
    CASE WHEN p_sort = 'nearest'    THEN r.distance_km END ASC  NULLS LAST,
    CASE WHEN p_sort = 'newest'     THEN r.created_at  END DESC NULLS LAST,
    r.is_featured DESC, r.rating DESC NULLS LAST, r.created_at DESC NULLS LAST
  LIMIT greatest(coalesce(p_limit, 24), 0)
  OFFSET greatest(coalesce(p_offset, 0), 0)
$$;

-- ---------------------------------------------------------------------------
-- 5. Facets for the current filter set (type counts, top countries, price range).
--    Type counts ignore the type filter so the UI can show "Tours (N) · Stays (M)".
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_listings_facets(
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
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH rows AS (
    SELECT * FROM public._search_listings_base(
      p_query, p_lat, p_lng, p_radius_km, p_min_price, p_max_price,
      p_min_rating, p_country, p_category
    )
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM rows),
    'types', coalesce((
      SELECT jsonb_object_agg(listing_type, c)
      FROM (SELECT listing_type, count(*) AS c FROM rows GROUP BY listing_type) s
    ), '{}'::jsonb),
    'countries', coalesce((
      SELECT jsonb_agg(jsonb_build_object('country', country, 'count', c) ORDER BY c DESC)
      FROM (
        SELECT country, count(*) AS c FROM rows
        WHERE country IS NOT NULL GROUP BY country ORDER BY c DESC LIMIT 12
      ) s
    ), '[]'::jsonb),
    'price_min', (SELECT min(price) FROM rows WHERE price IS NOT NULL),
    'price_max', (SELECT max(price) FROM rows WHERE price IS NOT NULL)
  )
$$;

-- ---------------------------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public._search_listings_base(text, double precision, double precision, double precision, numeric, numeric, numeric, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public._search_listings_base(text, double precision, double precision, double precision, numeric, numeric, numeric, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_listings_unified(text, text[], double precision, double precision, double precision, numeric, numeric, numeric, text, text, text, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_listings_facets(text, double precision, double precision, double precision, numeric, numeric, numeric, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.haversine_km(double precision, double precision, double precision, double precision) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.safe_to_double(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.imm_to_tsvector(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.imm_to_tsvector_arr(text[]) TO anon, authenticated, service_role;
