# TripAvail - Traveler Drawer Menu Documentation

## Overview
This document provides complete code reference and specifications for the TripAvail traveler drawer menu. The drawer follows Airbnb's clean design principles with strategic use of Rose accent colors and sophisticated animations.

---

## Architecture

### Component Structure
```
DrawerManager (Main Container)
├── Overlay (Black backdrop)
└── Drawer Panel (Sliding from left)
    ├── Close Button
    ├── DrawerHeader (Profile section)
    ├── QuickActions (Optional action buttons)
    ├── DrawerMenu (Navigation items)
    └── PartnerModeSwitch (Bottom section)
        ├── "Become a Partner" button (for travelers)
        └── Footer
```

### File Locations
- **Main Manager**: `/modules/drawer/DrawerManager.tsx`
- **Traveler Items**: `/modules/traveler/drawer/items.ts`
- **Header Component**: `/components/composite/DrawerHeader.tsx`
- **Menu Component**: `/components/composite/DrawerMenu.tsx`
- **Quick Actions**: `/components/composite/QuickActions.tsx`
- **Partner Switch**: `/components/composite/PartnerModeSwitch.tsx`
- **Icon Components**: `/components/icons/drawer/SimpleAnimatedDrawerIcons.tsx`
- **Type Definitions**: `/modules/types/drawer.ts`

---

## Design Specifications

### Colors
- **Accent Color**: `#ff5a5f` (Airbnb Rose - used for selected indicator and active icons)
- **Background**: `white` in light mode, `dark:bg-card` in dark mode
- **Text Primary**: `text-gray-900` in light mode, `dark:text-foreground` in dark mode
- **Text Secondary**: `text-gray-600` in light mode, `dark:text-muted-foreground` in dark mode
- **Border**: `border-gray-100` in light mode, `dark:border-border` in dark mode
- **Hover State**: `bg-gray-50` in light mode, `dark:bg-gray-800` in dark mode

### Dimensions
- **Drawer Width**: `320px` (w-80)
- **Height**: Full viewport height
- **Overlay**: Full screen with `bg-black/50` opacity
- **Icon Size**: `20px` default
- **Border Radius**: `12px` (rounded-xl) for most elements
- **Selection Indicator**: `4px` width, full height, rounded right

### Animations
- **Drawer Slide**: Spring animation with `damping: 25, stiffness: 200`
- **Overlay Fade**: Opacity transition
- **Menu Items**: Staggered entrance with 50ms delay between items
- **Icons**: Scale animation (1.1x) when active, color change, rotation effects
- **Buttons**: Scale down to 0.98x on tap
- **Selection Indicator**: Spring animation with `stiffness: 400, damping: 30`

### Z-Index Layers
- **Overlay**: `z-[55]`
- **Drawer Panel**: `z-[60]`

---

## Complete Code

### 1. Type Definitions (`/modules/types/drawer.ts`)

```typescript
import { LucideIcon } from 'lucide-react';

// Individual drawer menu item
export interface DrawerItem {
  id: string;                           // Unique identifier for the item
  label: string;                        // Display text
  icon: LucideIcon;                    // Icon component (animated)
  screen: string;                       // Screen/view to navigate to
  badge?: string | null;               // Optional badge text (e.g., "2 upcoming")
  type: 'navigation' | 'support';      // Item category for grouping
  tourId?: string;                     // Optional tour step ID
}

// Quick action button (optional feature)
export interface QuickAction {
  id: string;                          // Unique identifier
  label: string;                       // Display text
  description: string;                 // Subtitle text
  icon: LucideIcon;                   // Icon component
  action: string;                      // Action identifier
  color: string;                       // Background color for icon circle
}

// User profile metadata displayed in header
export interface DrawerMeta {
  userName: string;                    // User's display name
  userEmail: string;                   // User's email
  userRole: string;                    // Role display text
  userLocation: string;                // Location (e.g., "Pakistan")
  isVerified: boolean;                 // Verification status
  profileCompletion: number;           // Percentage (0-100)
}

// Theme configuration for drawer styling
export type DrawerTheme = {
  accentColor: string;                 // Primary accent color
  selectedIndicatorColor: string;      // Color for active item indicator
  iconSelectedColor: string;           // Color for active icons
  iconHoverColor: string;              // Color for hovered icons
};
```

---

### 2. Traveler Drawer Items (`/modules/traveler/drawer/items.ts`)

```typescript
import { 
  SimpleAnimatedDrawerIcons
} from '../../../components/icons/drawer/SimpleAnimatedDrawerIcons';
import type { DrawerItem } from '../../types/drawer';

// Navigation items for traveler role
export const travelerDrawerItems: DrawerItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: SimpleAnimatedDrawerIcons.Dashboard,
    screen: 'home',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'profile',
    label: 'My Profile',
    icon: SimpleAnimatedDrawerIcons.Profile,
    screen: 'profile',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'my-trips',
    label: 'My Trips',
    icon: SimpleAnimatedDrawerIcons.Trips,
    screen: 'my-trips',
    badge: '2 upcoming',                 // Dynamic badge showing trip count
    type: 'navigation'
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: SimpleAnimatedDrawerIcons.Wishlist,
    screen: 'wishlist',
    badge: '12 saved',                   // Dynamic badge showing saved items count
    type: 'navigation'
  },
  {
    id: 'payment-methods',
    label: 'Payment Methods',
    icon: SimpleAnimatedDrawerIcons.Payment,
    screen: 'payment-methods',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'account-settings',
    label: 'Account Settings',
    icon: SimpleAnimatedDrawerIcons.Settings,
    screen: 'account-settings',
    badge: null,
    type: 'navigation'
  },

  // Support section item
  {
    id: 'help',
    label: 'Help & Support',
    icon: SimpleAnimatedDrawerIcons.Help,
    screen: 'help',
    badge: null,
    type: 'support'                      // Separated from navigation items
  }
];

// Quick actions (currently empty for travelers - kept simple)
export const travelerQuickActions = [];
```

---

### 3. Drawer Header Component (`/components/composite/DrawerHeader.tsx`)

```typescript
import { motion } from 'motion/react';
import { Edit2, MapPin, Building, Plane } from 'lucide-react';
import { ProfileAvatar } from '../ProfileAvatar';
import { VerifiedPill } from './VerifiedPill';
import type { DrawerMeta } from '../../modules/types/drawer';
import type { UserRole } from '../../lib/types';

interface DrawerHeaderProps {
  meta: DrawerMeta;                    // User metadata
  role: UserRole;                      // Current user role
  onEditProfile?: () => void;          // Edit button callback
}

export function DrawerHeader({ meta, role, onEditProfile }: DrawerHeaderProps) {
  // Get role-specific icon
  const getRoleIcon = () => {
    switch (role) {
      case 'hotel_manager':
        return Building;
      case 'tour_operator':
        return Plane;
      default:
        return MapPin;                 // For travelers
    }
  };

  // Get role display name
  const getRoleDisplayName = () => {
    switch (role) {
      case 'hotel_manager':
        return 'Hotel Manager';
      case 'tour_operator':
        return 'Tour Operator';
      default:
        return 'Traveler';
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <motion.div
      className="mb-4"
      // Entrance animation
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Profile Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar component - displays first letter of name */}
        <ProfileAvatar name={meta.userName} />
        
        <div className="flex-1">
          {/* Name and edit button row */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">
              {meta.userName}
            </h3>
            <button 
              onClick={onEditProfile}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
            </button>
          </div>
          
          {/* Email */}
          <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2">
            {meta.userEmail}
          </p>
          
          {/* Role and location row */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground mb-2">
            <RoleIcon className="w-4 h-4" />
            <span>{getRoleDisplayName()} • {meta.userLocation}</span>
          </div>
          
          {/* Verified badge */}
          <VerifiedPill isVerified={meta.isVerified} />
        </div>
      </div>

      {/* Profile Completion Progress */}
      <div className="mb-4">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-foreground">
            Profile Completion
          </span>
          {/* Percentage in accent color */}
          <span className="text-sm font-semibold text-[#DB2777]">
            {meta.profileCompletion}%
          </span>
        </div>
        
        {/* Progress bar track */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          {/* Animated progress fill with gradient */}
          <motion.div 
            className="h-2 rounded-full bg-gradient-to-r from-[#DB2777] to-[#7C3AED]"
            initial={{ width: 0 }}
            animate={{ width: `${meta.profileCompletion}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
```

---

### 4. Quick Actions Component (`/components/composite/QuickActions.tsx`)

```typescript
import { motion } from 'motion/react';
import type { QuickAction } from '../../modules/types/drawer';

interface QuickActionsProps {
  actions: QuickAction[];              // Array of quick action buttons
  onActionClick: (actionId: string) => void;  // Click handler
  animationDelay?: number;             // Stagger delay for entrance
}

export function QuickActions({ 
  actions, 
  onActionClick, 
  animationDelay = 0.2 
}: QuickActionsProps) {
  // Don't render if no actions provided
  if (actions.length === 0) return null;

  return (
    <motion.div
      className="mb-4 space-y-2"
      // Container entrance animation
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={() => onActionClick(action.id)}
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 group text-left"
          // Hover scale effect
          whileHover={{ scale: 1.02 }}
          // Tap scale effect
          whileTap={{ scale: 0.98 }}
          // Staggered entrance for each action
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: animationDelay + 0.1 + index * 0.05 }}
        >
          {/* Icon circle with action-specific color */}
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: action.color }}
          >
            <action.icon className="w-4 h-4 text-white" />
          </div>
          
          {/* Text content */}
          <div>
            <span className="font-medium text-gray-900 dark:text-foreground">
              {action.label}
            </span>
            <p className="text-xs text-gray-600 dark:text-muted-foreground">
              {action.description}
            </p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
```

---

### 5. Drawer Menu Component (`/components/composite/DrawerMenu.tsx`)

```typescript
import { motion } from 'motion/react';
import type { DrawerItem, DrawerTheme } from '../../modules/types/drawer';

interface DrawerMenuProps {
  items: DrawerItem[];                 // Menu items to display
  selectedItemId: string;              // Currently selected item ID
  theme: DrawerTheme;                  // Theme colors
  onItemClick: (itemId: string, screen: string) => void;  // Click handler
  animationDelay?: number;             // Base delay for stagger
}

export function DrawerMenu({ 
  items, 
  selectedItemId, 
  theme, 
  onItemClick, 
  animationDelay = 0.25 
}: DrawerMenuProps) {
  // Separate navigation and support items
  const navigationItems = items.filter(item => item.type === 'navigation');
  const supportItems = items.filter(item => item.type === 'support');

  // Render individual menu item
  const renderMenuItem = (item: DrawerItem, index: number, isSupport = false) => {
    const isSelected = selectedItemId === item.id;

    return (
      <motion.button
        key={item.id}
        onClick={() => onItemClick(item.id, item.screen)}
        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group text-left relative overflow-hidden ${
          isSelected 
            ? 'bg-gray-50 dark:bg-gray-800'       // Selected state background
            : 'hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-800'  // Hover state
        }`}
        // Staggered entrance animation
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animationDelay + index * 0.05 }}
        // Tap effect
        whileTap={{ scale: 0.98 }}
        // For feature tours
        data-tour={item.tourId}
      >
        {/* Selection indicator - animated bar on left edge */}
        {isSelected && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
            style={{ backgroundColor: theme.selectedIndicatorColor }}
            // Shared layout ID for smooth transitions between items
            layoutId="selectedIndicator"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        
        {/* Icon - uses animated icon component */}
        <div>
          <item.icon
            isActive={isSelected}
            size={20}
          />
        </div>
        
        {/* Text content */}
        <div className="flex-1">
          <span className="font-medium text-gray-900 dark:text-foreground">
            {item.label}
          </span>
          {/* Optional badge (e.g., "2 upcoming") */}
          {item.badge && (
            <div className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
              {item.badge}
            </div>
          )}
        </div>

      </motion.button>
    );
  };

  return (
    <nav className="flex-1 space-y-1 mb-4">
      {/* Navigation Items Section */}
      {navigationItems.map((item, index) => renderMenuItem(item, index))}

      {/* Support Items Section - separated with padding */}
      {supportItems.length > 0 && (
        <div className="pt-4">
          {supportItems.map((item, index) => 
            renderMenuItem(item, navigationItems.length + index, true)
          )}
        </div>
      )}
    </nav>
  );
}
```

---

### 6. Partner Mode Switch (`/components/composite/PartnerModeSwitch.tsx`)

```typescript
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface PartnerModeSwitchProps {
  isPartnerMode: boolean;              // True if user is hotel manager or tour operator
  onSwitchToTraveler: () => void;      // Switch to traveler mode callback
  onBecomePartner: () => void;         // Become partner callback
  animationDelay?: number;             // Entrance animation delay
}

export function PartnerModeSwitch({ 
  isPartnerMode, 
  onSwitchToTraveler, 
  onBecomePartner, 
  animationDelay = 0.5 
}: PartnerModeSwitchProps) {
  
  // Show "Switch to Traveler Mode" for partners
  if (isPartnerMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animationDelay }}
      >
        <div className="border-t border-gray-200 dark:border-border pt-4">
          <motion.button
            onClick={onSwitchToTraveler}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-muted-foreground" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-foreground">
                Switch to Traveler Mode
              </h3>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                Browse and book trips as a traveler
              </p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Show "Become a Partner" for travelers
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      <div className="border-t border-gray-200 dark:border-border pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-3">
          Partner with us
        </h4>
        {/* Gradient button with Rose to Purple gradient */}
        <motion.button
          onClick={onBecomePartner}
          className="w-full p-3 bg-gradient-to-r from-[#DB2777] to-[#7C3AED] rounded-2xl border border-gray-200 dark:border-border hover:from-[#BE185D] hover:to-[#6D28D9] transition-all text-left shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <h3 className="font-semibold text-white mb-1">Become a Partner</h3>
          <p className="text-sm text-white/90">Join TripAvail and grow your business</p>
        </motion.button>
      </div>
    </motion.div>
  );
}
```

---

### 7. Drawer Manager (Main Component) (`/modules/drawer/DrawerManager.tsx`)

```typescript
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { DrawerHeader } from '../../components/composite/DrawerHeader';
import { QuickActions } from '../../components/composite/QuickActions';
import { DrawerMenu } from '../../components/composite/DrawerMenu';
import { PartnerModeSwitch } from '../../components/composite/PartnerModeSwitch';
import { travelerDrawerItems, travelerQuickActions } from '../traveler/drawer/items';
import { hotelManagerDrawerItems, hotelManagerQuickActions } from '../hotelManager/drawer/items';
import { tourOperatorDrawerItems, tourOperatorQuickActions } from '../tourOperator/drawer/items';
import type { DrawerMeta, DrawerTheme } from '../types/drawer';
import type { UserRole } from '../../lib/types';

interface DrawerManagerProps {
  isOpen: boolean;                     // Drawer visibility
  onClose: () => void;                 // Close drawer callback
  role: UserRole;                      // Current user role
  selectedItemId: string;              // Active menu item
  onItemClick: (itemId: string, screen: string) => void;  // Menu item click handler
  onQuickActionClick: (actionId: string) => void;         // Quick action click handler
  onSwitchToTraveler: () => void;      // Switch to traveler mode
  onBecomePartner: () => void;         // Become partner flow
  meta: DrawerMeta;                    // User metadata
}

export function DrawerManager({
  isOpen,
  onClose,
  role,
  selectedItemId,
  onItemClick,
  onQuickActionClick,
  onSwitchToTraveler,
  onBecomePartner,
  meta
}: DrawerManagerProps) {
  
  // Get role-specific drawer configuration
  const getDrawerData = () => {
    switch (role) {
      case 'hotel_manager':
        return {
          items: hotelManagerDrawerItems,
          actions: hotelManagerQuickActions,
          theme: {
            accentColor: '#ff5a5f',
            selectedIndicatorColor: '#ff5a5f',
            iconSelectedColor: '#ff5a5f',
            iconHoverColor: '#000000'
          } as DrawerTheme
        };
      case 'tour_operator':
        return {
          items: tourOperatorDrawerItems,
          actions: tourOperatorQuickActions,
          theme: {
            accentColor: '#ff5a5f',
            selectedIndicatorColor: '#ff5a5f',
            iconSelectedColor: '#ff5a5f',
            iconHoverColor: '#000000'
          } as DrawerTheme
        };
      default:  // Traveler role
        return {
          items: travelerDrawerItems,
          actions: travelerQuickActions,
          theme: {
            accentColor: '#ff5a5f',
            selectedIndicatorColor: '#ff5a5f',
            iconSelectedColor: '#ff5a5f',
            iconHoverColor: '#000000'
          } as DrawerTheme
        };
    }
  };

  const { items, actions, theme } = getDrawerData();
  const isPartnerMode = role !== 'traveler';

  return (
    <>
      {/* Overlay - Black semi-transparent backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}  // Close on backdrop click
          />
        )}
      </AnimatePresence>

      {/* Drawer Panel - Slides in from left */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 left-0 h-full w-80 bg-white dark:bg-card shadow-2xl z-[60]"
            // Slide animation from left
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="h-full flex flex-col">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-2">
                {/* Close Button - Top right */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400 dark:text-muted-foreground" />
                  </button>
                </div>

                {/* Profile Header Section */}
                <DrawerHeader 
                  meta={meta}
                  role={role}
                  onEditProfile={() => onItemClick('settings', 'settings')}
                />

                {/* Quick Action Buttons (currently empty for travelers) */}
                <QuickActions 
                  actions={actions}
                  onActionClick={onQuickActionClick}
                />

                {/* Navigation Menu Items */}
                <DrawerMenu
                  items={items}
                  selectedItemId={selectedItemId}
                  theme={theme}
                  onItemClick={onItemClick}
                />

              </div>

              {/* Sticky Bottom Section - Always visible, doesn't scroll */}
              <div className="flex-shrink-0 space-y-4 bg-white dark:bg-card px-4 pb-4 border-t border-gray-100 dark:border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {/* Partner Mode Switch / Become Partner Button */}
                <PartnerModeSwitch
                  isPartnerMode={isPartnerMode}
                  onSwitchToTraveler={onSwitchToTraveler}
                  onBecomePartner={onBecomePartner}
                />

                {/* Footer - Version info */}
                <div className="pt-3 border-t border-gray-100 dark:border-border">
                  <p className="text-xs text-gray-400 dark:text-muted-foreground text-center">
                    Version 1.0.0 • Made with ❤️
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

### 8. Animated Icon Examples (`/components/icons/drawer/SimpleAnimatedDrawerIcons.tsx`)

#### Example: Dashboard Icon

```typescript
import { motion } from 'motion/react';

interface SimpleAnimatedIconProps {
  isActive?: boolean;                  // Active state
  size?: number;                       // Icon size in pixels
}

// Helper function to determine icon color based on state
const iconColor = (isActive: boolean) => {
  if (isActive) return '#ff5a5f';      // Rose accent when active
  // Check if we're in dark mode
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? '#a1a1aa' : '#6b7280';  // Gray when inactive
};

// Dashboard Icon - Grid layout with animation
export const SimpleAnimatedDashboardIcon = ({ 
  isActive = false, 
  size = 20 
}: SimpleAnimatedIconProps) => (
  <motion.div
    // Scale up when active
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      // 3D rotation effect when active
      animate={{
        rotateY: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      {/* Top-left grid square */}
      <motion.rect
        x="3"
        y="3"
        width="8"
        height="8"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {/* Top-right grid rectangle */}
      <motion.rect
        x="13"
        y="3"
        width="8"
        height="5"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {/* Bottom-right large rectangle */}
      <motion.rect
        x="13"
        y="10"
        width="8"
        height="11"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {/* Bottom-left grid square */}
      <motion.rect
        x="3"
        y="13"
        width="8"
        height="8"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {/* Center pulse effect when active */}
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="1"
          fill={iconColor(isActive)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 1],
            opacity: [0, 0.8, 0.6]
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);
```

#### Example: Profile Icon

```typescript
// Profile Icon - User avatar with ripple effect
export const SimpleAnimatedProfileIcon = ({ 
  isActive = false, 
  size = 20 
}: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 15, 0] : 0
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      {/* Head circle */}
      <motion.circle
        cx="12"
        cy="8"
        r="4"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {/* Shoulders/body path */}
      <motion.path
        d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {/* Ripple effect when active */}
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke={iconColor(isActive)}
          strokeWidth={0.8}
          fill="none"
          opacity={0.3}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ 
            scale: [0.3, 1.1, 1.3],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);
```

#### Example: Wishlist Icon (Heart)

```typescript
// Wishlist Icon - Heart with fill and pulse
export const SimpleAnimatedWishlistIcon = ({ 
  isActive = false, 
  size = 20 
}: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      // Wiggle animation when active
      animate={{
        rotateZ: isActive ? [0, -10, 10, 0] : 0
      }}
      transition={{
        duration: 0.8,
        ease: "easeInOut"
      }}
    >
      {/* Heart path */}
      <motion.path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        // Fill heart when active
        fill={isActive ? iconColor(isActive) : "none"}
        fillOpacity={isActive ? 0.2 : 0}
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
          fill: isActive ? iconColor(isActive) : "none",
          fillOpacity: isActive ? 0.2 : 0
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      />
      
      {/* Pulse effect when active */}
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="8"
          stroke={iconColor(isActive)}
          strokeWidth={0.8}
          fill="none"
          opacity={0.3}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.3, 1.6],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);
```

---

## Usage Example

### In App.tsx (Integration)

```typescript
import { useState } from 'react';
import { DrawerManager } from './modules/drawer/DrawerManager';
import type { UserRole } from './lib/types';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('traveler');

  // User metadata (would come from backend in production)
  const userMeta = {
    userName: 'Maria',
    userEmail: 'maria@example.com',
    userRole: 'Traveler',
    userLocation: 'Pakistan',
    isVerified: true,
    profileCompletion: 85
  };

  // Handle menu item click
  const handleMenuItemClick = (itemId: string, screen: string) => {
    console.log(`Navigate to: ${screen}`);
    setSelectedMenuItem(itemId);
    setDrawerOpen(false);  // Close drawer after selection
  };

  // Handle quick action click
  const handleQuickActionClick = (actionId: string) => {
    console.log(`Quick action: ${actionId}`);
    setDrawerOpen(false);
  };

  // Switch to traveler mode
  const handleSwitchToTraveler = () => {
    setCurrentRole('traveler');
    setDrawerOpen(false);
  };

  // Open partner selection modal
  const handleBecomePartner = () => {
    console.log('Open partner selection modal');
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Hamburger button */}
      <button 
        onClick={() => setDrawerOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        ☰
      </button>

      {/* Drawer */}
      <DrawerManager
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={currentRole}
        selectedItemId={selectedMenuItem}
        onItemClick={handleMenuItemClick}
        onQuickActionClick={handleQuickActionClick}
        onSwitchToTraveler={handleSwitchToTraveler}
        onBecomePartner={handleBecomePartner}
        meta={userMeta}
      />

      {/* Main content */}
      <div className="p-8">
        <h1>TripAvail - Traveler Dashboard</h1>
      </div>
    </div>
  );
}

export default App;
```

---

## Flutter Conversion Notes

### Key Considerations for Flutter Developers

1. **Animation Library**
   - Motion/React animations → Flutter's `AnimationController` and `AnimatedBuilder`
   - Spring animations → Use `Curves.elasticOut` or custom spring curves
   - Stagger animations → Use `Interval` with delays

2. **Layout Structure**
   ```
   Stack (for overlay + drawer)
   ├── GestureDetector (overlay - dismissible)
   └── AnimatedPositioned (drawer panel)
       └── Column
           ├── Expanded (scrollable content)
           └── Container (sticky bottom)
   ```

3. **Styling Equivalents**
   - `rounded-xl` = `BorderRadius.circular(12)`
   - `gap-4` = `SizedBox(width/height: 16)`
   - `p-3` = `EdgeInsets.all(12)`
   - `shadow-2xl` = `BoxShadow with large blur`
   - `dark:` prefix = Use `Theme.of(context).brightness` checks

4. **Animation Values**
   - Drawer slide: `Duration: 300ms, Curve: Curves.easeOutCubic`
   - Icon scale: `1.0 → 1.1` when active
   - Stagger delay: `50ms` between items
   - Spring stiffness 400, damping 30 → `Curves.elasticOut`

5. **State Management**
   - Use `StatefulWidget` for drawer state
   - Consider `Provider` or `Riverpod` for role management
   - `selectedItemId` as local state

6. **Icon Implementation**
   - Custom paint for animated SVG icons
   - Or use Flutter's Icon widget with scale/rotation transforms
   - Color transitions using `ColorTween`

7. **Responsive Considerations**
   - Drawer width: `320` logical pixels
   - Use `MediaQuery` for screen size checks
   - Consider tablet landscape → full-width drawer

---

## Feature Specifications

### Navigation Items
1. **Dashboard** - User's personalized homepage with stats
2. **My Profile** - User profile management
3. **My Trips** - Active and past bookings (badge shows upcoming count)
4. **Wishlist** - Saved packages (badge shows saved count)
5. **Payment Methods** - Saved cards and payment options
6. **Account Settings** - App preferences and security
7. **Help & Support** - Customer support (separated as support item)

### Interactive States
- **Default**: Gray icon, no background
- **Hover**: Light gray background, slight opacity change
- **Active/Selected**: Rose accent indicator bar, scaled icon, gray background
- **Tap**: Scale down to 0.98x

### Accessibility
- All buttons have proper touch targets (minimum 48x48 logical pixels)
- Clear visual feedback for all interactions
- Semantic labels for screen readers (via tourId)
- High contrast text (WCAG AA compliant)

### Dark Mode Support
- All colors have dark mode variants using `dark:` prefix
- Icon colors adapt based on theme
- Borders and backgrounds use theme-aware colors

---

## Implementation Checklist for Flutter

- [ ] Create drawer overlay with tap-to-dismiss
- [ ] Implement slide-in animation from left
- [ ] Build profile header with avatar and progress bar
- [ ] Create menu item component with selection indicator
- [ ] Implement animated icons (Dashboard, Profile, Trips, Wishlist, Payment, Settings, Help)
- [ ] Add stagger animation for menu items
- [ ] Build partner mode switch component
- [ ] Add tap scale effects (whileTap equivalent)
- [ ] Implement dark mode color switching
- [ ] Add badge support for menu items
- [ ] Create sticky bottom section
- [ ] Test on various screen sizes
- [ ] Ensure smooth 60fps animations
- [ ] Add haptic feedback on interactions
- [ ] Test accessibility features

---

## Animation Timeline

```
0ms    - Drawer starts sliding in
        - Overlay fades in
100ms  - Header fades in and slides up
200ms  - Quick actions fade in (if any)
250ms  - First menu item appears
300ms  - Second menu item appears (50ms after first)
350ms  - Third menu item appears
400ms  - Fourth menu item appears
450ms  - Fifth menu item appears
500ms  - Support items appear
        - Partner switch appears
        - Progress bar starts animating
1500ms - Progress bar animation complete
```

---

## Performance Notes

- All animations use GPU-accelerated transforms (translate, scale, rotate)
- List rendering is optimized (no re-renders on hover)
- Icons are SVG for crisp display at any resolution
- Overlay uses backdrop-filter for blur effect (optional)
- Drawer content is lazy-loaded
- Scroll performance maintained with proper overflow handling

---

## Testing Scenarios

1. **Open/Close**: Verify smooth slide animation
2. **Item Selection**: Test indicator animation and color change
3. **Icon Animations**: Check all 7 icon states
4. **Badge Updates**: Verify dynamic badge rendering
5. **Progress Bar**: Test fill animation
6. **Dark Mode**: Toggle and verify all colors
7. **Responsive**: Test on mobile, tablet, desktop
8. **Partner Switch**: Verify role switching
9. **Accessibility**: Screen reader navigation
10. **Performance**: Monitor frame rate during animations

---

## Color Reference

### Light Mode
```
Background:       #FFFFFF
Text Primary:     #111827 (gray-900)
Text Secondary:   #4B5563 (gray-600)
Border:           #F3F4F6 (gray-100)
Hover BG:         #F9FAFB (gray-50)
Accent:           #ff5a5f (Rose)
Progress Start:   #DB2777 (Pink-600)
Progress End:     #7C3AED (Purple-600)
```

### Dark Mode
```
Background:       #1F2937 (card)
Text Primary:     #F9FAFB (foreground)
Text Secondary:   #9CA3AF (muted-foreground)
Border:           #374151 (border)
Hover BG:         #374151 (gray-800)
Accent:           #ff5a5f (Rose)
Progress Start:   #DB2777 (Pink-600)
Progress End:     #7C3AED (Purple-600)
```

---

## Backend Integration

### API Endpoints (Example)

```typescript
// Get user profile data
GET /api/user/profile
Response: {
  userName: string,
  userEmail: string,
  userLocation: string,
  isVerified: boolean,
  profileCompletion: number
}

// Get trip counts for badges
GET /api/user/trips/summary
Response: {
  upcomingTrips: number,
  savedItems: number
}

// Update selected menu item (analytics)
POST /api/user/navigation
Body: {
  itemId: string,
  screen: string,
  timestamp: Date
}
```

---

## Version History

- **v1.0.0** (Current)
  - Initial implementation
  - 7 navigation items
  - Animated icons
  - Partner mode switch
  - Dark mode support
  - Profile completion progress

---

## Credits

**Design System**: Airbnb-inspired minimalist UI  
**Animations**: Motion/React (Framer Motion successor)  
**Icons**: Custom SVG with lucide-react as fallback  
**Color Palette**: Rose accent with purple gradients  
**Created for**: TripAvail mobile-first travel application  

---

*End of Documentation*
