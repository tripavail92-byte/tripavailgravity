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

  useEffect(() => {
    // Scroll-event scrollspy rather than IntersectionObserver. Two reasons:
    //   1. IO can silently no-op in some embedded/preview environments (verified — same config
    //      failed to fire even a single initial callback), so we'd have quietly shipped a nav
    //      whose active state never updated for any user hitting that environment.
    //   2. This approach is easier to reason about: whatever section's top has just passed the
    //      focal line (128px from the viewport top, matching the sticky-bar stack) is active.
    //
    // Perf: passive listener, one loop over ~5 anchors per scroll event — well under 16ms budget
    // even on slow devices, so no throttling needed.
    const handleScroll = () => {
      const focalLine = window.scrollY + 128
      // Pick the section with the LARGEST offsetTop that is still ≤ focalLine — the most-recently
      // scrolled-past anchor. Walking sections in array order and breaking on the first miss only
      // works when the array happens to be in DOM order, which it isn't on this page (the tab
      // "Details" appears third in the array but its anchor sits AFTER the Operator anchor in
      // the DOM). Computing the max avoids that ordering dependency entirely.
      let current = sections[0]?.id ?? ''
      let bestTop = -Infinity
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (!el) continue
        const top = el.offsetTop
        if (top <= focalLine && top > bestTop) {
          bestTop = top
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
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Set active immediately for perceived responsiveness; the observer will confirm on settle.
    setActiveId(id)
  }

  return (
    <div className="sticky top-16 z-30 border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4">
        <nav
          className="flex items-center gap-1 overflow-x-auto -mb-px"
          aria-label="Tour sections"
        >
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
