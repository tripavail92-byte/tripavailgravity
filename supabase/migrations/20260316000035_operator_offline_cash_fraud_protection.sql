BEGIN;

ALTER TABLE public.operator_commercial_profiles
  ADD COLUMN IF NOT EXISTS fraud_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fraud_review_reason TEXT,
  ADD COLUMN IF NOT EXISTS fraud_review_triggered_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.tour_booking_has_dual_completion_confirmation(
  p_metadata JSONB
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    NULLIF(BTRIM(COALESCE(p_metadata->>'operator_completion_confirmed_at', '')), '') IS NOT NULL
    AND NULLIF(BTRIM(COALESCE(p_metadata->>'traveler_completion_confirmed_at', '')), '') IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.recompute_operator_fraud_review(
  p_operator_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_review_reason TEXT := 'Repeated operator-fault cancellations triggered automatic fraud review';
BEGIN
  IF p_operator_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    operator_fault_cancellation_count,
    cancellation_penalty_active,
    fraud_review_triggered_at
  INTO v_profile
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = p_operator_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.operator_commercial_profiles
  SET
    fraud_review_required = COALESCE(v_profile.cancellation_penalty_active, FALSE),
    fraud_review_reason = CASE
      WHEN COALESCE(v_profile.cancellation_penalty_active, FALSE) THEN v_review_reason
      ELSE NULL
    END,
    fraud_review_triggered_at = CASE
      WHEN COALESCE(v_profile.cancellation_penalty_active, FALSE)
        THEN COALESCE(v_profile.fraud_review_triggered_at, TIMEZONE('UTC', NOW()))
      ELSE NULL
    END,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE operator_user_id = p_operator_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_operator_cancellation_penalty(
  p_operator_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INTEGER := 0;
  v_window_started_at TIMESTAMPTZ;
  v_auto_hold_reason TEXT := 'Automatic payout hold after 3 operator-fault cancellations in 30 days';
BEGIN
  IF p_operator_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    MIN(cancelled_at)
  INTO v_recent_count, v_window_started_at
  FROM public.operator_cancellation_penalty_events
  WHERE operator_user_id = p_operator_user_id
    AND forgiven = FALSE
    AND cancelled_at >= TIMEZONE('UTC', NOW()) - INTERVAL '30 days';

  UPDATE public.operator_commercial_profiles AS profile
  SET
    operator_fault_cancellation_count = COALESCE(v_recent_count, 0),
    operator_fault_cancellation_window_started_at = CASE
      WHEN COALESCE(v_recent_count, 0) > 0 THEN v_window_started_at
      ELSE NULL
    END,
    cancellation_penalty_active = COALESCE(v_recent_count, 0) >= 3,
    cancellation_penalty_triggered_at = CASE
      WHEN COALESCE(v_recent_count, 0) >= 3 THEN COALESCE(profile.cancellation_penalty_triggered_at, TIMEZONE('UTC', NOW()))
      ELSE NULL
    END,
    payout_hold = CASE
      WHEN COALESCE(v_recent_count, 0) >= 3 THEN TRUE
      WHEN profile.cancellation_penalty_active AND profile.payout_hold_reason = v_auto_hold_reason THEN FALSE
      ELSE profile.payout_hold
    END,
    payout_hold_reason = CASE
      WHEN COALESCE(v_recent_count, 0) >= 3 AND (profile.payout_hold_reason IS NULL OR profile.payout_hold_reason = v_auto_hold_reason)
        THEN v_auto_hold_reason
      WHEN profile.cancellation_penalty_active AND profile.payout_hold_reason = v_auto_hold_reason AND COALESCE(v_recent_count, 0) < 3
        THEN NULL
      ELSE profile.payout_hold_reason
    END,
    operational_status = CASE
      WHEN COALESCE(v_recent_count, 0) >= 3 AND profile.operational_status = 'active'::public.operator_operational_status_enum
        THEN 'restricted'::public.operator_operational_status_enum
      WHEN profile.cancellation_penalty_active
        AND COALESCE(v_recent_count, 0) < 3
        AND profile.operational_status = 'restricted'::public.operator_operational_status_enum
        AND profile.kyc_status = 'approved'::public.commercial_kyc_status_enum
        THEN 'active'::public.operator_operational_status_enum
      ELSE profile.operational_status
    END,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE profile.operator_user_id = p_operator_user_id;

  PERFORM public.recompute_operator_fraud_review(p_operator_user_id);
  PERFORM public.sync_operator_payout_eligibility(p_operator_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.operator_manage_tour_booking(
  p_booking_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  status TEXT,
  action TEXT,
  notification_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID := auth.uid();
  v_booking RECORD;
  v_status TEXT;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_cancellation_lock_window INTERVAL := INTERVAL '24 hours';
BEGIN
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_action NOT IN ('cancel', 'complete', 'resend_confirmation') THEN
    RAISE EXCEPTION 'Unsupported booking action: %', p_action;
  END IF;

  SELECT
    booking.id,
    booking.status,
    booking.traveler_id,
    booking.metadata,
    schedule.start_time,
    schedule.end_time,
    tour.title
  INTO v_booking
  FROM public.tour_bookings AS booking
  INNER JOIN public.tours AS tour
    ON tour.id = booking.tour_id
  INNER JOIN public.tour_schedules AS schedule
    ON schedule.id = booking.schedule_id
  WHERE booking.id = p_booking_id
    AND tour.operator_id = v_operator_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF p_action = 'cancel' THEN
    IF v_booking.status NOT IN ('pending', 'confirmed') THEN
      RAISE EXCEPTION 'Only pending or confirmed bookings can be cancelled';
    END IF;

    IF v_booking.status = 'confirmed' AND v_booking.start_time <= v_now + v_cancellation_lock_window THEN
      RAISE EXCEPTION USING
        MESSAGE = 'CANCELLATION_LOCK_ACTIVE',
        DETAIL = 'Operator cancellations are blocked within 24 hours of departure. Route this booking through support or admin review.',
        HINT = 'Use the booking thread to coordinate changes and escalate to admin if the departure cannot be serviced.',
        ERRCODE = 'P0001';
    END IF;

    UPDATE public.tour_bookings
    SET
      status = 'cancelled',
      metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
        'operator_last_action', 'cancel',
        'operator_last_action_at', v_now,
        'operator_last_action_by', v_operator_id,
        'operator_last_action_reason', v_reason
      )
    WHERE id = p_booking_id
    RETURNING tour_bookings.status INTO v_status;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_booking.traveler_id,
      'tour_booking_cancelled_by_operator',
      'Your booking has been cancelled',
      FORMAT(
        'Your reservation for %s was cancelled by the operator.%s',
        v_booking.title,
        CASE
          WHEN v_reason IS NULL THEN ''
          ELSE ' Reason: ' || v_reason
        END
      )
    );
  ELSIF p_action = 'complete' THEN
    IF v_booking.status <> 'confirmed' THEN
      RAISE EXCEPTION 'Only confirmed bookings can be marked completed';
    END IF;

    IF v_booking.start_time > v_now THEN
      RAISE EXCEPTION 'A booking can only be completed after the departure has started';
    END IF;

    UPDATE public.tour_bookings
    SET
      status = 'completed',
      metadata = (
        COALESCE(metadata, '{}'::JSONB)
        - 'traveler_completion_confirmed_at'
        - 'traveler_completion_confirmed_by'
        - 'traveler_completion_confirmation_note'
      ) || jsonb_build_object(
        'operator_last_action', 'complete',
        'operator_last_action_at', v_now,
        'operator_last_action_by', v_operator_id,
        'operator_last_action_reason', v_reason,
        'operator_completion_confirmed_at', v_now,
        'operator_completion_confirmed_by', v_operator_id,
        'operator_completion_confirmation_note', v_reason,
        'completion_confirmation_state', 'awaiting_traveler_confirmation'
      )
    WHERE id = p_booking_id
    RETURNING tour_bookings.status INTO v_status;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_booking.traveler_id,
      'tour_booking_completion_confirmation_requested',
      'Confirm your tour completion',
      FORMAT(
        'The operator marked your %s reservation as completed. Confirm completion in TripAvail so payout can be released.',
        v_booking.title
      )
    );
  ELSE
    IF v_booking.status NOT IN ('confirmed', 'completed') THEN
      RAISE EXCEPTION 'Only confirmed or completed bookings can receive a confirmation resend';
    END IF;

    UPDATE public.tour_bookings
    SET metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
      'operator_last_action', 'resend_confirmation',
      'operator_last_action_at', v_now,
      'operator_last_action_by', v_operator_id,
      'operator_last_action_reason', v_reason,
      'last_confirmation_resent_at', v_now
    )
    WHERE id = p_booking_id
    RETURNING tour_bookings.status INTO v_status;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_booking.traveler_id,
      'tour_booking_confirmation_resent',
      'Your booking confirmation was resent',
      FORMAT(
        'The operator resent your confirmation for %s. Review your booking details in TripAvail.',
        v_booking.title
      )
    );
  END IF;

  RETURN QUERY SELECT p_booking_id, v_status, p_action, 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.traveler_confirm_tour_booking_completion(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  status TEXT,
  action TEXT,
  notification_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_traveler_id UUID := auth.uid();
  v_booking RECORD;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
BEGIN
  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    booking.id,
    booking.status,
    booking.metadata,
    tour.operator_id,
    tour.title
  INTO v_booking
  FROM public.tour_bookings AS booking
  INNER JOIN public.tours AS tour
    ON tour.id = booking.tour_id
  WHERE booking.id = p_booking_id
    AND booking.traveler_id = v_traveler_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status <> 'completed' THEN
    RAISE EXCEPTION 'Only completed bookings can be traveler-confirmed';
  END IF;

  IF NULLIF(BTRIM(COALESCE(v_booking.metadata->>'operator_completion_confirmed_at', '')), '') IS NULL THEN
    RAISE EXCEPTION 'Operator completion confirmation is not available for this booking yet';
  END IF;

  IF NULLIF(BTRIM(COALESCE(v_booking.metadata->>'traveler_completion_confirmed_at', '')), '') IS NOT NULL THEN
    RAISE EXCEPTION 'This booking completion has already been confirmed';
  END IF;

  UPDATE public.tour_bookings
  SET metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
    'traveler_completion_confirmed_at', v_now,
    'traveler_completion_confirmed_by', v_traveler_id,
    'traveler_completion_confirmation_note', v_reason,
    'completion_confirmation_state', 'confirmed_by_both'
  )
  WHERE id = p_booking_id;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_booking.operator_id,
    'tour_booking_completion_confirmed_by_traveler',
    'Traveler confirmed trip completion',
    FORMAT(
      'The traveler confirmed completion for %s. TripAvail can now continue payout processing.',
      v_booking.title
    )
  );

  RETURN QUERY SELECT p_booking_id, 'completed'::TEXT, 'confirm_completion'::TEXT, 1;
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
  v_completion_confirmed BOOLEAN := FALSE;
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
    AND public.tour_booking_has_dual_completion_confirmation(booking.metadata)
    AND public.is_tour_booking_payment_settled(booking.id, booking.payment_status, booking.stripe_payment_intent_id)
    AND COALESCE(snapshot.refund_amount, 0) = 0
    AND snapshot.settlement_state <> 'chargeback_open'::public.settlement_state_enum
    AND COALESCE(payout_item.payout_status, 'not_ready'::public.payout_status_enum)
      NOT IN (
        'scheduled'::public.payout_status_enum,
        'paid'::public.payout_status_enum,
        'reversed'::public.payout_status_enum,
        'recovery_pending'::public.payout_status_enum
      );

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
      booking.metadata AS booking_metadata,
      schedule.end_time,
      payout_item.paid_at,
      payout_item.recovery_amount,
      payout_item.payout_status AS existing_payout_status,
      payout_item.payout_batch_id,
      payout_item.hold_reason,
      payout_batch.status AS existing_batch_status
    FROM public.operator_booking_finance_snapshots AS snapshot
    INNER JOIN public.tour_bookings AS booking
      ON booking.id = snapshot.booking_id
    INNER JOIN public.tour_schedules AS schedule
      ON schedule.id = booking.schedule_id
    LEFT JOIN public.operator_payout_items AS payout_item
      ON payout_item.booking_id = snapshot.booking_id
    LEFT JOIN public.operator_payout_batches AS payout_batch
      ON payout_batch.id = payout_item.payout_batch_id
    WHERE snapshot.operator_user_id = p_operator_user_id
  LOOP
    v_payment_verified := public.is_tour_booking_payment_settled(
      v_row.booking_id,
      v_row.payment_status,
      v_row.stripe_payment_intent_id
    );
    v_completion_confirmed := public.tour_booking_has_dual_completion_confirmation(v_row.booking_metadata);
    v_service_completed := v_row.booking_status = 'completed'
      AND v_row.end_time <= TIMEZONE('UTC', NOW())
      AND v_completion_confirmed;
    v_refund_clear := COALESCE(v_row.refund_amount, 0) = 0
      AND COALESCE(v_row.payment_status, '') NOT IN ('refunded', 'partially_refunded');
    v_chargeback_clear := TRUE;
    v_next_payout_at := CASE
      WHEN v_row.booking_status = 'completed' AND v_completion_confirmed
        THEN public.commercial_next_business_day(v_row.end_time)
      ELSE NULL
    END;
    v_hold_reason := NULL;

    IF v_row.existing_payout_status = 'paid'::public.payout_status_enum THEN
      v_settlement_state := 'paid_out'::public.settlement_state_enum;
      v_payout_status := 'paid'::public.payout_status_enum;
    ELSIF v_row.existing_payout_status = 'scheduled'::public.payout_status_enum
      AND v_row.payout_batch_id IS NOT NULL
      AND COALESCE(v_row.existing_batch_status, 'scheduled') = 'scheduled' THEN
      v_settlement_state := 'eligible_for_payout'::public.settlement_state_enum;
      v_payout_status := 'scheduled'::public.payout_status_enum;
    ELSIF v_row.existing_payout_status = 'reversed'::public.payout_status_enum THEN
      v_settlement_state := 'completed_pending_payout'::public.settlement_state_enum;
      v_payout_status := 'reversed'::public.payout_status_enum;
      v_next_payout_at := NULL;
    ELSIF v_row.existing_payout_status = 'recovery_pending'::public.payout_status_enum THEN
      v_settlement_state := 'chargeback_open'::public.settlement_state_enum;
      v_payout_status := 'recovery_pending'::public.payout_status_enum;
      v_hold_reason := COALESCE(v_row.hold_reason, 'Recovery pending on reversed payout');
      v_next_payout_at := NULL;
    ELSIF v_row.booking_status = 'cancelled' AND COALESCE(v_row.payment_status, '') IN ('refunded', 'partially_refunded') THEN
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
    ELSIF v_row.booking_status = 'completed' AND NOT v_completion_confirmed THEN
      v_settlement_state := 'completed_pending_payout'::public.settlement_state_enum;
      v_payout_status := 'not_ready'::public.payout_status_enum;
      v_hold_reason := 'Waiting for traveler completion confirmation';
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
      payout_completed_at = CASE
        WHEN v_payout_status = 'paid'::public.payout_status_enum THEN COALESCE(v_row.paid_at, payout_completed_at)
        WHEN v_payout_status IN ('recovery_pending'::public.payout_status_enum, 'reversed'::public.payout_status_enum) THEN NULL
        ELSE payout_completed_at
      END,
      notes = COALESCE(notes, '{}'::JSONB) || jsonb_build_object(
        'minimum_payout_threshold', v_minimum_payout_threshold,
        'eligible_balance_for_operator', v_ready_balance,
        'threshold_met', v_threshold_met,
        'operator_ready_for_payout', v_operator_ready,
        'payment_verified', v_payment_verified,
        'service_completed', v_service_completed,
        'completion_confirmed_by_both', v_completion_confirmed,
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

UPDATE public.tour_bookings AS booking
SET metadata = COALESCE(booking.metadata, '{}'::JSONB) || jsonb_build_object(
  'operator_completion_confirmed_at', COALESCE(
    NULLIF(booking.metadata->>'operator_completion_confirmed_at', '')::TIMESTAMPTZ,
    NULLIF(booking.metadata->>'operator_last_action_at', '')::TIMESTAMPTZ,
    schedule.end_time,
    TIMEZONE('UTC', NOW())
  ),
  'traveler_completion_confirmed_at', COALESCE(
    NULLIF(booking.metadata->>'traveler_completion_confirmed_at', '')::TIMESTAMPTZ,
    schedule.end_time,
    TIMEZONE('UTC', NOW())
  ),
  'completion_confirmation_state', COALESCE(NULLIF(booking.metadata->>'completion_confirmation_state', ''), 'legacy_auto_confirmed')
)
FROM public.tour_schedules AS schedule
WHERE schedule.id = booking.schedule_id
  AND booking.status = 'completed'
  AND NOT public.tour_booking_has_dual_completion_confirmation(booking.metadata);

UPDATE public.operator_commercial_profiles
SET
  fraud_review_required = FALSE,
  fraud_review_reason = NULL,
  fraud_review_triggered_at = NULL
WHERE fraud_review_required IS DISTINCT FROM FALSE
   OR fraud_review_reason IS NOT NULL
   OR fraud_review_triggered_at IS NOT NULL;

SELECT public.recompute_operator_fraud_review(operator_user_id)
FROM public.operator_commercial_profiles;

GRANT EXECUTE ON FUNCTION public.tour_booking_has_dual_completion_confirmation(JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recompute_operator_fraud_review(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.traveler_confirm_tour_booking_completion(UUID, TEXT) TO authenticated;

COMMIT;