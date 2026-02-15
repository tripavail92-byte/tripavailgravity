import { motion } from 'motion/react'
import { useState } from 'react'

import { VectorProps } from './types'

// Weekend Getaway - Jeep with Luggage and Family on Road Trip
export function WeekendGetawayVector({ className = '', isActive = false, size = 80 }: VectorProps) {
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
      animate={isActive ? { x: [0, 2, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Sun */}
      <motion.circle
        cx="20"
        cy="25"
        r="8"
        fill="#FDB022"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4 }}
      />

      {/* Road */}
      <motion.rect
        x="0"
        y="65"
        width="100"
        height="20"
        fill="#6B7280"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ transformOrigin: 'left' }}
      />

      {/* Road Lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={i}
          x={10 + i * 20}
          y="74"
          width="10"
          height="2"
          fill="#FFD700"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Jeep Body */}
      <motion.rect
        x="40"
        y="48"
        width="35"
        height="18"
        rx="2"
        fill="url(#weekendJeepGradient)"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 40, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />

      {/* Jeep Hood */}
      <motion.path
        d="M40 55L35 60L40 60Z"
        fill="#9D4EDD"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      />

      {/* Jeep Cabin/Windows */}
      <motion.rect
        x="48"
        y="42"
        width="20"
        height="8"
        rx="1"
        fill="#90CAF9"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        style={{ transformOrigin: 'bottom' }}
      />

      {/* Windshield Divider */}
      <motion.line
        x1="58"
        y1="42"
        x2="58"
        y2="50"
        stroke="#fff"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8 }}
      />

      {/* Family Silhouettes in Jeep */}
      <motion.circle
        cx="52"
        cy="46"
        r="2"
        fill="#455A64"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9 }}
      />
      <motion.circle
        cx="64"
        cy="46"
        r="2"
        fill="#455A64"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.95 }}
      />

      {/* Luggage on Top */}
      <motion.rect
        x="50"
        y="36"
        width="8"
        height="6"
        rx="1"
        fill="#D84315"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 36, opacity: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      />
      <motion.rect
        x="59"
        y="37"
        width="6"
        height="5"
        rx="1"
        fill="#FF5722"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 37, opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.1 }}
      />

      {/* Wheels */}
      <motion.circle
        cx="48"
        cy="66"
        r="5"
        fill="#37474F"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: isActive ? 360 : 0 }}
        transition={{
          scale: { duration: 0.3, delay: 1.2 },
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
        }}
      />
      <motion.circle cx="48" cy="66" r="3" fill="#CFD8DC" />

      <motion.circle
        cx="67"
        cy="66"
        r="5"
        fill="#37474F"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: isActive ? 360 : 0 }}
        transition={{
          scale: { duration: 0.3, delay: 1.25 },
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
        }}
      />
      <motion.circle cx="67" cy="66" r="3" fill="#CFD8DC" />

      {/* Headlight */}
      <motion.circle
        cx="37"
        cy="58"
        r="2"
        fill="#FFD700"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.3 }}
      />

      {/* Dust Clouds Behind Jeep */}
      {isHovered &&
        [0, 1, 2].map((i) => (
          <motion.ellipse
            key={i}
            cx={32 - i * 8}
            cy={68}
            rx="4"
            ry="2"
            fill="#D1D5DB"
            opacity="0.5"
            initial={{ x: 0, opacity: 0 }}
            animate={{
              x: [-10, -20],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

      {/* Flying Birds */}
      {[0, 1].map((i) => (
        <motion.path
          key={i}
          d={`M${65 + i * 10} ${22 + i * 3}C${67 + i * 10} ${21 + i * 3} ${69 + i * 10} ${21 + i * 3} ${71 + i * 10} ${22 + i * 3}`}
          stroke="#546E7A"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ x: -30, opacity: 0 }}
          animate={{
            x: [0, 30],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'linear',
          }}
        />
      ))}

      <defs>
        <linearGradient id="weekendJeepGradient" x1="40" y1="48" x2="75" y2="66">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
