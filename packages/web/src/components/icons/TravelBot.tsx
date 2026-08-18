import type { SVGProps } from 'react'

/**
 * TravelBot — a friendly robot head with a location-pin antenna.
 *
 * Mono line icon that inherits `currentColor`, so it drops into the rose "Ask AI"
 * chip exactly where the old lucide `Sparkles` sat (`className="h-4 w-4"` still
 * controls the size; the 24×24 viewBox scales down via CSS like every lucide icon).
 * The pin-tipped antenna is the "travelling" cue — reads as a bot that knows places.
 */
export function TravelBot({ strokeWidth = 2, ...props }: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* location-pin antenna */}
      <path d="M12 8.5V6" />
      <path d="M12 6s2-1.7 2-3.1a2 2 0 1 0-4 0c0 1.4 2 3.1 2 3.1Z" />
      {/* head */}
      <rect x="4.5" y="8.5" width="15" height="10" rx="3" />
      {/* side ears — short nubs flush to the head edges */}
      <path d="M4.5 13.5h-2" />
      <path d="M19.5 13.5h2" />
      {/* eyes */}
      <path d="M9.5 12.8v1.6" />
      <path d="M14.5 12.8v1.6" />
      {/* smile */}
      <path d="M9.8 16.4c.7.5 3.7.5 4.4 0" />
    </svg>
  )
}
