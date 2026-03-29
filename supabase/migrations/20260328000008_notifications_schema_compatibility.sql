-- Release 4.5 follow-up: notifications schema compatibility
-- Keeps the canonical body column while tolerating older functions that still write message.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS message TEXT;

UPDATE public.notifications
SET
  body = COALESCE(body, message),
  message = COALESCE(message, body),
  metadata = COALESCE(metadata, '{}'::JSONB)
WHERE body IS NULL
   OR message IS NULL
   OR metadata IS NULL;

CREATE OR REPLACE FUNCTION public.sync_notification_legacy_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.body := COALESCE(NEW.body, NEW.message);
    NEW.message := COALESCE(NEW.message, NEW.body);
    NEW.metadata := COALESCE(NEW.metadata, '{}'::JSONB);
    RETURN NEW;
  END IF;

  IF NEW.body IS DISTINCT FROM OLD.body AND NEW.message IS NOT DISTINCT FROM OLD.message THEN
    NEW.message := NEW.body;
  ELSIF NEW.message IS DISTINCT FROM OLD.message AND NEW.body IS NOT DISTINCT FROM OLD.body THEN
    NEW.body := NEW.message;
  ELSE
    NEW.body := COALESCE(NEW.body, NEW.message, OLD.body, OLD.message);
    NEW.message := COALESCE(NEW.message, NEW.body, OLD.message, OLD.body);
  END IF;

  NEW.metadata := COALESCE(NEW.metadata, OLD.metadata, '{}'::JSONB);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_notification_legacy_columns ON public.notifications;
CREATE TRIGGER trg_sync_notification_legacy_columns
  BEFORE INSERT OR UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_notification_legacy_columns();

COMMENT ON COLUMN public.notifications.body IS 'Canonical notification text body.';
COMMENT ON COLUMN public.notifications.message IS 'Legacy compatibility alias for notification body.';
COMMENT ON COLUMN public.notifications.metadata IS 'Structured notification payload for deep-linking and richer client actions.';