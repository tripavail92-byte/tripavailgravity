-- =============================================================================
-- Admin Commercial Auditability Test — Plain SQL (no pgTAP required)
-- Verifies audited hold/release, payout reversal, and recovery resolution.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _audit_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _audit_ids(key)
VALUES
  ('admin'),
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
FROM _audit_ids
WHERE key IN ('admin', 'operator', 'traveler_a', 'traveler_b');

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _audit_ids
WHERE key IN ('operator', 'traveler_a', 'traveler_b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_users(id, email, role)
VALUES (
  (SELECT val FROM _audit_ids WHERE key = 'admin'),
  (SELECT 'admin_' || val || '@test.invalid' FROM _audit_ids WHERE key = 'admin'),
  'finance_admin'::public.admin_role_enum
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _audit_ids WHERE key = 'traveler_a'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _audit_ids WHERE key = 'traveler_b'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES ((SELECT val FROM _audit_ids WHERE key = 'operator'), 'Auditability Test Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES ((SELECT val FROM _audit_ids WHERE key = 'operator'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _audit_ids WHERE key = 'operator'));

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
  payout_hold_reason = NULL,
  feature_overrides = '{}'::JSONB
WHERE operator_user_id = (SELECT val FROM _audit_ids WHERE key = 'operator');

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
  (SELECT val FROM _audit_ids WHERE key = 'tour'),
  (SELECT val FROM _audit_ids WHERE key = 'operator'),
  'Auditability Integration Tour',
  'guided',
  '{"city":"Lahore"}'::JSONB,
  '2 days',
  10000,
  'PKR',
  'Admin commercial auditability test tour',
  TRUE,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_schedules (id, tour_id, start_time, end_time, capacity, booked_count, status)
VALUES
  (
    (SELECT val FROM _audit_ids WHERE key = 'schedule_a'),
    (SELECT val FROM _audit_ids WHERE key = 'tour'),
    TIMEZONE('UTC', NOW()) - INTERVAL '7 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '6 days',
    10,
    1,
    'completed'
  ),
  (
    (SELECT val FROM _audit_ids WHERE key = 'schedule_b'),
    (SELECT val FROM _audit_ids WHERE key = 'tour'),
    TIMEZONE('UTC', NOW()) - INTERVAL '5 days',
    TIMEZONE('UTC', NOW()) - INTERVAL '4 days',
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
VALUES
  (
    (SELECT val FROM _audit_ids WHERE key = 'booking_a'),
    (SELECT val FROM _audit_ids WHERE key = 'tour'),
    (SELECT val FROM _audit_ids WHERE key = 'schedule_a'),
    (SELECT val FROM _audit_ids WHERE key = 'traveler_a'),
    'completed',
    10000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '8 days',
    jsonb_build_object(
      'operator_completion_confirmed_at', TO_CHAR(TIMEZONE('UTC', NOW()) - INTERVAL '6 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'traveler_completion_confirmed_at', TO_CHAR(TIMEZONE('UTC', NOW()) - INTERVAL '6 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'completion_confirmation_state', 'confirmed_by_both'
    ),
    'paid',
    'pi_audit_batch_a',
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
    (SELECT val FROM _audit_ids WHERE key = 'booking_b'),
    (SELECT val FROM _audit_ids WHERE key = 'tour'),
    (SELECT val FROM _audit_ids WHERE key = 'schedule_b'),
    (SELECT val FROM _audit_ids WHERE key = 'traveler_b'),
    'completed',
    10000,
    1,
    TIMEZONE('UTC', NOW()) - INTERVAL '6 days',
    jsonb_build_object(
      'operator_completion_confirmed_at', TO_CHAR(TIMEZONE('UTC', NOW()) - INTERVAL '4 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'traveler_completion_confirmed_at', TO_CHAR(TIMEZONE('UTC', NOW()) - INTERVAL '4 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'completion_confirmation_state', 'confirmed_by_both'
    ),
    'paid',
    'pi_audit_batch_b',
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

DO $$
DECLARE
  v_admin_id UUID := (SELECT val FROM _audit_ids WHERE key = 'admin');
  v_operator_id UUID := (SELECT val FROM _audit_ids WHERE key = 'operator');
  v_tour_id UUID := (SELECT val FROM _audit_ids WHERE key = 'tour');
  v_batch RECORD;
  v_paid RECORD;
  v_reversed RECORD;
  v_recovery RECORD;
  v_recovery_item_id UUID;
  v_promo_id UUID;
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('role', 'authenticated', 'sub', v_admin_id::TEXT)::text,
    true
  );

  PERFORM public.admin_assign_operator_membership_tier(
    v_operator_id,
    'diamond'::public.membership_tier_code_enum,
    'Tier upgraded after finance review'
  );

  ASSERT EXISTS (
    SELECT 1
    FROM public.admin_action_logs
    WHERE entity_type = 'commercial_profile'
      AND entity_id = v_operator_id
      AND action_type = 'membership_tier_changed'
      AND reason = 'Tier upgraded after finance review'
      AND previous_state->>'previous_tier_code' = 'gold'
      AND new_state->>'new_tier_code' = 'diamond'
  ),
    'FAIL: tier changes should be visible through the unified commercial audit feed';

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
  ) VALUES (
    v_operator_id,
    v_tour_id,
    'Audit promo launch',
    'AUDITPROMO',
    'Launch support offer',
    'AUDITPROMO',
    'platform',
    'fixed_amount',
    1200,
    TRUE
  )
  RETURNING id INTO v_promo_id;

  ASSERT EXISTS (
    SELECT 1
    FROM public.admin_action_logs
    WHERE entity_type = 'promotion'
      AND entity_id = v_promo_id
      AND action_type = 'promotion_created'
      AND new_state->>'operator_user_id' = v_operator_id::TEXT
      AND new_state->>'code' = 'AUDITPROMO'
  ),
    'FAIL: promo creation should create an admin audit log';

  UPDATE public.operator_promotions
  SET
    title = 'Audit promo launch updated',
    discount_value = 1500,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE id = v_promo_id;

  ASSERT EXISTS (
    SELECT 1
    FROM public.admin_action_logs
    WHERE entity_type = 'promotion'
      AND entity_id = v_promo_id
      AND action_type = 'promotion_updated'
      AND previous_state->>'title' = 'Audit promo launch'
      AND new_state->>'title' = 'Audit promo launch updated'
      AND new_state->>'discount_value' = '1500.00'
  ),
    'FAIL: promo updates should create an admin audit log';

  PERFORM public.admin_update_operator_payout_hold(v_operator_id, TRUE, 'Manual payout hold for audit review');

  ASSERT (
    SELECT payout_hold
    FROM public.operator_commercial_profiles
    WHERE operator_user_id = v_operator_id
  ) = TRUE,
    'FAIL: audited hold RPC should apply payout hold';

  ASSERT EXISTS (
    SELECT 1
    FROM public.admin_action_logs
    WHERE entity_type = 'commercial_profile'
      AND entity_id = v_operator_id
      AND action_type = 'payout_hold_applied'
      AND reason = 'Manual payout hold for audit review'
      AND previous_state->>'payout_hold' = 'false'
      AND new_state->>'payout_hold' = 'true'
  ),
    'FAIL: payout hold apply should create an admin audit log';

  PERFORM public.admin_update_operator_payout_hold(v_operator_id, FALSE, 'Hold released after audit review');

  ASSERT (
    SELECT payout_hold
    FROM public.operator_commercial_profiles
    WHERE operator_user_id = v_operator_id
  ) = FALSE,
    'FAIL: audited hold RPC should release payout hold';

  ASSERT EXISTS (
    SELECT 1
    FROM public.admin_action_logs
    WHERE entity_type = 'commercial_profile'
      AND entity_id = v_operator_id
      AND action_type = 'payout_hold_released'
      AND reason = 'Hold released after audit review'
      AND previous_state->>'payout_hold' = 'true'
      AND new_state->>'payout_hold' = 'false'
  ),
    'FAIL: payout hold release should create an admin audit log';

  SELECT *
  INTO v_batch
  FROM public.create_operator_payout_batch(TIMEZONE('UTC', NOW()));

  ASSERT v_batch.batch_id IS NOT NULL,
    'FAIL: create_operator_payout_batch should create a batch under finance-admin auth';

  SELECT *
  INTO v_paid
  FROM public.mark_operator_payout_batch_paid(v_batch.batch_id, TIMEZONE('UTC', NOW()));

  ASSERT v_paid.batch_id = v_batch.batch_id,
    'FAIL: mark_operator_payout_batch_paid should mark the scheduled batch paid';

  SELECT *
  INTO v_reversed
  FROM public.reverse_operator_payout_batch(v_batch.batch_id, 'Chargeback investigation review');

  ASSERT v_reversed.previous_status = 'paid'::public.payout_status_enum,
    'FAIL: audited reversal should report the previous paid status';

  ASSERT EXISTS (
    SELECT 1
    FROM public.admin_action_logs
    WHERE entity_type = 'payout_batch'
      AND entity_id = v_batch.batch_id
      AND action_type = 'payout_batch_reversed'
      AND reason = 'Chargeback investigation review'
      AND previous_state->>'status' = 'paid'
      AND new_state->>'status' = 'reversed'
  ),
    'FAIL: payout batch reversal should create an admin audit log';

  SELECT payout_item.id
  INTO v_recovery_item_id
  FROM public.operator_payout_items AS payout_item
  WHERE payout_item.payout_batch_id = v_batch.batch_id
  ORDER BY payout_item.created_at
  LIMIT 1;

  SELECT *
  INTO v_recovery
  FROM public.resolve_operator_payout_recovery(v_recovery_item_id, 3000, 'Partial clawback resolved');

  ASSERT v_recovery.remaining_recovery_amount = 5000,
    'FAIL: audited recovery resolution should leave the expected remaining balance';

  ASSERT EXISTS (
    SELECT 1
    FROM public.admin_action_logs
    WHERE entity_type = 'payout_item'
      AND entity_id = v_recovery_item_id
      AND action_type = 'payout_recovery_resolved'
      AND reason = 'Partial clawback resolved'
      AND previous_state->>'payout_status' = 'recovery_pending'
      AND new_state->>'payout_status' = 'recovery_pending'
      AND new_state->>'remaining_recovery_amount' = '5000.00'
  ),
    'FAIL: payout recovery resolution should create an admin audit log';

  RAISE NOTICE 'PASS: admin commercial money-state actions now produce auditable records';
END $$;

ROLLBACK;