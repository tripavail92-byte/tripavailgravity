BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_commission_collection_amounts(
  p_booking_total NUMERIC,
  p_payment_collected NUMERIC,
  p_refund_amount NUMERIC,
  p_commission_rate NUMERIC
)
RETURNS TABLE (
  commission_total NUMERIC(12,2),
  commission_collected NUMERIC(12,2),
  commission_remaining NUMERIC(12,2)
)
LANGUAGE sql
IMMUTABLE
AS $$
  WITH normalized AS (
    SELECT
      ROUND(GREATEST(COALESCE(p_booking_total, 0), 0), 2) AS booking_total,
      ROUND(GREATEST(COALESCE(p_payment_collected, 0), 0), 2) AS payment_collected,
      ROUND(GREATEST(COALESCE(p_refund_amount, 0), 0), 2) AS refund_amount,
      GREATEST(COALESCE(p_commission_rate, 0), 0) AS commission_rate
  ),
  computed AS (
    SELECT
      ROUND(booking_total * commission_rate / 100.0, 2) AS commission_total,
      LEAST(
        ROUND(booking_total * commission_rate / 100.0, 2),
        ROUND(GREATEST(LEAST(booking_total, payment_collected - refund_amount), 0) * commission_rate / 100.0, 2)
      ) AS commission_collected
    FROM normalized
  )
  SELECT
    commission_total,
    commission_collected,
    ROUND(GREATEST(commission_total - commission_collected, 0), 2) AS commission_remaining
  FROM computed;
$$;

ALTER TABLE public.operator_booking_finance_snapshots
  ADD COLUMN IF NOT EXISTS commission_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_total >= 0),
  ADD COLUMN IF NOT EXISTS commission_collected NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_collected >= 0),
  ADD COLUMN IF NOT EXISTS commission_remaining NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_remaining >= 0);

ALTER TABLE public.operator_commission_ledger
  ADD COLUMN IF NOT EXISTS commission_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_total >= 0),
  ADD COLUMN IF NOT EXISTS commission_collected NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_collected >= 0),
  ADD COLUMN IF NOT EXISTS commission_remaining NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_remaining >= 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'operator_booking_finance_snapshots_commission_split_balanced'
  ) THEN
    ALTER TABLE public.operator_booking_finance_snapshots
      ADD CONSTRAINT operator_booking_finance_snapshots_commission_split_balanced
      CHECK (commission_total = commission_collected + commission_remaining);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'operator_commission_ledger_commission_split_balanced'
  ) THEN
    ALTER TABLE public.operator_commission_ledger
      ADD CONSTRAINT operator_commission_ledger_commission_split_balanced
      CHECK (commission_total = commission_collected + commission_remaining);
  END IF;
END
$$;

WITH recomputed_snapshot_commission AS (
  SELECT
    snapshot.booking_id,
    calc.commission_total,
    calc.commission_collected,
    calc.commission_remaining
  FROM public.operator_booking_finance_snapshots AS snapshot
  CROSS JOIN LATERAL public.calculate_commission_collection_amounts(
    snapshot.booking_total,
    snapshot.payment_collected,
    snapshot.refund_amount,
    snapshot.commission_rate
  ) AS calc
)
UPDATE public.operator_booking_finance_snapshots AS snapshot
SET
  commission_amount = recomputed_snapshot_commission.commission_total,
  commission_total = recomputed_snapshot_commission.commission_total,
  commission_collected = recomputed_snapshot_commission.commission_collected,
  commission_remaining = recomputed_snapshot_commission.commission_remaining,
  updated_at = TIMEZONE('UTC', NOW())
FROM recomputed_snapshot_commission
WHERE recomputed_snapshot_commission.booking_id = snapshot.booking_id;

UPDATE public.operator_commission_ledger AS ledger
SET
  commission_amount = calc.commission_total,
  commission_total = calc.commission_total,
  commission_collected = calc.commission_collected,
  commission_remaining = calc.commission_remaining,
  updated_at = TIMEZONE('UTC', NOW())
FROM public.operator_booking_finance_snapshots AS snapshot
CROSS JOIN LATERAL public.calculate_commission_collection_amounts(
  snapshot.booking_total,
  snapshot.payment_collected,
  snapshot.refund_amount,
  snapshot.commission_rate
) AS calc
WHERE snapshot.booking_id = ledger.booking_id;

CREATE OR REPLACE FUNCTION public.sync_operator_booking_commission_split()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calc RECORD;
BEGIN
  SELECT *
  INTO v_calc
  FROM public.calculate_commission_collection_amounts(
    NEW.booking_total,
    NEW.payment_collected,
    NEW.refund_amount,
    NEW.commission_rate
  );

  NEW.commission_amount := v_calc.commission_total;
  NEW.commission_total := v_calc.commission_total;
  NEW.commission_collected := LEAST(v_calc.commission_collected, COALESCE(NEW.payment_collected, 0));
  NEW.commission_remaining := v_calc.commission_remaining;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS operator_booking_finance_snapshots_sync_commission_split ON public.operator_booking_finance_snapshots;
CREATE TRIGGER operator_booking_finance_snapshots_sync_commission_split
BEFORE INSERT OR UPDATE OF booking_total, payment_collected, refund_amount, commission_rate
ON public.operator_booking_finance_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_booking_commission_split();

CREATE OR REPLACE FUNCTION public.sync_operator_commission_ledger_split()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot public.operator_booking_finance_snapshots%ROWTYPE;
  v_calc RECORD;
BEGIN
  IF NEW.booking_id IS NOT NULL THEN
    SELECT *
    INTO v_snapshot
    FROM public.operator_booking_finance_snapshots
    WHERE booking_id = NEW.booking_id;
  END IF;

  SELECT *
  INTO v_calc
  FROM public.calculate_commission_collection_amounts(
    COALESCE(v_snapshot.booking_total, NEW.booking_total),
    COALESCE(v_snapshot.payment_collected, NEW.booking_total),
    COALESCE(v_snapshot.refund_amount, 0),
    NEW.commission_rate
  );

  NEW.commission_amount := v_calc.commission_total;
  NEW.commission_total := v_calc.commission_total;
  NEW.commission_collected := v_calc.commission_collected;
  NEW.commission_remaining := v_calc.commission_remaining;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS operator_commission_ledger_sync_commission_split ON public.operator_commission_ledger;
CREATE TRIGGER operator_commission_ledger_sync_commission_split
BEFORE INSERT OR UPDATE OF booking_total, commission_rate
ON public.operator_commission_ledger
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_commission_ledger_split();

ALTER TABLE public.operator_commercial_profiles
  ADD COLUMN IF NOT EXISTS operator_fault_cancellation_count INTEGER NOT NULL DEFAULT 0 CHECK (operator_fault_cancellation_count >= 0),
  ADD COLUMN IF NOT EXISTS operator_fault_cancellation_window_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_penalty_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancellation_penalty_triggered_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.operator_cancellation_penalty_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  cancelled_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  action_source TEXT NOT NULL DEFAULT 'operator_console',
  reason TEXT,
  forgiven BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE INDEX IF NOT EXISTS operator_cancellation_penalty_events_operator_idx
  ON public.operator_cancellation_penalty_events(operator_user_id, cancelled_at DESC)
  WHERE forgiven = FALSE;

ALTER TABLE public.operator_cancellation_penalty_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operator can read own cancellation penalty events" ON public.operator_cancellation_penalty_events;
CREATE POLICY "Operator can read own cancellation penalty events"
  ON public.operator_cancellation_penalty_events
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage cancellation penalty events" ON public.operator_cancellation_penalty_events;
CREATE POLICY "Admins can manage cancellation penalty events"
  ON public.operator_cancellation_penalty_events
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.recompute_operator_cancellation_penalty(
  p_operator_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INTEGER := 0;
  v_window_started_at TIMESTAMPTZ;
  v_auto_hold_reason TEXT := 'Automatic payout hold after 3 operator-fault cancellations in 30 days';
BEGIN
  IF p_operator_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    MIN(cancelled_at)
  INTO v_recent_count, v_window_started_at
  FROM public.operator_cancellation_penalty_events
  WHERE operator_user_id = p_operator_user_id
    AND forgiven = FALSE
    AND cancelled_at >= TIMEZONE('UTC', NOW()) - INTERVAL '30 days';

  UPDATE public.operator_commercial_profiles AS profile
  SET
    operator_fault_cancellation_count = COALESCE(v_recent_count, 0),
    operator_fault_cancellation_window_started_at = CASE
      WHEN COALESCE(v_recent_count, 0) > 0 THEN v_window_started_at
      ELSE NULL
    END,
    cancellation_penalty_active = COALESCE(v_recent_count, 0) >= 3,
    cancellation_penalty_triggered_at = CASE
      WHEN COALESCE(v_recent_count, 0) >= 3 THEN COALESCE(profile.cancellation_penalty_triggered_at, TIMEZONE('UTC', NOW()))
      ELSE NULL
    END,
    payout_hold = CASE
      WHEN COALESCE(v_recent_count, 0) >= 3 THEN TRUE
      WHEN profile.cancellation_penalty_active AND profile.payout_hold_reason = v_auto_hold_reason THEN FALSE
      ELSE profile.payout_hold
    END,
    payout_hold_reason = CASE
      WHEN COALESCE(v_recent_count, 0) >= 3 AND (profile.payout_hold_reason IS NULL OR profile.payout_hold_reason = v_auto_hold_reason)
        THEN v_auto_hold_reason
      WHEN profile.cancellation_penalty_active AND profile.payout_hold_reason = v_auto_hold_reason AND COALESCE(v_recent_count, 0) < 3
        THEN NULL
      ELSE profile.payout_hold_reason
    END,
    operational_status = CASE
      WHEN COALESCE(v_recent_count, 0) >= 3 AND profile.operational_status = 'active'::public.operator_operational_status_enum
        THEN 'restricted'::public.operator_operational_status_enum
      WHEN profile.cancellation_penalty_active
        AND COALESCE(v_recent_count, 0) < 3
        AND profile.operational_status = 'restricted'::public.operator_operational_status_enum
        AND profile.kyc_status = 'approved'::public.commercial_kyc_status_enum
        THEN 'active'::public.operator_operational_status_enum
      ELSE profile.operational_status
    END,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE profile.operator_user_id = p_operator_user_id;

  PERFORM public.sync_operator_payout_eligibility(p_operator_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_operator_cancellation_penalty_profile_from_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_operator_user_id := OLD.operator_user_id;
  ELSE
    v_operator_user_id := NEW.operator_user_id;
  END IF;

  PERFORM public.recompute_operator_cancellation_penalty(v_operator_user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS operator_cancellation_penalty_events_recompute_profile ON public.operator_cancellation_penalty_events;
CREATE TRIGGER operator_cancellation_penalty_events_recompute_profile
AFTER INSERT OR UPDATE OR DELETE
ON public.operator_cancellation_penalty_events
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_cancellation_penalty_profile_from_event();

CREATE OR REPLACE FUNCTION public.sync_operator_cancellation_penalty_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_user_id UUID;
  v_cancelled_at TIMESTAMPTZ;
  v_reason TEXT;
  v_tour_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_tour_id := NEW.tour_id;
  ELSE
    v_tour_id := COALESCE(NEW.tour_id, OLD.tour_id);
  END IF;

  SELECT operator_id
  INTO v_operator_user_id
  FROM public.tours
  WHERE id = v_tour_id;

  IF v_operator_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'cancelled' AND COALESCE(NEW.metadata->>'operator_last_action', '') = 'cancel' THEN
    PERFORM public.provision_operator_commercial_profile(v_operator_user_id);

    v_cancelled_at := COALESCE(
      NULLIF(NEW.metadata->>'operator_last_action_at', '')::TIMESTAMPTZ,
      TIMEZONE('UTC', NOW())
    );
    v_reason := NULLIF(BTRIM(NEW.metadata->>'operator_last_action_reason'), '');

    INSERT INTO public.operator_cancellation_penalty_events (
      operator_user_id,
      booking_id,
      cancelled_at,
      action_source,
      reason,
      forgiven,
      updated_at
    )
    VALUES (
      v_operator_user_id,
      NEW.id,
      v_cancelled_at,
      COALESCE(NULLIF(BTRIM(NEW.metadata->>'operator_last_action'), ''), 'operator_console'),
      v_reason,
      FALSE,
      TIMEZONE('UTC', NOW())
    )
    ON CONFLICT (booking_id) DO UPDATE SET
      operator_user_id = EXCLUDED.operator_user_id,
      cancelled_at = EXCLUDED.cancelled_at,
      action_source = EXCLUDED.action_source,
      reason = EXCLUDED.reason,
      forgiven = FALSE,
      updated_at = TIMEZONE('UTC', NOW());
  ELSE
    DELETE FROM public.operator_cancellation_penalty_events
    WHERE booking_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tour_bookings_sync_operator_cancellation_penalty_event ON public.tour_bookings;
CREATE TRIGGER tour_bookings_sync_operator_cancellation_penalty_event
AFTER INSERT OR UPDATE OF status, metadata
ON public.tour_bookings
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_cancellation_penalty_event();

INSERT INTO public.operator_cancellation_penalty_events (
  operator_user_id,
  booking_id,
  cancelled_at,
  action_source,
  reason,
  forgiven,
  updated_at
)
SELECT
  tour.operator_id,
  booking.id,
  COALESCE(NULLIF(booking.metadata->>'operator_last_action_at', '')::TIMESTAMPTZ, TIMEZONE('UTC', NOW())),
  COALESCE(NULLIF(BTRIM(booking.metadata->>'operator_last_action'), ''), 'operator_console'),
  NULLIF(BTRIM(booking.metadata->>'operator_last_action_reason'), ''),
  FALSE,
  TIMEZONE('UTC', NOW())
FROM public.tour_bookings AS booking
INNER JOIN public.tours AS tour
  ON tour.id = booking.tour_id
WHERE booking.status = 'cancelled'
  AND COALESCE(booking.metadata->>'operator_last_action', '') = 'cancel'
ON CONFLICT (booking_id) DO UPDATE SET
  operator_user_id = EXCLUDED.operator_user_id,
  cancelled_at = EXCLUDED.cancelled_at,
  action_source = EXCLUDED.action_source,
  reason = EXCLUDED.reason,
  forgiven = FALSE,
  updated_at = TIMEZONE('UTC', NOW());

WITH impacted_operators AS (
  SELECT DISTINCT operator_user_id
  FROM public.operator_cancellation_penalty_events
)
SELECT public.recompute_operator_cancellation_penalty(operator_user_id)
FROM impacted_operators;

COMMIT;