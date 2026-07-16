-- =====================================================================
-- Fix: operator Bookings showed "PKR 17.99" on a USD 17.99 booking.
--
-- ROOT CAUSE: tour_bookings has no currency column and this RPC never emitted
-- tours.currency, so OperatorBookingsPage had nothing to format with and passed
-- the literal 'PKR' to formatMoney (see the `/* TODO: use booking currency once
-- plumbed */` comments left by 93fce761). formatMoney does NO conversion — it is a
-- plain Intl.NumberFormat wrapper — so the amount was always correct and only the
-- unit label was wrong. This adds the missing field so the client can stop lying.
--
-- Signature is unchanged (tours is still JSONB, it just gains one key), so
-- CREATE OR REPLACE is safe and preserves the existing GRANT.
-- =====================================================================

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
  payment_collection_mode TEXT,
  payment_method TEXT,
  upfront_amount NUMERIC,
  remaining_amount NUMERIC,
  amount_paid_online NUMERIC,
  amount_due_to_operator NUMERIC,
  payment_policy_text TEXT,
  promo_owner TEXT,
  promo_funding_source TEXT,
  promo_discount_value NUMERIC,
  price_before_promo NUMERIC,
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
    booking.payment_collection_mode,
    booking.payment_method,
    booking.upfront_amount,
    booking.remaining_amount,
    booking.amount_paid_online,
    booking.amount_due_to_operator,
    booking.payment_policy_text,
    booking.promo_owner,
    booking.promo_funding_source,
    booking.promo_discount_value,
    booking.price_before_promo,
    booking.metadata,
    booking.paid_at,
    jsonb_build_object(
      'id', tour.id,
      'title', tour.title,
      'location', tour.location,
      'images', tour.images,
      -- NEW: the currency the tour is actually priced in. Fallback mirrors
      -- 20260315000020_deposit_booking_notification_copy.sql:23.
      'currency', COALESCE(NULLIF(TRIM(tour.currency), ''), 'PKR')
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

GRANT EXECUTE ON FUNCTION public.operator_get_tour_bookings() TO authenticated;
