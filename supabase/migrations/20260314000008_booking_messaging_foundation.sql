-- Booking-scoped messenger foundation
-- Establishes durable schema and RPCs for booking conversations, participants,
-- messages, read receipts, reactions, templates, and scheduled deliveries.

ALTER TABLE public.account_settings
ADD COLUMN IF NOT EXISTS show_message_read_receipts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_translate_messages BOOLEAN DEFAULT TRUE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_booking_scope_enum') THEN
    CREATE TYPE public.messaging_booking_scope_enum AS ENUM ('tour_booking', 'package_booking');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_conversation_status_enum') THEN
    CREATE TYPE public.messaging_conversation_status_enum AS ENUM ('active', 'closed', 'blocked');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_participant_role_enum') THEN
    CREATE TYPE public.messaging_participant_role_enum AS ENUM (
      'traveler',
      'operator',
      'owner',
      'co_host',
      'support'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_message_kind_enum') THEN
    CREATE TYPE public.messaging_message_kind_enum AS ENUM (
      'text',
      'system',
      'quick_reply',
      'scheduled_quick_reply',
      'attachment',
      'recommendation',
      'support_note'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_attachment_kind_enum') THEN
    CREATE TYPE public.messaging_attachment_kind_enum AS ENUM ('image', 'video', 'document', 'link');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_template_trigger_enum') THEN
    CREATE TYPE public.messaging_template_trigger_enum AS ENUM (
      'manual',
      'booking_confirmed',
      'pre_check_in',
      'check_in',
      'pre_check_out',
      'check_out',
      'trip_started',
      'trip_ended'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_template_delivery_status_enum') THEN
    CREATE TYPE public.messaging_template_delivery_status_enum AS ENUM (
      'scheduled',
      'sent',
      'skipped',
      'cancelled'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messaging_attachment_scan_status_enum') THEN
    CREATE TYPE public.messaging_attachment_scan_status_enum AS ENUM (
      'pending',
      'clean',
      'blocked'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.booking_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_scope public.messaging_booking_scope_enum NOT NULL,
  booking_id UUID NOT NULL,
  subject TEXT,
  status public.messaging_conversation_status_enum NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  support_escalated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (booking_scope, booking_id)
);

CREATE TABLE IF NOT EXISTS public.booking_conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.booking_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_role public.messaging_participant_role_enum NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  left_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  last_delivered_at TIMESTAMPTZ,
  unread_count INT NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  can_send BOOLEAN NOT NULL DEFAULT TRUE,
  can_upload BOOLEAN NOT NULL DEFAULT TRUE,
  receive_email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  receive_push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  receive_sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.booking_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.booking_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  sender_role public.messaging_participant_role_enum NOT NULL,
  message_kind public.messaging_message_kind_enum NOT NULL DEFAULT 'text',
  body TEXT,
  body_rich JSONB NOT NULL DEFAULT '{}'::JSONB,
  translations JSONB NOT NULL DEFAULT '{}'::JSONB,
  reply_to_message_id UUID REFERENCES public.booking_conversation_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  edited_at TIMESTAMPTZ,
  unsent_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', COALESCE(body, ''))
  ) STORED
);

CREATE TABLE IF NOT EXISTS public.booking_conversation_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.booking_conversation_messages(id) ON DELETE CASCADE,
  attachment_kind public.messaging_attachment_kind_enum NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'booking-message-attachments',
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  width INT,
  height INT,
  duration_seconds INT,
  checksum TEXT,
  scan_status public.messaging_attachment_scan_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (storage_bucket, storage_path)
);

CREATE TABLE IF NOT EXISTS public.booking_conversation_message_reads (
  message_id UUID NOT NULL REFERENCES public.booking_conversation_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  read_at TIMESTAMPTZ,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.booking_conversation_message_reactions (
  message_id UUID NOT NULL REFERENCES public.booking_conversation_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  PRIMARY KEY (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.booking_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_scope public.messaging_booking_scope_enum,
  template_name TEXT NOT NULL,
  message_body TEXT NOT NULL,
  message_language TEXT NOT NULL DEFAULT 'en',
  message_kind public.messaging_message_kind_enum NOT NULL DEFAULT 'quick_reply',
  trigger_event public.messaging_template_trigger_enum NOT NULL DEFAULT 'manual',
  trigger_offset_minutes INT NOT NULL DEFAULT 0,
  applies_automatically BOOLEAN NOT NULL DEFAULT FALSE,
  send_for_last_minute BOOLEAN NOT NULL DEFAULT FALSE,
  is_shared_with_team BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TABLE IF NOT EXISTS public.booking_message_template_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.booking_message_templates(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.booking_conversations(id) ON DELETE CASCADE,
  booking_scope public.messaging_booking_scope_enum NOT NULL,
  booking_id UUID NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status public.messaging_template_delivery_status_enum NOT NULL DEFAULT 'scheduled',
  sent_message_id UUID REFERENCES public.booking_conversation_messages(id) ON DELETE SET NULL,
  skipped_reason TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS booking_conversations_last_message_idx
  ON public.booking_conversations(last_message_at DESC NULLS LAST, updated_at DESC);
CREATE INDEX IF NOT EXISTS booking_conversations_status_idx
  ON public.booking_conversations(status, booking_scope);
CREATE INDEX IF NOT EXISTS booking_conversation_participants_user_idx
  ON public.booking_conversation_participants(user_id, is_archived, joined_at DESC);
CREATE INDEX IF NOT EXISTS booking_conversation_messages_conversation_idx
  ON public.booking_conversation_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_conversation_messages_search_idx
  ON public.booking_conversation_messages USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS booking_conversation_attachments_message_idx
  ON public.booking_conversation_message_attachments(message_id);
CREATE INDEX IF NOT EXISTS booking_conversation_reads_user_idx
  ON public.booking_conversation_message_reads(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS booking_message_templates_owner_idx
  ON public.booking_message_templates(owner_user_id, is_active, trigger_event);
CREATE INDEX IF NOT EXISTS booking_message_template_deliveries_schedule_idx
  ON public.booking_message_template_deliveries(status, scheduled_for);

ALTER TABLE public.booking_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_conversation_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_conversation_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_conversation_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_message_template_deliveries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.messaging_get_booking_parties(
  p_booking_scope public.messaging_booking_scope_enum,
  p_booking_id UUID
)
RETURNS TABLE (
  traveler_id UUID,
  partner_id UUID,
  partner_role public.messaging_participant_role_enum,
  booking_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_booking_scope = 'tour_booking' THEN
    RETURN QUERY
    SELECT
      booking.traveler_id,
      tour.operator_id,
      'operator'::public.messaging_participant_role_enum,
      COALESCE(tour.title, 'Tour booking')
    FROM public.tour_bookings AS booking
    INNER JOIN public.tours AS tour
      ON tour.id = booking.tour_id
    WHERE booking.id = p_booking_id;
  ELSIF p_booking_scope = 'package_booking' THEN
    RETURN QUERY
    SELECT
      booking.traveler_id,
      package.owner_id,
      'owner'::public.messaging_participant_role_enum,
      COALESCE(package.name, 'Package booking')
    FROM public.package_bookings AS booking
    INNER JOIN public.packages AS package
      ON package.id = booking.package_id
    WHERE booking.id = p_booking_id;
  ELSE
    RAISE EXCEPTION 'Unsupported booking scope: %', p_booking_scope;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_booking_conversation_participant(
  p_conversation_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.booking_conversation_participants AS participant
    WHERE participant.conversation_id = p_conversation_id
      AND participant.user_id = COALESCE(p_user_id, auth.uid())
      AND participant.left_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_booking_conversation_participant_text(
  p_conversation_id_text TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  BEGIN
    v_conversation_id := p_conversation_id_text::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN FALSE;
  END;

  RETURN public.is_booking_conversation_participant(v_conversation_id, p_user_id);
END;
$$;

DROP POLICY IF EXISTS "Participants can read booking conversations" ON public.booking_conversations;
CREATE POLICY "Participants can read booking conversations"
  ON public.booking_conversations
  FOR SELECT TO authenticated
  USING (
    public.is_booking_conversation_participant(id)
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Participants can read conversation participants" ON public.booking_conversation_participants;
CREATE POLICY "Participants can read conversation participants"
  ON public.booking_conversation_participants
  FOR SELECT TO authenticated
  USING (
    public.is_booking_conversation_participant(conversation_id)
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Participants can update own participant prefs" ON public.booking_conversation_participants;
CREATE POLICY "Participants can update own participant prefs"
  ON public.booking_conversation_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Participants can read conversation messages" ON public.booking_conversation_messages;
CREATE POLICY "Participants can read conversation messages"
  ON public.booking_conversation_messages
  FOR SELECT TO authenticated
  USING (
    public.is_booking_conversation_participant(conversation_id)
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Participants can read conversation attachments" ON public.booking_conversation_message_attachments;
CREATE POLICY "Participants can read conversation attachments"
  ON public.booking_conversation_message_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.booking_conversation_messages AS message
      WHERE message.id = booking_conversation_message_attachments.message_id
        AND public.is_booking_conversation_participant(message.conversation_id)
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Participants can read message receipts" ON public.booking_conversation_message_reads;
CREATE POLICY "Participants can read message receipts"
  ON public.booking_conversation_message_reads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.booking_conversation_messages AS message
      WHERE message.id = booking_conversation_message_reads.message_id
        AND public.is_booking_conversation_participant(message.conversation_id)
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own receipts" ON public.booking_conversation_message_reads;
CREATE POLICY "Users can insert own receipts"
  ON public.booking_conversation_message_reads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own receipts" ON public.booking_conversation_message_reads;
CREATE POLICY "Users can update own receipts"
  ON public.booking_conversation_message_reads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Participants can read reactions" ON public.booking_conversation_message_reactions;
CREATE POLICY "Participants can read reactions"
  ON public.booking_conversation_message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.booking_conversation_messages AS message
      WHERE message.id = booking_conversation_message_reactions.message_id
        AND public.is_booking_conversation_participant(message.conversation_id)
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own reactions" ON public.booking_conversation_message_reactions;
CREATE POLICY "Users can manage own reactions"
  ON public.booking_conversation_message_reactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own message templates" ON public.booking_message_templates;
CREATE POLICY "Users can manage own message templates"
  ON public.booking_message_templates
  FOR ALL TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

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
    OR public.is_booking_conversation_participant(conversation_id)
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Template owners can manage deliveries" ON public.booking_message_template_deliveries;
CREATE POLICY "Template owners can manage deliveries"
  ON public.booking_message_template_deliveries
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.booking_message_templates AS template
      WHERE template.id = booking_message_template_deliveries.template_id
        AND template.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.booking_message_templates AS template
      WHERE template.id = booking_message_template_deliveries.template_id
        AND template.owner_user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_booking_conversations_updated_at ON public.booking_conversations;
CREATE TRIGGER update_booking_conversations_updated_at
BEFORE UPDATE ON public.booking_conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_message_templates_updated_at ON public.booking_message_templates;
CREATE TRIGGER update_booking_message_templates_updated_at
BEFORE UPDATE ON public.booking_message_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_message_template_deliveries_updated_at ON public.booking_message_template_deliveries;
CREATE TRIGGER update_booking_message_template_deliveries_updated_at
BEFORE UPDATE ON public.booking_message_template_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-message-attachments', 'booking-message-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Participants can read booking message attachments" ON storage.objects;
CREATE POLICY "Participants can read booking message attachments"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'booking-message-attachments'
    AND public.is_booking_conversation_participant_text((storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Participants can upload booking message attachments" ON storage.objects;
CREATE POLICY "Participants can upload booking message attachments"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'booking-message-attachments'
    AND public.is_booking_conversation_participant_text((storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Participants can update own booking message attachments" ON storage.objects;
CREATE POLICY "Participants can update own booking message attachments"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'booking-message-attachments'
    AND public.is_booking_conversation_participant_text((storage.foldername(name))[1])
  )
  WITH CHECK (
    bucket_id = 'booking-message-attachments'
    AND public.is_booking_conversation_participant_text((storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Participants can delete booking message attachments" ON storage.objects;
CREATE POLICY "Participants can delete booking message attachments"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'booking-message-attachments'
    AND public.is_booking_conversation_participant_text((storage.foldername(name))[1])
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

  SELECT traveler_id, partner_id, partner_role, booking_label
  INTO v_traveler_id, v_partner_id, v_partner_role, v_booking_label
  FROM public.messaging_get_booking_parties(p_booking_scope, p_booking_id);

  IF v_traveler_id IS NULL OR v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_user_id NOT IN (v_traveler_id, v_partner_id) AND NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT id INTO v_conversation_id
  FROM public.booking_conversations
  WHERE booking_scope = p_booking_scope
    AND booking_id = p_booking_id;

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
    UPDATE public.booking_conversation_participants
    SET unread_count = 0,
        last_read_at = v_now,
        last_delivered_at = COALESCE(last_delivered_at, v_now)
    WHERE conversation_id = p_conversation_id
      AND user_id = v_user_id;

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

  UPDATE public.booking_conversation_participants
  SET unread_count = 0,
      last_read_at = v_now,
      last_delivered_at = COALESCE(last_delivered_at, v_now)
  WHERE conversation_id = p_conversation_id
    AND user_id = v_user_id;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.messaging_get_booking_parties(public.messaging_booking_scope_enum, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_booking_conversation_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_booking_conversation_participant_text(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_get_or_create_booking_conversation(public.messaging_booking_scope_enum, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_list_conversations(BOOLEAN, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_get_conversation_messages(UUID, INT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_send_message(UUID, TEXT, public.messaging_message_kind_enum, UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_mark_conversation_read(UUID, UUID) TO authenticated;