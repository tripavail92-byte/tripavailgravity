import { motion } from 'motion/react';

interface AnimatedGlobeIconProps {
  className?: string;
}

export function AnimatedGlobeIcon({ className = "w-5 h-5" }: AnimatedGlobeIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        rotateY: [0, 360]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <defs>
        <radialGradient id="earthGradient" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="40%" stopColor="#4682B4" />
          <stop offset="100%" stopColor="#191970" />
        </radialGradient>
        <linearGradient id="continentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#228B22" />
          <stop offset="50%" stopColor="#32CD32" />
          <stop offset="100%" stopColor="#90EE90" />
        </linearGradient>
      </defs>
      
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="#20B2AA"
        strokeWidth="2"
        fill="url(#earthGradient)"
        animate={{
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Longitude lines */}
      <motion.path
        d="M2 12H22"
        stroke="#40E0D0"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
        animate={{
          pathLength: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.ellipse
        cx="12"
        cy="12"
        rx="5"
        ry="10"
        stroke="#48CAE4"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
        animate={{
          opacity: [0.6, 0.3, 0.6]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="5"
        stroke="#0077BE"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        animate={{
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Continents */}
      <motion.path
        d="M6 8C7 7 8 8 9 7C10 6 11 7 12 8C13 9 14 8 15 9"
        stroke="url(#continentGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: [0.8, 1, 0.8],
          stroke: ["#228B22", "#32CD32", "#228B22"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M8 15C9 14 10 15 11 14C12 13 13 14 14 15"
        stroke="url(#continentGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: [0.7, 1, 0.7],
          stroke: ["#32CD32", "#90EE90", "#32CD32"]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Animated cities with travel-themed colors */}
      <motion.circle
        cx="8"
        cy="8"
        r="1"
        fill="#FFD700"
        animate={{
          scale: [1, 1.5, 1],
          fill: ["#FFD700", "#FF6347", "#FFD700"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="16"
        cy="10"
        r="1"
        fill="#FF69B4"
        animate={{
          scale: [1, 1.5, 1],
          fill: ["#FF69B4", "#FF1493", "#FF69B4"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      <motion.circle
        cx="10"
        cy="16"
        r="1"
        fill="#00CED1"
        animate={{
          scale: [1, 1.5, 1],
          fill: ["#00CED1", "#20B2AA", "#00CED1"]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      {/* Travel routes */}
      <motion.path
        d="M8 8C10 10 14 6 16 10"
        stroke="#FFD700"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2,2"
        fill="none"
        opacity="0.6"
        animate={{
          pathLength: [0, 1, 0],
          opacity: [0.6, 0.3, 0.6]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M16 10C14 12 12 14 10 16"
        stroke="#FF69B4"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2,2"
        fill="none"
        opacity="0.5"
        animate={{
          pathLength: [0, 1, 0],
          opacity: [0.5, 0.2, 0.5]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </motion.svg>
  );
}