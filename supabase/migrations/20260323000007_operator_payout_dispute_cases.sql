BEGIN;

CREATE TABLE IF NOT EXISTS public.operator_payout_dispute_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL,
  payout_item_id UUID NOT NULL REFERENCES public.operator_payout_items(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL,
  conversation_id UUID NULL REFERENCES public.booking_conversations(id) ON DELETE SET NULL,
  dispute_category TEXT NOT NULL CHECK (
    dispute_category IN (
      'payout_hold',
      'recovery_deduction',
      'refund_mismatch',
      'promo_funding_mismatch',
      'commission_mismatch',
      'missing_payout',
      'other'
    )
  ),
  requested_action TEXT NOT NULL CHECK (
    requested_action IN (
      'release_payout',
      'review_recovery',
      'review_refund',
      'review_promo_funding',
      'review_commission',
      'manual_reconciliation',
      'other'
    )
  ),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'in_review', 'resolved', 'withdrawn')
  ),
  reason_summary TEXT NOT NULL,
  evidence_notes TEXT NULL,
  reconciliation_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  support_escalated_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE INDEX IF NOT EXISTS idx_operator_payout_dispute_cases_operator_created
  ON public.operator_payout_dispute_cases(operator_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operator_payout_dispute_cases_payout_item
  ON public.operator_payout_dispute_cases(payout_item_id);

CREATE INDEX IF NOT EXISTS idx_operator_payout_dispute_cases_conversation
  ON public.operator_payout_dispute_cases(conversation_id)
  WHERE conversation_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_operator_payout_dispute_cases_updated_at
  ON public.operator_payout_dispute_cases;
CREATE TRIGGER trg_operator_payout_dispute_cases_updated_at
BEFORE UPDATE ON public.operator_payout_dispute_cases
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.operator_payout_dispute_cases ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE public.operator_payout_dispute_cases TO authenticated;
GRANT ALL ON TABLE public.operator_payout_dispute_cases TO service_role;

DROP POLICY IF EXISTS "Operator can manage own payout dispute cases"
  ON public.operator_payout_dispute_cases;
CREATE POLICY "Operator can manage own payout dispute cases"
  ON public.operator_payout_dispute_cases
  FOR ALL TO authenticated
  USING (operator_user_id = auth.uid())
  WITH CHECK (operator_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage payout dispute cases"
  ON public.operator_payout_dispute_cases;
CREATE POLICY "Admins can manage payout dispute cases"
  ON public.operator_payout_dispute_cases
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMIT;