import { CURRENCIES } from '@tripavail/shared/utils/money'

import { cn } from '@/lib/utils'
import { useCurrencyStore } from '@/store/currencyStore'

const CODES = ['PKR', 'USD', 'AED', 'SAR', 'EUR', 'GBP']

/**
 * Compact currency picker for the top bar — lets a traveller see prices in their
 * own currency. Native <select> for zero-dependency accessibility + keyboard use.
 */
export function CurrencySwitcher({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        aria-label="Display currency"
        className={cn(
          'appearance-none rounded-full border py-1.5 pl-3 pr-7 text-sm font-semibold cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          inverted
            ? 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
            : 'border-border bg-background text-foreground hover:bg-muted',
        )}
      >
        {CODES.map((c) => (
          <option key={c} value={c}>
            {CURRENCIES[c]?.symbol} {c}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute right-2.5 h-3.5 w-3.5',
          inverted ? 'text-white/50' : 'text-muted-foreground',
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  )
}
