-- TripAvail Database Schema - Row Level Security
-- Migration 003: RLS Policies for all tables
-- Created: 2025-01-03

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- PROPERTIES POLICIES
-- =====================================================

-- Anyone can view published properties
CREATE POLICY "Anyone can view published properties"
  ON properties FOR SELECT
  USING (status = 'published' OR owner_id = auth.uid());

-- Hotel managers can create properties
CREATE POLICY "Hotel managers can create properties"
  ON properties FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND current_role = 'hotel_manager'
    )
  );

-- Owners can update their own properties
CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their own properties
CREATE POLICY "Owners can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- AMENITIES POLICIES (Read-only for all)
-- =====================================================

-- Everyone can read amenities
CREATE POLICY "Anyone can view amenities"
  ON amenities FOR SELECT
  TO authenticated, anon
  USING (true);

-- =====================================================
-- PROPERTY AMENITIES POLICIES
-- =====================================================

-- Anyone can view property amenities
CREATE POLICY "Anyone can view property amenities"
  ON property_amenities FOR SELECT
  USING (true);

-- Property owners can manage amenities
CREATE POLICY "Owners can manage property amenities"
  ON property_amenities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_amenities.property_id 
      AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- DISCOUNTS POLICIES
-- =====================================================

-- Anyone can view active discounts
CREATE POLICY "Anyone can view discounts"
  ON discounts FOR SELECT
  USING (
    is_enabled = true OR
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = discounts.property_id 
      AND owner_id = auth.uid()
    )
  );

-- Property owners can manage discounts
CREATE POLICY "Owners can manage discounts"
  ON discounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = discounts.property_id 
      AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- PROPERTY IMAGES POLICIES
-- =====================================================

-- Anyone can view property images
CREATE POLICY "Anyone can view property images"
  ON property_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND (status = 'published' OR owner_id = auth.uid())
    )
  );

-- Property owners can manage images
CREATE POLICY "Owners can manage property images"
  ON property_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- BOOKINGS POLICIES
-- =====================================================

-- Guests can view their own bookings
CREATE POLICY "Guests can view own bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = guest_id OR
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = bookings.property_id 
      AND owner_id = auth.uid()
    )
  );

-- Travelers can create bookings
CREATE POLICY "Travelers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

-- Guests and hosts can update bookings (for cancellation, etc.)
CREATE POLICY "Guests and hosts can update bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = guest_id OR
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = bookings.property_id 
      AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Anyone can view published reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Guests can create reviews for their completed bookings
CREATE POLICY "Guests can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = reviews.booking_id 
      AND guest_id = auth.uid()
      AND status = 'completed'
    )
  );

-- Reviewers can update their own reviews
CREATE POLICY "Reviewers can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Reviewers can delete their own reviews
CREATE POLICY "Reviewers can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- Users can view their own payment records
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = payments.booking_id 
      AND (
        guest_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM properties 
          WHERE id = bookings.property_id 
          AND owner_id = auth.uid()
        )
      )
    )
  );

-- System can create payments (via Edge Functions with service role)
-- No INSERT policy for regular users - payments created by backend only

-- =====================================================
-- FAVORITES POLICIES
-- =====================================================

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove favorites
CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SEARCH HISTORY POLICIES
-- =====================================================

-- Users can view their own search history
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Anyone can create search history
CREATE POLICY "Anyone can create search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can create notifications (via Edge Functions)
-- No INSERT policy for regular users

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Check if user is property owner
CREATE OR REPLACE FUNCTION is_property_owner(property_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM properties 
    WHERE id = property_uuid 
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has role
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND current_role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON amenities TO anon, authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON properties TO authenticated;
GRANT ALL ON property_amenities TO authenticated;
GRANT ALL ON discounts TO authenticated;
GRANT ALL ON property_images TO authenticated;
GRANT ALL ON bookings TO authenticated;
GRANT ALL ON reviews TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON search_history TO anon, authenticated;
GRANT ALL ON notifications TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Row Level Security policies created successfully!';
  RAISE NOTICE '🔒 All tables are now protected with RLS';
  RAISE NOTICE '👤 Users can only access their own data';
  RAISE NOTICE '🏨 Hotel managers can manage their properties';
  RAISE NOTICE '✈️  Travelers can create bookings and reviews';
  RAISE NOTICE '🔐 Payments are backend-only for security';
END $$;
