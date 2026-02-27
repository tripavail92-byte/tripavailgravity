-- ============================================================================
-- KYC: Structured Fields + Documents Table + Deterministic Storage
-- Date: 2026-02-28
--
-- Changes:
--   1. Add gender, address columns to kyc_sessions (OCR-extracted)
--   2. Create kyc_documents table (versioned, per-operator, per-doc-type)
--   3. Create dedicated 'kyc' storage bucket (private)
--   4. Storage policies: admin full access, owner read-own
-- ============================================================================

BEGIN;

-- ─── 1. Extra OCR fields on kyc_sessions ────────────────────────────────────
ALTER TABLE public.kyc_sessions
  ADD COLUMN IF NOT EXISTS gender      text,
  ADD COLUMN IF NOT EXISTS address     text;

-- ─── 2. kyc_documents – versioned document tracking ─────────────────────────
-- One row per upload attempt, keyed by (operator_id, document_type, version).
-- is_current = true marks the latest approved/active version.

CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text         NOT NULL
                             CHECK (document_type IN (
                               'cnic_front',
                               'cnic_back',
                               'selfie',
                               'secp_certificate',
                               'tour_license',
                               'tax_registration',
                               'other'
                             )),
  -- deterministic storage path: kyc/tour_operators/{operator_id}/{document_type}/v{version}.{ext}
  file_path     text         NOT NULL,
  version       int          NOT NULL DEFAULT 1,
  is_current    boolean      NOT NULL DEFAULT true,
  -- review metadata
  status        text         NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_by   uuid         REFERENCES auth.users(id),
  verified_at   timestamptz,
  review_notes  text,
  -- link back to the kyc session that produced this document
  kyc_session_id uuid        REFERENCES public.kyc_sessions(id) ON DELETE SET NULL,
  uploaded_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kyc_docs_operator_idx ON public.kyc_documents (operator_id);
CREATE INDEX IF NOT EXISTS kyc_docs_type_idx     ON public.kyc_documents (operator_id, document_type);
CREATE INDEX IF NOT EXISTS kyc_docs_current_idx  ON public.kyc_documents (operator_id, document_type, is_current);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Owner can read their own documents
DROP POLICY IF EXISTS "Owner can read own kyc docs" ON public.kyc_documents;
CREATE POLICY "Owner can read own kyc docs"
  ON public.kyc_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = operator_id);

-- Admin can do everything
DROP POLICY IF EXISTS "Admin full access kyc docs" ON public.kyc_documents;
CREATE POLICY "Admin full access kyc docs"
  ON public.kyc_documents FOR ALL
  TO authenticated
  USING  (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Service role bypasses RLS (for edge functions)

-- ─── 3. Dedicated 'kyc' storage bucket ──────────────────────────────────────
-- Note: Supabase bucket creation is done via the dashboard or supabase CLI.
-- This migration sets up the storage object-level policies for the bucket.
-- The bucket should be created as PRIVATE (not publicly accessible).

-- Allow owner to upload their own KYC files
-- Path must start with: kyc/tour_operators/{their_user_id}/
DO $$
BEGIN
  -- Insert the bucket if the storage schema is available (local or linked project)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'kyc',
      'kyc',
      false,  -- private bucket
      10485760,  -- 10 MB per file
      ARRAY['image/jpeg','image/png','image/webp','application/pdf']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf'];
  END IF;
END $$;

-- Storage object-level RLS: owners can upload + read their own files
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN

    -- Drop then recreate so migration is idempotent
    DROP POLICY IF EXISTS "kyc_owner_insert"  ON storage.objects;
    DROP POLICY IF EXISTS "kyc_owner_select"  ON storage.objects;
    DROP POLICY IF EXISTS "kyc_admin_all"     ON storage.objects;

    CREATE POLICY "kyc_owner_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'kyc'
        AND (storage.foldername(name))[3] = auth.uid()::text
      );

    CREATE POLICY "kyc_owner_select"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'kyc'
        AND (storage.foldername(name))[3] = auth.uid()::text
      );

    -- Admin can read / write all KYC objects (drives signed URL generation and downloads)
    CREATE POLICY "kyc_admin_all"
      ON storage.objects FOR ALL
      TO authenticated
      USING  (bucket_id = 'kyc' AND public.is_admin(auth.uid()))
      WITH CHECK (bucket_id = 'kyc' AND public.is_admin(auth.uid()));

  END IF;
END $$;

-- ─── 4. RPC: fetch partner profiles regardless of account_status ─────────────
-- Used by AdminKYCPage / AllPartnersTab to bypass RLS filters.

CREATE OR REPLACE FUNCTION public.admin_list_tour_operators(
  p_status text DEFAULT NULL  -- NULL = all, or 'active'/'suspended'/'deleted'
)
RETURNS TABLE (
  user_id        uuid,
  company_name   text,
  account_status text,
  created_at     timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    top.user_id,
    top.company_name,
    top.account_status::text,
    top.created_at
  FROM public.tour_operator_profiles top
  WHERE (p_status IS NULL OR top.account_status::text = p_status)
  ORDER BY top.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_hotel_managers(
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  user_id        uuid,
  business_name  text,
  account_status text,
  created_at     timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    hmp.user_id,
    hmp.business_name,
    hmp.account_status::text,
    hmp.created_at
  FROM public.hotel_manager_profiles hmp
  WHERE (p_status IS NULL OR hmp.account_status::text = p_status)
  ORDER BY hmp.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_tour_operators(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_hotel_managers(text)  TO authenticated;

COMMIT;
