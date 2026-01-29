import { motion } from 'motion/react';

interface GlowingSparkleIconProps {
  size?: number;
}

export function GlowingSparkleIcon({ size = 80 }: GlowingSparkleIconProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow layers */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.8) 0%, rgba(0,212,255,0.4) 30%, transparent 70%)',
          filter: 'blur(25px)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.6) 0%, rgba(0,212,255,0.2) 40%, transparent 70%)',
          filter: 'blur(15px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.2,
        }}
      />

      {/* Center sparkle */}
      <motion.div
        className="relative"
        animate={{
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          },
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <svg
          width={size * 0.4}
          height={size * 0.4}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="sparkle-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <radialGradient id="sparkle-gradient">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </radialGradient>
          </defs>

          {/* Four-pointed star/sparkle */}
          <g filter="url(#sparkle-glow)">
            {/* Center circle */}
            <circle cx="20" cy="20" r="3" fill="url(#sparkle-gradient)" />
            
            {/* Top point */}
            <path
              d="M20 2 L22 16 L20 18 L18 16 Z"
              fill="url(#sparkle-gradient)"
            />
            
            {/* Right point */}
            <path
              d="M38 20 L24 22 L22 20 L24 18 Z"
              fill="url(#sparkle-gradient)"
            />
            
            {/* Bottom point */}
            <path
              d="M20 38 L18 24 L20 22 L22 24 Z"
              fill="url(#sparkle-gradient)"
            />
            
            {/* Left point */}
            <path
              d="M2 20 L16 18 L18 20 L16 22 Z"
              fill="url(#sparkle-gradient)"
            />
          </g>
        </svg>
      </motion.div>

      {/* Rotating ring */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="rgba(0,212,255,0.2)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
        </svg>
      </motion.div>

      {/* Small orbiting particles */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {[0, 120, 240].map((angle, index) => (
          <motion.div
            key={angle}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${angle}deg) translateY(-${size * 0.35}px)`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.3,
              ease: 'easeInOut',
            }}
          >
            <div
              className="w-1 h-1 rounded-full bg-cyan-400"
              style={{
                boxShadow: '0 0 6px rgba(0,212,255,0.8)',
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
