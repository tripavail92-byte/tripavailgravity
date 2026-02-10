-- Add 10-minute hold system to package_bookings (matching tours)
-- This prevents overbooking and implements temporary reservations

-- Add expires_at and related fields
ALTER TABLE public.package_bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS price_per_night NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS number_of_nights INT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_package_bookings_expires_at 
ON public.package_bookings(expires_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_intent 
ON public.package_bookings(stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_package_bookings_dates 
ON public.package_bookings(check_in_date, check_out_date);

-- Comments
COMMENT ON COLUMN public.package_bookings.expires_at IS 'Booking hold expiration time (10 minutes from creation for pending bookings)';
COMMENT ON COLUMN public.package_bookings.stripe_payment_intent_id IS 'Stripe payment intent ID for this booking';
COMMENT ON COLUMN public.package_bookings.payment_status IS 'Payment processing status';
COMMENT ON COLUMN public.package_bookings.paid_at IS 'Timestamp when payment was completed';
COMMENT ON COLUMN public.package_bookings.price_per_night IS 'Locked-in price per night at booking time';
COMMENT ON COLUMN public.package_bookings.number_of_nights IS 'Total nights (check_out_date - check_in_date)';
