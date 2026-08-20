/**
 * Single source of truth for how a tour's cancellation policy is described.
 *
 * WHY THIS EXISTS. The tour detail page derived this from `tour.cancellation_policy`
 * while the checkout page hardcoded "Free cancellation up to 48 hours before departure".
 * A non-refundable tour therefore told the traveller "No refund after booking
 * confirmation" on the page that sold it and the opposite on the page that charged
 * them — the contract changed at the moment of payment. Both surfaces now read here.
 */
export type CancellationPolicyKey = 'flexible' | 'moderate' | 'strict' | 'non-refundable'

export interface CancellationMeta {
  key: CancellationPolicyKey
  /** Short label, e.g. for a badge or list row. */
  title: string
  /** One sentence the traveller can act on. */
  description: string
  /** True when the traveller can get a full refund within some window. */
  refundable: boolean
}

const META: Record<CancellationPolicyKey, Omit<CancellationMeta, 'key'>> = {
  flexible: {
    title: 'Free Cancellation',
    description: 'Cancel up to 48 hours before departure.',
    refundable: true,
  },
  moderate: {
    title: 'Moderate Cancellation',
    description: 'Cancel up to 5 days before departure for free.',
    refundable: true,
  },
  strict: {
    title: 'Strict Cancellation',
    description: '50% refund if cancelled 14 days before departure.',
    refundable: true,
  },
  'non-refundable': {
    title: 'Non-Refundable',
    description: 'No refund after booking confirmation.',
    refundable: false,
  },
}

/** Normalise whatever the row holds into a known policy key. */
export function cancellationPolicyKey(raw: string | null | undefined): CancellationPolicyKey {
  const v = (raw || 'flexible').toLowerCase().trim()
  return (v in META ? v : 'flexible') as CancellationPolicyKey
}

/** Describe a tour's cancellation policy. Never invents a refund that doesn't exist. */
export function getCancellationMeta(raw: string | null | undefined): CancellationMeta {
  const key = cancellationPolicyKey(raw)
  return { key, ...META[key] }
}
