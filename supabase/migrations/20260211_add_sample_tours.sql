-- Add sample tours for testing
-- Migration: 20260211_add_sample_tours.sql

-- Get or create a tour operator to assign tours to
DO $$
DECLARE
    v_operator_id UUID;
BEGIN
    -- Try to get the first tour operator
    SELECT user_id INTO v_operator_id
    FROM public.user_roles
    WHERE role_type = 'tour_operator'
    LIMIT 1;
    
    -- If none exists, get the first user who has any role
    IF v_operator_id IS NULL THEN
        SELECT user_id INTO v_operator_id
        FROM public.user_roles
        LIMIT 1;
    END IF;
    
    -- Only proceed if we have an operator
    IF v_operator_id IS NOT NULL THEN
        -- Insert 5 diverse sample tours
        INSERT INTO public.tours (
            operator_id, title, tour_type, location, duration, price, currency,
            description, short_description, images, highlights, inclusions, exclusions,
            requirements, min_participants, max_participants, min_age, max_age,
            difficulty_level, languages, group_discounts, pricing_tiers, seasonal_pricing,
            peak_season_multiplier, off_season_multiplier, deposit_required, deposit_percentage,
            cancellation_policy, rating, review_count, is_active, is_verified, is_featured, is_published
        ) VALUES
        -- Tour 1: Adventure
        (
            v_operator_id,
            'Grand Canyon Sunset Adventure',
            'adventure',
            '{"city": "Page", "country": "USA", "address": "Grand Canyon National Park, Arizona"}'::jsonb,
            '6 hours',
            189,
            'USD',
            'Experience the breathtaking beauty of the Grand Canyon at sunset. This adventure tour includes guided hiking, photo opportunities, and a gourmet picnic dinner overlooking one of the world''s natural wonders.',
            'Sunset hiking and dinner at the Grand Canyon',
            '["https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800", "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"]'::jsonb,
            ARRAY['Stunning sunset views', 'Expert local guide', 'Gourmet picnic dinner', 'Small group size (max 12)', 'All equipment provided'],
            ARRAY['Professional guide', 'All hiking equipment', 'Dinner and refreshments', 'Park entrance fees', 'Hotel pickup/dropoff'],
            ARRAY['Personal expenses', 'Gratuities', 'Travel insurance'],
            ARRAY['Moderate fitness level required', 'Comfortable hiking shoes', 'Water bottle', 'Sun protection'],
            4, 12, 12, 70,
            'moderate',
            ARRAY['English', 'Spanish'],
            true,
            '[{"id": "1", "name": "Solo/Duo", "minPeople": 1, "maxPeople": 2, "pricePerPerson": 189}, {"id": "2", "name": "Small Group", "minPeople": 3, "maxPeople": 6, "pricePerPerson": 169}, {"id": "3", "name": "Large Group", "minPeople": 7, "maxPeople": 12, "pricePerPerson": 149}]'::jsonb,
            false, 1.0, 1.0, true, 30,
            'moderate',
            4.8, 127, true, true, true, true
        ),
        -- Tour 2: Cultural
        (
            v_operator_id,
            'Tokyo Street Food & Culture Tour',
            'cultural',
            '{"city": "Tokyo", "country": "Japan", "address": "Shibuya District, Tokyo"}'::jsonb,
            '4 hours',
            95,
            'USD',
            'Discover authentic Tokyo through its incredible street food scene. Visit hidden local spots, taste authentic Japanese cuisine, and learn about the culture from a knowledgeable local guide.',
            'Authentic street food tasting tour in Tokyo',
            '["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"]'::jsonb,
            ARRAY['Visit 6+ food stops', 'Try authentic local dishes', 'Local expert guide', 'Off-the-beaten-path locations', 'Cultural insights'],
            ARRAY['Food tastings at 6 venues', 'English-speaking guide', 'Cultural commentary', 'Small group experience'],
            ARRAY['Additional food/drinks', 'Transportation to meeting point', 'Hotel transfers'],
            ARRAY['Come hungry!', 'Comfortable walking shoes', 'Willingness to try new foods'],
            2, 10, 10, 99,
            'easy',
            ARRAY['English', 'Japanese'],
            true,
            '[{"id": "1", "name": "Individual", "minPeople": 1, "maxPeople": 1, "pricePerPerson": 95}, {"id": "2", "name": "Group", "minPeople": 2, "maxPeople": 10, "pricePerPerson": 85}]'::jsonb,
            false, 1.0, 1.0, false, 0,
            'flexible',
            4.9, 243, true, true, true, true
        ),
        -- Tour 3: Adventure (Extreme)
        (
            v_operator_id,
            'Swiss Alps Paragliding Experience',
            'adventure',
            '{"city": "Interlaken", "country": "Switzerland", "address": "Interlaken, Bernese Oberland"}'::jsonb,
            '3 hours',
            199,
            'USD',
            'Soar above the stunning Swiss Alps on this unforgettable paragliding adventure. Tandem flight with certified instructors, breathtaking mountain views, and memories that will last a lifetime.',
            'Tandem paragliding over the Swiss Alps',
            '["https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"]'::jsonb,
            ARRAY['15-20 minute tandem flight', 'Certified instructors', 'Stunning Alpine views', 'Photo/video package available', 'No experience needed'],
            ARRAY['Tandem paragliding flight', 'All safety equipment', 'Pre-flight briefing', 'Certified pilot', 'Insurance'],
            ARRAY['Photo/video package (€40)', 'Transportation', 'Food and drinks'],
            ARRAY['Good health required', 'Weight limit: 30-115 kg', 'Weather dependent', 'Signed waiver'],
            1, 8, 14, 65,
            'moderate',
            ARRAY['English', 'German', 'French'],
            false,
            '[{"id": "1", "name": "Standard", "minPeople": 1, "maxPeople": 8, "pricePerPerson": 199}]'::jsonb,
            true, 1.3, 0.85, true, 50,
            'strict',
            5.0, 89, true, true, true, true
        ),
        -- Tour 4:Cultural
        (
            v_operator_id,
            'Historic Rome Walking Tour',
            'cultural',
            '{"city": "Rome", "country": "Italy", "address": "Historic Center, Rome"}'::jsonb,
            '3.5 hours',
            65,
            'USD',
            'Step back in time and explore ancient Rome with an expert historian guide. Visit the Colosseum, Roman Forum, and Pantheon while learning about the fascinating history of the Eternal City.',
            'Guided tour of ancient Rome''s iconic landmarks',
            '["https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800", "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800"]'::jsonb,
            ARRAY['Skip-the-line Colosseum access', 'Expert historian guide', 'Roman Forum exploration', 'Pantheon visit', 'Small group tour'],
            ARRAY['Colosseum entrance ticket', 'Roman Forum access', 'Professional guide', 'Headsets for larger groups'],
            ARRAY['Food and drinks', 'Hotel pickup', 'Gratuities'],
            ARRAY['Comfortable walking shoes', 'Water bottle', 'Sun protection in summer'],
            2, 15, 8, 99,
            'easy',
            ARRAY['English', 'Italian', 'Spanish'],
            true,
            '[{"id": "1", "name": "Adult", "minPeople": 1, "maxPeople": 99, "pricePerPerson": 65}, {"id": "2", "name": "Student/Senior", "minPeople": 1, "maxPeople": 99, "pricePerPerson": 55}]'::jsonb,
            false, 1.0, 1.0, false, 0,
            'flexible',
            4.7, 512, true, true, false, true
        ),
        -- Tour 5: Nature
        (
            v_operator_id,
            'Bali Waterfall & Rice Terrace Adventure',
            'nature',
            '{"city": "Ubud", "country": "Indonesia", "address": "Ubud, Bali"}'::jsonb,
            '8 hours',
            85,
            'USD',
            'Discover Bali''s natural wonders on this full-day tour. Visit stunning waterfalls, explore UNESCO rice terraces, and experience traditional Balinese culture with a local guide.',
            'Full-day nature and culture tour in Bali',
            '["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", "https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800"]'::jsonb,
            ARRAY['3 stunning waterfalls', 'Tegalalang Rice Terraces', 'Traditional lunch included', 'Coffee plantation visit', 'Temple stop'],
            ARRAY['Hotel pickup/dropoff', 'Private air-conditioned vehicle', 'English-speaking driver', 'Entrance fees', 'Lunch'],
            ARRAY['Personal expenses', 'Optional activities', 'Gratuities'],
            ARRAY['Modest dress for temples', 'Swimming clothes for waterfalls', 'Comfortable shoes'],
            1, 6, 5, 75,
            'easy',
            ARRAY['English', 'Indonesian'],
            true,
            '[{"id": "1", "name": "Private (1-2 pax)", "minPeople": 1, "maxPeople": 2, "pricePerPerson": 85}, {"id": "2", "name": "Private (3-4 pax)", "minPeople": 3, "maxPeople": 4, "pricePerPerson": 70}, {"id": "3", "name": "Private (5-6 pax)", "minPeople": 5, "maxPeople": 6, "pricePerPerson": 60}]'::jsonb,
            false, 1.0, 1.0, false, 0,
            'moderate',
            4.8, 178, true, true, true, true
        );
        
        -- Add tour schedules (14 days of availability for each tour)
        INSERT INTO public.tour_schedules (tour_id, start_time, end_time, capacity, booked_count, status)
        SELECT 
            t.id,
            (CURRENT_DATE + day_num * interval '1 day' + time '09:00:00') AT TIME ZONE 'UTC',
            (CURRENT_DATE + day_num * interval '1 day' + time '09:00:00' + 
                (CASE 
                    WHEN t.duration LIKE '%8 hour%' THEN interval '8 hours'
                    WHEN t.duration LIKE '%6 hour%' THEN interval '6 hours'
                    WHEN t.duration LIKE '%4 hour%' THEN interval '4 hours'
                    WHEN t.duration LIKE '%3.5 hour%' THEN interval '3.5 hours'
                    ELSE interval '3 hours'
                END)
            ) AT TIME ZONE 'UTC',
            t.max_participants,
            0,
            'scheduled'
        FROM public.tours t
        CROSS JOIN generate_series(1, 14) AS day_num
        WHERE t.operator_id = v_operator_id
        AND t.created_at > NOW() - interval '5 minutes'
        AND NOT EXISTS (
            SELECT 1 FROM public.tour_schedules ts 
            WHERE ts.tour_id = t.id 
            LIMIT 1
        );
        
        RAISE NOTICE 'Successfully added 5 sample tours with schedules';
    ELSE
        RAISE NOTICE 'No users found - skipping tour seeding';
    END IF;
END $$;
