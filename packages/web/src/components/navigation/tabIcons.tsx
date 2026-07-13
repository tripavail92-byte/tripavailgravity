// Custom premium tab glyphs for the mobile bottom bar. Each renders a solid silhouette (filled with
// currentColor) when active and a clean outline when idle — the two-state iOS look, no background
// chip. Colour comes from the parent via `currentColor`, so text-primary / text-muted-foreground
// on the <svg> drive the active/idle tint.

export interface TabIconProps {
  active?: boolean
  className?: string
}

function svgProps(active?: boolean) {
  return {
    viewBox: '0 0 24 24',
    fill: active ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 1.4 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

export function HomeTabIcon({ active, className }: TabIconProps) {
  return (
    <svg className={className} {...svgProps(active)}>
      <path d="M12 3 L20.4 10.2 a1 1 0 0 1 .35 .75 V19 a2 2 0 0 1-2 2 h-3.9 v-5.1 a1.35 1.35 0 0 0-1.35-1.35 h-1.4 a1.35 1.35 0 0 0-1.35 1.35 V21 H5.25 a2 2 0 0 1-2-2 v-8.05 a1 1 0 0 1 .35-.75 Z" />
    </svg>
  )
}

/** Trips — a hiking figure mid-stride holding a trekking pole. Line-art figure (limbs stay stroked);
 *  the head fills and strokes thicken when active. */
export function HikerTabIcon({ active, className }: TabIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.1 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="4" r="2.1" fill={active ? 'currentColor' : 'none'} />
      {/* torso + both legs */}
      <path d="M10.4 6.3 L11.3 12.9 L8.4 20.5 M11.3 12.9 L14.2 16 L15 20.5" />
      {/* back arm + front arm reaching to the pole */}
      <path d="M10.6 8.1 L8.2 11.6 M10.6 8.1 L14.6 10.9" />
      {/* trekking pole */}
      <path d="M15.3 6.6 L17.2 20.6" />
    </svg>
  )
}

/** Hotels — a hotel building. Solid silhouette with window + doorway cut-outs when active (evenodd),
 *  a clean outline when idle. */
export function HotelTabIcon({ active, className }: TabIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 1.2 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 21 V6 A1.5 1.5 0 0 1 6 4.5 H18 A1.5 1.5 0 0 1 19.5 6 V21 H14 V17.5 A1.5 1.5 0 0 0 12.5 16 H11.5 A1.5 1.5 0 0 0 10 17.5 V21 Z M6.2 7 H8.2 V9 H6.2 Z M11 7 H13 V9 H11 Z M15.8 7 H17.8 V9 H15.8 Z M6.2 11 H8.2 V13 H6.2 Z M15.8 11 H17.8 V13 H15.8 Z"
      />
    </svg>
  )
}

export function UserTabIcon({ active, className }: TabIconProps) {
  return (
    <svg className={className} {...svgProps(active)}>
      <circle cx="12" cy="8" r="4" />
      {active ? (
        <path d="M5 20.3 a7 7 0 0 1 14 0 a1 1 0 0 1-.98 .95 H5.98 A1 1 0 0 1 5 20.3 Z" />
      ) : (
        <path d="M5 20 a7 7 0 0 1 14 0" />
      )}
    </svg>
  )
}
