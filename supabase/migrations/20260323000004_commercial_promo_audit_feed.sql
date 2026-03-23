BEGIN;

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.admin_action_logs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%entity_type%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.admin_action_logs DROP CONSTRAINT %I', c.conname);
  END LOOP;

  ALTER TABLE public.admin_action_logs
    ADD CONSTRAINT admin_action_logs_entity_type_check
    CHECK (
      entity_type IN (
        'user',
        'partner',
        'package',
        'tour',
        'booking',
        'report',
        'verification',
        'commercial_profile',
        'payout_batch',
        'payout_item',
        'promotion'
      )
    );
END $$;

CREATE OR REPLACE FUNCTION public.reverse_operator_payout_batch(
  p_batch_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  batch_id UUID,
  batch_reference TEXT,
  previous_status public.payout_status_enum,
  items_reversed INTEGER,
  recovery_items INTEGER,
  total_recovery_amount NUMERIC(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_admin_id UUID := auth.uid();
  v_claim_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_batch_reference TEXT;
  v_batch_status public.payout_status_enum;
  v_requires_recovery BOOLEAN := FALSE;
  v_items_reversed INTEGER := 0;
  v_recovery_items INTEGER := 0;
  v_total_recovery_amount NUMERIC(12,2) := 0;
  v_operator_user_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();

  IF v_claim_role <> 'service_role' AND (v_reason IS NULL OR CHAR_LENGTH(v_reason) < 10) THEN
    RAISE EXCEPTION 'Reason must be at least 10 characters';
  END IF;

  SELECT batch.batch_reference, batch.status
  INTO v_batch_reference, v_batch_status
  FROM public.operator_payout_batches AS batch
  WHERE batch.id = p_batch_id
  FOR UPDATE;

  IF v_batch_reference IS NULL THEN
    RAISE EXCEPTION 'Payout batch % not found', p_batch_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_batch_status = 'reversed'::public.payout_status_enum THEN
    RAISE EXCEPTION 'Payout batch % is already reversed', p_batch_id
      USING ERRCODE = 'P0001';
  END IF;

  v_requires_recovery := v_batch_status = 'paid'::public.payout_status_enum;

  CREATE TEMP TABLE IF NOT EXISTS tmp_operator_payout_batch_reverse_items (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    operator_user_id UUID NOT NULL,
    operator_payable_amount NUMERIC(12,2) NOT NULL,
    recovery_amount NUMERIC(12,2) NOT NULL
  ) ON COMMIT DROP;

  TRUNCATE TABLE tmp_operator_payout_batch_reverse_items;

  INSERT INTO tmp_operator_payout_batch_reverse_items (
    id,
    booking_id,
    operator_user_id,
    operator_payable_amount,
    recovery_amount
  )
  SELECT
    payout_item.id,
    payout_item.booking_id,
    payout_item.operator_user_id,
    COALESCE(payout_item.net_operator_payable_amount, payout_item.operator_payable_amount),
    CASE
      WHEN v_requires_recovery THEN GREATEST(COALESCE(payout_item.recovery_amount, 0), COALESCE(payout_item.net_operator_payable_amount, payout_item.operator_payable_amount))
      ELSE 0::NUMERIC
    END
  FROM public.operator_payout_items AS payout_item
  WHERE payout_item.payout_batch_id = p_batch_id
    AND payout_item.payout_status IN (
      'eligible'::public.payout_status_enum,
      'scheduled'::public.payout_status_enum,
      'paid'::public.payout_status_enum,
      'recovery_pending'::public.payout_status_enum
    )
  FOR UPDATE OF payout_item;

  IF NOT EXISTS (SELECT 1 FROM tmp_operator_payout_batch_reverse_items) THEN
    RETURN;
  END IF;

  SELECT COALESCE(array_agg(DISTINCT reverse_item.operator_user_id), ARRAY[]::UUID[])
  INTO v_operator_user_ids
  FROM tmp_operator_payout_batch_reverse_items AS reverse_item;

  UPDATE public.operator_payout_batches AS batch
  SET
    status = 'reversed'::public.payout_status_enum,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE batch.id = p_batch_id;

  UPDATE public.operator_payout_items AS payout_item
  SET
    payout_batch_id = CASE WHEN v_requires_recovery THEN payout_item.payout_batch_id ELSE NULL END,
    payout_status = CASE
      WHEN v_requires_recovery AND reverse_item.recovery_amount > 0 THEN 'recovery_pending'::public.payout_status_enum
      WHEN v_requires_recovery THEN 'reversed'::public.payout_status_enum
      ELSE 'eligible'::public.payout_status_enum
    END,
    recovery_amount = reverse_item.recovery_amount,
    paid_at = CASE WHEN v_requires_recovery THEN payout_item.paid_at ELSE NULL END,
    hold_reason = CASE
      WHEN v_requires_recovery AND reverse_item.recovery_amount > 0 THEN COALESCE(v_reason, 'Recovery pending after payout reversal')
      ELSE NULL
    END,
    recovery_deduction_amount = 0,
    net_operator_payable_amount = payout_item.operator_payable_amount,
    updated_at = TIMEZONE('UTC', NOW())
  FROM tmp_operator_payout_batch_reverse_items AS reverse_item
  WHERE payout_item.id = reverse_item.id;

  UPDATE public.operator_booking_finance_snapshots AS snapshot
  SET
    settlement_state = CASE
      WHEN v_requires_recovery AND EXISTS (
        SELECT 1
        FROM tmp_operator_payout_batch_reverse_items AS reverse_item
        WHERE reverse_item.booking_id = snapshot.booking_id
          AND reverse_item.recovery_amount > 0
      ) THEN 'chargeback_open'::public.settlement_state_enum
      ELSE 'eligible_for_payout'::public.settlement_state_enum
    END,
    payout_status = CASE
      WHEN v_requires_recovery AND EXISTS (
        SELECT 1
        FROM tmp_operator_payout_batch_reverse_items AS reverse_item
        WHERE reverse_item.booking_id = snapshot.booking_id
          AND reverse_item.recovery_amount > 0
      ) THEN 'recovery_pending'::public.payout_status_enum
      WHEN v_requires_recovery THEN 'reversed'::public.payout_status_enum
      ELSE 'eligible'::public.payout_status_enum
    END,
    payout_completed_at = CASE WHEN v_requires_recovery THEN NULL ELSE snapshot.payout_completed_at END,
    notes = COALESCE(snapshot.notes, '{}'::JSONB) || jsonb_build_object(
      'payout_batch_reference', v_batch_reference,
      'payout_reversed_at', TIMEZONE('UTC', NOW()),
      'payout_reversal_reason', v_reason,
      'payout_reversal_requires_recovery', v_requires_recovery
    ),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE snapshot.booking_id IN (
    SELECT booking_id FROM tmp_operator_payout_batch_reverse_items
  );

  UPDATE public.operator_commission_ledger AS ledger
  SET
    settlement_state = CASE
      WHEN v_requires_recovery AND EXISTS (
        SELECT 1
        FROM tmp_operator_payout_batch_reverse_items AS reverse_item
        WHERE reverse_item.booking_id = ledger.booking_id
          AND reverse_item.recovery_amount > 0
      ) THEN 'chargeback_open'::public.settlement_state_enum
      ELSE 'eligible_for_payout'::public.settlement_state_enum
    END,
    payout_status = CASE
      WHEN v_requires_recovery AND EXISTS (
        SELECT 1
        FROM tmp_operator_payout_batch_reverse_items AS reverse_item
        WHERE reverse_item.booking_id = ledger.booking_id
          AND reverse_item.recovery_amount > 0
      ) THEN 'recovery_pending'::public.payout_status_enum
      WHEN v_requires_recovery THEN 'reversed'::public.payout_status_enum
      ELSE 'eligible'::public.payout_status_enum
    END,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE ledger.booking_id IN (
    SELECT booking_id FROM tmp_operator_payout_batch_reverse_items
  );

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE reverse_item.recovery_amount > 0)::INTEGER,
    ROUND(COALESCE(SUM(reverse_item.recovery_amount), 0), 2)
  INTO v_items_reversed, v_recovery_items, v_total_recovery_amount
  FROM tmp_operator_payout_batch_reverse_items AS reverse_item;

  IF v_claim_role <> 'service_role' AND v_actor_admin_id IS NOT NULL AND public.is_admin(v_actor_admin_id) THEN
    PERFORM public.admin_log_action(
      'payout_batch',
      p_batch_id,
      'payout_batch_reversed',
      v_reason,
      jsonb_build_object(
        'batch_reference', v_batch_reference,
        'status', v_batch_status,
        'operator_user_ids', v_operator_user_ids
      ),
      jsonb_build_object(
        'batch_reference', v_batch_reference,
        'status', 'reversed',
        'operator_user_ids', v_operator_user_ids,
        'recovery_required', v_requires_recovery,
        'items_reversed', v_items_reversed,
        'recovery_items', v_recovery_items,
        'total_recovery_amount', v_total_recovery_amount
      )
    );
  END IF;

  RETURN QUERY
  SELECT
    p_batch_id,
    v_batch_reference,
    v_batch_status,
    v_items_reversed,
    v_recovery_items,
    v_total_recovery_amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_operator_payout_recovery(
  p_payout_item_id UUID,
  p_recovered_amount NUMERIC(12,2) DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  payout_item_id UUID,
  booking_id UUID,
  payout_status public.payout_status_enum,
  recovered_amount NUMERIC(12,2),
  remaining_recovery_amount NUMERIC(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_admin_id UUID := auth.uid();
  v_claim_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_booking_id UUID;
  v_operator_user_id UUID;
  v_existing_recovery_amount NUMERIC(12,2);
  v_effective_recovered_amount NUMERIC(12,2);
  v_remaining_recovery_amount NUMERIC(12,2);
  v_previous_status public.payout_status_enum;
  v_next_status public.payout_status_enum;
  v_next_settlement_state public.settlement_state_enum;
BEGIN
  PERFORM public.ensure_finance_admin_or_service_role();

  IF v_claim_role <> 'service_role' AND (v_reason IS NULL OR CHAR_LENGTH(v_reason) < 10) THEN
    RAISE EXCEPTION 'Reason must be at least 10 characters';
  END IF;

  SELECT payout_item.booking_id, payout_item.operator_user_id, payout_item.recovery_amount, payout_item.payout_status
  INTO v_booking_id, v_operator_user_id, v_existing_recovery_amount, v_previous_status
  FROM public.operator_payout_items AS payout_item
  WHERE payout_item.id = p_payout_item_id
    AND payout_item.payout_status = 'recovery_pending'::public.payout_status_enum
  FOR UPDATE;

  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'Recovery payout item % not found', p_payout_item_id
      USING ERRCODE = 'P0002';
  END IF;

  v_existing_recovery_amount := ROUND(COALESCE(v_existing_recovery_amount, 0), 2);

  IF v_existing_recovery_amount <= 0 THEN
    RAISE EXCEPTION 'Recovery payout item % has no outstanding recovery amount', p_payout_item_id
      USING ERRCODE = 'P0001';
  END IF;

  v_effective_recovered_amount := ROUND(
    LEAST(
      v_existing_recovery_amount,
      GREATEST(COALESCE(p_recovered_amount, v_existing_recovery_amount), 0)
    ),
    2
  );
  v_remaining_recovery_amount := ROUND(v_existing_recovery_amount - v_effective_recovered_amount, 2);

  v_next_status := CASE
    WHEN v_remaining_recovery_amount > 0 THEN 'recovery_pending'::public.payout_status_enum
    ELSE 'reversed'::public.payout_status_enum
  END;

  v_next_settlement_state := CASE
    WHEN v_remaining_recovery_amount > 0 THEN 'chargeback_open'::public.settlement_state_enum
    ELSE 'completed_pending_payout'::public.settlement_state_enum
  END;

  UPDATE public.operator_payout_items AS payout_item
  SET
    recovery_amount = v_remaining_recovery_amount,
    payout_status = v_next_status,
    hold_reason = CASE
      WHEN v_remaining_recovery_amount > 0 THEN COALESCE(v_reason, 'Partial recovery still outstanding')
      ELSE NULL
    END,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE payout_item.id = p_payout_item_id;

  UPDATE public.operator_booking_finance_snapshots AS snapshot
  SET
    settlement_state = v_next_settlement_state,
    payout_status = v_next_status,
    payout_completed_at = NULL,
    notes = COALESCE(snapshot.notes, '{}'::JSONB) || jsonb_build_object(
      'payout_recovery_resolved_at', TIMEZONE('UTC', NOW()),
      'payout_recovery_resolution_reason', v_reason,
      'payout_recovered_amount', v_effective_recovered_amount,
      'payout_recovery_remaining_amount', v_remaining_recovery_amount
    ),
    updated_at = TIMEZONE('UTC', NOW())
  WHERE snapshot.booking_id = v_booking_id;

  UPDATE public.operator_commission_ledger AS ledger
  SET
    settlement_state = v_next_settlement_state,
    payout_status = v_next_status,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE ledger.booking_id = v_booking_id;

  IF v_claim_role <> 'service_role' AND v_actor_admin_id IS NOT NULL AND public.is_admin(v_actor_admin_id) THEN
    PERFORM public.admin_log_action(
      'payout_item',
      p_payout_item_id,
      'payout_recovery_resolved',
      v_reason,
      jsonb_build_object(
        'booking_id', v_booking_id,
        'operator_user_id', v_operator_user_id,
        'payout_status', v_previous_status,
        'recovery_amount', v_existing_recovery_amount
      ),
      jsonb_build_object(
        'booking_id', v_booking_id,
        'operator_user_id', v_operator_user_id,
        'payout_status', v_next_status,
        'recovered_amount', v_effective_recovered_amount,
        'remaining_recovery_amount', v_remaining_recovery_amount
      )
    );
  END IF;

  RETURN QUERY
  SELECT
    p_payout_item_id,
    v_booking_id,
    v_next_status,
    v_effective_recovered_amount,
    v_remaining_recovery_amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_admin_operator_promotion_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.admin_log_action(
      'promotion',
      NEW.id,
      'promotion_created',
      NULL,
      NULL,
      jsonb_build_object(
        'operator_user_id', NEW.operator_user_id,
        'applicable_tour_id', NEW.applicable_tour_id,
        'title', NEW.title,
        'code', UPPER(BTRIM(NEW.code)),
        'funding_source', NEW.funding_source,
        'discount_type', NEW.discount_type,
        'discount_value', NEW.discount_value,
        'max_discount_value', NEW.max_discount_value,
        'is_active', NEW.is_active
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    PERFORM public.admin_log_action(
      'promotion',
      NEW.id,
      'promotion_updated',
      NULL,
      jsonb_build_object(
        'operator_user_id', OLD.operator_user_id,
        'applicable_tour_id', OLD.applicable_tour_id,
        'title', OLD.title,
        'code', UPPER(BTRIM(OLD.code)),
        'funding_source', OLD.funding_source,
        'discount_type', OLD.discount_type,
        'discount_value', OLD.discount_value,
        'max_discount_value', OLD.max_discount_value,
        'is_active', OLD.is_active
      ),
      jsonb_build_object(
        'operator_user_id', NEW.operator_user_id,
        'applicable_tour_id', NEW.applicable_tour_id,
        'title', NEW.title,
        'code', UPPER(BTRIM(NEW.code)),
        'funding_source', NEW.funding_source,
        'discount_type', NEW.discount_type,
        'discount_value', NEW.discount_value,
        'max_discount_value', NEW.max_discount_value,
        'is_active', NEW.is_active
      )
    );
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_admin_operator_promotion_changes ON public.operator_promotions;
CREATE TRIGGER audit_admin_operator_promotion_changes
AFTER INSERT OR UPDATE ON public.operator_promotions
FOR EACH ROW
EXECUTE FUNCTION public.audit_admin_operator_promotion_changes();

COMMIT;