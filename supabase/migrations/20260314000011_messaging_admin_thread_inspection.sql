-- Messaging admin thread inspection
-- Allows admins and support reviewers to inspect booking conversations directly
-- from the moderation queue without joining the participant thread UI.

CREATE OR REPLACE FUNCTION public.admin_get_booking_conversation_messages(
  p_conversation_id UUID,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  message_id UUID,
  conversation_id UUID,
  sender_id UUID,
  sender_role public.messaging_participant_role_enum,
  sender_name TEXT,
  message_kind public.messaging_message_kind_enum,
  body TEXT,
  reply_to_message_id UUID,
  created_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  unsent_at TIMESTAMPTZ,
  metadata JSONB,
  reactions JSONB,
  read_by JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.booking_conversations AS conversation
    WHERE conversation.id = p_conversation_id
  ) THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  RETURN QUERY
  SELECT
    message.id,
    message.conversation_id,
    message.sender_id,
    message.sender_role,
    CASE
      WHEN message.sender_role = 'support' THEN COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', profile.first_name, profile.last_name)), ''),
        user_row.full_name,
        SPLIT_PART(user_row.email, '@', 1),
        'TripAvail support'
      )
      ELSE COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', profile.first_name, profile.last_name)), ''),
        user_row.full_name,
        SPLIT_PART(user_row.email, '@', 1),
        INITCAP(REPLACE(message.sender_role::TEXT, '_', ' '))
      )
    END AS sender_name,
    message.message_kind,
    message.body,
    message.reply_to_message_id,
    message.created_at,
    message.edited_at,
    message.unsent_at,
    message.metadata,
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
      WHERE receipt.message_id = message.id
        AND receipt.read_at IS NOT NULL
    ), '[]'::JSONB) AS read_by
  FROM public.booking_conversation_messages AS message
  LEFT JOIN public.users AS user_row
    ON user_row.id = message.sender_id
  LEFT JOIN public.profiles AS profile
    ON profile.id = message.sender_id
  WHERE message.conversation_id = p_conversation_id
  ORDER BY message.created_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_booking_conversation_messages(UUID, INT) TO authenticated;