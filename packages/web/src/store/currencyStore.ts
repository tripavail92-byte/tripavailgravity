import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { BASE_CURRENCY, CURRENCIES } from '@tripavail/shared/utils/money'

const VALID = new Set(Object.keys(CURRENCIES))

interface CurrencyState {
  /** The currency the traveller sees prices in (display only; charges stay in the listing currency). */
  currency: string
  /** True once the traveller manually picks a currency — stops geo auto-detect from overriding it. */
  explicit: boolean
  setCurrency: (code: string, explicit?: boolean) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: BASE_CURRENCY,
      explicit: false,
      setCurrency: (code, explicit = true) => {
        const c = (code || BASE_CURRENCY).toUpperCase()
        set((s) => ({
          currency: VALID.has(c) ? c : BASE_CURRENCY,
          explicit: explicit ? true : s.explicit,
        }))
      },
    }),
    { name: 'tripavail-display-currency' },
  ),
)

// Timezone → currency for the currencies we support. A cheap, offline, no-API
// heuristic (an IP-geo lookup can refine this later); the traveller can always
// override via the switcher, which sticks.
const TZ_CURRENCY: Record<string, string> = {
  'Asia/Karachi': 'PKR',
  'Asia/Dubai': 'AED',
  'Asia/Muscat': 'AED',
  'Asia/Riyadh': 'SAR',
  'Europe/London': 'GBP',
}

export function detectDefaultCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (TZ_CURRENCY[tz]) return TZ_CURRENCY[tz]
    if (tz.startsWith('Europe/')) return 'EUR'
    if (tz.startsWith('America/')) return 'USD'
  } catch {
    // ignore — fall through to base
  }
  return BASE_CURRENCY
}

/**
 * Auto-sets the display currency from the visitor's timezone on first visit.
 * Never overrides an explicit choice. Mount once near the app root.
 */
export function useCurrencyAutoDetect() {
  const explicit = useCurrencyStore((s) => s.explicit)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  useEffect(() => {
    if (!explicit) setCurrency(detectDefaultCurrency(), false)
  }, [explicit, setCurrency])
}
