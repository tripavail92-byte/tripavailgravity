import { motion } from 'motion/react';

interface AnimatedUserIconProps {
  className?: string;
}

export function AnimatedUserIcon({ className = "w-5 h-5" }: AnimatedUserIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="avatarGradient" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#F4A261" />
          <stop offset="50%" stopColor="#E76F51" />
          <stop offset="100%" stopColor="#E9C46A" />
        </radialGradient>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A9D8F" />
          <stop offset="50%" stopColor="#264653" />
          <stop offset="100%" stopColor="#2A9D8F" />
        </linearGradient>
      </defs>
      
      {/* Head circle */}
      <motion.circle
        cx="12"
        cy="8"
        r="4"
        stroke="#E76F51"
        strokeWidth="2"
        fill="url(#avatarGradient)"
        animate={{
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Face features */}
      <motion.circle
        cx="10.5"
        cy="7.5"
        r="0.4"
        fill="#2C3E50"
        animate={{
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="13.5"
        cy="7.5"
        r="0.4"
        fill="#2C3E50"
        animate={{
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      />
      
      <motion.path
        d="M10.5 9.5C11 10 12 10 13.5 9.5"
        stroke="#C0392B"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Body path */}
      <motion.path
        d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21"
        stroke="#2A9D8F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#bodyGradient)"
        animate={{
          pathLength: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Travel badges/achievements around user */}
      <motion.circle
        cx="8"
        cy="6"
        r="0.8"
        fill="#F1C40F"
        animate={{
          scale: [1, 1.4, 1],
          fill: ["#F1C40F", "#F39C12", "#F1C40F"],
          x: [0, 1, 0],
          y: [0, -1, 0]
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
        r="0.6"
        fill="#E74C3C"
        animate={{
          scale: [1, 1.5, 1],
          fill: ["#E74C3C", "#C0392B", "#E74C3C"],
          x: [0, -1, 0],
          y: [0, 1, 0]
        }}
        transition={{
          duration: 2.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      <motion.circle
        cx="12"
        cy="4"
        r="0.5"
        fill="#9B59B6"
        animate={{
          scale: [1, 1.6, 1],
          fill: ["#9B59B6", "#8E44AD", "#9B59B6"],
          y: [0, -2, 0]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      {/* Activity indicators */}
      <motion.path
        d="M4 12C4.5 11.5 5.5 11.5 6 12"
        stroke="#27AE60"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: [0, 1, 0],
          stroke: ["#27AE60", "#2ECC71", "#27AE60"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M18 14C18.5 13.5 19.5 13.5 20 14"
        stroke="#3498DB"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: [0, 1, 0],
          stroke: ["#3498DB", "#5DADE2", "#3498DB"]
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
      />
      
      {/* Breathing/pulse effect on the main figure */}
      <motion.g
        animate={{
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Inner glow effect */}
        <motion.circle
          cx="12"
          cy="8"
          r="2.5"
          fill="#F39C12"
          opacity="0.2"
          animate={{
            scale: [0.8, 1.3, 0.8],
            opacity: [0.2, 0.05, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.g>
      
      {/* Status indicator */}
      <motion.circle
        cx="16"
        cy="6"
        r="2"
        fill="none"
        stroke="#27AE60"
        strokeWidth="1"
        opacity="0.4"
        animate={{
          scale: [0.8, 1.4, 0.8],
          opacity: [0.4, 0.1, 0.4],
          stroke: ["#27AE60", "#2ECC71", "#27AE60"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Travel milestone stars */}
      <motion.path
        d="M5 18L6 16L7 18L6 20L5 18Z"
        fill="#FFD700"
        animate={{
          scale: [0, 1.2, 0],
          opacity: [0, 1, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut",
          delay: 1.5
        }}
      />
      
      <motion.path
        d="M19 17L20 15L21 17L20 19L19 17Z"
        fill="#FF6B6B"
        animate={{
          scale: [0, 1.1, 0],
          opacity: [0, 1, 0],
          rotate: [0, -180, -360]
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeOut",
          delay: 2
        }}
      />
      
      {/* Connection lines */}
      <motion.path
        d="M8 12C10 10 14 10 16 12"
        stroke="#85C1E9"
        strokeWidth="1"
        strokeDasharray="2,2"
        fill="none"
        opacity="0.5"
        animate={{
          pathLength: [0, 1, 0],
          opacity: [0.5, 0.2, 0.5]
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