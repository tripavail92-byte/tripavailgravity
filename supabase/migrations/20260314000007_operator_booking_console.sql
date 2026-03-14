-- Operator booking console hardening
-- Adds secure booking read/mutation RPCs and fixes schedule occupancy recalculation.

CREATE OR REPLACE FUNCTION public.update_schedule_booked_count()
RETURNS TRIGGER AS $$
DECLARE
  v_schedule_ids UUID[];
BEGIN
  v_schedule_ids := ARRAY[]::UUID[];

  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.schedule_id IS NOT NULL THEN
    v_schedule_ids := array_append(v_schedule_ids, OLD.schedule_id);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.schedule_id IS NOT NULL THEN
    v_schedule_ids := array_append(v_schedule_ids, NEW.schedule_id);
  END IF;

  UPDATE public.tour_schedules AS schedule
  SET booked_count = COALESCE((
    SELECT SUM(booking.pax_count)::INT
    FROM public.tour_bookings AS booking
    WHERE booking.schedule_id = schedule.id
      AND booking.status = 'confirmed'
  ), 0)
  WHERE schedule.id = ANY(v_schedule_ids);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_schedule_booked_count ON public.tour_bookings;
CREATE TRIGGER trigger_update_schedule_booked_count
AFTER INSERT OR UPDATE OR DELETE ON public.tour_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_schedule_booked_count();

CREATE OR REPLACE FUNCTION public.operator_get_tour_bookings()
RETURNS TABLE (
  id UUID,
  tour_id UUID,
  schedule_id UUID,
  traveler_id UUID,
  status TEXT,
  total_price NUMERIC,
  pax_count INT,
  booking_date TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  payment_status TEXT,
  payment_method TEXT,
  metadata JSONB,
  paid_at TIMESTAMPTZ,
  tours JSONB,
  tour_schedules JSONB,
  traveler JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID := auth.uid();
BEGIN
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT
    booking.id,
    booking.tour_id,
    booking.schedule_id,
    booking.traveler_id,
    booking.status,
    booking.total_price,
    booking.pax_count,
    booking.booking_date,
    booking.expires_at,
    booking.payment_status,
    booking.payment_method,
    booking.metadata,
    booking.paid_at,
    jsonb_build_object(
      'id', tour.id,
      'title', tour.title,
      'location', tour.location,
      'images', tour.images
    ) AS tours,
    jsonb_build_object(
      'id', schedule.id,
      'start_time', schedule.start_time,
      'end_time', schedule.end_time,
      'capacity', schedule.capacity,
      'booked_count', schedule.booked_count,
      'status', schedule.status
    ) AS tour_schedules,
    jsonb_build_object(
      'id', booking.traveler_id,
      'full_name', COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', profile.first_name, profile.last_name)), ''),
        traveler_user.full_name,
        SPLIT_PART(traveler_user.email, '@', 1),
        'Traveler'
      ),
      'first_name', profile.first_name,
      'last_name', profile.last_name,
      'avatar_url', COALESCE(profile.avatar_url, traveler_user.avatar_url),
      'email', CASE
        WHEN COALESCE(account.allow_messages_from_anyone, TRUE)
          AND COALESCE(profile.email_verified, FALSE)
        THEN profile.email
        ELSE NULL
      END,
      'phone', CASE
        WHEN COALESCE(account.allow_messages_from_anyone, TRUE)
          AND COALESCE(profile.phone_verified, FALSE)
        THEN profile.phone
        ELSE NULL
      END,
      'email_verified', COALESCE(profile.email_verified, FALSE),
      'phone_verified', COALESCE(profile.phone_verified, FALSE),
      'allow_messages_from_anyone', COALESCE(account.allow_messages_from_anyone, TRUE),
      'contact_mode', CASE
        WHEN COALESCE(account.allow_messages_from_anyone, TRUE)
          AND (
            COALESCE(profile.email_verified, FALSE)
            OR COALESCE(profile.phone_verified, FALSE)
          )
        THEN 'direct'
        ELSE 'messaging_only'
      END
    ) AS traveler
  FROM public.tour_bookings AS booking
  INNER JOIN public.tours AS tour
    ON tour.id = booking.tour_id
  INNER JOIN public.tour_schedules AS schedule
    ON schedule.id = booking.schedule_id
  LEFT JOIN public.users AS traveler_user
    ON traveler_user.id = booking.traveler_id
  LEFT JOIN public.profiles AS profile
    ON profile.id = booking.traveler_id
  LEFT JOIN public.account_settings AS account
    ON account.user_id = booking.traveler_id
  WHERE tour.operator_id = v_operator_id
  ORDER BY booking.booking_date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.operator_manage_tour_booking(
  p_booking_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  status TEXT,
  action TEXT,
  notification_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID := auth.uid();
  v_booking RECORD;
  v_status TEXT;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
BEGIN
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_action NOT IN ('cancel', 'complete', 'resend_confirmation') THEN
    RAISE EXCEPTION 'Unsupported booking action: %', p_action;
  END IF;

  SELECT
    booking.id,
    booking.status,
    booking.traveler_id,
    schedule.start_time,
    tour.title
  INTO v_booking
  FROM public.tour_bookings AS booking
  INNER JOIN public.tours AS tour
    ON tour.id = booking.tour_id
  INNER JOIN public.tour_schedules AS schedule
    ON schedule.id = booking.schedule_id
  WHERE booking.id = p_booking_id
    AND tour.operator_id = v_operator_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF p_action = 'cancel' THEN
    IF v_booking.status NOT IN ('pending', 'confirmed') THEN
      RAISE EXCEPTION 'Only pending or confirmed bookings can be cancelled';
    END IF;

    UPDATE public.tour_bookings
    SET
      status = 'cancelled',
      metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
        'operator_last_action', 'cancel',
        'operator_last_action_at', TIMEZONE('UTC', NOW()),
        'operator_last_action_by', v_operator_id,
        'operator_last_action_reason', v_reason
      )
    WHERE id = p_booking_id
    RETURNING tour_bookings.status INTO v_status;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_booking.traveler_id,
      'tour_booking_cancelled_by_operator',
      'Your booking has been cancelled',
      FORMAT(
        'Your reservation for %s was cancelled by the operator.%s',
        v_booking.title,
        CASE
          WHEN v_reason IS NULL THEN ''
          ELSE ' Reason: ' || v_reason
        END
      )
    );
  ELSIF p_action = 'complete' THEN
    IF v_booking.status <> 'confirmed' THEN
      RAISE EXCEPTION 'Only confirmed bookings can be marked completed';
    END IF;

    IF v_booking.start_time > NOW() THEN
      RAISE EXCEPTION 'A booking can only be completed after the departure has started';
    END IF;

    UPDATE public.tour_bookings
    SET
      status = 'completed',
      metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
        'operator_last_action', 'complete',
        'operator_last_action_at', TIMEZONE('UTC', NOW()),
        'operator_last_action_by', v_operator_id,
        'operator_last_action_reason', v_reason
      )
    WHERE id = p_booking_id
    RETURNING tour_bookings.status INTO v_status;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_booking.traveler_id,
      'tour_booking_completed',
      'Your tour has been marked complete',
      FORMAT(
        'The operator marked your %s reservation as completed. We hope the trip went well.',
        v_booking.title
      )
    );
  ELSE
    IF v_booking.status NOT IN ('confirmed', 'completed') THEN
      RAISE EXCEPTION 'Only confirmed or completed bookings can receive a confirmation resend';
    END IF;

    UPDATE public.tour_bookings
    SET metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
      'operator_last_action', 'resend_confirmation',
      'operator_last_action_at', TIMEZONE('UTC', NOW()),
      'operator_last_action_by', v_operator_id,
      'operator_last_action_reason', v_reason,
      'last_confirmation_resent_at', TIMEZONE('UTC', NOW())
    )
    WHERE id = p_booking_id
    RETURNING tour_bookings.status INTO v_status;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_booking.traveler_id,
      'tour_booking_confirmation_resent',
      'Your booking confirmation was resent',
      FORMAT(
        'The operator resent your confirmation for %s. Review your booking details in TripAvail.',
        v_booking.title
      )
    );
  END IF;

  RETURN QUERY SELECT p_booking_id, v_status, p_action, 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.operator_get_tour_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.operator_manage_tour_booking(UUID, TEXT, TEXT) TO authenticated;