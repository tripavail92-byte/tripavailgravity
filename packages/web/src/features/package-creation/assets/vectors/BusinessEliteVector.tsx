import { motion } from 'motion/react'

import { VectorProps } from './types'

export function BusinessEliteVector({ className = '', isActive = false, size = 120 }: VectorProps) {
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
        <linearGradient id="bizSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="bizBuilding1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        <linearGradient id="bizBuilding2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        <linearGradient id="bizGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        <filter id="bizShadow" x="-50%" y="-50%" width="200%" height="200%">
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

      {/* Skyscraper 1 (Back) */}
      <motion.rect
        x="20"
        y="40"
        width="30"
        height="80"
        fill="url(#bizBuilding2)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />
      {/* Windows 1 */}
      {[...Array(3)].map((_, i) => (
        <motion.rect
          key={`w1-${i}`}
          x="25"
          y={50 + i * 15}
          width="20"
          height="8"
          fill="#CBD5E1"
          opacity="0.5"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        />
      ))}

      {/* Skyscraper 2 (Main) */}
      <motion.rect
        x="45"
        y="20"
        width="40"
        height="100"
        fill="url(#bizBuilding1)"
        rx="2"
        filter="url(#bizShadow)"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.2 }}
      />

      {/* Glass Front Reflection */}
      <motion.path d="M45 20 L85 20 L85 120 L45 120 Z" fill="url(#bizGlass)" opacity="0.1" />
      <motion.path d="M45 20 L85 60 L45 100 Z" fill="white" opacity="0.05" />

      {/* Windows 2 (Grid) */}
      {[...Array(5)].map((_, i) => (
        <motion.g key={`w2-${i}`}>
          <motion.rect
            x="50"
            y={30 + i * 12}
            width="12"
            height="8"
            fill="#E0F2FE"
            opacity="0.3"
            variants={{
              active: { opacity: [0.3, 0.8, 0.3] },
              idle: { opacity: 0.3 },
            }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
          <motion.rect
            x="68"
            y={30 + i * 12}
            width="12"
            height="8"
            fill="#E0F2FE"
            opacity="0.3"
            variants={{
              active: { opacity: [0.3, 0.8, 0.3] },
              idle: { opacity: 0.3 },
            }}
            transition={{ duration: 2, delay: i * 0.2 + 1, repeat: Infinity }}
          />
        </motion.g>
      ))}

      {/* Briefcase (Foreground) */}
      <motion.g
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.6, type: 'spring' }}
      >
        <rect
          x="75"
          y="85"
          width="36"
          height="26"
          rx="3"
          fill="#B45309"
          stroke="#78350F"
          strokeWidth="2"
        />
        <path
          d="M88 85 V80 C88 78 90 76 93 76 H93 C96 76 98 78 98 80 V85"
          stroke="#78350F"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="93" cy="98" r="3" fill="#FCD34D" />
        <rect x="75" y="85" width="5" height="26" fill="#78350F" opacity="0.2" />
        <rect x="106" y="85" width="5" height="26" fill="#78350F" opacity="0.2" />
      </motion.g>

      {/* Plane (Flying past) */}
      <motion.path
        d="M10 20 L18 18 L14 26 Z"
        fill="#3B82F6"
        variants={{
          active: { x: [0, 100], y: [0, -10], opacity: [0, 1, 0] },
          idle: { opacity: 0 },
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: 1 }}
      />
    </motion.svg>
  )
}
