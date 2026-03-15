-- =============================================================================
-- Operator Offline Cash Fraud Protection Test — Plain SQL (no pgTAP required)
-- Covers cancellation locks, dual completion confirmation, and explicit fraud flags.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _fraud_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _fraud_ids(key)
VALUES
  ('operator'),
  ('traveler_a'),
  ('traveler_b'),
  ('traveler_c'),
  ('traveler_d'),
  ('tour'),
  ('schedule_locked'),
  ('schedule_completed'),
  ('schedule_cancel_a'),
  ('schedule_cancel_b'),
  ('schedule_cancel_c'),
  ('booking_locked'),
  ('booking_completed'),
  ('booking_cancel_a'),
  ('booking_cancel_b'),
  ('booking_cancel_c');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _fraud_ids
WHERE key IN ('operator', 'traveler_a', 'traveler_b', 'traveler_c', 'traveler_d');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _fraud_ids
WHERE key IN ('operator', 'traveler_a', 'traveler_b', 'traveler_c', 'traveler_d')
ON CONFLICT (id) DO NOTHING;

SELECT set_config('app.fraud_operator_id', (SELECT val::TEXT FROM _fraud_ids WHERE key = 'operator'), true);
SELECT set_config('app.fraud_traveler_b_id', (SELECT val::TEXT FROM _fraud_ids WHERE key = 'traveler_b'), true);
SELECT set_config('app.fraud_booking_locked_id', (SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_locked'), true);
SELECT set_config('app.fraud_booking_completed_id', (SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_completed'), true);
SELECT set_config('app.fraud_booking_cancel_a_id', (SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_cancel_a'), true);
SELECT set_config('app.fraud_booking_cancel_b_id', (SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_cancel_b'), true);
SELECT set_config('app.fraud_booking_cancel_c_id', (SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_cancel_c'), true);

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _fraud_ids WHERE key = 'traveler_a'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _fraud_ids WHERE key = 'traveler_b'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _fraud_ids WHERE key = 'traveler_c'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _fraud_ids WHERE key = 'traveler_d'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _fraud_ids WHERE key = 'operator'), 'Offline Cash Fraud Test Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES ((SELECT val FROM _fraud_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _fraud_ids WHERE key = 'operator'));

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
  fraud_review_required = FALSE,
  fraud_review_reason = NULL,
  feature_overrides = '{}'::JSONB
WHERE operator_user_id = (SELECT val FROM _fraud_ids WHERE key = 'operator');

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
  (SELECT val FROM _fraud_ids WHERE key = 'tour'),
  (SELECT val FROM _fraud_ids WHERE key = 'operator'),
  'Offline Cash Fraud Protection Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '2 days',
  10000,
  10000,
  'PKR',
  'Fraud protection flow test tour',
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
  ((SELECT val FROM _fraud_ids WHERE key = 'schedule_locked'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) + INTERVAL '6 hours', TIMEZONE('UTC', NOW()) + INTERVAL '30 hours', 10, 1, 'scheduled'),
  ((SELECT val FROM _fraud_ids WHERE key = 'schedule_completed'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) - INTERVAL '2 days', TIMEZONE('UTC', NOW()) - INTERVAL '1 day', 10, 1, 'completed'),
  ((SELECT val FROM _fraud_ids WHERE key = 'schedule_cancel_a'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) + INTERVAL '3 days', TIMEZONE('UTC', NOW()) + INTERVAL '4 days', 10, 1, 'scheduled'),
  ((SELECT val FROM _fraud_ids WHERE key = 'schedule_cancel_b'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) + INTERVAL '5 days', TIMEZONE('UTC', NOW()) + INTERVAL '6 days', 10, 1, 'scheduled'),
  ((SELECT val FROM _fraud_ids WHERE key = 'schedule_cancel_c'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), TIMEZONE('UTC', NOW()) + INTERVAL '7 days', TIMEZONE('UTC', NOW()) + INTERVAL '8 days', 10, 1, 'scheduled')
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
  ((SELECT val FROM _fraud_ids WHERE key = 'booking_locked'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), (SELECT val FROM _fraud_ids WHERE key = 'schedule_locked'), (SELECT val FROM _fraud_ids WHERE key = 'traveler_a'), 'confirmed', 10000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '1 day', '{}'::JSONB, 'paid', 'pi_' || replace((SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_locked'), '-', ''), 'full_online', FALSE, 0, 10000, 0, 10000, 8000, 'Full amount charged online.'),
  ((SELECT val FROM _fraud_ids WHERE key = 'booking_completed'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), (SELECT val FROM _fraud_ids WHERE key = 'schedule_completed'), (SELECT val FROM _fraud_ids WHERE key = 'traveler_b'), 'confirmed', 10000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '3 days', '{}'::JSONB, 'paid', 'pi_' || replace((SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_completed'), '-', ''), 'full_online', FALSE, 0, 10000, 0, 10000, 8000, 'Full amount charged online.'),
  ((SELECT val FROM _fraud_ids WHERE key = 'booking_cancel_a'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), (SELECT val FROM _fraud_ids WHERE key = 'schedule_cancel_a'), (SELECT val FROM _fraud_ids WHERE key = 'traveler_b'), 'confirmed', 10000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '1 day', '{}'::JSONB, 'paid', 'pi_' || replace((SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_cancel_a'), '-', ''), 'full_online', FALSE, 0, 10000, 0, 10000, 8000, 'Full amount charged online.'),
  ((SELECT val FROM _fraud_ids WHERE key = 'booking_cancel_b'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), (SELECT val FROM _fraud_ids WHERE key = 'schedule_cancel_b'), (SELECT val FROM _fraud_ids WHERE key = 'traveler_c'), 'confirmed', 10000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '1 day', '{}'::JSONB, 'paid', 'pi_' || replace((SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_cancel_b'), '-', ''), 'full_online', FALSE, 0, 10000, 0, 10000, 8000, 'Full amount charged online.'),
  ((SELECT val FROM _fraud_ids WHERE key = 'booking_cancel_c'), (SELECT val FROM _fraud_ids WHERE key = 'tour'), (SELECT val FROM _fraud_ids WHERE key = 'schedule_cancel_c'), (SELECT val FROM _fraud_ids WHERE key = 'traveler_d'), 'confirmed', 10000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '1 day', '{}'::JSONB, 'paid', 'pi_' || replace((SELECT val::TEXT FROM _fraud_ids WHERE key = 'booking_cancel_c'), '-', ''), 'full_online', FALSE, 0, 10000, 0, 10000, 8000, 'Full amount charged online.')
ON CONFLICT (id) DO NOTHING;

SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('app.fraud_operator_id'), 'role', 'authenticated')::TEXT,
  true
);
SET LOCAL role = authenticated;

DO $$
DECLARE
  v_snapshot RECORD;
  v_message TEXT;
  v_code TEXT;
BEGIN
  BEGIN
    PERFORM *
    FROM public.operator_manage_tour_booking(
      current_setting('app.fraud_booking_locked_id')::UUID,
      'cancel',
      'Attempting to move the traveler off-platform'
    );
  EXCEPTION WHEN OTHERS THEN
    v_message := SQLERRM;
    GET STACKED DIAGNOSTICS v_code = RETURNED_SQLSTATE;
  END;

  ASSERT v_code = 'P0001',
    'FAIL: operator cancellation inside the lock window should raise the expected application error code';
  ASSERT COALESCE(v_message, '') LIKE 'CANCELLATION_LOCK_ACTIVE%',
    'FAIL: operator cancellation inside the lock window should be blocked with CANCELLATION_LOCK_ACTIVE';

  ASSERT (
    SELECT status
    FROM public.tour_bookings
    WHERE id = current_setting('app.fraud_booking_locked_id')::UUID
  ) = 'confirmed',
    'FAIL: locked booking should remain confirmed after the blocked cancel attempt';
  RAISE NOTICE 'PASS: cancellation lock blocked near-departure operator cancellation';

  PERFORM *
  FROM public.operator_manage_tour_booking(
    current_setting('app.fraud_booking_completed_id')::UUID,
    'complete',
    'Tour finished normally'
  );

  SELECT
    booking.status,
    booking.metadata,
    snapshot.payout_status,
    snapshot.settlement_state
  INTO v_snapshot
  FROM public.tour_bookings AS booking
  INNER JOIN public.operator_booking_finance_snapshots AS snapshot
    ON snapshot.booking_id = booking.id
  WHERE booking.id = current_setting('app.fraud_booking_completed_id')::UUID;

  ASSERT v_snapshot.status = 'completed',
    'FAIL: operator completion should move the booking into completed status';
  ASSERT NULLIF(BTRIM(COALESCE(v_snapshot.metadata->>'operator_completion_confirmed_at', '')), '') IS NOT NULL,
    'FAIL: operator completion should stamp operator_completion_confirmed_at';
  ASSERT NULLIF(BTRIM(COALESCE(v_snapshot.metadata->>'traveler_completion_confirmed_at', '')), '') IS NULL,
    'FAIL: traveler completion confirmation must remain empty until the traveler confirms';
  ASSERT v_snapshot.payout_status = 'not_ready'::public.payout_status_enum,
    'FAIL: payout must remain not_ready until traveler completion confirmation arrives';
  ASSERT v_snapshot.settlement_state = 'completed_pending_payout'::public.settlement_state_enum,
    'FAIL: completed booking should stay in completed_pending_payout before traveler confirmation';
  RAISE NOTICE 'PASS: operator completion now waits for traveler confirmation before payout readiness';
END
$$;

RESET role;

SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('app.fraud_traveler_b_id'), 'role', 'authenticated')::TEXT,
  true
);
SET LOCAL role = authenticated;

SELECT *
FROM public.traveler_confirm_tour_booking_completion(
  current_setting('app.fraud_booking_completed_id')::UUID,
  'Trip completed successfully'
);

RESET role;

DO $$
DECLARE
  v_snapshot RECORD;
BEGIN
  SELECT
    booking.metadata,
    snapshot.payout_status,
    snapshot.settlement_state
  INTO v_snapshot
  FROM public.tour_bookings AS booking
  INNER JOIN public.operator_booking_finance_snapshots AS snapshot
    ON snapshot.booking_id = booking.id
  WHERE booking.id = current_setting('app.fraud_booking_completed_id')::UUID;

  ASSERT NULLIF(BTRIM(COALESCE(v_snapshot.metadata->>'traveler_completion_confirmed_at', '')), '') IS NOT NULL,
    'FAIL: traveler confirmation should stamp traveler_completion_confirmed_at';
  ASSERT v_snapshot.payout_status = 'eligible'::public.payout_status_enum,
    'FAIL: payout should become eligible after both completion confirmations are present';
  ASSERT v_snapshot.settlement_state = 'eligible_for_payout'::public.settlement_state_enum,
    'FAIL: settlement state should advance to eligible_for_payout after both confirmations';
  RAISE NOTICE 'PASS: traveler confirmation unlocks payout eligibility';
END
$$;

SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('app.fraud_operator_id'), 'role', 'authenticated')::TEXT,
  true
);
SET LOCAL role = authenticated;

SELECT * FROM public.operator_manage_tour_booking(current_setting('app.fraud_booking_cancel_a_id')::UUID, 'cancel', 'Vehicle unavailable');
SELECT * FROM public.operator_manage_tour_booking(current_setting('app.fraud_booking_cancel_b_id')::UUID, 'cancel', 'Guide unavailable');
SELECT * FROM public.operator_manage_tour_booking(current_setting('app.fraud_booking_cancel_c_id')::UUID, 'cancel', 'Operational disruption');

RESET role;

DO $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT
    operator_fault_cancellation_count,
    cancellation_penalty_active,
    fraud_review_required,
    fraud_review_reason,
    fraud_review_triggered_at,
    payout_hold,
    operational_status
  INTO v_profile
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = current_setting('app.fraud_operator_id')::UUID;

  ASSERT v_profile.operator_fault_cancellation_count = 3,
    'FAIL: operator should have 3 operator-fault cancellations after the third cancel';
  ASSERT v_profile.cancellation_penalty_active = TRUE,
    'FAIL: cancellation penalty should activate after the third operator-fault cancellation';
  ASSERT v_profile.fraud_review_required = TRUE,
    'FAIL: explicit fraud review flag should activate with the cancellation penalty';
  ASSERT v_profile.fraud_review_reason = 'Repeated operator-fault cancellations triggered automatic fraud review',
    'FAIL: fraud review reason should explain why the operator is flagged';
  ASSERT v_profile.fraud_review_triggered_at IS NOT NULL,
    'FAIL: fraud review should record when the operator was flagged';
  ASSERT v_profile.payout_hold = TRUE,
    'FAIL: payout hold should remain active after the fraud-triggering cancellation pattern';
  ASSERT v_profile.operational_status = 'restricted'::public.operator_operational_status_enum,
    'FAIL: operator should be restricted after the fraud-triggering cancellation pattern';
  RAISE NOTICE 'PASS: explicit operator fraud flags activate after repeated operator-fault cancellations';
END
$$;

ROLLBACK;