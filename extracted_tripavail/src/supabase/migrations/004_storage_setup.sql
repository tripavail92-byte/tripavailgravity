-- TripAvail Database Schema - Storage Setup
-- Migration 004: Supabase Storage buckets and policies
-- Created: 2025-01-03

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Property images bucket (public access for viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- User avatars bucket (public access for viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Private documents bucket (receipts, contracts, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES - PROPERTY IMAGES
-- =====================================================

-- Anyone can view property images (public bucket)
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Authenticated users can upload property images
CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own property images
CREATE POLICY "Users can update own property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own property images
CREATE POLICY "Users can delete own property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- STORAGE POLICIES - AVATARS
-- =====================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- STORAGE POLICIES - DOCUMENTS
-- =====================================================

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload their own documents
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Generate unique filename with timestamp
CREATE OR REPLACE FUNCTION generate_storage_filename(
  original_filename TEXT,
  file_extension TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN auth.uid()::text || '/' || 
         EXTRACT(EPOCH FROM NOW())::bigint || '_' ||
         substr(md5(random()::text), 1, 8) || 
         '.' || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get public URL for storage object
CREATE OR REPLACE FUNCTION get_public_url(
  bucket_name TEXT,
  file_path TEXT
)
RETURNS TEXT AS $$
DECLARE
  project_url TEXT;
BEGIN
  -- Get project URL from config (you'll need to set this)
  project_url := current_setting('app.settings.supabase_url', true);
  
  IF project_url IS NULL THEN
    project_url := 'https://ffgdsyttlykyuplehdlb.supabase.co';
  END IF;
  
  RETURN project_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORAGE CLEANUP FUNCTIONS
-- =====================================================

-- Delete orphaned property images (images not referenced in property_images table)
CREATE OR REPLACE FUNCTION cleanup_orphaned_property_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'property-images'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM property_images 
      WHERE storage_path = file_record.name
    ) THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'property-images' 
      AND name = file_record.name;
      deleted_count := deleted_count + 1;
    END IF;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-delete property images when property is deleted
CREATE OR REPLACE FUNCTION delete_property_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all storage objects for this property
  DELETE FROM storage.objects
  WHERE bucket_id = 'property-images'
  AND name LIKE OLD.owner_id::text || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER delete_property_images_trigger
  AFTER DELETE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION delete_property_images();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Storage buckets and policies created successfully!';
  RAISE NOTICE '📦 Buckets: property-images (5MB), avatars (2MB), documents (10MB)';
  RAISE NOTICE '🔐 Policies: Users can only manage their own files';
  RAISE NOTICE '🌐 property-images and avatars are public buckets';
  RAISE NOTICE '🔒 documents is a private bucket';
  RAISE NOTICE '🗑️  Auto-cleanup on property deletion enabled';
END $$;
