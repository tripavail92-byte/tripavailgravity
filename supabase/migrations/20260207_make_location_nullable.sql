-- Make location nullable to support draft listings
ALTER TABLE public.hotels 
ALTER COLUMN location DROP NOT NULL;

-- Location can be null for draft listings (is_published = false)
-- It will be required when publishing (enforced in application logic)
