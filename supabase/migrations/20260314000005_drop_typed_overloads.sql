-- ============================================================
-- Drop stale typed overloads for admin partner-status RPCs
-- ============================================================
-- Problem: Two overloads exist simultaneously for each function:
--   (UUID, account_status_enum, TEXT)  ← old (from 20260216000001/000003)
--   (TEXT, TEXT, TEXT)                 ← new (from 20260220000001/000003)
-- PostgREST sends parameters as plain text, so Postgres raises:
--   "could not choose the best candidate function"
--
-- Fix: Drop the old typed overloads. The (TEXT, TEXT, TEXT) versions
-- are the correct, production-ready ones with cascade logic, audit
-- logging, and notifications.
-- ============================================================

DROP FUNCTION IF EXISTS public.admin_set_tour_operator_status(UUID, public.account_status_enum, TEXT);
DROP FUNCTION IF EXISTS public.admin_set_hotel_manager_status(UUID, public.account_status_enum, TEXT);
