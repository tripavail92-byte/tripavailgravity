-- Migration: Create User Payment Methods Table
-- Created: 2026-02-11
-- Purpose: Store saved payment methods (Stripe cards, EasyPaisa, JazzCash) for travelers

CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Method Type
    method_type TEXT NOT NULL CHECK (method_type IN ('card', 'easypaisa', 'jazzcash')),
    
    -- Display Details (Masked/Public info only)
    provider TEXT NOT NULL, -- 'stripe', 'easypaisa', 'jazzcash'
    label TEXT NOT NULL, -- e.g., 'Visa ending in 4242', 'My EasyPaisa Account'
    last_four TEXT, -- Last 4 digits for cards
    exp_month INTEGER, -- For cards
    exp_year INTEGER, -- For cards
    card_brand TEXT, -- For cards (visa, mastercard, etc)
    
    -- Wallet Specific
    phone_number TEXT, -- For EasyPaisa/JazzCash (stored masked or as identifier)
    
    -- Stripe Specific
    stripe_payment_method_id TEXT, -- ID from Stripe
    stripe_customer_id TEXT, -- Customer ID in Stripe
    
    -- Metadata
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL,

    -- Constraints
    CONSTRAINT one_default_per_user UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Indexing
CREATE INDEX IF NOT EXISTS user_payment_methods_user_id_idx ON public.user_payment_methods(user_id);

-- Enable RLS
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.user_payment_methods;

CREATE POLICY "Users can manage their own payment methods" ON public.user_payment_methods
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Updated at Trigger
CREATE TRIGGER update_user_payment_methods_updated_at
BEFORE UPDATE ON public.user_payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.user_payment_methods IS 'Saved payment methods for travelers including cards and mobile wallets';
