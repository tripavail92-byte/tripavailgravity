-- Optional follow-up migration
-- Use this when you have a short maintenance/deploy window.
-- For zero-downtime indexing on busy production, use:
-- supabase/sql/post_migration_add_tour_feature_gin_indexes_concurrently.sql

BEGIN;

CREATE INDEX IF NOT EXISTS idx_tours_included_features_gin
ON public.tours
USING GIN (included_features);

CREATE INDEX IF NOT EXISTS idx_tours_excluded_features_gin
ON public.tours
USING GIN (excluded_features);

COMMIT;
