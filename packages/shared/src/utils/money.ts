/**
 * Shared money formatting — the single source of truth that replaces the ~104
 * ad-hoc `PKR ${n}` strings scattered across the web app.
 *
 * Mirrors the public.currencies reference table so display works without a fetch;
 * `minorUnit` fixes the long-standing Stripe `* 100` assumption for zero/three
 * decimal currencies. Adopted incrementally in Phase 1.
 */

export interface CurrencyMeta {
  code: string
  symbol: string
  minorUnit: number
}

/** Built-in fallback table (keep in sync with the currencies migration). */
export const CURRENCIES: Record<string, CurrencyMeta> = {
  PKR: { code: 'PKR', symbol: '₨', minorUnit: 2 },
  USD: { code: 'USD', symbol: '$', minorUnit: 2 },
  AED: { code: 'AED', symbol: 'د.إ', minorUnit: 2 },
  SAR: { code: 'SAR', symbol: '﷼', minorUnit: 2 },
  EUR: { code: 'EUR', symbol: '€', minorUnit: 2 },
  GBP: { code: 'GBP', symbol: '£', minorUnit: 2 },
}

/** Reporting base currency (aggregates normalize to this). */
export const BASE_CURRENCY = 'PKR'

function meta(code: string): CurrencyMeta {
  return CURRENCIES[(code || BASE_CURRENCY).toUpperCase()] ?? { code, symbol: code + ' ', minorUnit: 2 }
}

/**
 * Format an amount in its own currency for display.
 * Uses Intl currency formatting; falls back to symbol + grouped number for
 * currency codes the runtime's ICU data doesn't know.
 */
export function formatMoney(
  amount: number | null | undefined,
  currencyCode: string = BASE_CURRENCY,
  locale?: string,
): string {
  const code = (currencyCode || BASE_CURRENCY).toUpperCase()
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  const m = meta(code)
  // Whole amounts read clean ("PKR 2,000"), fractional ones show the full minor unit
  // ("PKR 1,999.50"). With minimumFractionDigits pinned to 0 a half-rupee deposit
  // rendered as "PKR 1,999.5" — a single stray decimal on the button people press to pay.
  const hasFraction = Math.abs(n % 1) > Number.EPSILON
  const fractionDigits = hasFraction ? m.minorUnit : 0
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(n)
  } catch {
    return (
      m.symbol +
      n.toLocaleString(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
    )
  }
}

/** Convert a human amount to the integer smallest unit Stripe expects. */
export function toStripeAmount(amount: number, currencyCode: string = BASE_CURRENCY): number {
  const unit = meta(currencyCode).minorUnit
  return Math.round((Number.isFinite(amount) ? amount : 0) * 10 ** unit)
}

/** The smallest-unit multiplier for a currency (100 for USD/PKR, 1 for JPY). */
export function minorUnitFactor(currencyCode: string = BASE_CURRENCY): number {
  return 10 ** meta(currencyCode).minorUnit
}
