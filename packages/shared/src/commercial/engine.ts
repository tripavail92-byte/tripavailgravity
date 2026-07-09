export type MembershipTierCode = 'gold' | 'diamond' | 'platinum'

export type CommercialFeatureKey =
  | 'pickup_multi_city'
  | 'google_maps'
  | 'ai_itinerary'

export interface MembershipTierConfig {
  code: MembershipTierCode
  label: string
  monthlyFee: number
  commissionRate: number
  minimumDepositPercent: number
  monthlyPublishLimit: number
  pickupMultiCityEnabled: boolean
  googleMapsEnabled: boolean
  aiItineraryEnabled: boolean
  aiMonthlyCredits: number
  supportPriority: number
  rankingWeight: number
  /** Admin-editable presentation. Absent when falling back to the built-in defaults. */
  tagline?: string | null
  badgeHex?: string | null
  perks?: string[]
  currency?: string
  sortOrder?: number
  isActive?: boolean
  isPubliclyListed?: boolean
}

/**
 * Either a resolved tier (normally a row from `commercial_membership_tiers`, which the
 * admin edits) or just its code — in which case the built-in defaults apply. Every gate
 * accepts both, so changing a tier in the admin dashboard changes behavior without a deploy.
 */
export type TierLike = MembershipTierCode | MembershipTierConfig

/** Raw `commercial_membership_tiers` row, as returned by PostgREST. */
export interface MembershipTierRow {
  code: string
  display_name: string
  monthly_fee: number | string
  commission_rate: number | string
  minimum_deposit_percent: number | string
  monthly_publish_limit: number | string
  pickup_multi_city_enabled: boolean
  google_maps_enabled: boolean
  ai_itinerary_enabled: boolean
  ai_monthly_credits: number | string
  support_priority?: number | string
  ranking_weight?: number | string
  tagline?: string | null
  badge_hex?: string | null
  perks?: unknown
  currency?: string | null
  sort_order?: number | string | null
  is_active?: boolean | null
  is_publicly_listed?: boolean | null
}

function toNum(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Maps a database tier row onto the config the gates consume. Columns added by later
 * migrations are read defensively, so a client deployed ahead of its migration still works.
 */
export function mapTierRowToConfig(row: MembershipTierRow): MembershipTierConfig {
  const code = row.code as MembershipTierCode
  const fallback = DEFAULT_MEMBERSHIP_TIER_CONFIGS[code] ?? DEFAULT_MEMBERSHIP_TIER_CONFIGS.gold

  return {
    code,
    label: row.display_name || fallback.label,
    monthlyFee: toNum(row.monthly_fee, fallback.monthlyFee),
    commissionRate: toNum(row.commission_rate, fallback.commissionRate),
    minimumDepositPercent: toNum(row.minimum_deposit_percent, fallback.minimumDepositPercent),
    monthlyPublishLimit: toNum(row.monthly_publish_limit, fallback.monthlyPublishLimit),
    pickupMultiCityEnabled: Boolean(row.pickup_multi_city_enabled),
    googleMapsEnabled: Boolean(row.google_maps_enabled),
    aiItineraryEnabled: Boolean(row.ai_itinerary_enabled),
    aiMonthlyCredits: toNum(row.ai_monthly_credits, fallback.aiMonthlyCredits),
    supportPriority: toNum(row.support_priority, fallback.supportPriority),
    rankingWeight: toNum(row.ranking_weight, fallback.rankingWeight),
    tagline: row.tagline ?? null,
    badgeHex: row.badge_hex ?? null,
    perks: Array.isArray(row.perks) ? row.perks.filter((p): p is string => typeof p === 'string') : [],
    currency: row.currency ?? 'PKR',
    sortOrder: toNum(row.sort_order, 0),
    isActive: row.is_active ?? true,
    isPubliclyListed: row.is_publicly_listed ?? true,
  }
}

/** Normalizes a code-or-config into a config. */
export function resolveTier(tier: TierLike): MembershipTierConfig {
  return typeof tier === 'string' ? getMembershipTierConfig(tier) : tier
}

export interface TierUpgradeDelta {
  extraPublishSlots: number
  commissionPointsSaved: number
  depositPointsLowered: number
  unlocksMultiCityPickup: boolean
  unlocksAiItinerary: boolean
  extraAiCredits: number
  monthlyFeeDifference: number
  /** Short human-readable reasons to upgrade, ready to render as bullets. */
  highlights: string[]
}

/**
 * What an operator actually gains by moving from `from` to `to`. Values come from the
 * (admin-editable) configs, so the upgrade copy always matches the live tier settings.
 */
export function describeTierUpgrade(from: TierLike, to: TierLike): TierUpgradeDelta {
  const a = resolveTier(from)
  const b = resolveTier(to)

  const extraPublishSlots = Math.max(0, b.monthlyPublishLimit - a.monthlyPublishLimit)
  const commissionPointsSaved = Math.max(0, a.commissionRate - b.commissionRate)
  const depositPointsLowered = Math.max(0, a.minimumDepositPercent - b.minimumDepositPercent)
  const unlocksMultiCityPickup = !a.pickupMultiCityEnabled && b.pickupMultiCityEnabled
  const unlocksAiItinerary = !a.aiItineraryEnabled && b.aiItineraryEnabled
  const extraAiCredits = Math.max(0, b.aiMonthlyCredits - a.aiMonthlyCredits)

  const highlights: string[] = []
  if (extraPublishSlots > 0) {
    highlights.push(`Publish ${b.monthlyPublishLimit} tours per month instead of ${a.monthlyPublishLimit}`)
  }
  if (commissionPointsSaved > 0) {
    highlights.push(`Pay ${b.commissionRate}% commission instead of ${a.commissionRate}%`)
  }
  if (depositPointsLowered > 0) {
    highlights.push(`Take deposits as low as ${b.minimumDepositPercent}% (down from ${a.minimumDepositPercent}%)`)
  }
  if (unlocksMultiCityPickup) highlights.push('Add multi-city pickup locations')
  if (unlocksAiItinerary) {
    highlights.push(
      b.aiMonthlyCredits > 0
        ? `Unlock AI itinerary tools (${b.aiMonthlyCredits} credits/month)`
        : 'Unlock AI itinerary tools',
    )
  } else if (extraAiCredits > 0) {
    highlights.push(`${b.aiMonthlyCredits} AI credits per month (up from ${a.aiMonthlyCredits})`)
  }
  if (b.rankingWeight > a.rankingWeight) highlights.push('Higher placement in search results')

  return {
    extraPublishSlots,
    commissionPointsSaved,
    depositPointsLowered,
    unlocksMultiCityPickup,
    unlocksAiItinerary,
    extraAiCredits,
    monthlyFeeDifference: normalizeMoney(b.monthlyFee - a.monthlyFee),
    highlights,
  }
}

export interface MembershipAdjustmentInput {
  membershipFee: number
  priorCycleCommissionCredit: number
}

export interface MembershipAdjustmentResult {
  membershipFee: number
  priorCycleCommissionCredit: number
  adjustmentApplied: number
  finalMembershipCharge: number
}

export interface BookingFinanceSnapshotInput {
  bookingTotal: number
  priceBeforePromo?: number
  commissionRate: number
  paymentCollected?: number
  refundAmount?: number
  promoFundingSource?: 'operator' | 'platform' | null
  promoDiscountValue?: number
  depositRequired?: boolean
  depositPercentage?: number
  depositUpfrontAmount?: number
  depositRemainingAmount?: number
  membershipTier: MembershipTierCode
}

export interface BookingFinanceSnapshotResult {
  membershipTier: MembershipTierCode
  bookingTotal: number
  paymentCollected: number
  refundAmount: number
  depositRequired: boolean
  depositPercentage: number
  depositUpfrontAmount: number
  depositRemainingAmount: number
  commissionRate: number
  commissionAmount: number
  commissionTotal: number
  commissionCollected: number
  commissionRemaining: number
  operatorReceivableEstimate: number
}

export interface CommissionCollectionInput {
  bookingTotal: number
  priceBeforePromo?: number
  commissionRate: number
  paymentCollected?: number
  refundAmount?: number
  promoFundingSource?: 'operator' | 'platform' | null
  promoDiscountValue?: number
}

export interface CommissionCollectionResult {
  commissionTotal: number
  commissionCollected: number
  commissionRemaining: number
  collectedBasisAmount: number
}

export interface OperatorCancellationPenaltyResult {
  recentOperatorFaultCancellations: number
  threshold: number
  windowDays: number
  penaltyActive: boolean
  restrictOperator: boolean
  applyPayoutHold: boolean
  reason: string | null
}

export const DEFAULT_OPERATOR_CANCELLATION_THRESHOLD = 3
export const DEFAULT_OPERATOR_CANCELLATION_WINDOW_DAYS = 30

export interface FeatureGateResult {
  allowed: boolean
  reason: string | null
}

export interface DepositPolicyValidationResult {
  allowed: boolean
  minimumDepositPercent: number
  reason: string | null
}

export const DEFAULT_MEMBERSHIP_TIER_CONFIGS: Record<MembershipTierCode, MembershipTierConfig> = {
  gold: {
    code: 'gold',
    label: 'Gold',
    monthlyFee: 15000,
    commissionRate: 20,
    minimumDepositPercent: 20,
    monthlyPublishLimit: 5,
    pickupMultiCityEnabled: false,
    // Google Maps is available on every tier — tiers differentiate on publish limits
    // (and commission/deposit terms), not on core listing tooling.
    googleMapsEnabled: true,
    aiItineraryEnabled: false,
    aiMonthlyCredits: 0,
    supportPriority: 1,
    rankingWeight: 1,
  },
  diamond: {
    code: 'diamond',
    label: 'Diamond',
    monthlyFee: 30000,
    commissionRate: 13,
    minimumDepositPercent: 15,
    monthlyPublishLimit: 25,
    pickupMultiCityEnabled: true,
    googleMapsEnabled: true,
    aiItineraryEnabled: true,
    aiMonthlyCredits: 100,
    supportPriority: 2,
    rankingWeight: 1.25,
  },
  platinum: {
    code: 'platinum',
    label: 'Platinum',
    monthlyFee: 50000,
    commissionRate: 10,
    minimumDepositPercent: 10,
    monthlyPublishLimit: 100,
    pickupMultiCityEnabled: true,
    googleMapsEnabled: true,
    aiItineraryEnabled: true,
    aiMonthlyCredits: 300,
    supportPriority: 3,
    rankingWeight: 1.5,
  },
}

function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

export function getMembershipTierConfig(tier: MembershipTierCode): MembershipTierConfig {
  return DEFAULT_MEMBERSHIP_TIER_CONFIGS[tier]
}

export function calculateCommissionAmount(grossAmount: number, commissionRate: number): number {
  return normalizeMoney(Math.max(0, grossAmount) * Math.max(0, commissionRate) / 100)
}

export function calculateCommissionCollection(
  input: CommissionCollectionInput,
): CommissionCollectionResult {
  const bookingTotal = normalizeMoney(Math.max(0, input.bookingTotal))
  const promoDiscountValue = normalizeMoney(Math.max(0, input.promoDiscountValue ?? 0))
  const inferredPriceBeforePromo = normalizeMoney(
    Math.max(bookingTotal, input.priceBeforePromo ?? bookingTotal + promoDiscountValue),
  )
  const paymentCollected = normalizeMoney(Math.max(0, input.paymentCollected ?? bookingTotal))
  const refundAmount = normalizeMoney(Math.max(0, input.refundAmount ?? 0))
  const commissionBasisTotal =
    input.promoFundingSource === 'platform' && promoDiscountValue > 0
      ? inferredPriceBeforePromo
      : bookingTotal
  const grossCommissionTotal = calculateCommissionAmount(commissionBasisTotal, input.commissionRate)
  const commissionTotal =
    input.promoFundingSource === 'platform' && promoDiscountValue > 0
      ? normalizeMoney(Math.max(0, grossCommissionTotal - Math.min(promoDiscountValue, grossCommissionTotal)))
      : grossCommissionTotal
  const collectedBasisAmount = normalizeMoney(
    Math.max(0, Math.min(bookingTotal, paymentCollected - refundAmount)),
  )
  const commissionCollected = normalizeMoney(Math.min(commissionTotal, collectedBasisAmount))

  return {
    commissionTotal,
    commissionCollected,
    commissionRemaining: normalizeMoney(Math.max(0, commissionTotal - commissionCollected)),
    collectedBasisAmount,
  }
}

export function getMinimumDepositForTier(tier: TierLike): number {
  return resolveTier(tier).minimumDepositPercent
}

export function validateDepositPolicyForTier(
  tier: TierLike,
  depositRequired: boolean,
  depositPercentage: number,
): DepositPolicyValidationResult {
  const minimumDepositPercent = getMinimumDepositForTier(tier)

  if (!depositRequired) {
    return {
      allowed: true,
      minimumDepositPercent,
      reason: null,
    }
  }

  if (Math.max(0, Math.round(depositPercentage)) >= minimumDepositPercent) {
    return {
      allowed: true,
      minimumDepositPercent,
      reason: null,
    }
  }

  const config = resolveTier(tier)
  return {
    allowed: false,
    minimumDepositPercent,
    reason: `Deposit must be at least ${minimumDepositPercent}% for ${config.label} membership. Upgrade tiers or increase the deposit percentage.`,
  }
}

export function calculateMembershipAdjustment(
  input: MembershipAdjustmentInput,
): MembershipAdjustmentResult {
  const membershipFee = normalizeMoney(Math.max(0, input.membershipFee))
  const priorCycleCommissionCredit = normalizeMoney(Math.max(0, input.priorCycleCommissionCredit))
  const adjustmentApplied = Math.min(membershipFee, priorCycleCommissionCredit)
  const finalMembershipCharge = normalizeMoney(Math.max(0, membershipFee - priorCycleCommissionCredit))

  return {
    membershipFee,
    priorCycleCommissionCredit,
    adjustmentApplied,
    finalMembershipCharge,
  }
}

export function buildBookingFinanceSnapshot(
  input: BookingFinanceSnapshotInput,
): BookingFinanceSnapshotResult {
  const bookingTotal = normalizeMoney(Math.max(0, input.bookingTotal))
  const refundAmount = normalizeMoney(Math.max(0, input.refundAmount ?? 0))
  const depositRequired = Boolean(input.depositRequired)
  const depositPercentage = depositRequired ? Math.max(0, Math.round(input.depositPercentage ?? 0)) : 0
  const depositUpfrontAmount = normalizeMoney(
    Math.max(
      0,
      input.depositUpfrontAmount
        ?? input.paymentCollected
        ?? (depositRequired ? bookingTotal * depositPercentage / 100 : bookingTotal),
    ),
  )
  const depositRemainingAmount = normalizeMoney(
    Math.max(
      0,
      input.depositRemainingAmount
        ?? (depositRequired ? bookingTotal - depositUpfrontAmount : 0),
    ),
  )
  const paymentCollected = normalizeMoney(Math.max(0, input.paymentCollected ?? depositUpfrontAmount))
  const commissionRate = Math.max(0, input.commissionRate)
  const commissionCollection = calculateCommissionCollection({
    bookingTotal,
    priceBeforePromo: input.priceBeforePromo,
    commissionRate,
    paymentCollected,
    refundAmount,
    promoFundingSource: input.promoFundingSource ?? null,
    promoDiscountValue: input.promoDiscountValue ?? 0,
  })
  const commissionAmount = commissionCollection.commissionTotal
  const operatorReceivableEstimate = normalizeMoney(
    Math.max(0, bookingTotal - commissionAmount - refundAmount),
  )

  return {
    membershipTier: input.membershipTier,
    bookingTotal,
    paymentCollected,
    refundAmount,
    depositRequired,
    depositPercentage,
    depositUpfrontAmount,
    depositRemainingAmount,
    commissionRate,
    commissionAmount,
    commissionTotal: commissionCollection.commissionTotal,
    commissionCollected: commissionCollection.commissionCollected,
    commissionRemaining: commissionCollection.commissionRemaining,
    operatorReceivableEstimate,
  }
}

export function evaluateOperatorCancellationPenalty(input: {
  recentOperatorFaultCancellations: number
  threshold?: number
  windowDays?: number
}): OperatorCancellationPenaltyResult {
  const threshold = Math.max(1, Math.round(input.threshold ?? DEFAULT_OPERATOR_CANCELLATION_THRESHOLD))
  const windowDays = Math.max(1, Math.round(input.windowDays ?? DEFAULT_OPERATOR_CANCELLATION_WINDOW_DAYS))
  const recentOperatorFaultCancellations = Math.max(
    0,
    Math.round(input.recentOperatorFaultCancellations),
  )
  const penaltyActive = recentOperatorFaultCancellations >= threshold

  return {
    recentOperatorFaultCancellations,
    threshold,
    windowDays,
    penaltyActive,
    restrictOperator: penaltyActive,
    applyPayoutHold: penaltyActive,
    reason: penaltyActive
      ? `${recentOperatorFaultCancellations} operator-fault cancellations in ${windowDays} days reached the safeguard threshold of ${threshold}`
      : null,
  }
}

export function getPublishLimitForTier(tier: TierLike): number {
  return resolveTier(tier).monthlyPublishLimit
}

export function canPublishAnotherTrip(
  tier: TierLike,
  alreadyPublishedThisCycle: number,
): FeatureGateResult {
  const config = resolveTier(tier)
  if (alreadyPublishedThisCycle < config.monthlyPublishLimit) {
    return { allowed: true, reason: null }
  }

  return {
    allowed: false,
    reason: `${config.label} tier publish limit reached for this cycle`,
  }
}

export function resolveFeatureGate(
  tier: TierLike,
  feature: CommercialFeatureKey,
): FeatureGateResult {
  const config = resolveTier(tier)

  switch (feature) {
    case 'pickup_multi_city':
      return config.pickupMultiCityEnabled
        ? { allowed: true, reason: null }
        : { allowed: false, reason: `${config.label} tier does not include multi-city pickup support` }
    case 'google_maps':
      return config.googleMapsEnabled
        ? { allowed: true, reason: null }
        : { allowed: false, reason: `${config.label} tier does not include Google Maps support` }
    case 'ai_itinerary':
      return config.aiItineraryEnabled
        ? { allowed: true, reason: null }
        : { allowed: false, reason: `${config.label} tier does not include AI itinerary access` }
    default:
      return { allowed: false, reason: 'Unsupported feature gate' }
  }
}

export function calculateNextBusinessDay(date: Date): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)

  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

export function calculatePayoutReleaseDate(serviceCompletedAt: Date): Date {
  return calculateNextBusinessDay(serviceCompletedAt)
}