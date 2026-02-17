-- Phase 4 (next): Reports module foundation (admin moderation + audit)
-- Date: 2026-02-16
-- Rules enforced:
-- - No hard deletes (no DELETE granted; status-driven lifecycle)
-- - Admin-only status updates via SECURITY DEFINER RPC
-- - All admin state changes must be logged via admin_log_action

-- ============================================================================
-- 0. Report status enum (idempotent)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'report_status_enum' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.report_status_enum AS ENUM ('open', 'in_review', 'resolved', 'dismissed');
  END IF;
END $$;

-- ============================================================================
-- 1. Reports table (idempotent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_entity_type TEXT NOT NULL,
  target_entity_id UUID NOT NULL,
  report_reason TEXT NOT NULL,
  details TEXT,

  status public.report_status_enum NOT NULL DEFAULT 'open',
  status_reason TEXT,
  status_updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  status_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Basic guardrails on entity type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.reports'::regclass
      AND conname = 'reports_target_entity_type_check'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_target_entity_type_check
      CHECK (target_entity_type IN ('package', 'tour', 'user', 'partner', 'booking'));
  END IF;
END $$;

-- No hard deletes
REVOKE DELETE ON public.reports FROM authenticated;
REVOKE DELETE ON public.reports FROM anon;

-- Non-admins cannot update moderation fields directly
REVOKE UPDATE (status, status_reason, status_updated_by, status_updated_at) ON public.reports FROM authenticated;
REVOKE UPDATE (status, status_reason, status_updated_by, status_updated_at) ON public.reports FROM anon;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reporter can create a report for themselves
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Reporter can read their own reports (optional but safe)
DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
CREATE POLICY "Users can read own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Admin read access
DROP POLICY IF EXISTS "Admins can read all reports" ON public.reports;
CREATE POLICY "Admins can read all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- 2. Admin RPC: set report status (logged)
-- ============================================================================

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
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
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

-- Indexes for admin review
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS reports_target_entity_idx ON public.reports(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);
