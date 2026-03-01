import { motion } from 'motion/react'

// Common animation variants for the new monochromatic, outline-based icons
const iconVariants = {
  initial: { opacity: 0.9, scale: 1 },
  hover: { opacity: 1, scale: 1.05 },
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// -- 15 Monochromatic SVG Icons ------------------------------------------------

export const AdventureIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <motion.path
        {...strokeProps}
        d="M21 21l-7.273-12.727C13.363 7.643 12.697 7.643 12.333 8.273L3 21"
      />
      <motion.path
        {...strokeProps}
        d="M17 14l-2.727-4.727C13.91 8.643 13.243 8.643 12.88 9.273L8 18"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path {...strokeProps} d="M14 9q0-2.5-3-4" />
    </svg>
  </motion.div>
)

export const CulturalIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path {...strokeProps} d="M4 21h16M7 21V10M17 21V10M10 21V10M14 21V10" />
      <motion.path
        {...strokeProps}
        d="M3 10l9-6 9 6"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
)

export const NatureIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path {...strokeProps} d="M12 21V9" />
      <motion.path
        {...strokeProps}
        d="M12 16c4 0 6-2 6-5s-3-5-6-5c-3 0-6 2-6 5s2 5 6 5z"
        style={{ transformOrigin: '12px 16px' }}
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path {...strokeProps} d="M12 11c2 0 3-1 3-2.5s-1.5-2.5-3-2.5" />
    </svg>
  </motion.div>
)

export const CityIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path {...strokeProps} d="M5 21V8a2 2 0 012-2h3M19 21V5a2 2 0 00-2-2h-3v18" />
      <path {...strokeProps} d="M10 21v-4h4v4" />
      {[8, 12, 16].map((y, i) => (
        <motion.line
          key={i}
          {...strokeProps}
          x1="14"
          y1={y}
          x2="14.01"
          y2={y}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
        />
      ))}
    </svg>
  </motion.div>
)

export const FoodIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path {...strokeProps} d="M12 2v20M9 2v6c0 1.657 1.343 3 3 3s3-1.343 3-3V2" />
      <path {...strokeProps} d="M5 2v4a3 3 0 003 3v2" />
      <motion.path
        {...strokeProps}
        d="M19 2s-3 3-3 6v13M19 8c-2 0-3-2-3-2"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
)

export const BeachIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path {...strokeProps} d="M4 18s2-2 4-2 4 2 4 2 4-2 4-2" />
      <motion.path
        {...strokeProps}
        d="M2 22s2-2 4-2 4 2 4 2 4-2 4-2"
        animate={{ x: [-1, 1, -1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path {...strokeProps} d="M11 12l6-10M17 2l3 1v2l-3-1z" />
      <circle {...strokeProps} cx="6" cy="6" r="2" />
    </svg>
  </motion.div>
)

export const HistoricalIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path {...strokeProps} d="M3 21h18M5 21v-4h14v4M7 17v-8M11 17v-8M15 17v-8M5 9h14L12 3 5 9z" />
      <motion.circle
        {...strokeProps}
        cx="12"
        cy="13"
        r="1.5"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  </motion.div>
)

export const ReligiousIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path {...strokeProps} d="M12 21v-6M12 11V3M9 6h6M6 21h12" />
      <motion.path
        {...strokeProps}
        d="M12 11c3 0 5 2 5 5v5H7v-5c0-3 2-5 5-5z"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
)

// -- 6 additional icons ---------------------------------------------------------------

export const HoneymoonIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <motion.path
        {...strokeProps}
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  </motion.div>
)

export const FamilyIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <circle {...strokeProps} cx="9" cy="7" r="4" />
      <path {...strokeProps} d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
      <motion.circle
        {...strokeProps}
        cx="16"
        cy="11"
        r="3"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        {...strokeProps}
        d="M14 21v-2a3 3 0 013-3h1a3 3 0 013 3v2"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  </motion.div>
)

export const PhotographyIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        {...strokeProps}
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
      />
      <motion.circle
        {...strokeProps}
        cx="12"
        cy="13"
        r="4"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
    </svg>
  </motion.div>
)

export const WellnessIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path {...strokeProps} d="M12 2v20" />
      <motion.path
        {...strokeProps}
        d="M12 22s-8-4.5-8-11.8A5 5 0 0112 2a5 5 0 018 8.2c0 7.3-8 11.8-8 11.8z"
        style={{ transformOrigin: 'center' }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
)

export const LuxuryIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <motion.path
        {...strokeProps}
        d="M8 21h8l3-10H5l3 10zM5 11l-2-6 5 2 4-4 4 4 5-2-2 6"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
)

export const BudgetIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <motion.path
        {...strokeProps}
        d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  </motion.div>
)

export const CustomIcon = () => (
  <motion.div
    className="w-8 h-8 flex items-center justify-center text-foreground"
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        {...strokeProps}
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
      <motion.path
        {...strokeProps}
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        animate={{ rotate: 180, scale: [1, 0.8, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '12px 12px' }}
        opacity={0.3}
      />
    </svg>
  </motion.div>
)
