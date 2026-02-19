-- =============================================================================
-- Governance Integration Tests — Plain SQL (no pgTAP required)
-- Run directly in Supabase Studio SQL editor or via psql.
--
-- Uses DO blocks with ASSERT. Any failure raises an exception with the
-- test label so you can see exactly which assertion failed.
-- All fixtures live inside BEGIN/ROLLBACK — zero data residue.
-- =============================================================================

BEGIN;

-- =============================================================================
-- SETUP
-- =============================================================================

CREATE TEMP TABLE _t (key TEXT PRIMARY KEY, val UUID NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _t(key) VALUES ('partner'),('super_admin'),('moderator'),('support'),('pkg');

-- auth.users (required by FK)
INSERT INTO auth.users(id, email, email_confirmed_at, created_at, updated_at)
SELECT val, key||'_'||val||'@test.invalid', NOW(), NOW(), NOW() FROM _t
WHERE key IN ('partner','super_admin','moderator','support');

-- public.profiles
INSERT INTO public.profiles(id, email, first_name, last_name)
SELECT val, key||'_'||val||'@test.invalid', 'Test', initcap(key) FROM _t WHERE key = 'partner';

-- hotel_manager_profiles — approved + active
INSERT INTO public.hotel_manager_profiles(user_id, business_name, account_status)
SELECT val, 'Test Hotel Ltd', 'active' FROM _t WHERE key = 'partner';

-- user_roles — approved
INSERT INTO public.user_roles(user_id, role_type, is_active, verification_status)
SELECT val, 'hotel_manager', true, 'approved' FROM _t WHERE key = 'partner';

-- admin_users
INSERT INTO public.admin_users(id, email, role)
VALUES (
  (SELECT val FROM _t WHERE key='super_admin'),
  (SELECT key||'_'||val||'@test.invalid' FROM _t WHERE key='super_admin'),
  'super_admin'::public.admin_role_enum
),(
  (SELECT val FROM _t WHERE key='moderator'),
  (SELECT key||'_'||val||'@test.invalid' FROM _t WHERE key='moderator'),
  'moderator'::public.admin_role_enum
),(
  (SELECT val FROM _t WHERE key='support'),
  (SELECT key||'_'||val||'@test.invalid' FROM _t WHERE key='support'),
  'support'::public.admin_role_enum
);

-- live package
INSERT INTO public.packages(id, owner_id, package_type, name, status, is_published)
VALUES(
  (SELECT val FROM _t WHERE key='pkg'),
  (SELECT val FROM _t WHERE key='partner'),
  'hotel', 'Test Package', 'live', true
);

-- =============================================================================
-- BLOCK 1: can_partner_operate() matrix
-- =============================================================================
DO $$
DECLARE p UUID := (SELECT val FROM _t WHERE key='partner');
BEGIN
  -- approved + active = TRUE
  ASSERT public.can_partner_operate(p,'hotel_manager'),
    'FAIL: Matrix [approved+active] should be TRUE';
  RAISE NOTICE 'PASS: Matrix [approved+active] = TRUE';

  -- approved + suspended = FALSE
  UPDATE public.hotel_manager_profiles SET account_status='suspended' WHERE user_id=p;
  ASSERT NOT public.can_partner_operate(p,'hotel_manager'),
    'FAIL: Matrix [approved+suspended] should be FALSE';
  RAISE NOTICE 'PASS: Matrix [approved+suspended] = FALSE';

  -- approved + deleted = FALSE
  UPDATE public.hotel_manager_profiles SET account_status='deleted' WHERE user_id=p;
  ASSERT NOT public.can_partner_operate(p,'hotel_manager'),
    'FAIL: Matrix [approved+deleted] should be FALSE';
  RAISE NOTICE 'PASS: Matrix [approved+deleted] = FALSE';

  -- pending + active = FALSE
  UPDATE public.hotel_manager_profiles SET account_status='active' WHERE user_id=p;
  UPDATE public.user_roles SET verification_status='pending'
    WHERE user_id=p AND role_type='hotel_manager';
  ASSERT NOT public.can_partner_operate(p,'hotel_manager'),
    'FAIL: Matrix [pending+active] should be FALSE';
  RAISE NOTICE 'PASS: Matrix [pending+active] = FALSE';

  -- rejected + active = FALSE
  UPDATE public.user_roles SET verification_status='rejected'
    WHERE user_id=p AND role_type='hotel_manager';
  ASSERT NOT public.can_partner_operate(p,'hotel_manager'),
    'FAIL: Matrix [rejected+active] should be FALSE';
  RAISE NOTICE 'PASS: Matrix [rejected+active] = FALSE';

  -- restore for next blocks
  UPDATE public.user_roles SET verification_status='approved'
    WHERE user_id=p AND role_type='hotel_manager';
END $$;

-- =============================================================================
-- BLOCK 2: Scenario A — suspend via real RPC (super_admin)
-- =============================================================================
DO $$
DECLARE
  p    UUID := (SELECT val FROM _t WHERE key='partner');
  adm  UUID := (SELECT val FROM _t WHERE key='super_admin');
  pkg  UUID := (SELECT val FROM _t WHERE key='pkg');
BEGIN
  -- Set auth context to super_admin
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', adm::text, 'role', 'authenticated')::text, true);
  SET LOCAL role = authenticated;

  PERFORM public.admin_set_hotel_manager_status(p::text, 'suspended',
    'Policy violation: duplicate listing found during audit');

  RESET role;

  ASSERT (SELECT account_status FROM public.hotel_manager_profiles WHERE user_id=p) = 'suspended',
    'FAIL: account_status should be suspended after RPC';
  RAISE NOTICE 'PASS: Scenario A — account_status = suspended in DB';

  ASSERT NOT public.can_partner_operate(p,'hotel_manager'),
    'FAIL: can_partner_operate() should be FALSE after suspension';
  RAISE NOTICE 'PASS: Scenario A — can_partner_operate() = FALSE';

  ASSERT (SELECT status FROM public.packages WHERE id=pkg) = 'suspended',
    'FAIL: live package should have been cascaded to suspended';
  RAISE NOTICE 'PASS: Scenario A — live package cascaded to suspended';

  ASSERT EXISTS(SELECT 1 FROM public.admin_action_logs
    WHERE entity_id=p AND entity_type='partner' AND action_type='suspend_partner'),
    'FAIL: audit log row missing for suspension';
  RAISE NOTICE 'PASS: Scenario A — audit log written';

  ASSERT EXISTS(SELECT 1 FROM public.notifications
    WHERE user_id=p AND type='account_suspended'),
    'FAIL: notification missing for suspension';
  RAISE NOTICE 'PASS: Scenario A — notification delivered';
END $$;

-- =============================================================================
-- BLOCK 3: Scenario B — reinstate, no auto-reactivate
-- =============================================================================
DO $$
DECLARE
  p    UUID := (SELECT val FROM _t WHERE key='partner');
  adm  UUID := (SELECT val FROM _t WHERE key='super_admin');
  pkg  UUID := (SELECT val FROM _t WHERE key='pkg');
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', adm::text, 'role', 'authenticated')::text, true);
  SET LOCAL role = authenticated;

  PERFORM public.admin_set_hotel_manager_status(p::text, 'active',
    'Appeal reviewed and approved by compliance team');

  RESET role;

  ASSERT (SELECT account_status FROM public.hotel_manager_profiles WHERE user_id=p) = 'active',
    'FAIL: account_status should be active after reinstatement';
  RAISE NOTICE 'PASS: Scenario B — account_status = active';

  ASSERT public.can_partner_operate(p,'hotel_manager'),
    'FAIL: can_partner_operate() should be TRUE after reinstatement';
  RAISE NOTICE 'PASS: Scenario B — can_partner_operate() = TRUE';

  -- CONSERVATIVE POLICY: package must NOT auto-reactivate
  ASSERT (SELECT status FROM public.packages WHERE id=pkg) = 'suspended',
    'FAIL: package should NOT auto-reactivate (conservative policy)';
  RAISE NOTICE 'PASS: Scenario B — package stays suspended (no auto-reactivate)';

  ASSERT EXISTS(SELECT 1 FROM public.notifications
    WHERE user_id=p AND type='account_reinstated'),
    'FAIL: reinstatement notification missing';
  RAISE NOTICE 'PASS: Scenario B — reinstatement notification delivered';

  ASSERT EXISTS(SELECT 1 FROM public.admin_action_logs
    WHERE entity_id=p AND entity_type='partner' AND action_type='activate_partner'),
    'FAIL: audit log missing for reinstatement';
  RAISE NOTICE 'PASS: Scenario B — reinstatement audit log written';
END $$;

-- =============================================================================
-- BLOCK 4: Scenario C — support role BLOCKED (4 checks)
-- =============================================================================
DO $$
DECLARE
  p    UUID := (SELECT val FROM _t WHERE key='partner');
  sup  UUID := (SELECT val FROM _t WHERE key='support');
  blocked BOOLEAN;
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', sup::text, 'role', 'authenticated')::text, true);
  SET LOCAL role = authenticated;

  -- Test 1: admin_set_hotel_manager_status
  blocked := false;
  BEGIN
    PERFORM public.admin_set_hotel_manager_status(p::text,'suspended','Support trying to suspend');
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  ASSERT blocked, 'FAIL: support should be BLOCKED from admin_set_hotel_manager_status';
  RAISE NOTICE 'PASS: Scenario C — support blocked from admin_set_hotel_manager_status';

  -- Test 2: admin_approve_partner
  blocked := false;
  BEGIN
    PERFORM public.admin_approve_partner(p,'hotel_manager',gen_random_uuid());
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  ASSERT blocked, 'FAIL: support should be BLOCKED from admin_approve_partner';
  RAISE NOTICE 'PASS: Scenario C — support blocked from admin_approve_partner';

  -- Test 3: admin_reject_partner
  blocked := false;
  BEGIN
    PERFORM public.admin_reject_partner(p,'hotel_manager',gen_random_uuid(),'reason text here ok');
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  ASSERT blocked, 'FAIL: support should be BLOCKED from admin_reject_partner';
  RAISE NOTICE 'PASS: Scenario C — support blocked from admin_reject_partner';

  -- Test 4: admin_request_partner_info
  blocked := false;
  BEGIN
    PERFORM public.admin_request_partner_info(p,'hotel_manager',gen_random_uuid(),'need more docs from partner');
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  ASSERT blocked, 'FAIL: support should be BLOCKED from admin_request_partner_info';
  RAISE NOTICE 'PASS: Scenario C — support blocked from admin_request_partner_info';

  RESET role;
END $$;

-- =============================================================================
-- BLOCK 5: RLS — direct account_status write blocked + suspended INSERT blocked
-- =============================================================================
DO $$
DECLARE
  p       UUID := (SELECT val FROM _t WHERE key='partner');
  blocked BOOLEAN;
BEGIN
  -- Re-suspend account for INSERT test
  UPDATE public.hotel_manager_profiles SET account_status='suspended' WHERE user_id=p;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', p::text, 'role', 'authenticated')::text, true);
  SET LOCAL role = authenticated;

  -- Test 1: direct column write
  blocked := false;
  BEGIN
    UPDATE public.hotel_manager_profiles SET account_status='active' WHERE user_id=p;
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  ASSERT blocked, 'FAIL: authenticated user must not directly write account_status';
  RAISE NOTICE 'PASS: RLS — direct account_status write blocked';

  -- Test 2: suspended partner INSERT package
  blocked := false;
  BEGIN
    INSERT INTO public.packages(owner_id, package_type, name, status)
    VALUES(p, 'hotel', 'Sneaky insert from suspended partner', 'draft');
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  ASSERT blocked, 'FAIL: suspended partner must not INSERT packages (WITH CHECK)';
  RAISE NOTICE 'PASS: RLS — suspended partner INSERT on packages blocked';

  RESET role;
END $$;

-- =============================================================================
-- BLOCK 6: Moderator CAN act
-- =============================================================================
DO $$
DECLARE
  p    UUID := (SELECT val FROM _t WHERE key='partner');
  mod  UUID := (SELECT val FROM _t WHERE key='moderator');
BEGIN
  -- Restore to active
  UPDATE public.hotel_manager_profiles SET account_status='active' WHERE user_id=p;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', mod::text, 'role', 'authenticated')::text, true);
  SET LOCAL role = authenticated;

  PERFORM public.admin_set_hotel_manager_status(p::text,'suspended',
    'Moderator suspension — permitted action');

  RESET role;

  ASSERT (SELECT account_status FROM public.hotel_manager_profiles WHERE user_id=p) = 'suspended',
    'FAIL: moderator suspension did not update DB';
  RAISE NOTICE 'PASS: Moderator CAN suspend partner, DB updated correctly';
END $$;

-- =============================================================================
-- BLOCK 7: Non-admin / anon blocked
-- =============================================================================
DO $$
DECLARE
  p       UUID := (SELECT val FROM _t WHERE key='partner');
  blocked BOOLEAN := false;
BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000001","role":"anon"}', true);
  SET LOCAL role = anon;

  BEGIN
    PERFORM public.admin_set_hotel_manager_status(p::text,'active','Anon trying to reinstate');
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  ASSERT blocked, 'FAIL: anon must not call any admin RPC';
  RAISE NOTICE 'PASS: Anonymous / non-admin blocked from all admin RPCs';

  RESET role;
END $$;

DO $$ BEGIN
  RAISE NOTICE '=== ALL GOVERNANCE INTEGRATION TESTS PASSED ===';
END $$;

ROLLBACK;
