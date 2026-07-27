-- =============================================================================
-- Package Blackout Dates Integration Tests — Plain SQL (no pgTAP required)
--
-- Covers the rule added in 20260727000001: a stay occupies the nights [check_in, check_out), so a
-- blackout on the check-in date or on any night in between blocks the booking, and a blackout on
-- the check-out date does not. The rejection checks are the point of this file — persisting
-- blackout_dates without them would leave a partner believing dates were closed while guests booked
-- straight through.
--
-- ── WHY THIS IS ONE STATEMENT, AND NOT THE USUAL BEGIN/TEMP TABLE/ROLLBACK SHAPE ────────────────
-- The other files in this directory open a transaction, stash ids in a TEMP TABLE, and ROLLBACK at
-- the end. That shape only survives psql. In the Supabase Studio SQL editor the temp table is gone
-- by the next statement — the editor does not hold one session across the script — and it fails
-- with: relation "_..._ids" does not exist.
--
-- The deeper problem is that if the editor is not holding the session, it is not holding the
-- TRANSACTION either, so the trailing ROLLBACK cannot be relied on to undo the fixtures. On a
-- production database that means test users and packages committed for real.
--
-- So everything below is a single DO block: one statement, impossible to split across connections,
-- with all state in local variables. It ends by RAISING deliberately, which unwinds the block's own
-- work no matter how the surrounding tool manages transactions. NOTHING IS EVER WRITTEN — the
-- error at the end is the success path, and its message is the report.
--
-- Run in the Supabase Studio SQL editor, or via psql. Expect an error that begins
--   === PACKAGE BLACKOUT DATES: ALL 17 CHECKS PASSED ===
-- Any FAIL line in that report is a real failure.
-- =============================================================================

DO $$
DECLARE
  v_owner       UUID;
  v_traveler    UUID;
  v_pkg_blocked UUID := gen_random_uuid();
  v_pkg_open    UUID := gen_random_uuid();

  v_report TEXT := '';
  v_failed INT  := 0;
  v_total  INT  := 0;

  v_ok       BOOLEAN;
  v_booking  UUID;
  v_msg      TEXT;
BEGIN
  -- ───────────────────────────────────────────────────────────────────────────
  -- Preconditions, so a migration that has not been applied yet says so plainly instead of
  -- surfacing as "function stay_hits_blackout(...) does not exist" halfway down.
  -- ───────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'blackout_dates'
  ) THEN
    RAISE EXCEPTION 'Cannot run: packages.blackout_dates is missing. Apply migration 20260727000001_package_blackout_dates.sql first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'stay_hits_blackout'
  ) THEN
    RAISE EXCEPTION 'Cannot run: public.stay_hits_blackout() is missing. Apply migration 20260727000001_package_blackout_dates.sql first.';
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- Borrow existing identities rather than minting them. packages.owner_id references
  -- auth.users and package_bookings.traveler_id references public.users, and creating rows in
  -- either means tracking their NOT NULL surface across Supabase versions for no benefit — every
  -- database this runs against already has users, and all of it is discarded at the end anyway.
  -- ───────────────────────────────────────────────────────────────────────────
  SELECT id INTO v_owner FROM auth.users ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Cannot run: this test borrows an existing auth.users row as the package owner, and the table is empty.';
  END IF;

  SELECT id INTO v_traveler FROM public.users ORDER BY id LIMIT 1;
  IF v_traveler IS NULL THEN
    RAISE EXCEPTION 'Cannot run: this test borrows an existing public.users row as the traveller, and the table is empty.';
  END IF;


  -- ═══════════════════════════════════════════════════════════════════════════
  -- The predicate on its own. No fixtures, no I/O — just the boundary.
  -- ═══════════════════════════════════════════════════════════════════════════

  v_ok := public.stay_hits_blackout(
    ARRAY['2027-03-10']::DATE[], '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a blackout ON the check-in date blocks the stay',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  v_ok := public.stay_hits_blackout(
    ARRAY['2027-03-11']::DATE[], '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a blackout on the last occupied night blocks the stay',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  -- The one that is easy to get backwards, and expensive: rejecting here would turn away a
  -- legitimate booking every time a partner closes the day a stay ends.
  v_ok := NOT public.stay_hits_blackout(
    ARRAY['2027-03-12']::DATE[], '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a blackout on the CHECK-OUT date does NOT block — that night is not occupied',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  v_ok := NOT public.stay_hits_blackout(
    ARRAY['2027-03-09']::DATE[], '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a blackout before check-in does not block',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  v_ok := NOT public.stay_hits_blackout(
    NULL::DATE[], '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  NULL blackout_dates reads as nothing blocked',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  v_ok := NOT public.stay_hits_blackout(
    ARRAY[]::DATE[], '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  an empty blackout array reads as nothing blocked',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;


  -- ═══════════════════════════════════════════════════════════════════════════
  -- Fixtures: two published packages, identical but for the blackouts, so every rejection below
  -- can be shown to come from the blackouts and not from the surrounding booking rules.
  -- Blackouts: 10, 15 and 20 March 2027.
  -- ═══════════════════════════════════════════════════════════════════════════

  INSERT INTO public.packages(
    id, owner_id, package_type, name, base_price_per_night, currency,
    minimum_nights, maximum_nights, max_guests, is_published, blackout_dates
  ) VALUES (
    v_pkg_blocked, v_owner, 'custom', 'Blackout Test Package', 10000, 'PKR',
    1, 30, 4, TRUE, ARRAY['2027-03-10', '2027-03-15', '2027-03-20']::DATE[]
  );

  INSERT INTO public.packages(
    id, owner_id, package_type, name, base_price_per_night, currency,
    minimum_nights, maximum_nights, max_guests, is_published, blackout_dates
  ) VALUES (
    v_pkg_open, v_owner, 'custom', 'Open Test Package', 10000, 'PKR',
    1, 30, 4, TRUE, NULL
  );


  -- ═══════════════════════════════════════════════════════════════════════════
  -- The read path: check_package_availability must report a blacked-out range as unavailable, so
  -- the details page turns the guest away before payment rather than at the booking RPC.
  -- ═══════════════════════════════════════════════════════════════════════════

  v_ok := NOT public.check_package_availability(
    v_pkg_blocked, '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  check_package_availability reports a blacked-out range as unavailable',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  v_ok := public.check_package_availability(
    v_pkg_blocked, '2027-04-05'::TIMESTAMPTZ, '2027-04-08'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a range clear of every blackout is still available',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  v_ok := public.check_package_availability(
    v_pkg_open, '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ);
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a package with NULL blackout_dates is unaffected',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;


  -- ═══════════════════════════════════════════════════════════════════════════
  -- The write path. This is the half that matters: without it the dates are stored and ignored.
  -- Each attempt runs in its own sub-block so a rejection unwinds only that attempt.
  -- ═══════════════════════════════════════════════════════════════════════════

  -- 1. Blackout ON the check-in date.
  v_ok := FALSE; v_msg := NULL;
  BEGIN
    PERFORM public.create_package_booking_atomic(
      v_pkg_blocked, v_traveler, '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ, 2);
  EXCEPTION WHEN OTHERS THEN
    v_ok := TRUE; v_msg := SQLERRM;
  END;
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a booking STARTING on a blocked date is rejected',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  -- The message must name the blackout, not the generic overlap failure — "someone else booked it"
  -- is worth retrying and a hold can expire, but a closed date never frees up.
  v_ok := COALESCE(v_msg, '') LIKE '%blocked%';
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  the rejection names the blackout (got: %s)',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END,
                                 COALESCE(v_msg, '<no error raised>'));
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  -- 2. Blackout strictly inside the stay — the case an endpoint-only check would miss.
  v_ok := FALSE;
  BEGIN
    PERFORM public.create_package_booking_atomic(
      v_pkg_blocked, v_traveler, '2027-03-14'::TIMESTAMPTZ, '2027-03-16'::TIMESTAMPTZ, 2);
  EXCEPTION WHEN OTHERS THEN
    v_ok := TRUE;
  END;
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a stay SPANNING a blocked night is rejected',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  -- 3. A stay wrapping every blackout.
  v_ok := FALSE;
  BEGIN
    PERFORM public.create_package_booking_atomic(
      v_pkg_blocked, v_traveler, '2027-03-09'::TIMESTAMPTZ, '2027-03-22'::TIMESTAMPTZ, 2);
  EXCEPTION WHEN OTHERS THEN
    v_ok := TRUE;
  END;
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a long stay covering every blocked date is rejected',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  -- 4. The control. Without it every check above would also pass if the RPC had simply stopped
  --    working — identical dates, identical guest count, only the blackouts differ.
  v_booking := NULL; v_msg := NULL;
  BEGIN
    v_booking := public.create_package_booking_atomic(
      v_pkg_open, v_traveler, '2027-03-10'::TIMESTAMPTZ, '2027-03-12'::TIMESTAMPTZ, 2);
  EXCEPTION WHEN OTHERS THEN
    v_msg := SQLERRM;
  END;
  v_ok := v_booking IS NOT NULL;
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  an unblocked package is still bookable on the same dates (%s)',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END,
                                 COALESCE(v_msg, 'booked'));
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  v_ok := EXISTS (
    SELECT 1 FROM public.package_bookings
    WHERE id = v_booking AND status = 'pending' AND number_of_nights = 2 AND total_price = 20000
  );
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  the control booking is a normal 2-night pending hold at 20000',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  -- 5. THE BOUNDARY, end to end: check out ON a blocked date. The guest leaves that morning, so the
  --    blocked night is never occupied and the booking must go through.
  v_booking := NULL; v_msg := NULL;
  BEGIN
    v_booking := public.create_package_booking_atomic(
      v_pkg_blocked, v_traveler, '2027-03-13'::TIMESTAMPTZ, '2027-03-15'::TIMESTAMPTZ, 2);
  EXCEPTION WHEN OTHERS THEN
    v_msg := SQLERRM;
  END;
  v_ok := v_booking IS NOT NULL;
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  a stay that CHECKS OUT on a blocked date is allowed (%s)',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END,
                                 COALESCE(v_msg, 'booked'));
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;

  -- 6. The bound on the array, so a runaway client cannot bloat a row read on every booking.
  v_ok := FALSE;
  BEGIN
    UPDATE public.packages
    SET blackout_dates = (
      SELECT ARRAY_AGG(d::DATE)
      FROM generate_series('2027-01-01'::DATE, '2047-01-01'::DATE, '1 day') AS d
    )
    WHERE id = v_pkg_open;
  EXCEPTION WHEN check_violation THEN
    v_ok := TRUE;
  END;
  v_total := v_total + 1;
  v_report := v_report || format(E'\n  %s  packages_blackout_dates_bounded caps the array',
                                 CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END);
  IF NOT v_ok THEN v_failed := v_failed + 1; END IF;


  -- ═══════════════════════════════════════════════════════════════════════════
  -- Report and unwind. The RAISE is deliberate and is the ONLY exit: it discards both fixture
  -- packages and every booking made above, whatever the caller does with transactions.
  -- ═══════════════════════════════════════════════════════════════════════════

  IF v_failed > 0 THEN
    RAISE EXCEPTION E'\n=== PACKAGE BLACKOUT DATES: % of % CHECKS FAILED ===\n%\n\n(Nothing was written — this rollback is deliberate.)',
      v_failed, v_total, v_report;
  ELSE
    RAISE EXCEPTION E'\n=== PACKAGE BLACKOUT DATES: ALL % CHECKS PASSED ===\n%\n\n(Nothing was written — this rollback is deliberate. This "error" IS the success result.)',
      v_total, v_report;
  END IF;
END $$;
