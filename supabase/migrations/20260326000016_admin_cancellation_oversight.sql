BEGIN;

CREATE OR REPLACE FUNCTION public.admin_list_booking_cancellation_requests(
  p_state TEXT DEFAULT NULL,
  p_limit INT DEFAULT 200
)
RETURNS TABLE (
  booking_scope public.messaging_booking_scope_enum,
  booking_id UUID,
  conversation_id UUID,
  booking_label TEXT,
  subject TEXT,
  traveler_name TEXT,
  partner_name TEXT,
  booking_status TEXT,
  payment_status TEXT,
  total_amount NUMERIC,
  paid_online NUMERIC,
  refund_amount NUMERIC,
  cancellation_request_state TEXT,
  traveler_cancellation_reason TEXT,
  cancellation_requested_at TIMESTAMPTZ,
  cancellation_reviewed_at TIMESTAMPTZ,
  cancellation_reviewed_by UUID,
  cancellation_reviewed_role TEXT,
  cancellation_review_reason TEXT,
  support_escalated_at TIMESTAMPTZ,
  support_review_status public.messaging_support_review_status_enum,
  support_review_reason TEXT,
  support_review_notes TEXT,
  support_reviewed_at TIMESTAMPTZ,
  last_message_preview TEXT,
  requires_support_intervention BOOLEAN,
  support_attention_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state TEXT := NULLIF(LOWER(BTRIM(p_state)), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF v_state IS NOT NULL AND v_state NOT IN ('requested', 'declined', 'approved', 'refunded') THEN
    RAISE EXCEPTION 'Unsupported cancellation state filter: %', p_state;
  END IF;

  RETURN QUERY
  WITH cancellation_rows AS (
    SELECT
      'tour_booking'::public.messaging_booking_scope_enum AS booking_scope,
      booking.id AS booking_id,
      conversation.id AS conversation_id,
      COALESCE(tour.title, 'Tour booking') AS booking_label,
      conversation.subject,
      COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', traveler_profile.first_name, traveler_profile.last_name)), ''),
        traveler_user.full_name,
        SPLIT_PART(traveler_user.email, '@', 1),
        'Traveler'
      ) AS traveler_name,
      COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', partner_profile.first_name, partner_profile.last_name)), ''),
        partner_user.full_name,
        SPLIT_PART(partner_user.email, '@', 1),
        'Partner'
      ) AS partner_name,
      booking.status AS booking_status,
      booking.payment_status,
      ROUND(COALESCE(booking.total_price, 0), 2) AS total_amount,
      ROUND(COALESCE(booking.amount_paid_online, booking.upfront_amount, booking.total_price, 0), 2) AS paid_online,
      CASE
        WHEN COALESCE(booking.metadata->>'refund_amount', '') ~ '^[0-9]+(\.[0-9]+)?$'
          THEN ROUND((booking.metadata->>'refund_amount')::NUMERIC, 2)
        ELSE 0
      END AS refund_amount,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') AS cancellation_request_state,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_reason', '')), '') AS traveler_cancellation_reason,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_requested_at', '')), '')::TIMESTAMPTZ AS cancellation_requested_at,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_reviewed_at', '')), '')::TIMESTAMPTZ AS cancellation_reviewed_at,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_reviewed_by', '')), '')::UUID AS cancellation_reviewed_by,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_reviewed_role', '')), '') AS cancellation_reviewed_role,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_review_reason', '')), '') AS cancellation_review_reason,
      conversation.support_escalated_at,
      CASE
        WHEN conversation.support_escalated_at IS NOT NULL
          THEN COALESCE(conversation.support_review_status, 'pending'::public.messaging_support_review_status_enum)
        ELSE NULL
      END AS support_review_status,
      conversation.support_review_reason,
      conversation.support_review_notes,
      conversation.support_reviewed_at,
      conversation.last_message_preview,
      CASE
        WHEN conversation.support_escalated_at IS NOT NULL THEN TRUE
        WHEN NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') = 'requested'
          AND NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_requested_at', '')), '')::TIMESTAMPTZ <= (v_now - INTERVAL '24 hours')
          THEN TRUE
        ELSE FALSE
      END AS requires_support_intervention,
      CASE
        WHEN conversation.support_escalated_at IS NOT NULL
          AND NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') = 'requested'
          AND NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_requested_at', '')), '')::TIMESTAMPTZ <= (v_now - INTERVAL '24 hours')
          THEN 'stale_request_and_dispute'
        WHEN conversation.support_escalated_at IS NOT NULL THEN 'traveler_dispute'
        WHEN NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') = 'requested'
          AND NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_requested_at', '')), '')::TIMESTAMPTZ <= (v_now - INTERVAL '24 hours')
          THEN 'stale_request'
        ELSE NULL
      END AS support_attention_reason
    FROM public.tour_bookings AS booking
    INNER JOIN public.tours AS tour
      ON tour.id = booking.tour_id
    LEFT JOIN public.booking_conversations AS conversation
      ON conversation.booking_scope = 'tour_booking'::public.messaging_booking_scope_enum
     AND conversation.booking_id = booking.id
    LEFT JOIN public.users AS traveler_user
      ON traveler_user.id = booking.traveler_id
    LEFT JOIN public.profiles AS traveler_profile
      ON traveler_profile.id = booking.traveler_id
    LEFT JOIN public.users AS partner_user
      ON partner_user.id = tour.operator_id
    LEFT JOIN public.profiles AS partner_profile
      ON partner_profile.id = tour.operator_id
    WHERE NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') IN ('requested', 'declined', 'approved', 'refunded')

    UNION ALL

    SELECT
      'package_booking'::public.messaging_booking_scope_enum AS booking_scope,
      booking.id AS booking_id,
      conversation.id AS conversation_id,
      COALESCE(package.name, 'Package booking') AS booking_label,
      conversation.subject,
      COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', traveler_profile.first_name, traveler_profile.last_name)), ''),
        traveler_user.full_name,
        SPLIT_PART(traveler_user.email, '@', 1),
        'Traveler'
      ) AS traveler_name,
      COALESCE(
        NULLIF(TRIM(CONCAT_WS(' ', partner_profile.first_name, partner_profile.last_name)), ''),
        partner_user.full_name,
        SPLIT_PART(partner_user.email, '@', 1),
        'Partner'
      ) AS partner_name,
      booking.status AS booking_status,
      booking.payment_status,
      ROUND(COALESCE(booking.total_price, 0), 2) AS total_amount,
      ROUND(COALESCE(booking.amount_paid_online, booking.upfront_amount, booking.total_price, 0), 2) AS paid_online,
      CASE
        WHEN COALESCE(booking.metadata->>'refund_amount', '') ~ '^[0-9]+(\.[0-9]+)?$'
          THEN ROUND((booking.metadata->>'refund_amount')::NUMERIC, 2)
        ELSE 0
      END AS refund_amount,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') AS cancellation_request_state,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_reason', '')), '') AS traveler_cancellation_reason,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_requested_at', '')), '')::TIMESTAMPTZ AS cancellation_requested_at,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_reviewed_at', '')), '')::TIMESTAMPTZ AS cancellation_reviewed_at,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_reviewed_by', '')), '')::UUID AS cancellation_reviewed_by,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_reviewed_role', '')), '') AS cancellation_reviewed_role,
      NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_review_reason', '')), '') AS cancellation_review_reason,
      conversation.support_escalated_at,
      CASE
        WHEN conversation.support_escalated_at IS NOT NULL
          THEN COALESCE(conversation.support_review_status, 'pending'::public.messaging_support_review_status_enum)
        ELSE NULL
      END AS support_review_status,
      conversation.support_review_reason,
      conversation.support_review_notes,
      conversation.support_reviewed_at,
      conversation.last_message_preview,
      CASE
        WHEN conversation.support_escalated_at IS NOT NULL THEN TRUE
        WHEN NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') = 'requested'
          AND NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_requested_at', '')), '')::TIMESTAMPTZ <= (v_now - INTERVAL '24 hours')
          THEN TRUE
        ELSE FALSE
      END AS requires_support_intervention,
      CASE
        WHEN conversation.support_escalated_at IS NOT NULL
          AND NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') = 'requested'
          AND NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_requested_at', '')), '')::TIMESTAMPTZ <= (v_now - INTERVAL '24 hours')
          THEN 'stale_request_and_dispute'
        WHEN conversation.support_escalated_at IS NOT NULL THEN 'traveler_dispute'
        WHEN NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') = 'requested'
          AND NULLIF(BTRIM(COALESCE(booking.metadata->>'traveler_cancellation_requested_at', '')), '')::TIMESTAMPTZ <= (v_now - INTERVAL '24 hours')
          THEN 'stale_request'
        ELSE NULL
      END AS support_attention_reason
    FROM public.package_bookings AS booking
    INNER JOIN public.packages AS package
      ON package.id = booking.package_id
    LEFT JOIN public.booking_conversations AS conversation
      ON conversation.booking_scope = 'package_booking'::public.messaging_booking_scope_enum
     AND conversation.booking_id = booking.id
    LEFT JOIN public.users AS traveler_user
      ON traveler_user.id = booking.traveler_id
    LEFT JOIN public.profiles AS traveler_profile
      ON traveler_profile.id = booking.traveler_id
    LEFT JOIN public.users AS partner_user
      ON partner_user.id = package.owner_id
    LEFT JOIN public.profiles AS partner_profile
      ON partner_profile.id = package.owner_id
    WHERE NULLIF(BTRIM(COALESCE(booking.metadata->>'cancellation_request_state', '')), '') IN ('requested', 'declined', 'approved', 'refunded')
  )
  SELECT
    row.booking_scope,
    row.booking_id,
    row.conversation_id,
    row.booking_label,
    row.subject,
    row.traveler_name,
    row.partner_name,
    row.booking_status,
    row.payment_status,
    row.total_amount,
    row.paid_online,
    row.refund_amount,
    row.cancellation_request_state,
    row.traveler_cancellation_reason,
    row.cancellation_requested_at,
    row.cancellation_reviewed_at,
    row.cancellation_reviewed_by,
    row.cancellation_reviewed_role,
    row.cancellation_review_reason,
    row.support_escalated_at,
    row.support_review_status,
    row.support_review_reason,
    row.support_review_notes,
    row.support_reviewed_at,
    row.last_message_preview,
    row.requires_support_intervention,
    row.support_attention_reason
  FROM cancellation_rows AS row
  WHERE v_state IS NULL OR row.cancellation_request_state = v_state
  ORDER BY COALESCE(row.support_escalated_at, row.cancellation_requested_at, row.cancellation_reviewed_at) DESC, row.booking_id DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_tour_cancellation_request(
  p_booking_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_refund_amount NUMERIC DEFAULT NULL,
  p_internal_note TEXT DEFAULT NULL
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
  v_admin_id UUID := auth.uid();
  v_prev JSONB;
  v_new JSONB;
  v_booking RECORD;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_note TEXT := NULLIF(BTRIM(p_internal_note), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_state TEXT;
  v_refund_amount NUMERIC(12,2);
  v_paid_online NUMERIC(12,2);
  v_next_status TEXT;
  v_next_payment_status TEXT;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_action NOT IN ('approve', 'decline', 'refund') THEN
    RAISE EXCEPTION 'Unsupported cancellation review action: %', p_action;
  END IF;

  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(booking.*)
  INTO v_prev
  FROM public.tour_bookings AS booking
  WHERE booking.id = p_booking_id;

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
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_state := NULLIF(BTRIM(COALESCE(v_booking.metadata->>'cancellation_request_state', '')), '');

  IF v_state IS NULL THEN
    RAISE EXCEPTION 'This booking does not have a traveler cancellation request';
  END IF;

  IF v_state = 'refunded' THEN
    RAISE EXCEPTION 'This cancellation request has already been refunded';
  END IF;

  IF v_state = 'approved' AND p_action = 'decline' THEN
    RAISE EXCEPTION 'Approved cancellation requests can only be refunded';
  END IF;

  IF v_state = 'declined' AND p_action = 'decline' THEN
    RAISE EXCEPTION 'This cancellation request has already been declined';
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

  IF p_action = 'decline' AND v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can be declined';
  END IF;

  v_next_status := CASE
    WHEN p_action = 'decline' THEN 'confirmed'
    ELSE 'cancelled'
  END;

  v_next_payment_status := CASE
    WHEN p_action <> 'refund' THEN COALESCE(v_booking.payment_status, 'paid')
    WHEN v_refund_amount >= v_paid_online THEN 'refunded'
    ELSE 'partially_refunded'
  END;

  UPDATE public.tour_bookings AS booking
  SET
    status = v_next_status,
    payment_status = v_next_payment_status,
    metadata = (
      COALESCE(booking.metadata, '{}'::JSONB)
      || jsonb_build_object(
        'cancellation_request_state', CASE
          WHEN p_action = 'approve' THEN 'approved'
          WHEN p_action = 'decline' THEN 'declined'
          ELSE 'refunded'
        END,
        'cancellation_request_reviewed_at', v_now,
        'cancellation_request_reviewed_by', v_admin_id,
        'cancellation_request_reviewed_role', 'support',
        'cancellation_request_review_action', p_action,
        'cancellation_request_review_reason', v_reason,
        'support_last_action', CASE
          WHEN p_action = 'approve' THEN 'approve_traveler_cancellation'
          WHEN p_action = 'decline' THEN 'decline_traveler_cancellation'
          ELSE 'refund_traveler_cancellation'
        END,
        'support_last_action_at', v_now,
        'support_last_action_by', v_admin_id,
        'support_last_action_reason', v_reason
      )
      || CASE
        WHEN p_action = 'refund' THEN jsonb_build_object(
          'refund_amount', v_refund_amount,
          'refund_reason', COALESCE(v_reason, 'TripAvail support recorded a refund'),
          'refund_timestamp', v_now
        )
        ELSE '{}'::JSONB
      END
    )
  WHERE booking.id = p_booking_id;

  UPDATE public.booking_conversations AS conversation
  SET
    support_review_status = 'resolved'::public.messaging_support_review_status_enum,
    support_review_reason = v_reason,
    support_review_notes = COALESCE(v_note, conversation.support_review_notes),
    support_reviewed_by = v_admin_id,
    support_reviewed_at = v_now,
    updated_at = v_now
  WHERE conversation.booking_scope = 'tour_booking'::public.messaging_booking_scope_enum
    AND conversation.booking_id = p_booking_id
    AND conversation.support_escalated_at IS NOT NULL;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_booking.traveler_id,
    CASE
      WHEN p_action = 'approve' THEN 'tour_booking_cancellation_request_approved'
      WHEN p_action = 'decline' THEN 'tour_booking_cancellation_request_declined'
      ELSE 'tour_booking_cancellation_refund_recorded'
    END,
    CASE
      WHEN p_action = 'approve' THEN 'TripAvail support approved your cancellation request'
      WHEN p_action = 'decline' THEN 'TripAvail support declined your cancellation request'
      ELSE 'TripAvail support recorded your cancellation refund'
    END,
    CASE
      WHEN p_action = 'approve' THEN FORMAT(
        'TripAvail support approved your cancellation request for %s.%s',
        v_booking.title,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
      WHEN p_action = 'decline' THEN FORMAT(
        'TripAvail support declined your cancellation request for %s.%s',
        v_booking.title,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
      ELSE FORMAT(
        'TripAvail support recorded a refund of PKR %s for %s.%s',
        TO_CHAR(v_refund_amount, 'FM9999999990.00'),
        v_booking.title,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
    END
  );

  SELECT to_jsonb(booking.*)
  INTO v_new
  FROM public.tour_bookings AS booking
  WHERE booking.id = p_booking_id;

  PERFORM public.admin_log_action(
    'booking',
    p_booking_id,
    CASE
      WHEN p_action = 'approve' THEN 'support_approve_traveler_cancellation'
      WHEN p_action = 'decline' THEN 'support_decline_traveler_cancellation'
      ELSE 'support_refund_traveler_cancellation'
    END,
    v_reason,
    v_prev,
    v_new
  );

  RETURN QUERY SELECT p_booking_id, v_next_status, v_next_payment_status, p_action, 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_package_cancellation_request(
  p_booking_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_refund_amount NUMERIC DEFAULT NULL,
  p_internal_note TEXT DEFAULT NULL
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
  v_admin_id UUID := auth.uid();
  v_prev JSONB;
  v_new JSONB;
  v_booking RECORD;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_note TEXT := NULLIF(BTRIM(p_internal_note), '');
  v_now TIMESTAMPTZ := TIMEZONE('UTC', NOW());
  v_state TEXT;
  v_refund_amount NUMERIC(12,2);
  v_paid_online NUMERIC(12,2);
  v_next_status TEXT;
  v_next_payment_status TEXT;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_action NOT IN ('approve', 'decline', 'refund') THEN
    RAISE EXCEPTION 'Unsupported cancellation review action: %', p_action;
  END IF;

  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(booking.*)
  INTO v_prev
  FROM public.package_bookings AS booking
  WHERE booking.id = p_booking_id;

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
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_state := NULLIF(BTRIM(COALESCE(v_booking.metadata->>'cancellation_request_state', '')), '');

  IF v_state IS NULL THEN
    RAISE EXCEPTION 'This booking does not have a traveler cancellation request';
  END IF;

  IF v_state = 'refunded' THEN
    RAISE EXCEPTION 'This cancellation request has already been refunded';
  END IF;

  IF v_state = 'approved' AND p_action = 'decline' THEN
    RAISE EXCEPTION 'Approved cancellation requests can only be refunded';
  END IF;

  IF v_state = 'declined' AND p_action = 'decline' THEN
    RAISE EXCEPTION 'This cancellation request has already been declined';
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

  IF p_action = 'decline' AND v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can be declined';
  END IF;

  v_next_status := CASE
    WHEN p_action = 'decline' THEN 'confirmed'
    ELSE 'cancelled'
  END;

  v_next_payment_status := CASE
    WHEN p_action <> 'refund' THEN COALESCE(v_booking.payment_status, 'paid')
    WHEN v_refund_amount >= v_paid_online THEN 'refunded'
    ELSE 'partially_refunded'
  END;

  UPDATE public.package_bookings AS booking
  SET
    status = v_next_status,
    payment_status = v_next_payment_status,
    metadata = (
      COALESCE(booking.metadata, '{}'::JSONB)
      || jsonb_build_object(
        'cancellation_request_state', CASE
          WHEN p_action = 'approve' THEN 'approved'
          WHEN p_action = 'decline' THEN 'declined'
          ELSE 'refunded'
        END,
        'cancellation_request_reviewed_at', v_now,
        'cancellation_request_reviewed_by', v_admin_id,
        'cancellation_request_reviewed_role', 'support',
        'cancellation_request_review_action', p_action,
        'cancellation_request_review_reason', v_reason,
        'support_last_action', CASE
          WHEN p_action = 'approve' THEN 'approve_traveler_cancellation'
          WHEN p_action = 'decline' THEN 'decline_traveler_cancellation'
          ELSE 'refund_traveler_cancellation'
        END,
        'support_last_action_at', v_now,
        'support_last_action_by', v_admin_id,
        'support_last_action_reason', v_reason
      )
      || CASE
        WHEN p_action = 'refund' THEN jsonb_build_object(
          'refund_amount', v_refund_amount,
          'refund_reason', COALESCE(v_reason, 'TripAvail support recorded a refund'),
          'refund_timestamp', v_now
        )
        ELSE '{}'::JSONB
      END
    )
  WHERE booking.id = p_booking_id;

  UPDATE public.booking_conversations AS conversation
  SET
    support_review_status = 'resolved'::public.messaging_support_review_status_enum,
    support_review_reason = v_reason,
    support_review_notes = COALESCE(v_note, conversation.support_review_notes),
    support_reviewed_by = v_admin_id,
    support_reviewed_at = v_now,
    updated_at = v_now
  WHERE conversation.booking_scope = 'package_booking'::public.messaging_booking_scope_enum
    AND conversation.booking_id = p_booking_id
    AND conversation.support_escalated_at IS NOT NULL;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_booking.traveler_id,
    CASE
      WHEN p_action = 'approve' THEN 'package_booking_cancellation_request_approved'
      WHEN p_action = 'decline' THEN 'package_booking_cancellation_request_declined'
      ELSE 'package_booking_cancellation_refund_recorded'
    END,
    CASE
      WHEN p_action = 'approve' THEN 'TripAvail support approved your cancellation request'
      WHEN p_action = 'decline' THEN 'TripAvail support declined your cancellation request'
      ELSE 'TripAvail support recorded your cancellation refund'
    END,
    CASE
      WHEN p_action = 'approve' THEN FORMAT(
        'TripAvail support approved your cancellation request for %s.%s',
        v_booking.name,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
      WHEN p_action = 'decline' THEN FORMAT(
        'TripAvail support declined your cancellation request for %s.%s',
        v_booking.name,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
      ELSE FORMAT(
        'TripAvail support recorded a refund of PKR %s for %s.%s',
        TO_CHAR(v_refund_amount, 'FM9999999990.00'),
        v_booking.name,
        CASE WHEN v_reason IS NULL THEN '' ELSE ' Note: ' || v_reason END
      )
    END
  );

  SELECT to_jsonb(booking.*)
  INTO v_new
  FROM public.package_bookings AS booking
  WHERE booking.id = p_booking_id;

  PERFORM public.admin_log_action(
    'booking',
    p_booking_id,
    CASE
      WHEN p_action = 'approve' THEN 'support_approve_traveler_cancellation'
      WHEN p_action = 'decline' THEN 'support_decline_traveler_cancellation'
      ELSE 'support_refund_traveler_cancellation'
    END,
    v_reason,
    v_prev,
    v_new
  );

  RETURN QUERY SELECT p_booking_id, v_next_status, v_next_payment_status, p_action, 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_booking_cancellation_requests(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_tour_cancellation_request(UUID, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_package_cancellation_request(UUID, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;

COMMIT;