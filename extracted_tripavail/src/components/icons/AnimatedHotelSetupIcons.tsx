import { motion } from 'motion/react';
import { useState } from 'react';

interface IconProps {
  className?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  size?: number;
}

export function AnimatedInfoIcon({ className = "", isActive = false, isCompleted = false, size = 24 }: IconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconColor = isCompleted ? '#5FAD43' : isActive ? '#5FAD43' : isHovered ? '#5FAD43' : '#94A3B8';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={iconColor}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, rotate: -90 }}
        animate={{ 
          pathLength: isCompleted ? 1 : isActive ? 0.7 : 0.3,
          rotate: isCompleted ? 0 : -90 
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isCompleted ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.path
        d="M12 16v-4M12 8h.01"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: isCompleted ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.svg>
  );
}

export function AnimatedCameraIcon({ className = "", isActive = false, isCompleted = false, size = 24 }: IconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconColor = isCompleted ? '#5FAD43' : isActive ? '#5FAD43' : isHovered ? '#5FAD43' : '#94A3B8';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { y: [0, -2, 0] } : {}}
      transition={{ duration: 0.8, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
    >
      <motion.path
        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
        stroke={iconColor}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <motion.circle
        cx="12"
        cy="13"
        r="3"
        stroke={iconColor}
        strokeWidth="2"
        fill={isCompleted ? iconColor : "none"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      {isActive && (
        <motion.circle
          cx="12"
          cy="13"
          r="1"
          fill="#ffffff"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

export function AnimatedBedIcon({ className = "", isActive = false, isCompleted = false, size = 24 }: IconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconColor = isCompleted ? '#5FAD43' : isActive ? '#5FAD43' : isHovered ? '#5FAD43' : '#94A3B8';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.path
        d="M7 7a4 4 0 0 1 4-4 4 4 0 0 1 4 4v9H7z"
        stroke={iconColor}
        strokeWidth="2"
        fill={isCompleted ? `${iconColor}20` : "none"}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.path
        d="M22 19v-4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"
        stroke={iconColor}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.path
        d="M2 19h1.5a1.5 1.5 0 0 0 0-3H2M22 19h-1.5a1.5 1.5 0 0 1 0-3H22"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      {isActive && (
        <motion.circle
          cx="11"
          cy="10"
          r="1"
          fill={iconColor}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

export function AnimatedDollarIcon({ className = "", isActive = false, isCompleted = false, size = 24 }: IconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconColor = isCompleted ? '#5FAD43' : isActive ? '#5FAD43' : isHovered ? '#5FAD43' : '#94A3B8';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { rotateY: [0, 180, 360] } : {}}
      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={iconColor}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, rotate: -90 }}
        animate={{ pathLength: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <motion.path
        d="M12 6v12M9 9a3 3 0 0 1 6 0M9 15a3 3 0 0 0 6 0"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      {isCompleted && (
        <motion.path
          d="M8 12l2 2 4-4"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
      )}
    </motion.svg>
  );
}

export function AnimatedShieldIcon({ className = "", isActive = false, isCompleted = false, size = 24 }: IconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconColor = isCompleted ? '#5FAD43' : isActive ? '#5FAD43' : isHovered ? '#5FAD43' : '#94A3B8';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={iconColor}
        strokeWidth="2"
        fill={isCompleted ? `${iconColor}20` : "none"}
        initial={{ pathLength: 0, scale: 0.8 }}
        animate={{ pathLength: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        stroke={isCompleted ? iconColor : "transparent"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isCompleted ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="8"
          stroke={`${iconColor}40`}
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

export function AnimatedLocationIcon({ className = "", isActive = false, isCompleted = false, size = 24 }: IconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconColor = isCompleted ? '#5FAD43' : isActive ? '#5FAD43' : isHovered ? '#5FAD43' : '#94A3B8';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
    >
      <motion.path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={iconColor}
        strokeWidth="2"
        fill={isCompleted ? `${iconColor}20` : "none"}
        initial={{ pathLength: 0, scale: 0.8 }}
        animate={{ pathLength: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.circle
        cx="12"
        cy="10"
        r="3"
        stroke={iconColor}
        strokeWidth="2"
        fill={isCompleted ? iconColor : "none"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      {isActive && (
        <motion.circle
          cx="12"
          cy="10"
          r="6"
          stroke={`${iconColor}40`}
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 0],
            opacity: [0, 0.8, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

export function AnimatedHotelIcon({ className = "", isActive = false, isCompleted = false, size = 24 }: IconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconColor = isCompleted ? '#5FAD43' : isActive ? '#5FAD43' : isHovered ? '#5FAD43' : '#94A3B8';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.path
        d="M3 21h18"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M5 21V7l8-4v18"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isCompleted ? `${iconColor}10` : "none"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.path
        d="M19 21V10l-6-3"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isCompleted ? `${iconColor}10` : "none"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      <motion.path
        d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      {isActive && (
        <motion.circle
          cx="9"
          cy="12"
          r="0.5"
          fill={iconColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
        />
      )}
    </motion.svg>
  );
}