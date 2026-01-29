import { motion } from 'motion/react';

interface AnimatedSettingsIconProps {
  className?: string;
}

export function AnimatedSettingsIcon({ className = "w-5 h-5" }: AnimatedSettingsIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="gearGradient" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#95A5A6" />
          <stop offset="50%" stopColor="#7F8C8D" />
          <stop offset="100%" stopColor="#5D6D7E" />
        </radialGradient>
        <linearGradient id="innerGearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3498DB" />
          <stop offset="50%" stopColor="#2980B9" />
          <stop offset="100%" stopColor="#1F618D" />
        </linearGradient>
        <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E74C3C" />
          <stop offset="100%" stopColor="#C0392B" />
        </radialGradient>
      </defs>
      
      {/* Main outer gear */}
      <motion.g
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ transformOrigin: '12px 12px' }}
      >
        {/* Gear teeth */}
        <motion.path
          d="M12 1L14 4L17 3L16 6L19 7L17 10L20 12L17 14L19 17L16 18L17 21L14 20L12 23L10 20L7 21L8 18L5 17L7 14L4 12L7 10L5 7L8 6L7 3L10 4L12 1Z"
          fill="url(#gearGradient)"
          stroke="#5D6D7E"
          strokeWidth="1"
          animate={{
            fill: ["url(#gearGradient)", "#BDC3C7", "url(#gearGradient)"]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.g>
      
      {/* Inner gear rotating counter-clockwise */}
      <motion.g
        animate={{
          rotate: [0, -360]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ transformOrigin: '12px 12px' }}
      >
        <motion.circle
          cx="12"
          cy="12"
          r="6"
          stroke="#2980B9"
          strokeWidth="2"
          fill="url(#innerGearGradient)"
          opacity="0.9"
          animate={{
            opacity: [0.9, 0.7, 0.9]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Inner gear teeth */}
        <motion.rect x="11" y="6" width="2" height="3" fill="#34495E" rx="0.5" />
        <motion.rect x="15" y="8" width="3" height="2" fill="#34495E" rx="0.5" />
        <motion.rect x="15" y="14" width="3" height="2" fill="#34495E" rx="0.5" />
        <motion.rect x="11" y="15" width="2" height="3" fill="#34495E" rx="0.5" />
        <motion.rect x="6" y="14" width="3" height="2" fill="#34495E" rx="0.5" />
        <motion.rect x="6" y="8" width="3" height="2" fill="#34495E" rx="0.5" />
      </motion.g>
      
      {/* Center core */}
      <motion.circle
        cx="12"
        cy="12"
        r="3"
        stroke="#C0392B"
        strokeWidth="2"
        fill="url(#centerGradient)"
        animate={{
          scale: [1, 1.1, 1],
          stroke: ["#C0392B", "#E74C3C", "#C0392B"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Central power indicator */}
      <motion.circle
        cx="12"
        cy="12"
        r="1.5"
        fill="#F39C12"
        animate={{
          fill: ["#F39C12", "#F1C40F", "#E67E22", "#F39C12"],
          scale: [1, 1.2, 0.8, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Small rotating elements */}
      <motion.g
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ transformOrigin: '12px 12px' }}
      >
        <motion.circle
          cx="12"
          cy="7"
          r="1"
          fill="#27AE60"
          animate={{
            scale: [1, 1.3, 1],
            fill: ["#27AE60", "#2ECC71", "#27AE60"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.circle
          cx="17"
          cy="12"
          r="1"
          fill="#9B59B6"
          animate={{
            scale: [1, 1.3, 1],
            fill: ["#9B59B6", "#8E44AD", "#9B59B6"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
        />
        
        <motion.circle
          cx="12"
          cy="17"
          r="1"
          fill="#E67E22"
          animate={{
            scale: [1, 1.3, 1],
            fill: ["#E67E22", "#F39C12", "#E67E22"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6
          }}
        />
        
        <motion.circle
          cx="7"
          cy="12"
          r="1"
          fill="#3498DB"
          animate={{
            scale: [1, 1.3, 1],
            fill: ["#3498DB", "#5DADE2", "#3498DB"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.9
          }}
        />
      </motion.g>
      
      {/* Energy sparks/effects */}
      <motion.g
        animate={{
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      >
        <motion.path
          d="M18 8L20 6"
          stroke="#F1C40F"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeOut"
          }}
        />
        
        <motion.path
          d="M6 16L4 18"
          stroke="#E74C3C"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeOut",
            delay: 0.1
          }}
        />
        
        <motion.path
          d="M16 18L18 20"
          stroke="#27AE60"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeOut",
            delay: 0.2
          }}
        />
        
        <motion.path
          d="M8 6L6 4"
          stroke="#9B59B6"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeOut",
            delay: 0.3
          }}
        />
      </motion.g>
      
      {/* Power flow rings */}
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke="#3498DB"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        animate={{
          scale: [0.8, 1.3, 0.8],
          opacity: [0.3, 0.1, 0.3],
          stroke: ["#3498DB", "#5DADE2", "#3498DB"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      
      <motion.circle
        cx="12"
        cy="12"
        r="11"
        stroke="#E67E22"
        strokeWidth="0.8"
        fill="none"
        opacity="0.2"
        animate={{
          scale: [0.6, 1.4, 0.6],
          opacity: [0.2, 0.05, 0.2],
          stroke: ["#E67E22", "#F39C12", "#E67E22"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeOut",
          delay: 1
        }}
      />
      
      {/* Digital/tech elements */}
      <motion.path
        d="M9 9L10 10M14 10L15 9M9 15L10 14M15 15L14 14"
        stroke="#00FF00"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
        animate={{
          opacity: [0.6, 0.2, 0.6],
          stroke: ["#00FF00", "#32CD32", "#00FF00"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  );
}