import { motion } from 'motion/react'

import { VectorProps } from './types'

export function RomanticEscapeVector({
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
        <linearGradient id="romHeart1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>

        <linearGradient id="romHeart2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>

        <filter id="romShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feFlood floodColor="#be185d" floodOpacity="0.2" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft Background */}
      <motion.circle
        cx="60"
        cy="60"
        r="50"
        fill="#FFE4E6"
        opacity="0.4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Champagne Glasses (Subtle hint) */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <path d="M40 70 L40 90 M35 90 H45" stroke="#94A3B8" strokeWidth="2" />
        <path
          d="M40 70 Q30 50 40 40 Q50 50 40 70"
          fill="#FEF3C7"
          stroke="#CBD5E1"
          strokeWidth="1"
          opacity="0.6"
        />

        <path d="M80 70 L80 90 M75 90 H85" stroke="#94A3B8" strokeWidth="2" />
        <path
          d="M80 70 Q70 50 80 40 Q90 50 80 70"
          fill="#FEF3C7"
          stroke="#CBD5E1"
          strokeWidth="1"
          opacity="0.6"
        />
      </motion.g>

      {/* Main Heart */}
      <motion.path
        d="M60 45 C60 45 50 25 35 35 C20 45 35 65 60 85 C85 65 100 45 85 35 C70 25 60 45 60 45 Z"
        fill="url(#romHeart1)"
        filter="url(#romShadow)"
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring' }}
        variants={{
          active: {
            scale: [1, 1.1, 1],
            filter: 'drop-shadow(0 4px 6px rgba(225, 29, 72, 0.3))',
          },
          idle: { scale: 1 },
        }}
      />

      {/* Secondary Heart */}
      <motion.path
        d="M85 35 C85 35 80 25 72 30 C64 35 70 45 80 55 C90 45 96 35 88 30 C80 25 85 35 85 35 Z"
        fill="url(#romHeart2)"
        initial={{ scale: 0, x: -10 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ delay: 0.5, type: 'spring' }}
        variants={{
          active: {
            y: [0, -5, 0],
            rotate: [0, 5, 0],
          },
          idle: { y: 0 },
        }}
      />

      {/* Floating Particles/Bubbles */}
      {[...Array(5)].map((_, i) => (
        <motion.circle
          key={i}
          cx={40 + i * 10}
          cy={50}
          r={1.5}
          fill="#FECDD3"
          variants={{
            active: {
              y: [-10, -30],
              x: [0, i % 2 === 0 ? 5 : -5],
              opacity: [0, 0.8, 0],
            },
            idle: { opacity: 0 },
          }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </motion.svg>
  )
}
