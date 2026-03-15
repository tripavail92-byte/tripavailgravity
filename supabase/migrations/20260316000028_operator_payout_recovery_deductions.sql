BEGIN;

ALTER TABLE public.operator_payout_batches
  ADD COLUMN IF NOT EXISTS total_recovery_deduction_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_recovery_deduction_amount >= 0);

ALTER TABLE public.operator_payout_items
  ADD COLUMN IF NOT EXISTS recovery_deduction_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (recovery_deduction_amount >= 0),
  ADD COLUMN IF NOT EXISTS net_operator_payable_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (net_operator_payable_amount >= 0);

UPDATE public.operator_payout_items
SET
  recovery_deduction_amount = COALESCE(recovery_deduction_amount, 0),
  net_operator_payable_amount = GREATEST(ROUND(COALESCE(operator_payable_amount, 0) - COALESCE(recovery_deduction_amount, 0), 2), 0),
  updated_at = TIMEZONE('UTC', NOW())
WHERE COALESCE(net_operator_payable_amount, -1) <> GREATEST(ROUND(COALESCE(operator_payable_amount, 0) - COALESCE(recovery_deduction_amount, 0), 2), 0)
   OR COALESCE(recovery_deduction_amount, -1) < 0;

UPDATE public.operator_payout_batches AS batch
SET
  total_recovery_deduction_amount = batch_totals.total_recovery_deduction_amount,
  total_operator_payable = batch_totals.total_operator_payable,
  updated_at = TIMEZONE('UTC', NOW())
FROM (
  SELECT
    payout_batch_id,
    ROUND(COALESCE(SUM(recovery_deduction_amount), 0), 2) AS total_recovery_deduction_amount,
    ROUND(COALESCE(SUM(net_operator_payable_amount), 0), 2) AS total_operator_payable
  FROM public.operator_payout_items
  WHERE payout_batch_id IS NOT NULL
  GROUP BY payout_batch_id
) AS batch_totals
WHERE batch.id = batch_totals.payout_batch_id;

DROP FUNCTION IF EXISTS public.create_operator_payout_batch(TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.create_operator_payout_batch(
  p_scheduled_for TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW())
)
RETURNS TABLE (
  batch_id UUID,
  batch_reference TEXT,
  scheduled_for TIMESTAMPTZ,
  items_scheduled INTEGER,
  total_gross_amount NUMERIC(12,2),
  total_commission_amount NUMERIC(12,2),
  total_recovery_deduction_amount NUMERIC(12,2),
  total_operator_payable NUMERIC(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_batch_reference TEXT;
  v_candidate RECORD;
  v_recovery_item RECORD;
  v_remaining_operator_payable NUMERIC(12,2);
  v_deduction_amount NUMERIC(12,2);
  v_recovery_applied NUMERIC(12,2);
  v_recovery_remaining NUMERIC(12,2);
  v_reason TEXT := 'Automatic recovery deduction from future payout batch';
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();
  PERFORM public.refresh_all_operator_payout_eligibility();

  CREATE TEMP TABLE IF NOT EXISTS tmp_operator_payout_batch_candidates (
    id UUID PRIMARY KEY,
    operator_user_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    gross_amount NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    operator_payable_amount NUMERIC(12,2) NOT NULL,
    recovery_deduction_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_operator_payable_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payout_due_at TIMESTAMPTZ
  ) ON COMMIT DROP;

  TRUNCATE TABLE tmp_operator_payout_batch_candidates;

  INSERT INTO tmp_operator_payout_batch_candidates (
    id,
    operator_user_id,
    booking_id,
    gross_amount,
    commission_amount,
    operator_payable_amount,
    recovery_deduction_amount,
    net_operator_payable_amount,
    payout_due_at
  )
  SELECT
    payout_item.id,
    payout_item.operator_user_id,
    payout_item.booking_id,
    payout_item.gross_amount,
    payout_item.commission_amount,
    payout_item.operator_payable_amount,
    0::NUMERIC,
    payout_item.operator_payable_amount,
    payout_item.payout_due_at
  FROM public.operator_payout_items AS payout_item
  WHERE payout_item.payout_status = 'eligible'::public.payout_status_enum
    AND payout_item.payout_batch_id IS NULL
    AND COALESCE(payout_item.payout_due_at, p_scheduled_for) <= p_scheduled_for
  FOR UPDATE OF payout_item SKIP LOCKED;

  IF NOT EXISTS (SELECT 1 FROM tmp_operator_payout_batch_candidates) THEN
    RETURN;
  END IF;

  v_batch_id := gen_random_uuid();
  v_batch_reference := CONCAT(
    'PB-',
    TO_CHAR(TIMEZONE('UTC', NOW()), 'YYYYMMDDHH24MISS'),
    '-',
    UPPER(SUBSTRING(REPLACE(v_batch_id::TEXT, '-', '') FROM 1 FOR 8))
  );

  FOR v_candidate IN
    SELECT *
    FROM tmp_operator_payout_batch_candidates
    ORDER BY operator_user_id, payout_due_at NULLS FIRST, booking_id
  LOOP
    v_remaining_operator_payable := ROUND(COALESCE(v_candidate.operator_payable_amount, 0), 2);
    v_deduction_amount := 0;

    FOR v_recovery_item IN
      SELECT payout_item.id, payout_item.booking_id, payout_item.recovery_amount
      FROM public.operator_payout_items AS payout_item
      WHERE payout_item.operator_user_id = v_candidate.operator_user_id
        AND payout_item.payout_status = 'recovery_pending'::public.payout_status_enum
        AND COALESCE(payout_item.recovery_amount, 0) > 0
      ORDER BY payout_item.updated_at ASC, payout_item.created_at ASC, payout_item.id ASC
      FOR UPDATE OF payout_item SKIP LOCKED
    LOOP
      EXIT WHEN v_remaining_operator_payable <= 0;

      v_recovery_applied := ROUND(LEAST(v_remaining_operator_payable, COALESCE(v_recovery_item.recovery_amount, 0)), 2);
      IF v_recovery_applied <= 0 THEN
        CONTINUE;
      END IF;

      v_recovery_remaining := ROUND(COALESCE(v_recovery_item.recovery_amount, 0) - v_recovery_applied, 2);
      v_deduction_amount := ROUND(v_deduction_amount + v_recovery_applied, 2);
      v_remaining_operator_payable := ROUND(v_remaining_operator_payable - v_recovery_applied, 2);

      UPDATE public.operator_payout_items AS payout_item
      SET
        recovery_amount = v_recovery_remaining,
        payout_status = CASE
          WHEN v_recovery_remaining > 0 THEN 'recovery_pending'::public.payout_status_enum
          ELSE 'reversed'::public.payout_status_enum
        END,
        hold_reason = CASE
          WHEN v_recovery_remaining > 0 THEN 'Automatic recovery deduction still outstanding'
          ELSE NULL
        END,
        updated_at = TIMEZONE('UTC', NOW())
      WHERE payout_item.id = v_recovery_item.id;

      UPDATE public.operator_booking_finance_snapshots AS snapshot
      SET
        settlement_state = CASE
          WHEN v_recovery_remaining > 0 THEN 'chargeback_open'::public.settlement_state_enum
          ELSE 'completed_pending_payout'::public.settlement_state_enum
        END,
        payout_status = CASE
          WHEN v_recovery_remaining > 0 THEN 'recovery_pending'::public.payout_status_enum
          ELSE 'reversed'::public.payout_status_enum
        END,
        payout_completed_at = NULL,
        notes = COALESCE(snapshot.notes, '{}'::JSONB) || jsonb_build_object(
          'automatic_recovery_deduction_amount', v_recovery_applied,
          'automatic_recovery_remaining_amount', v_recovery_remaining,
          'automatic_recovery_source_payout_item_id', v_candidate.id,
          'automatic_recovery_batch_reference', v_batch_reference,
          'automatic_recovery_applied_at', TIMEZONE('UTC', NOW())
        ),
        updated_at = TIMEZONE('UTC', NOW())
      WHERE snapshot.booking_id = v_recovery_item.booking_id;

      UPDATE public.operator_commission_ledger AS ledger
      SET
        settlement_state = CASE
          WHEN v_recovery_remaining > 0 THEN 'chargeback_open'::public.settlement_state_enum
          ELSE 'completed_pending_payout'::public.settlement_state_enum
        END,
        payout_status = CASE
          WHEN v_recovery_remaining > 0 THEN 'recovery_pending'::public.payout_status_enum
          ELSE 'reversed'::public.payout_status_enum
        END,
        updated_at = TIMEZONE('UTC', NOW())
      WHERE ledger.booking_id = v_recovery_item.booking_id;
    END LOOP;

    UPDATE tmp_operator_payout_batch_candidates
    SET
      recovery_deduction_amount = ROUND(v_deduction_amount, 2),
      net_operator_payable_amount = GREATEST(ROUND(v_remaining_operator_payable, 2), 0)
    WHERE id = v_candidate.id;
  END LOOP;

  INSERT INTO public.operator_payout_batches (
    id,
    batch_reference,
    scheduled_for,
    status,
    total_gross_amount,
    total_commission_amount,
    total_recovery_deduction_amount,
    total_operator_payable,
    created_at,
    updated_at
  )
  SELECT
    v_batch_id,
    v_batch_reference,
    p_scheduled_for,
    'scheduled'::public.payout_status_enum,
    ROUND(SUM(candidate.gross_amount), 2),
    ROUND(SUM(candidate.commission_amount), 2),
    ROUND(SUM(candidate.recovery_deduction_amount), 2),
    ROUND(SUM(candidate.net_operator_payable_amount), 2),
    TIMEZONE('UTC', NOW()),
    TIMEZONE('UTC', NOW())
  FROM tmp_operator_payout_batch_candidates AS candidate;

  UPDATE public.operator_payout_items AS payout_item
  SET
    payout_batch_id = v_batch_id,
    payout_status = 'scheduled'::public.payout_status_enum,
    recovery_deduction_amount = candidate.recovery_deduction_amount,
    net_operator_payable_amount = candidate.net_operator_payable_amount,
    updated_at = TIMEZONE('UTC', NOW())
  FROM tmp_operator_payout_batch_candidates AS candidate
  WHERE payout_item.id = candidate.id;

  UPDATE public.operator_booking_finance_snapshots AS snapshot
  SET
    payout_status = 'scheduled'::public.payout_status_enum,
    notes = COALESCE(snapshot.notes, '{}'::JSONB) || jsonb_build_object(
      'payout_batch_reference', v_batch_reference,
      'payout_batch_scheduled_for', p_scheduled_for,
      'recovery_deduction_amount', candidate.recovery_deduction_amount,
      'net_operator_payable_amount', candidate.net_operator_payable_amount,
      'automatic_recovery_deduction_reason', CASE
        WHEN candidate.recovery_deduction_amount > 0 THEN v_reason
        ELSE NULL
      END
    ),
    updated_at = TIMEZONE('UTC', NOW())
  FROM tmp_operator_payout_batch_candidates AS candidate
  WHERE snapshot.booking_id = candidate.booking_id;

  UPDATE public.operator_commission_ledger AS ledger
  SET
    payout_status = 'scheduled'::public.payout_status_enum,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE ledger.booking_id IN (
    SELECT booking_id FROM tmp_operator_payout_batch_candidates
  );

  RETURN QUERY
  SELECT
    v_batch_id,
    v_batch_reference,
    p_scheduled_for,
    COUNT(*)::INTEGER,
    ROUND(SUM(candidate.gross_amount), 2),
    ROUND(SUM(candidate.commission_amount), 2),
    ROUND(SUM(candidate.recovery_deduction_amount), 2),
    ROUND(SUM(candidate.net_operator_payable_amount), 2)
  FROM tmp_operator_payout_batch_candidates AS candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_operator_payout_batch_paid(
  p_batch_id UUID,
  p_paid_at TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW())
)
RETURNS TABLE (
  batch_id UUID,
  batch_reference TEXT,
  items_paid INTEGER,
  total_operator_payable NUMERIC(12,2),
  paid_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_reference TEXT;
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();

  SELECT batch.batch_reference
  INTO v_batch_reference
  FROM public.operator_payout_batches AS batch
  WHERE batch.id = p_batch_id;

  IF v_batch_reference IS NULL THEN
    RAISE EXCEPTION 'Payout batch % not found', p_batch_id
      USING ERRCODE = 'P0002';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_operator_payout_batch_paid_items (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    operator_payable_amount NUMERIC(12,2) NOT NULL
  ) ON COMMIT DROP;

  TRUNCATE TABLE tmp_operator_payout_batch_paid_items;

  INSERT INTO tmp_operator_payout_batch_paid_items (
    id,
    booking_id,
    operator_payable_amount
  )
  SELECT
    payout_item.id,
    payout_item.booking_id,
    COALESCE(payout_item.net_operator_payable_amount, payout_item.operator_payable_amount)
  FROM public.operator_payout_items AS payout_item
  WHERE payout_item.payout_batch_id = p_batch_id
    AND payout_item.payout_status IN (
      'scheduled'::public.payout_status_enum,
      'eligible'::public.payout_status_enum
    )
  FOR UPDATE OF payout_item;

  UPDATE public.operator_payout_batches AS batch
  SET
    status = 'paid'::public.payout_status_enum,
    total_operator_payable = (
      SELECT ROUND(COALESCE(SUM(item.operator_payable_amount), 0), 2)
      FROM tmp_operator_payout_batch_paid_items AS item
    ),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE batch.id = p_batch_id;

  UPDATE public.operator_payout_items AS payout_item
  SET
    payout_status = 'paid'::public.payout_status_enum,
    paid_at = p_paid_at,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE payout_item.id IN (
    SELECT id FROM tmp_operator_payout_batch_paid_items
  );

  UPDATE public.operator_booking_finance_snapshots AS snapshot
  SET
    settlement_state = 'paid_out'::public.settlement_state_enum,
    payout_status = 'paid'::public.payout_status_enum,
    payout_completed_at = p_paid_at,
    notes = COALESCE(snapshot.notes, '{}'::JSONB) || jsonb_build_object(
      'payout_batch_reference', v_batch_reference,
      'payout_paid_at', p_paid_at
    ),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE snapshot.booking_id IN (
    SELECT booking_id FROM tmp_operator_payout_batch_paid_items
  );

  UPDATE public.operator_commission_ledger AS ledger
  SET
    settlement_state = 'paid_out'::public.settlement_state_enum,
    payout_status = 'paid'::public.payout_status_enum,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE ledger.booking_id IN (
    SELECT booking_id FROM tmp_operator_payout_batch_paid_items
  );

  RETURN QUERY
  SELECT
    p_batch_id,
    v_batch_reference,
    COUNT(*)::INTEGER,
    ROUND(COALESCE(SUM(item.operator_payable_amount), 0), 2),
    p_paid_at
  FROM tmp_operator_payout_batch_paid_items AS item;
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
    COALESCE(payout_item.net_operator_payable_amount, payout_item.operator_payable_amount),
    CASE
      WHEN v_requires_recovery THEN GREATEST(COALESCE(payout_item.recovery_amount, 0), COALESCE(payout_item.net_operator_payable_amount, payout_item.operator_payable_amount))
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
      WHEN v_requires_recovery AND reverse_item.recovery_amount > 0 THEN 'recovery_pending'::public.payout_status_enum
      WHEN v_requires_recovery THEN 'reversed'::public.payout_status_enum
      ELSE 'eligible'::public.payout_status_enum
    END,
    recovery_amount = reverse_item.recovery_amount,
    paid_at = CASE WHEN v_requires_recovery THEN payout_item.paid_at ELSE NULL END,
    hold_reason = CASE
      WHEN v_requires_recovery AND reverse_item.recovery_amount > 0 THEN COALESCE(NULLIF(BTRIM(p_reason), ''), 'Recovery pending after payout reversal')
      ELSE NULL
    END,
    recovery_deduction_amount = 0,
    net_operator_payable_amount = payout_item.operator_payable_amount,
    updated_at = TIMEZONE('UTC', NOW())
  FROM tmp_operator_payout_batch_reverse_items AS reverse_item
  WHERE payout_item.id = reverse_item.id;

  UPDATE public.operator_booking_finance_snapshots AS snapshot
  SET
    settlement_state = CASE
      WHEN v_requires_recovery AND EXISTS (
        SELECT 1
        FROM tmp_operator_payout_batch_reverse_items AS reverse_item
        WHERE reverse_item.booking_id = snapshot.booking_id
          AND reverse_item.recovery_amount > 0
      ) THEN 'chargeback_open'::public.settlement_state_enum
      ELSE 'eligible_for_payout'::public.settlement_state_enum
    END,
    payout_status = CASE
      WHEN v_requires_recovery AND EXISTS (
        SELECT 1
        FROM tmp_operator_payout_batch_reverse_items AS reverse_item
        WHERE reverse_item.booking_id = snapshot.booking_id
          AND reverse_item.recovery_amount > 0
      ) THEN 'recovery_pending'::public.payout_status_enum
      WHEN v_requires_recovery THEN 'reversed'::public.payout_status_enum
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
      WHEN v_requires_recovery AND EXISTS (
        SELECT 1
        FROM tmp_operator_payout_batch_reverse_items AS reverse_item
        WHERE reverse_item.booking_id = ledger.booking_id
          AND reverse_item.recovery_amount > 0
      ) THEN 'chargeback_open'::public.settlement_state_enum
      ELSE 'eligible_for_payout'::public.settlement_state_enum
    END,
    payout_status = CASE
      WHEN v_requires_recovery AND EXISTS (
        SELECT 1
        FROM tmp_operator_payout_batch_reverse_items AS reverse_item
        WHERE reverse_item.booking_id = ledger.booking_id
          AND reverse_item.recovery_amount > 0
      ) THEN 'recovery_pending'::public.payout_status_enum
      WHEN v_requires_recovery THEN 'reversed'::public.payout_status_enum
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

DROP VIEW IF EXISTS public.operator_payout_report_v;

CREATE VIEW public.operator_payout_report_v AS
SELECT
  payout_item.id AS payout_item_id,
  payout_item.operator_user_id,
  payout_item.booking_id,
  booking.traveler_id,
  tour.title AS trip_name,
  schedule.start_time AS travel_date,
  payout_item.gross_amount,
  payout_item.refund_amount,
  payout_item.commission_amount AS commission_retained_by_tripavail,
  COALESCE(snapshot.commission_total, payout_item.commission_amount) AS commission_total,
  COALESCE(snapshot.commission_collected, payout_item.commission_amount) AS commission_collected,
  COALESCE(snapshot.commission_remaining, 0) AS commission_remaining,
  payout_item.operator_payable_amount,
  payout_item.recovery_deduction_amount,
  payout_item.net_operator_payable_amount,
  payout_item.payout_status,
  payout_item.payout_due_at,
  payout_item.paid_at,
  payout_item.hold_reason,
  payout_item.recovery_amount,
  payout_batch.batch_reference,
  payout_batch.scheduled_for AS payout_batch_scheduled_for
FROM public.operator_payout_items AS payout_item
LEFT JOIN public.tour_bookings AS booking
  ON booking.id = payout_item.booking_id
LEFT JOIN public.operator_booking_finance_snapshots AS snapshot
  ON snapshot.booking_id = payout_item.booking_id
LEFT JOIN public.tours AS tour
  ON tour.id = booking.tour_id
LEFT JOIN public.tour_schedules AS schedule
  ON schedule.id = booking.schedule_id
LEFT JOIN public.operator_payout_batches AS payout_batch
  ON payout_batch.id = payout_item.payout_batch_id;

CREATE OR REPLACE VIEW public.operator_performance_report_v AS
SELECT
  profile.operator_user_id,
  profile.membership_tier_code,
  profile.membership_status,
  COALESCE(tour_metrics.published_trips, 0) AS published_trips,
  COALESCE(ledger_metrics.confirmed_bookings, 0) AS confirmed_bookings,
  COALESCE(ledger_metrics.gmv, 0) AS gmv,
  COALESCE(ledger_metrics.commission_paid, 0) AS commission_paid,
  COALESCE(payout_metrics.payouts_received, 0) AS payouts_received,
  COALESCE(feature_metrics.ai_usage, 0) AS ai_usage,
  COALESCE(feature_metrics.pickup_usage, 0) AS pickup_usage,
  COALESCE(feature_metrics.map_usage, 0) AS map_usage
FROM public.operator_commercial_profiles AS profile
LEFT JOIN (
  SELECT
    operator_id AS operator_user_id,
    COUNT(*) FILTER (WHERE is_active = TRUE) AS published_trips
  FROM public.tours
  GROUP BY operator_id
) AS tour_metrics
  ON tour_metrics.operator_user_id = profile.operator_user_id
LEFT JOIN (
  SELECT
    operator_user_id,
    COUNT(DISTINCT booking_id) AS confirmed_bookings,
    ROUND(SUM(booking_total), 2) AS gmv,
    ROUND(SUM(commission_amount), 2) AS commission_paid
  FROM public.operator_commission_ledger
  GROUP BY operator_user_id
) AS ledger_metrics
  ON ledger_metrics.operator_user_id = profile.operator_user_id
LEFT JOIN (
  SELECT
    operator_user_id,
    ROUND(SUM(COALESCE(net_operator_payable_amount, operator_payable_amount)), 2) AS payouts_received
  FROM public.operator_payout_items
  GROUP BY operator_user_id
) AS payout_metrics
  ON payout_metrics.operator_user_id = profile.operator_user_id
LEFT JOIN (
  SELECT
    operator_user_id,
    SUM(ai_itinerary_credits_used) AS ai_usage,
    SUM(pickup_multi_city_uses) AS pickup_usage,
    SUM(google_maps_uses) AS map_usage
  FROM public.operator_feature_usage_monthly
  GROUP BY operator_user_id
) AS feature_metrics
  ON feature_metrics.operator_user_id = profile.operator_user_id;

CREATE OR REPLACE VIEW public.admin_finance_summary_v AS
SELECT
  COALESCE(snapshot_metrics.total_customer_payments_collected, 0) AS total_customer_payments_collected,
  COALESCE(snapshot_metrics.total_commission_earned, 0) AS total_commission_earned,
  COALESCE(cycle_metrics.total_membership_fees_charged, 0) AS total_membership_fees_charged,
  COALESCE(cycle_metrics.total_membership_fees_waived_adjusted, 0) AS total_membership_fees_waived_adjusted,
  COALESCE(payout_metrics.total_operator_payouts, 0) AS total_operator_payouts,
  COALESCE(payout_metrics.total_held_amounts, 0) AS total_held_amounts,
  COALESCE(snapshot_metrics.total_refunds, 0) AS total_refunds,
  COALESCE(payout_metrics.total_recovery_pending, 0) AS total_recovery_pending,
  COALESCE(snapshot_metrics.total_chargebacks_disputes, 0) AS total_chargebacks_disputes,
  COALESCE(payout_metrics.total_recovery_deductions, 0) AS total_recovery_deductions
FROM (
  SELECT
    ROUND(SUM(payment_collected), 2) AS total_customer_payments_collected,
    ROUND(SUM(commission_amount), 2) AS total_commission_earned,
    ROUND(SUM(refund_amount), 2) AS total_refunds,
    COUNT(*) FILTER (WHERE settlement_state = 'chargeback_open'::public.settlement_state_enum) AS total_chargebacks_disputes
  FROM public.operator_booking_finance_snapshots
) AS snapshot_metrics
CROSS JOIN (
  SELECT
    ROUND(SUM(final_membership_charge), 2) AS total_membership_fees_charged,
    ROUND(SUM(adjustment_applied), 2) AS total_membership_fees_waived_adjusted
  FROM public.operator_billing_cycles
) AS cycle_metrics
CROSS JOIN (
  SELECT
    ROUND(SUM(COALESCE(net_operator_payable_amount, operator_payable_amount)), 2) AS total_operator_payouts,
    ROUND(SUM(COALESCE(net_operator_payable_amount, operator_payable_amount)) FILTER (WHERE payout_status = 'on_hold'::public.payout_status_enum), 2) AS total_held_amounts,
    ROUND(SUM(recovery_amount), 2) AS total_recovery_pending,
    ROUND(SUM(recovery_deduction_amount), 2) AS total_recovery_deductions
  FROM public.operator_payout_items
) AS payout_metrics;

GRANT SELECT ON public.operator_payout_report_v TO authenticated, service_role;
GRANT SELECT ON public.operator_performance_report_v TO authenticated, service_role;
GRANT SELECT ON public.admin_finance_summary_v TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_operator_payout_batch(TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_operator_payout_batch_paid(UUID, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reverse_operator_payout_batch(UUID, TEXT) TO authenticated, service_role;

COMMIT;