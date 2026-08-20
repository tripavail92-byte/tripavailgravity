-- Room-sharing / accommodation pricing for multi-day tours.
--
-- Multi-day trips charge a per-person price that varies by room sharing (Quad/Triple/Double/Solo)
-- because the hotel cost per person changes with occupancy, plus child rates. This stores that
-- pricing so the traveller booking card can offer a sharing selector + traveller-type counts and
-- vary the total. Empty {} (the default) means a single-price tour — unchanged behaviour.
--
-- Shape:
--   {
--     "enabled": true,
--     "tiers": [ { "key": "quad", "label": "Quad sharing", "pricePerPerson": 62000 }, ... ],
--     "childRates": { "withBed": 0.8, "noBed": 0.6, "infant": 0 }
--   }
--
-- Additive + defaulted, so existing tours are untouched.
alter table public.tours
  add column if not exists accommodation_pricing jsonb not null default '{}'::jsonb;

comment on column public.tours.accommodation_pricing is
  'Room-sharing pricing for multi-day tours: { enabled, tiers:[{key,label,pricePerPerson}], childRates:{withBed,noBed,infant} }. Empty {} = single per-person price.';
