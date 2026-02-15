import { motion } from 'motion/react'
import { useState } from 'react'

import { VectorProps } from './types'

// Adventure Package - Mountain Peak with Flag
export function AdventurePackageVector({
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
      {/* Sky/Background Circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        fill="#E3F2FD"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Back Mountains */}
      <motion.path
        d="M10 75L30 45L50 60L70 35L90 75Z"
        fill="#9D4EDD"
        opacity="0.4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 0.4 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />

      {/* Front Mountain */}
      <motion.path
        d="M15 75L35 50L55 65L75 40L85 75Z"
        fill="url(#adventureMountainGradient)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />

      {/* Snow Caps */}
      <motion.path
        d="M35 50L40 42L45 50L42 52Z"
        fill="#fff"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 }}
      />
      <motion.path
        d="M75 40L80 32L85 40L82 42Z"
        fill="#fff"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
      />

      {/* Flag Pole */}
      <motion.line
        x1="80"
        y1="32"
        x2="80"
        y2="20"
        stroke="#FFD700"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      />

      {/* Waving Flag */}
      <motion.path
        d="M80 20L88 22L86 26L80 24Z"
        fill="#FFD700"
        initial={{ scaleX: 0 }}
        animate={{
          scaleX: 1,
          x: isActive ? [0, 1, 0] : 0,
        }}
        transition={{
          scaleX: { duration: 0.4, delay: 1 },
          x: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{ transformOrigin: 'left' }}
      />

      {/* Sun */}
      <motion.circle
        cx="25"
        cy="30"
        r="8"
        fill="#FDB022"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />

      {/* Clouds */}
      {isHovered && (
        <motion.g
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: [0, 15, 0], opacity: 1 }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <motion.ellipse cx="60" cy="28" rx="6" ry="3" fill="#fff" opacity="0.8" />
          <motion.ellipse cx="65" cy="26" rx="5" ry="3" fill="#fff" opacity="0.8" />
        </motion.g>
      )}

      <defs>
        <linearGradient id="adventureMountainGradient" x1="15" y1="40" x2="85" y2="75">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
