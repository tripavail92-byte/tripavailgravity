import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

/**
 * Single source of truth for the brand logo. Change these two constants and the emblem + wordmark
 * update everywhere the Logo component is used — the sidebar, every header, the setup wizard.
 */
export const LOGO_EMBLEM_SRC = '/brand/logo-emblem-256.png'
/** The "avail" accent — the fixed brand rose, kept identical across roles (a logo is brand, not chrome). */
export const BRAND_ACCENT = '#FF385C'

interface LogoProps {
  /** 'full' = emblem + wordmark; 'emblem' = mark only (collapsed rails, tight spots). */
  variant?: 'full' | 'emblem'
  /** Where it links. Home by default; pass `null` to render a non-interactive mark. */
  to?: string | null
  /** Show the wordmark at every width (default hides it below md, matching the storefront header). */
  alwaysShowWordmark?: boolean
  className?: string
  emblemClassName?: string
}

/**
 * The TripAvail logo. Always a link to home unless `to={null}` — so clicking it anywhere returns
 * the user to the landing page (the home affordance the dashboards were missing).
 */
export function Logo({
  variant = 'full',
  to = '/',
  alwaysShowWordmark = false,
  className,
  emblemClassName,
}: LogoProps) {
  const inner = (
    <span className="flex items-center gap-1.5">
      <img
        src={LOGO_EMBLEM_SRC}
        alt="TripAvail"
        width={32}
        height={32}
        className={cn('block h-8 w-8 shrink-0 rounded-[7px]', emblemClassName)}
      />
      {variant === 'full' ? (
        <span
          className={cn(
            'text-2xl leading-none tracking-tight',
            alwaysShowWordmark ? 'block' : 'hidden md:block',
          )}
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}
        >
          <span className="text-foreground">trip</span>
          <span style={{ color: BRAND_ACCENT }}>avail</span>
        </span>
      ) : null}
    </span>
  )

  if (to === null) {
    return <span className={cn('inline-flex items-center', className)}>{inner}</span>
  }

  return (
    <Link
      to={to}
      aria-label="TripAvail — home"
      className={cn(
        'inline-flex items-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
    >
      {inner}
    </Link>
  )
}
