import { motion } from 'motion/react'

import { VectorProps } from './types'

export function CustomPackageVector({
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
        <linearGradient id="custBlock1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>

        <linearGradient id="custBlock2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="custBlock3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

         <filter id="custShadow" x="-50%" y="-50%" width="200%" height="200%">
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

      {/* Building Blocks */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Block 1 (Left) */}
        <motion.rect
            x="30"
            y="70"
            width="25"
            height="25"
            rx="4"
            fill="url(#custBlock1)"
            filter="url(#custShadow)"
            whileHover={{ scale: 1.1 }}
        />
         {/* Block 2 (Right) */}
        <motion.rect
            x="65"
            y="70"
            width="25"
            height="25"
            rx="4"
            fill="url(#custBlock2)"
            filter="url(#custShadow)"
             whileHover={{ scale: 1.1 }}
             transition={{ delay: 0.1 }}
        />
         {/* Block 3 (Top) */}
        <motion.rect
            x="48"
            y="42"
            width="25"
            height="25"
            rx="4"
            fill="url(#custBlock3)"
            filter="url(#custShadow)"
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.4, type: "spring" }}
        />
      </motion.g>

      {/* Connection Lines (Dotted) */}
      <path d="M55 70 L60 67" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 2" />
      <path d="M65 70 L60 67" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 2" />

      {/* Magic Wand / Pencil */}
       <motion.g
         initial={{ rotate: -45, x: 20, y: -20, opacity: 0 }}
         animate={{ 
            rotate: isActive ? [-45, -30, -45] : -45,
            x: 0, 
            y: 0,
            opacity: 1
         }}
         transition={{ delay: 0.6, duration: 1 }}
       >
          <rect x="80" y="20" width="8" height="40" rx="4" fill="#64748B" transform="rotate(30 84 40)"/>
          <path d="M80 60 L84 70 L88 60 Z" fill="#334155" transform="rotate(30 84 65)" />
          <rect x="78" y="20" width="12" height="6" fill="#F1F5F9" transform="rotate(30 84 23)" />
       </motion.g>

       {/* Sparkles */}
       {isActive && [...Array(3)].map((_, i) => (
         <motion.path
            key={i}
            d="M90 50 L93 45 L96 50 L101 53 L96 56 L93 61 L90 56 L85 53 Z"
            fill="#FCD34D"
            initial={{ scale: 0 }}
            animate={{ 
                scale: [0, 1, 0],
                x: i === 0 ? 0 : i === 1 ? -20 : 10,
                y: i === 0 ? 0 : i === 1 ? -10 : 20
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
         />
       ))}

    </motion.svg>
  )
}
