import { motion } from 'motion/react';

interface SimpleAnimatedMessageIconProps {
  isActive: boolean;
  size?: number;
}

export function SimpleAnimatedMessageIcon({ isActive, size = 24 }: SimpleAnimatedMessageIconProps) {
  const iconColor = isActive ? '#ff5a5f' : '#000000';
  
  return (
    <motion.div
      animate={{
        scale: isActive ? 1.1 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        animate={{
          rotateX: isActive ? [0, 10, 0] : 0
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      >
        {/* Message bubble */}
        <motion.path
          d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
          stroke={iconColor}
          strokeWidth={isActive ? 2.2 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{
            stroke: iconColor,
            strokeWidth: isActive ? 2.2 : 2,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        />
        
        {/* Message dots */}
        <motion.circle
          cx="9"
          cy="11"
          r="1"
          fill={iconColor}
          animate={{
            fill: iconColor,
            scale: isActive ? [1, 1.3, 1] : 1
          }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: "easeInOut"
          }}
        />
        <motion.circle
          cx="12"
          cy="11"
          r="1"
          fill={iconColor}
          animate={{
            fill: iconColor,
            scale: isActive ? [1, 1.3, 1] : 1
          }}
          transition={{
            duration: 0.4,
            delay: 0.2,
            ease: "easeInOut"
          }}
        />
        <motion.circle
          cx="15"
          cy="11"
          r="1"
          fill={iconColor}
          animate={{
            fill: iconColor,
            scale: isActive ? [1, 1.3, 1] : 1
          }}
          transition={{
            duration: 0.4,
            delay: 0.3,
            ease: "easeInOut"
          }}
        />
        
        {/* Animated typing indicator */}
        {isActive && (
          <motion.g>
            <motion.circle
              cx="9"
              cy="11"
              r="1.5"
              fill="none"
              stroke={iconColor}
              strokeWidth={0.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 0],
                opacity: [0, 0.4, 0]
              }}
              transition={{
                duration: 1.2,
                delay: 0.1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="12"
              cy="11"
              r="1.5"
              fill="none"
              stroke={iconColor}
              strokeWidth={0.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 0],
                opacity: [0, 0.4, 0]
              }}
              transition={{
                duration: 1.2,
                delay: 0.3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="15"
              cy="11"
              r="1.5"
              fill="none"
              stroke={iconColor}
              strokeWidth={0.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 0],
                opacity: [0, 0.4, 0]
              }}
              transition={{
                duration: 1.2,
                delay: 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.g>
        )}
        
        {/* Notification dot */}
        {isActive && (
          <motion.circle
            cx="18"
            cy="6"
            r="2"
            fill={iconColor}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0.8]
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: "easeOut"
            }}
          />
        )}
      </motion.svg>
    </motion.div>
  );
}