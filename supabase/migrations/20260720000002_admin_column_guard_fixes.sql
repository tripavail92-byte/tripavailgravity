-- =====================================================================
-- Fixes to admin_column_guard (20260720000001), from its adversarial review.
-- 11 findings raised, 6 confirmed. Three are code defects; the rest were documentation.
--
-- 1. profiles.partner_type was left unpinned on INSERT, justified in the original with
--    "a fresh client-created profile legitimately carries whatever the signup flow set."
--    THAT COMMENT WAS FACTUALLY WRONG — I did not verify it. No client path anywhere writes
--    profiles.partner_type: userProfileService's upsert payload is {id, ...UpdateProfileData,
--    email, updated_at} and UpdateProfileData has no such field. The only writers are
--    switch_user_role and admin_override_partner_type, both SECURITY DEFINER and therefore exempt.
--    Because handle_new_user() does NOT create the profiles row (20260710000005:63-87 makes only
--    users / user_roles / traveller_profiles), the client upsert is a genuine INSERT — so a user
--    could self-assign partner_type at profile creation, bypassing the write-once governance
--    20260223000001 exists to enforce. The UPDATE pin then froze that value permanently.
--    NOT privilege escalation: partner_type confers nothing on its own — capability comes from
--    user_roles, which only switch_user_role writes, under its own opposite-role check. The real
--    consequence is a user locking themselves out of the other partner type, recoverable now only
--    by an admin. Governance integrity, not a privilege boundary.
--
-- 2. profiles.account_status was likewise unpinned on INSERT, so a client-created profile could
--    start in a non-default state. Forced to 'active' (the column default) — NOT NULL, so it must
--    be the literal, never NULL.
--
-- 3. tours.id was pinned nowhere, while packages/profiles/reports all pin it. Added for symmetry.
--
-- Deliberately NOT changed:
--   * The contested claim that pinning approved_at lets a re-published tour skip the billing-cycle
--     quota. I checked: tours_enforce_operator_publish_limit only stamps when NEW.approved_at IS
--     NULL (20260315000023:130-132), and an UPDATE that does not mention approved_at already
--     carries the old non-NULL value forward. So the guard changes nothing here — the behaviour is
--     identical with or without it. (1/3 reviewers, and I believe they were wrong.)
--   * email_verified stays pinned rather than forced FALSE. Forcing it would silently un-verify
--     every legitimately verified user on their next profile save.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_column_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

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
      NEW.owner_id          := OLD.owner_id;
      NEW.id                := OLD.id;
    ELSE
      NEW.status            := 'live';
      NEW.moderation_reason := NULL;
      NEW.moderated_by      := NULL;
      NEW.moderated_at      := NULL;
      NEW.deleted_at        := NULL;
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
      NEW.is_verified       := OLD.is_verified;
      NEW.is_featured       := OLD.is_featured;
      NEW.rating            := OLD.rating;
      NEW.review_count      := OLD.review_count;
      NEW.created_at        := OLD.created_at;
      NEW.approved_at       := OLD.approved_at;
      NEW.id                := OLD.id;   -- FIX 3: was missing; the other three tables pin it
    ELSE
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
      NEW.approved_at       := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- ── public.profiles ──────────────────────────────────────────────────────
  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.account_status    := OLD.account_status;
      NEW.status_reason     := OLD.status_reason;
      NEW.status_updated_by := OLD.status_updated_by;
      NEW.status_updated_at := OLD.status_updated_at;
      NEW.partner_type      := OLD.partner_type;
      NEW.email_verified    := OLD.email_verified;
      NEW.created_at        := OLD.created_at;
      NEW.id                := OLD.id;
    ELSE
      NEW.status_reason     := NULL;
      NEW.status_updated_by := NULL;
      NEW.status_updated_at := NULL;
      NEW.email_verified    := FALSE;
      NEW.created_at        := NOW();
      -- FIX 1: a client-created profile must not arrive with a partner_type already asserted.
      -- switch_user_role (SECURITY DEFINER, exempt above) remains the sole writer and still sets it
      -- on first partner selection, so nothing legitimate regresses.
      NEW.partner_type      := NULL;
      -- FIX 2: force the column default rather than trusting the caller. Literal, not NULL —
      -- account_status is NOT NULL DEFAULT 'active'.
      NEW.account_status    := 'active';
      -- email and id stay untouched: email is NOT NULL with no default, and the upsert matches on id.
    END IF;
    RETURN NEW;
  END IF;

  -- ── public.reports ───────────────────────────────────────────────────────
  -- NOTE the UPDATE arm here is defence-in-depth, not a live fix: reports has no UPDATE policy at
  -- all (20260216000002 defines INSERT + two SELECTs), so no client UPDATE is reachable today. It
  -- exists so a future UPDATE policy cannot silently reopen this. The INSERT arm is the real fix.
  IF TG_TABLE_NAME = 'reports' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.status            := OLD.status;
      NEW.status_reason     := OLD.status_reason;
      NEW.status_updated_by := OLD.status_updated_by;
      NEW.status_updated_at := OLD.status_updated_at;
      NEW.created_at        := OLD.created_at;
      NEW.reporter_id       := OLD.reporter_id;
      NEW.id                := OLD.id;
    ELSE
      NEW.status            := 'open';
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

COMMIT;


-- ---------------------------------------------------------------------
-- RUN THIS FIRST (read-only): accounts poisoned before FIX 1 landed.
--
-- A partner_type with no matching user_roles row was NOT set by switch_user_role — it was either
-- self-asserted through the hole this fixes, or is left over from an older flow. Expect zero rows.
-- Clear any hits as postgres/service_role BEFORE relying on the UPDATE pin, because after this the
-- value is frozen for the user.
-- ---------------------------------------------------------------------
-- SELECT p.id, p.email, p.partner_type, p.created_at
-- FROM public.profiles p
-- LEFT JOIN public.user_roles ur
--   ON ur.user_id = p.id AND ur.role_type = p.partner_type
-- WHERE p.partner_type IS NOT NULL
--   AND ur.user_id IS NULL;
--
-- To clear one:  UPDATE public.profiles SET partner_type = NULL WHERE id = '<id>';


-- ---------------------------------------------------------------------
-- ⚠️ SEPARATE FINDING — NOT FIXED HERE, NEEDS ITS OWN MIGRATION.
--
-- package_bookings / tour_bookings carry the SAME table-level grant exposure, and the columns are
-- financial: a traveller can UPDATE their own booking row and set payment_status = 'paid',
-- paid_at, stripe_payment_intent_id, payment_metadata, total_price or price_per_night. Confirmed
-- 3/3 by review. That is a materially worse class than anything in this migration — it is money,
-- not metadata — and it deserves its own scoping pass over the booking/payment write paths
-- (Stripe webhooks, create_*_booking_atomic RPCs, the traveller's own cancel flow) before pinning,
-- because a wrong pin there breaks checkout.
--
-- Detection (read-only) — bookings marked paid with no Stripe payment intent recorded:
--   SELECT id, traveler_id, payment_status, total_price, paid_at, stripe_payment_intent_id
--   FROM public.package_bookings
--   WHERE payment_status = 'paid' AND stripe_payment_intent_id IS NULL
--   ORDER BY paid_at DESC NULLS LAST;
--   -- and the same over public.tour_bookings.
--
-- ALSO NOT CLOSED (documentation corrections to 20260720000001's footer):
--   * The public-read policies on BOTH packages and tours check only is_published / is_active and
--     do not exclude status IN ('hidden','suspended','deleted') or deleted_at IS NOT NULL. App
--     queries filter on status, but a direct PostgREST select does not, so an admin-hidden listing
--     stays publicly readable. Pinning status is still worth having for audit integrity, but it is
--     not what makes moderation effective.
--   * The frozen-forgery pre-flight in 20260720000001 UNIONs uuid against text and fails as
--     written. Corrected form:
--       SELECT 'tour' AS finding, t.id::text, t.title, t.is_verified::text, t.is_featured::text
--       FROM public.tours t WHERE t.is_verified OR t.is_featured
--       UNION ALL
--       SELECT 'profile', p.id::text, p.email, p.email_verified::text, NULL
--       FROM public.profiles p WHERE p.email_verified;
-- ---------------------------------------------------------------------
