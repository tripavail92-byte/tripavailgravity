// Ported from the web app's tourPaymentTerms.ts so mobile pricing/deposit math
// matches exactly (deposit clamp 0–50%, tier matching, upfront/remaining split).

export interface PricingTier {
  minPeople: number
  maxPeople: number
  pricePerPerson: number
  name: string
}

export interface PaymentTerms {
  effectiveUnitPrice: number
  totalAmount: number
  upfrontAmount: number
  remainingAmount: number
  upfrontPercentage: number
  paymentCollectionMode: 'full_online' | 'partial_online'
  paymentPolicyText: string
}

export function normalizeAmount(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

function clampDepositPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(50, Math.round(value)))
}

function normalizeTiers(pricingTiers: unknown): PricingTier[] {
  if (!Array.isArray(pricingTiers)) return []
  return pricingTiers
    .map((t: any) => ({
      minPeople: Number(t?.minPeople || 0),
      maxPeople: Number(t?.maxPeople || 0),
      pricePerPerson: normalizeAmount(Number(t?.pricePerPerson || 0)),
      name: String(t?.name || ''),
    }))
    .filter((t) => t.minPeople > 0 && t.pricePerPerson > 0)
}

function applicableTier(guestCount: number, tiers: PricingTier[]): PricingTier | null {
  const ranged = tiers
    .filter((t) => guestCount >= t.minPeople && (t.maxPeople > 0 ? guestCount <= t.maxPeople : true))
    .sort((a, b) => b.minPeople - a.minPeople)[0]
  const fallback = tiers
    .filter((t) => guestCount >= t.minPeople)
    .sort((a, b) => b.minPeople - a.minPeople)[0]
  return ranged || fallback || null
}

function buildTerms(totalAmount: number, guestCount: number, depositRequired: boolean, depositPercentage: number): PaymentTerms {
  const total = normalizeAmount(totalAmount)
  const upfrontPercentage = depositRequired ? clampDepositPercentage(depositPercentage) : 100
  const upfrontAmount = depositRequired ? normalizeAmount((total * upfrontPercentage) / 100) : total
  const remainingAmount = normalizeAmount(Math.max(0, total - upfrontAmount))
  const mode = depositRequired && remainingAmount > 0 ? 'partial_online' : 'full_online'
  return {
    effectiveUnitPrice: normalizeAmount(total / Math.max(1, guestCount)),
    totalAmount: total,
    upfrontAmount,
    remainingAmount,
    upfrontPercentage,
    paymentCollectionMode: mode,
    paymentPolicyText:
      mode === 'partial_online'
        ? `Pay ${upfrontPercentage}% now to confirm. The balance is paid to the operator before departure.`
        : 'Full amount is charged online at booking confirmation.',
  }
}

export function getTourPaymentTerms(params: {
  basePrice: number
  guestCount: number
  pricingTiers?: unknown
  depositRequired?: boolean | null
  depositPercentage?: number | null
}): PaymentTerms {
  const guestCount = Math.max(1, Number(params.guestCount || 1))
  const basePrice = normalizeAmount(Number(params.basePrice || 0))
  const tier = applicableTier(guestCount, normalizeTiers(params.pricingTiers))
  const unit = tier?.pricePerPerson || basePrice
  return buildTerms(unit * guestCount, guestCount, Boolean(params.depositRequired), Number(params.depositPercentage || 0))
}

/** Recompute terms from a (promo-discounted) total. */
export function buildPaymentTermsFromTotal(params: {
  totalAmount: number
  guestCount: number
  depositRequired?: boolean | null
  depositPercentage?: number | null
}): PaymentTerms {
  const guestCount = Math.max(1, Number(params.guestCount || 1))
  return buildTerms(Number(params.totalAmount || 0), guestCount, Boolean(params.depositRequired), Number(params.depositPercentage || 0))
}
