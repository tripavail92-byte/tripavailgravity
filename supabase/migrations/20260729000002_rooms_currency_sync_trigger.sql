-- ============================================================================
-- Structural fix: rooms.currency is the source of truth for hotel currency
--
-- THE PROBLEM. The wizard's "Property Details" step defaults the currency
-- dropdown to USD. A Pakistani partner who never touches it ends up with
-- hotels.currency = USD while all their rooms carry PKR prices. The amount is
-- identical on both sides — only the label differs — so downstream code that
-- trusts hotels.currency (search price normalisation, default-stay generation)
-- produces wildly wrong numbers.
--
-- Phase 0c fixed the existing data. This migration prevents recurrence by:
--
--   1. Tightening rooms.currency: NOT NULL + FK to currencies(code), matching
--      hotels.currency which already has both.
--
--   2. A trigger that fires AFTER INSERT/UPDATE/DELETE on rooms. When every
--      room on a hotel agrees on a single currency that differs from the
--      hotel's, the hotel is auto-corrected. When rooms disagree with each
--      other, nothing happens — that is a human decision.
--
-- The trigger runs inside the same transaction as the DML that fired it, so
-- the hotel row is always consistent by the time COMMIT returns. It is
-- SECURITY DEFINER so it can update hotels regardless of who wrote the room.
--
-- PERFORMANCE. One query per affected hotel_id per room write. On the current
-- data (≤12 rooms per hotel) this is sub-millisecond. The trigger only fires
-- on currency-column changes (UPDATE OF currency) or row-level INSERTs and
-- DELETEs, not on price or name edits.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — Tighten rooms.currency to match hotels.currency's constraints.
-- ──────────────────────────────────────────────────────────────────────────

-- Backfill any NULLs before adding NOT NULL. Inherits the hotel's currency
-- where available; falls back to USD (the column default) otherwise.
UPDATE public.rooms r
SET currency = COALESCE(
  (SELECT h.currency FROM public.hotels h WHERE h.id = r.hotel_id),
  'USD'
)
WHERE r.currency IS NULL;

ALTER TABLE public.rooms
  ALTER COLUMN currency SET NOT NULL;

-- FK to currencies(code). hotels.currency already has this; rooms did not.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rooms_currency_fk'
      AND table_name = 'rooms'
  ) THEN
    ALTER TABLE public.rooms
      ADD CONSTRAINT rooms_currency_fk
      FOREIGN KEY (currency) REFERENCES public.currencies(code);
  END IF;
END $$;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2 — Trigger function: sync hotels.currency from rooms.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_hotel_currency_from_rooms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hotel_id    uuid;
  v_room_cur    text;
  v_n_distinct  int;
BEGIN
  v_hotel_id := COALESCE(NEW.hotel_id, OLD.hotel_id);

  SELECT count(DISTINCT r.currency), min(r.currency)
    INTO v_n_distinct, v_room_cur
    FROM public.rooms r
   WHERE r.hotel_id = v_hotel_id;

  -- Sync only when every room agrees and the hotel disagrees.
  -- Zero rooms (all deleted) → leave the hotel label alone.
  IF v_n_distinct = 1 AND v_room_cur IS NOT NULL THEN
    UPDATE public.hotels
       SET currency   = v_room_cur,
           updated_at = NOW()
     WHERE id = v_hotel_id
       AND currency IS DISTINCT FROM v_room_cur;
  END IF;

  RETURN NULL;  -- AFTER trigger; return value is ignored.
END;
$$;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3 — Attach the trigger.
-- ──────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_sync_hotel_currency ON public.rooms;

CREATE TRIGGER trg_sync_hotel_currency
  AFTER INSERT OR UPDATE OF currency OR DELETE
  ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_hotel_currency_from_rooms();


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY
-- ──────────────────────────────────────────────────────────────────────────

-- (1) No NULL room currencies remain.
SELECT count(*) AS null_room_currencies
  FROM public.rooms
 WHERE currency IS NULL;
-- Expect 0.

-- (2) FK is in place.
SELECT constraint_name
  FROM information_schema.table_constraints
 WHERE table_name = 'rooms'
   AND constraint_name = 'rooms_currency_fk';
-- Expect 1 row.

-- (3) Trigger exists.
SELECT tgname
  FROM pg_trigger
 WHERE tgname = 'trg_sync_hotel_currency';
-- Expect 1 row.
