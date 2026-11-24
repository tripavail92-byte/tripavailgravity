-- Listings from tour operators who have not joined TripAvail yet (Growth Engine).
--
-- The Growth Engine reads trips from operators' own websites and Facebook pages and lists them on
-- TripAvail under an UNCLAIMED operator profile (a placeholder account that cannot log in). Those
-- trips are not bookable through TripAvail: travellers enquire with the operator on WhatsApp.
-- When the operator claims the profile, the account becomes theirs.
--
-- This migration adds only what that needs, and keeps every existing rule intact for members:
--   1. tour_operator_profiles: listing_status ('member' | 'unclaimed'), public WhatsApp, website,
--      where the listing came from, when it was claimed.
--   2. tours: booking_mode ('instant' | 'enquiry'), price_on_request, source, source_url.
--   3. Client roles can never set those columns (an operator cannot mark their own trips as
--      'enquiry' to dodge publish limits, or mark a profile 'unclaimed'). Only service_role / admins.
--   4. The monthly publish limit skips enquiry trips of UNCLAIMED operators only: they are not sold
--      through TripAvail, so they don't use a paid slot. Members are unaffected.
--   5. operator_public_listing_v: the public contact fields for unclaimed profiles.
--   6. operator_storefront_events accepts 'whatsapp_click' and 'claim_click'.

BEGIN;

-- 1. Profile columns ---------------------------------------------------------------------------
ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS listing_status     text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS public_whatsapp    text,
  ADD COLUMN IF NOT EXISTS website_url        text,
  ADD COLUMN IF NOT EXISTS listing_source     text,
  ADD COLUMN IF NOT EXISTS listing_source_url text,
  ADD COLUMN IF NOT EXISTS claimed_at         timestamptz;

DO $$ BEGIN
  ALTER TABLE public.tour_operator_profiles
    ADD CONSTRAINT tour_operator_profiles_listing_status_check CHECK (listing_status IN ('member', 'unclaimed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS tour_operator_profiles_listing_source_url_uniq
  ON public.tour_operator_profiles (listing_source_url) WHERE listing_source_url IS NOT NULL;

-- 2. Tour columns ------------------------------------------------------------------------------
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS booking_mode      text NOT NULL DEFAULT 'instant',
  ADD COLUMN IF NOT EXISTS price_on_request  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source            text,
  ADD COLUMN IF NOT EXISTS source_url        text,
  ADD COLUMN IF NOT EXISTS source_checked_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.tours
    ADD CONSTRAINT tours_booking_mode_check CHECK (booking_mode IN ('instant', 'enquiry'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS tours_source_url_uniq ON public.tours (source_url) WHERE source_url IS NOT NULL;

-- Readable wherever the rest of a live tour is (harmless if a table-wide grant already covers it).
GRANT SELECT (booking_mode, price_on_request, source, source_url, source_checked_at) ON public.tours TO anon, authenticated;

-- 3. Only the platform writes listing provenance -------------------------------------------------
CREATE OR REPLACE FUNCTION public.listing_provenance_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Same test as admin_column_guard: service_role and SECURITY DEFINER functions pass.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF v_uid IS NOT NULL THEN
    IF public.is_admin(v_uid) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'tours' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.booking_mode      := OLD.booking_mode;
      NEW.source            := OLD.source;
      NEW.source_url        := OLD.source_url;
      NEW.source_checked_at := OLD.source_checked_at;
    ELSE
      NEW.booking_mode      := 'instant';
      NEW.source            := NULL;
      NEW.source_url        := NULL;
      NEW.source_checked_at := NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'tour_operator_profiles' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.listing_status     := OLD.listing_status;
      NEW.listing_source     := OLD.listing_source;
      NEW.listing_source_url := OLD.listing_source_url;
      NEW.claimed_at         := OLD.claimed_at;
    ELSE
      NEW.listing_status     := 'member';
      NEW.listing_source     := NULL;
      NEW.listing_source_url := NULL;
      NEW.claimed_at         := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tours_listing_provenance_guard ON public.tours;
CREATE TRIGGER tours_listing_provenance_guard
  BEFORE INSERT OR UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.listing_provenance_guard();

DROP TRIGGER IF EXISTS tour_operator_profiles_listing_provenance_guard ON public.tour_operator_profiles;
CREATE TRIGGER tour_operator_profiles_listing_provenance_guard
  BEFORE INSERT OR UPDATE ON public.tour_operator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.listing_provenance_guard();

-- 4. Publish limit: enquiry trips of unclaimed operators don't use a paid slot ------------------
-- Body identical to the live function except the early return marked NEW.
CREATE OR REPLACE FUNCTION public.enforce_operator_publish_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_becoming_published BOOLEAN := FALSE;
  v_cycle_start DATE;
  v_cycle_end DATE;
  v_tier_code public.membership_tier_code_enum;
  v_monthly_publish_limit INTEGER := 0;
  v_used_publish_slots INTEGER := 0;
BEGIN
  IF NEW.operator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- NEW: listings of operators who haven't joined are WhatsApp enquiries, not TripAvail sales.
  -- Both columns are guarded (listing_provenance_guard), so a member cannot opt into this.
  IF NEW.booking_mode = 'enquiry' AND EXISTS (
    SELECT 1 FROM public.tour_operator_profiles
    WHERE user_id = NEW.operator_id AND listing_status = 'unclaimed'
  ) THEN
    IF NEW.approved_at IS NULL AND (COALESCE(NEW.is_published, FALSE) OR COALESCE(NEW.is_active, FALSE)) THEN
      NEW.approved_at := TIMEZONE('UTC', NOW());
    END IF;
    RETURN NEW;
  END IF;

  v_becoming_published :=
    (COALESCE(NEW.is_published, FALSE) = TRUE OR COALESCE(NEW.is_active, FALSE) = TRUE)
    AND (
      TG_OP = 'INSERT'
      OR NOT (COALESCE(OLD.is_published, FALSE) = TRUE OR COALESCE(OLD.is_active, FALSE) = TRUE)
    );

  IF NOT v_becoming_published THEN
    RETURN NEW;
  END IF;

  PERFORM public.provision_operator_commercial_profile(NEW.operator_id);

  SELECT
    profile.current_cycle_start,
    profile.current_cycle_end,
    profile.membership_tier_code,
    tier.monthly_publish_limit
  INTO
    v_cycle_start,
    v_cycle_end,
    v_tier_code,
    v_monthly_publish_limit
  FROM public.operator_commercial_profiles AS profile
  INNER JOIN public.commercial_membership_tiers AS tier
    ON tier.code = profile.membership_tier_code
  WHERE profile.operator_user_id = NEW.operator_id;

  SELECT COUNT(*)
  INTO v_used_publish_slots
  FROM public.tours AS tour
  WHERE tour.operator_id = NEW.operator_id
    AND (COALESCE(tour.is_published, FALSE) = TRUE OR COALESCE(tour.is_active, FALSE) = TRUE)
    AND COALESCE(tour.approved_at, tour.created_at, TIMEZONE('UTC', NOW()))::DATE BETWEEN v_cycle_start AND v_cycle_end
    AND (TG_OP = 'INSERT' OR tour.id <> NEW.id);

  IF v_used_publish_slots >= v_monthly_publish_limit THEN
    RAISE EXCEPTION USING
      MESSAGE = 'PUBLISH_LIMIT_REACHED',
      DETAIL = FORMAT(
        'You have reached the maximum number of published trips for your %s membership tier. Used %s of %s slots in the current billing cycle.',
        INITCAP(v_tier_code::TEXT),
        v_used_publish_slots,
        v_monthly_publish_limit
      ),
      HINT = 'Upgrade the operator tier, unpublish an existing trip, or wait until the next billing cycle.',
      ERRCODE = 'P0001';
  END IF;

  IF NEW.approved_at IS NULL THEN
    NEW.approved_at := TIMEZONE('UTC', NOW());
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Public contact fields for listings (no personal data: business WhatsApp + website only) ----
CREATE OR REPLACE VIEW public.operator_public_listing_v AS
SELECT
  p.user_id,
  p.slug,
  p.listing_status,
  p.public_whatsapp,
  p.website_url,
  p.listing_source
FROM public.tour_operator_profiles p
WHERE p.is_public = true;

GRANT SELECT ON public.operator_public_listing_v TO anon, authenticated;

-- 6. Analytics events for enquiries -------------------------------------------------------------
ALTER TABLE public.operator_storefront_events DROP CONSTRAINT IF EXISTS operator_storefront_events_event_type_check;
ALTER TABLE public.operator_storefront_events
  ADD CONSTRAINT operator_storefront_events_event_type_check
  CHECK (event_type = ANY (ARRAY['profile_view', 'cta_click', 'tour_click', 'booking_start', 'whatsapp_click', 'claim_click']));

-- The RPC the site calls has its own allow-list; same body otherwise.
CREATE OR REPLACE FUNCTION public.record_operator_storefront_event(p_operator_id uuid, p_event_type text, p_slug text DEFAULT NULL::text, p_tour_id uuid DEFAULT NULL::uuid, p_session_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_operator_id IS NULL THEN
    RAISE EXCEPTION 'operator id is required';
  END IF;

  IF p_event_type NOT IN ('profile_view', 'cta_click', 'tour_click', 'booking_start', 'whatsapp_click', 'claim_click') THEN
    RAISE EXCEPTION 'invalid storefront event type';
  END IF;

  INSERT INTO public.operator_storefront_events (
    operator_id,
    event_type,
    slug,
    tour_id,
    visitor_user_id,
    session_id,
    metadata
  )
  VALUES (
    p_operator_id,
    p_event_type,
    NULLIF(trim(COALESCE(p_slug, '')), ''),
    p_tour_id,
    auth.uid(),
    NULLIF(trim(COALESCE(p_session_id, '')), ''),
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';
