import { motion } from 'motion/react';

interface AmenityIconProps {
  size?: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

// ========== ESSENTIAL AMENITIES ==========

// Air Conditioning
export function AirConditioningIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* AC unit box */}
      <motion.rect
        x="8"
        y="12"
        width="24"
        height="16"
        rx="2"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Vents */}
      <motion.line x1="12" y1="17" x2="28" y2="17" stroke="#374151" strokeWidth="1.5" 
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.3 }} />
      <motion.line x1="12" y1="20" x2="28" y2="20" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.3 }} />
      <motion.line x1="12" y1="23" x2="28" y2="23" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.3 }} />
      
      {/* Snowflake symbol */}
      <motion.g
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: isHovered ? 360 : 0 }}
        transition={{ scale: { duration: 0.4, delay: 0.6 }, rotate: { duration: 2, ease: "linear" } }}
      >
        <circle cx="20" cy="20" r="3" stroke="#374151" strokeWidth="1.5" fill="none" />
        <line x1="20" y1="15" x2="20" y2="25" stroke="#374151" strokeWidth="1.5" />
        <line x1="15" y1="20" x2="25" y2="20" stroke="#374151" strokeWidth="1.5" />
      </motion.g>
    </motion.svg>
  );
}

// WiFi
export function WiFiIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* WiFi waves */}
      <motion.path d="M10 18 Q20 12 30 18" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
      <motion.path d="M13 22 Q20 17 27 22" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.4 }} />
      <motion.path d="M16 26 Q20 23 24 26" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.4 }} />
      
      {/* Center dot */}
      <motion.circle cx="20" cy="30" r="2" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} />
    </motion.svg>
  );
}

// Television
export function TelevisionIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* TV screen */}
      <motion.rect x="8" y="12" width="24" height="16" rx="1.5" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      
      {/* Screen content */}
      <motion.rect x="11" y="15" width="18" height="10" rx="0.5" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
      
      {/* Stand */}
      <motion.line x1="17" y1="28" x2="23" y2="28" stroke="#374151" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 }} />
      <motion.line x1="20" y1="28" x2="20" y2="31" stroke="#374151" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// In-room Safe
export function SafeIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Safe box */}
      <motion.rect x="10" y="12" width="20" height="18" rx="1.5" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      
      {/* Door detail */}
      <motion.rect x="13" y="15" width="14" height="12" rx="1" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
      
      {/* Lock dial */}
      <motion.circle cx="20" cy="21" r="3" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0, rotate: 0 }} 
        animate={{ scale: 1, rotate: isHovered ? 180 : 0 }}
        transition={{ scale: { delay: 0.5, type: "spring" }, rotate: { duration: 0.8 } }} />
      
      {/* Handle */}
      <motion.path d="M23 21 L26 21" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7 }} />
    </motion.svg>
  );
}

// Heating
export function HeatingIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Radiator */}
      <motion.rect x="10" y="15" width="20" height="12" rx="1.5" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      
      {/* Radiator fins */}
      <motion.line x1="15" y1="15" x2="15" y2="27" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      <motion.line x1="20" y1="15" x2="20" y2="27" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35 }} />
      <motion.line x1="25" y1="15" x2="25" y2="27" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4 }} />
      
      {/* Heat waves */}
      <motion.path d="M15 11 Q15 9 17 9 T19 11" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.5 }}
        transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// Iron & Board
export function IronIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Iron body */}
      <motion.path d="M12 20 L12 16 Q12 14 14 14 L26 14 Q28 14 28 16 L28 20 L25 24 L15 24 Z" 
        stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
      
      {/* Handle */}
      <motion.path d="M18 14 Q20 8 22 14" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4 }} />
      
      {/* Steam holes */}
      <motion.circle cx="18" cy="18" r="0.8" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} />
      <motion.circle cx="20" cy="20" r="0.8" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.65 }} />
      <motion.circle cx="22" cy="18" r="0.8" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 }} />
    </motion.svg>
  );
}

// Desk & Chair
export function DeskIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Desk top */}
      <motion.line x1="10" y1="20" x2="30" y2="20" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Desk legs */}
      <motion.line x1="12" y1="20" x2="12" y2="28" stroke="#374151" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      <motion.line x1="28" y1="20" x2="28" y2="28" stroke="#374151" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      
      {/* Chair */}
      <motion.circle cx="20" cy="16" r="2" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} />
      <motion.line x1="20" y1="18" x2="20" y2="24" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// ========== BATHROOM AMENITIES ==========

// Shower
export function ShowerIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Shower head */}
      <motion.circle cx="20" cy="12" r="4" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Shower pipe */}
      <motion.line x1="20" y1="12" x2="20" y2="20" stroke="#374151" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      
      {/* Water drops */}
      <motion.line x1="16" y1="22" x2="16" y2="28" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.6 }}
        transition={{ delay: 0.5, duration: 0.4 }} />
      <motion.line x1="20" y1="24" x2="20" y2="30" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.6 }}
        transition={{ delay: 0.55, duration: 0.4 }} />
      <motion.line x1="24" y1="22" x2="24" y2="28" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.6 }}
        transition={{ delay: 0.6, duration: 0.4 }} />
    </motion.svg>
  );
}

// Bathtub
export function BathtubIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Tub body */}
      <motion.path d="M10 20 L10 24 Q10 26 12 26 L28 26 Q30 26 30 24 L30 20" 
        stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
      
      {/* Tub rim */}
      <motion.line x1="8" y1="20" x2="32" y2="20" stroke="#374151" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      
      {/* Legs */}
      <motion.circle cx="13" cy="28" r="1.5" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
      <motion.circle cx="27" cy="28" r="1.5" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
      
      {/* Faucet */}
      <motion.path d="M15 16 L15 20" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// Hair Dryer
export function HairDryerIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Dryer body */}
      <motion.circle cx="18" cy="20" r="5" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Handle */}
      <motion.path d="M18 25 L18 30 Q18 32 16 32 L14 32" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      
      {/* Air lines */}
      <motion.line x1="23" y1="18" x2="27" y2="16" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.5 }}
        transition={{ delay: 0.5 }} />
      <motion.line x1="23" y1="20" x2="28" y2="20" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.5 }}
        transition={{ delay: 0.55 }} />
      <motion.line x1="23" y1="22" x2="27" y2="24" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.5 }}
        transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// Toiletries
export function ToiletriesIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Bottle 1 */}
      <motion.rect x="12" y="16" width="5" height="10" rx="1" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
      <motion.rect x="13" y="14" width="3" height="2" rx="0.5" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} />
      
      {/* Bottle 2 */}
      <motion.rect x="20" y="18" width="4" height="8" rx="0.5" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15, duration: 0.4 }} />
      
      {/* Bottle 3 */}
      <motion.rect x="26" y="16" width="3" height="10" rx="0.5" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} />
    </motion.svg>
  );
}

// Towels
export function TowelsIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Towel 1 - back */}
      <motion.rect x="14" y="14" width="12" height="14" rx="1" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Towel fold lines */}
      <motion.line x1="14" y1="18" x2="26" y2="18" stroke="#374151" strokeWidth="1"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      <motion.line x1="14" y1="22" x2="26" y2="22" stroke="#374151" strokeWidth="1"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35 }} />
      
      {/* Towel 2 - front */}
      <motion.rect x="16" y="16" width="10" height="12" rx="0.5" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.5 }} />
    </motion.svg>
  );
}

// Slippers
export function SlippersIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Left slipper */}
      <motion.path d="M10 22 Q10 20 12 20 L16 20 Q18 20 18 22 L18 24 Q18 26 16 26 L12 26 Q10 26 10 24 Z"
        stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Right slipper */}
      <motion.path d="M22 22 Q22 20 24 20 L28 20 Q30 20 30 22 L30 24 Q30 26 28 26 L24 26 Q22 26 22 24 Z"
        stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.5 }} />
      
      {/* Slipper details */}
      <motion.line x1="12" y1="22" x2="16" y2="22" stroke="#374151" strokeWidth="1"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4 }} />
      <motion.line x1="24" y1="22" x2="28" y2="22" stroke="#374151" strokeWidth="1"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45 }} />
    </motion.svg>
  );
}

// ========== KITCHEN & DINING ==========

// Mini Bar
export function MiniBarIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Fridge body */}
      <motion.rect x="12" y="10" width="16" height="20" rx="1.5" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      
      {/* Door split */}
      <motion.line x1="12" y1="20" x2="28" y2="20" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      
      {/* Handles */}
      <motion.line x1="25" y1="15" x2="27" y2="15" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 }} />
      <motion.line x1="25" y1="25" x2="27" y2="25" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.55 }} />
    </motion.svg>
  );
}

// Coffee Maker
export function CoffeeMakerIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Coffee maker body */}
      <motion.rect x="14" y="14" width="12" height="12" rx="1" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Coffee pot */}
      <motion.path d="M16 26 L16 28 Q16 30 18 30 L22 30 Q24 30 24 28 L24 26"
        stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      
      {/* Steam */}
      <motion.path d="M18 11 Q18 9 19 9 T20 11" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.5 }}
        transition={{ delay: 0.5 }} />
      <motion.path d="M21 11 Q21 9 22 9 T23 11" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.5 }}
        transition={{ delay: 0.55 }} />
    </motion.svg>
  );
}

// Kitchenette
export function KitchenetteIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Counter */}
      <motion.line x1="10" y1="20" x2="30" y2="20" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Stove burners */}
      <motion.circle cx="15" cy="16" r="2" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
      <motion.circle cx="21" cy="16" r="2" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: "spring" }} />
      
      {/* Cabinet */}
      <motion.rect x="12" y="24" width="16" height="8" rx="1" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 }} />
      
      {/* Cabinet handles */}
      <motion.line x1="18" y1="28" x2="22" y2="28" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7 }} />
    </motion.svg>
  );
}

// Microwave
export function MicrowaveIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Microwave body */}
      <motion.rect x="10" y="14" width="20" height="14" rx="1.5" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      
      {/* Window */}
      <motion.rect x="13" y="17" width="11" height="8" rx="0.5" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
      
      {/* Control panel */}
      <motion.circle cx="27" cy="19" r="1" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
      <motion.circle cx="27" cy="22" r="1" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.55 }} />
      <motion.circle cx="27" cy="25" r="1" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// Dining Table
export function DiningTableIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Table top */}
      <motion.rect x="10" y="18" width="20" height="4" rx="0.5" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Table legs */}
      <motion.line x1="12" y1="22" x2="12" y2="28" stroke="#374151" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      <motion.line x1="28" y1="22" x2="28" y2="28" stroke="#374151" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      
      {/* Plate */}
      <motion.circle cx="20" cy="15" r="2.5" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} />
    </motion.svg>
  );
}

// ========== VIEW & OUTDOOR ==========

// Balcony
export function BalconyIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Railing */}
      <motion.line x1="10" y1="20" x2="30" y2="20" stroke="#374151" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      
      {/* Vertical bars */}
      <motion.line x1="14" y1="20" x2="14" y2="26" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2 }} />
      <motion.line x1="18" y1="20" x2="18" y2="26" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25 }} />
      <motion.line x1="22" y1="20" x2="22" y2="26" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 }} />
      <motion.line x1="26" y1="20" x2="26" y2="26" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35 }} />
      
      {/* Floor */}
      <motion.line x1="10" y1="26" x2="30" y2="26" stroke="#374151" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 }} />
      
      {/* Sun */}
      <motion.circle cx="25" cy="14" r="3" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} />
    </motion.svg>
  );
}

// City View
export function CityViewIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Buildings */}
      <motion.rect x="10" y="20" width="6" height="10" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
      <motion.rect x="17" y="16" width="6" height="14" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15, duration: 0.4 }} />
      <motion.rect x="24" y="18" width="6" height="12" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} />
      
      {/* Windows */}
      <motion.circle cx="13" cy="24" r="0.8" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
      <motion.circle cx="20" cy="20" r="0.8" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.55 }} />
      <motion.circle cx="27" cy="22" r="0.8" fill="#374151"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} />
      
      {/* Ground */}
      <motion.line x1="8" y1="30" x2="32" y2="30" stroke="#374151" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7 }} />
    </motion.svg>
  );
}

// Ocean View
export function OceanViewIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Sun */}
      <motion.circle cx="28" cy="14" r="4" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} />
      
      {/* Ocean waves */}
      <motion.path d="M8 24 Q12 22 16 24 T24 24 T32 24" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d="M8 28 Q12 26 16 28 T24 28 T32 28" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.6 }} />
      <motion.path d="M8 32 Q12 30 16 32 T24 32 T32 32" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.6 }} />
    </motion.svg>
  );
}

// Garden View
export function GardenViewIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Tree */}
      <motion.circle cx="20" cy="16" r="5" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} />
      <motion.line x1="20" y1="21" x2="20" y2="28" stroke="#374151" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4 }} />
      
      {/* Grass */}
      <motion.path d="M10 28 L12 25 L14 28" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 }} />
      <motion.path d="M24 28 L26 25 L28 28" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.55 }} />
      
      {/* Ground */}
      <motion.line x1="8" y1="28" x2="32" y2="28" stroke="#374151" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// Mountain View
export function MountainViewIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Mountains */}
      <motion.path d="M8 28 L15 16 L22 28" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d="M18 28 L25 14 L32 28" stroke="#374151" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.5 }} />
      
      {/* Snow caps */}
      <motion.path d="M13 18 L15 16 L17 18" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4 }} />
      <motion.path d="M23 16 L25 14 L27 16" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45 }} />
      
      {/* Ground */}
      <motion.line x1="8" y1="28" x2="32" y2="28" stroke="#374151" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// Private Terrace
export function PrivateTerraceIcon({ size = 40, isSelected = false, isHovered = false }: AmenityIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Floor */}
      <motion.rect x="10" y="24" width="20" height="2" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
      
      {/* Chair */}
      <motion.rect x="14" y="18" width="5" height="6" rx="0.5" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
      <motion.line x1="14" y1="20" x2="11" y2="20" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 }} />
      
      {/* Table */}
      <motion.circle cx="24" cy="20" r="3" stroke="#374151" strokeWidth="1.5" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
      <motion.line x1="24" y1="23" x2="24" y2="24" stroke="#374151" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6 }} />
    </motion.svg>
  );
}

// Export function to get amenity icon by ID
export function getRoomAmenityIcon(amenityId: string) {
  const iconMap: Record<string, React.ComponentType<AmenityIconProps>> = {
    // Essential
    'air-conditioning': AirConditioningIcon,
    'wifi': WiFiIcon,
    'television': TelevisionIcon,
    'safe': SafeIcon,
    'heating': HeatingIcon,
    'iron': IronIcon,
    'desk': DeskIcon,
    
    // Bathroom
    'shower': ShowerIcon,
    'bathtub': BathtubIcon,
    'hair-dryer': HairDryerIcon,
    'toiletries': ToiletriesIcon,
    'towels': TowelsIcon,
    'slippers': SlippersIcon,
    
    // Kitchen & Dining
    'minibar': MiniBarIcon,
    'coffee-maker': CoffeeMakerIcon,
    'kitchenette': KitchenetteIcon,
    'microwave': MicrowaveIcon,
    'dining-table': DiningTableIcon,
    
    // View & Outdoor
    'balcony': BalconyIcon,
    'city-view': CityViewIcon,
    'ocean-view': OceanViewIcon,
    'garden-view': GardenViewIcon,
    'mountain-view': MountainViewIcon,
    'private-terrace': PrivateTerraceIcon,
  };

  return iconMap[amenityId] || WiFiIcon;
}
