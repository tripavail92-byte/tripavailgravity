-- Add hotel linkage and room configuration to packages
-- This enables fixed package configuration (Option A)

-- Add hotel_id and room configuration fields to packages
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS room_configuration JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS max_guests INT DEFAULT 2 CHECK (max_guests > 0),
ADD COLUMN IF NOT EXISTS base_price_per_night NUMERIC(10, 2) CHECK (base_price_per_night >= 0),
ADD COLUMN IF NOT EXISTS minimum_nights INT DEFAULT 1 CHECK (minimum_nights > 0),
ADD COLUMN IF NOT EXISTS maximum_nights INT DEFAULT 30 CHECK (maximum_nights >= minimum_nights);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_hotel_id ON public.packages(hotel_id);

-- Comments for documentation
COMMENT ON COLUMN public.packages.hotel_id IS 'References the hotel this package belongs to';
COMMENT ON COLUMN public.packages.room_configuration IS 'Fixed room configuration for package: {"rooms": [{"room_id": "uuid", "room_type": "deluxe", "count": 1}], "max_guests": 4, "fixed_price": 1200}';
COMMENT ON COLUMN public.packages.max_guests IS 'Maximum number of guests allowed for this package';
COMMENT ON COLUMN public.packages.base_price_per_night IS 'Base price per night for the package (can be overridden in room_configuration)';
COMMENT ON COLUMN public.packages.minimum_nights IS 'Minimum number of nights required for booking this package';
COMMENT ON COLUMN public.packages.maximum_nights IS 'Maximum number of nights allowed for booking this package';

-- Update RLS policies to include hotel ownership check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Hotel owners can view packages for their hotels' AND tablename = 'packages' AND schemaname = 'public') THEN
        CREATE POLICY "Hotel owners can view packages for their hotels" ON public.packages
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.hotels 
            WHERE hotels.id = packages.hotel_id 
            AND hotels.owner_id = auth.uid()
          )
        );
    END IF;
END $$;
