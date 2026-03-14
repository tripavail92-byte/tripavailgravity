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
  v_currency TEXT;
  v_traveler_body TEXT;
  v_operator_body TEXT;
BEGIN
  IF NEW.status <> 'confirmed' OR COALESCE(OLD.status, '') = 'confirmed' THEN
    RETURN NEW;
  END IF;

  SELECT
    tour.title,
    tour.operator_id,
    COALESCE(NULLIF(TRIM(tour.currency), ''), 'PKR'),
    public.notification_actor_name(NEW.traveler_id, 'Traveler'),
    CASE
      WHEN schedule.start_time IS NULL THEN NULL
      ELSE TO_CHAR(schedule.start_time AT TIME ZONE 'UTC', 'Mon DD, YYYY')
    END
  INTO v_tour_title, v_operator_id, v_currency, v_traveler_name, v_schedule_label
  FROM public.tours AS tour
  LEFT JOIN public.tour_schedules AS schedule
    ON schedule.id = NEW.schedule_id
  WHERE tour.id = NEW.tour_id;

  v_traveler_body := COALESCE(v_tour_title, 'Your booking')
    || CASE WHEN v_schedule_label IS NULL THEN ' is confirmed. ' ELSE ' for ' || v_schedule_label || ' is confirmed. ' END
    || CASE
      WHEN COALESCE(NEW.remaining_amount, 0) > 0 THEN
        'Pay ' || v_currency || ' ' || TRIM(TO_CHAR(COALESCE(NEW.upfront_amount, 0), 'FM9999999990.00'))
        || ' now to confirm your booking. Remaining ' || v_currency || ' '
        || TRIM(TO_CHAR(COALESCE(NEW.remaining_amount, 0), 'FM9999999990.00'))
        || ' will be paid directly to the tour operator before departure.'
      ELSE
        'The full booking amount was paid online.'
    END;

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    NEW.traveler_id,
    'booking_confirmed',
    'Booking confirmed',
    v_traveler_body
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
    v_operator_body := v_traveler_name || ' booked ' || COALESCE(v_tour_title, 'your tour')
      || CASE WHEN v_schedule_label IS NULL THEN '. ' ELSE ' for ' || v_schedule_label || '. ' END
      || CASE
        WHEN COALESCE(NEW.remaining_amount, 0) > 0 THEN
          'Collected online now: ' || v_currency || ' ' || TRIM(TO_CHAR(COALESCE(NEW.upfront_amount, 0), 'FM9999999990.00'))
          || '. Remaining to collect before departure: ' || v_currency || ' '
          || TRIM(TO_CHAR(COALESCE(NEW.remaining_amount, 0), 'FM9999999990.00')) || '.'
        ELSE
          'The booking was fully paid online.'
      END;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_operator_id,
      'booking_received',
      'New confirmed booking',
      v_operator_body
    );
  END IF;

  RETURN NEW;
END;
$$;