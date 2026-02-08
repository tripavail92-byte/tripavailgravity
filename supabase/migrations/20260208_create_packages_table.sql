-- Create packages table with proper schema
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Package Classification
    package_type TEXT NOT NULL, -- weekend-getaway, adventure, cultural-immersion, etc.
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Media
    cover_image TEXT,
    media_urls TEXT[], -- Array of Supabase Storage URLs
   
    -- Content  
    highlights TEXT[],
    inclusions TEXT[],
    exclusions TEXT[],
    
    -- Policies
    cancellation_policy TEXT,
    payment_terms TEXT,
    
    -- Status & Metadata
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT packages_name_min_length CHECK (char_length(name) >= 3)
);

-- Create Supabase Storage bucket for package media
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-media', 'package-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for package-media bucket
CREATE POLICY "Authenticated users can upload package media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'package-media');

CREATE POLICY "Public read access to package media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'package-media');

CREATE POLICY "Users can update their own package media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'package-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own package media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'package-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS Policies for packages table
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own packages"
ON packages FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own packages"
ON packages FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own packages"
ON packages FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own packages"
ON packages FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Public can view published packages
CREATE POLICY "Public can view published packages"
ON packages FOR SELECT
TO public
USING (is_published = true);

-- Indexes for performance
CREATE INDEX idx_packages_owner_id ON packages(owner_id);
CREATE INDEX idx_packages_published ON packages(is_published) WHERE is_published = true;
CREATE INDEX idx_packages_package_type ON packages(package_type);
CREATE INDEX idx_packages_created_at ON packages(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER packages_updated_at
BEFORE UPDATE ON packages
FOR EACH ROW
EXECUTE FUNCTION update_packages_updated_at();
