BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_commission_collection_amounts(
  p_booking_total NUMERIC,
  p_payment_collected NUMERIC,
  p_refund_amount NUMERIC,
  p_commission_rate NUMERIC
)
RETURNS TABLE (
  commission_total NUMERIC(12,2),
  commission_collected NUMERIC(12,2),
  commission_remaining NUMERIC(12,2)
)
LANGUAGE sql
IMMUTABLE
AS $$
  WITH normalized AS (
    SELECT
      ROUND(GREATEST(COALESCE(p_booking_total, 0), 0), 2) AS booking_total,
      ROUND(GREATEST(COALESCE(p_payment_collected, 0), 0), 2) AS payment_collected,
      ROUND(GREATEST(COALESCE(p_refund_amount, 0), 0), 2) AS refund_amount,
      GREATEST(COALESCE(p_commission_rate, 0), 0) AS commission_rate
  ),
  computed AS (
    SELECT
      ROUND(booking_total * commission_rate / 100.0, 2) AS commission_total,
      ROUND(GREATEST(LEAST(booking_total, payment_collected - refund_amount), 0), 2) AS cash_available_for_commission
    FROM normalized
  )
  SELECT
    commission_total,
    LEAST(commission_total, cash_available_for_commission) AS commission_collected,
    ROUND(GREATEST(commission_total - LEAST(commission_total, cash_available_for_commission), 0), 2) AS commission_remaining
  FROM computed;
$$;

WITH recomputed_snapshot_commission AS (
  SELECT
    snapshot.booking_id,
    calc.commission_total,
    calc.commission_collected,
    calc.commission_remaining
  FROM public.operator_booking_finance_snapshots AS snapshot
  CROSS JOIN LATERAL public.calculate_commission_collection_amounts(
    snapshot.booking_total,
    snapshot.payment_collected,
    snapshot.refund_amount,
    snapshot.commission_rate
  ) AS calc
)
UPDATE public.operator_booking_finance_snapshots AS snapshot
SET
  commission_amount = recomputed_snapshot_commission.commission_total,
  commission_total = recomputed_snapshot_commission.commission_total,
  commission_collected = recomputed_snapshot_commission.commission_collected,
  commission_remaining = recomputed_snapshot_commission.commission_remaining,
  updated_at = TIMEZONE('UTC', NOW())
FROM recomputed_snapshot_commission
WHERE recomputed_snapshot_commission.booking_id = snapshot.booking_id;

UPDATE public.operator_commission_ledger AS ledger
SET
  commission_amount = calc.commission_total,
  commission_total = calc.commission_total,
  commission_collected = calc.commission_collected,
  commission_remaining = calc.commission_remaining,
  updated_at = TIMEZONE('UTC', NOW())
FROM public.operator_booking_finance_snapshots AS snapshot
CROSS JOIN LATERAL public.calculate_commission_collection_amounts(
  snapshot.booking_total,
  snapshot.payment_collected,
  snapshot.refund_amount,
  snapshot.commission_rate
) AS calc
WHERE snapshot.booking_id = ledger.booking_id;

COMMIT;