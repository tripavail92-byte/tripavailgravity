import { motion } from 'motion/react';

interface AnimatedIconProps {
  className?: string;
  color?: string;
}

export const AnimatedTripIcon = ({ className = "w-8 h-8", color = "#5FAD43" }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 100 100"
    className={className}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
  >
    {/* Plane body */}
    <motion.path
      d="M20 50 L80 50 L75 45 L75 55 Z"
      fill={color}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, delay: 0.2 }}
    />
    {/* Wings */}
    <motion.path
      d="M35 40 L65 40 L60 50 L40 50 Z"
      fill={color}
      opacity={0.7}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring" }}
    />
    <motion.path
      d="M35 60 L65 60 L60 50 L40 50 Z"
      fill={color}
      opacity={0.7}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.6, type: "spring" }}
    />
    {/* Tail */}
    <motion.path
      d="M15 45 L25 50 L15 55 Z"
      fill={color}
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
    />
    {/* Motion trails */}
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 2, delay: 1 }}
    >
      <circle cx="10" cy="48" r="1" fill={color} opacity={0.5} />
      <circle cx="8" cy="52" r="1" fill={color} opacity={0.3} />
      <circle cx="6" cy="50" r="1" fill={color} opacity={0.2} />
    </motion.g>
  </motion.svg>
);

export const AnimatedCountryIcon = ({ className = "w-8 h-8", color = "#3B82F6" }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 100 100"
    className={className}
    initial={{ rotateY: 0 }}
    animate={{ rotateY: 360 }}
    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
  >
    {/* Globe circle */}
    <motion.circle
      cx="50"
      cy="50"
      r="40"
      fill="none"
      stroke={color}
      strokeWidth="3"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5 }}
    />
    {/* Longitude lines */}
    <motion.ellipse
      cx="50"
      cy="50"
      rx="20"
      ry="40"
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity={0.6}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    />
    <motion.ellipse
      cx="50"
      cy="50"
      rx="40"
      ry="20"
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity={0.6}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ delay: 0.7, duration: 0.8 }}
    />
    {/* Continents */}
    <motion.path
      d="M35 35 Q45 30 55 35 L55 45 Q45 50 35 45 Z"
      fill={color}
      opacity={0.8}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: "spring" }}
    />
    <motion.path
      d="M60 55 Q70 50 75 60 L70 70 Q60 65 60 55 Z"
      fill={color}
      opacity={0.8}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.2, type: "spring" }}
    />
  </motion.svg>
);

export const AnimatedReviewIcon = ({ className = "w-8 h-8", color = "#F59E0B" }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 100 100"
    className={className}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 150 }}
  >
    {/* Star shape */}
    <motion.path
      d="M50 15 L58 35 L80 35 L64 50 L72 70 L50 58 L28 70 L36 50 L20 35 L42 35 Z"
      fill={color}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
    />
    {/* Sparkles */}
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 2, delay: 1 }}
    >
      <circle cx="25" cy="25" r="2" fill={color} opacity={0.7} />
      <circle cx="75" cy="30" r="1.5" fill={color} opacity={0.5} />
      <circle cx="80" cy="70" r="2" fill={color} opacity={0.6} />
      <circle cx="20" cy="75" r="1" fill={color} opacity={0.4} />
    </motion.g>
    {/* Inner shine */}
    <motion.path
      d="M50 25 L54 38 L50 45 L46 38 Z"
      fill="white"
      opacity={0.3}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    />
  </motion.svg>
);

export const AnimatedHeartIcon = ({ className = "w-8 h-8", color = "#EF4444" }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 100 100"
    className={className}
    initial={{ scale: 0 }}
    animate={{ scale: [0, 1.2, 1] }}
    transition={{ duration: 0.6, times: [0, 0.6, 1] }}
  >
    {/* Heart shape */}
    <motion.path
      d="M50 85 C35 70 10 50 10 30 C10 20 20 10 30 10 C40 10 50 20 50 30 C50 20 60 10 70 10 C80 10 90 20 90 30 C90 50 65 70 50 85 Z"
      fill={color}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, delay: 0.2 }}
    />
    {/* Heartbeat pulse */}
    <motion.circle
      cx="50"
      cy="40"
      r="35"
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity={0.3}
      initial={{ scale: 0.8, opacity: 0.5 }}
      animate={{ scale: 1.3, opacity: 0 }}
      transition={{ repeat: Infinity, duration: 1.5, delay: 1 }}
    />
    {/* Inner shine */}
    <motion.ellipse
      cx="40"
      cy="35"
      rx="8"
      ry="12"
      fill="white"
      opacity={0.3}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: "spring" }}
    />
  </motion.svg>
);

export const AnimatedLocationIcon = ({ className = "w-8 h-8", color = "#8B5CF6" }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 100 100"
    className={className}
    initial={{ y: 10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 200 }}
  >
    {/* Pin body */}
    <motion.path
      d="M50 20 C60 20 70 30 70 40 C70 55 50 80 50 80 C50 80 30 55 30 40 C30 30 40 20 50 20 Z"
      fill={color}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
    />
    {/* Pin center */}
    <motion.circle
      cx="50"
      cy="40"
      r="8"
      fill="white"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring" }}
    />
    {/* Ripple effect */}
    <motion.circle
      cx="50"
      cy="40"
      r="15"
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity={0.4}
      initial={{ scale: 0.5, opacity: 0.8 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{ repeat: Infinity, duration: 2, delay: 1 }}
    />
    {/* Bounce animation */}
    <motion.g
      animate={{ y: [0, -5, 0] }}
      transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
    >
      <path
        d="M50 20 C60 20 70 30 70 40 C70 55 50 80 50 80 C50 80 30 55 30 40 C30 30 40 20 50 20 Z"
        fill={color}
        opacity={0.1}
      />
    </motion.g>
  </motion.svg>
);

export const AnimatedCameraIcon = ({ className = "w-6 h-6", color = "#6B7280" }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 100 100"
    className={className}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
  >
    {/* Camera body */}
    <motion.rect
      x="20"
      y="35"
      width="60"
      height="40"
      rx="8"
      fill={color}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    />
    {/* Lens */}
    <motion.circle
      cx="50"
      cy="55"
      r="12"
      fill="white"
      stroke={color}
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring" }}
    />
    {/* Lens center */}
    <motion.circle
      cx="50"
      cy="55"
      r="6"
      fill={color}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.4 }}
    />
    {/* Flash */}
    <motion.rect
      x="65"
      y="40"
      width="8"
      height="6"
      rx="2"
      fill="white"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 3, delay: 1 }}
    />
    {/* Top handle */}
    <motion.rect
      x="35"
      y="25"
      width="30"
      height="12"
      rx="6"
      fill={color}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 25, opacity: 1 }}
      transition={{ delay: 0.1 }}
    />
  </motion.svg>
);

export const AnimatedEditIcon = ({ className = "w-5 h-5", color = "#6B7280" }: AnimatedIconProps) => (
  <motion.svg
    viewBox="0 0 100 100"
    className={className}
    whileHover={{ rotate: 15 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    {/* Pen body */}
    <motion.path
      d="M20 80 L40 60 L60 80 L40 100 Z"
      fill={color}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    />
    {/* Pen tip */}
    <motion.path
      d="M40 60 L50 50 L70 70 L60 80 Z"
      fill={color}
      opacity={0.8}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: "spring" }}
    />
    {/* Writing line */}
    <motion.path
      d="M15 85 L35 85"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    />
  </motion.svg>
);