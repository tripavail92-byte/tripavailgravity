# TripAvail - List Your Hotel Screen Documentation

## Overview
This document provides complete code reference and specifications for the TripAvail "List Your Hotel" screen. This is the entry point for hotel managers to begin listing their property, featuring an animated property icon, step cards, and a gradient call-to-action button.

---

## Screen Flow

```
List Your Hotel Screen (Overview)
        ↓
Click "List Your Hotel" Button
        ↓
Complete Hotel Listing Flow (Step-by-Step)
        ↓
Hotel Listed Successfully
```

---

## Design Specifications

### Color System
- **Purple to Cyan Gradient**: `from-[#9D4EDD] to-[#00D4FF]` (Primary brand gradient for Hotel Manager role)
- **Background**: `white` in light mode, `dark:bg-gray-950` in dark mode
- **Text Primary**: `text-gray-900` in light mode, `dark:text-white` in dark mode
- **Text Secondary**: `text-gray-600` in light mode, `dark:text-gray-400` in dark mode
- **Card Border**: Gradient border using purple-cyan gradient with 2px width
- **Duration Badge**: Black background in light mode, white background in dark mode (inverted)

### Typography
- **Main Title**: `text-3xl` (48px equivalent)
- **Subtitle**: `text-base` (16px)
- **Step Title**: `text-lg` (18px)
- **Step Description**: `text-sm` (14px)
- **Duration**: `text-xs` (12px)

### Spacing & Dimensions
- **Max Content Width**: `max-w-xl` (36rem/576px)
- **Card Padding**: `p-5` (20px)
- **Card Gap**: `space-y-4` (16px)
- **Card Border Radius**: `rounded-2xl` (16px)
- **Icon Size**: `80px` for step icons, `140px` for property vector
- **Button Height**: `py-4` (16px top+bottom)

### Animations
- **Back Button Slide**: `x: -4px` on hover
- **Property Icon**:  
  - Scale: `0.8 → 1` on mount
  - Rotate: `-10deg → 0deg`
  - Duration: `0.5s` with spring
  - Hover: Scale `1.08`, translate Y `-5px`
- **Title Change**: Fade with vertical slide when property type changes
- **Step Cards**: Stagger entrance with `100ms` delay between cards
- **Card Hover**: Translate Y `-2px`
- **CTA Button**:
  - Hover: Scale `1.02`, translate Y `-2px`
  - Tap: Scale `0.98`
  - Arrow: Translate X `1px` on hover

### Z-Index Layers
- **Fixed CTA Button**: `z-50`

---

## Complete Code

### Main Screen Component (`/modules/hotelManager/screens/ListHotelScreen.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Clock, Sparkles, Zap, ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import CompleteHotelListingFlow from '../components/CompleteHotelListingFlow';
import { 
  PropertyTypeIcon,
  LocationIcon,
  AmenitiesIcon,
  PhotosIcon,
  PricingIcon
} from '../../../components/icons/hotel-listing/HotelListingIcons';
import { PremiumPropertyVector } from '../../../components/icons/hotel-listing/PremiumPropertyVectors';
import {
  PremiumPropertyTypeIcon,
  PremiumLocationIcon,
  PremiumAmenitiesIcon,
  PremiumPhotosIcon,
  PremiumPricingIcon
} from '../../../components/icons/hotel-listing/PremiumStepIcons';

interface ListHotelScreenProps {
  onNavigate: (screen: string) => void;
  onDetailScreenChange?: (isDetailActive: boolean) => void;
}

// Helper function to get display name for property types
const getPropertyDisplayName = (type: string): string => {
  const displayNames: { [key: string]: string } = {
    'hotel': 'Hotel',
    'boutique': 'Boutique Hotel',
    'resort': 'Resort',
    'motel': 'Motel',
    'lodge': 'Lodge',
    'inn': 'Inn',
    'guesthouse': 'Guest House',
    'hostel': 'Hostel'
  };
  return displayNames[type] || 'Property';
};

export default function ListHotelScreen({ 
  onNavigate, 
  onDetailScreenChange 
}: ListHotelScreenProps) {
  const [showFlow, setShowFlow] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<
    'hotel' | 'boutique' | 'resort' | 'motel' | 'lodge' | 'inn' | 'guesthouse' | 'hostel' | ''
  >('hotel');
  
  // Hide main app header when this screen is active
  useEffect(() => {
    if (onDetailScreenChange) {
      onDetailScreenChange(true);
    }
    
    // Cleanup: restore header when component unmounts
    return () => {
      if (onDetailScreenChange) {
        onDetailScreenChange(false);
      }
    };
  }, [onDetailScreenChange]);

  // Define the 5 listing steps
  const hotelSteps = [
    { 
      id: 1, 
      title: 'Property Type', 
      description: 'Select your property category', 
      completed: false,
      icon: PremiumPropertyTypeIcon,
      duration: '1 min',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 2, 
      title: 'Location', 
      description: 'Pin your exact location', 
      completed: false,
      icon: PremiumLocationIcon,
      duration: '2 min',
      color: 'from-cyan-500 to-blue-500'
    },
    { 
      id: 3, 
      title: 'Amenities', 
      description: 'Highlight your facilities', 
      completed: false,
      icon: PremiumAmenitiesIcon,
      duration: '3 min',
      color: 'from-purple-500 to-cyan-500'
    },
    { 
      id: 4, 
      title: 'Photos', 
      description: 'Showcase your spaces', 
      completed: false,
      icon: PremiumPhotosIcon,
      duration: '4 min',
      color: 'from-indigo-500 to-purple-600'
    },
    { 
      id: 5, 
      title: 'Pricing', 
      description: 'Set your rates', 
      completed: false,
      icon: PremiumPricingIcon,
      duration: '2 min',
      color: 'from-amber-500 to-orange-500'
    },
  ];

  // Start the listing flow
  const handleStartFlow = () => {
    setShowFlow(true);
  };

  // Return to overview from flow
  const handleBackFromFlow = () => {
    setShowFlow(false);
  };

  // Update property type when selected in flow
  const handleFlowUpdate = (data: any) => {
    if (data.propertyType) {
      setSelectedPropertyType(data.propertyType);
    }
  };

  // Save and return to dashboard
  const handleSaveAndExitToDashboard = () => {
    setShowFlow(false);
    onNavigate('dashboard');
  };

  // If flow is active, show the complete listing flow
  if (showFlow) {
    return (
      <CompleteHotelListingFlow 
        onBack={handleBackFromFlow} 
        onComplete={handleFlowUpdate}
        onSaveAndExit={handleSaveAndExitToDashboard}
      />
    );
  }

  // Otherwise, show the overview screen
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col pb-8">
      
      {/* ====================
          BACK BUTTON HEADER
          ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 pt-6 pb-2"
      >
        <motion.button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-900 dark:text-white hover:opacity-70 transition-opacity"
          // Slide left on hover
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-base">Back to Dashboard</span>
        </motion.button>
      </motion.div>

      {/* ====================
          HERO SECTION
          ==================== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="px-6 py-6 mb-4"
      >
        <div className="flex flex-col items-center">
          
          {/* Animated Property Icon - changes based on property type */}
          <AnimatePresence mode="wait">
            <motion.button
              key={selectedPropertyType}
              onClick={handleStartFlow}
              // Entry animation
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              // Exit animation
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
              className="mb-6 cursor-pointer"
              // Hover effect - lift and scale
              whileHover={{ scale: 1.08, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Premium 3D Property Vector (140px) */}
              <PremiumPropertyVector 
                propertyType={selectedPropertyType} 
                size={140} 
              />
            </motion.button>
          </AnimatePresence>

          {/* Title - Changes when property type changes */}
          <AnimatePresence mode="wait">
            <motion.h1 
              key={selectedPropertyType}
              className="text-3xl text-gray-900 dark:text-white mb-3 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              List Your {getPropertyDisplayName(selectedPropertyType)}
            </motion.h1>
          </AnimatePresence>
          
          {/* Subtitle */}
          <motion.p 
            className="text-gray-600 dark:text-gray-400 text-center text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Complete each step at your own pace
          </motion.p>
        </div>
      </motion.div>

      {/* ====================
          STEPS SECTION
          ==================== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex-1 px-6 pb-32"
      >
        <div className="max-w-xl mx-auto">
          
          {/* Step Cards */}
          <div className="space-y-4 mb-8">
            {hotelSteps.map((step, index) => (
              <motion.div
                key={step.id}
                // Staggered entrance animation
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                onMouseEnter={() => setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <motion.div
                  // Hover lift effect
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div 
                    className="relative p-5 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden"
                    // Gradient background - subtle on default, more prominent on hover
                    style={{
                      background: hoveredStep === step.id 
                        ? 'linear-gradient(135deg, rgba(157, 78, 221, 0.03) 0%, rgba(0, 212, 255, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(157, 78, 221, 0.015) 0%, rgba(0, 212, 255, 0.015) 100%)',
                    }}
                  >
                    {/* Gradient Border (2px) - Purple to Cyan */}
                    <div 
                      className="absolute inset-0 rounded-2xl" 
                      style={{
                        background: 'linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%)',
                        padding: '2px',
                        // Mask technique to create border effect
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                      }}
                    />
                    
                    {/* Content Container */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-5">
                        
                        {/* Animated Step Icon */}
                        <motion.div 
                          // Wiggle animation on hover
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <step.icon 
                            size={80} 
                            isActive={hoveredStep === step.id}
                          />
                        </motion.div>

                        {/* Step Text Content */}
                        <div className="flex-1">
                          {/* Step Title */}
                          <h3 className="text-lg text-gray-900 dark:text-white mb-1">
                            {step.title}
                          </h3>
                          
                          {/* Step Description */}
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {step.description}
                          </p>
                          
                          {/* Duration Badge */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            {/* Inverted colors for duration badge */}
                            <span className="text-xs text-white dark:text-gray-900 bg-gray-900 dark:bg-white px-2 py-0.5 rounded-full">
                              {step.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Total Time Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-5 py-2.5 rounded-full">
              {/* Pulsing dot indicator */}
              <motion.div 
                className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm text-gray-900 dark:text-white">
                Total time: ~12 minutes
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ====================
          FIXED BOTTOM CTA
          ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="fixed bottom-0 left-0 right-0 px-6 py-5 z-50"
      >
        <div className="max-w-xl mx-auto">
          {/* Gradient Button - Purple to Cyan */}
          <motion.button
            onClick={handleStartFlow}
            className="w-full bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF] text-white py-4 rounded-xl flex items-center justify-center gap-3 group shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20"
            // Hover: scale up and lift
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg font-medium">
              List Your Hotel
            </span>
            {/* Arrow with slide animation on hover */}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          {/* Helper Text */}
          <motion.p 
            className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            Save progress anytime • Get support 24/7
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
```

---

## Icon Components

### Property Type Icons

The property icon cycles through 8 different property types every 3 seconds:

```typescript
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
```

### Step Icons

Each step has its own animated icon component:

1. **PremiumPropertyTypeIcon** - Building with cycling floors
2. **PremiumLocationIcon** - Globe with dropping pins
3. **PremiumAmenitiesIcon** - Cycling amenity icons (WiFi, Pool, Gym, etc.)
4. **PremiumPhotosIcon** - Camera with cycling photo sections
5. **PremiumPricingIcon** - Currency symbols with animation

All icons are:
- **Outline style** - No solid fills, stroke-based
- **Dark mode adaptive** - Colors change based on theme
- **Animated** - Cycling content, pulse effects, rotations
- **80px size** for step cards
- **140px size** for hero property vector

---

## Premium Property Vector Component

### Hotel Icon Structure

```typescript
export function PremiumPropertyVector({ 
  propertyType, 
  size = 120 
}: PremiumPropertyVectorProps) {
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
      </defs>

      {/* Shadow base */}
      <ellipse cx="60" cy="105" rx="35" ry="4" fill="#000000" opacity="0.15" />

      {/* Main Building - Purple gradient */}
      <rect x="30" y="35" width="60" height="65" fill="url(#buildingGrad)" rx="4" />
      
      {/* Building Left Side (3D effect) */}
      <path d="M 30 35 L 25 40 L 25 105 L 30 100 Z" fill="#7C3AED" opacity="0.6" />

      {/* Roof - Cyan gradient */}
      <path d="M 20 35 L 60 15 L 100 35 L 90 35 L 60 20 L 30 35 Z" fill="url(#roofGrad)" />

      {/* Windows Grid - 4x5 = 20 windows */}
      {[...Array(20)].map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const isLit = i % 3 !== 0; // Some windows lit, some dark
        
        return (
          <rect
            key={i}
            x={38 + col * 12}
            y={42 + row * 11}
            width="8"
            height="8"
            fill={isLit ? "url(#windowGlow)" : "#4C1D95"}
            rx="1"
            // Pulsing animation for lit windows
            opacity={isLit ? [0.8, 1, 0.8] : 1}
          />
        );
      })}

      {/* Main Entrance */}
      <rect x="48" y="85" width="24" height="15" fill="#1F2937" rx="2" />
      
      {/* Door panels */}
      <rect x="52" y="88" width="7" height="12" fill="#374151" rx="1" />
      <rect x="61" y="88" width="7" height="12" fill="#374151" rx="1" />
      
      {/* Door handles */}
      <circle cx="58" cy="94" r="1" fill="#FCD34D" />
      <circle cx="62" cy="94" r="1" fill="#FCD34D" />

      {/* Hotel Sign */}
      <rect x="42" y="22" width="36" height="10" fill="#1F2937" rx="2" />
      <text 
        x="60" 
        y="29" 
        textAnchor="middle" 
        fontSize="7" 
        fontWeight="bold" 
        fill="url(#windowGlow)"
        // Pulsing glow effect
        opacity={[0.7, 1, 0.7]}
      >
        HOTEL
      </text>

      {/* Star decorations */}
      {[...Array(3)].map((_, i) => (
        <circle
          key={i}
          cx={48 + i * 12}
          cy={12}
          r="1.5"
          fill="#FCD34D"
          // Rotating stars
          rotate={360}
        />
      ))}
    </motion.svg>
  );
}
```

---

## Step Breakdown

### Step 1: Property Type
- **Duration**: 1 minute
- **Icon**: Animated building cycling through property types
- **Description**: Select your property category
- **Options**: Hotel, Boutique Hotel, Resort, Motel, Lodge, Inn, Guest House, Hostel

### Step 2: Location
- **Duration**: 2 minutes
- **Icon**: Globe with dropping map pins
- **Description**: Pin your exact location
- **Features**: 
  - Interactive map
  - Address autocomplete
  - GPS coordinates
  - Nearby landmarks

### Step 3: Amenities
- **Duration**: 3 minutes
- **Icon**: Cycling amenity icons (WiFi, Pool, Gym, Spa, etc.)
- **Description**: Highlight your facilities
- **Categories**:
  - Room amenities
  - Hotel facilities
  - Services
  - Accessibility features

### Step 4: Photos
- **Duration**: 4 minutes
- **Icon**: Camera with cycling photo sections
- **Description**: Showcase your spaces
- **Sections**:
  - Lobby
  - Rooms
  - Reception
  - Restaurant
  - Pool
  - Exterior

### Step 5: Pricing
- **Duration**: 2 minutes
- **Icon**: Currency symbols with animation
- **Description**: Set your rates
- **Options**:
  - Base rates
  - Seasonal pricing
  - Discounts
  - Cancellation policies

**Total Estimated Time**: ~12 minutes

---

## Button Styles

### Primary CTA Button

```typescript
// Gradient Button Component
<button
  className="
    w-full 
    bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF]
    text-white 
    py-4 
    rounded-xl 
    flex items-center justify-center gap-3 
    group 
    shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20
  "
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
>
  <span className="text-lg font-medium">
    List Your Hotel
  </span>
  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</button>
```

### Back Button

```typescript
<button
  className="
    flex items-center gap-2 
    text-gray-900 dark:text-white 
    hover:opacity-70 
    transition-opacity
  "
  whileHover={{ x: -4 }}
  whileTap={{ scale: 0.95 }}
>
  <ArrowLeft className="w-6 h-6" />
  <span className="text-base">Back to Dashboard</span>
</button>
```

---

## Card Gradient Border Technique

### CSS Mask Method for Gradient Borders

```typescript
<div 
  className="absolute inset-0 rounded-2xl" 
  style={{
    // Gradient background
    background: 'linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%)',
    // 2px border width via padding
    padding: '2px',
    // Mask technique to create border-only effect
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
  }}
/>
```

This technique creates a gradient border without using border-image, which doesn't support border-radius.

---

## Animation Timeline

```
0ms    - Back button fades in and slides down
500ms  - Hero section fades in
        - Title appears with slide up
600ms  - Property icon scales and rotates in
700ms  - Steps section starts fading in
800ms  - First step card slides in from left
900ms  - Second step card slides in (100ms delay)
1000ms - Third step card slides in
1100ms - Fourth step card slides in
1200ms - Fifth step card slides in
1300ms - Total time badge scales in
1400ms - CTA button fades in and slides up
1600ms - Helper text fades in
```

---

## State Management

### Local State

```typescript
const [showFlow, setShowFlow] = useState(false);
const [hoveredStep, setHoveredStep] = useState<number | null>(null);
const [selectedPropertyType, setSelectedPropertyType] = useState<
  'hotel' | 'boutique' | 'resort' | 'motel' | 'lodge' | 'inn' | 'guesthouse' | 'hostel' | ''
>('hotel');
```

### Navigation Flow

```typescript
// Start listing flow
const handleStartFlow = () => {
  setShowFlow(true);
};

// Return to overview
const handleBackFromFlow = () => {
  setShowFlow(false);
};

// Update property type selection
const handleFlowUpdate = (data: any) => {
  if (data.propertyType) {
    setSelectedPropertyType(data.propertyType);
  }
};

// Save and exit to dashboard
const handleSaveAndExitToDashboard = () => {
  setShowFlow(false);
  onNavigate('dashboard');
};
```

---

## Flutter Conversion Notes

### Key Widgets

1. **AnimatedContainer** - For property icon transitions
2. **AnimatedSwitcher** - For title changes when property type changes
3. **Staggered Animation** - For step card entrance
4. **GestureDetector** - For hover and tap effects
5. **CustomPaint** - For gradient borders
6. **ShaderMask** - For gradient button background

### Animation Equivalents

```dart
// Property Icon Animation
AnimatedSwitcher(
  duration: Duration(milliseconds: 500),
  transitionBuilder: (child, animation) {
    return ScaleTransition(
      scale: animation,
      child: RotationTransition(
        turns: Tween<double>(begin: -0.03, end: 0.0).animate(animation),
        child: child,
      ),
    );
  },
  child: PropertyVectorIcon(
    key: ValueKey(propertyType),
    type: propertyType,
  ),
)

// Step Cards Stagger
ListView.builder(
  itemCount: steps.length,
  itemBuilder: (context, index) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final delay = 0.8 + (index * 0.1);
        final progress = Curves.easeOut.transform(
          ((animation.value - delay) / (1 - delay)).clamp(0.0, 1.0)
        );
        
        return Transform.translate(
          offset: Offset(-20 * (1 - progress), 0),
          child: Opacity(
            opacity: progress,
            child: StepCard(step: steps[index]),
          ),
        );
      },
    );
  },
)

// Gradient Border
Container(
  decoration: ShapeDecoration(
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(
        width: 2,
        gradient: LinearGradient(
          colors: [Color(0xFF9D4EDD), Color(0xFF00D4FF)],
        ),
      ),
    ),
  ),
)

// Gradient Button
Container(
  decoration: BoxDecoration(
    gradient: LinearGradient(
      colors: [Color(0xFF9D4EDD), Color(0xFF00D4FF)],
    ),
    borderRadius: BorderRadius.circular(12),
    boxShadow: [
      BoxShadow(
        color: Color(0xFF9D4EDD).withOpacity(0.3),
        blurRadius: 16,
        offset: Offset(0, 8),
      ),
    ],
  ),
  child: Material(
    color: Colors.transparent,
    child: InkWell(
      onTap: () => handleStartFlow(),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('List Your Hotel'),
            SizedBox(width: 12),
            Icon(Icons.arrow_forward),
          ],
        ),
      ),
    ),
  ),
)
```

### Dark Mode

```dart
// Use Theme.of(context).brightness
final isDark = Theme.of(context).brightness == Brightness.dark;

// Colors
final bgColor = isDark ? Color(0xFF030712) : Colors.white;
final textPrimary = isDark ? Colors.white : Color(0xFF111827);
final textSecondary = isDark ? Color(0xFF9CA3AF) : Color(0xFF6B7280);
final cardBg = isDark ? Color(0xFF1F2937) : Colors.white;
```

---

## Responsive Design

### Mobile (Default)
- Full width cards
- Single column layout
- Fixed bottom CTA
- 16px horizontal padding

### Tablet (768px+)
- Centered content with max-width
- Same single column layout
- More generous spacing

### Desktop (1024px+)
- Max content width: 576px
- Centered layout
- Preserve mobile-first design
- No multi-column layout needed

---

## Accessibility

### ARIA Labels
```typescript
<button 
  aria-label="List your hotel property"
  onClick={handleStartFlow}
>
  List Your Hotel
</button>

<div 
  role="list"
  aria-label="Hotel listing steps"
>
  {steps.map(step => (
    <div role="listitem" aria-label={`Step ${step.id}: ${step.title}`}>
      {/* Step content */}
    </div>
  ))}
</div>
```

### Keyboard Navigation
- All buttons keyboard accessible
- Tab order follows visual flow
- Enter/Space to activate buttons
- Escape to go back (in flow)

### Screen Reader Support
- Meaningful alt text for icons
- Clear step labels
- Duration announcements
- Progress indicators

---

## Performance Optimizations

### Animation Performance
- Use GPU-accelerated transforms (scale, translate, rotate)
- Avoid animating width/height
- Use will-change sparingly
- Lazy load CompleteHotelListingFlow component

### Image Optimization
- SVG icons for scalability
- No raster images on this screen
- Inline SVGs for instant rendering

### Code Splitting
```typescript
// Lazy load the complete flow
const CompleteHotelListingFlow = lazy(() => 
  import('../components/CompleteHotelListingFlow')
);
```

---

## Testing Checklist

- [ ] Back button navigation works
- [ ] Property icon animates on mount
- [ ] Property type changes update title
- [ ] Step cards appear with stagger
- [ ] Hover effects work on all cards
- [ ] CTA button starts flow
- [ ] Dark mode colors correct
- [ ] Responsive on all screen sizes
- [ ] Keyboard navigation works
- [ ] Screen reader announces properly
- [ ] Animations smooth at 60fps
- [ ] Flow data persists when returning

---

## Integration Points

### Props Required

```typescript
interface ListHotelScreenProps {
  onNavigate: (screen: string) => void;
  onDetailScreenChange?: (isDetailActive: boolean) => void;
}
```

### Events Emitted

```typescript
// Navigate to dashboard
onNavigate('dashboard');

// Hide main app header
onDetailScreenChange(true);

// Restore main app header
onDetailScreenChange(false);
```

### Data Flow

```
User clicks "List Your Hotel"
        ↓
showFlow = true
        ↓
CompleteHotelListingFlow renders
        ↓
User completes or exits flow
        ↓
handleFlowUpdate(data) OR handleBackFromFlow()
        ↓
showFlow = false, data saved
```

---

## Backend Integration (Future)

### API Endpoints

```typescript
// Save draft listing
POST /api/hotel-manager/listings/draft
Body: {
  propertyType: string,
  step: number,
  data: object
}

// Get draft listing
GET /api/hotel-manager/listings/draft/:id

// Complete listing
POST /api/hotel-manager/listings/complete
Body: {
  propertyType: string,
  location: object,
  amenities: array,
  photos: array,
  pricing: object
}

// Get listing steps progress
GET /api/hotel-manager/listings/progress
Response: {
  completedSteps: number[],
  totalSteps: number,
  percentage: number
}
```

---

## Color Reference

### Gradients

```css
/* Purple to Cyan (Brand) */
background: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);

/* Card Border */
background: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);

/* Card Hover Background */
background: linear-gradient(135deg, rgba(157, 78, 221, 0.03) 0%, rgba(0, 212, 255, 0.03) 100%);

/* Card Default Background */
background: linear-gradient(135deg, rgba(157, 78, 221, 0.015) 0%, rgba(0, 212, 255, 0.015) 100%);
```

### Solid Colors

```css
/* Purple */
--purple-500: #9D4EDD;
--purple-600: #7C3AED;
--purple-dark: #5B21B6;

/* Cyan */
--cyan-500: #00D4FF;
--cyan-600: #0EA5E9;

/* Amber (Window glow) */
--amber-300: #FCD34D;
--amber-500: #F59E0B;

/* Grays */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-900: #111827;
--gray-950: #030712;
```

---

## Version History

- **v1.0.0** (Current)
  - Initial implementation
  - 5-step listing flow
  - Animated property vectors (8 types)
  - Gradient borders and buttons
  - Dark mode support
  - Staggered entrance animations

---

## Credits

**Design System**: Airbnb-inspired with TripAvail brand colors  
**Animations**: Motion/React (Framer Motion successor)  
**Icons**: Custom animated SVG vectors  
**Gradients**: Purple (#9D4EDD) to Cyan (#00D4FF) brand gradient  
**Created for**: TripAvail Hotel Manager role  

---

*End of Documentation*
