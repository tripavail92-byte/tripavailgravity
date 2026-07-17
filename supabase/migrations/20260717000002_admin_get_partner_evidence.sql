-- =====================================================================
-- admin_get_partner_evidence(p_user_id, p_partner_type)
--
-- Everything an admin needs to decide "should this partner be approved?", in one call.
--
-- WHY IT EXISTS: no surface currently answers that question. /admin/partners shows the decision but
-- not the evidence; /admin/kyc shows the identity documents but not the partner's commercial state.
-- So an admin approving on /admin/partners has literally nothing on screen about whether the person
-- was ever verified, and admin_verify_partner_direct approves with no documents on file.
--
-- *** THE PII BOUNDARY — DO NOT WIDEN THIS RETURN TYPE. ***
-- Returns VERDICTS and BOOLEANS ONLY. Deliberately absent: cnic_number, full_name, father_name,
-- date_of_birth, gender, any storage path, any image URL, session_token. Raw identity data stays
-- quarantined behind /admin/kyc (and its signed-URL edge function), which is one deep link away.
-- An earlier incident exposed operator CNIC/KYC data to anon; the lesson is that identity data
-- leaks by being *convenient*, so the convenient surface must not carry it.
-- If a future caller "just needs the name", the answer is the deep link, not a new column.
--
-- Reads kyc_sessions for BOTH roles rather than the profile's kyc_verified_* columns, because those
-- columns exist on tour_operator_profiles only — the trigger's promotion is gated
-- `IF NEW.role = 'tour_operator'` (20260314000001:97). A manager's verified identity lives nowhere
-- else, so reading the session is the only thing correct for both.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_get_partner_evidence(
  p_user_id      UUID,
  p_partner_type TEXT
)
RETURNS TABLE (
  -- identity (verdict only; the evidence itself lives on /admin/kyc)
  kyc_status               TEXT,
  kyc_session_id           UUID,
  kyc_failure_code         TEXT,
  kyc_failure_reason       TEXT,
  kyc_reviewed_at          TIMESTAMPTZ,
  kyc_reviewed_by_is_admin BOOLEAN,
  -- business credentials
  country_code             TEXT,
  required_business_doc    TEXT,
  has_business_doc         BOOLEAN,
  has_optional_license     BOOLEAN,
  -- property (hotel managers only; all false/NULL for operators)
  ownership_type           TEXT,
  property_name            TEXT,
  property_address         TEXT,
  has_title_deed           BOOLEAN,
  has_utility_bill         BOOLEAN,
  has_property_photo       BOOLEAN,
  -- submission
  has_submission           BOOLEAN,
  submission_id            UUID,
  submission_status        TEXT,
  submitted_at             TIMESTAMPTZ,
  submission_version       INTEGER,
  -- governance (the two inputs can_partner_operate actually reads — nothing else may claim
  -- to answer "can they trade")
  verification_status      TEXT,
  account_status           TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_country  TEXT;
  v_required TEXT;
  v_optional TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_partner_type NOT IN ('hotel_manager', 'tour_operator') THEN
    RAISE EXCEPTION 'Unknown partner type: %', p_partner_type;
  END IF;

  -- Resolve the country-conditional document set the partner was actually ASKED for.
  -- Mirrors requiredBusinessDocs() (partnerCountry.ts:56-59): NULL/PK -> the Pakistan set.
  -- Do NOT hardcode 'business_registration' here — that is the live trap. The admin storefront
  -- dialog hardcodes it (AdminPartnersPage.tsx:579) and the storefront badge predicate queries it
  -- (20260714000005:57-59), so for a PK operator — which is EVERY operator with a NULL
  -- country_code, i.e. the default — the certificate they were required to upload is invisible.
  SELECT CASE p_partner_type
           WHEN 'hotel_manager' THEN (SELECT hmp.country_code FROM public.hotel_manager_profiles hmp WHERE hmp.user_id = p_user_id)
           ELSE                      (SELECT top.country_code FROM public.tour_operator_profiles top WHERE top.user_id = p_user_id)
         END
    INTO v_country;

  IF COALESCE(UPPER(v_country), 'PK') = 'PK' THEN
    v_required := 'secp_certificate';
    v_optional := 'tourism_license';
  ELSE
    v_required := 'business_registration';
    v_optional := 'tour_license';
  END IF;

  RETURN QUERY
  SELECT
    ks.status::TEXT,
    ks.id,
    ks.failure_code::TEXT,
    ks.failure_reason::TEXT,
    ks.reviewed_at,
    -- NOT "reviewed_by IS NOT NULL": reviewed_by is FK'd to auth.users, not admin_users, so it
    -- proves nothing on its own. Ask whether the recorded reviewer is really an admin.
    (ks.reviewed_by IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.admin_users au WHERE au.id = ks.reviewed_by
     )),

    v_country,
    v_required,
    EXISTS (SELECT 1 FROM public.kyc_documents d
             WHERE d.operator_id = p_user_id AND d.document_type = v_required AND d.is_current),
    EXISTS (SELECT 1 FROM public.kyc_documents d
             WHERE d.operator_id = p_user_id AND d.document_type = v_optional AND d.is_current),

    hmp.ownership_type::TEXT,
    hmp.property_name::TEXT,
    hmp.property_address::TEXT,
    (p_partner_type = 'hotel_manager' AND EXISTS (
       SELECT 1 FROM public.kyc_documents d
        WHERE d.operator_id = p_user_id AND d.document_type = 'title_deed' AND d.is_current)),
    (p_partner_type = 'hotel_manager' AND EXISTS (
       SELECT 1 FROM public.kyc_documents d
        WHERE d.operator_id = p_user_id AND d.document_type = 'utility_bill' AND d.is_current)),
    (p_partner_type = 'hotel_manager' AND EXISTS (
       SELECT 1 FROM public.kyc_documents d
        WHERE d.operator_id = p_user_id AND d.document_type = 'property_photo' AND d.is_current)),

    (pvr.id IS NOT NULL),
    pvr.id,
    pvr.status::TEXT,
    pvr.submitted_at,
    pvr.version,

    ur.verification_status::TEXT,
    CASE p_partner_type
      WHEN 'hotel_manager' THEN hmp.account_status::TEXT
      ELSE                      top.account_status::TEXT
    END
  FROM public.user_roles ur
  LEFT JOIN public.hotel_manager_profiles hmp
    ON hmp.user_id = ur.user_id AND p_partner_type = 'hotel_manager'
  LEFT JOIN public.tour_operator_profiles top
    ON top.user_id = ur.user_id AND p_partner_type = 'tour_operator'
  -- Latest session for this partner+role. A partner may have several (re-uploads, start-overs);
  -- the most recent is the one the decision is about.
  LEFT JOIN LATERAL (
    SELECT s.* FROM public.kyc_sessions s
     WHERE s.user_id = ur.user_id AND s.role = p_partner_type
     ORDER BY s.created_at DESC
     LIMIT 1
  ) ks ON TRUE
  -- Latest submission, likewise.
  LEFT JOIN LATERAL (
    SELECT r.* FROM public.partner_verification_requests r
     WHERE r.user_id = ur.user_id AND r.partner_type = p_partner_type
     ORDER BY r.version DESC, r.submitted_at DESC
     LIMIT 1
  ) pvr ON TRUE
  WHERE ur.user_id = p_user_id
    AND ur.role_type = p_partner_type;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_partner_evidence(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_partner_evidence(UUID, TEXT) TO authenticated;

COMMIT;
