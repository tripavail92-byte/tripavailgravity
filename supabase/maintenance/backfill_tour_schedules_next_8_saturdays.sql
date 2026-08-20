-- Backfill: give every LIVE trip with no upcoming departure the next 8 Saturdays.
-- Idempotent — only touches trips that currently have zero future 'scheduled' rows.
-- start = 03:00 UTC (~08:00 PKT); end = start + (duration-1) days + 8h (so a day trip
-- returns the same evening, a 3-day trip returns Monday evening, etc.).
-- Reversal: DELETE the rows this created (they are the only schedules with these
-- future-Saturday start_times inserted at run time).
with needy as (
  select t.id,
         greatest(coalesce(t.duration_days, 1), 1) as dur,
         greatest(coalesce(t.max_participants, 15), 1) as cap
  from public.tours t
  where t.is_active and t.is_published and t.status = 'live'
    and not exists (
      select 1 from public.tour_schedules s
      where s.tour_id = t.id
        and s.status = 'scheduled'
        and s.start_time >= now()
    )
),
sats as (select generate_series(0, 7) as w)
insert into public.tour_schedules (tour_id, start_time, end_time, capacity, booked_count, status)
select
  n.id,
  (date_trunc('week', now()) + interval '12 day' + (sats.w || ' week')::interval + interval '3 hour')                                   as start_time,
  (date_trunc('week', now()) + interval '12 day' + (sats.w || ' week')::interval + interval '3 hour'
     + ((n.dur - 1) || ' day')::interval + interval '8 hour')                                                                          as end_time,
  n.cap, 0, 'scheduled'
from needy n cross join sats;
