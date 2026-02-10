-- Add payment tracking fields to tour_bookings
ALTER TABLE public.tour_bookings
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;

-- Add payment tracking fields to package_bookings
ALTER TABLE public.package_bookings
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes on stripe_payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tour_bookings_stripe_payment_intent ON public.tour_bookings(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_stripe_payment_intent ON public.package_bookings(stripe_payment_intent_id);

-- Create indexes on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_tour_bookings_payment_status ON public.tour_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_status ON public.package_bookings(payment_status);
