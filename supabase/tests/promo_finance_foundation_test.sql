-- =============================================================================
-- Promo Finance Foundation Tests — Plain SQL (no pgTAP required)
-- Verifies promo attribution is persisted on booking finance snapshots and payout reporting.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _promo_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _promo_ids(key)
VALUES
  ('operator'),
  ('traveler'),
  ('tour'),
  ('schedule'),
  ('booking');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _promo_ids
WHERE key IN ('operator', 'traveler');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(key)
FROM _promo_ids
WHERE key IN ('operator', 'traveler')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _promo_ids WHERE key = 'traveler'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _promo_ids WHERE key = 'operator'), 'Promo Finance Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _promo_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
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
  (SELECT val FROM _promo_ids WHERE key = 'operator'),
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
  (SELECT val FROM _promo_ids WHERE key = 'tour'),
  (SELECT val FROM _promo_ids WHERE key = 'operator'),
  'Promo Finance Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '2 days',
  90000,
  90000,
  'PKR',
  'Promo attribution test tour',
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
  (SELECT val FROM _promo_ids WHERE key = 'schedule'),
  (SELECT val FROM _promo_ids WHERE key = 'tour'),
  TIMEZONE('UTC', NOW()) - INTERVAL '4 days',
  TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
  10,
  1,
  'completed'
)
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
VALUES (
  (SELECT val FROM _promo_ids WHERE key = 'booking'),
  (SELECT val FROM _promo_ids WHERE key = 'tour'),
  (SELECT val FROM _promo_ids WHERE key = 'schedule'),
  (SELECT val FROM _promo_ids WHERE key = 'traveler'),
  'completed',
  90000,
  1,
  TIMEZONE('UTC', NOW()) - INTERVAL '5 days',
  jsonb_build_object(
    'promo_owner', 'tripavail_campaign_launch',
    'promo_funding_source', 'platform',
    'promo_discount_value', 10000,
    'operator_completion_confirmed_at', TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
    'operator_completion_confirmed_by', (SELECT val FROM _promo_ids WHERE key = 'operator'),
    'traveler_completion_confirmed_at', TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
    'traveler_completion_confirmed_by', (SELECT val FROM _promo_ids WHERE key = 'traveler'),
    'completion_confirmation_state', 'confirmed_by_both'
  ),
  'paid',
  CONCAT('pi_promo_foundation_', REPLACE((SELECT val::TEXT FROM _promo_ids WHERE key = 'booking'), '-', '')),
  'full_online',
  FALSE,
  0,
  90000,
  0,
  90000,
  72000,
  'Promo-funded discount captured in finance metadata.'
)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_snapshot RECORD;
  v_report RECORD;
BEGIN
  SELECT promo_owner, promo_funding_source, promo_discount_value
  INTO v_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _promo_ids WHERE key = 'booking');

  ASSERT v_snapshot.promo_owner = 'tripavail_campaign_launch',
    'FAIL: promo_owner should persist on the finance snapshot';
  ASSERT v_snapshot.promo_funding_source = 'platform',
    'FAIL: promo_funding_source should persist on the finance snapshot';
  ASSERT v_snapshot.promo_discount_value = 10000,
    'FAIL: promo_discount_value should persist on the finance snapshot';
  RAISE NOTICE 'PASS: promo attribution persisted to operator_booking_finance_snapshots';

  SELECT promo_owner, promo_funding_source, promo_discount_value
  INTO v_report
  FROM public.operator_payout_report_v
  WHERE booking_id = (SELECT val FROM _promo_ids WHERE key = 'booking');

  ASSERT v_report.promo_owner = 'tripavail_campaign_launch',
    'FAIL: promo_owner should appear in operator_payout_report_v';
  ASSERT v_report.promo_funding_source = 'platform',
    'FAIL: promo_funding_source should appear in operator_payout_report_v';
  ASSERT v_report.promo_discount_value = 10000,
    'FAIL: promo_discount_value should appear in operator_payout_report_v';
  RAISE NOTICE 'PASS: promo attribution flows through operator_payout_report_v';
END
$$;

ROLLBACK;