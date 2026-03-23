CREATE OR REPLACE FUNCTION public.inspect_tour_promotion(
  p_tour_id UUID,
  p_promo_code TEXT,
  p_booking_total NUMERIC
)
RETURNS TABLE (
  resolution_status TEXT,
  resolution_message TEXT,
  promotion_id UUID,
  title TEXT,
  code TEXT,
  owner_label TEXT,
  funding_source TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  applied_discount_value NUMERIC,
  discounted_booking_total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_user_id UUID;
  v_normalized_code TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_promo_code, ''))), '');
  v_booking_total NUMERIC(12,2) := ROUND(GREATEST(COALESCE(p_booking_total, 0), 0), 2);
  v_promotion public.operator_promotions%ROWTYPE;
  v_applied_discount NUMERIC(12,2) := 0;
BEGIN
  IF p_tour_id IS NULL OR v_normalized_code IS NULL OR v_booking_total <= 0 THEN
    RETURN QUERY
    SELECT
      'invalid'::TEXT,
      'Enter a valid promo code.'::TEXT,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::NUMERIC,
      NULL::NUMERIC,
      NULL::NUMERIC;
    RETURN;
  END IF;

  SELECT operator_id
  INTO v_operator_user_id
  FROM public.tours
  WHERE id = p_tour_id;

  IF v_operator_user_id IS NULL THEN
    RETURN QUERY
    SELECT
      'invalid'::TEXT,
      'This trip is no longer available for promo validation.'::TEXT,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::NUMERIC,
      NULL::NUMERIC,
      NULL::NUMERIC;
    RETURN;
  END IF;

  SELECT promotion.*
  INTO v_promotion
  FROM public.operator_promotions AS promotion
  WHERE promotion.operator_user_id = v_operator_user_id
    AND UPPER(BTRIM(promotion.code)) = v_normalized_code
  ORDER BY CASE WHEN promotion.applicable_tour_id = p_tour_id THEN 0 ELSE 1 END,
           promotion.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      'invalid'::TEXT,
      FORMAT('%s is not a valid promo code.', v_normalized_code),
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::NUMERIC,
      NULL::NUMERIC,
      NULL::NUMERIC;
    RETURN;
  END IF;

  IF v_promotion.applicable_tour_id IS NOT NULL AND v_promotion.applicable_tour_id <> p_tour_id THEN
    RETURN QUERY
    SELECT
      'inapplicable'::TEXT,
      FORMAT('%s is not valid for this trip.', v_normalized_code),
      v_promotion.id,
      v_promotion.title,
      UPPER(BTRIM(v_promotion.code)),
      v_promotion.owner_label,
      v_promotion.funding_source,
      v_promotion.discount_type,
      ROUND(v_promotion.discount_value, 2),
      0::NUMERIC,
      v_booking_total;
    RETURN;
  END IF;

  IF v_promotion.is_active IS DISTINCT FROM TRUE THEN
    RETURN QUERY
    SELECT
      'inactive'::TEXT,
      FORMAT('%s is currently inactive.', v_normalized_code),
      v_promotion.id,
      v_promotion.title,
      UPPER(BTRIM(v_promotion.code)),
      v_promotion.owner_label,
      v_promotion.funding_source,
      v_promotion.discount_type,
      ROUND(v_promotion.discount_value, 2),
      0::NUMERIC,
      v_booking_total;
    RETURN;
  END IF;

  IF v_promotion.starts_at IS NOT NULL AND v_promotion.starts_at > TIMEZONE('UTC', NOW()) THEN
    RETURN QUERY
    SELECT
      'not_started'::TEXT,
      FORMAT('%s is not active yet.', v_normalized_code),
      v_promotion.id,
      v_promotion.title,
      UPPER(BTRIM(v_promotion.code)),
      v_promotion.owner_label,
      v_promotion.funding_source,
      v_promotion.discount_type,
      ROUND(v_promotion.discount_value, 2),
      0::NUMERIC,
      v_booking_total;
    RETURN;
  END IF;

  IF v_promotion.ends_at IS NOT NULL AND v_promotion.ends_at < TIMEZONE('UTC', NOW()) THEN
    RETURN QUERY
    SELECT
      'expired'::TEXT,
      FORMAT('%s has expired.', v_normalized_code),
      v_promotion.id,
      v_promotion.title,
      UPPER(BTRIM(v_promotion.code)),
      v_promotion.owner_label,
      v_promotion.funding_source,
      v_promotion.discount_type,
      ROUND(v_promotion.discount_value, 2),
      0::NUMERIC,
      v_booking_total;
    RETURN;
  END IF;

  v_applied_discount := CASE
    WHEN v_promotion.discount_type = 'percentage' THEN
      LEAST(
        v_booking_total,
        COALESCE(v_promotion.max_discount_value, v_booking_total),
        ROUND(v_booking_total * v_promotion.discount_value / 100.0, 2)
      )
    ELSE LEAST(v_booking_total, ROUND(v_promotion.discount_value, 2))
  END;

  RETURN QUERY
  SELECT
    'valid'::TEXT,
    FORMAT('%s applied successfully.', v_normalized_code),
    v_promotion.id,
    v_promotion.title,
    UPPER(BTRIM(v_promotion.code)),
    v_promotion.owner_label,
    v_promotion.funding_source,
    v_promotion.discount_type,
    ROUND(v_promotion.discount_value, 2),
    ROUND(v_applied_discount, 2),
    ROUND(GREATEST(v_booking_total - v_applied_discount, 0), 2);
END;
$$;

GRANT EXECUTE ON FUNCTION public.inspect_tour_promotion(UUID, TEXT, NUMERIC) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.resolve_tour_promotion(
  p_tour_id UUID,
  p_promo_code TEXT,
  p_booking_total NUMERIC
)
RETURNS TABLE (
  promotion_id UUID,
  title TEXT,
  code TEXT,
  owner_label TEXT,
  funding_source TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  applied_discount_value NUMERIC,
  discounted_booking_total NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    inspection.promotion_id,
    inspection.title,
    inspection.code,
    inspection.owner_label,
    inspection.funding_source,
    inspection.discount_type,
    inspection.discount_value,
    inspection.applied_discount_value,
    inspection.discounted_booking_total
  FROM public.inspect_tour_promotion(p_tour_id, p_promo_code, p_booking_total) AS inspection
  WHERE inspection.resolution_status = 'valid';
$$;

GRANT EXECUTE ON FUNCTION public.resolve_tour_promotion(UUID, TEXT, NUMERIC) TO authenticated, service_role;