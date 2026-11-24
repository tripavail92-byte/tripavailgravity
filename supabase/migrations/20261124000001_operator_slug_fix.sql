-- Operator URLs: fix the slug generator, rename placeholder/mangled slugs, keep old links working.
--
-- THE BUG. assign_operator_slug() ran regexp_replace(name, '[^a-z0-9]+', '-') BEFORE lower(), so
-- every capital letter counted as "not a-z" and became a dash: "Test Operator" -> "est-perator",
-- "Phase 6 Operator QA Co." -> "hase-6-perator-o". And because a slug is only assigned while it is
-- NULL, operators who added their business name after sign-up kept the placeholder "operator-8"
-- for good. Five of the seven operators with live tours have placeholder URLs today.
--
-- THE FIX. One slug function, lowercase first. Placeholder slugs (operator, operator-N) and slugs
-- produced by the old bug are renamed from the business name. Every rename is recorded in
-- operator_slug_redirects so the server can answer the old URL with a 301 to the new one.
-- Slugs that are already correct ("mian-tours", "northern-summit-expeditions") are not touched.

BEGIN;

CREATE OR REPLACE FUNCTION public.slugify_operator_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    trim(both '-' from regexp_replace(regexp_replace(lower(coalesce(p_name, '')), '[^a-z0-9]+', '-', 'g'), '-+', '-', 'g')),
    ''
  )
$$;

CREATE OR REPLACE FUNCTION public.assign_operator_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_cnt  INT := 1;
BEGIN
  IF NEW.slug IS NULL THEN
    v_base := coalesce(
      public.slugify_operator_name(NULLIF(trim(NEW.business_name), '')),
      public.slugify_operator_name(NULLIF(trim(NEW.company_name), '')),
      'operator'
    );
    v_slug := v_base;
    WHILE EXISTS (SELECT 1 FROM public.tour_operator_profiles WHERE slug = v_slug AND user_id <> NEW.user_id) LOOP
      v_slug := v_base || '-' || v_cnt;
      v_cnt  := v_cnt + 1;
    END LOOP;
    NEW.slug := v_slug;
  END IF;
  RETURN NEW;
END;
$$;

-- Old URL -> current URL. Readable by anyone: it holds nothing but public slugs.
CREATE TABLE IF NOT EXISTS public.operator_slug_redirects (
  old_slug   text PRIMARY KEY,
  new_slug   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_slug_redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_operator_slug_redirects" ON public.operator_slug_redirects;
CREATE POLICY "public_read_operator_slug_redirects" ON public.operator_slug_redirects FOR SELECT USING (true);
GRANT SELECT ON public.operator_slug_redirects TO anon, authenticated;

DO $$
DECLARE
  r       RECORD;
  v_base  TEXT;
  v_buggy TEXT;
  v_slug  TEXT;
  v_cnt   INT;
BEGIN
  FOR r IN
    SELECT user_id, slug, coalesce(NULLIF(trim(business_name), ''), NULLIF(trim(company_name), '')) AS nm
    FROM public.tour_operator_profiles
  LOOP
    v_base := public.slugify_operator_name(r.nm);
    CONTINUE WHEN v_base IS NULL OR r.slug = v_base OR r.slug LIKE v_base || '-%';

    -- What the old generator would have produced for this name.
    v_buggy := trim(both '-' from regexp_replace(lower(regexp_replace(trim(r.nm), '[^a-z0-9]+', '-', 'g')), '-+', '-', 'g'));

    CONTINUE WHEN NOT (r.slug ~ '^operator(-[0-9]+)?$' OR r.slug = v_buggy OR r.slug LIKE v_buggy || '-%');

    v_slug := v_base;
    v_cnt  := 1;
    WHILE EXISTS (SELECT 1 FROM public.tour_operator_profiles WHERE slug = v_slug AND user_id <> r.user_id) LOOP
      v_slug := v_base || '-' || v_cnt;
      v_cnt  := v_cnt + 1;
    END LOOP;

    INSERT INTO public.operator_slug_redirects (old_slug, new_slug) VALUES (r.slug, v_slug)
      ON CONFLICT (old_slug) DO UPDATE SET new_slug = EXCLUDED.new_slug;
    -- Earlier redirects that pointed at the old slug now point at the new one.
    UPDATE public.operator_slug_redirects SET new_slug = v_slug WHERE new_slug = r.slug;
    UPDATE public.tour_operator_profiles SET slug = v_slug WHERE user_id = r.user_id;
  END LOOP;
END;
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
