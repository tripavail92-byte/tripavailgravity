import { describe, expect, it } from 'vitest'

import {
  getTravelerBookingOutcomeSummary,
  getTravelerBookingSettlementState,
} from './travelerBookingPresentation'

describe('travelerBookingPresentation', () => {
  it('normalizes deposit bookings with promo attribution', () => {
    const state = getTravelerBookingSettlementState({
      status: 'confirmed',
      payment_status: 'balance_pending',
      total_price: 2700,
      amount_paid_online: 900,
      remaining_amount: 1800,
      promo_owner: 'SPRING25',
      promo_funding_source: 'platform',
      promo_discount_value: 300,
      price_before_promo: 3000,
    })

    expect(state.hasPromo).toBe(true)
    expect(state.isDeposit).toBe(true)
    expect(state.promoOwner).toBe('SPRING25')
    expect(state.promoFundingSource).toBe('platform')
    expect(state.priceBeforePromo).toBe(3000)

    const outcome = getTravelerBookingOutcomeSummary(state)
    expect(outcome.kind).toBe('deposit_pending')
  })

  it('derives refund details from metadata and surfaces refunded outcome', () => {
    const state = getTravelerBookingSettlementState({
      status: 'confirmed',
      payment_status: 'partially_refunded',
      total_price: 3000,
      amount_paid_online: 3000,
      remaining_amount: 0,
      metadata: {
        refund_amount: '1200',
        refund_reason: 'Weather disruption',
        refund_timestamp: '2026-03-23T10:15:00.000Z',
      },
    })

    expect(state.isRefunded).toBe(true)
    expect(state.isPartiallyRefunded).toBe(true)
    expect(state.refundAmount).toBe(1200)
    expect(state.refundReason).toBe('Weather disruption')

    const outcome = getTravelerBookingOutcomeSummary(state)
    expect(outcome.kind).toBe('refunded')
    expect(outcome.title).toContain('partially refunded')
  })

  it('prioritizes cancelled outcome over deposit or payment state', () => {
    const state = getTravelerBookingSettlementState({
      status: 'cancelled',
      payment_status: 'refunded',
      total_price: 28000,
      amount_paid_online: 9520,
      remaining_amount: 18480,
      metadata: {
        refund_amount: 9520,
      },
    })

    const outcome = getTravelerBookingOutcomeSummary(state)
    expect(outcome.kind).toBe('cancelled')
    expect(outcome.tone).toBe('warning')
  })
})
