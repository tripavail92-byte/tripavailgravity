import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SearchOverlay } from '@/components/search/SearchOverlay'
import { type SearchFilters } from '@/components/search/TripAvailSearchBar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TravelAssistant } from '@/features/assistant/components/TravelAssistant'
import { cn } from '@/lib/utils'

/**
 * Shared "top of page" controls: search bar + Filters + Ask AI, then a big
 * Hotels/Tours/Events pill row. Every browse route mounts one so the top of
 * the site looks identical everywhere — the header itself no longer carries
 * search or nav, only branding + account.
 *
 * The pills are semantically distinct per host:
 *  - On the home page, they SWITCH visible sections (local state via
 *    `activeMode` + `onModeSelect`).
 *  - On /hotels /tours /events, the current-route pill is `active` and clicks
 *    on the OTHER pills navigate to their route (`onModeSelect` calls navigate).
 *
 * The pill design and search wiring don't care which — they just call
 * `onModeSelect`. Search always navigates to /search with the query pre-scoped
 * to the active mode.
 */
export type ExploreMode = 'all' | 'hotels' | 'tours' | 'events'

interface ModeDef {
  key: Exclude<ExploreMode, 'all'>
  label: string
  sub: string
  /**
   * Colour emoji glyph, Airbnb-style — a single small illustration per pill.
   * Rendered via the system emoji font stack; modern OS emoji fonts (Apple
   * Color Emoji, Segoe UI Emoji, Noto Color Emoji) all produce a colourful
   * illustration at nav size without any bespoke SVG work.
   */
  emoji: string
}

const MODES: ModeDef[] = [
  { key: 'hotels', label: 'Hotels', sub: 'Stays & properties', emoji: '🏨' },
  { key: 'tours', label: 'Tours', sub: 'Guided experiences', emoji: '🎈' },
  { key: 'events', label: 'Events', sub: 'Coming soon', emoji: '🎫' },
]

interface ExploreControlsProps {
  activeMode: ExploreMode
  onModeSelect: (mode: Exclude<ExploreMode, 'all'>) => void
  /** Optional label prefix — 'Search hotels', 'Search tours', etc. Falls back to activeMode. */
  searchLabel?: string
  className?: string
}

export function ExploreControls({
  activeMode,
  onModeSelect,
  searchLabel,
  className,
}: ExploreControlsProps) {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  const label =
    searchLabel ??
    (activeMode === 'hotels'
      ? 'hotels'
      : activeMode === 'tours'
        ? 'tours'
        : activeMode === 'events'
          ? 'events'
          : 'stays, tours & more')

  // Submit from the overlay: always land on /search with mode pre-scoped.
  const handleSearch = (filters: SearchFilters) => {
    const params = new URLSearchParams()
    if (filters.query) params.set('q', filters.query)
    if (filters.location) params.set('location', filters.location)
    if (activeMode === 'hotels') params.set('types', 'hotel')
    else if (activeMode === 'tours') params.set('types', 'tour')
    setSearchOpen(false)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <section aria-label="Explore" className={className}>
      {/* Row 1 — search bar + filter + Ask AI. Search button and filter icon
          open the same overlay; Ask AI opens the assistant dialog. */}
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-5 py-3.5 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <span className="truncate text-sm font-semibold text-muted-foreground">
            Search {label}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Filters"
          className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="group inline-flex h-[52px] shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-5 font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105"
        >
          <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>

      {/* Row 2 — the pills. Same three across every page. */}
      <div className="mt-6 flex justify-center">
        <div className="grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-4">
          {MODES.map((m) => {
            const active = activeMode === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onModeSelect(m.key)}
                aria-pressed={active}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
                )}
              >
                <span
                  role="img"
                  aria-hidden
                  // Force the system's colour-emoji font. Without this, some
                  // sans stacks fall through to a monochrome glyph on Windows
                  // and the whole point of the redesign is lost.
                  style={{
                    fontFamily:
                      '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
                    lineHeight: 1,
                  }}
                  className="shrink-0 text-2xl sm:text-3xl"
                >
                  {m.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight sm:text-base">
                    {m.label}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block text-[11px] leading-tight sm:text-xs',
                      active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {m.sub}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Assistant dialog — mounts lazily so nothing is fetched until opened. */}
      <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Ask TripAvail</DialogTitle>
          </DialogHeader>
          {assistantOpen && <TravelAssistant className="max-h-[70vh]" />}
        </DialogContent>
      </Dialog>

      {/* Search overlay — the same one the header used to open. */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
      />
    </section>
  )
}
