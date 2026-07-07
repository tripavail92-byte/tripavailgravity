-- TripAvail — hide demo/seed + test tours so your REAL tours lead.
--
-- Safe & reversible: this only flips visibility flags (is_featured / is_published).
-- It does NOT delete anything, so bookings/reviews/schedules are untouched.
-- Run in: Supabase Dashboard → SQL Editor.

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — Preview exactly what will be hidden (run this first, eyeball it):
-- ──────────────────────────────────────────────────────────────────────────
select id, title, is_featured, is_published, status, created_at
from public.tours
where title in (
  'Swiss Alps Paragliding Experience',
  'Tokyo Street Food & Culture Tour',
  'Historic Rome Walking Tour',
  'Bali Waterfall & Rice Terrace Adventure',
  'Grand Canyon Sunset Adventure',
  'Test',
  'afsdf asdfsfsdfsdf',
  'Phase 6 QA Promo Deposit + Refund Tour'
)
order by title;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2 — Hide them (un-feature so they stop topping Home, unpublish so they
-- drop out of Search/Tours). Real Pakistan tours stay live & lead.
-- ──────────────────────────────────────────────────────────────────────────
update public.tours
set is_featured = false,
    is_published = false
where title in (
  'Swiss Alps Paragliding Experience',
  'Tokyo Street Food & Culture Tour',
  'Historic Rome Walking Tour',
  'Bali Waterfall & Rice Terrace Adventure',
  'Grand Canyon Sunset Adventure',
  'Test',
  'afsdf asdfsfsdfsdf',
  'Phase 6 QA Promo Deposit + Refund Tour'
);

-- ──────────────────────────────────────────────────────────────────────────
-- (OPTIONAL) STEP 3 — Permanently delete them LATER, only after you confirm
-- none have real bookings you care about. Uncomment to use:
-- ──────────────────────────────────────────────────────────────────────────
-- delete from public.tours
-- where title in (
--   'Swiss Alps Paragliding Experience',
--   'Tokyo Street Food & Culture Tour',
--   'Historic Rome Walking Tour',
--   'Bali Waterfall & Rice Terrace Adventure',
--   'Grand Canyon Sunset Adventure',
--   'Test',
--   'afsdf asdfsfsdfsdf',
--   'Phase 6 QA Promo Deposit + Refund Tour'
-- );

-- ──────────────────────────────────────────────────────────────────────────
-- To UNDO step 2 (re-show everything):
--   update public.tours set is_published = true where title in ( ...same list... );
-- ──────────────────────────────────────────────────────────────────────────
