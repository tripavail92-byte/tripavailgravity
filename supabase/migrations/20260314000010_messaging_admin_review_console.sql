-- Messaging admin review console
-- Adds admin-facing list/update RPCs for booking message reports and support escalations.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_support_review_status_enum') THEN
    CREATE TYPE public.messaging_support_review_status_enum AS ENUM (
      'pending',
      'in_review',
      'resolved'
    );
  END IF;
END $$;

ALTER TABLE public.booking_conversation_reports
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

ALTER TABLE public.booking_conversations
  ADD COLUMN IF NOT EXISTS support_review_status public.messaging_support_review_status_enum,
  ADD COLUMN IF NOT EXISTS support_review_reason TEXT,
  ADD COLUMN IF NOT EXISTS support_review_notes TEXT,
  ADD COLUMN IF NOT EXISTS support_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS support_reviewed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

UPDATE public.booking_conversations
SET support_review_status = 'pending'::public.messaging_support_review_status_enum
WHERE support_escalated_at IS NOT NULL
  AND support_review_status IS NULL;

CREATE INDEX IF NOT EXISTS booking_conversations_support_review_idx
  ON public.booking_conversations(support_review_status, support_escalated_at DESC)
  WHERE support_escalated_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.messaging_escalate_conversation_to_support(
  p_conversation_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  conversation_id UUID,
  support_escalated_at TIMESTAMPTZ,
  support_participants_added INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_sender_role public.messaging_participant_role_enum;
  v_existing_escalated_at TIMESTAMPTZ;
  v_subject TEXT;
  v_added_count INTEGER := 0;
  v_system_message_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT participant.participant_role, conversation.support_escalated_at, conversation.subject
  INTO v_sender_role, v_existing_escalated_at, v_subject
  FROM public.booking_conversation_participants AS participant
  INNER JOIN public.booking_conversations AS conversation
    ON conversation.id = participant.conversation_id
  WHERE participant.conversation_id = p_conversation_id
    AND participant.user_id = v_user_id
    AND participant.left_at IS NULL;

  IF v_sender_role IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.booking_conversation_participants (
    conversation_id,
    user_id,
    participant_role,
    metadata
  )
  SELECT
    p_conversation_id,
    admin_user.id,
    'support'::public.messaging_participant_role_enum,
    jsonb_build_object('joined_via_escalation', TRUE)
  FROM public.admin_users AS admin_user
  WHERE admin_user.role IN ('support', 'super_admin')
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    participant_role = 'support',
    left_at = NULL,
    can_send = TRUE,
    can_upload = TRUE,
    metadata = public.booking_conversation_participants.metadata || jsonb_build_object('joined_via_escalation', TRUE);

  GET DIAGNOSTICS v_added_count = ROW_COUNT;

  UPDATE public.booking_conversations AS conversation
  SET
    support_escalated_at = COALESCE(conversation.support_escalated_at, v_now),
    support_review_status = CASE
      WHEN conversation.support_escalated_at IS NULL THEN 'pending'::public.messaging_support_review_status_enum
      WHEN conversation.support_review_status = 'resolved'::public.messaging_support_review_status_enum THEN 'pending'::public.messaging_support_review_status_enum
      ELSE COALESCE(conversation.support_review_status, 'pending'::public.messaging_support_review_status_enum)
    END,
    support_review_reason = CASE
      WHEN conversation.support_review_status = 'resolved'::public.messaging_support_review_status_enum THEN NULL
      ELSE conversation.support_review_reason
    END,
    support_review_notes = CASE
      WHEN conversation.support_review_status = 'resolved'::public.messaging_support_review_status_enum THEN NULL
      ELSE conversation.support_review_notes
    END,
    support_reviewed_at = CASE
      WHEN conversation.support_review_status = 'resolved'::public.messaging_support_review_status_enum THEN NULL
      ELSE conversation.support_reviewed_at
    END,
    support_reviewed_by = CASE
      WHEN conversation.support_review_status = 'resolved'::public.messaging_support_review_status_enum THEN NULL
      ELSE conversation.support_reviewed_by
    END,
    updated_at = v_now,
    metadata = conversation.metadata || jsonb_build_object(
      'support_escalation_reason', NULLIF(BTRIM(p_reason), '')
    )
  WHERE conversation.id = p_conversation_id
  RETURNING conversation.support_escalated_at INTO v_existing_escalated_at;

  IF v_existing_escalated_at = v_now THEN
    INSERT INTO public.booking_conversation_messages (
      conversation_id,
      sender_id,
      sender_role,
      message_kind,
      body,
      metadata
    )
    VALUES (
      p_conversation_id,
      v_user_id,
      v_sender_role,
      'system',
      'Support escalation requested',
      jsonb_build_object(
        'reason', NULLIF(BTRIM(p_reason), ''),
        'source', 'support_escalation'
      )
    )
    RETURNING id INTO v_system_message_id;

    INSERT INTO public.booking_conversation_message_reads (
      message_id,
      user_id,
      delivered_at,
      read_at
    )
    VALUES (
      v_system_message_id,
      v_user_id,
      v_now,
      v_now
    )
    ON CONFLICT (message_id, user_id)
    DO UPDATE SET
      delivered_at = EXCLUDED.delivered_at,
      read_at = EXCLUDED.read_at;

    UPDATE public.booking_conversations
    SET
      last_message_at = v_now,
      last_message_preview = 'Support escalation requested',
      updated_at = v_now
    WHERE id = p_conversation_id;

    UPDATE public.booking_conversation_participants
    SET
      unread_count = CASE
        WHEN user_id = v_user_id THEN 0
        ELSE unread_count + 1
      END,
      last_read_at = CASE
        WHEN user_id = v_user_id THEN v_now
        ELSE last_read_at
      END,
      last_delivered_at = CASE
        WHEN user_id = v_user_id THEN v_now
        ELSE last_delivered_at
      END,
      is_archived = CASE
        WHEN user_id = v_user_id THEN is_archived
        ELSE FALSE
      END
    WHERE conversation_id = p_conversation_id
      AND left_at IS NULL;

    INSERT INTO public.notifications (user_id, type, title, body)
    SELECT
      admin_user.id,
      'support_escalation',
      'Booking conversation needs support',
      COALESCE(v_subject, 'Booking conversation') || ' was escalated to support.'
    FROM public.admin_users AS admin_user
    WHERE admin_user.role IN ('support', 'super_admin')
      AND admin_user.id <> v_user_id;
  END IF;

  RETURN QUERY SELECT p_conversation_id, v_existing_escalated_at, v_added_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_messaging_reports(
  p_status public.messaging_report_status_enum DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  report_id UUID,
  conversation_id UUID,
  message_id UUID,
  reporter_id UUID,
  reporter_name TEXT,
  report_reason TEXT,
  details TEXT,
  status public.messaging_report_status_enum,
  status_reason TEXT,
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  booking_scope public.messaging_booking_scope_enum,
  booking_id UUID,
  booking_label TEXT,
  subject TEXT,
  traveler_name TEXT,
  partner_name TEXT,
  support_escalated_at TIMESTAMPTZ,
  last_message_preview TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    report.id,
    report.conversation_id,
    report.message_id,
    report.reporter_id,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', reporter_profile.first_name, reporter_profile.last_name)), ''),
      reporter_user.full_name,
      SPLIT_PART(reporter_user.email, '@', 1),
      'Reporter'
    ) AS reporter_name,
    report.reason,
    report.details,
    report.status,
    report.status_reason,
    report.review_notes,
    report.reviewed_by,
    report.reviewed_at,
    report.created_at,
    conversation.booking_scope,
    conversation.booking_id,
    booking_ctx.booking_label,
    conversation.subject,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', traveler_profile.first_name, traveler_profile.last_name)), ''),
      traveler_user.full_name,
      SPLIT_PART(traveler_user.email, '@', 1),
      'Traveler'
    ) AS traveler_name,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', partner_profile.first_name, partner_profile.last_name)), ''),
      partner_user.full_name,
      SPLIT_PART(partner_user.email, '@', 1),
      'Partner'
    ) AS partner_name,
    conversation.support_escalated_at,
    conversation.last_message_preview
  FROM public.booking_conversation_reports AS report
  INNER JOIN public.booking_conversations AS conversation
    ON conversation.id = report.conversation_id
  INNER JOIN LATERAL public.messaging_get_booking_parties(conversation.booking_scope, conversation.booking_id) AS booking_ctx
    ON TRUE
  LEFT JOIN public.users AS reporter_user
    ON reporter_user.id = report.reporter_id
  LEFT JOIN public.profiles AS reporter_profile
    ON reporter_profile.id = report.reporter_id
  LEFT JOIN public.users AS traveler_user
    ON traveler_user.id = booking_ctx.traveler_id
  LEFT JOIN public.profiles AS traveler_profile
    ON traveler_profile.id = booking_ctx.traveler_id
  LEFT JOIN public.users AS partner_user
    ON partner_user.id = booking_ctx.partner_id
  LEFT JOIN public.profiles AS partner_profile
    ON partner_profile.id = booking_ctx.partner_id
  WHERE (p_status IS NULL OR report.status = p_status)
  ORDER BY report.created_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_messaging_report_status(
  p_report_id UUID,
  p_status public.messaging_report_status_enum,
  p_reason TEXT,
  p_internal_note TEXT DEFAULT NULL
)
RETURNS public.booking_conversation_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev JSONB;
  v_new JSONB;
  v_row public.booking_conversation_reports;
  v_role public.admin_role_enum;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  v_role := public.get_admin_role(auth.uid());
  IF v_role = 'support' AND p_status = 'open' THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  IF NULLIF(BTRIM(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(report.*)
  INTO v_prev
  FROM public.booking_conversation_reports AS report
  WHERE report.id = p_report_id;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'Messaging report not found';
  END IF;

  v_action := CASE
    WHEN p_status = 'open' THEN 'reopen'
    WHEN p_status = 'reviewing' THEN 'review'
    WHEN p_status = 'resolved' THEN 'resolve'
    WHEN p_status = 'dismissed' THEN 'dismiss'
    ELSE 'status_change'
  END;

  UPDATE public.booking_conversation_reports AS report
  SET
    status = p_status,
    status_reason = p_reason,
    review_notes = NULLIF(BTRIM(p_internal_note), ''),
    reviewed_by = auth.uid(),
    reviewed_at = TIMEZONE('UTC', NOW()),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE report.id = p_report_id
  RETURNING * INTO v_row;

  SELECT to_jsonb(v_row.*) INTO v_new;

  PERFORM public.admin_log_action('report', p_report_id, 'messaging_' || v_action, p_reason, v_prev, v_new);

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_support_escalations(
  p_status public.messaging_support_review_status_enum DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  conversation_id UUID,
  booking_scope public.messaging_booking_scope_enum,
  booking_id UUID,
  booking_label TEXT,
  subject TEXT,
  conversation_status public.messaging_conversation_status_enum,
  support_escalated_at TIMESTAMPTZ,
  support_review_status public.messaging_support_review_status_enum,
  support_review_reason TEXT,
  support_review_notes TEXT,
  support_reviewed_by UUID,
  support_reviewed_at TIMESTAMPTZ,
  traveler_name TEXT,
  partner_name TEXT,
  last_message_preview TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    conversation.id,
    conversation.booking_scope,
    conversation.booking_id,
    booking_ctx.booking_label,
    conversation.subject,
    conversation.status,
    conversation.support_escalated_at,
    COALESCE(conversation.support_review_status, 'pending'::public.messaging_support_review_status_enum),
    conversation.support_review_reason,
    conversation.support_review_notes,
    conversation.support_reviewed_by,
    conversation.support_reviewed_at,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', traveler_profile.first_name, traveler_profile.last_name)), ''),
      traveler_user.full_name,
      SPLIT_PART(traveler_user.email, '@', 1),
      'Traveler'
    ) AS traveler_name,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', partner_profile.first_name, partner_profile.last_name)), ''),
      partner_user.full_name,
      SPLIT_PART(partner_user.email, '@', 1),
      'Partner'
    ) AS partner_name,
    conversation.last_message_preview,
    conversation.updated_at
  FROM public.booking_conversations AS conversation
  INNER JOIN LATERAL public.messaging_get_booking_parties(conversation.booking_scope, conversation.booking_id) AS booking_ctx
    ON TRUE
  LEFT JOIN public.users AS traveler_user
    ON traveler_user.id = booking_ctx.traveler_id
  LEFT JOIN public.profiles AS traveler_profile
    ON traveler_profile.id = booking_ctx.traveler_id
  LEFT JOIN public.users AS partner_user
    ON partner_user.id = booking_ctx.partner_id
  LEFT JOIN public.profiles AS partner_profile
    ON partner_profile.id = booking_ctx.partner_id
  WHERE conversation.support_escalated_at IS NOT NULL
    AND (p_status IS NULL OR COALESCE(conversation.support_review_status, 'pending'::public.messaging_support_review_status_enum) = p_status)
  ORDER BY conversation.support_escalated_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_support_escalation_status(
  p_conversation_id UUID,
  p_status public.messaging_support_review_status_enum,
  p_reason TEXT,
  p_internal_note TEXT DEFAULT NULL
)
RETURNS TABLE (
  conversation_id UUID,
  support_review_status public.messaging_support_review_status_enum,
  support_review_reason TEXT,
  support_review_notes TEXT,
  support_reviewed_by UUID,
  support_reviewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev JSONB;
  v_new JSONB;
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_role public.admin_role_enum;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  v_role := public.get_admin_role(auth.uid());
  IF v_role = 'support' AND p_status = 'pending' THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  IF NULLIF(BTRIM(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(conversation.*)
  INTO v_prev
  FROM public.booking_conversations AS conversation
  WHERE conversation.id = p_conversation_id
    AND conversation.support_escalated_at IS NOT NULL;

  IF v_prev IS NULL THEN
    RAISE EXCEPTION 'Escalated conversation not found';
  END IF;

  UPDATE public.booking_conversations AS conversation
  SET
    support_review_status = p_status,
    support_review_reason = p_reason,
    support_review_notes = NULLIF(BTRIM(p_internal_note), ''),
    support_reviewed_by = auth.uid(),
    support_reviewed_at = v_now,
    updated_at = v_now
  WHERE conversation.id = p_conversation_id;

  SELECT to_jsonb(conversation.*)
  INTO v_new
  FROM public.booking_conversations AS conversation
  WHERE conversation.id = p_conversation_id;

  v_action := CASE
    WHEN p_status = 'pending' THEN 'support_escalation_reopen'
    WHEN p_status = 'in_review' THEN 'support_escalation_review'
    WHEN p_status = 'resolved' THEN 'support_escalation_resolve'
    ELSE 'support_escalation_status_change'
  END;

  PERFORM public.admin_log_action('booking', p_conversation_id, v_action, p_reason, v_prev, v_new);

  RETURN QUERY
  SELECT
    conversation.id,
    conversation.support_review_status,
    conversation.support_review_reason,
    conversation.support_review_notes,
    conversation.support_reviewed_by,
    conversation.support_reviewed_at
  FROM public.booking_conversations AS conversation
  WHERE conversation.id = p_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_messaging_reports(public.messaging_report_status_enum, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_messaging_report_status(UUID, public.messaging_report_status_enum, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_support_escalations(public.messaging_support_review_status_enum, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_support_escalation_status(UUID, public.messaging_support_review_status_enum, TEXT, TEXT) TO authenticated;