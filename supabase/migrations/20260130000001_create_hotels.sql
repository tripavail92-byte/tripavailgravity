-- Enable PostGIS for location search
-- Note: 'postgis' extension is usually managed via Supabase Dashboard -> Database -> Extensions
-- CREATE EXTENSION IF NOT EXISTS postgis; 

-- For standard search, we'll start with text/simple columns first.

CREATE TABLE public.hotels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL, -- "Bali, Indonesia"
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    base_price_per_night DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    main_image_url TEXT,
    image_urls TEXT[], -- Array of strings
    amenities TEXT[],
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Public read
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published hotels" 
ON public.hotels FOR SELECT 
USING (is_published = true);

CREATE POLICY "Hotel Managers can CRUD their own hotels" 
ON public.hotels FOR ALL 
USING (auth.uid() = owner_id);

-- Rooms (sub-units)
CREATE TABLE public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Deluxe Suite"
    description TEXT,
    capacity_adults INTEGER DEFAULT 2,
    capacity_children INTEGER DEFAULT 0,
    price_override DECIMAL(10, 2), -- If different from base
    initial_stock INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms" 
ON public.rooms FOR SELECT 
USING (true);

CREATE POLICY "Managers can CRUD rooms" 
ON public.rooms FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.hotels 
        WHERE hotels.id = rooms.hotel_id 
        AND hotels.owner_id = auth.uid()
    )
);
