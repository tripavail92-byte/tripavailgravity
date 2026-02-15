import { motion } from 'motion/react'
import { useState } from 'react'
import { VectorProps } from './types'

// Wellness Retreat - Person Doing Yoga
export function WellnessRetreatVector({
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
      {/* Peaceful Background Circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="38"
        fill="#F3E5F5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 0.5 }}
      />

      {/* Sunrise/Glow */}
      <motion.circle
        cx="50"
        cy="30"
        r="10"
        fill="#FFD700"
        opacity="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Yoga Mat */}
      <motion.rect
        x="30"
        y="60"
        width="40"
        height="4"
        rx="2"
        fill="url(#wellnessYogaMatGradient)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Person in Lotus/Meditation Pose */}
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Head */}
        <motion.circle
          cx="50"
          cy="40"
          r="6"
          fill="#9D4EDD"
          animate={isActive ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Body (Torso) */}
        <motion.rect
          x="46"
          y="47"
          width="8"
          height="10"
          rx="2"
          fill="url(#wellnessYogaBodyGradient)"
          animate={isActive ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Left Arm (raised, bent at elbow - meditation mudra) */}
        <motion.path
          d="M46 50L40 48L38 53"
          stroke="#9D4EDD"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5 }}
        />

        {/* Right Arm (raised, bent at elbow - meditation mudra) */}
        <motion.path
          d="M54 50L60 48L62 53"
          stroke="#00D4FF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6 }}
        />

        {/* Legs in Lotus Position */}
        <motion.ellipse
          cx="50"
          cy="60"
          rx="10"
          ry="4"
          fill="#00D4FF"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7 }}
        />

        {/* Hand Mudras (meditation gesture) */}
        <motion.circle
          cx="38"
          cy="53"
          r="2"
          fill="#CE93D8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        />
        <motion.circle
          cx="62"
          cy="53"
          r="2"
          fill="#CE93D8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.85 }}
        />
      </motion.g>

      {/* Peaceful Energy Aura/Chakra */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="50"
          cy="40"
          r={8 + i * 4}
          stroke="#E1BEE7"
          strokeWidth="1"
          fill="none"
          opacity={0.3 - i * 0.08}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3 - i * 0.08, 0.1, 0.3 - i * 0.08],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Decorative Leaves */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        {/* Left Leaf */}
        <motion.path
          d="M20 55Q18 50 20 45Q22 50 20 55"
          fill="#10B981"
          opacity="0.6"
          animate={isActive ? { rotate: [0, 5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '20px 50px' }}
        />

        {/* Right Leaf */}
        <motion.path
          d="M80 55Q78 50 80 45Q82 50 80 55"
          fill="#10B981"
          opacity="0.6"
          animate={isActive ? { rotate: [0, -5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          style={{ transformOrigin: '80px 50px' }}
        />
      </motion.g>

      {/* Floating Lotus Petals on Hover */}
      {isHovered &&
        [
          { x: 30, y: 35, delay: 0 },
          { x: 70, y: 38, delay: 0.3 },
          { x: 40, y: 25, delay: 0.6 },
        ].map((petal, i) => (
          <motion.ellipse
            key={i}
            cx={petal.x}
            cy={petal.y}
            rx="3"
            ry="5"
            fill="#E1BEE7"
            opacity="0.7"
            initial={{ y: petal.y + 20, opacity: 0, rotate: 0 }}
            animate={{
              y: [petal.y + 20, petal.y - 10, petal.y - 10],
              opacity: [0, 0.7, 0],
              rotate: [0, 180, 180],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: petal.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Om Symbol */}
      {isActive && (
        <motion.text
          x="50"
          y="78"
          textAnchor="middle"
          fill="#9C27B0"
          fontSize="12"
          fontWeight="bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ॐ
        </motion.text>
      )}

      {/* Breathing Indicator Dots */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={45 + i * 5}
          cy="20"
          r="1.5"
          fill={i === 0 ? '#9D4EDD' : i === 1 ? '#7E69D6' : '#00D4FF'}
          opacity="0.4"
          initial={{ scale: 0 }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}

      <defs>
        <linearGradient id="wellnessYogaMatGradient" x1="30" y1="62" x2="70" y2="62">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
        <linearGradient id="wellnessYogaBodyGradient" x1="46" y1="47" x2="54" y2="57">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
