-- Enable Google Maps for the Gold tier (business decision, July 6 2026): tiers
-- differentiate on publish limits + commission/deposit terms, not core listing tooling.
-- The behaviour gate lives in the client (shared engine, already flipped); this row also
-- feeds the "Tier entitlements" display on the operator commercial page — keep them aligned.
UPDATE public.commercial_membership_tiers
   SET google_maps_enabled = true,
       updated_at = TIMEZONE('UTC', NOW())
 WHERE code = 'gold'
   AND google_maps_enabled = false;
