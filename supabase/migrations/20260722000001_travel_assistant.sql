-- ============================================================================
-- Travel assistant: rate limiting + a grounding RPC
--
-- Supports an assistant that can ONLY talk about real, published inventory. Two pieces:
--
--   1. assistant_usage — a quota counter. The previous AI endpoint on this project shipped with no
--      rate limit at all and said so in its own footer; an assistant is a far bigger exposure
--      because it is open to logged-out visitors and each turn costs money. Non-negotiable.
--
--   2. assistant_get_listing_facts — the grounding tier. Given a listing the search RPC already
--      returned, hand back the structured facts a model may quote: inclusions, exclusions,
--      requirements, cancellation policy, age limits, itinerary. SECURITY INVOKER, so the existing
--      published-only RLS policies decide what is visible and the assistant can never reach a row
--      a logged-out visitor could not.
--
-- WHAT IS DELIBERATELY NOT EXPOSED: rating and review_count. Both columns default to 0 and nothing
-- in the codebase ever writes them — every real listing therefore has 0.00 and 0. Handing those to
-- a model would invite "rated 0/5" or, worse, an invented number. Reviews exist only for tours
-- (tour_booking_reviews) and every operator was at zero as of the March 2026 calibration, so there
-- is nothing honest to say about ratings yet. When real review volume arrives, add it here.
-- ============================================================================

BEGIN;

-- ── Rate limiting ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assistant_usage (
  id            BIGSERIAL PRIMARY KEY,
  -- Exactly one of these identifies the caller. Signed-in users are limited by id; anonymous
  -- visitors by a salted hash of their IP, never the address itself.
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_hash   TEXT,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
  request_count INTEGER NOT NULL DEFAULT 0,
  token_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assistant_usage_identifies_caller CHECK (
    (user_id IS NOT NULL AND client_hash IS NULL) OR
    (user_id IS NULL AND client_hash IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS assistant_usage_user_window_idx
  ON public.assistant_usage (user_id, window_start) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS assistant_usage_client_window_idx
  ON public.assistant_usage (client_hash, window_start) WHERE client_hash IS NOT NULL;

ALTER TABLE public.assistant_usage ENABLE ROW LEVEL SECURITY;

-- 20260210000012 sets ALTER DEFAULT PRIVILEGES granting ALL to anon+authenticated on every new
-- public table, so this arrives fully writable by the browser. Revoke it: only the edge function,
-- holding service_role, may touch the counter. A quota the client can reset is not a quota.
REVOKE ALL ON public.assistant_usage FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.assistant_usage_id_seq FROM anon, authenticated;

COMMENT ON TABLE public.assistant_usage IS
  'Per-hour request and token counters for the travel assistant. Written only by the edge function via service_role; unreadable and unwritable from the browser.';

/**
 * Claim one request against the caller's hourly quota.
 *
 * Returns TRUE when the request may proceed. SECURITY DEFINER because the edge function's
 * service_role is the only caller and the counter must be unreachable from the client.
 *
 * The INSERT ... ON CONFLICT DO UPDATE is atomic, so two concurrent requests cannot both read
 * "count = limit - 1" and both proceed.
 */
CREATE OR REPLACE FUNCTION public.assistant_claim_request(
  p_user_id     UUID,
  p_client_hash TEXT,
  p_max_per_hour INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ := date_trunc('hour', now());
  v_count  INTEGER;
BEGIN
  IF p_user_id IS NULL AND p_client_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.assistant_usage (user_id, window_start, request_count)
    VALUES (p_user_id, v_window, 1)
    ON CONFLICT (user_id, window_start)
      DO UPDATE SET request_count = public.assistant_usage.request_count + 1
    RETURNING request_count INTO v_count;
  ELSE
    INSERT INTO public.assistant_usage (client_hash, window_start, request_count)
    VALUES (p_client_hash, v_window, 1)
    ON CONFLICT (client_hash, window_start)
      DO UPDATE SET request_count = public.assistant_usage.request_count + 1
    RETURNING request_count INTO v_count;
  END IF;

  RETURN v_count <= p_max_per_hour;
END;
$$;

REVOKE ALL ON FUNCTION public.assistant_claim_request(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;

-- ── Grounding ───────────────────────────────────────────────────────────────

/**
 * Public facts for one published listing, for a model to quote.
 *
 * SECURITY INVOKER on purpose: the caller is the visitor's own JWT (or anon), so the existing
 * "Anyone can view published tours/packages" RLS policies are what decide visibility. An
 * unpublished draft is invisible to the assistant for exactly the same reason it is invisible in
 * search — there is no second access path to get wrong.
 *
 * Returns NULL when the listing does not exist or is not visible, which the caller must treat as
 * "I do not have that" rather than as an invitation to improvise.
 */
CREATE OR REPLACE FUNCTION public.assistant_get_listing_facts(
  p_listing_type TEXT,
  p_listing_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_listing_type = 'tour' THEN
    SELECT to_jsonb(x) INTO v_result
    FROM (
      SELECT
        t.id,
        'tour'                AS listing_type,
        t.title,
        t.short_description,
        t.description,
        t.location,
        t.duration,
        t.price,
        t.currency,
        t.highlights,
        t.inclusions,
        t.exclusions,
        t.requirements,
        t.min_age,
        t.max_age,
        t.difficulty_level,
        t.cancellation_policy,
        t.languages,
        t.min_participants,
        t.max_participants,
        t.itinerary
      FROM public.tours t
      WHERE t.id = p_listing_id
        AND t.is_published = TRUE
        AND t.is_active = TRUE
    ) x;

  ELSIF p_listing_type = 'package' THEN
    SELECT to_jsonb(x) INTO v_result
    FROM (
      SELECT
        p.id,
        'package'             AS listing_type,
        p.name                AS title,
        p.description,
        p.package_type,
        p.currency,
        p.max_guests,
        p.highlights,
        p.inclusions,
        p.exclusions,
        p.cancellation_policy,
        p.payment_terms,
        -- The joined hotel supplies the stay's own house rules and location.
        h.name                AS hotel_name,
        h.city,
        h.country,
        h.amenities,
        h.policies
      FROM public.packages p
      LEFT JOIN public.hotels h ON h.id = p.hotel_id
      WHERE p.id = p_listing_id
        AND p.is_published = TRUE
    ) x;

  ELSE
    RETURN NULL;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.assistant_get_listing_facts(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assistant_get_listing_facts(TEXT, UUID) TO anon, authenticated;

COMMENT ON FUNCTION public.assistant_get_listing_facts(TEXT, UUID) IS
  'Structured public facts for one published listing, used to ground assistant answers. SECURITY INVOKER so RLS decides visibility. Deliberately excludes rating/review_count, which are always 0 and would be misleading.';

COMMIT;

-- ============================================================================
-- Verify (safe, read-only):
--
--   -- should return facts for any published tour
--   SELECT public.assistant_get_listing_facts('tour', id) FROM public.tours
--   WHERE is_published AND is_active LIMIT 1;
--
--   -- should return NULL (unpublished is invisible to the assistant, as it is to search)
--   SELECT public.assistant_get_listing_facts('tour', id) FROM public.tours
--   WHERE is_published = FALSE LIMIT 1;
--
--   -- the quota table must be unreadable from the browser; run as anon:
--   SELECT * FROM public.assistant_usage;   -- expect: permission denied
-- ============================================================================
