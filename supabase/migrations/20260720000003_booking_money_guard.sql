-- =====================================================================
-- SECURITY (PAYMENTS): stop a traveller editing the amount they will be charged.
--
-- THE LIVE ATTACK, entirely within existing RLS:
--   1. Traveller creates a real booking (say 2000).
--   2. While status='pending', they PATCH upfront_amount to 0.50. RLS permits it —
--      package_bookings: "Travelers can update own package bookings" FOR UPDATE
--        USING (auth.uid() = traveler_id)   -- 20260210000008:46, NO WITH CHECK, NO status predicate
--      tour_bookings:   USING (auth.uid() = traveler_id AND status = 'pending')  -- 20260210000010:128
--      ...and `authenticated` holds table-level UPDATE (20260204215500:3), so every column is reachable.
--   3. stripe-create-payment-intent/index.ts:115 does
--        const chargeAmount = Number(booking.upfront_amount ?? booking.total_price);
--      i.e. it reads the charge amount OUT OF THE ROW THE TRAVELLER JUST EDITED, and charges it.
--   4. stripe-verify-payment-intent/index.ts:100 recomputes its expected amount from THE SAME ROW,
--      so the verification compares the forgery against itself and passes.
--   5. The Stripe webhook then legitimately marks the booking paid + confirmed.
--
-- The traveller ends up holding a genuine, webhook-attested, fully-confirmed booking for 50 cents.
-- NOTE no forged column survives into the final state — which is why this defeats any
-- payment_status pin, and why a "paid with no stripe_payment_intent_id" search finds nothing.
-- There IS a valid payment intent. It is just for pennies.
--
-- SECOND VECTOR, SAME COLUMNS — PAYOUT INFLATION. 20260315000021:648-658 computes booking_total,
-- commission_amount and operator_receivable_estimate straight from NEW.total_price with no
-- cross-check against the actual Stripe charge, and 20260315000023:263-273 sums that estimate into
-- the payout-ready balance. A traveller raising total_price on their own row inflates the
-- operator's receivable and can push them over the payout threshold. Traveller + operator, no admin
-- required. The recompute trigger fires on UPDATE OF total_price (20260315000021:823), so it lands
-- immediately.
--
-- WHY THIS IS A PIN AND NOT A REVOKE: the usual reason — 20260204215500:3 grants ALL ON ALL TABLES
-- to authenticated and nothing revokes it, so column-level REVOKEs are silent no-ops here too.
-- Same BEFORE-trigger shape as 20260720000001.
--
-- *** WHAT IS DELIBERATELY NOT PINNED, AND WHY IT MATTERS ***
-- The web checkout CONFIRMS PAYMENT FROM THE BROWSER, AS THE TRAVELLER:
-- paymentSuccessHandler.ts:106/182 -> bookingService.ts:483-489 (tour) / :690-695 (package) issue a
-- plain PostgREST .update() on the user's JWT, setting payment_status, paid_at,
-- stripe_payment_intent_id, payment_method, amount_paid_online, amount_due_to_operator, then
-- status='confirmed'. Those reach the database as current_user='authenticated'.
-- PINNING ANY OF THEM SILENTLY BREAKS CHECKOUT — the traveller pays and the booking never confirms.
-- So they are excluded, and closing that half needs the confirmation moved server-side (see below).
-- Verified: no client path UPDATEs total_price / upfront_amount / remaining_amount. They are written
-- only at booking creation (bookingService.ts:413,420-421 for the tour INSERT).
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.booking_money_guard()
RETURNS trigger
LANGUAGE plpgsql
-- INVOKER so current_user is the REAL executing role. A SECURITY DEFINER function would read its
-- own owner and the discriminator below would always pass, making this a no-op.
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- service_role (Stripe webhook, worker) and postgres (SECURITY DEFINER RPCs such as
  -- create_package_booking_atomic) are exempt — they are the legitimate authors.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NOT NULL THEN
    IF public.is_admin(v_uid) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- UPDATE only. The INSERT arm is deliberately absent: package_bookings is created through
  -- create_package_booking_atomic (SECURITY DEFINER, exempt above), and for tour_bookings the price
  -- is genuinely computed client-side at creation today — a BEFORE INSERT trigger has no
  -- server-side price to substitute, so pinning there would break tour booking outright. That gap
  -- is closed in the edge function, not here. See the note at the bottom.
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- ── the money, on both tables ────────────────────────────────────────────
  -- These three are the charge amount and its split. Creation-only by design; no client path
  -- updates them. This is the pin that closes the deflation attack.
  NEW.total_price      := OLD.total_price;
  NEW.upfront_amount   := OLD.upfront_amount;
  NEW.remaining_amount := OLD.remaining_amount;

  -- The deposit machinery that decides how the total is split between the online charge and the
  -- cash owed to the operator. Set once at creation from the operator's own configuration
  -- (20260315000019 adds all four to BOTH tables; verified). Not written by checkout — the
  -- confirmation writes amount_paid_online / amount_due_to_operator, which stay editable.
  NEW.payment_collection_mode := OLD.payment_collection_mode;
  NEW.deposit_required        := OLD.deposit_required;
  NEW.deposit_percentage      := OLD.deposit_percentage;
  -- The payment terms shown to the traveller and quoted back in a dispute — rewritable evidence.
  NEW.payment_policy_text     := OLD.payment_policy_text;

  -- Stripe dispute/chargeback state — booking_has_open_stripe_dispute() reads it verbatim, so a
  -- traveller who could rewrite it could erase evidence of their own chargeback.
  NEW.payment_metadata := OLD.payment_metadata;

  -- Carries the cancellation / completion governance state machine, not free-form data.
  NEW.metadata         := OLD.metadata;

  -- The booking hold. Left editable, a traveller can extend it indefinitely and squat inventory.
  NEW.expires_at       := OLD.expires_at;

  -- package_bookings' UPDATE policy has no WITH CHECK, so without this a traveller can reassign
  -- the booking to another user. Pinned on both tables for symmetry.
  NEW.traveler_id      := OLD.traveler_id;
  NEW.id               := OLD.id;

  -- ── per-table price basis ────────────────────────────────────────────────
  IF TG_TABLE_NAME = 'tour_bookings' THEN
    -- pax_count is both seat accounting and the price basis: inflating it after the price is
    -- locked yields extra seats for free and oversells the departure.
    NEW.pax_count    := OLD.pax_count;
    -- Repointing these moves a paid seat onto a different departure or product — and changes which
    -- operator gets paid.
    NEW.schedule_id  := OLD.schedule_id;
    NEW.tour_id      := OLD.tour_id;
  ELSIF TG_TABLE_NAME = 'package_bookings' THEN
    NEW.package_id       := OLD.package_id;
    NEW.price_per_night  := OLD.price_per_night;
    NEW.number_of_nights := OLD.number_of_nights;
    NEW.guest_count      := OLD.guest_count;
  END IF;

  RETURN NEW;
END;
$$;

-- No `UPDATE OF <col>` clause: a column-scoped trigger does not fire when the column is absent from
-- the SET list, which is exactly how a PATCH would slip past it.
DROP TRIGGER IF EXISTS tour_bookings_money_guard ON public.tour_bookings;
CREATE TRIGGER tour_bookings_money_guard
  BEFORE UPDATE ON public.tour_bookings
  FOR EACH ROW EXECUTE FUNCTION public.booking_money_guard();

DROP TRIGGER IF EXISTS package_bookings_money_guard ON public.package_bookings;
CREATE TRIGGER package_bookings_money_guard
  BEFORE UPDATE ON public.package_bookings
  FOR EACH ROW EXECUTE FUNCTION public.booking_money_guard();

REVOKE ALL ON FUNCTION public.booking_money_guard() FROM PUBLIC;

COMMIT;


-- ---------------------------------------------------------------------
-- VERIFY (read-only). Expect 2 rows.
--   SELECT c.relname, t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
--   WHERE t.tgname LIKE '%_money_guard' AND NOT t.tgisinternal ORDER BY c.relname;
--
-- THEN SMOKE-TEST CHECKOUT END TO END — book something and pay for it. The pinned columns are all
-- creation-only, but this is the payment path and a silent regression here costs revenue.
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- ⚠️ WHAT THIS DOES **NOT** CLOSE — two gaps, both needing code, not SQL.
--
-- 1. THE TOUR BOOKING *CREATION* PRICE. tour_bookings rows are INSERTed straight from the browser
--    with a client-computed total_price (bookingService.ts:407-436, mobile payments.ts:105). This
--    guard only pins UPDATEs, so a traveller can still simply CREATE the booking at 1.00 and pay
--    that. package_bookings is fully protected (its INSERT goes through
--    create_package_booking_atomic, 20260326000013:34); tour_bookings is only half protected.
--    THE REAL FIX, and it closes both the UPDATE and INSERT variants at once:
--    stripe-create-payment-intent/index.ts:115 must stop trusting the row. It ALREADY loads the
--    tour/package at :127-148 (for currency only) — it should also read the listing price there and
--    derive or validate the charge from it, rejecting a booking whose amount does not reconcile.
--    Until that lands, this migration narrows the window rather than shutting it.
--
-- 2. THE SIX CHECKOUT COLUMNS stay traveller-writable (payment_status, paid_at,
--    stripe_payment_intent_id, payment_method, amount_paid_online, amount_due_to_operator, plus
--    status), because the browser confirms payment. A traveller can still self-mark a booking
--    paid+confirmed without paying and present a voucher. Bounded — no money moves to them, and the
--    operator payout reads total_price which is now pinned — but real. Closing it means moving
--    confirmation server-side: have the Stripe webhook be the only writer, and make the success page
--    poll rather than write.
--
-- DETECTION for gap 1 (read-only) — paid bookings charged a trivial fraction of their own total.
-- NULLIF because upfront_amount DEFAULTs to 0, which means "no deposit, charge the full price".
--   SELECT 'package' AS src, id, traveler_id, total_price, upfront_amount,
--          amount_paid_online, payment_status, status, booking_date
--   FROM public.package_bookings
--   WHERE payment_status = 'paid'
--     AND COALESCE(NULLIF(upfront_amount, 0), total_price) < GREATEST(total_price * 0.10, 5)
--   UNION ALL
--   SELECT 'tour', id, traveler_id, total_price, upfront_amount,
--          amount_paid_online, payment_status, status, booking_date
--   FROM public.tour_bookings
--   WHERE payment_status = 'paid'
--     AND COALESCE(NULLIF(upfront_amount, 0), total_price) < GREATEST(total_price * 0.10, 5)
--   ORDER BY booking_date DESC NULLS LAST;
-- ---------------------------------------------------------------------
