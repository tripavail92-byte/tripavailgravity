import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { BASE_CURRENCY, CURRENCIES } from '@tripavail/shared/utils/money'

const VALID = new Set(Object.keys(CURRENCIES))

interface CurrencyState {
  /** The currency the traveller wants prices shown in (display only; charges stay in the listing currency). */
  currency: string
  setCurrency: (code: string) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: BASE_CURRENCY,
      setCurrency: (code) => {
        const c = (code || BASE_CURRENCY).toUpperCase()
        set({ currency: VALID.has(c) ? c : BASE_CURRENCY })
      },
    }),
    { name: 'tripavail-display-currency' },
  ),
)
