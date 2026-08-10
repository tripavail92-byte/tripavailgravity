import { useId, type CSSProperties, type ReactElement } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type IconProps = {
  width?: number
  height?: number
  isActive?: boolean
  className?: string
}

const PALETTE =
  '[--sk1:#ffd9b8] dark:[--sk1:#1e1830] ' +
  '[--sk2:#ffb59a] dark:[--sk2:#4a2f3a] ' +
  '[--sun:#ffd88a] dark:[--sun:#ffe0a8] ' +
  '[--sun-glow:#ffe0b0] dark:[--sun-glow:#ff9a6a] ' +
  '[--wall:#f4dfb2] dark:[--wall:#8a6a48] ' +
  '[--wall-s:#d0af82] dark:[--wall-s:#5a4530] ' +
  '[--roof:#d97a5a] dark:[--roof:#a35a3f] ' +
  '[--roof-s:#a04a35] dark:[--roof-s:#6a3a2a] ' +
  '[--ground:#e8c896] dark:[--ground:#4a3628] ' +
  '[--ground-s:#c99a75] dark:[--ground-s:#2f2018] ' +
  '[--plant:#9dc48a] dark:[--plant:#4a5a4a] ' +
  '[--road:#b8a898] dark:[--road:#4a3f38] ' +
  '[--road-s:#8a7565] dark:[--road-s:#2a2018] ' +
  '[--peak:#c1a7c8] dark:[--peak:#6a5570] ' +
  '[--peak-s:#8a6d90] dark:[--peak-s:#40304a] ' +
  '[--snow:#fff2d8] dark:[--snow:#d9c9a8] ' +
  '[--ink:#2e2540] dark:[--ink:#0a0510] ' +
  '[--warm:#ffcc7a] dark:[--warm:#ffc070] ' +
  '[--warm-glow:#ffb060] dark:[--warm-glow:#ff8040]'

const wrapperStyle = (w: number, h: number): CSSProperties => ({
  width: w,
  height: h,
  borderRadius: 16,
  overflow: 'hidden',
  display: 'inline-block',
  lineHeight: 0,
})

function useScopedId(): string {
  const raw = useId()
  return 'ic' + raw.replace(/[^a-zA-Z0-9]/g, '')
}

export function HotelStoryIcon({
  width = 120,
  height = 96,
  isActive = false,
  className,
}: IconProps): ReactElement {
  const uid = useScopedId()
  const reduced = useReducedMotion()
  const active = isActive && !reduced

  const topWindows = [22, 34, 46, 74, 86, 96]
  const midWindows = [22, 34, 86, 96]

  return (
    <div
      className={`${PALETTE}${className ? ' ' + className : ''}`}
      style={wrapperStyle(width, height)}
    >
      <svg
        viewBox="0 0 120 96"
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={`${uid}sky`}
            x1="0"
            y1="0"
            x2="0"
            y2="96"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--sk1)" />
            <stop offset="1" stopColor="var(--sk2)" />
          </linearGradient>
          <radialGradient id={`${uid}sun`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--sun)" />
            <stop offset="1" stopColor="var(--sun)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}entry`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--warm-glow)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--warm-glow)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* sky */}
        <rect width="120" height="96" fill={`url(#${uid}sky)`} />

        {/* sun halo + disc */}
        <circle cx="100" cy="14" r="18" fill={`url(#${uid}sun)`} />
        <circle cx="100" cy="14" r="7" fill="var(--sun)" />

        {/* ground band. Highlight stripe raised to 4u — the earlier 2u fell
            below the "min feature 4 units" floor and antialiased to hairline. */}
        <rect x="0" y="72" width="120" height="24" fill="var(--ground)" />
        <rect
          x="0"
          y="72"
          width="120"
          height="4"
          fill="var(--ground-s)"
          opacity="0.4"
        />

        {/* contact shadow */}
        <ellipse
          cx="60"
          cy="73.5"
          rx="48"
          ry="2.5"
          fill="var(--ink)"
          opacity="0.18"
        />

        {/* flanking hedges */}
        <ellipse cx="12" cy="76" rx="10" ry="5" fill="var(--plant)" />
        <ellipse cx="108" cy="76" rx="10" ry="5" fill="var(--plant)" />

        {/* main body */}
        <rect x="18" y="32" width="84" height="40" rx="3" fill="var(--wall)" />
        {/* soft right-side shade */}
        <rect
          x="94"
          y="32"
          width="8"
          height="40"
          rx="3"
          fill="var(--wall-s)"
          opacity="0.4"
        />

        {/* roof cap. Shade band raised to 4u — the earlier 3u sat under the
            min-feature floor and rendered as an anti-aliased seam. */}
        <rect x="14" y="26" width="92" height="7" rx="2" fill="var(--roof)" />
        <rect
          x="14"
          y="29"
          width="92"
          height="4"
          fill="var(--roof-s)"
          opacity="0.55"
        />

        {/* balcony bands */}
        <rect
          x="18"
          y="42"
          width="84"
          height="4"
          fill="var(--wall-s)"
          opacity="0.55"
        />
        <rect
          x="18"
          y="56"
          width="84"
          height="4"
          fill="var(--wall-s)"
          opacity="0.55"
        />

        {/* top-storey windows */}
        {topWindows.map((x) => (
          <rect
            key={`t${x}`}
            x={x}
            y="35"
            width="6"
            height="6"
            rx="1"
            fill="var(--warm)"
          />
        ))}
        {/* middle-storey windows (skip centre 36-unit awning zone) */}
        {midWindows.map((x) => (
          <rect
            key={`m${x}`}
            x={x}
            y="49"
            width="6"
            height="6"
            rx="1"
            fill="var(--warm)"
          />
        ))}

        {/* rose marquee (between top windows) */}
        <rect x="54" y="35" width="18" height="6" rx="1" fill="#FF385C" />

        {/* lobby windows flanking entrance */}
        <rect x="22" y="62" width="10" height="8" rx="1" fill="var(--warm)" />
        <rect x="88" y="62" width="10" height="8" rx="1" fill="var(--warm)" />

        {/* porte-cochere warm halo (pulses) */}
        <motion.circle
          cx="60"
          cy="66"
          r="18"
          fill={`url(#${uid}entry)`}
          animate={reduced ? undefined : { opacity: [0.75, 1, 0.75] }}
          transition={
            reduced
              ? undefined
              : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
          }
        />

        {/* porte-cochere arch — the focal point. Deliberately a distinct warm
            hue (--warm-glow, deeper amber) so the eye lands on the entrance
            instead of losing it in the field of identical --warm windows. */}
        <path
          d="M 46 72 L 46 62 Q 46 54 60 54 Q 74 54 74 62 L 74 72 Z"
          fill="var(--warm-glow)"
        />

        {/* rose entrance canopy */}
        <rect x="42" y="50" width="36" height="4" rx="2" fill="#FF385C" />

        {active && (
          <motion.rect
            x="54"
            y="35"
            width="18"
            height="6"
            rx="1"
            fill="#FB7185"
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </svg>
    </div>
  )
}

export function JeepStoryIcon({
  width = 120,
  height = 96,
  isActive = false,
  className,
}: IconProps): ReactElement {
  const uid = useScopedId()
  const reduced = useReducedMotion()
  const active = isActive && !reduced

  /*
   * Asymmetric 3-spoke Y — not a cross.
   *
   * A 4-fold-symmetric cross looks identical every 90deg, so a 2.4s rotation
   * reads as a static twitch rather than a spin. A 3-spoke Y is only symmetric
   * every 120deg AND is chromatically distinct on all three arms (one rose to
   * break the cool-neutral palette), so the eye can lock a reference point and
   * see the wheel actually turn.
   */
  const wheelSpokes = (
    <>
      <line x1="0" y1="0" x2="0" y2="-5.5" stroke="#FF385C" strokeWidth="2" strokeLinecap="round" />
      <line
        x1="0"
        y1="0"
        x2="4.76"
        y2="2.75"
        stroke="var(--wall)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="0"
        x2="-4.76"
        y2="2.75"
        stroke="var(--wall)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  )

  const spinTransition = reduced
    ? undefined
    : { duration: 2.4, repeat: Infinity, ease: 'linear' as const }

  return (
    <div
      className={`${PALETTE}${className ? ' ' + className : ''}`}
      style={wrapperStyle(width, height)}
    >
      <svg
        viewBox="0 0 120 96"
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={`${uid}sky`}
            x1="0"
            y1="0"
            x2="0"
            y2="96"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--sk1)" />
            <stop offset="1" stopColor="var(--sk2)" />
          </linearGradient>
          <radialGradient id={`${uid}sun`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--sun)" />
            <stop offset="1" stopColor="var(--sun)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* sky */}
        <rect width="120" height="96" fill={`url(#${uid}sky)`} />

        {/* setting sun (peaks will crop the halo) */}
        <circle cx="92" cy="18" r="18" fill={`url(#${uid}sun)`} />
        <circle cx="92" cy="18" r="7" fill="var(--sun)" />

        {/* back peak (dominant) */}
        <path d="M 40 72 L 82 18 L 122 72 Z" fill="var(--peak)" />
        <path
          d="M 82 18 L 122 72 L 96 72 Z"
          fill="var(--peak-s)"
          opacity="0.55"
        />
        {/* snow cap */}
        <path
          d="M 68 34 L 82 18 L 96 34 L 88 27 L 82 32 L 76 27 Z"
          fill="var(--snow)"
        />

        {/* front peak */}
        <path d="M -2 72 L 28 38 L 58 72 Z" fill="var(--peak)" />
        <path
          d="M 28 38 L 58 72 L 40 72 Z"
          fill="var(--peak-s)"
          opacity="0.55"
        />
        <path
          d="M 20 48 L 28 38 L 36 48 L 32 44 L 28 47 L 24 44 Z"
          fill="var(--snow)"
        />

        {/* road. Top edge raised to 4u so it survives at 1u==1px. */}
        <rect x="0" y="72" width="120" height="24" fill="var(--road)" />
        <rect
          x="0"
          y="72"
          width="120"
          height="4"
          fill="var(--road-s)"
          opacity="0.5"
        />
        {/* road dashes */}
        <rect
          x="14"
          y="83"
          width="24"
          height="4"
          rx="1"
          fill="var(--wall)"
          opacity="0.55"
        />
        <rect
          x="82"
          y="83"
          width="24"
          height="4"
          rx="1"
          fill="var(--wall)"
          opacity="0.55"
        />

        {/* contact shadow */}
        <ellipse
          cx="60"
          cy="83"
          rx="26"
          ry="2"
          fill="var(--ink)"
          opacity="0.22"
        />

        {/* jeep — whole body bounces */}
        <motion.g
          animate={reduced ? undefined : { y: [0, -0.8, 0, -1.4, 0] }}
          transition={
            reduced
              ? undefined
              : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {/* body */}
          <rect x="38" y="58" width="44" height="14" rx="3" fill="#FF385C" />
          {/* two-tone lit face */}
          <rect
            x="38"
            y="58"
            width="44"
            height="4"
            rx="3"
            fill="#FB7185"
            opacity="0.75"
          />
          {/* cabin */}
          <path
            d="M 46 58 L 50 48 L 70 48 L 74 58 Z"
            fill="#E11D48"
          />
          {/* windshield reflection */}
          <path
            d="M 52 50 L 55 56 L 65 56 L 68 50 Z"
            fill="var(--sun-glow)"
          />
          {/* roof rack */}
          <rect x="48" y="44" width="24" height="4" rx="1" fill="var(--ink)" />
          {/* headlight (warm both themes) */}
          <rect x="78" y="62" width="4" height="4" rx="1" fill="var(--warm)" />

          {/* rear wheel — static parent translate, rotation on symmetric child */}
          <g transform="translate(48 76)">
            <circle cx="0" cy="0" r="6.5" fill="var(--ink)" />
            <motion.g
              animate={reduced ? undefined : { rotate: 360 }}
              transition={spinTransition}
            >
              {wheelSpokes}
            </motion.g>
          </g>
          {/* front wheel */}
          <g transform="translate(72 76)">
            <circle cx="0" cy="0" r="6.5" fill="var(--ink)" />
            <motion.g
              animate={reduced ? undefined : { rotate: 360 }}
              transition={spinTransition}
            >
              {wheelSpokes}
            </motion.g>
          </g>
        </motion.g>

        {active && (
          /* cx is animated from 40 -> 12, but without an initial cx attribute
             the SVG element renders at cx=0 for one frame each time isActive
             flips true — a visible pop behind the wrong wheel. */
          <motion.ellipse
            cx={40}
            cy="80"
            rx="8"
            ry="3"
            fill="var(--wall-s)"
            animate={{ opacity: [0, 0.6, 0], cx: [40, 24, 12] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </svg>
    </div>
  )
}

export function CrowdStoryIcon({
  width = 120,
  height = 96,
  isActive = false,
  className,
}: IconProps): ReactElement {
  const uid = useScopedId()
  const reduced = useReducedMotion()
  const active = isActive && !reduced

  const jumpers: ReadonlyArray<{ x: number; delay: number }> = [
    { x: 18, delay: 0 },
    { x: 46, delay: 0.5 },
    { x: 74, delay: 0.25 },
    { x: 102, delay: 0.75 },
  ]

  return (
    <div
      className={`${PALETTE}${className ? ' ' + className : ''}`}
      style={wrapperStyle(width, height)}
    >
      <svg
        viewBox="0 0 120 96"
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={`${uid}sky`}
            x1="0"
            y1="0"
            x2="0"
            y2="96"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--sk1)" />
            <stop offset="1" stopColor="var(--sk2)" />
          </linearGradient>
          <radialGradient id={`${uid}sun`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--sun)" />
            <stop offset="1" stopColor="var(--sun)" stopOpacity="0" />
          </radialGradient>
          {/* userSpaceOnUse: safe for the two symmetric beam polygons */}
          <linearGradient
            id={`${uid}beam`}
            x1="0"
            y1="42"
            x2="0"
            y2="72"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--warm)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--warm)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* sky */}
        <rect width="120" height="96" fill={`url(#${uid}sky)`} />

        {/* sun/moon behind bandshell */}
        <circle cx="60" cy="20" r="18" fill={`url(#${uid}sun)`} />
        <circle cx="60" cy="20" r="8" fill="var(--sun)" />

        {/* bandshell arch */}
        <path
          d="M 18 68 L 18 52 Q 18 28 60 28 Q 102 28 102 52 L 102 68 Z"
          fill="var(--wall)"
        />
        {/* inner shadow */}
        <path
          d="M 24 68 L 24 54 Q 24 34 60 34 Q 96 34 96 54 L 96 68 Z"
          fill="var(--wall-s)"
          opacity="0.45"
        />

        {/* rose banner across arch top */}
        <rect x="30" y="30" width="60" height="6" rx="2" fill="#FF385C" />

        {/* stage platform */}
        <rect x="14" y="68" width="92" height="6" rx="1" fill="var(--wall-s)" />
        <rect
          x="14"
          y="68"
          width="92"
          height="2"
          fill="var(--wall)"
          opacity="0.5"
        />

        {/* spotlights */}
        <circle cx="38" cy="42" r="3" fill="var(--warm)" />
        <circle cx="82" cy="42" r="3" fill="var(--warm)" />

        {/* beams (shared userSpaceOnUse gradient — safe across both) */}
        <path d="M 38 45 L 24 72 L 52 72 Z" fill={`url(#${uid}beam)`} />
        <path d="M 82 45 L 68 72 L 96 72 Z" fill={`url(#${uid}beam)`} />

        {/* ground */}
        <rect x="0" y="88" width="120" height="8" fill="var(--ground-s)" />
        <rect
          x="0"
          y="86"
          width="120"
          height="4"
          fill="var(--ground)"
          opacity="0.5"
        />

        {/*
         * Crowd silhouettes.
         *
         * Two fixes from review:
         *   1. Y-clipping — bodies extended to y=90 while the ground band
         *      starts at y=88, so feet sliced INTO the stage. Head, torso and
         *      arms are all raised by 2u so the feet sit at y=88 exactly.
         *   2. Idle loop budget — four constant bouncers on a nav row loaded
         *      every page visit is exactly the fidget the perf commit fixed.
         *      They now translate on active only. At idle the crowd is still
         *      a crowd — jumping is the celebration cue, not the "is it a
         *      person?" cue.
         */}
        {jumpers.map((p) => (
          <motion.g
            key={p.x}
            animate={active ? { y: [0, -4, 0] } : undefined}
            transition={
              active
                ? {
                    duration: 1.4,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: 'easeInOut',
                  }
                : undefined
            }
          >
            <circle cx={p.x} cy={66} r="4" fill="var(--ink)" />
            <rect
              x={p.x - 5}
              y={70}
              width={10}
              height={18}
              rx="3"
              fill="var(--ink)"
            />
            <rect
              x={p.x - 10}
              y={60}
              width={4}
              height={14}
              rx="2"
              fill="var(--ink)"
            />
            <rect
              x={p.x + 6}
              y={60}
              width={4}
              height={14}
              rx="2"
              fill="var(--ink)"
            />
          </motion.g>
        ))}

        {active && (
          <motion.circle
            cx="60"
            r="4"
            fill="#FF385C"
            animate={{ cy: [38, 84], opacity: [1, 1, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeIn',
              times: [0, 0.85, 1],
            }}
          />
        )}
      </svg>
    </div>
  )
}
