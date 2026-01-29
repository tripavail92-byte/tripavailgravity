import { motion } from 'motion/react';

interface AnimatedHomeIconProps {
  className?: string;
}

export function AnimatedHomeIcon({ className = "w-5 h-5" }: AnimatedHomeIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        y: [0, -2, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <defs>
        <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="50%" stopColor="#F7931E" />
          <stop offset="100%" stopColor="#FFD23F" />
        </linearGradient>
        <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#A0522D" />
        </linearGradient>
        <linearGradient id="doorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B4423" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
      </defs>
      
      <motion.path
        d="M3 9.5L12 2L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
        stroke="#E67E22"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#homeGradient)"
        animate={{
          pathLength: [1, 0.8, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Roof */}
      <motion.path
        d="M2 10L12 1L22 10"
        stroke="#8B4513"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      <motion.path
        d="M9 21V12H15V21"
        stroke="#8B4513"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#doorGradient)"
        initial={{ opacity: 0.8 }}
        animate={{
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Windows */}
      <motion.rect
        x="5"
        y="13"
        width="2.5"
        height="2.5"
        fill="#87CEEB"
        stroke="#4682B4"
        strokeWidth="0.5"
        rx="0.3"
        animate={{
          fill: ["#87CEEB", "#FFD700", "#87CEEB"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.rect
        x="16.5"
        y="13"
        width="2.5"
        height="2.5"
        fill="#87CEEB"
        stroke="#4682B4"
        strokeWidth="0.5"
        rx="0.3"
        animate={{
          fill: ["#87CEEB", "#FFD700", "#87CEEB"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Door knob */}
      <motion.circle
        cx="13.5"
        cy="17"
        r="0.3"
        fill="#FFD700"
        animate={{
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Chimney smoke */}
      <motion.circle
        cx="16"
        cy="6"
        r="0.5"
        fill="#E8E8E8"
        opacity="0.7"
        animate={{
          y: [0, -4, -8],
          opacity: [0.7, 0.3, 0],
          scale: [1, 1.2, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      
      <motion.circle
        cx="17"
        cy="8"
        r="0.3"
        fill="#F0F0F0"
        opacity="0.5"
        animate={{
          y: [0, -3, -6],
          opacity: [0.5, 0.2, 0],
          scale: [1, 1.1, 0.9]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5
        }}
      />
      
      {/* Welcome path */}
      <motion.path
        d="M9 21L12 19L15 21"
        stroke="#32CD32"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
        animate={{
          pathLength: [0, 1, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  );
}