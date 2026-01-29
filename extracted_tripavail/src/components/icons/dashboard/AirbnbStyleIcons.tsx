import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface IconProps {
  size?: number;
  className?: string;
  isActive?: boolean;
  color?: string;
}

// Modern Trip Planning Icon with animated route
export function ModernTripPlanIcon({ size = 24, className = '', isActive = false, color = 'currentColor' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Calendar base */}
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke={iconColor}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Calendar header */}
      <motion.line
        x1="3"
        y1="9"
        x2="21"
        y2="9"
        stroke={iconColor}
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      
      {/* Calendar rings */}
      <circle cx="8" cy="2" r="1" fill={iconColor} opacity="0.6" />
      <circle cx="16" cy="2" r="1" fill={iconColor} opacity="0.6" />
      <line x1="8" y1="4" x2="8" y2="6" stroke={iconColor} strokeWidth="1.5" opacity="0.6" />
      <line x1="16" y1="4" x2="16" y2="6" stroke={iconColor} strokeWidth="1.5" opacity="0.6" />
      
      {/* Animated route dots */}
      <motion.circle
        cx="8"
        cy="13"
        r="2"
        fill={iconColor}
        initial={{ scale: 1, opacity: 0.7 }}
        animate={isActive ? { 
          scale: [1, 1.3, 1], 
          opacity: [0.7, 1, 0.7] 
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
      />
      <motion.circle
        cx="16"
        cy="13"
        r="2"
        fill={iconColor}
        initial={{ scale: 1, opacity: 0.7 }}
        animate={isActive ? { 
          scale: [1, 1.3, 1], 
          opacity: [0.7, 1, 0.7] 
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      />
      
      {/* Animated connecting line */}
      <motion.path
        d="M10 13 L14 13"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2,2"
        initial={{ pathLength: 0 }}
        animate={isActive ? { pathLength: [0, 1, 0] } : { pathLength: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

// Modern Wanderlust Icon with globe and sparkles
export function ModernWanderlustIcon({ size = 24, className = '', isActive = false, color = 'currentColor' }: IconProps) {
  const iconColor = isActive ? '#ff5a5f' : color;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Globe */}
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke={iconColor}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* Longitude lines */}
      <motion.ellipse
        cx="12"
        cy="12"
        rx="8"
        ry="3"
        stroke={iconColor}
        strokeWidth="1"
        fill="none"
        opacity="0.5"
        initial={{ rotate: 0 }}
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '12px 12px' }}
      />
      <motion.ellipse
        cx="12"
        cy="12"
        rx="3"
        ry="8"
        stroke={iconColor}
        strokeWidth="1"
        fill="none"
        opacity="0.5"
        initial={{ rotate: 0 }}
        animate={isActive ? { rotate: -360 } : {}}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '12px 12px' }}
      />
      
      {/* Latitude line */}
      <line x1="4" y1="12" x2="20" y2="12" stroke={iconColor} strokeWidth="1" opacity="0.3" />
      
      {/* Sparkle animations around globe */}
      <motion.g opacity="0.8">
        <motion.path
          d="M6 6 L7 5 L6 4 L5 5 Z"
          fill={iconColor}
          initial={{ scale: 0, rotate: 0 }}
          animate={isActive ? { 
            scale: [0, 1, 0], 
            rotate: [0, 180, 360] 
          } : { scale: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        />
        <motion.path
          d="M18 8 L19 7 L18 6 L17 7 Z"
          fill={iconColor}
          initial={{ scale: 0, rotate: 0 }}
          animate={isActive ? { 
            scale: [0, 1, 0], 
            rotate: [0, 180, 360] 
          } : { scale: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.path
          d="M7 18 L8 17 L7 16 L6 17 Z"
          fill={iconColor}
          initial={{ scale: 0, rotate: 0 }}
          animate={isActive ? { 
            scale: [0, 1, 0], 
            rotate: [0, 180, 360] 
          } : { scale: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        <motion.path
          d="M17 19 L18 18 L17 17 L16 18 Z"
          fill={iconColor}
          initial={{ scale: 0, rotate: 0 }}
          animate={isActive ? { 
            scale: [0, 1, 0], 
            rotate: [0, 180, 360] 
          } : { scale: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        />
      </motion.g>
    </motion.svg>
  );
}

// Modern Heart Icon with pulse animation
export function ModernHeartIcon({ size = 24, className = '', isActive = false, color = 'currentColor' }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Heart shape */}
      <motion.path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth="1.5"
        fill={isActive ? color : 'none'}
        fillOpacity={isActive ? 0.2 : 0}
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      
      {/* Pulse rings */}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        initial={{ scale: 1, opacity: 0 }}
        animate={isActive ? { 
          scale: [1, 1.8], 
          opacity: [0.3, 0] 
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity="0.4"
        initial={{ scale: 1, opacity: 0 }}
        animate={isActive ? { 
          scale: [1, 1.5], 
          opacity: [0.4, 0] 
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
      />
    </motion.svg>
  );
}

// Modern Journey Icon with path animation
export function ModernJourneyIcon({ size = 24, className = '', isActive = false, color = 'currentColor' }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Map base */}
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Journey path */}
      <motion.path
        d="M7 10 Q12 7 17 10 Q14 13 12 16 Q10 13 7 10"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2,3"
        initial={{ pathLength: 0 }}
        animate={isActive ? { pathLength: [0, 1, 0] } : { pathLength: 0.3 }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Location markers */}
      <motion.circle
        cx="7"
        cy="10"
        r="2"
        fill={color}
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
      />
      <motion.circle
        cx="17"
        cy="10"
        r="2"
        fill={color}
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle
        cx="12"
        cy="16"
        r="2"
        fill={color}
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      
      {/* Floating elements */}
      <motion.circle
        cx="9"
        cy="7"
        r="1"
        fill={color}
        opacity="0.6"
        initial={{ y: 0 }}
        animate={isActive ? { y: [-1, 1, -1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="15"
        cy="7"
        r="1"
        fill={color}
        opacity="0.6"
        initial={{ y: 0 }}
        animate={isActive ? { y: [1, -1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
    </motion.svg>
  );
}

// Modern Memories Icon with photo stack
export function ModernMemoriesIcon({ size = 24, className = '', isActive = false, color = 'currentColor' }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Photo stack */}
      <motion.rect
        x="4"
        y="5"
        width="14"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        initial={{ rotate: 0 }}
        animate={isActive ? { rotate: [-1, 1, -1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.rect
        x="6"
        y="7"
        width="14"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
        initial={{ rotate: 0 }}
        animate={isActive ? { rotate: [1, -1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />
      
      {/* Camera icon on top photo */}
      <motion.circle
        cx="12"
        cy="11"
        r="3"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <circle cx="12" cy="11" r="1.5" fill={color} opacity="0.3" />
      
      {/* Flash/sparkle effect */}
      <motion.g opacity="0.8">
        <motion.path
          d="M8 8 L9 7 L8 6 L7 7 Z"
          fill={color}
          initial={{ scale: 0, opacity: 0 }}
          animate={isActive ? { 
            scale: [0, 1, 0], 
            opacity: [0, 1, 0] 
          } : {}}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
        />
        <motion.path
          d="M16 9 L17 8 L16 7 L15 8 Z"
          fill={color}
          initial={{ scale: 0, opacity: 0 }}
          animate={isActive ? { 
            scale: [0, 1, 0], 
            opacity: [0, 1, 0] 
          } : {}}
          transition={{ duration: 1, repeat: Infinity, delay: 0.8 }}
        />
      </motion.g>
    </motion.svg>
  );
}

// Modern Adventure Icon with mountain and sun
export function ModernAdventureIcon({ size = 24, className = '', isActive = false, color = 'currentColor' }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Mountains */}
      <motion.path
        d="M3 18 L8 8 L12 13 L16 6 L21 18"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Mountain fills */}
      <motion.path
        d="M3 18 L8 8 L12 13 Z"
        fill={color}
        opacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      <motion.path
        d="M12 13 L16 6 L21 18 Z"
        fill={color}
        opacity="0.2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      />
      
      {/* Animated sun */}
      <motion.circle
        cx="18"
        cy="7"
        r="2"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Sun rays */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '18px 7px' }}
      >
        <line x1="18" y1="3" x2="18" y2="4" stroke={color} strokeWidth="1" opacity="0.6" />
        <line x1="18" y1="10" x2="18" y2="11" stroke={color} strokeWidth="1" opacity="0.6" />
        <line x1="14" y1="7" x2="15" y2="7" stroke={color} strokeWidth="1" opacity="0.6" />
        <line x1="21" y1="7" x2="22" y2="7" stroke={color} strokeWidth="1" opacity="0.6" />
        <line x1="15.34" y1="4.34" x2="15.75" y2="4.75" stroke={color} strokeWidth="1" opacity="0.6" />
        <line x1="20.25" y1="9.25" x2="20.66" y2="9.66" stroke={color} strokeWidth="1" opacity="0.6" />
        <line x1="15.34" y1="9.66" x2="15.75" y2="9.25" stroke={color} strokeWidth="1" opacity="0.6" />
        <line x1="20.25" y1="4.75" x2="20.66" y2="4.34" stroke={color} strokeWidth="1" opacity="0.6" />
      </motion.g>
      
      {/* Floating clouds */}
      <motion.ellipse
        cx="6"
        cy="5"
        rx="2"
        ry="1"
        fill={color}
        opacity="0.3"
        initial={{ x: 0 }}
        animate={isActive ? { x: [0, 2, 0] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx="14"
        cy="4"
        rx="1.5"
        ry="0.8"
        fill={color}
        opacity="0.2"
        initial={{ x: 0 }}
        animate={isActive ? { x: [0, -1, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </motion.svg>
  );
}

// Modern Experience Badge Icon
export function ModernExperienceIcon({ size = 24, className = '', isActive = false, color = 'currentColor' }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Badge circle */}
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Inner decorative circle */}
      <motion.circle
        cx="12"
        cy="12"
        r="6"
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        initial={{ rotate: 0 }}
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '12px 12px' }}
      />
      
      {/* Star in center */}
      <motion.path
        d="M12 6 L13.09 9.26 L17 9 L14.18 11.74 L15.18 15.74 L12 13.77 L8.82 15.74 L9.82 11.74 L7 9 L10.91 9.26 L12 6 Z"
        fill={color}
        opacity="0.7"
        initial={{ scale: 1, rotate: 0 }}
        animate={isActive ? { 
          scale: [1, 1.1, 1], 
          rotate: [0, 5, -5, 0] 
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Orbiting dots */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '12px 12px' }}
      >
        <circle cx="12" cy="4" r="1" fill={color} opacity="0.6" />
        <circle cx="20" cy="12" r="1" fill={color} opacity="0.6" />
        <circle cx="12" cy="20" r="1" fill={color} opacity="0.6" />
        <circle cx="4" cy="12" r="1" fill={color} opacity="0.6" />
      </motion.g>
    </motion.svg>
  );
}

// Modern Notification Icon with ping animation
export function ModernNotificationIcon({ size = 24, className = '', isActive = false, color = 'currentColor' }: IconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Bell shape */}
      <motion.path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      
      {/* Bell bottom */}
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Notification dot */}
      <motion.circle
        cx="19"
        cy="6"
        r="2"
        fill="#ff5a5f"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      
      {/* Ping effect */}
      <motion.circle
        cx="19"
        cy="6"
        r="3"
        stroke="#ff5a5f"
        strokeWidth="1"
        fill="none"
        initial={{ scale: 1, opacity: 0 }}
        animate={isActive ? { 
          scale: [1, 2], 
          opacity: [0.6, 0] 
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.svg>
  );
}