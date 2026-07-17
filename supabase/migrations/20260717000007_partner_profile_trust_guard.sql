-- =====================================================================
-- SECURITY: stop partners forging the trust badges travellers see.
--
-- THE HOLE (same shape as the kyc_sessions self-approval hole, one table over):
--   * "Users can update own tour profile"  ON public.tour_operator_profiles FOR UPDATE
--       USING (auth.uid() = user_id)                                (20260211172000:72-73)
--   * "Users can update own hotel profile" ON public.hotel_manager_profiles FOR UPDATE
--       USING (auth.uid() = user_id)                                (20260211172000:66-67)
--   RLS scopes ROWS, never COLUMNS, and there are no column grants on verification_documents.
--   So a partner may write ANY key of their own verification_documents JSONB.
--
--   operator_public_storefront_v derives the traveller-facing badges from exactly that JSONB
--   (20260714000005:51-56), is SECURITY DEFINER (security_invoker = false), and is GRANTed SELECT
--   to anon. So:
--       PATCH /rest/v1/tour_operator_profiles?user_id=eq.<own uid>
--       {"verification_documents":{"kycStatus":"approved"}}
--   — with nothing but their own JWT and the public anon key — makes has_identity_verified true and
--   renders an "Identity Verified" badge to every anonymous traveller. The same trick forges
--   "Business registration verified", "Insurance verified", "Vehicle docs verified" and
--   "Guide licence verified", inflates the operator quality score (20260328000001:93-113), and
--   unlocks awards gated on vehicleDocsVerified (20260328000002:100, 20260328000004:201).
--
--   NOT an escalation: can_partner_operate() reads user_roles.verification_status, which this does
--   not touch — publish rights are unaffected. It is trust-signal forgery aimed at TRAVELLERS, who
--   book and pay on the strength of those badges.
--
-- *** WHY A TRIGGER AND NOT COLUMN GRANTS — READ THIS, IT IS THE WHOLE DESIGN. ***
--
-- A first draft of this migration "took the columns away" with
--     REVOKE UPDATE (kyc_verified_name, ...) ON public.tour_operator_profiles FROM authenticated;
-- justified as "the same form the repo already uses at 20260216000001:403-404".
-- IT WOULD HAVE DONE NOTHING, and so does the precedent it cited.
--
-- 20260204215500_fix_permissions.sql:3 runs `GRANT ALL ON ALL TABLES IN SCHEMA public TO
-- authenticated`. PostgreSQL cannot subtract a COLUMN-level privilege from a TABLE-level grant:
-- the REVOKE emits `WARNING: no privileges could be revoked for column ...`, the migration COMMITs
-- happily, and authenticated keeps UPDATE on every column. No migration anywhere revokes the
-- table-level grant. So ALL THIRTEEN `REVOKE UPDATE (...)` statements in this repo are silent
-- no-ops and have been since February — including the ones protecting account_status. That is a
-- separate, larger problem than this file (see the note at the bottom).
--
-- The only in-repo migration that gets this right is 20260714000001:35, which revokes the
-- TABLE-level privilege first and then re-grants column-by-column in a loop. That pattern works,
-- but applying it to UPDATE here would mean enumerating every writable column of two tables and
-- silently breaking any column added later — and tourService/hotelManagerService write opaque
-- payloads, so a mistake means broken onboarding rather than a warning.
--
-- A BEFORE trigger does not care about grant semantics at all. It sees the row the partner is
-- trying to write and puts the protected values back. That is why this guards BOTH the JSONB trust
-- keys AND the kyc_verified_* columns, rather than splitting the job between a trigger and a
-- REVOKE that does not work.
--
-- It also cannot be a column revoke for a second, independent reason: the setup wizard legitimately
-- upserts the whole verification_documents JSONB (hotelManagerService.ts:65-73), including
-- idCardUrl / idBackUrl / ownershipDocs, which are the partner's own uploads. So the column must
-- stay writable, and only the keys that constitute a CLAIM BY THE PLATFORM get pinned to whatever
-- the server already believes. The wizard carries on unchanged — its kycStatus write stops counting.
--
-- THE LEGITIMATE AUTHORS:
--   * kyc_session_status_changed()           — owns kycStatus (NOT kycVerifiedAt: nothing writes
--     that key anywhere; the storefront view reads it but no author sets it, so it is stripped
--     unconditionally below rather than pinned).
--   * admin_set_operator_verification_flag() — owns the four *Verified flags (20260328000002:124-181).
--     It also writes a row to operator_verification_reviews, which partners cannot write — that is
--     the fingerprint the detection query at the bottom uses to tell a real verification from a
--     forged one.
--
-- *** WHY THIS GUARD TESTS current_user AND IS SECURITY INVOKER. ***
-- An earlier draft exempted them on the grounds that they are "SECURITY DEFINER and admin/service",
-- testing request_jwt_role() = 'service_role'. THAT REASONING IS WRONG AND WOULD HAVE BROKEN THE
-- WIZARD. SECURITY DEFINER changes the executing DB ROLE; it does not touch request.jwt.claims. Both
-- auth.uid() and request_jwt_role() read that GUC (20260323000010:9), so inside a SECURITY DEFINER
-- function they still return the CALLER's identity — which is precisely why the is_admin() check in
-- admin_verify_partner_direct works at all.
--
-- The consequence: 20260717000001:88-91 deliberately lets a PARTNER set their own session to
-- 'expired' (refreshQr / start-over). kyc_session_status_changed then fires and syncs
-- kycStatus='expired' into the profile — under the partner's JWT. A request_jwt_role() test sees
-- 'authenticated', pins kycStatus back to its old value, and silently discards a legitimate server
-- write, leaving the wizard's cached identity status frozen.
--
-- current_user is the right question — "who is actually executing this write?" — and SECURITY
-- DEFINER genuinely does change it. But a SECURITY DEFINER function cannot read it: inside one,
-- current_user is its OWN owner. So this guard is SECURITY INVOKER, and then:
--     partner PATCHes their profile directly            -> current_user = 'authenticated' -> guarded
--     kyc_session_status_changed writes the cache       -> current_user = 'postgres'      -> exempt
--     admin_set_operator_verification_flag writes flags -> current_user = 'postgres'      -> exempt
--     worker / edge function                            -> current_user = 'service_role'  -> exempt
-- SECURITY INVOKER is safe here: the function only rewrites NEW, and its one call (is_admin) is
-- GRANTed to authenticated (20260710000002:27).
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.partner_profile_trust_guard()
RETURNS trigger
LANGUAGE plpgsql
-- INVOKER, deliberately — see the header. A SECURITY DEFINER function reads its OWN owner as
-- current_user, which would make the discriminator below always true and the guard a no-op.
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  -- PINNED keys — claims by the PLATFORM, each read by the storefront view, the quality score, or an
  -- award gate. These have a legitimate server author, so on UPDATE we hold them to the server's
  -- existing value rather than dropping them (dropping would fight the wizard, which resends them).
  -- The partner's OWN keys (idCardUrl, idBackUrl, ownershipDocs, kycSessionToken, expiryDate,
  -- cnicNumber) are deliberately absent: those are their uploads, not our verdicts.
  k_protected CONSTANT text[] := ARRAY[
    'kycStatus',
    'businessRegistrationVerified',
    'insuranceVerified',
    'vehicleDocsVerified',
    'guideLicenseVerified',
    'phoneVerified',
    'emailVerified',
    'addressVerified',
    'bankVerified'
  ];
  -- STRIPPED keys — read by has_identity_verified but with NO server writer ANYWHERE (grep confirms:
  -- only the three storefront views read kycVerifiedAt, nothing writes it). A key nobody legitimately
  -- sets can only ever hold a forged value, so pinning it would FREEZE a forgery permanently — no
  -- path could clear it. Delete it on every write instead.
  k_stripped CONSTANT text[] := ARRAY[
    'kycVerifiedAt'
  ];
  v_uid     UUID := auth.uid();
  v_doc     JSONB;
  v_old_doc JSONB;
  k         TEXT;
BEGIN
  -- Only the client roles are guarded. Everything legitimate reaches these columns as some other
  -- role: a SECURITY DEFINER function executes as its owner (postgres), and the worker / edge
  -- functions connect as service_role. Testing current_user rather than the JWT claim is what makes
  -- the KYC cache sync work on a partner-initiated 'expired' — see the header.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- An admin writing a profile directly rather than through an RPC.
  -- Nested, not `v_uid IS NOT NULL AND is_admin(v_uid)`: SQL does not promise to short-circuit AND,
  -- and is_admin's EXECUTE is REVOKEd from anon (20260710000002:26), so evaluating it as anon would
  -- be a permission error rather than false.
  IF v_uid IS NOT NULL THEN
    IF public.is_admin(v_uid) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- ── the JSONB trust keys ────────────────────────────────────────────────
  v_doc := COALESCE(NEW.verification_documents, '{}'::jsonb);

  -- NOTE THE NESTED IF. It must NOT be written as
  --     IF TG_OP = 'UPDATE' AND OLD.verification_documents ? k THEN
  -- PL/pgSQL does not save you with short-circuit evaluation there: it prepares the whole condition
  -- as a SQL expression and evaluates every variable it references up front, so OLD is dereferenced
  -- even when TG_OP is 'INSERT' — raising `record "old" is not assigned yet` and breaking every
  -- profile INSERT. The TG_OP test has to be its own statement.
  IF TG_OP = 'UPDATE' THEN
    v_old_doc := COALESCE(OLD.verification_documents, '{}'::jsonb);
    FOREACH k IN ARRAY k_protected LOOP
      IF v_old_doc ? k THEN
        -- Pin to what the server already believes. Silently, not with an exception: the wizard
        -- sends these keys today as a matter of course, and raising would break onboarding.
        v_doc := jsonb_set(v_doc, ARRAY[k], v_old_doc -> k, true);
      ELSE
        -- The server has never held a value for this key, so the partner cannot introduce one.
        v_doc := v_doc - k;
      END IF;
    END LOOP;
  ELSE
    -- INSERT: nobody arrives pre-verified. Strip every claim.
    FOREACH k IN ARRAY k_protected LOOP
      v_doc := v_doc - k;
    END LOOP;
  END IF;

  -- Author-less keys: always gone, INSERT or UPDATE. No OLD value is worth preserving because the
  -- server never wrote one.
  FOREACH k IN ARRAY k_stripped LOOP
    v_doc := v_doc - k;
  END LOOP;

  NEW.verification_documents := v_doc;

  -- ── the kyc_verified_* COLUMNS (tour_operator_profiles only) ────────────
  -- Pinned here rather than revoked, because the REVOKE would be a no-op — see the header.
  -- These are the immutable admin-reviewed identity record, and the quality score reads them
  -- DIRECTLY as a disjunct alongside the JSONB (20260328000001:92 scores
  --   kyc_verified_at IS NOT NULL  OR  verification_documents->>'kycStatus' = 'approved'
  -- ), so pinning only the JSONB half would leave the badge fully forgeable through the column
  -- half and buy nothing at all.
  -- No client path writes these — only kyc_session_status_changed(), which is SECURITY DEFINER and
  -- returns above.
  IF TG_TABLE_NAME = 'tour_operator_profiles' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.current_kyc_session_id   := OLD.current_kyc_session_id;
      NEW.kyc_verified_name        := OLD.kyc_verified_name;
      NEW.kyc_verified_cnic        := OLD.kyc_verified_cnic;
      NEW.kyc_verified_dob         := OLD.kyc_verified_dob;
      NEW.kyc_verified_gender      := OLD.kyc_verified_gender;
      NEW.kyc_verified_father_name := OLD.kyc_verified_father_name;
      NEW.kyc_verified_at          := OLD.kyc_verified_at;
      NEW.kyc_rejection_reason     := OLD.kyc_rejection_reason;
    ELSE
      -- INSERT: nobody arrives pre-verified.
      NEW.current_kyc_session_id   := NULL;
      NEW.kyc_verified_name        := NULL;
      NEW.kyc_verified_cnic        := NULL;
      NEW.kyc_verified_dob         := NULL;
      NEW.kyc_verified_gender      := NULL;
      NEW.kyc_verified_father_name := NULL;
      NEW.kyc_verified_at          := NULL;
      NEW.kyc_rejection_reason     := NULL;
    END IF;
  END IF;

  -- ── account_status — the governance column ──────────────────────────────
  -- can_partner_operate() reads this. 20260216000001:403-404 and 20260220000001:47-54 both tried to
  -- revoke it at column level and BOTH are no-ops, so it is partner-writable today: a SUSPENDED
  -- partner can PATCH themselves back to 'active' and resume trading. Only pinned on UPDATE — on
  -- INSERT the column default must stand, and a brand-new profile is legitimately active.
  -- The admin path (admin_set_tour_operator_status / admin_set_hotel_manager_status) is SECURITY
  -- DEFINER + is_admin, so it returns above and is unaffected.
  IF TG_OP = 'UPDATE' THEN
    NEW.account_status := OLD.account_status;
  END IF;

  RETURN NEW;
END;
$$;

-- NO `UPDATE OF verification_documents` CLAUSE. A first draft had one, which is a hole: a trigger
-- scoped to a column list only fires when that column is in the SET list, so a partner could write
-- kyc_verified_at (or account_status) in a PATCH that simply never mentions verification_documents,
-- and the guard would never run. Fire on every write and let the function decide.
DROP TRIGGER IF EXISTS tour_operator_profile_trust_guard_trg ON public.tour_operator_profiles;
CREATE TRIGGER tour_operator_profile_trust_guard_trg
  BEFORE INSERT OR UPDATE ON public.tour_operator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.partner_profile_trust_guard();

DROP TRIGGER IF EXISTS hotel_manager_profile_trust_guard_trg ON public.hotel_manager_profiles;
CREATE TRIGGER hotel_manager_profile_trust_guard_trg
  BEFORE INSERT OR UPDATE ON public.hotel_manager_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.partner_profile_trust_guard();

REVOKE ALL ON FUNCTION public.partner_profile_trust_guard() FROM PUBLIC;

COMMIT;


-- ---------------------------------------------------------------------
-- DETECTION (read-only) — badges that were never earned.
--
-- Any operator whose storefront currently claims a verified identity while nothing on the server
-- backs it: no approved user_roles row AND no admin-reviewed kyc session. Run it after applying.
-- ---------------------------------------------------------------------
-- SELECT
--   p.user_id,
--   u.email,
--   p.company_name,
--   p.verification_documents ->> 'kycStatus'    AS claimed_kyc_status,
--   ur.verification_status                      AS real_role_status,
--   ks.status                                   AS real_kyc_status,
--   'SUSPECT: badge not backed by any server-side verification' AS assessment
-- FROM public.tour_operator_profiles p
-- LEFT JOIN public.users u ON u.id = p.user_id
-- LEFT JOIN public.user_roles ur
--   ON ur.user_id = p.user_id AND ur.role_type = 'tour_operator'
-- LEFT JOIN LATERAL (
--   SELECT s.* FROM public.kyc_sessions s
--    WHERE s.user_id = p.user_id AND s.role = 'tour_operator'
--    ORDER BY s.created_at DESC LIMIT 1
-- ) ks ON TRUE
-- WHERE (
--     (p.verification_documents ->> 'kycStatus') = 'approved'
--     OR COALESCE(p.verification_documents ->> 'kycVerifiedAt', '') <> ''
--   )
--   AND COALESCE(ur.verification_status, '') <> 'approved'
--   AND COALESCE(ks.status, '') <> 'approved';
--
-- Same question for the other four badges. Unlike kycStatus these DO have a legitimate author —
-- admin_set_operator_verification_flag — and it always writes a row to operator_verification_reviews
-- (20260328000002:165-178), which no partner can write. So a flag reading true with no matching
-- review row behind it was not set by an admin.
-- SELECT
--   p.user_id,
--   u.email,
--   p.company_name,
--   f.key AS badge,
--   (SELECT count(*) FROM public.operator_verification_reviews r
--     WHERE r.operator_id = p.user_id
--       AND r.verification_key = f.key
--       AND r.decision = 'verified')  AS admin_reviews_on_file,
--   CASE WHEN NOT EXISTS (
--          SELECT 1 FROM public.operator_verification_reviews r
--           WHERE r.operator_id = p.user_id
--             AND r.verification_key = f.key
--             AND r.decision = 'verified')
--        THEN 'SUSPECT: badge shown with no admin review behind it'
--        ELSE 'ok: an admin verified this'
--   END AS assessment
-- FROM public.tour_operator_profiles p
-- LEFT JOIN public.users u ON u.id = p.user_id
-- CROSS JOIN LATERAL (
--   VALUES ('businessRegistrationVerified'), ('insuranceVerified'),
--          ('vehicleDocsVerified'), ('guideLicenseVerified')
-- ) AS f(key)
-- WHERE (p.verification_documents ->> f.key) = 'true'
-- ORDER BY admin_reviews_on_file ASC, u.email;


-- =====================================================================
-- ⚠️ A LARGER PROBLEM THIS FILE ONLY PARTLY CONTAINS — READ BEFORE CLOSING THE TAB.
--
-- 20260204215500_fix_permissions.sql:3 grants `ALL ON ALL TABLES IN SCHEMA public TO authenticated`,
-- and nothing ever revokes it at table level. Postgres will not let a column-level REVOKE subtract
-- from that, so EVERY column-level REVOKE in this repo is a silent no-op:
--
--   20260216000001:226-227  packages.status, moderation_reason, moderated_by, moderated_at, deleted_at
--   20260216000001:310-311  tours.status, moderation_reason, moderated_by, moderated_at, deleted_at
--   20260216000001:403-404  {hotel_manager,tour_operator}_profiles.account_status, status_*
--   20260216000001:532      profiles.account_status, status_*
--   20260216000002:62-63    reports.status, status_*
--   20260220000001:47-54    the partner suspension columns
--   20260223000001:36       profiles.partner_type
--
-- The triggers above neutralise this for tour_operator_profiles and hotel_manager_profiles — the
-- two tables can_partner_operate() reads, so the "a suspended partner can PATCH themselves back to
-- active" hole is closed there. THE REST ARE STILL OPEN. On the face of it that means an
-- authenticated user can, on rows RLS already lets them update:
--   * un-moderate or un-delete their own package/tour (packages.status / deleted_at)
--   * flip their own profiles.account_status
--   * change their own profiles.partner_type
--   * close a report about themselves (reports.status)
-- Each needs its own audit before being fixed — tourService/packageService write opaque payloads,
-- so a blunt fix risks breaking publishing, which is why this file does not attempt it.
--
-- The correct repair shape is in-repo at 20260714000001:35 + :52-60: revoke the TABLE-level
-- privilege, then re-grant column-by-column. Or use a BEFORE trigger, as above, which does not
-- depend on grant semantics at all.
--
-- VERIFY THE PREMISE FIRST (read-only). If this returns rows, the column REVOKEs never took:
--   SELECT grantee, privilege_type
--   FROM information_schema.table_privileges
--   WHERE table_schema = 'public'
--     AND table_name   = 'tour_operator_profiles'
--     AND grantee      = 'authenticated'
--     AND privilege_type = 'UPDATE';
--   -- A row here = a TABLE-level UPDATE grant = every column-level REVOKE against it is void.
-- =====================================================================
