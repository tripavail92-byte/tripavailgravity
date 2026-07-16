-- =====================================================================
-- BACKFILL: move physical-requirements text out of tours.description
--
-- WHY: the wizard's "Additional Physical Requirements / Logistics" textarea was bound to
-- data.description, so for every operator-created tour the text they typed there IS the
-- description. Nothing else in the wizard ever wrote description (Basics writes
-- short_description), so for wizard tours the move is a straight relocation.
--
-- THE DANGER: the seed migrations (20260210000014, 20260211000001, 20260211000002) inserted
-- demo tours — Grand Canyon, Bali, Tokyo … — with GENUINE marketing descriptions. Those must
-- NOT be touched. They are distinguishable structurally: seeded rows were raw SQL inserts so
-- their draft_data is still the '{}' default, while wizard tours carry a populated draft blob.
--
-- RUN STEP 1 FIRST AND READ IT. Only run step 2 once the preview looks right.
-- =====================================================================


-- ── STEP 1 — PREVIEW (read-only, changes nothing) ───────────────────────────
-- Every tour with a description, and whether the backfill would move it.
-- Eyeball the `description` column: rows marked WILL-MOVE should read like requirements
-- ("be in a comfortable outfit"), NOT like marketing copy. If any marketing copy is marked
-- WILL-MOVE, stop and tell me — do not run step 2.
SELECT
  CASE
    WHEN COALESCE(t.draft_data, '{}'::jsonb) <> '{}'::jsonb THEN 'WILL-MOVE (wizard tour)'
    ELSE 'skip (seeded/demo — draft_data empty)'
  END                                   AS action,
  t.id,
  t.title,
  LEFT(t.description, 120)              AS description,
  t.physical_requirements,
  t.created_at
FROM public.tours t
WHERE COALESCE(TRIM(t.description), '') <> ''
ORDER BY action, t.created_at DESC;


-- ── STEP 2 — THE BACKFILL (DESTRUCTIVE — run only after reviewing step 1) ────
-- Moves (not copies) the text: description -> physical_requirements, then clears description,
-- because that text was never a description. The live tour page hides "About the Journey"
-- when description is empty, so these tours will simply show their new
-- "Physical Requirements & Logistics" section instead.
--
-- Idempotent: only touches rows that don't already have physical_requirements.
/*
BEGIN;

UPDATE public.tours
   SET physical_requirements = description,
       description           = NULL
 WHERE COALESCE(TRIM(description), '') <> ''
   AND COALESCE(TRIM(physical_requirements), '') = ''     -- don't clobber a real value
   AND COALESCE(draft_data, '{}'::jsonb) <> '{}'::jsonb;  -- wizard tours only, never the seeds

-- Sanity-check BEFORE committing. Expect: every row has physical_requirements set and the
-- seeded demo tours still hold their descriptions.
SELECT id, title, LEFT(physical_requirements, 80) AS physical_requirements, description
FROM public.tours
ORDER BY created_at DESC
LIMIT 20;

-- Happy? COMMIT;   Not happy? ROLLBACK;
COMMIT;
*/
