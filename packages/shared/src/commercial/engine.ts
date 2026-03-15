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
  commissionRate: number
  paymentCollected?: number
  refundAmount?: number
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
  commissionRate: number
  paymentCollected?: number
  refundAmount?: number
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
    googleMapsEnabled: false,
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
  const paymentCollected = normalizeMoney(Math.max(0, input.paymentCollected ?? bookingTotal))
  const refundAmount = normalizeMoney(Math.max(0, input.refundAmount ?? 0))
  const commissionTotal = calculateCommissionAmount(bookingTotal, input.commissionRate)
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

export function getMinimumDepositForTier(tier: MembershipTierCode): number {
  return getMembershipTierConfig(tier).minimumDepositPercent
}

export function validateDepositPolicyForTier(
  tier: MembershipTierCode,
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

  const config = getMembershipTierConfig(tier)
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
    commissionRate,
    paymentCollected,
    refundAmount,
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

export function getPublishLimitForTier(tier: MembershipTierCode): number {
  return getMembershipTierConfig(tier).monthlyPublishLimit
}

export function canPublishAnotherTrip(
  tier: MembershipTierCode,
  alreadyPublishedThisCycle: number,
): FeatureGateResult {
  const limit = getPublishLimitForTier(tier)
  if (alreadyPublishedThisCycle < limit) {
    return { allowed: true, reason: null }
  }

  return {
    allowed: false,
    reason: `${getMembershipTierConfig(tier).label} tier publish limit reached for this cycle`,
  }
}

export function resolveFeatureGate(
  tier: MembershipTierCode,
  feature: CommercialFeatureKey,
): FeatureGateResult {
  const config = getMembershipTierConfig(tier)

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