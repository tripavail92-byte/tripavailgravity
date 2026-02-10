-- Seed Sample Data for TripAvail
-- Purpose: Create demo hotels, packages, tours, and operators for testing and demonstration

-- ============================================
-- 1. CREATE DEMO USERS (Hotel Owners & Tour Operators)
-- ============================================

-- Note: Users must be created via Supabase Auth API first, then inserted here
-- This migration assumes the following user IDs exist in auth.users:

-- Hotel Owners:
-- Owner 1: paradise-hotels@tripavail.demo (Grand Paradise Resort)
-- Owner 2: luxury-stays@tripavail.demo (Serene Mountain Lodge)
-- Owner 3: coastal-retreats@tripavail.demo (Tropical Beach Villa)

-- Tour Operators:
-- Operator 1: bali-adventures@tripavail.demo
-- Operator 2: cultural-tours@tripavail.demo
-- Operator 3: extreme-sports@tripavail.demo

-- Manual setup required in Supabase Dashboard:
-- Run this after creating auth users via API or Dashboard

-- ============================================
-- 2. INSERT SAMPLE HOTELS
-- ============================================

-- Hotel 1: Grand Paradise Resort (Maldives)
INSERT INTO public.hotels (
    id,
    owner_id,
    name,
    description,
    location,
    address,
    latitude,
    longitude,
    base_price_per_night,
    rating,
    review_count,
    main_image_url,
    image_urls,
    amenities,
    is_published
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM auth.users WHERE email = 'paradise-hotels@tripavail.demo' LIMIT 1),
    'Grand Paradise Resort',
    'Experience ultimate luxury at our exclusive Maldivian resort. Nestled on a pristine coral island, Grand Paradise Resort offers overwater villas with direct ocean access, world-class spa facilities, and gourmet dining experiences. Perfect for honeymooners and luxury travelers seeking an unforgettable tropical escape.',
    'Maldives',
    'North Male Atoll, 08350 Maldives',
    4.1755,
    73.5093,
    450.00,
    4.8,
    248,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    ARRAY[
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200'
    ],
    ARRAY[
        'Private Beach',
        'Infinity Pool',
        'Spa & Wellness Center',
        'Water Sports',
        'Fine Dining Restaurant',
        'Bar & Lounge',
        'WiFi',
        'Airport Transfer',
        'Snorkeling',
        'Diving Center'
    ],
    true
) ON CONFLICT (id) DO NOTHING;

-- Hotel 2: Serene Mountain Lodge (Switzerland)
INSERT INTO public.hotels (
    id,
    owner_id,
    name,
    description,
    location,
    address,
    latitude,
    longitude,
    base_price_per_night,
    rating,
    review_count,
    main_image_url,
    image_urls,
    amenities,
    is_published
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM auth.users WHERE email = 'luxury-stays@tripavail.demo' LIMIT 1),
    'Serene Mountain Lodge',
    'Escape to the Swiss Alps at our charming mountain retreat. Serene Mountain Lodge combines rustic elegance with modern comfort, offering breathtaking mountain views, cozy fireplaces, and access to world-renowned ski slopes. Ideal for winter sports enthusiasts and nature lovers year-round.',
    'Switzerland',
    'Zermatt, Valais 3920, Switzerland',
    45.9763,
    7.6585,
    380.00,
    4.7,
    192,
    'https://images.unsplash.com/photo-1595706568246-e0cc6f34c180?w=1200',
    ARRAY[
        'https://images.unsplash.com/photo-1595706568246-e0cc6f34c180?w=1200',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'
    ],
    ARRAY[
        'Ski-in/Ski-out Access',
        'Mountain View Rooms',
        'Heated Indoor Pool',
        'Spa & Sauna',
        'Restaurant',
        'Ski Storage',
        'WiFi',
        'Fireplace',
        'Hiking Trails',
        'Fitness Center'
    ],
    true
) ON CONFLICT (id) DO NOTHING;

-- Hotel 3: Tropical Beach Villa (Bali)
INSERT INTO public.hotels (
    id,
    owner_id,
    name,
    description,
    location,
    address,
    latitude,
    longitude,
    base_price_per_night,
    rating,
    review_count,
    main_image_url,
    image_urls,
    amenities,
    is_published
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM auth.users WHERE email = 'coastal-retreats@tripavail.demo' LIMIT 1),
    'Tropical Beach Villa',
    'Discover paradise at our exclusive beachfront villas in Seminyak. Each villa features a private pool, tropical gardens, and direct beach access. Experience authentic Balinese hospitality, traditional spa treatments, and world-class surfing just steps from your door.',
    'Indonesia',
    'Seminyak Beach, Bali 80361, Indonesia',
    -8.6905,
    115.1681,
    280.00,
    4.9,
    356,
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    ARRAY[
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
        'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=1200',
        'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200'
    ],
    ARRAY[
        'Private Pool',
        'Beach Access',
        'Tropical Gardens',
        'Spa Treatments',
        'Yoga Studio',
        'Restaurant',
        'Bar',
        'WiFi',
        'Airport Transfer',
        'Surfboard Rental',
        'Bicycle Rental'
    ],
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. INSERT SAMPLE PACKAGES
-- ============================================

-- Package 1: Maldives Honeymoon Package
INSERT INTO public.packages (
    id,
    owner_id,
    hotel_id,
    package_type,
    name,
    description,
    cover_image,
    media_urls,
    highlights,
    inclusions,
    exclusions,
    max_guests,
    base_price_per_night,
    minimum_nights,
    maximum_nights,
    cancellation_policy,
    is_published
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (SELECT id FROM auth.users WHERE email = 'paradise-hotels@tripavail.demo' LIMIT 1),
    '11111111-1111-1111-1111-111111111111',
    'romantic-getaway',
    'Maldives Honeymoon Paradise',
    'Celebrate your love in ultimate luxury with our exclusive honeymoon package. Enjoy romantic dinners under the stars, couples spa treatments, and private excursions. This all-inclusive experience includes overwater villa accommodation, champagne on arrival, and unforgettable memories that will last a lifetime.',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200',
    ARRAY[
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200'
    ],
    ARRAY[
        'Overwater Villa with Glass Floor',
        'Champagne & Strawberries on Arrival',
        'Private Candlelit Dinner on Beach',
        'Couples Spa Package',
        'Sunset Dolphin Cruise',
        'Complimentary Room Upgrade'
    ],
    ARRAY[
        'Luxury Overwater Villa',
        'Daily Breakfast',
        'One Romantic Dinner',
        'Couples Spa Treatment (90 min)',
        'Sunset Cruise',
        'Champagne on Arrival',
        'Airport Transfers',
        'WiFi',
        '24/7 Butler Service'
    ],
    ARRAY[
        'International Flights',
        'Travel Insurance',
        'Additional Meals',
        'Activities not mentioned',
        'Personal Expenses'
    ],
    2,
    550.00,
    3,
    14,
    'Free cancellation up to 7 days before arrival. 50% refund for cancellations 3-7 days before arrival. No refund for cancellations within 3 days of arrival.',
    true
) ON CONFLICT (id) DO NOTHING;

-- Package 2: Swiss Alps Adventure
INSERT INTO public.packages (
    id,
    owner_id,
    hotel_id,
    package_type,
    name,
    description,
    cover_image,
    media_urls,
    highlights,
    inclusions,
    exclusions,
    max_guests,
    base_price_per_night,
    minimum_nights,
    maximum_nights,
    cancellation_policy,
    is_published
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    (SELECT id FROM auth.users WHERE email = 'luxury-stays@tripavail.demo' LIMIT 1),
    '22222222-2222-2222-2222-222222222222',
    'adventure',
    'Alpine Ski & Wellness Retreat',
    'Combine thrilling mountain adventures with relaxation at our Alpine retreat. Perfect for families and adventure seekers, this package includes ski passes, equipment rental, and daily wellness sessions. After a day on the slopes, unwind in our heated spa overlooking the Matterhorn.',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200',
    ARRAY[
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'
    ],
    ARRAY[
        '5-Day Ski Pass for Zermatt',
        'Professional Ski Equipment Rental',
        'Daily Mountain View Breakfast',
        'Evening Spa Access',
        'Guided Mountain Hiking Tour',
        'Swiss Chocolate Tasting'
    ],
    ARRAY[
        'Mountain View Room',
        'Daily Breakfast Buffet',
        '5-Day Ski Pass',
        'Ski Equipment Rental',
        'Daily Spa Access',
        'One Guided Hiking Tour',
        'WiFi',
        'Parking'
    ],
    ARRAY[
        'Flights',
        'Lunch & Dinner',
        'Ski Lessons',
        'Additional Activities',
        'Travel Insurance'
    ],
    4,
    420.00,
    5,
    10,
    'Free cancellation up to 14 days before arrival. 30% refund for cancellations 7-14 days before arrival. No refund for cancellations within 7 days.',
    true
) ON CONFLICT (id) DO NOTHING;

-- Package 3: Bali Cultural Experience
INSERT INTO public.packages (
    id,
    owner_id,
    hotel_id,
    package_type,
    name,
    description,
    cover_image,
    media_urls,
    highlights,
    inclusions,
    exclusions,
    max_guests,
    base_price_per_night,
    minimum_nights,
    maximum_nights,
    cancellation_policy,
    is_published
) VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    (SELECT id FROM auth.users WHERE email = 'coastal-retreats@tripavail.demo' LIMIT 1),
    '33333333-3333-3333-3333-333333333333',
    'cultural-immersion',
    'Bali Wellness & Culture Journey',
    'Immerse yourself in Balinese culture with our comprehensive wellness package. Experience traditional ceremonies, learn authentic cooking, practice yoga at sunrise, and explore ancient temples. This transformative journey combines luxury accommodation with deep cultural insights and personal renewal.',
    'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=1200',
    ARRAY[
        'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=1200',
        'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200'
    ],
    ARRAY[
        'Private Pool Villa',
        'Daily Sunrise Yoga Sessions',
        'Traditional Balinese Cooking Class',
        'Temple Tour with Local Guide',
        'Balinese Massage & Spa',
        'Cultural Dance Performance'
    ],
    ARRAY[
        'Private Villa with Pool',
        'Daily Breakfast',
        'Daily Yoga Classes',
        'Cooking Class',
        'Temple Tour',
        'Spa Treatment (2 hours)',
        'Cultural Performance Tickets',
        'Airport Transfer',
        'WiFi',
        'Bicycle Rental'
    ],
    ARRAY[
        'Flights',
        'Lunch & Dinner (except cooking class)',
        'Additional Tours',
        'Personal Shopping',
        'Travel Insurance'
    ],
    2,
    320.00,
    4,
    14,
    'Free cancellation up to 10 days before arrival. 40% refund for cancellations 5-10 days before arrival. No refund for cancellations within 5 days.',
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. INSERT SAMPLE TOURS
-- ============================================

-- Tour 1: Bali Ultimate Adventure (by bali-adventures@tripavail.demo)
INSERT INTO public.tours (
    id,
    operator_id,
    title,
    tour_type,
    location,
    duration,
    price,
    currency,
    description,
    short_description,
    images,
    highlights,
    inclusions,
    exclusions,
    requirements,
    min_participants,
    max_participants,
    min_age,
    max_age,
    difficulty_level,
    languages,
    rating,
    review_count,
    is_active,
    is_verified,
    is_featured
) VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    (SELECT id FROM auth.users WHERE email = 'bali-adventures@tripavail.demo' LIMIT 1),
    'Bali Ultimate Adventure Tour',
    'Adventure',
    '{"city": "Ubud", "country": "Indonesia", "lat": -8.5069, "lng": 115.2625}'::jsonb,
    '8 hours',
    89.00,
    'USD',
    'Experience the best of Bali in one unforgettable day! Trek through the iconic Tegallalang Rice Terraces, explore the sacred Tirta Empul Temple with its holy spring water, swim beneath the magnificent Tegenungan Waterfall, and visit a traditional coffee plantation. Our expert guides share fascinating insights into Balinese culture, history, and daily life. This comprehensive tour combines natural beauty, cultural heritage, and authentic experiences.',
    'Full-day adventure through Bali''s temples, rice terraces, and waterfalls with traditional lunch',
    '["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", "https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800", "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800", "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800"]'::jsonb,
    ARRAY[
        'Visit UNESCO Heritage Tegallalang Rice Terraces',
        'Holy water purification at Tirta Empul Temple',
        'Swimming at Tegenungan Waterfall',
        'Traditional Balinese lunch included',
        'Coffee plantation tour with tasting',
        'Professional photographer accompanies tour'
    ],
    ARRAY[
        'Hotel pickup and drop-off (Ubud, Sanur, Seminyak areas)',
        'English-speaking professional guide',
        'All entrance fees and donations',
        'Traditional Balinese lunch',
        'Bottled water throughout the tour',
        'Comprehensive insurance',
        'Free photo package'
    ],
    ARRAY[
        'Personal expenses',
        'Gratuities (optional)',
        'Additional food and beverages',
        'Pickup outside specified areas (surcharge applies)'
    ],
    ARRAY[
        'Moderate fitness level required',
        'Comfortable walking shoes',
        'Swimwear and towel',
        'Sun protection (hat, sunscreen)',
        'Light jacket for temple visits',
        'Modest clothing for temples (sarong provided)'
    ],
    2,
    15,
    8,
    65,
    'moderate',
    ARRAY['English', 'Indonesian', 'Mandarin'],
    4.9,
    387,
    true,
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- Tour 2: Kyoto Cultural Heritage Walk (by cultural-tours@tripavail.demo)
INSERT INTO public.tours (
    id,
    operator_id,
    title,
    tour_type,
    location,
    duration,
    price,
    currency,
    description,
    short_description,
    images,
    highlights,
    inclusions,
    exclusions,
    requirements,
    min_participants,
    max_participants,
    min_age,
    max_age,
    difficulty_level,
    languages,
    rating,
    review_count,
    is_active,
    is_verified,
    is_featured
) VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    (SELECT id FROM auth.users WHERE email = 'cultural-tours@tripavail.demo' LIMIT 1),
    'Kyoto Traditional Cultural Experience',
    'Cultural',
    '{"city": "Kyoto", "country": "Japan", "lat": 35.0116, "lng": 135.7681}'::jsonb,
    '6 hours',
    125.00,
    'USD',
    'Step back in time and discover authentic Kyoto through our exclusive cultural walking tour. Visit the stunning Fushimi Inari Shrine with its thousands of vermillion torii gates, explore the serene bamboo groves of Arashiyama, participate in a traditional tea ceremony, and learn calligraphy from a master. This intimate small-group experience provides deep insights into Japanese traditions, philosophy, and the art of mindful living.',
    'Intimate cultural walk through Kyoto''s temples, tea ceremony, and calligraphy class',
    '["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800", "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800", "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800", "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800"]'::jsonb,
    ARRAY[
        'Visit iconic Fushimi Inari Shrine',
        'Walk through Arashiyama Bamboo Grove',
        'Authentic tea ceremony experience',
        'Calligraphy lesson with master',
        'Traditional Japanese lunch',
        'Small group (max 8 people)'
    ],
    ARRAY[
        'Professional English-speaking cultural guide',
        'All entrance fees',
        'Traditional tea ceremony',
        'Calligraphy lesson and materials',
        'Authentic Japanese lunch',
        'Public transportation tickets',
        'Bottled water'
    ],
    ARRAY[
        'Hotel pickup (meeting point provided)',
        'Personal expenses',
        'Gratuities',
        'Additional food and drinks'
    ],
    ARRAY[
        'Easy walking level',
        'Comfortable walking shoes',
        'Respectful temple attire',
        'Camera (photos allowed in most areas)',
        'Weather-appropriate clothing'
    ],
    1,
    8,
    12,
    80,
    'easy',
    ARRAY['English', 'Japanese'],
    5.0,
    156,
    true,
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- Tour 3: New Zealand Extreme Sports Package (by extreme-sports@tripavail.demo)
INSERT INTO public.tours (
    id,
    operator_id,
    title,
    tour_type,
    location,
    duration,
    price,
    currency,
    description,
    short_description,
    images,
    highlights,
    inclusions,
    exclusions,
    requirements,
    min_participants,
    max_participants,
    min_age,
    max_age,
    difficulty_level,
    languages,
    rating,
    review_count,
    is_active,
    is_verified,
    is_featured
) VALUES (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    (SELECT id FROM auth.users WHERE email = 'extreme-sports@tripavail.demo' LIMIT 1),
    'Queenstown Extreme Adventure Day',
    'Adventure',
    '{"city": "Queenstown", "country": "New Zealand", "lat": -45.0312, "lng": 168.6626}'::jsonb,
    '10 hours',
    299.00,
    'USD',
    'Push your limits with the ultimate adrenaline-packed day in Queenstown, the adventure capital of the world! Start with a breathtaking bungy jump from the historic Kawarau Bridge, soar through the air on the Nevis Swing, jet boat through narrow canyon gorges, and finish with white-water rafting on the Shotover River. All equipment, safety gear, and professional instruction included. Perfect for thrill-seekers looking for an unforgettable rush!',
    '10-hour extreme package: Bungy jump, swing, jet boat, and rafting in Queenstown',
    '["https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800", "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800"]'::jsonb,
    ARRAY[
        'Bungy jump from Kawarau Bridge (43m)',
        'Nevis Swing experience',
        'Shotover Jet boat ride',
        'Grade 3-5 white-water rafting',
        'All safety equipment provided',
        'GoPro footage of all activities'
    ],
    ARRAY[
        'Hotel pickup and drop-off',
        'Professional instructors and guides',
        'All safety equipment and gear',
        'Bungy jump, swing, jet boat, and rafting',
        'Lunch and snacks',
        'GoPro video package',
        'Comprehensive insurance'
    ],
    ARRAY[
        'Personal expenses',
        'Additional photos/videos',
        'Gratuities'
    ],
    ARRAY[
        'Medical clearance required',
        'Weight: 45-130 kg (bungy restrictions)',
        'Must be able to swim',
        'No serious medical conditions',
        'Signed liability waiver',
        'Good physical fitness',
        'Swimwear under clothes',
        'Change of clothes'
    ],
    1,
    12,
    15,
    65,
    'difficult',
    ARRAY['English'],
    4.8,
    523,
    true,
    true,
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. INSERT TOUR SCHEDULES
-- ============================================

-- Bali Adventure Tour - Next 30 days, 3x per week
INSERT INTO public.tour_schedules (tour_id, start_time, end_time, capacity, booked_count, status)
SELECT 
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    (CURRENT_DATE + (day_num || ' days')::interval + '08:00:00'::time) AT TIME ZONE 'UTC',
    (CURRENT_DATE + (day_num || ' days')::interval + '16:00:00'::time) AT TIME ZONE 'UTC',
    15,
    0,
    'scheduled'
FROM generate_series(1, 30) AS day_num
WHERE EXTRACT(DOW FROM CURRENT_DATE + (day_num || ' days')::interval) IN (1, 3, 5) -- Monday, Wednesday, Friday
ON CONFLICT DO NOTHING;

-- Kyoto Cultural Tour - Next 30 days, daily except Sunday
INSERT INTO public.tour_schedules (tour_id, start_time, end_time, capacity, booked_count, status)
SELECT 
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    (CURRENT_DATE + (day_num || ' days')::interval + '09:00:00'::time) AT TIME ZONE 'UTC',
    (CURRENT_DATE + (day_num || ' days')::interval + '15:00:00'::time) AT TIME ZONE 'UTC',
    8,
    0,
    'scheduled'
FROM generate_series(1, 30) AS day_num
WHERE EXTRACT(DOW FROM CURRENT_DATE + (day_num || ' days')::interval) != 0 -- Not Sunday
ON CONFLICT DO NOTHING;

-- Queenstown Extreme - Next 30 days, every day (weather permitting)
INSERT INTO public.tour_schedules (tour_id, start_time, end_time, capacity, booked_count, status)
SELECT 
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    (CURRENT_DATE + (day_num || ' days')::interval + '07:00:00'::time) AT TIME ZONE 'UTC',
    (CURRENT_DATE + (day_num || ' days')::interval + '17:00:00'::time) AT TIME ZONE 'UTC',
    12,
    0,
    'scheduled'
FROM generate_series(1, 30) AS day_num
ON CONFLICT DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================

-- This migration creates:
-- - 3 Hotels (Maldives, Switzerland, Bali) with different owners
-- - 3 Packages (Honeymoon, Ski Adventure, Cultural Experience)
-- - 3 Tours (Bali Adventure, Kyoto Cultural, NZ Extreme)
-- - 90+ Tour Schedules across the next 30 days

-- Note: Auth users must be created separately before running this migration
-- Use Supabase Dashboard or Auth API to create users with the emails specified above
