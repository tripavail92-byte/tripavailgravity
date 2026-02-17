-- Phase 1: Admin moderation + audit logs foundation
-- Date: 2026-02-16
-- Rules enforced:
-- - No hard deletes for core entities (soft delete via status + deleted_at)
-- - Packages/listings are auto-approved (no approval workflow)
-- - All admin state changes must be logged (previous_state + new_state + reason)
-- - Moderation fields are not writable by non-admins

-- ============================================================================
-- 0. Helper enum types (idempotent)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE t.typname = 'admin_role_enum' AND n.nspname = 'public') THEN
    CREATE TYPE public.admin_role_enum AS ENUM ('super_admin', 'moderator', 'support');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE t.typname = 'moderation_status_enum' AND n.nspname = 'public') THEN
    CREATE TYPE public.moderation_status_enum AS ENUM ('live', 'hidden', 'suspended', 'deleted');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE t.typname = 'account_status_enum' AND n.nspname = 'public') THEN
    CREATE TYPE public.account_status_enum AS ENUM ('active', 'suspended', 'deleted');
  END IF;
END $$;

-- ============================================================================
-- 1. Admin role system
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.admin_role_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- is_admin helper must exist before any RLS policies reference it
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role(p_user_id UUID)
RETURNS public.admin_role_enum
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.role FROM public.admin_users au WHERE au.id = p_user_id;
$$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Service role can manage admin users (bootstrap + operations)
DROP POLICY IF EXISTS "Service can manage admin users" ON public.admin_users;
CREATE POLICY "Service can manage admin users" ON public.admin_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can read admin users (for audit attribution/UI later)
DROP POLICY IF EXISTS "Admins can read admin users" ON public.admin_users;
CREATE POLICY "Admins can read admin users" ON public.admin_users
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- 2. Admin audit log system
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Ensure entity_type constraint is correct and upgradable (includes tours)
DO $$
DECLARE
  c RECORD;
BEGIN
  -- Drop any existing CHECK constraints on admin_action_logs.entity_type (name may vary)
  FOR c IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.admin_action_logs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%entity_type%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.admin_action_logs DROP CONSTRAINT %I', c.conname);
  END LOOP;

  -- Add our named constraint (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.admin_action_logs'::regclass
      AND conname = 'admin_action_logs_entity_type_check'
  ) THEN
    ALTER TABLE public.admin_action_logs
      ADD CONSTRAINT admin_action_logs_entity_type_check
      CHECK (entity_type IN ('user', 'partner', 'package', 'tour', 'booking', 'report'));
  END IF;
END $$;

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read action logs" ON public.admin_action_logs;
CREATE POLICY "Admins can read action logs" ON public.admin_action_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin actions run as authenticated admins; allow insert explicitly under RLS
DROP POLICY IF EXISTS "Admins can write action logs" ON public.admin_action_logs;
CREATE POLICY "Admins can write action logs" ON public.admin_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service can write action logs" ON public.admin_action_logs;
CREATE POLICY "Service can write action logs" ON public.admin_action_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Indexes for admin viewer
CREATE INDEX IF NOT EXISTS admin_action_logs_admin_id_idx ON public.admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_action_logs_entity_type_idx ON public.admin_action_logs(entity_type);
CREATE INDEX IF NOT EXISTS admin_action_logs_entity_id_idx ON public.admin_action_logs(entity_id);
CREATE INDEX IF NOT EXISTS admin_action_logs_created_at_idx ON public.admin_action_logs(created_at DESC);

-- ============================================================================
-- 3. Admin helpers (auth + logging)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_log_action(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action_type TEXT,
  p_reason TEXT,
  p_previous_state JSONB,
  p_new_state JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_log_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  INSERT INTO public.admin_action_logs (
    admin_id,
    entity_type,
    entity_id,
    action_type,
    reason,
    previous_state,
    new_state
  ) VALUES (
    v_admin_id,
    p_entity_type,
    p_entity_id,
    p_action_type,
    p_reason,
    p_previous_state,
    p_new_state
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================================================
-- 4. Moderation layer: Packages (hotel packages)
-- ============================================================================

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS status public.moderation_status_enum NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- No hard deletes for marketplace listings
DROP POLICY IF EXISTS "Users can delete their own packages" ON public.packages;
REVOKE DELETE ON public.packages FROM authenticated;
REVOKE DELETE ON public.packages FROM anon;

-- Admin read access for moderation UI (additive policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all packages' AND tablename = 'packages' AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Admins can read all packages" ON public.packages
      FOR SELECT TO authenticated
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Block non-admin writes to moderation fields (privilege-level enforcement)
REVOKE UPDATE (status, moderation_reason, moderated_by, moderated_at, deleted_at) ON public.packages FROM authenticated;
REVOKE UPDATE (status, moderation_reason, moderated_by, moderated_at, deleted_at) ON public.packages FROM anon;

CREATE OR REPLACE FUNCTION public.admin_moderate_package(
  p_package_id UUID,
  p_status public.moderation_status_enum,
  p_reason TEXT
)
RETURNS public.packages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev JSONB;
  v_new JSONB;
  v_row public.packages;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT to_jsonb(p.*) INTO v_prev
  FROM public.packages p
  WHERE p.id = p_package_id;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'Package not found';
  END IF;

  v_action := CASE
    WHEN p_status = 'hidden' THEN 'hide'
    WHEN p_status = 'live' THEN 'unhide'
    WHEN p_status = 'suspended' THEN 'suspend'
    WHEN p_status = 'deleted' THEN 'delete'
    ELSE 'moderate'
  END;

  UPDATE public.packages
  SET
    status = p_status,
    moderation_reason = p_reason,
    moderated_by = auth.uid(),
    moderated_at = TIMEZONE('UTC'::TEXT, NOW()),
    deleted_at = CASE WHEN p_status = 'deleted' THEN TIMEZONE('UTC'::TEXT, NOW()) ELSE NULL END
  WHERE id = p_package_id
  RETURNING * INTO v_row;

  SELECT to_jsonb(v_row.*) INTO v_new;

  PERFORM public.admin_log_action('package', p_package_id, v_action, p_reason, v_prev, v_new);

  RETURN v_row;
END;
$$;

-- ============================================================================
-- 5. Moderation layer: Tours (tour packages)
-- ============================================================================

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS status public.moderation_status_enum NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- No hard deletes for marketplace listings
REVOKE DELETE ON public.tours FROM authenticated;
REVOKE DELETE ON public.tours FROM anon;

-- Admin read access (additive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all tours' AND tablename = 'tours' AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Admins can read all tours" ON public.tours
      FOR SELECT TO authenticated
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

REVOKE UPDATE (status, moderation_reason, moderated_by, moderated_at, deleted_at) ON public.tours FROM authenticated;
REVOKE UPDATE (status, moderation_reason, moderated_by, moderated_at, deleted_at) ON public.tours FROM anon;

CREATE OR REPLACE FUNCTION public.admin_moderate_tour(
  p_tour_id UUID,
  p_status public.moderation_status_enum,
  p_reason TEXT
)
RETURNS public.tours
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev JSONB;
  v_new JSONB;
  v_row public.tours;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT to_jsonb(t.*) INTO v_prev
  FROM public.tours t
  WHERE t.id = p_tour_id;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'Tour not found';
  END IF;

  v_action := CASE
    WHEN p_status = 'hidden' THEN 'hide'
    WHEN p_status = 'live' THEN 'unhide'
    WHEN p_status = 'suspended' THEN 'suspend'
    WHEN p_status = 'deleted' THEN 'delete'
    ELSE 'moderate'
  END;

  UPDATE public.tours
  SET
    status = p_status,
    moderation_reason = p_reason,
    moderated_by = auth.uid(),
    moderated_at = TIMEZONE('UTC'::TEXT, NOW()),
    deleted_at = CASE WHEN p_status = 'deleted' THEN TIMEZONE('UTC'::TEXT, NOW()) ELSE NULL END
  WHERE id = p_tour_id
  RETURNING * INTO v_row;

  SELECT to_jsonb(v_row.*) INTO v_new;

  PERFORM public.admin_log_action('tour', p_tour_id, v_action, p_reason, v_prev, v_new);

  RETURN v_row;
END;
$$;

-- ============================================================================
-- 6. Account status: Partners (hotel manager / tour operator)
-- ============================================================================

ALTER TABLE public.hotel_manager_profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- Admin read access for partner moderation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all hotel manager profiles' AND tablename = 'hotel_manager_profiles' AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Admins can read all hotel manager profiles" ON public.hotel_manager_profiles
      FOR SELECT TO authenticated
      USING (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all tour operator profiles' AND tablename = 'tour_operator_profiles' AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Admins can read all tour operator profiles" ON public.tour_operator_profiles
      FOR SELECT TO authenticated
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

REVOKE UPDATE (account_status, status_reason, status_updated_by, status_updated_at) ON public.hotel_manager_profiles FROM authenticated;
REVOKE UPDATE (account_status, status_reason, status_updated_by, status_updated_at) ON public.tour_operator_profiles FROM authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_hotel_manager_status(
  p_user_id UUID,
  p_status public.account_status_enum,
  p_reason TEXT
)
RETURNS public.hotel_manager_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev JSONB;
  v_new JSONB;
  v_row public.hotel_manager_profiles;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT to_jsonb(h.*) INTO v_prev
  FROM public.hotel_manager_profiles h
  WHERE h.user_id = p_user_id;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'Hotel manager profile not found';
  END IF;

  v_action := CASE
    WHEN p_status = 'suspended' THEN 'suspend'
    WHEN p_status = 'active' THEN 'reactivate'
    WHEN p_status = 'deleted' THEN 'delete'
    ELSE 'status_change'
  END;

  UPDATE public.hotel_manager_profiles
  SET
    account_status = p_status,
    status_reason = p_reason,
    status_updated_by = auth.uid(),
    status_updated_at = TIMEZONE('UTC'::TEXT, NOW())
  WHERE user_id = p_user_id
  RETURNING * INTO v_row;

  SELECT to_jsonb(v_row.*) INTO v_new;

  PERFORM public.admin_log_action('partner', p_user_id, v_action, p_reason, v_prev, v_new);

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_tour_operator_status(
  p_user_id UUID,
  p_status public.account_status_enum,
  p_reason TEXT
)
RETURNS public.tour_operator_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev JSONB;
  v_new JSONB;
  v_row public.tour_operator_profiles;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT to_jsonb(o.*) INTO v_prev
  FROM public.tour_operator_profiles o
  WHERE o.user_id = p_user_id;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'Tour operator profile not found';
  END IF;

  v_action := CASE
    WHEN p_status = 'suspended' THEN 'suspend'
    WHEN p_status = 'active' THEN 'reactivate'
    WHEN p_status = 'deleted' THEN 'delete'
    ELSE 'status_change'
  END;

  UPDATE public.tour_operator_profiles
  SET
    account_status = p_status,
    status_reason = p_reason,
    status_updated_by = auth.uid(),
    status_updated_at = TIMEZONE('UTC'::TEXT, NOW())
  WHERE user_id = p_user_id
  RETURNING * INTO v_row;

  SELECT to_jsonb(v_row.*) INTO v_new;

  PERFORM public.admin_log_action('partner', p_user_id, v_action, p_reason, v_prev, v_new);

  RETURN v_row;
END;
$$;

-- ============================================================================
-- 7. Account status: Travelers (profiles)
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- Admin read access for moderation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all profiles' AND tablename = 'profiles' AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Admins can read all profiles" ON public.profiles
      FOR SELECT TO authenticated
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

REVOKE UPDATE (account_status, status_reason, status_updated_by, status_updated_at) ON public.profiles FROM authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_traveler_status(
  p_user_id UUID,
  p_status public.account_status_enum,
  p_reason TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev JSONB;
  v_new JSONB;
  v_row public.profiles;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT to_jsonb(p.*) INTO v_prev
  FROM public.profiles p
  WHERE p.id = p_user_id;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'Traveler profile not found';
  END IF;

  v_action := CASE
    WHEN p_status = 'suspended' THEN 'suspend'
    WHEN p_status = 'active' THEN 'reactivate'
    WHEN p_status = 'deleted' THEN 'delete'
    ELSE 'status_change'
  END;

  UPDATE public.profiles
  SET
    account_status = p_status,
    status_reason = p_reason,
    status_updated_by = auth.uid(),
    status_updated_at = TIMEZONE('UTC'::TEXT, NOW())
  WHERE id = p_user_id
  RETURNING * INTO v_row;

  SELECT to_jsonb(v_row.*) INTO v_new;

  PERFORM public.admin_log_action('user', p_user_id, v_action, p_reason, v_prev, v_new);

  RETURN v_row;
END;
$$;

-- ============================================================================
-- 8. Indexes for moderation/status fields
-- ============================================================================

CREATE INDEX IF NOT EXISTS packages_status_idx ON public.packages(status);
CREATE INDEX IF NOT EXISTS tours_status_idx ON public.tours(status);
CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS hotel_manager_profiles_account_status_idx ON public.hotel_manager_profiles(account_status);
CREATE INDEX IF NOT EXISTS tour_operator_profiles_account_status_idx ON public.tour_operator_profiles(account_status);
