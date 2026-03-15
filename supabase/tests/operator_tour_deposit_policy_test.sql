-- =============================================================================
-- Operator Tour Deposit Policy Integration Tests — Plain SQL (no pgTAP required)
-- Run directly in Supabase Studio SQL editor or via psql.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _deposit_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _deposit_ids(key)
VALUES
  ('operator_gold'),
  ('operator_diamond'),
  ('traveler'),
  ('tour_gold_fail'),
  ('tour_gold_pass'),
  ('tour_diamond_pass'),
  ('schedule_gold_pass'),
  ('booking_gold_pass');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _deposit_ids
WHERE key IN ('operator_gold', 'operator_diamond', 'traveler');

INSERT INTO public.profiles(id, email, first_name, last_name)
SELECT
  val,
  key || '_' || val || '@test.invalid',
  initcap(split_part(key, '_', 1)),
  initcap(split_part(key, '_', 2))
FROM _deposit_ids
WHERE key IN ('operator_gold', 'operator_diamond', 'traveler')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _deposit_ids
WHERE key IN ('operator_gold', 'operator_diamond', 'traveler')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES
  ((SELECT val FROM _deposit_ids WHERE key = 'operator_gold'), 'Gold Deposit Test Operator'),
  ((SELECT val FROM _deposit_ids WHERE key = 'operator_diamond'), 'Diamond Deposit Test Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _deposit_ids WHERE key = 'operator_gold'), 'tour_operator', TRUE, 'approved'),
  ((SELECT val FROM _deposit_ids WHERE key = 'operator_diamond'), 'tour_operator', TRUE, 'approved'),
  ((SELECT val FROM _deposit_ids WHERE key = 'traveler'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _deposit_ids WHERE key = 'operator_gold'));
SELECT public.provision_operator_commercial_profile((SELECT val FROM _deposit_ids WHERE key = 'operator_diamond'));

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
WHERE operator_user_id = (SELECT val FROM _deposit_ids WHERE key = 'operator_gold');

UPDATE public.operator_commercial_profiles
SET
  operational_status = 'active'::public.operator_operational_status_enum,
  kyc_status = 'approved'::public.commercial_kyc_status_enum,
  membership_tier_code = 'diamond'::public.membership_tier_code_enum,
  membership_status = 'active'::public.membership_status_enum,
  commission_rate = 13,
  monthly_membership_fee = 30000,
  payout_hold = FALSE,
  feature_overrides = '{}'::JSONB
WHERE operator_user_id = (SELECT val FROM _deposit_ids WHERE key = 'operator_diamond');

DO $$
DECLARE
  v_blocked BOOLEAN := FALSE;
BEGIN
  ASSERT (
    SELECT minimum_deposit_percent
    FROM public.commercial_membership_tiers
    WHERE code = 'gold'::public.membership_tier_code_enum
  ) = 20,
    'FAIL: Gold tier minimum deposit should be 20%';

  ASSERT (
    SELECT minimum_deposit_percent
    FROM public.commercial_membership_tiers
    WHERE code = 'diamond'::public.membership_tier_code_enum
  ) = 15,
    'FAIL: Diamond tier minimum deposit should be 15%';

  ASSERT (
    SELECT minimum_deposit_percent
    FROM public.commercial_membership_tiers
    WHERE code = 'platinum'::public.membership_tier_code_enum
  ) = 10,
    'FAIL: Platinum tier minimum deposit should be 10%';
  RAISE NOTICE 'PASS: tier minimum deposit seeds are correct';

  BEGIN
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
      (SELECT val FROM _deposit_ids WHERE key = 'tour_gold_fail'),
      (SELECT val FROM _deposit_ids WHERE key = 'operator_gold'),
      'Gold Deposit Should Fail',
      'guided',
      '{"city":"Lahore"}'::JSONB,
      '2 days',
      10000,
      10000,
      'PKR',
      'Deposit minimum test',
      TRUE,
      TRUE,
      10,
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
      FALSE,
      FALSE
    );
  EXCEPTION WHEN OTHERS THEN
    v_blocked := POSITION('MINIMUM_DEPOSIT_NOT_MET' IN SQLERRM) > 0;
  END;

  ASSERT v_blocked,
    'FAIL: Gold operator should be blocked below the 20% deposit minimum';
  RAISE NOTICE 'PASS: Gold tier blocks deposits below 20%%';

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
    (SELECT val FROM _deposit_ids WHERE key = 'tour_gold_pass'),
    (SELECT val FROM _deposit_ids WHERE key = 'operator_gold'),
    'Gold Deposit Passes',
    'guided',
    '{"city":"Lahore"}'::JSONB,
    '2 days',
    10000,
    10000,
    'PKR',
    'Deposit minimum pass test',
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
  );

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
    (SELECT val FROM _deposit_ids WHERE key = 'tour_diamond_pass'),
    (SELECT val FROM _deposit_ids WHERE key = 'operator_diamond'),
    'Diamond Deposit Passes',
    'guided',
    '{"city":"Skardu"}'::JSONB,
    '3 days',
    12000,
    12000,
    'PKR',
    'Diamond deposit minimum pass test',
    TRUE,
    TRUE,
    15,
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
  );
  RAISE NOTICE 'PASS: tier-compliant tours can be inserted';

  INSERT INTO public.tour_schedules (id, tour_id, start_time, end_time, capacity, booked_count, status)
  VALUES (
    (SELECT val FROM _deposit_ids WHERE key = 'schedule_gold_pass'),
    (SELECT val FROM _deposit_ids WHERE key = 'tour_gold_pass'),
    TIMEZONE('UTC', NOW()) - INTERVAL '2 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
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
  VALUES (
    (SELECT val FROM _deposit_ids WHERE key = 'booking_gold_pass'),
    (SELECT val FROM _deposit_ids WHERE key = 'tour_gold_pass'),
    (SELECT val FROM _deposit_ids WHERE key = 'schedule_gold_pass'),
    (SELECT val FROM _deposit_ids WHERE key = 'traveler'),
    'completed',
    10000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
    '{}'::JSONB,
    'paid',
    'pi_deposit_policy_test',
    'partial_online',
    TRUE,
    20,
    2000,
    8000,
    2000,
    8000,
    'Pay 20% now to confirm your booking.'
  );

  ASSERT EXISTS (
    SELECT 1
    FROM public.operator_booking_finance_snapshots AS snapshot
    WHERE snapshot.booking_id = (SELECT val FROM _deposit_ids WHERE key = 'booking_gold_pass')
      AND snapshot.deposit_required = TRUE
      AND snapshot.deposit_percentage = 20
      AND snapshot.deposit_upfront_amount = 2000
      AND snapshot.deposit_remaining_amount = 8000
  ),
    'FAIL: booking finance snapshot should persist deposit-specific fields';
  RAISE NOTICE 'PASS: booking finance snapshot stores deposit-specific fields';
END $$;

ROLLBACK;