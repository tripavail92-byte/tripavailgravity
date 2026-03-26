BEGIN;

CREATE OR REPLACE FUNCTION public.booking_has_open_stripe_dispute(
  p_payment_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_payment_metadata->>'stripe_dispute_open', '') IN ('true', 't', '1', 'yes') THEN TRUE
    WHEN COALESCE(LOWER(p_payment_metadata->>'stripe_dispute_status'), '') IN (
      'warning_needs_response',
      'warning_under_review',
      'needs_response',
      'under_review'
    ) THEN TRUE
    ELSE FALSE
  END
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
    AND NOT public.booking_has_open_stripe_dispute(COALESCE(booking.payment_metadata, '{}'::JSONB))
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
      booking.payment_metadata,
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
    v_chargeback_clear := NOT public.booking_has_open_stripe_dispute(COALESCE(v_row.payment_metadata, '{}'::JSONB));
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
      v_next_payout_at := NULL;
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

GRANT EXECUTE ON FUNCTION public.booking_has_open_stripe_dispute(JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_operator_payout_eligibility(UUID) TO authenticated, service_role;

COMMIT;