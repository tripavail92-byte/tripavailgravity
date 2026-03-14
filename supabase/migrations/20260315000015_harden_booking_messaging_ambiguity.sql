-- Harden booking messaging SQL against PL/pgSQL variable/column ambiguity

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

CREATE OR REPLACE FUNCTION public.messaging_get_or_create_booking_conversation(
  p_booking_scope public.messaging_booking_scope_enum,
  p_booking_id UUID
)
RETURNS TABLE (
  conversation_id UUID,
  created BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID := auth.uid();
  v_traveler_id UUID;
  v_partner_id UUID;
  v_partner_role public.messaging_participant_role_enum;
  v_booking_label TEXT;
  v_conversation_id UUID;
  v_created BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT booking_parties.traveler_id, booking_parties.partner_id, booking_parties.partner_role, booking_parties.booking_label
  INTO v_traveler_id, v_partner_id, v_partner_role, v_booking_label
  FROM public.messaging_get_booking_parties(p_booking_scope, p_booking_id) AS booking_parties;

  IF v_traveler_id IS NULL OR v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_user_id NOT IN (v_traveler_id, v_partner_id) AND NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT conversation.id
  INTO v_conversation_id
  FROM public.booking_conversations AS conversation
  WHERE conversation.booking_scope = p_booking_scope
    AND conversation.booking_id = p_booking_id;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.booking_conversations (
      booking_scope,
      booking_id,
      subject,
      created_by,
      metadata
    )
    VALUES (
      p_booking_scope,
      p_booking_id,
      v_booking_label,
      v_user_id,
      jsonb_build_object('seeded_from_booking', TRUE)
    )
    RETURNING id INTO v_conversation_id;

    v_created := TRUE;
  END IF;

  INSERT INTO public.booking_conversation_participants (
    conversation_id,
    user_id,
    participant_role,
    metadata
  )
  VALUES
    (v_conversation_id, v_traveler_id, 'traveler', '{}'::JSONB),
    (v_conversation_id, v_partner_id, v_partner_role, '{}'::JSONB)
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    participant_role = EXCLUDED.participant_role,
    left_at = NULL,
    can_send = TRUE,
    can_upload = TRUE;

  IF public.is_admin(v_user_id) AND v_user_id NOT IN (v_traveler_id, v_partner_id) THEN
    INSERT INTO public.booking_conversation_participants (
      conversation_id,
      user_id,
      participant_role,
      metadata
    )
    VALUES (
      v_conversation_id,
      v_user_id,
      'support',
      jsonb_build_object('seeded_by_admin_access', TRUE)
    )
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET
      participant_role = 'support',
      left_at = NULL,
      can_send = TRUE,
      can_upload = TRUE;
  END IF;

  RETURN QUERY SELECT v_conversation_id, v_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.messaging_list_conversations(
  p_include_archived BOOLEAN DEFAULT FALSE,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  conversation_id UUID,
  booking_scope public.messaging_booking_scope_enum,
  booking_id UUID,
  subject TEXT,
  status public.messaging_conversation_status_enum,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INT,
  is_archived BOOLEAN,
  is_muted BOOLEAN,
  participant_role public.messaging_participant_role_enum,
  traveler_id UUID,
  traveler_name TEXT,
  partner_id UUID,
  partner_name TEXT,
  booking_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT
    conversation.id,
    conversation.booking_scope,
    conversation.booking_id,
    conversation.subject,
    conversation.status,
    conversation.updated_at,
    conversation.last_message_at,
    conversation.last_message_preview,
    participant.unread_count,
    participant.is_archived,
    participant.is_muted,
    participant.participant_role,
    booking_ctx.traveler_id,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', traveler_profile.first_name, traveler_profile.last_name)), ''),
      traveler_user.full_name,
      SPLIT_PART(traveler_user.email, '@', 1),
      'Traveler'
    ) AS traveler_name,
    booking_ctx.partner_id,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', partner_profile.first_name, partner_profile.last_name)), ''),
      partner_user.full_name,
      SPLIT_PART(partner_user.email, '@', 1),
      'Partner'
    ) AS partner_name,
    booking_ctx.booking_label
  FROM public.booking_conversation_participants AS participant
  INNER JOIN public.booking_conversations AS conversation
    ON conversation.id = participant.conversation_id
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
  WHERE participant.user_id = v_user_id
    AND participant.left_at IS NULL
    AND (p_include_archived OR participant.is_archived = FALSE)
  ORDER BY COALESCE(conversation.last_message_at, conversation.created_at) DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.messaging_get_conversation_messages(
  p_conversation_id UUID,
  p_limit INT DEFAULT 100,
  p_before TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  message_id UUID,
  conversation_id UUID,
  sender_id UUID,
  sender_role public.messaging_participant_role_enum,
  message_kind public.messaging_message_kind_enum,
  body TEXT,
  body_rich JSONB,
  translations JSONB,
  reply_to_message_id UUID,
  created_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  unsent_at TIMESTAMPTZ,
  metadata JSONB,
  attachments JSONB,
  reactions JSONB,
  read_by JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID := auth.uid();
  v_cutoff TIMESTAMPTZ := p_before;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_booking_conversation_participant(p_conversation_id, v_user_id) AND NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    message.id,
    message.conversation_id,
    message.sender_id,
    message.sender_role,
    message.message_kind,
    message.body,
    message.body_rich,
    message.translations,
    message.reply_to_message_id,
    message.created_at,
    message.edited_at,
    message.unsent_at,
    message.metadata,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', attachment.id,
          'attachment_kind', attachment.attachment_kind,
          'storage_bucket', attachment.storage_bucket,
          'storage_path', attachment.storage_path,
          'original_filename', attachment.original_filename,
          'mime_type', attachment.mime_type,
          'size_bytes', attachment.size_bytes,
          'scan_status', attachment.scan_status,
          'created_at', attachment.created_at,
          'metadata', attachment.metadata
        )
        ORDER BY attachment.created_at
      )
      FROM public.booking_conversation_message_attachments AS attachment
      WHERE attachment.message_id = message.id
    ), '[]'::JSONB) AS attachments,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'emoji', reaction.emoji,
          'user_id', reaction.user_id,
          'created_at', reaction.created_at
        )
        ORDER BY reaction.created_at
      )
      FROM public.booking_conversation_message_reactions AS reaction
      WHERE reaction.message_id = message.id
    ), '[]'::JSONB) AS reactions,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', receipt.user_id,
          'read_at', receipt.read_at
        )
        ORDER BY receipt.read_at
      )
      FROM public.booking_conversation_message_reads AS receipt
      LEFT JOIN public.account_settings AS settings
        ON settings.user_id = receipt.user_id
      WHERE receipt.message_id = message.id
        AND receipt.read_at IS NOT NULL
        AND (COALESCE(settings.show_message_read_receipts, TRUE) OR receipt.user_id = v_user_id)
    ), '[]'::JSONB) AS read_by
  FROM public.booking_conversation_messages AS message
  WHERE message.conversation_id = p_conversation_id
    AND (v_cutoff IS NULL OR message.created_at < v_cutoff)
  ORDER BY message.created_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

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
#variable_conflict use_column
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

  UPDATE public.booking_conversations AS conversation
  SET
    last_message_at = v_now,
    last_message_preview = v_preview,
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
#variable_conflict use_column
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
#variable_conflict use_column
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
    WHERE admin_user.role IN ('support', 'super_admin')
      AND admin_user.id <> v_user_id;
  END IF;

  RETURN QUERY SELECT p_conversation_id, v_existing_escalated_at, v_added_count;
END;
$$;