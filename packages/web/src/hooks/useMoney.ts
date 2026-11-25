import { useCallback } from 'react'

import { BASE_CURRENCY, formatMoney } from '@tripavail/shared/utils/money'

import { useFxRates } from '@/queries/fxQueries'
import { useCurrencyStore } from '@/store/currencyStore'

export interface DisplayMoney {
  /** Formatted price string, e.g. "AED 1,200" or "₨ 89,000". */
  text: string
  /** True when the amount was converted across currencies (caller should prefix "≈"). */
  estimate: boolean
  /** The currency `text` is expressed in. */
  currency: string
}

/** Round to 3 significant figures, never below a whole unit (1,000,152 → 1,000,000; 39.6 → 40). */
export function roundEstimate(x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 0
  const step = Math.max(1, 10 ** (Math.floor(Math.log10(x)) - 2))
  return Math.round(x / step) * step
}

/**
 * Returns a formatter that renders a listing price in the traveller's chosen
 * display currency. Converts via the FX table when a rate exists; otherwise
 * shows the listing's own currency (never a fabricated number). Charges/settlement
 * always happen in the listing currency — conversion here is a browsing estimate.
 */
export function useMoney() {
  const display = useCurrencyStore((s) => s.currency)
  const { data: rates } = useFxRates()

  return useCallback(
    (amount: number | null | undefined, listingCurrency: string = BASE_CURRENCY): DisplayMoney => {
      const from = (listingCurrency || BASE_CURRENCY).toUpperCase()
      const to = display
      const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0

      if (from === to) return { text: formatMoney(n, from), estimate: false, currency: from }

      const rate = rates?.[`${from}->${to}`]
      if (!rate) return { text: formatMoney(n, from), estimate: false, currency: from }

      // A converted price is an estimate, so show it like one: three significant figures
      // ("≈ PKR 1,000,000", "≈ AED 39.6" → "≈ AED 40") instead of a falsely exact 1,000,152.
      return { text: formatMoney(roundEstimate(n * rate), to), estimate: true, currency: to }
    },
    [display, rates],
  )
}
