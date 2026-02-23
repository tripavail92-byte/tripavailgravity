-- One-time cleanup: Reset verification_status back to 'incomplete' for any
-- user_roles rows that were prematurely set to 'pending' by the old wizard
-- completion code, but have NO actual submitted documents in
-- partner_verification_requests.
--
-- Root cause: saveOnboardingData() was setting verification_status='pending'
-- on wizard completion instead of only after CNIC/selfie/docs upload.
-- This was fixed in commit 9b0c947c but stale DB rows remain.

UPDATE public.user_roles ur
SET    verification_status = 'incomplete'
WHERE  ur.verification_status = 'pending'
  AND  ur.role_type IN ('tour_operator', 'hotel_manager')
  AND  NOT EXISTS (
         SELECT 1
         FROM   public.partner_verification_requests pvr
         WHERE  pvr.user_id      = ur.user_id
           AND  pvr.partner_type = ur.role_type
       );

-- Confirm what was fixed
SELECT ur.user_id, ur.role_type, ur.verification_status AS new_status
FROM   public.user_roles ur
WHERE  ur.role_type IN ('tour_operator', 'hotel_manager')
ORDER  BY ur.role_type, ur.user_id;
