import { motion } from 'motion/react';

interface ThemedHotelListingIconProps {
  size?: number;
}

export function ThemedHotelListingIcon({ size = 80 }: ThemedHotelListingIconProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Animated gradient background glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-30"
        style={{
          background: 'linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main icon container */}
      <motion.div
        className="relative"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient definition matching hotel manager theme */}
            <linearGradient id="hotel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9D4EDD" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
            
            {/* Subtle glow filter */}
            <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hotel building outline */}
          <motion.rect
            x="10"
            y="12"
            width="28"
            height="28"
            rx="2"
            stroke="url(#hotel-gradient)"
            strokeWidth="2.5"
            fill="none"
            filter="url(#soft-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />

          {/* Plus symbol - animated entry */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6, type: 'spring', stiffness: 200 }}
          >
            {/* Vertical bar of plus */}
            <motion.rect
              x="22"
              y="6"
              width="4"
              height="12"
              rx="2"
              fill="url(#hotel-gradient)"
              filter="url(#soft-glow)"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Horizontal bar of plus */}
            <motion.rect
              x="18"
              y="10"
              width="12"
              height="4"
              rx="2"
              fill="url(#hotel-gradient)"
              filter="url(#soft-glow)"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
            />
          </motion.g>

          {/* Windows - staggered animation */}
          {[
            { x: 14, y: 24, delay: 0.7 },
            { x: 22, y: 24, delay: 0.8 },
            { x: 30, y: 24, delay: 0.9 },
            { x: 14, y: 32, delay: 1.0 },
            { x: 30, y: 32, delay: 1.1 },
          ].map((window, index) => (
            <motion.rect
              key={index}
              x={window.x}
              y={window.y}
              width="4"
              height="4"
              rx="0.5"
              fill="url(#hotel-gradient)"
              opacity="0.6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                scale: {
                  delay: window.delay,
                  duration: 0.3,
                  type: 'spring',
                },
                opacity: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.2,
                },
              }}
            />
          ))}

          {/* Door */}
          <motion.rect
            x="20"
            y="36"
            width="8"
            height="4"
            rx="0.5"
            fill="url(#hotel-gradient)"
            opacity="0.7"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 0.7 }}
            transition={{ delay: 1.2, duration: 0.4, type: 'spring' }}
          />
        </svg>
      </motion.div>

      {/* Subtle rotating ring */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="url(#ring-gradient)"
            strokeWidth="0.5"
            strokeDasharray="2 6"
            opacity="0.2"
          />
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9D4EDD" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}
