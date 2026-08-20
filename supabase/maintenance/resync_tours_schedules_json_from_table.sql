-- Repair drift between tours.schedules (JSON, the wizard's source-of-truth) and the
-- tour_schedules table (what the Calendar/booking read). The backfill added rows to
-- tour_schedules only, so the JSON lagged; on the next wizard save the destructive sync
-- would delete the un-mirrored departures. Rebuild the JSON to mirror the table so the
-- two agree. Only touches the schedules column. Idempotent.
update public.tours t
set schedules = agg.schedules
from (
  select s.tour_id,
         jsonb_agg(
           jsonb_build_object(
             'start_time', s.start_time,
             'end_time', s.end_time,
             'capacity', s.capacity,
             'status', s.status
           ) order by s.start_time
         ) as schedules
  from public.tour_schedules s
  where s.status = 'scheduled'
  group by s.tour_id
) agg
where t.id = agg.tour_id
  and t.is_active and t.is_published and t.status = 'live'
  and jsonb_array_length(coalesce(t.schedules, '[]'::jsonb))
      <> (select count(*) from public.tour_schedules s2 where s2.tour_id = t.id and s2.status = 'scheduled');
