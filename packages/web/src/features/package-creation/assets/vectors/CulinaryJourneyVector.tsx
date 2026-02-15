import { motion } from 'motion/react'
import { useState } from 'react'
import { VectorProps } from './types'

// Culinary Journey - Chef Hat with Steam
export function CulinaryJourneyVector({
  className = '',
  isActive = false,
  size = 80,
}: VectorProps) {
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
    >
      {/* Plate */}
      <motion.ellipse
        cx="50"
        cy="70"
        rx="28"
        ry="6"
        fill="#F57C00"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Plate Detail */}
      <motion.ellipse
        cx="50"
        cy="70"
        rx="24"
        ry="5"
        fill="#FF9800"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />

      {/* Chef Hat Base */}
      <motion.rect
        x="35"
        y="60"
        width="30"
        height="10"
        rx="2"
        fill="url(#culinaryHatBaseGradient)"
        stroke="#9D4EDD"
        strokeWidth="1"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{ transformOrigin: 'bottom' }}
      />

      {/* Chef Hat Puffy Top */}
      <motion.path
        d="M38 60C38 52 42 45 50 45C58 45 62 52 62 60Z"
        fill="#fff"
        stroke="#00D4FF"
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5, type: 'spring', stiffness: 200 }}
      />

      {/* Hat Pleats */}
      {[0, 1, 2, 3].map((i) => (
        <motion.line
          key={i}
          x1={40 + i * 5}
          y1={60}
          x2={40 + i * 5}
          y2={50}
          stroke="#F5F5F5"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.7 + i * 0.05 }}
        />
      ))}

      {/* Steam Rising */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${42 + i * 8} 43Q${44 + i * 8} 38 ${42 + i * 8} 33Q${40 + i * 8} 28 ${42 + i * 8} 23`}
          stroke="#90CAF9"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Fork and Knife Crossed */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
      >
        {/* Fork */}
        <motion.g transform="rotate(-15 20 72)">
          <motion.line
            x1="20"
            y1="65"
            x2="20"
            y2="78"
            stroke="#E65100"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.line
            x1="18"
            y1="65"
            x2="18"
            y2="70"
            stroke="#E65100"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <motion.line
            x1="22"
            y1="65"
            x2="22"
            y2="70"
            stroke="#E65100"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Knife */}
        <motion.g transform="rotate(15 80 72)">
          <motion.line
            x1="80"
            y1="65"
            x2="80"
            y2="78"
            stroke="#E65100"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.path d="M78 65L80 68L82 65Z" fill="#E65100" />
        </motion.g>
      </motion.g>

      {/* Stars on hover */}
      {isHovered && (
        <>
          <motion.circle
            cx="30"
            cy="52"
            r="2"
            fill="#9D4EDD"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.circle
            cx="70"
            cy="52"
            r="2"
            fill="#00D4FF"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}

      <defs>
        <linearGradient id="culinaryHatBaseGradient" x1="35" y1="60" x2="65" y2="70">
          <stop offset="0%" stopColor="#F3E5F5" />
          <stop offset="100%" stopColor="#E1F5FE" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
