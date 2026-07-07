import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'

// System-driven icon resolvers (Lucide-based) — tourTypeIcon, tourFeatureIcon,
// amenityIcon, packageTypeIcon. Custom brand line-icons live below.
export * from './registry'

export interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

const DEFAULTS = { size: 26, color: '#0f172a', strokeWidth: 1.8 }

/** Shared stroke props for a clean, consistent line-icon look. */
function strokeProps(color: string, strokeWidth: number) {
  return {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  }
}

function svgProps(size: number) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const }
}

// ── Category / experience icons ──────────────────────────────────────────────

export function MountainIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg {...svgProps(size)}>
      <Path d="M2 19 L8 9 L12 14 L16 7 L22 19 Z" {...strokeProps(color, strokeWidth)} />
    </Svg>
  )
}

export function LeafIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg {...svgProps(size)}>
      <Path d="M5 19 C 5 11 11 5 19 5 C 19 13 13 19 5 19 Z" {...strokeProps(color, strokeWidth)} />
      <Path d="M6 18 L18 6" {...strokeProps(color, strokeWidth)} />
    </Svg>
  )
}

export function LandmarkIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  const s = strokeProps(color, strokeWidth)
  return (
    <Svg {...svgProps(size)}>
      <Path d="M4 9 L12 4 L20 9" {...s} />
      <Line x1="3" y1="20" x2="21" y2="20" {...s} />
      <Line x1="6" y1="9" x2="6" y2="20" {...s} />
      <Line x1="10" y1="9" x2="10" y2="20" {...s} />
      <Line x1="14" y1="9" x2="14" y2="20" {...s} />
      <Line x1="18" y1="9" x2="18" y2="20" {...s} />
    </Svg>
  )
}

export function CompassIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  const s = strokeProps(color, strokeWidth)
  return (
    <Svg {...svgProps(size)}>
      <Circle cx="12" cy="12" r="9" {...s} />
      <Path d="M15.5 8.5 L11 11 L8.5 15.5 L13 13 Z" {...s} />
    </Svg>
  )
}

export function MapPinIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  const s = strokeProps(color, strokeWidth)
  return (
    <Svg {...svgProps(size)}>
      <Path d="M12 21 C 8 16 5.5 12.5 5.5 9 A 6.5 6.5 0 1 1 18.5 9 C 18.5 12.5 16 16 12 21 Z" {...s} />
      <Circle cx="12" cy="9" r="2.3" {...s} />
    </Svg>
  )
}

export function TentIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  const s = strokeProps(color, strokeWidth)
  return (
    <Svg {...svgProps(size)}>
      <Path d="M3 20 L12 6 L21 20 Z" {...s} />
      <Path d="M9.5 20 L12 13 L14.5 20" {...s} />
    </Svg>
  )
}

export function SunIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  const s = strokeProps(color, strokeWidth)
  return (
    <Svg {...svgProps(size)}>
      <Circle cx="12" cy="12" r="4" {...s} />
      <Line x1="12" y1="2" x2="12" y2="4" {...s} />
      <Line x1="12" y1="20" x2="12" y2="22" {...s} />
      <Line x1="2" y1="12" x2="4" y2="12" {...s} />
      <Line x1="20" y1="12" x2="22" y2="12" {...s} />
      <Line x1="4.9" y1="4.9" x2="6.3" y2="6.3" {...s} />
      <Line x1="17.7" y1="17.7" x2="19.1" y2="19.1" {...s} />
      <Line x1="19.1" y1="4.9" x2="17.7" y2="6.3" {...s} />
      <Line x1="4.9" y1="19.1" x2="6.3" y2="17.7" {...s} />
    </Svg>
  )
}

export function DropletIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg {...svgProps(size)}>
      <Path
        d="M12 3 C 12 3 5.5 10.5 5.5 15 A 6.5 6.5 0 0 0 18.5 15 C 18.5 10.5 12 3 12 3 Z"
        {...strokeProps(color, strokeWidth)}
      />
    </Svg>
  )
}

export function CameraIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  const s = strokeProps(color, strokeWidth)
  return (
    <Svg {...svgProps(size)}>
      <Rect x="3" y="7" width="18" height="13" rx="3" {...s} />
      <Path d="M8.5 7 L10 4 H14 L15.5 7" {...s} />
      <Circle cx="12" cy="13.5" r="3.3" {...s} />
    </Svg>
  )
}

export function RoadIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  const s = strokeProps(color, strokeWidth)
  return (
    <Svg {...svgProps(size)}>
      <Path d="M9 3 L5 21" {...s} />
      <Path d="M15 3 L19 21" {...s} />
      <Line x1="12" y1="5" x2="12" y2="8" {...s} />
      <Line x1="12" y1="11" x2="12" y2="14" {...s} />
      <Line x1="12" y1="17" x2="12" y2="20" {...s} />
    </Svg>
  )
}

// ── UI icons ─────────────────────────────────────────────────────────────────

export function StarIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg {...svgProps(size)}>
      <Path
        d="M12 3 L14.2 8.6 L20.2 9.1 L15.6 13 L17 18.9 L12 15.7 L7 18.9 L8.4 13 L3.8 9.1 L9.8 8.6 Z"
        {...strokeProps(color, strokeWidth)}
      />
    </Svg>
  )
}

export function HeartIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg {...svgProps(size)}>
      <Path
        d="M12 21 C 12 21 4 15 4 9 C 4 6.2 6.2 4 9 4 C 10.6 4 11.4 4.8 12 6 C 12.6 4.8 13.4 4 15 4 C 17.8 4 20 6.2 20 9 C 20 15 12 21 12 21 Z"
        {...strokeProps(color, strokeWidth)}
      />
    </Svg>
  )
}
