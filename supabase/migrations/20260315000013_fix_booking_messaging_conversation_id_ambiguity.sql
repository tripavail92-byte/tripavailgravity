-- Fix ambiguous conversation_id references in booking messaging policies/functions

DROP POLICY IF EXISTS "Participants can read conversation participants" ON public.booking_conversation_participants;
CREATE POLICY "Participants can read conversation participants"
  ON public.booking_conversation_participants
  FOR SELECT TO authenticated
  USING (
    public.is_booking_conversation_participant(booking_conversation_participants.conversation_id)
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Participants can read conversation messages" ON public.booking_conversation_messages;
CREATE POLICY "Participants can read conversation messages"
  ON public.booking_conversation_messages
  FOR SELECT TO authenticated
  USING (
    public.is_booking_conversation_participant(booking_conversation_messages.conversation_id)
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Template owners can read deliveries" ON public.booking_message_template_deliveries;
CREATE POLICY "Template owners can read deliveries"
  ON public.booking_message_template_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.booking_message_templates AS template
      WHERE template.id = booking_message_template_deliveries.template_id
        AND template.owner_user_id = auth.uid()
    )
    OR public.is_booking_conversation_participant(booking_message_template_deliveries.conversation_id)
    OR public.is_admin(auth.uid())
  );

CREATE OR REPLACE FUNCTION public.messaging_send_message(
  p_conversation_id UUID,
  p_body TEXT,
  p_message_kind public.messaging_message_kind_enum DEFAULT 'text',
  p_reply_to_message_id UUID DEFAULT NULL,
  p_body_rich JSONB DEFAULT '{}'::JSONB,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  message_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_message_id UUID;
  v_sender_role public.messaging_participant_role_enum;
  v_conversation_status public.messaging_conversation_status_enum;
  v_body TEXT := NULLIF(BTRIM(p_body), '');
  v_preview TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT participant.participant_role, conversation.status
  INTO v_sender_role, v_conversation_status
  FROM public.booking_conversation_participants AS participant
  INNER JOIN public.booking_conversations AS conversation
    ON conversation.id = participant.conversation_id
  WHERE participant.conversation_id = p_conversation_id
    AND participant.user_id = v_user_id
    AND participant.left_at IS NULL
    AND participant.can_send = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found or send access denied';
  END IF;

  IF v_conversation_status <> 'active' THEN
    RAISE EXCEPTION 'Conversation is not active';
  END IF;

  IF p_message_kind IN ('text', 'quick_reply', 'scheduled_quick_reply', 'recommendation') AND v_body IS NULL THEN
    RAISE EXCEPTION 'Message body is required';
  END IF;

  INSERT INTO public.booking_conversation_messages (
    conversation_id,
    sender_id,
    sender_role,
    message_kind,
    body,
    body_rich,
    reply_to_message_id,
    metadata
  )
  VALUES (
    p_conversation_id,
    v_user_id,
    v_sender_role,
    p_message_kind,
    v_body,
    COALESCE(p_body_rich, '{}'::JSONB),
    p_reply_to_message_id,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_message_id;

  INSERT INTO public.booking_conversation_message_reads (
    message_id,
    user_id,
    delivered_at,
    read_at
  )
  VALUES (
    v_message_id,
    v_user_id,
    v_now,
    v_now
  )
  ON CONFLICT (message_id, user_id)
  DO UPDATE SET
    delivered_at = EXCLUDED.delivered_at,
    read_at = EXCLUDED.read_at;

  v_preview := LEFT(
    COALESCE(v_body, '[' || p_message_kind::TEXT || ']'),
    160
  );

  UPDATE public.booking_conversations
  SET
    last_message_at = v_now,
    last_message_preview = v_preview,
    updated_at = v_now
  WHERE id = p_conversation_id;

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

  RETURN QUERY SELECT v_message_id, v_now;
END;
$$;

CREATE OR REPLACE FUNCTION public.messaging_mark_conversation_read(
  p_conversation_id UUID,
  p_through_message_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_cutoff TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_booking_conversation_participant(p_conversation_id, v_user_id) AND NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_through_message_id IS NULL THEN
    SELECT MAX(message.created_at)
    INTO v_cutoff
    FROM public.booking_conversation_messages AS message
    WHERE message.conversation_id = p_conversation_id;
  ELSE
    SELECT message.created_at
    INTO v_cutoff
    FROM public.booking_conversation_messages AS message
    WHERE message.id = p_through_message_id
      AND message.conversation_id = p_conversation_id;
  END IF;

  IF v_cutoff IS NULL THEN
    UPDATE public.booking_conversation_participants AS participant
    SET unread_count = 0,
        last_read_at = v_now,
        last_delivered_at = COALESCE(participant.last_delivered_at, v_now)
    WHERE participant.conversation_id = p_conversation_id
      AND participant.user_id = v_user_id;

    RETURN 0;
  END IF;

  INSERT INTO public.booking_conversation_message_reads (
    message_id,
    user_id,
    delivered_at,
    read_at
  )
  SELECT
    message.id,
    v_user_id,
    v_now,
    v_now
  FROM public.booking_conversation_messages AS message
  WHERE message.conversation_id = p_conversation_id
    AND message.sender_id <> v_user_id
    AND message.deleted_at IS NULL
    AND message.unsent_at IS NULL
    AND message.created_at <= v_cutoff
  ON CONFLICT (message_id, user_id)
  DO UPDATE SET
    delivered_at = GREATEST(booking_conversation_message_reads.delivered_at, EXCLUDED.delivered_at),
    read_at = COALESCE(booking_conversation_message_reads.read_at, EXCLUDED.read_at);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.booking_conversation_participants AS participant
  SET unread_count = 0,
      last_read_at = v_now,
      last_delivered_at = COALESCE(participant.last_delivered_at, v_now)
  WHERE participant.conversation_id = p_conversation_id
    AND participant.user_id = v_user_id;

  RETURN v_count;
END;
$$;

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
    WHERE admin_user.role IN ('support', 'super_admin')
      AND admin_user.id <> v_user_id;
  END IF;

  RETURN QUERY SELECT p_conversation_id, v_existing_escalated_at, v_added_count;
END;
$$;