-- Refine RLS Policies for Tours Table

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public can view active tours" ON public.tours;
DROP POLICY IF EXISTS "Operators can manage own tours" ON public.tours;

-- 2. Create explicit policy for Operators (FULL ACCESS to own tours)
CREATE POLICY "Operators manage own tours" ON public.tours
    FOR ALL
    TO authenticated
    USING (auth.uid() = operator_id)
    WITH CHECK (auth.uid() = operator_id);

-- 3. Create explicit policy for Public/Travelers (READ ONLY for published/active)
-- This allows anyone to view tours that are marked as published or active
CREATE POLICY "Anyone can view published/active tours" ON public.tours
    FOR SELECT
    TO public
    USING (is_published = true OR is_active = true);

-- Enable RLS (just in case it was disabled)
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
