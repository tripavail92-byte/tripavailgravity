import { supabase } from '@/lib/supabase'

export type MembershipTierCode = 'gold' | 'diamond' | 'platinum'

export interface CommercialTierConfig {
  code: MembershipTierCode
  display_name: string
  monthly_fee: number
  commission_rate: number
  minimum_deposit_percent: number
  monthly_publish_limit: number
  pickup_multi_city_enabled: boolean
  google_maps_enabled: boolean
  ai_itinerary_enabled: boolean
  ai_monthly_credits: number
}

export interface OperatorCommercialProfile {
  operator_user_id: string
  operational_status: string
  kyc_status: string
  membership_tier_code: MembershipTierCode
  membership_status: string
  commission_rate: number
  monthly_membership_fee: number
  current_cycle_start: string
  current_cycle_end: string
  next_billing_date: string
  payout_hold: boolean
  payout_hold_reason: string | null
  monthly_published_tours_count: number
  ai_credits_used_current_cycle: number
  feature_overrides: Record<string, unknown>
  tour_operator_profiles?: {
    company_name?: string | null
    primary_city?: string | null
    contact_person?: string | null
    account_status?: string | null
  } | null
}

export interface OperatorPerformanceReport {
  operator_user_id: string
  membership_tier_code: MembershipTierCode
  membership_status: string
  published_trips: number
  confirmed_bookings: number
  gmv: number
  commission_paid: number
  payouts_received: number
  ai_usage: number
  pickup_usage: number
  map_usage: number
}

export interface OperatorBillingReportRow {
  billing_cycle_id: string
  operator_user_id: string
  membership_tier_code: MembershipTierCode
  cycle_start: string
  cycle_end: string
  membership_fee: number
  prior_cycle_commission_credit: number
  adjustment_applied: number
  final_membership_charge: number
  invoice_status: string
  invoice_id: string | null
  invoice_number: string | null
  issued_at: string | null
  due_date: string | null
  payment_status: string | null
  paid_at: string | null
}

export interface OperatorPayoutReportRow {
  payout_item_id: string
  operator_user_id: string
  booking_id: string
  traveler_id: string | null
  trip_name: string | null
  travel_date: string | null
  gross_amount: number
  refund_amount: number
  commission_retained_by_tripavail: number
  operator_payable_amount: number
  payout_status: string
  payout_due_at: string | null
  paid_at: string | null
  hold_reason: string | null
  recovery_amount: number
  batch_reference: string | null
  payout_batch_scheduled_for: string | null
}

export interface OperatorPayoutBatch {
  id: string
  batch_reference: string
  scheduled_for: string
  status: string
  total_gross_amount: number
  total_commission_amount: number
  total_operator_payable: number
  created_at: string
}

export interface PayoutBatchActionResult {
  batch_id: string
  batch_reference: string
  previous_status?: string
  items_reversed?: number
  recovery_items?: number
  total_recovery_amount?: number
  items_paid?: number
  total_operator_payable?: number
  paid_at?: string | null
}

export interface PayoutRecoveryResult {
  payout_item_id: string
  booking_id: string
  payout_status: string
  recovered_amount: number
  remaining_recovery_amount: number
}

export interface AdminFinanceSummary {
  total_customer_payments_collected: number
  total_commission_earned: number
  total_membership_fees_charged: number
  total_membership_fees_waived_adjusted: number
  total_operator_payouts: number
  total_held_amounts: number
  total_refunds: number
  total_recovery_pending: number
  total_chargebacks_disputes: number
}

export interface MembershipTierReportRow {
  membership_tier_code: MembershipTierCode
  display_name: string
  operators_count: number
  average_gmv: number
  average_payout: number
  average_ai_usage: number
  average_pickup_usage: number
  average_map_usage: number
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapProfile(row: any): OperatorCommercialProfile {
  return {
    operator_user_id: row.operator_user_id,
    operational_status: row.operational_status,
    kyc_status: row.kyc_status,
    membership_tier_code: row.membership_tier_code,
    membership_status: row.membership_status,
    commission_rate: toNumber(row.commission_rate),
    monthly_membership_fee: toNumber(row.monthly_membership_fee),
    current_cycle_start: row.current_cycle_start,
    current_cycle_end: row.current_cycle_end,
    next_billing_date: row.next_billing_date,
    payout_hold: Boolean(row.payout_hold),
    payout_hold_reason: row.payout_hold_reason ?? null,
    monthly_published_tours_count: toNumber(row.monthly_published_tours_count),
    ai_credits_used_current_cycle: toNumber(row.ai_credits_used_current_cycle),
    feature_overrides: row.feature_overrides ?? {},
    tour_operator_profiles: row.tour_operator_profiles
      ? {
          company_name: row.tour_operator_profiles.company_name ?? null,
          primary_city: row.tour_operator_profiles.primary_city ?? null,
          contact_person: row.tour_operator_profiles.contact_person ?? null,
          account_status: row.tour_operator_profiles.account_status ?? null,
        }
      : null,
  }
}

function mapPerformance(row: any): OperatorPerformanceReport {
  return {
    operator_user_id: row.operator_user_id,
    membership_tier_code: row.membership_tier_code,
    membership_status: row.membership_status,
    published_trips: toNumber(row.published_trips),
    confirmed_bookings: toNumber(row.confirmed_bookings),
    gmv: toNumber(row.gmv),
    commission_paid: toNumber(row.commission_paid),
    payouts_received: toNumber(row.payouts_received),
    ai_usage: toNumber(row.ai_usage),
    pickup_usage: toNumber(row.pickup_usage),
    map_usage: toNumber(row.map_usage),
  }
}

function mapBillingRow(row: any): OperatorBillingReportRow {
  return {
    billing_cycle_id: row.billing_cycle_id,
    operator_user_id: row.operator_user_id,
    membership_tier_code: row.membership_tier_code,
    cycle_start: row.cycle_start,
    cycle_end: row.cycle_end,
    membership_fee: toNumber(row.membership_fee),
    prior_cycle_commission_credit: toNumber(row.prior_cycle_commission_credit),
    adjustment_applied: toNumber(row.adjustment_applied),
    final_membership_charge: toNumber(row.final_membership_charge),
    invoice_status: row.invoice_status,
    invoice_id: row.invoice_id ?? null,
    invoice_number: row.invoice_number ?? null,
    issued_at: row.issued_at ?? null,
    due_date: row.due_date ?? null,
    payment_status: row.payment_status ?? null,
    paid_at: row.paid_at ?? null,
  }
}

function mapPayoutRow(row: any): OperatorPayoutReportRow {
  return {
    payout_item_id: row.payout_item_id,
    operator_user_id: row.operator_user_id,
    booking_id: row.booking_id,
    traveler_id: row.traveler_id ?? null,
    trip_name: row.trip_name ?? null,
    travel_date: row.travel_date ?? null,
    gross_amount: toNumber(row.gross_amount),
    refund_amount: toNumber(row.refund_amount),
    commission_retained_by_tripavail: toNumber(row.commission_retained_by_tripavail),
    operator_payable_amount: toNumber(row.operator_payable_amount),
    payout_status: row.payout_status,
    payout_due_at: row.payout_due_at ?? null,
    paid_at: row.paid_at ?? null,
    hold_reason: row.hold_reason ?? null,
    recovery_amount: toNumber(row.recovery_amount),
    batch_reference: row.batch_reference ?? null,
    payout_batch_scheduled_for: row.payout_batch_scheduled_for ?? null,
  }
}

function mapBatch(row: any): OperatorPayoutBatch {
  return {
    id: row.id,
    batch_reference: row.batch_reference,
    scheduled_for: row.scheduled_for,
    status: row.status,
    total_gross_amount: toNumber(row.total_gross_amount),
    total_commission_amount: toNumber(row.total_commission_amount),
    total_operator_payable: toNumber(row.total_operator_payable),
    created_at: row.created_at,
  }
}

function mapBatchActionResult(row: any): PayoutBatchActionResult {
  return {
    batch_id: row.batch_id,
    batch_reference: row.batch_reference,
    previous_status: row.previous_status ?? undefined,
    items_reversed: row.items_reversed === undefined ? undefined : toNumber(row.items_reversed),
    recovery_items: row.recovery_items === undefined ? undefined : toNumber(row.recovery_items),
    total_recovery_amount: row.total_recovery_amount === undefined ? undefined : toNumber(row.total_recovery_amount),
    items_paid: row.items_paid === undefined ? undefined : toNumber(row.items_paid),
    total_operator_payable: row.total_operator_payable === undefined ? undefined : toNumber(row.total_operator_payable),
    paid_at: row.paid_at ?? null,
  }
}

function mapRecoveryResult(row: any): PayoutRecoveryResult {
  return {
    payout_item_id: row.payout_item_id,
    booking_id: row.booking_id,
    payout_status: row.payout_status,
    recovered_amount: toNumber(row.recovered_amount),
    remaining_recovery_amount: toNumber(row.remaining_recovery_amount),
  }
}

function mapSummary(row: any): AdminFinanceSummary {
  return {
    total_customer_payments_collected: toNumber(row.total_customer_payments_collected),
    total_commission_earned: toNumber(row.total_commission_earned),
    total_membership_fees_charged: toNumber(row.total_membership_fees_charged),
    total_membership_fees_waived_adjusted: toNumber(row.total_membership_fees_waived_adjusted),
    total_operator_payouts: toNumber(row.total_operator_payouts),
    total_held_amounts: toNumber(row.total_held_amounts),
    total_refunds: toNumber(row.total_refunds),
    total_recovery_pending: toNumber(row.total_recovery_pending),
    total_chargebacks_disputes: toNumber(row.total_chargebacks_disputes),
  }
}

function mapTierReportRow(row: any): MembershipTierReportRow {
  return {
    membership_tier_code: row.membership_tier_code,
    display_name: row.display_name,
    operators_count: toNumber(row.operators_count),
    average_gmv: toNumber(row.average_gmv),
    average_payout: toNumber(row.average_payout),
    average_ai_usage: toNumber(row.average_ai_usage),
    average_pickup_usage: toNumber(row.average_pickup_usage),
    average_map_usage: toNumber(row.average_map_usage),
  }
}

export const commercialService = {
  async getOperatorCommercialOverview(operatorUserId: string): Promise<{
    profile: OperatorCommercialProfile | null
    tier: CommercialTierConfig | null
    performance: OperatorPerformanceReport | null
    billingRows: OperatorBillingReportRow[]
    payoutRows: OperatorPayoutReportRow[]
    payoutBatches: OperatorPayoutBatch[]
  }> {
    const [profileResult, performanceResult, billingResult, payoutResult, batchesResult] = await Promise.all([
      (supabase.from('operator_commercial_profiles' as any) as any)
        .select(`
          operator_user_id,
          operational_status,
          kyc_status,
          membership_tier_code,
          membership_status,
          commission_rate,
          monthly_membership_fee,
          current_cycle_start,
          current_cycle_end,
          next_billing_date,
          payout_hold,
          payout_hold_reason,
          monthly_published_tours_count,
          ai_credits_used_current_cycle,
          feature_overrides,
          tour_operator_profiles(
            company_name,
            primary_city,
            contact_person,
            account_status
          )
        `)
        .eq('operator_user_id', operatorUserId)
        .maybeSingle(),
      (supabase.from('operator_performance_report_v' as any) as any)
        .select('*')
        .eq('operator_user_id', operatorUserId)
        .maybeSingle(),
      (supabase.from('operator_billing_report_v' as any) as any)
        .select('*')
        .eq('operator_user_id', operatorUserId)
        .order('cycle_start', { ascending: false }),
      (supabase.from('operator_payout_report_v' as any) as any)
        .select('*')
        .eq('operator_user_id', operatorUserId)
        .order('payout_due_at', { ascending: false, nullsFirst: false }),
      (supabase.from('operator_payout_batches' as any) as any)
        .select(`
          id,
          batch_reference,
          scheduled_for,
          status,
          total_gross_amount,
          total_commission_amount,
          total_operator_payable,
          created_at
        `)
        .order('scheduled_for', { ascending: false })
        .limit(10),
    ])

    if (profileResult.error) throw profileResult.error
    if (performanceResult.error) throw performanceResult.error
    if (billingResult.error) throw billingResult.error
    if (payoutResult.error) throw payoutResult.error
    if (batchesResult.error) throw batchesResult.error

    const profile = profileResult.data ? mapProfile(profileResult.data) : null
    let tier: CommercialTierConfig | null = null

    if (profile?.membership_tier_code) {
      const { data, error } = await (supabase.from('commercial_membership_tiers' as any) as any)
        .select('*')
        .eq('code', profile.membership_tier_code)
        .maybeSingle()

      if (error) throw error
      tier = data
        ? {
            code: data.code,
            display_name: data.display_name,
            monthly_fee: toNumber(data.monthly_fee),
            commission_rate: toNumber(data.commission_rate),
            minimum_deposit_percent: toNumber(data.minimum_deposit_percent),
            monthly_publish_limit: toNumber(data.monthly_publish_limit),
            pickup_multi_city_enabled: Boolean(data.pickup_multi_city_enabled),
            google_maps_enabled: Boolean(data.google_maps_enabled),
            ai_itinerary_enabled: Boolean(data.ai_itinerary_enabled),
            ai_monthly_credits: toNumber(data.ai_monthly_credits),
          }
        : null
    }

    return {
      profile,
      tier,
      performance: performanceResult.data ? mapPerformance(performanceResult.data) : null,
      billingRows: (billingResult.data ?? []).map(mapBillingRow),
      payoutRows: (payoutResult.data ?? []).map(mapPayoutRow),
      payoutBatches: (batchesResult.data ?? []).map(mapBatch),
    }
  },

  async getAdminCommercialOverview(): Promise<{
    financeSummary: AdminFinanceSummary | null
    tierReportRows: MembershipTierReportRow[]
    operatorProfiles: OperatorCommercialProfile[]
    billingRows: OperatorBillingReportRow[]
    payoutRows: OperatorPayoutReportRow[]
    payoutBatches: OperatorPayoutBatch[]
  }> {
    const [summaryResult, tierReportResult, profileResult, billingResult, payoutResult, batchResult] = await Promise.all([
      (supabase.from('admin_finance_summary_v' as any) as any).select('*').maybeSingle(),
      (supabase.from('membership_tier_report_v' as any) as any).select('*').order('display_name', { ascending: true }),
      (supabase.from('operator_commercial_profiles' as any) as any)
        .select(`
          operator_user_id,
          operational_status,
          kyc_status,
          membership_tier_code,
          membership_status,
          commission_rate,
          monthly_membership_fee,
          current_cycle_start,
          current_cycle_end,
          next_billing_date,
          payout_hold,
          payout_hold_reason,
          monthly_published_tours_count,
          ai_credits_used_current_cycle,
          feature_overrides,
          tour_operator_profiles(
            company_name,
            primary_city,
            contact_person,
            account_status
          )
        `)
        .order('created_at', { ascending: false }),
      (supabase.from('operator_billing_report_v' as any) as any)
        .select('*')
        .order('cycle_start', { ascending: false })
        .limit(50),
      (supabase.from('operator_payout_report_v' as any) as any)
        .select('*')
        .order('payout_due_at', { ascending: false, nullsFirst: false })
        .limit(100),
      (supabase.from('operator_payout_batches' as any) as any)
        .select(`
          id,
          batch_reference,
          scheduled_for,
          status,
          total_gross_amount,
          total_commission_amount,
          total_operator_payable,
          created_at
        `)
        .order('scheduled_for', { ascending: false })
        .limit(25),
    ])

    if (summaryResult.error) throw summaryResult.error
    if (tierReportResult.error) throw tierReportResult.error
    if (profileResult.error) throw profileResult.error
    if (billingResult.error) throw billingResult.error
    if (payoutResult.error) throw payoutResult.error
    if (batchResult.error) throw batchResult.error

    return {
      financeSummary: summaryResult.data ? mapSummary(summaryResult.data) : null,
      tierReportRows: (tierReportResult.data ?? []).map(mapTierReportRow),
      operatorProfiles: (profileResult.data ?? []).map(mapProfile),
      billingRows: (billingResult.data ?? []).map(mapBillingRow),
      payoutRows: (payoutResult.data ?? []).map(mapPayoutRow),
      payoutBatches: (batchResult.data ?? []).map(mapBatch),
    }
  },

  async assignOperatorTier(operatorUserId: string, tierCode: MembershipTierCode, reason: string) {
    const { data, error } = await supabase.rpc('admin_assign_operator_membership_tier' as any, {
      p_operator_user_id: operatorUserId,
      p_membership_tier_code: tierCode,
      p_reason: reason.trim() || null,
    })

    if (error) throw error
    return data
  },

  async closeBillingCycle(operatorUserId: string, cycleEndDate?: string) {
    const { data, error } = await supabase.rpc('admin_close_operator_billing_cycle' as any, {
      p_operator_user_id: operatorUserId,
      p_cycle_end_date: cycleEndDate ?? new Date().toISOString().slice(0, 10),
    })

    if (error) throw error
    return data
  },

  async updateOperatorPayoutHold(operatorUserId: string, payoutHold: boolean, payoutHoldReason?: string) {
    const { data, error } = await (supabase.from('operator_commercial_profiles' as any) as any)
      .update({
        payout_hold: payoutHold,
        payout_hold_reason: payoutHold ? payoutHoldReason?.trim() || 'Finance hold applied by admin' : null,
      })
      .eq('operator_user_id', operatorUserId)
      .select('operator_user_id')
      .single()

    if (error) throw error
    return data
  },

  async schedulePayoutBatch(scheduledFor?: string) {
    const { data, error } = await supabase.rpc('create_operator_payout_batch' as any, {
      p_scheduled_for: scheduledFor ?? new Date().toISOString(),
    })

    if (error) throw error
    return Array.isArray(data) ? data[0] ?? null : data ?? null
  },

  async markPayoutBatchPaid(batchId: string) {
    const { data, error } = await supabase.rpc('mark_operator_payout_batch_paid' as any, {
      p_batch_id: batchId,
    })

    if (error) throw error
    return data ? mapBatchActionResult(Array.isArray(data) ? data[0] ?? null : data ?? null) : null
  },

  async reversePayoutBatch(batchId: string, reason?: string) {
    const { data, error } = await supabase.rpc('reverse_operator_payout_batch' as any, {
      p_batch_id: batchId,
      p_reason: reason?.trim() || null,
    })

    if (error) throw error
    return data ? mapBatchActionResult(Array.isArray(data) ? data[0] ?? null : data ?? null) : null
  },

  async resolvePayoutRecovery(payoutItemId: string, recoveredAmount?: number, reason?: string) {
    const { data, error } = await supabase.rpc('resolve_operator_payout_recovery' as any, {
      p_payout_item_id: payoutItemId,
      p_recovered_amount: recoveredAmount ?? null,
      p_reason: reason?.trim() || null,
    })

    if (error) throw error
    return data ? mapRecoveryResult(Array.isArray(data) ? data[0] ?? null : data ?? null) : null
  },
}