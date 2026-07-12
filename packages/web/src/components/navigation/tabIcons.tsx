// Custom premium tab glyphs for the mobile bottom bar. Each renders a solid silhouette (filled with
// currentColor) when active and a clean outline when idle — the two-state iOS look, no background
// chip. Colour comes from the parent via `currentColor`, so text-primary / text-muted-foreground
// on the <svg> drive the active/idle tint. The thin same-colour stroke on the active fill keeps the
// silhouette corners softly rounded.

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

export function MountainTabIcon({ active, className }: TabIconProps) {
  return (
    <svg className={className} {...svgProps(active)}>
      <path d="M2.5 19.5 L8.5 7.9 a1 1 0 0 1 1.78 0 L13 13 L15.7 8.3 a1 1 0 0 1 1.78 .02 L21.5 19.5 Z" />
    </svg>
  )
}

export function BedTabIcon({ active, className }: TabIconProps) {
  return (
    <svg className={className} {...svgProps(active)}>
      <path d="M2.5 18 v-3 a3 3 0 0 1 3-3 h5.5 v-1.5 a2.5 2.5 0 0 1 2.5-2.5 h3.5 a3 3 0 0 1 3 3 V18 a1 1 0 0 1-2 0 v-.5 H4.5 V18 a1 1 0 0 1-2 0 Z" />
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
