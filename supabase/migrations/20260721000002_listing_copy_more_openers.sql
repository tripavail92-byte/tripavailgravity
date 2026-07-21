-- ============================================================================
-- More openers, so "Show others" has somewhere to go
--
-- 20260721000001 seeded 4 openers per property category, exactly one of which references {city}.
-- The client drops a fragment whose placeholders it cannot fill, and the wizard collects the city
-- on step 3 while the description sits on step 2 — so on a partner's first pass through the wizard
-- the usable pool was 3 openers against the 3 suggestions shown. Every opener was therefore always
-- on screen, and paging through the library had nothing left to reach.
--
-- The arithmetic bug that made this visible is fixed in listingCopy.ts. This migration fixes the
-- underlying thinness: with 7 openers per property category (6 usable before the city is known)
-- and 7 per room type, there is a genuine second page, and two partners in the same category are
-- far less likely to land on the same opener.
--
-- Every addition below is positioning or tone. None asserts a facility, a view, a distance, a
-- price, staffing or a guest opinion — the wizard has not verified any of those, and the partner
-- is about to publish this text as their own.
-- ============================================================================

INSERT INTO public.listing_copy_fragments (kind, category, slot, body) VALUES

-- ── Property openers: +3 per category (2 unconditional, 1 using {name}) ─────
-- {name} is safe to lean on here: the property name is the required field directly above the
-- description on the very same step, so unlike {city} it is almost always available.

('property', 'hotel', 'opener', 'A hotel that concentrates on what guests actually notice: a quiet room, a good bed and a prompt welcome.'),
('property', 'hotel', 'opener', 'Reliable and well kept, and easy to deal with from booking through to checkout.'),
('property', 'hotel', 'opener', '{name} is run with the kind of attention that makes a stay effortless.'),

('property', 'resort', 'opener', 'Wide grounds and unhurried days, with room to do as much or as little as you like.'),
('property', 'resort', 'opener', 'Somewhere to stay put for a few days rather than pass through.'),
('property', 'resort', 'opener', '{name} is built for longer stays, where the days stretch out.'),

('property', 'boutique', 'opener', 'A property with a point of view, where the details were chosen rather than ordered.'),
('property', 'boutique', 'opener', 'Small enough that the people who run it know your name by the second morning.'),
('property', 'boutique', 'opener', '{name} was put together with care, and it shows in the details.'),

('property', 'guesthouse', 'opener', 'A modest, welcoming place where the hosts are part of what makes it work.'),
('property', 'guesthouse', 'opener', 'Comfortable rooms and people who are genuinely glad you came.'),
('property', 'guesthouse', 'opener', '{name} is run the way a good guesthouse should be.'),

('property', 'hostel', 'opener', 'Somewhere to drop your bag, meet people and get on with the trip.'),
('property', 'hostel', 'opener', 'Straightforward, properly looked after, and easy to be sociable in.'),
('property', 'hostel', 'opener', '{name} suits travellers who are out all day and back late.'),

('property', 'inn', 'opener', 'Characterful and unhurried, and easy to settle into.'),
('property', 'inn', 'opener', 'A traditional welcome, kept comfortable for the way people travel now.'),
('property', 'inn', 'opener', '{name} offers an old-fashioned welcome without making a performance of it.'),

('property', 'lodge', 'opener', 'A practical, welcoming base for anyone whose plans involve boots.'),
('property', 'lodge', 'opener', 'Somewhere worth coming back to after a long day outside.'),
('property', 'lodge', 'opener', '{name} is set up for early starts and late returns.'),

('property', 'motel', 'opener', 'Easy to find, easy to park at, and easy to leave early from.'),
('property', 'motel', 'opener', 'A clean room and a quiet night, without any fuss about it.'),
('property', 'motel', 'opener', '{name} is built around travellers who are back on the road in the morning.'),

-- ── Room openers: +2 per type ───────────────────────────────────────────────

('room', 'standard', 'opener', 'A quiet, tidy room that does exactly what it should.'),
('room', 'standard', 'opener', 'No frills and no shortcuts — simply a comfortable place to sleep.'),

('room', 'deluxe', 'opener', 'A little more of everything: space, light and considered detail.'),
('room', 'deluxe', 'opener', 'Comfortable in the way that only really shows up in the details.'),

('room', 'suite', 'opener', 'Room enough to spend the day in, not only the night.'),
('room', 'suite', 'opener', 'A layout that lets you close a door between working and resting.'),

('room', 'family', 'opener', 'Enough space that nobody is climbing over anybody else.'),
('room', 'family', 'opener', 'Arranged so that early bedtimes and later evenings can coexist.'),

('room', 'executive', 'opener', 'Quiet, well lit and organised around getting things done.'),
('room', 'executive', 'opener', 'A room that takes a working trip seriously.'),

('room', 'presidential', 'opener', 'The room we are proudest of, and the one we have put the most into.'),
('room', 'presidential', 'opener', 'Space, quiet and finish, all at the top of what we offer.')

ON CONFLICT DO NOTHING;
