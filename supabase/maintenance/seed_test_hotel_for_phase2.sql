-- ============================================================================
-- TEMPORARY test hotel — verify the Phase 2 property profile end to end
--
-- Seeds ONE published hotel with two priced rooms. Because the hotel is written
-- UNPUBLISHED first, then the rooms, then flipped to is_published = TRUE, the
-- publish trigger (trg_hotel_publish_ensure_stay, 20260729000003/4) fires with
-- rooms present and auto-generates the "Room Only" stay — exactly the real wizard
-- flow. So this also proves the Phase 1 machinery still works after the wipe.
--
-- Everything is tagged "(TEST)" and priced in PKR. STEP 2 prints the URL to open
-- and confirms the stay was generated. Delete it with the one-liner at the bottom
-- (cascades the rooms + the generated stay).
-- ============================================================================


-- ── STEP 1 — seed: unpublished hotel → rooms → flip publish (fires the trigger) ──
DO $$
DECLARE
  v_owner uuid;
  v_hotel uuid;
BEGIN
  -- Own it with a real team account (prefer yours), else any existing user.
  SELECT pu.id INTO v_owner
  FROM public.users pu
  LEFT JOIN auth.users au ON au.id = pu.id
  ORDER BY (au.email = 'falishamanpower4035@gmail.com') DESC NULLS LAST,
           (au.email = 'partner@tripavail.com') DESC NULLS LAST,
           pu.id
  LIMIT 1;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No users found to own the test hotel';
  END IF;

  INSERT INTO public.hotels (
    owner_id, name, description, location, city, country, area,
    latitude, longitude, star_rating, rating, review_count,
    currency, base_price_per_night, main_image_url, images, amenities, is_published
  ) VALUES (
    v_owner,
    'Karakoram View Lodge (TEST)',
    'A boutique mountain lodge in the heart of Karimabad, with Rakaposhi and Ultar Sar '
      || 'framed from every terrace. Hand-built in local stone, warm wood interiors, and a '
      || 'rooftop restaurant serving Hunza organic cuisine.',
    'Karimabad, Hunza, Pakistan', 'Hunza', 'Pakistan', 'Karimabad',
    36.3167, 74.6500, 4, 4.8, 37,
    'PKR', 0,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1080',
    '[
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1080",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1080",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1080",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=1080"
     ]'::jsonb,
    ARRAY['wifi','parking','breakfast','restaurant','room_service','heating','laundry','air_conditioning'],
    FALSE
  )
  RETURNING id INTO v_hotel;

  INSERT INTO public.rooms (
    hotel_id, name, room_type, description,
    capacity_adults, capacity_children, price_override, currency, initial_stock
  ) VALUES
    (v_hotel, 'Deluxe Mountain Room', 'deluxe',
     'Queen bed, private terrace facing Rakaposhi, in-room heating.', 2, 1, 8500, 'PKR', 6),
    (v_hotel, 'Family Suite', 'family',
     'Two bedrooms, a lounge, and a wide valley-view balcony.', 4, 2, 15000, 'PKR', 3);

  -- The flip. Rooms already exist, so the trigger's cheapest-room lookup (Deluxe,
  -- PKR 8500) succeeds and a Room Only stay is created in this same transaction.
  UPDATE public.hotels SET is_published = TRUE WHERE id = v_hotel;

  RAISE NOTICE 'Seeded test hotel %  — open /hotel/%', v_hotel, v_hotel;
END $$;


-- ── STEP 2 — the URL to open, and proof the stay auto-generated ──────────────
SELECT
  h.id                             AS hotel_id,
  '/hotel/' || h.id                AS open_this_path,
  h.name,
  (SELECT count(*) FROM public.packages p
     WHERE p.hotel_id = h.id AND p.is_published)                      AS live_stays,   -- expect 1
  (SELECT string_agg(p.name || '  ·  ' || p.currency || ' ' || p.base_price_per_night, E'\n')
     FROM public.packages p WHERE p.hotel_id = h.id)                  AS stay_detail
FROM public.hotels h
WHERE h.name = 'Karakoram View Lodge (TEST)'
ORDER BY h.created_at DESC
LIMIT 1;


-- ── CLEANUP — run when you're done looking (cascades rooms + the generated stay) ──
-- DELETE FROM public.hotels WHERE name = 'Karakoram View Lodge (TEST)';
