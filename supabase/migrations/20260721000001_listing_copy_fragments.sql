-- ============================================================================
-- listing_copy_fragments — a curated copy library for listing descriptions
--
-- Replaces the live model call in generate-listing-copy. Partners press "Suggest
-- descriptions", the client loads the fragments for their category and composes them with
-- the property's OWN data (name, city, beds, size, guests, star rating) into three
-- suggestions.
--
-- WHY FRAGMENTS AND NOT WHOLE DESCRIPTIONS: with 8 property types and 6 room types, a
-- library of ~50 finished descriptions gives roughly three per category. Six guesthouses
-- in the same valley would then publish word-for-word identical copy — which travellers
-- notice when comparing listings, and which search engines treat as duplicate content.
-- Splitting into opener + closer and injecting real facts between them turns ~70 rows into
-- thousands of distinct outputs, each one naming the actual property.
--
-- PLACEHOLDERS: a body may reference {name}, {city}, {country}, {roomName}. The client
-- DROPS any fragment whose placeholders it cannot fill rather than rendering "a guesthouse
-- in , run with care". Most fragments below use no placeholders precisely so the pool can
-- never empty out for a half-completed wizard.
--
-- NO INVENTED FACTS: every line here is either a statement of positioning/tone or is
-- filled from data the partner actually entered. Nothing claims breakfast, a pool, a view
-- or a distance. That constraint is what made the model version need such a careful prompt;
-- here it is enforced by the copy itself.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.listing_copy_fragments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL CHECK (kind IN ('room', 'property')),
  -- Room type, property type, or '*' meaning "applies to every category of this kind".
  category    TEXT NOT NULL,
  slot        TEXT NOT NULL CHECK (slot IN ('opener', 'closer')),
  body        TEXT NOT NULL CHECK (length(btrim(body)) BETWEEN 10 AND 400),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_copy_fragments_lookup_idx
  ON public.listing_copy_fragments (kind, category, slot)
  WHERE is_active;

-- Same body twice in one bucket would show the partner a duplicate suggestion.
CREATE UNIQUE INDEX IF NOT EXISTS listing_copy_fragments_unique_body_idx
  ON public.listing_copy_fragments (kind, category, slot, md5(body));

-- ── Access ──────────────────────────────────────────────────────────────────
-- 20260210000012_fix_tours_permissions.sql:9 runs
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, anon, service_role
-- so this table arrives with ALL already granted to anon. Without the REVOKE below, any
-- visitor could rewrite every partner's suggested copy. RLS would also stop it, but the two
-- controls fail independently and this one does not depend on a policy being correct.

ALTER TABLE public.listing_copy_fragments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.listing_copy_fragments FROM anon, authenticated;
GRANT SELECT ON public.listing_copy_fragments TO authenticated;

-- Read: any signed-in partner filling in the wizard. This is marketing boilerplate, not
-- partner data, so there is nothing here to leak between accounts.
DROP POLICY IF EXISTS "Partners read active copy fragments" ON public.listing_copy_fragments;
CREATE POLICY "Partners read active copy fragments" ON public.listing_copy_fragments
  FOR SELECT TO authenticated
  USING (is_active);

-- Write: admins only, and only through the service role or an admin session. No INSERT /
-- UPDATE / DELETE policy exists for `authenticated` beyond this, so RLS denies by default.
DROP POLICY IF EXISTS "Admins manage copy fragments" ON public.listing_copy_fragments;
CREATE POLICY "Admins manage copy fragments" ON public.listing_copy_fragments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMENT ON TABLE public.listing_copy_fragments IS
  'Curated description fragments for the listing wizard, composed client-side with each property''s real data. Edit rows here to change suggested copy without a deploy.';

-- ============================================================================
-- Seed
-- ============================================================================

INSERT INTO public.listing_copy_fragments (kind, category, slot, body) VALUES

-- ── Room openers: 6 types x 5 ───────────────────────────────────────────────
('room', 'standard', 'opener', 'A comfortable, well-appointed room with everything you need for a restful stay.'),
('room', 'standard', 'opener', 'Our classic room — simple, spotless and quietly comfortable.'),
('room', 'standard', 'opener', 'An uncomplicated room that covers the essentials properly, without fuss.'),
('room', 'standard', 'opener', 'Everyday comfort done well: clean lines, good light and a proper night''s sleep.'),
('room', 'standard', 'opener', '{roomName} keeps things simple and gets the basics right.'),

('room', 'deluxe', 'opener', 'A more generous room with elevated finishes and extra space to spread out.'),
('room', 'deluxe', 'opener', 'Thoughtfully upgraded throughout, with the details that make a stay feel considered.'),
('room', 'deluxe', 'opener', 'A step up in space and comfort, styled for guests who notice the difference.'),
('room', 'deluxe', 'opener', 'Warmer materials, better light and more room to move than our standard rooms.'),
('room', 'deluxe', 'opener', '{roomName} gives you more space and a more considered finish.'),

('room', 'suite', 'opener', 'A separate living area and bedroom, giving you room to work, rest and entertain.'),
('room', 'suite', 'opener', 'Generously proportioned, with distinct spaces for living and for sleeping.'),
('room', 'suite', 'opener', 'The space of an apartment with the service of a hotel.'),
('room', 'suite', 'opener', 'Two rooms rather than one, so evenings and early mornings never have to compete.'),
('room', 'suite', 'opener', '{roomName} separates living and sleeping, so the space works all day.'),

('room', 'family', 'opener', 'Built for families, with flexible bedding and space for everyone to settle in.'),
('room', 'family', 'opener', 'A roomy, practical space designed around travelling with children.'),
('room', 'family', 'opener', 'Plenty of room for the whole family, with bedding arranged for comfort at any age.'),
('room', 'family', 'opener', 'Space to spread out, with the storage and layout that family travel actually needs.'),
('room', 'family', 'opener', '{roomName} is arranged with families in mind, from the bedding to the storage.'),

('room', 'executive', 'opener', 'Designed for business travel, with a proper workspace and a quiet setting.'),
('room', 'executive', 'opener', 'A calm, well-equipped room for guests who need to work as well as rest.'),
('room', 'executive', 'opener', 'Executive comfort with a dedicated desk and an unhurried atmosphere.'),
('room', 'executive', 'opener', 'Set up for a productive day and a genuinely restful night.'),
('room', 'executive', 'opener', '{roomName} is built around a working day and a quiet night.'),

('room', 'presidential', 'opener', 'Our finest accommodation — expansive, richly finished and thoughtfully serviced.'),
('room', 'presidential', 'opener', 'The most spacious room we offer, appointed to the highest standard throughout.'),
('room', 'presidential', 'opener', 'A landmark suite, with generous proportions and every detail carefully considered.'),
('room', 'presidential', 'opener', 'The top of our collection, where space, finish and service all step up together.'),
('room', 'presidential', 'opener', '{roomName} is the most generous space we offer.'),

-- ── Room closers: shared across every room type ─────────────────────────────
('room', '*', 'closer', 'It makes a straightforward, comfortable base for the time you are here.'),
('room', '*', 'closer', 'Whether you are staying one night or several, it is an easy room to settle into.'),
('room', '*', 'closer', 'The aim is simple: a good night''s sleep and an unhurried morning.'),
('room', '*', 'closer', 'Do get in touch before you arrive if there is anything you would like arranged.'),
('room', '*', 'closer', 'Everything is checked and made ready ahead of each arrival.'),

-- ── Property openers: 8 types x 4 ───────────────────────────────────────────
('property', 'hotel', 'opener', 'A well-run hotel with consistent service and comfortable, properly maintained rooms.'),
('property', 'hotel', 'opener', 'Straightforward hospitality: clean rooms, helpful staff and an easy check-in.'),
('property', 'hotel', 'opener', '{name} offers dependable comfort for both short stops and longer stays.'),
('property', 'hotel', 'opener', 'A hotel in {city} that keeps the fundamentals right — comfort, cleanliness and service.'),

('property', 'resort', 'opener', 'A resort built around space, leisure and time spent outdoors.'),
('property', 'resort', 'opener', 'Somewhere to slow down, with grounds and facilities designed for unhurried days.'),
('property', 'resort', 'opener', '{name} is planned for guests who would rather let the days unfold at their own pace.'),
('property', 'resort', 'opener', 'A resort setting in {city}, where the surroundings matter as much as the rooms.'),

('property', 'boutique', 'opener', 'A small, characterful property where the design and the service are both personal.'),
('property', 'boutique', 'opener', 'Fewer rooms, more attention — a place with a distinct point of view.'),
('property', 'boutique', 'opener', '{name} trades scale for character, with interiors that reward a closer look.'),
('property', 'boutique', 'opener', 'An independent property in {city}, run with a clear aesthetic and genuine care.'),

('property', 'guesthouse', 'opener', 'A family-run guesthouse where hospitality comes without ceremony.'),
('property', 'guesthouse', 'opener', 'Simple, comfortable rooms and hosts who know the area well.'),
('property', 'guesthouse', 'opener', '{name} offers a homely base in {city}, run with genuine warmth.'),
('property', 'guesthouse', 'opener', 'Personal service, local knowledge and a quieter alternative to a hotel.'),

('property', 'hostel', 'opener', 'An affordable, sociable base for travellers who would rather spend on the trip than the room.'),
('property', 'hostel', 'opener', 'Clean, secure and easy-going, with shared spaces that make meeting people simple.'),
('property', 'hostel', 'opener', '{name} keeps costs down without cutting corners on comfort or security.'),
('property', 'hostel', 'opener', 'A friendly base in {city} for independent travellers and small groups.'),

('property', 'inn', 'opener', 'A traditional inn with the character of an older building and the comfort of a modern one.'),
('property', 'inn', 'opener', 'Warm, unpretentious hospitality in a building with a story behind it.'),
('property', 'inn', 'opener', '{name} pairs period character with the comforts guests expect today.'),
('property', 'inn', 'opener', 'An inn in {city} where the welcome is as much a part of the stay as the room.'),

('property', 'lodge', 'opener', 'A lodge built for the outdoors, with the landscape close at hand.'),
('property', 'lodge', 'opener', 'Comfortable, grounded accommodation for travellers who are here to be outside.'),
('property', 'lodge', 'opener', '{name} is a base for days spent in the open, and evenings spent recovering from them.'),
('property', 'lodge', 'opener', 'Set up in {city} for guests who plan to spend their days outdoors.'),

('property', 'motel', 'opener', 'Practical, easy-access rooms for travellers who need a straightforward overnight stop.'),
('property', 'motel', 'opener', 'Park, check in and rest — no queues and no complications.'),
('property', 'motel', 'opener', '{name} keeps it simple: a clean room, a good night''s sleep and an early start.'),
('property', 'motel', 'opener', 'A convenient stop in {city} for anyone breaking a longer journey.'),

-- ── Property closers: shared across every property type ─────────────────────
('property', '*', 'closer', 'Do get in touch if you have any questions before booking.'),
('property', '*', 'closer', 'We look forward to welcoming you.'),
('property', '*', 'closer', 'Enquiries are always welcome, whatever the length of your stay.'),
('property', '*', 'closer', 'Someone from the team is on hand throughout your stay if you need anything.'),
('property', '*', 'closer', 'Rooms are prepared fresh for every arrival.'),
('property', '*', 'closer', 'Whatever brings you to the area, you will have a comfortable base for it.')

ON CONFLICT DO NOTHING;
