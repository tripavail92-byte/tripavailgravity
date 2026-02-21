import { motion } from 'motion/react'

import { VectorProps } from './types'

export function AdventurePackageVector({
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
        <linearGradient id="advSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>

        <linearGradient id="advMountainMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>

        <linearGradient id="advMountainSec" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>

        <linearGradient id="advSun" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        <filter id="advShadow" x="-50%" y="-50%" width="200%" height="200%">
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

      {/* Background Circle (Optional, kept subtle) */}
      <motion.circle
        cx="60"
        cy="60"
        r="55"
        fill="url(#advSky)"
        opacity="0.3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 0.8 }}
      />

      {/* Sun */}
      <motion.circle
        cx="90"
        cy="30"
        r="8"
        fill="url(#advSun)"
        variants={{
          idle: { scale: 1, y: 0 },
          active: {
            scale: [1, 1.1, 1],
            y: [0, -2, 0],
            filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))',
          },
          hover: { scale: 1.1 },
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Back Mountain */}
      <motion.path
        d="M20 90 L50 40 L80 90 Z"
        fill="url(#advMountainSec)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 0.8 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />

      {/* Snow Cap Back */}
      <motion.path
        d="M50 40 L60 56 L50 52 L40 56 Z"
        fill="#FFFFFF"
        opacity="0.9"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
      />

      {/* Main Mountain */}
      <motion.path
        d="M40 95 L80 35 L120 95 H40Z" // Shifted for composition
        transform="translate(-10, 0)"
        fill="url(#advMountainMain)"
        filter="url(#advShadow)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />

      {/* Snow Cap Main */}
      <motion.path
        d="M70 35 L85 55 L70 50 L55 55 Z"
        fill="#FFFFFF"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />

      {/* Clouds */}
      <motion.g
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 0.8 }}
        transition={{ delay: 0.6 }}
      >
        <motion.ellipse
          cx="30"
          cy="45"
          rx="12"
          ry="6"
          fill="#FFFFFF"
          variants={{
            active: { x: [0, 10, 0] },
            idle: { x: 0 },
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.ellipse
          cx="40"
          cy="50"
          rx="10"
          ry="5"
          fill="#FFFFFF"
          opacity="0.8"
          variants={{
            active: { x: [0, 8, 0] },
            idle: { x: 0 },
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </motion.g>

      {/* Flag */}
      <motion.line
        x1="70"
        y1="35"
        x2="70"
        y2="20"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.7 }}
      />
      <motion.path
        d="M70 20 L85 25 L70 30"
        fill="#EF4444"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.9 }}
        style={{ originX: 0 }}
      />

      {/* Trees (Foreground) */}
      <motion.g
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.8 }}
        style={{ originY: 1 }}
      >
        <path d="M20 95 L25 80 L30 95 Z" fill="#15803D" />
        <path d="M35 95 L40 85 L45 95 Z" fill="#166534" />
        <path d="M85 95 L90 82 L95 95 Z" fill="#15803D" />
      </motion.g>
    </motion.svg>
  )
}
