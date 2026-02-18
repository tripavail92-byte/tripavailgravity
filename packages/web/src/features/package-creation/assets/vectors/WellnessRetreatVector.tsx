import { motion } from 'motion/react'

import { VectorProps } from './types'

export function WellnessRetreatVector({
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
        <linearGradient id="wellStone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="wellLotus" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>

         <filter id="wellShadow" x="-50%" y="-50%" width="200%" height="200%">
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

      {/* Background Ripple */}
      <motion.circle
        cx="60"
        cy="90"
        r="40"
        stroke="#2DD4BF"
        strokeWidth="1"
        fill="none"
        opacity="0.2"
        variants={{
            active: { scale: [1, 1.2], opacity: [0.2, 0] },
            idle: { scale: 1, opacity: 0.2 }
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Zen Stones */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <ellipse cx="60" cy="95" rx="35" ry="10" fill="url(#wellStone)" filter="url(#wellShadow)" />
        <ellipse cx="60" cy="82" rx="25" ry="8" fill="url(#wellStone)" filter="url(#wellShadow)" />
        <ellipse cx="60" cy="72" rx="18" ry="6" fill="url(#wellStone)" filter="url(#wellShadow)" />
        <ellipse cx="60" cy="64" rx="12" ry="5" fill="url(#wellStone)" />
      </motion.g>

      {/* Lotus Flower */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        {/* Left Petal */}
        <motion.path
            d="M60 64 Q40 50 30 40 Q45 60 60 64"
            fill="url(#wellLotus)"
             variants={{
                active: { rotate: [-2, 2, -2] },
                idle: { rotate: 0 }
            }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             style={{ originX: 0, originY: 1 }}
        />
        {/* Right Petal */}
        <motion.path
            d="M60 64 Q80 50 90 40 Q75 60 60 64"
            fill="url(#wellLotus)"
             variants={{
                active: { rotate: [2, -2, 2] },
                idle: { rotate: 0 }
            }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             style={{ originX: 0, originY: 1 }}
        />
        {/* Center Petal */}
         <motion.path
            d="M60 64 Q50 40 60 25 Q70 40 60 64"
            fill="#FBCFE8"
             variants={{
                active: { scaleY: [1, 1.05, 1] },
                idle: { scaleY: 1 }
            }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             style={{ originX: 0.5, originY: 1 }}
        />
      </motion.g>

      {/* Drop (Water) */}
       <motion.path
         d="M60 15 Q65 25 60 30 Q55 25 60 15"
         fill="#2DD4BF"
         initial={{ y: -20, opacity: 0 }} // Start above
         animate={{ 
            y: [0, 50], // Drop down
            opacity: [0, 1, 0]
         }}
         transition={{ 
            duration: 2, 
            repeat: Infinity,
            delay: 1,
            repeatDelay: 1
         }}
       />

    </motion.svg>
  )
}
