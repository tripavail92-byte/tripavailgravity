BEGIN;

CREATE TEMP TABLE _promo_alloc_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _promo_alloc_ids(key)
VALUES
  ('operator'),
  ('traveler'),
  ('tour'),
  ('schedule'),
  ('platform_booking'),
  ('operator_booking');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _promo_alloc_ids
WHERE key IN ('operator', 'traveler');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(key)
FROM _promo_alloc_ids
WHERE key IN ('operator', 'traveler')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _promo_alloc_ids WHERE key = 'traveler'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _promo_alloc_ids WHERE key = 'operator'), 'Promo Allocation Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _promo_alloc_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.operator_commercial_profiles (
  operator_user_id,
  operational_status,
  kyc_status,
  membership_tier_code,
  membership_status,
  commission_rate,
  monthly_membership_fee,
  billing_cycle_anchor_day,
  current_cycle_start,
  current_cycle_end,
  next_billing_date,
  payout_hold,
  payout_hold_reason,
  feature_overrides
)
VALUES (
  (SELECT val FROM _promo_alloc_ids WHERE key = 'operator'),
  'active'::public.operator_operational_status_enum,
  'approved'::public.commercial_kyc_status_enum,
  'gold'::public.membership_tier_code_enum,
  'active'::public.membership_status_enum,
  20,
  15000,
  1,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month' - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '1 month',
  FALSE,
  NULL,
  '{}'::JSONB
)
ON CONFLICT (operator_user_id) DO UPDATE SET
  operational_status = EXCLUDED.operational_status,
  kyc_status = EXCLUDED.kyc_status,
  membership_tier_code = EXCLUDED.membership_tier_code,
  membership_status = EXCLUDED.membership_status,
  commission_rate = EXCLUDED.commission_rate,
  monthly_membership_fee = EXCLUDED.monthly_membership_fee,
  payout_hold = EXCLUDED.payout_hold,
  payout_hold_reason = EXCLUDED.payout_hold_reason,
  feature_overrides = EXCLUDED.feature_overrides,
  updated_at = TIMEZONE('UTC', NOW());

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
  (SELECT val FROM _promo_alloc_ids WHERE key = 'tour'),
  (SELECT val FROM _promo_alloc_ids WHERE key = 'operator'),
  'Promo Allocation Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '2 days',
  90000,
  90000,
  'PKR',
  'Promo allocation test tour',
  FALSE,
  FALSE,
  0,
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
VALUES (
  (SELECT val FROM _promo_alloc_ids WHERE key = 'schedule'),
  (SELECT val FROM _promo_alloc_ids WHERE key = 'tour'),
  TIMEZONE('UTC', NOW()) - INTERVAL '4 days',
  TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
  10,
  2,
  'completed'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_promotions (
  operator_user_id,
  applicable_tour_id,
  title,
  code,
  description,
  owner_label,
  funding_source,
  discount_type,
  discount_value,
  is_active
)
VALUES
  (
    (SELECT val FROM _promo_alloc_ids WHERE key = 'operator'),
    (SELECT val FROM _promo_alloc_ids WHERE key = 'tour'),
    'TripAvail launch support',
    'PLATFORM10K',
    'Platform-funded onboarding promo',
    'PLATFORM10K',
    'platform',
    'fixed_amount',
    10000,
    TRUE
  ),
  (
    (SELECT val FROM _promo_alloc_ids WHERE key = 'operator'),
    (SELECT val FROM _promo_alloc_ids WHERE key = 'tour'),
    'Operator direct discount',
    'OPERATOR10K',
    'Operator-funded promo',
    'OPERATOR10K',
    'operator',
    'fixed_amount',
    10000,
    TRUE
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.tour_bookings (
  id,
  tour_id,
  schedule_id,
  traveler_id,
  status,
  total_price,
  pax_count,
  booking_date,
  payment_status,
  stripe_payment_intent_id,
  payment_collection_mode,
  deposit_required,
  deposit_percentage,
  upfront_amount,
  remaining_amount,
  amount_paid_online,
  amount_due_to_operator,
  payment_policy_text,
  promo_campaign_id,
  promo_owner,
  promo_funding_source,
  promo_discount_value,
  price_before_promo,
  metadata
)
VALUES
  (
    (SELECT val FROM _promo_alloc_ids WHERE key = 'platform_booking'),
    (SELECT val FROM _promo_alloc_ids WHERE key = 'tour'),
    (SELECT val FROM _promo_alloc_ids WHERE key = 'schedule'),
    (SELECT val FROM _promo_alloc_ids WHERE key = 'traveler'),
    'completed',
    80000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '5 days',
    'paid',
    CONCAT('pi_platform_', REPLACE((SELECT val::TEXT FROM _promo_alloc_ids WHERE key = 'platform_booking'), '-', '')),
    'full_online',
    FALSE,
    0,
    80000,
    0,
    80000,
    72000,
    'Platform-funded promo charged online.',
    (SELECT id FROM public.operator_promotions WHERE UPPER(BTRIM(code)) = 'PLATFORM10K'),
    'PLATFORM10K',
    'platform',
    10000,
    90000,
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _promo_alloc_ids WHERE key = 'operator_booking'),
    (SELECT val FROM _promo_alloc_ids WHERE key = 'tour'),
    (SELECT val FROM _promo_alloc_ids WHERE key = 'schedule'),
    (SELECT val FROM _promo_alloc_ids WHERE key = 'traveler'),
    'completed',
    80000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '5 days',
    'paid',
    CONCAT('pi_operator_', REPLACE((SELECT val::TEXT FROM _promo_alloc_ids WHERE key = 'operator_booking'), '-', '')),
    'full_online',
    FALSE,
    0,
    80000,
    0,
    80000,
    64000,
    'Operator-funded promo charged online.',
    (SELECT id FROM public.operator_promotions WHERE UPPER(BTRIM(code)) = 'OPERATOR10K'),
    'OPERATOR10K',
    'operator',
    10000,
    90000,
    '{}'::JSONB
  )
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_platform_snapshot RECORD;
  v_operator_snapshot RECORD;
BEGIN
  SELECT commission_total, operator_receivable_estimate, promo_funding_source, promo_discount_value
  INTO v_platform_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _promo_alloc_ids WHERE key = 'platform_booking');

  ASSERT v_platform_snapshot.promo_funding_source = 'platform',
    'FAIL: platform booking should persist platform funding source';
  ASSERT v_platform_snapshot.promo_discount_value = 10000,
    'FAIL: platform booking should persist promo discount';
  ASSERT v_platform_snapshot.commission_total = 8000,
    'FAIL: platform-funded promo should reduce retained commission before operator payable';
  ASSERT v_platform_snapshot.operator_receivable_estimate = 72000,
    'FAIL: platform-funded promo should preserve operator payable while discount stays within commission margin';

  SELECT commission_total, operator_receivable_estimate, promo_funding_source, promo_discount_value
  INTO v_operator_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _promo_alloc_ids WHERE key = 'operator_booking');

  ASSERT v_operator_snapshot.promo_funding_source = 'operator',
    'FAIL: operator booking should persist operator funding source';
  ASSERT v_operator_snapshot.promo_discount_value = 10000,
    'FAIL: operator booking should persist promo discount';
  ASSERT v_operator_snapshot.commission_total = 16000,
    'FAIL: operator-funded promo should commission the discounted booking total';
  ASSERT v_operator_snapshot.operator_receivable_estimate = 64000,
    'FAIL: operator-funded promo should reduce operator payable';

  RAISE NOTICE 'PASS: promo allocation rules keep platform-funded discounts from distorting operator payable';
END
$$;

ROLLBACK;