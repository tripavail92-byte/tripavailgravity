-- Search facets ignored the type filter.
--
-- _search_listings_base unions tours AND hotel packages. search_listings_unified takes p_types and
-- filters on it, but search_listings_facets never had that parameter — so the sidebar counted
-- packages even when the page was showing tours only. Trips-first made this visible: with 16 live
-- tours the country facet read "Pakistan (23) / Unknown Country (6)" (= 29, i.e. tours + the 15
-- live packages), and the "Unknown Country" bucket was hotels with no country set, not tours.
--
-- Adds p_types (defaulting to both, so any caller that omits it behaves exactly as before).

BEGIN;

DROP FUNCTION IF EXISTS public.search_listings_facets(
  text, double precision, double precision, double precision, numeric, numeric, numeric, text, text, text
);

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
  p_types          text[]            DEFAULT ARRAY['tour','package']
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
    WHERE p_types IS NULL OR listing_type = ANY(p_types)
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
    'price_currency', 'PKR',
    'price_min', (SELECT min(price_base) FROM rows WHERE price_base IS NOT NULL),
    'price_max', (SELECT max(price_base) FROM rows WHERE price_base IS NOT NULL)
  )
$$;

GRANT EXECUTE ON FUNCTION public.search_listings_facets(
  text, double precision, double precision, double precision, numeric, numeric, numeric, text, text, text, text[]
) TO anon, authenticated, service_role;

COMMIT;
