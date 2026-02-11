-- Create a table to store incoming WhatsApp webhook events
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    meta_info JSONB -- To store metadata like message sender, business ID etc.
);

-- Enable RLS
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role full access' AND tablename = 'whatsapp_logs') THEN
        CREATE POLICY "Allow service role full access" ON public.whatsapp_logs
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- Add comment to table
COMMENT ON TABLE public.whatsapp_logs IS 'Logs for incoming WhatsApp Webhook events from Meta.';
