import { motion } from 'motion/react'

interface VectorProps {
  className?: string
  size?: number
}

export function KYCSelfieVector({ className = '', size = 200 }: VectorProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      initial="initial"
      animate="animate"
    >
      {/* Background Circle - Soft Glow */}
      <motion.circle
        cx="100"
        cy="100"
        r="90"
        fill="#F0FDF4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* User Body/Shoulders */}
      <motion.path
        d="M40 190 C40 140, 160 140, 160 190"
        fill="#94A3B8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      />

      {/* User Head - Professional Silhouette */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        {/* Neck */}
        <rect x="92" y="115" width="16" height="15" fill="#CBD5E1" />

        {/* Head Shape */}
        <path
          d="M100 45 C125 45, 130 65, 130 85 C130 115, 115 130, 100 130 C85 130, 70 115, 70 85 C70 65, 75 45, 100 45Z"
          fill="#CBD5E1"
        />

        {/* Hair/Styling hint */}
        <path d="M70 80 C70 50, 130 50, 130 80 L130 70 C130 40, 70 40, 70 70 Z" fill="#94A3B8" />
      </motion.g>

      {/* ID Card Hand & Arm */}
      <motion.g
        initial={{ x: 40, y: 20, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        {/* Arm */}
        <path d="M140 170 L160 115" stroke="#CBD5E1" strokeWidth="14" strokeLinecap="round" />

        {/* Hand silhouette holding card */}
        <rect x="150" y="95" width="20" height="25" rx="10" fill="#CBD5E1" />

        {/* ID Card */}
        <motion.g
          initial={{ rotate: -5 }}
          animate={{ rotate: 5 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
        >
          <rect
            x="115"
            y="70"
            width="75"
            height="48"
            rx="6"
            fill="#FFFFFF"
            stroke="#3B82F6"
            strokeWidth="2"
          />
          <rect x="115" y="70" width="75" height="12" rx="6" fill="#3B82F6" />

          {/* ID Photo Placeholder */}
          <rect x="122" y="88" width="22" height="24" rx="3" fill="#E2E8F0" />

          {/* ID Lines */}
          <rect x="150" y="88" width="30" height="4" rx="2" fill="#E2E8F0" />
          <rect x="150" y="96" width="20" height="4" rx="2" fill="#E2E8F0" />
          <rect x="150" y="104" width="25" height="4" rx="2" fill="#E2E8F0" />
        </motion.g>
      </motion.g>

      {/* Success Checkmark Indicator (Top Right) */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      >
        <circle cx="175" cy="45" r="16" fill="#22C55E" />
        <motion.path
          d="M167 45 L172 50 L183 39"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        />
      </motion.g>
    </motion.svg>
  )
}
