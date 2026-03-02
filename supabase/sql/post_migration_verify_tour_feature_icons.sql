-- Post-migration verification pack for structured tour feature icons
-- Target migration already applied: 20260302000004_add_tour_structured_feature_icons.sql
-- Safe to run multiple times.

-- =========================================================
-- 1) Schema and defaults sanity
-- =========================================================
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tours'
  AND column_name IN ('included_features', 'excluded_features')
ORDER BY column_name;

-- =========================================================
-- 2) Coverage summary
-- =========================================================
SELECT
  COUNT(*) AS total_tours,
  COUNT(*) FILTER (WHERE included_features IS NOT NULL) AS tours_with_included_features,
  COUNT(*) FILTER (WHERE excluded_features IS NOT NULL) AS tours_with_excluded_features,
  COUNT(*) FILTER (WHERE jsonb_typeof(included_features) = 'array') AS included_as_array,
  COUNT(*) FILTER (WHERE jsonb_typeof(excluded_features) = 'array') AS excluded_as_array
FROM public.tours;

-- =========================================================
-- 3) Quick sample of migrated payloads
-- =========================================================
SELECT
  id,
  title,
  included_features,
  excluded_features
FROM public.tours
WHERE included_features IS NOT NULL
ORDER BY updated_at DESC NULLS LAST
LIMIT 10;

-- =========================================================
-- 4) Generic-icon distribution (check for "generic explosion")
-- =========================================================
WITH included_icons AS (
  SELECT jsonb_array_elements(COALESCE(included_features, '[]'::jsonb))->>'icon_key' AS icon_key
  FROM public.tours
),
excluded_icons AS (
  SELECT jsonb_array_elements(COALESCE(excluded_features, '[]'::jsonb))->>'icon_key' AS icon_key
  FROM public.tours
)
SELECT 'included' AS feature_type, icon_key, COUNT(*) AS occurrences
FROM included_icons
GROUP BY icon_key
UNION ALL
SELECT 'excluded' AS feature_type, icon_key, COUNT(*) AS occurrences
FROM excluded_icons
GROUP BY icon_key
ORDER BY feature_type, occurrences DESC;

-- =========================================================
-- 5) Generic ratio KPI
-- =========================================================
WITH all_icons AS (
  SELECT jsonb_array_elements(COALESCE(included_features, '[]'::jsonb))->>'icon_key' AS icon_key
  FROM public.tours
  UNION ALL
  SELECT jsonb_array_elements(COALESCE(excluded_features, '[]'::jsonb))->>'icon_key' AS icon_key
  FROM public.tours
)
SELECT
  COUNT(*) AS total_feature_items,
  COUNT(*) FILTER (WHERE icon_key = 'generic') AS generic_items,
  ROUND(
    (COUNT(*) FILTER (WHERE icon_key = 'generic')::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
    2
  ) AS generic_pct
FROM all_icons;

-- =========================================================
-- 6) Unmapped legacy labels (to refine CASE mapping)
-- =========================================================
WITH legacy_included AS (
  SELECT DISTINCT trim(lower(val)) AS normalized_label
  FROM public.tours t,
       LATERAL unnest(COALESCE(t.included, t.inclusions, '{}'::text[])) AS val
),
legacy_excluded AS (
  SELECT DISTINCT trim(lower(val)) AS normalized_label
  FROM public.tours t,
       LATERAL unnest(COALESCE(t.excluded, t.exclusions, '{}'::text[])) AS val
),
known_included AS (
  SELECT *
  FROM (VALUES
    ('professional tour guide'),
    ('transportation'),
    ('entrance fees'),
    ('meals (as specified)'),
    ('accommodation'),
    ('travel insurance'),
    ('photography'),
    ('local taxes')
  ) AS k(label)
),
known_excluded AS (
  SELECT *
  FROM (VALUES
    ('personal expenses'),
    ('tips and gratuities'),
    ('international flights'),
    ('visa fees'),
    ('optional activities'),
    ('alcoholic beverages'),
    ('shopping'),
    ('emergency expenses')
  ) AS k(label)
)
SELECT 'included' AS feature_type, l.normalized_label
FROM legacy_included l
LEFT JOIN known_included k ON k.label = l.normalized_label
WHERE k.label IS NULL
UNION ALL
SELECT 'excluded' AS feature_type, l.normalized_label
FROM legacy_excluded l
LEFT JOIN known_excluded k ON k.label = l.normalized_label
WHERE k.label IS NULL
ORDER BY feature_type, normalized_label;

-- =========================================================
-- 7) Structural validation for malformed items
-- =========================================================
WITH all_items AS (
  SELECT id, 'included'::text AS feature_type, jsonb_array_elements(COALESCE(included_features, '[]'::jsonb)) AS item
  FROM public.tours
  UNION ALL
  SELECT id, 'excluded'::text AS feature_type, jsonb_array_elements(COALESCE(excluded_features, '[]'::jsonb)) AS item
  FROM public.tours
)
SELECT
  id,
  feature_type,
  item
FROM all_items
WHERE jsonb_typeof(item) <> 'object'
   OR NOT (item ? 'label')
   OR NOT (item ? 'icon_key')
   OR COALESCE(trim(item->>'label'), '') = ''
   OR COALESCE(trim(item->>'icon_key'), '') = ''
LIMIT 100;

-- =========================================================
-- 8) Deployment smoke cohorts for UI checks
-- =========================================================
-- A) structured-only tours
SELECT id, title
FROM public.tours
WHERE jsonb_array_length(COALESCE(included_features, '[]'::jsonb)) > 0
ORDER BY updated_at DESC NULLS LAST
LIMIT 5;

-- B) legacy-only tours (if any remain)
SELECT id, title
FROM public.tours
WHERE jsonb_array_length(COALESCE(included_features, '[]'::jsonb)) = 0
  AND cardinality(COALESCE(included, inclusions, '{}'::text[])) > 0
ORDER BY updated_at DESC NULLS LAST
LIMIT 5;

-- C) mixed tours
SELECT id, title
FROM public.tours
WHERE jsonb_array_length(COALESCE(included_features, '[]'::jsonb)) > 0
  AND cardinality(COALESCE(included, inclusions, '{}'::text[])) > 0
ORDER BY updated_at DESC NULLS LAST
LIMIT 5;
