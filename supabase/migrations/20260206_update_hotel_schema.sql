-- Update hotels table with new columns
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS star_rating NUMERIC(2,1),
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS policies JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Update rooms table with new columns
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS bed_config JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS size_sqm INTEGER,
ADD COLUMN IF NOT EXISTS amenities TEXT[],
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Create storage bucket for hotel images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-images', 'hotel-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY " authenticated users can upload hotel images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hotel-images' AND auth.role() = 'authenticated');

-- Policy to allow public to view hotel images
CREATE POLICY "Public can view hotel images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hotel-images');
