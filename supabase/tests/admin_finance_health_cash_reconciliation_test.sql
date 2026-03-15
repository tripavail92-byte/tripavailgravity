-- =============================================================================
-- Admin Finance Health Cash Reconciliation Test — Plain SQL (no pgTAP required)
-- Verifies reconciliation uses collected cash, not accrual-only commission or
-- full off-platform operator balances for partial-online bookings.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _finance_health_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _finance_health_ids(key)
VALUES
  ('operator'),
  ('traveler_full'),
  ('traveler_deposit'),
  ('tour'),
  ('schedule_full'),
  ('schedule_deposit'),
  ('booking_full_online'),
  ('booking_deposit_online');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _finance_health_ids
WHERE key IN ('operator', 'traveler_full', 'traveler_deposit');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _finance_health_ids
WHERE key IN ('operator', 'traveler_full', 'traveler_deposit')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _finance_health_ids WHERE key = 'traveler_full'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _finance_health_ids WHERE key = 'traveler_deposit'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _finance_health_ids WHERE key = 'operator'), 'Finance Health Test Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES ((SELECT val FROM _finance_health_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _finance_health_ids WHERE key = 'operator'));

UPDATE public.operator_commercial_profiles
SET
  operational_status = 'active'::public.operator_operational_status_enum,
  kyc_status = 'approved'::public.commercial_kyc_status_enum,
  membership_tier_code = 'gold'::public.membership_tier_code_enum,
  membership_status = 'active'::public.membership_status_enum,
  commission_rate = 20,
  monthly_membership_fee = 15000,
  payout_hold = FALSE,
  payout_hold_reason = NULL,
  feature_overrides = '{}'::JSONB
WHERE operator_user_id = (SELECT val FROM _finance_health_ids WHERE key = 'operator');

INSERT INTO public.tours (
  id,
  operator_id,
  title,
  tour_type,
  location,
  duration,
  price,
  base_price,
  currency,
  description,
  require_deposit,
  deposit_required,
  deposit_percentage,
  cancellation_policy,
  cancellation_policy_type,
  included,
  excluded,
  inclusions,
  exclusions,
  images,
  highlights,
  requirements,
  languages,
  min_participants,
  max_participants,
  min_age,
  max_age,
  difficulty_level,
  is_active,
  is_verified
)
VALUES (
  (SELECT val FROM _finance_health_ids WHERE key = 'tour'),
  (SELECT val FROM _finance_health_ids WHERE key = 'operator'),
  'Finance Health Reconciliation Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '2 days',
  50000,
  50000,
  'PKR',
  'Finance health cash reconciliation test tour',
  TRUE,
  TRUE,
  20,
  'moderate',
  'moderate'::public.cancellation_policy_type_enum,
  '{}'::TEXT[],
  '{}'::TEXT[],
  '{}'::TEXT[],
  '{}'::TEXT[],
  '[]'::JSONB,
  '{}'::TEXT[],
  '{}'::TEXT[],
  ARRAY['en'],
  1,
  10,
  5,
  80,
  'moderate',
  TRUE,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_schedules (id, tour_id, start_time, end_time, capacity, booked_count, status)
VALUES
  ((SELECT val FROM _finance_health_ids WHERE key = 'schedule_full'), (SELECT val FROM _finance_health_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) + INTERVAL '7 days', TIMEZONE('UTC', NOW()) + INTERVAL '8 days', 10, 1, 'scheduled'),
  ((SELECT val FROM _finance_health_ids WHERE key = 'schedule_deposit'), (SELECT val FROM _finance_health_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) - INTERVAL '5 days', TIMEZONE('UTC', NOW()) - INTERVAL '4 days', 10, 1, 'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_bookings (
  id,
  tour_id,
  schedule_id,
  traveler_id,
  status,
  total_price,
  pax_count,
  booking_date,
  metadata,
  payment_status,
  stripe_payment_intent_id,
  payment_collection_mode,
  deposit_required,
  deposit_percentage,
  upfront_amount,
  remaining_amount,
  amount_paid_online,
  amount_due_to_operator,
  payment_policy_text
)
VALUES
  (
    (SELECT val FROM _finance_health_ids WHERE key = 'booking_full_online'),
    (SELECT val FROM _finance_health_ids WHERE key = 'tour'),
    (SELECT val FROM _finance_health_ids WHERE key = 'schedule_full'),
    (SELECT val FROM _finance_health_ids WHERE key = 'traveler_full'),
    'confirmed',
    30000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
    '{}'::JSONB,
    'paid',
    'pi_test_finance_health_full',
    'full_online',
    FALSE,
    0,
    30000,
    0,
    30000,
    0,
    'Full amount charged online.'
  ),
  (
    (SELECT val FROM _finance_health_ids WHERE key = 'booking_deposit_online'),
    (SELECT val FROM _finance_health_ids WHERE key = 'tour'),
    (SELECT val FROM _finance_health_ids WHERE key = 'schedule_deposit'),
    (SELECT val FROM _finance_health_ids WHERE key = 'traveler_deposit'),
    'completed',
    50000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '6 days',
    '{}'::JSONB,
    'balance_pending',
    'pi_test_finance_health_deposit',
    'partial_online',
    TRUE,
    20,
    10000,
    40000,
    10000,
    40000,
    '20 percent deposit collected online. Remaining balance paid directly to the operator.'
  )
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_fixture RECORD;
  v_view RECORD;
  v_manual RECORD;
BEGIN
  SELECT
    ROUND(COALESCE(SUM(payment_collected), 0), 2) AS total_customer_payments_collected,
    ROUND(COALESCE(SUM(commission_amount), 0), 2) AS total_commission_earned,
    ROUND(COALESCE(SUM(COALESCE(commission_collected, commission_amount)), 0), 2) AS total_commission_collected,
    ROUND(COALESCE(SUM(COALESCE(commission_remaining, 0)), 0), 2) AS total_commission_remaining,
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
    ) AS total_payouts_eligible_unbatched
  INTO v_fixture
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id IN (
    (SELECT val FROM _finance_health_ids WHERE key = 'booking_full_online'),
    (SELECT val FROM _finance_health_ids WHERE key = 'booking_deposit_online')
  );

  ASSERT v_fixture.total_customer_payments_collected = 40000,
    'FAIL: fixtures should contribute only collected marketplace cash';
  ASSERT v_fixture.total_commission_earned = 16000,
    'FAIL: fixtures should keep the full commission accrual';
  ASSERT v_fixture.total_commission_collected = 16000,
    'FAIL: fixtures should collect commission from marketplace cash first until the full fee has been satisfied';
  ASSERT v_fixture.total_commission_remaining = 0,
    'FAIL: fixtures should have no remaining commission when the deposit fully covers the fee due';
  ASSERT v_fixture.total_operator_liability_not_ready = 24000,
    'FAIL: not-ready operator liability should exclude deposit cash already consumed by platform commission';
  ASSERT v_fixture.total_payouts_eligible_unbatched = 0,
    'FAIL: deposit fixtures should not create eligible cash liability before payment settlement is complete';

  SELECT
    total_customer_payments_collected,
    total_commission_earned,
    total_commission_collected,
    total_commission_remaining,
    total_operator_liability_not_ready,
    total_payouts_eligible_unbatched,
    total_payouts_scheduled,
    total_payouts_completed,
    total_payouts_on_hold,
    total_refunds,
    reconciliation_rhs,
    reconciliation_delta
  INTO v_view
  FROM public.admin_finance_health_v;

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
  INTO v_manual
  FROM snapshot_cash_metrics
  CROSS JOIN snapshot_cash_buckets
  CROSS JOIN recovery_metrics;

  ASSERT v_view.total_customer_payments_collected = v_manual.total_customer_payments_collected,
    'FAIL: finance health view customer payments must match manual cash aggregation';
  ASSERT v_view.total_commission_earned = v_manual.total_commission_earned,
    'FAIL: finance health view commission accrued must match manual aggregation';
  ASSERT v_view.total_commission_collected = v_manual.total_commission_collected,
    'FAIL: finance health view commission collected must match manual aggregation';
  ASSERT v_view.total_commission_remaining = v_manual.total_commission_remaining,
    'FAIL: finance health view commission remaining must match manual aggregation';
  ASSERT v_view.total_operator_liability_not_ready = v_manual.total_operator_liability_not_ready,
    'FAIL: finance health view not-ready operator liability must match manual aggregation';
  ASSERT v_view.total_payouts_eligible_unbatched = v_manual.total_payouts_eligible_unbatched,
    'FAIL: finance health view eligible payout bucket must match manual aggregation';
  ASSERT v_view.total_payouts_scheduled = v_manual.total_payouts_scheduled,
    'FAIL: finance health view scheduled payouts must match manual aggregation';
  ASSERT v_view.total_payouts_completed = v_manual.total_payouts_completed,
    'FAIL: finance health view completed payouts must match manual aggregation';
  ASSERT v_view.total_payouts_on_hold = v_manual.total_payouts_on_hold,
    'FAIL: finance health view on-hold payouts must match manual aggregation';
  ASSERT v_view.total_refunds = v_manual.total_refunds,
    'FAIL: finance health view refunds must match manual aggregation';
  ASSERT v_view.reconciliation_rhs = v_manual.reconciliation_rhs,
    'FAIL: finance health view RHS must match manual aggregation';
  ASSERT v_view.reconciliation_delta = v_manual.reconciliation_delta,
    'FAIL: finance health view delta must match manual aggregation';

  RAISE NOTICE 'PASS: admin finance health view reconciles collected cash correctly across full-online and deposit bookings';
END
$$;

ROLLBACK;