-- =============================================================================
-- Promo Finance Edge Cases Test — Plain SQL (no pgTAP required)
-- Verifies promo-attributed refunds, cancellations, and recovery deductions.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _promo_edge_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _promo_edge_ids(key)
VALUES
  ('operator'),
  ('traveler_refund'),
  ('traveler_cancel'),
  ('traveler_recovery_old'),
  ('traveler_recovery_new'),
  ('tour'),
  ('schedule_refund'),
  ('schedule_cancel'),
  ('schedule_recovery_old'),
  ('schedule_recovery_new'),
  ('booking_refund'),
  ('booking_cancel'),
  ('booking_recovery'),
  ('booking_promo_eligible');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _promo_edge_ids
WHERE key IN ('operator', 'traveler_refund', 'traveler_cancel', 'traveler_recovery_old', 'traveler_recovery_new');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _promo_edge_ids
WHERE key IN ('operator', 'traveler_refund', 'traveler_cancel', 'traveler_recovery_old', 'traveler_recovery_new')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _promo_edge_ids WHERE key = 'traveler_refund'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _promo_edge_ids WHERE key = 'traveler_cancel'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _promo_edge_ids WHERE key = 'traveler_recovery_old'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _promo_edge_ids WHERE key = 'traveler_recovery_new'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _promo_edge_ids WHERE key = 'operator'), 'Promo Edge Case Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES ((SELECT val FROM _promo_edge_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _promo_edge_ids WHERE key = 'operator'));

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
  feature_overrides = '{}'::JSONB,
  updated_at = TIMEZONE('UTC', NOW())
WHERE operator_user_id = (SELECT val FROM _promo_edge_ids WHERE key = 'operator');

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
  (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
  (SELECT val FROM _promo_edge_ids WHERE key = 'operator'),
  'Promo Finance Edge Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '2 days',
  90000,
  90000,
  'PKR',
  'Promo finance edge-case integration tour',
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
VALUES
  (
    (SELECT val FROM _promo_edge_ids WHERE key = 'schedule_refund'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
    TIMEZONE('UTC', NOW()) - INTERVAL '7 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '6 days',
    10,
    1,
    'completed'
  ),
  (
    (SELECT val FROM _promo_edge_ids WHERE key = 'schedule_cancel'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
    TIMEZONE('UTC', NOW()) + INTERVAL '3 days',
    TIMEZONE('UTC', NOW()) + INTERVAL '4 days',
    10,
    0,
    'scheduled'
  ),
  (
    (SELECT val FROM _promo_edge_ids WHERE key = 'schedule_recovery_old'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
    TIMEZONE('UTC', NOW()) - INTERVAL '12 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '11 days',
    10,
    1,
    'completed'
  ),
  (
    (SELECT val FROM _promo_edge_ids WHERE key = 'schedule_recovery_new'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
    TIMEZONE('UTC', NOW()) - INTERVAL '4 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
    10,
    1,
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
VALUES (
  (SELECT val FROM _promo_edge_ids WHERE key = 'operator'),
  (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
  'Operator edge promo',
  'EDGE10K',
  'Operator-funded edge-case promo',
  'EDGE10K',
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
  payment_policy_text,
  promo_campaign_id,
  promo_owner,
  promo_funding_source,
  promo_discount_value,
  price_before_promo
)
VALUES
  (
    (SELECT val FROM _promo_edge_ids WHERE key = 'booking_refund'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'schedule_refund'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'traveler_refund'),
    'cancelled',
    80000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '8 days',
    jsonb_build_object(
      'refund_reason', 'Promo booking cancelled and refunded in full',
      'refund_timestamp', TIMEZONE('UTC', NOW())::TEXT
    ),
    'refunded',
    CONCAT('pi_refund_', REPLACE((SELECT val::TEXT FROM _promo_edge_ids WHERE key = 'booking_refund'), '-', '')),
    'full_online',
    FALSE,
    0,
    80000,
    0,
    80000,
    0,
    'Refunded promo booking.',
    (SELECT id FROM public.operator_promotions WHERE UPPER(BTRIM(code)) = 'EDGE10K'),
    'EDGE10K',
    'operator',
    10000,
    90000
  ),
  (
    (SELECT val FROM _promo_edge_ids WHERE key = 'booking_cancel'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'schedule_cancel'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'traveler_cancel'),
    'cancelled',
    80000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '1 day',
    '{}'::JSONB,
    'unpaid',
    CONCAT('pi_cancel_', REPLACE((SELECT val::TEXT FROM _promo_edge_ids WHERE key = 'booking_cancel'), '-', '')),
    'full_online',
    FALSE,
    0,
    0,
    80000,
    0,
    0,
    'Cancelled promo booking before payment settlement.',
    (SELECT id FROM public.operator_promotions WHERE UPPER(BTRIM(code)) = 'EDGE10K'),
    'EDGE10K',
    'operator',
    10000,
    90000
  ),
  (
    (SELECT val FROM _promo_edge_ids WHERE key = 'booking_recovery'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'schedule_recovery_old'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'traveler_recovery_old'),
    'completed',
    10000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '13 days',
    '{}'::JSONB,
    'paid',
    CONCAT('pi_recovery_', REPLACE((SELECT val::TEXT FROM _promo_edge_ids WHERE key = 'booking_recovery'), '-', '')),
    'full_online',
    FALSE,
    0,
    10000,
    0,
    10000,
    8000,
    'Prior booking later moved into recovery.',
    NULL,
    NULL,
    NULL,
    0,
    10000
  ),
  (
    (SELECT val FROM _promo_edge_ids WHERE key = 'booking_promo_eligible'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'tour'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'schedule_recovery_new'),
    (SELECT val FROM _promo_edge_ids WHERE key = 'traveler_recovery_new'),
    'completed',
    80000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '5 days',
    '{}'::JSONB,
    'paid',
    CONCAT('pi_eligible_', REPLACE((SELECT val::TEXT FROM _promo_edge_ids WHERE key = 'booking_promo_eligible'), '-', '')),
    'full_online',
    FALSE,
    0,
    80000,
    0,
    80000,
    64000,
    'Operator-funded promo booking eligible for payout.',
    (SELECT id FROM public.operator_promotions WHERE UPPER(BTRIM(code)) = 'EDGE10K'),
    'EDGE10K',
    'operator',
    10000,
    90000
  )
ON CONFLICT (id) DO NOTHING;

  UPDATE public.tour_bookings
  SET metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
    'operator_completion_confirmed_at', TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
    'operator_completion_confirmed_by', (SELECT val FROM _promo_edge_ids WHERE key = 'operator'),
    'traveler_completion_confirmed_at', TIMEZONE('UTC', NOW()) - INTERVAL '3 days',
    'traveler_completion_confirmed_by', (SELECT val FROM _promo_edge_ids WHERE key = 'traveler_recovery_new'),
    'completion_confirmation_state', 'confirmed_by_both'
  )
  WHERE id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_promo_eligible');

UPDATE public.operator_booking_finance_snapshots
SET
  settlement_state = 'chargeback_open'::public.settlement_state_enum,
  payout_status = 'recovery_pending'::public.payout_status_enum,
  payout_available_at = NULL,
  payout_completed_at = NULL,
  notes = '{}'::JSONB,
  updated_at = TIMEZONE('UTC', NOW())
WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_recovery');

UPDATE public.operator_commission_ledger
SET
  settlement_state = 'chargeback_open'::public.settlement_state_enum,
  payout_status = 'recovery_pending'::public.payout_status_enum,
  available_for_payout_at = NULL,
  updated_at = TIMEZONE('UTC', NOW())
WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_recovery');

UPDATE public.operator_payout_items
SET
  payout_status = 'recovery_pending'::public.payout_status_enum,
  payout_due_at = TIMEZONE('UTC', NOW()) - INTERVAL '8 days',
  recovery_amount = 6000,
  recovery_deduction_amount = 0,
  net_operator_payable_amount = operator_payable_amount,
  hold_reason = 'Chargeback recovery pending',
  updated_at = TIMEZONE('UTC', NOW())
WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_recovery');

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
  notes,
  promo_owner,
  promo_funding_source,
  promo_discount_value
)
VALUES (
  (SELECT val FROM _promo_edge_ids WHERE key = 'booking_promo_eligible'),
  (SELECT val FROM _promo_edge_ids WHERE key = 'operator'),
  (SELECT val FROM _promo_edge_ids WHERE key = 'traveler_recovery_new'),
  'gold'::public.membership_tier_code_enum,
  'active'::public.membership_status_enum,
  80000,
  80000,
  0,
  20,
  16000,
  16000,
  16000,
  0,
  64000,
  'eligible_for_payout'::public.settlement_state_enum,
  'eligible'::public.payout_status_enum,
  TIMEZONE('UTC', NOW()) - INTERVAL '2 days',
  '{}'::JSONB,
  'EDGE10K',
  'operator',
  10000
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
  notes = EXCLUDED.notes,
  promo_owner = EXCLUDED.promo_owner,
  promo_funding_source = EXCLUDED.promo_funding_source,
  promo_discount_value = EXCLUDED.promo_discount_value;

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
VALUES (
  (SELECT val FROM _promo_edge_ids WHERE key = 'operator'),
  (SELECT val FROM _promo_edge_ids WHERE key = 'booking_promo_eligible'),
  'commission_snapshot'::public.ledger_entry_type_enum,
  'gold'::public.membership_tier_code_enum,
  80000,
  20,
  16000,
  16000,
  16000,
  0,
  64000,
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
VALUES (
  (SELECT val FROM _promo_edge_ids WHERE key = 'booking_promo_eligible'),
  (SELECT val FROM _promo_edge_ids WHERE key = 'operator'),
  80000,
  16000,
  0,
  64000,
  64000,
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
  v_refund_snapshot RECORD;
  v_cancel_snapshot RECORD;
BEGIN
  SELECT settlement_state, payout_status, promo_funding_source, promo_discount_value, commission_total, operator_receivable_estimate
  INTO v_refund_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_refund');

  ASSERT v_refund_snapshot.settlement_state = 'refunded'::public.settlement_state_enum,
    'FAIL: refunded promo booking should move to refunded settlement state';
  ASSERT v_refund_snapshot.payout_status = 'not_ready'::public.payout_status_enum,
    'FAIL: refunded promo booking should never remain payout-eligible';
  ASSERT v_refund_snapshot.promo_funding_source = 'operator',
    'FAIL: refunded promo booking should preserve promo funding source';
  ASSERT v_refund_snapshot.promo_discount_value = 10000,
    'FAIL: refunded promo booking should preserve promo discount value';
  ASSERT v_refund_snapshot.commission_total = 0,
    'FAIL: refunded promo booking should not retain commission after full refund';
  ASSERT v_refund_snapshot.operator_receivable_estimate = 0,
    'FAIL: refunded promo booking should leave no operator receivable';

  SELECT settlement_state, payout_status, promo_funding_source, promo_discount_value
  INTO v_cancel_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_cancel');

  ASSERT v_cancel_snapshot.settlement_state = 'cancelled_by_operator'::public.settlement_state_enum,
    'FAIL: cancelled promo booking should remain cancelled_by_operator';
  ASSERT v_cancel_snapshot.payout_status = 'not_ready'::public.payout_status_enum,
    'FAIL: cancelled promo booking should not become payout-eligible';
  ASSERT v_cancel_snapshot.promo_funding_source = 'operator',
    'FAIL: cancelled promo booking should preserve promo funding source';
  ASSERT v_cancel_snapshot.promo_discount_value = 10000,
    'FAIL: cancelled promo booking should preserve promo discount value';

  RAISE NOTICE 'PASS: promo-attributed refunds and cancellations persist the correct finance states';
END $$;

DO $$
DECLARE
  v_batch RECORD;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  SELECT *
  INTO v_batch
  FROM public.create_operator_payout_batch(TIMEZONE('UTC', NOW()));

  ASSERT v_batch.batch_id IS NOT NULL,
    'FAIL: create_operator_payout_batch should create a batch for an eligible promo booking';

  ASSERT (
    SELECT recovery_deduction_amount
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_promo_eligible')
  ) = 6000,
    'FAIL: promo-attributed eligible payout should apply outstanding recovery first';

  ASSERT (
    SELECT net_operator_payable_amount
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_promo_eligible')
  ) = 58000,
    'FAIL: promo-attributed eligible payout should net recovery from the promo-adjusted operator payable';

  ASSERT (
    SELECT payout_status
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_promo_eligible')
  ) = 'scheduled'::public.payout_status_enum,
    'FAIL: promo-attributed eligible payout should move into the scheduled batch';

  ASSERT (
    SELECT payout_status
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_recovery')
  ) = 'reversed'::public.payout_status_enum,
    'FAIL: recovery source payout item should close as reversed once fully deducted';

  ASSERT (
    SELECT recovery_amount
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_recovery')
  ) = 0,
    'FAIL: recovery source payout item should have no remaining recovery amount after full deduction';

  ASSERT (
    SELECT payout_batch_id IS NULL AND payout_status = 'not_ready'::public.payout_status_enum
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_refund')
  ),
    'FAIL: refunded promo booking should stay out of payout batches';

  ASSERT (
    SELECT payout_batch_id IS NULL AND payout_status = 'not_ready'::public.payout_status_enum
    FROM public.operator_payout_items
    WHERE booking_id = (SELECT val FROM _promo_edge_ids WHERE key = 'booking_cancel')
  ),
    'FAIL: cancelled promo booking should stay out of payout batches';

  RAISE NOTICE 'PASS: promo-attributed recovery deductions respect refund and cancellation exclusions';
END $$;

ROLLBACK;