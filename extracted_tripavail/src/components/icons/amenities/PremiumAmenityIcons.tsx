import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface AmenityIconProps {
  size?: number;
  isSelected?: boolean;
  isDark?: boolean;
}

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  return isDark;
};

const getColor = (isDark: boolean, isSelected: boolean) => {
  // Use neutral black color as per design spec
  return '#1A1A1A';
};

const getFillColor = (isDark: boolean, isSelected: boolean) => {
  return '#1A1A1A';
};

// ============= STANDOUT AMENITIES =============

export const PoolIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <motion.rect
        x="15"
        y="30"
        width="50"
        height="30"
        rx="4"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Water waves */}
      {[...Array(4)].map((_, i) => (
        <motion.path
          key={i}
          d={`M${20 + i * 10} ${45} Q${22 + i * 10} ${43} ${24 + i * 10} ${45}`}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          animate={{ 
            opacity: [0.3, 0.8, 0.3],
            y: [0, -2, 0]
          }}
          transition={{ 
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity 
          }}
        />
      ))}
      {/* Ladder */}
      <rect x="60" y="35" width="3" height="20" rx="1" fill={color} />
      <rect x="56" y="40" width="7" height="2" rx="1" fill={color} />
      <rect x="56" y="48" width="7" height="2" rx="1" fill={color} />
    </motion.svg>
  );
};

export const HotTubIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <motion.ellipse
        cx="40"
        cy="48"
        rx="22"
        ry="15"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Steam */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${30 + i * 10} ${28} Q${30 + i * 10} ${24} ${32 + i * 10} ${20}`}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            opacity: [0, 0.8, 0],
            y: [0, -8]
          }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity
          }}
        />
      ))}
      {/* Bubbles */}
      {[...Array(5)].map((_, i) => (
        <motion.circle
          key={i}
          cx={25 + i * 8}
          cy={48}
          r="2"
          fill={color}
          animate={{
            y: [0, -10, -15],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity
          }}
        />
      ))}
    </motion.svg>
  );
};

export const BBQGrillIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Grill body */}
      <motion.circle
        cx="40"
        cy="38"
        r="18"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Lid */}
      <motion.path
        d="M 25 35 Q 40 25 55 35"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      {/* Grill lines */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={28 + i * 8}
          y1={35}
          x2={28 + i * 8}
          y2={45}
          stroke={color}
          strokeWidth="1.5"
        />
      ))}
      {/* Smoke */}
      {[0, 1].map((i) => (
        <motion.path
          key={i}
          d={`M${35 + i * 10} ${18} Q${37 + i * 10} ${14} ${35 + i * 10} ${10}`}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -5]
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity
          }}
        />
      ))}
      {/* Stand */}
      <line x1="35" y1="56" x2="35" y2="65" stroke={color} strokeWidth="2.5" />
      <line x1="45" y1="56" x2="45" y2="65" stroke={color} strokeWidth="2.5" />
    </motion.svg>
  );
};

export const FirePitIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Fire pit circle */}
      <motion.circle
        cx="40"
        cy="50"
        r="18"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Flames */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${35 + i * 5} ${48} Q${37 + i * 5} ${35} ${35 + i * 5} ${28}`}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            scaleY: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.2,
            repeat: Infinity
          }}
        />
      ))}
      {/* Sparks */}
      {[...Array(4)].map((_, i) => (
        <motion.circle
          key={i}
          cx={30 + i * 7}
          cy={25}
          r="1.5"
          fill={color}
          animate={{
            y: [0, -10, -15],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity
          }}
        />
      ))}
    </motion.svg>
  );
};

export const PoolTableIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Table */}
      <motion.rect
        x="15"
        y="30"
        width="50"
        height="25"
        rx="3"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Pockets */}
      <circle cx="18" cy="33" r="2.5" fill={color} />
      <circle cx="62" cy="33" r="2.5" fill={color} />
      <circle cx="18" cy="52" r="2.5" fill={color} />
      <circle cx="62" cy="52" r="2.5" fill={color} />
      {/* Balls */}
      <motion.circle
        cx="35"
        cy="42"
        r="3"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <circle cx="45" cy="42" r="3" fill={color} />
      {/* Cue stick */}
      <motion.line
        x1="20"
        y1="42"
        x2="30"
        y2="42"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ x: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  );
};

export const PianoIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Piano body */}
      <motion.rect
        x="20"
        y="35"
        width="40"
        height="25"
        rx="2"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* White keys */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x={22 + i * 5.5}
          y="42"
          width="5"
          height="15"
          rx="0.5"
          stroke={color}
          strokeWidth="1"
          fill="none"
        />
      ))}
      {/* Black keys */}
      {[0, 1, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={25 + (i > 2 ? i + 1 : i) * 5.5}
          y="42"
          width="3"
          height="8"
          rx="0.5"
          fill={color}
        />
      ))}
      {/* Music notes */}
      {[0, 1].map((i) => (
        <motion.g
          key={i}
          animate={{
            y: [0, -8, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity
          }}
        >
          <circle cx={30 + i * 20} cy={25} r="2.5" fill={color} />
          <line x1={32.5 + i * 20} y1={25} x2={32.5 + i * 20} y2={18} stroke={color} strokeWidth="1.5" />
        </motion.g>
      ))}
    </motion.svg>
  );
};

export const GymIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Barbell */}
      <motion.line
        x1="20"
        y1="40"
        x2="60"
        y2="40"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        animate={isSelected ? { scaleX: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Left weight */}
      <motion.rect
        x="15"
        y="32"
        width="8"
        height="16"
        rx="2"
        fill={color}
        animate={isSelected ? { y: [0, -3, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Right weight */}
      <motion.rect
        x="57"
        y="32"
        width="8"
        height="16"
        rx="2"
        fill={color}
        animate={isSelected ? { y: [0, -3, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
      />
      {/* Center grip */}
      <rect x="37" y="38" width="6" height="4" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
    </motion.svg>
  );
};

export const BeachfrontIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Sun */}
      <motion.circle
        cx="25"
        cy="25"
        r="8"
        stroke={color}
        strokeWidth="2"
        fill="none"
        animate={isSelected ? { rotate: 360, scale: [1, 1.1, 1] } : {}}
        transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
      />
      {/* Umbrella */}
      <motion.path
        d="M 40 35 Q 30 30 35 25 Q 40 30 45 25 Q 50 30 40 35"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { y: [0, -2, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <line x1="40" y1="35" x2="40" y2="55" stroke={color} strokeWidth="2.5" />
      {/* Waves */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M 20 ${55 + i * 5} Q 30 ${52 + i * 5} 40 ${55 + i * 5} Q 50 ${58 + i * 5} 60 ${55 + i * 5}`}
          stroke={color}
          strokeWidth="2"
          fill="none"
          animate={{
            x: [0, 5, 0],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 3,
            delay: i * 0.3,
            repeat: Infinity
          }}
        />
      ))}
    </motion.svg>
  );
};

export const MountainViewIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Mountains */}
      <motion.path
        d="M 10 60 L 30 25 L 50 60"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
        animate={isSelected ? { strokeDashoffset: [0, 10] } : {}}
        strokeDasharray="5 5"
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.path
        d="M 35 60 L 50 35 L 70 60"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Snow caps */}
      <path d="M 27 30 L 30 25 L 33 30" fill={color} />
      <path d="M 47 40 L 50 35 L 53 40" fill={color} />
      {/* Sun */}
      <motion.circle
        cx="60"
        cy="20"
        r="6"
        stroke={color}
        strokeWidth="2"
        fill="none"
        animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  );
};

export const LakeAccessIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Lake/water body */}
      <motion.ellipse
        cx="40"
        cy="45"
        rx="28"
        ry="20"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Boat */}
      <motion.path
        d="M 30 40 L 35 35 L 45 35 L 50 40 L 30 40"
        stroke={color}
        strokeWidth="2"
        fill="none"
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.line
        x1="40"
        y1="35"
        x2="40"
        y2="25"
        stroke={color}
        strokeWidth="2"
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      {/* Ripples */}
      {[0, 1].map((i) => (
        <motion.ellipse
          key={i}
          cx="40"
          cy="45"
          rx="28"
          ry="20"
          stroke={color}
          strokeWidth="1"
          fill="none"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 3,
            delay: i * 1.5,
            repeat: Infinity
          }}
        />
      ))}
    </motion.svg>
  );
};

// ============= GUEST ESSENTIALS =============

export const WiFiIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${20 - i * 8} ${45 + i * 5} Q40 ${35 + i * 3} ${60 + i * 8} ${45 + i * 5}`}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          animate={{
            opacity: isSelected ? [0.3, 1, 0.3] : 1,
            strokeDashoffset: [0, 20]
          }}
          strokeDasharray="10 5"
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: isSelected ? Infinity : 0
          }}
        />
      ))}
      <motion.circle
        cx="40"
        cy="55"
        r="3"
        fill={color}
        animate={isSelected ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.svg>
  );
};

export const TVIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <motion.rect
        x="15"
        y="25"
        width="50"
        height="32"
        rx="3"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Screen glow effect */}
      <motion.rect
        x="20"
        y="30"
        width="40"
        height="22"
        rx="1"
        stroke={color}
        strokeWidth="1"
        fill="none"
        animate={isSelected ? { opacity: [0.3, 0.8, 0.3] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Stand */}
      <line x1="35" y1="57" x2="35" y2="63" stroke={color} strokeWidth="2.5" />
      <line x1="45" y1="57" x2="45" y2="63" stroke={color} strokeWidth="2.5" />
      <line x1="30" y1="63" x2="50" y2="63" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </motion.svg>
  );
};

export const KitchenIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Refrigerator */}
      <motion.rect
        x="25"
        y="20"
        width="20"
        height="40"
        rx="2"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <line x1="25" y1="38" x2="45" y2="38" stroke={color} strokeWidth="2" />
      <rect x="30" y="28" width="2" height="6" rx="1" fill={color} />
      <rect x="30" y="44" width="2" height="6" rx="1" fill={color} />
      {/* Stove */}
      <rect x="50" y="38" width="18" height="22" rx="2" stroke={color} strokeWidth="2.5" fill="none" />
      {/* Burners */}
      {[0, 1].map((i) => (
        <motion.circle
          key={i}
          cx={55 + i * 8}
          cy={48}
          r="3"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          animate={isSelected ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
        />
      ))}
    </motion.svg>
  );
};

export const WashingMachineIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <motion.rect
        x="22"
        y="20"
        width="36"
        height="42"
        rx="3"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Door/Window */}
      <motion.circle
        cx="40"
        cy="42"
        r="14"
        stroke={color}
        strokeWidth="2"
        fill="none"
        animate={isSelected ? { rotate: 360 } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner circle */}
      <motion.circle
        cx="40"
        cy="42"
        r="8"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        animate={isSelected ? { rotate: -360 } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      {/* Control panel */}
      <circle cx="30" cy="28" r="2" fill={color} />
      <circle cx="38" cy="28" r="2" fill={color} />
      <circle cx="46" cy="28" r="2" fill={color} />
    </motion.svg>
  );
};

export const ParkingIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <motion.rect
        x="20"
        y="25"
        width="40"
        height="30"
        rx="3"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.text
        x="40"
        y="47"
        fontSize="24"
        fontWeight="bold"
        fill={color}
        textAnchor="middle"
        animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        P
      </motion.text>
    </motion.svg>
  );
};

export const AirConditioningIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <motion.rect
        x="20"
        y="28"
        width="40"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Vents */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={25 + i * 7}
          y1={33}
          x2={25 + i * 7}
          y2={41}
          stroke={color}
          strokeWidth="1.5"
        />
      ))}
      {/* Cool air flow */}
      {[0, 1, 2, 3].map((i) => (
        <motion.line
          key={i}
          x1={22 + i * 10}
          y1={48}
          x2={22 + i * 10}
          y2={58}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            y: [0, 5, 10],
            opacity: [0.8, 0.3, 0]
          }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity
          }}
        />
      ))}
    </motion.svg>
  );
};

export const DedicatedWorkspaceIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Desk */}
      <motion.rect
        x="15"
        y="35"
        width="50"
        height="4"
        rx="1"
        fill={color}
        animate={isSelected ? { scaleX: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <line x1="20" y1="39" x2="20" y2="55" stroke={color} strokeWidth="2.5" />
      <line x1="60" y1="39" x2="60" y2="55" stroke={color} strokeWidth="2.5" />
      {/* Laptop */}
      <motion.rect
        x="28"
        y="28"
        width="24"
        height="2"
        rx="1"
        fill={color}
      />
      <motion.rect
        x="30"
        y="22"
        width="20"
        height="6"
        rx="1"
        stroke={color}
        strokeWidth="2"
        fill="none"
        animate={isSelected ? { 
          rotateX: [0, -10, 0]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Lamp */}
      <motion.g
        animate={isSelected ? { opacity: [0.5, 1, 0.5] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <line x1="58" y1="20" x2="58" y2="30" stroke={color} strokeWidth="2" />
        <path d="M 52 20 L 58 15 L 64 20 Z" stroke={color} strokeWidth="2" fill="none" />
      </motion.g>
    </motion.svg>
  );
};

// Additional Standout Amenities

export const PatioIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Floor tiles */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <motion.rect
            key={`${row}-${col}`}
            x={25 + col * 10}
            y={35 + row * 10}
            width="8"
            height="8"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            animate={isSelected ? { 
              opacity: [0.3, 0.8, 0.3]
            } : {}}
            transition={{ 
              duration: 2,
              delay: (row + col) * 0.1,
              repeat: Infinity 
            }}
          />
        ))
      )}
      {/* Umbrella */}
      <motion.path
        d="M 40 20 Q 30 18 32 15 Q 40 18 48 15 Q 50 18 40 20"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <line x1="40" y1="20" x2="40" y2="35" stroke={color} strokeWidth="2" />
    </motion.svg>
  );
};

export const OutdoorDiningIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Table */}
      <motion.ellipse
        cx="40"
        cy="40"
        rx="18"
        ry="12"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Plates */}
      <circle cx="32" cy="38" r="4" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="48" cy="38" r="4" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Utensils */}
      <line x1="28" y1="38" x2="26" y2="38" stroke={color} strokeWidth="1.5" />
      <line x1="52" y1="38" x2="54" y2="38" stroke={color} strokeWidth="1.5" />
      {/* Table legs */}
      <line x1="28" y1="48" x2="28" y2="58" stroke={color} strokeWidth="2" />
      <line x1="52" y1="48" x2="52" y2="58" stroke={color} strokeWidth="2" />
    </motion.svg>
  );
};

export const IndoorBonfireIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Fireplace */}
      <motion.rect
        x="22"
        y="30"
        width="36"
        height="28"
        rx="2"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        animate={isSelected ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Flames */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${32 + i * 8} ${50} Q${34 + i * 8} ${38} ${32 + i * 8} ${32}`}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            scaleY: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.2,
            repeat: Infinity
          }}
        />
      ))}
      {/* Logs */}
      <rect x="28" y="52" width="24" height="3" rx="1.5" fill={color} />
    </motion.svg>
  );
};

export const ScenicBalconyIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Railing */}
      <line x1="15" y1="45" x2="65" y2="45" stroke={color} strokeWidth="2.5" />
      <line x1="15" y1="55" x2="65" y2="55" stroke={color} strokeWidth="2.5" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1={18 + i * 9}
          y1={45}
          x2={18 + i * 9}
          y2={55}
          stroke={color}
          strokeWidth="1.5"
        />
      ))}
      {/* View - clouds and sun */}
      <motion.circle
        cx="55"
        cy="25"
        r="6"
        stroke={color}
        strokeWidth="2"
        fill="none"
        animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M 20 32 Q 25 28 30 32 Q 35 28 40 32"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.svg>
  );
};

export const ForestViewIcon = ({ size = 64, isSelected = false }: AmenityIconProps) => {
  const isDark = useDarkMode();
  const color = getColor(isDark, isSelected);
  
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Trees */}
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          animate={isSelected ? { 
            y: [0, -2, 0],
            rotate: [0, i % 2 === 0 ? 2 : -2, 0]
          } : {}}
          transition={{ 
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity 
          }}
          style={{ originX: `${25 + i * 15}px`, originY: "50px" }}
        >
          {/* Tree top */}
          <path
            d={`M ${25 + i * 15} ${45} L ${20 + i * 15} ${35} L ${30 + i * 15} ${35} Z`}
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d={`M ${25 + i * 15} ${40} L ${22 + i * 15} ${32} L ${28 + i * 15} ${32} Z`}
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Trunk */}
          <rect
            x={23 + i * 15}
            y={45}
            width="4"
            height="10"
            rx="1"
            fill={color}
          />
        </motion.g>
      ))}
      {/* Birds */}
      {[0, 1].map((i) => (
        <motion.path
          key={i}
          d={`M${55 + i * 10} ${20 + i * 3} Q${57 + i * 10} ${18 + i * 3} ${59 + i * 10} ${20 + i * 3}`}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          animate={{
            x: [-20, 20],
            y: [0, -5, 0]
          }}
          transition={{
            duration: 6,
            delay: i * 2,
            repeat: Infinity
          }}
        />
      ))}
    </motion.svg>
  );
};
