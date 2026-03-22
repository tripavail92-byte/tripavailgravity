-- Create package_bookings table to match tour_bookings structure
CREATE TABLE IF NOT EXISTS public.package_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'expired')),
    total_price NUMERIC NOT NULL,
    guest_count INT NOT NULL DEFAULT 1,
    check_in_date TIMESTAMPTZ,
    check_out_date TIMESTAMPTZ,
    booking_date TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    stripe_payment_intent_id TEXT UNIQUE,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    payment_metadata JSONB DEFAULT '{}'::jsonb,
    price_per_night NUMERIC(10, 2),
    number_of_nights INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.package_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Travelers can view own package bookings' AND tablename = 'package_bookings') THEN
        CREATE POLICY "Travelers can view own package bookings" ON public.package_bookings FOR SELECT USING (auth.uid() = traveler_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Package owners can view bookings for their packages' AND tablename = 'package_bookings') THEN
        CREATE POLICY "Package owners can view bookings for their packages" ON public.package_bookings FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.packages WHERE packages.id = package_bookings.package_id AND packages.owner_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Travelers can create package bookings' AND tablename = 'package_bookings') THEN
        CREATE POLICY "Travelers can create package bookings" ON public.package_bookings FOR INSERT WITH CHECK (auth.uid() = traveler_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Travelers can update own package bookings' AND tablename = 'package_bookings') THEN
        CREATE POLICY "Travelers can update own package bookings" ON public.package_bookings FOR UPDATE USING (auth.uid() = traveler_id);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_package_bookings_traveler_id ON public.package_bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_package_id ON public.package_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_status ON public.package_bookings(status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_created_at ON public.package_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_package_bookings_expires_at ON public.package_bookings(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_intent ON public.package_bookings(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_package_bookings_dates ON public.package_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_package_bookings_stripe_payment_intent ON public.package_bookings(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_status ON public.package_bookings(payment_status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_package_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS package_bookings_updated_at ON public.package_bookings;
CREATE TRIGGER package_bookings_updated_at
BEFORE UPDATE ON public.package_bookings
FOR EACH ROW
EXECUTE FUNCTION update_package_bookings_updated_at();

COMMENT ON COLUMN public.package_bookings.expires_at IS 'Booking hold expiration time (10 minutes from creation for pending bookings)';
COMMENT ON COLUMN public.package_bookings.stripe_payment_intent_id IS 'Stripe payment intent ID for this booking';
COMMENT ON COLUMN public.package_bookings.payment_status IS 'Payment processing status';
COMMENT ON COLUMN public.package_bookings.paid_at IS 'Timestamp when payment was completed';
COMMENT ON COLUMN public.package_bookings.price_per_night IS 'Locked-in price per night at booking time';
COMMENT ON COLUMN public.package_bookings.number_of_nights IS 'Total nights (check_out_date - check_in_date)';

-- Grant permissions
GRANT ALL ON TABLE public.package_bookings TO authenticated;
GRANT ALL ON TABLE public.package_bookings TO service_role;
GRANT SELECT ON TABLE public.package_bookings TO anon;
