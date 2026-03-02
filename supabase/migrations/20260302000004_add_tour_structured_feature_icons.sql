BEGIN;

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS included_features jsonb,
  ADD COLUMN IF NOT EXISTS excluded_features jsonb;

ALTER TABLE public.tours
  ALTER COLUMN included_features SET DEFAULT '[]'::jsonb,
  ALTER COLUMN excluded_features SET DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.tours.included_features IS 'Structured included features: [{"label": string, "icon_key": string}]';
COMMENT ON COLUMN public.tours.excluded_features IS 'Structured excluded features: [{"label": string, "icon_key": string}]';

UPDATE public.tours t
SET included_features = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'label', label,
        'icon_key',
          CASE trim(lower(label))
            WHEN 'professional tour guide' THEN 'guide'
            WHEN 'transportation' THEN 'bus'
            WHEN 'entrance fees' THEN 'ticket'
            WHEN 'meals (as specified)' THEN 'meal'
            WHEN 'accommodation' THEN 'hotel'
            WHEN 'travel insurance' THEN 'insurance'
            WHEN 'photography' THEN 'camera'
            WHEN 'local taxes' THEN 'taxes'
            ELSE 'generic'
          END
      )
    ),
    '[]'::jsonb
  )
  FROM unnest(COALESCE(t.included, t.inclusions, '{}'::text[])) AS label
)
WHERE t.included_features IS NULL
  AND (t.included IS NOT NULL OR t.inclusions IS NOT NULL);

UPDATE public.tours t
SET excluded_features = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'label', label,
        'icon_key',
          CASE trim(lower(label))
            WHEN 'personal expenses' THEN 'expense'
            WHEN 'tips and gratuities' THEN 'tips'
            WHEN 'international flights' THEN 'flight'
            WHEN 'visa fees' THEN 'visa'
            WHEN 'optional activities' THEN 'optional_activity'
            WHEN 'alcoholic beverages' THEN 'alcohol'
            WHEN 'shopping' THEN 'shopping'
            WHEN 'emergency expenses' THEN 'emergency'
            ELSE 'generic'
          END
      )
    ),
    '[]'::jsonb
  )
  FROM unnest(COALESCE(t.excluded, t.exclusions, '{}'::text[])) AS label
)
WHERE t.excluded_features IS NULL
  AND (t.excluded IS NOT NULL OR t.exclusions IS NOT NULL);

COMMIT;
