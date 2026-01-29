import { motion } from 'motion/react';

interface AnimatedBuildingIconProps {
  className?: string;
}

export function AnimatedBuildingIcon({ className = "w-6 h-6" }: AnimatedBuildingIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3498DB" />
          <stop offset="50%" stopColor="#2980B9" />
          <stop offset="100%" stopColor="#1F618D" />
        </linearGradient>
        <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E67E22" />
          <stop offset="100%" stopColor="#D35400" />
        </linearGradient>
        <radialGradient id="windowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F1C40F" />
          <stop offset="100%" stopColor="#F39C12" />
        </radialGradient>
      </defs>
      
      {/* Main building structure */}
      <motion.rect
        x="4"
        y="6"
        width="16"
        height="16"
        stroke="#1F618D"
        strokeWidth="2"
        fill="url(#buildingGradient)"
        animate={{
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Building top/roof */}
      <motion.path
        d="M6 6V4C6 2.89543 6.89543 2 8 2H16C17.1046 2 18 2.89543 18 4V6"
        stroke="#D35400"
        strokeWidth="2"
        strokeLinecap="round"
        fill="url(#roofGradient)"
        animate={{
          fill: ["url(#roofGradient)", "#E67E22", "url(#roofGradient)"]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Windows with premium hotel lighting */}
      <motion.rect
        x="7"
        y="9"
        width="2"
        height="2"
        fill="url(#windowGradient)"
        stroke="#E67E22"
        strokeWidth="0.5"
        rx="0.3"
        animate={{
          fill: ["url(#windowGradient)", "#F1C40F", "#FF6B6B", "url(#windowGradient)"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.rect
        x="11"
        y="9"
        width="2"
        height="2"
        fill="url(#windowGradient)"
        stroke="#E67E22"
        strokeWidth="0.5"
        rx="0.3"
        animate={{
          fill: ["#87CEEB", "url(#windowGradient)", "#FF69B4", "#87CEEB"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3
        }}
      />
      
      <motion.rect
        x="15"
        y="9"
        width="2"
        height="2"
        fill="url(#windowGradient)"
        stroke="#E67E22"
        strokeWidth="0.5"
        rx="0.3"
        animate={{
          fill: ["#32CD32", "#F1C40F", "url(#windowGradient)", "#32CD32"]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6
        }}
      />
      
      <motion.rect
        x="7"
        y="13"
        width="2"
        height="2"
        fill="url(#windowGradient)"
        stroke="#E67E22"
        strokeWidth="0.5"
        rx="0.3"
        animate={{
          fill: ["#FF69B4", "#87CEEB", "#F1C40F", "#FF69B4"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.9
        }}
      />
      
      <motion.rect
        x="11"
        y="13"
        width="2"
        height="2"
        fill="url(#windowGradient)"
        stroke="#E67E22"
        strokeWidth="0.5"
        rx="0.3"
        animate={{
          fill: ["url(#windowGradient)", "#9370DB", "#20B2AA", "url(#windowGradient)"]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2
        }}
      />
      
      <motion.rect
        x="15"
        y="13"
        width="2"
        height="2"
        fill="url(#windowGradient)"
        stroke="#E67E22"
        strokeWidth="0.5"
        rx="0.3"
        animate={{
          fill: ["#FF6347", "#00CED1", "url(#windowGradient)", "#FF6347"]
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      />
      
      {/* Hotel entrance door */}
      <motion.rect
        x="10"
        y="17"
        width="4"
        height="5"
        stroke="#C0392B"
        strokeWidth="2"
        fill="#8B4513"
        rx="0.5"
        animate={{
          fill: ["#8B4513", "#A0522D", "#8B4513"],
          scaleY: [1, 1.02, 1]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Door handle */}
      <motion.circle
        cx="13"
        cy="19"
        r="0.4"
        fill="#FFD700"
        animate={{
          scale: [1, 1.3, 1],
          fill: ["#FFD700", "#FFA500", "#FFD700"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Hotel signage */}
      <motion.rect
        x="8"
        y="4.5"
        width="8"
        height="1"
        fill="#E74C3C"
        rx="0.5"
        animate={{
          fill: ["#E74C3C", "#C0392B", "#E74C3C"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Antenna/signal on top */}
      <motion.path
        d="M12 2V0"
        stroke="#95A5A6"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          scale: [1, 1.1, 1],
          y: [0, -1, 0],
          stroke: ["#95A5A6", "#BDC3C7", "#95A5A6"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Communication waves */}
      <motion.path
        d="M10 1C10 1 11 0.5 12 1C13 1.5 14 1 14 1"
        stroke="#27AE60"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
        animate={{
          opacity: [0.6, 0.2, 0.6],
          scale: [1, 1.3, 1],
          stroke: ["#27AE60", "#2ECC71", "#27AE60"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M9.5 0.5C9.5 0.5 10.5 0 12 0.5C13.5 1 14.5 0.5 14.5 0.5"
        stroke="#3498DB"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
        animate={{
          opacity: [0.4, 0.1, 0.4],
          scale: [1, 1.4, 1],
          stroke: ["#3498DB", "#5DADE2", "#3498DB"]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Building depth/shadow effect */}
      <motion.path
        d="M20 22H20.5C21.3284 22 22 21.3284 22 20.5V8.5C22 7.67157 21.3284 7 20.5 7H20V22Z"
        fill="#2C3E50"
        opacity="0.3"
        animate={{
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Luxury hotel features */}
      <motion.circle
        cx="6"
        cy="8"
        r="0.8"
        fill="#E67E22"
        animate={{
          scale: [1, 1.2, 1],
          fill: ["#E67E22", "#F39C12", "#E67E22"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="18"
        cy="10"
        r="0.6"
        fill="#9B59B6"
        animate={{
          scale: [1, 1.3, 1],
          fill: ["#9B59B6", "#8E44AD", "#9B59B6"]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </motion.svg>
  );
}