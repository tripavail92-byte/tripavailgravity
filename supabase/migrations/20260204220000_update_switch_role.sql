CREATE OR REPLACE FUNCTION switch_user_role(
  p_user_id UUID,
  p_role_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 1. Check if role exists
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role_type = p_role_type
  ) THEN
    -- Auto-create if it's a partner role
    IF p_role_type IN ('hotel_manager', 'tour_operator') THEN
      
      -- Insert Role (Trigger will ensure exclusivity)
      INSERT INTO user_roles (user_id, role_type, is_active, verification_status)
      VALUES (p_user_id, p_role_type, true, 'pending');

      -- Insert Profile
      IF p_role_type = 'hotel_manager' THEN
        INSERT INTO hotel_manager_profiles (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
      ELSIF p_role_type = 'tour_operator' THEN
        INSERT INTO tour_operator_profiles (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
      END IF;

    ELSIF p_role_type = 'traveller' THEN
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
