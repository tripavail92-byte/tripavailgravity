-- =====================================================================
-- Phase 2 / Workstream 3 — Step 3.3 (DB): storefront trust badges derive from
-- kyc_documents (the new private-bucket trust docs) as well as the legacy
-- verification_urls / verification_documents flags.
--
-- Transition-safe: each on_file / verified boolean is TRUE if EITHER the legacy
-- signal is present OR a matching current/approved kyc_documents row exists. So
-- existing operators keep their badges, new uploads light up immediately, and
-- after the Stage C backfill clears verification_urls the kyc_documents branch
-- carries them alone. The view stays SECURITY DEFINER so it can read
-- kyc_documents (whose RLS otherwise limits reads to owner/admin).
--
-- Also grants the owner SELECT on kyc_documents so the Business Profile page can
-- list its own current documents (RLS still restricts rows to auth.uid()).
--
-- Additive/idempotent — safe to apply any time; the deployed client already reads
-- the has_* booleans, so this is transparent to it.
-- =====================================================================

GRANT SELECT ON public.kyc_documents TO authenticated;

DROP VIEW IF EXISTS public.operator_public_storefront_v;

CREATE VIEW public.operator_public_storefront_v
WITH (security_invoker = false) AS
SELECT
  p.user_id,
  p.slug,
  p.company_name,
  p.business_name,
  p.company_logo_url,
  p.description,
  p.primary_city,
  p.coverage_range,
  p.categories,
  p.years_experience,
  p.team_size,
  p.phone_number,
  p.email,
  p.first_name,
  p.last_name,
  p.account_status,
  p.fleet_assets,
  p.guide_profiles,
  p.gallery_media,
  p.public_policies,
  p.is_public,
  p.setup_completed,
  -- Identity: unchanged (produced by the KYC identity flow, not the trust-doc uploader).
  (
    (p.verification_documents ->> 'kycStatus') = 'approved'
    OR COALESCE(p.verification_documents ->> 'kycVerifiedAt', '') <> ''
  ) AS has_identity_verified,
  -- Trust docs — VERIFIED = legacy admin flag OR an approved kyc_documents row.
  (
    (p.verification_documents ->> 'businessRegistrationVerified') = 'true'
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'business_registration'
                 AND d.is_current AND d.status = 'approved')
  ) AS has_business_registration_verified,
  -- ON FILE = legacy value present OR a current kyc_documents row exists.
  (
    COALESCE(p.registration_number, '') <> ''
    OR COALESCE(p.verification_urls ->> 'businessRegistration', '') <> ''
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'business_registration' AND d.is_current)
  ) AS has_business_registration_on_file,
  (
    (p.verification_documents ->> 'insuranceVerified') = 'true'
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'insurance'
                 AND d.is_current AND d.status = 'approved')
  ) AS has_insurance_verified,
  (
    COALESCE(p.verification_urls ->> 'insurance', '') <> ''
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'insurance' AND d.is_current)
  ) AS has_insurance_on_file,
  (
    (p.verification_documents ->> 'vehicleDocsVerified') = 'true'
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'vehicle_docs'
                 AND d.is_current AND d.status = 'approved')
  ) AS has_fleet_verified,
  (
    COALESCE(p.verification_urls ->> 'vehicleDocs', '') <> ''
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'vehicle_docs' AND d.is_current)
  ) AS has_fleet_docs_on_file,
  (
    (p.verification_documents ->> 'guideLicenseVerified') = 'true'
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'guide_license'
                 AND d.is_current AND d.status = 'approved')
  ) AS has_guide_verified,
  (
    COALESCE(p.verification_urls ->> 'guideLicense', '') <> ''
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'guide_license' AND d.is_current)
  ) AS has_guide_credentials_on_file
FROM public.tour_operator_profiles p
WHERE p.is_public = true
   OR p.user_id = auth.uid();

GRANT SELECT ON public.operator_public_storefront_v TO anon, authenticated;
