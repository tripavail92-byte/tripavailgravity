BEGIN;

CREATE OR REPLACE FUNCTION public.operator_review_tour_cancellation_request(
  p_booking_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_refund_amount NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  status TEXT,
  payment_status TEXT,
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
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_refund_amount NUMERIC(12,2);
  v_paid_online NUMERIC(12,2);
  v_next_status TEXT;
  v_next_payment_status TEXT;
BEGIN
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_action NOT IN ('approve', 'decline', 'refund') THEN
    RAISE EXCEPTION 'Unsupported cancellation review action: %', p_action;
  END IF;

  SELECT
    booking.id,
    booking.status,
    booking.payment_status,
    booking.metadata,
    booking.traveler_id,
    COALESCE(booking.amount_paid_online, booking.upfront_amount, booking.total_price, 0) AS paid_online,
    tour.title
  INTO v_booking
  FROM public.tour_bookings AS booking
  INNER JOIN public.tours AS tour
    ON tour.id = booking.tour_id
  WHERE booking.id = p_booking_id
    AND tour.operator_id = v_operator_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can review traveler cancellation requests';
  END IF;

  IF NULLIF(BTRIM(COALESCE(v_booking.metadata->>'cancellation_request_state', '')), '') <> 'requested' THEN
    RAISE EXCEPTION 'This booking does not have a pending traveler cancellation request';
  END IF;

  v_paid_online := ROUND(GREATEST(COALESCE(v_booking.paid_online, 0), 0), 2);
  v_refund_amount := ROUND(GREATEST(COALESCE(p_refund_amount, 0), 0), 2);

  IF p_action = 'refund' THEN
    IF v_paid_online <= 0 THEN
      RAISE EXCEPTION 'This booking has no online payment available to refund';
    END IF;

    IF v_refund_amount <= 0 THEN
      RAISE EXCEPTION 'Refund amount must be greater than zero';
    END IF;

    IF v_refund_amount > v_paid_online THEN
      RAISE EXCEPTION 'Refund amount cannot exceed the amount paid online';
    END IF;
  END IF;

  v_next_status := CASE
    WHEN p_action = 'decline' THEN v_booking.status
    ELSE 'cancelled'
  END;

  v_next_payment_status := CASE
    WHEN p_action <> 'refund' THEN COALESCE(v_booking.payment_status, 'paid')
    WHEN v_refund_amount >= v_paid_online THEN 'refunded'
    ELSE 'partially_refunded'
  END;

  UPDATE public.tour_bookings
  SET
    status = v_next_status,
    payment_status = v_next_payment_status,
    metadata = (
      COALESCE(metadata, '{}'::JSONB)
      || jsonb_build_object(
        'cancellation_request_state', CASE
          WHEN p_action = 'approve' THEN 'approved'
          WHEN p_action = 'decline' THEN 'declined'
          ELSE 'refunded'
        END,
        'cancellation_request_reviewed_at', v_now,
        'cancellation_request_reviewed_by', v_operator_id,
        'cancellation_request_reviewed_role', 'operator',
        'cancellation_request_review_action', p_action,
        'cancellation_request_review_reason', v_reason,
        'operator_last_action', CASE
          WHEN p_action = 'approve' THEN 'approve_traveler_cancellation'
          WHEN p_action = 'decline' THEN 'decline_traveler_cancellation'
          ELSE 'refund_traveler_cancellation'
        END,
        'operator_last_action_at', v_now,
        'operator_last_action_by', v_operator_id,
        'operator_last_action_reason', v_reason
      )
      || CASE
        WHEN p_action = 'refund' THEN jsonb_build_object(
          'refund_amount', v_refund_amount,
          'refund_reason', COALESCE(v_reason, 'Traveler cancellation request approved with refund'),
          'refund_timestamp', v_now
        )
        ELSE '{}'::JSONB
      END
    )
  WHERE id = p_booking_id;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_booking.traveler_id,
    CASE
      WHEN p_action = 'approve' THEN 'tour_booking_cancellation_request_approved'
      WHEN p_action = 'decline' THEN 'tour_booking_cancellation_request_declined'
      ELSE 'tour_booking_cancellation_refund_recorded'
    END,
    CASE
      WHEN p_action = 'approve' THEN 'Your cancellation request was approved'
      WHEN p_action = 'decline' THEN 'Your cancellation request was declined'
      ELSE 'Your cancellation refund was recorded'
    END,
    CASE
      WHEN p_action = 'approve' THEN FORMAT(
        'The operator approved your cancellation request for %s.%s',
        v_booking.title,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
      WHEN p_action = 'decline' THEN FORMAT(
        'The operator declined your cancellation request for %s.%s',
        v_booking.title,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
      ELSE FORMAT(
        'A refund of PKR %s was recorded for your cancelled reservation %s.%s',
        TO_CHAR(v_refund_amount, 'FM9999999990.00'),
        v_booking.title,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
    END
  );

  RETURN QUERY SELECT p_booking_id, v_next_status, v_next_payment_status, p_action, 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_review_package_cancellation_request(
  p_booking_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_refund_amount NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  status TEXT,
  payment_status TEXT,
  action TEXT,
  notification_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID := auth.uid();
  v_booking RECORD;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_refund_amount NUMERIC(12,2);
  v_paid_online NUMERIC(12,2);
  v_next_status TEXT;
  v_next_payment_status TEXT;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_action NOT IN ('approve', 'decline', 'refund') THEN
    RAISE EXCEPTION 'Unsupported cancellation review action: %', p_action;
  END IF;

  SELECT
    booking.id,
    booking.status,
    booking.payment_status,
    booking.metadata,
    booking.traveler_id,
    COALESCE(booking.amount_paid_online, booking.upfront_amount, booking.total_price, 0) AS paid_online,
    package.name
  INTO v_booking
  FROM public.package_bookings AS booking
  INNER JOIN public.packages AS package
    ON package.id = booking.package_id
  WHERE booking.id = p_booking_id
    AND package.owner_id = v_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can review traveler cancellation requests';
  END IF;

  IF NULLIF(BTRIM(COALESCE(v_booking.metadata->>'cancellation_request_state', '')), '') <> 'requested' THEN
    RAISE EXCEPTION 'This booking does not have a pending traveler cancellation request';
  END IF;

  v_paid_online := ROUND(GREATEST(COALESCE(v_booking.paid_online, 0), 0), 2);
  v_refund_amount := ROUND(GREATEST(COALESCE(p_refund_amount, 0), 0), 2);

  IF p_action = 'refund' THEN
    IF v_paid_online <= 0 THEN
      RAISE EXCEPTION 'This booking has no online payment available to refund';
    END IF;

    IF v_refund_amount <= 0 THEN
      RAISE EXCEPTION 'Refund amount must be greater than zero';
    END IF;

    IF v_refund_amount > v_paid_online THEN
      RAISE EXCEPTION 'Refund amount cannot exceed the amount paid online';
    END IF;
  END IF;

  v_next_status := CASE
    WHEN p_action = 'decline' THEN v_booking.status
    ELSE 'cancelled'
  END;

  v_next_payment_status := CASE
    WHEN p_action <> 'refund' THEN COALESCE(v_booking.payment_status, 'paid')
    WHEN v_refund_amount >= v_paid_online THEN 'refunded'
    ELSE 'partially_refunded'
  END;

  UPDATE public.package_bookings
  SET
    status = v_next_status,
    payment_status = v_next_payment_status,
    metadata = (
      COALESCE(metadata, '{}'::JSONB)
      || jsonb_build_object(
        'cancellation_request_state', CASE
          WHEN p_action = 'approve' THEN 'approved'
          WHEN p_action = 'decline' THEN 'declined'
          ELSE 'refunded'
        END,
        'cancellation_request_reviewed_at', v_now,
        'cancellation_request_reviewed_by', v_owner_id,
        'cancellation_request_reviewed_role', 'owner',
        'cancellation_request_review_action', p_action,
        'cancellation_request_review_reason', v_reason,
        'owner_last_action', CASE
          WHEN p_action = 'approve' THEN 'approve_traveler_cancellation'
          WHEN p_action = 'decline' THEN 'decline_traveler_cancellation'
          ELSE 'refund_traveler_cancellation'
        END,
        'owner_last_action_at', v_now,
        'owner_last_action_by', v_owner_id,
        'owner_last_action_reason', v_reason
      )
      || CASE
        WHEN p_action = 'refund' THEN jsonb_build_object(
          'refund_amount', v_refund_amount,
          'refund_reason', COALESCE(v_reason, 'Traveler cancellation request approved with refund'),
          'refund_timestamp', v_now
        )
        ELSE '{}'::JSONB
      END
    )
  WHERE id = p_booking_id;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_booking.traveler_id,
    CASE
      WHEN p_action = 'approve' THEN 'package_booking_cancellation_request_approved'
      WHEN p_action = 'decline' THEN 'package_booking_cancellation_request_declined'
      ELSE 'package_booking_cancellation_refund_recorded'
    END,
    CASE
      WHEN p_action = 'approve' THEN 'Your cancellation request was approved'
      WHEN p_action = 'decline' THEN 'Your cancellation request was declined'
      ELSE 'Your cancellation refund was recorded'
    END,
    CASE
      WHEN p_action = 'approve' THEN FORMAT(
        'The host approved your cancellation request for %s.%s',
        v_booking.name,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
      WHEN p_action = 'decline' THEN FORMAT(
        'The host declined your cancellation request for %s.%s',
        v_booking.name,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
      ELSE FORMAT(
        'A refund of PKR %s was recorded for your cancelled reservation %s.%s',
        TO_CHAR(v_refund_amount, 'FM9999999990.00'),
        v_booking.name,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
    END
  );

  RETURN QUERY SELECT p_booking_id, v_next_status, v_next_payment_status, p_action, 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.operator_review_tour_cancellation_request(UUID, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_review_package_cancellation_request(UUID, TEXT, TEXT, NUMERIC) TO authenticated;

COMMIT;