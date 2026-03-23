import {
  buildBookingFinanceSnapshot,
  calculateCommissionAmount,
  calculateCommissionCollection,
  calculateMembershipAdjustment,
  calculateNextBusinessDay,
  calculatePayoutReleaseDate,
  evaluateOperatorCancellationPenalty,
  canPublishAnotherTrip,
  getMinimumDepositForTier,
  resolveFeatureGate,
  validateDepositPolicyForTier,
} from '@tripavail/shared/commercial/engine'
import { describe, expect, it } from 'vitest'

describe('commercial engine', () => {
  it('calculates commission by tier examples', () => {
    expect(calculateCommissionAmount(100000, 20)).toBe(20000)
    expect(calculateCommissionAmount(100000, 13)).toBe(13000)
    expect(calculateCommissionAmount(100000, 10)).toBe(10000)
  })

  it('calculates membership adjustment with full waiver', () => {
    expect(
      calculateMembershipAdjustment({
        membershipFee: 30000,
        priorCycleCommissionCredit: 35000,
      }),
    ).toEqual({
      membershipFee: 30000,
      priorCycleCommissionCredit: 35000,
      adjustmentApplied: 30000,
      finalMembershipCharge: 0,
    })
  })

  it('calculates membership adjustment with partial credit', () => {
    expect(
      calculateMembershipAdjustment({
        membershipFee: 30000,
        priorCycleCommissionCredit: 5000,
      }),
    ).toEqual({
      membershipFee: 30000,
      priorCycleCommissionCredit: 5000,
      adjustmentApplied: 5000,
      finalMembershipCharge: 25000,
    })
  })

  it('builds booking finance snapshot using tier commission', () => {
    expect(
      buildBookingFinanceSnapshot({
        bookingTotal: 100000,
        paymentCollected: 100000,
        commissionRate: 13,
        membershipTier: 'diamond',
      }),
    ).toEqual({
      membershipTier: 'diamond',
      bookingTotal: 100000,
      paymentCollected: 100000,
      refundAmount: 0,
      depositRequired: false,
      depositPercentage: 0,
      depositUpfrontAmount: 100000,
      depositRemainingAmount: 0,
      commissionRate: 13,
      commissionAmount: 13000,
      commissionTotal: 13000,
      commissionCollected: 13000,
      commissionRemaining: 0,
      operatorReceivableEstimate: 87000,
    })
  })

  it('splits commission between collected and remaining amounts for deposit bookings', () => {
    expect(
      calculateCommissionCollection({
        bookingTotal: 50000,
        paymentCollected: 10000,
        commissionRate: 20,
      }),
    ).toEqual({
      commissionTotal: 10000,
      commissionCollected: 10000,
      commissionRemaining: 0,
      collectedBasisAmount: 10000,
    })
  })

  it('lets platform-funded promo discounts reduce retained commission before operator payable', () => {
    expect(
      buildBookingFinanceSnapshot({
        bookingTotal: 80000,
        paymentCollected: 80000,
        commissionRate: 20,
        membershipTier: 'gold',
        promoFundingSource: 'platform',
        promoDiscountValue: 10000,
      }),
    ).toMatchObject({
      bookingTotal: 80000,
      commissionRate: 20,
      commissionAmount: 6000,
      commissionTotal: 6000,
      commissionCollected: 6000,
      commissionRemaining: 0,
      operatorReceivableEstimate: 74000,
    })
  })

  it('keeps operator-funded promo discounts on the operator side of the booking math', () => {
    expect(
      buildBookingFinanceSnapshot({
        bookingTotal: 80000,
        paymentCollected: 80000,
        commissionRate: 20,
        membershipTier: 'gold',
        promoFundingSource: 'operator',
        promoDiscountValue: 10000,
      }),
    ).toMatchObject({
      bookingTotal: 80000,
      commissionRate: 20,
      commissionAmount: 16000,
      commissionTotal: 16000,
      commissionCollected: 16000,
      commissionRemaining: 0,
      operatorReceivableEstimate: 64000,
    })
  })

  it('caps collected commission at total commission when deposit exceeds the fee due', () => {
    expect(
      calculateCommissionCollection({
        bookingTotal: 100000,
        paymentCollected: 20000,
        commissionRate: 13,
      }),
    ).toEqual({
      commissionTotal: 13000,
      commissionCollected: 13000,
      commissionRemaining: 0,
      collectedBasisAmount: 20000,
    })
  })

  it('tracks tier minimum deposit floors', () => {
    expect(getMinimumDepositForTier('gold')).toBe(20)
    expect(getMinimumDepositForTier('diamond')).toBe(15)
    expect(getMinimumDepositForTier('platinum')).toBe(10)
  })

  it('rejects deposit percentages below the tier minimum', () => {
    expect(validateDepositPolicyForTier('gold', true, 10)).toEqual({
      allowed: false,
      minimumDepositPercent: 20,
      reason: 'Deposit must be at least 20% for Gold membership. Upgrade tiers or increase the deposit percentage.',
    })

    expect(validateDepositPolicyForTier('diamond', true, 15)).toEqual({
      allowed: true,
      minimumDepositPercent: 15,
      reason: null,
    })
  })

  it('captures deposit-specific booking snapshot fields', () => {
    expect(
      buildBookingFinanceSnapshot({
        bookingTotal: 50000,
        paymentCollected: 10000,
        commissionRate: 20,
        membershipTier: 'gold',
        depositRequired: true,
        depositPercentage: 20,
        depositUpfrontAmount: 10000,
        depositRemainingAmount: 40000,
      }),
    ).toMatchObject({
      depositRequired: true,
      depositPercentage: 20,
      depositUpfrontAmount: 10000,
      depositRemainingAmount: 40000,
      paymentCollected: 10000,
      commissionTotal: 10000,
      commissionCollected: 10000,
      commissionRemaining: 0,
    })
  })

  it('activates operator cancellation penalties at the threshold', () => {
    expect(
      evaluateOperatorCancellationPenalty({
        recentOperatorFaultCancellations: 3,
      }),
    ).toEqual({
      recentOperatorFaultCancellations: 3,
      threshold: 3,
      windowDays: 30,
      penaltyActive: true,
      restrictOperator: true,
      applyPayoutHold: true,
      reason: '3 operator-fault cancellations in 30 days reached the safeguard threshold of 3',
    })
  })

  it('blocks Gold-only locked premium features', () => {
    expect(resolveFeatureGate('gold', 'google_maps')).toEqual({
      allowed: false,
      reason: 'Gold tier does not include Google Maps support',
    })
    expect(resolveFeatureGate('diamond', 'google_maps')).toEqual({
      allowed: true,
      reason: null,
    })
  })

  it('enforces publish limits by tier', () => {
    expect(canPublishAnotherTrip('gold', 4)).toEqual({ allowed: true, reason: null })
    expect(canPublishAnotherTrip('gold', 5)).toEqual({
      allowed: false,
      reason: 'Gold tier publish limit reached for this cycle',
    })
  })

  it('moves payouts to next business day', () => {
    const friday = new Date('2026-03-13T18:00:00.000Z')
    const nextBusinessDay = calculateNextBusinessDay(friday)

    expect(nextBusinessDay.toISOString()).toBe('2026-03-16T18:00:00.000Z')
    expect(calculatePayoutReleaseDate(friday).toISOString()).toBe('2026-03-16T18:00:00.000Z')
  })
})