import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

/**
 * Single source of truth for the brand logo — the traveller-rose TripAvail mark
 * (compass · road · jeep) the owner designed. Change these constants and the logo
 * updates everywhere it's used: the storefront header, the sidebar, the setup wizard.
 *
 * The full lockup carries its own wordmark, so we show it on md+ and collapse to the
 * pin mark on narrow widths / tight rails. Light and dark variants swap on the
 * `<html>.dark` class (Tailwind darkMode: 'class').
 */
export const LOGO_FULL_LIGHT = '/brand/logo-light.webp'
export const LOGO_FULL_DARK = '/brand/logo-dark.webp'
export const LOGO_MARK_SRC = '/brand/logo-mark.png'
/** Back-compat export (setup wizard, etc.) — now points at the new pin mark. */
export const LOGO_EMBLEM_SRC = LOGO_MARK_SRC
/** The "avail" accent — the fixed brand rose. */
export const BRAND_ACCENT = '#FF385C'

interface LogoProps {
  /** 'full' = the full lockup (wordmark + mark); 'emblem' = the pin mark only. */
  variant?: 'full' | 'emblem'
  /** Where it links. Home by default; pass `null` for a non-interactive mark. */
  to?: string | null
  /** Show the full lockup at every width (default collapses to the mark below md). */
  alwaysShowWordmark?: boolean
  className?: string
  emblemClassName?: string
}

/**
 * The TripAvail logo. Always a link to home unless `to={null}`.
 */
export function Logo({
  variant = 'full',
  to = '/',
  alwaysShowWordmark = false,
  className,
  emblemClassName,
}: LogoProps) {
  const mark = (
    <img
      src={LOGO_MARK_SRC}
      alt="TripAvail"
      width={40}
      height={40}
      className={cn('block h-9 w-9 shrink-0', emblemClassName)}
    />
  )
  const full = (
    <span className="inline-flex items-center">
      <img src={LOGO_FULL_LIGHT} alt="TripAvail" className="block h-14 w-auto dark:hidden" />
      <img src={LOGO_FULL_DARK} alt="" aria-hidden="true" className="hidden h-14 w-auto dark:block" />
    </span>
  )

  const inner =
    variant === 'emblem' ? (
      mark
    ) : (
      <>
        {/* Compact pin mark below md (unless the full lockup is forced). */}
        <span className={cn('items-center', alwaysShowWordmark ? 'hidden' : 'inline-flex md:hidden')}>
          {mark}
        </span>
        {/* Full lockup on md+ (or always). */}
        <span className={cn('items-center', alwaysShowWordmark ? 'inline-flex' : 'hidden md:inline-flex')}>
          {full}
        </span>
      </>
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
