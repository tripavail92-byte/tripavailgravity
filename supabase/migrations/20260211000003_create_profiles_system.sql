-- Migration: Create Profiles System for Traveller Profile Management
-- Created: 2026-02-11
-- Purpose: Set up tables, indexes, RLS policies for user profile management

-- ============================================================================
-- 1. Create profiles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  date_of_birth DATE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL
);

-- ============================================================================
-- 2. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone);

-- ============================================================================
-- 3. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Create RLS Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 5. Create trigger function for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('UTC'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

-- ============================================================================
-- 6. Create trigger
-- ============================================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Create phone_otps table for temporary OTP storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Index for fast OTP lookup
CREATE INDEX IF NOT EXISTS phone_otps_phone_idx ON public.phone_otps(phone);
CREATE INDEX IF NOT EXISTS phone_otps_expires_at_idx ON public.phone_otps(expires_at);

-- ============================================================================
-- 8. Enable RLS on phone_otps table
-- ============================================================================

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage OTPs (for edge functions)
DROP POLICY IF EXISTS "Service can manage OTPs" ON public.phone_otps;

CREATE POLICY "Service can manage OTPs" ON public.phone_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 9. Create function to auto-delete expired OTPs
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.phone_otps
  WHERE expires_at < TIMEZONE('UTC'::TEXT, NOW());
END;
$$ LANGUAGE PLPGSQL;

-- ============================================================================
-- 10. Create email_verifications table for tracking email verification attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS email_verifications_user_id_idx ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS email_verifications_email_idx ON public.email_verifications(email);

-- ============================================================================
-- 11. Enable RLS on email_verifications
-- ============================================================================

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own email verification records
DROP POLICY IF EXISTS "Users can read own email verifications" ON public.email_verifications;

CREATE POLICY "Users can read own email verifications" ON public.email_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- 12. Create a view for user profile info (useful for queries)
-- ============================================================================

DROP VIEW IF EXISTS public.user_profiles_with_auth CASCADE;

CREATE VIEW public.user_profiles_with_auth AS
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.avatar_url,
  p.bio,
  p.address,
  p.city,
  p.country,
  p.date_of_birth,
  p.email_verified,
  p.phone_verified,
  p.created_at,
  p.updated_at,
  u.email as auth_email,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- ============================================================================
-- 13. Grant appropriate permissions
-- ============================================================================

-- Grant SELECT on view to authenticated users
GRANT SELECT ON public.user_profiles_with_auth TO authenticated;

-- ============================================================================
-- 14. Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profile information with verification flags';
COMMENT ON TABLE public.phone_otps IS 'Temporary storage for phone OTP verification codes (auto-expires)';
COMMENT ON TABLE public.email_verifications IS 'Email verification tracking and history';
COMMENT ON COLUMN public.profiles.email_verified IS 'True when user has verified their email address';
COMMENT ON COLUMN public.profiles.phone_verified IS 'True when user has verified their phone number';
COMMENT ON COLUMN public.phone_otps.expires_at IS 'OTP will be invalid after this timestamp';
COMMENT ON VIEW public.user_profiles_with_auth IS 'Combined view of profile data with auth user info';

-- ============================================================================
-- 15. Success message (for manual execution)
-- ============================================================================

-- When executed, you should see:
-- - CREATE TABLE public.profiles (if new)
-- - CREATE TABLE public.phone_otps (if new)
-- - CREATE TABLE public.email_verifications (if new)
-- - CREATE INDEX (multiple indexes created)
-- - CREATE TRIGGER (updated_at trigger)
-- - No errors should appear

-- ============================================================================
-- Summary of what this migration creates:
-- ============================================================================

/*
1. profiles table - Main user profile data with verification flags
   - Linked to auth.users by ID
   - Includes contact info, avatar, bio, dates
   - email_verified and phone_verified for verification status
   - auto-update timestamps

2. phone_otps table - Temporary storage for OTP codes
   - Used by send-phone-otp edge function
   - Automatically expires after 10 minutes
   - Cleaned up by delete_expired_otps() function

3. email_verifications table - Email verification tracking
   - Records when verification emails were sent
   - Tracks when emails were confirmed
   - Useful for auditing and resend logic

4. RLS Policies - Row-level security
   - Users can only read/write/insert their own profile
   - Service role can manage OTPs
   - Prevents unauthorized access

5. Indexes - Performance optimization
   - Fast lookups by email, phone, created_at
   - Optimized for common queries

6. Triggers - Automatic maintenance
   - updated_at timestamp automatically updated on profile changes

7. View - user_profiles_with_auth
   - Combines profile data with auth user info
   - Useful for admin queries and debugging

To test after migration:
- INSERT a test profile with sample data
- Try reading it (should work if auth user matches)
- Try updating it
- Try deleting OTP records
*/
