# Tour Feature GIN Indexes Runbook

Use this runbook to add GIN indexes for `included_features` and `excluded_features` safely in production.

## Why the error happens

`CREATE INDEX CONCURRENTLY` fails with:

`ERROR: 25001: CREATE INDEX CONCURRENTLY cannot run inside a transaction block`

when your execution environment wraps statements in a transaction.

---

## Option A (default): standard migration in transaction

Use this when you can tolerate a short maintenance window.

Run migration:

- `supabase/migrations/20260302000005_add_tour_feature_gin_indexes.sql`

This creates:

- `idx_tours_included_features_gin`
- `idx_tours_excluded_features_gin`

### Supabase CLI

- `supabase db push`

---

## Option B (high traffic): concurrent indexes (zero-downtime style)

Use this only from a client/session that is **not** wrapping everything in a transaction.

Source script:

- `supabase/sql/post_migration_add_tour_feature_gin_indexes_concurrently.sql`

### psql (recommended)

Run as two separate commands:

- `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tours_included_features_gin ON public.tours USING GIN (included_features);"`
- `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tours_excluded_features_gin ON public.tours USING GIN (excluded_features);"`

### Supabase SQL Editor note

If SQL Editor is wrapping statements in a transaction in your setup, `CONCURRENTLY` will fail. In that case, use Option A.

---

## Verification (run after either option)

### 1) Indexes exist

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'tours'
  AND indexname IN (
    'idx_tours_included_features_gin',
    'idx_tours_excluded_features_gin'
  )
ORDER BY indexname;
```

### 2) Planner can use index for containment filters

```sql
EXPLAIN ANALYZE
SELECT id
FROM public.tours
WHERE included_features @> '[{"icon_key":"insurance"}]'::jsonb
LIMIT 20;
```

```sql
EXPLAIN ANALYZE
SELECT id
FROM public.tours
WHERE excluded_features @> '[{"icon_key":"flight"}]'::jsonb
LIMIT 20;
```

---

## Rollback (if required)

Transaction-safe rollback:

```sql
DROP INDEX IF EXISTS public.idx_tours_included_features_gin;
DROP INDEX IF EXISTS public.idx_tours_excluded_features_gin;
```

For zero-downtime rollback on busy systems:

- `DROP INDEX CONCURRENTLY IF EXISTS public.idx_tours_included_features_gin;`
- `DROP INDEX CONCURRENTLY IF EXISTS public.idx_tours_excluded_features_gin;`

(Do not run concurrent drops inside a transaction block.)
