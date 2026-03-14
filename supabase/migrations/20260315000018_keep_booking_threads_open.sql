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
    FALSE AS is_archived,
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
  ORDER BY COALESCE(conversation.last_message_at, conversation.created_at) DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
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
    is_archived = FALSE,
    is_muted = COALESCE(p_is_muted, participant.is_muted),
    metadata = participant.metadata || jsonb_build_object(
      'preferences_updated_at', v_now,
      'archive_disabled_at', v_now
    )
  WHERE participant.conversation_id = p_conversation_id
    AND participant.user_id = v_user_id
    AND participant.left_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  RETURN QUERY
  SELECT
    participant.conversation_id,
    FALSE AS is_archived,
    participant.is_muted,
    v_now
  FROM public.booking_conversation_participants AS participant
  WHERE participant.conversation_id = p_conversation_id
    AND participant.user_id = v_user_id;
END;
$$;

UPDATE public.booking_conversation_participants
SET is_archived = FALSE
WHERE is_archived = TRUE;