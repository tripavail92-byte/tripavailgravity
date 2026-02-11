-- Add JSONB columns for structured data storage
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS discount_offers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS free_inclusions JSONB DEFAULT '[]'::jsonb;

-- Comment on columns for documentation
COMMENT ON COLUMN packages.discount_offers IS 'Array of discount objects: {name, originalPrice, discount, icon}';
COMMENT ON COLUMN packages.free_inclusions IS 'Array of inclusion objects: {name, icon}';
