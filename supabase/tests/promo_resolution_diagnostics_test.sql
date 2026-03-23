BEGIN;

CREATE TEMP TABLE _promo_diag_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _promo_diag_ids(key)
VALUES
  ('operator'),
  ('tour_main'),
  ('tour_other');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _promo_diag_ids
WHERE key = 'operator';

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', 'Promo Diagnostics Operator'
FROM _promo_diag_ids
WHERE key = 'operator'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _promo_diag_ids WHERE key = 'operator'), 'Promo Diagnostics Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES ((SELECT val FROM _promo_diag_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _promo_diag_ids WHERE key = 'operator'));

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
VALUES
  (
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    (SELECT val FROM _promo_diag_ids WHERE key = 'operator'),
    'Promo Diagnostics Main Tour',
    'guided',
    '{"city":"Lahore"}'::JSONB,
    '2 days',
    90000,
    90000,
    'PKR',
    'Primary tour for promo diagnostics',
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
  ),
  (
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_other'),
    (SELECT val FROM _promo_diag_ids WHERE key = 'operator'),
    'Promo Diagnostics Other Tour',
    'guided',
    '{"city":"Islamabad"}'::JSONB,
    '2 days',
    90000,
    90000,
    'PKR',
    'Secondary tour for promo diagnostics',
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
  starts_at,
  ends_at,
  is_active
)
VALUES
  (
    (SELECT val FROM _promo_diag_ids WHERE key = 'operator'),
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'Valid diagnostics promo',
    'DIAGVALID',
    'Valid promo for diagnostics',
    'DIAGVALID',
    'operator',
    'fixed_amount',
    10000,
    TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
    TIMEZONE('UTC', NOW()) + INTERVAL '7 days',
    TRUE
  ),
  (
    (SELECT val FROM _promo_diag_ids WHERE key = 'operator'),
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'Inactive diagnostics promo',
    'DIAGOFF',
    'Inactive promo for diagnostics',
    'DIAGOFF',
    'operator',
    'fixed_amount',
    10000,
    TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
    TIMEZONE('UTC', NOW()) + INTERVAL '7 days',
    FALSE
  ),
  (
    (SELECT val FROM _promo_diag_ids WHERE key = 'operator'),
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'Expired diagnostics promo',
    'DIAGOLD',
    'Expired promo for diagnostics',
    'DIAGOLD',
    'operator',
    'fixed_amount',
    10000,
    TIMEZONE('UTC', NOW()) - INTERVAL '10 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
    TRUE
  ),
  (
    (SELECT val FROM _promo_diag_ids WHERE key = 'operator'),
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'Future diagnostics promo',
    'DIAGSOON',
    'Future promo for diagnostics',
    'DIAGSOON',
    'operator',
    'fixed_amount',
    10000,
    TIMEZONE('UTC', NOW()) + INTERVAL '1 day',
    TIMEZONE('UTC', NOW()) + INTERVAL '10 days',
    TRUE
  ),
  (
    (SELECT val FROM _promo_diag_ids WHERE key = 'operator'),
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_other'),
    'Scoped diagnostics promo',
    'DIAGOTHER',
    'Other-tour promo for diagnostics',
    'DIAGOTHER',
    'operator',
    'fixed_amount',
    10000,
    TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
    TIMEZONE('UTC', NOW()) + INTERVAL '7 days',
    TRUE
  )
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_valid RECORD;
  v_inactive RECORD;
  v_expired RECORD;
  v_not_started RECORD;
  v_inapplicable RECORD;
  v_invalid RECORD;
BEGIN
  SELECT * INTO v_valid
  FROM public.inspect_tour_promotion(
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'DIAGVALID',
    90000
  );

  ASSERT v_valid.resolution_status = 'valid',
    'FAIL: valid promo should resolve as valid';
  ASSERT v_valid.applied_discount_value = 10000,
    'FAIL: valid promo should compute the applied discount';
  ASSERT v_valid.discounted_booking_total = 80000,
    'FAIL: valid promo should compute the discounted booking total';

  SELECT * INTO v_inactive
  FROM public.inspect_tour_promotion(
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'DIAGOFF',
    90000
  );

  ASSERT v_inactive.resolution_status = 'inactive',
    'FAIL: inactive promo should resolve as inactive';

  SELECT * INTO v_expired
  FROM public.inspect_tour_promotion(
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'DIAGOLD',
    90000
  );

  ASSERT v_expired.resolution_status = 'expired',
    'FAIL: expired promo should resolve as expired';

  SELECT * INTO v_not_started
  FROM public.inspect_tour_promotion(
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'DIAGSOON',
    90000
  );

  ASSERT v_not_started.resolution_status = 'not_started',
    'FAIL: future promo should resolve as not_started';

  SELECT * INTO v_inapplicable
  FROM public.inspect_tour_promotion(
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'DIAGOTHER',
    90000
  );

  ASSERT v_inapplicable.resolution_status = 'inapplicable',
    'FAIL: wrong-tour promo should resolve as inapplicable';

  SELECT * INTO v_invalid
  FROM public.inspect_tour_promotion(
    (SELECT val FROM _promo_diag_ids WHERE key = 'tour_main'),
    'NOTREAL',
    90000
  );

  ASSERT v_invalid.resolution_status = 'invalid',
    'FAIL: unknown promo should resolve as invalid';

  RAISE NOTICE 'PASS: promo diagnostics return explicit valid, inactive, expired, future, inapplicable, and invalid statuses';
END $$;

ROLLBACK;