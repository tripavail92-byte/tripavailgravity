import { motion } from 'motion/react'

// Design-token-safe colors (CSS variable references work in SVG fill/stroke):
// Primary fills  → hsl(var(--muted))
// Strokes        → hsl(var(--border))
// Accent fills   → purposeful accent colors kept for icon identity
// Dark fills     → hsl(var(--muted-foreground))

const iconVariants = {
  initial: { scale: 1, filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))' },
  hover: { scale: 1.08, filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.12))' },
}

// ── Existing 8 icons (colors updated to CSS variables) ────────────────────────

export const AdventureIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <motion.path
        d="M20 80 L50 20 L80 80 Z"
        fill="hsl(var(--muted))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path d="M40 40 L50 20 L60 40 Q50 35 40 40" fill="white" />
      <motion.circle
        cx="75" cy="25" r="8"
        fill="#FCD34D"
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </svg>
  </motion.div>
)

export const CulturalIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="15" y="75" width="70" height="10" rx="2"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      {[25, 40, 55, 70].map((x, i) => (
        <motion.rect
          key={i} x={x} y="40" width="6" height="35"
          fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5"
          animate={{ scaleY: [1, 1.06, 1] }}
          style={{ transformOrigin: '50% 100%' }}
          transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
      <path d="M10 40 L50 15 L90 40 Z"
        fill="hsl(var(--muted-foreground)/0.4)" stroke="hsl(var(--border))" strokeWidth="2" />
    </svg>
  </motion.div>
)

export const NatureIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center text-emerald-500"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <motion.path d="M50 85 V30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {[
        { d: 'M50 60 Q70 50 85 60' },
        { d: 'M50 45 Q30 35 15 45' },
        { d: 'M50 30 Q70 15 80 25' },
      ].map((leaf, i) => (
        <motion.path
          key={i}
          d={leaf.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          animate={{ rotate: [0, i % 2 === 0 ? 5 : -5, 0] }}
          transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
        />
      ))}
    </svg>
  </motion.div>
)

export const CityIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="20" y="40" width="20" height="45"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="45" y="20" width="25" height="65"
        fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="75" y="50" width="15" height="35"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      {[50, 60, 30, 40, 70].map((y, i) => (
        <motion.rect
          key={i} x={50 + (i % 2) * 10} y={y} width="4" height="4"
          fill="#FDE68A"
          animate={{ opacity: [0, 1, 0.5, 1, 0] }}
          transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
        />
      ))}
    </svg>
  </motion.div>
)

export const FoodIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center p-1"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path
        d="M20 50 Q50 90 80 50 L85 45 Q50 35 15 45 Z"
        fill="#FCA5A5" stroke="hsl(var(--border))" strokeWidth="2"
      />
      {[40, 50, 60].map((x, i) => (
        <motion.path
          key={i}
          d={`M${x} 35 Q${x + 5} 25 ${x} 15`}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ y: [0, -10], opacity: [0, 1, 0] }}
          transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
        />
      ))}
    </svg>
  </motion.div>
)

export const BeachIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="70" cy="30" r="15" fill="#FCD34D" />
      <motion.path
        d="M10 70 Q30 60 50 70 Q70 80 90 70 V90 H10 Z"
        fill="#93C5FD"
        stroke="#1D4ED8"
        strokeWidth="2"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
)

export const HistoricalIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M20 80 V40 L35 25 L50 40 V80 Z"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      <path d="M50 80 V30 L65 15 L80 30 V80 Z"
        fill="hsl(var(--muted-foreground)/0.3)" stroke="hsl(var(--border))" strokeWidth="2" />
      <motion.circle
        cx="50" cy="50" r="2"
        fill="white"
        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  </motion.div>
)

export const ReligiousIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M30 80 V40 Q50 10 70 40 V80 Z"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      <motion.circle
        cx="50" cy="40" r="25"
        fill="url(#glowGradient)"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <defs>
        <radialGradient id="glowGradient">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
    </svg>
  </motion.div>
)

// ── 6 new icons ───────────────────────────────────────────────────────────────

export const HoneymoonIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center text-rose-400"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <motion.path
        d="M50 75 L25 50 A18 18 0 0 1 50 30 A18 18 0 0 1 75 50 Z"
        fill="currentColor"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 52px' }}
      />
      <motion.path
        d="M72 35 L60 23 A10 10 0 0 1 72 16 A10 10 0 0 1 84 23 Z"
        fill="currentColor"
        opacity="0.5"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, delay: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '72px 25px' }}
      />
    </svg>
  </motion.div>
)

export const FamilyIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="30" cy="28" r="9" fill="hsl(var(--muted-foreground)/0.6)" />
      <motion.path
        d="M18 80 V55 Q30 45 42 55 V80"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <circle cx="62" cy="28" r="9" fill="hsl(var(--muted-foreground)/0.6)" />
      <path d="M50 80 V55 Q62 45 74 55 V80"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <motion.circle
        cx="46" cy="58" r="6"
        fill="hsl(var(--primary)/0.7)"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <path d="M38 85 V70 Q46 64 54 70 V85"
        fill="hsl(var(--primary)/0.4)" stroke="hsl(var(--border))" strokeWidth="1.5" />
    </svg>
  </motion.div>
)

export const PhotographyIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="10" y="35" width="80" height="50" rx="8"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="35" y="25" width="30" height="14" rx="4"
        fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="50" cy="60" r="16"
        fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
      <motion.circle
        cx="50" cy="60" r="10"
        fill="hsl(var(--muted-foreground)/0.25)"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="78" cy="46" r="4"
        fill="#FCD34D"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </svg>
  </motion.div>
)

export const WellnessIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center text-teal-500"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.ellipse
          key={i}
          cx={50 + 18 * Math.cos((angle * Math.PI) / 180)}
          cy={50 + 18 * Math.sin((angle * Math.PI) / 180)}
          rx="10" ry="15"
          fill="currentColor"
          opacity="0.5"
          transform={`rotate(${angle + 90} ${50 + 18 * Math.cos((angle * Math.PI) / 180)} ${50 + 18 * Math.sin((angle * Math.PI) / 180)})`}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
        />
      ))}
      <circle cx="50" cy="50" r="10" fill="currentColor" />
    </svg>
  </motion.div>
)

export const LuxuryIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center text-amber-400"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <motion.polygon
        points="50,10 80,40 50,90 20,40"
        fill="currentColor"
        opacity="0.85"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 50px' }}
      />
      <polygon points="50,10 80,40 50,50" fill="white" opacity="0.25" />
      <polygon points="50,10 20,40 50,50" fill="white" opacity="0.12" />
      <motion.line
        x1="30" y1="18" x2="38" y2="28"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  </motion.div>
)

export const BudgetIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center text-green-500"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {[75, 65, 55].map((y, i) => (
        <motion.ellipse
          key={i}
          cx="50" cy={y} rx="28" ry="8"
          fill="currentColor"
          opacity={1 - i * 0.2}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
      <ellipse cx="50" cy="47" rx="28" ry="8" fill="currentColor" />
      <motion.text
        x="50" y="53"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill="white"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        $
      </motion.text>
    </svg>
  </motion.div>
)

export const CustomIcon = () => (
  <motion.div
    className="w-12 h-12 flex items-center justify-center text-primary"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <motion.path
        d="M15 15 L55 15 L85 50 L55 85 L15 85 Z"
        fill="hsl(var(--primary)/0.15)"
        stroke="currentColor"
        strokeWidth="3"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: '50px 50px' }}
      />
      <circle cx="32" cy="32" r="6" fill="currentColor" />
      {[45, 55, 65].map((y, i) => (
        <motion.line
          key={i}
          x1="35" y1={y} x2="65" y2={y}
          stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
        />
      ))}
    </svg>
  </motion.div>
)