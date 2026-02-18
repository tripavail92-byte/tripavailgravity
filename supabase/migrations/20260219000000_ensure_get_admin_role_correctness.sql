-- Migration: Ensure get_admin_role correctness
-- Created: 2026-02-19
-- Purpose: Redefine get_admin_role to ensure it strictly checks admin_users table and returns NULL for non-admins.

CREATE OR REPLACE FUNCTION public.get_admin_role(p_user_id UUID)
RETURNS public.admin_role_enum
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.admin_role_enum;
BEGIN
  -- Explicitly select role from admin_users
  SELECT role INTO v_role
  FROM public.admin_users
  WHERE id = p_user_id;
  
  -- If no row found, v_role is NULL, which is correct.
  RETURN v_role;
END;
$$;
