import { format } from 'date-fns'
import { Minus, Plus, Search, Sparkles } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { DateRange } from 'react-day-picker'
import { useNavigate } from 'react-router-dom'

import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TravelAssistant } from '@/features/assistant/components/TravelAssistant'
import { cn } from '@/lib/utils'

/**
 * AirbnbSearchBar — the SINGLE search entry point for the whole traveller
 * surface. Replaces SearchOverlay, TripAvailSearchBar, ExploreControls' pill
 * row, and every ad-hoc search input in the header.
 *
 * ── State machine ─────────────────────────────────────────────────────────
 * The wrapper is `position: sticky; top: 0` at ALL times. It never flips to
 * `position: fixed`, so the space it reserves in the document is stable and
 * no scroll-jump can occur when the visual state swaps.
 *
 * Internally it renders exactly ONE of two panels, chosen by `isCompact`:
 *
 *   • EXPANDED  — tab strip + wide multi-field pill + rose Search circle
 *   • COMPACT   — single-line summary pill ("Anywhere · Any week · Add
 *                 guests · 🔎"); clicking any zone re-expands AND scrolls
 *                 the page to the top (Airbnb parity)
 *
 * `isCompact` is derived from an IntersectionObserver watching a 1-px
 * sentinel positioned as a SIBLING immediately BEFORE the sticky wrapper.
 * When the sentinel scrolls out of the viewport → compact; when it scrolls
 * back in → expanded. No per-frame scroll listener is used.
 *
 * ── Field state ────────────────────────────────────────────────────────────
 * `where`, `range`, `singleDate`, `adults`, `kids`, `rooms` PERSIST across
 * tab changes so a traveller who types "Hunza" on Hotels keeps it when they
 * switch to Tours. Date state is stored in two independent slots (range for
 * Hotels, singleDate for Tours/Events) so bouncing Hotels ↔ Tours does not
 * collapse a picked range.
 *
 * Tab switch is O(1) — no query is triggered from this component; the only
 * network call happens on submit, which navigates to `/search` and lets that
 * page own the fetch.
 *
 * ── URL contract on submit (target: /search) ──────────────────────────────
 *   types    hotel | tour               (from tab; events tab does not set
 *                                        `types` because /search has no
 *                                        events surface yet)
 *   q        string                     (from Where)
 *   checkin  YYYY-MM-DD                 (from Check in / When)
 *   checkout YYYY-MM-DD                 (from Check out, Hotels only)
 *   guests   number                     (adults + kids)
 *
 * Kept intentionally identical to what SearchPage already reads — this
 * component does not alter the /search URL contract.
 */

export type SearchTab = 'hotels' | 'tours' | 'events'

export interface AirbnbSearchBarSubmit {
  tab: SearchTab
  where: string
  checkin: string | null
  checkout: string | null
  guests: number
}

export interface AirbnbSearchBarProps {
  /** Which tab is selected on first mount. Default 'hotels'. */
  defaultTab?: SearchTab
  /**
   * Optional controlled tab. If provided, the parent drives which tab is
   * active; internal state falls back for uncontrolled use. The home page
   * uses this to keep its section grid in sync with the bar; /search uses
   * it to sync with the URL's ?types=... param.
   */
  activeTab?: SearchTab
  /**
   * Fires when the traveller clicks a tab. Parents typically use this to
   * update local mode state and/or push a route. Emitted immediately on
   * click, not just at submit — so on the home page clicking Tours in the
   * bar re-scopes the section grid without waiting for a search.
   */
  onTabChange?: (tab: SearchTab) => void
  /** Fires after the URL has been built but before navigation. Optional. */
  onSearch?: (payload: AirbnbSearchBarSubmit) => void
  /** Sticky wrapper class overrides (background, border, extra offset). */
  className?: string
}

const DESTINATION_SUGGESTIONS: readonly string[] = [
  'Hunza Valley',
  'Skardu',
  'Naran & Kaghan',
  'Swat Valley',
  'Fairy Meadows',
  'Lahore',
  'Islamabad',
  'Karachi',
]

const TABS: readonly { key: SearchTab; label: string; emoji: string }[] = [
  { key: 'hotels', label: 'Hotels', emoji: '🏨' },
  { key: 'tours', label: 'Tours', emoji: '🎈' },
  { key: 'events', label: 'Events', emoji: '🎫' },
]

function toIso(d: Date): string {
  // Local-date ISO (YYYY-MM-DD) — using .toISOString() would shift a
  // late-evening pick into the next day for anyone east of UTC.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(min-width: 768px)').matches
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent): void => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export function AirbnbSearchBar({
  defaultTab = 'hotels',
  activeTab,
  onTabChange,
  onSearch,
  className,
}: AirbnbSearchBarProps): JSX.Element {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion() ?? false
  const isDesktop = useIsDesktop()

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [isCompact, setIsCompact] = useState<boolean>(false)

  // Controlled-optional tab: if the parent passes activeTab it wins;
  // otherwise the internal state runs the show. Both paths call
  // handleTabChange, which pushes both directions in sync.
  const [internalTab, setInternalTab] = useState<SearchTab>(activeTab ?? defaultTab)
  const tab = activeTab ?? internalTab
  const handleTabChange = useCallback(
    (next: SearchTab): void => {
      setInternalTab(next)
      onTabChange?.(next)
    },
    [onTabChange],
  )
  // Re-sync when the parent switches routes (e.g. /search?types=tour ->
  // ?types=hotel) so the bar's tab tracks the URL.
  useEffect(() => {
    if (activeTab && activeTab !== internalTab) setInternalTab(activeTab)
    // internalTab intentionally not a dep — we're only reacting to parent flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])
  const [where, setWhere] = useState<string>('')
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined)
  const [adults, setAdults] = useState<number>(2)
  const [kids, setKids] = useState<number>(0)
  const [rooms, setRooms] = useState<number>(1)

  const [assistantOpen, setAssistantOpen] = useState<boolean>(false)

  // ── Scroll morph via IntersectionObserver on a sibling sentinel ────────
  //
  // The rootMargin negative top offset is CRITICAL. SiteHeader is
  // position:fixed top:0 z-50 at 60px on mobile / 80px on desktop. Without
  // this margin the bar would trigger the compact state as soon as its rest
  // position hit the viewport top, sliding UNDER the header (invisible until
  // scrolled further). Matching the sticky offset below to 60/80 keeps them
  // stacking cleanly; we err on the desktop value here so mobile fires
  // slightly earlier — a false positive on mobile is invisible and harmless.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        setIsCompact(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  const guests = adults + kids

  const summaryWhere = where.trim() || 'Anywhere'
  const summaryWhen = useMemo<string>(() => {
    if (tab === 'hotels') {
      if (range?.from && range.to) {
        return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d')}`
      }
      if (range?.from) return `${format(range.from, 'MMM d')} – …`
      return 'Any week'
    }
    return singleDate ? format(singleDate, 'MMM d') : 'Any date'
  }, [tab, range, singleDate])
  const summaryWho = useMemo<string>(() => {
    if (tab === 'events') return guests > 0 ? `${guests} guests` : 'Add guests'
    if (guests === 0) return 'Add guests'
    const g = `${guests} guest${guests === 1 ? '' : 's'}`
    return tab === 'hotels' && rooms > 1 ? `${g}, ${rooms} rooms` : g
  }, [tab, guests, rooms])

  const submit = useCallback((): void => {
    // Events don't have a search results surface yet (the role isn't built),
    // so submitting from the Events tab lands on /events instead of /search
    // with an empty ?types= that would fall through to the 'all' mixed grid
    // and read as a bug.
    if (tab === 'events') {
      onSearch?.({ tab, where: where.trim(), checkin: null, checkout: null, guests })
      navigate('/events')
      return
    }

    const params = new URLSearchParams()
    params.set('types', tab === 'hotels' ? 'hotel' : 'tour')

    const q = where.trim()
    if (q) params.set('q', q)

    let checkin: string | null = null
    let checkout: string | null = null
    if (tab === 'hotels') {
      if (range?.from) checkin = toIso(range.from)
      if (range?.to) checkout = toIso(range.to)
    } else if (singleDate) {
      checkin = toIso(singleDate)
    }
    if (checkin) params.set('checkin', checkin)
    if (checkout) params.set('checkout', checkout)
    if (guests > 0) params.set('guests', String(guests))

    onSearch?.({ tab, where: q, checkin, checkout, guests })
    navigate(`/search?${params.toString()}`)
  }, [tab, where, range, singleDate, guests, onSearch, navigate])

  const expandAndScrollTop = useCallback((): void => {
    // Match Airbnb — clicking the compact pill returns the page to the top
    // so the freshly-expanded fields aren't off-screen. Eager setState avoids
    // waiting a frame for the observer to confirm.
    setIsCompact(false)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    }
  }, [reduceMotion])

  const enterAnim = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: undefined }
    : {
        initial: { opacity: 0, y: -4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
      }

  return (
    <>
      {/* Sentinel — SIBLING before the sticky wrapper, NOT a child. It stays
          behind at the bar's rest position so its intersection tells us
          whether the user has scrolled past it. */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      <div
        className={cn(
          // top-[60px] mobile / md:top-20 (80px) desktop matches SiteHeader's
          // fixed height, so the pinned bar sits FLUSH beneath it instead of
          // being covered. z-40 keeps it above content but below the header.
          //
          // A HARD height (not min-h) matters more than it looks: sticky
          // reserves the element's rendered height, so if compact were shorter
          // than expanded the below-fold content would jump by the delta each
          // morph. h-[120px] fits tab-strip (28) + gap (12) + h-14 pill (56) +
          // top/bottom padding — with room to spare — so both states center
          // inside the same reserved box and nothing jumps.
          'sticky top-[60px] md:top-20 z-40 w-full h-[120px] bg-background/95 supports-[backdrop-filter]:bg-background/70 backdrop-blur transition-shadow',
          isCompact ? 'border-b border-border shadow-sm' : '',
          className,
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <AnimatePresence initial={false} mode="wait">
              {isCompact ? (
                <motion.div
                  key="compact"
                  initial={enterAnim.initial}
                  animate={enterAnim.animate}
                  exit={enterAnim.exit}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="flex justify-center"
                >
                  <CompactPill
                    tab={tab}
                    onTabChange={handleTabChange}
                    where={summaryWhere}
                    when={summaryWhen}
                    who={summaryWho}
                    onExpand={expandAndScrollTop}
                    onSearch={submit}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={enterAnim.initial}
                  animate={enterAnim.animate}
                  exit={enterAnim.exit}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <ExpandedBar
                    tab={tab}
                    onTabChange={handleTabChange}
                    where={where}
                    setWhere={setWhere}
                    range={range}
                    setRange={setRange}
                    singleDate={singleDate}
                    setSingleDate={setSingleDate}
                    adults={adults}
                    setAdults={setAdults}
                    kids={kids}
                    setKids={setKids}
                    rooms={rooms}
                    setRooms={setRooms}
                    isDesktop={isDesktop}
                    onSubmit={submit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ask AI — always visible, rose gradient, sits beside the search bar. */}
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            aria-label="Ask AI"
            className={cn(
              'group inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105',
              isCompact ? 'h-10 px-3' : 'h-11 px-4',
            )}
          >
            <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className={cn(isCompact ? 'hidden sm:inline' : 'hidden md:inline')}>Ask AI</span>
          </button>
        </div>
      </div>

      <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Ask TripAvail</DialogTitle>
          </DialogHeader>
          {assistantOpen && <TravelAssistant className="max-h-[70vh]" />}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Expanded bar ─────────────────────────────────────────────────────────

interface ExpandedBarProps {
  tab: SearchTab
  onTabChange: (t: SearchTab) => void
  where: string
  setWhere: Dispatch<SetStateAction<string>>
  range: DateRange | undefined
  setRange: Dispatch<SetStateAction<DateRange | undefined>>
  singleDate: Date | undefined
  setSingleDate: Dispatch<SetStateAction<Date | undefined>>
  adults: number
  setAdults: Dispatch<SetStateAction<number>>
  kids: number
  setKids: Dispatch<SetStateAction<number>>
  rooms: number
  setRooms: Dispatch<SetStateAction<number>>
  isDesktop: boolean
  onSubmit: () => void
}

function ExpandedBar({
  tab,
  onTabChange,
  where,
  setWhere,
  range,
  setRange,
  singleDate,
  setSingleDate,
  adults,
  setAdults,
  kids,
  setKids,
  rooms,
  setRooms,
  isDesktop,
  onSubmit,
}: ExpandedBarProps): JSX.Element {
  return (
    <div className="flex flex-col items-stretch gap-2">
      {/* Tab strip */}
      <div className="flex items-center justify-center gap-6" role="tablist" aria-label="Search category">
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(t.key)}
              className={cn(
                'inline-flex items-center gap-1.5 border-b-2 pb-1 text-sm font-semibold transition-colors',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                aria-hidden
                style={{
                  fontFamily:
                    '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
                  lineHeight: 1,
                }}
              >
                {t.emoji}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Field pill */}
      <div className="mx-auto flex w-full max-w-4xl items-stretch rounded-full border border-border bg-background shadow-sm hover:shadow-md transition-shadow">
        <WhereField value={where} onChange={setWhere} onSubmit={onSubmit} />
        <Divider />

        {tab === 'hotels' ? (
          <>
            {/* ONE combined "When" field, not two. Airbnb's current bar shows a
                single field labelled "When" with a formatted range value like
                "Aug 12 – 22", opening a range calendar. Two separate Check-in /
                Check-out fields — the pattern this workflow originally produced
                — matches an older Airbnb look and doubles the visual weight of
                the middle of the bar. */}
            <WhenRangeField range={range} setRange={setRange} isDesktop={isDesktop} />
            <Divider />
            <GuestsField
              tab={tab}
              adults={adults}
              setAdults={setAdults}
              kids={kids}
              setKids={setKids}
              rooms={rooms}
              setRooms={setRooms}
              onSubmit={onSubmit}
            />
          </>
        ) : tab === 'tours' ? (
          <>
            <SingleDateField
              label="When"
              value={singleDate}
              onChange={setSingleDate}
              isDesktop={isDesktop}
            />
            <Divider />
            <GuestsField
              tab={tab}
              adults={adults}
              setAdults={setAdults}
              kids={kids}
              setKids={setKids}
              rooms={rooms}
              setRooms={setRooms}
              onSubmit={onSubmit}
            />
          </>
        ) : (
          <SingleDateField
            label="When"
            value={singleDate}
            onChange={setSingleDate}
            isDesktop={isDesktop}
            trailingSearch
            onSubmit={onSubmit}
          />
        )}

        {tab !== 'events' && (
          <div className="flex items-center pr-2">
            <SearchCircle onClick={onSubmit} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Field segments ───────────────────────────────────────────────────────

function Divider(): JSX.Element {
  return <div className="my-2 w-px shrink-0 self-stretch bg-border" aria-hidden />
}

function FieldShell({
  label,
  value,
  onClick,
  children,
  wide,
}: {
  label: string
  value: ReactNode
  onClick?: () => void
  children?: never
  wide?: boolean
}): JSX.Element {
  // children never — this shell only renders the trigger button. The popover
  // primitive wraps this shell from the outside.
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-1 flex-col items-start justify-center rounded-full px-5 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        wide ? 'min-w-[180px]' : 'min-w-[140px]',
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">{label}</span>
      <span className="mt-0.5 truncate text-sm text-muted-foreground group-hover:text-foreground">
        {value}
      </span>
    </button>
  )
}

function WhereField({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: Dispatch<SetStateAction<string>>
  onSubmit: () => void
}): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex flex-1 flex-col items-start justify-center rounded-full px-5 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-w-[180px]"
        >
          <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
            Where
          </span>
          <span
            className={cn(
              'mt-0.5 truncate text-sm',
              value ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {value || 'Search destinations'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={12} className="w-[360px] p-0">
        <div className="border-b border-border p-3">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setOpen(false)
                onSubmit()
              }
            }}
            placeholder="Search destinations"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="max-h-72 overflow-auto p-2">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Suggested destinations
          </p>
          {DESTINATION_SUGGESTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                onChange(d)
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span aria-hidden className="text-lg">📍</span>
              <span className="font-medium text-foreground">{d}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Combined "When" range field — the single field Airbnb's current bar uses in
 * place of separate Check-in / Check-out. Renders the range as one string
 * ("Aug 12 – 22", or "Aug 12 – …" while mid-selection, or "Any week" when
 * empty), and opens a two-month range calendar with a small clear (×) button
 * when a range is picked so the traveller can start over without closing the
 * popover.
 */
function WhenRangeField({
  range,
  setRange,
  isDesktop,
}: {
  range: DateRange | undefined
  setRange: Dispatch<SetStateAction<DateRange | undefined>>
  isDesktop: boolean
}): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const display = useMemo<string>(() => {
    if (range?.from && range.to) {
      return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d')}`
    }
    if (range?.from) return `${format(range.from, 'MMM d')} – …`
    return 'Any week'
  }, [range])
  const hasRange = Boolean(range?.from && range.to)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex flex-1 flex-col items-start justify-center rounded-full px-5 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 min-w-[180px]"
        >
          <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
            When
          </span>
          <span className="mt-0.5 flex items-center gap-2 truncate text-sm">
            <span className={hasRange ? 'text-foreground' : 'text-muted-foreground'}>
              {display}
            </span>
            {hasRange && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear dates"
                onClick={(e) => {
                  e.stopPropagation()
                  setRange(undefined)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted-foreground/10"
              >
                ×
              </span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={12} className="w-auto p-2">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            setRange(r)
            if (r?.from && r.to) setOpen(false)
          }}
          numberOfMonths={isDesktop ? 2 : 1}
          defaultMonth={range?.from ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}

function SingleDateField({
  label,
  value,
  onChange,
  isDesktop,
  trailingSearch,
  onSubmit,
}: {
  label: string
  value: Date | undefined
  onChange: Dispatch<SetStateAction<Date | undefined>>
  isDesktop: boolean
  trailingSearch?: boolean
  onSubmit?: () => void
}): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const display = value ? format(value, 'MMM d') : 'Add date'
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex-1">
            <FieldShell label={label} value={display} onClick={() => setOpen(true)} />
          </div>
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={12} className="w-auto p-2">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              onChange(d)
              if (d) setOpen(false)
            }}
            numberOfMonths={isDesktop ? 2 : 1}
            defaultMonth={value ?? new Date()}
          />
        </PopoverContent>
      </Popover>
      {trailingSearch && onSubmit && (
        <div className="flex items-center pr-2">
          <SearchCircle onClick={onSubmit} />
        </div>
      )}
    </>
  )
}

function GuestsField({
  tab,
  adults,
  setAdults,
  kids,
  setKids,
  rooms,
  setRooms,
  onSubmit,
}: {
  tab: SearchTab
  adults: number
  setAdults: Dispatch<SetStateAction<number>>
  kids: number
  setKids: Dispatch<SetStateAction<number>>
  rooms: number
  setRooms: Dispatch<SetStateAction<number>>
  onSubmit: () => void
}): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const guests = adults + kids
  const display =
    tab === 'events'
      ? guests > 0
        ? `${guests} guests`
        : 'Add guests'
      : guests === 0
        ? 'Add guests'
        : `${guests} guest${guests === 1 ? '' : 's'}${tab === 'hotels' && rooms > 1 ? `, ${rooms} rooms` : ''}`
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex-1">
          <FieldShell label="Who" value={display} onClick={() => setOpen(true)} wide />
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="w-[320px] p-4">
        <StepperRow
          title="Adults"
          sub="Ages 13+"
          value={adults}
          onChange={setAdults}
          min={1}
        />
        <div className="my-3 h-px bg-border" />
        <StepperRow
          title="Children"
          sub="Ages 2 – 12"
          value={kids}
          onChange={setKids}
          min={0}
        />
        {tab === 'hotels' && (
          <>
            <div className="my-3 h-px bg-border" />
            <StepperRow title="Rooms" sub="" value={rooms} onChange={setRooms} min={1} />
          </>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onSubmit()
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:brightness-105"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StepperRow({
  title,
  sub,
  value,
  onChange,
  min,
}: {
  title: string
  sub: string
  value: number
  onChange: Dispatch<SetStateAction<number>>
  min: number
}): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${title}`}
          disabled={value <= min}
          onClick={() => onChange((n) => Math.max(min, n - 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${title}`}
          onClick={() => onChange((n) => n + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SearchCircle({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search"
      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:brightness-105 hover:shadow-md"
    >
      <Search className="h-5 w-5" />
    </button>
  )
}

// ─── Compact pill ─────────────────────────────────────────────────────────

interface CompactPillProps {
  tab: SearchTab
  onTabChange: (t: SearchTab) => void
  where: string
  when: string
  who: string
  onExpand: () => void
  onSearch: () => void
}

function CompactPill({
  tab,
  onTabChange,
  where,
  when,
  who,
  onExpand,
  onSearch,
}: CompactPillProps): JSX.Element {
  const [tabsOpen, setTabsOpen] = useState<boolean>(false)
  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]

  return (
    <div className="flex items-center gap-2">
      {/* Tab chevron — Airbnb tucks tab labels behind a chevron in compact mode. */}
      <Popover open={tabsOpen} onOpenChange={setTabsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Change search category"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-semibold shadow-sm transition-colors hover:bg-muted"
          >
            <span
              aria-hidden
              style={{
                fontFamily:
                  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
                lineHeight: 1,
              }}
            >
              {activeTab.emoji}
            </span>
            <span className="hidden sm:inline">{activeTab.label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-40 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                onTabChange(t.key)
                setTabsOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted',
                t.key === tab && 'text-foreground',
              )}
            >
              <span
                aria-hidden
                style={{
                  fontFamily:
                    '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
                  lineHeight: 1,
                }}
              >
                {t.emoji}
              </span>
              {t.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* The compact summary pill.
       *
       * A previous draft nested a role="button" span inside the outer
       * <button> to get the inline Search circle. That is an invalid content
       * model (interactive-in-interactive) — hydration warns, screen readers
       * fold them into one target, and Enter/Space can bubble ambiguously.
       * Two sibling <button>s inside one visual container solve all three.
       */}
      <div className="inline-flex h-11 items-stretch rounded-full border border-border bg-background pl-4 pr-1 text-sm font-semibold shadow-sm transition-shadow hover:shadow-md">
        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand search"
          className="flex flex-1 items-center gap-0 rounded-l-full py-2 pr-2 text-left"
        >
          <span className="truncate">{where}</span>
          <span className="mx-3 h-4 w-px bg-border" aria-hidden />
          <span className="truncate">{when}</span>
          <span className="mx-3 h-4 w-px bg-border" aria-hidden />
          <span className="truncate text-muted-foreground">{who}</span>
        </button>
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search"
          className="my-1 ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:brightness-105"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
