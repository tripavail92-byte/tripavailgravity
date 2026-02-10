-- Create webhooks table to track Stripe webhook events
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL, -- payment_intent.succeeded, payment_intent.payment_failed, etc.
    booking_type TEXT NOT NULL CHECK (booking_type IN ('tour', 'package')),
    booking_id UUID NOT NULL,
    event_data JSONB NOT NULL, -- Full Stripe event payload
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_payment_webhooks_stripe_event_id ON public.payment_webhooks(stripe_event_id);
CREATE INDEX idx_payment_webhooks_booking_id ON public.payment_webhooks(booking_id);
CREATE INDEX idx_payment_webhooks_booking_type ON public.payment_webhooks(booking_type);
CREATE INDEX idx_payment_webhooks_event_type ON public.payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_processed ON public.payment_webhooks(processed);
CREATE INDEX idx_payment_webhooks_created_at ON public.payment_webhooks(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Service role can manage webhooks (for backend/edge functions)
GRANT ALL ON TABLE public.payment_webhooks TO service_role;
GRANT ALL ON TABLE public.payment_webhooks TO authenticated;

-- RLS policy for service role to handle webhooks
CREATE POLICY "Service role manages payment webhooks" ON public.payment_webhooks
    FOR ALL
    USING (auth.role() = 'service_role');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_payment_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_webhooks_updated_at
BEFORE UPDATE ON public.payment_webhooks
FOR EACH ROW
EXECUTE FUNCTION update_payment_webhooks_updated_at();
