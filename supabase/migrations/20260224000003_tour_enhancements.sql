-- Tour Enhancements Migration
-- 1. Add duration_days (integer) and custom_category_label to tours
-- 2. Create tour_description_templates table with seed data

-- ── tours table additions ─────────────────────────────────────────────────────
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS duration_days         integer,
  ADD COLUMN IF NOT EXISTS custom_category_label text;

-- ── tour_description_templates ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tour_description_templates (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_type    text    NOT NULL,
  text         text    NOT NULL,
  tone         text    NOT NULL DEFAULT 'general'
                         CHECK (tone IN ('luxury','budget','family','adventure','romantic','corporate','general')),
  length_class text    NOT NULL DEFAULT 'short'
                         CHECK (length_class IN ('short','medium')),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tdt_tour_type_idx
  ON public.tour_description_templates (tour_type, is_active);

ALTER TABLE public.tour_description_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'tour_description_templates'
      AND policyname = 'Anyone can read active templates'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Anyone can read active templates"
        ON public.tour_description_templates FOR SELECT
        TO authenticated, anon
        USING (is_active = true)
    $policy$;
  END IF;
END $$;

-- ── Seed: 10+ templates per major tour type ───────────────────────────────────
INSERT INTO public.tour_description_templates (tour_type, text, tone, length_class) VALUES

-- Adventure
('Adventure', 'Push your limits on an epic adventure through some of the world''s most dramatic landscapes.', 'adventure', 'short'),
('Adventure', 'Conquer rugged trails, breathtaking peaks, and unforgettable wilderness — built for the bold.', 'adventure', 'short'),
('Adventure', 'An adrenaline-packed experience for thrill-seekers who want to see the world differently.', 'adventure', 'short'),
('Adventure', 'Designed for the adventurous soul — this tour delivers raw nature, real challenge, and pure exhilaration.', 'adventure', 'medium'),
('Adventure', 'Leave the ordinary behind. Explore untamed terrain with expert guides who know every hidden trail.', 'adventure', 'medium'),
('Adventure', 'Affordable thrills without compromise — adventure is for everyone, not just the elite.', 'budget', 'short'),
('Adventure', 'A premium guided adventure with luxury camping, gourmet meals, and personal expedition support.', 'luxury', 'medium'),
('Adventure', 'Perfect for families who want to bond over real outdoor experiences and nature exploration.', 'family', 'short'),
('Adventure', 'Chase waterfalls, summit peaks, and camp under the stars — the ultimate outdoor escape.', 'adventure', 'medium'),
('Adventure', 'An executive team-building adventure designed to challenge, connect, and inspire high-performance teams.', 'corporate', 'medium'),

-- Cultural
('Cultural', 'Immerse yourself in the living culture, history, and traditions of this remarkable destination.', 'general', 'short'),
('Cultural', 'Discover ancient heritage sites, local artisans, and authentic cuisine on this curated cultural journey.', 'general', 'medium'),
('Cultural', 'A luxury cultural experience — private museum access, expert historians, and fine dining included.', 'luxury', 'medium'),
('Cultural', 'Explore world-famous cultural landmarks and hidden local gems without breaking the bank.', 'budget', 'short'),
('Cultural', 'A family-friendly cultural tour where kids and adults discover history together through interactive experiences.', 'family', 'medium'),
('Cultural', 'Walk where history happened. This tour brings stories of the past to vivid life.', 'general', 'short'),
('Cultural', 'A romantic cultural journey through storied streets, candlelit ruins, and intimate local experiences.', 'romantic', 'medium'),
('Cultural', 'Meet the artisans, taste the street food, and hear the stories that guidebooks never tell.', 'adventure', 'short'),
('Cultural', 'Corporate cultural experiences designed to broaden global perspective and inspire teams.', 'corporate', 'medium'),
('Cultural', 'From ancient temples to vibrant local markets — this tour captures the full spectrum of culture.', 'general', 'medium'),

-- Nature
('Nature', 'Experience the raw beauty of nature on this breathtaking journey through pristine landscapes.', 'general', 'short'),
('Nature', 'A slow, mindful journey through forests, wetlands, and natural wonders off the beaten path.', 'general', 'medium'),
('Nature', 'Spot rare wildlife, photograph stunning ecosystems, and disconnect from the noise of modern life.', 'adventure', 'short'),
('Nature', 'Luxury eco-lodges, wildlife safaris, and sustainable travel — nature without sacrificing comfort.', 'luxury', 'medium'),
('Nature', 'Budget-friendly nature escapes — big landscapes, small costs, unforgettable memories.', 'budget', 'short'),
('Nature', 'A family nature adventure where children discover the wonder of the natural world firsthand.', 'family', 'short'),
('Nature', 'Guided nature photography tour — capture breathtaking landscapes and wildlife in perfect light.', 'general', 'medium'),
('Nature', 'A wellness retreat in nature — fresh air, open skies, and landscapes that restore the soul.', 'romantic', 'medium'),
('Nature', 'Hike through valleys, kayak across pristine lakes, and fall asleep to the sound of wilderness.', 'adventure', 'medium'),
('Nature', 'Discover extraordinary natural wonders with expert naturalist guides who bring every detail to life.', 'general', 'medium'),

-- City Tour
('City Tour', 'Discover the best of the city — iconic landmarks, hidden alleyways, and local culture in one tour.', 'general', 'short'),
('City Tour', 'Skip the tourist traps. This insider city tour reveals the real story behind every street corner.', 'general', 'medium'),
('City Tour', 'A luxury city experience — private guides, rooftop views, exclusive access, and premium transport.', 'luxury', 'medium'),
('City Tour', 'See the whole city in one day — an efficient, budget-friendly introduction to everything it offers.', 'budget', 'short'),
('City Tour', 'A family-friendly city adventure with stops kids will love and history adults will appreciate.', 'family', 'short'),
('City Tour', 'Evening city lights, rooftop bars, and romantic walks — the city tour designed for two.', 'romantic', 'medium'),
('City Tour', 'An orientation city tour tailored for corporate groups and executive delegations.', 'corporate', 'short'),
('City Tour', 'From sunrise markets to sunset viewpoints — a full-day photographic journey through the city.', 'adventure', 'medium'),
('City Tour', 'Explore the city''s architectural heritage, street art, and multicultural neighbourhoods on foot.', 'general', 'medium'),
('City Tour', 'Food, history, culture, and views — everything a first-time visitor needs in a single day.', 'general', 'short'),

-- Honeymoon/Romantic
('Honeymoon', 'A handcrafted romantic escape designed to create memories that last a lifetime.', 'romantic', 'short'),
('Honeymoon', 'Private sunsets, intimate dinners, and breathtaking scenery — the perfect honeymoon journey.', 'romantic', 'medium'),
('Honeymoon', 'Luxury romantic retreat — exclusive accommodations, couples'' spa, and bespoke experiences.', 'luxury', 'medium'),
('Honeymoon', 'Celebrate love in some of the world''s most beautiful destinations at an affordable price.', 'budget', 'short'),
('Honeymoon', 'Every detail is planned for romance — all you have to do is enjoy the moment together.', 'romantic', 'short'),
('Honeymoon', 'Secluded beaches, mountain hideaways, and candlelit dinners built for newlyweds.', 'romantic', 'medium'),
('Honeymoon', 'From flower-draped balconies to starlit dinners — a honeymoon tour that surpasses every expectation.', 'luxury', 'medium'),
('Honeymoon', 'An adventurous honeymoon for the couple who would rather hike at sunrise than sleep in.', 'adventure', 'medium'),
('Honeymoon', 'Slow travel, romantic villages, and genuine moments of connection in a stunning destination.', 'romantic', 'medium'),
('Honeymoon', 'Your first adventure as a couple — crafted with care, luxury, and lifelong memories in mind.', 'luxury', 'short'),

-- Wellness
('Wellness', 'Restore your mind, body, and soul with this expertly designed wellness retreat.', 'general', 'short'),
('Wellness', 'A transformative wellness journey — guided meditation, healthy cuisine, and daily yoga in paradise.', 'romantic', 'medium'),
('Wellness', 'Luxury wellness retreat with world-class spa treatments, expert-led sessions, and mindful nutrition.', 'luxury', 'medium'),
('Wellness', 'An affordable wellness escape — recharge completely without overspending.', 'budget', 'short'),
('Wellness', 'Digital detox, breathwork, and reconnection with nature — the reset you have been waiting for.', 'adventure', 'short'),
('Wellness', 'Corporate wellness retreat to reduce burnout, build resilience, and re-energise your team.', 'corporate', 'medium'),
('Wellness', 'Daily sunrise yoga, forest bathing, and holistic therapies in a stunning natural setting.', 'general', 'medium'),
('Wellness', 'A family wellness holiday — mindful activities, nutritious meals, and genuine time together.', 'family', 'medium'),
('Wellness', 'Expert wellness facilitators, serene surroundings, and personalised programmes for lasting change.', 'luxury', 'medium'),
('Wellness', 'Find stillness. Find clarity. Find yourself. This wellness journey changes how you see the world.', 'romantic', 'short'),

-- Food & Drink
('Food & Drink', 'A delicious journey through local flavours, hidden restaurants, and authentic street food.', 'general', 'short'),
('Food & Drink', 'Taste your way through the city with a passionate local food expert leading every stop.', 'general', 'medium'),
('Food & Drink', 'Fine dining, private kitchens, and exclusive tastings — a luxury culinary experience.', 'luxury', 'medium'),
('Food & Drink', 'The best street food, the most authentic bites, all at a price that won''t break the bank.', 'budget', 'short'),
('Food & Drink', 'A family-friendly food tour with interactive cooking, kid-approved tastings, and local produce.', 'family', 'medium'),
('Food & Drink', 'Romantic food and wine pairing evening with intimate local restaurant access.', 'romantic', 'medium'),
('Food & Drink', 'Corporate dining and street food experience — a cultural and culinary team activity.', 'corporate', 'short'),
('Food & Drink', 'From market stalls to chef''s tables, explore the full spectrum of this destination''s food scene.', 'adventure', 'medium'),
('Food & Drink', 'Learn the secrets of local cuisine with hands-on cooking classes guided by a master chef.', 'general', 'medium'),
('Food & Drink', 'A sensory feast — flavours, aromas, and traditions from a food culture unlike any other.', 'general', 'short'),

-- Photography
('Photography', 'Capture stunning landscapes, vibrant culture, and hidden gems guided by a professional photographer.', 'general', 'short'),
('Photography', 'A photography-first tour — golden hour access, insider locations, and expert composition guidance.', 'adventure', 'medium'),
('Photography', 'Shoot the city at dawn, at dusk, and everywhere in between with a world-class photography guide.', 'general', 'medium'),
('Photography', 'Premium photography tour with private access to iconic and off-limits locations.', 'luxury', 'medium'),
('Photography', 'An affordable photography adventure covering the most photogenic spots in the region.', 'budget', 'short'),
('Photography', 'Perfect for couples who want to capture their travel story through a professional lens.', 'romantic', 'short'),
('Photography', 'From wildlife to landscapes, this photography safari puts you in the right place at the right time.', 'adventure', 'medium'),
('Photography', 'A street photography walk revealing the human stories and vivid textures of local life.', 'general', 'medium'),
('Photography', 'Corporate photography workshop — team building through the art of visual storytelling.', 'corporate', 'medium'),
('Photography', 'Improve your skills and build your portfolio on this guided photography expedition.', 'general', 'short')

ON CONFLICT DO NOTHING;
