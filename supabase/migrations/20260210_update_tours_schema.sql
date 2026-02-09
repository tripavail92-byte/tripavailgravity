-- Migration to add publishing and draft support to tours
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS draft_data JSONB DEFAULT '{}'::jsonb;

-- Update RLS policy for public view to include is_published check
DROP POLICY IF EXISTS "Public can view active tours" ON public.tours;
CREATE POLICY "Public can view active tours" ON public.tours
    FOR SELECT USING (is_published = true OR is_active = true OR auth.uid() = operator_id);
