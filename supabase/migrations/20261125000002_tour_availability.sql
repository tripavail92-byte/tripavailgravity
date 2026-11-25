-- Tour availability: fixed departures vs. any date the traveller chooses.
--
-- Many operators sell private tours that run on whatever dates the traveller picks ("Skardu by Air,
-- private, 5 days"). They have no fixed departures, so the departure-based rules (home page shows
-- only trips with a departure ahead; a trip whose dates have all passed is "past") would wrongly
-- treat them as past trips. availability says which kind of trip it is:
--   'scheduled'  — fixed departures in tour_schedules (the default; every existing member tour)
--   'on_request' — runs on dates the traveller chooses; confirmed with the operator
--
-- Additive and backward compatible: existing rows become 'scheduled', which is what they are.

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'scheduled';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_availability_check') THEN
    ALTER TABLE public.tours
      ADD CONSTRAINT tours_availability_check CHECK (availability IN ('scheduled', 'on_request'));
  END IF;
END $$;

-- tours uses column-level SELECT grants for the public roles.
GRANT SELECT (availability) ON public.tours TO anon, authenticated;

COMMENT ON COLUMN public.tours.availability IS
  'scheduled = fixed departures in tour_schedules; on_request = runs on dates the traveller chooses';
