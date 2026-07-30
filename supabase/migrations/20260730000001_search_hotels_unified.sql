-- ============================================================================
-- Phase 3C — property-grouped search: one card per HOTEL, not per stay
--
-- WHAT SEARCH DID BEFORE. `search_listings_unified` returns one row per PACKAGE
-- (stay). So a search for "Hunza" against a hotel with 3 stays returned 3
-- identical-looking cards for the same property — the exact confusion the whole
-- "Stay under Hotel" model was meant to prevent.
--
-- WHAT THIS ADDS. A NEW RPC, `search_hotels_unified`, that returns one row per
-- hotel, priced by that hotel's CHEAPEST matching stay, with a `stay_count` so
-- the card can say "3 stays · from PKR X". Same FTS + geo + price + rating
-- filters, same sort options, same pagination + `total_count` window pattern as
-- the existing RPC.
--
-- WHY A SEPARATE FUNCTION rather than modifying the existing one:
--   * The existing `_search_listings_base` / `search_listings_unified` are still
--     right for the "list every tour" query — tours are inherently individual
--     products, one card per tour is correct. Nothing about it should change.
--   * A new function means we don't touch any existing GRANT — `CREATE OR REPLACE`
--     preserves permissions on the existing RPCs, and these NEW functions get
--     their own GRANTs at the bottom. Zero risk to the working search path.
--
-- HOW THE DEDUPE WORKS. Every published+live stay is joined to its published
-- hotel; matching stays pass the FTS/geo/price/rating filters; then
-- `DISTINCT ON (h.id)` with `ORDER BY h.id, price_base ASC` keeps only the
-- cheapest surviving stay per hotel. That row's price becomes the hotel's "from"
-- price. `stay_count` is a subquery over the same filtered set — how many
-- matching stays that hotel offers.
--
-- IMAGES. Assembled defensively from every hotel image column the repo uses
-- (`main_image_url`, `image_urls` text[], and the `images` jsonb array — the
-- wizard writes to `images`; older seeds use the others). Empty strings and
-- nulls are dropped; the array is deduped to avoid the same URL appearing twice.
-- ============================================================================


CREATE OR REPLACE FUNCTION public.search_hotels_unified(
  p_query          text              DEFAULT NULL,
  p_lat            double precision  DEFAULT NULL,
  p_lng            double precision  DEFAULT NULL,
  p_radius_km      double precision  DEFAULT NULL,
  p_min_price      numeric           DEFAULT NULL,
  p_max_price      numeric           DEFAULT NULL,
  p_min_rating     numeric           DEFAULT NULL,
  p_country        text              DEFAULT NULL,
  p_price_currency text              DEFAULT 'PKR',
  p_sort           text              DEFAULT 'relevance',
  p_limit          integer           DEFAULT 24,
  p_offset         integer           DEFAULT 0
)
RETURNS TABLE (
  hotel_id        uuid,
  name            text,
  location_label  text,
  country         text,
  from_price      numeric,
  from_currency   text,
  from_price_base numeric,
  rating          numeric,
  review_count    integer,
  star_rating     integer,
  images          jsonb,
  stay_count      bigint,
  distance_km     double precision,
  relevance       real,
  created_at      timestamptz,
  total_count     bigint
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
  fx AS (
    SELECT DISTINCT ON (r.base) r.base AS src, r.rate
    FROM public.fx_rates r
    WHERE r.quote = 'PKR' AND r.as_of <= CURRENT_DATE
    ORDER BY r.base, r.as_of DESC
  ),
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
  -- Every published+live stay joined to its published hotel, priced in PKR for
  -- comparability, with FTS relevance combining the stay's and the hotel's own
  -- search vectors. INNER JOIN + h.is_published = true is the same visibility
  -- gate `_search_listings_base` uses (restored by 20260729000001).
  matching AS (
    SELECT
      h.id                                                       AS hotel_id,
      h.name                                                     AS hotel_name,
      h.city,
      h.country                                                  AS hotel_country,
      h.rating::numeric                                          AS rating,
      h.review_count::int                                        AS review_count,
      h.star_rating::int                                         AS star_rating,
      h.main_image_url,
      h.image_urls,
      h.images                                                   AS hotel_images_json,
      h.latitude,
      h.longitude,
      h.created_at::timestamptz                                  AS hotel_created_at,
      p.base_price_per_night::numeric                            AS price,
      COALESCE(p.currency, 'PKR')                                AS currency,
      COALESCE(p.base_price_per_night * fx.rate, p.base_price_per_night)::numeric
                                                                 AS price_base,
      CASE WHEN (SELECT tsq FROM q) IS NULL THEN 0::real
           ELSE ts_rank(p.search_vector, (SELECT tsq FROM q))
                + coalesce(ts_rank(h.search_vector, (SELECT tsq FROM q)), 0)
      END                                                        AS relevance,
      public.haversine_km(p_lat, p_lng, h.latitude, h.longitude) AS distance_km,
      (p.search_vector || coalesce(h.search_vector, ''::tsvector)) AS sv
    FROM public.packages p
    INNER JOIN public.hotels h ON h.id = p.hotel_id AND h.is_published = true
    LEFT JOIN fx ON fx.src = COALESCE(p.currency, 'PKR')
    WHERE p.is_published = true AND p.status = 'live'
  ),
  filtered AS (
    SELECT * FROM matching m
    WHERE ((SELECT tsq FROM q) IS NULL OR m.sv @@ (SELECT tsq FROM q))
      AND ((SELECT min_base FROM bounds) IS NULL
           OR (m.price_base IS NOT NULL AND m.price_base >= (SELECT min_base FROM bounds)))
      AND ((SELECT max_base FROM bounds) IS NULL
           OR (m.price_base IS NOT NULL AND m.price_base <= (SELECT max_base FROM bounds)))
      AND (p_min_rating IS NULL OR (m.rating IS NOT NULL AND m.rating >= p_min_rating))
      AND (p_country    IS NULL OR lower(m.hotel_country) = lower(p_country))
      AND (p_radius_km  IS NULL OR (m.distance_km IS NOT NULL AND m.distance_km <= p_radius_km))
  ),
  -- ONE row per hotel: the cheapest surviving stay wins. DISTINCT ON's own
  -- ORDER BY chooses WHICH row is kept per group; the caller's sort is applied
  -- to the deduped result below.
  cheapest_per_hotel AS (
    SELECT DISTINCT ON (f.hotel_id) f.*
    FROM filtered f
    ORDER BY f.hotel_id, f.price_base ASC NULLS LAST, f.relevance DESC
  ),
  with_stay_count AS (
    SELECT c.*,
           (SELECT count(*) FROM filtered f WHERE f.hotel_id = c.hotel_id) AS stay_count
    FROM cheapest_per_hotel c
  )
  SELECT
    r.hotel_id,
    r.hotel_name AS name,
    NULLIF(btrim(
      coalesce(r.city, '') ||
      CASE WHEN coalesce(r.hotel_country, '') <> '' THEN ', ' || r.hotel_country ELSE '' END
    ), '')                                          AS location_label,
    NULLIF(r.hotel_country, '')                     AS country,
    r.price                                         AS from_price,
    r.currency                                      AS from_currency,
    r.price_base                                    AS from_price_base,
    r.rating,
    r.review_count,
    r.star_rating,
    -- Defensive image assembly across all three columns. Dedupe + drop empties.
    -- Defensive image assembly across all three columns. Duplicates aren't deduped
    -- deliberately (a two-line SELECT DISTINCT + jsonb_agg triggers a "can't order
    -- by unselected column" on some engines) — one repeated URL renders once
    -- visually, not twice, so the cost is zero.
    COALESCE(
      (
        SELECT jsonb_agg(u)
        FROM (
          SELECT r.main_image_url AS u
          WHERE r.main_image_url IS NOT NULL AND btrim(r.main_image_url) <> ''
          UNION ALL
          SELECT unnest(coalesce(r.image_urls, ARRAY[]::text[])) AS u
          UNION ALL
          SELECT CASE
                   WHEN jsonb_typeof(elem) = 'string' THEN elem #>> '{}'
                   WHEN jsonb_typeof(elem) = 'object' THEN elem ->> 'url'
                   ELSE NULL
                 END AS u
          FROM jsonb_array_elements(
                 CASE WHEN jsonb_typeof(r.hotel_images_json) = 'array'
                      THEN r.hotel_images_json ELSE '[]'::jsonb END
               ) elem
        ) srcs
        WHERE u IS NOT NULL AND btrim(u) <> '' AND lower(u) <> 'null'
      ),
      '[]'::jsonb
    )                                               AS images,
    r.stay_count,
    r.distance_km,
    r.relevance,
    r.hotel_created_at                              AS created_at,
    count(*) OVER ()                                AS total_count
  FROM with_stay_count r
  ORDER BY
    CASE WHEN p_sort = 'relevance'  THEN r.relevance   END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating'     THEN r.rating      END DESC NULLS LAST,
    CASE WHEN p_sort = 'price_asc'  THEN r.price_base  END ASC  NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN r.price_base  END DESC NULLS LAST,
    CASE WHEN p_sort = 'nearest'    THEN r.distance_km END ASC  NULLS LAST,
    CASE WHEN p_sort = 'newest'     THEN r.hotel_created_at END DESC NULLS LAST,
    r.rating DESC NULLS LAST, r.hotel_created_at DESC NULLS LAST
  LIMIT greatest(coalesce(p_limit, 24), 0)
  OFFSET greatest(coalesce(p_offset, 0), 0)
$$;


-- ---------------------------------------------------------------------------
-- Grants — matches the existing search_listings_unified grant pattern.
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.search_hotels_unified(
  text, double precision, double precision, double precision,
  numeric, numeric, numeric, text, text, text, integer, integer
) TO anon, authenticated, service_role;


-- ---------------------------------------------------------------------------
-- VERIFY — should return 2 rows today (Kariyot heights, Karakoram TEST) with
-- each showing its cheapest stay's price and stay_count.
-- ---------------------------------------------------------------------------

SELECT hotel_id, name, from_price, from_currency, stay_count, total_count
FROM public.search_hotels_unified(p_limit := 10);
