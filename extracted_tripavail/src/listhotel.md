# TripAvail - Hotel Listing Process Complete Documentation

## Overview

The hotel listing process in TripAvail is a comprehensive 8-step flow designed to guide hotel managers through property registration with an intuitive, engaging, and mobile-first experience. This document provides detailed specifications for each screen, their purpose, implementation code, and animated SVG icons that align with the app's modern aesthetic.

## Design Philosophy

### User Experience Principles
- **Progressive Disclosure**: Information is revealed gradually to prevent overwhelm
- **Visual Engagement**: Each step uses animated icons and smooth transitions
- **Mobile-First**: Optimized for mobile devices with touch-friendly interactions
- **Brand Consistency**: Rose/Pink gradient themes with dark mode support
- **Motivation Psychology**: Progress indicators and completion celebrations

### Animation & Icon System
- **SVG Icons**: Custom animated icons for each step using Motion/React
- **Gradient Themes**: Rose primary (#E11D48) and partner gradient (Purple to Pink)
- **Micro-interactions**: Hover effects, scale animations, and state transitions
- **Dark Mode**: Full support with automatic theme switching

---

## Complete Screen Flow Documentation

### **Entry Point: List Hotel Dashboard**

**File**: `/modules/hotelManager/screens/ListHotelScreen.tsx`

#### Purpose
- Present hotel listing overview with step preview
- Build confidence with clear process explanation  
- Provide resources and motivation to start

#### Key Features
- 5-step preview cards with animated icons
- Estimated completion time (15 minutes)
- Help resources and best practices
- Smooth entry animation

#### Animated SVG Icons Required
```typescript
// Custom animated icons for each preview step
<PropertyTypeIcon size={32} className="text-gray-900" />
<LocationIcon size={32} className="text-gray-900" />
<AmenitiesIcon size={32} className="text-gray-900" />
<PhotosIcon size={32} className="text-gray-900" />
<PricingIcon size={32} className="text-gray-900" />
```

#### Implementation Code
```typescript
import { useState } from 'react';
import { motion } from 'motion/react';
import { Building, Plus, Camera, Star, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import CompleteHotelListingFlow from '../components/CompleteHotelListingFlow';

export default function ListHotelScreen({ onNavigate }: ListHotelScreenProps) {
  const [showFlow, setShowFlow] = useState(false);

  const hotelSteps = [
    { 
      id: 1, 
      title: 'Property Type', 
      description: 'What type of property are you listing?', 
      completed: false,
      icon: PropertyTypeIcon
    },
    // ... more steps
  ];

  return (
    <div className="space-y-6">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <motion.div 
          className="w-20 h-20 bg-gradient-partner rounded-full flex items-center justify-center mx-auto mb-4"
          whileHover={{ scale: 1.05 }}
        >
          <Building className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground mb-2">
          List Your Hotel
        </h2>
        <p className="text-gray-600 dark:text-muted-foreground max-w-md mx-auto">
          Get your property online in just 5 simple steps and start receiving bookings
        </p>
      </motion.div>

      {/* Step Preview Cards */}
      <motion.div className="space-y-4">
        {hotelSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="p-4 border border-gray-200 dark:border-border hover:border-primary transition-all hover-lift">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <step.icon size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-card px-2 py-1 rounded-full">
                      Step {step.id}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-foreground mb-1">
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Start Button */}
      <Card className="p-6 border-2 border-dashed border-gray-200 dark:border-border">
        <div className="text-center">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 360 }}
            className="inline-block mb-4"
          >
            <Plus className="w-12 h-12 text-primary" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">Ready to get started?</h3>
          <p className="text-gray-600 dark:text-muted-foreground mb-6">
            Complete setup in under 15 minutes
          </p>
          <motion.button 
            onClick={() => setShowFlow(true)}
            className="px-8 py-3 bg-gradient-partner text-white rounded-xl font-medium hover:shadow-lg transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Listing Process
            <ArrowRight size={18} className="ml-2" />
          </motion.button>
        </div>
      </Card>
    </div>
  );
}
```

---

### **Step 1: Basic Information**

**File**: `/modules/hotelManager/components/CompleteHotelListingFlow.tsx`

#### Purpose
- Collect fundamental property details
- Establish property identity and contact information
- AI-powered description assistance

#### Animated SVG Icon
```typescript
const PropertyTypeAnimatedIcon = ({ isSelected, isCompleted, size = 32 }) => (
  <motion.div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-100 text-green-600' : 
      isSelected ? 'bg-gradient-partner text-white' : 'bg-gray-100 text-gray-600'
    }`}
    whileHover={{ scale: 1.1 }}
    animate={isSelected ? { rotate: [0, 360] } : {}}
    transition={{ duration: 0.5 }}
  >
    <motion.svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <motion.path 
        d="M9 9v12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
      <motion.path 
        d="M9 15h6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      />
    </motion.svg>
  </motion.div>
);
```

#### Key Features
- Property type selection with animated icons
- Hotel name validation
- AI-powered description suggestions
- Contact information collection
- Real-time validation feedback

---

### **Step 2: Location Details** 

**File**: `/modules/hotelManager/components/ModernLocationStep.tsx`

#### Purpose
- Precise location identification
- Interactive map integration
- Address validation and geocoding

#### Animated SVG Icon
```typescript
const LocationAnimatedIcon = ({ isSelected, isCompleted, size = 32 }) => (
  <motion.div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-100 text-green-600' : 
      isSelected ? 'bg-gradient-partner text-white' : 'bg-gray-100 text-gray-600'
    }`}
    whileHover={{ scale: 1.1 }}
  >
    <motion.svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <motion.path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      />
      <motion.circle
        cx="12"
        cy="10"
        r="3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      />
      {isSelected && (
        <motion.g>
          <motion.circle
            cx="12"
            cy="10"
            r="6"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ delay: 0.5, duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.g>
      )}
    </motion.svg>
  </motion.div>
);
```

#### Key Features
- Interactive map picker
- Country/city/area selection
- Address autocomplete
- Coordinate validation
- Nearby landmarks detection

---

### **Step 3: Amenities & Features**

**File**: `/modules/hotelManager/components/ModernAmenitiesStep.tsx`

#### Purpose
- Comprehensive amenity selection
- Categorized facility listing
- Visual amenity representation

#### Animated SVG Icon
```typescript
const AmenitiesAnimatedIcon = ({ isSelected, isCompleted, size = 32 }) => (
  <motion.div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-100 text-green-600' : 
      isSelected ? 'bg-gradient-partner text-white' : 'bg-gray-100 text-gray-600'
    }`}
    whileHover={{ scale: 1.1 }}
  >
    <motion.svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <motion.path
        d="M12 2L2 7l10 5 10-5-10-5z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M2 17l10 5 10-5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      />
      <motion.path
        d="M2 12l10 5 10-5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      />
      {isSelected && (
        <motion.g>
          {[...Array(3)].map((_, i) => (
            <motion.circle
              key={i}
              cx={8 + i * 4}
              cy={12}
              r="1"
              fill="currentColor"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ 
                delay: i * 0.2, 
                duration: 1, 
                repeat: Infinity, 
                repeatType: "loop" 
              }}
            />
          ))}
        </motion.g>
      )}
    </motion.svg>
  </motion.div>
);
```

#### Key Features
- Categorized amenity selection (Basic, Premium, Wellness, Business)
- Multi-select with visual indicators
- Popular amenities prioritization
- Custom amenity addition

---

### **Step 4: Rooms & Accommodation**

**File**: `/modules/hotelManager/components/ModernRoomsStep.tsx`

#### Purpose
- Room type configuration
- Capacity and pricing setup
- Room-specific amenity selection

#### Animated SVG Icon
```typescript
const RoomsAnimatedIcon = ({ isSelected, isCompleted, size = 32 }) => (
  <motion.div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-100 text-green-600' : 
      isSelected ? 'bg-gradient-partner text-white' : 'bg-gray-100 text-gray-600'
    }`}
    whileHover={{ scale: 1.1 }}
  >
    <motion.svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M16 2v4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
      <motion.path
        d="M8 2v4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      />
      <motion.path
        d="M3 10h18"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      />
      {isSelected && (
        <motion.g>
          <motion.rect
            x="7"
            y="14"
            width="3"
            height="3"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          />
          <motion.rect
            x="14"
            y="14"
            width="3"
            height="3"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.7 }}
          />
        </motion.g>
      )}
    </motion.svg>
  </motion.div>
);
```

#### Key Features
- Dynamic room type addition
- Bed configuration options
- Room size and capacity settings
- Base pricing per room type
- Room-specific amenities

---

### **Step 5: Policies & Rules**

**File**: `/modules/hotelManager/components/ModernPoliciesStep.tsx`

#### Purpose
- Check-in/check-out time configuration
- Cancellation policy setup
- House rules and restrictions

#### Animated SVG Icon
```typescript
const PoliciesAnimatedIcon = ({ isSelected, isCompleted, size = 32 }) => (
  <motion.div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-100 text-green-600' : 
      isSelected ? 'bg-gradient-partner text-white' : 'bg-gray-100 text-gray-600'
    }`}
    whileHover={{ scale: 1.1 }}
  >
    <motion.svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <motion.path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.polyline
        points="14,2 14,8 20,8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
      <motion.line
        x1="16"
        y1="13"
        x2="8"
        y2="13"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      />
      <motion.line
        x1="16"
        y1="17"
        x2="8"
        y2="17"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
      />
      <motion.polyline
        points="10,9 9,10 11,12"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1.2, duration: 0.3 }}
      />
    </motion.svg>
  </motion.div>
);
```

#### Key Features
- Check-in/out time selectors
- Cancellation policy templates
- House rules multi-select
- Pet and smoking policies
- Children policy configuration

---

### **Step 6: Photos & Media**

**File**: `/modules/hotelManager/components/CompleteHotelListingFlowSteps.tsx`

#### Purpose
- Professional photo upload
- Categorized image organization
- Image optimization and validation

#### Animated SVG Icon
```typescript
const PhotosAnimatedIcon = ({ isSelected, isCompleted, size = 32 }) => (
  <motion.div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-100 text-green-600' : 
      isSelected ? 'bg-gradient-partner text-white' : 'bg-gray-100 text-gray-600'
    }`}
    whileHover={{ scale: 1.1 }}
  >
    <motion.svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <motion.path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.circle
        cx="12"
        cy="13"
        r="4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      />
      {isSelected && (
        <motion.g>
          <motion.path
            d="M8 21l4-4 4 4"
            stroke="currentColor"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ delay: 1, duration: 0.5 }}
          />
          <motion.circle
            cx="12"
            cy="13"
            r="6"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.3, 0] }}
            transition={{ delay: 1.2, duration: 1, repeat: Infinity }}
          />
        </motion.g>
      )}
    </motion.svg>
  </motion.div>
);
```

#### Key Features
- Drag-and-drop photo upload
- Categorized galleries (Exterior, Rooms, Amenities, Dining)
- Image compression and optimization
- Photo arrangement and primary selection
- Professional photography tips

---

### **Step 7: Additional Services**

**File**: `/modules/hotelManager/components/ModernServicesStep.tsx`

#### Purpose
- Extra service configuration
- Accessibility features
- Language support setup

#### Animated SVG Icon
```typescript
const ServicesAnimatedIcon = ({ isSelected, isCompleted, size = 32 }) => (
  <motion.div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-100 text-green-600' : 
      isSelected ? 'bg-gradient-partner text-white' : 'bg-gray-100 text-gray-600'
    }`}
    whileHover={{ scale: 1.1 }}
  >
    <motion.svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 1.2 }}
      />
      {isSelected && (
        <motion.circle
          cx="12"
          cy="12"
          r="3"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.svg>
  </motion.div>
);
```

#### Key Features
- Additional services checklist
- Accessibility feature configuration
- Multi-language support setup
- Special assistance services
- Concierge and transfer options

---

### **Step 8: Review & Publish**

**File**: `/modules/hotelManager/components/CompleteHotelListingFlowSteps.tsx`

#### Purpose
- Comprehensive listing review
- Final validation and approval
- Publishing celebration

#### Animated SVG Icon
```typescript
const ReviewAnimatedIcon = ({ isSelected, isCompleted, size = 32 }) => (
  <motion.div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center ${
      isCompleted ? 'bg-green-100 text-green-600' : 
      isSelected ? 'bg-gradient-partner text-white' : 'bg-gray-100 text-gray-600'
    }`}
    whileHover={{ scale: 1.1 }}
  >
    <motion.svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <motion.polyline
        points="20,6 9,17 4,12"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      {isCompleted && (
        <motion.g>
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.g>
      )}
    </motion.svg>
  </motion.div>
);
```

#### Key Features
- Complete listing preview
- Section-by-section validation
- Edit functionality for each step
- Terms and conditions acceptance
- Publish confirmation with celebration

---

## Technical Implementation Details

### Progress Tracking System
```typescript
interface ListingProgress {
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  progressPercentage: number;
  isCompleted: boolean;
}

const useListingProgress = () => {
  const [progress, setProgress] = useState<ListingProgress>({
    currentStep: 1,
    completedSteps: [],
    totalSteps: 8,
    progressPercentage: 0,
    isCompleted: false
  });

  const completeStep = (stepId: number) => {
    setProgress(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, stepId],
      progressPercentage: ((prev.completedSteps.length + 1) / prev.totalSteps) * 100
    }));
  };

  return { progress, completeStep };
};
```

### Animation Configuration
```typescript
const stepTransitions = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: "easeInOut" }
};

const iconAnimations = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 },
  selected: { rotate: [0, 360] },
  completed: { scale: [1, 1.2, 1] }
};
```

### Data Structure
```typescript
interface HotelListingData {
  // Basic Information
  propertyType: string;
  hotelName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  
  // Location
  country: string;
  city: string;
  area: string;
  address: string;
  coordinates: { lat: number; lng: number };
  
  // Amenities & Features
  amenities: string[];
  
  // Rooms
  rooms: RoomConfiguration[];
  
  // Policies
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  houseRules: string[];
  
  // Media
  photos: PhotoGallery;
  
  // Services
  additionalServices: string[];
  languages: string[];
  accessibility: string[];
}
```

## Quality Assurance & Testing

### User Experience Testing
- [ ] Smooth animations on all devices
- [ ] Proper progress saving and restoration
- [ ] Step validation and error handling
- [ ] Mobile-first responsive design
- [ ] Dark mode compatibility

### Performance Optimization
- [ ] Lazy loading of step components
- [ ] Image compression and optimization
- [ ] Form data persistence
- [ ] Animation performance (60fps)
- [ ] Memory leak prevention

### Accessibility Compliance
- [ ] Screen reader compatibility
- [ ] Keyboard navigation support
- [ ] High contrast mode support
- [ ] Focus management
- [ ] ARIA labels and descriptions

## Flutter Migration Considerations

### Animation Mapping
- Motion/React animations → Flutter AnimationController
- SVG animations → CustomPainter with AnimatedBuilder
- Gesture animations → Flutter GestureDetector

### State Management
- React hooks → Provider/Riverpod
- Form state → Form validation framework
- Progress tracking → BLoC pattern

### UI Components
- Tailwind classes → Flutter Material/Cupertino themes
- Card components → Material Card widgets
- Input components → TextFormField with validation

This comprehensive documentation provides your Flutter development team with all necessary specifications to implement the hotel listing flow while maintaining the sophisticated user experience and visual consistency of the TripAvail platform.