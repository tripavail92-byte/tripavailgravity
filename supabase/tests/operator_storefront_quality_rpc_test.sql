-- =============================================================================
-- Operator Storefront Quality RPC Regression Test
-- Validates public response metrics plus admin quality score inputs.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _quality_ids (
  key TEXT PRIMARY KEY,
  val UUID NOT NULL DEFAULT gen_random_uuid()
);

INSERT INTO _quality_ids(key)
VALUES
  ('operator'),
  ('strong_operator'),
  ('weak_operator'),
  ('traveler'),
  ('admin'),
  ('tour'),
  ('strong_tour'),
  ('weak_tour'),
  ('schedule'),
  ('strong_schedule'),
  ('weak_schedule'),
  ('booking'),
  ('strong_booking'),
  ('weak_booking'),
  ('conversation'),
  ('strong_conversation'),
  ('weak_conversation'),
  ('report_open'),
  ('report_resolved'),
  ('weak_report_open_one'),
  ('weak_report_open_two');

INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key || '_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _quality_ids
WHERE key IN ('operator', 'strong_operator', 'weak_operator', 'traveler', 'admin');

INSERT INTO public.profiles(id, email, first_name, last_name)
SELECT
  val,
  key || '_' || val || '@test.invalid',
  initcap(key),
  'Regression'
FROM _quality_ids
WHERE key IN ('operator', 'strong_operator', 'weak_operator', 'traveler', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users(id, email, full_name)
SELECT val, key || '_' || val || '@test.invalid', initcap(key) || ' Regression'
FROM _quality_ids
WHERE key IN ('operator', 'strong_operator', 'weak_operator', 'traveler', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_users(id, email, role)
VALUES (
  (SELECT val FROM _quality_ids WHERE key = 'admin'),
  'admin_' || (SELECT val FROM _quality_ids WHERE key = 'admin') || '@test.invalid',
  'super_admin'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_operator_profiles (
  user_id,
  company_name,
  business_name,
  contact_name,
  slug,
  is_public,
  description,
  company_logo_url,
  primary_city,
  coverage_range,
  categories,
  years_experience,
  team_size,
  phone_number,
  email,
  registration_number,
  fleet_assets,
  guide_profiles,
  gallery_media,
  public_policies,
  verification_documents,
  kyc_verified_cnic,
  kyc_verified_at
)
VALUES (
  (SELECT val FROM _quality_ids WHERE key = 'operator'),
  'RPC Quality Test Operator',
  'RPC Quality Test Operator',
  'Regression Operator',
  'rpc-quality-test-operator',
  TRUE,
  'Regression fixture for storefront quality RPC validation.',
  'https://example.com/operator-logo.png',
  'Lahore',
  'Pakistan north',
  ARRAY['hiking'],
  '8 years',
  '12 guides',
  '+92-300-0000000',
  'operator_quality@test.invalid',
  'REG-QUALITY-001',
  '[{"type":"van"}]'::JSONB,
  '[{"name":"Amina"}]'::JSONB,
  '[{"url":"https://example.com/gallery-1.jpg"}]'::JSONB,
  '{"cancellation":"Flexible","deposit":"20%","pickup":"Hotel pickup","child":"Allowed","refund":"Case by case","weather":"Weather backup","emergency":"Hotline","supportHours":"24/7"}'::JSONB,
  '{"cnicNumber":"35202-1234567-1"}'::JSONB,
  '35202-1234567-1',
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  business_name = EXCLUDED.business_name,
  contact_name = EXCLUDED.contact_name,
  slug = EXCLUDED.slug,
  is_public = EXCLUDED.is_public,
  description = EXCLUDED.description,
  company_logo_url = EXCLUDED.company_logo_url,
  primary_city = EXCLUDED.primary_city,
  coverage_range = EXCLUDED.coverage_range,
  categories = EXCLUDED.categories,
  years_experience = EXCLUDED.years_experience,
  team_size = EXCLUDED.team_size,
  phone_number = EXCLUDED.phone_number,
  email = EXCLUDED.email,
  registration_number = EXCLUDED.registration_number,
  fleet_assets = EXCLUDED.fleet_assets,
  guide_profiles = EXCLUDED.guide_profiles,
  gallery_media = EXCLUDED.gallery_media,
  public_policies = EXCLUDED.public_policies,
  verification_documents = EXCLUDED.verification_documents,
  kyc_verified_cnic = EXCLUDED.kyc_verified_cnic,
  kyc_verified_at = EXCLUDED.kyc_verified_at;

INSERT INTO public.tour_operator_profiles (
  user_id,
  company_name,
  business_name,
  contact_name,
  slug,
  is_public,
  description,
  company_logo_url,
  primary_city,
  coverage_range,
  categories,
  years_experience,
  team_size,
  phone_number,
  email,
  registration_number,
  fleet_assets,
  guide_profiles,
  gallery_media,
  public_policies,
  verification_documents,
  kyc_verified_cnic,
  kyc_verified_at
)
VALUES (
  (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
  'Strong Signal Expeditions',
  'Strong Signal Expeditions',
  'Strong Regression Operator',
  'strong-signal-expeditions',
  TRUE,
  'High-confidence operator fixture used to validate calibration ordering.',
  'https://example.com/strong-logo.png',
  'Skardu',
  'Northern Areas',
  ARRAY['expeditions', 'trekking'],
  '14 years',
  '28 guides',
  '+92-300-1111111',
  'strong_signal@test.invalid',
  'REG-QUALITY-STRONG',
  '[{"type":"coaster"},{"type":"4x4"}]'::JSONB,
  '[{"name":"Bilal"},{"name":"Sana"}]'::JSONB,
  '[{"url":"https://example.com/strong-gallery-1.jpg"}]'::JSONB,
  '{"cancellation":"Flexible","deposit":"25%","pickup":"Airport transfer","child":"Allowed","refund":"Available","weather":"Backup route","emergency":"Satellite support","supportHours":"24/7"}'::JSONB,
  '{"cnicNumber":"35202-7654321-0","phoneVerified":"true","emailVerified":"true","businessRegistrationVerified":"true","insuranceVerified":"true"}'::JSONB,
  '35202-7654321-0',
  NOW()
),
(
  (SELECT val FROM _quality_ids WHERE key = 'weak_operator'),
  'Weak Signal Tours',
  'Weak Signal Tours',
  'Weak Regression Operator',
  'weak-signal-tours',
  TRUE,
  'Minimal fixture used to verify sparse-data ranking penalties.',
  '',
  '',
  '',
  ARRAY[]::TEXT[],
  '',
  '',
  '',
  '',
  '',
  '[]'::JSONB,
  '[]'::JSONB,
  '[]'::JSONB,
  '{}'::JSONB,
  '{}'::JSONB,
  NULL,
  NULL
)
ON CONFLICT (user_id) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  business_name = EXCLUDED.business_name,
  contact_name = EXCLUDED.contact_name,
  slug = EXCLUDED.slug,
  is_public = EXCLUDED.is_public,
  description = EXCLUDED.description,
  company_logo_url = EXCLUDED.company_logo_url,
  primary_city = EXCLUDED.primary_city,
  coverage_range = EXCLUDED.coverage_range,
  categories = EXCLUDED.categories,
  years_experience = EXCLUDED.years_experience,
  team_size = EXCLUDED.team_size,
  phone_number = EXCLUDED.phone_number,
  email = EXCLUDED.email,
  registration_number = EXCLUDED.registration_number,
  fleet_assets = EXCLUDED.fleet_assets,
  guide_profiles = EXCLUDED.guide_profiles,
  gallery_media = EXCLUDED.gallery_media,
  public_policies = EXCLUDED.public_policies,
  verification_documents = EXCLUDED.verification_documents,
  kyc_verified_cnic = EXCLUDED.kyc_verified_cnic,
  kyc_verified_at = EXCLUDED.kyc_verified_at;

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
  short_description,
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
  is_published,
  is_verified,
  status
)
VALUES (
  (SELECT val FROM _quality_ids WHERE key = 'tour'),
  (SELECT val FROM _quality_ids WHERE key = 'operator'),
  'RPC Quality Test Tour',
  'guided',
  '{"city":"Lahore","country":"Pakistan"}'::JSONB,
  '2 days',
  12000,
  12000,
  'PKR',
  'Tour fixture for storefront analytics and quality scoring.',
  'Regression tour',
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
  ARRAY['Guided support'],
  ARRAY['Water'],
  ARRAY['en'],
  1,
  10,
  10,
  70,
  'moderate',
  TRUE,
  TRUE,
  TRUE,
  'live'::public.moderation_status_enum
)
ON CONFLICT (id) DO NOTHING;

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
  short_description,
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
  is_published,
  is_verified,
  status
)
VALUES
(
  (SELECT val FROM _quality_ids WHERE key = 'strong_tour'),
  (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
  'Strong Signal Expedition',
  'guided',
  '{"city":"Skardu","country":"Pakistan"}'::JSONB,
  '5 days',
  55000,
  55000,
  'PKR',
  'High-confidence calibration fixture.',
  'Strong fixture tour',
  TRUE,
  TRUE,
  25,
  'flexible',
  'flexible'::public.cancellation_policy_type_enum,
  '{}'::TEXT[],
  '{}'::TEXT[],
  '{}'::TEXT[],
  '{}'::TEXT[],
  '[]'::JSONB,
  ARRAY['Alpine support'],
  ARRAY['Jacket'],
  ARRAY['en'],
  1,
  12,
  16,
  70,
  'challenging',
  TRUE,
  TRUE,
  TRUE,
  'live'::public.moderation_status_enum
),
(
  (SELECT val FROM _quality_ids WHERE key = 'weak_tour'),
  (SELECT val FROM _quality_ids WHERE key = 'weak_operator'),
  'Weak Signal Day Tour',
  'guided',
  '{"city":"Karachi","country":"Pakistan"}'::JSONB,
  '1 day',
  5000,
  5000,
  'PKR',
  'Sparse-data calibration fixture.',
  'Weak fixture tour',
  FALSE,
  FALSE,
  0,
  'strict',
  'strict'::public.cancellation_policy_type_enum,
  '{}'::TEXT[],
  '{}'::TEXT[],
  '{}'::TEXT[],
  '{}'::TEXT[],
  '[]'::JSONB,
  ARRAY['Basic transfer'],
  ARRAY['Snacks'],
  ARRAY['en'],
  1,
  6,
  10,
  70,
  'easy',
  TRUE,
  TRUE,
  FALSE,
  'live'::public.moderation_status_enum
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_schedules (
  id,
  tour_id,
  start_time,
  end_time,
  capacity,
  booked_count,
  status
)
VALUES (
  (SELECT val FROM _quality_ids WHERE key = 'schedule'),
  (SELECT val FROM _quality_ids WHERE key = 'tour'),
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days 8 hours',
  12,
  1,
  'scheduled'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_schedules (
  id,
  tour_id,
  start_time,
  end_time,
  capacity,
  booked_count,
  status
)
VALUES
(
  (SELECT val FROM _quality_ids WHERE key = 'strong_schedule'),
  (SELECT val FROM _quality_ids WHERE key = 'strong_tour'),
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '15 days',
  16,
  4,
  'scheduled'
),
(
  (SELECT val FROM _quality_ids WHERE key = 'weak_schedule'),
  (SELECT val FROM _quality_ids WHERE key = 'weak_tour'),
  NOW() + INTERVAL '8 days',
  NOW() + INTERVAL '8 days 6 hours',
  6,
  0,
  'scheduled'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_bookings (
  id,
  schedule_id,
  tour_id,
  traveler_id,
  total_price,
  pax_count,
  status,
  payment_status,
  booking_date,
  paid_at
)
VALUES (
  (SELECT val FROM _quality_ids WHERE key = 'booking'),
  (SELECT val FROM _quality_ids WHERE key = 'schedule'),
  (SELECT val FROM _quality_ids WHERE key = 'tour'),
  (SELECT val FROM _quality_ids WHERE key = 'traveler'),
  12000,
  1,
  'completed',
  'paid',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_bookings (
  id,
  schedule_id,
  tour_id,
  traveler_id,
  total_price,
  pax_count,
  status,
  payment_status,
  booking_date,
  paid_at
)
VALUES
(
  (SELECT val FROM _quality_ids WHERE key = 'strong_booking'),
  (SELECT val FROM _quality_ids WHERE key = 'strong_schedule'),
  (SELECT val FROM _quality_ids WHERE key = 'strong_tour'),
  (SELECT val FROM _quality_ids WHERE key = 'traveler'),
  55000,
  2,
  'completed',
  'paid',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
(
  (SELECT val FROM _quality_ids WHERE key = 'weak_booking'),
  (SELECT val FROM _quality_ids WHERE key = 'weak_schedule'),
  (SELECT val FROM _quality_ids WHERE key = 'weak_tour'),
  (SELECT val FROM _quality_ids WHERE key = 'traveler'),
  5000,
  1,
  'cancelled',
  'refunded',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tour_booking_reviews (
  booking_id,
  traveler_id,
  tour_id,
  rating,
  rating_communication,
  rating_punctuality,
  rating_transport,
  rating_guide,
  rating_safety,
  rating_cleanliness,
  rating_value,
  rating_itinerary,
  title,
  body,
  status,
  created_at,
  updated_at
)
VALUES (
  (SELECT val FROM _quality_ids WHERE key = 'booking'),
  (SELECT val FROM _quality_ids WHERE key = 'traveler'),
  (SELECT val FROM _quality_ids WHERE key = 'tour'),
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  'Reliable guide team',
  'The operator communicated clearly and handled logistics well throughout the tour.',
  'published',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (booking_id) DO NOTHING;

SELECT public.refresh_operator_public_metrics((SELECT val FROM _quality_ids WHERE key = 'operator'));

INSERT INTO public.operator_public_metrics (
  operator_id,
  avg_rating,
  total_reviews,
  total_completed_bookings,
  total_travelers_served,
  cancellation_rate,
  verified_badge_count,
  last_calculated_at
)
VALUES
(
  (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
  4.90,
  24,
  24,
  18,
  0.00,
  6,
  NOW()
),
(
  (SELECT val FROM _quality_ids WHERE key = 'weak_operator'),
  3.20,
  1,
  1,
  1,
  20.00,
  0,
  NOW()
)
ON CONFLICT (operator_id) DO UPDATE
SET
  avg_rating = EXCLUDED.avg_rating,
  total_reviews = EXCLUDED.total_reviews,
  total_completed_bookings = EXCLUDED.total_completed_bookings,
  total_travelers_served = EXCLUDED.total_travelers_served,
  cancellation_rate = EXCLUDED.cancellation_rate,
  verified_badge_count = EXCLUDED.verified_badge_count,
  last_calculated_at = EXCLUDED.last_calculated_at;

INSERT INTO public.booking_conversations (
  id,
  booking_scope,
  booking_id,
  subject,
  created_by,
  created_at,
  updated_at,
  last_message_at,
  last_message_preview
)
VALUES (
  (SELECT val FROM _quality_ids WHERE key = 'conversation'),
  'tour_booking'::public.messaging_booking_scope_enum,
  (SELECT val FROM _quality_ids WHERE key = 'booking'),
  'Regression storefront response test',
  (SELECT val FROM _quality_ids WHERE key = 'traveler'),
  NOW() - INTERVAL '40 minutes',
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '5 minutes',
  'Following up on pickup details'
)
ON CONFLICT (booking_scope, booking_id) DO NOTHING;

INSERT INTO public.booking_conversations (
  id,
  booking_scope,
  booking_id,
  subject,
  created_by,
  created_at,
  updated_at,
  last_message_at,
  last_message_preview
)
VALUES
(
  (SELECT val FROM _quality_ids WHERE key = 'strong_conversation'),
  'tour_booking'::public.messaging_booking_scope_enum,
  (SELECT val FROM _quality_ids WHERE key = 'strong_booking'),
  'Strong calibration response fixture',
  (SELECT val FROM _quality_ids WHERE key = 'traveler'),
  NOW() - INTERVAL '70 minutes',
  NOW() - INTERVAL '15 minutes',
  NOW() - INTERVAL '15 minutes',
  'Thanks for the quick confirmation'
),
(
  (SELECT val FROM _quality_ids WHERE key = 'weak_conversation'),
  'tour_booking'::public.messaging_booking_scope_enum,
  (SELECT val FROM _quality_ids WHERE key = 'weak_booking'),
  'Weak calibration response fixture',
  (SELECT val FROM _quality_ids WHERE key = 'traveler'),
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '90 minutes',
  NOW() - INTERVAL '90 minutes',
  'Still waiting for confirmation'
)
ON CONFLICT (booking_scope, booking_id) DO NOTHING;

INSERT INTO public.booking_conversation_messages (
  conversation_id,
  sender_id,
  sender_role,
  body,
  created_at
)
VALUES
  (
    (SELECT val FROM _quality_ids WHERE key = 'conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    'traveler'::public.messaging_participant_role_enum,
    'Can you confirm the pickup window?',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'operator'::public.messaging_participant_role_enum,
    'Yes, pickup starts at 7:30 AM.',
    NOW() - INTERVAL '20 minutes'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    'traveler'::public.messaging_participant_role_enum,
    'Thanks. Is breakfast included?',
    NOW() - INTERVAL '10 minutes'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    'traveler'::public.messaging_participant_role_enum,
    'Can you confirm the camp setup?',
    NOW() - INTERVAL '60 minutes'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'operator'::public.messaging_participant_role_enum,
    'Yes, private camps are reserved for both nights.',
    NOW() - INTERVAL '45 minutes'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    'traveler'::public.messaging_participant_role_enum,
    'Do you arrange airport pickup too?',
    NOW() - INTERVAL '25 minutes'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'operator'::public.messaging_participant_role_enum,
    'Yes, pickup is included from Skardu airport.',
    NOW() - INTERVAL '15 minutes'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'weak_conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    'traveler'::public.messaging_participant_role_enum,
    'Is the operator still running this tour?',
    NOW() - INTERVAL '2 hours'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'weak_conversation'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    'traveler'::public.messaging_participant_role_enum,
    'Can someone confirm the pickup point?',
    NOW() - INTERVAL '90 minutes'
  );

INSERT INTO public.operator_storefront_events (
  operator_id,
  event_type,
  slug,
  session_id,
  created_at,
  metadata
)
VALUES
  (
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'profile_view',
    'rpc-quality-test-operator',
    'session-alpha',
    NOW() - INTERVAL '2 hours',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'cta_click',
    'rpc-quality-test-operator',
    'session-alpha',
    NOW() - INTERVAL '110 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'booking_start',
    'rpc-quality-test-operator',
    'session-alpha',
    NOW() - INTERVAL '100 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'profile_view',
    'rpc-quality-test-operator',
    'session-bravo',
    NOW() - INTERVAL '90 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'booking_start',
    'rpc-quality-test-operator',
    'session-charlie',
    NOW() - INTERVAL '80 minutes',
    '{"permutation":"direct_without_profile_view"}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'booking_start',
    'rpc-quality-test-operator',
    'session-delta',
    NOW() - INTERVAL '70 minutes',
    '{"permutation":"direct_without_profile_view_medium_confidence"}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'profile_view',
    'strong-signal-expeditions',
    'strong-session-a',
    NOW() - INTERVAL '5 hours',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'cta_click',
    'strong-signal-expeditions',
    'strong-session-a',
    NOW() - INTERVAL '295 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'booking_start',
    'strong-signal-expeditions',
    'strong-session-a',
    NOW() - INTERVAL '290 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'profile_view',
    'strong-signal-expeditions',
    'strong-session-b',
    NOW() - INTERVAL '270 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'cta_click',
    'strong-signal-expeditions',
    'strong-session-b',
    NOW() - INTERVAL '265 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'booking_start',
    'strong-signal-expeditions',
    'strong-session-b',
    NOW() - INTERVAL '260 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'profile_view',
    'strong-signal-expeditions',
    'strong-session-c',
    NOW() - INTERVAL '240 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'cta_click',
    'strong-signal-expeditions',
    'strong-session-c',
    NOW() - INTERVAL '235 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'booking_start',
    'strong-signal-expeditions',
    'strong-session-c',
    NOW() - INTERVAL '230 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'profile_view',
    'strong-signal-expeditions',
    'strong-session-d',
    NOW() - INTERVAL '210 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'cta_click',
    'strong-signal-expeditions',
    'strong-session-d',
    NOW() - INTERVAL '205 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'booking_start',
    'strong-signal-expeditions',
    'strong-session-d',
    NOW() - INTERVAL '200 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'strong_operator'),
    'profile_view',
    'strong-signal-expeditions',
    'strong-session-e',
    NOW() - INTERVAL '180 minutes',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'weak_operator'),
    'profile_view',
    'weak-signal-tours',
    'weak-session-a',
    NOW() - INTERVAL '4 hours',
    '{}'::JSONB
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'weak_operator'),
    'profile_view',
    'weak-signal-tours',
    'weak-session-b',
    NOW() - INTERVAL '3 hours',
    '{}'::JSONB
  );

INSERT INTO public.reports (
  id,
  reporter_id,
  target_entity_id,
  target_entity_type,
  report_reason,
  details,
  status,
  created_at
)
VALUES
  (
    (SELECT val FROM _quality_ids WHERE key = 'report_open'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'partner',
    'late_response',
    'Open report fixture',
    'open'::public.report_status_enum,
    NOW() - INTERVAL '6 hours'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'report_resolved'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    (SELECT val FROM _quality_ids WHERE key = 'operator'),
    'partner',
    'communication',
    'Resolved report fixture',
    'resolved'::public.report_status_enum,
    NOW() - INTERVAL '5 hours'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'weak_report_open_one'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    (SELECT val FROM _quality_ids WHERE key = 'weak_operator'),
    'partner',
    'safety',
    'Weak operator open report one',
    'open'::public.report_status_enum,
    NOW() - INTERVAL '7 hours'
  ),
  (
    (SELECT val FROM _quality_ids WHERE key = 'weak_report_open_two'),
    (SELECT val FROM _quality_ids WHERE key = 'traveler'),
    (SELECT val FROM _quality_ids WHERE key = 'weak_operator'),
    'partner',
    'communication',
    'Weak operator open report two',
    'open'::public.report_status_enum,
    NOW() - INTERVAL '6 hours'
  );

DO $$
DECLARE
  v_response RECORD;
  v_storefront RECORD;
  v_quality RECORD;
  v_strong_quality RECORD;
  v_weak_quality RECORD;
  v_admin UUID := (SELECT val FROM _quality_ids WHERE key = 'admin');
  v_operator UUID := (SELECT val FROM _quality_ids WHERE key = 'operator');
  v_strong_operator UUID := (SELECT val FROM _quality_ids WHERE key = 'strong_operator');
  v_weak_operator UUID := (SELECT val FROM _quality_ids WHERE key = 'weak_operator');
BEGIN
  SELECT *
  INTO v_response
  FROM public.get_operator_storefront_response_metrics(v_operator, 90);

  ASSERT v_response.traveler_messages = 2,
    'FAIL: Response metrics should count 2 traveler messages';
  ASSERT v_response.responded_messages = 1,
    'FAIL: Response metrics should count 1 responded traveler message';
  ASSERT v_response.response_rate = 50.00,
    'FAIL: Response rate should be 50.00';
  ASSERT v_response.avg_response_minutes = 10.00,
    'FAIL: Average response time should be 10.00 minutes';
  RAISE NOTICE 'PASS: Response metrics RPC returns expected counts and timing';

  SELECT *
  INTO v_storefront
  FROM public.get_operator_storefront_analytics(v_operator, 90);

  ASSERT v_storefront.profile_views = 2,
    'FAIL: Storefront analytics should count 2 profile views';
  ASSERT v_storefront.unique_visitors = 2,
    'FAIL: Storefront analytics should count 2 unique visitors';
  ASSERT v_storefront.engaged_visitors = 1,
    'FAIL: Storefront analytics should count 1 engaged visitor';
  ASSERT v_storefront.cta_clicks = 1,
    'FAIL: Storefront analytics should count 1 CTA click';
  ASSERT v_storefront.booking_starts = 3,
    'FAIL: Storefront analytics should count 3 booking starts including the direct control cases';
  ASSERT v_storefront.attributed_booking_starts = 1,
    'FAIL: Storefront analytics should count only 1 attributed booking start';
  ASSERT v_storefront.attributed_conversion_rate = 50.00,
    'FAIL: Storefront analytics should only attribute 50.00% of visitors to booking starts';
  RAISE NOTICE 'PASS: Storefront analytics distinguish attributed and direct booking starts';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);
  SET LOCAL role = authenticated;

  SELECT *
  INTO v_quality
  FROM public.admin_get_operator_quality_score(v_operator, 90);

  SELECT *
  INTO v_strong_quality
  FROM public.admin_get_operator_quality_score(v_strong_operator, 90);

  SELECT *
  INTO v_weak_quality
  FROM public.admin_get_operator_quality_score(v_weak_operator, 90);

  RESET role;

  ASSERT v_quality.operator_id = v_operator,
    'FAIL: Quality score should return the requested operator id';
  ASSERT v_quality.avg_rating = 4.00,
    'FAIL: Quality score should include the published review rating';
  ASSERT v_quality.total_reviews = 1,
    'FAIL: Quality score should count 1 published review';
  ASSERT v_quality.verified_badge_count = 2,
    'FAIL: Quality score should expose the refreshed verified badge count';
  ASSERT v_quality.response_rate = 50.00,
    'FAIL: Quality score should carry through response_rate = 50.00';
  ASSERT v_quality.avg_response_minutes = 10.00,
    'FAIL: Quality score should carry through avg_response_minutes = 10.00';
  ASSERT v_quality.open_report_count = 1,
    'FAIL: Quality score should count 1 open report';
  ASSERT v_quality.total_report_count = 2,
    'FAIL: Quality score should count 2 total reports';
  ASSERT v_quality.storefront_completion_rate = 100.00,
    'FAIL: Quality score should report a complete storefront profile';
  ASSERT v_quality.engagement_rate = 50.00,
    'FAIL: Quality score should carry through engagement_rate = 50.00';
  ASSERT v_quality.attributed_conversion_rate = 50.00,
    'FAIL: Quality score should carry through attributed_conversion_rate = 50.00';
  ASSERT v_quality.booking_starts = 3,
    'FAIL: Quality score should count 3 booking starts';
  ASSERT v_quality.attributed_booking_starts = 1,
    'FAIL: Quality score should count 1 attributed booking start';
  ASSERT v_quality.score_policy_version = 'operator_quality_v2',
    'FAIL: Quality score should expose the updated score policy version';
  ASSERT (v_quality.score_reason_codes -> 'review_quality') ? 'low_review_volume',
    'FAIL: Quality score should expose review-volume reason codes';
  ASSERT (v_quality.score_reason_codes -> 'performance') ? 'conversion_after_profile_view',
    'FAIL: Quality score should expose performance reason codes';
  ASSERT (v_quality.score_reason_codes -> 'calibration') ? 'partial_signal_only',
    'FAIL: Quality score should expose the partial-signal calibration reason code';
  ASSERT v_quality.score_input_snapshot ->> 'review_volume_confidence' = 'low',
    'FAIL: Quality score should expose the review confidence bucket';
  ASSERT v_quality.score_input_snapshot ->> 'ranking_confidence_band' = 'medium',
    'FAIL: Quality score should expose the medium ranking confidence band';
  ASSERT (v_quality.score_input_snapshot ->> 'ranking_confidence_multiplier')::NUMERIC = 0.80,
    'FAIL: Quality score should apply the tuned partial-signal ranking multiplier';
  ASSERT (v_quality.score_input_snapshot ->> 'raw_total_score')::NUMERIC = 70.75,
    'FAIL: Quality score should expose the raw pre-confidence score';
  ASSERT v_quality.total_score = 56.60,
    'FAIL: Quality score should return the confidence-adjusted score';
  ASSERT v_quality.score_input_snapshot ->> 'minimum_data_warning' = 'true',
    'FAIL: Quality score should expose the sparse-data warning';
  ASSERT v_quality.score_input_snapshot ->> 'critical_sparse_data_warning' = 'false',
    'FAIL: Quality score should clear the strict sparse-data warning when booking intent is established';

  ASSERT v_strong_quality.score_policy_version = 'operator_quality_v2',
    'FAIL: Strong fixture should use the updated score policy version';
  ASSERT v_strong_quality.total_reviews = 24,
    'FAIL: Strong fixture should expose the high review count';
  ASSERT v_strong_quality.booking_starts = 4,
    'FAIL: Strong fixture should expose the expected booking-start volume';
  ASSERT v_strong_quality.score_input_snapshot ->> 'ranking_confidence_band' = 'medium',
    'FAIL: Strong fixture should have at least medium ranking confidence';
  ASSERT (v_strong_quality.score_input_snapshot ->> 'ranking_confidence_multiplier')::NUMERIC = 1.00,
    'FAIL: Strong fixture should not receive a sparse-data confidence penalty';
  ASSERT (v_strong_quality.score_reason_codes -> 'calibration') ? 'sufficient_signal_for_ranking',
    'FAIL: Strong fixture should advertise sufficient ranking signal';

  ASSERT v_weak_quality.total_reviews = 1,
    'FAIL: Weak fixture should expose the low review count';
  ASSERT v_weak_quality.booking_starts = 0,
    'FAIL: Weak fixture should expose zero booking starts';
  ASSERT v_weak_quality.score_input_snapshot ->> 'ranking_confidence_band' = 'low',
    'FAIL: Weak fixture should be tagged as low-confidence';
  ASSERT (v_weak_quality.score_input_snapshot ->> 'ranking_confidence_multiplier')::NUMERIC = 0.70,
    'FAIL: Weak fixture should receive the sparse-data penalty';
  ASSERT (v_weak_quality.score_reason_codes -> 'calibration') ? 'low_reviews_and_low_booking_starts',
    'FAIL: Weak fixture should expose the sparse calibration reason';

  ASSERT v_strong_quality.total_score > v_quality.total_score,
    'FAIL: Strong fixture should outrank the sparse baseline fixture';
  ASSERT v_quality.total_score > v_weak_quality.total_score,
    'FAIL: Sparse baseline fixture should still outrank the obviously weak fixture';
  RAISE NOTICE 'PASS: Quality score RPC returns the expected regression fixture values';
END;
$$;

ROLLBACK;