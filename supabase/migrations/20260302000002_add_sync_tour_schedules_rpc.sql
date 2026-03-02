CREATE OR REPLACE FUNCTION public.sync_tour_schedules_from_json(
  p_tour_id UUID,
  p_schedules JSONB,
  p_default_capacity INT DEFAULT 10
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  schedule_item JSONB;
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ;
  seat_capacity INT;
  schedule_status TEXT;
BEGIN
  IF p_tour_id IS NULL THEN
    RAISE EXCEPTION 'p_tour_id is required';
  END IF;

  DELETE FROM public.tour_schedules
  WHERE tour_id = p_tour_id;

  IF p_schedules IS NULL OR jsonb_typeof(p_schedules) <> 'array' THEN
    RETURN;
  END IF;

  FOR schedule_item IN
    SELECT value
    FROM jsonb_array_elements(p_schedules)
  LOOP
    IF COALESCE(schedule_item->>'start_time', '') <> '' THEN
      start_ts := (schedule_item->>'start_time')::timestamptz;
    ELSIF COALESCE(schedule_item->>'date', '') <> '' THEN
      start_ts := (
        (schedule_item->>'date') ||
        'T' ||
        COALESCE(NULLIF(schedule_item->>'time', ''), '09:00') ||
        ':00'
      )::timestamptz;
    ELSE
      CONTINUE;
    END IF;

    IF COALESCE(schedule_item->>'end_time', '') <> '' THEN
      end_ts := (schedule_item->>'end_time')::timestamptz;
    ELSE
      end_ts := start_ts + INTERVAL '2 hours';
    END IF;

    seat_capacity := GREATEST(
      1,
      COALESCE(NULLIF(schedule_item->>'capacity', '')::INT, p_default_capacity, 10)
    );

    schedule_status := COALESCE(NULLIF(schedule_item->>'status', ''), 'scheduled');
    IF schedule_status NOT IN ('scheduled', 'cancelled', 'completed') THEN
      schedule_status := 'scheduled';
    END IF;

    INSERT INTO public.tour_schedules (
      tour_id,
      start_time,
      end_time,
      capacity,
      status
    ) VALUES (
      p_tour_id,
      start_ts,
      end_ts,
      seat_capacity,
      schedule_status
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_tour_schedules_from_json(UUID, JSONB, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_tour_schedules_from_json(UUID, JSONB, INT) TO service_role;
