import { motion } from 'motion/react';

interface NeonPlusIconProps {
  size?: number;
  className?: string;
}

export function NeonPlusIcon({ size = 80, className = '' }: NeonPlusIconProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow pulse */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(157,78,221,0.5) 0%, rgba(0,212,255,0.3) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating plus icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Neon glow filter */}
            <filter id="plus-neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur3" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="blur3" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="plus-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9D4EDD" />
              <stop offset="50%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#9D4EDD" />
            </linearGradient>
          </defs>

          {/* Plus symbol */}
          <g filter="url(#plus-neon-glow)">
            {/* Vertical bar */}
            <rect
              x="24"
              y="10"
              width="12"
              height="40"
              rx="6"
              fill="url(#plus-gradient)"
            />
            
            {/* Horizontal bar */}
            <rect
              x="10"
              y="24"
              width="40"
              height="12"
              rx="6"
              fill="url(#plus-gradient)"
            />
          </g>
        </svg>
      </motion.div>

      {/* Orbiting particles */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {[0, 90, 180, 270].map((angle, index) => (
          <motion.div
            key={angle}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${angle}deg) translateY(-${size / 2.5}px)`,
            }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.6, 1.2, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.25,
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
