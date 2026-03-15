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
      snapshot.settlement_state AS existing_settlement_state,
      booking.status AS booking_status,
      booking.payment_status,
      booking.stripe_payment_intent_id,
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
    v_service_completed := v_row.booking_status = 'completed' AND v_row.end_time <= TIMEZONE('UTC', NOW());
    v_refund_clear := COALESCE(v_row.refund_amount, 0) = 0
      AND COALESCE(v_row.payment_status, '') NOT IN ('refunded', 'partially_refunded');
    v_chargeback_clear := TRUE;
    v_next_payout_at := CASE
      WHEN v_row.booking_status = 'completed' THEN public.commercial_next_business_day(v_row.end_time)
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

CREATE OR REPLACE FUNCTION public.reverse_operator_payout_batch(
  p_batch_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  batch_id UUID,
  batch_reference TEXT,
  previous_status public.payout_status_enum,
  items_reversed INTEGER,
  recovery_items INTEGER,
  total_recovery_amount NUMERIC(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_reference TEXT;
  v_batch_status public.payout_status_enum;
  v_requires_recovery BOOLEAN := FALSE;
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();

  SELECT batch.batch_reference, batch.status
  INTO v_batch_reference, v_batch_status
  FROM public.operator_payout_batches AS batch
  WHERE batch.id = p_batch_id
  FOR UPDATE;

  IF v_batch_reference IS NULL THEN
    RAISE EXCEPTION 'Payout batch % not found', p_batch_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_batch_status = 'reversed'::public.payout_status_enum THEN
    RAISE EXCEPTION 'Payout batch % is already reversed', p_batch_id
      USING ERRCODE = 'P0001';
  END IF;

  v_requires_recovery := v_batch_status = 'paid'::public.payout_status_enum;

  CREATE TEMP TABLE IF NOT EXISTS tmp_operator_payout_batch_reverse_items (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    operator_payable_amount NUMERIC(12,2) NOT NULL,
    recovery_amount NUMERIC(12,2) NOT NULL
  ) ON COMMIT DROP;

  TRUNCATE TABLE tmp_operator_payout_batch_reverse_items;

  INSERT INTO tmp_operator_payout_batch_reverse_items (
    id,
    booking_id,
    operator_payable_amount,
    recovery_amount
  )
  SELECT
    payout_item.id,
    payout_item.booking_id,
    payout_item.operator_payable_amount,
    CASE
      WHEN v_requires_recovery THEN GREATEST(COALESCE(payout_item.recovery_amount, 0), payout_item.operator_payable_amount)
      ELSE 0::NUMERIC
    END
  FROM public.operator_payout_items AS payout_item
  WHERE payout_item.payout_batch_id = p_batch_id
    AND payout_item.payout_status IN (
      'eligible'::public.payout_status_enum,
      'scheduled'::public.payout_status_enum,
      'paid'::public.payout_status_enum,
      'recovery_pending'::public.payout_status_enum
    )
  FOR UPDATE OF payout_item;

  IF NOT EXISTS (SELECT 1 FROM tmp_operator_payout_batch_reverse_items) THEN
    RETURN;
  END IF;

  UPDATE public.operator_payout_batches AS batch
  SET
    status = 'reversed'::public.payout_status_enum,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE batch.id = p_batch_id;

  UPDATE public.operator_payout_items AS payout_item
  SET
    payout_batch_id = CASE WHEN v_requires_recovery THEN payout_item.payout_batch_id ELSE NULL END,
    payout_status = CASE
      WHEN v_requires_recovery THEN 'recovery_pending'::public.payout_status_enum
      ELSE 'eligible'::public.payout_status_enum
    END,
    recovery_amount = reverse_item.recovery_amount,
    paid_at = CASE WHEN v_requires_recovery THEN payout_item.paid_at ELSE NULL END,
    hold_reason = CASE
      WHEN v_requires_recovery THEN COALESCE(NULLIF(BTRIM(p_reason), ''), 'Recovery pending after payout reversal')
      ELSE NULL
    END,
    updated_at = TIMEZONE('UTC', NOW())
  FROM tmp_operator_payout_batch_reverse_items AS reverse_item
  WHERE payout_item.id = reverse_item.id;

  UPDATE public.operator_booking_finance_snapshots AS snapshot
  SET
    settlement_state = CASE
      WHEN v_requires_recovery THEN 'chargeback_open'::public.settlement_state_enum
      ELSE 'eligible_for_payout'::public.settlement_state_enum
    END,
    payout_status = CASE
      WHEN v_requires_recovery THEN 'recovery_pending'::public.payout_status_enum
      ELSE 'eligible'::public.payout_status_enum
    END,
    payout_completed_at = CASE WHEN v_requires_recovery THEN NULL ELSE snapshot.payout_completed_at END,
    notes = COALESCE(snapshot.notes, '{}'::JSONB) || jsonb_build_object(
      'payout_batch_reference', v_batch_reference,
      'payout_reversed_at', TIMEZONE('UTC', NOW()),
      'payout_reversal_reason', NULLIF(BTRIM(p_reason), ''),
      'payout_reversal_requires_recovery', v_requires_recovery
    ),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE snapshot.booking_id IN (
    SELECT booking_id FROM tmp_operator_payout_batch_reverse_items
  );

  UPDATE public.operator_commission_ledger AS ledger
  SET
    settlement_state = CASE
      WHEN v_requires_recovery THEN 'chargeback_open'::public.settlement_state_enum
      ELSE 'eligible_for_payout'::public.settlement_state_enum
    END,
    payout_status = CASE
      WHEN v_requires_recovery THEN 'recovery_pending'::public.payout_status_enum
      ELSE 'eligible'::public.payout_status_enum
    END,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE ledger.booking_id IN (
    SELECT booking_id FROM tmp_operator_payout_batch_reverse_items
  );

  RETURN QUERY
  SELECT
    p_batch_id,
    v_batch_reference,
    v_batch_status,
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE reverse_item.recovery_amount > 0)::INTEGER,
    ROUND(COALESCE(SUM(reverse_item.recovery_amount), 0), 2)
  FROM tmp_operator_payout_batch_reverse_items AS reverse_item;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_operator_payout_recovery(
  p_payout_item_id UUID,
  p_recovered_amount NUMERIC(12,2) DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  payout_item_id UUID,
  booking_id UUID,
  payout_status public.payout_status_enum,
  recovered_amount NUMERIC(12,2),
  remaining_recovery_amount NUMERIC(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_existing_recovery_amount NUMERIC(12,2);
  v_effective_recovered_amount NUMERIC(12,2);
  v_remaining_recovery_amount NUMERIC(12,2);
  v_next_status public.payout_status_enum;
  v_next_settlement_state public.settlement_state_enum;
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();

  SELECT payout_item.booking_id, payout_item.recovery_amount
  INTO v_booking_id, v_existing_recovery_amount
  FROM public.operator_payout_items AS payout_item
  WHERE payout_item.id = p_payout_item_id
    AND payout_item.payout_status = 'recovery_pending'::public.payout_status_enum
  FOR UPDATE;

  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'Recovery payout item % not found', p_payout_item_id
      USING ERRCODE = 'P0002';
  END IF;

  v_existing_recovery_amount := ROUND(COALESCE(v_existing_recovery_amount, 0), 2);

  IF v_existing_recovery_amount <= 0 THEN
    RAISE EXCEPTION 'Recovery payout item % has no outstanding recovery amount', p_payout_item_id
      USING ERRCODE = 'P0001';
  END IF;

  v_effective_recovered_amount := ROUND(
    LEAST(
      v_existing_recovery_amount,
      GREATEST(COALESCE(p_recovered_amount, v_existing_recovery_amount), 0)
    ),
    2
  );
  v_remaining_recovery_amount := ROUND(v_existing_recovery_amount - v_effective_recovered_amount, 2);

  v_next_status := CASE
    WHEN v_remaining_recovery_amount > 0 THEN 'recovery_pending'::public.payout_status_enum
    ELSE 'reversed'::public.payout_status_enum
  END;

  v_next_settlement_state := CASE
    WHEN v_remaining_recovery_amount > 0 THEN 'chargeback_open'::public.settlement_state_enum
    ELSE 'completed_pending_payout'::public.settlement_state_enum
  END;

  UPDATE public.operator_payout_items AS payout_item
  SET
    recovery_amount = v_remaining_recovery_amount,
    payout_status = v_next_status,
    hold_reason = CASE
      WHEN v_remaining_recovery_amount > 0 THEN COALESCE(NULLIF(BTRIM(p_reason), ''), 'Partial recovery still outstanding')
      ELSE NULL
    END,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE payout_item.id = p_payout_item_id;

  UPDATE public.operator_booking_finance_snapshots AS snapshot
  SET
    settlement_state = v_next_settlement_state,
    payout_status = v_next_status,
    payout_completed_at = NULL,
    notes = COALESCE(snapshot.notes, '{}'::JSONB) || jsonb_build_object(
      'payout_recovery_resolved_at', TIMEZONE('UTC', NOW()),
      'payout_recovery_resolution_reason', NULLIF(BTRIM(p_reason), ''),
      'payout_recovered_amount', v_effective_recovered_amount,
      'payout_recovery_remaining_amount', v_remaining_recovery_amount
    ),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE snapshot.booking_id = v_booking_id;

  UPDATE public.operator_commission_ledger AS ledger
  SET
    settlement_state = v_next_settlement_state,
    payout_status = v_next_status,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE ledger.booking_id = v_booking_id;

  RETURN QUERY
  SELECT
    p_payout_item_id,
    v_booking_id,
    v_next_status,
    v_effective_recovered_amount,
    v_remaining_recovery_amount;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reverse_operator_payout_batch(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_operator_payout_recovery(UUID, NUMERIC, TEXT) TO authenticated, service_role;