import { differenceInCalendarDays, format, startOfToday } from 'date-fns'
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
import { createPortal } from 'react-dom'
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
 * Airbnb pattern: the EXPANDED pill lives in normal document flow directly
 * beneath the fixed SiteHeader — NOT sticky. As the traveller scrolls, the
 * expanded pill scrolls out of view naturally, and a COMPACT summary pill
 * fades INTO the SiteHeader's centre column via React portal. The two
 * chrome layers never stack: on scroll, the header itself BECOMES the
 * search chrome. On scroll back up, the compact pill fades out of the
 * header and the expanded pill re-enters the viewport in its rest position.
 *
 *   • EXPANDED  — tab strip + wide multi-field pill + rose Search circle
 *                 (rendered in flow, always mounted)
 *   • COMPACT   — tab chevron + single-line summary pill + inline search
 *                 circle + Ask AI icon; portalled into
 *                 #siteheader-search-slot when isCompact is true
 *
 * `isCompact` is derived from an IntersectionObserver watching a 1-px
 * sentinel positioned as a SIBLING immediately AFTER the expanded pill.
 * When the sentinel scrolls above the fixed-header line → compact; when
 * it scrolls back below → expanded. No per-frame scroll listener is used.
 * Rendering the expanded pill unconditionally means its height is stable
 * across state flips, so downstream content never jumps.
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

// Suggested destinations are per-tab: a stay-seeker and a trek-seeker are
// looking for different places, so Hotels lists the CITIES where TripAvail
// actually has properties, while Tours lists the trek/adventure REGIONS the
// tours are built around. (They used to share one static list, which is why
// Hotels and Tours showed identical suggestions.) These are search seeds —
// clicking one runs a real search on the active surface.
const DESTINATION_SUGGESTIONS: Record<SearchTab, readonly string[]> = {
  hotels: ['Islamabad', 'Murree', 'Hunza Valley', 'Muzaffarabad', 'Skardu', 'Lahore', 'Karachi'],
  tours: ['Hunza Valley', 'Skardu', 'Fairy Meadows', 'Naran & Kaghan', 'Swat Valley', 'Nathia Gali', 'Kalam'],
  events: ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi'],
}

/** System colour-emoji stack — the fallback if a 3D PNG ever fails to load. */
const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif'

const TABS: readonly { key: SearchTab; label: string; emoji: string; icon: string }[] = [
  // `icon` is a Microsoft Fluent Emoji 3D PNG (MIT-licensed, bundled in
  // public/emoji) so the tab glyphs render as true 3D art identically on every
  // device — not the flat OS font emoji, which differ Windows↔Apple↔Android.
  // `emoji` stays as the graceful fallback.
  { key: 'hotels', label: 'Hotels', emoji: '🏨', icon: '/emoji/hotel.png' },
  { key: 'tours', label: 'Tours', emoji: '🚙', icon: '/emoji/jeep.png' },
  { key: 'events', label: 'Events', emoji: '🎫', icon: '/emoji/ticket.png' },
]

/**
 * A tab glyph rendered as the bundled Fluent 3D PNG, with an automatic fall
 * back to the system colour-emoji glyph if the image 404s or is blocked. `px`
 * is both the box size and the fallback font-size, so the two render at the
 * same footprint. Decorative — aria-hidden, empty alt.
 */
function EmojiIcon({
  src,
  emoji,
  px,
  className,
}: {
  src: string
  emoji: string
  px: number
  className?: string
}): JSX.Element {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span
        aria-hidden
        className={className}
        style={{ fontFamily: EMOJI_FONT, fontSize: px, lineHeight: 1 }}
      >
        {emoji}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      width={px}
      height={px}
      style={{ width: px, height: px }}
      className={cn('emoji-fill shrink-0 select-none object-contain', className)}
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Shared premium popover surface for every field dropdown in the bar (Where,
 * When, Who, single-date). Big radius + deep soft shadow + hairline border =
 * the Airbnb "floating card" look, so all four dropdowns read as one system
 * instead of four default-styled boxes. `rounded-3xl`/`shadow-2xl` reliably
 * win over the PopoverContent base (`rounded-md`/`shadow-md`) because Tailwind
 * emits the larger-scale utility later in the stylesheet.
 */
const POPOVER_PREMIUM =
  'rounded-3xl border border-border/60 bg-popover shadow-2xl shadow-black/20'

/** Larger day cells for the search calendars — the wizard keeps the compact
 *  2rem default; the storefront date pickers get roomier, more tappable days. */
const CALENDAR_ROOMY = '[--cell-size:2.5rem]'

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

  // Portal target — the div SiteHeader renders with id="siteheader-search-slot".
  // Grabbed in useEffect (not during render) so we don't touch the DOM during
  // React's render phase and so SSR-safe environments don't blow up. Null on
  // first render, resolved on mount — first-render is always isCompact=false
  // (page starts at scrollY=0), so no compact portal is needed before then.
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setHeaderSlot(document.getElementById('siteheader-search-slot'))
  }, [])

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

  // ── Scroll morph via a plain passive scroll listener on the sentinel ───
  //
  // We tried IntersectionObserver first, but IO fires unreliably on our
  // sentinel in some browser contexts (verified: even a fresh test IO on
  // any element in the page failed to fire callbacks after scroll). A
  // straight `getBoundingClientRect().top` measurement on scroll is
  // simpler, always fires, and — because React bails when setState is
  // called with the current value — costs one identity check per scroll
  // event when the state hasn't changed. `passive: true` keeps the
  // handler off the scroll-blocking critical path.
  //
  // Threshold: the sentinel sits immediately AFTER the expanded pill.
  // When its top reaches the fixed-header line (80px on desktop, 60px on
  // mobile) the expanded pill has fully scrolled under the header, and
  // we swap to the compact form portalled INTO the header slot.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof window === 'undefined') return
    const HEADER_OFFSET = 80 // desktop; mobile (60) fires slightly earlier — harmless
    const check = (): void => {
      const top = sentinel.getBoundingClientRect().top
      setIsCompact(top <= HEADER_OFFSET)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
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

  return (
    <>
      {/* ── EXPANDED PILL, in flow ────────────────────────────────────────
          Not sticky. Sits directly under the fixed SiteHeader and scrolls
          away naturally as the traveller scrolls. Always mounted — its
          height is stable across compact/expanded flips, so downstream
          content never jumps. */}
      <div className={cn('w-full', className)}>
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 md:py-4">
          <div className="min-w-0 flex-1">
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
          </div>

          {/* Ask AI — beside the expanded bar. Rose gradient, always visible
              in this row. When scrolled, a compact Sparkles icon replaces
              it inside the portalled header pill. */}
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            aria-label="Ask AI"
            className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105"
          >
            <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="hidden md:inline">Ask AI</span>
          </button>
        </div>
      </div>

      {/* Sentinel — sibling AFTER the expanded pill. IO fires when its top
          crosses the fixed-header line (rootMargin -80px), telling us the
          expanded pill is (mostly) out of view → time to render the compact
          pill inside the header slot. */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      {/* ── COMPACT PILL, portalled into SiteHeader ────────────────────────
          Airbnb pattern. When scrolled past the expanded pill, the compact
          form fades INTO the header's centre column via React portal — so
          the header BECOMES the search chrome instead of stacking beneath a
          second sticky band.

          IMPORTANT — AnimatePresence lives INSIDE the portal, not outside.
          createPortal returns a special ReactPortal node that AnimatePresence
          cannot reliably introspect via React.Children (Framer/motion checks
          the child's `type` and `key`; a portal wrapper hides both). Placing
          AP inside the portal target means AP sees the plain motion.div as
          its direct child, so enter/exit animations fire correctly. */}
      {headerSlot
        ? createPortal(
            <AnimatePresence initial={false}>
              {isCompact ? (
                <motion.div
                  key="header-compact"
                  initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex items-center gap-2"
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
                  {/* Ask AI, compact — icon-only sparkle chip so the AI entry
                      stays reachable at any scroll depth without crowding
                      the header's right cluster. */}
                  <button
                    type="button"
                    onClick={() => setAssistantOpen(true)}
                    aria-label="Ask AI"
                    className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm transition-all hover:brightness-105"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            headerSlot,
          )
        : null}

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
      {/* Tab strip — icon size matched to airbnb.com: 28px emoji beside a 14px
          label. Ours previously inherited the 14px text size, so the emoji
          rendered less than half Airbnb's and read as "dull". */}
      <div className="flex items-center justify-center gap-8" role="tablist" aria-label="Search category">
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
                'inline-flex items-center gap-2 border-b-2 pb-2 text-sm font-semibold transition-colors',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <EmojiIcon
                src={t.icon}
                emoji={t.emoji}
                px={30}
                className={t.key === 'tours' ? 'animate-jeep-drive' : undefined}
              />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Field pill — the premium Glass-UI element. Translucent ground with a
          heavy backdrop blur (so hero content ghosts through), a white/10-40
          highlight ring for the glass edge, and a soft, wide black shadow that
          lifts the pill off the page. Matches the previous GlassCard
          variant="light" treatment the header used to carry. */}
      <div className="mx-auto flex w-full max-w-4xl items-stretch rounded-full border border-white/40 dark:border-white/10 bg-background/70 supports-[backdrop-filter]:bg-background/55 backdrop-blur-xl shadow-2xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-shadow">
        <WhereField value={where} onChange={setWhere} onSubmit={onSubmit} tab={tab} />
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
  tab,
}: {
  value: string
  onChange: Dispatch<SetStateAction<string>>
  onSubmit: () => void
  tab: SearchTab
}): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const suggestions = DESTINATION_SUGGESTIONS[tab]
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
      <PopoverContent
        align="start"
        sideOffset={12}
        className={cn(POPOVER_PREMIUM, 'w-[360px] overflow-hidden p-0')}
      >
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
          {suggestions.map((d) => (
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
  // react-day-picker sets `to = from` on the FIRST click (a zero-night range),
  // then extends `to` on the second. So "both ends set" is NOT enough to call
  // the range complete — we require at least one night. Everything downstream
  // (auto-close, header cue, trigger label, clear button) keys off these two
  // flags so a mid-selection first click reads as "still picking check-out"
  // rather than a bogus "Aug 18 – Aug 18".
  const nights = range?.from && range.to ? differenceInCalendarDays(range.to, range.from) : 0
  const hasCompleteRange = nights >= 1
  const hasCheckIn = Boolean(range?.from)
  const display = useMemo<string>(() => {
    if (hasCompleteRange && range?.from && range.to) {
      return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d')}`
    }
    if (range?.from) return `${format(range.from, 'MMM d')} – …`
    return 'Any week'
  }, [range, hasCompleteRange])
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
            <span className={hasCompleteRange ? 'text-foreground' : 'text-muted-foreground'}>
              {display}
            </span>
            {hasCheckIn && (
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
      <PopoverContent
        align="center"
        sideOffset={12}
        className={cn(POPOVER_PREMIUM, 'w-auto overflow-hidden p-0')}
      >
        {/* Header cue — tells the traveller which end of the range they are
            picking, then flips to the resolved range + nights count once both
            ends are set. This is the "second-date allocation" signal: the field
            makes it explicit that a check-in AND a check-out are expected. */}
        <div className="flex items-center justify-between gap-4 px-5 pb-2 pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {hasCompleteRange && range?.from && range.to
                ? `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d')}`
                : range?.from
                  ? 'Select check-out date'
                  : 'Select check-in date'}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasCompleteRange
                ? `${nights} night${nights === 1 ? '' : 's'}`
                : 'Add your travel dates'}
            </p>
          </div>
          {hasCheckIn && (
            <button
              type="button"
              onClick={() => setRange(undefined)}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground underline-offset-2 transition-colors hover:bg-muted hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="px-3 pb-3">
          <Calendar
            mode="range"
            className={CALENDAR_ROOMY}
            selected={range}
            onSelect={(r) => {
              setRange(r)
              // Only auto-close on a REAL range (>= 1 night); the first click
              // yields a zero-night {from:x, to:x} that must keep the calendar
              // open so the traveller can pick their check-out.
              const n = r?.from && r.to ? differenceInCalendarDays(r.to, r.from) : 0
              if (n >= 1) setOpen(false)
            }}
            numberOfMonths={isDesktop ? 2 : 1}
            defaultMonth={range?.from ?? new Date()}
            // No check-in in the past — greys out prior days, Airbnb-style.
            disabled={{ before: startOfToday() }}
          />
        </div>
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
        <PopoverContent
          align="center"
          sideOffset={12}
          className={cn(POPOVER_PREMIUM, 'w-auto p-3')}
        >
          <Calendar
            mode="single"
            className={CALENDAR_ROOMY}
            selected={value}
            onSelect={(d) => {
              onChange(d)
              if (d) setOpen(false)
            }}
            numberOfMonths={isDesktop ? 2 : 1}
            defaultMonth={value ?? new Date()}
            disabled={{ before: startOfToday() }}
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
      <PopoverContent
        align="end"
        sideOffset={12}
        className={cn(POPOVER_PREMIUM, 'w-[320px] p-4')}
      >
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
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/40 dark:border-white/10 bg-background/70 supports-[backdrop-filter]:bg-background/55 backdrop-blur-xl px-3 text-sm font-semibold shadow-xl shadow-black/10 transition-colors hover:bg-muted/60"
          >
            <EmojiIcon
              src={activeTab.icon}
              emoji={activeTab.emoji}
              px={22}
              className={activeTab.key === 'tours' ? 'animate-jeep-drive' : undefined}
            />
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
              <EmojiIcon
                src={t.icon}
                emoji={t.emoji}
                px={20}
                className={t.key === 'tours' ? 'animate-jeep-drive' : undefined}
              />
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
      <div className="inline-flex h-11 items-stretch rounded-full border border-white/40 dark:border-white/10 bg-background/70 supports-[backdrop-filter]:bg-background/55 backdrop-blur-xl pl-4 pr-1 text-sm font-semibold shadow-xl shadow-black/10 transition-shadow hover:shadow-xl hover:shadow-black/20">
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
