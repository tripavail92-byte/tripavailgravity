# List Your Hotel - Step Flow Screen - Complete Code

## Overview
This is the step-by-step flow screen that users see when they click "List Your Hotel". It displays 4 main steps with animated SVG icons, durations, and descriptions.

---

## Screen Preview

**Layout:**
- Back to Dashboard button (top left)
- Hotel icon (center, animated)
- Title: "List Your Hotel"
- Subtitle: "Complete each step at your own pace"
- 4 Step cards (each with icon, title, description, duration)
- Bottom CTA button with gradient
- Helper text with time estimate

---

## Complete Screen Code

### Main Component

```typescript
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock, ArrowLeft } from 'lucide-react';

export default function ListYourHotelStepFlow() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Step data with icons
  const steps = [
    {
      id: 1,
      title: 'Property Type',
      description: 'Select your property category',
      duration: '1 min',
      icon: PropertyTypeStepIcon,
    },
    {
      id: 2,
      title: 'Location',
      description: 'Pin your exact location',
      duration: '2 min',
      icon: LocationStepIcon,
    },
    {
      id: 3,
      title: 'Amenities',
      description: 'Highlight your facilities',
      duration: '3 min',
      icon: AmenitiesStepIcon,
    },
    {
      id: 4,
      title: 'Photos',
      description: 'Showcase your spaces',
      duration: '4 min',
      icon: PhotosStepIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col pb-8">
      
      {/* ==================== BACK BUTTON ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-6 pb-2"
      >
        <motion.button
          onClick={() => console.log('Back to Dashboard')}
          className="flex items-center gap-2 text-gray-900 dark:text-white hover:opacity-70"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-base">Back to Dashboard</span>
        </motion.button>
      </motion.div>

      {/* ==================== HERO SECTION ==================== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-6 py-6 mb-4"
      >
        <div className="flex flex-col items-center">
          {/* Animated Hotel Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="mb-6"
          >
            <HotelBuildingIcon size={120} />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl text-gray-900 dark:text-white mb-3 text-center">
            List Your Hotel
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-400 text-center text-base">
            Complete each step at your own pace
          </p>
        </div>
      </motion.div>

      {/* ==================== STEP CARDS ==================== */}
      <div className="flex-1 px-6 pb-32">
        <div className="max-w-xl mx-auto space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative p-5 rounded-2xl cursor-pointer transition-all overflow-hidden"
                style={{
                  background: hoveredStep === step.id
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%)',
                }}
              >
                {/* Gradient Border */}
                <div 
                  className="absolute inset-0 rounded-2xl" 
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                    padding: '2px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-4">
                  {/* Step Icon */}
                  <div className="flex-shrink-0">
                    <step.icon 
                      size={56} 
                      isHovered={hoveredStep === step.id}
                    />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className="text-lg text-gray-900 dark:text-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {step.description}
                    </p>
                    
                    {/* Duration Badge */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-white dark:text-gray-900 bg-gray-900 dark:bg-white px-2 py-0.5 rounded-full">
                        {step.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ==================== BOTTOM CTA ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 px-6 py-5 z-50"
      >
        <div className="max-w-xl mx-auto">
          {/* Main Button */}
          <motion.button
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white py-4 rounded-xl flex items-center justify-center gap-3 group shadow-lg"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg font-medium">List Your Hotel</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          {/* Helper Text */}
          <motion.div
            className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>2 min</span>
            </div>
            <span>•</span>
            <span>Save progress anytime</span>
            <span>•</span>
            <span>Get support 24/7</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
```

---

## SVG Step Icons - Complete Code

### 1. Property Type Icon

**Building with grid windows**

```typescript
interface StepIconProps {
  size?: number;
  isHovered?: boolean;
}

function PropertyTypeStepIcon({ size = 56, isHovered = false }: StepIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ scale: isHovered ? 1.1 : 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Main Building */}
      <rect
        x="14"
        y="10"
        width="28"
        height="36"
        rx="2"
        stroke="#6B7280"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Windows - 3 columns x 4 rows */}
      {/* Row 1 */}
      <rect x="18" y="14" width="6" height="5" rx="1" fill="#6B7280" />
      <rect x="26" y="14" width="6" height="5" rx="1" fill="#6B7280" />
      <rect x="34" y="14" width="6" height="5" rx="1" fill="#6B7280" />
      
      {/* Row 2 */}
      <rect x="18" y="21" width="6" height="5" rx="1" fill="#F59E0B" />
      <rect x="26" y="21" width="6" height="5" rx="1" fill="#6B7280" />
      <rect x="34" y="21" width="6" height="5" rx="1" fill="#F59E0B" />
      
      {/* Row 3 */}
      <rect x="18" y="28" width="6" height="5" rx="1" fill="#6B7280" />
      <rect x="26" y="28" width="6" height="5" rx="1" fill="#F59E0B" />
      <rect x="34" y="28" width="6" height="5" rx="1" fill="#6B7280" />
      
      {/* Row 4 */}
      <rect x="18" y="35" width="6" height="5" rx="1" fill="#F59E0B" />
      <rect x="26" y="35" width="6" height="5" rx="1" fill="#6B7280" />
      <rect x="34" y="35" width="6" height="5" rx="1" fill="#F59E0B" />
      
      {/* Door */}
      <rect
        x="23"
        y="42"
        width="10"
        height="8"
        rx="1"
        fill="#374151"
      />
      
      {/* Roof */}
      <motion.path
        d="M 10 10 L 28 2 L 46 10"
        stroke="#06B6D4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={isHovered ? { y: [-1, 0, -1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      
      {/* Shadow */}
      <ellipse
        cx="28"
        cy="52"
        rx="18"
        ry="2"
        fill="#000000"
        opacity="0.1"
      />
    </motion.svg>
  );
}
```

---

### 2. Location Icon

**Globe with compass and pin**

```typescript
function LocationStepIcon({ size = 56, isHovered = false }: StepIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ scale: isHovered ? 1.1 : 1 }}
    >
      {/* Globe Circle */}
      <circle
        cx="28"
        cy="28"
        r="16"
        stroke="#6B7280"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Vertical Line (Meridian) */}
      <line
        x1="28"
        y1="12"
        x2="28"
        y2="44"
        stroke="#6B7280"
        strokeWidth="1.5"
      />
      
      {/* Horizontal Line (Equator) */}
      <line
        x1="12"
        y1="28"
        x2="44"
        y2="28"
        stroke="#6B7280"
        strokeWidth="1.5"
      />
      
      {/* Curved Latitude Lines */}
      <path
        d="M 14 20 Q 28 18 42 20"
        stroke="#9CA3AF"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M 14 36 Q 28 38 42 36"
        stroke="#9CA3AF"
        strokeWidth="1"
        fill="none"
      />
      
      {/* Curved Longitude Lines */}
      <path
        d="M 20 12 Q 18 28 20 44"
        stroke="#9CA3AF"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M 36 12 Q 38 28 36 44"
        stroke="#9CA3AF"
        strokeWidth="1"
        fill="none"
      />
      
      {/* Compass in corner */}
      <g transform="translate(38, 8)">
        <circle cx="0" cy="0" r="6" stroke="#06B6D4" strokeWidth="1.5" fill="none" />
        
        {/* Rotating Needle */}
        <motion.g
          animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" }}
          style={{ originX: "0px", originY: "0px" }}
        >
          <path d="M 0 -4 L 1 0 L 0 4 L -1 0 Z" fill="#EF4444" />
        </motion.g>
        
        <text x="0" y="-9" fontSize="5" fontWeight="600" fill="#6B7280" textAnchor="middle">N</text>
      </g>
      
      {/* Location Pin */}
      <motion.g
        animate={isHovered ? { y: [0, -3, 0] } : {}}
        transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
      >
        <path
          d="M 28 22 C 25 22 23 24 23 26 C 23 29 28 34 28 34 C 28 34 33 29 33 26 C 33 24 31 22 28 22 Z"
          fill="#EF4444"
          stroke="#DC2626"
          strokeWidth="1"
        />
        <circle cx="28" cy="26" r="1.5" fill="white" />
      </motion.g>
      
      {/* Shadow */}
      <ellipse cx="28" cy="52" rx="18" ry="2" fill="#000000" opacity="0.1" />
    </motion.svg>
  );
}
```

---

### 3. Amenities Icon

**Circular badge with rotating amenity symbols**

```typescript
function AmenitiesStepIcon({ size = 56, isHovered = false }: StepIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ scale: isHovered ? 1.1 : 1 }}
    >
      {/* Main Circle Container */}
      <circle
        cx="28"
        cy="28"
        r="18"
        stroke="#6B7280"
        strokeWidth="2"
        strokeDasharray="4 4"
        fill="none"
      />
      
      {/* Inner Circle */}
      <circle
        cx="28"
        cy="28"
        r="12"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* WiFi Symbol (center) */}
      <g transform="translate(28, 28)">
        {/* WiFi Waves */}
        <path
          d="M -6 2 Q 0 -2 6 2"
          stroke="#06B6D4"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M -4 0 Q 0 -1.5 4 0"
          stroke="#06B6D4"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="0" cy="3" r="1.5" fill="#06B6D4" />
      </g>
      
      {/* Orbiting Icons */}
      <motion.g
        animate={isHovered ? { rotate: 360 } : {}}
        transition={{ duration: 8, repeat: isHovered ? Infinity : 0, ease: "linear" }}
        style={{ originX: "28px", originY: "28px" }}
      >
        {/* Pool Icon (top) */}
        <g transform="translate(28, 10)">
          <rect x="-4" y="-2" width="8" height="4" rx="1" fill="#3B82F6" opacity="0.7" />
        </g>
        
        {/* Gym Icon (right) */}
        <g transform="translate(46, 28)">
          <circle cx="-2" cy="0" r="2" stroke="#8B5CF6" strokeWidth="1.5" fill="none" />
          <circle cx="2" cy="0" r="2" stroke="#8B5CF6" strokeWidth="1.5" fill="none" />
          <line x1="-2" y1="0" x2="2" y2="0" stroke="#8B5CF6" strokeWidth="1.5" />
        </g>
        
        {/* Restaurant Icon (bottom) */}
        <g transform="translate(28, 46)">
          <path d="M -2 -2 L -2 2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 0 -3 L 0 -1" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
          <path d="M 2 -2 Q 2 0 2 2" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
        </g>
        
        {/* Parking Icon (left) */}
        <g transform="translate(10, 28)">
          <rect x="-2" y="-3" width="4" height="6" rx="0.5" stroke="#10B981" strokeWidth="1.5" fill="none" />
          <text x="0" y="1.5" fontSize="5" fontWeight="bold" fill="#10B981" textAnchor="middle">P</text>
        </g>
      </motion.g>
      
      {/* Sparkle Effects */}
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={28 + Math.cos(i * Math.PI / 2) * 22}
          cy={28 + Math.sin(i * Math.PI / 2) * 22}
          r="1"
          fill="#F59E0B"
          animate={isHovered ? {
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          } : {}}
          transition={{
            duration: 1,
            delay: i * 0.2,
            repeat: isHovered ? Infinity : 0
          }}
        />
      ))}
      
      {/* Shadow */}
      <ellipse cx="28" cy="52" rx="18" ry="2" fill="#000000" opacity="0.1" />
    </motion.svg>
  );
}
```

---

### 4. Photos Icon

**Camera with flash**

```typescript
function PhotosStepIcon({ size = 56, isHovered = false }: StepIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ scale: isHovered ? 1.1 : 1 }}
    >
      {/* Camera Body */}
      <rect
        x="12"
        y="18"
        width="32"
        height="24"
        rx="3"
        stroke="#6B7280"
        strokeWidth="2"
        fill="white"
      />
      
      {/* Camera Top */}
      <path
        d="M 20 18 L 22 14 L 34 14 L 36 18"
        stroke="#6B7280"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Lens Circle */}
      <circle
        cx="28"
        cy="30"
        r="7"
        stroke="#6B7280"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Inner Lens */}
      <circle
        cx="28"
        cy="30"
        r="4"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Lens Center */}
      <circle
        cx="28"
        cy="30"
        r="2"
        fill="#D1D5DB"
      />
      
      {/* Flash */}
      <motion.rect
        x="38"
        y="21"
        width="4"
        height="3"
        rx="1"
        fill="#F59E0B"
        animate={isHovered ? {
          opacity: [0.3, 1, 0.3]
        } : {}}
        transition={{
          duration: 1.5,
          repeat: isHovered ? Infinity : 0
        }}
      />
      
      {/* Viewfinder */}
      <circle
        cx="18"
        cy="22"
        r="1.5"
        fill="#6B7280"
      />
      
      {/* Button */}
      <circle
        cx="38"
        cy="26"
        r="1"
        fill="#EF4444"
      />
      
      {/* Photo Frame Inside Lens */}
      <motion.g
        animate={isHovered ? { scale: [1, 0.9, 1] } : {}}
        transition={{ duration: 0.5 }}
        style={{ originX: "28px", originY: "30px" }}
      >
        {/* Mountain scene */}
        <path
          d="M 24 32 L 26 28 L 28 30 L 30 27 L 32 32 Z"
          fill="#06B6D4"
          opacity="0.3"
        />
        
        {/* Sun */}
        <circle cx="30" cy="28" r="1" fill="#F59E0B" />
      </motion.g>
      
      {/* Flash Effect */}
      <motion.circle
        cx="28"
        cy="28"
        r="24"
        stroke="#F59E0B"
        strokeWidth="2"
        fill="none"
        opacity="0"
        animate={isHovered ? {
          scale: [0.5, 1.5],
          opacity: [0.5, 0]
        } : {}}
        transition={{
          duration: 1,
          repeat: isHovered ? Infinity : 0,
          repeatDelay: 1
        }}
      />
      
      {/* Shadow */}
      <ellipse cx="28" cy="52" rx="18" ry="2" fill="#000000" opacity="0.1" />
    </motion.svg>
  );
}
```

---

## Hotel Building Icon (Hero)

**Large 3D hotel icon for the hero section**

```typescript
function HotelBuildingIcon({ size = 120 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, rotate: -5 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}
    >
      <defs>
        {/* Building Gradient */}
        <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        
        {/* Roof Gradient */}
        <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        
        {/* Window Glow */}
        <radialGradient id="windowGlow">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="60" cy="105" rx="35" ry="4" fill="#000000" opacity="0.15" />

      {/* Main Building */}
      <motion.rect
        x="30"
        y="35"
        width="60"
        height="65"
        fill="url(#buildingGrad)"
        rx="4"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* 3D Side */}
      <motion.path
        d="M 30 35 L 25 40 L 25 105 L 30 100 Z"
        fill="#6D28D9"
        opacity="0.6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.3 }}
      />

      {/* Roof */}
      <motion.path
        d="M 20 35 L 60 15 L 100 35 L 90 35 L 60 20 L 30 35 Z"
        fill="url(#roofGrad)"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: 'spring' }}
      />

      {/* Windows - 4x5 Grid */}
      {[...Array(20)].map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const isLit = i % 3 !== 0;
        
        return (
          <motion.rect
            key={i}
            x={38 + col * 12}
            y={42 + row * 11}
            width="8"
            height="8"
            fill={isLit ? "url(#windowGlow)" : "#6D28D9"}
            rx="1"
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              opacity: isLit ? [0.8, 1, 0.8] : 1
            }}
            transition={{
              scale: { delay: 0.5 + i * 0.03 },
              opacity: isLit ? { 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.1 
              } : {}
            }}
          />
        );
      })}

      {/* Entrance */}
      <motion.rect
        x="48"
        y="85"
        width="24"
        height="15"
        fill="#1F2937"
        rx="2"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.7 }}
      />
      
      {/* Doors */}
      <rect x="52" y="88" width="7" height="12" fill="#374151" rx="1" />
      <rect x="61" y="88" width="7" height="12" fill="#374151" rx="1" />
      <circle cx="58" cy="94" r="1" fill="#FCD34D" />
      <circle cx="62" cy="94" r="1" fill="#FCD34D" />

      {/* Hotel Sign */}
      <motion.rect
        x="42"
        y="22"
        width="36"
        height="10"
        fill="#1F2937"
        rx="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      />
      <motion.text
        x="60"
        y="29"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill="url(#windowGlow)"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        HOTEL
      </motion.text>

      {/* Stars */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={48 + i * 12}
          cy={12}
          r="1.5"
          fill="#FCD34D"
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: 360
          }}
          transition={{ 
            delay: 1.3 + i * 0.1,
            rotate: { duration: 3, repeat: Infinity, ease: 'linear' }
          }}
        />
      ))}
    </motion.svg>
  );
}
```

---

## Styling & Animations

### Gradient Border Technique

```typescript
// Gradient border using mask technique
<div 
  className="absolute inset-0 rounded-2xl" 
  style={{
    background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
    padding: '2px',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
  }}
/>
```

### Card Hover Effect

```typescript
// Background changes on hover
style={{
  background: hoveredStep === step.id
    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)'
    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%)',
}}
```

---

## Color System

### Gradients
```css
/* Violet to Cyan (Primary) */
background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);

/* Card Border */
background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);

/* Building */
background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);

/* Roof */
background: linear-gradient(135deg, #06B6D4 0%, #0EA5E9 100%);
```

### Solid Colors
```css
--violet-500: #8B5CF6;
--violet-600: #7C3AED;
--violet-700: #6D28D9;

--cyan-500: #06B6D4;
--cyan-600: #0891B2;

--amber-500: #F59E0B;
--amber-300: #FCD34D;

--gray-600: #6B7280;
--gray-500: #9CA3AF;
--gray-400: #D1D5DB;
--gray-900: #1F2937;
--gray-800: #374151;
```

---

## Animation Timeline

```
0ms    - Back button fades in
200ms  - Hero section fades in
500ms  - Hotel icon scales in
700ms  - Title appears
900ms  - Subtitle appears
1100ms - First step card slides in
1200ms - Second step card slides in
1300ms - Third step card slides in
1400ms - Fourth step card slides in
1600ms - Bottom CTA button slides up
1800ms - Helper text fades in
```

---

## Flutter Conversion

### Step Icon Widget

```dart
class PropertyTypeStepIcon extends StatelessWidget {
  final double size;
  final bool isHovered;
  
  const PropertyTypeStepIcon({
    this.size = 56,
    this.isHovered = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: isHovered ? 1.1 : 1.0,
      duration: Duration(milliseconds: 200),
      child: CustomPaint(
        size: Size(size, size),
        painter: PropertyTypeIconPainter(),
      ),
    );
  }
}

class PropertyTypeIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Color(0xFF6B7280)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    
    // Draw building
    final buildingRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(14, 10, 28, 36),
      Radius.circular(2),
    );
    canvas.drawRRect(buildingRect, paint);
    
    // Draw windows
    final windowPaint = Paint()
      ..color = Color(0xFF6B7280)
      ..style = PaintingStyle.fill;
    
    for (int row = 0; row < 4; row++) {
      for (int col = 0; col < 3; col++) {
        final windowRect = RRect.fromRectAndRadius(
          Rect.fromLTWH(
            18 + col * 8, 
            14 + row * 7, 
            6, 
            5
          ),
          Radius.circular(1),
        );
        canvas.drawRRect(windowRect, windowPaint);
      }
    }
    
    // Draw door
    final doorPaint = Paint()
      ..color = Color(0xFF374151)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(23, 42, 10, 8),
        Radius.circular(1),
      ),
      doorPaint,
    );
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
```

### Step Card Widget

```dart
class StepCard extends StatefulWidget {
  final String title;
  final String description;
  final String duration;
  final Widget icon;
  final VoidCallback onTap;
  
  const StepCard({
    required this.title,
    required this.description,
    required this.duration,
    required this.icon,
    required this.onTap,
  });
  
  @override
  _StepCardState createState() => _StepCardState();
}

class _StepCardState extends State<StepCard> {
  bool isHovered = false;
  
  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => isHovered = true),
      onExit: (_) => setState(() => isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: Duration(milliseconds: 200),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isHovered
                ? [
                    Color(0xFF8B5CF6).withOpacity(0.05),
                    Color(0xFF06B6D4).withOpacity(0.05),
                  ]
                : [
                    Color(0xFF8B5CF6).withOpacity(0.02),
                    Color(0xFF06B6D4).withOpacity(0.02),
                  ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              width: 2,
              color: Colors.transparent,
            ),
          ),
          child: CustomPaint(
            painter: GradientBorderPainter(),
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Row(
                children: [
                  // Icon
                  widget.icon,
                  SizedBox(width: 16),
                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          widget.description,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                        SizedBox(height: 8),
                        // Duration badge
                        Row(
                          children: [
                            Icon(Icons.access_time, size: 14, color: Colors.grey[500]),
                            SizedBox(width: 6),
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.black,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                widget.duration,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class GradientBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(16));
    
    final gradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF8B5CF6), Color(0xFF06B6D4)],
    );
    
    final paint = Paint()
      ..shader = gradient.createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    
    canvas.drawRRect(rrect, paint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
```

---

## Summary

This document contains:
- ✅ Complete screen layout code
- ✅ All 4 step icons with full SVG code
- ✅ Hero hotel building icon with animations
- ✅ Gradient border technique
- ✅ Hover animations
- ✅ Flutter conversion examples
- ✅ Color system and timing

Ready for Flutter implementation! 🚀
