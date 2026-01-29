import { motion } from 'motion/react';

interface BedIconProps {
  size?: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

// Single Bed - ONE narrow bed
export function SingleBedIcon({ size = 60, isSelected = false, isHovered = false }: BedIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Single narrow bed - centered */}
      {/* Headboard */}
      <motion.rect
        x="20"
        y="18"
        width="20"
        height="8"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Mattress */}
      <motion.rect
        x="20"
        y="26"
        width="20"
        height="10"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Pillow */}
      <motion.rect
        x="25"
        y="21"
        width="10"
        height="5"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
      />
      
      {/* Left leg */}
      <motion.line
        x1="22"
        y1="36"
        x2="22"
        y2="42"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      
      {/* Right leg */}
      <motion.line
        x1="38"
        y1="36"
        x2="38"
        y2="42"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
    </motion.svg>
  );
}

// Double Bed - ONE wider bed
export function DoubleBedIcon({ size = 60, isSelected = false, isHovered = false }: BedIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* One wider bed */}
      {/* Headboard */}
      <motion.rect
        x="12"
        y="18"
        width="36"
        height="8"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Mattress */}
      <motion.rect
        x="12"
        y="26"
        width="36"
        height="10"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Two pillows side by side */}
      <motion.rect
        x="16"
        y="21"
        width="12"
        height="5"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0, x: 4 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
      />
      <motion.rect
        x="32"
        y="21"
        width="12"
        height="5"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0, x: -4 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.35, type: "spring" }}
      />
      
      {/* Left leg */}
      <motion.line
        x1="15"
        y1="36"
        x2="15"
        y2="42"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      
      {/* Right leg */}
      <motion.line
        x1="45"
        y1="36"
        x2="45"
        y2="42"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
    </motion.svg>
  );
}

// Twin Beds - TWO separate narrow beds
export function TwinBedsIcon({ size = 60, isSelected = false, isHovered = false }: BedIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* LEFT BED */}
      {/* Left bed headboard */}
      <motion.rect
        x="8"
        y="18"
        width="16"
        height="6"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      
      {/* Left bed mattress */}
      <motion.rect
        x="8"
        y="24"
        width="16"
        height="8"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Left bed pillow */}
      <motion.rect
        x="11"
        y="20"
        width="10"
        height="4"
        rx="1"
        stroke="#374151"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.3, type: "spring" }}
      />
      
      {/* Left bed legs */}
      <motion.line
        x1="10"
        y1="32"
        x2="10"
        y2="38"
        stroke="#374151"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
      />
      <motion.line
        x1="22"
        y1="32"
        x2="22"
        y2="38"
        stroke="#374151"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
      />
      
      {/* RIGHT BED */}
      {/* Right bed headboard */}
      <motion.rect
        x="36"
        y="18"
        width="16"
        height="6"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeInOut" }}
      />
      
      {/* Right bed mattress */}
      <motion.rect
        x="36"
        y="24"
        width="16"
        height="8"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.25, ease: "easeInOut" }}
      />
      
      {/* Right bed pillow */}
      <motion.rect
        x="39"
        y="20"
        width="10"
        height="4"
        rx="1"
        stroke="#374151"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.45, type: "spring" }}
      />
      
      {/* Right bed legs */}
      <motion.line
        x1="38"
        y1="32"
        x2="38"
        y2="38"
        stroke="#374151"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.55 }}
      />
      <motion.line
        x1="50"
        y1="32"
        x2="50"
        y2="38"
        stroke="#374151"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.55 }}
      />
    </motion.svg>
  );
}

// Queen Bed - ONE large bed
export function QueenBedIcon({ size = 60, isSelected = false, isHovered = false }: BedIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Large bed */}
      {/* Headboard */}
      <motion.rect
        x="10"
        y="16"
        width="40"
        height="9"
        rx="2"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Mattress */}
      <motion.rect
        x="10"
        y="25"
        width="40"
        height="11"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Two large pillows */}
      <motion.rect
        x="14"
        y="19"
        width="14"
        height="6"
        rx="2"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0, x: 4 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
      />
      <motion.rect
        x="32"
        y="19"
        width="14"
        height="6"
        rx="2"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0, x: -4 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.35, type: "spring" }}
      />
      
      {/* Left leg */}
      <motion.line
        x1="13"
        y1="36"
        x2="13"
        y2="42"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      
      {/* Right leg */}
      <motion.line
        x1="47"
        y1="36"
        x2="47"
        y2="42"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
    </motion.svg>
  );
}

// King Bed - ONE extra large bed
export function KingBedIcon({ size = 60, isSelected = false, isHovered = false }: BedIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Extra large bed */}
      {/* Headboard */}
      <motion.rect
        x="8"
        y="15"
        width="44"
        height="10"
        rx="2"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Mattress */}
      <motion.rect
        x="8"
        y="25"
        width="44"
        height="12"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Two large pillows */}
      <motion.rect
        x="12"
        y="18"
        width="16"
        height="7"
        rx="2"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0, x: 4 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
      />
      <motion.rect
        x="32"
        y="18"
        width="16"
        height="7"
        rx="2"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0, x: -4 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.35, type: "spring" }}
      />
      
      {/* Left leg */}
      <motion.line
        x1="11"
        y1="37"
        x2="11"
        y2="43"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      
      {/* Right leg */}
      <motion.line
        x1="49"
        y1="37"
        x2="49"
        y2="43"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
    </motion.svg>
  );
}

// Sofa Bed - Couch style
export function SofaBedIcon({ size = 60, isSelected = false, isHovered = false }: BedIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sofa back */}
      <motion.rect
        x="12"
        y="18"
        width="36"
        height="8"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Sofa seat */}
      <motion.rect
        x="10"
        y="26"
        width="40"
        height="9"
        rx="1.5"
        stroke="#374151"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
      />
      
      {/* Left armrest */}
      <motion.rect
        x="8"
        y="20"
        width="3"
        height="15"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
      />
      
      {/* Right armrest */}
      <motion.rect
        x="49"
        y="20"
        width="3"
        height="15"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.35, type: "spring" }}
      />
      
      {/* Cushion lines */}
      <motion.line
        x1="22"
        y1="26"
        x2="22"
        y2="35"
        stroke="#374151"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
      <motion.line
        x1="30"
        y1="26"
        x2="30"
        y2="35"
        stroke="#374151"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.55 }}
      />
      <motion.line
        x1="38"
        y1="26"
        x2="38"
        y2="35"
        stroke="#374151"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />
      
      {/* Left leg */}
      <motion.line
        x1="13"
        y1="35"
        x2="13"
        y2="40"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      
      {/* Right leg */}
      <motion.line
        x1="47"
        y1="35"
        x2="47"
        y2="40"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
    </motion.svg>
  );
}

// Bunk Bed - Stacked beds
export function BunkBedIcon({ size = 60, isSelected = false, isHovered = false }: BedIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* TOP BUNK */}
      {/* Top mattress */}
      <motion.rect
        x="15"
        y="12"
        width="30"
        height="6"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      
      {/* Top pillow */}
      <motion.rect
        x="20"
        y="14"
        width="8"
        height="3"
        rx="0.5"
        stroke="#374151"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2, type: "spring" }}
      />
      
      {/* Safety rail */}
      <motion.line
        x1="15"
        y1="12"
        x2="15"
        y2="8"
        stroke="#374151"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      <motion.line
        x1="15"
        y1="8"
        x2="35"
        y2="8"
        stroke="#374151"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      />
      
      {/* BOTTOM BUNK */}
      {/* Bottom headboard */}
      <motion.rect
        x="15"
        y="26"
        width="30"
        height="5"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeInOut" }}
      />
      
      {/* Bottom mattress */}
      <motion.rect
        x="15"
        y="31"
        width="30"
        height="7"
        rx="1"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.25, ease: "easeInOut" }}
      />
      
      {/* Bottom pillow */}
      <motion.rect
        x="20"
        y="28"
        width="8"
        height="3"
        rx="0.5"
        stroke="#374151"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4, type: "spring" }}
      />
      
      {/* Support posts */}
      {/* Left post */}
      <motion.line
        x1="15"
        y1="18"
        x2="15"
        y2="38"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />
      
      {/* Right post */}
      <motion.line
        x1="45"
        y1="18"
        x2="45"
        y2="38"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />
      
      {/* Bottom legs */}
      <motion.line
        x1="15"
        y1="38"
        x2="15"
        y2="44"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.6 }}
      />
      <motion.line
        x1="45"
        y1="38"
        x2="45"
        y2="44"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.6 }}
      />
    </motion.svg>
  );
}

// Export function to get bed icon by type
export function getBedTypeIcon(bedType: string) {
  const iconMap: Record<string, React.ComponentType<BedIconProps>> = {
    'single': SingleBedIcon,
    'double': DoubleBedIcon,
    'twin': TwinBedsIcon,
    'queen': QueenBedIcon,
    'king': KingBedIcon,
    'sofa': SofaBedIcon,
    'bunk': BunkBedIcon,
  };

  return iconMap[bedType.toLowerCase()] || SingleBedIcon;
}
