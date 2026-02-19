-- =============================================================================
-- Notification Email Tracking
-- Date: 2026-02-20
--
-- Adds email delivery tracking columns to notifications table.
-- The send-notification-email Edge Function sets these after a
-- successful Resend API call, providing:
--   1. Audit trail for compliance
--   2. Idempotency guard on webhook retries
-- =============================================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS email_sent      BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_sent_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_error     TEXT;       -- last delivery error, if any

-- Index for support queries: "show me all undelivered emails"
CREATE INDEX IF NOT EXISTS idx_notifications_email_sent
  ON public.notifications (email_sent)
  WHERE email_sent = FALSE;

COMMENT ON COLUMN public.notifications.email_sent    IS 'TRUE once Resend confirms delivery (HTTP 200)';
COMMENT ON COLUMN public.notifications.email_sent_at IS 'UTC timestamp of successful delivery';
COMMENT ON COLUMN public.notifications.email_error   IS 'Last Resend error message, cleared on success';
