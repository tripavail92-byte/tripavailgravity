import { motion } from 'motion/react';

interface NeonHotelIconProps {
  size?: number;
  className?: string;
}

export function NeonHotelIcon({ size = 120, className = '' }: NeonHotelIconProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow pulse */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(157,78,221,0.4) 0%, rgba(0,212,255,0.2) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Middle glow ring */}
      <motion.div
        className="absolute inset-0"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="60"
            cy="60"
            r="55"
            stroke="url(#neon-gradient)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            fill="none"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9D4EDD" />
              <stop offset="50%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#9D4EDD" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Main hotel building icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Neon glow filter */}
            <filter id="neon-hotel-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur3" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="blur3" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="building-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9D4EDD" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
          </defs>

          {/* Building structure */}
          <g filter="url(#neon-hotel-glow)">
            {/* Main building */}
            <motion.rect
              x="15"
              y="10"
              width="30"
              height="40"
              rx="2"
              stroke="url(#building-gradient)"
              strokeWidth="2"
              fill="none"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Windows - Row 1 */}
            <motion.rect
              x="20"
              y="16"
              width="6"
              height="6"
              rx="1"
              fill="#00D4FF"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.rect
              x="34"
              y="16"
              width="6"
              height="6"
              rx="1"
              fill="#00D4FF"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.4,
              }}
            />

            {/* Windows - Row 2 */}
            <motion.rect
              x="20"
              y="26"
              width="6"
              height="6"
              rx="1"
              fill="#9D4EDD"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.6,
              }}
            />
            <motion.rect
              x="34"
              y="26"
              width="6"
              height="6"
              rx="1"
              fill="#9D4EDD"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.8,
              }}
            />

            {/* Windows - Row 3 */}
            <motion.rect
              x="20"
              y="36"
              width="6"
              height="6"
              rx="1"
              fill="#00D4FF"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1.0,
              }}
            />
            <motion.rect
              x="34"
              y="36"
              width="6"
              height="6"
              rx="1"
              fill="#00D4FF"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1.2,
              }}
            />

            {/* Door */}
            <motion.rect
              x="26"
              y="44"
              width="8"
              height="6"
              rx="1"
              fill="url(#building-gradient)"
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            {/* Plus sign overlay */}
            <motion.g
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Vertical bar */}
              <rect
                x="28"
                y="4"
                width="4"
                height="12"
                rx="2"
                fill="#ffffff"
                filter="url(#neon-hotel-glow)"
              />
              {/* Horizontal bar */}
              <rect
                x="24"
                y="8"
                width="12"
                height="4"
                rx="2"
                fill="#ffffff"
                filter="url(#neon-hotel-glow)"
              />
            </motion.g>
          </g>
        </svg>
      </div>

      {/* Orbiting particles */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {[0, 60, 120, 180, 240, 300].map((angle, index) => (
          <motion.div
            key={angle}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${angle}deg) translateY(-${size / 2.2}px)`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.3,
              ease: 'easeInOut',
            }}
          >
            <div
              className="w-1 h-1 rounded-full"
              style={{
                background: index % 2 === 0 ? '#9D4EDD' : '#00D4FF',
                boxShadow: `0 0 8px ${index % 2 === 0 ? '#9D4EDD' : '#00D4FF'}`,
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
