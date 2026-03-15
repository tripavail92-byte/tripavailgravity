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
    RAISE EXCEPTION 'Publish limit reached for % tier. You have used % of % publish slots in the current billing cycle.',
      INITCAP(v_tier_code::TEXT),
      v_used_publish_slots,
      v_monthly_publish_limit
      USING ERRCODE = 'P0001',
            DETAIL = 'The operator has already reached the allowed tour publish limit for the active billing cycle.',
            HINT = 'Upgrade the operator tier or wait until the next billing cycle before publishing another tour.';
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
AFTER INSERT OR UPDATE OF is_published, is_active, approved_at, operator_id OR DELETE ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_publish_usage_trigger();

DO $$
DECLARE
  v_profile RECORD;
BEGIN
  FOR v_profile IN
    SELECT operator_user_id
    FROM public.operator_commercial_profiles
  LOOP
    PERFORM public.refresh_operator_publish_usage(v_profile.operator_user_id);
  END LOOP;
END;
$$;