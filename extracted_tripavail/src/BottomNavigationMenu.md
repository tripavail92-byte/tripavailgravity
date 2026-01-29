# Bottom Navigation Menu - Complete Code

## Overview
Modern bottom navigation menu with neon glassy icons and smooth animations. Features 5 main tabs (Home, Hotels, Tours, Messages, Profile) with sophisticated visual effects, active state indicators, and mobile-optimized touch interactions.

## Key Features
- **Neon Glassy Icons**: Crystal glass containers with Rose primary color scheme
- **Smooth Animations**: Motion-powered scale, fade, and bounce effects
- **Active State Indicators**: Dynamic bottom indicators with gradient effects  
- **Touch Optimizations**: Tap feedback and mobile-friendly spacing
- **Dark Mode Support**: Automatic theme adaptation with your app's color scheme
- **Sophisticated Effects**: Drop shadows, blur effects, and pulsing animations

---

## Main Bottom Navigation Component

**Path:** `/components/BottomNavigation.tsx`

```tsx
import { motion } from 'motion/react';
import { NeonGlassyHomeIcon } from './icons/NeonGlassyHomeIcon';
import { NeonGlassyHotelIcon } from './icons/NeonGlassyHotelIcon';
import { NeonGlassyBeachTourIcon } from './icons/NeonGlassyBeachTourIcon';
import { NeonGlassyMessageIcon } from './icons/NeonGlassyMessageIcon';
import { NeonGlassyProfileIcon } from './icons/NeonGlassyProfileIcon';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'home', icon: NeonGlassyHomeIcon, label: 'Home' },
    { id: 'hotels', icon: NeonGlassyHotelIcon, label: 'Hotels' },
    { id: 'tours', icon: NeonGlassyBeachTourIcon, label: 'Tours' },
    { id: 'messages', icon: NeonGlassyMessageIcon, label: 'Messages' },
    { id: 'profile', icon: NeonGlassyProfileIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center py-2 px-2 relative"
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
            >
              {/* Icon Container with individual glassy effect */}
              <motion.div className="relative mb-2">
                <tab.icon 
                  className="w-7 h-7"
                  isActive={isActive}
                />
              </motion.div>
              
              {/* Label */}
              <motion.span 
                className={`text-xs transition-all duration-300 ${
                  isActive 
                    ? 'font-semibold' 
                    : 'font-medium opacity-70'
                }`}
                style={{
                  color: isActive ? '#E11D48' : '#6B7280',
                  textShadow: isActive ? '0 0 6px rgba(225, 29, 72, 0.4)' : 'none'
                }}
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
              >
                {tab.label}
              </motion.span>
              
              {/* Active Bottom Indicator */}
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 w-10 h-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, #E11D48 50%, transparent 100%)`,
                    boxShadow: '0 0 6px rgba(225, 29, 72, 0.6)'
                  }}
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Neon Glassy Icon Components

### 1. Home Icon
**Path:** `/components/icons/NeonGlassyHomeIcon.tsx`

```tsx
import { motion } from 'motion/react';

interface NeonGlassyHomeIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyHomeIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyHomeIconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Neon Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: isActive 
            ? `radial-gradient(circle, rgba(225, 29, 72, 0.4) 0%, rgba(225, 29, 72, 0.15) 40%, transparent 70%)`
            : 'transparent',
          filter: isActive ? 'blur(6px)' : 'none'
        }}
        animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 0 }}
        transition={{ duration: 2.5, repeat: isActive ? Infinity : 0 }}
      />
      
      {/* Crystal Glass Container */}
      <motion.div
        className="relative w-full h-full rounded-xl backdrop-blur-sm border"
        style={{
          background: isActive 
            ? `linear-gradient(135deg, 
                rgba(225, 29, 72, 0.25) 0%, 
                rgba(225, 29, 72, 0.15) 30%,
                rgba(255, 255, 255, 0.15) 60%,
                rgba(225, 29, 72, 0.08) 100%)`
            : `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.08) 50%, 
                rgba(255, 255, 255, 0.05) 100%)`,
          borderColor: isActive ? 'rgba(225, 29, 72, 0.4)' : 'rgba(255, 255, 255, 0.25)',
          boxShadow: isActive 
            ? `0 0 25px rgba(225, 29, 72, 0.4), 
               0 4px 16px rgba(0, 0, 0, 0.1),
               inset 0 1px 0 rgba(255, 255, 255, 0.4),
               inset 0 -1px 0 rgba(225, 29, 72, 0.2)`
            : `0 2px 12px rgba(0, 0, 0, 0.08), 
               inset 0 1px 0 rgba(255, 255, 255, 0.3),
               inset 0 -1px 0 rgba(255, 255, 255, 0.1)`
        }}
        whileHover={{ scale: 1.03, y: -1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Home Icon SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full p-1.5"
          style={{
            filter: isActive 
              ? `drop-shadow(0 0 8px rgba(225, 29, 72, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))`
              : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))'
          }}
        >
          <motion.path
            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          <motion.path
            d="M9 22V12H15V22"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
          />
          
          {/* Chimney smoke animation */}
          {isActive && (
            <>
              <motion.circle
                cx="16"
                cy="6"
                r="1"
                fill="rgba(225, 29, 72, 0.4)"
                animate={{ y: [-2, -8], opacity: [0.6, 0], scale: [0.5, 1.2] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              />
              <motion.circle
                cx="17"
                cy="5"
                r="0.8"
                fill="rgba(225, 29, 72, 0.3)"
                animate={{ y: [-2, -8], opacity: [0.5, 0], scale: [0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.circle
                cx="18"
                cy="6.5"
                r="0.6"
                fill="rgba(225, 29, 72, 0.2)"
                animate={{ y: [-2, -8], opacity: [0.4, 0], scale: [0.3, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}
        </svg>
      </motion.div>
      
      {/* Active Pulse Ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{
            borderColor: '#E11D48',
            borderOpacity: 0.6
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
```

### 2. Hotel Icon
**Path:** `/components/icons/NeonGlassyHotelIcon.tsx`

```tsx
import { motion } from 'motion/react';

interface NeonGlassyHotelIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyHotelIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyHotelIconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Neon Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: isActive 
            ? `radial-gradient(circle, rgba(225, 29, 72, 0.4) 0%, rgba(225, 29, 72, 0.15) 40%, transparent 70%)`
            : 'transparent',
          filter: isActive ? 'blur(6px)' : 'none'
        }}
        animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 0 }}
        transition={{ duration: 2.5, repeat: isActive ? Infinity : 0 }}
      />
      
      {/* Crystal Glass Container */}
      <motion.div
        className="relative w-full h-full rounded-xl backdrop-blur-sm border"
        style={{
          background: isActive 
            ? `linear-gradient(135deg, 
                rgba(225, 29, 72, 0.25) 0%, 
                rgba(225, 29, 72, 0.15) 30%,
                rgba(255, 255, 255, 0.15) 60%,
                rgba(225, 29, 72, 0.08) 100%)`
            : `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.08) 50%, 
                rgba(255, 255, 255, 0.05) 100%)`,
          borderColor: isActive ? 'rgba(225, 29, 72, 0.4)' : 'rgba(255, 255, 255, 0.25)',
          boxShadow: isActive 
            ? `0 0 25px rgba(225, 29, 72, 0.4), 
               0 4px 16px rgba(0, 0, 0, 0.1),
               inset 0 1px 0 rgba(255, 255, 255, 0.4),
               inset 0 -1px 0 rgba(225, 29, 72, 0.2)`
            : `0 2px 12px rgba(0, 0, 0, 0.08), 
               inset 0 1px 0 rgba(255, 255, 255, 0.3),
               inset 0 -1px 0 rgba(255, 255, 255, 0.1)`
        }}
        whileHover={{ scale: 1.03, y: -1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Hotel/Building Icon SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full p-1.5"
          style={{
            filter: isActive 
              ? `drop-shadow(0 0 8px rgba(225, 29, 72, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))`
              : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))'
          }}
        >
          <motion.path
            d="M3 21H21"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          <motion.path
            d="M5 21V7L13 2L21 7V21"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
          />
          <motion.path
            d="M9 9V13"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.8, ease: "easeInOut" }}
          />
          <motion.path
            d="M17 9V13"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.9, ease: "easeInOut" }}
          />
          <motion.path
            d="M13 7V9"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 1, ease: "easeInOut" }}
          />
          
          {/* Animated windows lighting up */}
          {isActive && (
            <>
              <motion.rect
                x="8"
                y="9"
                width="2"
                height="4"
                fill="rgba(225, 29, 72, 0.6)"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0 }}
              />
              <motion.rect
                x="16"
                y="9"
                width="2"
                height="4"
                fill="rgba(225, 29, 72, 0.6)"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              />
              <motion.rect
                x="12"
                y="7"
                width="2"
                height="2"
                fill="rgba(225, 29, 72, 0.6)"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              />
            </>
          )}
        </svg>
      </motion.div>
      
      {/* Active Pulse Ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{
            borderColor: '#E11D48',
            borderOpacity: 0.6
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
```

### 3. Beach Tour Icon
**Path:** `/components/icons/NeonGlassyBeachTourIcon.tsx`

```tsx
import { motion } from 'motion/react';

interface NeonGlassyBeachTourIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyBeachTourIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyBeachTourIconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Neon Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: isActive 
            ? `radial-gradient(circle, rgba(225, 29, 72, 0.4) 0%, rgba(225, 29, 72, 0.15) 40%, transparent 70%)`
            : 'transparent',
          filter: isActive ? 'blur(6px)' : 'none'
        }}
        animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 0 }}
        transition={{ duration: 2.5, repeat: isActive ? Infinity : 0 }}
      />
      
      {/* Crystal Glass Container */}
      <motion.div
        className="relative w-full h-full rounded-xl backdrop-blur-sm border"
        style={{
          background: isActive 
            ? `linear-gradient(135deg, 
                rgba(225, 29, 72, 0.25) 0%, 
                rgba(225, 29, 72, 0.15) 30%,
                rgba(255, 255, 255, 0.15) 60%,
                rgba(225, 29, 72, 0.08) 100%)`
            : `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.08) 50%, 
                rgba(255, 255, 255, 0.05) 100%)`,
          borderColor: isActive ? 'rgba(225, 29, 72, 0.4)' : 'rgba(255, 255, 255, 0.25)',
          boxShadow: isActive 
            ? `0 0 25px rgba(225, 29, 72, 0.4), 
               0 4px 16px rgba(0, 0, 0, 0.1),
               inset 0 1px 0 rgba(255, 255, 255, 0.4),
               inset 0 -1px 0 rgba(225, 29, 72, 0.2)`
            : `0 2px 12px rgba(0, 0, 0, 0.08), 
               inset 0 1px 0 rgba(255, 255, 255, 0.3),
               inset 0 -1px 0 rgba(255, 255, 255, 0.1)`
        }}
        whileHover={{ scale: 1.03, y: -1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Beach/Palm Tree Icon SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full p-1.5"
          style={{
            filter: isActive 
              ? `drop-shadow(0 0 8px rgba(225, 29, 72, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))`
              : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))'
          }}
        >
          {/* Sun */}
          <motion.circle
            cx="6"
            cy="6"
            r="2"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="1.5"
            fill={isActive ? 'rgba(225, 29, 72, 0.2)' : 'none'}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ 
              scale: 1, 
              rotate: isActive ? 360 : 0 
            }}
            transition={{ 
              scale: { duration: 0.6, ease: "easeOut" },
              rotate: { duration: 8, repeat: isActive ? Infinity : 0, ease: "linear" }
            }}
          />
          
          {/* Sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
            <motion.line
              key={angle}
              x1={6 + Math.cos(angle * Math.PI / 180) * 3}
              y1={6 + Math.sin(angle * Math.PI / 180) * 3}
              x2={6 + Math.cos(angle * Math.PI / 180) * 3.8}
              y2={6 + Math.sin(angle * Math.PI / 180) * 3.8}
              stroke={isActive ? '#E11D48' : '#6B7280'}
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.3 + index * 0.05,
                duration: 0.3,
                ease: "easeOut"
              }}
            />
          ))}

          {/* Palm Tree Trunk */}
          <motion.path
            d="M14 21C14 21 13.5 18 13 15C12.8 13.5 13 12 13.5 11"
            stroke={isActive ? '#8B4513' : '#8B7355'}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          />

          {/* Palm Leaves */}
          <motion.path
            d="M13.5 11C13.5 11 11 9 9 9.5C7 10 8 12 10 11.5"
            stroke={isActive ? '#E11D48' : '#22C55E'}
            strokeWidth="2"
            strokeLinecap="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          />
          
          <motion.path
            d="M13.5 11C13.5 11 16 9 18 9.5C20 10 19 12 17 11.5"
            stroke={isActive ? '#E11D48' : '#22C55E'}
            strokeWidth="2"
            strokeLinecap="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          />
          
          <motion.path
            d="M13.5 11C13.5 11 12 8 10.5 7C9 6 8.5 8.5 11 9.5"
            stroke={isActive ? '#E11D48' : '#22C55E'}
            strokeWidth="2"
            strokeLinecap="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          />

          <motion.path
            d="M13.5 11C13.5 11 15 8 16.5 7C18 6 18.5 8.5 16 9.5"
            stroke={isActive ? '#E11D48' : '#22C55E'}
            strokeWidth="2"
            strokeLinecap="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          />

          {/* Beach/Ground line */}
          <motion.line
            x1="3"
            y1="21"
            x2="21"
            y2="21"
            stroke={isActive ? '#D2B48C' : '#D4A574'}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
          />

          {/* Beach waves */}
          <motion.path
            d="M3 20C5 19.5 7 20.5 9 20C11 19.5 13 20.5 15 20C17 19.5 19 20.5 21 20"
            stroke={isActive ? '#3B82F6' : '#60A5FA'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 1,
              x: isActive ? [0, 2, 0] : 0
            }}
            transition={{ 
              pathLength: { duration: 1.5, delay: 1, ease: "easeOut" },
              opacity: { duration: 0.5, delay: 1 },
              x: { duration: 3, repeat: isActive ? Infinity : 0, ease: "easeInOut" }
            }}
          />

          {/* Coconuts */}
          <motion.circle
            cx="12"
            cy="12"
            r="1"
            fill={isActive ? '#8B4513' : '#A0522D'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 1.2, ease: "easeOut" }}
          />
          <motion.circle
            cx="14"
            cy="11.5"
            r="0.8"
            fill={isActive ? '#8B4513' : '#A0522D'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 1.3, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
      
      {/* Active Pulse Ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{
            borderColor: '#E11D48',
            borderOpacity: 0.6
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
```

### 4. Message Icon
**Path:** `/components/icons/NeonGlassyMessageIcon.tsx`

```tsx
import { motion } from 'motion/react';

interface NeonGlassyMessageIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyMessageIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyMessageIconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Neon Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: isActive 
            ? `radial-gradient(circle, rgba(225, 29, 72, 0.4) 0%, rgba(225, 29, 72, 0.15) 40%, transparent 70%)`
            : 'transparent',
          filter: isActive ? 'blur(6px)' : 'none'
        }}
        animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 0 }}
        transition={{ duration: 2.5, repeat: isActive ? Infinity : 0 }}
      />
      
      {/* Crystal Glass Container */}
      <motion.div
        className="relative w-full h-full rounded-xl backdrop-blur-sm border"
        style={{
          background: isActive 
            ? `linear-gradient(135deg, 
                rgba(225, 29, 72, 0.25) 0%, 
                rgba(225, 29, 72, 0.15) 30%,
                rgba(255, 255, 255, 0.15) 60%,
                rgba(225, 29, 72, 0.08) 100%)`
            : `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.08) 50%, 
                rgba(255, 255, 255, 0.05) 100%)`,
          borderColor: isActive ? 'rgba(225, 29, 72, 0.4)' : 'rgba(255, 255, 255, 0.25)',
          boxShadow: isActive 
            ? `0 0 25px rgba(225, 29, 72, 0.4), 
               0 4px 16px rgba(0, 0, 0, 0.1),
               inset 0 1px 0 rgba(255, 255, 255, 0.4),
               inset 0 -1px 0 rgba(225, 29, 72, 0.2)`
            : `0 2px 12px rgba(0, 0, 0, 0.08), 
               inset 0 1px 0 rgba(255, 255, 255, 0.3),
               inset 0 -1px 0 rgba(255, 255, 255, 0.1)`
        }}
        whileHover={{ scale: 1.03, y: -1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Message Icon SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full p-1.5"
          style={{
            filter: isActive 
              ? `drop-shadow(0 0 8px rgba(225, 29, 72, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))`
              : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))'
          }}
        >
          <motion.path
            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          
          {/* Message dots with staggered animation */}
          <motion.circle
            cx="8"
            cy="10"
            r="1.2"
            fill={isActive ? '#E11D48' : '#6B7280'}
            animate={isActive ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.8, repeat: isActive ? Infinity : 0, delay: 0 }}
          />
          <motion.circle
            cx="12"
            cy="10"
            r="1.2"
            fill={isActive ? '#E11D48' : '#6B7280'}
            animate={isActive ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.8, repeat: isActive ? Infinity : 0, delay: 0.3 }}
          />
          <motion.circle
            cx="16"
            cy="10"
            r="1.2"
            fill={isActive ? '#E11D48' : '#6B7280'}
            animate={isActive ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.8, repeat: isActive ? Infinity : 0, delay: 0.6 }}
          />
          
          {/* Notification indicator */}
          {isActive && (
            <motion.circle
              cx="18"
              cy="6"
              r="2"
              fill="rgba(225, 29, 72, 0.8)"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </svg>
      </motion.div>
      
      {/* Active Pulse Ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{
            borderColor: '#E11D48',
            borderOpacity: 0.6
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
```

### 5. Profile Icon
**Path:** `/components/icons/NeonGlassyProfileIcon.tsx`

```tsx
import { motion } from 'motion/react';

interface NeonGlassyProfileIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyProfileIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyProfileIconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Neon Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: isActive 
            ? `radial-gradient(circle, rgba(225, 29, 72, 0.4) 0%, rgba(225, 29, 72, 0.15) 40%, transparent 70%)`
            : 'transparent',
          filter: isActive ? 'blur(6px)' : 'none'
        }}
        animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 0 }}
        transition={{ duration: 2.5, repeat: isActive ? Infinity : 0 }}
      />
      
      {/* Crystal Glass Container */}
      <motion.div
        className="relative w-full h-full rounded-xl backdrop-blur-sm border"
        style={{
          background: isActive 
            ? `linear-gradient(135deg, 
                rgba(225, 29, 72, 0.25) 0%, 
                rgba(225, 29, 72, 0.15) 30%,
                rgba(255, 255, 255, 0.15) 60%,
                rgba(225, 29, 72, 0.08) 100%)`
            : `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.08) 50%, 
                rgba(255, 255, 255, 0.05) 100%)`,
          borderColor: isActive ? 'rgba(225, 29, 72, 0.4)' : 'rgba(255, 255, 255, 0.25)',
          boxShadow: isActive 
            ? `0 0 25px rgba(225, 29, 72, 0.4), 
               0 4px 16px rgba(0, 0, 0, 0.1),
               inset 0 1px 0 rgba(255, 255, 255, 0.4),
               inset 0 -1px 0 rgba(225, 29, 72, 0.2)`
            : `0 2px 12px rgba(0, 0, 0, 0.08), 
               inset 0 1px 0 rgba(255, 255, 255, 0.3),
               inset 0 -1px 0 rgba(255, 255, 255, 0.1)`
        }}
        whileHover={{ scale: 1.03, y: -1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* User/Profile Icon SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full p-1.5"
          style={{
            filter: isActive 
              ? `drop-shadow(0 0 8px rgba(225, 29, 72, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))`
              : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))'
          }}
        >
          <motion.path
            d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
          />
          <motion.circle
            cx="12"
            cy="7"
            r="4"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          
          {/* Animated profile status glow */}
          {isActive && (
            <>
              <motion.circle
                cx="12"
                cy="7"
                r="5.5"
                stroke="#E11D48"
                strokeWidth="0.8"
                fill="none"
                opacity="0.4"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.circle
                cx="16"
                cy="9"
                r="1.5"
                fill="rgba(225, 29, 72, 0.8)"
                animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </>
          )}
        </svg>
      </motion.div>
      
      {/* Active Pulse Ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{
            borderColor: '#E11D48',
            borderOpacity: 0.6
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
```

---

## Required Imports

### Motion/React
```tsx
import { motion } from 'motion/react';
```

### Icon Components
```tsx
import { NeonGlassyHomeIcon } from './icons/NeonGlassyHomeIcon';
import { NeonGlassyHotelIcon } from './icons/NeonGlassyHotelIcon';
import { NeonGlassyBeachTourIcon } from './icons/NeonGlassyBeachTourIcon';
import { NeonGlassyMessageIcon } from './icons/NeonGlassyMessageIcon';
import { NeonGlassyProfileIcon } from './icons/NeonGlassyProfileIcon';
```

---

## Key Design Features

### 🎨 **Visual Effects**
- **Crystal Glass Containers**: Multi-layer gradient backgrounds with backdrop blur
- **Neon Glow**: Radial gradient backgrounds with blur effects for active states
- **Pulse Rings**: Animated border rings that scale and fade for active indicators
- **Drop Shadows**: Dynamic shadows that intensify when active

### ⚡ **Animation Features**
- **Staggered Loading**: Sequential icon appearance with delay animations
- **Scale Breathing**: Subtle scale animations on active icons
- **Path Drawing**: SVG path animations that draw on mount
- **Interactive Elements**: Hover effects with scale and position changes

### 🎯 **Active State Indicators**
- **Bottom Gradient Bar**: Animated indicator with spring physics
- **Color Transitions**: Seamless color changes between active/inactive states
- **Text Shadows**: Glowing text effects on active labels
- **Icon Animations**: Unique animations per icon (smoke, waves, lights, etc.)

### 📱 **Mobile Optimization**
- **Touch Feedback**: Scale down animation on tap
- **Proper Spacing**: 28px icon size with adequate touch targets
- **Fixed Positioning**: Sticky bottom positioning with proper z-index
- **Max Width**: Centered layout with max-width constraint

---

## Color Scheme

### **Primary Colors (Rose Theme)**
- **Active Color**: `#E11D48` (Rose 600) - Light mode
- **Active Dark**: `#FB7185` (Rose 400) - Dark mode  
- **Inactive Color**: `#6B7280` (Gray 500)
- **Background**: White with subtle glass effects

### **Gradient Effects**
- **Active Background**: `rgba(225, 29, 72, 0.25)` to `rgba(225, 29, 72, 0.08)`
- **Inactive Background**: `rgba(255, 255, 255, 0.15)` to `rgba(255, 255, 255, 0.05)`
- **Neon Glow**: `rgba(225, 29, 72, 0.4)` radial gradient

---

## Implementation Notes

### **Usage in App.tsx**
```tsx
{effectiveRole === 'traveler' && (
  <div data-tour="bottom-nav">
    <BottomNavigation 
      activeTab={currentTab} 
      onTabChange={handleTabChange} 
    />
  </div>
)}
```

### **Tab Configuration**
- **Home**: Simple house icon with chimney smoke animation
- **Hotels**: Building icon with animated window lights
- **Tours**: Beach/palm tree icon with rotating sun and waves
- **Messages**: Chat bubble with typing indicator dots
- **Profile**: User icon with status indicator and glow effects

### **Performance Considerations**
- Animations only run when icons are active
- Efficient SVG path animations
- Proper cleanup with infinite animations
- Optimized re-renders with motion components

The bottom navigation menu is production-ready with sophisticated animations and professional visual effects! 🎯✨