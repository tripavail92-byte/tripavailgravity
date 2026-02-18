import { motion } from 'motion/react'

import { VectorProps } from './types'

export function LuxuryExperienceVector({
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
        <linearGradient id="luxCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

         <linearGradient id="luxGem" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        <linearGradient id="luxCushion" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>

        <filter id="luxShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feFlood floodColor="#000000" floodOpacity="0.25" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="luxGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>

      {/* Radiant Background */}
      <motion.circle
        cx="60"
        cy="60"
        r="50"
        fill="url(#luxCrown)"
        opacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: 180 }}
        transition={{ duration: 0.8 }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="40"
        stroke="#FCD34D"
        strokeWidth="1"
        strokeDasharray="2 4"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        opacity="0.4"
      />

       {/* Cushion */}
       <motion.rect
        x="30"
        y="80"
        width="60"
        height="20"
        rx="10"
        fill="url(#luxCushion)"
        filter="url(#luxShadow)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
       />
       <motion.rect
        x="35"
        y="85"
        width="50"
        height="10"
        rx="5"
        fill="#FFFFFF"
        opacity="0.1"
       />

      {/* Crown */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
      >
        <path 
            d="M35 60 L40 35 L55 55 L60 25 L65 55 L80 35 L85 60 Q60 70 35 60 Z" 
            fill="url(#luxCrown)" 
            filter="url(#luxShadow)"
        />
        
        {/* Gems on Crown */}
        <circle cx="40" cy="35" r="3" fill="#FFFFFF" />
        <circle cx="60" cy="25" r="4" fill="#FFFFFF" />
        <circle cx="80" cy="35" r="3" fill="#FFFFFF" />
        
        {/* Central Gem */}
        <motion.path
            d="M60 45 L55 52 L60 60 L65 52 Z"
            fill="url(#luxGem)"
             variants={{
                active: { scale: [1, 1.2, 1], filter: "brightness(1.2)" },
                idle: { scale: 1 }
            }}
            transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.g>

      {/* Shine/Sparkles */}
       {[...Array(3)].map((_, i) => (
         <motion.path
            key={i}
            d="M60 10 L62 18 L70 20 L62 22 L60 30 L58 22 L50 20 L58 18 Z"
            fill="#FCD34D"
            variants={{
                active: { 
                     scale: [0, 1, 0],
                     rotate: 180,
                     x: i === 0 ? -30 : i === 1 ? 30 : 0,
                     y: i === 0 ? 10 : i === 1 ? 20 : -10
                },
                idle: { scale: 0 }
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
         />
       ))}

    </motion.svg>
  )
}
