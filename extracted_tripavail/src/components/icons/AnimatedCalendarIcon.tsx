import { motion } from 'motion/react';

interface AnimatedCalendarIconProps {
  className?: string;
}

export function AnimatedCalendarIcon({ className = "w-5 h-5" }: AnimatedCalendarIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="50%" stopColor="#357ABD" />
          <stop offset="100%" stopColor="#2E5984" />
        </linearGradient>
        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#EE5A52" />
        </linearGradient>
      </defs>
      
      {/* Main calendar body */}
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        stroke="#2E5984"
        strokeWidth="2"
        fill="url(#calendarGradient)"
        animate={{
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Calendar header */}
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="6"
        rx="2"
        fill="url(#headerGradient)"
        animate={{
          fill: ["url(#headerGradient)", "#FF8E53", "url(#headerGradient)"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Top binding rings */}
      <motion.path
        d="M16 2V6"
        stroke="#C0392B"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{
          y: [0, -1, 0],
          stroke: ["#C0392B", "#E74C3C", "#C0392B"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M8 2V6"
        stroke="#C0392B"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{
          y: [0, -1, 0],
          stroke: ["#C0392B", "#E74C3C", "#C0392B"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      />
      
      {/* Header line */}
      <motion.path
        d="M3 10H21"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: [0.9, 1, 0.9],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Animated date dots with vacation/travel colors */}
      <motion.circle
        cx="8"
        cy="14"
        r="1.2"
        fill="#FFD700"
        animate={{
          scale: [1, 1.4, 1],
          fill: ["#FFD700", "#FFA500", "#FFD700"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="12"
        cy="14"
        r="1.2"
        fill="#32CD32"
        animate={{
          scale: [1, 1.4, 1],
          fill: ["#32CD32", "#00FF32", "#32CD32"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2
        }}
      />
      
      <motion.circle
        cx="16"
        cy="14"
        r="1.2"
        fill="#FF69B4"
        animate={{
          scale: [1, 1.4, 1],
          fill: ["#FF69B4", "#FF1493", "#FF69B4"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4
        }}
      />
      
      <motion.circle
        cx="8"
        cy="18"
        r="1.2"
        fill="#00CED1"
        animate={{
          scale: [1, 1.4, 1],
          fill: ["#00CED1", "#20B2AA", "#00CED1"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6
        }}
      />
      
      <motion.circle
        cx="12"
        cy="18"
        r="1.2"
        fill="#9370DB"
        animate={{
          scale: [1, 1.4, 1],
          fill: ["#9370DB", "#8A2BE2", "#9370DB"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
      />
      
      {/* Special highlight for vacation day */}
      <motion.circle
        cx="16"
        cy="18"
        r="2.5"
        stroke="#FF4500"
        strokeWidth="2"
        fill="none"
        animate={{
          scale: [0.8, 1.3, 0.8],
          stroke: ["#FF4500", "#FF6347", "#FF4500"],
          opacity: [0.4, 1, 0.4]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Inner vacation icon */}
      <motion.circle
        cx="16"
        cy="18"
        r="1"
        fill="#FF4500"
        animate={{
          scale: [0.8, 1.2, 0.8],
          fill: ["#FF4500", "#FFD700", "#FF4500"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Mini travel icons on calendar */}
      <motion.path
        d="M6 16L7 15L8 16"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        animate={{
          opacity: [0.5, 1, 0.5],
          y: [0, -0.5, 0]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="14"
        cy="16"
        r="0.5"
        fill="#FFFFFF"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
    </motion.svg>
  );
}