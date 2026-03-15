BEGIN;

DROP VIEW IF EXISTS public.admin_finance_health_v;

CREATE VIEW public.admin_finance_health_v AS
WITH snapshot_cash_metrics AS (
  SELECT
    ROUND(COALESCE(SUM(payment_collected), 0), 2) AS total_customer_payments_collected,
    ROUND(COALESCE(SUM(commission_amount), 0), 2) AS total_commission_earned,
    ROUND(COALESCE(SUM(COALESCE(commission_collected, commission_amount)), 0), 2) AS total_commission_collected,
    ROUND(
      COALESCE(
        SUM(
          COALESCE(
            commission_remaining,
            GREATEST(commission_amount - COALESCE(commission_collected, commission_amount), 0)
          )
        ),
        0
      ),
      2
    ) AS total_commission_remaining,
    ROUND(COALESCE(SUM(refund_amount), 0), 2) AS total_refunds
  FROM public.operator_booking_finance_snapshots
),
snapshot_cash_buckets AS (
  SELECT
    ROUND(
      COALESCE(
        SUM(GREATEST(payment_collected - refund_amount - COALESCE(commission_collected, commission_amount), 0))
        FILTER (WHERE payout_status = 'not_ready'::public.payout_status_enum),
        0
      ),
      2
    ) AS total_operator_liability_not_ready,
    ROUND(
      COALESCE(
        SUM(GREATEST(payment_collected - refund_amount - COALESCE(commission_collected, commission_amount), 0))
        FILTER (WHERE payout_status = 'eligible'::public.payout_status_enum),
        0
      ),
      2
    ) AS total_payouts_eligible_unbatched,
    ROUND(
      COALESCE(
        SUM(GREATEST(payment_collected - refund_amount - COALESCE(commission_collected, commission_amount), 0))
        FILTER (WHERE payout_status = 'scheduled'::public.payout_status_enum),
        0
      ),
      2
    ) AS total_payouts_scheduled,
    ROUND(
      COALESCE(
        SUM(GREATEST(payment_collected - refund_amount - COALESCE(commission_collected, commission_amount), 0))
        FILTER (WHERE payout_status = 'paid'::public.payout_status_enum),
        0
      ),
      2
    ) AS total_payouts_completed,
    ROUND(
      COALESCE(
        SUM(GREATEST(payment_collected - refund_amount - COALESCE(commission_collected, commission_amount), 0))
        FILTER (WHERE payout_status = 'on_hold'::public.payout_status_enum),
        0
      ),
      2
    ) AS total_payouts_on_hold
  FROM public.operator_booking_finance_snapshots
),
recovery_metrics AS (
  SELECT
    ROUND(COALESCE(SUM(recovery_amount) FILTER (WHERE payout_status = 'recovery_pending'::public.payout_status_enum), 0), 2) AS total_payouts_recovery_pending,
    ROUND(COALESCE(SUM(recovery_amount), 0), 2) AS outstanding_recovery_balances
  FROM public.operator_payout_items
)
SELECT
  snapshot_cash_metrics.total_customer_payments_collected,
  snapshot_cash_metrics.total_commission_earned,
  snapshot_cash_metrics.total_commission_collected,
  snapshot_cash_metrics.total_commission_remaining,
  snapshot_cash_buckets.total_operator_liability_not_ready,
  snapshot_cash_buckets.total_payouts_scheduled,
  snapshot_cash_buckets.total_payouts_completed,
  snapshot_cash_buckets.total_payouts_on_hold,
  snapshot_cash_buckets.total_payouts_eligible_unbatched,
  recovery_metrics.total_payouts_recovery_pending,
  snapshot_cash_metrics.total_refunds,
  recovery_metrics.outstanding_recovery_balances,
  ROUND(
    snapshot_cash_buckets.total_operator_liability_not_ready +
    snapshot_cash_buckets.total_payouts_completed +
    snapshot_cash_buckets.total_payouts_scheduled +
    snapshot_cash_buckets.total_payouts_on_hold +
    snapshot_cash_buckets.total_payouts_eligible_unbatched +
    snapshot_cash_metrics.total_commission_collected +
    snapshot_cash_metrics.total_refunds,
    2
  ) AS reconciliation_rhs,
  ROUND(
    snapshot_cash_metrics.total_customer_payments_collected - (
      snapshot_cash_buckets.total_operator_liability_not_ready +
      snapshot_cash_buckets.total_payouts_completed +
      snapshot_cash_buckets.total_payouts_scheduled +
      snapshot_cash_buckets.total_payouts_on_hold +
      snapshot_cash_buckets.total_payouts_eligible_unbatched +
      snapshot_cash_metrics.total_commission_collected +
      snapshot_cash_metrics.total_refunds
    ),
    2
  ) AS reconciliation_delta
FROM snapshot_cash_metrics
CROSS JOIN snapshot_cash_buckets
CROSS JOIN recovery_metrics;

GRANT SELECT ON public.admin_finance_health_v TO authenticated, service_role;

COMMIT;