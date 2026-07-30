import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useId, useState } from 'react'

/**
 * TripAvail premium nav icons — Direction C, "Luminous depth".
 *
 * One family, three subjects. Shared DNA:
 *  - 48x48 grid, object bbox roughly y6..y36, ground shadow ellipse below.
 *  - Faux-3D by layered paths: front face (white -> #f8fafc -> #e2e8f0),
 *    extruded side/top face (#e2e8f0 -> #cbd5e1) offset by exactly (+3, -2).
 *  - Single light logic: warm key bloom top-left, shadowed faces right.
 *  - Volumetric rose ambient bleeding past the silhouette.
 *  - A clipped diagonal glint that sweeps across every surface.
 *  - Gold emissives that pulse, rose structural accents, gold/rose sparkles when lit.
 *
 * Every <defs> id is scoped with useId() so the three can coexist on one page.
 */

export interface PremiumIconProps {
  size?: number
  isActive?: boolean
  className?: string
}

/** Four-point sparkle, centred on the origin, half-extent 3 units. */
const SPARKLE_D =
  'M0 -3C0.36 -1.12 1.12 -0.36 3 0C1.12 0.36 0.36 1.12 0 3C-0.36 1.12 -1.12 0.36 -3 0C-1.12 -0.36 -0.36 -1.12 0 -3Z'

/** useId() emits ":r0:" / "«r0»" depending on React version — strip to a safe id token. */
function useScopedId(prefix: string): string {
  const raw = useId()
  return `${prefix}${raw.replace(/[^a-zA-Z0-9]/g, '')}`
}

/** Staggered spring entrance, collapsed to a no-op under reduced motion. */
function enter(reduce: boolean, delay: number) {
  return {
    initial: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: reduce
      ? { duration: 0 }
      : { delay, type: 'spring' as const, stiffness: 220, damping: 20, mass: 0.7 },
  }
}

interface DefsProps {
  uid: string
}

/** Gradient set shared by all three icons so the family stays colour-identical. */
function CoreDefs({ uid }: DefsProps) {
  return (
    <>
      <linearGradient id={`${uid}-front`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="52%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>

      <linearGradient id={`${uid}-side`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>

      <linearGradient id={`${uid}-deep`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>

      <linearGradient id={`${uid}-base`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>

      <linearGradient id={`${uid}-rose`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="48%" stopColor="#FF385C" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>

      <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF3C4" />
        <stop offset="45%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>

      <linearGradient id={`${uid}-snow`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#FFE1E7" />
      </linearGradient>

      <linearGradient id={`${uid}-sheen`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      <linearGradient id={`${uid}-glint`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="42%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="58%" stopColor="#FFE4EA" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      <radialGradient id={`${uid}-ambient`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF385C" stopOpacity="0.4" />
        <stop offset="55%" stopColor="#FF6B85" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#FF385C" stopOpacity="0" />
      </radialGradient>


      <radialGradient id={`${uid}-goldGlow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFD24D" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#FFB020" stopOpacity="0" />
      </radialGradient>

      <radialGradient id={`${uid}-roseGlow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF385C" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#FF385C" stopOpacity="0" />
      </radialGradient>
    </>
  )
}

interface AuraProps {
  uid: string
  lit: boolean
  reduce: boolean
}

/**
 * Volumetric rose bleed behind the subject. Identical in all three icons.
 *
 * There used to be a second element here: a gold "key light" circle pinned at
 * (12.5, 10.5). It was meant to read as a light source but rendered as a
 * detached gold smudge in the upper-left of every tile — three reviewers
 * independently flagged it, and it reproduced the exact "not centred" look this
 * work was commissioned to fix. The ambient bleed below is centred on the tile
 * and does the atmospheric job on its own.
 */
function Aura({ uid, lit, reduce }: AuraProps) {
  return (
    <motion.ellipse
      cx="24"
      cy="23"
      rx="21"
      ry="20"
      fill={`url(#${uid}-ambient)`}
      initial={{ opacity: reduce ? (lit ? 0.95 : 0.5) : 0 }}
      animate={
        reduce
          ? { opacity: lit ? 0.95 : 0.5 }
          : { opacity: lit ? [0.6, 1, 0.6] : [0.28, 0.48, 0.28] }
      }
      transition={
        reduce
          ? { duration: 0 }
          : { duration: lit ? 2.2 : 3.6, repeat: Infinity, ease: 'easeInOut' as const }
      }
    />
  )
}

interface GlintProps {
  uid: string
  clipId: string
  lit: boolean
  reduce: boolean
}

/** Diagonal shine sweep, clipped to the object silhouette. */
function Glint({ uid, clipId, lit, reduce }: GlintProps) {
  if (reduce) return null
  return (
    <g clipPath={`url(#${clipId})`}>
      <g transform="rotate(-22 24 24)">
        <motion.rect
          y="-18"
          width="6.5"
          height="84"
          fill={`url(#${uid}-glint)`}
          initial={{ x: -22 }}
          animate={{ x: 58 }}
          transition={{
            duration: lit ? 1 : 1.35,
            repeat: Infinity,
            repeatDelay: lit ? 1.3 : 3.2,
            delay: 0.9,
            ease: 'easeInOut' as const,
          }}
        />
      </g>
    </g>
  )
}

interface SparkleProps {
  uid: string
  x: number
  y: number
  s: number
  delay: number
  lit: boolean
  reduce: boolean
  tone?: 'gold' | 'rose'
}

/** Shared twinkle. Present but shy when idle, busier when lit. */
function Sparkle({ uid, x, y, s, delay, lit, reduce, tone = 'gold' }: SparkleProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <motion.path
        d={SPARKLE_D}
        fill={`url(#${uid}-${tone})`}
        initial={reduce ? { opacity: 0.6, scale: 1 } : { opacity: 0, scale: 0.2 }}
        animate={reduce ? { opacity: 0.6, scale: 1 } : { opacity: [0, 1, 0], scale: [0.2, 1, 0.2] }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                duration: lit ? 1.4 : 2.1,
                repeat: Infinity,
                repeatDelay: lit ? 0.4 : 1.6,
                delay,
                ease: 'easeInOut' as const,
              }
        }
      />
    </g>
  )
}

interface LitPanelProps {
  uid: string
  x: number
  y: number
  w: number
  h: number
  r?: number
  i: number
  lit: boolean
  reduce: boolean
}

/** A gold emissive panel (hotel window / ticket hologram strip) with halo + pulse. */
function LitPanel({ uid, x, y, w, h, r = 0.55, i, lit, reduce }: LitPanelProps) {
  return (
    <g>
      {lit && !reduce && (
        <motion.rect
          x={x - 1.2}
          y={y - 1.2}
          width={w + 2.4}
          height={h + 2.4}
          rx={r + 1.2}
          fill={`url(#${uid}-goldGlow)`}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 0.68, 0.2] }}
          transition={{
            duration: 1.9,
            repeat: Infinity,
            delay: i * 0.26,
            ease: 'easeInOut' as const,
          }}
        />
      )}
      <motion.rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill={`url(#${uid}-gold)`}
        initial={{ opacity: lit ? 0.7 : 0.45 }}
        animate={
          reduce
            ? { opacity: lit ? 0.95 : 0.7 }
            : { opacity: lit ? [0.66, 1, 0.66] : [0.42, 0.72, 0.42] }
        }
        transition={
          reduce
            ? { duration: 0 }
            : {
                duration: lit ? 1.7 : 2.7,
                repeat: Infinity,
                delay: i * 0.26,
                ease: 'easeInOut' as const,
              }
        }
      />
    </g>
  )
}

interface ShellProps {
  size: number
  className: string
  reduce: boolean
  onHover: (v: boolean) => void
  children: ReactNode
}

/** Common wrapper: hover lift + fixed 48 grid. */
function Shell({ size, className, reduce, onHover, children }: ShellProps) {
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size, display: 'inline-flex' }}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
      whileHover={reduce ? undefined : { scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 320, damping: 20 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {children}
      </svg>
    </motion.div>
  )
}

/* ------------------------------------------------------------------------- */
/* HOTEL — boutique property: wide wing + lit tower, rose roof plane & awning */
/* ------------------------------------------------------------------------- */

export function HotelPremiumIcon({
  size = 40,
  isActive = false,
  className = '',
}: PremiumIconProps) {
  const uid = useScopedId('tphotel')
  const reduce = useReducedMotion() ?? false
  const [hovered, setHovered] = useState(false)
  const lit = isActive || hovered

  const wingWindows = [11.4, 15.1, 18.8]
  const towerRows = [15.5, 20.5, 25.5]
  const towerCols = [25.2, 28.8]

  return (
    <Shell size={size} className={className} reduce={reduce} onHover={setHovered}>
      <defs>
        <CoreDefs uid={uid} />
        <clipPath id={`${uid}-clip`}>
          <path d="M13 19 L26 19 L23 21 L23 33 L10 33 L10 21 Z" />
          <path d="M26 11 L36 11 L36 31 L33 33 L23 33 L23 13 Z" />
        </clipPath>
      </defs>

      <Aura uid={uid} lit={lit} reduce={reduce} />

      {/* ground shadow */}
      <motion.ellipse
        cx="23"
        cy="37.4"
        rx="15"
        ry="1.9"
        fill="rgba(15,23,42,0.13)"
        {...enter(reduce, 0.06)}
      />

      {/* foundation slab */}
      <motion.g {...enter(reduce, 0.12)}>
        <path d="M8 33 L36 33 L39 31 L11 31 Z" fill={`url(#${uid}-deep)`} />
        <path d="M36 33 L39 31 L39 33.7 L36 35.7 Z" fill={`url(#${uid}-base)`} />
        <path
          d="M8 33 L36 33 L36 34.7 Q36 35.7 35 35.7 L9 35.7 Q8 35.7 8 34.7 Z"
          fill={`url(#${uid}-base)`}
        />
      </motion.g>

      {/* left wing */}
      <motion.g {...enter(reduce, 0.2)}>
        <path d="M10 21 L23 21 L26 19 L13 19 Z" fill={`url(#${uid}-side)`} />
        <path
          d="M10 21 L23 21 L23 33 L10 33 Z"
          fill={`url(#${uid}-front)`}
          stroke="rgba(15,23,42,0.1)"
          strokeWidth="0.5"
        />
        <rect
          x="10.4"
          y="21.4"
          width="12.2"
          height="5.2"
          fill={`url(#${uid}-sheen)`}
          opacity="0.55"
        />
      </motion.g>

      {/* tower */}
      <motion.g {...enter(reduce, 0.28)}>
        <path d="M33 13 L36 11 L36 31 L33 33 Z" fill={`url(#${uid}-deep)`} />
        <path d="M23 13 L33 13 L36 11 L26 11 Z" fill={`url(#${uid}-rose)`} />
        <path
          d="M23 13 L33 13 L33 33 L23 33 Z"
          fill={`url(#${uid}-front)`}
          stroke="rgba(15,23,42,0.1)"
          strokeWidth="0.5"
        />
        <rect
          x="23.4"
          y="13.4"
          width="9.2"
          height="6.6"
          fill={`url(#${uid}-sheen)`}
          opacity="0.6"
        />
      </motion.g>

      {/* emissive windows */}
      <motion.g {...enter(reduce, 0.42)}>
        {wingWindows.map((x, i) => (
          <LitPanel
            key={`w-${i}`}
            uid={uid}
            x={x}
            y={22.6}
            w={2.8}
            h={3.2}
            i={i}
            lit={lit}
            reduce={reduce}
          />
        ))}
        {towerRows.map((y, r) =>
          towerCols.map((x, c) => (
            <LitPanel
              key={`t-${r}-${c}`}
              uid={uid}
              x={x}
              y={y}
              w={3}
              h={3}
              i={r + c * 1.5 + 1}
              lit={lit}
              reduce={reduce}
            />
          )),
        )}
      </motion.g>

      {/* awning band, lit entrance, rooftop beacon */}
      <motion.g {...enter(reduce, 0.5)}>
        <rect x="10" y="26.4" width="13" height="1.6" rx="0.4" fill={`url(#${uid}-rose)`} />
        <rect x="10" y="28" width="13" height="0.5" fill="rgba(15,23,42,0.12)" />

        {lit && (
          <motion.ellipse
            cx="16.5"
            cy="30.6"
            rx="5.2"
            ry="4.6"
            fill={`url(#${uid}-roseGlow)`}
            initial={{ opacity: 0.3 }}
            animate={reduce ? { opacity: 0.45 } : { opacity: [0.25, 0.6, 0.25] }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const }
            }
          />
        )}
        <path
          d="M14.2 33 L14.2 30.6 A2.3 2.3 0 0 1 18.8 30.6 L18.8 33 Z"
          fill={`url(#${uid}-gold)`}
          opacity={lit ? 0.95 : 0.75}
        />
        <path
          d="M14.2 33 L14.2 30.6 A2.3 2.3 0 0 1 18.8 30.6 L18.8 33 Z"
          fill="none"
          stroke="rgba(15,23,42,0.16)"
          strokeWidth="0.5"
        />

        <rect x="29.6" y="8.9" width="0.9" height="3.2" rx="0.45" fill="#64748b" />
        {lit && (
          <motion.circle
            cx="30.05"
            cy="8.2"
            r="4.4"
            fill={`url(#${uid}-goldGlow)`}
            initial={{ opacity: 0.25 }}
            animate={reduce ? { opacity: 0.5 } : { opacity: [0.25, 0.75, 0.25] }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }
            }
          />
        )}
        <motion.circle
          cx="30.05"
          cy="8.2"
          r="1.5"
          fill={`url(#${uid}-gold)`}
          initial={{ opacity: 0.8 }}
          animate={
            reduce
              ? { opacity: lit ? 1 : 0.8 }
              : { opacity: lit ? [0.75, 1, 0.75] : [0.6, 0.9, 0.6] }
          }
          transition={
            reduce
              ? { duration: 0 }
              : { duration: lit ? 1.5 : 2.4, repeat: Infinity, ease: 'easeInOut' as const }
          }
        />
      </motion.g>

      <Glint uid={uid} clipId={`${uid}-clip`} lit={lit} reduce={reduce} />

      {lit && (
        <g>
          <Sparkle
            uid={uid}
            x={7.5}
            y={16}
            s={0.62}
            delay={0.1}
            lit={lit}
            reduce={reduce}
            tone="rose"
          />
          <Sparkle uid={uid} x={39.5} y={20.5} s={0.55} delay={0.55} lit={lit} reduce={reduce} />
          <Sparkle uid={uid} x={20} y={8.5} s={0.48} delay={0.95} lit={lit} reduce={reduce} />
        </g>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------------- */
/* TOUR — a hiker with pack + trekking pole, climbing uphill, continuously.   */
/*                                                                            */
/* THREE DELIBERATE ARCHITECTURE CHOICES, each avoiding a real failure mode:  */
/*                                                                            */
/* 1. NO ANIMATED JOINT ROTATION. An articulated rig (rotate each thigh/shin  */
/*    about its joint) is the obvious way to walk a figure, and it is a trap: */
/*    motion writes its own transformOrigin onto SVG children, so limbs pivot */
/*    about the tile centre instead of the joint and visibly detach. Instead  */
/*    two COMPLETE leg poses are drawn and hard-swapped by opacity. At 36px a */
/*    2-frame cycle reads better than interpolation anyway — the same reason  */
/*    classic sprite walk cycles use few frames. Only translation and opacity */
/*    are ever animated, both of which are origin-independent.                */
/*                                                                            */
/* 2. TREADMILL, NOT TRAVEL. The hiker holds station while the GROUND scrolls */
/*    beneath. Ground detail repeats every TERRAIN_PERIOD units and animates  */
/*    exactly that far before resetting, so the loop seam is mathematically   */
/*    invisible. Translating the hiker up-slope and snapping them back would  */
/*    jump once per cycle — fatal for something billed as "continuous".       */
/*                                                                            */
/* 3. ONE REMOUNT KEY FOR THE WHOLE WALK. motion only restarts a value whose  */
/*    keyframes changed; a bare duration change is ignored. Speeding the walk */
/*    up on activation would therefore restart the bob but not the legs, and  */
/*    they would drift out of phase and beat. Keying the walk group on `lit`  */
/*    remounts every walk animation together, so they always share a phase.   */
/*                                                                            */
/* Ground plane sits at local y=32 and is rotated -19deg (uphill to the       */
/* right); the figure is drawn pre-leaned into the slope rather than rotated, */
/* so foot contact can be placed exactly on the surface line.                 */
/* ------------------------------------------------------------------------- */

/** Ground surface in the rotated frame, and how far detail travels per cycle. */
const SLOPE_DEG = -19
const TERRAIN_PERIOD = 9

/** Surface height at x in the ROOT frame: y = 32 - tan(19deg) * (x - 24). */
const slopeY = (x: number) => 32 - 0.3443 * (x - 24)

/** One leg pose: hip -> knee -> ankle, plus where the foot plants. */
interface LegPose {
  front: string
  back: string
  frontFoot: [number, number]
  backFoot: [number, number]
}

/* Contact feet are solved onto slopeY() so the soles sit ON the surface
   rather than sinking through it: slopeY(25) = 31.66, slopeY(18.6) = 33.86. */
const POSE_A: LegPose = {
  front: 'M22.3 24.7 L24.7 28.1 L24.9 31.5',
  back: 'M21.7 24.9 L19.9 28.7 L18.5 33.6',
  frontFoot: [25.2, 31.6],
  backFoot: [18.4, 33.8],
}

const POSE_B: LegPose = {
  front: 'M22.3 24.7 L24.0 28.7 L25.6 32.2',
  back: 'M21.7 24.9 L20.5 28.0 L21.6 31.0',
  frontFoot: [26.0, 32.3],
  backFoot: [21.9, 31.1],
}

/** Legs for one pose. Thick round-capped strokes read as limbs at 36px. */
function Legs({ pose }: { pose: LegPose }) {
  return (
    <g stroke="#0f172a" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={pose.back} opacity="0.72" />
      <ellipse cx={pose.backFoot[0]} cy={pose.backFoot[1]} rx="1.5" ry="0.8" fill="#0f172a" stroke="none" opacity="0.72" />
      <path d={pose.front} />
      <ellipse cx={pose.frontFoot[0]} cy={pose.frontFoot[1]} rx="1.6" ry="0.85" fill="#0f172a" stroke="none" />
    </g>
  )
}

export function TourPremiumIcon({ size = 40, isActive = false, className = '' }: PremiumIconProps) {
  const uid = useScopedId('tptour')
  const reduce = useReducedMotion() ?? false
  const [hovered, setHovered] = useState(false)
  const lit = isActive || hovered

  return (
    <Shell size={size} className={className} reduce={reduce} onHover={setHovered}>
      <defs>
        <CoreDefs uid={uid} />
        {/* Keeps scrolling ground detail inside the slope wedge. */}
        <clipPath id={`${uid}-ground`}>
          <path d="M3 32 L45 32 L45 46 L3 46 Z" />
        </clipPath>
      </defs>

      <Aura uid={uid} lit={lit} reduce={reduce} />

      {/* Distant range — deliberately small and low-contrast. An earlier take on
          this icon lost its hiker inside a full diorama; the background only has
          to say "mountains", not compete with the subject. */}
      <motion.g {...enter(reduce, 0.12)}>
        <g opacity="0.45">
          <path d="M28 26 L34.5 14.5 L41 26 Z" fill={`url(#${uid}-side)`} />
          <path d="M34.5 14.5 L41 26 L34.5 26 Z" fill={`url(#${uid}-deep)`} />
          <path
            d="M34.5 14.5 L37.2 19.3 L35.9 18.4 L34.6 19.5 L33.3 18.3 L31.9 19.3 Z"
            fill={`url(#${uid}-snow)`}
          />
        </g>
      </motion.g>

      {/* THE SLOPE. Rotated as a whole so the ground reads uphill-to-the-right;
          everything inside is authored against a simple horizontal y=32 surface. */}
      <g transform={`rotate(${SLOPE_DEG} 24 32)`}>
        <motion.g {...enter(reduce, 0.18)}>
          <path d="M3 32 L45 32 L45 46 L3 46 Z" fill={`url(#${uid}-front)`} />
          <path d="M3 32 L45 32 L45 34.2 L3 34.2 Z" fill={`url(#${uid}-side)`} opacity="0.8" />
          <path d="M3 32 L45 32" stroke="rgba(15,23,42,0.2)" strokeWidth="0.6" />
        </motion.g>

        {/* Scrolling detail. The motif repeats every TERRAIN_PERIOD units and
            travels exactly that far, so the reset lands on an identical frame
            and the loop seam is invisible. */}
        <g clipPath={`url(#${uid}-ground)`}>
          <motion.g
            initial={{ x: 0 }}
            animate={reduce ? { x: 0 } : { x: -TERRAIN_PERIOD }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: lit ? 1.15 : 1.6, repeat: Infinity, ease: 'linear' as const }
            }
          >
            {[3, 12, 21, 30, 39, 48].map((x) => (
              <g key={x}>
                <path
                  d={`M${x} 32 L${x + 2.4} 32 L${x + 1.6} 33.6 L${x - 0.4} 33.6 Z`}
                  fill={`url(#${uid}-deep)`}
                  opacity="0.5"
                />
                <ellipse
                  cx={x + 5.4}
                  cy="32.9"
                  rx="1.1"
                  ry="0.55"
                  fill={`url(#${uid}-deep)`}
                  opacity="0.38"
                />
              </g>
            ))}
          </motion.g>
        </g>
      </g>

      {/* THE HIKER. Drawn pre-leaned into the slope rather than rotated, so each
          foot plants exactly on slopeY(). Keyed on `lit` so every walk animation
          remounts together and the legs cannot drift out of phase with the bob. */}
      <motion.g key={lit ? 'walk-lit' : 'walk-idle'} {...enter(reduce, 0.26)}>
        {/* Upper body bobs twice per cycle — once per footfall. */}
        <motion.g
          initial={{ y: 0 }}
          animate={reduce ? { y: 0 } : { y: [0, -0.5, 0, -0.5, 0] }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: lit ? 1.15 : 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut' as const,
                  times: [0, 0.25, 0.5, 0.75, 1],
                }
          }
        >
          {/* Backpack — a distinct rounded mass clearing the shoulder line, with
              a strap crossing the chest so it cannot read as a crate. */}
          <path
            d="M18.0 17.0 Q17.4 15.7 18.9 15.5 L21.9 15.0 Q23.3 14.9 23.5 16.2 L24.4 23.6 Q24.6 25.0 23.2 25.2 L19.3 25.8 Q17.9 26.0 17.7 24.6 Z"
            fill={`url(#${uid}-rose)`}
          />
          <path d="M18.7 16.0 L22.5 15.4" stroke="#E11D48" strokeWidth="1.4" strokeLinecap="round" />

          {/* Torso */}
          <path d="M20.6 17.8 Q22.6 16.6 24.6 17.9 L25.4 24.2 Q22.8 25.6 20.3 24.3 Z" fill="#0f172a" />
          <path
            d="M22.9 17.5 Q24.2 19.9 24.4 22.4"
            stroke="#FB7185"
            strokeWidth="1.05"
            strokeLinecap="round"
            fill="none"
          />

          {/* Neck + head + cap brim pointing the way they are headed */}
          <path d="M22.9 15.9 L24.1 15.6 L24.4 17.6 L23.2 17.9 Z" fill="#0f172a" />
          <circle cx="23.7" cy="13.2" r="2.9" fill="#0f172a" />
          <path d="M23.9 11.7 Q26.7 11.3 27.4 12.6 L23.9 13.1 Z" fill={`url(#${uid}-rose)`} />

          {/* Near arm reaching down to the pole grip */}
          <path
            d="M24.4 18.4 L26.0 20.4 L26.6 22.0"
            stroke="#0f172a"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>

        {/* TREKKING POLE. Named explicitly by the client, so it is the second
            boldest shape here: a pale casing stroke behind the dark shaft keeps
            it legible where it crosses both the dark figure and the light slope. */}
        <g>
          <path
            d="M25.4 17.6 L29.4 33.0"
            stroke="#ffffff"
            strokeWidth="3.4"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path d="M25.4 17.6 L29.4 33.0" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M25.9 19.4 L26.9 23.3" stroke="#FF385C" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* Two complete leg poses, hard-swapped. Only opacity animates, so there
            is no dependence on transform-origin behaviour. */}
        <motion.g
          initial={{ opacity: 1 }}
          animate={reduce ? { opacity: 1 } : { opacity: [1, 1, 0, 0, 1] }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: lit ? 1.15 : 1.6,
                  repeat: Infinity,
                  ease: 'linear' as const,
                  times: [0, 0.49, 0.5, 0.99, 1],
                }
          }
        >
          <Legs pose={POSE_A} />
        </motion.g>
        <motion.g
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 0 } : { opacity: [0, 0, 1, 1, 0] }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: lit ? 1.15 : 1.6,
                  repeat: Infinity,
                  ease: 'linear' as const,
                  times: [0, 0.49, 0.5, 0.99, 1],
                }
          }
        >
          <Legs pose={POSE_B} />
        </motion.g>

        {/* Dust kicked up behind the trailing foot. Opacity + drift only. */}
        {!reduce && (
          <motion.ellipse
            cx="17.4"
            cy="34.4"
            rx="2.1"
            ry="0.85"
            fill="#94a3b8"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: [0, 0.45, 0], x: [0, -2.6] }}
            transition={{
              duration: lit ? 1.15 : 1.6,
              repeat: Infinity,
              ease: 'easeOut' as const,
            }}
          />
        )}
      </motion.g>

      {/* Summit marker ahead — the goal being climbed toward. */}
      <motion.g {...enter(reduce, 0.5)}>
        <rect x="37.4" y="8.6" width="1" height="6" rx="0.5" fill="#475569" />
        <motion.path
          d="M38.4 9.1 L43.0 10.7 L38.4 12.3 Z"
          fill={`url(#${uid}-rose)`}
          initial={{ scaleX: 1 }}
          animate={reduce ? { scaleX: 1 } : { scaleX: [1, 0.82, 1] }}
          transition={
            reduce ? { duration: 0 } : { duration: 1.9, repeat: Infinity, ease: 'easeInOut' as const }
          }
          style={{ originX: 0, originY: 0.5 }}
        />
      </motion.g>

      {lit && !reduce && (
        <g>
          <Sparkle
            uid={uid}
            x={41.5}
            y={6.2}
            s={0.5}
            delay={0.15}
            lit={lit}
            reduce={reduce}
            tone="rose"
          />
          <Sparkle uid={uid} x={8.5} y={16} s={0.42} delay={0.85} lit={lit} reduce={reduce} />
        </g>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------------- */
/* EVENT — premium ticket slab: perforation notches, rose header, hologram    */
/* ------------------------------------------------------------------------- */

const TICKET_D =
  'M11 17 L24.2 17 A1.8 1.8 0 0 0 27.8 17 L33 17 A2 2 0 0 1 35 19 L35 31 A2 2 0 0 1 33 33 L27.8 33 A1.8 1.8 0 0 0 24.2 33 L11 33 A2 2 0 0 1 9 31 L9 19 A2 2 0 0 1 11 17 Z'

/*
 * The ticket face used to carry a large rose four-point sparkle dead-centre.
 * Every reviewer independently read the result as a FIRST-AID KIT: a concave
 * sparkle's arms are destroyed by antialiasing below ~40px, collapsing it into
 * a fat rose plus sign on a white slab. Printed ticket content reads as a
 * ticket at any size and contains no cross-like geometry, so the emblem is
 * replaced by a title bar and two detail lines.
 */

export function EventPremiumIcon({
  size = 40,
  isActive = false,
  className = '',
}: PremiumIconProps) {
  const uid = useScopedId('tpevent')
  const reduce = useReducedMotion() ?? false
  const [hovered, setHovered] = useState(false)
  const lit = isActive || hovered

  return (
    <Shell size={size} className={className} reduce={reduce} onHover={setHovered}>
      <defs>
        <CoreDefs uid={uid} />
        <clipPath id={`${uid}-clip`}>
          <path d={TICKET_D} />
        </clipPath>
      </defs>

      <Aura uid={uid} lit={lit} reduce={reduce} />

      {/* ground shadow */}
      <motion.ellipse
        cx="23"
        cy="36.6"
        rx="14"
        ry="1.9"
        fill="rgba(15,23,42,0.13)"
        {...enter(reduce, 0.06)}
      />

      {/* extruded back slab — same silhouette, offset (+3, -2) */}
      <motion.g {...enter(reduce, 0.14)}>
        <path d={TICKET_D} transform="translate(3 -2)" fill={`url(#${uid}-deep)`} />
      </motion.g>

      {/* front face */}
      <motion.g {...enter(reduce, 0.22)}>
        <path
          d={TICKET_D}
          fill={`url(#${uid}-front)`}
          stroke="rgba(15,23,42,0.12)"
          strokeWidth="0.5"
        />
      </motion.g>

      {/* clipped surface layers: rose header, glass sheen */}
      <motion.g {...enter(reduce, 0.3)}>
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="8" y="16.5" width="28" height="4.2" fill={`url(#${uid}-rose)`} />
          <rect x="8" y="20.7" width="28" height="0.5" fill="rgba(15,23,42,0.1)" />
          <rect x="8" y="21.2" width="28" height="6" fill={`url(#${uid}-sheen)`} opacity="0.55" />
          <path d="M9 33 L19.5 21.2 L25 21.2 L14.5 33 Z" fill="#ffffff" opacity="0.28" />
        </g>
      </motion.g>

      {/* perforation */}
      <motion.g {...enter(reduce, 0.38)}>
        <line
          x1="26"
          y1="21.6"
          x2="26"
          y2="30.9"
          stroke="rgba(15,23,42,0.28)"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeDasharray="1.3 1.5"
        />
      </motion.g>

      {/* Printed ticket content: a rose title bar over two detail lines. */}
      <motion.g {...enter(reduce, 0.46)}>
        {lit && (
          <motion.ellipse
            cx="17.2"
            cy="25.6"
            rx="8"
            ry="6.4"
            fill={`url(#${uid}-roseGlow)`}
            initial={{ opacity: 0.25 }}
            animate={reduce ? { opacity: 0.4 } : { opacity: [0.2, 0.5, 0.2] }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const }
            }
          />
        )}
        <rect x="12.4" y="21.8" width="9.6" height="2.7" rx="1.35" fill={`url(#${uid}-rose)`} />
        <rect x="12.4" y="26.0" width="7.8" height="1.9" rx="0.95" fill="#94a3b8" />
        <rect x="12.4" y="29.0" width="5.4" height="1.9" rx="0.95" fill="#cbd5e1" />
      </motion.g>

      {/* hologram strip on the stub */}
      <motion.g {...enter(reduce, 0.54)}>
        <LitPanel
          uid={uid}
          x={28.9}
          y={22.4}
          w={3.2}
          h={8.2}
          r={1.6}
          i={0}
          lit={lit}
          reduce={reduce}
        />
      </motion.g>

      <Glint uid={uid} clipId={`${uid}-clip`} lit={lit} reduce={reduce} />

      {lit && (
        <g>
          <Sparkle uid={uid} x={9} y={13.5} s={0.55} delay={0.12} lit={lit} reduce={reduce} />
          <Sparkle
            uid={uid}
            x={39.5}
            y={20}
            s={0.5}
            delay={0.58}
            lit={lit}
            reduce={reduce}
            tone="rose"
          />
          <Sparkle uid={uid} x={30.5} y={13} s={0.46} delay={1} lit={lit} reduce={reduce} />
        </g>
      )}
    </Shell>
  )
}
