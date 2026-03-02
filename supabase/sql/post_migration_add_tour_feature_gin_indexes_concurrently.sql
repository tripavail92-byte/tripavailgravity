-- Zero-downtime option for high-traffic production
-- IMPORTANT:
-- 1) Run this manually in SQL editor/psql.
-- 2) Do NOT wrap in BEGIN/COMMIT.
-- 3) CREATE INDEX CONCURRENTLY cannot run inside a transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tours_included_features_gin
ON public.tours
USING GIN (included_features);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tours_excluded_features_gin
ON public.tours
USING GIN (excluded_features);
