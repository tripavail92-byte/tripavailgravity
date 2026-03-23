BEGIN;

INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
SELECT
  auth_user.id,
  auth_user.email,
  auth_user.raw_user_meta_data ->> 'full_name',
  auth_user.raw_user_meta_data ->> 'avatar_url',
  COALESCE(auth_user.created_at, TIMEZONE('UTC', NOW())),
  TIMEZONE('UTC', NOW())
FROM public.admin_users AS admin_user
INNER JOIN auth.users AS auth_user
  ON auth_user.id = admin_user.id
LEFT JOIN public.users AS user_row
  ON user_row.id = admin_user.id
WHERE user_row.id IS NULL;

INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
SELECT
  admin_user.id,
  'traveller',
  TRUE,
  'pending'
FROM public.admin_users AS admin_user
LEFT JOIN public.user_roles AS role_row
  ON role_row.user_id = admin_user.id
 AND role_row.role_type = 'traveller'
WHERE role_row.user_id IS NULL;

INSERT INTO public.traveller_profiles (user_id)
SELECT admin_user.id
FROM public.admin_users AS admin_user
LEFT JOIN public.traveller_profiles AS profile_row
  ON profile_row.user_id = admin_user.id
WHERE profile_row.user_id IS NULL;

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
#variable_conflict use_column
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
  INNER JOIN public.users AS support_user
    ON support_user.id = admin_user.id
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

    UPDATE public.booking_conversations AS conversation
    SET
      last_message_at = v_now,
      last_message_preview = 'Support escalation requested',
      updated_at = v_now
    WHERE conversation.id = p_conversation_id;

    UPDATE public.booking_conversation_participants AS participant
    SET
      unread_count = CASE
        WHEN participant.user_id = v_user_id THEN 0
        ELSE participant.unread_count + 1
      END,
      last_read_at = CASE
        WHEN participant.user_id = v_user_id THEN v_now
        ELSE participant.last_read_at
      END,
      last_delivered_at = CASE
        WHEN participant.user_id = v_user_id THEN v_now
        ELSE participant.last_delivered_at
      END,
      is_archived = CASE
        WHEN participant.user_id = v_user_id THEN participant.is_archived
        ELSE FALSE
      END
    WHERE participant.conversation_id = p_conversation_id
      AND participant.left_at IS NULL;

    INSERT INTO public.notifications (user_id, type, title, body)
    SELECT
      admin_user.id,
      'support_escalation',
      'Booking conversation needs support',
      COALESCE(v_subject, 'Booking conversation') || ' was escalated to support.'
    FROM public.admin_users AS admin_user
    INNER JOIN public.users AS support_user
      ON support_user.id = admin_user.id
    WHERE admin_user.role IN ('support', 'super_admin')
      AND admin_user.id <> v_user_id;
  END IF;

  RETURN QUERY SELECT p_conversation_id, v_existing_escalated_at, v_added_count;
END;
$$;

COMMIT;