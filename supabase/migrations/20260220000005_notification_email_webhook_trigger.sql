-- =============================================================================
-- Database Webhook Trigger: Email Notifications
-- Date: 2026-02-20
--
-- Creates a PostgreSQL trigger that fires supabase_functions.http_request()
-- on every INSERT into public.notifications, calling the Edge Function
-- send-notification-email which sends a transactional email via Resend.
--
-- This is the underlying implementation of what the Supabase Dashboard
-- "Database Webhooks" UI creates — tracked here for reproducibility.
-- =============================================================================

DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;

CREATE TRIGGER on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://zkhppxjeaizpyinfpecj.supabase.co/functions/v1/send-notification-email',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '1000'
  );

COMMENT ON TRIGGER on_notification_insert ON public.notifications IS
  'Fires send-notification-email Edge Function on every notification INSERT. Delivers transactional email via Resend.';
