export type TourPricingPromoDraft = {
  enabled: boolean
  promotionId: string | null
  title: string
  code: string
  description: string
  discountType: 'fixed_amount' | 'percentage'
  discountValue: string
  maxDiscountValue: string
  isActive: boolean
}

export const DEFAULT_TOUR_PRICING_PROMO_DRAFT: TourPricingPromoDraft = {
  enabled: false,
  promotionId: null,
  title: '',
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountValue: '',
  isActive: true,
}

export function getTourPricingPromoDraft(draftData: Record<string, any> | null | undefined): TourPricingPromoDraft {
  const rawPromo = draftData && typeof draftData === 'object' ? draftData.pricing_promo : null

  if (!rawPromo || typeof rawPromo !== 'object') {
    return { ...DEFAULT_TOUR_PRICING_PROMO_DRAFT }
  }

  return {
    enabled: Boolean(rawPromo.enabled),
    promotionId:
      typeof rawPromo.promotionId === 'string' && rawPromo.promotionId.trim().length > 0
        ? rawPromo.promotionId.trim()
        : null,
    title: typeof rawPromo.title === 'string' ? rawPromo.title : '',
    code: typeof rawPromo.code === 'string' ? rawPromo.code.toUpperCase() : '',
    description: typeof rawPromo.description === 'string' ? rawPromo.description : '',
    discountType: rawPromo.discountType === 'fixed_amount' ? 'fixed_amount' : 'percentage',
    discountValue:
      rawPromo.discountValue === null || rawPromo.discountValue === undefined
        ? ''
        : String(rawPromo.discountValue),
    maxDiscountValue:
      rawPromo.maxDiscountValue === null || rawPromo.maxDiscountValue === undefined
        ? ''
        : String(rawPromo.maxDiscountValue),
    isActive: rawPromo.isActive !== false,
  }
}

export function validateTourPricingPromoDraft(promoDraft: TourPricingPromoDraft): string | null {
  if (!promoDraft.enabled) return null

  const title = promoDraft.title.trim()
  const code = promoDraft.code.trim().toUpperCase()
  const discountValue = Number(promoDraft.discountValue)
  const maxDiscountValue = promoDraft.maxDiscountValue.trim()
    ? Number(promoDraft.maxDiscountValue)
    : null

  if (!title || !code) {
    return 'Promo title and code are required when a launch promo is enabled.'
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return 'Promo discount value must be greater than zero.'
  }

  if (promoDraft.discountType === 'percentage' && discountValue > 100) {
    return 'Percentage promos cannot exceed 100%.'
  }

  if (maxDiscountValue !== null && (!Number.isFinite(maxDiscountValue) || maxDiscountValue <= 0)) {
    return 'Promo max discount must be greater than zero when provided.'
  }

  return null
}