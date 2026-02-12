-- Migration: Purge & Reset Verification System
-- Created: 2026-02-12
-- Purpose: Erase all legacy verification data and reset partner accounts for the new system

-- 1. Clear all verification data in tour_operator_profiles
UPDATE public.tour_operator_profiles
SET 
    verification_documents = '{}'::jsonb,
    verification_urls = '{}'::jsonb,
    setup_completed = FALSE;

-- 2. Clear all verification data in hotel_manager_profiles
UPDATE public.hotel_manager_profiles
SET 
    first_name = NULL,
    last_name = NULL,
    registration_number = NULL,
    bank_info = '{}'::jsonb,
    verification_documents = '{}'::jsonb,
    verification_urls = '{}'::jsonb,
    setup_completed = FALSE;

-- 3. Reset all partner roles to 'incomplete' in user_roles
UPDATE public.user_roles
SET verification_status = 'incomplete'
WHERE role_type IN ('tour_operator', 'hotel_manager');

-- 4. (Optional) If you want to drop and recreate the storage bucket contents, 
-- we typically do that via script or manual action, but we'll ensure the bucket exists.
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-operator-assets', 'tour-operator-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-manager-assets', 'hotel-manager-assets', true)
ON CONFLICT (id) DO NOTHING;
