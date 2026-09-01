-- Booking confirmation + operator "new booking" notifications.
--
-- The UI has always told travellers "check your email for confirmation", and the
-- send-notification-email edge function already ships booking_confirmed / booking_received
-- templates — but NOTHING ever inserted the notification rows, so no email was sent. (The edge fn
-- is a webhook on notifications INSERT, so a row is all it takes.)
--
-- Done as a trigger rather than client code on purpose: it fires on the status transition itself,
-- so it can't be lost if the browser closes mid-redirect, and it does not touch payment logic.

CREATE OR REPLACE FUNCTION public.notify_on_tour_booking_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tour_title text;
  v_operator   uuid;
  v_start      timestamptz;
  v_when       text;
BEGIN
  SELECT t.title, t.operator_id INTO v_tour_title, v_operator
  FROM public.tours t WHERE t.id = NEW.tour_id;

  SELECT s.start_time INTO v_start
  FROM public.tour_schedules s WHERE s.id = NEW.schedule_id;

  v_when := COALESCE(to_char(v_start, 'FMDay, FMDD FMMonth YYYY "at" HH12:MI AM'), 'your selected departure');

  -- Traveller: confirmation.
  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    NEW.traveler_id,
    'booking_confirmed',
    'Your booking is confirmed',
    format('Your booking for %s is confirmed for %s. Seats: %s.',
           COALESCE(v_tour_title, 'your trip'), v_when, COALESCE(NEW.pax_count, 1)),
    jsonb_build_object('booking_id', NEW.id, 'tour_id', NEW.tour_id, 'cta_url', '/trips/' || NEW.id)
  );

  -- Operator: a booking landed.
  IF v_operator IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      v_operator,
      'booking_received',
      'New booking received',
      format('%s seat(s) booked on %s for %s.',
             COALESCE(NEW.pax_count, 1), COALESCE(v_tour_title, 'your tour'), v_when),
      jsonb_build_object('booking_id', NEW.id, 'tour_id', NEW.tour_id, 'cta_url', '/operator/bookings')
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification problem roll back a confirmed booking.
  RAISE WARNING 'notify_on_tour_booking_confirmed failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_tour_booking_confirmed ON public.tour_bookings;
CREATE TRIGGER trg_notify_tour_booking_confirmed
  AFTER UPDATE ON public.tour_bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed')
  EXECUTE FUNCTION public.notify_on_tour_booking_confirmed();
