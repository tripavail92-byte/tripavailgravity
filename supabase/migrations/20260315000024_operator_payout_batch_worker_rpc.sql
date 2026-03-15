CREATE OR REPLACE FUNCTION public.ensure_finance_admin_or_service_role()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_admin_role TEXT;
  v_claim_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF v_claim_role = 'service_role' THEN
    RETURN;
  END IF;

  IF v_auth_user_id IS NULL OR NOT public.is_admin(v_auth_user_id) THEN
    RAISE EXCEPTION 'Admin privileges required'
      USING ERRCODE = '42501';
  END IF;

  SELECT public.get_admin_role(v_auth_user_id)::TEXT
  INTO v_admin_role;

  IF COALESCE(v_admin_role, '') NOT IN ('super_admin', 'finance_admin') THEN
    RAISE EXCEPTION 'Finance admin privileges required'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_all_operator_payout_eligibility()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_processed_count INTEGER := 0;
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();

  FOR v_profile IN
    SELECT operator_user_id
    FROM public.operator_commercial_profiles
  LOOP
    PERFORM public.refresh_operator_publish_usage(v_profile.operator_user_id);
    PERFORM public.sync_operator_payout_eligibility(v_profile.operator_user_id);
    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN v_processed_count;
END;
$$;

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
  total_operator_payable NUMERIC(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_batch_reference TEXT;
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();
  PERFORM public.refresh_all_operator_payout_eligibility();

  CREATE TEMP TABLE IF NOT EXISTS tmp_operator_payout_batch_candidates (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    gross_amount NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL,
    operator_payable_amount NUMERIC(12,2) NOT NULL
  ) ON COMMIT DROP;

  TRUNCATE TABLE tmp_operator_payout_batch_candidates;

  INSERT INTO tmp_operator_payout_batch_candidates (
    id,
    booking_id,
    gross_amount,
    commission_amount,
    operator_payable_amount
  )
  SELECT
    payout_item.id,
    payout_item.booking_id,
    payout_item.gross_amount,
    payout_item.commission_amount,
    payout_item.operator_payable_amount
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

  INSERT INTO public.operator_payout_batches (
    id,
    batch_reference,
    scheduled_for,
    status,
    total_gross_amount,
    total_commission_amount,
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
    ROUND(SUM(candidate.operator_payable_amount), 2),
    TIMEZONE('UTC', NOW()),
    TIMEZONE('UTC', NOW())
  FROM tmp_operator_payout_batch_candidates AS candidate;

  UPDATE public.operator_payout_items AS payout_item
  SET
    payout_batch_id = v_batch_id,
    payout_status = 'scheduled'::public.payout_status_enum,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE payout_item.id IN (
    SELECT id FROM tmp_operator_payout_batch_candidates
  );

  UPDATE public.operator_booking_finance_snapshots AS snapshot
  SET
    payout_status = 'scheduled'::public.payout_status_enum,
    notes = COALESCE(snapshot.notes, '{}'::JSONB) || jsonb_build_object(
      'payout_batch_reference', v_batch_reference,
      'payout_batch_scheduled_for', p_scheduled_for
    ),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE snapshot.booking_id IN (
    SELECT booking_id FROM tmp_operator_payout_batch_candidates
  );

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
    ROUND(SUM(candidate.operator_payable_amount), 2)
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
    payout_item.operator_payable_amount
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

GRANT EXECUTE ON FUNCTION public.ensure_finance_admin_or_service_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_all_operator_payout_eligibility() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_operator_payout_batch(TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_operator_payout_batch_paid(UUID, TIMESTAMPTZ) TO authenticated, service_role;
