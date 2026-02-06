-- Add draft_data column to hotels table to store incomplete listing data
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS draft_data JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.hotels.draft_data IS 'Stores complete form data for draft listings to enable resuming listing creation';
