-- ============================================================================
-- Phase 1 — every published hotel with rooms becomes sellable, automatically
--
-- THE PROBLEM. Nothing on TripAvail sells a "hotel". Every selling surface —
-- search, the home feed, /hotels, the details page, the booking RPC — keys off
-- the `packages` table. A hotel with rooms but no package is invisible to
-- buyers: it renders nowhere a traveller can book. Right now 8 of the 10 live
-- hotels are in exactly that state.
--
-- THE FIX, at the core rather than as a one-off. A "Room Only" package is the
-- baseline sellable unit — just the room, at the cheapest room's nightly rate,
-- no curation. This migration:
--
--   1. ensure_default_stay_for_hotel(hotel_id) — creates that Room Only package
--      for a hotel IF it is published, has at least one priced room, and has no
--      package yet. Idempotent: a second call is a no-op.
--
--   2. A trigger on hotels that calls it whenever a hotel becomes published.
--      From now on, publishing a hotel with rooms makes it sellable in the same
--      transaction — the gap cannot reopen.
--
--   3. A one-time backfill for the 8 hotels already stranded.
--
-- WHY THIS IS SAFE TO BOOK. create_package_booking_atomic (20260326000013) reads
-- only minimum_nights, maximum_nights, max_guests, is_published and
-- base_price_per_night, and prices total = base_price_per_night * nights. It does
-- NOT read room_configuration. check_package_availability (20260210000011) returns
-- available whenever no confirmed/pending booking overlaps — a fresh package with
-- no bookings is always available. So a generated stay books correctly with no
-- inventory rows of its own.
--
-- WHY IT WON'T BREAK PUBLISHING. The generator wraps its INSERT in an exception
-- handler: any failure inside it raises a WARNING and returns NULL. A bug in stay
-- generation can never abort the hotel publish that triggered it.
--
-- PRICE + CURRENCY come from the cheapest priced room, never from
-- hotels.base_price_per_night or hotels.currency — the room is what a partner
-- actually typed, and (since 20260729000002) rooms are the source of truth for
-- currency anyway. This sidesteps the hotel-level currency bug entirely.
--
-- MEDIA is lifted from the hotel via to_jsonb(hotel), which yields whatever image
-- columns exist without a compile-time dependency on their names — the repo does
-- not pin the hotel image shape down, and to_jsonb tolerates every variant.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — PREVIEW. What each stranded hotel will be sold as. Read before running.
--
-- For every published hotel that has no package, this shows the room the stay
-- will be priced from and the raw image material available. Nothing is written.
-- ──────────────────────────────────────────────────────────────────────────

WITH hj AS (
  SELECT h.id, h.name, to_jsonb(h.*) AS j
  FROM public.hotels h
  WHERE h.is_published = TRUE
    AND NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.hotel_id = h.id)
),
cheapest AS (
  SELECT DISTINCT ON (r.hotel_id)
         r.hotel_id,
         r.price_override,
         r.currency,
         GREATEST(1, COALESCE(r.capacity_adults, 2) + COALESCE(r.capacity_children, 0)) AS sleeps
  FROM public.rooms r
  WHERE r.price_override IS NOT NULL AND r.price_override > 0
  ORDER BY r.hotel_id, r.price_override ASC, r.id ASC
)
SELECT
  hj.name || ' · Room Only'                       AS stay_title,
  c.price_override                                AS price_per_night,
  c.currency,
  c.sleeps                                        AS max_guests,
  (hj.j->>'main_image_url')                       AS main_image_url,
  jsonb_typeof(hj.j->'image_urls')                AS image_urls_shape,
  jsonb_typeof(hj.j->'images')                    AS images_shape,
  CASE WHEN c.hotel_id IS NULL
       THEN 'SKIP — no priced room to sell'
       ELSE 'WILL CREATE' END                     AS verdict
FROM hj
LEFT JOIN cheapest c ON c.hotel_id = hj.id
ORDER BY verdict, hj.name;


BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — The generator.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ensure_default_stay_for_hotel(p_hotel_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hotel      jsonb;
  v_owner      uuid;
  v_name       text;
  v_room       RECORD;
  v_media      text[];
  v_new_id     uuid;
BEGIN
  -- Load the hotel as jsonb so image columns can be read without naming them.
  SELECT to_jsonb(h.*), h.owner_id, h.name
    INTO v_hotel, v_owner, v_name
    FROM public.hotels h
   WHERE h.id = p_hotel_id;

  IF v_hotel IS NULL THEN
    RETURN NULL;                                   -- no such hotel
  END IF;

  IF COALESCE((v_hotel->>'is_published')::boolean, false) IS NOT TRUE THEN
    RETURN NULL;                                   -- only sell published hotels
  END IF;

  IF v_owner IS NULL THEN
    RETURN NULL;                                   -- owner_id is NOT NULL on packages
  END IF;

  -- Idempotency + scope: never create a second stay, and stay out of the way of
  -- hotels that already sell something (curated package or a prior Room Only).
  IF EXISTS (SELECT 1 FROM public.packages p WHERE p.hotel_id = p_hotel_id) THEN
    RETURN NULL;
  END IF;

  -- Cheapest priced room — this is what the stay is priced and sized from.
  SELECT r.id,
         r.price_override,
         r.currency,
         GREATEST(1, COALESCE(r.capacity_adults, 2) + COALESCE(r.capacity_children, 0)) AS sleeps
    INTO v_room
    FROM public.rooms r
   WHERE r.hotel_id = p_hotel_id
     AND r.price_override IS NOT NULL
     AND r.price_override > 0
   ORDER BY r.price_override ASC, r.id ASC
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;                                   -- nothing priced to sell
  END IF;

  -- Media: pull every plausible image source out of the hotel jsonb and flatten
  -- to a deduped text[]. Handles main_image_url / cover_image (scalars),
  -- image_urls (array of strings) and images (array of strings OR of {url:…}).
  v_media := (
    SELECT array_agg(DISTINCT u.url)
    FROM (
      SELECT v_hotel->>'main_image_url' AS url
      UNION ALL
      SELECT v_hotel->>'cover_image'
      UNION ALL
      SELECT elem #>> '{}'
        FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(v_hotel->'image_urls') = 'array'
                    THEN v_hotel->'image_urls' ELSE '[]'::jsonb END) elem
      UNION ALL
      SELECT CASE WHEN jsonb_typeof(elem) = 'object' THEN elem->>'url'
                  ELSE elem #>> '{}' END
        FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(v_hotel->'images') = 'array'
                    THEN v_hotel->'images' ELSE '[]'::jsonb END) elem
    ) u
    WHERE u.url IS NOT NULL AND btrim(u.url) <> '' AND lower(u.url) <> 'null'
  );
  v_media := COALESCE(v_media, '{}'::text[]);

  BEGIN
    INSERT INTO public.packages (
      owner_id, hotel_id, package_type, name, description,
      media_urls, highlights, inclusions, exclusions,
      cancellation_policy, payment_terms,
      base_price_per_night, currency, max_guests,
      minimum_nights, maximum_nights,
      is_published, room_configuration
    ) VALUES (
      v_owner,
      p_hotel_id,
      'Room Only',
      v_name || ' · Room Only',
      'Just the room at ' || v_name || ' — booked at the best available nightly '
        || 'rate, with no add-ons. Stay as many nights as you like.',
      v_media,
      ARRAY['Best available room rate', 'Flexible length of stay', 'Booked direct with the property'],
      ARRAY['Your selected room', 'Access to the property''s standard amenities'],
      ARRAY['Meals and dining', 'Tours, activities and transfers'],
      'Free cancellation is subject to the property''s standard policy. Review the terms before you confirm.',
      'Full amount is charged online at the time of booking confirmation.',
      v_room.price_override,
      v_room.currency,
      v_room.sleeps,
      1,
      30,
      TRUE,
      jsonb_build_object(
        'auto_generated', true,
        'type', 'room_only',
        'source_room_id', v_room.id,
        'generated_at', NOW()
      )
    )
    RETURNING id INTO v_new_id;
  EXCEPTION WHEN OTHERS THEN
    -- A failure here must never abort the hotel publish that fired the trigger.
    RAISE WARNING 'ensure_default_stay_for_hotel(%) failed: %', p_hotel_id, SQLERRM;
    RETURN NULL;
  END;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_default_stay_for_hotel(uuid) TO service_role;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2 — Trigger: publishing a hotel makes it sellable in the same transaction.
--
-- AFTER, and only on is_published, so an ordinary hotel edit (name, currency sync,
-- price) does not fire it. By the time a wizard-built hotel flips is_published =
-- true, its rooms already exist (hotelService writes rooms, then flips publish
-- last), so the cheapest-room lookup finds inventory.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_hotel_publish_ensure_stay()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_published IS TRUE THEN
    PERFORM public.ensure_default_stay_for_hotel(NEW.id);
  END IF;
  RETURN NULL;                                     -- AFTER trigger
END;
$$;

DROP TRIGGER IF EXISTS trg_hotel_publish_ensure_stay ON public.hotels;

CREATE TRIGGER trg_hotel_publish_ensure_stay
  AFTER INSERT OR UPDATE OF is_published
  ON public.hotels
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_hotel_publish_ensure_stay();


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3 — Backfill the hotels already stranded. Idempotent: the function skips
-- any hotel that already has a package or no priced room. NULL = skipped.
-- ──────────────────────────────────────────────────────────────────────────

SELECT h.name, public.ensure_default_stay_for_hotel(h.id) AS new_stay_id
FROM public.hotels h
WHERE h.is_published = TRUE
ORDER BY h.name;


-- ──────────────────────────────────────────────────────────────────────────
-- SANITY CHECK — read before choosing COMMIT vs ROLLBACK.
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM public.packages WHERE is_published)                          AS live_packages,
  (SELECT count(*) FROM public.packages
     WHERE is_published AND package_type = 'Room Only'
       AND room_configuration->>'auto_generated' = 'true')                           AS auto_room_only_stays,
  (SELECT count(*) FROM public.hotels h
     WHERE h.is_published
       AND EXISTS (SELECT 1 FROM public.rooms r
                    WHERE r.hotel_id = h.id AND r.price_override > 0)
       AND NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.hotel_id = h.id))     AS sellable_hotels_still_stranded,  -- expect 0
  (SELECT count(*) FROM public.packages
     WHERE is_published AND (base_price_per_night IS NULL OR base_price_per_night <= 0)) AS live_packages_without_price;  -- must be 0

-- EXPECTED
--   live_packages                     3 → 11   (3 existing + 8 backfilled; fewer if any hotel has no priced room)
--   auto_room_only_stays              0 → 8
--   sellable_hotels_still_stranded    → 0      ← the point of the whole migration
--   live_packages_without_price       → 0      ← the publish guard would reject otherwise

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if any number is off


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY FROM OUTSIDE — the same call the site makes:
--
--   POST /rest/v1/rpc/search_listings_unified {"p_types":["package"],"p_limit":50}
--
-- The stranded hotels now appear as "… · Room Only" cards with a price and a
-- "Room Only" badge. Every card must carry a price; none may show a foreign demo.
-- ──────────────────────────────────────────────────────────────────────────

SELECT listing_type, title, subtitle, price, currency, badge
FROM public.search_listings_unified(p_types := ARRAY['package'], p_limit := 50)
ORDER BY title;
