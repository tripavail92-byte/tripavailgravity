-- =============================================================================
-- Operator Finance Safeguards Phase 1 Tests — Plain SQL (no pgTAP required)
-- Covers commission collection splits and operator-fault cancellation penalties.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _phase1_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _phase1_ids(key)
VALUES
  ('operator'),
  ('traveler_a'),
  ('traveler_b'),
  ('traveler_c'),
  ('tour'),
  ('schedule_a'),
  ('schedule_b'),
  ('schedule_c'),
  ('booking_deposit'),
  ('booking_cancel_a'),
  ('booking_cancel_b'),
  ('booking_cancel_c');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _phase1_ids
WHERE key IN ('operator', 'traveler_a', 'traveler_b', 'traveler_c');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _phase1_ids
WHERE key IN ('operator', 'traveler_a', 'traveler_b', 'traveler_c')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _phase1_ids WHERE key = 'traveler_a'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _phase1_ids WHERE key = 'traveler_b'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _phase1_ids WHERE key = 'traveler_c'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _phase1_ids WHERE key = 'operator'), 'Finance Safeguard Test Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _phase1_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _phase1_ids WHERE key = 'operator'));

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
  operator_fault_cancellation_count = 0,
  cancellation_penalty_active = FALSE,
  feature_overrides = '{}'::JSONB
WHERE operator_user_id = (SELECT val FROM _phase1_ids WHERE key = 'operator');

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
  (SELECT val FROM _phase1_ids WHERE key = 'tour'),
  (SELECT val FROM _phase1_ids WHERE key = 'operator'),
  'Finance Safeguards Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '3 days',
  50000,
  50000,
  'PKR',
  'Phase 1 safeguard test tour',
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
  ((SELECT val FROM _phase1_ids WHERE key = 'schedule_a'), (SELECT val FROM _phase1_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) - INTERVAL '9 days', TIMEZONE('UTC', NOW()) - INTERVAL '8 days', 10, 1, 'completed'),
  ((SELECT val FROM _phase1_ids WHERE key = 'schedule_b'), (SELECT val FROM _phase1_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) - INTERVAL '7 days', TIMEZONE('UTC', NOW()) - INTERVAL '6 days', 10, 1, 'completed'),
  ((SELECT val FROM _phase1_ids WHERE key = 'schedule_c'), (SELECT val FROM _phase1_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) - INTERVAL '5 days', TIMEZONE('UTC', NOW()) - INTERVAL '4 days', 10, 1, 'completed')
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
    (SELECT val FROM _phase1_ids WHERE key = 'booking_deposit'),
    (SELECT val FROM _phase1_ids WHERE key = 'tour'),
    (SELECT val FROM _phase1_ids WHERE key = 'schedule_a'),
    (SELECT val FROM _phase1_ids WHERE key = 'traveler_a'),
    'completed',
    50000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '10 days',
    '{}'::JSONB,
    'balance_pending',
    'pi_test_phase1_deposit',
    'partial_online',
    TRUE,
    20,
    10000,
    40000,
    10000,
    40000,
    '20 percent deposit collected online.'
  ),
  (
    (SELECT val FROM _phase1_ids WHERE key = 'booking_cancel_a'),
    (SELECT val FROM _phase1_ids WHERE key = 'tour'),
    (SELECT val FROM _phase1_ids WHERE key = 'schedule_a'),
    (SELECT val FROM _phase1_ids WHERE key = 'traveler_a'),
    'confirmed',
    30000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '8 days',
    '{}'::JSONB,
    'paid',
    'pi_test_phase1_cancel_a',
    'full_online',
    FALSE,
    0,
    30000,
    0,
    30000,
    24000,
    'Full amount charged online.'
  ),
  (
    (SELECT val FROM _phase1_ids WHERE key = 'booking_cancel_b'),
    (SELECT val FROM _phase1_ids WHERE key = 'tour'),
    (SELECT val FROM _phase1_ids WHERE key = 'schedule_b'),
    (SELECT val FROM _phase1_ids WHERE key = 'traveler_b'),
    'confirmed',
    30000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '6 days',
    '{}'::JSONB,
    'paid',
    'pi_test_phase1_cancel_b',
    'full_online',
    FALSE,
    0,
    30000,
    0,
    30000,
    24000,
    'Full amount charged online.'
  ),
  (
    (SELECT val FROM _phase1_ids WHERE key = 'booking_cancel_c'),
    (SELECT val FROM _phase1_ids WHERE key = 'tour'),
    (SELECT val FROM _phase1_ids WHERE key = 'schedule_c'),
    (SELECT val FROM _phase1_ids WHERE key = 'traveler_c'),
    'confirmed',
    30000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '4 days',
    '{}'::JSONB,
    'paid',
    'pi_test_phase1_cancel_c',
    'full_online',
    FALSE,
    0,
    30000,
    0,
    30000,
    24000,
    'Full amount charged online.'
  )
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_snapshot RECORD;
  v_profile RECORD;
BEGIN
  SELECT
    commission_total,
    commission_collected,
    commission_remaining,
    deposit_required,
    deposit_percentage,
    payment_collected
  INTO v_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _phase1_ids WHERE key = 'booking_deposit');

  ASSERT v_snapshot.deposit_required = TRUE,
    'FAIL: deposit booking should persist deposit_required';
  ASSERT v_snapshot.deposit_percentage = 20,
    'FAIL: deposit booking should persist deposit_percentage';
  ASSERT v_snapshot.payment_collected = 10000,
    'FAIL: deposit booking should persist payment_collected';
  ASSERT v_snapshot.commission_total = 10000,
    'FAIL: commission_total should be 10000 for a 50000 booking at 20 percent';
  ASSERT v_snapshot.commission_collected = 10000,
    'FAIL: commission_collected should consume the full 10000 deposit before any commission remains outstanding';
  ASSERT v_snapshot.commission_remaining = 0,
    'FAIL: commission_remaining should be 0 when the collected deposit fully covers the commission';
  RAISE NOTICE 'PASS: deposit booking commission split persisted correctly';

  UPDATE public.tour_bookings
  SET
    status = 'cancelled',
    metadata = jsonb_build_object(
      'operator_last_action', 'cancel',
      'operator_last_action_at', TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
      'operator_last_action_by', (SELECT val FROM _phase1_ids WHERE key = 'operator'),
      'operator_last_action_reason', 'Vehicle unavailable'
    )
  WHERE id = (SELECT val FROM _phase1_ids WHERE key = 'booking_cancel_a');

  UPDATE public.tour_bookings
  SET
    status = 'cancelled',
    metadata = jsonb_build_object(
      'operator_last_action', 'cancel',
      'operator_last_action_at', TIMEZONE('UTC', NOW()) - INTERVAL '2 days',
      'operator_last_action_by', (SELECT val FROM _phase1_ids WHERE key = 'operator'),
      'operator_last_action_reason', 'Guide unavailable'
    )
  WHERE id = (SELECT val FROM _phase1_ids WHERE key = 'booking_cancel_b');

  UPDATE public.tour_bookings
  SET
    status = 'cancelled',
    metadata = jsonb_build_object(
      'operator_last_action', 'cancel',
      'operator_last_action_at', TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
      'operator_last_action_by', (SELECT val FROM _phase1_ids WHERE key = 'operator'),
      'operator_last_action_reason', 'Operational disruption'
    )
  WHERE id = (SELECT val FROM _phase1_ids WHERE key = 'booking_cancel_c');

  SELECT
    operator_fault_cancellation_count,
    cancellation_penalty_active,
    payout_hold,
    payout_hold_reason,
    operational_status
  INTO v_profile
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = (SELECT val FROM _phase1_ids WHERE key = 'operator');

  ASSERT v_profile.operator_fault_cancellation_count = 3,
    'FAIL: operator should have 3 recent operator-fault cancellations';
  ASSERT v_profile.cancellation_penalty_active = TRUE,
    'FAIL: cancellation penalty should activate at the third operator-fault cancellation';
  ASSERT v_profile.payout_hold = TRUE,
    'FAIL: payout hold should activate when cancellation penalty is active';
  ASSERT v_profile.payout_hold_reason = 'Automatic payout hold after 3 operator-fault cancellations in 30 days',
    'FAIL: payout hold reason should explain the automatic cancellation safeguard';
  ASSERT v_profile.operational_status = 'restricted'::public.operator_operational_status_enum,
    'FAIL: operator should become restricted after hitting the cancellation threshold';
  RAISE NOTICE 'PASS: operator cancellation safeguard activated after 3 operator-fault cancellations';
END
$$;

ROLLBACK;