import { motion } from 'motion/react';

interface RoomTypeIconProps {
  size?: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

// Economy Room - Bed with price tag
export function EconomyRoomIcon({ size = 40, isSelected = false, isHovered = false }: RoomTypeIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bed base/mattress */}
      <motion.rect
        x="8"
        y="20"
        width="24"
        height="8"
        rx="1"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Bed legs */}
      <motion.line
        x1="10"
        y1="28"
        x2="10"
        y2="32"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      <motion.line
        x1="30"
        y1="28"
        x2="30"
        y2="32"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      
      {/* Headboard */}
      <motion.rect
        x="8"
        y="12"
        width="24"
        height="8"
        rx="1"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Pillow */}
      <motion.rect
        x="16"
        y="16"
        width="8"
        height="4"
        rx="1"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
      />
      
      {/* Price tag - tilted */}
      <motion.g
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: isHovered ? -25 : -20 }}
        transition={{ duration: 0.5, delay: 0.7, type: "spring" }}
      >
        {/* Tag body */}
        <path
          d="M21 8 L27 8 L27 14 L24 17 L21 14 Z"
          stroke="#1A1A1A"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Tag hole */}
        <circle
          cx="24"
          cy="10.5"
          r="0.8"
          fill="#1A1A1A"
        />
      </motion.g>
    </motion.svg>
  );
}

// Standard Room - Simple double bed with two pillows
export function StandardRoomIcon({ size = 40, isSelected = false, isHovered = false }: RoomTypeIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={isHovered ? { y: [-0.5, 0.5, -0.5] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Bed base/mattress */}
      <motion.rect
        x="7"
        y="20"
        width="26"
        height="8"
        rx="1"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Bed legs */}
      <motion.line
        x1="9"
        y1="28"
        x2="9"
        y2="32"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      <motion.line
        x1="31"
        y1="28"
        x2="31"
        y2="32"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      
      {/* Headboard */}
      <motion.rect
        x="7"
        y="11"
        width="26"
        height="9"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Left pillow */}
      <motion.rect
        x="11"
        y="15"
        width="7"
        height="5"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0, x: 5 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
      />
      
      {/* Right pillow */}
      <motion.rect
        x="22"
        y="15"
        width="7"
        height="5"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0, x: -5 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.6, type: "spring" }}
      />
    </motion.svg>
  );
}

// Deluxe Room - Bed with star
export function DeluxeRoomIcon({ size = 40, isSelected = false, isHovered = false }: RoomTypeIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bed base/mattress */}
      <motion.rect
        x="7"
        y="22"
        width="26"
        height="8"
        rx="1"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Bed legs */}
      <motion.line
        x1="9"
        y1="30"
        x2="9"
        y2="34"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      <motion.line
        x1="31"
        y1="30"
        x2="31"
        y2="34"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      
      {/* Headboard */}
      <motion.rect
        x="7"
        y="14"
        width="26"
        height="8"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Pillow */}
      <motion.rect
        x="15"
        y="17"
        width="10"
        height="5"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
      />
      
      {/* Star icon */}
      <motion.g
        initial={{ scale: 0, rotate: -45 }}
        animate={{ 
          scale: 1, 
          rotate: isHovered ? 360 : 0 
        }}
        transition={{ 
          scale: { duration: 0.5, delay: 0.7, type: "spring" },
          rotate: { duration: 2, ease: "easeInOut" }
        }}
      >
        <path
          d="M28 8 L29.2 11.2 L32.5 12 L29.2 12.8 L28 16 L26.8 12.8 L23.5 12 L26.8 11.2 Z"
          stroke="#1A1A1A"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
      </motion.g>
    </motion.svg>
  );
}

// Suite - Larger/wider bed
export function SuiteIcon({ size = 40, isSelected = false, isHovered = false }: RoomTypeIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={isHovered ? { y: [-0.5, 0.5, -0.5] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Wider bed base/mattress */}
      <motion.rect
        x="5"
        y="21"
        width="30"
        height="9"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Bed legs - wider spacing */}
      <motion.line
        x1="7"
        y1="30"
        x2="7"
        y2="34"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      <motion.line
        x1="33"
        y1="30"
        x2="33"
        y2="34"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      
      {/* Wider headboard */}
      <motion.rect
        x="5"
        y="11"
        width="30"
        height="10"
        rx="2"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Left pillow */}
      <motion.rect
        x="9"
        y="15"
        width="8"
        height="6"
        rx="2"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0, x: 5 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
      />
      
      {/* Right pillow */}
      <motion.rect
        x="23"
        y="15"
        width="8"
        height="6"
        rx="2"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0, x: -5 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.6, type: "spring" }}
      />
    </motion.svg>
  );
}

// Presidential Suite - Bed with crown
export function PresidentialSuiteIcon({ size = 40, isSelected = false, isHovered = false }: RoomTypeIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bed base/mattress */}
      <motion.rect
        x="6"
        y="22"
        width="28"
        height="9"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Bed legs */}
      <motion.line
        x1="8"
        y1="31"
        x2="8"
        y2="35"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      <motion.line
        x1="32"
        y1="31"
        x2="32"
        y2="35"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      
      {/* Headboard */}
      <motion.rect
        x="6"
        y="13"
        width="28"
        height="9"
        rx="2"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Pillows */}
      <motion.rect
        x="10"
        y="16"
        width="8"
        height="6"
        rx="2"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
      />
      <motion.rect
        x="22"
        y="16"
        width="8"
        height="6"
        rx="2"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
      />
      
      {/* Crown */}
      <motion.g
        initial={{ scale: 0, y: 3 }}
        animate={{ 
          scale: 1, 
          y: isHovered ? -1 : 0 
        }}
        transition={{ 
          scale: { duration: 0.5, delay: 0.7, type: "spring", stiffness: 200 },
          y: { duration: 0.8, ease: "easeInOut" }
        }}
      >
        {/* Crown base */}
        <path
          d="M16 8 L17 5 L20 7 L23 5 L24 8 Z"
          stroke="#1A1A1A"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Crown peaks */}
        <circle cx="17" cy="5" r="0.8" fill="#1A1A1A" />
        <circle cx="20" cy="4" r="0.8" fill="#1A1A1A" />
        <circle cx="23" cy="5" r="0.8" fill="#1A1A1A" />
        {/* Crown bottom line */}
        <line
          x1="16"
          y1="8"
          x2="24"
          y2="8"
          stroke="#1A1A1A"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </motion.g>
    </motion.svg>
  );
}

// Premium Room - Bed with diamond
export function PremiumRoomIcon({ size = 40, isSelected = false, isHovered = false }: RoomTypeIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bed base/mattress */}
      <motion.rect
        x="6"
        y="21"
        width="28"
        height="9"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Bed legs */}
      <motion.line
        x1="8"
        y1="30"
        x2="8"
        y2="34"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      <motion.line
        x1="32"
        y1="30"
        x2="32"
        y2="34"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      
      {/* Headboard */}
      <motion.rect
        x="6"
        y="13"
        width="28"
        height="8"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Pillow */}
      <motion.rect
        x="14"
        y="16"
        width="12"
        height="5"
        rx="1.5"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
      />
      
      {/* Diamond icon */}
      <motion.g
        initial={{ scale: 0, rotate: 45 }}
        animate={{ 
          scale: 1, 
          rotate: isHovered ? 405 : 45 
        }}
        transition={{ 
          scale: { duration: 0.5, delay: 0.7, type: "spring" },
          rotate: { duration: 2, ease: "easeInOut" }
        }}
      >
        {/* Diamond outer shape */}
        <path
          d="M28 6 L31 9 L28 12 L25 9 Z"
          stroke="#1A1A1A"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Diamond facets */}
        <line x1="28" y1="6" x2="28" y2="12" stroke="#1A1A1A" strokeWidth="1" />
        <line x1="25" y1="9" x2="31" y2="9" stroke="#1A1A1A" strokeWidth="1" />
      </motion.g>
    </motion.svg>
  );
}

// Export function to get icon component by room type ID
export function getRoomTypeIcon(roomTypeId: string) {
  const iconMap: Record<string, React.ComponentType<RoomTypeIconProps>> = {
    'economy': EconomyRoomIcon,
    'standard': StandardRoomIcon,
    'deluxe': DeluxeRoomIcon,
    'premium': PremiumRoomIcon,
    'suite': SuiteIcon,
    'presidential': PresidentialSuiteIcon,
  };

  return iconMap[roomTypeId] || StandardRoomIcon;
}
