BEGIN;

ALTER TABLE public.commercial_membership_tiers
  ADD COLUMN IF NOT EXISTS minimum_deposit_percent INTEGER;

UPDATE public.commercial_membership_tiers
SET minimum_deposit_percent = CASE code
  WHEN 'gold'::public.membership_tier_code_enum THEN 20
  WHEN 'diamond'::public.membership_tier_code_enum THEN 15
  WHEN 'platinum'::public.membership_tier_code_enum THEN 10
  ELSE GREATEST(CEIL(commission_rate)::INTEGER, 0)
END;

ALTER TABLE public.commercial_membership_tiers
  ALTER COLUMN minimum_deposit_percent SET NOT NULL,
  ALTER COLUMN minimum_deposit_percent SET DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'commercial_membership_tiers_minimum_deposit_range'
  ) THEN
    ALTER TABLE public.commercial_membership_tiers
      ADD CONSTRAINT commercial_membership_tiers_minimum_deposit_range
      CHECK (minimum_deposit_percent >= 0 AND minimum_deposit_percent <= 50);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'commercial_membership_tiers_minimum_deposit_covers_commission'
  ) THEN
    ALTER TABLE public.commercial_membership_tiers
      ADD CONSTRAINT commercial_membership_tiers_minimum_deposit_covers_commission
      CHECK (minimum_deposit_percent >= CEIL(commission_rate));
  END IF;
END
$$;

ALTER TABLE public.operator_booking_finance_snapshots
  ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_upfront_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit_upfront_amount >= 0),
  ADD COLUMN IF NOT EXISTS deposit_remaining_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit_remaining_amount >= 0);

UPDATE public.operator_booking_finance_snapshots AS snapshot
SET
  deposit_required = COALESCE(booking.deposit_required, FALSE),
  deposit_percentage = CASE
    WHEN COALESCE(booking.deposit_required, FALSE)
      THEN GREATEST(0, LEAST(50, ROUND(COALESCE(booking.deposit_percentage, 0))::INTEGER))
    ELSE 0
  END,
  deposit_upfront_amount = ROUND(
    GREATEST(
      0,
      COALESCE(booking.upfront_amount, booking.amount_paid_online, booking.total_price, 0)::NUMERIC
    ),
    2
  ),
  deposit_remaining_amount = ROUND(
    GREATEST(0, COALESCE(booking.remaining_amount, 0)::NUMERIC),
    2
  )
FROM public.tour_bookings AS booking
WHERE booking.id = snapshot.booking_id;

CREATE OR REPLACE FUNCTION public.enforce_operator_minimum_deposit_policy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_require_deposit BOOLEAN := FALSE;
  v_deposit_percentage INTEGER := 0;
  v_tier_code public.membership_tier_code_enum := 'gold'::public.membership_tier_code_enum;
  v_minimum_deposit_percent INTEGER := 0;
BEGIN
  IF NEW.operator_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_require_deposit := COALESCE(NEW.require_deposit, NEW.deposit_required, FALSE);
  v_deposit_percentage := GREATEST(0, LEAST(50, ROUND(COALESCE(NEW.deposit_percentage, 0))::INTEGER));

  IF NOT v_require_deposit THEN
    RETURN NEW;
  END IF;

  PERFORM public.provision_operator_commercial_profile(NEW.operator_id);

  SELECT profile.membership_tier_code, tier.minimum_deposit_percent
  INTO v_tier_code, v_minimum_deposit_percent
  FROM public.operator_commercial_profiles AS profile
  INNER JOIN public.commercial_membership_tiers AS tier
    ON tier.code = profile.membership_tier_code
  WHERE profile.operator_user_id = NEW.operator_id;

  IF v_deposit_percentage < COALESCE(v_minimum_deposit_percent, 0) THEN
    RAISE EXCEPTION USING
      MESSAGE = 'MINIMUM_DEPOSIT_NOT_MET',
      DETAIL = FORMAT(
        '%s membership requires at least %s%% deposit. Received %s%%.',
        INITCAP(v_tier_code::TEXT),
        v_minimum_deposit_percent,
        v_deposit_percentage
      ),
      HINT = 'Increase the deposit percentage or upgrade to a membership tier with a lower minimum deposit requirement.',
      ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tours_enforce_operator_minimum_deposit_policy ON public.tours;
CREATE TRIGGER tours_enforce_operator_minimum_deposit_policy
BEFORE INSERT OR UPDATE OF operator_id, require_deposit, deposit_required, deposit_percentage ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.enforce_operator_minimum_deposit_policy();

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
      WHEN COALESCE(NEW.payment_status, 'unpaid') IN ('paid', 'balance_pending', 'partially_paid')
        THEN COALESCE(NEW.amount_paid_online, v_deposit_upfront_amount, NEW.total_price, 0)::NUMERIC
      ELSE 0::NUMERIC
    END,
    2
  );
  v_commission_amount := ROUND(v_booking_total * COALESCE(v_commission_rate, 0) / 100.0, 2);
  v_operator_receivable := GREATEST(0, ROUND(v_booking_total - v_commission_amount - v_refund_amount, 2));

  v_settlement_state := CASE
    WHEN NEW.status = 'pending' THEN 'pending_payment'::public.settlement_state_enum
    WHEN NEW.status = 'confirmed' AND COALESCE(NEW.payment_status, 'unpaid') IN ('paid', 'balance_pending', 'partially_paid') THEN 'paid_pending_service'::public.settlement_state_enum
    WHEN NEW.status = 'completed' AND v_hold THEN 'payout_on_hold'::public.settlement_state_enum
    WHEN NEW.status = 'completed' THEN 'eligible_for_payout'::public.settlement_state_enum
    WHEN NEW.status = 'cancelled' AND COALESCE(NEW.payment_status, '') IN ('refunded', 'partially_refunded') THEN 'refunded'::public.settlement_state_enum
    WHEN NEW.status = 'cancelled' THEN 'cancelled_by_operator'::public.settlement_state_enum
    ELSE 'draft'::public.settlement_state_enum
  END;

  v_payout_status := CASE
    WHEN v_hold THEN 'on_hold'::public.payout_status_enum
    WHEN NEW.status = 'completed' THEN 'eligible'::public.payout_status_enum
    ELSE 'not_ready'::public.payout_status_enum
  END;

  v_payout_available_at := CASE
    WHEN NEW.status = 'completed' THEN public.commercial_next_business_day(COALESCE(v_schedule_end, TIMEZONE('UTC', NOW())))
    ELSE NULL
  END;

  INSERT INTO public.operator_booking_finance_snapshots (
    booking_id,
    operator_user_id,
    traveler_id,
    membership_tier_code,
    membership_status,
    booking_total,
    payment_collected,
    refund_amount,
    deposit_required,
    deposit_percentage,
    deposit_upfront_amount,
    deposit_remaining_amount,
    commission_rate,
    commission_amount,
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
    v_deposit_required,
    v_deposit_percentage,
    v_deposit_upfront_amount,
    v_deposit_remaining_amount,
    v_commission_rate,
    v_commission_amount,
    v_operator_receivable,
    v_settlement_state,
    v_payout_status,
    v_payout_available_at,
    jsonb_build_object(
      'tour_id', NEW.tour_id,
      'schedule_id', NEW.schedule_id,
      'payment_status', NEW.payment_status,
      'booking_status', NEW.status
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
    deposit_required = EXCLUDED.deposit_required,
    deposit_percentage = EXCLUDED.deposit_percentage,
    deposit_upfront_amount = EXCLUDED.deposit_upfront_amount,
    deposit_remaining_amount = EXCLUDED.deposit_remaining_amount,
    commission_rate = EXCLUDED.commission_rate,
    commission_amount = EXCLUDED.commission_amount,
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
    operator_receivable_estimate = EXCLUDED.operator_receivable_estimate,
    settlement_state = EXCLUDED.settlement_state,
    payout_status = EXCLUDED.payout_status,
    available_for_payout_at = EXCLUDED.available_for_payout_at,
    updated_at = TIMEZONE('UTC', NOW());

  RETURN NEW;
END;
$$;

COMMIT;