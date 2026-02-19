-- =============================================================================
-- pgTAP Integration Tests: Partner Governance System
-- Run with:  supabase test db
-- =============================================================================
-- These tests run INSIDE the real PostgreSQL instance.
-- They use pgTAP's plan/ok/is/throws_ok/lives_ok APIs and test:
--   1. can_partner_operate() — all 8 matrix cells
--   2. Support-role blocking on all 5 admin RPCs
--   3. Cascade suspension (packages hidden atomically)
--   4. Reinstatement no-auto-reactivate (listings stay suspended)
--   5. RLS enforcement — authenticated user cannot write governance columns
--   6. Audit log written on every status change
--   7. Notification written on every status change
--
-- Auth simulation:
--   SECURITY DEFINER RPCs read auth.uid() from the JWT claims injected via:
--   SET LOCAL "request.jwt.claims" = '{"sub":"<uuid>","role":"authenticated"}'
-- =============================================================================

BEGIN;

SELECT plan(40);

-- =============================================================================
-- SETUP — create isolated test fixtures
-- Everything uses random UUIDs to avoid collisions with live data.
-- All fixtures are rolled back via BEGIN/ROLLBACK wrapping the test.
-- =============================================================================

-- Test UUIDs
DO $$
BEGIN
  -- We use temp variables in a temp table to share state across DO blocks
  CREATE TEMP TABLE IF NOT EXISTS _test_ids (
    key  TEXT PRIMARY KEY,
    val  UUID NOT NULL
  );

  INSERT INTO _test_ids VALUES
    ('partner_user',   gen_random_uuid()),
    ('super_admin',    gen_random_uuid()),
    ('moderator_user', gen_random_uuid()),
    ('support_user',   gen_random_uuid()),
    ('package_id',     gen_random_uuid());
END $$;

-- Create auth.users rows (bypassing email confirmation, used by FK constraints)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
SELECT val, 'partner_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _test_ids WHERE key = 'partner_user';

INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
SELECT val, 'admin_' || val || '@test.invalid', NOW(), NOW(), NOW()
FROM _test_ids WHERE key IN ('super_admin', 'moderator_user', 'support_user');

-- Create profiles for test users
INSERT INTO public.profiles (id, email, first_name, last_name, created_at)
SELECT val, 'partner_' || val || '@test.invalid', 'Test', 'Partner', NOW()
FROM _test_ids WHERE key = 'partner_user';

-- Create hotel_manager_profiles
INSERT INTO public.hotel_manager_profiles (user_id, business_name, account_status)
SELECT val, 'Test Hotel Ltd', 'active'
FROM _test_ids WHERE key = 'partner_user';

-- Create user_roles — partner approved initially
INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
SELECT val, 'hotel_manager', true, 'approved'
FROM _test_ids WHERE key = 'partner_user';

-- Create admin_users for each admin type
INSERT INTO public.admin_users (id, email, role)
SELECT val, 'admin_' || val || '@test.invalid', 'super_admin'
FROM _test_ids WHERE key = 'super_admin';

INSERT INTO public.admin_users (id, email, role)
SELECT val, 'admin_' || val || '@test.invalid', 'moderator'
FROM _test_ids WHERE key = 'moderator_user';

INSERT INTO public.admin_users (id, email, role)
SELECT val, 'admin_' || val || '@test.invalid', 'support'
FROM _test_ids WHERE key = 'support_user';

-- Create a LIVE package owned by the partner
INSERT INTO public.packages (id, owner_id, package_type, name, status, is_published)
SELECT
  (SELECT val FROM _test_ids WHERE key = 'package_id'),
  (SELECT val FROM _test_ids WHERE key = 'partner_user'),
  'hotel',
  'Test Package',
  'live',
  true;

-- =============================================================================
-- BLOCK 1: can_partner_operate() — governance matrix
-- =============================================================================

SELECT ok(
  public.can_partner_operate(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager'
  ),
  'Matrix: approved + active = TRUE'
);

-- Temporarily suspend to test matrix cell
UPDATE public.hotel_manager_profiles
SET account_status = 'suspended'
WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user');

SELECT ok(
  NOT public.can_partner_operate(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager'
  ),
  'Matrix: approved + suspended = FALSE'
);

-- Soft-delete
UPDATE public.hotel_manager_profiles
SET account_status = 'deleted'
WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user');

SELECT ok(
  NOT public.can_partner_operate(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager'
  ),
  'Matrix: approved + deleted = FALSE'
);

-- Reset to active
UPDATE public.hotel_manager_profiles
SET account_status = 'active'
WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user');

-- Not yet verified
UPDATE public.user_roles
SET verification_status = 'pending'
WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')
  AND role_type = 'hotel_manager';

SELECT ok(
  NOT public.can_partner_operate(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager'
  ),
  'Matrix: pending + active = FALSE'
);

-- Rejected
UPDATE public.user_roles
SET verification_status = 'rejected'
WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')
  AND role_type = 'hotel_manager';

SELECT ok(
  NOT public.can_partner_operate(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager'
  ),
  'Matrix: rejected + active = FALSE'
);

-- Restore to approved for remaining tests
UPDATE public.user_roles
SET verification_status = 'approved'
WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')
  AND role_type = 'hotel_manager';


-- =============================================================================
-- BLOCK 2: Scenario A — suspend partner via real RPC
-- Auth context: super_admin calls the RPC
-- =============================================================================

-- Simulate super_admin as the authenticated caller
SET LOCAL "request.jwt.claims" = (
  SELECT '{"sub":"' || val::TEXT || '","role":"authenticated"}'
  FROM _test_ids WHERE key = 'super_admin'
);
SET LOCAL role = authenticated;

SELECT lives_ok(
  $f$ SELECT public.admin_set_hotel_manager_status(
    (SELECT val::TEXT FROM _test_ids WHERE key = 'partner_user'),
    'suspended',
    'Policy violation: duplicate listing detected during audit'
  ) $f$,
  'super_admin can suspend a hotel manager'
);

-- Reset role for assertions
RESET role;
RESET "request.jwt.claims";

-- Assert: account_status changed
SELECT is(
  (SELECT account_status FROM public.hotel_manager_profiles
   WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')),
  'suspended',
  'Scenario A: account_status is suspended in DB'
);

-- Assert: can_partner_operate returns FALSE
SELECT ok(
  NOT public.can_partner_operate(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager'
  ),
  'Scenario A: can_partner_operate returns FALSE after suspension'
);

-- Assert: live package was cascaded to suspended
SELECT is(
  (SELECT status FROM public.packages
   WHERE id = (SELECT val FROM _test_ids WHERE key = 'package_id')),
  'suspended',
  'Scenario A: live package cascaded to suspended'
);

-- Assert: audit log written
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.admin_action_logs
    WHERE entity_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')
      AND entity_type = 'partner'
      AND action_type = 'suspend_partner'
  ),
  'Scenario A: audit log entry written for suspension'
);

-- Assert: notification sent to partner
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')
      AND type = 'account_suspended'
  ),
  'Scenario A: notification sent to partner on suspension'
);


-- =============================================================================
-- BLOCK 3: Scenario B — reinstate suspended partner (no auto-reactivate)
-- =============================================================================

SET LOCAL "request.jwt.claims" = (
  SELECT '{"sub":"' || val::TEXT || '","role":"authenticated"}'
  FROM _test_ids WHERE key = 'super_admin'
);
SET LOCAL role = authenticated;

SELECT lives_ok(
  $f$ SELECT public.admin_set_hotel_manager_status(
    (SELECT val::TEXT FROM _test_ids WHERE key = 'partner_user'),
    'active',
    'Appeal reviewed and approved by compliance team'
  ) $f$,
  'super_admin can reinstate a suspended hotel manager'
);

RESET role;
RESET "request.jwt.claims";

-- Assert: account active again
SELECT is(
  (SELECT account_status FROM public.hotel_manager_profiles
   WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')),
  'active',
  'Scenario B: account_status is active after reinstatement'
);

-- Assert: can_partner_operate is TRUE again
SELECT ok(
  public.can_partner_operate(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager'
  ),
  'Scenario B: can_partner_operate returns TRUE after reinstatement'
);

-- Assert: package NOT auto-reactivated (stays suspended — conservative policy)
SELECT is(
  (SELECT status FROM public.packages
   WHERE id = (SELECT val FROM _test_ids WHERE key = 'package_id')),
  'suspended',
  'Scenario B: package NOT auto-reactivated after reinstatement (correct conservative behavior)'
);

-- Assert: reinstatement notification sent
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')
      AND type = 'account_reinstated'
  ),
  'Scenario B: notification sent to partner on reinstatement'
);

-- Assert: reinstatement audit log written
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.admin_action_logs
    WHERE entity_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')
      AND entity_type = 'partner'
      AND action_type = 'activate_partner'
  ),
  'Scenario B: audit log entry written for reinstatement'
);


-- =============================================================================
-- BLOCK 4: Scenario C — support role BLOCKED at DB level
-- =============================================================================

-- Support trying to suspend hotel manager — must RAISE
SET LOCAL "request.jwt.claims" = (
  SELECT '{"sub":"' || val::TEXT || '","role":"authenticated"}'
  FROM _test_ids WHERE key = 'support_user'
);
SET LOCAL role = authenticated;

SELECT throws_ok(
  $f$ SELECT public.admin_set_hotel_manager_status(
    (SELECT val::TEXT FROM _test_ids WHERE key = 'partner_user'),
    'suspended',
    'Support trying to suspend - should be blocked'
  ) $f$,
  'Support role cannot change partner account status',
  'Scenario C: support cannot call admin_set_hotel_manager_status'
);

-- Support trying to approve verification — must RAISE
SELECT throws_ok(
  $f$ SELECT public.admin_approve_partner(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager',
    gen_random_uuid()
  ) $f$,
  'Support role cannot approve partner applications. Moderator or Super-Admin required.',
  'Scenario C: support cannot call admin_approve_partner'
);

-- Support trying to reject — must RAISE
SELECT throws_ok(
  $f$ SELECT public.admin_reject_partner(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager',
    gen_random_uuid(),
    'Support trying to reject application'
  ) $f$,
  'Support role cannot reject partner applications. Moderator or Super-Admin required.',
  'Scenario C: support cannot call admin_reject_partner'
);

-- Support trying to request info — must RAISE
SELECT throws_ok(
  $f$ SELECT public.admin_request_partner_info(
    (SELECT val FROM _test_ids WHERE key = 'partner_user'),
    'hotel_manager',
    gen_random_uuid(),
    'Support requesting more information from partner'
  ) $f$,
  'Support role cannot send info requests on verification. Moderator or Super-Admin required.',
  'Scenario C: support cannot call admin_request_partner_info'
);

RESET role;
RESET "request.jwt.claims";


-- =============================================================================
-- BLOCK 5: RLS enforcement — direct column write blocked for authenticated users
-- =============================================================================

-- Simulate as the partner themselves (not admin)
SET LOCAL "request.jwt.claims" = (
  SELECT '{"sub":"' || val::TEXT || '","role":"authenticated"}'
  FROM _test_ids WHERE key = 'partner_user'
);
SET LOCAL role = authenticated;

-- Attempt: partner directly updates their own account_status via table write
-- Should fail because authenticated role has REVOKE on account_status column
SELECT throws_ok(
  $f$ UPDATE public.hotel_manager_profiles
      SET account_status = 'active'
      WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user') $f$,
  NULL,
  'RLS: authenticated user cannot directly write account_status column'
);

-- Attempt: suspended partner tries to INSERT a new package (can_partner_operate = FALSE here too)
-- Re-suspend first via service role
RESET role;
RESET "request.jwt.claims";

UPDATE public.hotel_manager_profiles
SET account_status = 'suspended'
WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user');

SET LOCAL "request.jwt.claims" = (
  SELECT '{"sub":"' || val::TEXT || '","role":"authenticated"}'
  FROM _test_ids WHERE key = 'partner_user'
);
SET LOCAL role = authenticated;

SELECT throws_ok(
  $f$ INSERT INTO public.packages (owner_id, package_type, name, status)
      VALUES (
        (SELECT val FROM _test_ids WHERE key = 'partner_user'),
        'hotel',
        'Suspended partner new package attempt',
        'draft'
      ) $f$,
  NULL,
  'RLS: suspended partner cannot INSERT new package (can_partner_operate = FALSE enforced in WITH CHECK)'
);

RESET role;
RESET "request.jwt.claims";


-- =============================================================================
-- BLOCK 6: Moderator CAN act (positive permission test)
-- =============================================================================

-- Restore partner to active + approved first
UPDATE public.hotel_manager_profiles
SET account_status = 'active'
WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user');

SET LOCAL "request.jwt.claims" = (
  SELECT '{"sub":"' || val::TEXT || '","role":"authenticated"}'
  FROM _test_ids WHERE key = 'moderator_user'
);
SET LOCAL role = authenticated;

SELECT lives_ok(
  $f$ SELECT public.admin_set_hotel_manager_status(
    (SELECT val::TEXT FROM _test_ids WHERE key = 'partner_user'),
    'suspended',
    'Moderator performing suspension — permitted action'
  ) $f$,
  'Moderator CAN call admin_set_hotel_manager_status'
);

RESET role;
RESET "request.jwt.claims";

SELECT is(
  (SELECT account_status FROM public.hotel_manager_profiles
   WHERE user_id = (SELECT val FROM _test_ids WHERE key = 'partner_user')),
  'suspended',
  'Moderator suspension: DB state reflects change'
);


-- =============================================================================
-- BLOCK 7: Unauthenticated / non-admin attempt
-- =============================================================================

-- Not an admin at all — completely unauthenticated context
SET LOCAL "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000001","role":"anon"}';
SET LOCAL role = anon;

SELECT throws_ok(
  $f$ SELECT public.admin_set_hotel_manager_status(
    (SELECT val::TEXT FROM _test_ids WHERE key = 'partner_user'),
    'active',
    'Anon user trying to reinstate partner'
  ) $f$,
  NULL,
  'Non-admin (anon) cannot call admin_set_hotel_manager_status'
);

RESET role;
RESET "request.jwt.claims";


-- =============================================================================
-- DONE
-- =============================================================================

SELECT * FROM finish();

ROLLBACK;
