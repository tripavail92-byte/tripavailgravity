-- ============================================================================
-- Tour Media (Enterprise-style cover image)
-- Date: 2026-03-01
--
-- Adds normalized media rows for tours with a strict single main (cover) image.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.tour_media (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id     uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  url         text NOT NULL,
  storage_path text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_main     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT timezone('UTC', now())
);

CREATE INDEX IF NOT EXISTS tour_media_tour_id_sort_idx
  ON public.tour_media (tour_id, sort_order, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS tour_media_single_main_idx
  ON public.tour_media (tour_id)
  WHERE is_main = true;

ALTER TABLE public.tour_media ENABLE ROW LEVEL SECURITY;

-- Public can view media for published/active tours; operator can view own media.
DROP POLICY IF EXISTS "Public can view tour media" ON public.tour_media;
CREATE POLICY "Public can view tour media"
  ON public.tour_media
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.tours t
      WHERE t.id = tour_media.tour_id
        AND (t.is_published = true OR t.is_active = true OR t.operator_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Operators can manage own tour media" ON public.tour_media;
CREATE POLICY "Operators can manage own tour media"
  ON public.tour_media
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tours t
      WHERE t.id = tour_media.tour_id
        AND t.operator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tours t
      WHERE t.id = tour_media.tour_id
        AND t.operator_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.set_tour_media_main(
  p_tour_id uuid,
  p_media_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tours t
    WHERE t.id = p_tour_id
      AND t.operator_id = v_actor
  ) THEN
    RAISE EXCEPTION 'Not allowed to manage media for this tour';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tour_media tm
    WHERE tm.id = p_media_id
      AND tm.tour_id = p_tour_id
  ) THEN
    RAISE EXCEPTION 'Media item not found for this tour';
  END IF;

  UPDATE public.tour_media
  SET is_main = false
  WHERE tour_id = p_tour_id
    AND is_main = true;

  UPDATE public.tour_media
  SET is_main = true
  WHERE id = p_media_id
    AND tour_id = p_tour_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_tour_media_main(uuid, uuid) TO authenticated;

COMMIT;
