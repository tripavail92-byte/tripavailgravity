-- Fix package booking RPC permissions + RLS-safe overlap checking
--
-- Symptoms this addresses:
-- - Pricing RPC returning 0 / failing in production due to missing EXECUTE grants
-- - Hold creation failing with unclear errors
-- - Availability checks ignoring other users' bookings because RLS blocks reads

-- 1) RLS-safe availability check
CREATE OR REPLACE FUNCTION public.check_package_availability(
  package_id_param UUID,
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count INT;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM public.package_bookings
  WHERE package_id = package_id_param
    AND status IN ('confirmed', 'pending')
    AND (status != 'pending' OR (expires_at IS NOT NULL AND expires_at > NOW()))
    AND (check_in_date, check_out_date) OVERLAPS (check_in_param, check_out_param);

  RETURN conflict_count = 0;
END;
$$;

-- 2) Pricing RPC (keep invoker semantics; rely on table RLS for visibility)
-- Recreate to ensure function exists (idempotent) and then grant execute.
CREATE OR REPLACE FUNCTION public.calculate_package_price(
  package_id_param UUID,
  check_in_param DATE,
  check_out_param DATE
)
RETURNS TABLE(
  total_price NUMERIC,
  price_per_night NUMERIC,
  number_of_nights INT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  pkg_base_price NUMERIC;
  nights INT;
  total NUMERIC;
BEGIN
  SELECT base_price_per_night INTO pkg_base_price
  FROM public.packages
  WHERE id = package_id_param;

  IF pkg_base_price IS NULL OR pkg_base_price = 0 THEN
    RAISE EXCEPTION 'Package has no base price set';
  END IF;

  nights := (check_out_param - check_in_param)::int;
  IF nights <= 0 THEN
    RAISE EXCEPTION 'Invalid date range: check-out must be after check-in';
  END IF;

  total := pkg_base_price * nights;
  RETURN QUERY SELECT total, pkg_base_price, nights;
END;
$$;

-- 3) Atomic hold creation (SECURITY DEFINER so overlap checks work under RLS)
CREATE OR REPLACE FUNCTION public.create_package_booking_atomic(
  package_id_param UUID,
  traveler_id_param UUID,
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ,
  guest_count_param INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_id UUID;
  pkg_info RECORD;
  nights INT;
  expires_time TIMESTAMPTZ;
  pkg_base_price NUMERIC;
  total NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF traveler_id_param IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'traveler_id must match authenticated user';
  END IF;

  SELECT
    id,
    minimum_nights,
    maximum_nights,
    max_guests,
    is_published,
    base_price_per_night
  INTO pkg_info
  FROM public.packages
  WHERE id = package_id_param
  FOR UPDATE;

  IF pkg_info IS NULL THEN
    RAISE EXCEPTION 'Package not found';
  END IF;

  IF NOT pkg_info.is_published THEN
    RAISE EXCEPTION 'Package is not published';
  END IF;

  nights := (check_out_param::date - check_in_param::date)::int;
  IF nights < pkg_info.minimum_nights THEN
    RAISE EXCEPTION 'Minimum % nights required', pkg_info.minimum_nights;
  END IF;

  IF nights > pkg_info.maximum_nights THEN
    RAISE EXCEPTION 'Maximum % nights allowed', pkg_info.maximum_nights;
  END IF;

  IF guest_count_param > pkg_info.max_guests THEN
    RAISE EXCEPTION 'Maximum % guests allowed', pkg_info.max_guests;
  END IF;

  IF NOT public.check_package_availability(package_id_param, check_in_param, check_out_param) THEN
    RAISE EXCEPTION 'Package not available for selected dates';
  END IF;

  pkg_base_price := pkg_info.base_price_per_night;
  IF pkg_base_price IS NULL OR pkg_base_price = 0 THEN
    RAISE EXCEPTION 'Package has no base price set';
  END IF;

  total := pkg_base_price * nights;
  expires_time := NOW() + interval '10 minutes';

  INSERT INTO public.package_bookings (
    package_id,
    traveler_id,
    check_in_date,
    check_out_date,
    guest_count,
    number_of_nights,
    price_per_night,
    total_price,
    status,
    payment_status,
    expires_at,
    booking_date
  ) VALUES (
    package_id_param,
    traveler_id_param,
    check_in_param,
    check_out_param,
    guest_count_param,
    nights,
    pkg_base_price,
    total,
    'pending',
    'unpaid',
    expires_time,
    NOW()
  )
  RETURNING id INTO booking_id;

  RETURN booking_id;
END;
$$;

                                                                                                                                                                                     
-- Function: Expire old pending bookings (for scheduled job)                                                                                                                         
CREATE OR REPLACE FUNCTION public.expire_package_bookings()                                                                                                                          
RETURNS TABLE(expired_count INT)                                                                                                                                                     
LANGUAGE plpgsql                                                                                                                                                                     
SECURITY DEFINER                                                                                                                                                                     
SET search_path = public                                                                                                                                                             
AS $$                                                                                                                                                                                
DECLARE                                                                                                                                                                              
  affected_rows INT;                                                                                                                                                                 
BEGIN                                                                                                                                                                                
  UPDATE public.package_bookings                                                                                                                                                     
  SET status = 'expired'                                                                                                                                                             
  WHERE status = 'pending'                                                                                                                                                           
    AND expires_at IS NOT NULL                                                                                                                                                       
    AND expires_at < NOW();                                                                                                                                                          
                                                                                                                                                                                     
  GET DIAGNOSTICS affected_rows = ROW_COUNT;                                                                                                                                         
  RETURN QUERY SELECT affected_rows;                                                                                                                                                 
END;                                                                                                                                                                                 
$$;     

-- Permissions
GRANT EXECUTE ON FUNCTION public.check_package_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_package_price(UUID, DATE, DATE) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_package_booking_atomic(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_package_bookings() TO authenticated, service_role;
