-- Stores WhatsApp chat-level role selection so the bot can respond in role context.
CREATE TABLE IF NOT EXISTS public.whatsapp_user_state (
  wa_phone text PRIMARY KEY,
  selected_role text NOT NULL CHECK (selected_role IN ('traveller', 'hotel_manager', 'tour_operator')),
  selected_role_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_user_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow service role full access whatsapp_user_state'
      AND tablename = 'whatsapp_user_state'
      AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Allow service role full access whatsapp_user_state"
      ON public.whatsapp_user_state
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

COMMENT ON TABLE public.whatsapp_user_state IS 'Per-phone role context for WhatsApp assistant conversations.';
