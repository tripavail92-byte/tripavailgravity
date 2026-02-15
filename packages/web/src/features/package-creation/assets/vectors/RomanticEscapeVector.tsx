import { motion } from 'motion/react'
import { useState } from 'react'
import { VectorProps } from './types'

// Romantic Escape - Couple with Heart in the Middle
export function RomanticEscapeVector({ className = '', isActive = false, size = 80 }: VectorProps) {
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
      animate={isActive ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Background Sunset Circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="38"
        fill="#FFE5EC"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 0.5 }}
      />

      {/* Person 1 (Left - Male) */}
      <motion.g
        initial={{ x: -15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Head */}
        <motion.circle cx="32" cy="45" r="6" fill="#9D4EDD" />
        {/* Body */}
        <motion.rect x="27" y="52" width="10" height="16" rx="3" fill="#9D4EDD" />
        {/* Arm reaching toward center */}
        <motion.path
          d="M37 56L42 50"
          stroke="#9D4EDD"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8 }}
        />
      </motion.g>

      {/* Person 2 (Right - Female) */}
      <motion.g
        initial={{ x: 15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Head */}
        <motion.circle cx="68" cy="45" r="6" fill="#00D4FF" />
        {/* Body (dress shape) */}
        <motion.path d="M63 52L68 52L70 68L66 68Z" fill="#00D4FF" />
        {/* Arm reaching toward center */}
        <motion.path
          d="M63 56L58 50"
          stroke="#00D4FF"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.9 }}
        />
      </motion.g>

      {/* Center Heart */}
      <motion.path
        d="M50 58L40 48C37 45 37 40 40 37C43 34 48 34 50 38C52 34 57 34 60 37C63 40 63 45 60 48L50 58Z"
        fill="url(#romanticHeartGradient)"
        initial={{ scale: 0, rotate: -10 }}
        animate={{
          scale: isActive ? [1, 1.15, 1] : 1,
          rotate: 0,
        }}
        transition={{
          scale: { duration: 1.5, repeat: Infinity },
          rotate: { duration: 0.6, type: 'spring', stiffness: 200 },
        }}
      />

      {/* Heart Shine */}
      <motion.ellipse
        cx="46"
        cy="42"
        rx="4"
        ry="6"
        fill="#fff"
        opacity="0.4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2 }}
      />

      {/* Floating Hearts Around Couple */}
      {[
        { x: 25, y: 30, delay: 0 },
        { x: 75, y: 32, delay: 0.3 },
        { x: 30, y: 70, delay: 0.6 },
        { x: 70, y: 68, delay: 0.9 },
      ].map((heart, i) => (
        <motion.path
          key={i}
          d={`M${heart.x} ${heart.y}C${heart.x} ${heart.y} ${heart.x - 1.5} ${heart.y - 1.5} ${heart.x - 1.5} ${heart.y - 2.5}C${heart.x - 1.5} ${heart.y - 3.5} ${heart.x} ${heart.y - 4} ${heart.x + 1} ${heart.y - 3.5}C${heart.x + 2} ${heart.y - 4} ${heart.x + 3} ${heart.y - 3.5} ${heart.x + 3} ${heart.y - 2.5}C${heart.x + 3} ${heart.y - 1.5} ${heart.x + 1.5} ${heart.y} ${heart.x + 1} ${heart.y + 1.5}Z`}
          fill="#E91E63"
          opacity="0.5"
          initial={{ y: heart.y + 10, opacity: 0 }}
          animate={{
            y: [heart.y + 10, heart.y - 10, heart.y - 10],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: heart.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Ground/Base Line */}
      <motion.line
        x1="22"
        y1="70"
        x2="78"
        y2="70"
        stroke="#F8BBD0"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />

      {/* Sparkles on Hover */}
      {isHovered &&
        [
          { x: 40, y: 35 },
          { x: 60, y: 37 },
        ].map((sparkle, i) => (
          <motion.g key={i}>
            <motion.line
              x1={sparkle.x - 2}
              y1={sparkle.y}
              x2={sparkle.x + 2}
              y2={sparkle.y}
              stroke="#FFD700"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
            <motion.line
              x1={sparkle.x}
              y1={sparkle.y - 2}
              x2={sparkle.x}
              y2={sparkle.y + 2}
              stroke="#FFD700"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2 + 0.1,
              }}
            />
          </motion.g>
        ))}

      <defs>
        <linearGradient id="romanticHeartGradient" x1="40" y1="37" x2="60" y2="58">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
