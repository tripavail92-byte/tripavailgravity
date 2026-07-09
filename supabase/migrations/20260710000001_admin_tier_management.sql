-- ============================================================================
-- Admin-managed membership tiers
--
-- Before this migration the tier table was effectively read-only-by-SQL:
--   * only `service_role` could write it (no admin UPDATE policy), and
--   * only admins could SELECT it — which meant OPERATORS could not read their
--     own tier row. Their "Tier entitlements" card silently rendered every
--     entitlement as disabled and the publish limit as "Not configured yet".
--
-- This migration makes the tier catalogue the single source of truth that the
-- admin can edit from the dashboard, and that operators can read to see the
-- plan they are paying for.
--
-- Tier VALUES are fully admin-controlled. Tier CODES stay enum-bound
-- (gold/diamond/platinum); adding a 4th code requires `ALTER TYPE
-- membership_tier_code_enum ADD VALUE '<code>'` in its own migration, then an
-- INSERT into commercial_membership_tiers.
-- ============================================================================

-- ── 1. Presentation + control columns ───────────────────────────────────────
ALTER TABLE public.commercial_membership_tiers
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS badge_hex TEXT,
  ADD COLUMN IF NOT EXISTS perks JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'PKR',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_publicly_listed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commercial_membership_tiers_perks_is_array'
  ) THEN
    ALTER TABLE public.commercial_membership_tiers
      ADD CONSTRAINT commercial_membership_tiers_perks_is_array
      CHECK (jsonb_typeof(perks) = 'array');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commercial_membership_tiers_commission_max'
  ) THEN
    ALTER TABLE public.commercial_membership_tiers
      ADD CONSTRAINT commercial_membership_tiers_commission_max
      CHECK (commission_rate <= 100);
  END IF;
END $$;

-- ── 2. Seed presentation copy for the three shipped tiers ───────────────────
UPDATE public.commercial_membership_tiers SET
  sort_order = CASE code WHEN 'gold' THEN 1 WHEN 'diamond' THEN 2 WHEN 'platinum' THEN 3 END,
  tagline = COALESCE(tagline, CASE code
    WHEN 'gold' THEN 'Start listing and take your first bookings.'
    WHEN 'diamond' THEN 'Scale your catalogue with lower commission.'
    WHEN 'platinum' THEN 'Best economics and priority placement.'
  END),
  badge_hex = COALESCE(badge_hex, CASE code
    WHEN 'gold' THEN '#D4A056'
    WHEN 'diamond' THEN '#6BA8D6'
    WHEN 'platinum' THEN '#9B8FB5'
  END),
  perks = CASE WHEN perks = '[]'::JSONB THEN CASE code
    WHEN 'gold' THEN '["Standard support"]'::JSONB
    WHEN 'diamond' THEN '["Priority support", "Boosted search ranking"]'::JSONB
    WHEN 'platinum' THEN '["Dedicated account manager", "Top search ranking", "Early access to new features"]'::JSONB
  END ELSE perks END
WHERE code IN ('gold', 'diamond', 'platinum');

-- ── 3. Config-change audit trail ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commercial_tier_config_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code public.membership_tier_code_enum NOT NULL,
  changed_by UUID,
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  previous_values JSONB NOT NULL DEFAULT '{}'::JSONB,
  new_values JSONB NOT NULL DEFAULT '{}'::JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE INDEX IF NOT EXISTS idx_commercial_tier_config_log_tier
  ON public.commercial_tier_config_log(tier_code, changed_at DESC);

-- Records only the columns that actually changed, so the log stays readable.
CREATE OR REPLACE FUNCTION public.log_commercial_tier_config_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before JSONB := to_jsonb(OLD);
  v_after JSONB := to_jsonb(NEW);
  v_changed TEXT[] := '{}';
  v_prev JSONB := '{}'::JSONB;
  v_new JSONB := '{}'::JSONB;
  v_key TEXT;
BEGIN
  FOR v_key IN SELECT jsonb_object_keys(v_after) LOOP
    IF v_key NOT IN ('updated_at', 'updated_by')
       AND v_before -> v_key IS DISTINCT FROM v_after -> v_key THEN
      v_changed := array_append(v_changed, v_key);
      v_prev := v_prev || jsonb_build_object(v_key, v_before -> v_key);
      v_new := v_new || jsonb_build_object(v_key, v_after -> v_key);
    END IF;
  END LOOP;

  IF array_length(v_changed, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.commercial_tier_config_log (
    tier_code, changed_by, changed_fields, previous_values, new_values
  ) VALUES (NEW.code, auth.uid(), v_changed, v_prev, v_new);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_commercial_tier_config_change ON public.commercial_membership_tiers;
CREATE TRIGGER trg_log_commercial_tier_config_change
  AFTER UPDATE ON public.commercial_membership_tiers
  FOR EACH ROW EXECUTE FUNCTION public.log_commercial_tier_config_change();

-- ── 4. Keep updated_at fresh on every admin edit ────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_commercial_tier_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := TIMEZONE('UTC', NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_commercial_tier_updated_at ON public.commercial_membership_tiers;
CREATE TRIGGER trg_touch_commercial_tier_updated_at
  BEFORE UPDATE ON public.commercial_membership_tiers
  FOR EACH ROW EXECUTE FUNCTION public.touch_commercial_tier_updated_at();

-- ── 5. Never strand operators on a deactivated tier ─────────────────────────
CREATE OR REPLACE FUNCTION public.guard_commercial_tier_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF OLD.is_active AND NOT NEW.is_active THEN
    SELECT COUNT(*) INTO v_count
    FROM public.operator_commercial_profiles
    WHERE membership_tier_code = NEW.code;

    IF v_count > 0 THEN
      RAISE EXCEPTION
        'Cannot deactivate tier % — % operator(s) are currently assigned to it. Move them to another tier first.',
        NEW.code, v_count
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_commercial_tier_deactivation ON public.commercial_membership_tiers;
CREATE TRIGGER trg_guard_commercial_tier_deactivation
  BEFORE UPDATE ON public.commercial_membership_tiers
  FOR EACH ROW EXECUTE FUNCTION public.guard_commercial_tier_deactivation();

-- ── 6. RLS: operators read the catalogue, admins edit it ────────────────────
-- Pricing/entitlements are not secret — an operator must be able to see the
-- plan they pay for and the plans they could upgrade to.
DROP POLICY IF EXISTS "Admins can read commercial tiers" ON public.commercial_membership_tiers;

DROP POLICY IF EXISTS "Signed-in users can read commercial tiers" ON public.commercial_membership_tiers;
CREATE POLICY "Signed-in users can read commercial tiers"
  ON public.commercial_membership_tiers
  FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Public can read listed commercial tiers" ON public.commercial_membership_tiers;
CREATE POLICY "Public can read listed commercial tiers"
  ON public.commercial_membership_tiers
  FOR SELECT TO anon
  USING (is_active AND is_publicly_listed);

DROP POLICY IF EXISTS "Admins can update commercial tiers" ON public.commercial_membership_tiers;
CREATE POLICY "Admins can update commercial tiers"
  ON public.commercial_membership_tiers
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert commercial tiers" ON public.commercial_membership_tiers;
CREATE POLICY "Admins can insert commercial tiers"
  ON public.commercial_membership_tiers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Deliberately no DELETE policy: tiers are referenced by operator profiles.
-- Deactivate (is_active = false) instead of deleting.

ALTER TABLE public.commercial_tier_config_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read tier config log" ON public.commercial_tier_config_log;
CREATE POLICY "Admins can read tier config log"
  ON public.commercial_tier_config_log
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service can manage tier config log" ON public.commercial_tier_config_log;
CREATE POLICY "Service can manage tier config log"
  ON public.commercial_tier_config_log
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

GRANT SELECT ON public.commercial_membership_tiers TO anon, authenticated;
GRANT UPDATE, INSERT ON public.commercial_membership_tiers TO authenticated;
GRANT SELECT ON public.commercial_tier_config_log TO authenticated;
