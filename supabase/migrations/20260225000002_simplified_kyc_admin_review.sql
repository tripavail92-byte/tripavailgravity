-- Simplified KYC (CNIC front/back only) + admin approval
-- Removes insecure anon access patterns (token must be validated via edge functions).

BEGIN;

-- Expand status lifecycle
ALTER TABLE public.kyc_sessions
  DROP CONSTRAINT IF EXISTS kyc_sessions_status_check;

-- Migrate legacy statuses from the old biometric flow
UPDATE public.kyc_sessions
SET status = 'pending_admin_review'
WHERE status = 'complete';

ALTER TABLE public.kyc_sessions
  ADD CONSTRAINT kyc_sessions_status_check
  CHECK (
    status IN (
      'pending',
      'uploading',
      'processing',
      'pending_admin_review',
      'approved',
      'rejected',
      'failed',
      'expired'
    )
  );

-- Storage paths (private bucket). Keep legacy *_url columns for now.
ALTER TABLE public.kyc_sessions
  ADD COLUMN IF NOT EXISTS id_front_path text,
  ADD COLUMN IF NOT EXISTS id_back_path text;

-- Structured OCR extraction (populated by worker)
ALTER TABLE public.kyc_sessions
  ADD COLUMN IF NOT EXISTS cnic_number text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS expiry_date date;

-- Failure + review metadata
ALTER TABLE public.kyc_sessions
  ADD COLUMN IF NOT EXISTS failure_code text,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text;

CREATE INDEX IF NOT EXISTS kyc_sessions_cnic_idx ON public.kyc_sessions (cnic_number);
CREATE INDEX IF NOT EXISTS kyc_sessions_status_idx ON public.kyc_sessions (status);

-- Blocked CNIC registry (admin managed)
CREATE TABLE IF NOT EXISTS public.kyc_blocked_cnics (
  cnic_number text PRIMARY KEY,
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_blocked_cnics ENABLE ROW LEVEL SECURITY;

-- Tighten kyc_sessions RLS: remove anon "token holder" policies (they were too permissive).
DROP POLICY IF EXISTS "Token holder can read active session" ON public.kyc_sessions;
DROP POLICY IF EXISTS "Token holder can update active session" ON public.kyc_sessions;

-- Owners can still create/read/update their own sessions.
DROP POLICY IF EXISTS "Owner can insert kyc session" ON public.kyc_sessions;
DROP POLICY IF EXISTS "Owner can read own kyc session" ON public.kyc_sessions;
DROP POLICY IF EXISTS "Owner can update own kyc session" ON public.kyc_sessions;

CREATE POLICY "Owner can insert kyc session"
  ON public.kyc_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can read own kyc session"
  ON public.kyc_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can update own kyc session"
  ON public.kyc_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can read/update any session (drives /admin/kyc).
-- Depends on existing helper: public.is_admin(uuid)
DROP POLICY IF EXISTS "Admin can read all kyc sessions" ON public.kyc_sessions;
CREATE POLICY "Admin can read all kyc sessions"
  ON public.kyc_sessions FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update all kyc sessions" ON public.kyc_sessions;
CREATE POLICY "Admin can update all kyc sessions"
  ON public.kyc_sessions FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Blocked CNIC table policies (admin only)
DROP POLICY IF EXISTS "Admin can manage blocked cnics" ON public.kyc_blocked_cnics;
CREATE POLICY "Admin can manage blocked cnics"
  ON public.kyc_blocked_cnics
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMIT;
