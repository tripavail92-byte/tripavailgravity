import { motion } from 'motion/react';

interface SimpleNeonPlusProps {
  size?: number;
}

export function SimpleNeonPlus({ size = 80 }: SimpleNeonPlusProps) {
  return (
    <motion.div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Neon glow filter */}
          <filter id="simple-neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Plus symbol */}
        <g filter="url(#simple-neon-glow)">
          {/* Vertical bar */}
          <rect
            x="24"
            y="10"
            width="12"
            height="40"
            rx="6"
            fill="#00D4FF"
          />
          
          {/* Horizontal bar */}
          <rect
            x="10"
            y="24"
            width="40"
            height="12"
            rx="6"
            fill="#00D4FF"
          />
        </g>
      </svg>
    </motion.div>
  );
}
