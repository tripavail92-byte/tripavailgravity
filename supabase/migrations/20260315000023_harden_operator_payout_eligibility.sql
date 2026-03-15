CREATE OR REPLACE FUNCTION public.refresh_operator_publish_usage(
  p_operator_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_start DATE;
  v_cycle_end DATE;
  v_published_count INTEGER := 0;
BEGIN
  IF p_operator_user_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM public.provision_operator_commercial_profile(p_operator_user_id);

  SELECT profile.current_cycle_start, profile.current_cycle_end
  INTO v_cycle_start, v_cycle_end
  FROM public.operator_commercial_profiles AS profile
  WHERE profile.operator_user_id = p_operator_user_id;

  IF v_cycle_start IS NULL OR v_cycle_end IS NULL THEN
    v_cycle_start := DATE_TRUNC('month', TIMEZONE('UTC', NOW()))::DATE;
    v_cycle_end := (v_cycle_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  END IF;

  SELECT COUNT(*)
  INTO v_published_count
  FROM public.tours AS tour
  WHERE tour.operator_id = p_operator_user_id
    AND (COALESCE(tour.is_published, FALSE) = TRUE OR COALESCE(tour.is_active, FALSE) = TRUE)
    AND COALESCE(tour.approved_at, tour.created_at, TIMEZONE('UTC', NOW()))::DATE BETWEEN v_cycle_start AND v_cycle_end;

  INSERT INTO public.operator_feature_usage_monthly (
    operator_user_id,
    cycle_start,
    cycle_end,
    published_tours_count,
    updated_at
  )
  VALUES (
    p_operator_user_id,
    v_cycle_start,
    v_cycle_end,
    v_published_count,
    TIMEZONE('UTC', NOW())
  )
  ON CONFLICT (operator_user_id, cycle_start, cycle_end) DO UPDATE SET
    published_tours_count = EXCLUDED.published_tours_count,
    updated_at = TIMEZONE('UTC', NOW());

  UPDATE public.operator_commercial_profiles
  SET
    monthly_published_tours_count = v_published_count,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE operator_user_id = p_operator_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_operator_publish_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_becoming_published BOOLEAN := FALSE;
  v_cycle_start DATE;
  v_cycle_end DATE;
  v_tier_code public.membership_tier_code_enum;
  v_monthly_publish_limit INTEGER := 0;
  v_used_publish_slots INTEGER := 0;
BEGIN
  IF NEW.operator_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_becoming_published :=
    (COALESCE(NEW.is_published, FALSE) = TRUE OR COALESCE(NEW.is_active, FALSE) = TRUE)
    AND (
      TG_OP = 'INSERT'
      OR NOT (COALESCE(OLD.is_published, FALSE) = TRUE OR COALESCE(OLD.is_active, FALSE) = TRUE)
    );

  IF NOT v_becoming_published THEN
    RETURN NEW;
  END IF;

  PERFORM public.provision_operator_commercial_profile(NEW.operator_id);

  SELECT
    profile.current_cycle_start,
    profile.current_cycle_end,
    profile.membership_tier_code,
    tier.monthly_publish_limit
  INTO
    v_cycle_start,
    v_cycle_end,
    v_tier_code,
    v_monthly_publish_limit
  FROM public.operator_commercial_profiles AS profile
  INNER JOIN public.commercial_membership_tiers AS tier
    ON tier.code = profile.membership_tier_code
  WHERE profile.operator_user_id = NEW.operator_id;

  SELECT COUNT(*)
  INTO v_used_publish_slots
  FROM public.tours AS tour
  WHERE tour.operator_id = NEW.operator_id
    AND (COALESCE(tour.is_published, FALSE) = TRUE OR COALESCE(tour.is_active, FALSE) = TRUE)
    AND COALESCE(tour.approved_at, tour.created_at, TIMEZONE('UTC', NOW()))::DATE BETWEEN v_cycle_start AND v_cycle_end
    AND (TG_OP = 'INSERT' OR tour.id <> NEW.id);

  IF v_used_publish_slots >= v_monthly_publish_limit THEN
    RAISE EXCEPTION USING
      MESSAGE = 'PUBLISH_LIMIT_REACHED',
      DETAIL = FORMAT(
        'You have reached the maximum number of published trips for your %s membership tier. Used %s of %s slots in the current billing cycle.',
        INITCAP(v_tier_code::TEXT),
        v_used_publish_slots,
        v_monthly_publish_limit
      ),
      HINT = 'Upgrade the operator tier, unpublish an existing trip, or wait until the next billing cycle.',
      ERRCODE = 'P0001';
  END IF;

  IF NEW.approved_at IS NULL THEN
    NEW.approved_at := TIMEZONE('UTC', NOW());
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_operator_publish_usage_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_operator_publish_usage(OLD.operator_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT'
     AND NOT (COALESCE(NEW.is_published, FALSE) = TRUE OR COALESCE(NEW.is_active, FALSE) = TRUE) THEN
    RETURN NEW;
  END IF;

  PERFORM public.refresh_operator_publish_usage(NEW.operator_id);

  IF TG_OP = 'UPDATE' AND OLD.operator_id IS DISTINCT FROM NEW.operator_id THEN
    PERFORM public.refresh_operator_publish_usage(OLD.operator_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tours_enforce_operator_publish_limit ON public.tours;
CREATE TRIGGER tours_enforce_operator_publish_limit
BEFORE INSERT OR UPDATE OF is_published, is_active, approved_at ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.enforce_operator_publish_limit();

DROP TRIGGER IF EXISTS tours_sync_operator_publish_usage ON public.tours;
CREATE TRIGGER tours_sync_operator_publish_usage
AFTER INSERT OR UPDATE OR DELETE ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_publish_usage_trigger();

CREATE OR REPLACE FUNCTION public.is_tour_booking_payment_settled(
  p_booking_id UUID,
  p_payment_status TEXT,
  p_stripe_payment_intent_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_has_webhook_rows BOOLEAN := FALSE;
  v_has_success_webhook BOOLEAN := FALSE;
BEGIN
  IF COALESCE(p_payment_status, '') <> 'paid' THEN
    RETURN FALSE;
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_stripe_payment_intent_id, '')), '') IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.payment_webhooks
    WHERE booking_type = 'tour'
      AND booking_id = p_booking_id
  )
  INTO v_has_webhook_rows;

  IF v_has_webhook_rows THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.payment_webhooks
      WHERE booking_type = 'tour'
        AND booking_id = p_booking_id
        AND event_type = 'payment_intent.succeeded'
    )
    INTO v_has_success_webhook;

    RETURN v_has_success_webhook;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_operator_payout_eligibility(
  p_operator_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kyc_status public.commercial_kyc_status_enum;
  v_payout_hold BOOLEAN := FALSE;
  v_payout_hold_reason TEXT;
  v_minimum_payout_threshold NUMERIC(12,2) := 5000;
  v_ready_balance NUMERIC(12,2) := 0;
  v_threshold_met BOOLEAN := FALSE;
  v_operator_ready BOOLEAN := FALSE;
  v_payment_verified BOOLEAN := FALSE;
  v_service_completed BOOLEAN := FALSE;
  v_refund_clear BOOLEAN := FALSE;
  v_chargeback_clear BOOLEAN := FALSE;
  v_next_payout_at TIMESTAMPTZ;
  v_settlement_state public.settlement_state_enum;
  v_payout_status public.payout_status_enum;
  v_hold_reason TEXT;
  v_row RECORD;
BEGIN
  IF p_operator_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT profile.kyc_status, profile.payout_hold, profile.payout_hold_reason
  INTO v_kyc_status, v_payout_hold, v_payout_hold_reason
  FROM public.operator_commercial_profiles AS profile
  WHERE profile.operator_user_id = p_operator_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(ROUND(SUM(snapshot.operator_receivable_estimate), 2), 0)
  INTO v_ready_balance
  FROM public.operator_booking_finance_snapshots AS snapshot
  INNER JOIN public.tour_bookings AS booking
    ON booking.id = snapshot.booking_id
  INNER JOIN public.tour_schedules AS schedule
    ON schedule.id = booking.schedule_id
  LEFT JOIN public.operator_payout_items AS payout_item
    ON payout_item.booking_id = snapshot.booking_id
  WHERE snapshot.operator_user_id = p_operator_user_id
    AND booking.status = 'completed'
    AND schedule.end_time <= TIMEZONE('UTC', NOW())
    AND public.is_tour_booking_payment_settled(booking.id, booking.payment_status, booking.stripe_payment_intent_id)
    AND COALESCE(snapshot.refund_amount, 0) = 0
    AND snapshot.settlement_state <> 'chargeback_open'::public.settlement_state_enum
    AND COALESCE(payout_item.payout_status, 'not_ready'::public.payout_status_enum)
      NOT IN ('scheduled'::public.payout_status_enum, 'paid'::public.payout_status_enum, 'reversed'::public.payout_status_enum);

  v_threshold_met := v_ready_balance >= v_minimum_payout_threshold;
  v_operator_ready := v_kyc_status = 'approved'::public.commercial_kyc_status_enum AND NOT v_payout_hold;

  FOR v_row IN
    SELECT
      snapshot.booking_id,
      snapshot.refund_amount,
      snapshot.notes,
      snapshot.payout_completed_at,
      booking.status AS booking_status,
      booking.payment_status,
      booking.stripe_payment_intent_id,
      schedule.end_time,
      payout_item.paid_at,
      payout_item.recovery_amount
    FROM public.operator_booking_finance_snapshots AS snapshot
    INNER JOIN public.tour_bookings AS booking
      ON booking.id = snapshot.booking_id
    INNER JOIN public.tour_schedules AS schedule
      ON schedule.id = booking.schedule_id
    LEFT JOIN public.operator_payout_items AS payout_item
      ON payout_item.booking_id = snapshot.booking_id
    WHERE snapshot.operator_user_id = p_operator_user_id
  LOOP
    v_payment_verified := public.is_tour_booking_payment_settled(
      v_row.booking_id,
      v_row.payment_status,
      v_row.stripe_payment_intent_id
    );
    v_service_completed := v_row.booking_status = 'completed' AND v_row.end_time <= TIMEZONE('UTC', NOW());
    v_refund_clear := COALESCE(v_row.refund_amount, 0) = 0
      AND COALESCE(v_row.payment_status, '') NOT IN ('refunded', 'partially_refunded');
    v_chargeback_clear := TRUE;
    v_next_payout_at := CASE
      WHEN v_row.booking_status = 'completed' THEN public.commercial_next_business_day(v_row.end_time)
      ELSE NULL
    END;
    v_hold_reason := NULL;

    IF v_row.booking_status = 'cancelled' AND COALESCE(v_row.payment_status, '') IN ('refunded', 'partially_refunded') THEN
      v_settlement_state := 'refunded'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'cancelled' THEN
      v_settlement_state := 'cancelled_by_operator'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF NOT v_chargeback_clear THEN
      v_settlement_state := 'chargeback_open'::public.settlement_state_enum;
      v_payout_status := 'on_hold'::public.payout_status_enum;
      v_hold_reason := 'Chargeback or dispute open';
    ELSIF v_row.booking_status = 'pending' THEN
      v_settlement_state := 'pending_payment'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'confirmed' AND v_payment_verified THEN
      v_settlement_state := 'paid_pending_service'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'confirmed' THEN
      v_settlement_state := 'pending_payment'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'completed' AND NOT v_service_completed THEN
      v_settlement_state := 'completed_pending_payout'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'completed' AND NOT v_payment_verified THEN
      v_settlement_state := 'completed_pending_payout'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'completed' AND NOT v_refund_clear THEN
      v_settlement_state := 'refunded'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'completed' AND v_payout_hold THEN
      v_settlement_state := 'payout_on_hold'::public.settlement_state_enum;
      v_payout_status := 'on_hold'::public.payout_status_enum;
      v_hold_reason := COALESCE(v_payout_hold_reason, 'Operator payout hold is active');
    ELSIF v_row.booking_status = 'completed' AND v_kyc_status <> 'approved'::public.commercial_kyc_status_enum THEN
      v_settlement_state := 'completed_pending_payout'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'completed' AND v_operator_ready AND v_threshold_met THEN
      v_settlement_state := 'eligible_for_payout'::public.settlement_state_enum;
      v_payout_status := 'eligible'::public.payout_status_enum;
    ELSIF v_row.booking_status = 'completed' THEN
      v_settlement_state := 'completed_pending_payout'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    ELSE
      v_settlement_state := 'draft'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
    END IF;

    UPDATE public.operator_booking_finance_snapshots
    SET
      settlement_state = v_settlement_state,
      payout_status = v_payout_status,
      payout_available_at = v_next_payout_at,
      notes = COALESCE(notes, '{}'::JSONB) || jsonb_build_object(
        'minimum_payout_threshold', v_minimum_payout_threshold,
        'eligible_balance_for_operator', v_ready_balance,
        'threshold_met', v_threshold_met,
        'operator_ready_for_payout', v_operator_ready,
        'payment_verified', v_payment_verified,
        'service_completed', v_service_completed,
        'refund_clear', v_refund_clear,
        'chargeback_clear', v_chargeback_clear
      ),
      updated_at = TIMEZONE('UTC', NOW())
    WHERE booking_id = v_row.booking_id;

    UPDATE public.operator_commission_ledger
    SET
      settlement_state = v_settlement_state,
      payout_status = v_payout_status,
      available_for_payout_at = v_next_payout_at,
      updated_at = TIMEZONE('UTC', NOW())
    WHERE booking_id = v_row.booking_id;

    UPDATE public.operator_payout_items
    SET
      payout_status = v_payout_status,
      payout_due_at = v_next_payout_at,
      hold_reason = v_hold_reason,
      updated_at = TIMEZONE('UTC', NOW())
    WHERE booking_id = v_row.booking_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_tour_booking_payout_eligibility_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_user_id UUID;
BEGIN
  SELECT tour.operator_id
  INTO v_operator_user_id
  FROM public.tours AS tour
  WHERE tour.id = NEW.tour_id;

  PERFORM public.sync_operator_payout_eligibility(v_operator_user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_operator_commercial_profile_finance_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_operator_publish_usage(NEW.operator_user_id);
  PERFORM public.sync_operator_payout_eligibility(NEW.operator_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_tour_bookings_sync_operator_payout_eligibility ON public.tour_bookings;
CREATE TRIGGER zz_tour_bookings_sync_operator_payout_eligibility
AFTER INSERT OR UPDATE OF status, payment_status, stripe_payment_intent_id, amount_paid_online, upfront_amount, remaining_amount ON public.tour_bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_tour_booking_payout_eligibility_refresh();

DROP TRIGGER IF EXISTS operator_commercial_profile_finance_refresh ON public.operator_commercial_profiles;
CREATE TRIGGER operator_commercial_profile_finance_refresh
AFTER UPDATE OF kyc_status, payout_hold, payout_hold_reason, current_cycle_start, current_cycle_end ON public.operator_commercial_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_operator_commercial_profile_finance_refresh();

DO $$
DECLARE
  v_profile RECORD;
BEGIN
  FOR v_profile IN
    SELECT operator_user_id
    FROM public.operator_commercial_profiles
  LOOP
    PERFORM public.refresh_operator_publish_usage(v_profile.operator_user_id);
    PERFORM public.sync_operator_payout_eligibility(v_profile.operator_user_id);
  END LOOP;
END;
$$;