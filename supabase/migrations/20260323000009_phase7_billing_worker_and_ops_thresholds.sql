BEGIN;

CREATE OR REPLACE FUNCTION public.admin_close_operator_billing_cycle(
  p_operator_user_id UUID,
  p_cycle_end DATE DEFAULT NULL
)
RETURNS public.operator_billing_cycles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role public.admin_role_enum;
  v_claim_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
  v_profile public.operator_commercial_profiles;
  v_current_cycle public.operator_billing_cycles;
  v_next_cycle public.operator_billing_cycles;
  v_effective_cycle_end DATE;
  v_credit NUMERIC(12,2);
  v_adjustment NUMERIC(12,2);
  v_final_charge NUMERIC(12,2);
  v_next_start DATE;
  v_next_end DATE;
  v_invoice_number TEXT;
BEGIN
  IF v_claim_role <> 'service_role' THEN
    IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
      RAISE EXCEPTION 'Admin authentication required';
    END IF;

    v_role := public.get_admin_role(v_admin_id);
    IF v_role NOT IN ('super_admin'::public.admin_role_enum, 'finance_admin'::public.admin_role_enum) THEN
      RAISE EXCEPTION 'Insufficient privileges to close billing cycle';
    END IF;
  END IF;

  PERFORM public.provision_operator_commercial_profile(p_operator_user_id);

  SELECT * INTO v_profile
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = p_operator_user_id;

  v_effective_cycle_end := COALESCE(p_cycle_end, v_profile.current_cycle_end);

  SELECT * INTO v_current_cycle
  FROM public.operator_billing_cycles
  WHERE operator_user_id = p_operator_user_id
    AND cycle_start = v_profile.current_cycle_start
    AND cycle_end = v_effective_cycle_end;

  IF NOT FOUND THEN
    INSERT INTO public.operator_billing_cycles (
      operator_user_id,
      membership_tier_code,
      cycle_start,
      cycle_end,
      membership_fee,
      prior_cycle_commission_credit,
      adjustment_applied,
      final_membership_charge,
      invoice_status
    ) VALUES (
      p_operator_user_id,
      v_profile.membership_tier_code,
      v_profile.current_cycle_start,
      v_effective_cycle_end,
      v_profile.monthly_membership_fee,
      0,
      0,
      v_profile.monthly_membership_fee,
      'draft'::public.invoice_status_enum
    ) RETURNING * INTO v_current_cycle;
  END IF;

  SELECT COALESCE(ROUND(SUM(ledger.commission_amount), 2), 0)
  INTO v_credit
  FROM public.operator_commission_ledger AS ledger
  WHERE ledger.operator_user_id = p_operator_user_id
    AND ledger.recognized_at::DATE BETWEEN v_current_cycle.cycle_start AND v_current_cycle.cycle_end
    AND ledger.settlement_state NOT IN ('cancelled_by_operator'::public.settlement_state_enum, 'refunded'::public.settlement_state_enum);

  UPDATE public.operator_billing_cycles
  SET
    closed_at = COALESCE(closed_at, TIMEZONE('UTC', NOW())),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE id = v_current_cycle.id
  RETURNING * INTO v_current_cycle;

  v_next_start := v_current_cycle.cycle_end + INTERVAL '1 day';
  v_next_end := (v_next_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_adjustment := LEAST(v_profile.monthly_membership_fee, v_credit);
  v_final_charge := GREATEST(0, ROUND(v_profile.monthly_membership_fee - v_credit, 2));

  UPDATE public.operator_commercial_profiles
  SET
    current_cycle_start = v_next_start,
    current_cycle_end = v_next_end,
    next_billing_date = (v_next_end + INTERVAL '1 day')::DATE,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE operator_user_id = p_operator_user_id;

  INSERT INTO public.operator_billing_cycles (
    operator_user_id,
    membership_tier_code,
    cycle_start,
    cycle_end,
    membership_fee,
    prior_cycle_commission_credit,
    adjustment_applied,
    final_membership_charge,
    invoice_status
  ) VALUES (
    p_operator_user_id,
    v_profile.membership_tier_code,
    v_next_start,
    v_next_end,
    v_profile.monthly_membership_fee,
    v_credit,
    v_adjustment,
    v_final_charge,
    CASE WHEN v_final_charge = 0 THEN 'waived'::public.invoice_status_enum ELSE 'issued'::public.invoice_status_enum END
  )
  ON CONFLICT (operator_user_id, cycle_start, cycle_end) DO UPDATE SET
    membership_tier_code = EXCLUDED.membership_tier_code,
    membership_fee = EXCLUDED.membership_fee,
    prior_cycle_commission_credit = EXCLUDED.prior_cycle_commission_credit,
    adjustment_applied = EXCLUDED.adjustment_applied,
    final_membership_charge = EXCLUDED.final_membership_charge,
    invoice_status = EXCLUDED.invoice_status,
    updated_at = TIMEZONE('UTC', NOW())
  RETURNING * INTO v_next_cycle;

  v_invoice_number := 'TO-' || TO_CHAR(v_next_cycle.cycle_start, 'YYYYMMDD') || '-' || LEFT(REPLACE(v_next_cycle.id::TEXT, '-', ''), 8);

  INSERT INTO public.operator_membership_invoices (
    billing_cycle_id,
    operator_user_id,
    invoice_number,
    plan_name,
    membership_fee,
    prior_cycle_commission_credit,
    adjustment_applied,
    final_charge,
    due_date,
    issued_at,
    payment_status
  ) VALUES (
    v_next_cycle.id,
    p_operator_user_id,
    v_invoice_number,
    INITCAP(v_profile.membership_tier_code::TEXT),
    v_next_cycle.membership_fee,
    v_next_cycle.prior_cycle_commission_credit,
    v_next_cycle.adjustment_applied,
    v_next_cycle.final_membership_charge,
    v_next_cycle.cycle_start,
    TIMEZONE('UTC', NOW()),
    CASE WHEN v_next_cycle.final_membership_charge = 0 THEN 'waived'::public.invoice_status_enum ELSE 'issued'::public.invoice_status_enum END
  )
  ON CONFLICT (billing_cycle_id) DO UPDATE SET
    invoice_number = EXCLUDED.invoice_number,
    plan_name = EXCLUDED.plan_name,
    membership_fee = EXCLUDED.membership_fee,
    prior_cycle_commission_credit = EXCLUDED.prior_cycle_commission_credit,
    adjustment_applied = EXCLUDED.adjustment_applied,
    final_charge = EXCLUDED.final_charge,
    due_date = EXCLUDED.due_date,
    issued_at = EXCLUDED.issued_at,
    payment_status = EXCLUDED.payment_status,
    updated_at = TIMEZONE('UTC', NOW());

  RETURN v_next_cycle;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_close_operator_billing_cycle(UUID, DATE) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.run_due_operator_billing_cycles(
  p_as_of_date DATE DEFAULT (TIMEZONE('UTC', NOW()))::DATE,
  p_operator_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  billing_cycle_id UUID,
  operator_user_id UUID,
  cycle_start DATE,
  cycle_end DATE,
  invoice_status public.invoice_status_enum,
  final_membership_charge NUMERIC(12,2),
  next_billing_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_next_cycle public.operator_billing_cycles;
  v_profile_next_billing_date DATE;
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();

  FOR v_profile IN
    SELECT profile.operator_user_id
    FROM public.operator_commercial_profiles AS profile
    WHERE profile.next_billing_date <= p_as_of_date
      AND profile.membership_status IN (
        'active'::public.membership_status_enum,
        'grace_period'::public.membership_status_enum,
        'payment_due'::public.membership_status_enum,
        'overdue'::public.membership_status_enum
      )
      AND (p_operator_user_id IS NULL OR profile.operator_user_id = p_operator_user_id)
    ORDER BY profile.next_billing_date, profile.operator_user_id
  LOOP
    SELECT profile.next_billing_date
    INTO v_profile_next_billing_date
    FROM public.operator_commercial_profiles AS profile
    WHERE profile.operator_user_id = v_profile.operator_user_id;

    WHILE v_profile_next_billing_date <= p_as_of_date LOOP
      v_next_cycle := public.admin_close_operator_billing_cycle(v_profile.operator_user_id);

      billing_cycle_id := v_next_cycle.id;
      operator_user_id := v_next_cycle.operator_user_id;
      cycle_start := v_next_cycle.cycle_start;
      cycle_end := v_next_cycle.cycle_end;
      invoice_status := v_next_cycle.invoice_status;
      final_membership_charge := v_next_cycle.final_membership_charge;

      SELECT profile.next_billing_date
      INTO next_billing_date
      FROM public.operator_commercial_profiles AS profile
      WHERE profile.operator_user_id = v_next_cycle.operator_user_id;

      v_profile_next_billing_date := next_billing_date;

      RETURN NEXT;
    END LOOP;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_due_operator_billing_cycles(DATE, UUID) TO authenticated, service_role;

COMMIT;