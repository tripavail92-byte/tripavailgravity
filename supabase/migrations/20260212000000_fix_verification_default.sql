-- Migration: Fix Default Verification Status
-- Created: 2026-02-12
-- Purpose: Change default status to 'incomplete' and fix existing records

-- 1. Change default for future records
ALTER TABLE public.user_roles 
ALTER COLUMN verification_status SET DEFAULT 'incomplete';

-- 2. Fix existing records for tour operators and hotel managers 
-- If setup_completed from their profile is false, set status to 'incomplete'
UPDATE public.user_roles ur
SET verification_status = 'incomplete'
FROM public.tour_operator_profiles top
WHERE ur.user_id = top.user_id 
  AND ur.role_type = 'tour_operator'
  AND ur.verification_status = 'pending'
  AND top.setup_completed = FALSE;

UPDATE public.user_roles ur
SET verification_status = 'incomplete'
FROM public.hotel_manager_profiles hmp
WHERE ur.user_id = hmp.user_id 
  AND ur.role_type = 'hotel_manager'
  AND ur.verification_status = 'pending'
  AND hmp.setup_completed = FALSE;

-- Optional: Reset travellers to approved or null if they were pending
UPDATE public.user_roles
SET verification_status = 'approved'
WHERE role_type = 'traveller' 
  AND (verification_status = 'pending' OR verification_status = 'incomplete');
