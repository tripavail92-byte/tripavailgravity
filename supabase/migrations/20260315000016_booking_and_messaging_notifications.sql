-- Add booking confirmation and traveler messaging notifications

CREATE OR REPLACE FUNCTION public.notification_actor_name(
  p_user_id UUID,
  p_fallback TEXT DEFAULT 'User'
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', profile.first_name, profile.last_name)), ''),
        user_row.full_name,
        SPLIT_PART(COALESCE(user_row.email, profile.email, ''), '@', 1)
      )
      FROM public.users AS user_row
      LEFT JOIN public.profiles AS profile
        ON profile.id = user_row.id
      WHERE user_row.id = p_user_id
      LIMIT 1
    ),
    p_fallback
  );
$$;

CREATE OR REPLACE FUNCTION public.notify_tour_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tour_title TEXT;
  v_operator_id UUID;
  v_traveler_name TEXT;
  v_schedule_label TEXT;
BEGIN
  IF NEW.status <> 'confirmed' OR COALESCE(OLD.status, '') = 'confirmed' THEN
    RETURN NEW;
  END IF;

  SELECT
    tour.title,
    tour.operator_id,
    public.notification_actor_name(NEW.traveler_id, 'Traveler'),
    CASE
      WHEN schedule.start_time IS NULL THEN NULL
      ELSE TO_CHAR(schedule.start_time AT TIME ZONE 'UTC', 'Mon DD, YYYY')
    END
  INTO v_tour_title, v_operator_id, v_traveler_name, v_schedule_label
  FROM public.tours AS tour
  LEFT JOIN public.tour_schedules AS schedule
    ON schedule.id = NEW.schedule_id
  WHERE tour.id = NEW.tour_id;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    NEW.traveler_id,
    'booking_confirmed',
    'Booking confirmed',
    COALESCE(v_tour_title, 'Your booking')
      || CASE WHEN v_schedule_label IS NULL THEN ' is confirmed.' ELSE ' for ' || v_schedule_label || ' is confirmed.' END
  );

  IF v_operator_id IS NOT NULL
    AND COALESCE(
      (
        SELECT settings.booking_notifications
        FROM public.tour_operator_settings AS settings
        WHERE settings.operator_id = v_operator_id
      ),
      TRUE
    ) THEN
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_operator_id,
      'booking_received',
      'New confirmed booking',
      v_traveler_name || ' booked ' || COALESCE(v_tour_title, 'your tour')
        || CASE WHEN v_schedule_label IS NULL THEN '.' ELSE ' for ' || v_schedule_label || '.' END
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_package_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package_name TEXT;
  v_owner_id UUID;
  v_traveler_name TEXT;
  v_check_in_label TEXT;
BEGIN
  IF NEW.status <> 'confirmed' OR COALESCE(OLD.status, '') = 'confirmed' THEN
    RETURN NEW;
  END IF;

  SELECT
    package.name,
    package.owner_id,
    public.notification_actor_name(NEW.traveler_id, 'Traveler'),
    CASE
      WHEN NEW.check_in_date IS NULL THEN NULL
      ELSE TO_CHAR(NEW.check_in_date AT TIME ZONE 'UTC', 'Mon DD, YYYY')
    END
  INTO v_package_name, v_owner_id, v_traveler_name, v_check_in_label
  FROM public.packages AS package
  WHERE package.id = NEW.package_id;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    NEW.traveler_id,
    'booking_confirmed',
    'Booking confirmed',
    COALESCE(v_package_name, 'Your booking')
      || CASE WHEN v_check_in_label IS NULL THEN ' is confirmed.' ELSE ' starting ' || v_check_in_label || ' is confirmed.' END
  );

  IF v_owner_id IS NOT NULL
    AND COALESCE(
      (
        SELECT settings.booking_notifications
        FROM public.hotel_manager_settings AS settings
        WHERE settings.manager_id = v_owner_id
      ),
      TRUE
    ) THEN
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_owner_id,
      'booking_received',
      'New confirmed booking',
      v_traveler_name || ' booked ' || COALESCE(v_package_name, 'your package')
        || CASE WHEN v_check_in_label IS NULL THEN '.' ELSE ' starting ' || v_check_in_label || '.' END
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_booking_message_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_conversation_subject TEXT;
  v_preview TEXT;
BEGIN
  IF NEW.message_kind IN ('system', 'support_note') THEN
    RETURN NEW;
  END IF;

  v_sender_name := public.notification_actor_name(
    NEW.sender_id,
    INITCAP(REPLACE(NEW.sender_role::TEXT, '_', ' '))
  );

  SELECT COALESCE(conversation.subject, 'Booking conversation')
  INTO v_conversation_subject
  FROM public.booking_conversations AS conversation
  WHERE conversation.id = NEW.conversation_id;

  v_preview := LEFT(COALESCE(NULLIF(BTRIM(NEW.body), ''), 'Sent you a message'), 140);

  INSERT INTO public.notifications (user_id, type, title, body)
  SELECT
    participant.user_id,
    'booking_message_received',
    'New message from ' || v_sender_name,
    v_conversation_subject || ': ' || v_preview
  FROM public.booking_conversation_participants AS participant
  WHERE participant.conversation_id = NEW.conversation_id
    AND participant.user_id <> NEW.sender_id
    AND participant.left_at IS NULL
    AND participant.is_muted = FALSE
    AND CASE participant.participant_role
      WHEN 'operator' THEN COALESCE(
        (
          SELECT settings.messaging_notifications
          FROM public.tour_operator_settings AS settings
          WHERE settings.operator_id = participant.user_id
        ),
        TRUE
      )
      WHEN 'owner' THEN COALESCE(
        (
          SELECT settings.messaging_notifications
          FROM public.hotel_manager_settings AS settings
          WHERE settings.manager_id = participant.user_id
        ),
        TRUE
      )
      ELSE TRUE
    END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_tour_booking_confirmed ON public.tour_bookings;
CREATE TRIGGER trigger_notify_tour_booking_confirmed
AFTER UPDATE ON public.tour_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_tour_booking_confirmed();

DROP TRIGGER IF EXISTS trigger_notify_package_booking_confirmed ON public.package_bookings;
CREATE TRIGGER trigger_notify_package_booking_confirmed
AFTER UPDATE ON public.package_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_package_booking_confirmed();

DROP TRIGGER IF EXISTS trigger_notify_booking_message_received ON public.booking_conversation_messages;
CREATE TRIGGER trigger_notify_booking_message_received
AFTER INSERT ON public.booking_conversation_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_message_received();

GRANT EXECUTE ON FUNCTION public.notification_actor_name(UUID, TEXT) TO authenticated;