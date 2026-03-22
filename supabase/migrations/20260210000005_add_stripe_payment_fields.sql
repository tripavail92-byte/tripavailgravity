DO $$
BEGIN
	IF to_regclass('public.tour_bookings') IS NOT NULL THEN
		ALTER TABLE public.tour_bookings
		ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
		ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
		ADD COLUMN IF NOT EXISTS payment_method TEXT,
		ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
		ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;
	ELSE
		RAISE NOTICE 'Skipping tour booking payment bootstrap until tour tables exist';
	END IF;
END $$;

-- Add payment tracking fields to package_bookings
DO $$
BEGIN
	IF to_regclass('public.package_bookings') IS NOT NULL THEN
		ALTER TABLE public.package_bookings
		ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
		ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
		ADD COLUMN IF NOT EXISTS payment_method TEXT,
		ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
		ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;
	ELSE
		RAISE NOTICE 'Skipping package booking payment bootstrap until package_bookings exists';
	END IF;
END $$;

-- Create indexes on stripe_payment_intent_id for faster lookups
DO $$
BEGIN
	IF to_regclass('public.package_bookings') IS NOT NULL THEN
		CREATE INDEX IF NOT EXISTS idx_package_bookings_stripe_payment_intent ON public.package_bookings(stripe_payment_intent_id);
		CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_status ON public.package_bookings(payment_status);
	END IF;
END $$;

DO $$
BEGIN
	IF to_regclass('public.tour_bookings') IS NOT NULL THEN
		CREATE INDEX IF NOT EXISTS idx_tour_bookings_stripe_payment_intent ON public.tour_bookings(stripe_payment_intent_id);
		CREATE INDEX IF NOT EXISTS idx_tour_bookings_payment_status ON public.tour_bookings(payment_status);
	END IF;
END $$;
