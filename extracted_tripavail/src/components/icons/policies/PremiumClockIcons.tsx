import { motion } from 'motion/react';

interface ClockIconProps {
  size?: number;
  isSelected?: boolean;
  time?: string; // e.g., "14:00" or "11:00"
}

// Premium Analog Clock Icon
export function PremiumAnalogClockIcon({ size = 24, isSelected = false, time }: ClockIconProps) {
  // Parse time to get hour and minute for hands
  const [hours, minutes] = time ? time.split(':').map(Number) : [12, 0];
  const minuteAngle = (minutes / 60) * 360;
  const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clock face */}
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Hour markers */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
        <motion.line
          key={angle}
          x1="12"
          y1="4"
          x2="12"
          y2="5.5"
          stroke={isSelected ? "#9D4EDD" : "#374151"}
          strokeWidth={i % 3 === 0 ? "2" : "1.5"}
          strokeLinecap="round"
          transform={`rotate(${angle} 12 12)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + (i * 0.02), duration: 0.3 }}
        />
      ))}
      
      {/* Hour hand */}
      <motion.line
        x1="12"
        y1="12"
        x2="12"
        y2="7"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2.5"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 12 12)`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
      />
      
      {/* Minute hand */}
      <motion.line
        x1="12"
        y1="12"
        x2="12"
        y2="5.5"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 12 12)`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
      />
      
      {/* Center dot */}
      <motion.circle
        cx="12"
        cy="12"
        r="1.5"
        fill={isSelected ? "#9D4EDD" : "#374151"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
      />
    </motion.svg>
  );
}

// Premium Digital-style Clock with minimalist bars
export function PremiumDigitalClockIcon({ size = 24, isSelected = false }: ClockIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clock outline */}
      <motion.rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Digital segments - left digit "1" */}
      <motion.line
        x1="7"
        y1="9"
        x2="7"
        y2="15"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      />
      
      {/* Digital segments - middle digit "2" */}
      <motion.path
        d="M10 9 L12 9 M12 9 L12 11.5 M12 11.5 L10 11.5 M10 11.5 L10 15 M10 15 L12 15"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
      
      {/* Colon */}
      <motion.circle cx="14" cy="10.5" r="0.8" fill={isSelected ? "#9D4EDD" : "#374151"}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 }} />
      <motion.circle cx="14" cy="13.5" r="0.8" fill={isSelected ? "#9D4EDD" : "#374151"}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.75 }} />
      
      {/* Digital segments - right digit "0" */}
      <motion.rect
        x="16"
        y="9"
        width="2"
        height="6"
        rx="1"
        fill="none"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      />
    </motion.svg>
  );
}

// Premium Clock with Bell (for check-in notification style)
export function PremiumClockBellIcon({ size = 24, isSelected = false }: ClockIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clock circle */}
      <motion.circle
        cx="12"
        cy="13"
        r="8"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Clock hands */}
      <motion.line
        x1="12"
        y1="13"
        x2="12"
        y2="9"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
      <motion.line
        x1="12"
        y1="13"
        x2="15"
        y2="13"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      />
      
      {/* Bell at top */}
      <motion.path
        d="M10 3 Q12 1 14 3 L14 5 L10 5 Z"
        stroke={isSelected ? "#9D4EDD" : "#374151"}
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0, y: -2 }}
        animate={{ pathLength: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
      />
      
      {/* Bell clapper */}
      <motion.circle
        cx="12"
        cy="5"
        r="0.8"
        fill={isSelected ? "#9D4EDD" : "#374151"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
      />
    </motion.svg>
  );
}
