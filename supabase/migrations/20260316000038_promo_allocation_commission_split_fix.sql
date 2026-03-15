BEGIN;

CREATE OR REPLACE FUNCTION public.sync_operator_booking_commission_split()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_funding_source TEXT;
  v_promo_discount_value NUMERIC(12,2) := 0;
  v_price_before_promo NUMERIC(12,2);
  v_commission_basis_total NUMERIC(12,2);
  v_commission_total NUMERIC(12,2);
  v_commission_cash_available NUMERIC(12,2);
BEGIN
  v_promo_funding_source := NULLIF(BTRIM(COALESCE(NEW.promo_funding_source, NEW.notes->>'promo_funding_source', '')), '');
  v_promo_discount_value := CASE
    WHEN COALESCE(NEW.promo_discount_value, 0) > 0 THEN ROUND(NEW.promo_discount_value, 2)
    WHEN COALESCE(NEW.notes->>'promo_discount_value', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN ROUND((NEW.notes->>'promo_discount_value')::NUMERIC, 2)
    ELSE 0::NUMERIC
  END;
  v_price_before_promo := CASE
    WHEN COALESCE(NEW.notes->>'price_before_promo', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN ROUND((NEW.notes->>'price_before_promo')::NUMERIC, 2)
    ELSE ROUND(COALESCE(NEW.booking_total, 0), 2)
  END;

  v_commission_basis_total := CASE
    WHEN v_promo_funding_source = 'platform' AND v_promo_discount_value > 0
      THEN GREATEST(v_price_before_promo, ROUND(COALESCE(NEW.booking_total, 0), 2))
    ELSE ROUND(COALESCE(NEW.booking_total, 0), 2)
  END;

  v_commission_total := ROUND(v_commission_basis_total * GREATEST(COALESCE(NEW.commission_rate, 0), 0) / 100.0, 2);

  IF v_promo_funding_source = 'platform' AND v_promo_discount_value > 0 THEN
    v_commission_total := GREATEST(ROUND(v_commission_total - LEAST(v_promo_discount_value, v_commission_total), 2), 0);
  END IF;

  v_commission_cash_available := ROUND(GREATEST(COALESCE(NEW.payment_collected, 0) - COALESCE(NEW.refund_amount, 0), 0), 2);

  NEW.commission_amount := v_commission_total;
  NEW.commission_total := v_commission_total;
  NEW.commission_collected := LEAST(v_commission_total, v_commission_cash_available);
  NEW.commission_remaining := ROUND(GREATEST(v_commission_total - NEW.commission_collected, 0), 2);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_operator_commission_ledger_split()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot public.operator_booking_finance_snapshots%ROWTYPE;
  v_promo_funding_source TEXT;
  v_promo_discount_value NUMERIC(12,2) := 0;
  v_price_before_promo NUMERIC(12,2);
  v_commission_basis_total NUMERIC(12,2);
  v_commission_total NUMERIC(12,2);
  v_commission_cash_available NUMERIC(12,2);
BEGIN
  IF NEW.booking_id IS NOT NULL THEN
    SELECT *
    INTO v_snapshot
    FROM public.operator_booking_finance_snapshots
    WHERE booking_id = NEW.booking_id;
  END IF;

  v_promo_funding_source := NULLIF(BTRIM(COALESCE(v_snapshot.promo_funding_source, v_snapshot.notes->>'promo_funding_source', '')), '');
  v_promo_discount_value := CASE
    WHEN COALESCE(v_snapshot.promo_discount_value, 0) > 0 THEN ROUND(v_snapshot.promo_discount_value, 2)
    WHEN COALESCE(v_snapshot.notes->>'promo_discount_value', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN ROUND((v_snapshot.notes->>'promo_discount_value')::NUMERIC, 2)
    ELSE 0::NUMERIC
  END;
  v_price_before_promo := CASE
    WHEN COALESCE(v_snapshot.notes->>'price_before_promo', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN ROUND((v_snapshot.notes->>'price_before_promo')::NUMERIC, 2)
    ELSE ROUND(COALESCE(v_snapshot.booking_total, NEW.booking_total, 0), 2)
  END;

  v_commission_basis_total := CASE
    WHEN v_promo_funding_source = 'platform' AND v_promo_discount_value > 0
      THEN GREATEST(v_price_before_promo, ROUND(COALESCE(v_snapshot.booking_total, NEW.booking_total, 0), 2))
    ELSE ROUND(COALESCE(v_snapshot.booking_total, NEW.booking_total, 0), 2)
  END;

  v_commission_total := ROUND(v_commission_basis_total * GREATEST(COALESCE(NEW.commission_rate, 0), 0) / 100.0, 2);

  IF v_promo_funding_source = 'platform' AND v_promo_discount_value > 0 THEN
    v_commission_total := GREATEST(ROUND(v_commission_total - LEAST(v_promo_discount_value, v_commission_total), 2), 0);
  END IF;

  v_commission_cash_available := ROUND(
    GREATEST(COALESCE(v_snapshot.payment_collected, NEW.booking_total, 0) - COALESCE(v_snapshot.refund_amount, 0), 0),
    2
  );

  NEW.commission_amount := v_commission_total;
  NEW.commission_total := v_commission_total;
  NEW.commission_collected := LEAST(v_commission_total, v_commission_cash_available);
  NEW.commission_remaining := ROUND(GREATEST(v_commission_total - NEW.commission_collected, 0), 2);

  RETURN NEW;
END;
$$;

COMMIT;