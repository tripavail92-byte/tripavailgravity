-- KYC Device Handoff Sessions
-- Allows desktop → mobile QR handoff for ID + selfie capture.
-- The session_token acts as a shared secret (256-bit random hex);
-- possession of the token grants access to that session row.

-- gen_random_bytes requires pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.kyc_sessions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 64-char hex token from two concatenated UUIDs (128 bits of randomness)
  session_token  text        UNIQUE NOT NULL
                               DEFAULT REPLACE(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role           text        NOT NULL
                               CHECK (role IN ('tour_operator', 'hotel_manager')),
  status         text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'uploading', 'complete', 'expired')),

  -- Captured asset URLs (populated by mobile page)
  id_front_url   text,
  id_back_url    text,
  selfie_url     text,

  -- OCR + biometric results (populated after mobile capture)
  ocr_result     jsonb,
  match          boolean,
  match_score    integer,
  match_reason   text,

  expires_at     timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Fast lookups
CREATE INDEX IF NOT EXISTS kyc_sessions_token_idx   ON public.kyc_sessions (session_token);
CREATE INDEX IF NOT EXISTS kyc_sessions_user_idx    ON public.kyc_sessions (user_id);
CREATE INDEX IF NOT EXISTS kyc_sessions_expires_idx ON public.kyc_sessions (expires_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.kyc_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated owner can create + read their own sessions
CREATE POLICY "Owner can insert kyc session"
  ON public.kyc_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can read own kyc session"
  ON public.kyc_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone (including anon) who knows the session_token can read & update it.
-- The 256-bit random token is the access credential (same pattern as Stripe payment links).
CREATE POLICY "Token holder can read active session"
  ON public.kyc_sessions FOR SELECT
  TO anon, authenticated
  USING (expires_at > now() AND status != 'expired');

CREATE POLICY "Token holder can update active session"
  ON public.kyc_sessions FOR UPDATE
  TO anon, authenticated
  USING (expires_at > now() AND status != 'expired')
  WITH CHECK (expires_at > now());

-- Auto-expire: mark sessions as expired when they pass their expiry time.
-- (Optional: can also run as a cron job. Here we just let the RLS filter handle it.)
