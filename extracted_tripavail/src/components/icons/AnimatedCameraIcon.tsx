import { motion } from 'motion/react';

interface AnimatedCameraIconProps {
  className?: string;
}

export function AnimatedCameraIcon({ className = "w-5 h-5" }: AnimatedCameraIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cameraBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2C3E50" />
          <stop offset="50%" stopColor="#34495E" />
          <stop offset="100%" stopColor="#1A252F" />
        </linearGradient>
        <radialGradient id="lensGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#BDC3C7" />
          <stop offset="50%" stopColor="#95A5A6" />
          <stop offset="100%" stopColor="#7F8C8D" />
        </radialGradient>
        <radialGradient id="flashGradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#F39C12" />
          <stop offset="100%" stopColor="#E67E22" />
        </radialGradient>
      </defs>
      
      {/* Camera body */}
      <motion.rect
        x="1"
        y="7"
        width="22"
        height="13"
        rx="2"
        ry="2"
        stroke="#1A252F"
        strokeWidth="2"
        fill="url(#cameraBodyGradient)"
        animate={{
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Camera top */}
      <motion.path
        d="M7 7V4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V7"
        stroke="#1A252F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#34495E"
      />
      
      {/* Lens outer ring */}
      <motion.circle
        cx="12"
        cy="13.5"
        r="4.5"
        stroke="#7F8C8D"
        strokeWidth="2"
        fill="url(#lensGradient)"
        animate={{
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Lens inner ring */}
      <motion.circle
        cx="12"
        cy="13.5"
        r="2.5"
        stroke="#5D6D7E"
        strokeWidth="1.5"
        fill="#2C3E50"
        opacity="0.9"
        animate={{
          scale: [1, 0.95, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Lens center */}
      <motion.circle
        cx="12"
        cy="13.5"
        r="1.2"
        fill="#000000"
        animate={{
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Flash */}
      <motion.rect
        x="18.5"
        y="9.5"
        width="3"
        height="2"
        rx="0.5"
        stroke="#E67E22"
        strokeWidth="1"
        fill="url(#flashGradient)"
        animate={{
          fill: ["url(#flashGradient)", "#F1C40F", "url(#flashGradient)"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Viewfinder */}
      <motion.rect
        x="3"
        y="9"
        width="2.5"
        height="1.5"
        rx="0.3"
        fill="#ECF0F1"
        stroke="#BDC3C7"
        strokeWidth="0.5"
        animate={{
          fill: ["#ECF0F1", "#3498DB", "#ECF0F1"]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Shutter animation */}
      <motion.g>
        <motion.path
          d="M12 9L15.5 13.5L12 18L8.5 13.5L12 9Z"
          fill="none"
          stroke="#85C1E9"
          strokeWidth="0.8"
          opacity="0.6"
          animate={{
            rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
            scale: [0.6, 0.8, 0.6],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.g>
      
      {/* Flash burst effect */}
      <motion.g
        animate={{
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut"
        }}
      >
        <motion.path
          d="M12 8L13 10L12 12L11 10L12 8"
          fill="#F1C40F"
          opacity="0.8"
          animate={{
            scale: [0, 1.8, 0],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeOut"
          }}
        />
        
        <motion.path
          d="M15 10L17 11L15 12L13 11L15 10"
          fill="#E74C3C"
          opacity="0.6"
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeOut",
            delay: 0.05
          }}
        />
        
        <motion.path
          d="M9 10L11 11L9 12L7 11L9 10"
          fill="#E67E22"
          opacity="0.6"
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeOut",
            delay: 0.05
          }}
        />
        
        <motion.path
          d="M12 16L13 18L12 20L11 18L12 16"
          fill="#9B59B6"
          opacity="0.7"
          animate={{
            scale: [0, 1.4, 0],
            opacity: [0, 0.7, 0]
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeOut",
            delay: 0.1
          }}
        />
      </motion.g>
      
      {/* Camera controls */}
      <motion.circle
        cx="4.5"
        cy="15"
        r="0.8"
        fill="#E74C3C"
        animate={{
          fill: ["#E74C3C", "#C0392B", "#E74C3C"]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="19.5"
        cy="15"
        r="0.6"
        fill="#27AE60"
        animate={{
          fill: ["#27AE60", "#2ECC71", "#27AE60"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Memory card slot */}
      <motion.rect
        x="2"
        y="17"
        width="1.5"
        height="0.8"
        rx="0.2"
        fill="#95A5A6"
        animate={{
          fill: ["#95A5A6", "#3498DB", "#95A5A6"]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Lens reflection */}
      <motion.circle
        cx="10.5"
        cy="12"
        r="0.8"
        fill="#FFFFFF"
        opacity="0.4"
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  );
}