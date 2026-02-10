-- Migration: Storage policies for user avatars
-- Created: 2026-02-11
-- Purpose: Allow public reads of avatar images and allow authenticated users to manage their own files.

-- IMPORTANT
-- If you see: "must be owner of table objects"
-- you are NOT running this as an owner/admin role.
-- Run this in Supabase Dashboard → SQL Editor as the project owner (it typically runs as `postgres`).
-- If the storage tables are owned by `supabase_storage_admin`, run the next line first:
-- SET ROLE supabase_storage_admin;

-- Ensure storage.objects RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Public view user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;

-- Public can read avatars (bucket is public and app uses getPublicUrl)
CREATE POLICY "Public view user avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-avatars');

-- Users can upload/update/delete only inside their own folder: <uid>/...
CREATE POLICY "Users upload own avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
