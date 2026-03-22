-- Allow expired status in package_bookings

DO $$
BEGIN
	IF to_regclass('public.package_bookings') IS NULL THEN
		RAISE NOTICE 'Skipping package booking expired-status bootstrap until package_bookings exists';
		RETURN;
	END IF;

	ALTER TABLE public.package_bookings
	DROP CONSTRAINT IF EXISTS package_bookings_status_check;

	ALTER TABLE public.package_bookings
	ADD CONSTRAINT package_bookings_status_check
	CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'expired'));
END $$;
