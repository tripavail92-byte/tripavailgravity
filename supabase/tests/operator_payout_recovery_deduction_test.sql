-- =============================================================================
-- Operator Payout Recovery Deduction Test — Plain SQL (no pgTAP required)
-- Verifies future eligible payouts automatically net out outstanding recovery.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _recovery_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _recovery_ids(key)
VALUES
  ('operator'),
  ('traveler_old'),
  ('traveler_new'),
  ('tour'),
  ('schedule_old'),
  ('schedule_new'),
  ('booking_recovery'),
  ('booking_eligible');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _recovery_ids
WHERE key IN ('operator', 'traveler_old', 'traveler_new');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _recovery_ids
WHERE key IN ('operator', 'traveler_old', 'traveler_new')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _recovery_ids WHERE key = 'traveler_old'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _recovery_ids WHERE key = 'traveler_new'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _recovery_ids WHERE key = 'operator'), 'Recovery Deduction Test Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES ((SELECT val FROM _recovery_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _recovery_ids WHERE key = 'operator'));

UPDATE public.operator_commercial_profiles
SET
  operational_status = 'active'::public.operator_operational_status_enum,
  kyc_status = 'approved'::public.commercial_kyc_status_enum,
  membership_tier_code = 'gold'::public.membership_tier_code_enum,
  membership_status = 'active'::public.membership_status_enum,
  commission_rate = 20,
  monthly_membership_fee = 15000,
  payout_hold = FALSE,
  feature_overrides = '{}'::JSONB
WHERE operator_user_id = (SELECT val FROM _recovery_ids WHERE key = 'operator');

INSERT INTO public.tours (
  id,
  operator_id,
  title,
  tour_type,
  location,
  duration,
  price,
  currency,
  description,
  is_active,
  is_verified
)
VALUES (
  (SELECT val FROM _recovery_ids WHERE key = 'tour'),
  (SELECT val FROM _recovery_ids WHERE key = 'operator'),
  'Recovery Deduction Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '2 days',
  10000,
  'PKR',
  'Recovery deduction integration test tour',
  TRUE,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_schedules (id, tour_id, start_time, end_time, capacity, booked_count, status)
VALUES
  ((SELECT val FROM _recovery_ids WHERE key = 'schedule_old'), (SELECT val FROM _recovery_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) - INTERVAL '12 days', TIMEZONE('UTC', NOW()) - INTERVAL '11 days', 10, 1, 'completed'),
  ((SELECT val FROM _recovery_ids WHERE key = 'schedule_new'), (SELECT val FROM _recovery_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) - INTERVAL '4 days', TIMEZONE('UTC', NOW()) - INTERVAL '3 days', 10, 1, 'completed')
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
    (SELECT val FROM _recovery_ids WHERE key = 'booking_recovery'),
    (SELECT val FROM _recovery_ids WHERE key = 'tour'),
    (SELECT val FROM _recovery_ids WHERE key = 'schedule_old'),
    (SELECT val FROM _recovery_ids WHERE key = 'traveler_old'),
    'completed',
    10000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '13 days',
    '{}'::JSONB,
    'paid',
    'pi_test_recovery_old',
    'full_online',
    FALSE,
    0,
    10000,
    0,
    10000,
    8000,
    'Full amount charged online.'
  ),
  (
    (SELECT val FROM _recovery_ids WHERE key = 'booking_eligible'),
    (SELECT val FROM _recovery_ids WHERE key = 'tour'),
    (SELECT val FROM _recovery_ids WHERE key = 'schedule_new'),
    (SELECT val FROM _recovery_ids WHERE key = 'traveler_new'),
    'completed',
    10000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '5 days',
    '{}'::JSONB,
    'paid',
    'pi_test_recovery_new',
    'full_online',
    FALSE,
    0,
    10000,
    0,
    10000,
    8000,
    'Full amount charged online.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_booking_finance_snapshots (
  booking_id,
  operator_user_id,
  traveler_id,
  membership_tier_code,
  membership_status,
  booking_total,
  payment_collected,
  refund_amount,
  commission_rate,
  commission_amount,
  commission_total,
  commission_collected,
  commission_remaining,
  operator_receivable_estimate,
  settlement_state,
  payout_status,
  payout_available_at,
  notes
)
VALUES
  (
    (SELECT val FROM _recovery_ids WHERE key = 'booking_recovery'),
    (SELECT val FROM _recovery_ids WHERE key = 'operator'),
    (SELECT val FROM _recovery_ids WHERE key = 'traveler_old'),
    'gold'::public.membership_tier_code_enum,
    'active'::public.membership_status_enum,
    10000,
    10000,
    0,
    20,
    2000,
    2000,
    2000,
    0,
    8000,
    'chargeback_open'::public.settlement_state_enum,
    'recovery_pending'::public.payout_status_enum,
    NULL,
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _recovery_ids WHERE key = 'booking_eligible'),
    (SELECT val FROM _recovery_ids WHERE key = 'operator'),
    (SELECT val FROM _recovery_ids WHERE key = 'traveler_new'),
    'gold'::public.membership_tier_code_enum,
    'active'::public.membership_status_enum,
    10000,
    10000,
    0,
    20,
    2000,
    2000,
    2000,
    0,
    8000,
    'eligible_for_payout'::public.settlement_state_enum,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '2 days',
    '{}'::JSONB
  )
ON CONFLICT (booking_id) DO UPDATE SET
  operator_user_id = EXCLUDED.operator_user_id,
  traveler_id = EXCLUDED.traveler_id,
  membership_tier_code = EXCLUDED.membership_tier_code,
  membership_status = EXCLUDED.membership_status,
  booking_total = EXCLUDED.booking_total,
  payment_collected = EXCLUDED.payment_collected,
  refund_amount = EXCLUDED.refund_amount,
  commission_rate = EXCLUDED.commission_rate,
  commission_amount = EXCLUDED.commission_amount,
  commission_total = EXCLUDED.commission_total,
  commission_collected = EXCLUDED.commission_collected,
  commission_remaining = EXCLUDED.commission_remaining,
  operator_receivable_estimate = EXCLUDED.operator_receivable_estimate,
  settlement_state = EXCLUDED.settlement_state,
  payout_status = EXCLUDED.payout_status,
  payout_available_at = EXCLUDED.payout_available_at,
  notes = EXCLUDED.notes;

INSERT INTO public.operator_commission_ledger (
  operator_user_id,
  booking_id,
  entry_type,
  membership_tier_code,
  booking_total,
  commission_rate,
  commission_amount,
  commission_total,
  commission_collected,
  commission_remaining,
  operator_receivable_estimate,
  settlement_state,
  payout_status,
  available_for_payout_at
)
VALUES
  (
    (SELECT val FROM _recovery_ids WHERE key = 'operator'),
    (SELECT val FROM _recovery_ids WHERE key = 'booking_recovery'),
    'commission_snapshot'::public.ledger_entry_type_enum,
    'gold'::public.membership_tier_code_enum,
    10000,
    20,
    2000,
    2000,
    2000,
    0,
    8000,
    'chargeback_open'::public.settlement_state_enum,
    'recovery_pending'::public.payout_status_enum,
    NULL
  ),
  (
    (SELECT val FROM _recovery_ids WHERE key = 'operator'),
    (SELECT val FROM _recovery_ids WHERE key = 'booking_eligible'),
    'commission_snapshot'::public.ledger_entry_type_enum,
    'gold'::public.membership_tier_code_enum,
    10000,
    20,
    2000,
    2000,
    2000,
    0,
    8000,
    'eligible_for_payout'::public.settlement_state_enum,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '2 days'
  )
ON CONFLICT (booking_id) DO UPDATE SET
  operator_user_id = EXCLUDED.operator_user_id,
  entry_type = EXCLUDED.entry_type,
  membership_tier_code = EXCLUDED.membership_tier_code,
  booking_total = EXCLUDED.booking_total,
  commission_rate = EXCLUDED.commission_rate,
  commission_amount = EXCLUDED.commission_amount,
  commission_total = EXCLUDED.commission_total,
  commission_collected = EXCLUDED.commission_collected,
  commission_remaining = EXCLUDED.commission_remaining,
  operator_receivable_estimate = EXCLUDED.operator_receivable_estimate,
  settlement_state = EXCLUDED.settlement_state,
  payout_status = EXCLUDED.payout_status,
  available_for_payout_at = EXCLUDED.available_for_payout_at;

INSERT INTO public.operator_payout_items (
  booking_id,
  operator_user_id,
  gross_amount,
  commission_amount,
  refund_amount,
  operator_payable_amount,
  net_operator_payable_amount,
  recovery_deduction_amount,
  payout_status,
  payout_due_at,
  recovery_amount
)
VALUES
  (
    (SELECT val FROM _recovery_ids WHERE key = 'booking_recovery'),
    (SELECT val FROM _recovery_ids WHERE key = 'operator'),
    10000,
    2000,
    0,
    8000,
    8000,
    0,
    'recovery_pending'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '8 days',
    6000
  ),
  (
    (SELECT val FROM _recovery_ids WHERE key = 'booking_eligible'),
    (SELECT val FROM _recovery_ids WHERE key = 'operator'),
    10000,
    2000,
    0,
    8000,
    8000,
    0,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '2 days',
    0
  )
ON CONFLICT (booking_id) DO UPDATE SET
  operator_user_id = EXCLUDED.operator_user_id,
  gross_amount = EXCLUDED.gross_amount,
  commission_amount = EXCLUDED.commission_amount,
  refund_amount = EXCLUDED.refund_amount,
  operator_payable_amount = EXCLUDED.operator_payable_amount,
  net_operator_payable_amount = EXCLUDED.net_operator_payable_amount,
  recovery_deduction_amount = EXCLUDED.recovery_deduction_amount,
  payout_status = EXCLUDED.payout_status,
  payout_due_at = EXCLUDED.payout_due_at,
  recovery_amount = EXCLUDED.recovery_amount;

DO $$
DECLARE
  v_batch RECORD;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  SELECT *
  INTO v_batch
  FROM public.create_operator_payout_batch(TIMEZONE('UTC', NOW()));

  ASSERT v_batch.batch_id IS NOT NULL,
    'FAIL: create_operator_payout_batch should create a batch when one eligible item exists';
  ASSERT v_batch.items_scheduled = 1,
    'FAIL: only the eligible payout item should be scheduled';
  ASSERT v_batch.total_recovery_deduction_amount = 6000,
    'FAIL: batch should deduct the full outstanding recovery balance first';
  ASSERT v_batch.total_operator_payable = 2000,
    'FAIL: net operator payout should equal original payable less recovery deduction';

  ASSERT (
    SELECT recovery_deduction_amount
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _recovery_ids WHERE key = 'booking_eligible')
  ) = 6000,
    'FAIL: eligible payout item should record the applied recovery deduction';

  ASSERT (
    SELECT net_operator_payable_amount
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _recovery_ids WHERE key = 'booking_eligible')
  ) = 2000,
    'FAIL: eligible payout item should persist the net operator payable amount';

  ASSERT (
    SELECT recovery_amount
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _recovery_ids WHERE key = 'booking_recovery')
  ) = 0,
    'FAIL: recovery item should be fully settled by the automatic deduction';

  ASSERT (
    SELECT payout_status
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _recovery_ids WHERE key = 'booking_recovery')
  ) = 'reversed'::public.payout_status_enum,
    'FAIL: fully recovered recovery items should close as reversed';

  RAISE NOTICE 'PASS: future payout batches automatically deduct outstanding recovery balances';
END $$;

ROLLBACK;