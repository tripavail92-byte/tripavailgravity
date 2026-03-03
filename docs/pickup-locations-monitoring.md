# Pickup Locations — Monitoring Checklist

This checklist is for the **Pickup Locations (Exact Map Pin)** rollout.

## 1) Data sanity

### Pickup coverage (how many tours have pickups)
Run in Supabase SQL editor:

```sql
select
  count(distinct t.id) as live_tours,
  count(distinct pl.tour_id) as tours_with_pickups,
  round(
    (count(distinct pl.tour_id)::numeric / nullif(count(distinct t.id), 0)) * 100,
    2
  ) as pct_with_pickups
from public.tours t
left join public.tour_pickup_locations pl on pl.tour_id = t.id
where t.is_active = true
  and t.is_published = true
  and t.status = 'live';
```

### Constraint health (max one primary per tour)

```sql
select
  tour_id,
  count(*) as primary_count
from public.tour_pickup_locations
where is_primary = true
group by tour_id
having count(*) > 1;
```

Expected: **0 rows**.

## 2) Performance (RPC latency)

### Basic smoke test

```sql
select *
from public.search_tours_by_nearest_pickup(
  25.2048, 55.2708,  -- Dubai
  250,
  20,
  0
);
```

### Postgres execution plan (service role / SQL editor)

```sql
explain (analyze, buffers)
select *
from public.search_tours_by_nearest_pickup(
  25.2048, 55.2708,
  250,
  50,
  0
);
```

Watch for:
- Sequential scans on `tour_pickup_locations` at large row counts
- Large buffer reads
- High total execution time

## 3) Security (RLS)

### Traveller visibility matches “live tours only”

```sql
select
  t.status,
  t.is_active,
  t.is_published,
  count(*) as pickup_rows
from public.tour_pickup_locations pl
join public.tours t on t.id = pl.tour_id
group by 1,2,3
order by pickup_rows desc;
```

Expected: traveller-facing reads should only succeed for `live + active + published` tours.

## 4) Google Maps quota / errors

Operational checks:
- Google Cloud Console → APIs & Services → Dashboard
  - Maps JavaScript API
  - Places API
  - Geocoding API
- Watch for spikes after launch.

## 5) App-level signals

Suggested lightweight signals:
- % of operators blocked by “needs attention” on Pickup step
- % of tours that reach “Submit for Review” with pickup_locations_count = 0 (should be ~0)
- Client-side error logs for reverse geocode failures
