import { motion } from 'motion/react';

interface IconProps {
  isSelected?: boolean;
  isCompleted?: boolean;
  size?: number;
  className?: string;
}

// Step 1: Property Type Icon - Premium 3D Hotel with Animated Guests
export function PropertyTypeIcon({ isSelected, isCompleted, size = 48, className }: IconProps) {
  const baseColors = {
    building: isCompleted ? '#10B981' : isSelected ? '#9D4EDD' : '#6B7280',
    roof: isCompleted ? '#059669' : isSelected ? '#00D4FF' : '#4B5563',
    accent: isCompleted ? '#34D399' : isSelected ? '#FB7185' : '#9CA3AF',
    window: isCompleted ? '#FCD34D' : isSelected ? '#FCD34D' : '#D1D5DB',
    guest: isCompleted ? '#10B981' : isSelected ? '#FF385C' : '#6B7280',
  };
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      animate={{
        scale: isSelected ? 1.05 : 1,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id={`building-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={baseColors.building} />
          <stop offset="100%" stopColor={baseColors.building} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`roof-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={baseColors.roof} />
          <stop offset="100%" stopColor={baseColors.roof} stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id={`window-glow-${size}`}>
          <stop offset="0%" stopColor={baseColors.window} />
          <stop offset="100%" stopColor={baseColors.window} stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="60" cy="110" rx="35" ry="3" fill="#000000" opacity="0.1" />

      {/* Main Building with 3D effect */}
      <motion.rect
        x="35"
        y="35"
        width="50"
        height="70"
        fill={`url(#building-${size})`}
        rx="3"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />
      
      {/* 3D Side Panel */}
      <motion.path
        d="M 35 35 L 30 40 L 30 110 L 35 105 Z"
        fill={baseColors.building}
        opacity="0.4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      />

      {/* Roof */}
      <motion.path
        d="M 25 35 L 60 15 L 95 35 L 85 35 L 60 20 L 35 35 Z"
        fill={`url(#roof-${size})`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
      />

      {/* Windows Grid - 3x5 */}
      {[...Array(15)].map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const isLit = i % 2 === 0;
        
        return (
          <motion.rect
            key={i}
            x={42 + col * 12}
            y={42 + row * 11}
            width="7"
            height="8"
            fill={isLit ? `url(#window-glow-${size})` : baseColors.building}
            opacity={isLit ? 1 : 0.3}
            rx="1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: isLit ? [0.7, 1, 0.7] : 0.3
            }}
            transition={{
              scale: { delay: 0.4 + i * 0.03, duration: 0.2 },
              opacity: isLit ? { 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.15 
              } : {}
            }}
          />
        );
      })}

      {/* Main Entrance */}
      <motion.rect
        x="50"
        y="90"
        width="20"
        height="15"
        fill="#1F2937"
        rx="2"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
      
      {/* Door panels */}
      <motion.rect x="53" y="93" width="6" height="12" fill="#374151" rx="1" />
      <motion.rect x="61" y="93" width="6" height="12" fill="#374151" rx="1" />
      <circle cx="58" cy="99" r="0.8" fill={baseColors.accent} />
      <circle cx="62" cy="99" r="0.8" fill={baseColors.accent} />

      {/* Awning */}
      <motion.path
        d="M 45 90 L 48 85 L 72 85 L 75 90 Z"
        fill={baseColors.accent}
        opacity="0.7"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      />

      {/* Hotel Sign */}
      <motion.rect
        x="48"
        y="25"
        width="24"
        height="8"
        fill="#1F2937"
        rx="2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3, type: 'spring' }}
      />
      <motion.text
        x="60"
        y="31"
        textAnchor="middle"
        fontSize="5"
        fontWeight="bold"
        fill={baseColors.window}
        animate={isSelected ? { opacity: [0.6, 1, 0.6] } : {}}
        transition={isSelected ? { duration: 1.5, repeat: Infinity } : {}}
      >
        HOTEL
      </motion.text>

      {/* Animated Guests - Person 1 (Walking toward entrance) */}
      <motion.g
        initial={{ x: -15, opacity: 0 }}
        animate={{ 
          x: isSelected ? [0, 15, 15] : 0, 
          opacity: isSelected ? [0, 1, 0] : 0.8 
        }}
        transition={{ 
          duration: 3, 
          repeat: isSelected ? Infinity : 0,
          repeatDelay: 1,
          ease: "linear" 
        }}
      >
        {/* Body */}
        <circle cx="20" cy="102" r="2.5" fill={baseColors.guest} />
        <rect x="18.5" y="104" width="3" height="5" fill={baseColors.guest} rx="1" />
        {/* Legs - animated walking */}
        <motion.line
          x1="19.5" y1="109" x2="19" y2="112"
          stroke={baseColors.guest}
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={isSelected ? { 
            x2: [19, 20, 19],
          } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
        <motion.line
          x1="20.5" y1="109" x2="21" y2="112"
          stroke={baseColors.guest}
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={isSelected ? { 
            x2: [21, 20, 21],
          } : {}}
          transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
        />
        {/* Luggage */}
        <rect x="22" y="106" width="2.5" height="3" fill={baseColors.accent} rx="0.5" />
      </motion.g>

      {/* Animated Guests - Person 2 (Entering) */}
      <motion.g
        initial={{ x: 25, opacity: 0 }}
        animate={{ 
          x: isSelected ? [0, -10, -10] : 0, 
          opacity: isSelected ? [0, 1, 0] : 0.6 
        }}
        transition={{ 
          duration: 3.5, 
          repeat: isSelected ? Infinity : 0,
          repeatDelay: 0.5,
          ease: "linear",
          delay: 1.2
        }}
      >
        {/* Body */}
        <circle cx="75" cy="103" r="2" fill={baseColors.guest} opacity="0.9" />
        <rect x="73.5" y="105" width="3" height="4" fill={baseColors.guest} rx="1" opacity="0.9" />
        {/* Legs */}
        <motion.line
          x1="74.5" y1="109" x2="74" y2="112"
          stroke={baseColors.guest}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
          animate={isSelected ? { 
            x2: [74, 75, 74],
          } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
        <motion.line
          x1="75.5" y1="109" x2="76" y2="112"
          stroke={baseColors.guest}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
          animate={isSelected ? { 
            x2: [76, 75, 76],
          } : {}}
          transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
        />
      </motion.g>

      {/* Animated Guests - Person 3 (Coming from right) */}
      <motion.g
        initial={{ x: 40, opacity: 0 }}
        animate={{ 
          x: isSelected ? [0, -25, -25] : 0, 
          opacity: isSelected ? [0, 1, 0] : 0.7 
        }}
        transition={{ 
          duration: 4, 
          repeat: isSelected ? Infinity : 0,
          repeatDelay: 0.8,
          ease: "linear",
          delay: 2
        }}
      >
        {/* Body - Couple */}
        <circle cx="95" cy="104" r="2" fill={baseColors.guest} />
        <rect x="93.5" y="106" width="3" height="4" fill={baseColors.guest} rx="1" />
        <motion.line
          x1="94.5" y1="110" x2="94" y2="113"
          stroke={baseColors.guest}
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={isSelected ? { 
            x2: [94, 95, 94],
          } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
        <motion.line
          x1="95.5" y1="110" x2="96" y2="113"
          stroke={baseColors.guest}
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={isSelected ? { 
            x2: [96, 95, 96],
          } : {}}
          transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
        />
      </motion.g>

      {/* Stars/Sparkles when selected */}
      {(isSelected || isCompleted) && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.circle
              key={i}
              cx={50 + i * 10}
              cy={12}
              r="1"
              fill={baseColors.accent}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.3, 1], 
                opacity: [0, 1, 0.7],
              }}
              transition={{ 
                delay: 0.8 + i * 0.1, 
                duration: 0.5,
              }}
            />
          ))}
        </>
      )}
    </motion.svg>
  );
}

// Step 2: Location Icon
export function LocationIcon({ isSelected, isCompleted, size = 48, className }: IconProps) {
  const color = isCompleted ? '#10B981' : isSelected ? '#ff5a5f' : '#000000';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isSelected ? 1.1 : 1,
        y: isSelected ? [-2, 0, -2, 0] : 0
      }}
      transition={{ duration: 0.4, ease: "easeInOut", repeat: isSelected ? Infinity : 0 }}
    >
      {/* Map Pin */}
      <motion.path
        d="M24 4C17.373 4 12 9.373 12 16C12 24 24 44 24 44S36 24 36 16C36 9.373 30.627 4 24 4Z"
        stroke={color}
        strokeWidth="2"
        fill={isSelected ? `${color}15` : 'transparent'}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, scale: 0 }}
        animate={{ pathLength: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Inner Circle */}
      <motion.circle
        cx="24"
        cy="16"
        r="6"
        stroke={color}
        strokeWidth="2"
        fill={isSelected ? color : 'transparent'}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Pulse Effect when selected */}
      {isSelected && (
        <motion.circle
          cx="24"
          cy="16"
          r="8"
          stroke={color}
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

// Step 3: Amenities Icon
export function AmenitiesIcon({ isSelected, isCompleted, size = 48, className }: IconProps) {
  const color = isCompleted ? '#10B981' : isSelected ? '#ff5a5f' : '#000000';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isSelected ? 1.1 : 1
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Wifi Symbol */}
      <motion.path
        d="M12 24C12 18.477 16.477 14 22 14H26C31.523 14 36 18.477 36 24"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      
      <motion.path
        d="M16 28C16 23.582 19.582 20 24 20C28.418 20 32 23.582 32 28"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      
      <motion.circle
        cx="24"
        cy="32"
        r="2"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      
      {/* Swimming Pool */}
      <motion.ellipse
        cx="24"
        cy="40"
        rx="12"
        ry="3"
        stroke={color}
        strokeWidth="2"
        fill={isSelected ? `${color}15` : 'transparent'}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      
      {/* Pool Waves */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${16 + i * 4} 40C${18 + i * 4} 38 ${20 + i * 4} 42 ${22 + i * 4} 40`}
          stroke={color}
          strokeWidth="1"
          fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
        />
      ))}
    </motion.svg>
  );
}

// Step 4: Photos Icon
export function PhotosIcon({ isSelected, isCompleted, size = 48, className }: IconProps) {
  const color = isCompleted ? '#10B981' : isSelected ? '#ff5a5f' : '#000000';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isSelected ? 1.1 : 1,
        rotate: isSelected ? [0, -2, 2, 0] : 0
      }}
      transition={{ duration: 0.4 }}
    >
      {/* Camera Body */}
      <motion.rect
        x="8"
        y="16"
        width="32"
        height="20"
        rx="4"
        stroke={color}
        strokeWidth="2"
        fill={isSelected ? `${color}10` : 'transparent'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Camera Top */}
      <motion.rect
        x="16"
        y="12"
        width="16"
        height="6"
        rx="2"
        stroke={color}
        strokeWidth="2"
        fill="transparent"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      />
      
      {/* Lens */}
      <motion.circle
        cx="24"
        cy="26"
        r="6"
        stroke={color}
        strokeWidth="2"
        fill={isSelected ? `${color}20` : 'transparent'}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      
      {/* Inner Lens */}
      <motion.circle
        cx="24"
        cy="26"
        r="3"
        stroke={color}
        strokeWidth="1"
        fill="transparent"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      
      {/* Flash */}
      <motion.rect
        x="34"
        y="18"
        width="3"
        height="2"
        rx="1"
        fill={color}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 1 }}
      />
      
      {/* Flash effect when selected */}
      {isSelected && (
        <motion.circle
          cx="35.5"
          cy="19"
          r="4"
          fill={color}
          opacity="0.3"
          initial={{ scale: 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

// Step 5: Pricing Icon
export function PricingIcon({ isSelected, isCompleted, size = 48, className }: IconProps) {
  const color = isCompleted ? '#10B981' : isSelected ? '#ff5a5f' : '#000000';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isSelected ? 1.1 : 1,
        rotateY: isSelected ? [0, 180, 360] : 0
      }}
      transition={{ duration: 0.6 }}
    >
      {/* Coin Circle */}
      <motion.circle
        cx="24"
        cy="24"
        r="16"
        stroke={color}
        strokeWidth="2"
        fill={isSelected ? `${color}10` : 'transparent'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Dollar Sign */}
      <motion.path
        d="M24 12V36M20 16H26C27.105 16 28 16.895 28 18C28 19.105 27.105 20 26 20H22C20.895 20 20 20.895 20 22V26C20 27.105 20.895 28 22 28H26C27.105 28 28 28.895 28 30C28 31.105 27.105 32 26 32H20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      />
      
      {/* Inner Circle Detail */}
      <motion.circle
        cx="24"
        cy="24"
        r="12"
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      
      {/* Sparkle Effects when selected */}
      {isSelected && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <motion.circle
              key={i}
              cx={24 + Math.cos(i * Math.PI / 2) * 20}
              cy={24 + Math.sin(i * Math.PI / 2) * 20}
              r="1"
              fill={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0, 1, 0] }}
              transition={{ 
                duration: 1, 
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
          ))}
        </>
      )}
    </motion.svg>
  );
}