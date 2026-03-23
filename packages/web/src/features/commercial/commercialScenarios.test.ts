import { buildBookingFinanceSnapshot, getMembershipTierConfig } from '@tripavail/shared/commercial/engine'
import {
  evaluatePayoutScenario,
  simulatePublishLimitTransitions,
  type PayoutScenarioBookingResult,
  type PublishLimitTransitionResult,
} from '@tripavail/shared/commercial/scenarios'
import { describe, expect, it } from 'vitest'

describe('commercial scenario coverage', () => {
  it('tracks publish-limit transitions without charging published edits twice', () => {
    const result = simulatePublishLimitTransitions({
      tier: 'gold',
      initialPublishedCount: 4,
      transitions: [
        { type: 'publish', label: 'publish fifth trip' },
        { type: 'edit_published', label: 'edit live trip copy' },
        { type: 'publish', label: 'attempt sixth trip' },
        { type: 'unpublish', label: 'take one trip down' },
        { type: 'publish', label: 'republish after freeing slot' },
      ],
    })

    expect(result.limit).toBe(5)
    expect(result.steps.map((step: PublishLimitTransitionResult) => step.allowed)).toEqual([true, true, false, true, true])
    expect(result.steps.map((step: PublishLimitTransitionResult) => step.publishedCount)).toEqual([5, 5, 5, 4, 5])
    expect(result.finalPublishedCount).toBe(5)
  })

  it('carries payout threshold forward until the operator balance crosses the minimum', () => {
    const belowThreshold = evaluatePayoutScenario({
      threshold: 5000,
      bookings: [
        {
          bookingId: 'booking-a',
          bookingTotal: 5000,
          membershipTier: 'gold',
          bookingStatus: 'completed',
          paymentSettled: true,
          scheduleEnded: true,
          operatorKycApproved: true,
        },
      ],
    })

    expect(belowThreshold.eligibleBalance).toBe(4000)
    expect(belowThreshold.thresholdMet).toBe(false)
    expect(belowThreshold.carryForwardBalance).toBe(4000)
    expect(belowThreshold.bookings[0].payoutStatus).toBe('not_ready')

    const thresholdMet = evaluatePayoutScenario({
      threshold: 5000,
      bookings: [
        {
          bookingId: 'booking-a',
          bookingTotal: 5000,
          membershipTier: 'gold',
          bookingStatus: 'completed',
          paymentSettled: true,
          scheduleEnded: true,
          operatorKycApproved: true,
        },
        {
          bookingId: 'booking-b',
          bookingTotal: 1875,
          membershipTier: 'gold',
          bookingStatus: 'completed',
          paymentSettled: true,
          scheduleEnded: true,
          operatorKycApproved: true,
        },
      ],
    })

    expect(thresholdMet.eligibleBalance).toBe(5500)
    expect(thresholdMet.thresholdMet).toBe(true)
    expect(thresholdMet.carryForwardBalance).toBe(0)
    expect(thresholdMet.bookings.map((booking: PayoutScenarioBookingResult) => booking.payoutStatus)).toEqual(['eligible', 'eligible'])
  })

  it('keeps refunded bookings out of payout eligibility', () => {
    const result = evaluatePayoutScenario({
      bookings: [
        {
          bookingId: 'refund-booking',
          bookingTotal: 100000,
          membershipTier: 'diamond',
          bookingStatus: 'completed',
          paymentSettled: true,
          scheduleEnded: true,
          refundAmount: 100000,
          operatorKycApproved: true,
        },
      ],
    })

    expect(result.thresholdMet).toBe(false)
    expect(result.bookings[0]).toMatchObject({
      settlementState: 'refunded',
      payoutStatus: 'not_ready',
      operatorPayableAmount: 0,
    })
  })

  it('keeps cancelled bookings out of payout batches', () => {
    const result = evaluatePayoutScenario({
      bookings: [
        {
          bookingId: 'cancelled-booking',
          bookingTotal: 30000,
          membershipTier: 'gold',
          bookingStatus: 'cancelled',
          paymentSettled: false,
          scheduleEnded: false,
          operatorKycApproved: true,
        },
      ],
    })

    expect(result.bookings[0]).toMatchObject({
      settlementState: 'cancelled_by_operator',
      payoutStatus: 'not_ready',
      operatorPayableAmount: 0,
    })
  })

  it('preserves historical Gold commission snapshots after an operator upgrades to Diamond', () => {
    const goldRate = getMembershipTierConfig('gold').commissionRate
    const diamondRate = getMembershipTierConfig('diamond').commissionRate

    const goldSnapshot = buildBookingFinanceSnapshot({
      bookingTotal: 100000,
      commissionRate: goldRate,
      membershipTier: 'gold',
    })
    const diamondSnapshot = buildBookingFinanceSnapshot({
      bookingTotal: 100000,
      commissionRate: diamondRate,
      membershipTier: 'diamond',
    })

    expect(goldSnapshot.commissionRate).toBe(20)
    expect(goldSnapshot.commissionAmount).toBe(20000)
    expect(goldSnapshot.operatorReceivableEstimate).toBe(80000)

    expect(diamondSnapshot.commissionRate).toBe(13)
    expect(diamondSnapshot.commissionAmount).toBe(13000)
    expect(diamondSnapshot.operatorReceivableEstimate).toBe(87000)

    expect(goldSnapshot.commissionAmount).not.toBe(diamondSnapshot.commissionAmount)
  })

  it('keeps operator-funded promo discounts on the operator receivable side of payout scenarios', () => {
    const result = evaluatePayoutScenario({
      threshold: 5000,
      bookings: [
        {
          bookingId: 'operator-funded-promo',
          bookingTotal: 80000,
          membershipTier: 'gold',
          bookingStatus: 'completed',
          paymentSettled: true,
          scheduleEnded: true,
          operatorKycApproved: true,
          promoFundingSource: 'operator',
          promoDiscountValue: 10000,
        },
      ],
    })

    expect(result.thresholdMet).toBe(true)
    expect(result.bookings[0]).toMatchObject({
      commissionTotal: 16000,
      operatorPayableAmount: 64000,
      settlementState: 'eligible_for_payout',
      payoutStatus: 'eligible',
    })
  })

  it('lets platform-funded promo discounts preserve more operator payable in payout scenarios', () => {
    const result = evaluatePayoutScenario({
      threshold: 5000,
      bookings: [
        {
          bookingId: 'platform-funded-promo',
          bookingTotal: 80000,
          membershipTier: 'gold',
          bookingStatus: 'completed',
          paymentSettled: true,
          scheduleEnded: true,
          operatorKycApproved: true,
          promoFundingSource: 'platform',
          promoDiscountValue: 10000,
        },
      ],
    })

    expect(result.thresholdMet).toBe(true)
    expect(result.bookings[0]).toMatchObject({
      commissionTotal: 6000,
      operatorPayableAmount: 74000,
      settlementState: 'eligible_for_payout',
      payoutStatus: 'eligible',
    })
  })

  it('keeps non-promo payout scenarios unchanged after promo support is added', () => {
    const result = evaluatePayoutScenario({
      threshold: 5000,
      bookings: [
        {
          bookingId: 'baseline-booking',
          bookingTotal: 100000,
          membershipTier: 'gold',
          bookingStatus: 'completed',
          paymentSettled: true,
          scheduleEnded: true,
          operatorKycApproved: true,
        },
      ],
    })

    expect(result.bookings[0]).toMatchObject({
      commissionTotal: 20000,
      operatorPayableAmount: 80000,
      settlementState: 'eligible_for_payout',
      payoutStatus: 'eligible',
    })
  })

  it('keeps refunded promo-applied bookings out of payout eligibility', () => {
    const result = evaluatePayoutScenario({
      bookings: [
        {
          bookingId: 'refunded-promo-booking',
          bookingTotal: 80000,
          membershipTier: 'gold',
          bookingStatus: 'completed',
          paymentSettled: true,
          scheduleEnded: true,
          refundAmount: 80000,
          operatorKycApproved: true,
          promoFundingSource: 'operator',
          promoDiscountValue: 10000,
        },
      ],
    })

    expect(result.thresholdMet).toBe(false)
    expect(result.bookings[0]).toMatchObject({
      settlementState: 'refunded',
      payoutStatus: 'not_ready',
      operatorPayableAmount: 0,
    })
  })
})