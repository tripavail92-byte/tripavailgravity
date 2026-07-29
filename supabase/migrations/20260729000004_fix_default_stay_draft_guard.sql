-- ============================================================================
-- Fix: default-stay generator skipped hotels that have an unpublished DRAFT
--
-- 20260729000003 made every published hotel with rooms sellable — except it
-- didn't, for 3 of them. Horizon Guest House, KA Lodges and Pine & Peak have
-- priced rooms but got no stay.
--
-- ROOT CAUSE. ensure_default_stay_for_hotel guarded on:
--
--     IF EXISTS (SELECT 1 FROM packages WHERE hotel_id = p_hotel_id) ...
--
-- "any package at all" — published OR draft. Those 3 hotels each have a
-- half-built curated package saved as a draft (is_published = false). The guard
-- read that as "already sells something" and stepped aside. But a draft is not
-- sellable, so the hotel renders nowhere a traveller can book — exactly the
-- state this whole feature exists to prevent.
--
-- THE FIX. Skip only when a PUBLISHED package already exists. A draft no longer
-- blocks the baseline Room Only stay; when the partner later publishes their
-- curated package, it simply sits alongside the Room Only (the intended model).
-- Still idempotent: once the Room Only is created it is published, so a second
-- call sees it and skips.
--
-- STEP 0 confirms the cause before the fix; STEP 3 proves no hotel is left
-- stranded after it.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — Why is each stranded hotel stranded? Expect draft_packages >= 1,
-- has_owner = true, and a real currency — i.e. the draft guard, nothing else.
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  h.name,
  h.owner_id IS NOT NULL                                                              AS has_owner,
  (SELECT count(*) FROM public.packages p WHERE p.hotel_id = h.id AND p.is_published = FALSE) AS draft_packages,
  (SELECT count(*) FROM public.packages p WHERE p.hotel_id = h.id AND p.is_published = TRUE)  AS live_packages,
  (SELECT string_agg(DISTINCT COALESCE(r.currency, '<null>'), ',')
     FROM public.rooms r WHERE r.hotel_id = h.id AND r.price_override > 0)            AS priced_room_currencies,
  (SELECT min(r.price_override)
     FROM public.rooms r WHERE r.hotel_id = h.id AND r.price_override > 0)            AS cheapest_price
FROM public.hotels h
WHERE h.is_published
  AND NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.hotel_id = h.id AND p.is_published)
  AND EXISTS     (SELECT 1 FROM public.rooms    r WHERE r.hotel_id = h.id AND r.price_override > 0)
ORDER BY h.name;


BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — Replace the generator. ONLY the guard line changes (marked <<<<);
-- the rest is byte-identical to 20260729000003.
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
  SELECT to_jsonb(h.*), h.owner_id, h.name
    INTO v_hotel, v_owner, v_name
    FROM public.hotels h
   WHERE h.id = p_hotel_id;

  IF v_hotel IS NULL THEN
    RETURN NULL;
  END IF;

  IF COALESCE((v_hotel->>'is_published')::boolean, false) IS NOT TRUE THEN
    RETURN NULL;
  END IF;

  IF v_owner IS NULL THEN
    RETURN NULL;
  END IF;

  -- <<<< THE FIX. Was: EXISTS (… WHERE p.hotel_id = p_hotel_id) — any package,
  -- draft included, wrongly blocked the stay. A draft is not sellable; only a
  -- PUBLISHED package means the hotel already sells something.
  IF EXISTS (SELECT 1 FROM public.packages p
             WHERE p.hotel_id = p_hotel_id AND p.is_published = TRUE) THEN
    RETURN NULL;
  END IF;

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
    RETURN NULL;
  END IF;

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
    RAISE WARNING 'ensure_default_stay_for_hotel(%) failed: %', p_hotel_id, SQLERRM;
    RETURN NULL;
  END;

  RETURN v_new_id;
END;
$$;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2 — Re-run the backfill with the corrected guard. NULL = skipped (already
-- has a live package, or no priced room). The 3 draft-blocked hotels now return
-- a new id.
-- ──────────────────────────────────────────────────────────────────────────

SELECT h.name, public.ensure_default_stay_for_hotel(h.id) AS new_stay_id
FROM public.hotels h
WHERE h.is_published = TRUE
ORDER BY h.name;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3 — SANITY. No published hotel with a priced room may lack a stay.
-- ──────────────────────────────────────────────────────────────────────────

SELECT count(*) AS sellable_hotels_still_stranded          -- expect 0
FROM public.hotels h
WHERE h.is_published
  AND NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.hotel_id = h.id AND p.is_published)
  AND EXISTS     (SELECT 1 FROM public.rooms    r WHERE r.hotel_id = h.id AND r.price_override > 0);

SELECT
  (SELECT count(*) FROM public.packages WHERE is_published)                             AS live_packages,
  (SELECT count(*) FROM public.packages
     WHERE is_published AND package_type = 'Room Only'
       AND room_configuration->>'auto_generated' = 'true')                              AS auto_room_only_stays,
  (SELECT count(*) FROM public.packages
     WHERE is_published AND (base_price_per_night IS NULL OR base_price_per_night <= 0)) AS live_packages_without_price;  -- must be 0

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if STEP 0 shows an unexpected cause or STEP 3 isn't 0.


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY FROM OUTSIDE — Horizon Guest House, KA Lodges and Pine & Peak now
-- appear as "… · Room Only" cards with a price.
-- ──────────────────────────────────────────────────────────────────────────

SELECT listing_type, title, subtitle, price, currency
FROM public.search_listings_unified(p_types := ARRAY['package'], p_limit := 50)
ORDER BY title;
