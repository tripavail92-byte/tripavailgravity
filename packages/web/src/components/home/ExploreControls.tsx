import { AirbnbSearchBar, type SearchTab } from '@/components/search/AirbnbSearchBar'
import { cn } from '@/lib/utils'

/**
 * ExploreControls is now a thin wrapper around <AirbnbSearchBar>. The old
 * multi-row layout (search button + filter + Ask AI + Hotels/Tours/Events
 * pills + SearchOverlay + assistant Dialog) has been replaced entirely by
 * the single sticky, morphing search bar — one search UI per page, that is
 * it.
 *
 * The ExploreMode + onModeSelect API is preserved because every browse page
 * still mounts <ExploreControls> and reads the traveller's mode. When the
 * caller passes `onModeSelect`, we forward the search bar's tab changes so
 * home-page section switching + browse-page navigation both keep working.
 *
 * The bar's own tab strip (rose underline) IS the pill row now — there is
 * no separate pill grid below the bar.
 */
export type ExploreMode = 'all' | 'hotels' | 'tours' | 'events'

interface ExploreControlsProps {
  activeMode: ExploreMode
  onModeSelect?: (mode: Exclude<ExploreMode, 'all'>) => void
  /** Kept for API compatibility; the AirbnbSearchBar's Where field uses its
   *  own placeholder text ("Search destinations"), so this prop is now
   *  effectively unused. Left in the signature so callsites keep compiling. */
  searchLabel?: string
  className?: string
}

/** Map the caller-facing ExploreMode ('all' | 'hotels' | 'tours' | 'events')
 *  to the bar's tab key. 'all' has no tab equivalent — we default to Hotels. */
function modeToTab(mode: ExploreMode): SearchTab {
  return mode === 'all' ? 'hotels' : mode
}

export function ExploreControls({
  activeMode,
  onModeSelect,
  className,
}: ExploreControlsProps): JSX.Element {
  const tab = modeToTab(activeMode)
  return (
    <section aria-label="Explore" className={cn(className)}>
      <AirbnbSearchBar
        // Controlled tab: parent drives which tab is active, so tab clicks
        // update the host page's mode (home-page section grid) or navigate
        // (browse pages) BEFORE the traveller submits. Without controlled +
        // onTabChange the home grid ignored bar tab clicks entirely.
        activeTab={tab}
        onTabChange={(nextTab) => {
          onModeSelect?.(nextTab)
        }}
        onSearch={(payload) => {
          if (onModeSelect && payload.tab !== undefined) {
            onModeSelect(payload.tab)
          }
        }}
      />
    </section>
  )
}
