-- ============================================================================
-- Align Tour Pricing & Policy Schema (Enterprise alias compatibility)
-- Date: 2026-03-02
--
-- Canonical/source-of-truth columns:
-- - base_price
-- - require_deposit
-- - cancellation_policy_type
-- - included / excluded
--
-- Legacy columns are kept for backward compatibility and synced one-way:
--   canonical -> legacy
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'cancellation_policy_type_enum'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.cancellation_policy_type_enum AS ENUM (
      'flexible',
      'moderate',
      'strict',
      'non-refundable'
    );
  END IF;
END
$$;

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS base_price numeric,
  ADD COLUMN IF NOT EXISTS require_deposit boolean,
  ADD COLUMN IF NOT EXISTS cancellation_policy_type public.cancellation_policy_type_enum,
  ADD COLUMN IF NOT EXISTS included text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS excluded text[] DEFAULT '{}'::text[];

ALTER TABLE public.tours
  ALTER COLUMN base_price SET DEFAULT 0,
  ALTER COLUMN require_deposit SET DEFAULT false,
  ALTER COLUMN cancellation_policy_type SET DEFAULT 'flexible';

ALTER TABLE public.tours
  ALTER COLUMN deposit_percentage TYPE integer
  USING round(coalesce(deposit_percentage, 0))::integer;

ALTER TABLE public.tours
  ALTER COLUMN deposit_percentage SET DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tours_deposit_percentage_range'
  ) THEN
    ALTER TABLE public.tours
      ADD CONSTRAINT tours_deposit_percentage_range
      CHECK (deposit_percentage >= 0 AND deposit_percentage <= 50);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tours_deposit_toggle_consistency'
  ) THEN
    ALTER TABLE public.tours
      ADD CONSTRAINT tours_deposit_toggle_consistency
      CHECK (require_deposit OR deposit_percentage = 0);
  END IF;
END
$$;

-- Backfill canonical columns from legacy columns (one-time migration)
UPDATE public.tours
SET
  base_price = coalesce(base_price, price),
  require_deposit = coalesce(require_deposit, deposit_required, false),
  included = coalesce(included, inclusions, '{}'::text[]),
  excluded = coalesce(excluded, exclusions, '{}'::text[]),
  cancellation_policy_type = coalesce(
    cancellation_policy_type,
    CASE lower(coalesce(cancellation_policy, 'flexible'))
      WHEN 'strict' THEN 'strict'::public.cancellation_policy_type_enum
      WHEN 'moderate' THEN 'moderate'::public.cancellation_policy_type_enum
      WHEN 'non-refundable' THEN 'non-refundable'::public.cancellation_policy_type_enum
      ELSE 'flexible'::public.cancellation_policy_type_enum
    END
  ),
  deposit_percentage = CASE
    WHEN coalesce(require_deposit, deposit_required, false)
      THEN greatest(0, least(50, coalesce(deposit_percentage, 0)))
    ELSE 0
  END;

CREATE OR REPLACE FUNCTION public.sync_tour_pricing_policy_aliases()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Canonical defaults and guards
  NEW.base_price := coalesce(NEW.base_price, 0);
  NEW.require_deposit := coalesce(NEW.require_deposit, false);
  NEW.cancellation_policy_type := coalesce(
    NEW.cancellation_policy_type,
    'flexible'::public.cancellation_policy_type_enum
  );
  NEW.included := coalesce(NEW.included, '{}'::text[]);
  NEW.excluded := coalesce(NEW.excluded, '{}'::text[]);
  NEW.deposit_percentage := greatest(0, least(50, coalesce(NEW.deposit_percentage, 0)));

  IF NOT NEW.require_deposit THEN
    NEW.deposit_percentage := 0;
  END IF;

  -- One-way compatibility sync: legacy columns <- canonical columns
  NEW.price := NEW.base_price;
  NEW.deposit_required := NEW.require_deposit;
  NEW.cancellation_policy := NEW.cancellation_policy_type::text;
  NEW.inclusions := NEW.included;
  NEW.exclusions := NEW.excluded;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tours_sync_pricing_policy_aliases ON public.tours;
CREATE TRIGGER tours_sync_pricing_policy_aliases
BEFORE INSERT OR UPDATE ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.sync_tour_pricing_policy_aliases();

-- Final sync to ensure legacy columns align for existing rows
UPDATE public.tours
SET
  price = base_price,
  deposit_required = require_deposit,
  cancellation_policy = cancellation_policy_type::text,
  inclusions = included,
  exclusions = excluded;

COMMIT;
