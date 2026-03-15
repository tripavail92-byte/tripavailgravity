-- =============================================================================
-- TripAvail Commercial Finance Regression Tests — Plain SQL (no pgTAP required)
-- Covers the minimum release finance-safety scenarios plus chargeback recovery.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _commercial_ids (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _commercial_ids(key)
VALUES
  ('admin_finance'),
  ('operator_gold'),
  ('operator_diamond'),
  ('operator_deposit'),
  ('operator_adjust_partial'),
  ('operator_adjust_waiver'),
  ('operator_refund'),
  ('operator_chargeback'),
  ('traveler_a'),
  ('traveler_b'),
  ('traveler_c'),
  ('traveler_d'),
  ('traveler_e'),
  ('traveler_f'),
  ('traveler_g'),
  ('tour_gold'),
  ('tour_diamond'),
  ('tour_deposit'),
  ('tour_adjust_partial'),
  ('tour_adjust_waiver'),
  ('tour_refund'),
  ('tour_chargeback'),
  ('schedule_gold'),
  ('schedule_diamond'),
  ('schedule_deposit'),
  ('schedule_adjust_partial'),
  ('schedule_adjust_waiver_a'),
  ('schedule_adjust_waiver_b'),
  ('schedule_refund'),
  ('schedule_chargeback_old'),
  ('schedule_chargeback_new'),
  ('booking_gold'),
  ('booking_diamond'),
  ('booking_deposit'),
  ('booking_adjust_partial_credit'),
  ('booking_adjust_waiver_credit_a'),
  ('booking_adjust_waiver_credit_b'),
  ('booking_refund'),
  ('booking_chargeback_old'),
  ('booking_chargeback_new');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _commercial_ids
WHERE key IN (
  'admin_finance',
  'operator_gold',
  'operator_diamond',
  'operator_deposit',
  'operator_adjust_partial',
  'operator_adjust_waiver',
  'operator_refund',
  'operator_chargeback',
  'traveler_a',
  'traveler_b',
  'traveler_c',
  'traveler_d',
  'traveler_e',
  'traveler_f',
  'traveler_g'
);

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(replace(key, '_', ' '))
FROM _commercial_ids
WHERE key IN (
  'operator_gold',
  'operator_diamond',
  'operator_deposit',
  'operator_adjust_partial',
  'operator_adjust_waiver',
  'operator_refund',
  'operator_chargeback',
  'traveler_a',
  'traveler_b',
  'traveler_c',
  'traveler_d',
  'traveler_e',
  'traveler_f',
  'traveler_g'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _commercial_ids WHERE key = 'traveler_a'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'traveler_b'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'traveler_c'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'traveler_d'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'traveler_e'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'traveler_f'), 'traveller', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'traveler_g'), 'traveller', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO public.admin_users(id, email, role)
VALUES (
  (SELECT val FROM _commercial_ids WHERE key = 'admin_finance'),
  (SELECT key || '_' || val || '@test.invalid' FROM _commercial_ids WHERE key = 'admin_finance'),
  'finance_admin'::public.admin_role_enum
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_operator_profiles(user_id, company_name)
VALUES
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_gold'), 'Gold Finance Test Operator'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_diamond'), 'Diamond Finance Test Operator'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_deposit'), 'Deposit Finance Test Operator'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'), 'Membership Adjustment Partial Operator'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'), 'Membership Adjustment Waiver Operator'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_refund'), 'Refund Finance Test Operator'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_chargeback'), 'Chargeback Finance Test Operator')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
VALUES
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_gold'), 'tour_operator', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_diamond'), 'tour_operator', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_deposit'), 'tour_operator', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'), 'tour_operator', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'), 'tour_operator', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_refund'), 'tour_operator', TRUE, 'approved'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_chargeback'), 'tour_operator', TRUE, 'approved')
ON CONFLICT (user_id, role_type) DO NOTHING;

SELECT public.provision_operator_commercial_profile((SELECT val FROM _commercial_ids WHERE key = 'operator_gold'));
SELECT public.provision_operator_commercial_profile((SELECT val FROM _commercial_ids WHERE key = 'operator_diamond'));
SELECT public.provision_operator_commercial_profile((SELECT val FROM _commercial_ids WHERE key = 'operator_deposit'));
SELECT public.provision_operator_commercial_profile((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'));
SELECT public.provision_operator_commercial_profile((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'));
SELECT public.provision_operator_commercial_profile((SELECT val FROM _commercial_ids WHERE key = 'operator_refund'));
SELECT public.provision_operator_commercial_profile((SELECT val FROM _commercial_ids WHERE key = 'operator_chargeback'));

UPDATE public.operator_commercial_profiles
SET
  operational_status = 'active'::public.operator_operational_status_enum,
  kyc_status = 'approved'::public.commercial_kyc_status_enum,
  membership_status = 'active'::public.membership_status_enum,
  payout_hold = FALSE,
  payout_hold_reason = NULL,
  feature_overrides = '{}'::JSONB,
  updated_at = TIMEZONE('UTC', NOW())
WHERE operator_user_id IN (
  (SELECT val FROM _commercial_ids WHERE key = 'operator_gold'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_diamond'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_deposit'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_refund'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_chargeback')
);

UPDATE public.operator_commercial_profiles
SET
  membership_tier_code = 'gold'::public.membership_tier_code_enum,
  commission_rate = 20,
  monthly_membership_fee = 15000
WHERE operator_user_id IN (
  (SELECT val FROM _commercial_ids WHERE key = 'operator_gold'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_deposit'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_refund'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_chargeback')
);

UPDATE public.operator_commercial_profiles
SET
  membership_tier_code = 'diamond'::public.membership_tier_code_enum,
  commission_rate = 13,
  monthly_membership_fee = 30000
WHERE operator_user_id = (SELECT val FROM _commercial_ids WHERE key = 'operator_diamond');

UPDATE public.operator_commercial_profiles
SET
  membership_tier_code = 'diamond'::public.membership_tier_code_enum,
  commission_rate = 13,
  monthly_membership_fee = 30000,
  current_cycle_start = DATE '2026-02-01',
  current_cycle_end = DATE '2026-02-28',
  next_billing_date = DATE '2026-03-01'
WHERE operator_user_id IN (
  (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver')
);

DELETE FROM public.operator_billing_cycles
WHERE operator_user_id IN (
  (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'),
  (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver')
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
VALUES
  ((SELECT val FROM _commercial_ids WHERE key = 'tour_gold'), (SELECT val FROM _commercial_ids WHERE key = 'operator_gold'), 'Gold Commission Tour', 'guided', '{"city":"Lahore"}'::JSONB, '2 days', 100000, 100000, 'PKR', 'Gold commission test tour', FALSE, FALSE, 0, 'moderate', 'moderate'::public.cancellation_policy_type_enum, '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '[]'::JSONB, '{}'::TEXT[], '{}'::TEXT[], ARRAY['en'], 1, 10, 5, 80, 'moderate', TRUE, TRUE),
  ((SELECT val FROM _commercial_ids WHERE key = 'tour_diamond'), (SELECT val FROM _commercial_ids WHERE key = 'operator_diamond'), 'Diamond Commission Tour', 'guided', '{"city":"Lahore"}'::JSONB, '2 days', 100000, 100000, 'PKR', 'Diamond commission test tour', FALSE, FALSE, 0, 'moderate', 'moderate'::public.cancellation_policy_type_enum, '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '[]'::JSONB, '{}'::TEXT[], '{}'::TEXT[], ARRAY['en'], 1, 10, 5, 80, 'moderate', TRUE, TRUE),
  ((SELECT val FROM _commercial_ids WHERE key = 'tour_deposit'), (SELECT val FROM _commercial_ids WHERE key = 'operator_deposit'), 'Deposit Commission Tour', 'guided', '{"city":"Lahore"}'::JSONB, '2 days', 100000, 100000, 'PKR', 'Deposit commission test tour', TRUE, TRUE, 20, 'moderate', 'moderate'::public.cancellation_policy_type_enum, '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '[]'::JSONB, '{}'::TEXT[], '{}'::TEXT[], ARRAY['en'], 1, 10, 5, 80, 'moderate', TRUE, TRUE),
  ((SELECT val FROM _commercial_ids WHERE key = 'tour_adjust_partial'), (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'), 'Adjustment Partial Tour', 'guided', '{"city":"Lahore"}'::JSONB, '2 days', 169230.77, 169230.77, 'PKR', 'Adjustment partial credit fixture tour', FALSE, FALSE, 0, 'moderate', 'moderate'::public.cancellation_policy_type_enum, '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '[]'::JSONB, '{}'::TEXT[], '{}'::TEXT[], ARRAY['en'], 1, 10, 5, 80, 'moderate', TRUE, TRUE),
  ((SELECT val FROM _commercial_ids WHERE key = 'tour_adjust_waiver'), (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'), 'Adjustment Waiver Tour', 'guided', '{"city":"Lahore"}'::JSONB, '2 days', 153846.15, 153846.15, 'PKR', 'Adjustment waiver credit fixture tour', FALSE, FALSE, 0, 'moderate', 'moderate'::public.cancellation_policy_type_enum, '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '[]'::JSONB, '{}'::TEXT[], '{}'::TEXT[], ARRAY['en'], 1, 10, 5, 80, 'moderate', TRUE, TRUE),
  ((SELECT val FROM _commercial_ids WHERE key = 'tour_refund'), (SELECT val FROM _commercial_ids WHERE key = 'operator_refund'), 'Refund Safety Tour', 'guided', '{"city":"Lahore"}'::JSONB, '2 days', 100000, 100000, 'PKR', 'Refund state test tour', FALSE, FALSE, 0, 'moderate', 'moderate'::public.cancellation_policy_type_enum, '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '[]'::JSONB, '{}'::TEXT[], '{}'::TEXT[], ARRAY['en'], 1, 10, 5, 80, 'moderate', TRUE, TRUE),
  ((SELECT val FROM _commercial_ids WHERE key = 'tour_chargeback'), (SELECT val FROM _commercial_ids WHERE key = 'operator_chargeback'), 'Chargeback Recovery Tour', 'guided', '{"city":"Lahore"}'::JSONB, '2 days', 100000, 100000, 'PKR', 'Chargeback recovery test tour', FALSE, FALSE, 0, 'moderate', 'moderate'::public.cancellation_policy_type_enum, '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '{}'::TEXT[], '[]'::JSONB, '{}'::TEXT[], '{}'::TEXT[], ARRAY['en'], 1, 10, 5, 80, 'moderate', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_schedules (id, tour_id, start_time, end_time, capacity, booked_count, status)
VALUES
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_gold'), (SELECT val FROM _commercial_ids WHERE key = 'tour_gold'), TIMEZONE('UTC', NOW()) - INTERVAL '7 days', TIMEZONE('UTC', NOW()) - INTERVAL '6 days', 10, 1, 'completed'),
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_diamond'), (SELECT val FROM _commercial_ids WHERE key = 'tour_diamond'), TIMEZONE('UTC', NOW()) - INTERVAL '7 days', TIMEZONE('UTC', NOW()) - INTERVAL '6 days', 10, 1, 'completed'),
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_deposit'), (SELECT val FROM _commercial_ids WHERE key = 'tour_deposit'), TIMEZONE('UTC', NOW()) - INTERVAL '7 days', TIMEZONE('UTC', NOW()) - INTERVAL '6 days', 10, 1, 'completed'),
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_adjust_partial'), (SELECT val FROM _commercial_ids WHERE key = 'tour_adjust_partial'), TIMESTAMPTZ '2026-02-10 00:00:00+00', TIMESTAMPTZ '2026-02-11 00:00:00+00', 10, 1, 'completed'),
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_adjust_waiver_a'), (SELECT val FROM _commercial_ids WHERE key = 'tour_adjust_waiver'), TIMESTAMPTZ '2026-02-12 00:00:00+00', TIMESTAMPTZ '2026-02-13 00:00:00+00', 10, 1, 'completed'),
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_adjust_waiver_b'), (SELECT val FROM _commercial_ids WHERE key = 'tour_adjust_waiver'), TIMESTAMPTZ '2026-02-18 00:00:00+00', TIMESTAMPTZ '2026-02-19 00:00:00+00', 10, 1, 'completed'),
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_refund'), (SELECT val FROM _commercial_ids WHERE key = 'tour_refund'), TIMEZONE('UTC', NOW()) + INTERVAL '2 days', TIMEZONE('UTC', NOW()) + INTERVAL '3 days', 10, 1, 'scheduled'),
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_chargeback_old'), (SELECT val FROM _commercial_ids WHERE key = 'tour_chargeback'), TIMEZONE('UTC', NOW()) - INTERVAL '12 days', TIMEZONE('UTC', NOW()) - INTERVAL '11 days', 10, 1, 'completed'),
  ((SELECT val FROM _commercial_ids WHERE key = 'schedule_chargeback_new'), (SELECT val FROM _commercial_ids WHERE key = 'tour_chargeback'), TIMEZONE('UTC', NOW()) - INTERVAL '4 days', TIMEZONE('UTC', NOW()) - INTERVAL '3 days', 10, 1, 'completed')
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
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_gold'), (SELECT val FROM _commercial_ids WHERE key = 'tour_gold'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_gold'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_a'), 'completed', 100000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '8 days', '{}'::JSONB, 'paid', 'pi_test_gold_commission', 'full_online', FALSE, 0, 100000, 0, 100000, 80000, 'Full amount charged online.'),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_diamond'), (SELECT val FROM _commercial_ids WHERE key = 'tour_diamond'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_diamond'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_b'), 'completed', 100000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '8 days', '{}'::JSONB, 'paid', 'pi_test_diamond_commission', 'full_online', FALSE, 0, 100000, 0, 100000, 87000, 'Full amount charged online.'),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_deposit'), (SELECT val FROM _commercial_ids WHERE key = 'tour_deposit'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_deposit'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_c'), 'completed', 100000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '8 days', '{}'::JSONB, 'balance_pending', 'pi_test_deposit_commission', 'partial_online', TRUE, 20, 20000, 80000, 20000, 80000, '20 percent deposit collected online.'),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_refund'), (SELECT val FROM _commercial_ids WHERE key = 'tour_refund'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_refund'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_f'), 'confirmed', 100000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '1 day', '{}'::JSONB, 'paid', 'pi_test_refund_state', 'full_online', FALSE, 0, 100000, 0, 100000, 80000, 'Full amount charged online.'),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_old'), (SELECT val FROM _commercial_ids WHERE key = 'tour_chargeback'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_chargeback_old'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_g'), 'completed', 100000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '13 days', '{}'::JSONB, 'paid', 'pi_test_chargeback_old', 'full_online', FALSE, 0, 100000, 0, 100000, 80000, 'Full amount charged online.'),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new'), (SELECT val FROM _commercial_ids WHERE key = 'tour_chargeback'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_chargeback_new'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_d'), 'completed', 100000, 1, TIMEZONE('UTC', NOW()) - INTERVAL '5 days', '{}'::JSONB, 'paid', 'pi_test_chargeback_new', 'full_online', FALSE, 0, 100000, 0, 100000, 80000, 'Full amount charged online.'),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_partial_credit'), (SELECT val FROM _commercial_ids WHERE key = 'tour_adjust_partial'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_adjust_partial'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_d'), 'completed', 169230.77, 1, TIMESTAMPTZ '2026-02-09 00:00:00+00', '{}'::JSONB, 'paid', 'pi_adjust_partial', 'full_online', FALSE, 0, 169230.77, 0, 169230.77, 147230.77, 'Synthetic billing-cycle credit fixture'),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_a'), (SELECT val FROM _commercial_ids WHERE key = 'tour_adjust_waiver'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_adjust_waiver_a'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_e'), 'completed', 153846.15, 1, TIMESTAMPTZ '2026-02-11 00:00:00+00', '{}'::JSONB, 'paid', 'pi_adjust_waiver_a', 'full_online', FALSE, 0, 153846.15, 0, 153846.15, 133846.15, 'Synthetic billing-cycle credit fixture'),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_b'), (SELECT val FROM _commercial_ids WHERE key = 'tour_adjust_waiver'), (SELECT val FROM _commercial_ids WHERE key = 'schedule_adjust_waiver_b'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_e'), 'completed', 115384.62, 1, TIMESTAMPTZ '2026-02-17 00:00:00+00', '{}'::JSONB, 'paid', 'pi_adjust_waiver_b', 'full_online', FALSE, 0, 115384.62, 0, 115384.62, 100384.62, 'Synthetic billing-cycle credit fixture')
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
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_partial_credit'), (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_d'), 'diamond'::public.membership_tier_code_enum, 'active'::public.membership_status_enum, 169230.77, 169230.77, 0, 13, 22000, 22000, 22000, 0, 147230.77, 'paid_out'::public.settlement_state_enum, 'paid'::public.payout_status_enum, TIMEZONE('UTC', NOW()) - INTERVAL '20 days', '{}'::JSONB),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_a'), (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_e'), 'diamond'::public.membership_tier_code_enum, 'active'::public.membership_status_enum, 153846.15, 153846.15, 0, 13, 20000, 20000, 20000, 0, 133846.15, 'paid_out'::public.settlement_state_enum, 'paid'::public.payout_status_enum, TIMEZONE('UTC', NOW()) - INTERVAL '20 days', '{}'::JSONB),
  ((SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_b'), (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'), (SELECT val FROM _commercial_ids WHERE key = 'traveler_e'), 'diamond'::public.membership_tier_code_enum, 'active'::public.membership_status_enum, 115384.62, 115384.62, 0, 13, 15000, 15000, 15000, 0, 100384.62, 'paid_out'::public.settlement_state_enum, 'paid'::public.payout_status_enum, TIMEZONE('UTC', NOW()) - INTERVAL '18 days', '{}'::JSONB)
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
  available_for_payout_at,
  recognized_at
)
VALUES
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial'), (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_partial_credit'), 'commission_snapshot'::public.ledger_entry_type_enum, 'diamond'::public.membership_tier_code_enum, 169230.77, 13, 22000, 22000, 22000, 0, 147230.77, 'paid_out'::public.settlement_state_enum, 'paid'::public.payout_status_enum, TIMEZONE('UTC', NOW()) - INTERVAL '20 days', TIMESTAMPTZ '2026-02-15 00:00:00+00'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'), (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_a'), 'commission_snapshot'::public.ledger_entry_type_enum, 'diamond'::public.membership_tier_code_enum, 153846.15, 13, 20000, 20000, 20000, 0, 133846.15, 'paid_out'::public.settlement_state_enum, 'paid'::public.payout_status_enum, TIMEZONE('UTC', NOW()) - INTERVAL '20 days', TIMESTAMPTZ '2026-02-12 00:00:00+00'),
  ((SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver'), (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_b'), 'commission_snapshot'::public.ledger_entry_type_enum, 'diamond'::public.membership_tier_code_enum, 115384.62, 13, 15000, 15000, 15000, 0, 100384.62, 'paid_out'::public.settlement_state_enum, 'paid'::public.payout_status_enum, TIMEZONE('UTC', NOW()) - INTERVAL '18 days', TIMESTAMPTZ '2026-02-18 00:00:00+00')
ON CONFLICT (booking_id) DO UPDATE SET
  operator_user_id = EXCLUDED.operator_user_id,
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
  available_for_payout_at = EXCLUDED.available_for_payout_at,
  recognized_at = EXCLUDED.recognized_at;

INSERT INTO public.operator_payout_items (
  booking_id,
  operator_user_id,
  gross_amount,
  commission_amount,
  refund_amount,
  operator_payable_amount,
  recovery_deduction_amount,
  net_operator_payable_amount,
  payout_status,
  payout_due_at,
  recovery_amount
)
SELECT
  snapshot.booking_id,
  snapshot.operator_user_id,
  snapshot.booking_total,
  snapshot.commission_amount,
  snapshot.refund_amount,
  snapshot.operator_receivable_estimate,
  0,
  snapshot.operator_receivable_estimate,
  snapshot.payout_status,
  snapshot.payout_available_at,
  0
FROM public.operator_booking_finance_snapshots AS snapshot
WHERE snapshot.booking_id IN (
  (SELECT val FROM _commercial_ids WHERE key = 'booking_gold'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_diamond'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_deposit'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_partial_credit'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_a'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_b'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_refund'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_old'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new')
)
ON CONFLICT (booking_id) DO UPDATE SET
  operator_user_id = EXCLUDED.operator_user_id,
  gross_amount = EXCLUDED.gross_amount,
  commission_amount = EXCLUDED.commission_amount,
  refund_amount = EXCLUDED.refund_amount,
  operator_payable_amount = EXCLUDED.operator_payable_amount,
  recovery_deduction_amount = EXCLUDED.recovery_deduction_amount,
  net_operator_payable_amount = EXCLUDED.net_operator_payable_amount,
  payout_status = EXCLUDED.payout_status,
  payout_due_at = EXCLUDED.payout_due_at,
  updated_at = TIMEZONE('UTC', NOW());

UPDATE public.operator_payout_items
SET
  payout_status = 'paid'::public.payout_status_enum,
  paid_at = TIMEZONE('UTC', NOW()) - INTERVAL '10 days',
  payout_due_at = TIMEZONE('UTC', NOW()) - INTERVAL '20 days',
  updated_at = TIMEZONE('UTC', NOW())
WHERE booking_id IN (
  (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_partial_credit'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_a'),
  (SELECT val FROM _commercial_ids WHERE key = 'booking_adjust_waiver_credit_b')
);

DO $$
DECLARE
  v_snapshot RECORD;
  v_invoice RECORD;
  v_batch RECORD;
  v_reverse RECORD;
  v_future RECORD;
  v_blocked BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_admin_finance UUID := (SELECT val FROM _commercial_ids WHERE key = 'admin_finance');
  v_operator_adjust_partial UUID := (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_partial');
  v_operator_adjust_waiver UUID := (SELECT val FROM _commercial_ids WHERE key = 'operator_adjust_waiver');
BEGIN
  -- Scenario 1: Gold booking commission.
  SELECT commission_total, operator_receivable_estimate
  INTO v_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_gold');

  ASSERT v_snapshot.commission_total = 20000,
    'FAIL: Gold booking commission should be 20000 on a 100000 booking at 20 percent';
  ASSERT v_snapshot.operator_receivable_estimate = 80000,
    'FAIL: Gold booking operator receivable should be 80000';
  RAISE NOTICE 'PASS: Scenario 1 — Gold booking commission is correct';

  -- Scenario 2: Diamond booking commission.
  SELECT commission_total, operator_receivable_estimate
  INTO v_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_diamond');

  ASSERT v_snapshot.commission_total = 13000,
    'FAIL: Diamond booking commission should be 13000 on a 100000 booking at 13 percent';
  ASSERT v_snapshot.operator_receivable_estimate = 87000,
    'FAIL: Diamond booking operator receivable should be 87000';
  RAISE NOTICE 'PASS: Scenario 2 — Diamond booking commission is correct';

  -- Scenario 3: Deposit booking commission split.
  -- TripAvail collects commission from marketplace cash first, so a 20000 deposit on a 20%% commission booking means:
  -- commission_total = 20000, commission_collected = 20000, commission_remaining = 0.
  SELECT commission_total, commission_collected, commission_remaining, payment_collected
  INTO v_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_deposit');

  ASSERT v_snapshot.payment_collected = 20000,
    'FAIL: Deposit booking should collect only the 20000 deposit online';
  ASSERT v_snapshot.commission_total = 20000,
    'FAIL: Deposit booking commission_total should be 20000';
  ASSERT v_snapshot.commission_collected = 20000,
    'FAIL: Deposit booking commission_collected should consume the full 20000 deposit before any remaining commission is tracked';
  ASSERT v_snapshot.commission_remaining = 0,
    'FAIL: Deposit booking commission_remaining should be 0 when the deposit fully covers the commission';
  RAISE NOTICE 'PASS: Scenario 3 — Deposit commission split is correct';

  -- Scenario 4: Membership adjustment with partial prior-cycle credit.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_finance::text, 'role', 'authenticated')::text, true);
  SET LOCAL role = authenticated;

  PERFORM public.admin_close_operator_billing_cycle(v_operator_adjust_partial, DATE '2026-02-28');

  RESET role;

  SELECT prior_cycle_commission_credit, final_membership_charge, adjustment_applied, invoice_status
  INTO v_invoice
  FROM public.operator_billing_report_v
  WHERE operator_user_id = v_operator_adjust_partial
  ORDER BY cycle_start DESC
  LIMIT 1;

  ASSERT v_invoice.prior_cycle_commission_credit = 22000,
    'FAIL: Membership adjustment credit should carry forward 22000';
  ASSERT v_invoice.adjustment_applied = 22000,
    'FAIL: Membership adjustment applied should be 22000';
  ASSERT v_invoice.final_membership_charge = 8000,
    'FAIL: Next cycle invoice should be 8000 when fee is 30000 and credit is 22000';
  ASSERT v_invoice.invoice_status = 'issued',
    'FAIL: Partial-credit invoice should remain issued';
  RAISE NOTICE 'PASS: Scenario 4 — Membership adjustment partial credit is correct';

  -- Scenario 5: Full membership waiver.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_finance::text, 'role', 'authenticated')::text, true);
  SET LOCAL role = authenticated;

  PERFORM public.admin_close_operator_billing_cycle(v_operator_adjust_waiver, DATE '2026-02-28');

  RESET role;

  SELECT prior_cycle_commission_credit, final_membership_charge, adjustment_applied, invoice_status
  INTO v_invoice
  FROM public.operator_billing_report_v
  WHERE operator_user_id = v_operator_adjust_waiver
  ORDER BY cycle_start DESC
  LIMIT 1;

  ASSERT v_invoice.prior_cycle_commission_credit = 35000,
    'FAIL: Full waiver credit should carry forward 35000';
  ASSERT v_invoice.adjustment_applied = 30000,
    'FAIL: Full waiver adjustment should be capped at the 30000 membership fee';
  ASSERT v_invoice.final_membership_charge = 0,
    'FAIL: Full membership waiver should produce a zero invoice';
  ASSERT v_invoice.invoice_status = 'waived',
    'FAIL: Full waiver invoice should be marked waived';
  RAISE NOTICE 'PASS: Scenario 5 — Full membership waiver is correct';

  -- Scenario 6: Refund safety state.
  UPDATE public.tour_bookings
  SET
    status = 'cancelled',
    payment_status = 'refunded',
    metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
      'refund_amount', 100000,
      'refund_reason', 'Traveller cancelled before service',
      'refund_timestamp', TIMEZONE('UTC', NOW())
    )
  WHERE id = (SELECT val FROM _commercial_ids WHERE key = 'booking_refund');

  PERFORM public.refresh_all_operator_payout_eligibility();

  SELECT settlement_state, payout_status, payment_collected, refund_amount, refund_reason, refund_timestamp,
    commission_total, commission_collected, commission_remaining, operator_receivable_estimate
  INTO v_snapshot
  FROM public.operator_booking_finance_snapshots
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_refund');

  ASSERT v_snapshot.settlement_state = 'refunded'::public.settlement_state_enum,
    'FAIL: Refunded booking should move to refunded settlement state';
  ASSERT v_snapshot.payout_status = 'not_ready'::public.payout_status_enum,
    'FAIL: Refunded booking should not remain payout eligible';
  ASSERT v_snapshot.payment_collected = 100000,
    'FAIL: Refunded booking should retain the original gross marketplace cash collected for auditability';
  ASSERT v_snapshot.refund_amount = 100000,
    'FAIL: Refunded booking should persist the refunded amount explicitly';
  ASSERT v_snapshot.refund_reason = 'Traveller cancelled before service',
    'FAIL: Refunded booking should persist the refund reason explicitly';
  ASSERT v_snapshot.refund_timestamp IS NOT NULL,
    'FAIL: Refunded booking should persist the refund timestamp explicitly';
  ASSERT v_snapshot.commission_total = 0,
    'FAIL: Fully refunded cancelled booking should reverse commission_total to zero';
  ASSERT v_snapshot.commission_collected = 0,
    'FAIL: Refunded booking should no longer show collected commission';
  ASSERT v_snapshot.commission_remaining = 0,
    'FAIL: Refunded booking should not leave remaining commission outstanding after reversal';
  ASSERT v_snapshot.operator_receivable_estimate = 0,
    'FAIL: Refunded cancelled booking should no longer show operator receivable';

  SELECT payout_status, refund_amount, operator_payable_amount
  INTO v_snapshot
  FROM public.operator_payout_items
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_refund');

  ASSERT v_snapshot.payout_status = 'not_ready'::public.payout_status_enum,
    'FAIL: Refunded booking payout item should be blocked from payout';
  ASSERT v_snapshot.refund_amount = 100000,
    'FAIL: Refunded booking payout item should carry the refunded amount';
  ASSERT v_snapshot.operator_payable_amount = 0,
    'FAIL: Refunded booking payout item should not retain an operator payable amount';
  RAISE NOTICE 'PASS: Scenario 6 — Refund state suppresses payout eligibility safely';

  -- Scenario 7: Chargeback recovery and automatic deduction from future payout.
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  UPDATE public.tour_bookings
  SET metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
    'operator_completion_confirmed_at', v_now - INTERVAL '10 days',
    'operator_completion_confirmed_by', (SELECT val FROM _commercial_ids WHERE key = 'operator_chargeback'),
    'traveler_completion_confirmed_at', v_now - INTERVAL '9 days',
    'traveler_completion_confirmed_by', (SELECT val FROM _commercial_ids WHERE key = 'traveler_g'),
    'completion_confirmation_state', 'confirmed_by_both'
  )
  WHERE id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_old');

  UPDATE public.tour_bookings
  SET status = 'confirmed'
  WHERE id IN (
    (SELECT val FROM _commercial_ids WHERE key = 'booking_gold'),
    (SELECT val FROM _commercial_ids WHERE key = 'booking_diamond'),
    (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new')
  );

  UPDATE public.operator_booking_finance_snapshots
  SET payout_status = 'not_ready'::public.payout_status_enum,
      settlement_state = 'completed_pending_payout'::public.settlement_state_enum,
      payout_available_at = NULL,
      updated_at = v_now
  WHERE booking_id IN (
    (SELECT val FROM _commercial_ids WHERE key = 'booking_gold'),
    (SELECT val FROM _commercial_ids WHERE key = 'booking_diamond')
  );

  UPDATE public.operator_commission_ledger
  SET payout_status = 'not_ready'::public.payout_status_enum,
      settlement_state = 'completed_pending_payout'::public.settlement_state_enum,
      available_for_payout_at = NULL,
      updated_at = v_now
  WHERE booking_id IN (
    (SELECT val FROM _commercial_ids WHERE key = 'booking_gold'),
    (SELECT val FROM _commercial_ids WHERE key = 'booking_diamond')
  );

  UPDATE public.operator_payout_items
  SET payout_status = 'not_ready'::public.payout_status_enum,
      payout_due_at = NULL,
      updated_at = v_now
  WHERE booking_id IN (
    (SELECT val FROM _commercial_ids WHERE key = 'booking_gold'),
    (SELECT val FROM _commercial_ids WHERE key = 'booking_diamond')
  );

    UPDATE public.operator_booking_finance_snapshots
    SET payout_status = 'not_ready'::public.payout_status_enum,
      settlement_state = 'completed_pending_payout'::public.settlement_state_enum,
      payout_available_at = NULL,
      updated_at = v_now
    WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new');

    UPDATE public.operator_commission_ledger
    SET payout_status = 'not_ready'::public.payout_status_enum,
      settlement_state = 'completed_pending_payout'::public.settlement_state_enum,
      available_for_payout_at = NULL,
      updated_at = v_now
    WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new');

    UPDATE public.operator_payout_items
    SET payout_status = 'not_ready'::public.payout_status_enum,
      payout_due_at = NULL,
      updated_at = v_now
    WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new');

  PERFORM public.refresh_all_operator_payout_eligibility();

  SELECT *
  INTO v_batch
  FROM public.create_operator_payout_batch(v_now - INTERVAL '1 minute')
  WHERE batch_reference IS NOT NULL
  LIMIT 1;

  ASSERT v_batch.batch_id IS NOT NULL,
    'FAIL: Chargeback scenario should create an initial payout batch';

  PERFORM public.mark_operator_payout_batch_paid(v_batch.batch_id, v_now);

  SELECT *
  INTO v_reverse
  FROM public.reverse_operator_payout_batch(v_batch.batch_id, 'Chargeback simulation for finance regression');

  ASSERT v_reverse.previous_status = 'paid'::public.payout_status_enum,
    'FAIL: Chargeback recovery scenario should reverse a paid batch';
  ASSERT v_reverse.total_recovery_amount = 80000,
    'FAIL: Recovery balance should equal the previously paid operator amount of 80000';

  SELECT recovery_amount, payout_status
  INTO v_snapshot
  FROM public.operator_payout_items
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_old');

  ASSERT v_snapshot.recovery_amount = 80000,
    'FAIL: Reversed paid item should hold an 80000 recovery balance';
  ASSERT v_snapshot.payout_status = 'recovery_pending'::public.payout_status_enum,
    'FAIL: Reversed paid item should move to recovery_pending';

  UPDATE public.tour_bookings
  SET
    status = 'completed',
    metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
      'operator_completion_confirmed_at', v_now - INTERVAL '2 days',
      'operator_completion_confirmed_by', (SELECT val FROM _commercial_ids WHERE key = 'operator_chargeback'),
      'traveler_completion_confirmed_at', v_now - INTERVAL '1 day',
      'traveler_completion_confirmed_by', (SELECT val FROM _commercial_ids WHERE key = 'traveler_d'),
      'completion_confirmation_state', 'confirmed_by_both'
    )
  WHERE id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new');

  UPDATE public.operator_booking_finance_snapshots
  SET payout_status = 'eligible'::public.payout_status_enum,
      settlement_state = 'eligible_for_payout'::public.settlement_state_enum,
      payout_available_at = v_now - INTERVAL '1 minute',
      updated_at = v_now
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new');

  UPDATE public.operator_commission_ledger
  SET payout_status = 'eligible'::public.payout_status_enum,
      settlement_state = 'eligible_for_payout'::public.settlement_state_enum,
      available_for_payout_at = v_now - INTERVAL '1 minute',
      updated_at = v_now
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new');

  UPDATE public.operator_payout_items
  SET payout_status = 'eligible'::public.payout_status_enum,
      payout_due_at = v_now - INTERVAL '1 minute',
      updated_at = v_now
  WHERE booking_id = (SELECT val FROM _commercial_ids WHERE key = 'booking_chargeback_new');

  SELECT *
  INTO v_future
  FROM public.create_operator_payout_batch(v_now + INTERVAL '1 minute')
  WHERE batch_reference IS NOT NULL
  LIMIT 1;

  ASSERT v_future.total_recovery_deduction_amount = 80000,
    'FAIL: Future payout batch should deduct the full 80000 recovery balance automatically';
  ASSERT v_future.total_operator_payable = 0,
    'FAIL: Future payout should be fully netted down to zero after recovery deduction';
  RAISE NOTICE 'PASS: Scenario 7 — Chargeback recovery deduction is correct';
END
$$;

ROLLBACK;