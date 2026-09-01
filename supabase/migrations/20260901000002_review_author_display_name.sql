-- Reviewer names on tour reviews.
--
-- Reviews rendered with a hardcoded "T" avatar and no name, because `profiles` is (correctly)
-- readable only by its owner — a client-side join returns nothing. Rather than widen that policy
-- or add a function that could enumerate users, freeze a DISPLAY NAME on the review itself at
-- submit time. Attack surface stays exactly where it was: whoever can read the review can read
-- the name, and nothing else about the author is exposed.
--
-- Privacy: first name + last initial only ("Sarah M."), never the full surname, email or phone.

ALTER TABLE public.tour_booking_reviews
  ADD COLUMN IF NOT EXISTS reviewer_display_name text;

CREATE OR REPLACE FUNCTION public.set_review_author_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first text;
  v_last  text;
BEGIN
  IF NEW.reviewer_display_name IS NOT NULL AND btrim(NEW.reviewer_display_name) <> '' THEN
    RETURN NEW;
  END IF;

  SELECT NULLIF(btrim(p.first_name), ''), NULLIF(btrim(p.last_name), '')
    INTO v_first, v_last
  FROM public.profiles p
  WHERE p.id = NEW.traveler_id;

  NEW.reviewer_display_name :=
    CASE
      WHEN v_first IS NULL THEN 'Traveller'
      WHEN v_last IS NULL THEN v_first
      ELSE v_first || ' ' || upper(left(v_last, 1)) || '.'
    END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  NEW.reviewer_display_name := COALESCE(NEW.reviewer_display_name, 'Traveller');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_review_author_display_name ON public.tour_booking_reviews;
CREATE TRIGGER trg_set_review_author_display_name
  BEFORE INSERT ON public.tour_booking_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_review_author_display_name();

-- Backfill existing reviews with the same rule.
UPDATE public.tour_booking_reviews r
SET reviewer_display_name = CASE
      WHEN NULLIF(btrim(p.first_name), '') IS NULL THEN 'Traveller'
      WHEN NULLIF(btrim(p.last_name), '')  IS NULL THEN btrim(p.first_name)
      ELSE btrim(p.first_name) || ' ' || upper(left(btrim(p.last_name), 1)) || '.'
    END
FROM public.profiles p
WHERE p.id = r.traveler_id
  AND (r.reviewer_display_name IS NULL OR btrim(r.reviewer_display_name) = '');

UPDATE public.tour_booking_reviews
SET reviewer_display_name = 'Traveller'
WHERE reviewer_display_name IS NULL OR btrim(reviewer_display_name) = '';
