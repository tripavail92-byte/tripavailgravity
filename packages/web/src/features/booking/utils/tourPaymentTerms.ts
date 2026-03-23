export interface TourPricingTierPreview {
  minPeople: number
  maxPeople: number
  pricePerPerson: number
  name: string
}

export interface TourPaymentTerms {
  effectiveUnitPrice: number
  totalAmount: number
  upfrontAmount: number
  remainingAmount: number
  upfrontPercentage: number
  activeTier: TourPricingTierPreview | null
  paymentCollectionMode: 'full_online' | 'partial_online'
  paymentPolicyText: string
}

export interface ResolvedTourPromotion {
  promotionId: string
  title: string
  code: string
  ownerLabel: string
  fundingSource: 'operator' | 'platform'
  discountType: 'fixed_amount' | 'percentage'
  discountValue: number
  appliedDiscountValue: number
  discountedBookingTotal: number
}

export type TourPromotionResolutionStatus =
  | 'valid'
  | 'invalid'
  | 'inactive'
  | 'expired'
  | 'not_started'
  | 'inapplicable'

export interface TourPromotionPreviewResult {
  status: TourPromotionResolutionStatus
  message: string
  promotion: ResolvedTourPromotion | null
}

export function getTourPromotionStatusMessage(
  status: TourPromotionResolutionStatus,
  promoCode?: string | null,
): string {
  const normalizedCode = promoCode?.trim().toUpperCase()

  switch (status) {
    case 'valid':
      return normalizedCode
        ? `${normalizedCode} applied successfully.`
        : 'Promo applied successfully.'
    case 'inactive':
      return normalizedCode
        ? `${normalizedCode} is currently inactive.`
        : 'This promo code is currently inactive.'
    case 'expired':
      return normalizedCode
        ? `${normalizedCode} has expired.`
        : 'This promo code has expired.'
    case 'not_started':
      return normalizedCode
        ? `${normalizedCode} is not active yet.`
        : 'This promo code is not active yet.'
    case 'inapplicable':
      return normalizedCode
        ? `${normalizedCode} is not valid for this trip.`
        : 'This promo code is not valid for this trip.'
    case 'invalid':
    default:
      return normalizedCode
        ? `${normalizedCode} is not a valid promo code.`
        : 'This promo code is not valid.'
  }
}

export function normalizeCurrencyAmount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.round(value * 100) / 100
}

export function clampDepositPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(50, Math.round(value)))
}

export function normalizeTourPricingTiers(pricingTiers: unknown): TourPricingTierPreview[] {
  if (!Array.isArray(pricingTiers)) {
    return []
  }

  return pricingTiers
    .map((tier: any) => ({
      minPeople: Number(tier?.minPeople || 0),
      maxPeople: Number(tier?.maxPeople || 0),
      pricePerPerson: normalizeCurrencyAmount(Number(tier?.pricePerPerson || 0)),
      name: String(tier?.name || ''),
    }))
    .filter((tier) => tier.minPeople > 0 && tier.pricePerPerson > 0)
}

export function getApplicableTourPricingTier(
  guestCount: number,
  pricingTiers: TourPricingTierPreview[],
): TourPricingTierPreview | null {
  const rangeMatchedTier = pricingTiers
    .filter((tier) => {
      const meetsMin = guestCount >= tier.minPeople
      const withinMax = tier.maxPeople > 0 ? guestCount <= tier.maxPeople : true
      return meetsMin && withinMax
    })
    .sort((a, b) => b.minPeople - a.minPeople)[0]

  const fallbackThresholdTier = pricingTiers
    .filter((tier) => guestCount >= tier.minPeople)
    .sort((a, b) => b.minPeople - a.minPeople)[0]

  return rangeMatchedTier || fallbackThresholdTier || null
}

export function getTourPaymentTerms(params: {
  basePrice: number
  guestCount: number
  pricingTiers?: unknown
  depositRequired?: boolean | null
  depositPercentage?: number | null
}): TourPaymentTerms {
  const guestCount = Math.max(1, Number(params.guestCount || 1))
  const basePrice = normalizeCurrencyAmount(Number(params.basePrice || 0))
  const pricingTiers = normalizeTourPricingTiers(params.pricingTiers)
  const activeTier = getApplicableTourPricingTier(guestCount, pricingTiers)
  const effectiveUnitPrice = activeTier?.pricePerPerson || basePrice
  const totalAmount = normalizeCurrencyAmount(effectiveUnitPrice * guestCount)
  const depositRequired = Boolean(params.depositRequired)
  const upfrontPercentage = depositRequired ? clampDepositPercentage(Number(params.depositPercentage || 0)) : 100
  const upfrontAmount = depositRequired
    ? normalizeCurrencyAmount((totalAmount * upfrontPercentage) / 100)
    : totalAmount
  const remainingAmount = normalizeCurrencyAmount(Math.max(0, totalAmount - upfrontAmount))
  const paymentCollectionMode = depositRequired && remainingAmount > 0 ? 'partial_online' : 'full_online'
  const paymentPolicyText = paymentCollectionMode === 'partial_online'
    ? `Pay ${upfrontPercentage}% now to confirm your booking. Remaining balance will be paid directly to the tour operator before departure.`
    : 'Full amount is charged online at the time of booking confirmation.'

  return {
    effectiveUnitPrice,
    totalAmount,
    upfrontAmount,
    remainingAmount,
    upfrontPercentage,
    activeTier,
    paymentCollectionMode,
    paymentPolicyText,
  }
}

export function buildTourPaymentTermsFromTotal(params: {
  totalAmount: number
  guestCount: number
  depositRequired?: boolean | null
  depositPercentage?: number | null
  activeTier?: TourPricingTierPreview | null
}): TourPaymentTerms {
  const guestCount = Math.max(1, Number(params.guestCount || 1))
  const totalAmount = normalizeCurrencyAmount(Number(params.totalAmount || 0))
  const depositRequired = Boolean(params.depositRequired)
  const upfrontPercentage = depositRequired ? clampDepositPercentage(Number(params.depositPercentage || 0)) : 100
  const upfrontAmount = depositRequired
    ? normalizeCurrencyAmount((totalAmount * upfrontPercentage) / 100)
    : totalAmount
  const remainingAmount = normalizeCurrencyAmount(Math.max(0, totalAmount - upfrontAmount))
  const paymentCollectionMode = depositRequired && remainingAmount > 0 ? 'partial_online' : 'full_online'
  const paymentPolicyText = paymentCollectionMode === 'partial_online'
    ? `Pay ${upfrontPercentage}% now to confirm your booking. Remaining balance will be paid directly to the tour operator before departure.`
    : 'Full amount is charged online at the time of booking confirmation.'

  return {
    effectiveUnitPrice: normalizeCurrencyAmount(totalAmount / guestCount),
    totalAmount,
    upfrontAmount,
    remainingAmount,
    upfrontPercentage,
    activeTier: params.activeTier ?? null,
    paymentCollectionMode,
    paymentPolicyText,
  }
}