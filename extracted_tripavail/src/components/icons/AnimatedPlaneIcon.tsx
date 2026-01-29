import { motion } from 'motion/react';

interface AnimatedPlaneIconProps {
  className?: string;
}

export function AnimatedPlaneIcon({ className = "w-6 h-6" }: AnimatedPlaneIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        x: [0, 2, 0],
        y: [0, -1, 0]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <defs>
        <linearGradient id="planeBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ECF0F1" />
          <stop offset="50%" stopColor="#BDC3C7" />
          <stop offset="100%" stopColor="#95A5A6" />
        </linearGradient>
        <radialGradient id="engineGradient" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#3498DB" />
          <stop offset="100%" stopColor="#2980B9" />
        </radialGradient>
        <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8E8E8" />
          <stop offset="100%" stopColor="#D5DBDB" />
        </linearGradient>
      </defs>
      
      {/* Main body of plane */}
      <motion.path
        d="M12 2L22 11H15L12 8.5L9 11H2L12 2Z"
        stroke="#7F8C8D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#planeBodyGradient)"
        animate={{
          pathLength: [1, 0.95, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Wings */}
      <motion.path
        d="M2 11L12 8.5L22 11"
        stroke="#A0A0A0"
        strokeWidth="2"
        strokeLinecap="round"
        fill="url(#wingGradient)"
        opacity="0.9"
        animate={{
          scaleX: [1, 1.05, 1],
          opacity: [0.9, 0.7, 0.9]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Tail */}
      <motion.path
        d="M12 2V8.5"
        stroke="#7F8C8D"
        strokeWidth="2"
        strokeLinecap="round"
        fill="url(#planeBodyGradient)"
      />
      
      {/* Engine/propeller effect */}
      <motion.circle
        cx="12"
        cy="2"
        r="1.5"
        fill="none"
        stroke="url(#engineGradient)"
        strokeWidth="1"
        opacity="0.6"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.3, 1],
          opacity: [0.6, 0.3, 0.6]
        }}
        transition={{
          rotate: { duration: 0.3, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      
      {/* Engine center */}
      <motion.circle
        cx="12"
        cy="2"
        r="0.8"
        fill="#2980B9"
        animate={{
          fill: ["#2980B9", "#3498DB", "#2980B9"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Flight trail/contrails */}
      <motion.path
        d="M8 13L6 15L4 13"
        stroke="#87CEEB"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
        animate={{
          opacity: [0.5, 0.2, 0.5],
          x: [0, -3, -6],
          scaleX: [1, 0.7, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      
      <motion.path
        d="M16 13L18 15L20 13"
        stroke="#87CEEB"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
        animate={{
          opacity: [0.5, 0.2, 0.5],
          x: [0, 3, 6],
          scaleX: [1, 0.7, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.3
        }}
      />
      
      {/* Airplane windows */}
      <motion.circle
        cx="10"
        cy="7"
        r="0.8"
        fill="#5DADE2"
        stroke="#3498DB"
        strokeWidth="0.3"
        animate={{
          fill: ["#5DADE2", "#85C1E9", "#5DADE2"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="12"
        cy="6.5"
        r="0.8"
        fill="#5DADE2"
        stroke="#3498DB"
        strokeWidth="0.3"
        animate={{
          fill: ["#85C1E9", "#AED6F1", "#85C1E9"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      <motion.circle
        cx="14"
        cy="7"
        r="0.8"
        fill="#5DADE2"
        stroke="#3498DB"
        strokeWidth="0.3"
        animate={{
          fill: ["#AED6F1", "#5DADE2", "#AED6F1"]
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      {/* Wing tip navigation lights */}
      <motion.circle
        cx="2"
        cy="11"
        r="0.6"
        fill="#E74C3C"
        animate={{
          scale: [1, 1.5, 1],
          fill: ["#E74C3C", "#C0392B", "#E74C3C"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="22"
        cy="11"
        r="0.6"
        fill="#27AE60"
        animate={{
          scale: [1, 1.5, 1],
          fill: ["#27AE60", "#2ECC71", "#27AE60"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.75
        }}
      />
      
      {/* Additional wing details */}
      <motion.path
        d="M5 10L7 9L9 10"
        stroke="#E67E22"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{
          stroke: ["#E67E22", "#F39C12", "#E67E22"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M15 10L17 9L19 10"
        stroke="#E67E22"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{
          stroke: ["#F39C12", "#E67E22", "#F39C12"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
      />
      
      {/* Motion blur effect */}
      <motion.ellipse
        cx="12"
        cy="8.5"
        rx="8"
        ry="2"
        fill="#D5DBDB"
        opacity="0.15"
        animate={{
          scaleX: [1, 1.3, 1],
          opacity: [0.15, 0.05, 0.15]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Jet stream effects */}
      <motion.path
        d="M10 12C8 14 6 16 4 18"
        stroke="#AED6F1"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="3,3"
        fill="none"
        opacity="0.4"
        animate={{
          pathLength: [0, 1, 0],
          opacity: [0.4, 0.1, 0.4]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M14 12C16 14 18 16 20 18"
        stroke="#AED6F1"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="3,3"
        fill="none"
        opacity="0.4"
        animate={{
          pathLength: [0, 1, 0],
          opacity: [0.4, 0.1, 0.4]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
      />
    </motion.svg>
  );
}