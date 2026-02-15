# Premium iOS-Style Drawer Menu - Complete Documentation

## 📱 Overview

A minimalist, premium drawer menu with iOS 18-style animations, glassmorphism effects, and custom icon animations. Perfect for luxury travel and hotel booking applications.

---

## 🎨 Features

- ✨ **iOS 18 Dark Mode Aesthetic** - Modern iPhone feel with elastic spring animations
- 🎭 **Glassmorphism Design** - Frosted glass effects with backdrop blur
- 🎪 **Custom Icon Animations** - Each menu item has unique hover animations:
  - 📊 Dashboard → Rotates 360°
  - 👤 My Profile → Scales and pulses
  - ✈️ My Trips → Plane flies out and returns
  - 💖 Wishlist → Heart scales and pulses
  - 💳 Payment Methods → Card flips 180°
  - ⚙️ Account Settings → Gear rotates continuously
- 🌈 **Vibrant Gradients** - Premium color schemes for each menu item
- 🔄 **Smooth Transitions** - Elastic spring animations throughout
- 📱 **Responsive Design** - Adapts to different screen sizes
- 🎯 **User Role Badge** - Dynamic role display (Traveller, VIP, Premium, etc.)
- 📈 **Progress Bar** - Next tier progression with animated bar

---

## 📦 Installation

### 1. Install Required Packages

```bash
npm install motion lucide-react
# or
pnpm install motion lucide-react
# or
yarn add motion lucide-react
```

### 2. Package Versions

- `motion` (formerly Framer Motion)
- `lucide-react` (latest version)
- `react` (v18+)

---

## 🚀 Complete Component Code

### `DrawerMenu.tsx`

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Bell,
  LayoutDashboard,
  UserCircle,
  Plane,
  Heart,
  CreditCard,
  Settings,
  HelpCircle,
  Handshake,
  LogOut,
  Crown,
  Sparkles,
} from 'lucide-react';

export function DrawerMenu() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User Role (can be: VIP, Premium, Diamond, Platinum, Traveller, etc.)
  const userRole = 'Traveller';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', color: 'from-blue-500 to-indigo-600' },
    { icon: UserCircle, label: 'My Profile', color: 'from-purple-500 to-violet-600' },
    { icon: Plane, label: 'My Trips', color: 'from-cyan-500 to-blue-600' },
    { icon: Heart, label: 'Wishlist', color: 'from-pink-500 to-rose-600' },
    { icon: CreditCard, label: 'Payment Methods', color: 'from-emerald-500 to-teal-600' },
    { icon: Settings, label: 'Account Settings', color: 'from-slate-500 to-gray-600' },
  ];

  // iOS-style elastic spring animation configuration
  const spring = {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  };

  // Custom icon animation logic for each menu item
  const getIconAnimation = (label: string) => {
    switch(label) {
      case 'Dashboard':
        return { 
          hover: { rotate: 360 }, 
          transition: { duration: 0.6 } 
        };
      case 'My Profile':
        return { 
          hover: { scale: [1, 1.2, 1] }, 
          transition: { duration: 0.5 } 
        };
      case 'My Trips':
        return { 
          hover: { x: [0, 50, 0], y: [0, -15, 0] }, 
          transition: { duration: 0.8, ease: "easeInOut" } 
        };
      case 'Wishlist':
        return { 
          hover: { scale: [1, 1.3, 1] }, 
          transition: { duration: 0.5 } 
        };
      case 'Payment Methods':
        return { 
          hover: { rotateY: 180 }, 
          transition: { duration: 0.5 } 
        };
      case 'Account Settings':
        return { 
          hover: { rotate: 360 }, 
          transition: { duration: 1, ease: "linear" } 
        };
      default:
        return {};
    }
  };

  return (
    <div className="relative">
      {/* Menu Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={spring}
        onClick={() => setIsDrawerOpen(true)}
        className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50"
      >
        <Menu className="text-white" size={20} />
      </motion.button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer Menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={spring}
            className="fixed left-4 top-4 bottom-4 w-[360px] z-50"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={spring}
              className="h-full rounded-[40px] bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.3) transparent'
              }}
            >
              {/* Header */}
              <div className="relative p-6">
                {/* User Role Badge - Top Left */}
                <div className="absolute top-6 left-6">
                  <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg">
                    <span className="text-black font-bold text-[10px] flex items-center gap-1">
                      <Crown size={12} strokeWidth={3} />
                      {userRole}
                    </span>
                  </div>
                </div>

                {/* Close Button - Top Right */}
                <div className="absolute top-6 right-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="text-white" size={16} />
                  </motion.button>
                </div>

                {/* Profile Avatar - Centered */}
                <div className="flex flex-col items-center mt-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={spring}
                    className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl mb-4"
                  >
                    <UserCircle className="text-white" size={48} strokeWidth={2} />
                  </motion.div>

                  <h2 className="text-white text-xl font-bold mb-1">Sarah Anderson</h2>
                  <p className="text-white/50 text-sm">sarah.anderson@email.com</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pb-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-xs">Next Tier: Diamond ✦</span>
                    <span className="text-amber-400 text-xs font-bold">150 pts</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="px-6 pb-6">
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3">Menu</h3>
                
                <div className="space-y-1.5">
                  {menuItems.map((item) => {
                    const iconAnimation = getIconAnimation(item.label);

                    return (
                      <motion.button
                        key={item.label}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full group"
                      >
                        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors">
                          {/* Icon with Gradient Background */}
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                            <motion.div
                              whileHover={iconAnimation.hover}
                              transition={iconAnimation.transition}
                            >
                              <item.icon 
                                className="text-white" 
                                size={20} 
                                strokeWidth={2.5}
                                fill={item.label === 'Wishlist' ? 'currentColor' : 'none'}
                              />
                            </motion.div>
                          </div>

                          {/* Label */}
                          <span className="text-white text-sm font-medium flex-1">{item.label}</span>

                          {/* Arrow */}
                          <span className="text-white/30 text-lg">›</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Help & Support */}
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-1.5 group"
                >
                  <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <HelpCircle className="text-white" size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm font-medium">Help & Support</p>
                      <p className="text-white/40 text-[10px]">24/7 Concierge</p>
                    </div>
                    <span className="text-white/30 text-lg">›</span>
                  </div>
                </motion.button>

                {/* Become a Partner - Premium Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4"
                >
                  <div className="relative rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 p-4 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Handshake className="text-white" size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-bold">Become a Partner</p>
                        <p className="text-white/80 text-[10px]">Grow your business</p>
                      </div>
                      <span className="text-white text-lg">›</span>
                    </div>
                  </div>
                </motion.button>

                {/* Sign Out */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4"
                >
                  <div className="rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 p-3 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <LogOut className="text-red-400" size={16} strokeWidth={2.5} />
                      <span className="text-red-400 text-sm font-medium">Sign Out</span>
                    </div>
                  </div>
                </motion.button>
              </div>

              <div className="h-6" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 🎨 Tailwind CSS Configuration

### Required Tailwind Classes

The component uses **Tailwind CSS v4** with the following utility classes:

- **Spacing**: `p-{size}`, `px-{size}`, `py-{size}`, `gap-{size}`, `space-y-{size}`
- **Sizing**: `w-{size}`, `h-{size}`, `max-w-{size}`
- **Colors**: `bg-{color}/{opacity}`, `text-{color}/{opacity}`, `border-{color}/{opacity}`
- **Gradients**: `bg-gradient-to-{direction}`, `from-{color}`, `to-{color}`, `via-{color}`
- **Borders**: `border`, `border-{size}`, `rounded-{size}`
- **Shadows**: `shadow-{size}`, `shadow-{color}/{opacity}`
- **Backdrop**: `backdrop-blur-{size}`
- **Transitions**: `transition-{property}`, `duration-{time}`, `ease-{curve}`
- **Flexbox**: `flex`, `flex-col`, `items-{alignment}`, `justify-{alignment}`
- **Positioning**: `fixed`, `absolute`, `relative`, `inset-{size}`, `top-{size}`, `left-{size}`, etc.
- **Z-Index**: `z-{level}`
- **Overflow**: `overflow-{behavior}`

---

## 🎭 SVG Icons from Lucide React

### All Icons Used

```tsx
import {
  Menu,           // Hamburger menu icon
  X,              // Close button
  Bell,           // Notification bell (optional)
  LayoutDashboard, // Dashboard icon
  UserCircle,     // Profile/User icon
  Plane,          // Travel/Trips icon
  Heart,          // Wishlist/Favorites icon
  CreditCard,     // Payment methods icon
  Settings,       // Account settings icon (gear)
  HelpCircle,     // Help & support icon
  Handshake,      // Partnership icon
  LogOut,         // Sign out icon
  Crown,          // Premium/Role badge icon
  Sparkles,       // Optional decorative icon
} from 'lucide-react';
```

### Icon Properties

```tsx
<IconName 
  size={20}           // Icon size in pixels
  strokeWidth={2.5}   // Stroke thickness
  className="text-white"  // Tailwind color class
  fill="currentColor" // Fill color (optional, for solid icons)
/>
```

---

## 🎯 Animation Configurations

### Spring Animation Configuration

```tsx
const spring = {
  type: 'spring',
  stiffness: 400,  // How stiff the spring is (higher = faster)
  damping: 30,     // How much resistance (higher = less bouncy)
};
```

### Custom Icon Animations

| Menu Item | Animation | Description |
|-----------|-----------|-------------|
| **Dashboard** | `rotate: 360` | Rotates 360° clockwise |
| **My Profile** | `scale: [1, 1.2, 1]` | Scales up then back |
| **My Trips** | `x: [0, 50, 0], y: [0, -15, 0]` | Plane flies right & up, returns |
| **Wishlist** | `scale: [1, 1.3, 1]` | Heart pulses larger |
| **Payment Methods** | `rotateY: 180` | Card flips 180° |
| **Account Settings** | `rotate: 360` | Gear rotates continuously |

### Progress Bar Animation

```tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: '85%' }}
  transition={{ duration: 1, ease: "easeOut" }}
  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
/>
```

---

## 🎨 Color Schemes & Gradients

### Menu Item Gradients

```tsx
const gradients = {
  dashboard: 'from-blue-500 to-indigo-600',
  profile: 'from-purple-500 to-violet-600',
  trips: 'from-cyan-500 to-blue-600',
  wishlist: 'from-pink-500 to-rose-600',
  payment: 'from-emerald-500 to-teal-600',
  settings: 'from-slate-500 to-gray-600',
  help: 'from-amber-500 to-orange-600',
  partner: 'from-violet-600 to-purple-600',
};
```

### Background Gradients

```tsx
// Drawer background
bg-gradient-to-b from-gray-900/95 to-black/95

// Role badge
bg-gradient-to-r from-amber-400 to-yellow-500

// Progress bar
bg-gradient-to-r from-amber-400 to-yellow-500
```

---

## 🔧 Customization Options

### 1. Change User Role

```tsx
const userRole = 'Premium';  // Options: VIP, Diamond, Platinum, Gold, Traveller, etc.
```

### 2. Update User Information

```tsx
<h2 className="text-white text-xl font-bold mb-1">John Doe</h2>
<p className="text-white/50 text-sm">john.doe@email.com</p>
```

### 3. Modify Progress Bar

```tsx
// Change progress percentage
animate={{ width: '65%' }}

// Change tier name
<span className="text-white/70 text-xs">Next Tier: Gold ✦</span>

// Change points needed
<span className="text-amber-400 text-xs font-bold">250 pts</span>
```

### 4. Add/Remove Menu Items

```tsx
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', color: 'from-blue-500 to-indigo-600' },
  // Add your custom menu item
  { icon: YourIcon, label: 'Your Label', color: 'from-{color} to-{color}' },
];
```

### 5. Change Drawer Position

```tsx
// Left side (default)
className="fixed left-4 top-4 bottom-4 w-[360px] z-50"

// Right side
className="fixed right-4 top-4 bottom-4 w-[360px] z-50"

// Change animation
initial={{ x: '-100%' }}  // From left
initial={{ x: '100%' }}   // From right
```

### 6. Adjust Drawer Width

```tsx
// Default: 360px
w-[360px]

// Wider
w-[400px]

// Narrower
w-[320px]
```

---

## 📱 Responsive Design

### Mobile Optimization

```tsx
// Adjust for smaller screens
className="fixed left-2 right-2 top-2 bottom-2 w-full max-w-[360px] z-50"
```

### Tablet & Desktop

```tsx
// Center on larger screens
className="fixed left-4 top-4 bottom-4 w-[360px] max-w-[90vw] z-50"
```

---

## 🎪 Glassmorphism Effect

### Backdrop Blur

```tsx
// Drawer background
backdrop-blur-3xl

// Overlay
backdrop-blur-lg
```

### Transparency Levels

```tsx
// Drawer
from-gray-900/95 to-black/95  // 95% opacity

// Overlay
bg-black/60  // 60% opacity

// Hover states
bg-white/5   // 5% opacity
bg-white/10  // 10% opacity
bg-white/20  // 20% opacity
```

---

## 🚦 Usage Example

### Basic Implementation

```tsx
import { DrawerMenu } from './components/DrawerMenu';

function App() {
  return (
    <div className="relative h-screen bg-black">
      {/* Your app content */}
      
      {/* Drawer Menu */}
      <DrawerMenu />
    </div>
  );
}
```

### With State Management

```tsx
import { useState } from 'react';
import { DrawerMenu } from './components/DrawerMenu';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative h-screen bg-black">
      {/* Trigger button */}
      <button onClick={() => setIsOpen(true)}>
        Open Menu
      </button>
      
      {/* Drawer Menu with controlled state */}
      <DrawerMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. **Performance**
- Use `AnimatePresence` for smooth exit animations
- Implement `whileHover` instead of CSS hover for better control
- Use `motion.div` only when animation is needed

### 2. **Accessibility**
```tsx
// Add ARIA labels
<button aria-label="Open menu" onClick={() => setIsDrawerOpen(true)}>
  <Menu />
</button>

// Add keyboard support
<button 
  onClick={() => setIsDrawerOpen(false)}
  onKeyDown={(e) => e.key === 'Escape' && setIsDrawerOpen(false)}
>
  <X />
</button>
```

### 3. **Mobile Considerations**
- Test touch interactions on actual devices
- Ensure sufficient touch target sizes (minimum 44x44px)
- Add `touch-action` CSS property if needed

### 4. **Dark Mode**
- Use opacity-based colors: `text-white/60`, `bg-black/95`
- Implement subtle borders: `border-white/10`
- Use glassmorphism for depth

---

## 🐛 Troubleshooting

### Issue: Icons not showing
**Solution:** Make sure `lucide-react` is installed:
```bash
npm install lucide-react
```

### Issue: Animations not working
**Solution:** Verify `motion` package is installed:
```bash
npm install motion
```

### Issue: Drawer appears behind content
**Solution:** Increase z-index values:
```tsx
className="... z-50"  // Drawer
className="... z-40"  // Overlay
```

### Issue: Scrollbar visible on drawer
**Solution:** Use custom scrollbar styling:
```tsx
style={{
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255,255,255,0.3) transparent'
}}
```

---

## 📄 License

This component is free to use in personal and commercial projects.

---

## 🤝 Credits

- **Icons:** [Lucide React](https://lucide.dev)
- **Animations:** [Motion](https://motion.dev) (Framer Motion)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Design Inspiration:** iOS 18 & Modern Premium Travel Apps

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the customization options
3. Inspect browser console for errors
4. Verify all dependencies are installed

---

**Made with ❤️ for premium travel applications**
