-- ============================================================================
-- Phase 0 · Layer 5 (foundation) — Country-agnostic identity  [unblocks BLOCKER 1]
-- Date: 2026-07-05
--
-- Today KYC is hard-wired to the Pakistani CNIC: kyc_documents.document_type only
-- allows cnic_front/back, selfie, secp_certificate, tour_license, tax_registration,
-- other — so a foreign partner with a passport has no valid document type and
-- cannot reach a payable state.
--
-- This widens the allowed set to include generic passport / national-id / business
-- docs while RETAINING every existing Pakistan-specific value (purely additive — no
-- existing row can violate the new constraint). It also adds a `country_code` to
-- the partner profiles so verify-identity can pick the right ID format per country.
--
-- FOLLOW-UP (code, not this migration): the verify-identity edge function must stop
-- assuming the CNIC regex and choose validation by partner country_code.
-- ============================================================================

-- Widen the document_type check. Drop whatever CHECK currently references
-- document_type (discovered dynamically so we don't depend on its exact name),
-- then re-add the wider set.
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
    -- Generic / global identity + business
    'passport',
    'national_id_front',
    'national_id_back',
    'selfie',
    'business_registration',
    'tax_registration',
    'tour_license',
    'other',
    -- Pakistan-specific (retained for existing rows / PK partners)
    'cnic_front',
    'cnic_back',
    'secp_certificate'
  ));

-- Partner legal domicile — lets KYC / tax / payout logic key off country.
ALTER TABLE public.tour_operator_profiles  ADD COLUMN IF NOT EXISTS country_code text;  -- ISO-3166-1 alpha-2
ALTER TABLE public.hotel_manager_profiles  ADD COLUMN IF NOT EXISTS country_code text;

COMMENT ON COLUMN public.tour_operator_profiles.country_code IS
  'ISO-3166-1 alpha-2 of the partner legal domicile; drives country-aware KYC/tax/payout. NULL = legacy (assume PK).';
COMMENT ON COLUMN public.hotel_manager_profiles.country_code IS
  'ISO-3166-1 alpha-2 of the partner legal domicile; drives country-aware KYC/tax/payout. NULL = legacy (assume PK).';
