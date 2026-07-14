-- =====================================================================
-- Phase 2 / Workstream 1 — Step 1.1: public operator storefront VIEW
-- with DERIVED trust booleans.
--
-- WHY
--   The anon hotfix (20260714000001) stopped the storefront from selecting
--   verification_documents / verification_urls / registration_number, which
--   also removed the trust badges (Identity verified, Insurance on file, …).
--   This view brings the badges back WITHOUT exposing raw PII: the confidential
--   jsonb and registration_number are reduced to booleans HERE, server-side,
--   so their raw values never leave the database.
--
-- HOW IT'S SAFE
--   The view is owned by the migration role (postgres) and runs with
--   security_invoker = false, so it bypasses base-table RLS. Its own WHERE
--   clause is therefore the access control:
--     * anon            -> only is_public rows
--     * authenticated   -> is_public rows PLUS their own row (auth.uid()),
--                          so owners can still resolve their unpublished profile.
--   Output columns are safe columns + booleans ONLY — no confidential column
--   is ever selectable through this view.
--
--   NOTE: security_invoker MUST stay false. If flipped to true, anon would get
--   zero rows once step 1.3 drops the base-table public-read policy.
--
-- ORDERING
--   Additive and safe to apply any time. The client is pointed at this view in
--   step 1.2 (deploy); the leaky base-table policy is dropped in step 1.3 —
--   and ONLY after 1.2 is live. Never collapse 1.1 -> 1.2 -> 1.3.
-- =====================================================================

CREATE OR REPLACE VIEW public.operator_public_storefront_v
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
  -- first_name / last_name / account_status: already anon-visible today via the
  -- tour-detail fetch (tourService.getTourBy*), kept here so that path can move
  -- onto this view instead of the base table. Not KYC-confidential.
  p.first_name,
  p.last_name,
  p.account_status,
  p.fleet_assets,
  p.guide_profiles,
  p.gallery_media,
  p.public_policies,
  p.is_public,
  p.setup_completed,
  -- ── derived trust booleans (never expose the raw jsonb / registration no.) ──
  (
    (p.verification_documents ->> 'kycStatus') = 'approved'
    OR COALESCE(p.verification_documents ->> 'kycVerifiedAt', '') <> ''
  ) AS has_identity_verified,
  ((p.verification_documents ->> 'businessRegistrationVerified') = 'true') AS has_business_registration_verified,
  (
    COALESCE(p.registration_number, '') <> ''
    OR COALESCE(p.verification_urls ->> 'businessRegistration', '') <> ''
  ) AS has_business_registration_on_file,
  ((p.verification_documents ->> 'insuranceVerified') = 'true') AS has_insurance_verified,
  (COALESCE(p.verification_urls ->> 'insurance', '') <> '') AS has_insurance_on_file,
  ((p.verification_documents ->> 'vehicleDocsVerified') = 'true') AS has_fleet_verified,
  (COALESCE(p.verification_urls ->> 'vehicleDocs', '') <> '') AS has_fleet_docs_on_file,
  ((p.verification_documents ->> 'guideLicenseVerified') = 'true') AS has_guide_verified,
  (COALESCE(p.verification_urls ->> 'guideLicense', '') <> '') AS has_guide_credentials_on_file
FROM public.tour_operator_profiles p
WHERE p.is_public = true
   OR p.user_id = auth.uid();

GRANT SELECT ON public.operator_public_storefront_v TO anon, authenticated;

-- ---------------------------------------------------------------------
-- VERIFY (as anon, via REST):
--   GET /rest/v1/operator_public_storefront_v?slug=eq.<slug>&select=*
--   -> 200, returns safe columns + has_* booleans, and NO verification_*/
--      registration_number/kyc_* column exists on the row.
-- ---------------------------------------------------------------------
