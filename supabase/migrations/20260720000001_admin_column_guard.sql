-- =====================================================================
-- SECURITY: close the grant hole on packages, tours, profiles, reports.
--
-- CONFIRMED LIVE (read-only query against production):
--     GRANT HOLE -> REAL — partner-writable: tours, reports, profiles, packages
--
-- WHY: 20260204215500_fix_permissions.sql:3 runs
--     GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- and nothing ever revokes it at table level. PostgreSQL cannot subtract a COLUMN-level privilege
-- from a TABLE-level grant — the REVOKE emits a WARNING, the migration COMMITs, and the privilege
-- survives. So every `REVOKE UPDATE (col, ...)` in this repo is a silent no-op and has been since
-- February: 20260216000001:226-227 (packages), :310-311 (tours), :532 (profiles),
-- 20260216000002:62-63 (reports), 20260223000001:36 (partner_type).
--
-- Consequence today: on any row RLS already lets them touch, an authenticated user can write
-- admin-only columns — un-moderate or undelete their own listing, forge the admin attribution on
-- their own suspension, mark themselves email-verified, or file a report pre-set to 'resolved'.
--
-- WHY TRIGGERS AND NOT A GRANT FIX: the correct grant repair (revoke table-level UPDATE, then
-- re-GRANT column-by-column) means enumerating every writable column of four tables and silently
-- breaking any column added later. A BEFORE trigger does not care about grant semantics at all —
-- it sees the row being written and puts the protected values back. Same pattern proven in
-- 20260717000007_partner_profile_trust_guard.sql.
--
-- SCOPING NOTE — the asymmetry that shaped every decision below. A MISSING pin leaves a hole; a
-- WRONG pin BREAKS PRODUCTION (publishing, onboarding, report filing). The second is worse, so
-- columns that were genuinely uncertain are left UNPINNED and listed at the bottom rather than
-- risked. In particular these are deliberately NOT pinned:
--   packages.is_published  — the partner's publish switch; both publish paths set it, and the
--                            public-read policy keys on it. Pinning kills publishing outright.
--   tours.workflow_status  — drives the whole create-tour wizard (draft/in_progress/submitted).
--   profiles.phone_verified— the edge-function write is conditional; a pin silently regresses
--                            operator OTP onboarding. Pin only after that write is made unconditional.
--   *.search_vector        — GENERATED ALWAYS AS ... STORED. It is not referenced ANYWHERE below,
--                            deliberately: ANY assignment, even NEW.x := OLD.x, raises 428C9 and
--                            takes down every INSERT and UPDATE on the table.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_column_guard()
RETURNS trigger
LANGUAGE plpgsql
-- INVOKER, not DEFINER — non-negotiable. A SECURITY DEFINER function reads its OWN owner as
-- current_user, which would make the discriminator below always true and this guard a no-op.
-- It is also why the test is current_user and not request_jwt_role(): SECURITY DEFINER changes the
-- DB role but NOT request.jwt.claims, so a JWT test would read 'authenticated' inside every admin
-- RPC and pin away the legitimate server writes.
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- Only the client roles are guarded. Every legitimate writer of every column below reaches it as
  -- some other role: a SECURITY DEFINER function executes as its owner (postgres), and the worker
  -- and edge functions connect as service_role. Verified for all four tables — no per-table
  -- exemption is needed anywhere.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- An admin writing a row directly rather than through an RPC.
  -- Nested, not `v_uid IS NOT NULL AND is_admin(v_uid)`: SQL does not promise to short-circuit AND,
  -- and is_admin's EXECUTE is REVOKEd from anon (20260710000002:26), so evaluating it as anon would
  -- be a permission error rather than false.
  IF v_uid IS NOT NULL THEN
    IF public.is_admin(v_uid) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- ── public.packages ──────────────────────────────────────────────────────
  IF TG_TABLE_NAME = 'packages' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.status            := OLD.status;
      NEW.moderation_reason := OLD.moderation_reason;
      NEW.moderated_by      := OLD.moderated_by;
      NEW.moderated_at      := OLD.moderated_at;
      NEW.deleted_at        := OLD.deleted_at;
      NEW.created_at        := OLD.created_at;
      -- owner_id: the UPDATE policy is USING-only with NO WITH CHECK
      -- (20260208000001:80), so today a partner can hand their listing to another account.
      NEW.owner_id          := OLD.owner_id;
      NEW.id                := OLD.id;
    ELSE
      -- INSERT. owner_id and id are deliberately untouched: the INSERT WITH CHECK requires
      -- owner_id = auth.uid(), and id needs its gen_random_uuid() default.
      NEW.status            := 'live';   -- NOT NULL DEFAULT 'live' — never NULL it
      NEW.moderation_reason := NULL;
      NEW.moderated_by      := NULL;
      NEW.moderated_at      := NULL;
      NEW.deleted_at        := NULL;
      -- created_at is forced because the exploit here is INSERT-side: the public feeds order by
      -- created_at DESC, so a future-dated insert pins a listing to the top of the homepage.
      NEW.created_at        := NOW();
    END IF;
    RETURN NEW;
  END IF;

  -- ── public.tours ─────────────────────────────────────────────────────────
  IF TG_TABLE_NAME = 'tours' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.status            := OLD.status;
      NEW.moderation_reason := OLD.moderation_reason;
      NEW.moderated_by      := OLD.moderated_by;
      NEW.moderated_at      := OLD.moderated_at;
      NEW.deleted_at        := OLD.deleted_at;
      NEW.is_verified       := OLD.is_verified;   -- traveller-facing trust badge
      NEW.is_featured       := OLD.is_featured;   -- drives marketplace search rank
      NEW.rating            := OLD.rating;        -- owned by sync_tour_rating_aggregate (DEFINER)
      NEW.review_count      := OLD.review_count;  -- same
      NEW.created_at        := OLD.created_at;
      -- approved_at anchors the tier publish quota's billing cycle. Pinned to OLD; when OLD is NULL
      -- the enforce trigger re-stamps it — which is exactly today's behaviour. See the trigger-name
      -- note below: ordering makes this safe.
      NEW.approved_at       := OLD.approved_at;
    ELSE
      -- INSERT. NOTE the values, not blanket NULLs: status is NOT NULL DEFAULT 'live' and
      -- rating/review_count are NOT NULL DEFAULT 0. Copying 20260717000007's all-NULL INSERT shape
      -- literally would break tour creation.
      NEW.status            := 'live';
      NEW.moderation_reason := NULL;
      NEW.moderated_by      := NULL;
      NEW.moderated_at      := NULL;
      NEW.deleted_at        := NULL;
      NEW.is_verified       := FALSE;
      NEW.is_featured       := FALSE;
      NEW.rating            := 0;
      NEW.review_count      := 0;
      NEW.created_at        := NOW();
      -- NULL on insert: the enforce trigger stamps it only when the row actually becomes published,
      -- so drafts correctly keep NULL.
      NEW.approved_at       := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- ── public.profiles ──────────────────────────────────────────────────────
  -- The INSERT arm is a LIVE user-facing path: handle_new_user() does not create profiles rows, so
  -- the row is created lazily by a client .upsert(onConflict:'id'). Postgres runs BEFORE INSERT on
  -- the attempt and BEFORE UPDATE on the conflict, so both arms must be correct in one statement.
  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.account_status    := OLD.account_status;
      NEW.status_reason     := OLD.status_reason;
      NEW.status_updated_by := OLD.status_updated_by;  -- forgeable admin attribution today
      NEW.status_updated_at := OLD.status_updated_at;
      NEW.partner_type      := OLD.partner_type;       -- write-once; owned by switch_user_role
      NEW.email_verified    := OLD.email_verified;     -- gates release of traveller email to operators
      NEW.created_at        := OLD.created_at;
      NEW.id                := OLD.id;
    ELSE
      -- INSERT. account_status is deliberately untouched so its NOT NULL DEFAULT 'active' applies;
      -- email and id are untouched (email is NOT NULL with no default, and the upsert matches on id).
      NEW.status_reason     := NULL;
      NEW.status_updated_by := NULL;
      NEW.status_updated_at := NULL;
      NEW.email_verified    := FALSE;
      NEW.created_at        := NOW();
      -- partner_type left alone: switch_user_role (DEFINER, exempt above) owns it, and a fresh
      -- client-created profile legitimately carries whatever the signup flow set.
    END IF;
    RETURN NEW;
  END IF;

  -- ── public.reports ───────────────────────────────────────────────────────
  -- THE INSERT ARM IS THE LIVE FIX HERE, opposite of the other three: RLS already has no UPDATE
  -- policy on reports (20260216000002 defines INSERT + two SELECTs only), so the reachable hole is
  -- filing a report pre-set to 'resolved' with a real admin's uid stamped on it.
  IF TG_TABLE_NAME = 'reports' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.status            := OLD.status;
      NEW.status_reason     := OLD.status_reason;
      NEW.status_updated_by := OLD.status_updated_by;
      NEW.status_updated_at := OLD.status_updated_at;
      NEW.created_at        := OLD.created_at;
      NEW.reporter_id       := OLD.reporter_id;  -- authorship must not be reassignable
      NEW.id                := OLD.id;
    ELSE
      -- INSERT. reporter_id is untouched — the RLS WITH CHECK requires reporter_id = auth.uid() and
      -- BEFORE triggers run before WITH CHECK, so blanking it would fail every submission.
      -- report_reason / target_entity_* / details are the reporter's own content and NOT NULL;
      -- touching them would break report filing outright.
      NEW.status            := 'open';   -- NOT NULL DEFAULT 'open'
      NEW.status_reason     := NULL;
      NEW.status_updated_by := NULL;
      NEW.status_updated_at := NULL;
      NEW.created_at        := NOW();
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Triggers ────────────────────────────────────────────────────────────────
-- NO `UPDATE OF <column>` CLAUSE, deliberately. A column-scoped trigger only fires when that column
-- appears in the SET list, so a PATCH that omits it would skip the guard entirely. (That is exactly
-- the latent weakness in tours_enforce_operator_publish_limit — noted at the bottom.)
--
-- TRIGGER NAME IS LOAD-BEARING ON tours. BEFORE-row triggers fire in alphabetical name order, and
-- the guard must sort BEFORE tours_enforce_operator_publish_limit so that trigger can re-stamp the
-- approved_at this guard just pinned. 'tours_admin_column_guard' gives a < e — correct. A name like
-- tours_zz_guard would sort after, leave approved_at NULL forever, and silently degrade the tier
-- publish quota to its created_at fallback.
DROP TRIGGER IF EXISTS packages_admin_column_guard ON public.packages;
CREATE TRIGGER packages_admin_column_guard
  BEFORE INSERT OR UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.admin_column_guard();

DROP TRIGGER IF EXISTS tours_admin_column_guard ON public.tours;
CREATE TRIGGER tours_admin_column_guard
  BEFORE INSERT OR UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.admin_column_guard();

DROP TRIGGER IF EXISTS profiles_admin_column_guard ON public.profiles;
CREATE TRIGGER profiles_admin_column_guard
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.admin_column_guard();

DROP TRIGGER IF EXISTS reports_admin_column_guard ON public.reports;
CREATE TRIGGER reports_admin_column_guard
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.admin_column_guard();

REVOKE ALL ON FUNCTION public.admin_column_guard() FROM PUBLIC;

COMMIT;


-- ---------------------------------------------------------------------
-- VERIFY IT TOOK (read-only). Expect 4 rows.
-- ---------------------------------------------------------------------
-- SELECT c.relname AS table_name, t.tgname AS trigger_name
-- FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
-- WHERE t.tgname LIKE '%_admin_column_guard' AND NOT t.tgisinternal
-- ORDER BY c.relname;
--
-- And confirm nothing regressed — these should all still work as a normal partner:
--   * publish a package  (is_published is untouched)
--   * create/edit a tour (workflow_status untouched)
--   * save a profile     (email / names / avatar untouched)
--   * file a report      (report_reason / target_* / details untouched)


-- ---------------------------------------------------------------------
-- ⚠️ FROZEN FORGERIES — an owner decision, NOT closed by this migration.
--
-- tours.is_verified, tours.is_featured and profiles.email_verified have NO in-app server author
-- today. Pinning them stops NEW forgeries but FREEZES any value a partner already set, with no
-- application path to clear it. (This is the same trap kycVerifiedAt hit in 20260717000007.)
-- Run this first to see whether anything needs resetting — expect zero rows:
--
-- SELECT 'tour flagged verified/featured' AS finding, t.id, t.title,
--        t.is_verified, t.is_featured
-- FROM public.tours t
-- WHERE t.is_verified = TRUE OR t.is_featured = TRUE
-- UNION ALL
-- SELECT 'profile self-marked email_verified', p.id::text, p.email, p.email_verified, NULL
-- FROM public.profiles p
-- WHERE p.email_verified = TRUE;
--
-- Legitimate values are possible here (an admin may have set them by hand, and email_verified may
-- have been set by an older flow), so review rather than mass-reset. To clear a specific forgery:
--   UPDATE public.tours SET is_verified = FALSE, is_featured = FALSE WHERE id = '<id>';
-- (run as postgres/service_role — the guard exempts them).
--
-- ---------------------------------------------------------------------
-- NOT CLOSED BY THIS MIGRATION — each deserves its own ticket:
--   1. packages UPDATE policy is USING-only with no WITH CHECK (20260208000001:80). Pinning
--      owner_id closes ownership transfer in practice, but the policy should carry
--      WITH CHECK (auth.uid() = owner_id) as defence in depth.
--   2. The packages public-read policy checks only is_published (20260208000001:88) and does not
--      exclude status IN ('hidden','suspended','deleted'). App queries gate on status, but a direct
--      PostgREST select bypasses that, so an admin-hidden package stays publicly readable.
--   3. tours_enforce_operator_publish_limit is declared BEFORE INSERT OR UPDATE OF is_published,
--      is_active, approved_at (20260315000023:167) — the same column-scoped pattern this migration
--      avoids — so a PATCH omitting all three skips the tier publish cap entirely.
--   4. profiles.phone_verified stays unpinned until the verify-phone-otp edge write is made
--      unconditional and the client fallback at userProfileService.ts:190-192 is removed.
--   5. profiles.account_status is enforcement-inert — nothing in RLS or any guard reads it
--      (can_partner_operate reads user_roles + the partner profile tables). Pinning it buys audit
--      integrity, not a live privilege fix.
-- ---------------------------------------------------------------------
