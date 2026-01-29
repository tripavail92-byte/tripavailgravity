import { motion, AnimatePresence } from 'motion/react';
import React from 'react';

interface AnimatedIconProps {
  className?: string;
  animate?: boolean;
  colored?: boolean;
}

// Continuous animation variants
const steamVariants = {
  animate: {
    y: [-2, -12],
    opacity: [0.6, 0],
    scale: [1, 1.3],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeOut"
    }
  }
};

const waveVariants = {
  animate: {
    d: [
      "M12 38 Q20 36 28 38 Q36 40 44 38",
      "M12 38 Q20 40 28 38 Q36 36 44 38",
      "M12 38 Q20 36 28 38 Q36 40 44 38"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const ClockIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Clock face with gradient */}
    <motion.circle
      cx="32"
      cy="32"
      r="28"
      fill={colored ? "url(#clockGradient)" : "none"}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
    <motion.circle
      cx="32"
      cy="32"
      r="28"
      stroke={colored ? "#1e293b" : "currentColor"}
      strokeWidth="3"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    />
    {/* Clock hands */}
    <motion.path
      d="M32 16V32L42 42"
      stroke={colored ? "#0f172a" : "currentColor"}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    />
    {colored && (
      <defs>
        <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    )}
  </motion.svg>
);

export const CocktailIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Martini glass with liquid */}
    <motion.path
      d="M12 10 L32 38 L52 10 Z"
      fill={colored ? "url(#cocktailGradient)" : "none"}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    />
    <motion.path
      d="M12 10 L32 38 L52 10 L12 10 Z"
      stroke={colored ? "#334155" : "currentColor"}
      strokeWidth="2.5"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1 }}
    />
    
    {/* Glass stem */}
    <motion.line
      x1="32"
      y1="38"
      x2="32"
      y2="54"
      stroke={colored ? "#334155" : "currentColor"}
      strokeWidth="2.5"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    />
    
    {/* Base */}
    <motion.ellipse
      cx="32"
      cy="54"
      rx="8"
      ry="2"
      stroke={colored ? "#334155" : "currentColor"}
      strokeWidth="2.5"
      fill={colored ? "#64748b" : "none"}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    />
    
    {/* Animated falling ice cubes */}
    {colored && (
      <>
        {[0, 1, 2].map((i) => (
          <motion.rect
            key={`ice-${i}`}
            x={24 + i * 6}
            y={16}
            width="4"
            height="4"
            rx="0.5"
            fill="#93c5fd"
            stroke="#60a5fa"
            strokeWidth="1"
            initial={{ y: 12, opacity: 0, rotate: 0 }}
            animate={{
              y: [12, 28, 12],
              opacity: [0, 1, 0.3, 1, 0],
              rotate: [0, 180, 360],
              transition: {
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }
            }}
          />
        ))}
        
        {/* Splash effect at bottom */}
        <motion.circle
          cx="32"
          cy="28"
          r="0"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          animate={{
            r: [0, 8, 12],
            opacity: [0.8, 0.4, 0],
            transition: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }
          }}
        />
      </>
    )}
    
    {/* Cherry on top */}
    {colored && (
      <>
        <motion.circle
          cx="40"
          cy="12"
          r="3.5"
          fill="#dc2626"
          initial={{ scale: 0 }}
          animate={{ 
            scale: [1, 1.1, 1],
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
        <motion.path
          d="M40 12 Q42 8 44 6"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        />
      </>
    )}
    
    {colored && (
      <defs>
        <linearGradient id="cocktailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    )}
  </motion.svg>
);

export const CoffeeIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Coffee cup base - rounded mug shape */}
    <motion.path
      d="M14 22 L14 42 C14 46 16 50 20 52 L36 52 C40 50 42 46 42 42 L42 22 C42 20 40 18 38 18 L18 18 C16 18 14 20 14 22 Z"
      fill={colored ? "url(#coffeeGradient)" : "none"}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    />
    <motion.path
      d="M14 22 L14 42 C14 46 16 50 20 52 L36 52 C40 50 42 46 42 42 L42 22 C42 20 40 18 38 18 L18 18 C16 18 14 20 14 22 Z"
      stroke={colored ? "#78350f" : "currentColor"}
      strokeWidth="2.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1 }}
    />
    
    {/* Handle - curved */}
    <motion.path
      d="M42 26 C42 26 48 26 50 26 C52 26 54 28 54 30 L54 34 C54 36 52 38 50 38 C48 38 42 38 42 38"
      stroke={colored ? "#78350f" : "currentColor"}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    />
    
    {/* Continuous Steam Animation */}
    {colored && (
      <>
        {[0, 1, 2].map((i) => (
          <motion.path
            key={`steam-${i}`}
            d={`M${20 + i * 8} 16 Q${22 + i * 8} 10 ${20 + i * 8} 6`}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            variants={steamVariants}
            animate="animate"
            style={{ 
              originX: 0.5, 
              originY: 1,
              translateY: i * -2 
            }}
            transition={{ delay: i * 0.3 }}
          />
        ))}
      </>
    )}
    
    {/* Coffee surface with gentle waves */}
    {colored && (
      <motion.path
        variants={waveVariants}
        animate="animate"
        stroke="#92400e"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    )}
    
    {colored && (
      <defs>
        <linearGradient id="coffeeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
    )}
  </motion.svg>
);

export const WifiIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Center dot - continuously pulsing */}
    <motion.circle
      cx="32"
      cy="50"
      r="3"
      fill={colored ? "#10b981" : "currentColor"}
      animate={colored ? {
        scale: [1, 1.3, 1],
        opacity: [1, 0.7, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : {}}
    />
    
    {/* WiFi signal waves - continuously animating outward */}
    {[0, 1, 2].map((i) => (
      <motion.path
        key={`wifi-${i}`}
        d={
          i === 0 
            ? "M22 40 Q27 36 32 36 Q37 36 42 40"
            : i === 1
            ? "M14 32 Q23 24 32 24 Q41 24 50 32"
            : "M6 24 Q19 12 32 12 Q45 12 58 24"
        }
        stroke={colored ? (i === 0 ? "#10b981" : i === 1 ? "#059669" : "#047857") : "currentColor"}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={colored ? {
          pathLength: 1,
          opacity: [0.3, 1, 0.3],
          transition: {
            pathLength: { duration: 0.8, delay: i * 0.2 },
            opacity: {
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }
          }
        } : {
          pathLength: 1,
          opacity: 1,
          transition: { duration: 0.8, delay: i * 0.2 }
        }}
      />
    ))}
    
    {/* Signal bars indicator */}
    {colored && [0, 1, 2].map((i) => (
      <motion.rect
        key={`bar-${i}`}
        x={48 + i * 3}
        y={54 - i * 3}
        width="2"
        height={4 + i * 3}
        rx="1"
        fill="#10b981"
        animate={{
          opacity: [0.5, 1, 0.5],
          scaleY: [1, 1.2, 1],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }
        }}
      />
    ))}
  </motion.svg>
);

// Fitness Icon - Girl on Treadmill
export const DumbbellIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Treadmill base */}
    <motion.rect
      x="8"
      y="42"
      width="48"
      height="12"
      rx="2"
      fill={colored ? "#1f2937" : "none"}
      stroke={colored ? "#111827" : "currentColor"}
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8 }}
    />
    
    {/* Treadmill belt - moving */}
    {colored && [0, 1, 2, 3, 4].map((i) => (
      <motion.line
        key={`belt-${i}`}
        x1={12 + i * 8}
        y1="42"
        x2={16 + i * 8}
        y2="42"
        stroke="#374151"
        strokeWidth="2"
        animate={{
          x1: [12 + i * 8, 12 + i * 8 - 40],
          x2: [16 + i * 8, 16 + i * 8 - 40],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }
        }}
      />
    ))}
    
    {/* Treadmill screen/console */}
    <motion.rect
      x="20"
      y="12"
      width="12"
      height="8"
      rx="1"
      fill={colored ? "#3b82f6" : "none"}
      stroke={colored ? "#2563eb" : "currentColor"}
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    />
    
    {/* Support bar */}
    <motion.path
      d="M26 20 L26 12 M20 12 L32 12"
      stroke={colored ? "#4b5563" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    />
    
    {/* Girl figure - continuously running */}
    {colored && (
      <motion.g
        animate={{
          x: [0, 2, 0, -2, 0],
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "linear"
          }
        }}
      >
        {/* Head */}
        <motion.circle
          cx="38"
          cy="20"
          r="4"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        
        {/* Hair/Ponytail */}
        <motion.ellipse
          cx="40"
          cy="19"
          rx="3"
          ry="2"
          fill="#92400e"
          animate={{
            x: [0, 2, 0],
            transition: {
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
        
        {/* Body */}
        <motion.path
          d="M38 24 L38 34"
          stroke="#ec4899"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Arms - swinging */}
        <motion.path
          d="M38 26 L34 30"
          stroke="#ec4899"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{
            d: [
              "M38 26 L34 30",
              "M38 26 L36 32",
              "M38 26 L34 30"
            ],
            transition: {
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
        <motion.path
          d="M38 26 L42 32"
          stroke="#ec4899"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{
            d: [
              "M38 26 L42 32",
              "M38 26 L40 30",
              "M38 26 L42 32"
            ],
            transition: {
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
        
        {/* Legs - running motion */}
        <motion.path
          d="M38 34 L36 42"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{
            d: [
              "M38 34 L36 42",
              "M38 34 L38 42",
              "M38 34 L40 42",
              "M38 34 L38 42",
              "M38 34 L36 42"
            ],
            transition: {
              duration: 0.8,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        />
        <motion.path
          d="M38 34 L40 42"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{
            d: [
              "M38 34 L40 42",
              "M38 34 L38 42",
              "M38 34 L36 42",
              "M38 34 L38 42",
              "M38 34 L40 42"
            ],
            transition: {
              duration: 0.8,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        />
      </motion.g>
    )}
    
    {/* Speed indicator lines */}
    {colored && [0, 1, 2].map((i) => (
      <motion.line
        key={`speed-${i}`}
        x1={48 + i * 2}
        y1={28 + i * 3}
        x2={52 + i * 2}
        y2={28 + i * 3}
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          opacity: [0.3, 1, 0.3],
          x1: [48 + i * 2, 46 + i * 2],
          x2: [52 + i * 2, 50 + i * 2],
          transition: {
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }
        }}
      />
    ))}
  </motion.svg>
);

// Room Upgrade Icon - Economy to Premium Transformation
export const UpgradeIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Room outline */}
    <motion.rect
      x="8"
      y="12"
      width="48"
      height="40"
      rx="2"
      stroke={colored ? "#6366f1" : "currentColor"}
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1 }}
    />
    
    {/* Bed - transforming from simple to luxury */}
    <motion.g
      animate={colored ? {
        scale: [1, 1.05, 1],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : {}}
    >
      {/* Bed base */}
      <motion.rect
        x="16"
        y="32"
        width="32"
        height="14"
        rx="2"
        fill={colored ? "url(#bedGradient)" : "none"}
        stroke={colored ? "#4f46e5" : "currentColor"}
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Pillows - appearing */}
      <motion.rect
        x="18"
        y="34"
        width="8"
        height="5"
        rx="1"
        fill={colored ? "#fef3c7" : "none"}
        stroke={colored ? "#fbbf24" : "currentColor"}
        strokeWidth="1.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          transition: { delay: 1, duration: 0.5 }
        }}
      />
      <motion.rect
        x="38"
        y="34"
        width="8"
        height="5"
        rx="1"
        fill={colored ? "#fef3c7" : "none"}
        stroke={colored ? "#fbbf24" : "currentColor"}
        strokeWidth="1.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          transition: { delay: 1.2, duration: 0.5 }
        }}
      />
      
      {/* Headboard */}
      <motion.rect
        x="16"
        y="24"
        width="32"
        height="8"
        rx="1"
        fill={colored ? "#8b5cf6" : "none"}
        stroke={colored ? "#7c3aed" : "currentColor"}
        strokeWidth="2"
        initial={{ y: 32, opacity: 0 }}
        animate={{ 
          y: 24, 
          opacity: 1,
          transition: { delay: 0.5, duration: 0.8, type: "spring" }
        }}
      />
    </motion.g>
    
    {/* Luxury items appearing */}
    {colored && (
      <>
        {/* Lamp 1 */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1],
            scale: [0, 1.2, 1],
            transition: { delay: 1.5, duration: 0.6 }
          }}
        >
          <circle cx="14" cy="22" r="2" fill="#fbbf24" />
          <line x1="14" y1="24" x2="14" y2="28" stroke="#78350f" strokeWidth="1.5" />
        </motion.g>
        
        {/* Lamp 2 */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1],
            scale: [0, 1.2, 1],
            transition: { delay: 1.7, duration: 0.6 }
          }}
        >
          <circle cx="50" cy="22" r="2" fill="#fbbf24" />
          <line x1="50" y1="24" x2="50" y2="28" stroke="#78350f" strokeWidth="1.5" />
        </motion.g>
        
        {/* Stars/sparkles continuously appearing */}
        {[0, 1, 2, 3].map((i) => (
          <motion.path
            key={`star-${i}`}
            d={`M${20 + i * 8} ${16 + i % 2 * 2} l1 2 l2 0 l-1.5 1.5 l0.5 2 l-2 -1 l-2 1 l0.5 -2 l-1.5 -1.5 l2 0 z`}
            fill="#fbbf24"
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              transition: {
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }
            }}
          />
        ))}
      </>
    )}
    
    {/* Upgrade arrow */}
    <motion.path
      d="M32 48 L32 52 M28 50 L32 46 L36 50"
      stroke={colored ? "#10b981" : "currentColor"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={colored ? {
        pathLength: 1,
        y: [0, -3, 0],
        opacity: [0.5, 1, 0.5],
        transition: {
          pathLength: { duration: 0.8, delay: 0.3 },
          y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        }
      } : {
        pathLength: 1,
        transition: { duration: 0.8, delay: 0.3 }
      }}
    />
    
    {colored && (
      <defs>
        <linearGradient id="bedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    )}
  </motion.svg>
);

// Pool & Spa Icon - Alternating Animation
export const PoolIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => {
  const [showSpa, setShowSpa] = React.useState(false);
  
  React.useEffect(() => {
    if (colored) {
      const interval = setInterval(() => {
        setShowSpa(prev => !prev);
      }, 4000); // Switch every 4 seconds
      return () => clearInterval(interval);
    }
  }, [colored]);
  
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {!showSpa ? (
          /* POOL VIEW */
          <motion.g
            key="pool"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            {/* Pool rectangle */}
            <motion.rect
              x="8"
              y="16"
              width="48"
              height="32"
              rx="4"
              fill={colored ? "url(#poolGradient)" : "none"}
              stroke={colored ? "#0369a1" : "currentColor"}
              strokeWidth="2.5"
            />
            
            {/* Person swimming - animated */}
            {colored && (
              <motion.g
                animate={{
                  x: [-20, 20, -20],
                  transition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                {/* Head */}
                <circle cx="24" cy="26" r="3" fill="#fbbf24" />
                {/* Body */}
                <ellipse cx="28" cy="28" rx="5" ry="2" fill="#3b82f6" />
                {/* Arms - swimming motion */}
                <motion.path
                  d="M28 28 Q32 26 34 28"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  animate={{
                    d: [
                      "M28 28 Q32 26 34 28",
                      "M28 28 Q32 30 34 28",
                      "M28 28 Q32 26 34 28"
                    ],
                    transition: {
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                />
              </motion.g>
            )}
            
            {/* Ladder */}
            <motion.path
              d="M50 20 L50 44 M54 20 L54 44 M50 24 L54 24 M50 28 L54 28 M50 32 L54 32 M50 36 L54 36 M50 40 L54 40"
              stroke={colored ? "#64748b" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Water waves */}
            {colored && [0, 1, 2, 3, 4].map((i) => (
              <motion.path
                key={`wave-${i}`}
                d={`M${10 + i * 9} 32 Q${14 + i * 9} 30 ${18 + i * 9} 32`}
                stroke="#60a5fa"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                animate={{
                  d: [
                    `M${10 + i * 9} 32 Q${14 + i * 9} 30 ${18 + i * 9} 32`,
                    `M${10 + i * 9} 32 Q${14 + i * 9} 34 ${18 + i * 9} 32`,
                    `M${10 + i * 9} 32 Q${14 + i * 9} 30 ${18 + i * 9} 32`
                  ],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
            
            {/* Bubbles */}
            {colored && [0, 1, 2, 3].map((i) => (
              <motion.circle
                key={`bubble-${i}`}
                cx={16 + i * 10}
                cy={42}
                r="1.5"
                fill="#93c5fd"
                animate={{
                  cy: [42, 20],
                  opacity: [0.8, 0],
                  scale: [1, 0.5],
                  transition: {
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut"
                  }
                }}
              />
            ))}
            
            {/* Sun reflection sparkles */}
            {colored && [0, 1, 2].map((i) => (
              <motion.circle
                key={`sparkle-${i}`}
                cx={14 + i * 14}
                cy={24 + i * 3}
                r="1.5"
                fill="#fef08a"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.3, 0.8],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
          </motion.g>
        ) : (
          /* SPA VIEW */
          <motion.g
            key="spa"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            {/* Spa room background */}
            <motion.rect
              x="8"
              y="16"
              width="48"
              height="32"
              rx="4"
              fill={colored ? "url(#spaGradient)" : "none"}
              stroke={colored ? "#7c3aed" : "currentColor"}
              strokeWidth="2.5"
            />
            
            {/* Massage table */}
            <motion.rect
              x="16"
              y="28"
              width="32"
              height="12"
              rx="2"
              fill={colored ? "#fef3c7" : "none"}
              stroke={colored ? "#d97706" : "currentColor"}
              strokeWidth="2"
            />
            
            {/* Person on table */}
            {colored && (
              <>
                <ellipse cx="32" cy="32" rx="8" ry="3" fill="#fbbf24" opacity="0.8" />
                <circle cx="28" cy="30" r="2.5" fill="#92400e" />
              </>
            )}
            
            {/* Candles - flickering flames */}
            {colored && [0, 1].map((i) => (
              <motion.g key={`candle-${i}`}>
                {/* Candle body */}
                <rect
                  x={18 + i * 28}
                  y={20}
                  width="3"
                  height="6"
                  rx="1"
                  fill="#fbbf24"
                />
                {/* Flame */}
                <motion.ellipse
                  cx={19.5 + i * 28}
                  cy={18}
                  rx="2"
                  ry="3"
                  fill="#f59e0b"
                  animate={{
                    ry: [3, 3.5, 2.5, 3],
                    opacity: [1, 0.8, 1],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }
                  }}
                />
                {/* Flame glow */}
                <motion.circle
                  cx={19.5 + i * 28}
                  cy={18}
                  r="4"
                  fill="#fbbf24"
                  opacity="0.3"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.1, 0.3],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }
                  }}
                />
              </motion.g>
            ))}
            
            {/* Steam/Aromatherapy */}
            {colored && [0, 1, 2].map((i) => (
              <motion.path
                key={`steam-${i}`}
                d={`M${26 + i * 6} 42 Q${28 + i * 6} 38 ${26 + i * 6} 34`}
                stroke="#c084fc"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                animate={{
                  d: [
                    `M${26 + i * 6} 42 Q${28 + i * 6} 38 ${26 + i * 6} 34`,
                    `M${26 + i * 6} 42 Q${24 + i * 6} 38 ${26 + i * 6} 34`,
                    `M${26 + i * 6} 42 Q${28 + i * 6} 38 ${26 + i * 6} 34`
                  ],
                  opacity: [0.3, 0.7, 0.3],
                  transition: {
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
            
            {/* Relaxation sparkles */}
            {colored && [0, 1, 2, 3].map((i) => (
              <motion.circle
                key={`relax-${i}`}
                cx={20 + i * 8}
                cy={22 + (i % 2) * 4}
                r="1"
                fill="#c084fc"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
            
            {/* Spa text indicator */}
            {colored && (
              <motion.text
                x="32"
                y="46"
                textAnchor="middle"
                fill="#7c3aed"
                fontSize="6"
                fontWeight="bold"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                SPA
              </motion.text>
            )}
          </motion.g>
        )}
      </AnimatePresence>
      
      {colored && (
        <defs>
          <linearGradient id="poolGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="spaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="50%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#d8b4fe" />
          </linearGradient>
        </defs>
      )}
    </motion.svg>
  );
};

// Parking Icon with car animation
export const ParkingIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Parking sign background */}
    <motion.rect
      x="8"
      y="12"
      width="48"
      height="40"
      rx="4"
      fill={colored ? "#1e40af" : "none"}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    />
    <motion.rect
      x="8"
      y="12"
      width="48"
      height="40"
      rx="4"
      stroke={colored ? "#1e3a8a" : "currentColor"}
      strokeWidth="2.5"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8 }}
    />
    
    {/* P letter */}
    <motion.path
      d="M20 20 L20 44 M20 20 L32 20 C36 20 38 24 38 28 C38 32 36 36 32 36 L20 36"
      stroke={colored ? "#ffffff" : "currentColor"}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
    />
    
    {/* Animated car entering */}
    {colored && (
      <motion.g
        initial={{ x: -60 }}
        animate={{
          x: [-60, 10, 10],
          transition: {
            duration: 3,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeInOut"
          }
        }}
      >
        {/* Car body */}
        <motion.path
          d="M8 46 L12 42 L20 42 L24 46 Z"
          fill="#ef4444"
          stroke="#991b1b"
          strokeWidth="1.5"
        />
        {/* Car wheels */}
        <motion.circle cx="12" cy="48" r="2" fill="#1f2937" />
        <motion.circle cx="20" cy="48" r="2" fill="#1f2937" />
        {/* Car windows */}
        <motion.path
          d="M13 42 L15 44 L19 44 L21 42"
          fill="#93c5fd"
          stroke="#2563eb"
          strokeWidth="1"
        />
      </motion.g>
    )}
  </motion.svg>
);

// Hourglass Icon with falling sand animation
export const HourglassIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Hourglass frame */}
    <motion.path
      d="M20 8 L44 8 L44 12 L38 18 L32 24 L26 18 L20 12 Z M20 56 L44 56 L44 52 L38 46 L32 40 L26 46 L20 52 Z"
      fill={colored ? "url(#hourglassGradient)" : "none"}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    />
    <motion.path
      d="M20 8 L44 8 L44 12 L38 18 L32 24 L26 18 L20 12 Z M20 56 L44 56 L44 52 L38 46 L32 40 L26 46 L20 52 Z"
      stroke={colored ? "#78350f" : "currentColor"}
      strokeWidth="2.5"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1 }}
    />
    
    {/* Top and bottom caps */}
    <motion.line
      x1="18" y1="8" x2="46" y2="8"
      stroke={colored ? "#78350f" : "currentColor"}
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
    <motion.line
      x1="18" y1="56" x2="46" y2="56"
      stroke={colored ? "#78350f" : "currentColor"}
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    />
    
    {/* Center narrow point */}
    <motion.circle
      cx="32"
      cy="32"
      r="2"
      fill={colored ? "#92400e" : "currentColor"}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.6 }}
    />
    
    {/* Continuously falling sand particles */}
    {colored && (
      <>
        {/* Sand pile in top (decreasing) */}
        <motion.path
          d="M24 14 L32 18 L40 14 L40 12 L24 12 Z"
          fill="#fbbf24"
          animate={{
            d: [
              "M24 14 L32 18 L40 14 L40 12 L24 12 Z",
              "M26 15 L32 17 L38 15 L38 13 L26 13 Z",
              "M28 16 L32 17 L36 16 L36 14 L28 14 Z",
              "M24 14 L32 18 L40 14 L40 12 L24 12 Z"
            ],
            transition: {
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        />
        
        {/* Sand pile in bottom (increasing) */}
        <motion.path
          d="M28 50 L32 46 L36 50 L36 52 L28 52 Z"
          fill="#fbbf24"
          animate={{
            d: [
              "M28 50 L32 46 L36 50 L36 52 L28 52 Z",
              "M26 49 L32 45 L38 49 L38 52 L26 52 Z",
              "M24 48 L32 44 L40 48 L40 52 L24 52 Z",
              "M28 50 L32 46 L36 50 L36 52 L28 52 Z"
            ],
            transition: {
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        />
        
        {/* Falling sand particles through center */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.circle
            key={`sand-${i}`}
            cx="32"
            cy="18"
            r="1"
            fill="#f59e0b"
            animate={{
              cy: [18, 46],
              opacity: [1, 1, 0],
              transition: {
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "linear"
              }
            }}
          />
        ))}
        
        {/* Small particles for detail */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`particle-${i}`}
            cx={31 + i}
            cy="24"
            r="0.5"
            fill="#fbbf24"
            animate={{
              cy: [24, 40],
              opacity: [0.8, 0.8, 0],
              transition: {
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeIn"
              }
            }}
          />
        ))}
      </>
    )}
    
    {colored && (
      <defs>
        <linearGradient id="hourglassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    )}
  </motion.svg>
);

// Map suggestions to icons
export const getIconForHighlight = (highlight: string) => {
  const lower = highlight.toLowerCase();
  
  if (lower.includes('checkout') || lower.includes('check-in') || lower.includes('time')) {
    return HourglassIcon;
  }
  if (lower.includes('drink') || lower.includes('cocktail') || lower.includes('champagne')) {
    return CocktailIcon;
  }
  if (lower.includes('breakfast') || lower.includes('coffee') || lower.includes('meal')) {
    return CoffeeIcon;
  }
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) {
    return WifiIcon;
  }
  if (lower.includes('fitness') || lower.includes('gym') || lower.includes('exercise')) {
    return DumbbellIcon;
  }
  if (lower.includes('upgrade') || lower.includes('premium') || lower.includes('elite')) {
    return UpgradeIcon;
  }
  if (lower.includes('pool') || lower.includes('spa') || lower.includes('swim')) {
    return PoolIcon;
  }
  if (lower.includes('parking') || lower.includes('park')) {
    return ParkingIcon;
  }
  
  // Default icon
  return ClockIcon;
};
