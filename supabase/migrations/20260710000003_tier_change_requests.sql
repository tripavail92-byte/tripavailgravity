-- ============================================================================
-- Membership tier change requests (Phase B)
--
-- Until now the "Upgrade to X" button on the operator's commercial page linked to
-- /help. An operator had to describe what they wanted in a support conversation and
-- an admin flipped `membership_tier_code` by hand — nothing was tracked, and there
-- was no way to measure upgrade demand.
--
-- This makes the request a first-class, auditable object: the operator submits it,
-- an admin approves or rejects it, and approval reuses the existing
-- `admin_assign_operator_membership_tier()` so the tier swap, the tier change log,
-- and the admin action log all behave exactly as they do today.
--
-- No payment is involved. Self-serve billing (Phase C) is still out of scope.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tier_change_request_status_enum') THEN
    CREATE TYPE public.tier_change_request_status_enum AS ENUM
      ('pending', 'approved', 'rejected', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tier_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL
    REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  current_tier_code public.membership_tier_code_enum NOT NULL,
  requested_tier_code public.membership_tier_code_enum NOT NULL
    REFERENCES public.commercial_membership_tiers(code),
  status public.tier_change_request_status_enum NOT NULL DEFAULT 'pending',
  operator_note TEXT,
  admin_note TEXT,
  reviewed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  CONSTRAINT tier_change_requests_distinct_tier CHECK (requested_tier_code <> current_tier_code)
);

-- One open request per operator. Resolved requests stay for history.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tier_change_requests_one_pending
  ON public.tier_change_requests(operator_user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tier_change_requests_queue
  ON public.tier_change_requests(status, created_at DESC);

ALTER TABLE public.tier_change_requests ENABLE ROW LEVEL SECURITY;

-- Reads only. Every write goes through the SECURITY DEFINER functions below, so the
-- state machine (and the "one pending request" rule) can't be bypassed from the client.
DROP POLICY IF EXISTS "Operator can read own tier change requests" ON public.tier_change_requests;
CREATE POLICY "Operator can read own tier change requests"
  ON public.tier_change_requests
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read tier change requests" ON public.tier_change_requests;
CREATE POLICY "Admins can read tier change requests"
  ON public.tier_change_requests
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service can manage tier change requests" ON public.tier_change_requests;
CREATE POLICY "Service can manage tier change requests"
  ON public.tier_change_requests
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

GRANT SELECT ON public.tier_change_requests TO authenticated;

-- ── Operator: submit a request ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_membership_tier_change(
  p_requested_tier public.membership_tier_code_enum,
  p_note TEXT DEFAULT NULL
)
RETURNS public.tier_change_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID := auth.uid();
  v_current_tier public.membership_tier_code_enum;
  v_tier public.commercial_membership_tiers;
  v_row public.tier_change_requests;
  v_admin RECORD;
BEGIN
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT membership_tier_code INTO v_current_tier
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = v_operator_id;

  IF v_current_tier IS NULL THEN
    RAISE EXCEPTION 'No commercial profile found for this operator';
  END IF;

  SELECT * INTO v_tier
  FROM public.commercial_membership_tiers
  WHERE code = p_requested_tier;

  IF v_tier IS NULL OR NOT v_tier.is_active OR NOT v_tier.is_publicly_listed THEN
    RAISE EXCEPTION 'That membership tier is not available';
  END IF;

  IF v_tier.code = v_current_tier THEN
    RAISE EXCEPTION 'You are already on the % tier', v_tier.display_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tier_change_requests
    WHERE operator_user_id = v_operator_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending tier change request';
  END IF;

  INSERT INTO public.tier_change_requests (
    operator_user_id, current_tier_code, requested_tier_code, operator_note
  ) VALUES (
    v_operator_id, v_current_tier, v_tier.code, NULLIF(BTRIM(p_note), '')
  )
  RETURNING * INTO v_row;

  -- Tell the admins there's something in the queue.
  FOR v_admin IN SELECT id FROM public.admin_users LOOP
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      v_admin.id,
      'tier_change_requested',
      'Tier change requested',
      format('An operator requested a move to %s.', v_tier.display_name),
      jsonb_build_object(
        'request_id', v_row.id,
        'operator_user_id', v_operator_id,
        'current_tier_code', v_current_tier,
        'requested_tier_code', v_tier.code
      )
    );
  END LOOP;

  RETURN v_row;
END;
$$;

-- ── Operator: withdraw their own pending request ────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_membership_tier_change_request(
  p_request_id UUID
)
RETURNS public.tier_change_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID := auth.uid();
  v_row public.tier_change_requests;
BEGIN
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.tier_change_requests
  SET status = 'cancelled'
  WHERE id = p_request_id
    AND operator_user_id = v_operator_id
    AND status = 'pending'
  RETURNING * INTO v_row;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'No pending request found to cancel';
  END IF;

  RETURN v_row;
END;
$$;

-- ── Admin: approve or reject ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_review_membership_tier_change(
  p_request_id UUID,
  p_approve BOOLEAN,
  p_note TEXT DEFAULT NULL
)
RETURNS public.tier_change_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role public.admin_role_enum;
  v_row public.tier_change_requests;
  v_tier public.commercial_membership_tiers;
  v_note TEXT := NULLIF(BTRIM(p_note), '');
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin authentication required';
  END IF;

  -- Approving moves money-affecting settings (commission, fee), so it needs the same
  -- privilege as assigning a tier by hand. Rejecting only needs to be an admin.
  IF p_approve THEN
    v_role := public.get_admin_role(v_admin_id);
    IF v_role NOT IN ('super_admin'::public.admin_role_enum, 'finance_admin'::public.admin_role_enum) THEN
      RAISE EXCEPTION 'Only a super admin or finance admin can approve a tier change';
    END IF;
  END IF;

  SELECT * INTO v_row
  FROM public.tier_change_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'No pending request found';
  END IF;

  SELECT * INTO v_tier
  FROM public.commercial_membership_tiers
  WHERE code = v_row.requested_tier_code;

  IF p_approve THEN
    -- Reuse the existing assign RPC: it re-checks the admin's role, moves the tier,
    -- syncs commission/fee, and writes both the tier change log and the admin action
    -- log. auth.uid() survives into the nested call, so its privilege check is real.
    PERFORM public.admin_assign_operator_membership_tier(
      v_row.operator_user_id,
      v_row.requested_tier_code,
      COALESCE(v_note, 'Approved tier change request')
    );
  END IF;

  UPDATE public.tier_change_requests
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END::public.tier_change_request_status_enum,
      admin_note = v_note,
      reviewed_by = v_admin_id,
      reviewed_at = TIMEZONE('UTC', NOW())
  WHERE id = p_request_id
  RETURNING * INTO v_row;

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    v_row.operator_user_id,
    CASE WHEN p_approve THEN 'tier_change_approved' ELSE 'tier_change_rejected' END,
    CASE WHEN p_approve THEN 'Membership upgraded' ELSE 'Tier change not approved' END,
    CASE
      WHEN p_approve THEN format('You are now on the %s tier.', v_tier.display_name)
      ELSE COALESCE(v_note, format('Your request to move to %s was not approved.', v_tier.display_name))
    END,
    jsonb_build_object('request_id', v_row.id, 'requested_tier_code', v_row.requested_tier_code)
  );

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_membership_tier_change(public.membership_tier_code_enum, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_membership_tier_change_request(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_review_membership_tier_change(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.request_membership_tier_change(public.membership_tier_code_enum, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_membership_tier_change_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_membership_tier_change(UUID, BOOLEAN, TEXT) TO authenticated;
