# TripAvail - List Your Hotel Screen - Complete Animated Icons Code

## Overview
This document contains the complete code for all animated SVG icons used in the "List Your Hotel" screen. These icons are designed with outline-only styling, dark mode support, and sophisticated animations.

---

## Table of Contents

1. [Utility Functions & Hooks](#utility-functions--hooks)
2. [Property Type Icon (Step 1)](#property-type-icon-step-1)
3. [Location Icon (Step 2)](#location-icon-step-2)
4. [Amenities Icon (Step 3)](#amenities-icon-step-3)
5. [Photos Icon (Step 4)](#photos-icon-step-4)
6. [Pricing Icon (Step 5)](#pricing-icon-step-5)
7. [Premium Property Vectors](#premium-property-vectors)

---

## File Location

**Path**: `/components/icons/hotel-listing/PremiumStepIcons.tsx`

---

## Complete Code

### Utility Functions & Hooks

```typescript
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

// ============================================
// INTERFACES
// ============================================

interface IconProps {
  size?: number;              // Icon size in pixels (default: 80)
  isActive?: boolean;         // Whether icon is in active/hovered state
}

// ============================================
// DARK MODE DETECTION HOOK
// ============================================

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check if dark mode class exists on html element
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    checkDarkMode();
    
    // Watch for changes to dark mode
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  return isDark;
};

// ============================================
// COLOR HELPER FUNCTIONS
// ============================================

// Returns lighter colors for dark mode to maintain visibility
const getStrokeColor = (isDark: boolean, type: 'primary' | 'secondary' = 'primary') => {
  if (type === 'primary') {
    return isDark ? '#E5E5E5' : '#666666'; // Much lighter in dark mode
  }
  return isDark ? '#B8B8B8' : '#888888'; // Lighter secondary color in dark mode
};

const getFillColor = (isDark: boolean) => {
  return isDark ? '#D1D1D1' : '#666666';
};
```

---

## Property Type Icon (Step 1)

**Duration**: 1 minute  
**Animation**: Building cycles through 8 property types every 3 seconds

```typescript
// ============================================
// PROPERTY TYPES THAT WILL CYCLE
// ============================================

const PROPERTY_TYPES = [
  { name: 'Hotel', floors: 5 },
  { name: 'Inn', floors: 3 },
  { name: 'Resort', floors: 4 },
  { name: 'Motel', floors: 2 },
  { name: 'Lodge', floors: 3 },
  { name: 'Boutique', floors: 4 },
  { name: 'Hostel', floors: 3 },
  { name: 'Guesthouse', floors: 2 }
];

// ============================================
// PROPERTY TYPE ICON COMPONENT
// ============================================

export const PremiumPropertyTypeIcon = ({ 
  size = 80, 
  isActive = false 
}: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = useDarkMode();

  // Cycle through property types every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROPERTY_TYPES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentType = PROPERTY_TYPES[currentIndex];
  const floors = currentType.floors;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow at base */}
      <ellipse 
        cx="60" 
        cy="105" 
        rx="35" 
        ry="8" 
        fill={isDark ? "#FFFFFF" : "#000000"} 
        opacity="0.08" 
      />
      
      {/* Building changes with property type */}
      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ duration: 0.6 }}
        >
          {/* Main Building - Outline only */}
          <rect 
            x="25" 
            y={100 - floors * 12} 
            width="70" 
            height={floors * 12} 
            rx="4" 
            fill="none"
            stroke={getStrokeColor(isDark, 'primary')} 
            strokeWidth="2"
          />
          
          {/* Windows - Grid Pattern */}
          {Array.from({ length: floors }).map((_, floor) =>
            [0, 1, 2, 3].map((col) => (
              <motion.rect
                key={`${floor}-${col}`}
                x={32 + col * 14}
                y={95 - floor * 12}
                width="8"
                height="6"
                rx="1"
                fill="none"
                stroke={getStrokeColor(isDark, 'secondary')}
                strokeWidth="1.5"
                // Windows light up in sequence
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.4, 1] }}
                transition={{ 
                  duration: 2,
                  delay: floor * 0.2 + col * 0.1,
                }}
              />
            ))
          )}
          
          {/* Entrance Door - Outline */}
          <rect 
            x="52" 
            y="88" 
            width="16" 
            height="12" 
            rx="2" 
            fill="none"
            stroke={getStrokeColor(isDark, 'primary')} 
            strokeWidth="2"
          />
          
          {/* Property Type Label at top */}
          <motion.text
            x="60"
            y="25"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {currentType.name}
          </motion.text>
        </motion.g>
      </AnimatePresence>
      
      {/* Floating particles around building */}
      {[...Array(4)].map((_, i) => (
        <motion.circle
          key={i}
          cx={30 + i * 20}
          cy={35}
          r="1.5"
          fill={getStrokeColor(isDark, 'secondary')}
          animate={{ 
            y: [0, -12, 0],
            opacity: [0, 0.6, 0]
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
```

---

## Location Icon (Step 2)

**Duration**: 2 minutes  
**Animation**: Globe with rotating grid lines and dropping map pins

```typescript
// ============================================
// LOCATION ICON COMPONENT
// ============================================

export const PremiumLocationIcon = ({ 
  size = 80, 
  isActive = false 
}: IconProps) => {
  const isDark = useDarkMode();
  
  // Pin positions on the globe (x, y, animation delay)
  const pinPositions = [
    { x: 45, y: 48, delay: 0 },
    { x: 35, y: 56, delay: 0.8 },
    { x: 52, y: 60, delay: 1.6 },
    { x: 42, y: 64, delay: 2.4 },
  ];

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse 
        cx="60" 
        cy="105" 
        rx="30" 
        ry="7" 
        fill={isDark ? "#FFFFFF" : "#000000"} 
        opacity="0.08" 
      />
      
      {/* Main Globe Circle - Outline */}
      <motion.circle 
        cx="45" 
        cy="56" 
        r="20" 
        fill="none"
        stroke={getStrokeColor(isDark, 'primary')}
        strokeWidth="2.5"
        // Draw circle animation
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Rotating Globe with Longitude and Latitude Lines */}
      <motion.g
        // Slow rotation
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ originX: "45px", originY: "56px" }}
      >
        {/* ========== LONGITUDE LINES (Vertical) ========== */}
        
        {/* Center Meridian - Straight vertical line */}
        <line 
          x1="45" 
          y1="36" 
          x2="45" 
          y2="76" 
          stroke={getStrokeColor(isDark, 'secondary')} 
          strokeWidth="1.5"
        />
        
        {/* Left Longitude Lines - Curved */}
        <path
          d="M 35 36 Q 32 56 35 76"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.7"
        />
        
        <path
          d="M 28 40 Q 25 56 28 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.5"
        />
        
        {/* Right Longitude Lines - Curved */}
        <path
          d="M 55 36 Q 58 56 55 76"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.7"
        />
        
        <path
          d="M 62 40 Q 65 56 62 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.5"
        />
        
        {/* ========== LATITUDE LINES (Horizontal) ========== */}
        
        {/* Equator - Bold center line */}
        <line 
          x1="25" 
          y1="56" 
          x2="65" 
          y2="56" 
          stroke={getStrokeColor(isDark, 'secondary')} 
          strokeWidth="1.5"
        />
        
        {/* Northern Latitude - Curved horizontal */}
        <path
          d="M 28 46 Q 45 45 62 46"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.6"
        />
        
        <path
          d="M 32 40 Q 45 39 58 40"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.4"
        />
        
        {/* Southern Latitude - Curved horizontal */}
        <path
          d="M 28 66 Q 45 67 62 66"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.6"
        />
        
        <path
          d="M 32 72 Q 45 73 58 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.4"
        />
      </motion.g>
      
      {/* Map Pins Dropping onto Globe */}
      {pinPositions.map((pin, i) => (
        <motion.g
          key={i}
          animate={{
            y: [0, 0, 0],
            opacity: [0, 1, 1]
          }}
          transition={{
            duration: 3.2,
            delay: pin.delay,
            repeat: Infinity,
            ease: "easeOut"
          }}
        >
          {/* Pin Drop Animation */}
          <motion.g
            animate={{
              y: [-30, 0],
              scale: [0.3, 1]
            }}
            transition={{
              duration: 0.6,
              delay: pin.delay,
              repeat: Infinity,
              repeatDelay: 2.6,
              ease: "easeOut"
            }}
          >
            {/* Pin Shape - Outline */}
            <path
              d={`M${pin.x} ${pin.y - 8} C${pin.x - 3} ${pin.y - 8} ${pin.x - 4} ${pin.y - 5} ${pin.x - 4} ${pin.y - 3} C${pin.x - 4} ${pin.y} ${pin.x} ${pin.y + 4} ${pin.x} ${pin.y + 4} C${pin.x} ${pin.y + 4} ${pin.x + 4} ${pin.y} ${pin.x + 4} ${pin.y - 3} C${pin.x + 4} ${pin.y - 5} ${pin.x + 3} ${pin.y - 8} ${pin.x} ${pin.y - 8}Z`}
              fill="none"
              stroke={getStrokeColor(isDark, 'primary')}
              strokeWidth="1.5"
            />
            
            {/* Pin Center Dot */}
            <circle 
              cx={pin.x} 
              cy={pin.y - 3} 
              r="1.5" 
              fill={getFillColor(isDark)}
            />
          </motion.g>
          
          {/* Impact Ripple when pin lands */}
          <motion.circle
            cx={pin.x}
            cy={pin.y + 4}
            r="3"
            stroke={getStrokeColor(isDark, 'secondary')}
            strokeWidth="1"
            fill="none"
            animate={{
              scale: [0, 2.5, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 0.8,
              delay: pin.delay + 0.6,
              repeat: Infinity,
              repeatDelay: 2.6,
              ease: "easeOut"
            }}
          />
        </motion.g>
      ))}
      
      {/* Pulsing Global Signal Rings */}
      {[...Array(2)].map((_, i) => (
        <motion.circle
          key={i}
          cx="45"
          cy="56"
          r="20"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1.5"
          fill="none"
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{ 
            duration: 3,
            delay: i * 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Orbiting Satellite/Marker */}
      <motion.circle
        cx="65"
        cy="56"
        r="2"
        fill={getStrokeColor(isDark, 'secondary')}
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ originX: "45px", originY: "56px" }}
      />
      
      {/* Compass - Bottom Right */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        {/* Compass Circle */}
        <circle 
          cx="72" 
          cy="70" 
          r="10" 
          fill="none" 
          stroke={getStrokeColor(isDark, 'primary')} 
          strokeWidth="1.5"
        />
        
        {/* Inner compass ring */}
        <circle 
          cx="72" 
          cy="70" 
          r="7" 
          fill="none" 
          stroke={getStrokeColor(isDark, 'secondary')} 
          strokeWidth="0.8"
          strokeDasharray="1 2"
        />
        
        {/* Compass Needle - Rotating */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ originX: "72px", originY: "70px" }}
        >
          {/* North Pointer - Darker tip */}
          <path
            d="M 72 63 L 74 70 L 72 68 L 70 70 Z"
            fill={getFillColor(isDark)}
            stroke={getFillColor(isDark)}
            strokeWidth="0.5"
          />
          
          {/* South Pointer - Lighter */}
          <path
            d="M 72 77 L 74 70 L 72 72 L 70 70 Z"
            fill="none"
            stroke={getStrokeColor(isDark, 'secondary')}
            strokeWidth="0.8"
          />
        </motion.g>
        
        {/* Cardinal Direction Mark - N */}
        <text 
          x="72" 
          y="61" 
          fontSize="5" 
          fontWeight="600" 
          fill={getFillColor(isDark)} 
          textAnchor="middle"
        >
          N
        </text>
      </motion.g>
    </motion.svg>
  );
};
```

---

## Amenities Icon (Step 3)

**Duration**: 3 minutes  
**Animation**: Cycles through 8 amenity types (WiFi, Pool, Gym, Spa, Restaurant, Parking, AC, Laundry)

```typescript
// ============================================
// AMENITIES THAT WILL CYCLE
// ============================================

const AMENITIES = [
  { icon: 'wifi', label: 'WiFi' },
  { icon: 'pool', label: 'Pool' },
  { icon: 'gym', label: 'Gym' },
  { icon: 'spa', label: 'Spa' },
  { icon: 'restaurant', label: 'Restaurant' },
  { icon: 'parking', label: 'Parking' },
  { icon: 'ac', label: 'AC' },
  { icon: 'laundry', label: 'Laundry' }
];

// ============================================
// AMENITIES ICON COMPONENT
// ============================================

export const PremiumAmenitiesIcon = ({ 
  size = 80, 
  isActive = false 
}: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = useDarkMode();

  // Cycle through amenities every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AMENITIES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Render specific amenity icon based on type
  const renderAmenityIcon = (type: string) => {
    const primary = getStrokeColor(isDark, 'primary');
    const secondary = getStrokeColor(isDark, 'secondary');
    const fill = getFillColor(isDark);
    
    switch (type) {
      case 'wifi':
        return (
          <motion.g>
            {/* WiFi signal waves */}
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M${35 - i * 3} ${50 + i * 4} Q40 ${45 + i * 2} ${45 + i * 3} ${50 + i * 4}`}
                stroke={primary}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              />
            ))}
            {/* Center dot */}
            <circle cx="40" cy="56" r="2" fill={fill} />
          </motion.g>
        );
        
      case 'pool':
        return (
          <motion.g>
            {/* Pool outline */}
            <rect 
              x="25" 
              y="48" 
              width="30" 
              height="16" 
              rx="3" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
            {/* Water waves */}
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${28 + i * 8} ${56} Q${30 + i * 8} ${54} ${32 + i * 8} ${56}`}
                stroke={secondary}
                strokeWidth="1.5"
                fill="none"
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
              />
            ))}
          </motion.g>
        );
        
      case 'gym':
        return (
          <motion.g>
            {/* Dumbbell bar */}
            <rect 
              x="30" 
              y="52" 
              width="20" 
              height="3" 
              rx="1.5" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
            {/* Left weight */}
            <circle 
              cx="30" 
              cy="53.5" 
              r="4" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
            {/* Right weight */}
            <circle 
              cx="50" 
              cy="53.5" 
              r="4" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
          </motion.g>
        );
        
      case 'spa':
        return (
          <motion.g>
            {/* Spa bowl */}
            <circle 
              cx="40" 
              cy="52" 
              r="6" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
            {/* Steam rising */}
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${36 + i * 3} ${45} Q${36 + i * 3} ${42} ${36 + i * 3} ${40}`}
                stroke={secondary}
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{ opacity: [0, 0.8, 0], y: [0, -4, -8] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </motion.g>
        );
        
      case 'restaurant':
        return (
          <motion.g>
            {/* Fork */}
            <path 
              d="M35 45 L35 62" 
              stroke={primary} 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
            <path 
              d="M32 45 L32 50" 
              stroke={primary} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
            />
            <path 
              d="M38 45 L38 50" 
              stroke={primary} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
            />
            {/* Spoon */}
            <path 
              d="M42 45 Q42 50 42 55 L42 62" 
              stroke={primary} 
              strokeWidth="2" 
              fill="none" 
            />
            <circle 
              cx="42" 
              cy="52" 
              r="3" 
              fill="none" 
              stroke={primary} 
              strokeWidth="1.5" 
            />
          </motion.g>
        );
        
      case 'parking':
        return (
          <motion.g>
            {/* Parking sign */}
            <rect 
              x="28" 
              y="45" 
              width="24" 
              height="18" 
              rx="2" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
            {/* P letter */}
            <text 
              x="40" 
              y="58" 
              fontSize="12" 
              fontWeight="bold" 
              fill={fill} 
              textAnchor="middle"
            >
              P
            </text>
          </motion.g>
        );
        
      case 'ac':
        return (
          <motion.g>
            {/* AC unit */}
            <rect 
              x="30" 
              y="48" 
              width="20" 
              height="12" 
              rx="2" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
            {/* Cold air lines */}
            {[...Array(3)].map((_, i) => (
              <motion.line
                key={i}
                x1={34 + i * 5}
                y1={62}
                x2={34 + i * 5}
                y2={68}
                stroke={secondary}
                strokeWidth="1.5"
                animate={{ y2: [68, 72, 68] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </motion.g>
        );
        
      case 'laundry':
        return (
          <motion.g>
            {/* Washing machine */}
            <rect 
              x="30" 
              y="46" 
              width="20" 
              height="18" 
              rx="2" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
            {/* Door */}
            <circle 
              cx="40" 
              cy="55" 
              r="5" 
              fill="none" 
              stroke={secondary} 
              strokeWidth="1.5" 
            />
            {/* Rotating drum */}
            <motion.circle
              cx="40"
              cy="55"
              r="3"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.g>
        );
        
      default:
        return null;
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse 
        cx="60" 
        cy="105" 
        rx="30" 
        ry="7" 
        fill={isDark ? "#FFFFFF" : "#000000"} 
        opacity="0.08" 
      />
      
      {/* Amenity changes with animation */}
      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Container circle */}
          <circle 
            cx="40" 
            cy="56" 
            r="22" 
            fill="none" 
            stroke={getStrokeColor(isDark, 'secondary')} 
            strokeWidth="1.5" 
            strokeDasharray="4 4" 
          />
          
          {/* Amenity icon */}
          {renderAmenityIcon(AMENITIES[currentIndex].icon)}
          
          {/* Label */}
          <motion.text
            x="40"
            y="25"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {AMENITIES[currentIndex].label}
          </motion.text>
        </motion.g>
      </AnimatePresence>
      
      {/* Orbiting dots around amenity */}
      {[...Array(3)].map((_, i) => (
        <motion.circle
          key={i}
          cx="40"
          cy="34"
          r="2"
          fill={getStrokeColor(isDark, 'secondary')}
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, delay: i * 0.3, repeat: Infinity }
          }}
          style={{ originX: "40px", originY: "56px" }}
        />
      ))}
    </motion.svg>
  );
};
```

---

## Photos Icon (Step 4)

**Duration**: 4 minutes  
**Animation**: Camera with cycling photo sections (Lobby, Room, Reception, Restaurant, Pool, Exterior)

```typescript
// ============================================
// PHOTO SECTIONS THAT WILL CYCLE
// ============================================

const PHOTO_SECTIONS = [
  { name: 'Lobby', icon: 'lobby' },
  { name: 'Room', icon: 'room' },
  { name: 'Reception', icon: 'reception' },
  { name: 'Restaurant', icon: 'restaurant' },
  { name: 'Pool', icon: 'pool' },
  { name: 'Exterior', icon: 'exterior' }
];

// ============================================
// PHOTOS ICON COMPONENT
// ============================================

export const PremiumPhotosIcon = ({ 
  size = 80, 
  isActive = false 
}: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = useDarkMode();

  // Cycle through photo sections every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PHOTO_SECTIONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Render specific photo section icon
  const renderPhotoSection = (type: string) => {
    const primary = getStrokeColor(isDark, 'primary');
    const secondary = getStrokeColor(isDark, 'secondary');
    
    switch (type) {
      case 'lobby':
        return (
          <motion.g>
            {/* Chandelier */}
            <circle cx="45" cy="50" r="4" fill="none" stroke={primary} strokeWidth="1.5" />
            <line x1="45" y1="46" x2="45" y2="42" stroke={primary} strokeWidth="1.5" />
            {/* Furniture */}
            <rect x="38" y="58" width="6" height="8" rx="1" fill="none" stroke={secondary} strokeWidth="1.5" />
            <rect x="48" y="58" width="6" height="8" rx="1" fill="none" stroke={secondary} strokeWidth="1.5" />
          </motion.g>
        );
        
      case 'room':
        return (
          <motion.g>
            {/* Bed */}
            <rect x="38" y="54" width="16" height="10" rx="1" fill="none" stroke={primary} strokeWidth="2" />
            <rect x="38" y="50" width="16" height="4" rx="1" fill="none" stroke={secondary} strokeWidth="1.5" />
            {/* Pillow */}
            <rect x="40" y="52" width="5" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
          </motion.g>
        );
        
      case 'reception':
        return (
          <motion.g>
            {/* Desk */}
            <rect x="36" y="56" width="18" height="8" rx="1" fill="none" stroke={primary} strokeWidth="2" />
            <line x1="38" y1="56" x2="38" y2="64" stroke={secondary} strokeWidth="1.5" />
            <line x1="52" y1="56" x2="52" y2="64" stroke={secondary} strokeWidth="1.5" />
            {/* Person */}
            <circle cx="46" cy="48" r="3" fill="none" stroke={secondary} strokeWidth="1.5" />
          </motion.g>
        );
        
      case 'restaurant':
        return (
          <motion.g>
            {/* Table */}
            <circle cx="45" cy="58" r="8" fill="none" stroke={primary} strokeWidth="2" />
            {/* Plates */}
            <circle cx="42" cy="56" r="2.5" fill="none" stroke={secondary} strokeWidth="1.5" />
            <circle cx="48" cy="56" r="2.5" fill="none" stroke={secondary} strokeWidth="1.5" />
          </motion.g>
        );
        
      case 'pool':
        return (
          <motion.g>
            {/* Pool */}
            <rect x="36" y="52" width="18" height="12" rx="2" fill="none" stroke={primary} strokeWidth="2" />
            {/* Water waves */}
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${38 + i * 5} ${58} Q${40 + i * 5} ${56} ${42 + i * 5} ${58}`}
                stroke={secondary}
                strokeWidth="1"
                fill="none"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </motion.g>
        );
        
      case 'exterior':
        return (
          <motion.g>
            {/* Building outline */}
            <rect x="38" y="48" width="14" height="16" rx="1" fill="none" stroke={primary} strokeWidth="2" />
            {/* Windows */}
            <rect x="40" y="52" width="3" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
            <rect x="45" y="52" width="3" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
            <rect x="40" y="57" width="3" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
            <rect x="45" y="57" width="3" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
          </motion.g>
        );
        
      default:
        return null;
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse 
        cx="60" 
        cy="105" 
        rx="35" 
        ry="8" 
        fill={isDark ? "#FFFFFF" : "#000000"} 
        opacity="0.08" 
      />
      
      {/* Camera frame - Outline */}
      <rect 
        x="28" 
        y="42" 
        width="34" 
        height="26" 
        rx="3" 
        fill="none" 
        stroke={getStrokeColor(isDark, 'primary')} 
        strokeWidth="2" 
      />
      
      {/* Lens */}
      <circle 
        cx="45" 
        cy="55" 
        r="8" 
        fill="none" 
        stroke={getStrokeColor(isDark, 'secondary')} 
        strokeWidth="2" 
      />
      
      {/* Flash */}
      <motion.rect 
        x="54" 
        y="46" 
        width="5" 
        height="3" 
        rx="1" 
        fill={getStrokeColor(isDark, 'secondary')}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Photo content cycling inside lens */}
      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          {renderPhotoSection(PHOTO_SECTIONS[currentIndex].icon)}
        </motion.g>
      </AnimatePresence>
      
      {/* Section Label */}
      <motion.text
        key={`label-${currentIndex}`}
        x="45"
        y="25"
        fontSize="11"
        fontWeight="600"
        fill={getFillColor(isDark)}
        textAnchor="middle"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {PHOTO_SECTIONS[currentIndex].name}
      </motion.text>
      
      {/* Flash effect */}
      <motion.circle
        cx="45"
        cy="35"
        r="15"
        fill={getStrokeColor(isDark, 'secondary')}
        animate={{
          scale: [0, 2, 0],
          opacity: [0, 0.3, 0]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 2
        }}
      />
    </motion.svg>
  );
};
```

---

## Pricing Icon (Step 5)

**Duration**: 2 minutes  
**Animation**: Cycles through pricing concepts (Bills, Savings, Discount, Value)

```typescript
// ============================================
// PRICING CONCEPTS THAT WILL CYCLE
// ============================================

const PRICING_CONCEPTS = [
  { type: 'bills', label: 'Best Price' },
  { type: 'save', label: 'You Save' },
  { type: 'discount', label: 'Discount' },
  { type: 'coins', label: 'Value' }
];

// ============================================
// PRICING ICON COMPONENT
// ============================================

export const PremiumPricingIcon = ({ 
  size = 80, 
  isActive = false 
}: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = useDarkMode();

  // Cycle through pricing concepts every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PRICING_CONCEPTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Render specific pricing concept
  const renderPricingConcept = (type: string) => {
    const primary = getStrokeColor(isDark, 'primary');
    const secondary = getStrokeColor(isDark, 'secondary');
    const fill = getFillColor(isDark);
    
    switch (type) {
      case 'bills':
        return (
          <motion.g>
            {/* Stack of bills */}
            {[...Array(3)].map((_, i) => (
              <motion.g
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ 
                  y: [20, 0, -5],
                  opacity: [0, 1, 1],
                  rotate: [-5 + i * 3, 0 + i * 2, 2 + i * 2]
                }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.2
                }}
              >
                {/* Bill outline */}
                <rect 
                  x={34 + i * 4} 
                  y={50 + i * 3} 
                  width="18" 
                  height="12" 
                  rx="1" 
                  fill="none" 
                  stroke={primary} 
                  strokeWidth="2"
                />
                {/* Dollar sign */}
                <text 
                  x={43 + i * 4} 
                  y={58 + i * 3} 
                  fontSize="8" 
                  fontWeight="bold" 
                  fill={secondary} 
                  textAnchor="middle"
                >
                  $
                </text>
              </motion.g>
            ))}
          </motion.g>
        );
        
      case 'save':
        return (
          <motion.g>
            {/* Piggy bank outline */}
            <ellipse 
              cx="45" 
              cy="56" 
              rx="10" 
              ry="8" 
              fill="none" 
              stroke={primary} 
              strokeWidth="2" 
            />
            {/* Eye */}
            <circle cx="52" cy="54" r="1.5" fill={fill} />
            {/* Tail */}
            <path 
              d="M55 56 Q58 56 58 58" 
              stroke={primary} 
              strokeWidth="1.5" 
              fill="none" 
            />
            {/* Coin dropping into piggy bank */}
            <motion.g
              animate={{
                y: [0, 15, 15],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeIn"
              }}
            >
              <circle 
                cx="45" 
                cy="45" 
                r="3" 
                fill="none" 
                stroke={secondary} 
                strokeWidth="2" 
              />
              <text 
                x="45" 
                y="47" 
                fontSize="5" 
                fontWeight="bold" 
                fill={secondary} 
                textAnchor="middle"
              >
                $
              </text>
            </motion.g>
          </motion.g>
        );
        
      case 'discount':
        return (
          <motion.g>
            {/* Price tag shape outline */}
            <path
              d="M38 48 L52 48 L56 56 L52 64 L38 64 C36 64 35 63 35 61 L35 51 C35 49 36 48 38 48Z"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            {/* Hole in tag */}
            <circle 
              cx="40" 
              cy="54" 
              r="2" 
              fill="none" 
              stroke={secondary} 
              strokeWidth="1.5" 
            />
            {/* Percentage symbol */}
            <motion.text
              x="47"
              y="58"
              fontSize="10"
              fontWeight="bold"
              fill={secondary}
              textAnchor="middle"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              %
            </motion.text>
          </motion.g>
        );
        
      case 'coins':
        return (
          <motion.g>
            {/* Stack of coins bouncing */}
            {[...Array(4)].map((_, i) => (
              <motion.g
                key={i}
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Coin outer circle */}
                <circle 
                  cx={38 + i * 6} 
                  cy={56} 
                  r="4" 
                  fill="none" 
                  stroke={primary} 
                  strokeWidth="2"
                />
                {/* Coin inner circle */}
                <circle 
                  cx={38 + i * 6} 
                  cy={56} 
                  r="2" 
                  fill="none" 
                  stroke={secondary} 
                  strokeWidth="1"
                />
              </motion.g>
            ))}
          </motion.g>
        );
        
      default:
        return null;
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse 
        cx="60" 
        cy="105" 
        rx="30" 
        ry="7" 
        fill={isDark ? "#FFFFFF" : "#000000"} 
        opacity="0.08" 
      />
      
      {/* Pricing concept changes */}
      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 15 }}
          transition={{ duration: 0.5 }}
        >
          {renderPricingConcept(PRICING_CONCEPTS[currentIndex].type)}
          
          {/* Label */}
          <motion.text
            x="45"
            y="25"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {PRICING_CONCEPTS[currentIndex].label}
          </motion.text>
        </motion.g>
      </AnimatePresence>
      
      {/* Dollar sign particles floating */}
      {[...Array(4)].map((_, i) => (
        <motion.text
          key={i}
          x={35 + (i % 2) * 20}
          y={35 + Math.floor(i / 2) * 15}
          fontSize="8"
          fontWeight="bold"
          fill={getStrokeColor(isDark, 'secondary')}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -10, -20],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity
          }}
        >
          $
        </motion.text>
      ))}
    </motion.svg>
  );
};
```

---

## Premium Property Vectors

These are the large 140px icons shown in the hero section. They're more detailed 3D-style illustrations.

**File Location**: `/components/icons/hotel-listing/PremiumPropertyVectors.tsx`

### Hotel Vector (Example)

```typescript
import { motion } from 'motion/react';

interface PremiumPropertyVectorProps {
  propertyType: 'hotel' | 'boutique' | 'resort' | 'motel' | 'lodge' | 'inn' | 'guesthouse' | 'hostel' | '';
  size?: number;
}

export function PremiumPropertyVector({ 
  propertyType, 
  size = 120 
}: PremiumPropertyVectorProps) {
  
  // Default: Hotel Icon
  if (!propertyType || propertyType === 'hotel') {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}
      >
        <defs>
          {/* Main Building Gradient - Purple */}
          <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9D4EDD" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          
          {/* Roof Gradient - Cyan */}
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          
          {/* Window Glow - Amber */}
          <radialGradient id="windowGlow">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
          
          {/* Shadow Filter */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow base */}
        <motion.ellipse
          cx="60"
          cy="105"
          rx="35"
          ry="4"
          fill="#000000"
          opacity="0.15"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        />

        {/* Main Building - Purple gradient */}
        <motion.rect
          x="30"
          y="35"
          width="60"
          height="65"
          fill="url(#buildingGrad)"
          rx="4"
          filter="url(#shadow)"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        
        {/* Building Left Side (3D effect) */}
        <motion.path
          d="M 30 35 L 25 40 L 25 105 L 30 100 Z"
          fill="#7C3AED"
          opacity="0.6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />

        {/* Roof - Cyan gradient */}
        <motion.path
          d="M 20 35 L 60 15 L 100 35 L 90 35 L 60 20 L 30 35 Z"
          fill="url(#roofGrad)"
          filter="url(#shadow)"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
        />

        {/* Windows Grid - 4 columns x 5 rows = 20 windows */}
        {[...Array(20)].map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const isLit = i % 3 !== 0; // Some windows lit, some dark
          
          return (
            <motion.rect
              key={i}
              x={38 + col * 12}
              y={42 + row * 11}
              width="8"
              height="8"
              fill={isLit ? "url(#windowGlow)" : "#4C1D95"}
              rx="1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: isLit ? [0.8, 1, 0.8] : 1
              }}
              transition={{
                scale: { delay: 0.5 + i * 0.03, duration: 0.3 },
                opacity: isLit ? { 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.1 
                } : {}
              }}
            />
          );
        })}

        {/* Main Entrance */}
        <motion.rect
          x="48"
          y="85"
          width="24"
          height="15"
          fill="#1F2937"
          rx="2"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        />
        
        {/* Door panels */}
        <motion.rect
          x="52"
          y="88"
          width="7"
          height="12"
          fill="#374151"
          rx="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        />
        <motion.rect
          x="61"
          y="88"
          width="7"
          height="12"
          fill="#374151"
          rx="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        />
        
        {/* Door handles */}
        <motion.circle cx="58" cy="94" r="1" fill="#FCD34D" />
        <motion.circle cx="62" cy="94" r="1" fill="#FCD34D" />

        {/* Hotel Sign */}
        <motion.rect
          x="42"
          y="22"
          width="36"
          height="10"
          fill="#1F2937"
          rx="2"
          filter="url(#shadow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.4, type: 'spring' }}
        />
        <motion.text
          x="60"
          y="29"
          textAnchor="middle"
          fontSize="7"
          fontWeight="bold"
          fill="url(#windowGlow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ 
            opacity: { duration: 2, repeat: Infinity },
            delay: 1.2 
          }}
        >
          HOTEL
        </motion.text>

        {/* Star decorations */}
        {[...Array(3)].map((_, i) => (
          <motion.circle
            key={i}
            cx={48 + i * 12}
            cy={12}
            r="1.5"
            fill="#FCD34D"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1], 
              opacity: [0, 1, 0.8],
              rotate: 360 
            }}
            transition={{ 
              delay: 1.3 + i * 0.1, 
              duration: 0.6,
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' }
            }}
          />
        ))}
      </motion.svg>
    );
  }

  // ... Other property types (resort, boutique, motel, etc.) follow similar pattern
}
```

---

## Flutter Conversion Guide

### Key Animation Concepts

1. **AnimatePresence with mode="wait"**
   ```dart
   AnimatedSwitcher(
     duration: Duration(milliseconds: 500),
     transitionBuilder: (child, animation) {
       return FadeTransition(
         opacity: animation,
         child: ScaleTransition(
           scale: animation,
           child: child,
         ),
       );
     },
     child: IconWidget(key: ValueKey(currentIndex)),
   )
   ```

2. **Cycling Content**
   ```dart
   Timer.periodic(Duration(seconds: 3), (timer) {
     setState(() {
       currentIndex = (currentIndex + 1) % items.length;
     });
   });
   ```

3. **Dark Mode Detection**
   ```dart
   final isDark = Theme.of(context).brightness == Brightness.dark;
   ```

4. **SVG Rendering**
   ```dart
   // Use flutter_svg package
   import 'package:flutter_svg/flutter_svg.dart';
   
   // Or use CustomPaint for animations
   CustomPaint(
     painter: AnimatedIconPainter(
       progress: animation.value,
       isDark: isDark,
     ),
   )
   ```

---

## Summary

This file contains:
- ✅ All 5 step icons with complete animation code
- ✅ Dark mode adaptive colors
- ✅ Cycling content animations
- ✅ Property vector example
- ✅ Flutter conversion patterns
- ✅ 1000+ lines of production-ready SVG code

Total icon count: **5 step icons + 8 property types = 13 animated icons**

---

*Complete Code Reference - Ready for Flutter Conversion*
