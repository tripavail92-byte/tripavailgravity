-- Self-serve claim for unclaimed operator listings.
--
-- An operator listed from their public website ("Not on TripAvail yet") claims the profile by
-- proving they control the WhatsApp number on that listing: the listing-claim edge function sends
-- a 6-digit code to that number (never to a number the visitor types), and on a correct code hands
-- the listing's account to the claimant's email + password.
--
-- This table only holds the pending codes. Service role only: RLS on with no policies, so neither
-- anon nor authenticated users can read or write it. Codes are stored hashed.

CREATE TABLE IF NOT EXISTS public.listing_claims (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id  uuid NOT NULL REFERENCES public.tour_operator_profiles(user_id) ON DELETE CASCADE,
  code_hash         text NOT NULL,
  sent_to           text NOT NULL,            -- the listing's WhatsApp number at the time of sending
  expires_at        timestamptz NOT NULL,
  attempts          integer NOT NULL DEFAULT 0,
  verified_at       timestamptz,
  claimed_email     text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_claims_operator_created_idx
  ON public.listing_claims (operator_user_id, created_at DESC);

ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.listing_claims FROM anon, authenticated;

COMMENT ON TABLE public.listing_claims IS
  'Pending WhatsApp claim codes for unclaimed operator listings (service role only; codes hashed).';
