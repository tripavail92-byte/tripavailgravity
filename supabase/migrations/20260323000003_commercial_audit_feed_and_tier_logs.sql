BEGIN;

CREATE OR REPLACE FUNCTION public.admin_assign_operator_membership_tier(
  p_operator_user_id UUID,
  p_tier_code public.membership_tier_code_enum,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.operator_commercial_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role public.admin_role_enum;
  v_previous_tier public.membership_tier_code_enum;
  v_previous_commission_rate NUMERIC(12,2);
  v_previous_membership_fee NUMERIC(12,2);
  v_tier public.commercial_membership_tiers;
  v_row public.operator_commercial_profiles;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin authentication required';
  END IF;

  v_role := public.get_admin_role(v_admin_id);
  IF v_role NOT IN ('super_admin'::public.admin_role_enum, 'finance_admin'::public.admin_role_enum) THEN
    RAISE EXCEPTION 'Insufficient privileges to assign operator tier';
  END IF;

  PERFORM public.provision_operator_commercial_profile(p_operator_user_id);

  SELECT membership_tier_code, commission_rate, monthly_membership_fee
  INTO v_previous_tier, v_previous_commission_rate, v_previous_membership_fee
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = p_operator_user_id;

  SELECT * INTO v_tier
  FROM public.commercial_membership_tiers
  WHERE code = p_tier_code;

  UPDATE public.operator_commercial_profiles
  SET
    membership_tier_code = v_tier.code,
    commission_rate = v_tier.commission_rate,
    monthly_membership_fee = v_tier.monthly_fee,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE operator_user_id = p_operator_user_id
  RETURNING * INTO v_row;

  INSERT INTO public.operator_tier_change_log (
    operator_user_id,
    previous_tier_code,
    new_tier_code,
    changed_by,
    reason
  ) VALUES (
    p_operator_user_id,
    v_previous_tier,
    v_tier.code,
    v_admin_id,
    v_reason
  );

  PERFORM public.admin_log_action(
    'commercial_profile',
    p_operator_user_id,
    'membership_tier_changed',
    v_reason,
    jsonb_build_object(
      'previous_tier_code', v_previous_tier,
      'commission_rate', v_previous_commission_rate,
      'monthly_membership_fee', v_previous_membership_fee
    ),
    jsonb_build_object(
      'new_tier_code', v_tier.code,
      'commission_rate', v_tier.commission_rate,
      'monthly_membership_fee', v_tier.monthly_fee
    )
  );

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_operator_membership_tier(UUID, public.membership_tier_code_enum, TEXT) TO authenticated;

COMMIT;