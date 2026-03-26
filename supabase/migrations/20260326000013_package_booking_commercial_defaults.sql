UPDATE public.package_bookings
SET
  payment_collection_mode = COALESCE(payment_collection_mode, 'full_online'),
  deposit_required = COALESCE(deposit_required, FALSE),
  deposit_percentage = COALESCE(deposit_percentage, 0),
  upfront_amount = CASE
    WHEN COALESCE(upfront_amount, 0) > 0 THEN upfront_amount
    ELSE COALESCE(total_price, 0)
  END,
  remaining_amount = COALESCE(remaining_amount, 0),
  amount_paid_online = CASE
    WHEN payment_status IN ('paid', 'partially_paid', 'balance_pending')
      THEN COALESCE(amount_paid_online, upfront_amount, total_price, 0)
    ELSE COALESCE(amount_paid_online, 0)
  END,
  amount_due_to_operator = CASE
    WHEN payment_status = 'balance_pending' THEN COALESCE(remaining_amount, 0)
    ELSE COALESCE(amount_due_to_operator, 0)
  END,
  payment_policy_text = COALESCE(
    payment_policy_text,
    'Full amount is charged online at the time of booking confirmation.'
  )
WHERE
  payment_collection_mode IS NULL
  OR deposit_required IS NULL
  OR deposit_percentage IS NULL
  OR upfront_amount IS NULL
  OR remaining_amount IS NULL
  OR amount_paid_online IS NULL
  OR amount_due_to_operator IS NULL
  OR payment_policy_text IS NULL;

CREATE OR REPLACE FUNCTION public.create_package_booking_atomic(package_id_param UUID, traveler_id_param UUID, check_in_param TIMESTAMPTZ, check_out_param TIMESTAMPTZ, guest_count_param INT) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE booking_id UUID; pkg_info RECORD; nights INT; expires_time TIMESTAMPTZ; pkg_base_price NUMERIC; total NUMERIC; BEGIN SELECT id, minimum_nights, maximum_nights, max_guests, is_published, base_price_per_night INTO pkg_info FROM public.packages WHERE id = package_id_param FOR UPDATE; IF pkg_info IS NULL THEN RAISE EXCEPTION 'Package not found'; END IF; IF NOT pkg_info.is_published THEN RAISE EXCEPTION 'Package is not published'; END IF; nights := (check_out_param::date - check_in_param::date)::INT; IF nights < pkg_info.minimum_nights THEN RAISE EXCEPTION 'Minimum % nights required', pkg_info.minimum_nights; END IF; IF nights > pkg_info.maximum_nights THEN RAISE EXCEPTION 'Maximum % nights allowed', pkg_info.maximum_nights; END IF; IF guest_count_param > pkg_info.max_guests THEN RAISE EXCEPTION 'Maximum % guests allowed', pkg_info.max_guests; END IF; IF NOT public.check_package_availability(package_id_param, check_in_param, check_out_param) THEN RAISE EXCEPTION 'Package not available for selected dates'; END IF; pkg_base_price := pkg_info.base_price_per_night; IF pkg_base_price IS NULL OR pkg_base_price = 0 THEN RAISE EXCEPTION 'Package has no base price set'; END IF; total := pkg_base_price * nights; expires_time := NOW() + interval '10 minutes'; INSERT INTO public.package_bookings (package_id, traveler_id, check_in_date, check_out_date, guest_count, number_of_nights, price_per_night, total_price, status, payment_status, payment_collection_mode, deposit_required, deposit_percentage, upfront_amount, remaining_amount, amount_paid_online, amount_due_to_operator, payment_policy_text, expires_at, booking_date) VALUES (package_id_param, traveler_id_param, check_in_param, check_out_param, guest_count_param, nights, pkg_base_price, total, 'pending', 'unpaid', 'full_online', FALSE, 0, total, 0, 0, 0, 'Full amount is charged online at the time of booking confirmation.', expires_time, NOW()) RETURNING id INTO booking_id; RETURN booking_id; END; $$;