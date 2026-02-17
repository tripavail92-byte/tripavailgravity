-- Phase 4: Admin login log improvements
-- Date: 2026-02-16
-- Adds session_id to admin_login_logs and updates admin_log_login RPC.

ALTER TABLE public.admin_login_logs
  ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE OR REPLACE FUNCTION public.admin_log_login(
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
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

  INSERT INTO public.admin_login_logs (admin_id, ip_address, user_agent, session_id)
  VALUES (auth.uid(), p_ip_address, p_user_agent, p_session_id);
END;
$$;
