import { motion } from 'motion/react'

import { VectorProps } from './types'

export function WeekendGetawayVector({
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
        <linearGradient id="weekCal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="weekHeader" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        
         <linearGradient id="weekCase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>

         <filter id="weekShadow" x="-50%" y="-50%" width="200%" height="200%">
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

      {/* Calendar */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <rect x="25" y="30" width="70" height="60" rx="4" fill="url(#weekCal)" filter="url(#weekShadow)" />
        <path d="M25 34 C25 31.7909 26.7909 30 29 30 H91 C93.2091 30 95 31.7909 95 34 V45 H25 V34 Z" fill="url(#weekHeader)" />
        
        {/* Rings */}
        <rect x="35" y="25" width="4" height="10" rx="2" fill="#94A3B8" />
        <rect x="58" y="25" width="4" height="10" rx="2" fill="#94A3B8" />
        <rect x="81" y="25" width="4" height="10" rx="2" fill="#94A3B8" />

        {/* Days Grid */}
        <circle cx="40" cy="60" r="3" fill="#CBD5E1" />
        <circle cx="50" cy="60" r="3" fill="#CBD5E1" />
        <circle cx="60" cy="60" r="3" fill="#CBD5E1" />
        <circle cx="70" cy="60" r="3" fill="#CBD5E1" />
        <circle cx="80" cy="60" r="3" fill="#EF4444" /> {/* Weekend highlight */}
        
        <circle cx="40" cy="75" r="3" fill="#CBD5E1" />
        <circle cx="50" cy="75" r="3" fill="#CBD5E1" />
        <circle cx="60" cy="75" r="3" fill="#CBD5E1" />
        <circle cx="70" cy="75" r="3" fill="#CBD5E1" />
      </motion.g>

      {/* Suitcase (Pop up) */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      >
        <rect x="70" y="75" width="40" height="30" rx="3" fill="url(#weekCase)" stroke="#C2410C" strokeWidth="1" />
        <path d="M85 75 V70 C85 68 87 66 90 66 H90 C93 66 95 68 95 70 V75" stroke="#C2410C" strokeWidth="2" fill="none" />
        {/* Stickers */}
        <circle cx="80" cy="85" r="3" fill="#FCD34D" opacity="0.8" />
        <rect x="95" y="90" width="8" height="5" fill="#38BDF8" transform="rotate(-15 99 92.5)" opacity="0.8"/>
      </motion.g>

      {/* Sun/Weather Icon */}
       <motion.circle
        cx="100"
        cy="20"
        r="10"
        fill="#FCD34D"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
        variants={{
            active: { scale: [1, 1.2, 1], opacity: 1 },
            idle: { scale: 1 }
        }}
      />

    </motion.svg>
  )
}
