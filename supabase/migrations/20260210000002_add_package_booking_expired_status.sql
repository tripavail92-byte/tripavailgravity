-- Allow expired status in package_bookings

-- Drop existing status check constraint if present
ALTER TABLE public.package_bookings
DROP CONSTRAINT IF EXISTS package_bookings_status_check;

-- Recreate with expired included
ALTER TABLE public.package_bookings
ADD CONSTRAINT package_bookings_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'expired'));
