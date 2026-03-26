BEGIN;

CREATE OR REPLACE FUNCTION public.traveler_request_tour_booking_cancellation(
  p_booking_id UUID,
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
  v_traveler_id UUID := auth.uid();
  v_booking RECORD;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
BEGIN
  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    booking.id,
    booking.status,
    booking.metadata,
    tour.operator_id,
    tour.title
  INTO v_booking
  FROM public.tour_bookings AS booking
  INNER JOIN public.tours AS tour
    ON tour.id = booking.tour_id
  WHERE booking.id = p_booking_id
    AND booking.traveler_id = v_traveler_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can submit a traveler cancellation request';
  END IF;

  IF NULLIF(BTRIM(COALESCE(v_booking.metadata->>'cancellation_request_state', '')), '') = 'requested' THEN
    RAISE EXCEPTION 'A cancellation request is already in progress for this booking';
  END IF;

  UPDATE public.tour_bookings
  SET metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
    'cancellation_request_state', 'requested',
    'cancellation_requested_scope', 'traveler',
    'traveler_cancellation_requested_at', v_now,
    'traveler_cancellation_requested_by', v_traveler_id,
    'traveler_cancellation_reason', v_reason,
    'traveler_last_action', 'request_cancellation',
    'traveler_last_action_at', v_now,
    'traveler_last_action_by', v_traveler_id,
    'traveler_last_action_reason', v_reason
  )
  WHERE id = p_booking_id;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_booking.operator_id,
    'tour_booking_cancellation_requested_by_traveler',
    'Traveler requested a cancellation',
    FORMAT(
      'The traveler requested cancellation for %s.%s Review the booking workspace and reply in the booking thread before processing any refund.',
      v_booking.title,
      CASE
        WHEN v_reason IS NULL THEN ''
        ELSE ' Reason: ' || v_reason
      END
    )
  );

  RETURN QUERY SELECT p_booking_id, v_booking.status::TEXT, 'request_cancellation'::TEXT, 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.traveler_request_package_booking_cancellation(
  p_booking_id UUID,
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
  v_traveler_id UUID := auth.uid();
  v_booking RECORD;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
BEGIN
  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    booking.id,
    booking.status,
    booking.metadata,
    package.owner_id,
    package.name
  INTO v_booking
  FROM public.package_bookings AS booking
  INNER JOIN public.packages AS package
    ON package.id = booking.package_id
  WHERE booking.id = p_booking_id
    AND booking.traveler_id = v_traveler_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can submit a traveler cancellation request';
  END IF;

  IF NULLIF(BTRIM(COALESCE(v_booking.metadata->>'cancellation_request_state', '')), '') = 'requested' THEN
    RAISE EXCEPTION 'A cancellation request is already in progress for this booking';
  END IF;

  UPDATE public.package_bookings
  SET metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
    'cancellation_request_state', 'requested',
    'cancellation_requested_scope', 'traveler',
    'traveler_cancellation_requested_at', v_now,
    'traveler_cancellation_requested_by', v_traveler_id,
    'traveler_cancellation_reason', v_reason,
    'traveler_last_action', 'request_cancellation',
    'traveler_last_action_at', v_now,
    'traveler_last_action_by', v_traveler_id,
    'traveler_last_action_reason', v_reason
  )
  WHERE id = p_booking_id;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_booking.owner_id,
    'package_booking_cancellation_requested_by_traveler',
    'Traveler requested a cancellation',
    FORMAT(
      'The traveler requested cancellation for %s.%s Review the booking workspace and reply in the booking thread before processing any refund.',
      v_booking.name,
      CASE
        WHEN v_reason IS NULL THEN ''
        ELSE ' Reason: ' || v_reason
      END
    )
  );

  RETURN QUERY SELECT p_booking_id, v_booking.status::TEXT, 'request_cancellation'::TEXT, 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.traveler_request_tour_booking_cancellation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.traveler_request_package_booking_cancellation(UUID, TEXT) TO authenticated;

COMMIT;