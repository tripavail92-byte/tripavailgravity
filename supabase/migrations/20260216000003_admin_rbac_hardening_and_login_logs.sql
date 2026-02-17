-- Phase 4: RBAC hardening + admin login logs
-- Date: 2026-02-16
-- Rules enforced:
-- - Admin powers are enforced in DB RPCs (not just UI)
-- - Support admins have restricted privileges
-- - Admin login events are logged (best-effort metadata)

-- ============================================================================
-- 0. Tighten table privileges for admin_users (defense-in-depth)
-- ============================================================================

REVOKE ALL ON TABLE public.admin_users FROM anon;
REVOKE ALL ON TABLE public.admin_users FROM authenticated;

-- Admins can read admin users (RLS already enforces is_admin)
GRANT SELECT ON TABLE public.admin_users TO authenticated;

-- Service role can manage admin users (bootstrap/ops)
GRANT ALL ON TABLE public.admin_users TO service_role;

-- ============================================================================
-- 1. Admin login logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.admin_login_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin login logs" ON public.admin_login_logs;
CREATE POLICY "Admins can read admin login logs" ON public.admin_login_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Prefer inserts via RPC only
REVOKE INSERT ON public.admin_login_logs FROM anon;
REVOKE INSERT ON public.admin_login_logs FROM authenticated;
GRANT ALL ON public.admin_login_logs TO service_role;

CREATE OR REPLACE FUNCTION public.admin_log_login(
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  INSERT INTO public.admin_login_logs (admin_id, ip_address, user_agent)
  VALUES (auth.uid(), p_ip_address, p_user_agent);
END;
$$;

-- ============================================================================
-- 2. RBAC hardening inside admin RPCs
-- ============================================================================

-- Packages moderation: support cannot moderate listings
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
  v_role public.admin_role_enum;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  v_role := public.get_admin_role(auth.uid());
  IF v_role = 'support' THEN
    RAISE EXCEPTION 'Insufficient privileges';
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

-- Tours moderation: support cannot moderate listings
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
  v_role public.admin_role_enum;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  v_role := public.get_admin_role(auth.uid());
  IF v_role = 'support' THEN
    RAISE EXCEPTION 'Insufficient privileges';
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

-- Traveler status: support cannot suspend/delete users
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
  v_role public.admin_role_enum;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  v_role := public.get_admin_role(auth.uid());
  IF v_role = 'support' THEN
    RAISE EXCEPTION 'Insufficient privileges';
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

-- Partner status: support cannot suspend/delete partners
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
  v_role public.admin_role_enum;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  v_role := public.get_admin_role(auth.uid());
  IF v_role = 'support' THEN
    RAISE EXCEPTION 'Insufficient privileges';
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
  v_role public.admin_role_enum;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  v_role := public.get_admin_role(auth.uid());
  IF v_role = 'support' THEN
    RAISE EXCEPTION 'Insufficient privileges';
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

-- Reports status: support can only close (resolved/dismissed)
CREATE OR REPLACE FUNCTION public.admin_set_report_status(
  p_report_id UUID,
  p_status public.report_status_enum,
  p_reason TEXT
)
RETURNS public.reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev JSONB;
  v_new JSONB;
  v_row public.reports;
  v_action TEXT;
  v_role public.admin_role_enum;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  v_role := public.get_admin_role(auth.uid());
  IF v_role = 'support' AND p_status NOT IN ('resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  SELECT to_jsonb(r.*) INTO v_prev
  FROM public.reports r
  WHERE r.id = p_report_id;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  v_action := CASE
    WHEN p_status = 'open' THEN 'reopen'
    WHEN p_status = 'in_review' THEN 'review'
    WHEN p_status = 'resolved' THEN 'resolve'
    WHEN p_status = 'dismissed' THEN 'dismiss'
    ELSE 'status_change'
  END;

  UPDATE public.reports
  SET
    status = p_status,
    status_reason = p_reason,
    status_updated_by = auth.uid(),
    status_updated_at = TIMEZONE('UTC'::TEXT, NOW())
  WHERE id = p_report_id
  RETURNING * INTO v_row;

  SELECT to_jsonb(v_row.*) INTO v_new;

  PERFORM public.admin_log_action('report', p_report_id, v_action, p_reason, v_prev, v_new);

  RETURN v_row;
END;
$$;
