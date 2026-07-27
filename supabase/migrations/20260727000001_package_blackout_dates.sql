-- ============================================================================
-- Packages: blackout dates are collected, confirmed to the partner, then discarded
--
-- REPORTED SYMPTOM: a partner blocks dates in the wizard's availability step, the review screen
-- confirms "N dates blocked", they publish — and a guest books straight through the blocked dates.
--
-- WHY. Two independent halves, both missing:
--
--   * THERE IS NOWHERE TO PUT THEM. `packages` has no blocked-date column and there is no
--     package_availability table. AvailabilityStep collects `blackoutDates`
--     (AvailabilityStep.tsx:33) and publishPackage never maps it — the string "blackout" does not
--     occur anywhere in packageService.ts. The array dies in browser memory at publish.
--
--   * NOTHING WOULD ENFORCE THEM ANYWAY. check_package_availability (20260210000011:1) is purely a
--     booking-overlap check: it counts confirmed + unexpired-pending package_bookings whose range
--     overlaps the request. It has no notion of a date the host closed.
--     create_package_booking_atomic (20260326000013:34) validates minimum_nights, maximum_nights,
--     max_guests and base_price_per_night, then defers to that same function. So even a
--     hand-written blocked date in the database would not have stopped a single booking.
--
-- Storing the dates without the second half would be the same bug wearing a hat: the partner would
-- see them persisted, believe the dates were closed, and still be overbooked. The rejection is the
-- point; the column just makes it possible.
--
-- ── SHAPE: DATE[] ON packages, NOT A package_availability TABLE ─────────────────────────────────
-- What the wizard collects is a set of closed days. No per-date inventory, no per-date price, no
-- per-date anything — nothing a row-per-date buys today. Keeping it on the package row means:
--   * the booking RPC reads it from the row it ALREADY locks FOR UPDATE, so enforcement costs no
--     extra lock, no join, and no new RLS/grant surface on a new table;
--   * publish stays ONE INSERT, so there is no window in which the package row exists and its
--     blackout rows do not — which is precisely how this overbooking bug would reappear in a new
--     shape, and it would be harder to see because the data would look present.
-- Per-date inventory is not foreclosed. When it arrives it becomes the source of truth and this
-- column backfills into it with a single INSERT ... SELECT unnest(blackout_dates), the way any
-- scalar-to-relation promotion goes. Building the table now would mean guessing the inventory
-- schema before anything writes or reads it.
--
-- ── SEMANTICS: A STAY OCCUPIES THE NIGHTS [check_in, check_out) ─────────────────────────────────
-- The guest leaves on the check-out morning, so that night is not theirs. Therefore:
--   * a blackout ON the check-in date blocks the stay,
--   * a blackout on any night in between blocks the stay,
--   * a blackout ON the check-out date does NOT block the stay.
-- Getting that last one wrong would reject a legitimate booking for every partner who closes the
-- day after a stay ends, which is the common case when they block a maintenance window.
-- ============================================================================


BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — the column.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS blackout_dates DATE[];

COMMENT ON COLUMN public.packages.blackout_dates IS
  'Dates the host has closed for booking. A stay is rejected when any element falls in '
  '[check_in, check_out) — the check-out date itself is not occupied and does not block. '
  'NULL and {} both mean nothing is blocked.';

-- A sane upper bound. The column is written straight from the browser under the table-wide
-- `authenticated` grant (20260208000001:66), and it is read on every availability check and every
-- booking attempt. Ten years of closed days is far past any real listing while still leaving a
-- pathological array — or a runaway client loop — unable to bloat a hot row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'packages_blackout_dates_bounded'
      AND conrelid = 'public.packages'::regclass
  ) THEN
    ALTER TABLE public.packages
      ADD CONSTRAINT packages_blackout_dates_bounded
      CHECK (blackout_dates IS NULL OR cardinality(blackout_dates) <= 3660);
  END IF;
END $$;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2 — one predicate, shared by the read path and the write path.
--
-- Both check_package_availability and create_package_booking_atomic need the same answer, and they
-- must never disagree: a guest told "available" by the details page and then rejected at checkout
-- is a worse experience than either failure alone. So the rule lives in exactly one function.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.stay_hits_blackout(
  blackout_dates_param DATE[],
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE sql
-- STABLE, not IMMUTABLE: timestamptz::date resolves through the session TimeZone.
STABLE
-- SECURITY INVOKER (the default, stated for the reader): this touches no table, so there is nothing
-- for a definer context to grant access to.
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(blackout_dates_param, ARRAY[]::DATE[])) AS t(d)
    WHERE t.d >= check_in_param::date
      AND t.d <  check_out_param::date
  );
$$;

COMMENT ON FUNCTION public.stay_hits_blackout(DATE[], TIMESTAMPTZ, TIMESTAMPTZ) IS
  'TRUE when a stay from check_in to check_out occupies a night the host has blocked. Half-open on '
  'the right: the check-out date is not occupied, so a blackout there does not block the stay.';

GRANT EXECUTE ON FUNCTION public.stay_hits_blackout(DATE[], TIMESTAMPTZ, TIMESTAMPTZ)
  TO anon, authenticated, service_role;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3 — the read path. PackageDetailsPage calls this before it will let a guest proceed
-- (PackageDetailsPage.tsx:293 and :444, via packageBookingService.checkAvailability), so teaching it
-- about blackouts is what makes a blocked date show as unavailable BEFORE payment rather than as an
-- exception at the booking RPC.
--
-- Body is 20260210000011's verbatim, with the blackout arm added in front. Deliberately still
-- VOLATILE (no volatility marker): 20260210000007 declared it STABLE and 20260210000011 dropped
-- that. Leaving it volatile is the safer of the two here — this function is called from inside
-- create_package_booking_atomic's transaction to police a race, and a volatile call takes a fresh
-- snapshot per invocation instead of reusing the calling statement's. Restoring STABLE would let it
-- miss a booking committed after the outer statement began.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_package_availability(
  package_id_param UUID,
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count INT;
  pkg_blackouts DATE[];
BEGIN
  -- Host-closed dates. Cheapest check and the most definitive: no amount of waiting frees them up.
  SELECT blackout_dates INTO pkg_blackouts
  FROM public.packages
  WHERE id = package_id_param;

  IF public.stay_hits_blackout(pkg_blackouts, check_in_param, check_out_param) THEN
    RETURN FALSE;
  END IF;

  -- Overlapping bookings: confirmed, plus pending holds that have not expired. Unchanged.
  SELECT COUNT(*) INTO conflict_count
  FROM public.package_bookings
  WHERE package_id = package_id_param
    AND status IN ('confirmed', 'pending')
    AND (status != 'pending' OR (expires_at IS NOT NULL AND expires_at > NOW()))
    AND (check_in_date, check_out_date) OVERLAPS (check_in_param, check_out_param);

  RETURN conflict_count = 0;
END;
$$;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 4 — the write path, and the half that actually matters.
--
-- Body is 20260326000013's verbatim (expanded from its single line for readability — the commercial
-- defaults on the INSERT are unchanged), with the blackout gate added after the guest/night rules.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_package_booking_atomic(
  package_id_param UUID,
  traveler_id_param UUID,
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ,
  guest_count_param INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_id UUID;
  pkg_info RECORD;
  nights INT;
  expires_time TIMESTAMPTZ;
  pkg_base_price NUMERIC;
  total NUMERIC;
BEGIN
  -- blackout_dates joins the locked snapshot rather than being re-read later: the row is already
  -- held FOR UPDATE, so reading the column here means a partner editing their blackouts concurrently
  -- cannot land between this check and the INSERT below.
  SELECT
    id,
    minimum_nights,
    maximum_nights,
    max_guests,
    is_published,
    base_price_per_night,
    blackout_dates
  INTO pkg_info
  FROM public.packages
  WHERE id = package_id_param
  FOR UPDATE;

  IF pkg_info IS NULL THEN
    RAISE EXCEPTION 'Package not found';
  END IF;

  IF NOT pkg_info.is_published THEN
    RAISE EXCEPTION 'Package is not published';
  END IF;

  nights := (check_out_param::date - check_in_param::date)::INT;

  IF nights < pkg_info.minimum_nights THEN
    RAISE EXCEPTION 'Minimum % nights required', pkg_info.minimum_nights;
  END IF;

  IF nights > pkg_info.maximum_nights THEN
    RAISE EXCEPTION 'Maximum % nights allowed', pkg_info.maximum_nights;
  END IF;

  IF guest_count_param > pkg_info.max_guests THEN
    RAISE EXCEPTION 'Maximum % guests allowed', pkg_info.max_guests;
  END IF;

  -- THE GATE THIS MIGRATION EXISTS FOR. Raised separately from the generic availability failure
  -- below because to a guest they are not the same event: "someone else booked it" is worth
  -- retrying, and a hold might even expire; "the host closed these dates" never frees up.
  IF public.stay_hits_blackout(pkg_info.blackout_dates, check_in_param, check_out_param) THEN
    RAISE EXCEPTION 'Selected dates include dates the host has blocked';
  END IF;

  IF NOT public.check_package_availability(package_id_param, check_in_param, check_out_param) THEN
    RAISE EXCEPTION 'Package not available for selected dates';
  END IF;

  pkg_base_price := pkg_info.base_price_per_night;

  IF pkg_base_price IS NULL OR pkg_base_price = 0 THEN
    RAISE EXCEPTION 'Package has no base price set';
  END IF;

  total := pkg_base_price * nights;
  expires_time := NOW() + interval '10 minutes';

  INSERT INTO public.package_bookings (
    package_id,
    traveler_id,
    check_in_date,
    check_out_date,
    guest_count,
    number_of_nights,
    price_per_night,
    total_price,
    status,
    payment_status,
    payment_collection_mode,
    deposit_required,
    deposit_percentage,
    upfront_amount,
    remaining_amount,
    amount_paid_online,
    amount_due_to_operator,
    payment_policy_text,
    expires_at,
    booking_date
  ) VALUES (
    package_id_param,
    traveler_id_param,
    check_in_param,
    check_out_param,
    guest_count_param,
    nights,
    pkg_base_price,
    total,
    'pending',
    'unpaid',
    'full_online',
    FALSE,
    0,
    total,
    0,
    0,
    0,
    'Full amount is charged online at the time of booking confirmation.',
    expires_time,
    NOW()
  )
  RETURNING id INTO booking_id;

  RETURN booking_id;
END;
$$;


-- CREATE OR REPLACE preserves existing grants; re-issued so this migration stands alone if the
-- functions are ever rebuilt from it.
GRANT EXECUTE ON FUNCTION public.check_package_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_package_booking_atomic(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT)
  TO authenticated, service_role;

COMMIT;


-- ---------------------------------------------------------------------
-- VERIFY (read-only).
--
-- 1. The column and its bound exist. Expect one row, then one row.
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'blackout_dates';
--
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.packages'::regclass AND conname = 'packages_blackout_dates_bounded';
--
-- 2. The predicate is half-open on the right. Expect t, f — a blackout on the check-in date
--    blocks; the same date used as check-out does not.
--   SELECT public.stay_hits_blackout(ARRAY['2026-08-10']::DATE[], '2026-08-10', '2026-08-12'),
--          public.stay_hits_blackout(ARRAY['2026-08-12']::DATE[], '2026-08-10', '2026-08-12');
--
-- 3. Both entry points learned the rule. Expect 2 rows.
--   SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND p.proname IN ('check_package_availability', 'create_package_booking_atomic')
--     AND pg_get_functiondef(p.oid) LIKE '%stay_hits_blackout%';
--
-- 4. Full behavioural coverage, including the rejection itself:
--    supabase/tests/package_blackout_dates_test.sql — one DO block, safe to run anywhere. It ends
--    by RAISING on purpose so its own fixtures are always discarded; that "error" is the report,
--    and a passing run opens with "ALL 17 CHECKS PASSED".
--
-- NOTE ON EXISTING LISTINGS: every package published before this lands has blackout_dates NULL,
-- which reads as "nothing blocked" — the pre-existing behaviour, unchanged. Partners who set
-- blackout dates in the wizard before today lost them at publish and must re-enter them; there is
-- nothing to backfill from, because the values were never transmitted.
-- ---------------------------------------------------------------------
