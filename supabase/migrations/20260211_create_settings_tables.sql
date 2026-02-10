-- Migration: Create Settings Tables for All Roles
-- Created: 2026-02-11
-- Purpose: Add settings tables for travellers, hotel managers, and tour operators

-- ============================================================================
-- 1. Account Settings Table (for travellers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Security Settings
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  
  -- Notification Preferences
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  booking_reminders BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  sms_notifications_enabled BOOLEAN DEFAULT FALSE,
  
  -- Privacy Settings
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends_only')),
  show_activity BOOLEAN DEFAULT TRUE,
  allow_messages_from_anyone BOOLEAN DEFAULT TRUE,
  share_location_with_hosts BOOLEAN DEFAULT FALSE,
  
  -- App Preferences
  theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL
);

-- ============================================================================
-- 2. Hotel Manager Settings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hotel_manager_settings (
  manager_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.hotel_listings(id) ON DELETE SET NULL,
  
  -- Business Information
  business_name TEXT,
  business_registration_number TEXT,
  tax_id TEXT,
  business_phone TEXT,
  business_email TEXT,
  website_url TEXT,
  
  -- Pricing Settings
  base_price_per_night DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  pricing_strategy TEXT DEFAULT 'fixed' CHECK (pricing_strategy IN ('fixed', 'dynamic', 'seasonal')),
  
  -- Payment Settings
  payment_method TEXT,
  bank_account_number TEXT,
  bank_routing_number TEXT,
  stripe_account_id TEXT,
  payment_verified BOOLEAN DEFAULT FALSE,
  
  -- Cancellation Policy
  cancellation_policy TEXT DEFAULT 'flexible' CHECK (cancellation_policy IN ('strict', 'moderate', 'flexible')),
  cancellation_days_before INTEGER DEFAULT 7,
  
  -- Notification Settings
  booking_notifications BOOLEAN DEFAULT TRUE,
  messaging_notifications BOOLEAN DEFAULT TRUE,
  review_notifications BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  
  -- Analytics Settings
  track_analytics BOOLEAN DEFAULT TRUE,
  
  -- Security
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL
);

-- ============================================================================
-- 3. Tour Operator Settings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tour_operator_settings (
  operator_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business Information
  business_name TEXT,
  business_registration_number TEXT,
  tax_id TEXT,
  business_phone TEXT,
  business_email TEXT,
  website_url TEXT,
  
  -- Tour Pricing
  base_tour_price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  pricing_strategy TEXT DEFAULT 'fixed' CHECK (pricing_strategy IN ('fixed', 'dynamic', 'seasonal')),
  
  -- Payment Settings
  payment_method TEXT,
  bank_account_number TEXT,
  stripe_account_id TEXT,
  payment_verified BOOLEAN DEFAULT FALSE,
  
  -- Cancellation & Refund Policy
  cancellation_policy TEXT DEFAULT 'flexible' CHECK (cancellation_policy IN ('strict', 'moderate', 'flexible')),
  cancellation_days_before INTEGER DEFAULT 7,
  refund_percentage INTEGER DEFAULT 100 CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  
  -- Notification Settings
  booking_notifications BOOLEAN DEFAULT TRUE,
  tour_reminders BOOLEAN DEFAULT TRUE,
  messaging_notifications BOOLEAN DEFAULT TRUE,
  review_notifications BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  
  -- Tour Management
  pause_bookings BOOLEAN DEFAULT FALSE,
  max_group_size INTEGER DEFAULT 50,
  
  -- Analytics Settings
  track_analytics BOOLEAN DEFAULT TRUE,
  track_bookings BOOLEAN DEFAULT TRUE,
  
  -- Security
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL
);

-- ============================================================================
-- 4. Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS account_settings_user_id_idx ON public.account_settings(user_id);
CREATE INDEX IF NOT EXISTS hotel_manager_settings_manager_id_idx ON public.hotel_manager_settings(manager_id);
CREATE INDEX IF NOT EXISTS hotel_manager_settings_property_id_idx ON public.hotel_manager_settings(property_id);
CREATE INDEX IF NOT EXISTS tour_operator_settings_operator_id_idx ON public.tour_operator_settings(operator_id);

-- ============================================================================
-- 5. Enable RLS on all tables
-- ============================================================================

ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_manager_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_operator_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Create RLS Policies for account_settings
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own account settings" ON public.account_settings;
DROP POLICY IF EXISTS "Users can update own account settings" ON public.account_settings;
DROP POLICY IF EXISTS "Users can insert own account settings" ON public.account_settings;

CREATE POLICY "Users can read own account settings" ON public.account_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account settings" ON public.account_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own account settings" ON public.account_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. Create RLS Policies for hotel_manager_settings
-- ============================================================================

DROP POLICY IF EXISTS "Hotel managers can read own settings" ON public.hotel_manager_settings;
DROP POLICY IF EXISTS "Hotel managers can update own settings" ON public.hotel_manager_settings;
DROP POLICY IF EXISTS "Hotel managers can insert own settings" ON public.hotel_manager_settings;

CREATE POLICY "Hotel managers can read own settings" ON public.hotel_manager_settings
  FOR SELECT
  USING (auth.uid() = manager_id);

CREATE POLICY "Hotel managers can update own settings" ON public.hotel_manager_settings
  FOR UPDATE
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Hotel managers can insert own settings" ON public.hotel_manager_settings
  FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

-- ============================================================================
-- 8. Create RLS Policies for tour_operator_settings
-- ============================================================================

DROP POLICY IF EXISTS "Tour operators can read own settings" ON public.tour_operator_settings;
DROP POLICY IF EXISTS "Tour operators can update own settings" ON public.tour_operator_settings;
DROP POLICY IF EXISTS "Tour operators can insert own settings" ON public.tour_operator_settings;

CREATE POLICY "Tour operators can read own settings" ON public.tour_operator_settings
  FOR SELECT
  USING (auth.uid() = operator_id);

CREATE POLICY "Tour operators can update own settings" ON public.tour_operator_settings
  FOR UPDATE
  USING (auth.uid() = operator_id)
  WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Tour operators can insert own settings" ON public.tour_operator_settings
  FOR INSERT
  WITH CHECK (auth.uid() = operator_id);

-- ============================================================================
-- 9. Create trigger function for updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_account_settings_updated_at ON public.account_settings;
DROP TRIGGER IF EXISTS update_hotel_manager_settings_updated_at ON public.hotel_manager_settings;
DROP TRIGGER IF EXISTS update_tour_operator_settings_updated_at ON public.tour_operator_settings;

CREATE TRIGGER update_account_settings_updated_at
BEFORE UPDATE ON public.account_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_manager_settings_updated_at
BEFORE UPDATE ON public.hotel_manager_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_operator_settings_updated_at
BEFORE UPDATE ON public.tour_operator_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. Add comments
-- ============================================================================

COMMENT ON TABLE public.account_settings IS 'User account settings for notifications, privacy, and preferences';
COMMENT ON TABLE public.hotel_manager_settings IS 'Business settings for hotel managers including pricing, payment, and policies';
COMMENT ON TABLE public.tour_operator_settings IS 'Business settings for tour operators including pricing, payment, and tour management';
