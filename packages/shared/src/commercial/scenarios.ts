import {
  buildBookingFinanceSnapshot,
  canPublishAnotherTrip,
  getMembershipTierConfig,
  type MembershipTierCode,
} from './engine'

export type PublishLimitTransitionType = 'publish' | 'unpublish' | 'edit_published' | 'edit_draft'

export interface PublishLimitTransition {
  type: PublishLimitTransitionType
  label?: string
}

export interface PublishLimitTransitionResult {
  transition: PublishLimitTransitionType
  label: string
  allowed: boolean
  publishedCount: number
  remainingSlots: number
}

export interface PublishLimitScenarioResult {
  tier: MembershipTierCode
  limit: number
  finalPublishedCount: number
  steps: PublishLimitTransitionResult[]
}

export interface PayoutScenarioBookingInput {
  bookingId: string
  bookingTotal: number
  priceBeforePromo?: number
  membershipTier: MembershipTierCode
  commissionRateSnapshot?: number
  promoFundingSource?: 'operator' | 'platform' | null
  promoDiscountValue?: number
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentSettled: boolean
  scheduleEnded: boolean
  refundAmount?: number
  chargebackOpen?: boolean
  operatorKycApproved?: boolean
  payoutHold?: boolean
  alreadyScheduledOrPaid?: boolean
}

export interface PayoutScenarioBookingResult {
  bookingId: string
  commissionRate: number
  commissionAmount: number
  commissionTotal: number
  commissionCollected: number
  commissionRemaining: number
  operatorPayableAmount: number
  settlementState:
    | 'draft'
    | 'pending_payment'
    | 'paid_pending_service'
    | 'completed_pending_payout'
    | 'eligible_for_payout'
    | 'paid_out'
    | 'cancelled_by_operator'
    | 'refunded'
    | 'payout_on_hold'
    | 'chargeback_open'
  payoutStatus: 'not_ready' | 'eligible' | 'scheduled' | 'paid' | 'on_hold'
}

export interface PayoutScenarioResult {
  threshold: number
  thresholdMet: boolean
  eligibleBalance: number
  carryForwardBalance: number
  bookings: PayoutScenarioBookingResult[]
}

function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

export function simulatePublishLimitTransitions(input: {
  tier: MembershipTierCode
  initialPublishedCount?: number
  transitions: PublishLimitTransition[]
}): PublishLimitScenarioResult {
  const limit = getMembershipTierConfig(input.tier).monthlyPublishLimit
  let publishedCount = Math.max(0, input.initialPublishedCount ?? 0)

  const steps = input.transitions.map((transition, index) => {
    if (transition.type === 'publish') {
      const gate = canPublishAnotherTrip(input.tier, publishedCount)
      if (gate.allowed) {
        publishedCount += 1
      }

      return {
        transition: transition.type,
        label: transition.label ?? `Step ${index + 1}`,
        allowed: gate.allowed,
        publishedCount,
        remainingSlots: Math.max(0, limit - publishedCount),
      }
    }

    if (transition.type === 'unpublish') {
      publishedCount = Math.max(0, publishedCount - 1)
    }

    return {
      transition: transition.type,
      label: transition.label ?? `Step ${index + 1}`,
      allowed: true,
      publishedCount,
      remainingSlots: Math.max(0, limit - publishedCount),
    }
  })

  return {
    tier: input.tier,
    limit,
    finalPublishedCount: publishedCount,
    steps,
  }
}

export function evaluatePayoutScenario(input: {
  threshold?: number
  bookings: PayoutScenarioBookingInput[]
}): PayoutScenarioResult {
  const threshold = normalizeMoney(Math.max(0, input.threshold ?? 5000))

  const bookingsWithAmounts = input.bookings.map((booking) => {
    const commissionRate = booking.commissionRateSnapshot ?? getMembershipTierConfig(booking.membershipTier).commissionRate
    const snapshot = buildBookingFinanceSnapshot({
      bookingTotal: booking.bookingTotal,
      priceBeforePromo: booking.priceBeforePromo,
      commissionRate,
      refundAmount: booking.refundAmount ?? 0,
      promoFundingSource: booking.promoFundingSource ?? null,
      promoDiscountValue: booking.promoDiscountValue ?? 0,
      membershipTier: booking.membershipTier,
    })

    const canJoinThresholdPool =
      booking.bookingStatus === 'completed' &&
      booking.paymentSettled &&
      booking.scheduleEnded &&
      !booking.chargebackOpen &&
      (booking.refundAmount ?? 0) === 0 &&
      !booking.payoutHold &&
      Boolean(booking.operatorKycApproved) &&
      !booking.alreadyScheduledOrPaid

    return {
      booking,
      snapshot,
      canJoinThresholdPool,
    }
  })

  const eligibleBalance = normalizeMoney(
    bookingsWithAmounts.reduce((sum, row) => {
      if (!row.canJoinThresholdPool) return sum
      return sum + row.snapshot.operatorReceivableEstimate
    }, 0),
  )
  const thresholdMet = eligibleBalance >= threshold

  const bookings = bookingsWithAmounts.map(({ booking, snapshot }): PayoutScenarioBookingResult => {
    if (booking.bookingStatus === 'cancelled' && (booking.refundAmount ?? 0) > 0) {
      return {
        bookingId: booking.bookingId,
        commissionRate: snapshot.commissionRate,
        commissionAmount: snapshot.commissionAmount,
        commissionTotal: snapshot.commissionTotal,
        commissionCollected: snapshot.commissionCollected,
        commissionRemaining: snapshot.commissionRemaining,
        operatorPayableAmount: 0,
        settlementState: 'refunded',
        payoutStatus: 'not_ready',
      }
    }

    if (booking.bookingStatus === 'cancelled') {
      return {
        bookingId: booking.bookingId,
        commissionRate: snapshot.commissionRate,
        commissionAmount: snapshot.commissionAmount,
        commissionTotal: snapshot.commissionTotal,
        commissionCollected: snapshot.commissionCollected,
        commissionRemaining: snapshot.commissionRemaining,
        operatorPayableAmount: 0,
        settlementState: 'cancelled_by_operator',
        payoutStatus: 'not_ready',
      }
    }

    if (booking.chargebackOpen) {
      return {
        bookingId: booking.bookingId,
        commissionRate: snapshot.commissionRate,
        commissionAmount: snapshot.commissionAmount,
        commissionTotal: snapshot.commissionTotal,
        commissionCollected: snapshot.commissionCollected,
        commissionRemaining: snapshot.commissionRemaining,
        operatorPayableAmount: 0,
        settlementState: 'chargeback_open',
        payoutStatus: 'on_hold',
      }
    }

    if (!booking.paymentSettled) {
      return {
        bookingId: booking.bookingId,
        commissionRate: snapshot.commissionRate,
        commissionAmount: snapshot.commissionAmount,
        commissionTotal: snapshot.commissionTotal,
        commissionCollected: snapshot.commissionCollected,
        commissionRemaining: snapshot.commissionRemaining,
        operatorPayableAmount: snapshot.operatorReceivableEstimate,
        settlementState: booking.bookingStatus === 'completed' ? 'completed_pending_payout' : 'pending_payment',
        payoutStatus: 'not_ready',
      }
    }

    if (!booking.scheduleEnded || booking.bookingStatus !== 'completed') {
      return {
        bookingId: booking.bookingId,
        commissionRate: snapshot.commissionRate,
        commissionAmount: snapshot.commissionAmount,
        commissionTotal: snapshot.commissionTotal,
        commissionCollected: snapshot.commissionCollected,
        commissionRemaining: snapshot.commissionRemaining,
        operatorPayableAmount: snapshot.operatorReceivableEstimate,
        settlementState: booking.bookingStatus === 'confirmed' ? 'paid_pending_service' : 'completed_pending_payout',
        payoutStatus: 'not_ready',
      }
    }

    if ((booking.refundAmount ?? 0) > 0) {
      return {
        bookingId: booking.bookingId,
        commissionRate: snapshot.commissionRate,
        commissionAmount: snapshot.commissionAmount,
        commissionTotal: snapshot.commissionTotal,
        commissionCollected: snapshot.commissionCollected,
        commissionRemaining: snapshot.commissionRemaining,
        operatorPayableAmount: normalizeMoney(snapshot.operatorReceivableEstimate),
        settlementState: 'refunded',
        payoutStatus: 'not_ready',
      }
    }

    if (booking.payoutHold) {
      return {
        bookingId: booking.bookingId,
        commissionRate: snapshot.commissionRate,
        commissionAmount: snapshot.commissionAmount,
        commissionTotal: snapshot.commissionTotal,
        commissionCollected: snapshot.commissionCollected,
        commissionRemaining: snapshot.commissionRemaining,
        operatorPayableAmount: snapshot.operatorReceivableEstimate,
        settlementState: 'payout_on_hold',
        payoutStatus: 'on_hold',
      }
    }

    if (!booking.operatorKycApproved || booking.alreadyScheduledOrPaid || !thresholdMet) {
      return {
        bookingId: booking.bookingId,
        commissionRate: snapshot.commissionRate,
        commissionAmount: snapshot.commissionAmount,
        commissionTotal: snapshot.commissionTotal,
        commissionCollected: snapshot.commissionCollected,
        commissionRemaining: snapshot.commissionRemaining,
        operatorPayableAmount: snapshot.operatorReceivableEstimate,
        settlementState: 'completed_pending_payout',
        payoutStatus: 'not_ready',
      }
    }

    return {
      bookingId: booking.bookingId,
      commissionRate: snapshot.commissionRate,
      commissionAmount: snapshot.commissionAmount,
      commissionTotal: snapshot.commissionTotal,
      commissionCollected: snapshot.commissionCollected,
      commissionRemaining: snapshot.commissionRemaining,
      operatorPayableAmount: snapshot.operatorReceivableEstimate,
      settlementState: 'eligible_for_payout',
      payoutStatus: 'eligible',
    }
  })

  return {
    threshold,
    thresholdMet,
    eligibleBalance,
    carryForwardBalance: thresholdMet ? 0 : eligibleBalance,
    bookings,
  }
}
