-- =====================================================================
-- Phase 2 / Workstream 3 — Step 3.1: prepare kyc_documents for partner
-- "trust documents" (operator + hotel) so they live in the PRIVATE kyc bucket
-- (+ kyc_documents table) instead of the PUBLIC tour-operator-assets bucket with
-- permanent public URLs in verification_urls JSON.
--
-- Three things, all safe/idempotent:
--   1. Widen document_type CHECK to a TRUE SUPERSET of the current constraint
--      (which — per 20260705000012 — already includes passport / national_id_* /
--      business_registration for foreign partners; those MUST be retained).
--   2. De-dupe + a partial-unique index so there is at most ONE is_current row
--      per (operator_id, document_type) — kyc-signed-url reads it with .single().
--   3. kyc_document_supersede(): an ATOMIC supersede+insert so a failed upload can
--      never leave a document type with zero current rows (was a real hazard in the
--      naive update-then-insert-then-maybe-fail sequence).
-- =====================================================================

-- ── 1. document_type superset ───────────────────────────────────────────────
-- Drop whatever CHECK currently constrains document_type (name discovered
-- dynamically, matching 20260705000012's own approach), then re-add the union of
-- the current values + the new trust-doc types.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.kyc_documents'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%document_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.kyc_documents DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.kyc_documents ADD CONSTRAINT kyc_documents_document_type_check
  CHECK (document_type IN (
    -- Generic / global identity (retained from 20260705000012 — DO NOT drop:
    -- these unblock foreign, non-CNIC partners)
    'passport',
    'national_id_front',
    'national_id_back',
    'selfie',
    -- Pakistan-specific identity (retained)
    'cnic_front',
    'cnic_back',
    'secp_certificate',
    -- Business / misc (retained)
    'business_registration',
    'tax_registration',
    'tour_license',
    'other',
    -- Tour-operator trust documents (new)
    'insurance',
    'vehicle_docs',
    'guide_license',
    'tourism_license',
    'tax_certificate',
    -- Hotel / property trust documents (new)
    'title_deed',
    'utility_bill',
    'property_photo',
    'ownership_proof'
  ));

-- ── 2. one current row per (operator_id, document_type) ──────────────────────
-- De-dupe first (keep the newest version current) so the unique index can be
-- created even if legacy non-atomic writes produced duplicate current rows.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY operator_id, document_type
           ORDER BY version DESC, uploaded_at DESC, id
         ) AS rn
  FROM public.kyc_documents
  WHERE is_current = true
)
UPDATE public.kyc_documents k
   SET is_current = false
  FROM ranked
 WHERE k.id = ranked.id
   AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS kyc_docs_one_current_idx
  ON public.kyc_documents (operator_id, document_type)
  WHERE is_current;

-- ── 3. atomic supersede + insert ─────────────────────────────────────────────
-- Runs in a single transaction: clears the prior current row, then inserts the
-- new one as current. If the insert fails (or races another upload), the whole
-- call rolls back and the previous current pointer is left intact. Only the
-- service-role edge function may call it — NOT authenticated/anon, which would
-- otherwise be able to insert kyc_documents rows for arbitrary operators.
CREATE OR REPLACE FUNCTION public.kyc_document_supersede(
  p_operator uuid,
  p_type     text,
  p_path     text,
  p_version  int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.kyc_documents
     SET is_current = false
   WHERE operator_id = p_operator
     AND document_type = p_type
     AND is_current = true;

  INSERT INTO public.kyc_documents (operator_id, document_type, file_path, version, is_current, status)
  VALUES (p_operator, p_type, p_path, p_version, true, 'pending');
END;
$$;

REVOKE ALL ON FUNCTION public.kyc_document_supersede(uuid, text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kyc_document_supersede(uuid, text, text, int) TO service_role;
