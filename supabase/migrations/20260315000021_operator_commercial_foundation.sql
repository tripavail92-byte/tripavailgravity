DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'membership_tier_code_enum' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.membership_tier_code_enum AS ENUM ('gold', 'diamond', 'platinum');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'operator_operational_status_enum' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.operator_operational_status_enum AS ENUM ('pending', 'active', 'restricted', 'suspended');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'commercial_kyc_status_enum' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.commercial_kyc_status_enum AS ENUM ('not_submitted', 'pending_review', 'approved', 'rejected', 'resubmission_required');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'membership_status_enum' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.membership_status_enum AS ENUM ('active', 'grace_period', 'payment_due', 'overdue', 'suspended');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'settlement_state_enum' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.settlement_state_enum AS ENUM (
      'draft',
      'pending_payment',
      'paid_pending_service',
      'completed_pending_payout',
      'eligible_for_payout',
      'paid_out',
      'cancelled_by_traveller',
      'cancelled_by_operator',
      'refunded',
      'partially_refunded',
      'payout_on_hold',
      'chargeback_open'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'payout_status_enum' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.payout_status_enum AS ENUM ('not_ready', 'eligible', 'scheduled', 'paid', 'on_hold', 'reversed', 'recovery_pending');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ledger_entry_type_enum' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.ledger_entry_type_enum AS ENUM (
      'commission_snapshot',
      'membership_invoice',
      'membership_credit',
      'payout_scheduled',
      'payout_paid',
      'refund_adjustment',
      'recovery_debit',
      'recovery_credit',
      'chargeback',
      'manual_adjustment'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'invoice_status_enum' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.invoice_status_enum AS ENUM ('draft', 'issued', 'paid', 'failed', 'waived', 'overdue');
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TYPE public.admin_role_enum ADD VALUE IF NOT EXISTS 'finance_admin';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TYPE public.admin_role_enum ADD VALUE IF NOT EXISTS 'compliance_admin';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

CREATE TABLE IF NOT EXISTS public.commercial_membership_tiers (
  code public.membership_tier_code_enum PRIMARY KEY,
  display_name TEXT NOT NULL,
  monthly_fee NUMERIC(12,2) NOT NULL CHECK (monthly_fee >= 0),
  commission_rate NUMERIC(5,2) NOT NULL CHECK (commission_rate >= 0),
  monthly_publish_limit INTEGER NOT NULL CHECK (monthly_publish_limit >= 0),
  pickup_multi_city_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  google_maps_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_itinerary_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_monthly_credits INTEGER NOT NULL DEFAULT 0 CHECK (ai_monthly_credits >= 0),
  support_priority INTEGER NOT NULL DEFAULT 1 CHECK (support_priority >= 1),
  ranking_weight NUMERIC(8,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

INSERT INTO public.commercial_membership_tiers (
  code,
  display_name,
  monthly_fee,
  commission_rate,
  monthly_publish_limit,
  pickup_multi_city_enabled,
  google_maps_enabled,
  ai_itinerary_enabled,
  ai_monthly_credits,
  support_priority,
  ranking_weight
)
VALUES
  ('gold', 'Gold', 15000, 20, 5, FALSE, FALSE, FALSE, 0, 1, 1.00),
  ('diamond', 'Diamond', 30000, 13, 25, TRUE, TRUE, TRUE, 100, 2, 1.25),
  ('platinum', 'Platinum', 50000, 10, 100, TRUE, TRUE, TRUE, 300, 3, 1.50)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  monthly_fee = EXCLUDED.monthly_fee,
  commission_rate = EXCLUDED.commission_rate,
  monthly_publish_limit = EXCLUDED.monthly_publish_limit,
  pickup_multi_city_enabled = EXCLUDED.pickup_multi_city_enabled,
  google_maps_enabled = EXCLUDED.google_maps_enabled,
  ai_itinerary_enabled = EXCLUDED.ai_itinerary_enabled,
  ai_monthly_credits = EXCLUDED.ai_monthly_credits,
  support_priority = EXCLUDED.support_priority,
  ranking_weight = EXCLUDED.ranking_weight,
  updated_at = TIMEZONE('UTC', NOW());

CREATE TABLE IF NOT EXISTS public.operator_commercial_profiles (
  operator_user_id UUID PRIMARY KEY REFERENCES public.tour_operator_profiles(user_id) ON DELETE CASCADE,
  operational_status public.operator_operational_status_enum NOT NULL DEFAULT 'pending',
  kyc_status public.commercial_kyc_status_enum NOT NULL DEFAULT 'not_submitted',
  membership_tier_code public.membership_tier_code_enum NOT NULL DEFAULT 'gold' REFERENCES public.commercial_membership_tiers(code),
  membership_status public.membership_status_enum NOT NULL DEFAULT 'active',
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 20 CHECK (commission_rate >= 0),
  monthly_membership_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monthly_membership_fee >= 0),
  billing_cycle_anchor_day INTEGER NOT NULL DEFAULT 1 CHECK (billing_cycle_anchor_day BETWEEN 1 AND 28),
  current_cycle_start DATE NOT NULL DEFAULT (TIMEZONE('UTC', NOW()))::DATE,
  current_cycle_end DATE NOT NULL DEFAULT ((TIMEZONE('UTC', NOW()))::DATE + INTERVAL '1 month' - INTERVAL '1 day'),
  next_billing_date DATE NOT NULL DEFAULT ((TIMEZONE('UTC', NOW()))::DATE + INTERVAL '1 month'),
  billing_email TEXT,
  payout_hold BOOLEAN NOT NULL DEFAULT FALSE,
  payout_hold_reason TEXT,
  monthly_published_tours_count INTEGER NOT NULL DEFAULT 0 CHECK (monthly_published_tours_count >= 0),
  ai_credits_used_current_cycle INTEGER NOT NULL DEFAULT 0 CHECK (ai_credits_used_current_cycle >= 0),
  feature_overrides JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TABLE IF NOT EXISTS public.operator_tier_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  previous_tier_code public.membership_tier_code_enum,
  new_tier_code public.membership_tier_code_enum NOT NULL,
  changed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TABLE IF NOT EXISTS public.operator_feature_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  published_tours_count INTEGER NOT NULL DEFAULT 0 CHECK (published_tours_count >= 0),
  pickup_multi_city_uses INTEGER NOT NULL DEFAULT 0 CHECK (pickup_multi_city_uses >= 0),
  google_maps_uses INTEGER NOT NULL DEFAULT 0 CHECK (google_maps_uses >= 0),
  ai_itinerary_credits_used INTEGER NOT NULL DEFAULT 0 CHECK (ai_itinerary_credits_used >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  UNIQUE (operator_user_id, cycle_start, cycle_end)
);

CREATE TABLE IF NOT EXISTS public.operator_billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  membership_tier_code public.membership_tier_code_enum NOT NULL REFERENCES public.commercial_membership_tiers(code),
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  membership_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (membership_fee >= 0),
  prior_cycle_commission_credit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (prior_cycle_commission_credit >= 0),
  adjustment_applied NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (adjustment_applied >= 0),
  final_membership_charge NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (final_membership_charge >= 0),
  invoice_status public.invoice_status_enum NOT NULL DEFAULT 'draft',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  UNIQUE (operator_user_id, cycle_start, cycle_end)
);

CREATE TABLE IF NOT EXISTS public.operator_membership_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_cycle_id UUID NOT NULL UNIQUE REFERENCES public.operator_billing_cycles(id) ON DELETE CASCADE,
  operator_user_id UUID NOT NULL REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  membership_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (membership_fee >= 0),
  prior_cycle_commission_credit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (prior_cycle_commission_credit >= 0),
  adjustment_applied NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (adjustment_applied >= 0),
  final_charge NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (final_charge >= 0),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_status public.invoice_status_enum NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TABLE IF NOT EXISTS public.operator_booking_finance_snapshots (
  booking_id UUID PRIMARY KEY REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  operator_user_id UUID NOT NULL REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  membership_tier_code public.membership_tier_code_enum NOT NULL,
  membership_status public.membership_status_enum NOT NULL,
  booking_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (booking_total >= 0),
  payment_collected NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (payment_collected >= 0),
  refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0),
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  operator_receivable_estimate NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (operator_receivable_estimate >= 0),
  settlement_state public.settlement_state_enum NOT NULL DEFAULT 'draft',
  payout_status public.payout_status_enum NOT NULL DEFAULT 'not_ready',
  payout_available_at TIMESTAMPTZ,
  payout_completed_at TIMESTAMPTZ,
  notes JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TABLE IF NOT EXISTS public.operator_commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  booking_id UUID UNIQUE REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  entry_type public.ledger_entry_type_enum NOT NULL DEFAULT 'commission_snapshot',
  membership_tier_code public.membership_tier_code_enum NOT NULL,
  booking_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (booking_total >= 0),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0),
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  operator_receivable_estimate NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (operator_receivable_estimate >= 0),
  settlement_state public.settlement_state_enum NOT NULL DEFAULT 'draft',
  payout_status public.payout_status_enum NOT NULL DEFAULT 'not_ready',
  recognized_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  available_for_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TABLE IF NOT EXISTS public.operator_payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_reference TEXT NOT NULL UNIQUE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status public.payout_status_enum NOT NULL DEFAULT 'scheduled',
  total_gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_gross_amount >= 0),
  total_commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_commission_amount >= 0),
  total_operator_payable NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_operator_payable >= 0),
  processed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TABLE IF NOT EXISTS public.operator_payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_batch_id UUID REFERENCES public.operator_payout_batches(id) ON DELETE SET NULL,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  operator_user_id UUID NOT NULL REFERENCES public.operator_commercial_profiles(operator_user_id) ON DELETE CASCADE,
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (gross_amount >= 0),
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  operator_payable_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (operator_payable_amount >= 0),
  payout_status public.payout_status_enum NOT NULL DEFAULT 'not_ready',
  payout_due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  hold_reason TEXT,
  recovery_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (recovery_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE INDEX IF NOT EXISTS operator_commercial_profiles_tier_idx
  ON public.operator_commercial_profiles(membership_tier_code, membership_status);
CREATE INDEX IF NOT EXISTS operator_billing_cycles_operator_idx
  ON public.operator_billing_cycles(operator_user_id, cycle_start DESC);
CREATE INDEX IF NOT EXISTS operator_booking_finance_snapshots_operator_idx
  ON public.operator_booking_finance_snapshots(operator_user_id, payout_status, settlement_state);
CREATE INDEX IF NOT EXISTS operator_commission_ledger_operator_idx
  ON public.operator_commission_ledger(operator_user_id, recognized_at DESC);
CREATE INDEX IF NOT EXISTS operator_payout_items_operator_idx
  ON public.operator_payout_items(operator_user_id, payout_status, payout_due_at);

ALTER TABLE public.commercial_membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_commercial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_tier_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_feature_usage_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_membership_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_booking_finance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_payout_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can manage commercial tiers" ON public.commercial_membership_tiers;
CREATE POLICY "Service can manage commercial tiers"
  ON public.commercial_membership_tiers
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can read commercial tiers" ON public.commercial_membership_tiers;
CREATE POLICY "Admins can read commercial tiers"
  ON public.commercial_membership_tiers
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Operator can read own commercial profile" ON public.operator_commercial_profiles;
CREATE POLICY "Operator can read own commercial profile"
  ON public.operator_commercial_profiles
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage commercial profiles" ON public.operator_commercial_profiles;
CREATE POLICY "Admins can manage commercial profiles"
  ON public.operator_commercial_profiles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Operator can read own tier log" ON public.operator_tier_change_log;
CREATE POLICY "Operator can read own tier log"
  ON public.operator_tier_change_log
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage tier log" ON public.operator_tier_change_log;
CREATE POLICY "Admins can manage tier log"
  ON public.operator_tier_change_log
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Operator can read own feature usage" ON public.operator_feature_usage_monthly;
CREATE POLICY "Operator can read own feature usage"
  ON public.operator_feature_usage_monthly
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage feature usage" ON public.operator_feature_usage_monthly;
CREATE POLICY "Admins can manage feature usage"
  ON public.operator_feature_usage_monthly
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Operator can read own billing cycles" ON public.operator_billing_cycles;
CREATE POLICY "Operator can read own billing cycles"
  ON public.operator_billing_cycles
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage billing cycles" ON public.operator_billing_cycles;
CREATE POLICY "Admins can manage billing cycles"
  ON public.operator_billing_cycles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Operator can read own invoices" ON public.operator_membership_invoices;
CREATE POLICY "Operator can read own invoices"
  ON public.operator_membership_invoices
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage invoices" ON public.operator_membership_invoices;
CREATE POLICY "Admins can manage invoices"
  ON public.operator_membership_invoices
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Operator can read own booking finance snapshots" ON public.operator_booking_finance_snapshots;
CREATE POLICY "Operator can read own booking finance snapshots"
  ON public.operator_booking_finance_snapshots
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Traveler can read own booking finance snapshots" ON public.operator_booking_finance_snapshots;
CREATE POLICY "Traveler can read own booking finance snapshots"
  ON public.operator_booking_finance_snapshots
  FOR SELECT TO authenticated
  USING (traveler_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage booking finance snapshots" ON public.operator_booking_finance_snapshots;
CREATE POLICY "Admins can manage booking finance snapshots"
  ON public.operator_booking_finance_snapshots
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Operator can read own commission ledger" ON public.operator_commission_ledger;
CREATE POLICY "Operator can read own commission ledger"
  ON public.operator_commission_ledger
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage commission ledger" ON public.operator_commission_ledger;
CREATE POLICY "Admins can manage commission ledger"
  ON public.operator_commission_ledger
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage payout batches" ON public.operator_payout_batches;
CREATE POLICY "Admins can manage payout batches"
  ON public.operator_payout_batches
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Operator can read own payout items" ON public.operator_payout_items;
CREATE POLICY "Operator can read own payout items"
  ON public.operator_payout_items
  FOR SELECT TO authenticated
  USING (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage payout items" ON public.operator_payout_items;
CREATE POLICY "Admins can manage payout items"
  ON public.operator_payout_items
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.commercial_map_verification_status(p_verification_status TEXT)
RETURNS public.commercial_kyc_status_enum
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE COALESCE(TRIM(p_verification_status), '')
    WHEN 'approved' THEN 'approved'::public.commercial_kyc_status_enum
    WHEN 'rejected' THEN 'rejected'::public.commercial_kyc_status_enum
    WHEN 'pending' THEN 'pending_review'::public.commercial_kyc_status_enum
    WHEN 'incomplete' THEN 'not_submitted'::public.commercial_kyc_status_enum
    ELSE 'not_submitted'::public.commercial_kyc_status_enum
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.commercial_next_business_day(p_timestamp TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_next TIMESTAMPTZ := p_timestamp + INTERVAL '1 day';
BEGIN
  WHILE EXTRACT(ISODOW FROM v_next) IN (6, 7) LOOP
    v_next := v_next + INTERVAL '1 day';
  END LOOP;

  RETURN v_next;
END;
$$;

CREATE OR REPLACE FUNCTION public.provision_operator_commercial_profile(p_operator_user_id UUID)
RETURNS public.operator_commercial_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier public.commercial_membership_tiers;
  v_existing public.operator_commercial_profiles;
  v_today DATE := (TIMEZONE('UTC', NOW()))::DATE;
BEGIN
  SELECT * INTO v_existing
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = p_operator_user_id;

  IF FOUND THEN
    RETURN v_existing;
  END IF;

  SELECT * INTO v_tier
  FROM public.commercial_membership_tiers
  WHERE code = 'gold'::public.membership_tier_code_enum;

  INSERT INTO public.operator_commercial_profiles (
    operator_user_id,
    operational_status,
    kyc_status,
    membership_tier_code,
    membership_status,
    commission_rate,
    monthly_membership_fee,
    billing_cycle_anchor_day,
    current_cycle_start,
    current_cycle_end,
    next_billing_date
  )
  VALUES (
    p_operator_user_id,
    'pending'::public.operator_operational_status_enum,
    'not_submitted'::public.commercial_kyc_status_enum,
    'gold'::public.membership_tier_code_enum,
    'active'::public.membership_status_enum,
    COALESCE(v_tier.commission_rate, 20),
    COALESCE(v_tier.monthly_fee, 0),
    LEAST(28, EXTRACT(DAY FROM v_today)::INT),
    v_today,
    (v_today + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
    (v_today + INTERVAL '1 month')::DATE
  )
  RETURNING * INTO v_existing;

  INSERT INTO public.operator_billing_cycles (
    operator_user_id,
    membership_tier_code,
    cycle_start,
    cycle_end,
    membership_fee,
    prior_cycle_commission_credit,
    adjustment_applied,
    final_membership_charge,
    invoice_status
  )
  VALUES (
    p_operator_user_id,
    v_existing.membership_tier_code,
    v_existing.current_cycle_start,
    v_existing.current_cycle_end,
    v_existing.monthly_membership_fee,
    0,
    0,
    v_existing.monthly_membership_fee,
    'draft'::public.invoice_status_enum
  )
  ON CONFLICT (operator_user_id, cycle_start, cycle_end) DO NOTHING;

  RETURN v_existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_tour_operator_profile_commercial_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.provision_operator_commercial_profile(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tour_operator_profile_commercial_bootstrap ON public.tour_operator_profiles;
CREATE TRIGGER tour_operator_profile_commercial_bootstrap
AFTER INSERT ON public.tour_operator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_tour_operator_profile_commercial_bootstrap();

CREATE OR REPLACE FUNCTION public.sync_operator_commercial_kyc_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mapped_status public.commercial_kyc_status_enum;
BEGIN
  IF NEW.role_type <> 'tour_operator' THEN
    RETURN NEW;
  END IF;

  PERFORM public.provision_operator_commercial_profile(NEW.user_id);
  v_mapped_status := public.commercial_map_verification_status(NEW.verification_status);

  UPDATE public.operator_commercial_profiles
  SET
    kyc_status = v_mapped_status,
    operational_status = CASE
      WHEN v_mapped_status = 'approved'::public.commercial_kyc_status_enum AND membership_status <> 'suspended'::public.membership_status_enum
        THEN 'active'::public.operator_operational_status_enum
      WHEN v_mapped_status IN ('pending_review'::public.commercial_kyc_status_enum, 'not_submitted'::public.commercial_kyc_status_enum)
        THEN 'pending'::public.operator_operational_status_enum
      WHEN v_mapped_status IN ('rejected'::public.commercial_kyc_status_enum, 'resubmission_required'::public.commercial_kyc_status_enum)
        THEN 'restricted'::public.operator_operational_status_enum
      ELSE operational_status
    END,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE operator_user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_roles_sync_operator_commercial_kyc ON public.user_roles;
CREATE TRIGGER user_roles_sync_operator_commercial_kyc
AFTER INSERT OR UPDATE OF verification_status ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_commercial_kyc_status();

CREATE OR REPLACE FUNCTION public.sync_operator_booking_finance_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_user_id UUID;
  v_tier_code public.membership_tier_code_enum := 'gold'::public.membership_tier_code_enum;
  v_membership_status public.membership_status_enum := 'active'::public.membership_status_enum;
  v_commission_rate NUMERIC(5,2) := 20;
  v_booking_total NUMERIC(12,2);
  v_payment_collected NUMERIC(12,2);
  v_refund_amount NUMERIC(12,2) := 0;
  v_commission_amount NUMERIC(12,2);
  v_operator_receivable NUMERIC(12,2);
  v_settlement_state public.settlement_state_enum;
  v_payout_status public.payout_status_enum;
  v_schedule_end TIMESTAMPTZ;
  v_payout_available_at TIMESTAMPTZ;
  v_hold BOOLEAN := FALSE;
BEGIN
  SELECT tour.operator_id, schedule.end_time
  INTO v_operator_user_id, v_schedule_end
  FROM public.tours AS tour
  LEFT JOIN public.tour_schedules AS schedule
    ON schedule.id = NEW.schedule_id
  WHERE tour.id = NEW.tour_id;

  IF v_operator_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.provision_operator_commercial_profile(v_operator_user_id);

  SELECT profile.membership_tier_code, profile.membership_status, profile.commission_rate, profile.payout_hold
  INTO v_tier_code, v_membership_status, v_commission_rate, v_hold
  FROM public.operator_commercial_profiles AS profile
  WHERE profile.operator_user_id = v_operator_user_id;

  v_booking_total := ROUND(COALESCE(NEW.total_price, 0)::NUMERIC, 2);
  v_payment_collected := ROUND(
    CASE
      WHEN COALESCE(NEW.payment_status, 'unpaid') IN ('paid', 'balance_pending', 'partially_paid')
        THEN COALESCE(NEW.amount_paid_online, NEW.upfront_amount, NEW.total_price, 0)::NUMERIC
      ELSE 0::NUMERIC
    END,
    2
  );
  v_commission_amount := ROUND(v_booking_total * COALESCE(v_commission_rate, 0) / 100.0, 2);
  v_operator_receivable := GREATEST(0, ROUND(v_booking_total - v_commission_amount - v_refund_amount, 2));

  v_settlement_state := CASE
    WHEN NEW.status = 'pending' THEN 'pending_payment'::public.settlement_state_enum
    WHEN NEW.status = 'confirmed' AND COALESCE(NEW.payment_status, 'unpaid') IN ('paid', 'balance_pending', 'partially_paid') THEN 'paid_pending_service'::public.settlement_state_enum
    WHEN NEW.status = 'completed' AND v_hold THEN 'payout_on_hold'::public.settlement_state_enum
    WHEN NEW.status = 'completed' THEN 'eligible_for_payout'::public.settlement_state_enum
    WHEN NEW.status = 'cancelled' AND COALESCE(NEW.payment_status, '') IN ('refunded', 'partially_refunded') THEN 'refunded'::public.settlement_state_enum
    WHEN NEW.status = 'cancelled' THEN 'cancelled_by_operator'::public.settlement_state_enum
    ELSE 'draft'::public.settlement_state_enum
  END;

  v_payout_status := CASE
    WHEN v_hold THEN 'on_hold'::public.payout_status_enum
    WHEN NEW.status = 'completed' THEN 'eligible'::public.payout_status_enum
    ELSE 'not_ready'::public.payout_status_enum
  END;

  v_payout_available_at := CASE
    WHEN NEW.status = 'completed' THEN public.commercial_next_business_day(COALESCE(v_schedule_end, TIMEZONE('UTC', NOW())))
    ELSE NULL
  END;

  INSERT INTO public.operator_booking_finance_snapshots (
    booking_id,
    operator_user_id,
    traveler_id,
    membership_tier_code,
    membership_status,
    booking_total,
    payment_collected,
    refund_amount,
    commission_rate,
    commission_amount,
    operator_receivable_estimate,
    settlement_state,
    payout_status,
    payout_available_at,
    notes,
    updated_at
  )
  VALUES (
    NEW.id,
    v_operator_user_id,
    NEW.traveler_id,
    v_tier_code,
    v_membership_status,
    v_booking_total,
    v_payment_collected,
    v_refund_amount,
    v_commission_rate,
    v_commission_amount,
    v_operator_receivable,
    v_settlement_state,
    v_payout_status,
    v_payout_available_at,
    jsonb_build_object(
      'tour_id', NEW.tour_id,
      'schedule_id', NEW.schedule_id,
      'payment_status', NEW.payment_status,
      'booking_status', NEW.status
    ),
    TIMEZONE('UTC', NOW())
  )
  ON CONFLICT (booking_id) DO UPDATE SET
    operator_user_id = EXCLUDED.operator_user_id,
    traveler_id = EXCLUDED.traveler_id,
    membership_tier_code = EXCLUDED.membership_tier_code,
    membership_status = EXCLUDED.membership_status,
    booking_total = EXCLUDED.booking_total,
    payment_collected = EXCLUDED.payment_collected,
    refund_amount = EXCLUDED.refund_amount,
    commission_rate = EXCLUDED.commission_rate,
    commission_amount = EXCLUDED.commission_amount,
    operator_receivable_estimate = EXCLUDED.operator_receivable_estimate,
    settlement_state = EXCLUDED.settlement_state,
    payout_status = EXCLUDED.payout_status,
    payout_available_at = EXCLUDED.payout_available_at,
    notes = EXCLUDED.notes,
    updated_at = TIMEZONE('UTC', NOW());

  INSERT INTO public.operator_commission_ledger (
    operator_user_id,
    booking_id,
    entry_type,
    membership_tier_code,
    booking_total,
    commission_rate,
    commission_amount,
    operator_receivable_estimate,
    settlement_state,
    payout_status,
    available_for_payout_at,
    updated_at
  )
  VALUES (
    v_operator_user_id,
    NEW.id,
    'commission_snapshot'::public.ledger_entry_type_enum,
    v_tier_code,
    v_booking_total,
    v_commission_rate,
    v_commission_amount,
    v_operator_receivable,
    v_settlement_state,
    v_payout_status,
    v_payout_available_at,
    TIMEZONE('UTC', NOW())
  )
  ON CONFLICT (booking_id) DO UPDATE SET
    operator_user_id = EXCLUDED.operator_user_id,
    membership_tier_code = EXCLUDED.membership_tier_code,
    booking_total = EXCLUDED.booking_total,
    commission_rate = EXCLUDED.commission_rate,
    commission_amount = EXCLUDED.commission_amount,
    operator_receivable_estimate = EXCLUDED.operator_receivable_estimate,
    settlement_state = EXCLUDED.settlement_state,
    payout_status = EXCLUDED.payout_status,
    available_for_payout_at = EXCLUDED.available_for_payout_at,
    updated_at = TIMEZONE('UTC', NOW());

  INSERT INTO public.operator_payout_items (
    booking_id,
    operator_user_id,
    gross_amount,
    commission_amount,
    refund_amount,
    operator_payable_amount,
    payout_status,
    payout_due_at,
    hold_reason,
    recovery_amount,
    updated_at
  )
  VALUES (
    NEW.id,
    v_operator_user_id,
    v_booking_total,
    v_commission_amount,
    v_refund_amount,
    v_operator_receivable,
    v_payout_status,
    v_payout_available_at,
    CASE WHEN v_hold THEN COALESCE((SELECT payout_hold_reason FROM public.operator_commercial_profiles WHERE operator_user_id = v_operator_user_id), 'Manual operator payout hold') ELSE NULL END,
    0,
    TIMEZONE('UTC', NOW())
  )
  ON CONFLICT (booking_id) DO UPDATE SET
    operator_user_id = EXCLUDED.operator_user_id,
    gross_amount = EXCLUDED.gross_amount,
    commission_amount = EXCLUDED.commission_amount,
    refund_amount = EXCLUDED.refund_amount,
    operator_payable_amount = EXCLUDED.operator_payable_amount,
    payout_status = EXCLUDED.payout_status,
    payout_due_at = EXCLUDED.payout_due_at,
    hold_reason = EXCLUDED.hold_reason,
    recovery_amount = EXCLUDED.recovery_amount,
    updated_at = TIMEZONE('UTC', NOW());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tour_bookings_sync_operator_finance_snapshot ON public.tour_bookings;
CREATE TRIGGER tour_bookings_sync_operator_finance_snapshot
AFTER INSERT OR UPDATE OF status, payment_status, total_price, amount_paid_online, upfront_amount, remaining_amount ON public.tour_bookings
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_booking_finance_snapshot();

CREATE OR REPLACE FUNCTION public.admin_assign_operator_membership_tier(
  p_operator_user_id UUID,
  p_tier_code public.membership_tier_code_enum,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.operator_commercial_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role public.admin_role_enum;
  v_previous_tier public.membership_tier_code_enum;
  v_tier public.commercial_membership_tiers;
  v_row public.operator_commercial_profiles;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin authentication required';
  END IF;

  v_role := public.get_admin_role(v_admin_id);
  IF v_role NOT IN ('super_admin'::public.admin_role_enum, 'finance_admin'::public.admin_role_enum) THEN
    RAISE EXCEPTION 'Insufficient privileges to assign operator tier';
  END IF;

  PERFORM public.provision_operator_commercial_profile(p_operator_user_id);

  SELECT membership_tier_code INTO v_previous_tier
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = p_operator_user_id;

  SELECT * INTO v_tier
  FROM public.commercial_membership_tiers
  WHERE code = p_tier_code;

  UPDATE public.operator_commercial_profiles
  SET
    membership_tier_code = v_tier.code,
    commission_rate = v_tier.commission_rate,
    monthly_membership_fee = v_tier.monthly_fee,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE operator_user_id = p_operator_user_id
  RETURNING * INTO v_row;

  INSERT INTO public.operator_tier_change_log (
    operator_user_id,
    previous_tier_code,
    new_tier_code,
    changed_by,
    reason
  ) VALUES (
    p_operator_user_id,
    v_previous_tier,
    v_tier.code,
    v_admin_id,
    NULLIF(BTRIM(p_reason), '')
  );

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_close_operator_billing_cycle(
  p_operator_user_id UUID,
  p_cycle_end DATE DEFAULT NULL
)
RETURNS public.operator_billing_cycles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role public.admin_role_enum;
  v_profile public.operator_commercial_profiles;
  v_current_cycle public.operator_billing_cycles;
  v_next_cycle public.operator_billing_cycles;
  v_effective_cycle_end DATE;
  v_credit NUMERIC(12,2);
  v_adjustment NUMERIC(12,2);
  v_final_charge NUMERIC(12,2);
  v_next_start DATE;
  v_next_end DATE;
  v_invoice_number TEXT;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin authentication required';
  END IF;

  v_role := public.get_admin_role(v_admin_id);
  IF v_role NOT IN ('super_admin'::public.admin_role_enum, 'finance_admin'::public.admin_role_enum) THEN
    RAISE EXCEPTION 'Insufficient privileges to close billing cycle';
  END IF;

  PERFORM public.provision_operator_commercial_profile(p_operator_user_id);

  SELECT * INTO v_profile
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = p_operator_user_id;

  v_effective_cycle_end := COALESCE(p_cycle_end, v_profile.current_cycle_end);

  SELECT * INTO v_current_cycle
  FROM public.operator_billing_cycles
  WHERE operator_user_id = p_operator_user_id
    AND cycle_start = v_profile.current_cycle_start
    AND cycle_end = v_effective_cycle_end;

  IF NOT FOUND THEN
    INSERT INTO public.operator_billing_cycles (
      operator_user_id,
      membership_tier_code,
      cycle_start,
      cycle_end,
      membership_fee,
      prior_cycle_commission_credit,
      adjustment_applied,
      final_membership_charge,
      invoice_status
    ) VALUES (
      p_operator_user_id,
      v_profile.membership_tier_code,
      v_profile.current_cycle_start,
      v_effective_cycle_end,
      v_profile.monthly_membership_fee,
      0,
      0,
      v_profile.monthly_membership_fee,
      'draft'::public.invoice_status_enum
    ) RETURNING * INTO v_current_cycle;
  END IF;

  SELECT COALESCE(ROUND(SUM(ledger.commission_amount), 2), 0)
  INTO v_credit
  FROM public.operator_commission_ledger AS ledger
  WHERE ledger.operator_user_id = p_operator_user_id
    AND ledger.recognized_at::DATE BETWEEN v_current_cycle.cycle_start AND v_current_cycle.cycle_end
    AND ledger.settlement_state NOT IN ('cancelled_by_operator'::public.settlement_state_enum, 'refunded'::public.settlement_state_enum);

  UPDATE public.operator_billing_cycles
  SET
    closed_at = COALESCE(closed_at, TIMEZONE('UTC', NOW())),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE id = v_current_cycle.id
  RETURNING * INTO v_current_cycle;

  v_next_start := v_current_cycle.cycle_end + INTERVAL '1 day';
  v_next_end := (v_next_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_adjustment := LEAST(v_profile.monthly_membership_fee, v_credit);
  v_final_charge := GREATEST(0, ROUND(v_profile.monthly_membership_fee - v_credit, 2));

  UPDATE public.operator_commercial_profiles
  SET
    current_cycle_start = v_next_start,
    current_cycle_end = v_next_end,
    next_billing_date = (v_next_end + INTERVAL '1 day')::DATE,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE operator_user_id = p_operator_user_id;

  INSERT INTO public.operator_billing_cycles (
    operator_user_id,
    membership_tier_code,
    cycle_start,
    cycle_end,
    membership_fee,
    prior_cycle_commission_credit,
    adjustment_applied,
    final_membership_charge,
    invoice_status
  ) VALUES (
    p_operator_user_id,
    v_profile.membership_tier_code,
    v_next_start,
    v_next_end,
    v_profile.monthly_membership_fee,
    v_credit,
    v_adjustment,
    v_final_charge,
    CASE WHEN v_final_charge = 0 THEN 'waived'::public.invoice_status_enum ELSE 'issued'::public.invoice_status_enum END
  )
  ON CONFLICT (operator_user_id, cycle_start, cycle_end) DO UPDATE SET
    membership_tier_code = EXCLUDED.membership_tier_code,
    membership_fee = EXCLUDED.membership_fee,
    prior_cycle_commission_credit = EXCLUDED.prior_cycle_commission_credit,
    adjustment_applied = EXCLUDED.adjustment_applied,
    final_membership_charge = EXCLUDED.final_membership_charge,
    invoice_status = EXCLUDED.invoice_status,
    updated_at = TIMEZONE('UTC', NOW())
  RETURNING * INTO v_next_cycle;

  v_invoice_number := 'TO-' || TO_CHAR(v_next_cycle.cycle_start, 'YYYYMMDD') || '-' || LEFT(REPLACE(v_next_cycle.id::TEXT, '-', ''), 8);

  INSERT INTO public.operator_membership_invoices (
    billing_cycle_id,
    operator_user_id,
    invoice_number,
    plan_name,
    membership_fee,
    prior_cycle_commission_credit,
    adjustment_applied,
    final_charge,
    due_date,
    issued_at,
    payment_status
  ) VALUES (
    v_next_cycle.id,
    p_operator_user_id,
    v_invoice_number,
    INITCAP(v_profile.membership_tier_code::TEXT),
    v_next_cycle.membership_fee,
    v_next_cycle.prior_cycle_commission_credit,
    v_next_cycle.adjustment_applied,
    v_next_cycle.final_membership_charge,
    v_next_cycle.cycle_start,
    TIMEZONE('UTC', NOW()),
    CASE WHEN v_next_cycle.final_membership_charge = 0 THEN 'waived'::public.invoice_status_enum ELSE 'issued'::public.invoice_status_enum END
  )
  ON CONFLICT (billing_cycle_id) DO UPDATE SET
    invoice_number = EXCLUDED.invoice_number,
    plan_name = EXCLUDED.plan_name,
    membership_fee = EXCLUDED.membership_fee,
    prior_cycle_commission_credit = EXCLUDED.prior_cycle_commission_credit,
    adjustment_applied = EXCLUDED.adjustment_applied,
    final_charge = EXCLUDED.final_charge,
    due_date = EXCLUDED.due_date,
    issued_at = EXCLUDED.issued_at,
    payment_status = EXCLUDED.payment_status,
    updated_at = TIMEZONE('UTC', NOW());

  RETURN v_next_cycle;
END;
$$;

CREATE OR REPLACE VIEW public.operator_billing_report_v AS
SELECT
  cycle.id AS billing_cycle_id,
  cycle.operator_user_id,
  cycle.membership_tier_code,
  cycle.cycle_start,
  cycle.cycle_end,
  cycle.membership_fee,
  cycle.prior_cycle_commission_credit,
  cycle.adjustment_applied,
  cycle.final_membership_charge,
  cycle.invoice_status,
  invoice.id AS invoice_id,
  invoice.invoice_number,
  invoice.issued_at,
  invoice.due_date,
  invoice.payment_status,
  invoice.paid_at
FROM public.operator_billing_cycles AS cycle
LEFT JOIN public.operator_membership_invoices AS invoice
  ON invoice.billing_cycle_id = cycle.id;

CREATE OR REPLACE VIEW public.operator_payout_report_v AS
SELECT
  payout_item.id AS payout_item_id,
  payout_item.operator_user_id,
  payout_item.booking_id,
  booking.traveler_id,
  tour.title AS trip_name,
  schedule.start_time AS travel_date,
  payout_item.gross_amount,
  payout_item.refund_amount,
  payout_item.commission_amount AS commission_retained_by_tripavail,
  payout_item.operator_payable_amount,
  payout_item.payout_status,
  payout_item.payout_due_at,
  payout_item.paid_at,
  payout_item.hold_reason,
  payout_item.recovery_amount,
  payout_batch.batch_reference,
  payout_batch.scheduled_for AS payout_batch_scheduled_for
FROM public.operator_payout_items AS payout_item
LEFT JOIN public.tour_bookings AS booking
  ON booking.id = payout_item.booking_id
LEFT JOIN public.tours AS tour
  ON tour.id = booking.tour_id
LEFT JOIN public.tour_schedules AS schedule
  ON schedule.id = booking.schedule_id
LEFT JOIN public.operator_payout_batches AS payout_batch
  ON payout_batch.id = payout_item.payout_batch_id;

CREATE OR REPLACE VIEW public.operator_performance_report_v AS
SELECT
  profile.operator_user_id,
  profile.membership_tier_code,
  profile.membership_status,
  COALESCE(tour_metrics.published_trips, 0) AS published_trips,
  COALESCE(ledger_metrics.confirmed_bookings, 0) AS confirmed_bookings,
  COALESCE(ledger_metrics.gmv, 0) AS gmv,
  COALESCE(ledger_metrics.commission_paid, 0) AS commission_paid,
  COALESCE(payout_metrics.payouts_received, 0) AS payouts_received,
  COALESCE(feature_metrics.ai_usage, 0) AS ai_usage,
  COALESCE(feature_metrics.pickup_usage, 0) AS pickup_usage,
  COALESCE(feature_metrics.map_usage, 0) AS map_usage
FROM public.operator_commercial_profiles AS profile
LEFT JOIN (
  SELECT
    operator_id AS operator_user_id,
    COUNT(*) FILTER (WHERE is_active = TRUE) AS published_trips
  FROM public.tours
  GROUP BY operator_id
) AS tour_metrics
  ON tour_metrics.operator_user_id = profile.operator_user_id
LEFT JOIN (
  SELECT
    operator_user_id,
    COUNT(DISTINCT booking_id) AS confirmed_bookings,
    ROUND(SUM(booking_total), 2) AS gmv,
    ROUND(SUM(commission_amount), 2) AS commission_paid
  FROM public.operator_commission_ledger
  GROUP BY operator_user_id
) AS ledger_metrics
  ON ledger_metrics.operator_user_id = profile.operator_user_id
LEFT JOIN (
  SELECT
    operator_user_id,
    ROUND(SUM(operator_payable_amount), 2) AS payouts_received
  FROM public.operator_payout_items
  GROUP BY operator_user_id
) AS payout_metrics
  ON payout_metrics.operator_user_id = profile.operator_user_id
LEFT JOIN (
  SELECT
    operator_user_id,
    SUM(ai_itinerary_credits_used) AS ai_usage,
    SUM(pickup_multi_city_uses) AS pickup_usage,
    SUM(google_maps_uses) AS map_usage
  FROM public.operator_feature_usage_monthly
  GROUP BY operator_user_id
) AS feature_metrics
  ON feature_metrics.operator_user_id = profile.operator_user_id;

CREATE OR REPLACE VIEW public.admin_finance_summary_v AS
SELECT
  COALESCE(snapshot_metrics.total_customer_payments_collected, 0) AS total_customer_payments_collected,
  COALESCE(snapshot_metrics.total_commission_earned, 0) AS total_commission_earned,
  COALESCE(cycle_metrics.total_membership_fees_charged, 0) AS total_membership_fees_charged,
  COALESCE(cycle_metrics.total_membership_fees_waived_adjusted, 0) AS total_membership_fees_waived_adjusted,
  COALESCE(payout_metrics.total_operator_payouts, 0) AS total_operator_payouts,
  COALESCE(payout_metrics.total_held_amounts, 0) AS total_held_amounts,
  COALESCE(snapshot_metrics.total_refunds, 0) AS total_refunds,
  COALESCE(payout_metrics.total_recovery_pending, 0) AS total_recovery_pending,
  COALESCE(snapshot_metrics.total_chargebacks_disputes, 0) AS total_chargebacks_disputes
FROM (
  SELECT
    ROUND(SUM(payment_collected), 2) AS total_customer_payments_collected,
    ROUND(SUM(commission_amount), 2) AS total_commission_earned,
    ROUND(SUM(refund_amount), 2) AS total_refunds,
    COUNT(*) FILTER (WHERE settlement_state = 'chargeback_open'::public.settlement_state_enum) AS total_chargebacks_disputes
  FROM public.operator_booking_finance_snapshots
) AS snapshot_metrics
CROSS JOIN (
  SELECT
    ROUND(SUM(final_membership_charge), 2) AS total_membership_fees_charged,
    ROUND(SUM(adjustment_applied), 2) AS total_membership_fees_waived_adjusted
  FROM public.operator_billing_cycles
) AS cycle_metrics
CROSS JOIN (
  SELECT
    ROUND(SUM(operator_payable_amount), 2) AS total_operator_payouts,
    ROUND(SUM(operator_payable_amount) FILTER (WHERE payout_status = 'on_hold'::public.payout_status_enum), 2) AS total_held_amounts,
    ROUND(SUM(recovery_amount), 2) AS total_recovery_pending
  FROM public.operator_payout_items
) AS payout_metrics;

CREATE OR REPLACE VIEW public.membership_tier_report_v AS
SELECT
  tier.code AS membership_tier_code,
  tier.display_name,
  COUNT(profile.operator_user_id) AS operators_count,
  COALESCE(ROUND(AVG(performance.gmv), 2), 0) AS average_gmv,
  COALESCE(ROUND(AVG(performance.payouts_received), 2), 0) AS average_payout,
  COALESCE(ROUND(AVG(performance.ai_usage), 2), 0) AS average_ai_usage,
  COALESCE(ROUND(AVG(performance.pickup_usage), 2), 0) AS average_pickup_usage,
  COALESCE(ROUND(AVG(performance.map_usage), 2), 0) AS average_map_usage
FROM public.commercial_membership_tiers AS tier
LEFT JOIN public.operator_commercial_profiles AS profile
  ON profile.membership_tier_code = tier.code
LEFT JOIN public.operator_performance_report_v AS performance
  ON performance.operator_user_id = profile.operator_user_id
GROUP BY tier.code, tier.display_name;

GRANT EXECUTE ON FUNCTION public.provision_operator_commercial_profile(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_assign_operator_membership_tier(UUID, public.membership_tier_code_enum, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_close_operator_billing_cycle(UUID, DATE) TO authenticated;

INSERT INTO public.operator_commercial_profiles (
  operator_user_id,
  operational_status,
  kyc_status,
  membership_tier_code,
  membership_status,
  commission_rate,
  monthly_membership_fee,
  billing_cycle_anchor_day,
  current_cycle_start,
  current_cycle_end,
  next_billing_date
)
SELECT
  profile.user_id,
  CASE
    WHEN role.verification_status = 'approved' THEN 'active'::public.operator_operational_status_enum
    WHEN role.verification_status = 'rejected' THEN 'restricted'::public.operator_operational_status_enum
    ELSE 'pending'::public.operator_operational_status_enum
  END,
  public.commercial_map_verification_status(role.verification_status),
  'gold'::public.membership_tier_code_enum,
  'active'::public.membership_status_enum,
  tier.commission_rate,
  tier.monthly_fee,
  LEAST(28, EXTRACT(DAY FROM COALESCE(profile.created_at, TIMEZONE('UTC', NOW())))::INT),
  COALESCE(profile.created_at, TIMEZONE('UTC', NOW()))::DATE,
  (COALESCE(profile.created_at, TIMEZONE('UTC', NOW()))::DATE + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
  (COALESCE(profile.created_at, TIMEZONE('UTC', NOW()))::DATE + INTERVAL '1 month')::DATE
FROM public.tour_operator_profiles AS profile
LEFT JOIN public.user_roles AS role
  ON role.user_id = profile.user_id
 AND role.role_type = 'tour_operator'
CROSS JOIN LATERAL (
  SELECT monthly_fee, commission_rate
  FROM public.commercial_membership_tiers
  WHERE code = 'gold'::public.membership_tier_code_enum
) AS tier
ON CONFLICT (operator_user_id) DO NOTHING;

INSERT INTO public.operator_billing_cycles (
  operator_user_id,
  membership_tier_code,
  cycle_start,
  cycle_end,
  membership_fee,
  prior_cycle_commission_credit,
  adjustment_applied,
  final_membership_charge,
  invoice_status
)
SELECT
  profile.operator_user_id,
  profile.membership_tier_code,
  profile.current_cycle_start,
  profile.current_cycle_end,
  profile.monthly_membership_fee,
  0,
  0,
  profile.monthly_membership_fee,
  'draft'::public.invoice_status_enum
FROM public.operator_commercial_profiles AS profile
ON CONFLICT (operator_user_id, cycle_start, cycle_end) DO NOTHING;

INSERT INTO public.operator_booking_finance_snapshots (
  booking_id,
  operator_user_id,
  traveler_id,
  membership_tier_code,
  membership_status,
  booking_total,
  payment_collected,
  refund_amount,
  commission_rate,
  commission_amount,
  operator_receivable_estimate,
  settlement_state,
  payout_status,
  payout_available_at,
  notes
)
SELECT
  booking.id,
  tour.operator_id,
  booking.traveler_id,
  COALESCE(profile.membership_tier_code, 'gold'::public.membership_tier_code_enum),
  COALESCE(profile.membership_status, 'active'::public.membership_status_enum),
  ROUND(COALESCE(booking.total_price, 0)::NUMERIC, 2),
  ROUND(
    CASE
      WHEN COALESCE(booking.payment_status, 'unpaid') IN ('paid', 'balance_pending', 'partially_paid')
        THEN COALESCE(booking.amount_paid_online, booking.upfront_amount, booking.total_price, 0)::NUMERIC
      ELSE 0::NUMERIC
    END,
    2
  ),
  0,
  COALESCE(profile.commission_rate, 20),
  ROUND(COALESCE(booking.total_price, 0)::NUMERIC * COALESCE(profile.commission_rate, 20) / 100.0, 2),
  GREATEST(0, ROUND(COALESCE(booking.total_price, 0)::NUMERIC - (COALESCE(booking.total_price, 0)::NUMERIC * COALESCE(profile.commission_rate, 20) / 100.0), 2)),
  CASE
    WHEN booking.status = 'pending' THEN 'pending_payment'::public.settlement_state_enum
    WHEN booking.status = 'confirmed' AND COALESCE(booking.payment_status, 'unpaid') IN ('paid', 'balance_pending', 'partially_paid') THEN 'paid_pending_service'::public.settlement_state_enum
    WHEN booking.status = 'completed' THEN 'eligible_for_payout'::public.settlement_state_enum
    WHEN booking.status = 'cancelled' AND COALESCE(booking.payment_status, '') IN ('refunded', 'partially_refunded') THEN 'refunded'::public.settlement_state_enum
    WHEN booking.status = 'cancelled' THEN 'cancelled_by_operator'::public.settlement_state_enum
    ELSE 'draft'::public.settlement_state_enum
  END,
  CASE
    WHEN booking.status = 'completed' THEN 'eligible'::public.payout_status_enum
    ELSE 'not_ready'::public.payout_status_enum
  END,
  CASE
    WHEN booking.status = 'completed' THEN public.commercial_next_business_day(COALESCE(schedule.end_time, TIMEZONE('UTC', NOW())))
    ELSE NULL
  END,
  jsonb_build_object(
    'tour_id', booking.tour_id,
    'schedule_id', booking.schedule_id,
    'payment_status', booking.payment_status,
    'booking_status', booking.status
  )
FROM public.tour_bookings AS booking
INNER JOIN public.tours AS tour
  ON tour.id = booking.tour_id
LEFT JOIN public.tour_schedules AS schedule
  ON schedule.id = booking.schedule_id
LEFT JOIN public.operator_commercial_profiles AS profile
  ON profile.operator_user_id = tour.operator_id
ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO public.operator_commission_ledger (
  operator_user_id,
  booking_id,
  entry_type,
  membership_tier_code,
  booking_total,
  commission_rate,
  commission_amount,
  operator_receivable_estimate,
  settlement_state,
  payout_status,
  available_for_payout_at
)
SELECT
  snapshot.operator_user_id,
  snapshot.booking_id,
  'commission_snapshot'::public.ledger_entry_type_enum,
  snapshot.membership_tier_code,
  snapshot.booking_total,
  snapshot.commission_rate,
  snapshot.commission_amount,
  snapshot.operator_receivable_estimate,
  snapshot.settlement_state,
  snapshot.payout_status,
  snapshot.payout_available_at
FROM public.operator_booking_finance_snapshots AS snapshot
ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO public.operator_payout_items (
  booking_id,
  operator_user_id,
  gross_amount,
  commission_amount,
  refund_amount,
  operator_payable_amount,
  payout_status,
  payout_due_at,
  recovery_amount
)
SELECT
  snapshot.booking_id,
  snapshot.operator_user_id,
  snapshot.booking_total,
  snapshot.commission_amount,
  snapshot.refund_amount,
  snapshot.operator_receivable_estimate,
  snapshot.payout_status,
  snapshot.payout_available_at,
  0
FROM public.operator_booking_finance_snapshots AS snapshot
ON CONFLICT (booking_id) DO NOTHING;