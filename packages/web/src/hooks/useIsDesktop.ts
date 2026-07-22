import { useEffect, useState } from 'react'

/**
 * `true` when the viewport is at least Tailwind's `lg` breakpoint (1024px).
 *
 * Matches the storefront's own cutoff for "desktop": `BottomTabsNav` is `lg:hidden`,
 * `CollapsibleSidebar` is `hidden lg:flex`. Using the same width here means the "open listings in a
 * new tab" behaviour lines up with the chrome — travellers on a device sized like a phone always
 * see the mobile layout AND same-tab navigation, and vice versa.
 *
 * SSR-safe. On the first render (and in any non-browser environment) this returns `false`, which is
 * the correct default: pretend we are on the smaller device and open in the same tab. The visitor's
 * real viewport is measured on mount.
 *
 * Subscribed via `matchMedia`, so the value updates if someone resizes across the breakpoint or
 * rotates a tablet — not on every resize event, which would thrash renders.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mql = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mql.matches)

    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
