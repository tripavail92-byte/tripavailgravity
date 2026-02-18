import { motion } from 'motion/react'

import { VectorProps } from './types'

export function EcoNatureVector({
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
        <linearGradient id="ecoEarth" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id="ecoLand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        
        <filter id="ecoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>

      {/* Earth Globe */}
      <motion.circle
        cx="60"
        cy="80"
        r="35"
        fill="url(#ecoEarth)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Land Masses (continents) */}
      <motion.path
        d="M40 85 Q50 75 60 78 Q70 70 80 82 Q75 95 60 90 Q45 95 40 85"
        fill="url(#ecoLand)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      />
      <motion.path
        d="M65 65 Q75 60 85 68 Q80 75 70 70 Z"
        fill="url(#ecoLand)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      />

      {/* Plant Growing */}
      <motion.g
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        {/* Stem */}
        <path d="M60 45 Q55 55 60 80" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" fill="none" />
        
        {/* Left Leaf */}
        <motion.path
            d="M60 65 Q40 55 45 45 Q60 55 60 65"
            fill="#22C55E"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 }}
            style={{ originX: 1, originY: 1 }}
        />
        
        {/* Right Leaf */}
        <motion.path
             d="M60 60 Q80 50 75 40 Q60 50 60 60"
             fill="#22C55E"
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ delay: 0.8 }}
             style={{ originX: 0, originY: 1 }}
        />
        
        {/* Top Leaf */}
         <motion.path
             d="M60 45 Q50 30 60 20 Q70 30 60 45"
             fill="#86EFAC"
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ delay: 0.9 }}
             style={{ originY: 1 }}
        />
      </motion.g>

      {/* Orbiting Elements */}
      <motion.circle
        cx="60"
        cy="80"
        r="45"
        stroke="#4ADE80"
        strokeWidth="1"
        strokeDasharray="4 4"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        opacity="0.5"
      />
       <motion.circle
        cx="60"
        cy="33"
        r="3"
        fill="#FCD34D"
        animate={{ 
            rotate: 360,
            originX: "0px", 
            originY: "44px" // Relative to cx=60, cy=33 to match circle center 60,80 (delta y = 47)
            // Actually simpler to put inside a group
        }}
        // Re-doing orbit via group transform
      />
      
      {/* Floating Particles/Oxygen */}
      {[...Array(5)].map((_, i) => (
         <motion.circle
            key={i}
            cx={50 + i * 10}
            cy={50 - i * 5}
            r={2}
            fill="#BAE6FD"
            variants={{
                active: { y: -20, opacity: 0 },
                idle: { y: 0, opacity: 1 }
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
         />
      ))}

    </motion.svg>
  )
}
