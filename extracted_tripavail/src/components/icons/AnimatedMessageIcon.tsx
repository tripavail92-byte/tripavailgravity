import { motion } from 'motion/react';

interface AnimatedMessageIconProps {
  className?: string;
}

export function AnimatedMessageIcon({ className = "w-6 h-6" }: AnimatedMessageIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="messageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9B59B6" />
          <stop offset="50%" stopColor="#8E44AD" />
          <stop offset="100%" stopColor="#7D3C98" />
        </linearGradient>
        <radialGradient id="messageGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#D7BDE2" />
          <stop offset="100%" stopColor="#A569BD" />
        </radialGradient>
        <linearGradient id="notificationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E74C3C" />
          <stop offset="100%" stopColor="#C0392B" />
        </linearGradient>
      </defs>
      
      {/* Main message bubble */}
      <motion.path
        d="M3 6C3 4.34315 4.34315 3 6 3H18C19.6569 3 21 4.34315 21 6V14C21 15.6569 19.6569 17 18 17H8L3 20V6Z"
        stroke="#7D3C98"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#messageGradient)"
        animate={{
          scale: [1, 1.05, 1],
          fill: ["url(#messageGradient)", "#A569BD", "url(#messageGradient)"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Message content lines */}
      <motion.path
        d="M7 8H17"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathLength: [0.7, 1, 0.7],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M7 11H13"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathLength: [0.6, 1, 0.6],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3
        }}
      />
      
      <motion.path
        d="M7 14H15"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathLength: [0.5, 1, 0.5],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6
        }}
      />
      
      {/* Floating message indicators */}
      <motion.circle
        cx="19"
        cy="7"
        r="1.5"
        fill="url(#notificationGradient)"
        animate={{
          scale: [1, 1.3, 1],
          fill: ["url(#notificationGradient)", "#E74C3C", "url(#notificationGradient)"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Message delivery indicator */}
      <motion.path
        d="M16 12L17 13L19 11"
        stroke="#27AE60"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          pathLength: [0, 1, 0],
          stroke: ["#27AE60", "#2ECC71", "#27AE60"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      {/* Typing dots animation */}
      <motion.g>
        <motion.circle
          cx="9"
          cy="11.5"
          r="0.5"
          fill="#F39C12"
          animate={{
            scale: [1, 1.4, 1],
            fill: ["#F39C12", "#F1C40F", "#F39C12"]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.circle
          cx="10.5"
          cy="11.5"
          r="0.5"
          fill="#F39C12"
          animate={{
            scale: [1, 1.4, 1],
            fill: ["#F39C12", "#F1C40F", "#F39C12"]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
        />
        
        <motion.circle
          cx="12"
          cy="11.5"
          r="0.5"
          fill="#F39C12"
          animate={{
            scale: [1, 1.4, 1],
            fill: ["#F39C12", "#F1C40F", "#F39C12"]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4
          }}
        />
      </motion.g>
      
      {/* Communication waves */}
      <motion.path
        d="M21 4C22 5 22 7 21 8"
        stroke="#85C1E9"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
        animate={{
          opacity: [0.6, 0.3, 0.6],
          scale: [1, 1.2, 1],
          stroke: ["#85C1E9", "#5DADE2", "#85C1E9"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M22.5 2.5C24 4 24 8 22.5 9.5"
        stroke="#85C1E9"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
        animate={{
          opacity: [0.4, 0.2, 0.4],
          scale: [1, 1.3, 1],
          stroke: ["#85C1E9", "#3498DB", "#85C1E9"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Message glow effect */}
      <motion.ellipse
        cx="12"
        cy="10"
        rx="9"
        ry="5"
        fill="url(#messageGlow)"
        opacity="0.2"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.05, 0.2]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Heart reaction */}
      <motion.path
        d="M15.5 6.5C15.5 6.5 15.8 6.2 16.1 6.5C16.4 6.8 16.4 7.1 16.1 7.4C15.8 7.7 15.5 7.4 15.5 7.4"
        stroke="#FF69B4"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#FFB6C1"
        opacity="0.8"
        animate={{
          y: [0, -3, -6],
          opacity: [0.8, 0.4, 0],
          scale: [0.8, 1.2, 0.6]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeOut",
          delay: 2
        }}
      />
      
      {/* Connection line to tail */}
      <motion.path
        d="M6 17L4 19"
        stroke="#A569BD"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
        animate={{
          pathLength: [0.8, 1, 0.8],
          opacity: [0.7, 0.4, 0.7]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  );
}