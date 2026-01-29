-- TripAvail Database Schema - Amenities Seed Data
-- Migration 002: Populate all 76 amenities from documentation
-- Created: 2025-01-03

-- =====================================================
-- SEED AMENITIES DATA
-- =====================================================

-- Essential Amenities
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('WiFi', 'essential', 'wifi', true, 1),
('Free Parking', 'essential', 'parking', true, 2),
('Air Conditioning', 'essential', 'air-conditioning', true, 3),
('Heating', 'essential', 'heating', true, 4),
('Kitchen', 'essential', 'kitchen', false, 5),
('Washer', 'essential', 'washer', false, 6),
('Dryer', 'essential', 'dryer', false, 7),
('TV', 'essential', 'tv', true, 8),
('Iron', 'essential', 'iron', false, 9),
('Hair Dryer', 'essential', 'hair-dryer', false, 10);

-- Room Features
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Dedicated Workspace', 'room_features', 'desk', true, 11),
('Safe', 'room_features', 'safe', false, 12),
('Hangers', 'room_features', 'hangers', false, 13),
('Bed Linens', 'room_features', 'bed-linens', false, 14),
('Extra Pillows', 'room_features', 'pillows', false, 15),
('Blackout Curtains', 'room_features', 'curtains', false, 16),
('Room Darkening Shades', 'room_features', 'shades', false, 17),
('Soundproofing', 'room_features', 'soundproof', false, 18),
('Coffee Maker', 'room_features', 'coffee', false, 19),
('Mini Fridge', 'room_features', 'fridge', false, 20);

-- Bathroom Amenities
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Hot Water', 'bathroom', 'hot-water', true, 21),
('Shampoo', 'bathroom', 'shampoo', false, 22),
('Conditioner', 'bathroom', 'conditioner', false, 23),
('Body Soap', 'bathroom', 'soap', false, 24),
('Shower Gel', 'bathroom', 'shower-gel', false, 25),
('Bathtub', 'bathroom', 'bathtub', false, 26),
('Bidet', 'bathroom', 'bidet', false, 27),
('Cleaning Products', 'bathroom', 'cleaning', false, 28);

-- Kitchen & Dining
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Refrigerator', 'kitchen_dining', 'refrigerator', false, 29),
('Microwave', 'kitchen_dining', 'microwave', false, 30),
('Stove', 'kitchen_dining', 'stove', false, 31),
('Oven', 'kitchen_dining', 'oven', false, 32),
('Dishwasher', 'kitchen_dining', 'dishwasher', false, 33),
('Coffee Machine', 'kitchen_dining', 'coffee-machine', false, 34),
('Dining Table', 'kitchen_dining', 'dining-table', false, 35),
('Cooking Basics', 'kitchen_dining', 'cooking', false, 36),
('Dishes and Silverware', 'kitchen_dining', 'dishes', false, 37),
('Wine Glasses', 'kitchen_dining', 'wine-glass', false, 38);

-- Outdoor & Recreation
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Pool', 'outdoor_recreation', 'pool', true, 39),
('Hot Tub', 'outdoor_recreation', 'hot-tub', true, 40),
('Gym', 'outdoor_recreation', 'gym', true, 41),
('Garden', 'outdoor_recreation', 'garden', false, 42),
('Patio or Balcony', 'outdoor_recreation', 'balcony', false, 43),
('BBQ Grill', 'outdoor_recreation', 'bbq', false, 44),
('Outdoor Dining', 'outdoor_recreation', 'outdoor-dining', false, 45),
('Beach Access', 'outdoor_recreation', 'beach', true, 46),
('Lake Access', 'outdoor_recreation', 'lake', false, 47),
('Ski-in/Ski-out', 'outdoor_recreation', 'ski', false, 48);

-- Family Features
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Crib', 'family', 'crib', false, 49),
('High Chair', 'family', 'high-chair', false, 50),
('Baby Bath', 'family', 'baby-bath', false, 51),
('Children''s Books and Toys', 'family', 'toys', false, 52),
('Board Games', 'family', 'board-games', false, 53),
('Playground', 'family', 'playground', false, 54);

-- Accessibility
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Wheelchair Accessible', 'accessibility', 'wheelchair', true, 55),
('Elevator', 'accessibility', 'elevator', false, 56),
('Ground Floor Access', 'accessibility', 'ground-floor', false, 57),
('Wide Doorways', 'accessibility', 'wide-door', false, 58),
('Accessible Bathroom', 'accessibility', 'accessible-bathroom', false, 59);

-- Services
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('24/7 Front Desk', 'services', 'front-desk', true, 60),
('Concierge', 'services', 'concierge', false, 61),
('Room Service', 'services', 'room-service', true, 62),
('Housekeeping', 'services', 'housekeeping', false, 63),
('Luggage Storage', 'services', 'luggage', false, 64),
('Airport Shuttle', 'services', 'shuttle', false, 65),
('Laundry Service', 'services', 'laundry', false, 66);

-- Safety & Security
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Smoke Detector', 'safety_security', 'smoke-alarm', true, 67),
('Carbon Monoxide Detector', 'safety_security', 'co-detector', true, 68),
('Fire Extinguisher', 'safety_security', 'fire-extinguisher', true, 69),
('First Aid Kit', 'safety_security', 'first-aid', false, 70),
('Security Cameras', 'safety_security', 'camera', false, 71),
('Keypad Entry', 'safety_security', 'keypad', false, 72);

-- Entertainment
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Smart TV', 'entertainment', 'smart-tv', true, 73),
('Netflix', 'entertainment', 'netflix', true, 74),
('Sound System', 'entertainment', 'sound-system', false, 75),
('Piano', 'entertainment', 'piano', false, 76);

-- Business Facilities
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Business Center', 'business', 'business-center', false, 77),
('Meeting Room', 'business', 'meeting-room', false, 78),
('Printer', 'business', 'printer', false, 79),
('Conference Facilities', 'business', 'conference', false, 80);

-- Wellness & Spa
INSERT INTO amenities (name, category, icon_name, is_popular, display_order) VALUES
('Spa', 'wellness_spa', 'spa', true, 81),
('Sauna', 'wellness_spa', 'sauna', false, 82),
('Steam Room', 'wellness_spa', 'steam-room', false, 83),
('Massage Services', 'wellness_spa', 'massage', false, 84),
('Yoga Classes', 'wellness_spa', 'yoga', false, 85),
('Meditation Room', 'wellness_spa', 'meditation', false, 86);

-- =====================================================
-- VERIFY AMENITY COUNT
-- =====================================================

DO $$ 
DECLARE
  amenity_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO amenity_count FROM amenities;
  
  RAISE NOTICE '✅ Amenities seeded successfully!';
  RAISE NOTICE '📊 Total amenities created: %', amenity_count;
  RAISE NOTICE '🔍 Popular amenities: %', (SELECT COUNT(*) FROM amenities WHERE is_popular = true);
  RAISE NOTICE '📁 Categories: essential, room_features, bathroom, kitchen_dining, outdoor_recreation, family, accessibility, services, safety_security, entertainment, business, wellness_spa';
END $$;
