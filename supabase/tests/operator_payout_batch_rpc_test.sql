-- =============================================================================
-- Operator Payout Batch RPC Integration Tests — Plain SQL (no pgTAP required)
-- Run directly in Supabase Studio SQL editor or via psql.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _payout_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _payout_ids(key)
VALUES
  ('operator'),
  ('traveler_a'),
  ('traveler_b'),
  ('tour'),
  ('schedule_a'),
  ('schedule_b'),
  ('booking_a'),
  ('booking_b');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _payout_ids
WHERE key IN ('operator', 'traveler_a', 'traveler_b');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _payout_ids
WHERE key IN ('operator', 'traveler_a', 'traveler_b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _payout_ids WHERE key = 'traveler_a'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _payout_ids WHERE key = 'traveler_b'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _payout_ids WHERE key = 'operator'), 'Payout Test Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _payout_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _payout_ids WHERE key = 'operator'));

UPDATE public.operator_commercial_profiles
SET
  operational_status = 'active'::public.operator_operational_status_enum,
  kyc_status = 'approved'::public.commercial_kyc_status_enum,
  membership_tier_code = 'gold'::public.membership_tier_code_enum,
  membership_status = 'active'::public.membership_status_enum,
  commission_rate = 20,
  monthly_membership_fee = 30000,
  billing_cycle_anchor_day = 1,
  current_cycle_start = CURRENT_DATE - 30,
  current_cycle_end = CURRENT_DATE,
  next_billing_date = CURRENT_DATE + 1,
  payout_hold = FALSE,
  monthly_published_tours_count = 0,
  ai_credits_used_current_cycle = 0,
  feature_overrides = '{}'::JSONB
WHERE operator_user_id = (SELECT val FROM _payout_ids WHERE key = 'operator');

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
  (SELECT val FROM _payout_ids WHERE key = 'tour'),
  (SELECT val FROM _payout_ids WHERE key = 'operator'),
  'Payout Integration Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '2 days',
  10000,
  'PKR',
  'Integration test tour',
  TRUE,
  TRUE
);

INSERT INTO public.tour_schedules (id, tour_id, start_time, end_time, capacity, booked_count, status)
VALUES
  (
    (SELECT val FROM _payout_ids WHERE key = 'schedule_a'),
    (SELECT val FROM _payout_ids WHERE key = 'tour'),
    TIMEZONE('UTC', NOW()) - INTERVAL '7 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '6 days',
    10,
    1,
    'completed'
  ),
  (
    (SELECT val FROM _payout_ids WHERE key = 'schedule_b'),
    (SELECT val FROM _payout_ids WHERE key = 'tour'),
    TIMEZONE('UTC', NOW()) - INTERVAL '5 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '4 days',
    10,
    1,
    'completed'
  );

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
    (SELECT val FROM _payout_ids WHERE key = 'booking_a'),
    (SELECT val FROM _payout_ids WHERE key = 'tour'),
    (SELECT val FROM _payout_ids WHERE key = 'schedule_a'),
    (SELECT val FROM _payout_ids WHERE key = 'traveler_a'),
    'completed',
    10000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '8 days',
    '{}'::JSONB,
    'paid',
    'pi_test_batch_a',
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
    (SELECT val FROM _payout_ids WHERE key = 'booking_b'),
    (SELECT val FROM _payout_ids WHERE key = 'tour'),
    (SELECT val FROM _payout_ids WHERE key = 'schedule_b'),
    (SELECT val FROM _payout_ids WHERE key = 'traveler_b'),
    'completed',
    10000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '6 days',
    '{}'::JSONB,
    'paid',
    'pi_test_batch_b',
    'full_online',
    FALSE,
    0,
    10000,
    0,
    10000,
    8000,
    'Full amount charged online.'
  );

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
  operator_receivable_estimate,
  settlement_state,
  payout_status,
  payout_available_at,
  notes
)
VALUES
  (
    (SELECT val FROM _payout_ids WHERE key = 'booking_a'),
    (SELECT val FROM _payout_ids WHERE key = 'operator'),
    (SELECT val FROM _payout_ids WHERE key = 'traveler_a'),
    'gold'::public.membership_tier_code_enum,
    'active'::public.membership_status_enum,
    10000,
    10000,
    0,
    20,
    2000,
    8000,
    'eligible_for_payout'::public.settlement_state_enum,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _payout_ids WHERE key = 'booking_b'),
    (SELECT val FROM _payout_ids WHERE key = 'operator'),
    (SELECT val FROM _payout_ids WHERE key = 'traveler_b'),
    'gold'::public.membership_tier_code_enum,
    'active'::public.membership_status_enum,
    10000,
    10000,
    0,
    20,
    2000,
    8000,
    'eligible_for_payout'::public.settlement_state_enum,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '2 days',
    '{}'::JSONB
  )
ON CONFLICT (booking_id) DO UPDATE
SET
  operator_user_id = EXCLUDED.operator_user_id,
  traveler_id = EXCLUDED.traveler_id,
  membership_tier_code = EXCLUDED.membership_tier_code,
  membership_status = EXCLUDED.membership_status,
  booking_total = EXCLUDED.booking_total,
  payment_collected = EXCLUDED.payment_collected,
  refund_amount = EXCLUDED.refund_amount,
  commission_rate = EXCLUDED.commission_rate,
  commission_amount = EXCLUDED.commission_amount,
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
  operator_receivable_estimate,
  settlement_state,
  payout_status,
  available_for_payout_at
)
VALUES
  (
    (SELECT val FROM _payout_ids WHERE key = 'operator'),
    (SELECT val FROM _payout_ids WHERE key = 'booking_a'),
    'commission_snapshot'::public.ledger_entry_type_enum,
    'gold'::public.membership_tier_code_enum,
    10000,
    20,
    2000,
    8000,
    'eligible_for_payout'::public.settlement_state_enum,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '3 days'
  ),
  (
    (SELECT val FROM _payout_ids WHERE key = 'operator'),
    (SELECT val FROM _payout_ids WHERE key = 'booking_b'),
    'commission_snapshot'::public.ledger_entry_type_enum,
    'gold'::public.membership_tier_code_enum,
    10000,
    20,
    2000,
    8000,
    'eligible_for_payout'::public.settlement_state_enum,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '2 days'
  )
ON CONFLICT (booking_id) DO UPDATE
SET
  operator_user_id = EXCLUDED.operator_user_id,
  entry_type = EXCLUDED.entry_type,
  membership_tier_code = EXCLUDED.membership_tier_code,
  booking_total = EXCLUDED.booking_total,
  commission_rate = EXCLUDED.commission_rate,
  commission_amount = EXCLUDED.commission_amount,
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
  payout_status,
  payout_due_at,
  recovery_amount
)
VALUES
  (
    (SELECT val FROM _payout_ids WHERE key = 'booking_a'),
    (SELECT val FROM _payout_ids WHERE key = 'operator'),
    10000,
    2000,
    0,
    8000,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
    0
  ),
  (
    (SELECT val FROM _payout_ids WHERE key = 'booking_b'),
    (SELECT val FROM _payout_ids WHERE key = 'operator'),
    10000,
    2000,
    0,
    8000,
    'eligible'::public.payout_status_enum,
    TIMEZONE('UTC', NOW()) - INTERVAL '2 days',
    0
  )
ON CONFLICT (booking_id) DO UPDATE
SET
  operator_user_id = EXCLUDED.operator_user_id,
  gross_amount = EXCLUDED.gross_amount,
  commission_amount = EXCLUDED.commission_amount,
  refund_amount = EXCLUDED.refund_amount,
  operator_payable_amount = EXCLUDED.operator_payable_amount,
  payout_status = EXCLUDED.payout_status,
  payout_due_at = EXCLUDED.payout_due_at,
  recovery_amount = EXCLUDED.recovery_amount;

DO $$
DECLARE
  v_batch RECORD;
  v_paid RECORD;
  v_reversed RECORD;
  v_recovery_item_id UUID;
  v_recovery RECORD;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  SELECT *
  INTO v_batch
  FROM public.create_operator_payout_batch(TIMEZONE('UTC', NOW()));

  ASSERT v_batch.batch_id IS NOT NULL,
    'FAIL: create_operator_payout_batch should create a batch';
  ASSERT v_batch.items_scheduled = 2,
    'FAIL: batch should contain both eligible payout items';
  RAISE NOTICE 'PASS: create_operator_payout_batch created % with 2 items', v_batch.batch_reference;

  PERFORM public.refresh_all_operator_payout_eligibility();

  ASSERT (
    SELECT COUNT(*)
    FROM public.operator_payout_items
    WHERE payout_batch_id = v_batch.batch_id
      AND payout_status = 'scheduled'::public.payout_status_enum
  ) = 2,
    'FAIL: eligibility refresh should preserve scheduled payout items';
  RAISE NOTICE 'PASS: refresh preserves scheduled items';

  SELECT *
  INTO v_paid
  FROM public.mark_operator_payout_batch_paid(v_batch.batch_id, TIMEZONE('UTC', NOW()));

  ASSERT v_paid.items_paid = 2,
    'FAIL: mark_operator_payout_batch_paid should pay both items';
  ASSERT (
    SELECT COUNT(*)
    FROM public.operator_payout_items
    WHERE payout_batch_id = v_batch.batch_id
      AND payout_status = 'paid'::public.payout_status_enum
  ) = 2,
    'FAIL: all items should be marked paid';
  RAISE NOTICE 'PASS: mark paid transitioned both items';

  SELECT *
  INTO v_reversed
  FROM public.reverse_operator_payout_batch(v_batch.batch_id, 'Chargeback investigation');

  ASSERT v_reversed.previous_status = 'paid'::public.payout_status_enum,
    'FAIL: reversed batch should report prior paid status';
  ASSERT v_reversed.recovery_items = 2,
    'FAIL: reversing a paid batch should put both items into recovery';
  ASSERT v_reversed.total_recovery_amount = 16000,
    'FAIL: total recovery amount should equal full operator payable total';
  ASSERT (
    SELECT COUNT(*)
    FROM public.operator_payout_items
    WHERE payout_batch_id = v_batch.batch_id
      AND payout_status = 'recovery_pending'::public.payout_status_enum
      AND recovery_amount = 8000
  ) = 2,
    'FAIL: payout items should move to recovery_pending with full recovery amount';
  RAISE NOTICE 'PASS: reverse batch created recovery obligations';

  SELECT payout_item.id
  INTO v_recovery_item_id
  FROM public.operator_payout_items AS payout_item
  WHERE payout_item.payout_batch_id = v_batch.batch_id
  ORDER BY payout_item.created_at
  LIMIT 1;

  SELECT *
  INTO v_recovery
  FROM public.resolve_operator_payout_recovery(v_recovery_item_id, 3000, 'Partial clawback received');

  ASSERT v_recovery.payout_status = 'recovery_pending'::public.payout_status_enum,
    'FAIL: partial recovery should keep payout item in recovery_pending';
  ASSERT v_recovery.remaining_recovery_amount = 5000,
    'FAIL: partial recovery should leave a remaining recovery balance';
  RAISE NOTICE 'PASS: partial recovery resolution leaves remaining balance';

  SELECT *
  INTO v_recovery
  FROM public.resolve_operator_payout_recovery(v_recovery_item_id, 5000, 'Recovery completed');

  ASSERT v_recovery.payout_status = 'reversed'::public.payout_status_enum,
    'FAIL: full recovery resolution should close the payout item as reversed';
  ASSERT v_recovery.remaining_recovery_amount = 0,
    'FAIL: final recovery should zero out the remaining recovery balance';
  ASSERT (
    SELECT payout_status
    FROM public.operator_booking_finance_snapshots
    WHERE booking_id = v_recovery.booking_id
  ) = 'reversed'::public.payout_status_enum,
    'FAIL: finance snapshot should reflect reversed after recovery closes';
  RAISE NOTICE 'PASS: recovery resolution closes payout item and snapshot';
END $$;

ROLLBACK;