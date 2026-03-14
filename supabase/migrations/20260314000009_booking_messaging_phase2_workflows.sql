-- Booking messenger phase 2 workflows
-- Adds participant preferences, edit and unsend windows, reactions,
-- reporting, and support escalation RPCs.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_report_status_enum') THEN
    CREATE TYPE public.messaging_report_status_enum AS ENUM (
      'open',
      'reviewing',
      'resolved',
      'dismissed'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.booking_conversation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.booking_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.booking_conversation_messages(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status public.messaging_report_status_enum NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  CONSTRAINT booking_conversation_reports_reason_length_check CHECK (CHAR_LENGTH(BTRIM(reason)) >= 3)
);

CREATE INDEX IF NOT EXISTS booking_conversation_reports_conversation_idx
  ON public.booking_conversation_reports(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_conversation_reports_message_idx
  ON public.booking_conversation_reports(message_id)
  WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS booking_conversation_reports_reporter_idx
  ON public.booking_conversation_reports(reporter_id, created_at DESC);

ALTER TABLE public.booking_conversation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reporter can read own conversation reports" ON public.booking_conversation_reports;
CREATE POLICY "Reporter can read own conversation reports" ON public.booking_conversation_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Reporter can create own conversation reports" ON public.booking_conversation_reports;
CREATE POLICY "Reporter can create own conversation reports" ON public.booking_conversation_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read conversation reports" ON public.booking_conversation_reports;
CREATE POLICY "Admins can read conversation reports" ON public.booking_conversation_reports
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update conversation reports" ON public.booking_conversation_reports;
CREATE POLICY "Admins can update conversation reports" ON public.booking_conversation_reports
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service can manage conversation reports" ON public.booking_conversation_reports;
CREATE POLICY "Service can manage conversation reports" ON public.booking_conversation_reports
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE OR REPLACE FUNCTION public.messaging_update_conversation_preferences(
  p_conversation_id UUID,
  p_is_archived BOOLEAN DEFAULT NULL,
  p_is_muted BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  conversation_id UUID,
  is_archived BOOLEAN,
  is_muted BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.booking_conversation_participants AS participant
  SET
    is_archived = COALESCE(p_is_archived, participant.is_archived),
    is_muted = COALESCE(p_is_muted, participant.is_muted),
    metadata = participant.metadata || jsonb_build_object('preferences_updated_at', v_now)
  WHERE participant.conversation_id = p_conversation_id
    AND participant.user_id = v_user_id
    AND participant.left_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  RETURN QUERY
  SELECT
    participant.conversation_id,
    participant.is_archived,
    participant.is_muted,
    v_now
  FROM public.booking_conversation_participants AS participant
  WHERE participant.conversation_id = p_conversation_id
    AND participant.user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.messaging_edit_message(
  p_message_id UUID,
  p_body TEXT,
  p_body_rich JSONB DEFAULT '{}'::JSONB,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  message_id UUID,
  edited_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_body TEXT := NULLIF(BTRIM(p_body), '');
  v_conversation_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_body IS NULL THEN
    RAISE EXCEPTION 'Edited message body is required';
  END IF;

  SELECT message.conversation_id, message.created_at
  INTO v_conversation_id, v_created_at
  FROM public.booking_conversation_messages AS message
  WHERE message.id = p_message_id
    AND message.sender_id = v_user_id
    AND message.deleted_at IS NULL
    AND message.unsent_at IS NULL
    AND message.message_kind IN ('text', 'quick_reply', 'scheduled_quick_reply', 'recommendation');

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Message not found or edit access denied';
  END IF;

  IF v_created_at < v_now - INTERVAL '15 minutes' THEN
    RAISE EXCEPTION 'Edit window has expired';
  END IF;

  UPDATE public.booking_conversation_messages AS message
  SET
    body = v_body,
    body_rich = COALESCE(p_body_rich, '{}'::JSONB),
    edited_at = v_now,
    metadata = (message.metadata || COALESCE(p_metadata, '{}'::JSONB)) || jsonb_build_object(
      'edit_history',
      COALESCE(message.metadata->'edit_history', '[]'::JSONB) || jsonb_build_array(
        jsonb_build_object(
          'captured_at', v_now,
          'body', message.body,
          'body_rich', message.body_rich
        )
      )
    )
  WHERE message.id = p_message_id;

  UPDATE public.booking_conversations
  SET
    last_message_preview = LEFT(v_body, 160),
    updated_at = v_now
  WHERE id = v_conversation_id
    AND last_message_at = v_created_at;

  RETURN QUERY SELECT p_message_id, v_now;
END;
$$;

CREATE OR REPLACE FUNCTION public.messaging_unsend_message(
  p_message_id UUID
)
RETURNS TABLE (
  message_id UUID,
  unsent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_conversation_id UUID;
  v_created_at TIMESTAMPTZ;
  v_placeholder TEXT := 'This message was unsent';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT message.conversation_id, message.created_at
  INTO v_conversation_id, v_created_at
  FROM public.booking_conversation_messages AS message
  WHERE message.id = p_message_id
    AND message.sender_id = v_user_id
    AND message.deleted_at IS NULL
    AND message.unsent_at IS NULL;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Message not found or unsend access denied';
  END IF;

  IF v_created_at < v_now - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Unsend window has expired';
  END IF;

  UPDATE public.booking_conversation_messages AS message
  SET
    body = v_placeholder,
    body_rich = '{}'::JSONB,
    translations = '{}'::JSONB,
    unsent_at = v_now,
    metadata = message.metadata || jsonb_build_object('unsent_by_sender', TRUE)
  WHERE message.id = p_message_id;

  UPDATE public.booking_conversations
  SET
    last_message_preview = v_placeholder,
    updated_at = v_now
  WHERE id = v_conversation_id
    AND last_message_at = v_created_at;

  RETURN QUERY SELECT p_message_id, v_now;
END;
$$;

CREATE OR REPLACE FUNCTION public.messaging_toggle_message_reaction(
  p_message_id UUID,
  p_emoji TEXT
)
RETURNS TABLE (
  message_id UUID,
  emoji TEXT,
  active BOOLEAN,
  reaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_conversation_id UUID;
  v_active BOOLEAN;
  v_count BIGINT;
  v_clean_emoji TEXT := NULLIF(BTRIM(p_emoji), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_clean_emoji IS NULL THEN
    RAISE EXCEPTION 'Emoji is required';
  END IF;

  SELECT message.conversation_id
  INTO v_conversation_id
  FROM public.booking_conversation_messages AS message
  WHERE message.id = p_message_id
    AND message.deleted_at IS NULL;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  IF NOT public.is_booking_conversation_participant(v_conversation_id, v_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.booking_conversation_message_reactions AS reaction
    WHERE reaction.message_id = p_message_id
      AND reaction.user_id = v_user_id
      AND reaction.emoji = v_clean_emoji
  ) THEN
    DELETE FROM public.booking_conversation_message_reactions AS reaction
    WHERE reaction.message_id = p_message_id
      AND reaction.user_id = v_user_id
      AND reaction.emoji = v_clean_emoji;

    v_active := FALSE;
  ELSE
    INSERT INTO public.booking_conversation_message_reactions (
      message_id,
      user_id,
      emoji
    )
    VALUES (
      p_message_id,
      v_user_id,
      v_clean_emoji
    );

    v_active := TRUE;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM public.booking_conversation_message_reactions AS reaction
  WHERE reaction.message_id = p_message_id
    AND reaction.emoji = v_clean_emoji;

  RETURN QUERY SELECT p_message_id, v_clean_emoji, v_active, v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.messaging_report_conversation(
  p_conversation_id UUID,
  p_message_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL
)
RETURNS TABLE (
  report_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_report_id UUID;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_subject TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Report reason is required';
  END IF;

  IF NOT public.is_booking_conversation_participant(p_conversation_id, v_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_message_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.booking_conversation_messages AS message
    WHERE message.id = p_message_id
      AND message.conversation_id = p_conversation_id
  ) THEN
    RAISE EXCEPTION 'Message does not belong to this conversation';
  END IF;

  INSERT INTO public.booking_conversation_reports (
    conversation_id,
    message_id,
    reporter_id,
    reason,
    details,
    metadata
  )
  VALUES (
    p_conversation_id,
    p_message_id,
    v_user_id,
    v_reason,
    NULLIF(BTRIM(p_details), ''),
    jsonb_build_object('source', 'booking_messenger')
  )
  RETURNING id INTO v_report_id;

  SELECT conversation.subject
  INTO v_subject
  FROM public.booking_conversations AS conversation
  WHERE conversation.id = p_conversation_id;

  INSERT INTO public.notifications (user_id, type, title, body)
  SELECT
    admin_user.id,
    'message_report',
    'Conversation report submitted',
    COALESCE(v_subject, 'Booking conversation') || ' was reported for review.'
  FROM public.admin_users AS admin_user
  WHERE admin_user.role IN ('support', 'super_admin');

  RETURN QUERY SELECT v_report_id, v_now;
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

GRANT EXECUTE ON FUNCTION public.messaging_update_conversation_preferences(UUID, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_edit_message(UUID, TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_unsend_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_toggle_message_reaction(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_report_conversation(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_escalate_conversation_to_support(UUID, TEXT) TO authenticated;