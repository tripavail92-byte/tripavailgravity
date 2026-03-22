-- Migration: Storage policies for user avatars
-- Created: 2026-02-11
-- Purpose: Allow public reads of avatar images and allow authenticated users to manage their own files.

-- IMPORTANT
-- If you see: "must be owner of table objects"
-- you are NOT running this as an owner/admin role.
-- Run this in Supabase Dashboard → SQL Editor as the project owner (it typically runs as `postgres`).
DO $$
DECLARE
  v_storage_owner TEXT;
BEGIN
  SELECT tableowner
  INTO v_storage_owner
  FROM pg_tables
  WHERE schemaname = 'storage'
    AND tablename = 'objects';

  IF v_storage_owner IS NULL THEN
    RAISE NOTICE 'Skipping avatar storage policies because storage.objects is unavailable';
    RETURN;
  END IF;

  IF current_user <> v_storage_owner THEN
    RAISE NOTICE 'Skipping avatar storage policies because current_user % does not own storage.objects (owner: %)', current_user, v_storage_owner;
    RETURN;
  END IF;

  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Public view user avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;

  CREATE POLICY "Public view user avatars" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'user-avatars');

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
END $$;
