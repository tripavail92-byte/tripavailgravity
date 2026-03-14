ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PKR';

UPDATE public.packages AS p
SET currency = COALESCE(
  NULLIF(p.currency, ''),
  (
    SELECT NULLIF(MIN(NULLIF(r.currency, '')), '')
    FROM jsonb_array_elements(COALESCE(p.room_configuration -> 'rooms', '[]'::jsonb)) AS room_ref
    JOIN public.rooms AS r
      ON r.id = NULLIF(room_ref ->> 'room_id', '')::uuid
    WHERE NULLIF(r.currency, '') IS NOT NULL
  ),
  'PKR'
)
WHERE p.currency IS NULL OR p.currency = '';

COMMENT ON COLUMN public.packages.currency IS 'Currency code used for package pricing and checkout';