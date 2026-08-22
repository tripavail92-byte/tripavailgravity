-- Sprint 3 / operator supply — recurring verification reminder emails.
--
-- The dashboard already shows an in-app "Verify Now" banner to operators whose
-- verification_status is 'incomplete'. But an operator who published a tour and never
-- returned to the dashboard gets no further nudge; their tours meanwhile show the
-- traveller-facing "Unverified operator" badge. Send them a periodic email reminder.
--
-- Mechanism (no new edge fn needed): the existing send-notification-email edge function
-- fires on INSERT into public.notifications (DB webhook, uses Resend). So we just insert
-- a notification row and the mail goes out. A last_verification_reminder_at column on
-- user_roles gates the cadence (default 7 days) so nobody gets spammed.

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS last_verification_reminder_at TIMESTAMPTZ;

-- Send verification-reminder notifications to all eligible unverified operators.
-- Returns the number of reminders sent. Safe to call more than once per day: the
-- cadence guard makes any extra call a no-op.
CREATE OR REPLACE FUNCTION public.send_operator_verification_reminders(
  p_min_interval interval DEFAULT interval '7 days'
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now  timestamptz := now();
  v_sent int := 0;
  v_row  RECORD;
BEGIN
  FOR v_row IN
    SELECT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role_type = 'tour_operator'
      AND ur.verification_status = 'incomplete'
      AND (
        ur.last_verification_reminder_at IS NULL
        OR ur.last_verification_reminder_at < v_now - p_min_interval
      )
  LOOP
    -- The email edge fn's renderGenericNotification uses these fields directly.
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      v_row.user_id,
      'verification_reminder',
      'Verify your operator account',
      'Complete your identity verification to remove the "Unverified operator" badge from your tours and unlock full payouts. Upload your CNIC (front & back) — it takes about two minutes.',
      jsonb_build_object('cta_url', '/operator/verification', 'cta_label', 'Verify now')
    );

    UPDATE public.user_roles
    SET last_verification_reminder_at = v_now
    WHERE user_id = v_row.user_id AND role_type = 'tour_operator';

    v_sent := v_sent + 1;
  END LOOP;

  RETURN v_sent;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_operator_verification_reminders(interval) TO service_role;

-- Daily at 09:00 UTC. Idempotent unschedule-then-schedule so re-applying the migration
-- doesn't accumulate duplicate jobs.
DO $$
BEGIN
  PERFORM cron.unschedule('operator-verification-reminders');
EXCEPTION WHEN OTHERS THEN
  -- Not scheduled yet — that's fine.
  NULL;
END $$;

SELECT cron.schedule(
  'operator-verification-reminders',
  '0 9 * * *',
  $$SELECT public.send_operator_verification_reminders()$$
);
