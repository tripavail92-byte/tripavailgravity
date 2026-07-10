-- ============================================================================
-- Give every auth user a public.users row, and stop the trigger from ever drifting again.
--
-- WHY THIS EXISTS
--
-- public.tours.operator_id is `NOT NULL REFERENCES public.users(id)` — public.users, not
-- auth.users. That row is created by the on_auth_user_created trigger (20260204214500). If the
-- row is missing for any reason, every tour INSERT fails with 23503 foreign_key_violation:
--
--   insert or update on table "tours" violates foreign key constraint "tours_operator_id_fkey"
--
-- The create-tour wizard autosaves on mount, so an affected operator sees "Save failed" beside
-- the title on a completely empty form, forever, and no amount of retrying can help.
--
-- This is not hypothetical drift: 20260323000008_fix_support_admin_public_user_sync.sql already
-- backfilled public.users for admin accounts that were missing one. This migration does the same
-- for EVERY auth user, not just admins.
--
-- The old handle_new_user() inserts three rows with no ON CONFLICT clause. If any one of them hit
-- a unique violation the whole trigger aborted, and the account was left without its public.users
-- row. Each insert is now individually forgiving.
--
-- ── Diagnostic — run this FIRST; it is read-only and tells you whether this is your bug ────────
--   SELECT au.id, au.email, au.created_at
--   FROM auth.users au
--   LEFT JOIN public.users pu ON pu.id = au.id
--   WHERE pu.id IS NULL
--   ORDER BY au.created_at DESC;
--
--   Any row returned is an account that cannot create a tour, a hotel, or a package. If the
--   operator hitting "Save failed" appears here, this migration fixes them. If the table comes
--   back empty, the foreign key is NOT the cause and this migration is a harmless no-op.
-- ============================================================================

BEGIN;

-- (1) Backfill. Accounts with no email cannot satisfy public.users.email NOT NULL, so they are
--     skipped rather than silently given a fabricated address.
INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data ->> 'full_name',
  au.raw_user_meta_data ->> 'avatar_url',
  COALESCE(au.created_at, TIMEZONE('UTC', NOW())),
  TIMEZONE('UTC', NOW())
FROM auth.users AS au
LEFT JOIN public.users AS pu ON pu.id = au.id
WHERE pu.id IS NULL
  AND au.email IS NOT NULL
ON CONFLICT DO NOTHING;

-- (2) Harden the trigger. Same three inserts, but a conflict on any one of them no longer aborts
--     the whole signup and leaves the account half-created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT DO NOTHING;

  -- Default role: Traveller
  INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
  VALUES (NEW.id, 'traveller', true, 'pending')
  ON CONFLICT DO NOTHING;

  -- Create Traveller Profile
  INSERT INTO public.traveller_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ── Verify after applying: this must return zero rows ────────────────────────
--   SELECT au.id, au.email FROM auth.users au
--   LEFT JOIN public.users pu ON pu.id = au.id
--   WHERE pu.id IS NULL AND au.email IS NOT NULL;
