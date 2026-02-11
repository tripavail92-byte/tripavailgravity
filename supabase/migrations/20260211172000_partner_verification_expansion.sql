-- Migration: Partnerr Verification System Schema Expansion
-- Created: 2026-02-11
-- Purpose: Support multi-step onboarding and document verification for Partners

-- 1. Expand hotel_manager_profiles
ALTER TABLE public.hotel_manager_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS property_name TEXT,
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS ownership_type TEXT CHECK (ownership_type IN ('owner', 'manager', 'lease')),
ADD COLUMN IF NOT EXISTS bank_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS verification_urls JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Expand tour_operator_profiles
ALTER TABLE public.tour_operator_profiles
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS verification_urls JSONB DEFAULT '{}'::jsonb;

-- 3. Create Storage Bucket for Hotel Manager assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-manager-assets', 'hotel-manager-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies for hotel-manager-assets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload manager assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated users can upload manager assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hotel-manager-assets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access to manager assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public read access to manager assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'hotel-manager-assets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own manager assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can manage their own manager assets" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'hotel-manager-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

-- 5. Enable updated_at trigger for hotel_manager_profiles
CREATE OR REPLACE FUNCTION update_hotel_manager_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hotel_manager_profiles_updated_at ON public.hotel_manager_profiles;
CREATE TRIGGER hotel_manager_profiles_updated_at
BEFORE UPDATE ON public.hotel_manager_profiles
FOR EACH ROW
EXECUTE FUNCTION update_hotel_manager_profiles_updated_at();

-- 6. Add RLS Policies for profile updates if missing
-- Note: Initial schema already had basic SELECT policies. Adding UPDATE/INSERT.
CREATE POLICY "Users can update own hotel profile" ON public.hotel_manager_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hotel profile" ON public.hotel_manager_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tour profile" ON public.tour_operator_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tour profile" ON public.tour_operator_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
