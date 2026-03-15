BEGIN;

CREATE OR REPLACE VIEW public.admin_finance_health_v AS
WITH payout_status_totals AS (
  SELECT
    ROUND(COALESCE(SUM(COALESCE(net_operator_payable_amount, operator_payable_amount)) FILTER (WHERE payout_status = 'scheduled'::public.payout_status_enum), 0), 2) AS total_payouts_scheduled,
    ROUND(COALESCE(SUM(COALESCE(net_operator_payable_amount, operator_payable_amount)) FILTER (WHERE payout_status = 'paid'::public.payout_status_enum), 0), 2) AS total_payouts_completed,
    ROUND(COALESCE(SUM(COALESCE(net_operator_payable_amount, operator_payable_amount)) FILTER (WHERE payout_status = 'on_hold'::public.payout_status_enum), 0), 2) AS total_payouts_on_hold,
    ROUND(COALESCE(SUM(COALESCE(net_operator_payable_amount, operator_payable_amount)) FILTER (WHERE payout_status = 'eligible'::public.payout_status_enum), 0), 2) AS total_payouts_eligible_unbatched,
    ROUND(COALESCE(SUM(recovery_amount) FILTER (WHERE payout_status = 'recovery_pending'::public.payout_status_enum), 0), 2) AS total_payouts_recovery_pending,
    ROUND(COALESCE(SUM(recovery_amount), 0), 2) AS outstanding_recovery_balances
  FROM public.operator_payout_items
),
finance_summary AS (
  SELECT *
  FROM public.admin_finance_summary_v
)
SELECT
  finance_summary.total_customer_payments_collected,
  finance_summary.total_commission_earned,
  payout_status_totals.total_payouts_scheduled,
  payout_status_totals.total_payouts_completed,
  payout_status_totals.total_payouts_on_hold,
  payout_status_totals.total_payouts_eligible_unbatched,
  payout_status_totals.total_payouts_recovery_pending,
  finance_summary.total_refunds,
  payout_status_totals.outstanding_recovery_balances,
  ROUND(
    payout_status_totals.total_payouts_completed +
    payout_status_totals.total_payouts_scheduled +
    finance_summary.total_commission_earned +
    finance_summary.total_refunds +
    payout_status_totals.total_payouts_on_hold,
    2
  ) AS reconciliation_rhs,
  ROUND(
    finance_summary.total_customer_payments_collected - (
      payout_status_totals.total_payouts_completed +
      payout_status_totals.total_payouts_scheduled +
      finance_summary.total_commission_earned +
      finance_summary.total_refunds +
      payout_status_totals.total_payouts_on_hold
    ),
    2
  ) AS reconciliation_delta
FROM finance_summary
CROSS JOIN payout_status_totals;

GRANT SELECT ON public.admin_finance_health_v TO authenticated, service_role;

COMMIT;