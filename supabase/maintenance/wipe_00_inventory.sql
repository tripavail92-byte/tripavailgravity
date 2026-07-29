-- ============================================================================
-- WIPE PREP — read-only inventory, reality check, and FK cascade map
--
-- Nothing here writes or deletes. Run the THREE queries below and paste each
-- result. They tell me exactly what a clean-slate wipe will remove and how the
-- foreign keys cascade, so the delete script that follows is complete — no
-- orphaned rows, no surprise RESTRICT blocking the delete mid-way.
--
--   Query 1 — scale + any captured payment (the before baseline)
--   Query 2 — who owns the content (confirm every owner is a team/test account)
--   Query 3 — the live FK cascade map (authoritative; drives the delete order)
--
-- Supabase's editor shows the result of the LAST statement run, so run each
-- query on its own (select the block, Ctrl+Enter) and paste all three.
-- ============================================================================


-- ── QUERY 1 — content + booking counts, and any booking marked paid ─────────
SELECT ord, label, value FROM (
  SELECT 1 AS ord, 'hotels (total / published)' AS label,
         (SELECT count(*) FROM public.hotels)::text || ' / ' ||
         (SELECT count(*) FROM public.hotels WHERE is_published)::text AS value
  UNION ALL SELECT 2, 'rooms (total)',    (SELECT count(*) FROM public.rooms)::text
  UNION ALL SELECT 3, 'packages (total / published)',
         (SELECT count(*) FROM public.packages)::text || ' / ' ||
         (SELECT count(*) FROM public.packages WHERE is_published)::text
  UNION ALL SELECT 4, 'tours (total / published)',
         (SELECT count(*) FROM public.tours)::text || ' / ' ||
         (SELECT count(*) FROM public.tours WHERE is_published)::text
  UNION ALL SELECT 5, 'package_bookings (total)', (SELECT count(*) FROM public.package_bookings)::text
  UNION ALL SELECT 6, 'tour_bookings (total)',    (SELECT count(*) FROM public.tour_bookings)::text
  UNION ALL SELECT 7, 'package_bookings marked paid',
         (SELECT count(*) FROM public.package_bookings WHERE payment_status = 'paid')::text
  UNION ALL SELECT 8, 'tour_bookings marked paid',
         (SELECT count(*) FROM public.tour_bookings WHERE payment_status = 'paid')::text
) t ORDER BY ord;


-- ── QUERY 2 — content owners (eyeball for any real, non-team account) ────────
SELECT
  u.email,
  (SELECT count(*) FROM public.hotels   h WHERE h.owner_id    = u.id) AS hotels,
  (SELECT count(*) FROM public.packages p WHERE p.owner_id    = u.id) AS packages,
  (SELECT count(*) FROM public.tours    t WHERE t.operator_id = u.id) AS tours
FROM auth.users u
WHERE EXISTS (SELECT 1 FROM public.hotels   h WHERE h.owner_id    = u.id)
   OR EXISTS (SELECT 1 FROM public.packages p WHERE p.owner_id    = u.id)
   OR EXISTS (SELECT 1 FROM public.tours    t WHERE t.operator_id = u.id)
ORDER BY u.email;


-- ── QUERY 3 — live FK cascade map: every FK into a public table + on-delete ──
-- CASCADE  = child rows vanish automatically when the parent is deleted.
-- RESTRICT / NO ACTION = the delete is BLOCKED unless the child is removed first.
-- SET NULL = child survives with a null link (an orphan) — must be handled.
SELECT
  con.conrelid::regclass::text  AS child_table,
  att.attname                   AS child_column,
  con.confrelid::regclass::text AS parent_table,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_delete
FROM pg_constraint con
JOIN pg_attribute att
  ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
WHERE con.contype = 'f'
  AND con.connamespace = 'public'::regnamespace
  AND con.confrelid::regclass::text IN (
    'public.hotels', 'public.rooms', 'public.packages', 'public.tours',
    'public.package_bookings', 'public.tour_bookings', 'public.tour_schedules'
  )
ORDER BY parent_table, on_delete, child_table;
