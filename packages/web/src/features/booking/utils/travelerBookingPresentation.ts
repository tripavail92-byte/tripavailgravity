export interface TravelerBookingPresentationInput {
  status?: string | null
  payment_status?: string | null
  total_price?: number | string | null
  amount_paid_online?: number | string | null
  upfront_amount?: number | string | null
  remaining_amount?: number | string | null
  promo_owner?: string | null
  promo_funding_source?: 'operator' | 'platform' | string | null
  promo_discount_value?: number | string | null
  price_before_promo?: number | string | null
  metadata?: Record<string, unknown> | null
}

export type TravelerBookingOutcomeTone = 'success' | 'warning' | 'neutral'

export interface TravelerBookingOutcomeSummary {
  kind: 'confirmed' | 'deposit_pending' | 'payment_processing' | 'refunded' | 'cancelled'
  title: string
  message: string
  tone: TravelerBookingOutcomeTone
}

export interface TravelerBookingSettlementState {
  totalAmount: number
  paidOnline: number
  remainingAmount: number
  promoDiscountValue: number
  priceBeforePromo: number
  refundAmount: number
  refundReason: string | null
  refundTimestamp: string | null
  promoOwner: string | null
  promoFundingSource: 'operator' | 'platform' | null
  hasPromo: boolean
  isDeposit: boolean
  isRefunded: boolean
  isPartiallyRefunded: boolean
  isCancelled: boolean
  isPaymentProcessing: boolean
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const normalized = Number(value)
    return Number.isFinite(normalized) ? normalized : 0
  }

  return 0
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getTravelerBookingSettlementState(
  booking: TravelerBookingPresentationInput | null | undefined,
): TravelerBookingSettlementState {
  const totalAmount = toNumber(booking?.total_price)
  const paidOnline = toNumber(booking?.amount_paid_online ?? booking?.upfront_amount ?? booking?.total_price)
  const remainingAmount = toNumber(booking?.remaining_amount)
  const promoDiscountValue = toNumber(booking?.promo_discount_value)
  const priceBeforePromo = toNumber(booking?.price_before_promo || booking?.total_price)
  const paymentStatus = booking?.payment_status ?? null
  const status = booking?.status ?? null
  const metadata = booking?.metadata ?? null

  const refundAmount = toNumber(
    metadata?.refund_amount
      ?? metadata?.['refund_amount']
      ?? ((paymentStatus === 'refunded' || paymentStatus === 'partially_refunded') ? paidOnline : 0),
  )

  const refundReason = toOptionalString(metadata?.refund_reason ?? metadata?.['refund_reason'])
  const refundTimestamp = toOptionalString(metadata?.refund_timestamp ?? metadata?.['refund_timestamp'])
  const promoOwner = toOptionalString(booking?.promo_owner)
  const promoFundingSource = booking?.promo_funding_source === 'platform'
    ? 'platform'
    : booking?.promo_funding_source === 'operator'
      ? 'operator'
      : null

  return {
    totalAmount,
    paidOnline,
    remainingAmount,
    promoDiscountValue,
    priceBeforePromo,
    refundAmount,
    refundReason,
    refundTimestamp,
    promoOwner,
    promoFundingSource,
    hasPromo: promoDiscountValue > 0,
    isDeposit: remainingAmount > 0,
    isRefunded: paymentStatus === 'refunded' || paymentStatus === 'partially_refunded',
    isPartiallyRefunded: paymentStatus === 'partially_refunded',
    isCancelled: status === 'cancelled',
    isPaymentProcessing: paymentStatus === 'processing' || status === 'pending',
  }
}

export function getTravelerBookingOutcomeSummary(
  state: TravelerBookingSettlementState,
): TravelerBookingOutcomeSummary {
  if (state.isCancelled) {
    return {
      kind: 'cancelled',
      title: 'Booking cancelled',
      message: state.refundAmount > 0
        ? 'This reservation was cancelled and the refund outcome is now attached to the booking record below.'
        : 'This reservation was cancelled. Use the booking workspace for operator communication and any refund follow-up.',
      tone: 'warning',
    }
  }

  if (state.isRefunded) {
    return {
      kind: 'refunded',
      title: state.isPartiallyRefunded ? 'Booking partially refunded' : 'Booking refunded',
      message: 'Your payment outcome changed after confirmation. Keep this receipt for your records and use the booking workspace for the latest refund context.',
      tone: 'warning',
    }
  }

  if (state.isPaymentProcessing) {
    return {
      kind: 'payment_processing',
      title: 'Payment processing',
      message: 'This reservation is still waiting for payment confirmation. Messaging and operator coordination unlock once payment clears.',
      tone: 'warning',
    }
  }

  if (state.isDeposit) {
    return {
      kind: 'deposit_pending',
      title: 'Deposit received',
      message: 'Your booking is confirmed with an online deposit. The remaining balance is due directly to the operator before departure.',
      tone: 'success',
    }
  }

  return {
    kind: 'confirmed',
    title: 'Booking confirmed',
    message: 'Your tour is booked and fully paid online. Keep this receipt for check-in and any future support requests.',
    tone: 'success',
  }
}
