import { motion } from 'motion/react'

import { VectorProps } from './types'

export function CulturalHistoryVector({
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
        <linearGradient id="cultTemple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <linearGradient id="cultPillar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>

        <filter id="cultShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feFlood floodColor="#000000" floodOpacity="0.15" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background Circle */}
      <motion.circle
        cx="60"
        cy="60"
        r="50"
        fill="#FFEDD5"
        opacity="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Temple Base */}
      <motion.rect
        x="20"
        y="90"
        width="80"
        height="10"
        fill="#78350F"
        rx="2"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.rect
        x="30"
        y="85"
        width="60"
        height="5"
        fill="#92400E"
        rx="1"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      />

      {/* Pillars */}
      {[...Array(4)].map((_, i) => (
        <motion.rect
          key={i}
          x={35 + i * 16}
          y="50"
          width="6"
          height="35"
          fill="url(#cultPillar)"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          style={{ originY: 1 }}
        />
      ))}

      {/* Temple Roof */}
      <motion.path
        d="M20 50 L60 25 L100 50 L90 50 L60 30 L30 50 Z"
        fill="url(#cultTemple)"
        filter="url(#cultShadow)"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      />

      {/* Sun/Moon */}
      <motion.circle
        cx="60"
        cy="20"
        r="8"
        fill="#BE185D"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
      />

      {/* Scroll/Map (Floating) */}
      <motion.g
        variants={{
          active: { y: [0, -5, 0] },
          idle: { y: 0 },
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect
          x="80"
          y="60"
          width="20"
          height="25"
          rx="2"
          fill="#FEF3C7"
          stroke="#92400E"
          strokeWidth="1"
          transform="rotate(15 90 72)"
        />
        <path
          d="M85 65 L95 65 M85 70 L95 70 M85 75 L90 75"
          stroke="#92400E"
          strokeWidth="1"
          transform="rotate(15 90 72)"
        />
      </motion.g>

      {/* Sparkles */}
      {isActive && (
        <>
          <motion.path
            d="M30 30 L32 25 L34 30 L39 32 L34 34 L32 39 L30 34 L25 32 Z"
            fill="#FCD34D"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0], rotate: 180 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.path
            d="M90 30 L92 25 L94 30 L99 32 L94 34 L92 39 L90 34 L85 32 Z"
            fill="#FCD34D"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0], rotate: 180 }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </>
      )}
    </motion.svg>
  )
}
