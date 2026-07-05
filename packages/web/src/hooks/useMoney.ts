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

      // Round the converted estimate to a whole unit — cleaner than "AED 39.6".
      return { text: formatMoney(Math.round(n * rate), to), estimate: true, currency: to }
    },
    [display, rates],
  )
}
