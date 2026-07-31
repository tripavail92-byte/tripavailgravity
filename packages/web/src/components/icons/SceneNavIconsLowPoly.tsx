import { motion, useReducedMotion } from 'motion/react'
import { useId, type ReactNode } from 'react'

/**
 * TripAvail scene badges — DIRECTION B, "Low-poly facets".
 *
 * One world, three places: a lodge on the meadow (Hotels), a 4x4 on the
 * mountain road (Tours), an open-air stage in the valley (Events).
 *
 * CANVAS CONTRACT
 *   viewBox="0 0 120 96" rendered at exactly 120x96 CSS px, so 1 unit === 1 px.
 *   Every shape here was sized in pixels. Nothing meaningful is under 4u,
 *   no facet is under 6u across, no stroke is under 2u, and there is no text.
 *
 * LOW-POLY LOGIC
 *   Each mass is built from flat triangular / quad facets, each facet a
 *   different value. Three values per mass are made from two palette
 *   variables plus a --ic-ink (shade) or --ic-snow (lit) overlay, so the
 *   crystalline value structure is what carries the depth — no soft shading.
 *
 * ONE LIGHT
 *   Sun / moon upper-right at (95, 20). Right-facing facets are lit,
 *   left-facing facets are shaded, and every solid recedes up-left along a
 *   consistent (-10, -6) extrusion. Contact-shadow ellipses ground everything.
 *
 * THEME CONTRACT
 *   Every scene colour is a --ic-* custom property declared on the wrapper
 *   <div> via Tailwind arbitrary properties with a `dark:` variant, so the
 *   badge — including its own sky — re-tints with .dark on <html>.
 *   Brand rose (#FF385C / #E11D48 / #FB7185) is deliberately NOT tokenised:
 *   the hero subject stays rose in both themes.
 *
 * TRANSFORM SAFETY
 *   motion writes style.transform onto SVG children and resolves
 *   transform-origin against the bounding box. So a motion element NEVER
 *   carries a transform attribute — a plain <g transform="translate()"> parent
 *   does all positioning — and every rotating group is authored so its
 *   bounding box is symmetric about the intended pivot.
 */

export interface SceneIconProps {
  width?: number
  height?: number
  isActive?: boolean
  className?: string
}

/* Brand rose is FIXED in both themes — it is the brand, it does not re-tint. */
const ROSE = '#FF385C'
const ROSE_DEEP = '#E11D48'
const ROSE_LIGHT = '#FB7185'

/**
 * The one palette. Same names and same light/dark values in all three icons,
 * so the family swaps together. Tailwind 3.4 arbitrary properties; the class
 * literals appear verbatim in source so the JIT emits them.
 */
const SCENE_VARS = [
  '[--ic-sky1:#cfe8ff]',
  'dark:[--ic-sky1:#16233b]',
  '[--ic-sky2:#eaf6ff]',
  'dark:[--ic-sky2:#0f1a2e]',
  // CELESTIAL only — the sun becomes a moon after dark, so this token is the one
  // thing that is *meant* to go cold.
  '[--ic-orb:#FFD84D]',
  'dark:[--ic-orb:#E8EEF9]',
  '[--ic-orb-glow:#FFE9A0]',
  'dark:[--ic-orb-glow:#93A9CC]',
  // ARTIFICIAL light — lodge windows, doorway, headlamp, stage lamps. These must
  // stay WARM in both themes: they are lit bulbs, not daylight. Driving them from
  // --ic-orb (as the first draft did) turned every window cold blue-grey at night
  // and made the Hotels badge read haunted — the opposite of "warm and inviting",
  // and the substance of the client's dark-mode complaint. Lit windows against a
  // night sky are also the strongest thing in the whole dark palette.
  '[--ic-warm:#FFD84D]',
  'dark:[--ic-warm:#FFC53D]',
  '[--ic-warm-glow:#FFE9A0]',
  'dark:[--ic-warm-glow:#FFB84D]',
  '[--ic-peak:#93aacb]',
  'dark:[--ic-peak:#3b4a67]',
  '[--ic-peak-s:#6f88ab]',
  'dark:[--ic-peak-s:#27334a]',
  '[--ic-ridge:#7d97bb]',
  'dark:[--ic-ridge:#33415c]',
  '[--ic-ridge-s:#5d7699]',
  'dark:[--ic-ridge-s:#212c42]',
  '[--ic-snow:#ffffff]',
  'dark:[--ic-snow:#cfdcef]',
  '[--ic-ground:#86c46a]',
  'dark:[--ic-ground:#2f5c45]',
  '[--ic-ground-s:#5f9e4c]',
  'dark:[--ic-ground-s:#204334]',
  '[--ic-tree:#3f7d4e]',
  'dark:[--ic-tree:#1c3b2c]',
  '[--ic-road:#b8b1ad]',
  'dark:[--ic-road:#3a4356]',
  '[--ic-road-s:#968f8b]',
  'dark:[--ic-road-s:#2a3244]',
  '[--ic-ink:#1e293b]',
  'dark:[--ic-ink:#060c18]',
].join(' ')

/** useId() emits ":r0:" in React 18 — colons are illegal inside url(#...). */
function useScopeId(): string {
  return `ic${useId().replace(/[^a-zA-Z0-9]/g, '')}`
}

function inf(duration: number, delay = 0) {
  return { duration, delay, repeat: Infinity, ease: 'easeInOut' as const }
}

function linearLoop(duration: number, delay = 0) {
  return { duration, delay, repeat: Infinity, ease: 'linear' as const }
}

/* ------------------------------------------------------------------ *
 * Shared defs — every id scoped by uid
 * ------------------------------------------------------------------ */

function SceneDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--ic-sky1)" />
        <stop offset="100%" stopColor="var(--ic-sky2)" />
      </linearGradient>

      <radialGradient id={`${uid}-halo`}>
        <stop offset="0%" stopColor="var(--ic-orb-glow)" stopOpacity="0.8" />
        <stop offset="55%" stopColor="var(--ic-orb-glow)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="var(--ic-orb-glow)" stopOpacity="0" />
      </radialGradient>

      {/*
        Beam gradient — userSpaceOnUse, deliberately.

        The first draft used the default objectBoundingBox and assumed the bbox
        spanned the whole symmetric bow-tie (-46..46), putting the bright 50%
        stop at the apex. That is not how it resolves: objectBoundingBox is
        computed PER POLYGON, and each half is only 0..-46, so the transparent
        100% stop landed exactly ON the lamp and the bright band floated
        mid-air. The beams read as two detached lozenges — lens flare, not light.

        userSpaceOnUse resolves against the local coordinate system instead, so
        one gradient runs apex (0,0) -> far end (0,-46): brightest where the
        light actually leaves the lamp, fading with distance. It also rotates
        with the beam group, so the falloff stays anchored as it sweeps.
      */}
      <linearGradient
        id={`${uid}-beam`}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="0"
        x2="0"
        y2="-46"
      >
        <stop offset="0%" stopColor="var(--ic-warm)" stopOpacity="0.62" />
        <stop offset="45%" stopColor="var(--ic-warm-glow)" stopOpacity="0.34" />
        <stop offset="100%" stopColor="var(--ic-warm-glow)" stopOpacity="0" />
      </linearGradient>

      <clipPath id={`${uid}-badge`}>
        <rect x="0" y="0" width="120" height="96" rx="16" ry="16" />
      </clipPath>

      {/* Beams live only in the sky; this band edge is exactly the lamp apex. */}
      <clipPath id={`${uid}-sky40`}>
        <rect x="0" y="0" width="120" height="40" />
      </clipPath>
    </defs>
  )
}

/* ------------------------------------------------------------------ *
 * Clouds — faceted, seamless wrap
 * ------------------------------------------------------------------ */

function Cloud({ op }: { op: number }) {
  return (
    <g>
      {/* 40 x 8 — deliberately low and wide (5:1) so it never reads as a peak */}
      <polygon points="0,8 5,4 12,1 19,4 26,0 33,3 40,8" fill="var(--ic-snow)" opacity={op} />
      {/* 9 x 7 shaded underside facet */}
      <polygon points="5,4 12,1 13,8 4,8" fill="var(--ic-ink)" opacity={0.07} />
    </g>
  )
}

interface CloudRowProps {
  y: number
  x0: number
  s: number
  op: number
  dur: number
  reduce: boolean
}

/**
 * The motif period is exactly 60u and the row translates exactly -60u, so the
 * loop seam is invisible: after one cycle every visible copy has landed on the
 * start position of its neighbour.
 */
function CloudRow({ y, x0, s, op, dur, reduce }: CloudRowProps) {
  return (
    <motion.g
      animate={reduce ? undefined : { x: [0, -60] }}
      transition={reduce ? undefined : linearLoop(dur)}
    >
      {[-60, 0, 60, 120].map((dx) => (
        <g key={dx} transform={`translate(${x0 + dx} ${y}) scale(${s})`}>
          <Cloud op={op} />
        </g>
      ))}
    </motion.g>
  )
}

/* ------------------------------------------------------------------ *
 * Conifer — 14 x 23 at scale 1, three facet values
 * ------------------------------------------------------------------ */

interface TreeProps {
  x: number
  y: number
  s: number
}

/**
 * Sway is a rotation of the WHOLE rigid tree about its base — no articulated
 * parts. Rig: a static parent <g> does the positioning and scaling; the
 * motion.g contents are symmetric about x=0 with their bottom exactly at y=0,
 * so transformBox:'fill-box' + transformOrigin:'50% 100%' pins the pivot to
 * the trunk base without depending on motion's default origin.
 */
/**
 * Static by design. These carried a +/-1.6deg sway, which on a 23u tree is a
 * 0.32px tip displacement — below one pixel, so it delivered no visible motion
 * while promoting each tree to its own compositor layer and shimmering the
 * antialiasing. Nine of them across the three badges, running forever, on a nav
 * row mounted on every route. The scene reads as alive from the clouds, the
 * orb and the hero subject; the trees do not need to move.
 */
function Tree({ x, y, s }: TreeProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g>
        {/* trunk 5 x 7 */}
        <rect x={-2.5} y={-7} width={5} height={7} fill="var(--ic-road-s)" />
        {/* lower skirt 14 x 11 — shaded left facet, lit right facet */}
        <polygon points="-7,-4 7,-4 0,-15" fill="var(--ic-tree)" />
        <polygon points="-7,-4 0,-4 0,-15" fill="var(--ic-ink)" opacity={0.22} />
        <polygon points="0,-4 7,-4 0,-15" fill="var(--ic-snow)" opacity={0.12} />
        {/* upper cone 11 x 11 */}
        <polygon points="-5.5,-12 5.5,-12 0,-23" fill="var(--ic-tree)" />
        <polygon points="-5.5,-12 0,-12 0,-23" fill="var(--ic-ink)" opacity={0.22} />
        <polygon points="0,-12 5.5,-12 0,-23" fill="var(--ic-snow)" opacity={0.12} />
      </g>
    </g>
  )
}

/* ------------------------------------------------------------------ *
 * Backdrop — sky, orb, clouds, two faceted peaks, mid ridge, ground
 * ------------------------------------------------------------------ */

interface BackdropProps {
  uid: string
  reduce: boolean
  fast: boolean
}

function Backdrop({ uid, reduce, fast }: BackdropProps) {
  return (
    <g>
      {/* sky fills the entire badge — no transparent corners */}
      <rect x="0" y="0" width="120" height="96" fill={`url(#${uid}-sky)`} />

      {/* halo breathes by animating r / opacity — no transform, no origin math */}
      <motion.circle
        cx="95"
        cy="20"
        r={17}
        fill={`url(#${uid}-halo)`}
        opacity={fast ? 0.85 : 0.7}
        animate={
          reduce
            ? undefined
            : { r: [17, 21, 17], opacity: fast ? [0.7, 1, 0.7] : [0.55, 0.85, 0.55] }
        }
        transition={reduce ? undefined : inf(fast ? 2.6 : 4.6)}
      />

      {/* orb: faceted octagon, 18px across, ~6.9u per edge */}
      <polygon
        points="103.3,23.4 98.4,28.3 91.6,28.3 86.7,23.4 86.7,16.6 91.6,11.7 98.4,11.7 103.3,16.6"
        fill="var(--ic-orb)"
      />

      {/* drifting clouds, two parallax rows */}
      <CloudRow y={9} x0={0} s={1} op={0.46} dur={fast ? 20 : 34} reduce={reduce} />
      <CloudRow y={28} x0={32} s={0.8} op={0.3} dur={fast ? 32 : 52} reduce={reduce} />

      {/* ---- far peak A (left, big): 4 facets + faceted snowcap ---- */}
      <polygon points="26,19 -4,62 12,62 33,40" fill="var(--ic-peak-s)" />
      <polygon points="33,40 12,62 40,62" fill="var(--ic-peak-s)" />
      <polygon points="33,40 12,62 40,62" fill="var(--ic-ink)" opacity={0.14} />
      <polygon points="26,19 33,40 40,62 54,62" fill="var(--ic-peak)" />
      <polygon points="26,19 54,62 66,62" fill="var(--ic-peak)" />
      <polygon points="26,19 54,62 66,62" fill="var(--ic-snow)" opacity={0.14} />
      {/* snowcap A — 14 x 15 */}
      <polygon points="26,19 34,29 29,33 21,34 20,28" fill="var(--ic-snow)" />
      <polygon points="26,19 20,28 21,34 26,31" fill="var(--ic-ink)" opacity={0.16} />

      {/* ---- far peak B (right) ---- */}
      <polygon points="78,28 58,62 76,62 83,44" fill="var(--ic-peak-s)" />
      <polygon points="83,44 76,62 88,62" fill="var(--ic-peak-s)" />
      <polygon points="83,44 76,62 88,62" fill="var(--ic-ink)" opacity={0.14} />
      <polygon points="78,28 83,44 88,62 100,62" fill="var(--ic-peak)" />
      <polygon points="78,28 100,62 112,62" fill="var(--ic-peak)" />
      <polygon points="78,28 100,62 112,62" fill="var(--ic-snow)" opacity={0.14} />
      {/* snowcap B — 10 x 10 */}
      <polygon points="78,28 84,35 80,38 74,37 75.5,33" fill="var(--ic-snow)" />
      <polygon points="78,28 75.5,33 74,37 78,36" fill="var(--ic-ink)" opacity={0.16} />

      {/* ---- mid ridge: 7 facets, lit on the down-to-the-right slopes ---- */}
      <polygon points="-4,60 14,48 14,72 -4,72" fill="var(--ic-ridge-s)" />
      <polygon points="14,48 30,58 30,72 14,72" fill="var(--ic-ridge)" />
      <polygon points="30,58 48,46 48,72 30,72" fill="var(--ic-ridge-s)" />
      <polygon points="48,46 66,57 66,72 48,72" fill="var(--ic-ridge)" />
      <polygon points="66,57 86,50 86,72 66,72" fill="var(--ic-ridge-s)" />
      <polygon points="86,50 104,58 104,72 86,72" fill="var(--ic-ridge)" />
      <polygon points="104,58 124,52 124,72 104,72" fill="var(--ic-ridge-s)" />

      {/* ---- ground plane: 4 big facets, each 28u+ wide ---- */}
      <polygon points="-4,66 26,63 16,100 -4,100" fill="var(--ic-ground)" />
      <polygon points="26,63 56,67 44,100 16,100" fill="var(--ic-ground-s)" />
      <polygon points="56,67 88,62 80,100 44,100" fill="var(--ic-ground)" />
      <polygon points="88,62 124,66 124,100 80,100" fill="var(--ic-ground-s)" />
    </g>
  )
}

/* ------------------------------------------------------------------ *
 * Badge shell
 * ------------------------------------------------------------------ */

interface ShellProps {
  uid: string
  width: number
  height: number
  className?: string
  label: string
  children: ReactNode
}

function Shell({ uid, width, height, className, label, children }: ShellProps) {
  return (
    <div
      className={`${SCENE_VARS}${className ? ` ${className}` : ''}`}
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'inline-block',
        lineHeight: 0,
      }}
    >
      <svg
        viewBox="0 0 120 96"
        width={width}
        height={height}
        role="img"
        aria-label={label}
        style={{ display: 'block' }}
      >
        <SceneDefs uid={uid} />
        <g clipPath={`url(#${uid}-badge)`}>{children}</g>
      </svg>
    </div>
  )
}

/* ================================================================== *
 * 1. HOTEL — a proper premium property, no mountains
 * ================================================================== */

/**
 * Backdrop for the hotel: sky, orb, clouds and a plaza — deliberately NO
 * mountain range. The peaks belong to the Tours badge, where the road runs
 * through them; behind a city hotel they made it read as a ski chalet.
 * A soft haze band sits on the horizon so the sky does not meet the plaza
 * as a hard line.
 */
function PlazaBackdrop({ uid, reduce, fast }: BackdropProps) {
  return (
    <g>
      <rect x="0" y="0" width="120" height="96" fill={`url(#${uid}-sky)`} />

      <motion.circle
        cx="99"
        cy="18"
        r={16}
        fill={`url(#${uid}-halo)`}
        opacity={fast ? 0.85 : 0.7}
        animate={
          reduce
            ? undefined
            : { r: [16, 20, 16], opacity: fast ? [0.7, 1, 0.7] : [0.55, 0.85, 0.55] }
        }
        transition={reduce ? undefined : inf(fast ? 2.6 : 4.6)}
      />
      <polygon
        points="106.4,20.8 102.2,25 96.2,25 92,20.8 92,14.8 96.2,10.6 102.2,10.6 106.4,14.8"
        fill="var(--ic-orb)"
      />

      <CloudRow y={11} x0={0} s={1} op={0.4} dur={fast ? 22 : 36} reduce={reduce} />
      <CloudRow y={30} x0={40} s={0.75} op={0.26} dur={fast ? 34 : 56} reduce={reduce} />

      {/* horizon haze — softens sky into ground without adding a skyline */}
      <rect x="0" y="62" width="120" height="10" fill="var(--ic-snow)" opacity={0.14} />

      {/* plaza: three wide facets, the middle one lit as the approach */}
      <polygon points="-4,70 44,68 30,100 -4,100" fill="var(--ic-ground-s)" />
      <polygon points="44,68 84,68 92,100 30,100" fill="var(--ic-ground)" />
      <polygon points="84,68 124,70 124,100 92,100" fill="var(--ic-ground-s)" />
    </g>
  )
}

/** Slim resort palm — a premium cue that reads at 120x96 without fine fronds. */
function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* trunk 4 x 22 */}
      <rect x={-2} y={-22} width={4} height={22} fill="var(--ic-road-s)" />
      {/* crown: five fat fronds, each ~11 x 7 — no hairlines */}
      <polygon points="0,-22 -13,-27 -2,-25" fill="var(--ic-tree)" />
      <polygon points="0,-22 -9,-33 -1,-26" fill="var(--ic-tree)" />
      <polygon points="0,-22 2,-35 4,-26" fill="var(--ic-tree)" />
      <polygon points="0,-22 12,-32 3,-25" fill="var(--ic-tree)" />
      <polygon points="0,-22 14,-24 3,-22" fill="var(--ic-tree)" />
      {/* lit right-hand fronds */}
      <polygon points="0,-22 12,-32 3,-25" fill="var(--ic-snow)" opacity={0.16} />
      <polygon points="0,-22 14,-24 3,-22" fill="var(--ic-snow)" opacity={0.16} />
    </g>
  )
}

export function LodgeSceneIcon({
  width = 120,
  height = 96,
  isActive = false,
  className,
}: SceneIconProps) {
  const uid = useScopeId()
  const reduce = useReducedMotion() ?? false
  const fast = isActive && !reduce

  const winDur = fast ? 2 : 3.6

  /* Window grid: 3 columns x 4 rows of 9 x 8 panes, 4.5u apart — every pane is
     comfortably over the 4px floor, and the gaps survive rasterisation too. */
  const cols = [-18, -4.5, 9]
  const rows = [-54, -43, -32, -21]

  return (
    <Shell uid={uid} width={width} height={height} className={className} label="Premium hotel">
      <PlazaBackdrop uid={uid} reduce={reduce} fast={fast} />

      {/* ---- the hotel: origin at the front-wall base centre ---- */}
      <g transform="translate(58 82)">
        <ellipse cx={-3} cy={1.5} rx={34} ry={5} fill="var(--ic-ink)" opacity={0.2} />

        {/* warm light spilling across the approach */}
        <motion.ellipse
          cx={0}
          cy={2}
          rx={20}
          ry={5}
          fill="var(--ic-warm-glow)"
          opacity={0.3}
          animate={reduce ? undefined : { opacity: fast ? [0.32, 0.58, 0.32] : [0.24, 0.42, 0.24] }}
          transition={reduce ? undefined : inf(winDur)}
        />

        {/* LOW WING on the right — gives the property mass and a real skyline */}
        <polygon points="22,0 22,-26 32,-32 32,-6" fill="var(--ic-road)" />
        <rect x={22} y={-26} width={16} height={26} fill="var(--ic-road-s)" />
        <polygon points="22,-26 38,-26 48,-32 32,-32" fill="var(--ic-snow)" opacity={0.2} />

        {/* TOWER — receding side plane on the family (-10,-6) extrusion */}
        <polygon points="-22,0 -32,-6 -32,-64 -22,-58" fill="var(--ic-road-s)" />
        {/* front facade 44 x 58 */}
        <rect x={-22} y={-58} width={44} height={58} fill="var(--ic-road)" />
        {/* roof top plane */}
        <polygon points="-22,-58 22,-58 12,-64 -32,-64" fill="var(--ic-snow)" opacity={0.22} />
        {/* lit right edge of the facade */}
        <rect x={14} y={-58} width={8} height={58} fill="var(--ic-snow)" opacity={0.13} />

        {/* rose crown band + mast — the premium signature at the top */}
        <rect x={-24} y={-64} width={48} height={6} fill={ROSE} />
        <polygon points="-24,-64 24,-64 14,-70 -34,-70" fill={ROSE_DEEP} />
        <rect x={-2} y={-80} width={3} height={11} fill="var(--ic-road-s)" />

        {/* lit window grid */}
        <motion.g
          animate={reduce ? undefined : { opacity: fast ? [0.84, 1, 0.84] : [0.72, 0.97, 0.72] }}
          transition={reduce ? undefined : inf(winDur)}
        >
          {rows.map((ry) =>
            cols.map((cx) => (
              <g key={`${cx}-${ry}`}>
                <rect x={cx} y={ry} width={9} height={8} fill="var(--ic-warm)" />
                {/* shaded reveal on the left of each pane — reads as depth */}
                <rect x={cx} y={ry} width={3} height={8} fill="var(--ic-ink)" opacity={0.18} />
              </g>
            )),
          )}
        </motion.g>

        {/* PORTE-COCHERE — the entrance canopy. Deck + two columns. */}
        <polygon points="-26,-16 26,-16 34,-22 -18,-22" fill={ROSE_LIGHT} />
        <rect x={-26} y={-16} width={52} height={5} fill={ROSE} />
        <rect x={-24} y={-11} width={4} height={11} fill="var(--ic-road-s)" />
        <rect x={20} y={-11} width={4} height={11} fill="var(--ic-road-s)" />

        {/* glazed entrance 18 x 11, warm inside, mullion splitting the doors */}
        <rect x={-9} y={-11} width={18} height={11} fill="var(--ic-warm-glow)" opacity={0.95} />
        <rect x={-1.5} y={-11} width={3} height={11} fill="var(--ic-ink)" opacity={0.28} />
      </g>

      {/* palms flanking the approach — resort premium, not alpine */}
      <Palm x={16} y={88} s={1.15} />
      <Palm x={104} y={92} s={1} />
    </Shell>
  )
}

/* ================================================================== *
 * 2. JEEP — Tours (hero)
 * ================================================================== */

/** One road dash, pre-rotated onto the road axis. bbox 16 x 13 at scale 1. */
const DASH_POINTS = '4.65,-6.58 8.03,0.66 -4.65,6.58 -8.03,-0.66'

/** Roadside rock, 12 x 9, two facets. */
function Rock() {
  return (
    <g>
      <polygon points="-6,4 -4,-3 1,-5 6,1 5,4" fill="var(--ic-road)" />
      <polygon points="-6,4 -4,-3 1,-5 0,4" fill="var(--ic-road-s)" />
    </g>
  )
}

/**
 * Wheel rig, stated plainly:
 *
 *   <g transform="translate(cx cy)">          <- static parent: ALL positioning
 *     <motion.g transformBox: fill-box        <- rotation, nothing else
 *               transformOrigin: '50% 50%'>
 *       ...contents centred on (0,0)...
 *     </motion.g>
 *   </g>
 *
 * The outermost content is a tyre circle of r=7 centred on the origin, so the
 * fill-box bounding box is exactly -7..7 on both axes and its centre IS the
 * origin. The pivot is therefore the axle no matter how motion resolves its
 * default origin, and motion never writes a transform onto a child shape.
 */
function Wheel({ cx, cy, reduce, dur }: { cx: number; cy: number; reduce: boolean; dur: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={reduce ? undefined : linearLoop(dur)}
      >
        {/* tyre 14px */}
        <circle cx={0} cy={0} r={7} fill="var(--ic-ink)" />
        {/* rim 9px */}
        <circle cx={0} cy={0} r={4.5} fill="var(--ic-road)" />
        {/*
          ONE asymmetric spoke, not two opposing facets.

          The first draft used two quarter-pie facets in --ic-road-s on
          --ic-road: a ~12% lightness step inside a 9px disc, tapering to a
          point. Two problems — it was nearly invisible at 1x, and being
          180-degree rotationally symmetric it halved the apparent period and
          strobed rather than turned. A single full-width bar in brand rose
          breaks the symmetry (so one rotation reads as one rotation) and
          carries real chroma against the grey rim.
        */}
        <rect x={-4.5} y={-1.4} width={9} height={2.8} rx={1.4} fill={ROSE_DEEP} />
        <circle cx={0} cy={0} r={1.6} fill="var(--ic-road-s)" />
      </motion.g>
    </g>
  )
}

export function JeepSceneIcon({
  width = 120,
  height = 96,
  isActive = false,
  className,
}: SceneIconProps) {
  const uid = useScopeId()
  const reduce = useReducedMotion() ?? false
  const fast = isActive && !reduce

  const scrollDur = fast ? 1.5 : 2.6
  const rockDur = scrollDur * 1.6
  const wheelDur = fast ? 0.7 : 1.25
  const bounceDur = fast ? 0.62 : 1.05

  return (
    <Shell
      uid={uid}
      width={width}
      height={height}
      className={className}
      label="4x4 on a mountain road"
    >
      <Backdrop uid={uid} reduce={reduce} fast={fast} />

      {/* ---- road: two facets, narrow at the horizon, wide at the viewer ---- */}
      {/*
        The near end is deliberately wide. Measured against the first draft: at
        the wheel contact line (y=82) the old road ran x 32.5..69.5 — 37u of
        tarmac under a 54u-wide vehicle, so both tyres sat 4.5u out on the grass.
        Widening the near end to -20 / 74 carries ~56u at y=82, so the 4x4 is
        actually ON its road with a verge either side.
      */}
      <polygon points="82,64 92,64 74,96 -20,96" fill="var(--ic-road)" />
      <polygon points="82,64 87,64 27,96 -20,96" fill="var(--ic-road-s)" />

      {/* ---- centre dashes scrolling toward the viewer ---- */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform="translate(85 66)">
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            initial={false}
            animate={
              reduce
                ? undefined
                : { x: [0, -60], y: [0, 28], scale: [0.62, 1.15], opacity: [0, 0.9, 0.9, 0] }
            }
            transition={reduce ? undefined : linearLoop(scrollDur, (i * scrollDur) / 3)}
          >
            <polygon points={DASH_POINTS} fill="var(--ic-snow)" opacity={0.85} />
          </motion.g>
        </g>
      ))}

      {/* ---- roadside rocks streaming past on the far verge ---- */}
      {[0, 1].map((i) => (
        <g key={i} transform="translate(97 66)">
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            initial={false}
            animate={
              reduce
                ? undefined
                : { x: [0, -23], y: [0, 26], scale: [0.68, 1.25], opacity: [0, 1, 1, 0] }
            }
            transition={reduce ? undefined : linearLoop(rockDur, (i * rockDur) / 2)}
          >
            <Rock />
          </motion.g>
        </g>
      ))}

      <Tree x={106} y={74} s={1} />
      <Tree x={96} y={92} s={1.2} />
      <Tree x={13} y={86} s={1.25} />

      {/* ---- the 4x4: origin at the wheel contact line ---- */}
      <g transform="translate(50 82)">
        {/* Contact shadow. cy sits just under the contact line — at cy=8 (the
            first draft) its top edge was 3.5px clear of the tyres, leaving a
            band of bare grass under the hero and detaching the vehicle from the
            ground. The lodge and stage both use cy 1..1.5; this now matches. */}
        <motion.ellipse
          cx={1}
          cy={0.5}
          rx={30}
          ry={3.5}
          fill="var(--ic-ink)"
          opacity={0.22}
          animate={reduce ? undefined : { rx: [30, 27, 30], opacity: [0.22, 0.16, 0.22] }}
          transition={reduce ? undefined : inf(bounceDur)}
        />

        {/* the body rides the suspension; the wheels stay planted */}
        <motion.g
          animate={reduce ? undefined : { y: fast ? [0, -2, 0, 1.4, 0] : [0, -1.5, 0, 1, 0] }}
          transition={reduce ? undefined : inf(bounceDur)}
        >
          {/*
            THE 4x4 IS BUILT LIKE THE REST OF THE FAMILY — this is the fix that
            matters. The first draft rendered it as a pure side elevation whose
            only "lit" shapes were horizontal tint BANDS across the flank. That
            made it (a) the single flat object in a set whose whole premise is
            faceted depth, and (b) lit from the TOP while every peak, the lodge
            and the stage are lit from the upper right. Two lighting models in
            one row, and the flat one on the hero the client is judging.

            Now the vehicle recedes up-left on the same (-10,-6) extrusion the
            lodge and stage use, so it has genuine TOP planes: a bonnet, a rear
            deck and a cabin roof, each a parallelogram offset by that vector.
            Drawn first, so the near-side faces below occlude them correctly.
          */}

          {/* body TOP plane — the bonnet fore of the cabin and the deck aft of it */}
          <polygon points="-22,-26 28,-26 18,-32 -32,-32" fill={ROSE_LIGHT} />
          {/* cabin roof TOP plane */}
          <polygon points="-7,-41 18,-41 8,-47 -17,-47" fill={ROSE_LIGHT} />
          {/* cabin far-side sliver, catching the light from the right */}
          <polygon points="18,-41 18,-26 8,-32 8,-47" fill={ROSE} />

          {/* roof rack + cargo box, sitting ON the roof plane. Trimmed from the
              first draft's 33-wide bar, which overhung the 25-wide roof by 4u
              at each end and floated over open sky. */}
          <polygon points="-11,-44 12,-44 5,-48 -18,-48" fill="var(--ic-warm)" />
          <polygon points="-18,-48 -11,-44 -11,-42 -18,-46" fill="var(--ic-ink)" opacity={0.2} />

          {/* cabin 31 x 15, raked windscreen */}
          <polygon points="-13,-26 -13,-31 -7,-41 18,-41 18,-26" fill={ROSE} />
          {/* glass: 10 x 9 raked front, 9 x 9 rear, 4-wide B-pillar between */}
          <polygon points="-9,-26 -9,-31.5 -5,-35 1,-35 1,-26" fill="var(--ic-sky2)" />
          <rect x={5} y={-35} width={9} height={9} fill="var(--ic-sky2)" />

          {/* body 54 wide, chamfered nose */}
          <polygon points="-26,-21 -22,-26 28,-26 28,-9 -26,-9" fill={ROSE} />
          {/* front-quarter face on the light-facing end — a real plane, not a band */}
          <polygon points="28,-26 28,-9 18,-15 18,-32" fill={ROSE_DEEP} opacity={0.55} />
          {/* dark sill / skirt, 6 tall */}
          <rect x={-26} y={-15} width={54} height={6} fill={ROSE_DEEP} />
          {/* headlamp 7 x 5 */}
          <rect x={-25} y={-20} width={7} height={5} fill="var(--ic-warm)" />
        </motion.g>

        <Wheel cx={-15} cy={-7} reduce={reduce} dur={wheelDur} />
        <Wheel cx={17} cy={-7} reduce={reduce} dur={wheelDur} />
      </g>
    </Shell>
  )
}

/* ================================================================== *
 * 3. CROWD — Events
 * ================================================================== */

/**
 * One festival-goer, arms up, feet at the local origin.
 *
 * Built as a SILHOUETTE, not an articulated figure: a head disc, a tapered
 * torso and two raised arms, all one flat ink colour. At 120x96 a person is
 * ~20u tall, so limbs are 3u bars — anything thinner, or any attempt to
 * animate joints, turns to grey haze. The raised-arms pose is what makes a
 * dark blob read as a CELEBRATING person rather than a bollard, so it is the
 * one silhouette detail worth the pixels.
 *
 * The jump is a whole-body translate. No rotation, no origin maths.
 */
function Reveller({
  x,
  y,
  s,
  tone,
  hop,
  dur,
  delay,
  reduce,
}: {
  x: number
  y: number
  s: number
  tone: string
  hop: number
  dur: number
  delay: number
  reduce: boolean
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <motion.g
        animate={reduce ? undefined : { y: [0, -hop, 0] }}
        transition={reduce ? undefined : inf(dur, delay)}
      >
        {/* raised arms — 3u bars, drawn first so the torso caps their roots */}
        <polygon points="-3,-13 -6,-14 -10,-23 -6.5,-24" fill={tone} />
        <polygon points="3,-13 6,-14 10,-23 6.5,-24" fill={tone} />
        {/* torso 9 x 13, tapered */}
        <polygon points="-4.5,0 4.5,0 3.5,-14 -3.5,-14" fill={tone} />
        {/* head 7u */}
        <circle cx={0} cy={-17.5} r={3.5} fill={tone} />
      </motion.g>
    </g>
  )
}

export function StageSceneIcon({
  width = 120,
  height = 96,
  isActive = false,
  className,
}: SceneIconProps) {
  const uid = useScopeId()
  const reduce = useReducedMotion() ?? false
  const fast = isActive && !reduce

  const hopDur = fast ? 0.62 : 0.95
  const beamDur = fast ? 2.4 : 3.8

  /* Back row: smaller, lighter, and hopping out of phase with the front so the
     crowd never pulses as one block. Front row: bigger and darker = nearer. */
  const backRow = [10, 30, 50, 70, 90, 110]
  const frontRow = [0, 20, 40, 60, 80, 100, 120]

  return (
    <Shell uid={uid} width={width} height={height} className={className} label="Live events">
      <PlazaBackdrop uid={uid} reduce={reduce} fast={fast} />

      {/* ---- stage: a lit bandshell the crowd is facing ---- */}
      <g transform="translate(60 66)">
        {/* shell back wall + receding side on the family extrusion */}
        <polygon points="-30,0 -40,-6 -40,-28 -30,-22" fill="var(--ic-road-s)" />
        <rect x={-30} y={-22} width={60} height={22} fill="var(--ic-road)" />
        <polygon points="-30,-22 30,-22 20,-28 -40,-28" fill="var(--ic-snow)" opacity={0.2} />
        {/* rose proscenium arch */}
        <rect x={-32} y={-26} width={64} height={6} fill={ROSE} />
        <rect x={-32} y={-26} width={8} height={6} fill={ROSE_DEEP} />

        {/* the lit screen behind the performers */}
        <motion.rect
          x={-24}
          y={-18}
          width={48}
          height={14}
          fill="var(--ic-warm)"
          opacity={0.85}
          animate={reduce ? undefined : { opacity: fast ? [0.7, 1, 0.7] : [0.6, 0.9, 0.6] }}
          transition={reduce ? undefined : inf(fast ? 1.4 : 2.4)}
        />

        {/* stage deck */}
        <rect x={-34} y={0} width={68} height={6} fill="var(--ic-road-s)" />
      </g>

      {/* ---- sweeping light beams, clipped to the sky band ---- */}
      <g clipPath={`url(#${uid}-sky40)`}>
        {[
          { x: 34, swing: 16, delay: 0 },
          { x: 86, swing: -16, delay: beamDur / 2 },
        ].map((b) => (
          <g key={b.x} transform={`translate(${b.x} 40)`}>
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              animate={reduce ? undefined : { rotate: [-b.swing, b.swing, -b.swing] }}
              transition={reduce ? undefined : inf(beamDur, b.delay)}
            >
              <polygon points="0,0 -9,-46 9,-46" fill={`url(#${uid}-beam)`} />
            </motion.g>
          </g>
        ))}
      </g>

      {/* ---- confetti drifting down over the crowd ---- */}
      {[
        { x: 18, c: ROSE, d: 0 },
        { x: 44, c: 'var(--ic-warm)', d: 1.1 },
        { x: 72, c: ROSE_LIGHT, d: 0.5 },
        { x: 98, c: 'var(--ic-warm)', d: 1.7 },
      ].map((f) => (
        <g key={f.x} transform={`translate(${f.x} 26)`}>
          <motion.rect
            x={-2.5}
            y={0}
            width={5}
            height={5}
            fill={f.c}
            opacity={0}
            animate={reduce ? undefined : { y: [0, 46], opacity: [0, 1, 1, 0] }}
            transition={reduce ? undefined : linearLoop(fast ? 2.6 : 4.2, f.d)}
          />
        </g>
      ))}

      {/* ---- THE CROWD — two rows of jumping silhouettes ---- */}
      {backRow.map((cx, i) => (
        <Reveller
          key={`b${cx}`}
          x={cx}
          y={80}
          s={0.82}
          tone="var(--ic-ridge-s)"
          hop={3}
          dur={hopDur * 1.15}
          delay={(i % 3) * 0.22}
          reduce={reduce}
        />
      ))}
      {frontRow.map((cx, i) => (
        <Reveller
          key={`f${cx}`}
          x={cx}
          y={94}
          s={1.05}
          tone="var(--ic-ink)"
          hop={4.5}
          dur={hopDur}
          delay={(i % 4) * 0.16}
          reduce={reduce}
        />
      ))}
    </Shell>
  )
}
