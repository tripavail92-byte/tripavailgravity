-- Package availability checking functions (Option A: Fixed packages)
-- Simple date overlap validation without per-room inventory tracking

-- Function: Check if package is available for date range
CREATE OR REPLACE FUNCTION check_package_availability(
  package_id_param UUID,
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INT;
BEGIN
  -- Count overlapping bookings (confirmed + active pending holds)
  SELECT COUNT(*) INTO conflict_count
  FROM public.package_bookings
  WHERE package_id = package_id_param
  AND status IN ('confirmed', 'pending')
  -- Only count pending bookings that haven't expired
  AND (status != 'pending' OR (expires_at IS NOT NULL AND expires_at > NOW()))
  -- Check for date range overlap
  AND (check_in_date, check_out_date) OVERLAPS (check_in_param, check_out_param);
  
  -- Return true if no conflicts found
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_package_availability IS 
'Checks if a package is available for booking during specified date range. Returns false if any confirmed or active pending bookings overlap.';

-- Function: Calculate price for package booking
CREATE OR REPLACE FUNCTION calculate_package_price(
  package_id_param UUID,
  check_in_param DATE,
  check_out_param DATE
)
RETURNS TABLE(
  total_price NUMERIC,
  price_per_night NUMERIC,
  number_of_nights INT
) AS $$
DECLARE
  pkg_base_price NUMERIC;
  nights INT;
  total NUMERIC;
BEGIN
  -- Get package base price
  SELECT base_price_per_night INTO pkg_base_price
  FROM public.packages
  WHERE id = package_id_param;

  -- If no base price set, return error
  IF pkg_base_price IS NULL OR pkg_base_price = 0 THEN
    RAISE EXCEPTION 'Package has no base price set';
  END IF;

  -- Calculate nights (check-out day doesn't count)
  nights := (check_out_param - check_in_param)::int;

  IF nights <= 0 THEN
    RAISE EXCEPTION 'Invalid date range: check-out must be after check-in';
  END IF;

  -- Calculate total
  total := pkg_base_price * nights;

  RETURN QUERY SELECT 
    total AS total_price,
    pkg_base_price AS price_per_night,
    nights AS number_of_nights;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_package_price IS 
'Server-side price calculation for package bookings. Formula: base_price_per_night × nights';

-- Function: Validate and create package booking atomically
CREATE OR REPLACE FUNCTION create_package_booking_atomic(
  package_id_param UUID,
  traveler_id_param UUID,
  check_in_param TIMESTAMPTZ,
  check_out_param TIMESTAMPTZ,
  guest_count_param INT
)
RETURNS UUID AS $$
DECLARE
  booking_id UUID;
  pkg_info RECORD;
  price_info RECORD;
  nights INT;
  expires_time TIMESTAMPTZ;
BEGIN
  -- Get package info with row-level lock to prevent race conditions
  SELECT 
    id, 
    minimum_nights, 
    maximum_nights, 
    max_guests,
    is_published
  INTO pkg_info
  FROM public.packages
  WHERE id = package_id_param
  FOR UPDATE; -- Lock row during transaction

  -- Validate package exists and is published
  IF pkg_info IS NULL THEN
    RAISE EXCEPTION 'Package not found';
  END IF;

  IF NOT pkg_info.is_published THEN
    RAISE EXCEPTION 'Package is not published';
  END IF;

  -- Validate date range
  nights := (check_out_param::date - check_in_param::date)::int;

  IF nights < pkg_info.minimum_nights THEN
    RAISE EXCEPTION 'Minimum % nights required', pkg_info.minimum_nights;
  END IF;

  IF nights > pkg_info.maximum_nights THEN
    RAISE EXCEPTION 'Maximum % nights allowed', pkg_info.maximum_nights;
  END IF;

  -- Validate guest count
  IF guest_count_param > pkg_info.max_guests THEN
    RAISE EXCEPTION 'Maximum % guests allowed', pkg_info.max_guests;
  END IF;

  -- Check availability (with current row lock preventing concurrent bookings)
  IF NOT check_package_availability(package_id_param, check_in_param, check_out_param) THEN
    RAISE EXCEPTION 'Package not available for selected dates';
  END IF;

  -- Calculate pricing
  SELECT * INTO price_info
  FROM calculate_package_price(
    package_id_param,
    check_in_param::date,
    check_out_param::date
  );

  -- Set expiration time (10 minutes from now)
  expires_time := NOW() + interval '10 minutes';

  -- Create booking
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
    price_info.number_of_nights,
    price_info.price_per_night,
    price_info.total_price,
    'pending',
    'unpaid',
    expires_time,
    NOW()
  )
  RETURNING id INTO booking_id;

  RETURN booking_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_package_booking_atomic IS 
'Creates a package booking with atomic validation. Prevents race conditions by locking package row and checking availability in single transaction. Sets 10-minute expiration hold.';

-- Function: Expire old pending bookings (for scheduled job)
CREATE OR REPLACE FUNCTION expire_package_bookings()
RETURNS TABLE(expired_count INT) AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_package_bookings IS 
'Expires all pending package bookings past their expiration time. Should be run every 1-2 minutes via scheduler.';
