import { motion } from 'motion/react'
import { useState } from 'react'

import { VectorProps } from './types'

// Business Elite - Group of Well-Dressed People in Meeting
export function BusinessEliteVector({ className = '', isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      animate={isActive ? { y: [0, -2, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Conference Room Table */}
      <motion.ellipse
        cx="50"
        cy="65"
        rx="35"
        ry="8"
        fill="#90A4AE"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Table Top Surface */}
      <motion.ellipse
        cx="50"
        cy="63"
        rx="32"
        ry="7"
        fill="#B0BEC5"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />

      {/* Person 1 (Left - in suit) */}
      <motion.g
        initial={{ x: -15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Head */}
        <motion.circle cx="25" cy="40" r="5" fill="#607D8B" />
        {/* Suit Body */}
        <motion.rect x="20.5" y="46" width="9" height="14" rx="2" fill="#455A64" />
        {/* Tie */}
        <motion.rect x="24" y="46" width="2" height="8" fill="#9D4EDD" />
      </motion.g>

      {/* Person 2 (Center-Left - in suit) */}
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Head */}
        <motion.circle cx="40" cy="35" r="6" fill="#607D8B" />
        {/* Suit Body */}
        <motion.rect x="34.5" y="42" width="11" height="17" rx="2" fill="#455A64" />
        {/* Tie */}
        <motion.rect x="39" y="42" width="2" height="10" fill="#00D4FF" />
        {/* Briefcase on table */}
        <motion.rect
          x="43"
          y="58"
          width="6"
          height="4"
          rx="1"
          fill="#8D6E63"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        />
      </motion.g>

      {/* Person 3 (Center-Right - in dress) */}
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {/* Head */}
        <motion.circle cx="60" cy="35" r="6" fill="#607D8B" />
        {/* Professional Dress */}
        <motion.path d="M55 42L60 42L62 59L58 59Z" fill="url(#businessDressGradient)" />
        {/* Document on table */}
        <motion.rect
          x="51"
          y="58"
          width="5"
          height="4"
          rx="0.5"
          fill="#fff"
          stroke="#CFD8DC"
          strokeWidth="0.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9 }}
        />
      </motion.g>

      {/* Person 4 (Right - in suit) */}
      <motion.g
        initial={{ x: 15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {/* Head */}
        <motion.circle cx="75" cy="40" r="5" fill="#607D8B" />
        {/* Suit Body */}
        <motion.rect x="70.5" y="46" width="9" height="14" rx="2" fill="#455A64" />
        {/* Tie */}
        <motion.rect x="74" y="46" width="2" height="8" fill="url(#businessTieGradient)" />
      </motion.g>

      {/* Laptop on Table (Center) */}
      <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }}>
        {/* Laptop Base */}
        <motion.rect x="46" y="57" width="8" height="5" rx="0.5" fill="#37474F" />
        {/* Laptop Screen */}
        <motion.rect x="47" y="50" width="6" height="7" rx="0.5" fill="#90CAF9" />
        <motion.rect x="47.5" y="50.5" width="5" height="6" fill="#BBDEFB" />
      </motion.g>

      {/* Coffee Cups */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
        <motion.ellipse cx="32" cy="60" rx="2" ry="1.5" fill="#8D6E63" />
        <motion.rect x="30" y="58" width="4" height="2" fill="#A1887F" />

        <motion.ellipse cx="68" cy="60" rx="2" ry="1.5" fill="#8D6E63" />
        <motion.rect x="66" y="58" width="4" height="2" fill="#A1887F" />
      </motion.g>

      {/* Rising Chart/Presentation on Hover */}
      {isHovered && (
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          {/* Chart Background */}
          <motion.rect
            x="42"
            y="20"
            width="16"
            height="12"
            rx="1"
            fill="#fff"
            stroke="#CFD8DC"
            strokeWidth="0.5"
          />
          {/* Rising Bars */}
          <motion.rect
            x="44"
            y="28"
            width="2"
            height="3"
            fill="#4CAF50"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect
            x="47"
            y="26"
            width="2"
            height="5"
            fill="#4CAF50"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.1 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect
            x="50"
            y="24"
            width="2"
            height="7"
            fill="#4CAF50"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.2 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect
            x="53"
            y="25"
            width="2"
            height="6"
            fill="#4CAF50"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3 }}
            style={{ transformOrigin: 'bottom' }}
          />
        </motion.g>
      )}

      {/* Sparkle/Success Indicators */}
      {isActive &&
        [
          { x: 35, y: 28 },
          { x: 65, y: 30 },
        ].map((sparkle, i) => (
          <motion.circle
            key={i}
            cx={sparkle.x}
            cy={sparkle.y}
            r="1.5"
            fill="#FFD700"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}

      <defs>
        <linearGradient id="businessDressGradient" x1="55" y1="42" x2="62" y2="59">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
        <linearGradient id="businessTieGradient" x1="74" y1="46" x2="74" y2="54">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
