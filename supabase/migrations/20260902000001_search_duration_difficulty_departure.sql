-- Search: duration + difficulty facets, and a real server-side departure-date filter.
--
-- THE DATE FILTER WAS A LIE. `/search?checkin=…` filtered dates in the browser, over the 24 rows
-- of the CURRENT page only. Two consequences: the result count was wrong (it counted the page,
-- not the search), and a trip that departs on the chosen date but sorts onto page 3 was invisible
-- — the traveller saw "no trips on that date" for a trip that exists. Filtering has to happen
-- where the pagination happens, so it moves into the RPC.
--
-- DURATION + DIFFICULTY had no filter at all, though `tours.duration_days` and
-- `tours.difficulty_level` are populated on every live tour.
--
-- WHY DROP AND RECREATE rather than CREATE OR REPLACE: new parameters and a new returned column
-- change the function identity, so REPLACE would leave the old signatures behind as ambiguous
-- overloads. The old parameters keep their original positions and defaults, so every existing
-- caller — the web RPCs and the travel-assistant edge function, both of which call by NAME —
-- is unaffected.
--
-- PACKAGES AND TOUR-ONLY FILTERS. Duration, difficulty and departure date are properties of a
-- tour; a hotel stay has none of them. So whenever one of these filters is set, packages drop
-- out of the result. Returning hotel stays for "4–7 days, moderate" would be noise, not results.

BEGIN;

DROP FUNCTION IF EXISTS public.search_listings_facets(
  text, double precision, double precision, double precision, numeric, numeric, numeric,
  text, text, text, text[]
);

DROP FUNCTION IF EXISTS public.search_listings_unified(
  text, text[], double precision, double precision, double precision, numeric, numeric, numeric,
  text, text, text, integer, integer, text
);

DROP FUNCTION IF EXISTS public._search_listings_base(
  text, double precision, double precision, double precision, numeric, numeric, numeric,
  text, text, text
);


-- ============================================================================
-- BASE
-- ============================================================================
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
  p_price_currency text              DEFAULT 'PKR',
  p_min_duration   integer           DEFAULT NULL,
  p_max_duration   integer           DEFAULT NULL,
  p_difficulty     text[]            DEFAULT NULL,
  p_departure_from date              DEFAULT NULL,
  p_departure_to   date              DEFAULT NULL
)
RETURNS TABLE (
  listing_id       uuid,
  listing_type     text,
  slug             text,
  title            text,
  subtitle         text,
  location_label   text,
  country          text,
  price            numeric,
  currency         text,
  price_base       numeric,
  rating           numeric,
  review_count     integer,
  images           jsonb,
  duration_days    integer,
  difficulty_level text,
  badge            text,
  is_featured      boolean,
  distance_km      double precision,
  relevance        real,
  created_at       timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
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
  -- Difficulty compared case-insensitively: the wizard writes 'moderate', but a URL or an
  -- assistant call may well say 'Moderate'.
  diff AS (
    SELECT CASE
      WHEN p_difficulty IS NULL OR array_length(p_difficulty, 1) IS NULL THEN NULL
      ELSE ARRAY(SELECT lower(btrim(d)) FROM unnest(p_difficulty) AS d WHERE btrim(d) <> '')
    END AS levels
  ),
  -- Is a departure-date filter in play at all? Asked once rather than per row.
  dates AS (
    SELECT (p_departure_from IS NOT NULL OR p_departure_to IS NOT NULL) AS active
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
      NULLIF(btrim(coalesce(t.difficulty_level, '')), '') AS difficulty_level,
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
      t.search_vector AS sv,
      -- Does this tour actually run in the searched window? Only asked when a date is set;
      -- otherwise every tour passes and the EXISTS is never evaluated.
      CASE
        WHEN NOT (SELECT active FROM dates) THEN true
        ELSE EXISTS (
          SELECT 1
          FROM public.tour_schedules s
          WHERE s.tour_id = t.id
            AND coalesce(s.status, 'scheduled') <> 'cancelled'
            -- A departure that has already left is not bookable, whatever the range says.
            AND s.start_time >= now()
            AND (p_departure_from IS NULL OR s.start_time >= p_departure_from::timestamptz)
            -- +1 day so the "to" date is inclusive of departures later that day.
            AND (p_departure_to   IS NULL OR s.start_time <  (p_departure_to + 1)::timestamptz)
        )
      END AS departure_ok
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
      NULL::text AS difficulty_level,
      coalesce(NULLIF(p.package_type, ''), 'Stay') AS badge,
      false AS is_featured,
      public.haversine_km(p_lat, p_lng, h.latitude, h.longitude) AS distance_km,
      CASE WHEN (SELECT tsq FROM q) IS NULL THEN 0::real
           ELSE ts_rank(p.search_vector, (SELECT tsq FROM q))
                + coalesce(ts_rank(h.search_vector, (SELECT tsq FROM q)), 0) END AS relevance,
      p.created_at::timestamptz AS created_at,
      (p.search_vector || coalesce(h.search_vector, ''::tsvector)) AS sv,
      -- A hotel stay has no departure date, so a date search excludes it outright.
      (NOT (SELECT active FROM dates)) AS departure_ok
    FROM public.packages p
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
    b.duration_days, b.difficulty_level, b.badge, b.is_featured, b.distance_km,
    b.relevance, b.created_at
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
    -- Tour-only filters. A NULL duration/difficulty (i.e. a package) fails these by design.
    AND (p_min_duration IS NULL
         OR (b.duration_days IS NOT NULL AND b.duration_days >= p_min_duration))
    AND (p_max_duration IS NULL
         OR (b.duration_days IS NOT NULL AND b.duration_days <= p_max_duration))
    AND ((SELECT levels FROM diff) IS NULL
         OR (b.difficulty_level IS NOT NULL
             AND lower(b.difficulty_level) = ANY (SELECT unnest(d.levels) FROM diff d)))
    AND b.departure_ok
$function$;


-- ============================================================================
-- RESULTS
-- ============================================================================
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
  p_price_currency text              DEFAULT 'PKR',
  p_min_duration   integer           DEFAULT NULL,
  p_max_duration   integer           DEFAULT NULL,
  p_difficulty     text[]            DEFAULT NULL,
  p_departure_from date              DEFAULT NULL,
  p_departure_to   date              DEFAULT NULL
)
RETURNS TABLE (
  listing_id       uuid,
  listing_type     text,
  slug             text,
  title            text,
  subtitle         text,
  location_label   text,
  country          text,
  price            numeric,
  currency         text,
  price_base       numeric,
  rating           numeric,
  review_count     integer,
  images           jsonb,
  duration_days    integer,
  difficulty_level text,
  badge            text,
  is_featured      boolean,
  distance_km      double precision,
  relevance        real,
  created_at       timestamptz,
  total_count      bigint
)
LANGUAGE sql
STABLE
AS $function$
  WITH rows AS (
    SELECT * FROM public._search_listings_base(
      p_query, p_lat, p_lng, p_radius_km, p_min_price, p_max_price,
      p_min_rating, p_country, p_category, p_price_currency,
      p_min_duration, p_max_duration, p_difficulty, p_departure_from, p_departure_to
    )
    WHERE listing_type = ANY(coalesce(p_types, ARRAY['tour','package']))
  )
  SELECT
    r.listing_id, r.listing_type, r.slug, r.title, r.subtitle, r.location_label,
    r.country, r.price, r.currency, r.price_base, r.rating, r.review_count, r.images,
    r.duration_days, r.difficulty_level, r.badge, r.is_featured, r.distance_km,
    r.relevance, r.created_at,
    count(*) OVER() AS total_count
  FROM rows r
  ORDER BY
    CASE WHEN p_sort = 'relevance'  THEN r.relevance   END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating'     THEN r.rating      END DESC NULLS LAST,
    -- price_base, NOT price — otherwise a USD trip sorts as if its number were rupees.
    CASE WHEN p_sort = 'price_asc'  THEN r.price_base  END ASC  NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN r.price_base  END DESC NULLS LAST,
    CASE WHEN p_sort = 'nearest'    THEN r.distance_km END ASC  NULLS LAST,
    CASE WHEN p_sort = 'newest'     THEN r.created_at  END DESC NULLS LAST,
    r.is_featured DESC, r.rating DESC NULLS LAST, r.created_at DESC NULLS LAST
  LIMIT greatest(coalesce(p_limit, 24), 0)
  OFFSET greatest(coalesce(p_offset, 0), 0)
$function$;


-- ============================================================================
-- FACETS
-- ============================================================================
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
  p_price_currency text              DEFAULT 'PKR',
  p_types          text[]            DEFAULT ARRAY['tour','package'],
  p_min_duration   integer           DEFAULT NULL,
  p_max_duration   integer           DEFAULT NULL,
  p_difficulty     text[]            DEFAULT NULL,
  p_departure_from date              DEFAULT NULL,
  p_departure_to   date              DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $function$
  WITH rows AS (
    SELECT * FROM public._search_listings_base(
      p_query, p_lat, p_lng, p_radius_km, p_min_price, p_max_price,
      p_min_rating, p_country, p_category, p_price_currency,
      p_min_duration, p_max_duration, p_difficulty, p_departure_from, p_departure_to
    )
    WHERE p_types IS NULL OR listing_type = ANY(p_types)
  ),
  -- Duration is bucketed, not listed: "3 days (1)" next to "4 days (1)" is a list of trips,
  -- not a filter. The bucket keys are what the caller passes back as min/max.
  bucketed AS (
    SELECT CASE
             WHEN duration_days IS NULL  THEN NULL
             WHEN duration_days <= 1     THEN '1'
             WHEN duration_days <= 3     THEN '2-3'
             WHEN duration_days <= 7     THEN '4-7'
             ELSE '8+'
           END AS bucket
    FROM rows
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
    'durations', coalesce((
      SELECT jsonb_agg(jsonb_build_object('bucket', bucket, 'count', c) ORDER BY ord)
      FROM (
        SELECT bucket, count(*) AS c,
               array_position(ARRAY['1','2-3','4-7','8+'], bucket) AS ord
        FROM bucketed WHERE bucket IS NOT NULL GROUP BY bucket
      ) t
    ), '[]'::jsonb),
    'difficulties', coalesce((
      SELECT jsonb_agg(jsonb_build_object('level', level, 'count', c) ORDER BY ord)
      FROM (
        SELECT lower(difficulty_level) AS level, count(*) AS c,
               coalesce(
                 array_position(ARRAY['easy','moderate','difficult'], lower(difficulty_level)),
                 99
               ) AS ord
        FROM rows WHERE difficulty_level IS NOT NULL GROUP BY lower(difficulty_level)
      ) t
    ), '[]'::jsonb),
    'price_currency', 'PKR',
    'price_min', (SELECT min(price_base) FROM rows WHERE price_base IS NOT NULL),
    'price_max', (SELECT max(price_base) FROM rows WHERE price_base IS NOT NULL)
  )
$function$;


-- Grants restored exactly as they were before the drop (see pg_proc.proacl):
-- the base function is SECURITY DEFINER and deliberately NOT granted to PUBLIC.
GRANT EXECUTE ON FUNCTION public._search_listings_base(
  text, double precision, double precision, double precision, numeric, numeric, numeric,
  text, text, text, integer, integer, text[], date, date
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.search_listings_unified(
  text, text[], double precision, double precision, double precision, numeric, numeric, numeric,
  text, text, text, integer, integer, text, integer, integer, text[], date, date
) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_listings_unified(
  text, text[], double precision, double precision, double precision, numeric, numeric, numeric,
  text, text, text, integer, integer, text, integer, integer, text[], date, date
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.search_listings_facets(
  text, double precision, double precision, double precision, numeric, numeric, numeric,
  text, text, text, text[], integer, integer, text[], date, date
) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_listings_facets(
  text, double precision, double precision, double precision, numeric, numeric, numeric,
  text, text, text, text[], integer, integer, text[], date, date
) TO anon, authenticated, service_role;

COMMIT;

-- PostgREST caches function signatures; without this the new arguments 404 until it restarts.
NOTIFY pgrst, 'reload schema';
