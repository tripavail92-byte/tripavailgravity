-- TripAvail Database Schema - Initial Setup
-- Migration 001: Core Tables
-- Created: 2025-01-03

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location features (optional but recommended)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('traveler', 'hotel_manager', 'tour_operator');

-- Property types
CREATE TYPE property_type AS ENUM (
  'hotel',
  'resort', 
  'hostel',
  'villa',
  'apartment',
  'guesthouse',
  'motel',
  'boutique_hotel',
  'bed_and_breakfast',
  'lodge',
  'cottage',
  'cabin'
);

-- Property status
CREATE TYPE property_status AS ENUM ('draft', 'published', 'inactive', 'pending_approval');

-- Booking status
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');

-- Amenity categories
CREATE TYPE amenity_category AS ENUM (
  'essential',
  'room_features',
  'bathroom',
  'kitchen_dining',
  'outdoor_recreation',
  'family',
  'accessibility',
  'services',
  'safety_security',
  'entertainment',
  'business',
  'wellness_spa'
);

-- =====================================================
-- USERS TABLE (Extends Supabase Auth)
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  current_role user_role DEFAULT 'traveler' NOT NULL,
  avatar_url TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  bio TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_current_role ON users(current_role);

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_type property_type NOT NULL,
  status property_status DEFAULT 'draft' NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state_province TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Pricing
  base_price_per_night DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  service_fee_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Capacity
  max_guests INTEGER NOT NULL DEFAULT 2,
  num_bedrooms INTEGER DEFAULT 1,
  num_bathrooms DECIMAL(3, 1) DEFAULT 1,
  num_beds INTEGER DEFAULT 1,
  
  -- Rules
  check_in_time TIME DEFAULT '15:00',
  check_out_time TIME DEFAULT '11:00',
  minimum_stay_nights INTEGER DEFAULT 1,
  maximum_stay_nights INTEGER DEFAULT 365,
  instant_booking BOOLEAN DEFAULT false,
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_country ON properties(country);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_price ON properties(base_price_per_night);
CREATE INDEX idx_properties_rating ON properties(average_rating);
CREATE INDEX idx_properties_published ON properties(published_at) WHERE status = 'published';

-- GiST index for location-based queries
CREATE INDEX idx_properties_location ON properties USING GIST (
  ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =====================================================
-- AMENITIES TABLE (Predefined)
-- =====================================================

CREATE TABLE amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category amenity_category NOT NULL,
  icon_name TEXT,
  description TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_amenities_category ON amenities(category);
CREATE INDEX idx_amenities_popular ON amenities(is_popular) WHERE is_popular = true;

-- =====================================================
-- PROPERTY AMENITIES (Junction Table)
-- =====================================================

CREATE TABLE property_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(property_id, amenity_id)
);

CREATE INDEX idx_property_amenities_property ON property_amenities(property_id);
CREATE INDEX idx_property_amenities_amenity ON property_amenities(amenity_id);

-- =====================================================
-- DISCOUNTS TABLE
-- =====================================================

CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage >= 5 AND percentage <= 70),
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure only one active discount per property
  UNIQUE(property_id)
);

CREATE INDEX idx_discounts_property ON discounts(property_id);
CREATE INDEX idx_discounts_active ON discounts(property_id, is_enabled) WHERE is_enabled = true;

-- =====================================================
-- PROPERTY IMAGES TABLE
-- =====================================================

CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_property_images_property ON property_images(property_id);
CREATE INDEX idx_property_images_cover ON property_images(property_id, is_cover) WHERE is_cover = true;
CREATE INDEX idx_property_images_order ON property_images(property_id, display_order);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference TEXT UNIQUE NOT NULL,
  
  -- Relationships
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Dates
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  
  -- Guests
  num_guests INTEGER NOT NULL,
  num_adults INTEGER NOT NULL,
  num_children INTEGER DEFAULT 0,
  num_infants INTEGER DEFAULT 0,
  
  -- Pricing breakdown
  base_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  service_fee DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  
  -- Status
  status booking_status DEFAULT 'pending' NOT NULL,
  payment_status payment_status DEFAULT 'pending' NOT NULL,
  
  -- Additional info
  special_requests TEXT,
  guest_notes TEXT,
  host_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Constraints
  CHECK (check_out_date > check_in_date),
  CHECK (num_guests > 0),
  CHECK (total_price >= 0)
);

-- Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TA' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  check_in_rating INTEGER CHECK (check_in_rating >= 1 AND check_in_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  
  -- Review content
  comment TEXT,
  
  -- Host response
  host_response TEXT,
  host_response_at TIMESTAMPTZ,
  
  -- Metadata
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- One review per booking
  UNIQUE(booking_id)
);

CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  payment_method TEXT, -- 'card', 'paypal', etc.
  
  -- Stripe integration
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,
  
  -- Status
  status payment_status DEFAULT 'pending' NOT NULL,
  
  -- Metadata
  failure_reason TEXT,
  refund_amount DECIMAL(10, 2) DEFAULT 0,
  refund_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  succeeded_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- =====================================================
-- FAVORITES TABLE
-- =====================================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, property_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);

-- =====================================================
-- SEARCH HISTORY TABLE (Optional - for analytics)
-- =====================================================

CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Search params
  search_query TEXT,
  location TEXT,
  check_in_date DATE,
  check_out_date DATE,
  num_guests INTEGER,
  
  -- Filters applied
  filters JSONB,
  
  -- Results
  result_count INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_created ON search_history(created_at DESC);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL, -- 'booking_confirmed', 'new_review', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity
  related_entity_type TEXT, -- 'booking', 'review', 'property'
  related_entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BOOKING REFERENCE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_reference_trigger BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_booking_reference();

-- =====================================================
-- UPDATE PROPERTY STATS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_property_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average rating and review count
  UPDATE properties
  SET 
    average_rating = (
      SELECT COALESCE(AVG(overall_rating), 0)
      FROM reviews
      WHERE property_id = NEW.property_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE property_id = NEW.property_id
    )
  WHERE id = NEW.property_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_stats_on_review AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_property_stats();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'User profiles extending Supabase Auth';
COMMENT ON TABLE properties IS 'Hotel/property listings';
COMMENT ON TABLE amenities IS 'Predefined amenity options';
COMMENT ON TABLE property_amenities IS 'Junction table linking properties to amenities';
COMMENT ON TABLE discounts IS 'Property promotional discounts';
COMMENT ON TABLE property_images IS 'Property photo gallery';
COMMENT ON TABLE bookings IS 'Guest reservations';
COMMENT ON TABLE reviews IS 'Property reviews from guests';
COMMENT ON TABLE payments IS 'Payment transactions via Stripe';
COMMENT ON TABLE favorites IS 'User-saved properties';
COMMENT ON TABLE notifications IS 'In-app notifications';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ TripAvail database schema created successfully!';
  RAISE NOTICE '📊 Tables created: users, properties, amenities, property_amenities, discounts, property_images, bookings, reviews, payments, favorites, notifications';
  RAISE NOTICE '🔄 Next step: Run 002_seed_amenities.sql to populate amenities';
END $$;
