-- Function to switch active role
CREATE OR REPLACE FUNCTION switch_user_role(
  p_user_id UUID,
  p_role_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres) to update user_roles
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 1. Validate role exists for user
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role_type = p_role_type
  ) THEN
    -- Auto-create role if it doesn't exist? 
    -- NO. Role creation is explicit (e.g. registration / profile creation).
    -- Exception: Traveller role is default.
    IF p_role_type = 'traveller' THEN
      INSERT INTO user_roles (user_id, role_type, is_active)
      VALUES (p_user_id, 'traveller', true)
      ON CONFLICT (user_id, role_type) DO UPDATE SET is_active = true;
    ELSE
      RAISE EXCEPTION 'Role % does not exist for this user', p_role_type;
    END IF;
  END IF;

  -- 2. Deactivate currently active role
  UPDATE user_roles
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;

  -- 3. Activate new role
  UPDATE user_roles
  SET is_active = true
  WHERE user_id = p_user_id AND role_type = p_role_type;

  -- 4. Return success structure
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'active_role', p_role_type,
    'status', 'success'
  ) INTO v_result;

  RETURN v_result;
END;
$$;
