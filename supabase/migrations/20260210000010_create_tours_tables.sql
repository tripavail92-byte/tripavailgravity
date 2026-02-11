-- Migration for Phase 13: Tour Creation Flow

-- 1. Create TOURS table
CREATE TABLE IF NOT EXISTS public.tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    tour_type TEXT NOT NULL,
    location JSONB NOT NULL DEFAULT '{}'::jsonb,
    duration TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT,
    short_description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    highlights TEXT[] DEFAULT '{}',
    inclusions TEXT[] DEFAULT '{}',
    exclusions TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    min_participants INT DEFAULT 1,
    max_participants INT DEFAULT 20,
    min_age INT DEFAULT 0,
    max_age INT DEFAULT 100,
    difficulty_level TEXT DEFAULT 'easy',
    languages TEXT[] DEFAULT '{}',
    rating NUMERIC DEFAULT 0,
    review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    itinerary JSONB DEFAULT '[]'::jsonb,
    schedules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create TOUR_SCHEDULES table (Normalized Approach)
CREATE TABLE IF NOT EXISTS public.tour_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INT NOT NULL,
    booked_count INT DEFAULT 0,
    price_override NUMERIC, 
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create TOUR_BOOKINGS table
CREATE TABLE IF NOT EXISTS public.tour_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.tour_schedules(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_price NUMERIC NOT NULL,
    pax_count INT NOT NULL DEFAULT 1,
    booking_date TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Enable RLS
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

-- 5. Create Storage Bucket for Tour Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-images', 'tour-images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. RLS Policies
DO $$
BEGIN
    -- Tours
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active tours' AND tablename = 'tours') THEN
        CREATE POLICY "Public can view active tours" ON public.tours FOR SELECT USING (is_active = true OR auth.uid() = operator_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Operators can manage own tours' AND tablename = 'tours') THEN
        CREATE POLICY "Operators can manage own tours" ON public.tours FOR ALL USING (auth.uid() = operator_id);
    END IF;

    -- Schedules
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view schedules' AND tablename = 'tour_schedules') THEN
        CREATE POLICY "Public can view schedules" ON public.tour_schedules FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Operators can manage own schedules' AND tablename = 'tour_schedules') THEN
        CREATE POLICY "Operators can manage own schedules" ON public.tour_schedules FOR ALL USING (
            EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_schedules.tour_id AND tours.operator_id = auth.uid())
        );
    END IF;

    -- Bookings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Travelers can view own bookings' AND tablename = 'tour_bookings') THEN
        CREATE POLICY "Travelers can view own bookings" ON public.tour_bookings FOR SELECT USING (auth.uid() = traveler_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Operators can view bookings for their tours' AND tablename = 'tour_bookings') THEN
        CREATE POLICY "Operators can view bookings for their tours" ON public.tour_bookings FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_bookings.tour_id AND tours.operator_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Travelers can create bookings' AND tablename = 'tour_bookings') THEN
        CREATE POLICY "Travelers can create bookings" ON public.tour_bookings FOR INSERT WITH CHECK (auth.uid() = traveler_id);
    END IF;

    -- Storage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public view tour images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public view tour images" ON storage.objects FOR SELECT USING (bucket_id = 'tour-images');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Operators upload tour images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Operators upload tour images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
            bucket_id = 'tour-images' AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Operators update own tour images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Operators update own tour images" ON storage.objects FOR UPDATE TO authenticated USING (
            bucket_id = 'tour-images' AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Operators delete own tour images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Operators delete own tour images" ON storage.objects FOR DELETE TO authenticated USING (
            bucket_id = 'tour-images' AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;
