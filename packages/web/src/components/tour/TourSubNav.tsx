import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface TourSubNavProps {
  sections: { id: string; label: string }[]
}

/**
 * Sticky sub-navigation for the tour details page.
 *
 * Sits directly below the page's top nav (which is sticky top-0, h-16), pinning at top-16 so the
 * two bars stack cleanly. Clicking a tab smooth-scrolls to that section; the active tab lights up
 * based on which section is currently under the reader's viewport (via IntersectionObserver).
 *
 * Sections are expected to have matching HTML ids and a scroll-mt-32 class so the browser's
 * built-in scroll offset does not tuck the section heading behind the two stacked sticky bars.
 */
export function TourSubNav({ sections }: TourSubNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  // Parents typically pass this array as an inline literal (fresh reference each render). Keying
  // the effect on the joined id list means the observer is only rebuilt when the actual section
  // set changes, not on every parent re-render — otherwise the constant disconnect/reconnect
  // wipes the observer's baseline state and it never fires updates.
  const sectionsKey = sections.map((s) => s.id).join(',')
  // Ref to this sticky bar so both the scrollspy and the click handler can measure its live
  // height (with the fixed SiteHeader's) to know exactly where the sticky chrome ends.
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll-event scrollspy rather than IntersectionObserver. Two reasons:
    //   1. IO can silently no-op in some embedded/preview environments (verified — same config
    //      failed to fire even a single initial callback), so we'd have quietly shipped a nav
    //      whose active state never updated for any user hitting that environment.
    //   2. This approach is easier to reason about: whatever section's top has just passed the
    //      focal line (the bottom of the sticky chrome) is active.
    //
    // Perf: passive listener, one loop over ~5 anchors per scroll event — well under 16ms budget
    // even on slow devices, so no throttling needed.
    const handleScroll = () => {
      // Focal line = the bottom of the sticky chrome (fixed SiteHeader + this bar), in viewport
      // space, measured live so it's right on phones (~60px header) and desktop (~80px) alike.
      const headerH = document.querySelector('header')?.getBoundingClientRect().height ?? 0
      const barH = navRef.current?.getBoundingClientRect().height ?? 48
      const focalLine = headerH + barH + 4
      // Active = the last section whose top has scrolled up under that line: the greatest
      // viewport-top still ≤ focalLine. Walking in array order and breaking on the first miss only
      // works when the array is in DOM order, which it isn't here (Operator's anchor sits before
      // Details' in the DOM). Taking the max removes that ordering dependency. getBoundingClientRect
      // (not offsetTop) keeps it correct no matter which ancestor is the offsetParent.
      let current = sections[0]?.id ?? ''
      let best = -Infinity
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= focalLine && top > best) {
          best = top
          current = s.id
        }
      }
      setActiveId(current)
    }
    handleScroll() // seed the initial active from wherever the page loaded scrolled to
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
    // sections read from closure; the id-list string invalidates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsKey])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    // Set active immediately for perceived responsiveness; the scrollspy confirms on settle.
    setActiveId(id)
    // Land the heading just below the sticky chrome. Measure the fixed SiteHeader + this bar at
    // click time so the offset is exact on phones and desktop alike, instead of trusting a single
    // scroll-mt constant.
    const headerH = document.querySelector('header')?.getBoundingClientRect().height ?? 0
    const barH = navRef.current?.getBoundingClientRect().height ?? 48
    const targetY = Math.max(
      0,
      el.getBoundingClientRect().top + window.scrollY - headerH - barH - 8,
    )
    const startY = window.scrollY
    try {
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    } catch {
      window.scrollTo(0, targetY)
    }
    // Guarantee arrival where `behavior:'smooth'` silently no-ops (some embedded/webview engines —
    // the same failure mode that pushed this component off IntersectionObserver). A real smooth
    // scroll has already left startY within 250ms, so this only fires when nothing moved at all.
    window.setTimeout(() => {
      if (Math.abs(window.scrollY - startY) < 2) window.scrollTo(0, targetY)
    }, 250)
  }

  return (
    // Pins just below the FIXED SiteHeader (60px on phones, 80px on md+). top-16 assumed a
    // 64px bar with nothing fixed above it, so the sub-nav pinned behind the SiteHeader and
    // was hidden — these offsets keep it visible as the page scrolls.
    <div
      ref={navRef}
      className="sticky top-[60px] z-30 border-b border-border/40 bg-background/95 backdrop-blur-md md:top-20"
    >
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto -mb-px" aria-label="Tour sections">
          {sections.map((s) => {
            const isActive = s.id === activeId
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={cn(
                  'shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                {s.label}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
