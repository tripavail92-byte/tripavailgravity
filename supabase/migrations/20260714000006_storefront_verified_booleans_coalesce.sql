-- =====================================================================
-- Phase 2 / Workstream 3 — cleanup: make the *_verified / identity storefront
-- booleans return false (not NULL) when the jsonb key is absent and there is no
-- approved kyc_documents row.
--
-- `(verification_documents ->> 'x') = 'true'` is NULL when key 'x' is absent, and
-- `NULL OR <false EXISTS>` is NULL (SQL three-valued logic). Functionally harmless
-- (NULL is falsy in JS, so the badge just doesn't show) but the client type says
-- boolean, so wrap each such expression in COALESCE(..., false). The *_on_file
-- booleans already coalesce their string comparisons, so they are left as-is.
--
-- Idempotent recreate; transparent to the deployed client (same output columns).
-- =====================================================================

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
  COALESCE(
    (p.verification_documents ->> 'kycStatus') = 'approved'
    OR COALESCE(p.verification_documents ->> 'kycVerifiedAt', '') <> '',
    false
  ) AS has_identity_verified,
  COALESCE(
    (p.verification_documents ->> 'businessRegistrationVerified') = 'true'
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'business_registration'
                 AND d.is_current AND d.status = 'approved'),
    false
  ) AS has_business_registration_verified,
  (
    COALESCE(p.registration_number, '') <> ''
    OR COALESCE(p.verification_urls ->> 'businessRegistration', '') <> ''
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'business_registration' AND d.is_current)
  ) AS has_business_registration_on_file,
  COALESCE(
    (p.verification_documents ->> 'insuranceVerified') = 'true'
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'insurance'
                 AND d.is_current AND d.status = 'approved'),
    false
  ) AS has_insurance_verified,
  (
    COALESCE(p.verification_urls ->> 'insurance', '') <> ''
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'insurance' AND d.is_current)
  ) AS has_insurance_on_file,
  COALESCE(
    (p.verification_documents ->> 'vehicleDocsVerified') = 'true'
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'vehicle_docs'
                 AND d.is_current AND d.status = 'approved'),
    false
  ) AS has_fleet_verified,
  (
    COALESCE(p.verification_urls ->> 'vehicleDocs', '') <> ''
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'vehicle_docs' AND d.is_current)
  ) AS has_fleet_docs_on_file,
  COALESCE(
    (p.verification_documents ->> 'guideLicenseVerified') = 'true'
    OR EXISTS (SELECT 1 FROM public.kyc_documents d
               WHERE d.operator_id = p.user_id AND d.document_type = 'guide_license'
                 AND d.is_current AND d.status = 'approved'),
    false
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
