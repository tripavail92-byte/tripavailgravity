import { motion } from 'motion/react'

import { VectorProps } from './types'

export function CulinaryJourneyVector({
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
        <linearGradient id="culCloche" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        
        <linearGradient id="culPlate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>

        <filter id="culShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feFlood floodColor="#000000" floodOpacity="0.2" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Decorative Table Circle */}
      <motion.circle
        cx="60"
        cy="90"
        r="40"
        fill="#FEF3C7"
        opacity="0.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Plate */}
      <motion.ellipse
        cx="60"
        cy="90"
        rx="45"
        ry="12"
        fill="url(#culPlate)"
        filter="url(#culShadow)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      />
      <motion.ellipse
        cx="60"
        cy="90"
        rx="30"
        ry="8"
        stroke="#E2E8F0"
        strokeWidth="1"
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />

      {/* Cloche (Lid) */}
      <motion.path
        d="M20 90 Q20 40 60 40 Q100 40 100 90"
        fill="url(#culCloche)"
        stroke="#64748B"
        strokeWidth="1"
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
            y: isActive ? -20 : 0,
            opacity: 1
        }}
        transition={{ 
            duration: 0.8, 
            type: "spring", 
            bounce: 0.4
        }}
      />
      
      {/* Cloche Handle */}
      <motion.circle
        cx="60"
        cy="40"
        r="5"
        fill="#64748B"
        initial={{ scale: 0 }}
        animate={{ 
            scale: 1,
            y: isActive ? -20 : 0
        }}
        transition={{ delay: 0.3 }}
      />

      {/* Food Reveal (Inside) */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
          {/* Steak/Food Item */}
          <ellipse cx="60" cy="88" rx="20" ry="8" fill="#713F12" />
          <path d="M50 88 Q60 80 70 88" stroke="#A16207" strokeWidth="2" />
          
           {/* Steam */}
          {[...Array(3)].map((_, i) => (
            <motion.path
                key={i}
                d={`M${55 + i * 5} 80 Q${60 + i * 5} 70 ${55 + i * 5} 60`}
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
                variants={{
                    active: { y: [-5, -15], opacity: [0, 0.6, 0] },
                    idle: { opacity: 0 }
                }}
                transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.3,
                    ease: "easeOut"
                }}
            />
          ))}
      </motion.g>

      {/* Fork and Knife */}
      <motion.g
         initial={{ opacity: 0, x: -10 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.6 }}
      >
        {/* Knife */}
        <rect x="105" y="60" width="4" height="40" fill="#94A3B8" rx="1" />
        <rect x="105" y="100" width="4" height="15" fill="#475569" rx="1" />
      </motion.g>
      
       <motion.g
         initial={{ opacity: 0, x: 10 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.6 }}
      >
         {/* Fork */}
        <rect x="10" y="60" width="4" height="40" fill="#94A3B8" rx="1" />
        <path d="M10 60 L6 50 M14 60 L18 50 M12 60 L12 50" stroke="#94A3B8" strokeWidth="2" />
        <rect x="10" y="100" width="4" height="15" fill="#475569" rx="1" />
      </motion.g>

    </motion.svg>
  )
}
