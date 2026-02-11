-- Expansion of tour_operator_profiles to support deep onboarding persistence

-- 1. Add new columns to tour_operator_profiles
ALTER TABLE public.tour_operator_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS years_experience TEXT,
ADD COLUMN IF NOT EXISTS team_size TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS categories TEXT[],
ADD COLUMN IF NOT EXISTS primary_city TEXT,
ADD COLUMN IF NOT EXISTS coverage_range TEXT,
ADD COLUMN IF NOT EXISTS policies JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create Storage Bucket for Tour Operator assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-operator-assets', 'tour-operator-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for tour-operator-assets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload operator assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated users can upload operator assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tour-operator-assets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access to operator assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public read access to operator assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'tour-operator-assets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own operator assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can update their own operator assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'tour-operator-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own operator assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can delete their own operator assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tour-operator-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

-- 4. Enable updated_at trigger for tour_operator_profiles
CREATE OR REPLACE FUNCTION update_tour_operator_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tour_operator_profiles_updated_at ON public.tour_operator_profiles;
CREATE TRIGGER tour_operator_profiles_updated_at
BEFORE UPDATE ON public.tour_operator_profiles
FOR EACH ROW
EXECUTE FUNCTION update_tour_operator_profiles_updated_at();
