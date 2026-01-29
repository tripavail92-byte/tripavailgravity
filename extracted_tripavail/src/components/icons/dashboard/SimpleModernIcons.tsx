import { motion } from 'motion/react';

interface IconProps {
  size?: number;
  className?: string;
  isActive?: boolean;
  color?: string;
}

// Simple Trip Icon
export function SimpleTripIcon({ size = 24, className = '', isActive = false, color = '#6b7280' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <rect x="3" y="4" width="18" height="16" rx="3" stroke={iconColor} strokeWidth="1.5" fill="none" />
      <line x1="3" y1="9" x2="21" y2="9" stroke={iconColor} strokeWidth="1.5" />
      <circle cx="8" cy="2" r="1" fill={iconColor} opacity="0.6" />
      <circle cx="16" cy="2" r="1" fill={iconColor} opacity="0.6" />
      <line x1="8" y1="4" x2="8" y2="6" stroke={iconColor} strokeWidth="1.5" opacity="0.6" />
      <line x1="16" y1="4" x2="16" y2="6" stroke={iconColor} strokeWidth="1.5" opacity="0.6" />
      <circle cx="8" cy="13" r="1.5" fill={iconColor} opacity="0.8" />
      <circle cx="16" cy="13" r="1.5" fill={iconColor} opacity="0.8" />
      <path d="M10 13 L14 13" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2,2" opacity="0.6" />
    </motion.svg>
  );
}

// Simple Globe Icon
export function SimpleGlobeIcon({ size = 24, className = '', isActive = false, color = '#6b7280' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <circle cx="12" cy="12" r="8" stroke={iconColor} strokeWidth="1.5" fill="none" />
      <ellipse cx="12" cy="12" rx="8" ry="3" stroke={iconColor} strokeWidth="1" fill="none" opacity="0.5" />
      <ellipse cx="12" cy="12" rx="3" ry="8" stroke={iconColor} strokeWidth="1" fill="none" opacity="0.5" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={iconColor} strokeWidth="1" opacity="0.3" />
    </motion.svg>
  );
}

// Simple Heart Icon
export function SimpleHeartIcon({ size = 24, className = '', isActive = false, color = '#6b7280' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={iconColor}
        strokeWidth="1.5"
        fill={isActive ? iconColor : 'none'}
        fillOpacity={isActive ? 0.2 : 0}
      />
    </motion.svg>
  );
}

// Simple Map Icon
export function SimpleMapIcon({ size = 24, className = '', isActive = false, color = '#6b7280' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <rect x="3" y="4" width="18" height="16" rx="3" stroke={iconColor} strokeWidth="1.5" fill="none" />
      <path d="M7 10 Q12 7 17 10 Q14 13 12 16 Q10 13 7 10" stroke={iconColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="7" cy="10" r="1.5" fill={iconColor} />
      <circle cx="17" cy="10" r="1.5" fill={iconColor} />
      <circle cx="12" cy="16" r="1.5" fill={iconColor} />
    </motion.svg>
  );
}

// Simple Camera Icon
export function SimpleCameraIcon({ size = 24, className = '', isActive = false, color = '#6b7280' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <rect x="4" y="6" width="16" height="12" rx="2" stroke={iconColor} strokeWidth="1.5" fill="none" />
      <rect x="6" y="8" width="12" height="8" rx="1" stroke={iconColor} strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="12" cy="12" r="3" stroke={iconColor} strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="1.5" fill={iconColor} opacity="0.3" />
      <rect x="8" y="4" width="8" height="2" rx="1" fill={iconColor} opacity="0.4" />
    </motion.svg>
  );
}

// Simple Mountain Icon
export function SimpleMountainIcon({ size = 24, className = '', isActive = false, color = '#6b7280' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <path d="M3 18 L8 8 L12 13 L16 6 L21 18" stroke={iconColor} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 18 L8 8 L12 13 Z" fill={iconColor} opacity="0.1" />
      <path d="M12 13 L16 6 L21 18 Z" fill={iconColor} opacity="0.2" />
      <circle cx="18" cy="7" r="1.5" stroke={iconColor} strokeWidth="1.5" fill="none" />
    </motion.svg>
  );
}

// Simple Star Icon
export function SimpleStarIcon({ size = 24, className = '', isActive = false, color = '#6b7280' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <circle cx="12" cy="12" r="9" stroke={iconColor} strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="6" stroke={iconColor} strokeWidth="1" fill="none" opacity="0.3" />
      <path d="M12 6 L13.09 9.26 L17 9 L14.18 11.74 L15.18 15.74 L12 13.77 L8.82 15.74 L9.82 11.74 L7 9 L10.91 9.26 L12 6 Z" fill={iconColor} opacity="0.7" />
    </motion.svg>
  );
}

// Simple Notification Icon
export function SimpleNotificationIcon({ size = 24, className = '', isActive = false, color = '#6b7280' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={iconColor} strokeWidth="1.5" fill="none" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
    </motion.svg>
  );
}