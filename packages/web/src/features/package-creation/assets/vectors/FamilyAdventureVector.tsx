import { motion } from 'motion/react'

import { VectorProps } from './types'

export function FamilyAdventureVector({
  className = '',
  isActive = false,
  size = 120,
}: VectorProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="idle"
      animate={isActive ? 'active' : 'idle'}
      whileHover="hover"
    >
      <defs>
        <linearGradient id="famGrass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>

        <linearGradient id="famHouse" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>

        <linearGradient id="famRoof" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>

        <filter id="famShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feFlood floodColor="#000000" floodOpacity="0.1" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sky Background */}
      <motion.circle
        cx="60"
        cy="60"
        r="55"
        fill="#E0F2FE"
        opacity="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Hill/Grass */}
      <motion.path
        d="M10 100 Q60 80 110 100 V120 H10 Z"
        fill="url(#famGrass)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      />

      {/* House */}
      <motion.g
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <rect
          x="40"
          y="60"
          width="40"
          height="40"
          fill="url(#famHouse)"
          rx="2"
          filter="url(#famShadow)"
        />
        <path
          d="M35 60 L60 35 L85 60"
          fill="url(#famRoof)"
          stroke="#B91C1C"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="52" y="80" width="16" height="20" fill="#78350F" rx="1" />
        <rect x="65" y="68" width="8" height="8" fill="#E0F2FE" stroke="#78350F" strokeWidth="1" />
        <rect x="47" y="68" width="8" height="8" fill="#E0F2FE" stroke="#78350F" strokeWidth="1" />
      </motion.g>

      {/* Kite */}
      <motion.g
        variants={{
          active: {
            y: [0, -10, 0],
            x: [0, 5, 0],
            rotate: [0, 5, -5, 0],
          },
          idle: { y: 0, x: 0, rotate: 0 },
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* String */}
        <motion.path
          d="M90 30 Q90 50 80 80"
          stroke="#9ca3af"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6 }}
        />
        {/* Kite Body */}
        <motion.path
          d="M90 20 L100 30 L90 45 L80 30 Z"
          fill="#A855F7"
          stroke="#7E22CE"
          strokeWidth="1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7 }}
        />
        {/* Tail */}
        <motion.path d="M90 45 Q85 50 90 55" stroke="#A855F7" strokeWidth="2" fill="none" />
      </motion.g>

      {/* Sun */}
      <motion.circle
        cx="20"
        cy="30"
        r="8"
        fill="#FCD34D"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
      />

      {/* Tree */}
      <motion.g
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.8 }}
        style={{ originY: 1 }}
      >
        <rect x="25" y="80" width="6" height="20" fill="#78350F" />
        <circle cx="28" cy="75" r="12" fill="#166534" />
      </motion.g>
    </motion.svg>
  )
}
