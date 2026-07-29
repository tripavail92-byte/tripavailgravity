-- ============================================================================
-- RE-SCOPE: keep today's work, delete only what was posted BEFORE today
--
-- The team posted new trips & hotel packages today (2026-07-29). The full wipe
-- (wipe_01_delete_content.sql) is PAUSED — do NOT run it; TRUNCATE is all-or-
-- nothing and would take today's content too.
--
-- This file is READ-ONLY. It tells me how to scope a delete to "created before
-- today" safely — in particular whether any genuinely new content is attached to
-- an OLD parent, which would be lost to a cascade delete.
--
-- CUTOFF = 2026-07-29 00:00 Asia/Karachi (Pakistan). created_at < cutoff = old
-- (delete candidate); >= cutoff = today's work (keep). All times shown are PKT.
-- If your team is not on PKT, tell me and I'll shift the boundary.
-- ============================================================================


-- ── A — old vs today, per listing type ──────────────────────────────────────
WITH cutoff AS (SELECT (timestamp '2026-07-29 00:00:00' AT TIME ZONE 'Asia/Karachi') AS ts)
SELECT 'hotels'   AS entity,
       count(*) FILTER (WHERE created_at <  (SELECT ts FROM cutoff)) AS before_today_delete,
       count(*) FILTER (WHERE created_at >= (SELECT ts FROM cutoff)) AS today_keep
FROM public.hotels
UNION ALL SELECT 'tours',
       count(*) FILTER (WHERE created_at <  (SELECT ts FROM cutoff)),
       count(*) FILTER (WHERE created_at >= (SELECT ts FROM cutoff))
FROM public.tours
UNION ALL SELECT 'packages',
       count(*) FILTER (WHERE created_at <  (SELECT ts FROM cutoff)),
       count(*) FILTER (WHERE created_at >= (SELECT ts FROM cutoff))
FROM public.packages;


-- ── B — THE TRAP: new content hanging off an OLD parent ─────────────────────
-- is_auto_stay = true  → one of my generated "Room Only" stays; it SHOULD die
--                        with its old hotel, ignore it here.
-- is_auto_stay = false → a teammate's genuine new package on an old hotel. If any
--                        appear, we must NOT bulk-delete old hotels — we keep them.
WITH cutoff AS (SELECT (timestamp '2026-07-29 00:00:00' AT TIME ZONE 'Asia/Karachi') AS ts)
SELECT
  p.name                                                   AS new_package,
  (p.room_configuration->>'auto_generated' = 'true')       AS is_auto_stay,
  h.name                                                   AS on_old_hotel,
  (h.created_at AT TIME ZONE 'Asia/Karachi')::date         AS hotel_created_pkt
FROM public.packages p
JOIN public.hotels  h ON h.id = p.hotel_id
WHERE p.created_at >= (SELECT ts FROM cutoff)     -- package is new
  AND h.created_at <  (SELECT ts FROM cutoff)     -- but its hotel is old
ORDER BY is_auto_stay, p.name;


-- ── C — today's keepers (confirm this is the team's new work) ────────────────
WITH cutoff AS (SELECT (timestamp '2026-07-29 00:00:00' AT TIME ZONE 'Asia/Karachi') AS ts)
SELECT 'hotel'   AS typ, name  AS title, (created_at AT TIME ZONE 'Asia/Karachi')::text AS created_pkt
FROM public.hotels   WHERE created_at >= (SELECT ts FROM cutoff)
UNION ALL
SELECT 'tour',    title,        (created_at AT TIME ZONE 'Asia/Karachi')::text
FROM public.tours    WHERE created_at >= (SELECT ts FROM cutoff)
UNION ALL
SELECT 'package', name,         (created_at AT TIME ZONE 'Asia/Karachi')::text
FROM public.packages WHERE created_at >= (SELECT ts FROM cutoff)
ORDER BY created_pkt;
