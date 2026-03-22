CREATE OR REPLACE FUNCTION public.admin_list_tour_bookings(
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  tour_id UUID,
  traveler_id UUID,
  status TEXT,
  total_price NUMERIC,
  pax_count INT,
  booking_date TIMESTAMPTZ,
  payment_status TEXT,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  tour_title TEXT,
  traveler_email TEXT,
  traveler_first_name TEXT,
  traveler_last_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    booking.id,
    booking.tour_id,
    booking.traveler_id,
    booking.status::TEXT,
    booking.total_price,
    booking.pax_count,
    booking.booking_date,
    booking.payment_status,
    booking.payment_method,
    booking.stripe_payment_intent_id,
    booking.expires_at,
    booking.paid_at,
    tour.title::TEXT AS tour_title,
    profile.email::TEXT AS traveler_email,
    profile.first_name::TEXT AS traveler_first_name,
    profile.last_name::TEXT AS traveler_last_name
  FROM public.tour_bookings AS booking
  LEFT JOIN public.tours AS tour ON tour.id = booking.tour_id
  LEFT JOIN public.profiles AS profile ON profile.id = booking.traveler_id
  ORDER BY booking.booking_date DESC NULLS LAST, booking.id DESC
  LIMIT GREATEST(COALESCE(p_limit, 100), 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_tour_bookings(INT) TO authenticated;