BEGIN;

ALTER TABLE public.operator_booking_finance_snapshots
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refund_timestamp TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.sync_operator_booking_finance_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_user_id UUID;
  v_tier_code public.membership_tier_code_enum := 'gold'::public.membership_tier_code_enum;
  v_membership_status public.membership_status_enum := 'active'::public.membership_status_enum;
  v_commission_rate NUMERIC(5,2) := 20;
  v_booking_total NUMERIC(12,2);
  v_payment_collected NUMERIC(12,2);
  v_refund_amount NUMERIC(12,2) := 0;
  v_commission_amount NUMERIC(12,2);
  v_commission_total NUMERIC(12,2);
  v_commission_collected NUMERIC(12,2);
  v_commission_remaining NUMERIC(12,2);
  v_operator_receivable NUMERIC(12,2);
  v_settlement_state public.settlement_state_enum;
  v_payout_status public.payout_status_enum;
  v_schedule_end TIMESTAMPTZ;
  v_payout_available_at TIMESTAMPTZ;
  v_hold BOOLEAN := FALSE;
  v_deposit_required BOOLEAN := FALSE;
  v_deposit_percentage INTEGER := 0;
  v_deposit_upfront_amount NUMERIC(12,2) := 0;
  v_deposit_remaining_amount NUMERIC(12,2) := 0;
  v_refund_reason TEXT;
  v_refund_timestamp TIMESTAMPTZ;
  v_refund_timestamp_raw TEXT;
BEGIN
  SELECT tour.operator_id, schedule.end_time
  INTO v_operator_user_id, v_schedule_end
  FROM public.tours AS tour
  LEFT JOIN public.tour_schedules AS schedule
    ON schedule.id = NEW.schedule_id
  WHERE tour.id = NEW.tour_id;

  IF v_operator_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.provision_operator_commercial_profile(v_operator_user_id);

  SELECT profile.membership_tier_code, profile.membership_status, profile.commission_rate, profile.payout_hold
  INTO v_tier_code, v_membership_status, v_commission_rate, v_hold
  FROM public.operator_commercial_profiles AS profile
  WHERE profile.operator_user_id = v_operator_user_id;

  v_booking_total := ROUND(COALESCE(NEW.total_price, 0)::NUMERIC, 2);
  v_deposit_required := COALESCE(NEW.deposit_required, FALSE);
  v_deposit_percentage := CASE
    WHEN v_deposit_required
      THEN GREATEST(0, LEAST(50, ROUND(COALESCE(NEW.deposit_percentage, 0))::INTEGER))
    ELSE 0
  END;
  v_deposit_upfront_amount := ROUND(
    GREATEST(
      0,
      COALESCE(
        NEW.upfront_amount,
        NEW.amount_paid_online,
        CASE
          WHEN v_deposit_required THEN COALESCE(NEW.total_price, 0) * v_deposit_percentage / 100.0
          ELSE COALESCE(NEW.total_price, 0)
        END,
        0
      )::NUMERIC
    ),
    2
  );
  v_deposit_remaining_amount := ROUND(
    GREATEST(0, COALESCE(NEW.remaining_amount, GREATEST(v_booking_total - v_deposit_upfront_amount, 0), 0)::NUMERIC),
    2
  );
  v_payment_collected := ROUND(
    CASE
      WHEN COALESCE(NEW.payment_status, 'unpaid') IN ('paid', 'balance_pending', 'partially_paid', 'refunded', 'partially_refunded')
        THEN COALESCE(NEW.amount_paid_online, v_deposit_upfront_amount, NEW.total_price, 0)::NUMERIC
      ELSE 0::NUMERIC
    END,
    2
  );

  v_refund_amount := CASE
    WHEN COALESCE(NEW.metadata->>'refund_amount', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN ROUND((NEW.metadata->>'refund_amount')::NUMERIC, 2)
    WHEN COALESCE(NEW.payment_status, '') = 'refunded'
      THEN v_payment_collected
    ELSE 0::NUMERIC
  END;

  IF COALESCE(NEW.payment_status, '') = 'partially_refunded' AND v_refund_amount = 0 THEN
    v_refund_amount := ROUND(
      LEAST(
        v_payment_collected,
        GREATEST(COALESCE(NEW.amount_paid_online, v_deposit_upfront_amount, 0)::NUMERIC - COALESCE(NEW.amount_due_to_operator, 0)::NUMERIC, 0)
      ),
      2
    );
  END IF;

  v_refund_amount := ROUND(LEAST(v_payment_collected, GREATEST(v_refund_amount, 0)), 2);
  v_refund_reason := NULLIF(BTRIM(COALESCE(NEW.metadata->>'refund_reason', '')), '');
  v_refund_timestamp_raw := NULLIF(COALESCE(NEW.metadata->>'refund_timestamp', NEW.metadata->>'refunded_at', ''), '');

  BEGIN
    v_refund_timestamp := v_refund_timestamp_raw::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    v_refund_timestamp := NULL;
  END;

  IF v_refund_timestamp IS NULL AND COALESCE(NEW.payment_status, '') IN ('refunded', 'partially_refunded') THEN
    v_refund_timestamp := TIMEZONE('UTC', NOW());
  END IF;

  v_settlement_state := CASE
    WHEN NEW.status = 'pending' THEN 'pending_payment'::public.settlement_state_enum
    WHEN NEW.status = 'confirmed' AND COALESCE(NEW.payment_status, 'unpaid') IN ('paid', 'balance_pending', 'partially_paid') THEN 'paid_pending_service'::public.settlement_state_enum
    WHEN NEW.status = 'completed' AND COALESCE(NEW.payment_status, '') IN ('refunded', 'partially_refunded') THEN 'refunded'::public.settlement_state_enum
    WHEN NEW.status = 'completed' AND v_hold THEN 'payout_on_hold'::public.settlement_state_enum
    WHEN NEW.status = 'completed' THEN 'eligible_for_payout'::public.settlement_state_enum
    WHEN NEW.status = 'cancelled' AND COALESCE(NEW.payment_status, '') IN ('refunded', 'partially_refunded') THEN 'refunded'::public.settlement_state_enum
    WHEN NEW.status = 'cancelled' THEN 'cancelled_by_operator'::public.settlement_state_enum
    ELSE 'draft'::public.settlement_state_enum
  END;

  v_payout_status := CASE
    WHEN COALESCE(NEW.payment_status, '') IN ('refunded', 'partially_refunded') THEN 'not_ready'::public.payout_status_enum
    WHEN v_hold THEN 'on_hold'::public.payout_status_enum
    WHEN NEW.status = 'completed' THEN 'eligible'::public.payout_status_enum
    ELSE 'not_ready'::public.payout_status_enum
  END;

  v_payout_available_at := CASE
    WHEN NEW.status = 'completed' AND COALESCE(NEW.payment_status, '') NOT IN ('refunded', 'partially_refunded')
      THEN public.commercial_next_business_day(COALESCE(v_schedule_end, TIMEZONE('UTC', NOW())))
    ELSE NULL
  END;

  SELECT commission_total, commission_collected, commission_remaining
  INTO v_commission_total, v_commission_collected, v_commission_remaining
  FROM public.calculate_commission_collection_amounts(
    v_booking_total,
    v_payment_collected,
    v_refund_amount,
    v_commission_rate
  );

  IF NEW.status = 'cancelled' AND COALESCE(NEW.payment_status, '') IN ('refunded', 'partially_refunded') THEN
    v_commission_total := ROUND(LEAST(v_commission_total, GREATEST(v_payment_collected - v_refund_amount, 0)), 2);
    v_commission_collected := v_commission_total;
    v_commission_remaining := 0;
    v_operator_receivable := 0;
  ELSE
    v_operator_receivable := GREATEST(0, ROUND(v_booking_total - v_commission_total - v_refund_amount, 2));
  END IF;

  v_commission_amount := v_commission_total;

  INSERT INTO public.operator_booking_finance_snapshots (
    booking_id,
    operator_user_id,
    traveler_id,
    membership_tier_code,
    membership_status,
    booking_total,
    payment_collected,
    refund_amount,
    refund_reason,
    refund_timestamp,
    deposit_required,
    deposit_percentage,
    deposit_upfront_amount,
    deposit_remaining_amount,
    commission_rate,
    commission_amount,
    commission_total,
    commission_collected,
    commission_remaining,
    operator_receivable_estimate,
    settlement_state,
    payout_status,
    payout_available_at,
    notes,
    updated_at
  )
  VALUES (
    NEW.id,
    v_operator_user_id,
    NEW.traveler_id,
    v_tier_code,
    v_membership_status,
    v_booking_total,
    v_payment_collected,
    v_refund_amount,
    v_refund_reason,
    v_refund_timestamp,
    v_deposit_required,
    v_deposit_percentage,
    v_deposit_upfront_amount,
    v_deposit_remaining_amount,
    v_commission_rate,
    v_commission_amount,
    v_commission_total,
    v_commission_collected,
    v_commission_remaining,
    v_operator_receivable,
    v_settlement_state,
    v_payout_status,
    v_payout_available_at,
    jsonb_build_object(
      'tour_id', NEW.tour_id,
      'schedule_id', NEW.schedule_id,
      'payment_status', NEW.payment_status,
      'booking_status', NEW.status,
      'refund_reason', v_refund_reason,
      'refund_timestamp', v_refund_timestamp
    ),
    TIMEZONE('UTC', NOW())
  )
  ON CONFLICT (booking_id) DO UPDATE SET
    operator_user_id = EXCLUDED.operator_user_id,
    traveler_id = EXCLUDED.traveler_id,
    membership_tier_code = EXCLUDED.membership_tier_code,
    membership_status = EXCLUDED.membership_status,
    booking_total = EXCLUDED.booking_total,
    payment_collected = EXCLUDED.payment_collected,
    refund_amount = EXCLUDED.refund_amount,
    refund_reason = EXCLUDED.refund_reason,
    refund_timestamp = EXCLUDED.refund_timestamp,
    deposit_required = EXCLUDED.deposit_required,
    deposit_percentage = EXCLUDED.deposit_percentage,
    deposit_upfront_amount = EXCLUDED.deposit_upfront_amount,
    deposit_remaining_amount = EXCLUDED.deposit_remaining_amount,
    commission_rate = EXCLUDED.commission_rate,
    commission_amount = EXCLUDED.commission_amount,
    commission_total = EXCLUDED.commission_total,
    commission_collected = EXCLUDED.commission_collected,
    commission_remaining = EXCLUDED.commission_remaining,
    operator_receivable_estimate = EXCLUDED.operator_receivable_estimate,
    settlement_state = EXCLUDED.settlement_state,
    payout_status = EXCLUDED.payout_status,
    payout_available_at = EXCLUDED.payout_available_at,
    notes = EXCLUDED.notes,
    updated_at = TIMEZONE('UTC', NOW());

  INSERT INTO public.operator_commission_ledger (
    operator_user_id,
    booking_id,
    entry_type,
    membership_tier_code,
    booking_total,
    commission_rate,
    commission_amount,
    commission_total,
    commission_collected,
    commission_remaining,
    operator_receivable_estimate,
    settlement_state,
    payout_status,
    recognized_at,
    available_for_payout_at,
    updated_at
  )
  VALUES (
    v_operator_user_id,
    NEW.id,
    'commission_snapshot'::public.ledger_entry_type_enum,
    v_tier_code,
    v_booking_total,
    v_commission_rate,
    v_commission_amount,
    v_commission_total,
    v_commission_collected,
    v_commission_remaining,
    v_operator_receivable,
    v_settlement_state,
    v_payout_status,
    TIMEZONE('UTC', NOW()),
    v_payout_available_at,
    TIMEZONE('UTC', NOW())
  )
  ON CONFLICT (booking_id) DO UPDATE SET
    operator_user_id = EXCLUDED.operator_user_id,
    membership_tier_code = EXCLUDED.membership_tier_code,
    booking_total = EXCLUDED.booking_total,
    commission_rate = EXCLUDED.commission_rate,
    commission_amount = EXCLUDED.commission_amount,
    commission_total = EXCLUDED.commission_total,
    commission_collected = EXCLUDED.commission_collected,
    commission_remaining = EXCLUDED.commission_remaining,
    operator_receivable_estimate = EXCLUDED.operator_receivable_estimate,
    settlement_state = EXCLUDED.settlement_state,
    payout_status = EXCLUDED.payout_status,
    available_for_payout_at = EXCLUDED.available_for_payout_at,
    updated_at = TIMEZONE('UTC', NOW());

  INSERT INTO public.operator_payout_items (
    booking_id,
    operator_user_id,
    gross_amount,
    commission_amount,
    refund_amount,
    operator_payable_amount,
    payout_status,
    payout_due_at,
    hold_reason,
    recovery_amount,
    updated_at
  )
  VALUES (
    NEW.id,
    v_operator_user_id,
    v_booking_total,
    v_commission_amount,
    v_refund_amount,
    v_operator_receivable,
    v_payout_status,
    v_payout_available_at,
    CASE WHEN v_hold THEN COALESCE((SELECT payout_hold_reason FROM public.operator_commercial_profiles WHERE operator_user_id = v_operator_user_id), 'Manual operator payout hold') ELSE NULL END,
    0,
    TIMEZONE('UTC', NOW())
  )
  ON CONFLICT (booking_id) DO UPDATE SET
    operator_user_id = EXCLUDED.operator_user_id,
    gross_amount = EXCLUDED.gross_amount,
    commission_amount = EXCLUDED.commission_amount,
    refund_amount = EXCLUDED.refund_amount,
    operator_payable_amount = EXCLUDED.operator_payable_amount,
    payout_status = EXCLUDED.payout_status,
    payout_due_at = EXCLUDED.payout_due_at,
    hold_reason = EXCLUDED.hold_reason,
    recovery_amount = EXCLUDED.recovery_amount,
    updated_at = TIMEZONE('UTC', NOW());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tour_bookings_sync_operator_finance_snapshot ON public.tour_bookings;
CREATE TRIGGER tour_bookings_sync_operator_finance_snapshot
AFTER INSERT OR UPDATE OF status, payment_status, total_price, amount_paid_online, upfront_amount, remaining_amount, metadata ON public.tour_bookings
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_booking_finance_snapshot();

DROP TRIGGER IF EXISTS zz_tour_bookings_sync_operator_payout_eligibility ON public.tour_bookings;
CREATE TRIGGER zz_tour_bookings_sync_operator_payout_eligibility
AFTER INSERT OR UPDATE OF status, payment_status, stripe_payment_intent_id, amount_paid_online, upfront_amount, remaining_amount, metadata ON public.tour_bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_tour_booking_payout_eligibility_refresh();

UPDATE public.tour_bookings
SET metadata = COALESCE(metadata, '{}'::JSONB)
WHERE payment_status IN ('refunded', 'partially_refunded');

UPDATE public.tour_bookings AS booking
SET metadata = COALESCE(booking.metadata, '{}'::JSONB) || jsonb_build_object(
  'refund_amount', CASE
    WHEN booking.payment_status = 'refunded' THEN COALESCE(booking.amount_paid_online, booking.upfront_amount, booking.total_price, 0)
    ELSE COALESCE(snapshot.refund_amount, 0)
  END,
  'refund_reason', COALESCE(snapshot.refund_reason, booking.metadata->>'refund_reason'),
  'refund_timestamp', COALESCE(snapshot.refund_timestamp, TIMEZONE('UTC', NOW()))
)
FROM public.operator_booking_finance_snapshots AS snapshot
WHERE snapshot.booking_id = booking.id
  AND booking.payment_status IN ('refunded', 'partially_refunded');

COMMIT;