-- Restore the notifications email webhook trigger on remote environments

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