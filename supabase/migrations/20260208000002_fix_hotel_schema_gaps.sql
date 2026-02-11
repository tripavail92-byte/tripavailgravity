-- Fix hotel listing schema gaps
-- Adds missing columns that frontend collects but database doesn't store

-- Hotels table: Add location breakdown and contact phone
ALTER TABLE public.hotels 
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Rooms table: Add room type and currency
ALTER TABLE public.rooms 
  ADD COLUMN IF NOT EXISTS room_type TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_hotels_city ON public.hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_country ON public.hotels(country);
CREATE INDEX IF NOT EXISTS idx_hotels_is_published ON public.hotels(is_published);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON public.rooms(room_type);

-- Add comments for clarity
COMMENT ON COLUMN public.hotels.country IS 'Country where hotel is located';
COMMENT ON COLUMN public.hotels.city IS 'City where hotel is located';
COMMENT ON COLUMN public.hotels.area IS 'Area/neighborhood within city';
COMMENT ON COLUMN public.hotels.zip_code IS 'Postal/ZIP code';
COMMENT ON COLUMN public.hotels.contact_phone IS 'Hotel contact phone number';

COMMENT ON COLUMN public.rooms.room_type IS 'Type of room: standard, deluxe, suite, family, executive, presidential';
COMMENT ON COLUMN public.rooms.currency IS 'Currency code for room pricing (e.g., USD, EUR)';
