import { Gem } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface TierBadgeProps {
  label: string
  /** Admin-configured accent colour for the tier. Falls back to the brand primary. */
  badgeHex?: string | null
  size?: 'sm' | 'md'
  /** Links to the commercial page unless disabled. */
  asLink?: boolean
  className?: string
}

/**
 * The operator's plan, shown as a pill. Colour comes from the tier row so renaming or
 * recolouring a tier in the admin dashboard flows through every surface automatically.
 */
export function TierBadge({ label, badgeHex, size = 'md', asLink = true, className }: TierBadgeProps) {
  const accent = badgeHex || undefined

  const pill = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-widest transition-colors',
        size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
        accent ? 'border-current' : 'border-primary/30 bg-primary/10 text-primary',
        asLink && 'hover:bg-primary/15',
        className,
      )}
      style={accent ? { color: accent, backgroundColor: `${accent}1A`, borderColor: `${accent}55` } : undefined}
    >
      <Gem className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {label}
    </span>
  )

  if (!asLink) return pill

  return (
    <Link to="/operator/commercial" aria-label={`${label} membership — view plan details`}>
      {pill}
    </Link>
  )
}
