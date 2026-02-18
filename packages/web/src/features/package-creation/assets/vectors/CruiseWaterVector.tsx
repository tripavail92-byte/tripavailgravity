import { motion } from 'motion/react'

import { VectorProps } from './types'

export function CruiseWaterVector({
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
        <linearGradient id="cruiseWater" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        <linearGradient id="cruiseShip" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* Sun/Background */}
      <motion.circle
        cx="90"
        cy="30"
        r="15"
        fill="#FCD34D"
        opacity="0.8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      />
      
      {/* Ship */}
      <motion.g
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
          {/* Hull */}
          <path d="M20 70 L30 90 H90 L100 70 H20 Z" fill="url(#cruiseShip)" />
          {/* Deck/Cabin */}
          <rect x="35" y="55" width="50" height="15" fill="#CBD5E1" rx="2" />
          <rect x="40" y="45" width="30" height="10" fill="#CBD5E1" rx="1" />
          
          {/* Windows */}
          <circle cx="45" cy="62" r="2" fill="#38BDF8" />
          <circle cx="55" cy="62" r="2" fill="#38BDF8" />
          <circle cx="65" cy="62" r="2" fill="#38BDF8" />
          <circle cx="75" cy="62" r="2" fill="#38BDF8" />
          
           {/* Chimney */}
          <rect x="50" y="35" width="8" height="10" fill="#EF4444" />
          <path d="M50 35 L58 35 L62 30 L46 30 Z" fill="#EF4444" />
      </motion.g>

      {/* Waves (Foreground) */}
      <motion.path
        d="M0 90 Q15 85 30 90 Q45 95 60 90 Q75 85 90 90 Q105 95 120 90 V120 H0 Z"
        fill="url(#cruiseWater)"
        opacity="0.8"
        variants={{
            active: { x: [-10, 0, -10] },
            idle: { x: 0 }
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.path
        d="M-20 100 Q0 95 20 100 Q40 105 60 100 Q80 95 100 100 Q120 105 140 100 V120 H-20 Z"
        fill="#0EA5E9"
        opacity="0.6"
         variants={{
            active: { x: [0, -10, 0] },
            idle: { x: 0 }
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Smoke */}
       {[...Array(3)].map((_, i) => (
            <motion.circle
                key={i}
                cx="54"
                cy="30"
                r={3 + i}
                fill="#FFFFFF"
                opacity="0.5"
                variants={{
                    active: { y: [-10, -20], x: [5, 15], opacity: [0, 0.5, 0] },
                    idle: { opacity: 0 }
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
       ))}

    </motion.svg>
  )
}
