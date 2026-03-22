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
    group_discounts BOOLEAN DEFAULT FALSE,
    pricing_tiers JSONB DEFAULT '[]'::jsonb,
    seasonal_pricing BOOLEAN DEFAULT FALSE,
    peak_season_multiplier NUMERIC DEFAULT 1.2,
    off_season_multiplier NUMERIC DEFAULT 0.8,
    deposit_required BOOLEAN DEFAULT FALSE,
    deposit_percentage NUMERIC DEFAULT 0,
    cancellation_policy TEXT DEFAULT 'flexible',
    rating NUMERIC DEFAULT 0,
    review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    itinerary JSONB DEFAULT '[]'::jsonb,
    schedules JSONB DEFAULT '[]'::jsonb,
    draft_data JSONB DEFAULT '{}'::jsonb,
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
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    stripe_payment_intent_id TEXT UNIQUE,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    payment_metadata JSONB DEFAULT '{}'::jsonb
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

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Travelers can update own pending bookings' AND tablename = 'tour_bookings' AND schemaname = 'public') THEN
        CREATE POLICY "Travelers can update own pending bookings" ON public.tour_bookings
            FOR UPDATE
            USING (auth.uid() = traveler_id AND status = 'pending')
            WITH CHECK (auth.uid() = traveler_id AND status IN ('pending', 'confirmed', 'cancelled'));
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

CREATE INDEX IF NOT EXISTS idx_tour_bookings_schedule_status
ON public.tour_bookings(schedule_id, status);

CREATE INDEX IF NOT EXISTS idx_tour_bookings_expires_at
ON public.tour_bookings(expires_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tour_bookings_stripe_payment_intent
ON public.tour_bookings(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_tour_bookings_payment_status
ON public.tour_bookings(payment_status);

CREATE OR REPLACE FUNCTION public.get_available_slots(schedule_id_param UUID)
RETURNS INT AS $$
DECLARE
    total_cap INT;
    confirmed_count INT;
    active_pending_count INT;
BEGIN
    SELECT capacity INTO total_cap FROM public.tour_schedules WHERE id = schedule_id_param;

    IF total_cap IS NULL THEN
        RAISE EXCEPTION 'Schedule not found';
    END IF;

    SELECT COALESCE(SUM(pax_count), 0) INTO confirmed_count
    FROM public.tour_bookings
    WHERE schedule_id = schedule_id_param AND status = 'confirmed';

    SELECT COALESCE(SUM(pax_count), 0) INTO active_pending_count
    FROM public.tour_bookings
    WHERE schedule_id = schedule_id_param
      AND status = 'pending'
      AND expires_at > NOW();

    RETURN total_cap - confirmed_count - active_pending_count;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.update_schedule_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        UPDATE public.tour_schedules
        SET booked_count = COALESCE(
            (SELECT SUM(pax_count) FROM public.tour_bookings
             WHERE schedule_id = NEW.schedule_id AND status = 'confirmed'),
            0
        )
        WHERE id = NEW.schedule_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_schedule_booked_count ON public.tour_bookings;
CREATE TRIGGER trigger_update_schedule_booked_count
AFTER INSERT OR UPDATE ON public.tour_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_schedule_booked_count();

GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_schedule_booked_count() TO authenticated, service_role;
