-- Sprint 3 / operator calendar realtime — put tour_schedules and tour_bookings on the
-- supabase_realtime publication so change events fire. RLS still applies to the events, so an
-- operator only sees rows for their own tours (policy "Operators can manage own schedules" on
-- tour_schedules + the equivalent booking policies) — no cross-operator leakage.
--
-- Idempotent: ALTER PUBLICATION ... ADD TABLE raises 42710 (duplicate_object) when the table is
-- already in the publication, so guard with an existence check.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tour_schedules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_schedules;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tour_bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_bookings;
  END IF;
END $$;
