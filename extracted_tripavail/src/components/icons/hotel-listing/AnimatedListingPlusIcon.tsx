import { motion } from 'motion/react';

interface AnimatedListingPlusIconProps {
  size?: number;
  isActive?: boolean;
}

export function AnimatedListingPlusIcon({ size = 48, isActive = true }: AnimatedListingPlusIconProps) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Pulsing background glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(157,78,221,0.3) 0%, rgba(0,212,255,0.2) 50%, transparent 70%)',
          filter: 'blur(8px)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Outer rotating wheel with building icon */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="url(#gradient-hotel-border)"
            strokeWidth="1.5"
            strokeDasharray="8 4"
            fill="none"
            opacity="0.4"
          />
          
          {/* Building/Hotel Icon */}
          <g transform="translate(32, 28)">
            <rect
              x="5"
              y="8"
              width="26"
              height="32"
              fill="url(#gradient-building)"
              rx="2"
            />
            
            {/* Windows */}
            <rect x="9" y="12" width="4" height="4" fill="white" opacity="0.9" rx="0.5" />
            <rect x="18" y="12" width="4" height="4" fill="white" opacity="0.9" rx="0.5" />
            
            <rect x="9" y="19" width="4" height="4" fill="white" opacity="0.9" rx="0.5" />
            <rect x="18" y="19" width="4" height="4" fill="white" opacity="0.9" rx="0.5" />
            
            <rect x="9" y="26" width="4" height="4" fill="white" opacity="0.9" rx="0.5" />
            <rect x="18" y="26" width="4" height="4" fill="white" opacity="0.9" rx="0.5" />
            
            {/* Door */}
            <rect x="14" y="33" width="5" height="7" fill="white" opacity="0.85" rx="0.5" />
          </g>

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gradient-hotel-border" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9D4EDD" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#9D4EDD" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="gradient-building" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(157,78,221,0.15)" />
              <stop offset="100%" stopColor="rgba(0,212,255,0.15)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Center neon white + icon with glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Multiple glow layers for intense neon effect */}
        <motion.div
          className="absolute w-8 h-8 bg-white rounded-full"
          style={{ filter: 'blur(12px)' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-6 h-6 bg-white rounded-full"
          style={{ filter: 'blur(8px)' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
        />

        {/* The actual plus icon */}
        <motion.div
          className="relative z-10"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg
            width={size * 0.35}
            height={size * 0.35}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Neon glow effect */}
            <defs>
              <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Plus sign with neon effect */}
            <g filter="url(#neon-glow)">
              {/* Vertical bar */}
              <rect
                x="16"
                y="8"
                width="8"
                height="24"
                rx="4"
                fill="white"
              />
              
              {/* Horizontal bar */}
              <rect
                x="8"
                y="16"
                width="24"
                height="8"
                rx="4"
                fill="white"
              />
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Outer rotating sparkle effects */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {[0, 72, 144, 216, 288].map((angle, index) => (
          <motion.div
            key={angle}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${angle}deg) translateY(-${size / 2 + 4}px)`,
            }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.6, 1.3, 0.6]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: index * 0.25,
              ease: "easeInOut"
            }}
          >
            <div 
              className="w-1 h-1 bg-white rounded-full"
              style={{
                boxShadow: '0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(157,78,221,0.5), 0 0 18px rgba(0,212,255,0.3)'
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Additional inner sparkles */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {[45, 135, 225, 315].map((angle, index) => (
          <motion.div
            key={`inner-${angle}`}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${angle}deg) translateY(-${size / 3}px)`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.3,
              ease: "easeInOut"
            }}
          >
            <div 
              className="w-0.5 h-0.5 bg-cyan-300 rounded-full"
              style={{
                boxShadow: '0 0 4px rgba(0,212,255,0.8)'
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
