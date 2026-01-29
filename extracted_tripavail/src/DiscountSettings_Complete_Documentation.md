# Discount Settings Step - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Design System & Brand Guidelines](#design-system--brand-guidelines)
3. [UI/UX Specifications](#uiux-specifications)
4. [Feature Components](#feature-components)
5. [State Management](#state-management)
6. [Animations & Interactions](#animations--interactions)
7. [Flutter Implementation](#flutter-implementation)
8. [Backend Integration](#backend-integration)
9. [Validation & Error Handling](#validation--error-handling)
10. [Accessibility](#accessibility)

---

## Overview

### Purpose
The Discount Settings step allows hotel managers to configure promotional discounts for their property listings. This feature enables competitive pricing strategies and helps attract more bookings through limited-time offers.

### User Flow Position
- **Previous Step:** Amenities & Features
- **Current Step:** Discount Settings
- **Next Step:** Photos & Media Upload (or Pricing Configuration)

### Key Objectives
1. Enable hotel managers to offer promotional discounts
2. Provide flexible discount percentage configuration
3. Allow easy enable/disable toggle for discount campaigns
4. Maintain transparency in pricing strategy
5. Support seasonal and promotional pricing models

---

## Design System & Brand Guidelines

### Color Scheme - Hotel Manager Role

#### Primary Button Colors
```css
/* Hotel Manager Purple Cyan Flow Gradient */
--hotel-manager-primary-start: #9D4EDD;
--hotel-manager-primary-end: #00D4FF;
--hotel-manager-gradient: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);

/* Dark Mode Variants */
--hotel-manager-primary-start-dark: #B87EF7;
--hotel-manager-primary-end-dark: #33E0FF;
```

#### Background Colors
```css
/* Light Mode - Clean White */
--background-primary: #FFFFFF;
--background-secondary: #F9FAFB;
--card-background: #FFFFFF;

/* Dark Mode - Deep Black */
--background-primary-dark: #000000;
--background-secondary-dark: #0A0A0A;
--card-background-dark: #1A1A1A;
```

#### Text Colors
```css
/* Light Mode */
--text-primary: #111827;
--text-secondary: #6B7280;
--text-tertiary: #9CA3AF;

/* Dark Mode */
--text-primary-dark: #F9FAFB;
--text-secondary-dark: #D1D5DB;
--text-tertiary-dark: #6B7280;
```

#### Accent Colors (Strategic Use Only)
```css
/* Discount/Price Indicators */
--discount-green: #10B981;
--discount-green-light: #D1FAE5;
--discount-green-dark: #065F46;

/* Alert/Warning */
--warning-amber: #F59E0B;
--warning-amber-light: #FEF3C7;
```

### Typography
```css
/* Screen Title */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
font-size: 28px;
font-weight: 700;
letter-spacing: -0.5px;

/* Section Headers */
font-size: 20px;
font-weight: 600;
letter-spacing: -0.3px;

/* Body Text */
font-size: 16px;
font-weight: 400;
line-height: 1.5;

/* Discount Percentage Display */
font-size: 48px;
font-weight: 700;
letter-spacing: -1px;

/* Helper Text */
font-size: 14px;
font-weight: 400;
color: var(--text-secondary);
```

---

## UI/UX Specifications

### Screen Layout

```
┌─────────────────────────────────────┐
│  ← Back    Discount Settings        │ ← Header
├─────────────────────────────────────┤
│                                     │
│  Set Your Promotional Discount      │ ← Title
│  Attract more guests with special   │ ← Subtitle
│  pricing offers                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 💰 Offer Discount              │ │ ← Toggle Card
│  │                                │ │
│  │  Activate promotional pricing  │ │
│  │                        [Toggle]│ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Discount Percentage            │ │ ← Discount Input
│  │                                │ │
│  │         [  25  %  ]            │ │ ← Large Display
│  │                                │ │
│  │  ┌─────────────────────────┐  │ │
│  │  │ 5%  │ 10% │ 15% │ 20%  │  │ │ ← Quick Select
│  │  └─────────────────────────┘  │ │
│  │                                │ │
│  │  Custom: [____] %              │ │ ← Custom Input
│  │                                │ │
│  │  Valid Range: 5% - 70%         │ │ ← Hint Text
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Pricing Preview                │ │ ← Preview Card
│  │                                │ │
│  │  Original Price:  $150/night   │ │
│  │  Discount (25%):  -$37.50      │ │
│  │  Final Price:     $112.50      │ │
│  │                                │ │
│  │  You save guests: $37.50/night │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 💡 Discount Benefits           │ │ ← Info Card
│  │                                │ │
│  │  • Increase booking visibility │ │
│  │  • Attract price-conscious     │ │
│  │    travelers                   │ │
│  │  • Boost off-season occupancy  │ │
│  │  • Build guest reviews faster  │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  [Skip for Now]  [Continue] →      │ ← Actions
└─────────────────────────────────────┘
```

### Component Spacing
```css
/* Screen Padding */
padding: 24px 20px;

/* Component Gaps */
gap: 24px; /* Between major sections */

/* Card Padding */
padding: 20px;
border-radius: 16px;

/* Toggle Container */
padding: 16px 20px;

/* Button Spacing */
margin-top: 32px;
gap: 12px; /* Between buttons */
```

---

## Feature Components

### 1. Discount Toggle Card

#### Visual Design
```jsx
<div className="discount-toggle-card">
  <div className="icon-container">
    <svg className="discount-icon">
      {/* Animated Money Icon */}
    </svg>
  </div>
  
  <div className="content">
    <h3>Offer Discount</h3>
    <p>Activate promotional pricing to attract more bookings</p>
  </div>
  
  <Toggle
    isOn={isDiscountEnabled}
    onChange={handleToggleDiscount}
    color="purple-cyan-gradient"
  />
</div>
```

#### CSS Styling
```css
.discount-toggle-card {
  background: var(--card-background);
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.discount-toggle-card:hover {
  border-color: #9D4EDD;
  box-shadow: 0 4px 12px rgba(157, 78, 221, 0.08);
}

.icon-container {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #F3E8FF 0%, #E0F7FF 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.discount-icon {
  width: 24px;
  height: 24px;
  color: #9D4EDD;
}
```

#### Toggle Switch Component
```css
.toggle-switch {
  position: relative;
  width: 56px;
  height: 32px;
  background: #E5E7EB;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.toggle-switch.active {
  background: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(24px);
}
```

---

### 2. Discount Percentage Selector

#### Large Display Component
```jsx
<div className="discount-display">
  <div className="percentage-container">
    <input
      type="number"
      value={discountPercentage}
      onChange={handlePercentageChange}
      className="percentage-input"
      min="5"
      max="70"
      disabled={!isDiscountEnabled}
    />
    <span className="percentage-symbol">%</span>
  </div>
  <p className="discount-label">OFF Regular Price</p>
</div>
```

#### Styling
```css
.discount-display {
  text-align: center;
  padding: 32px 0;
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
  border-radius: 20px;
  margin: 24px 0;
}

.percentage-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.percentage-input {
  font-size: 64px;
  font-weight: 700;
  color: #9D4EDD;
  background: transparent;
  border: none;
  width: 120px;
  text-align: right;
  outline: none;
  letter-spacing: -2px;
}

.percentage-input:disabled {
  opacity: 0.4;
  color: #9CA3AF;
}

.percentage-symbol {
  font-size: 48px;
  font-weight: 700;
  color: #6B7280;
}

.discount-label {
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 8px;
}
```

---

### 3. Quick Select Buttons

#### Component Structure
```jsx
<div className="quick-select-container">
  <p className="quick-select-label">Quick Select:</p>
  <div className="quick-select-buttons">
    {[5, 10, 15, 20, 25, 30].map(percentage => (
      <button
        key={percentage}
        onClick={() => handleQuickSelect(percentage)}
        className={`quick-select-btn ${
          discountPercentage === percentage ? 'active' : ''
        }`}
        disabled={!isDiscountEnabled}
      >
        {percentage}%
      </button>
    ))}
  </div>
</div>
```

#### Styling
```css
.quick-select-container {
  margin: 24px 0;
}

.quick-select-label {
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 12px;
}

.quick-select-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-select-btn {
  padding: 14px 20px;
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-select-btn:hover:not(:disabled) {
  border-color: #9D4EDD;
  background: #F9F5FF;
  transform: translateY(-2px);
}

.quick-select-btn.active {
  background: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);
  border-color: transparent;
  color: white;
}

.quick-select-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

### 4. Custom Percentage Input

#### Component
```jsx
<div className="custom-input-container">
  <label htmlFor="custom-discount">Custom Percentage:</label>
  <div className="input-wrapper">
    <input
      id="custom-discount"
      type="number"
      value={customDiscount}
      onChange={handleCustomInput}
      placeholder="Enter custom %"
      min="5"
      max="70"
      disabled={!isDiscountEnabled}
    />
    <span className="input-suffix">%</span>
    <button 
      className="apply-btn"
      onClick={applyCustomDiscount}
      disabled={!isValidCustom || !isDiscountEnabled}
    >
      Apply
    </button>
  </div>
  <p className="input-hint">Valid range: 5% - 70%</p>
</div>
```

#### Styling
```css
.custom-input-container {
  margin: 24px 0;
}

.custom-input-container label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 4px 4px 4px 16px;
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #9D4EDD;
  box-shadow: 0 0 0 3px rgba(157, 78, 221, 0.1);
}

.input-wrapper input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 0;
}

.input-suffix {
  font-size: 16px;
  font-weight: 600;
  color: #6B7280;
}

.apply-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.apply-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.apply-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.input-hint {
  font-size: 12px;
  color: #6B7280;
  margin-top: 6px;
}
```

---

### 5. Pricing Preview Card

#### Component Structure
```jsx
<div className="pricing-preview-card">
  <h3 className="preview-title">
    <span className="preview-icon">💰</span>
    Pricing Preview
  </h3>
  
  <div className="price-breakdown">
    <div className="price-row">
      <span className="price-label">Original Price:</span>
      <span className="price-value">${originalPrice}/night</span>
    </div>
    
    <div className="price-row discount-row">
      <span className="price-label">Discount ({discountPercentage}%):</span>
      <span className="price-value discount-value">
        -${discountAmount.toFixed(2)}
      </span>
    </div>
    
    <div className="divider"></div>
    
    <div className="price-row final-price-row">
      <span className="price-label">Final Price:</span>
      <span className="price-value final-price">${finalPrice}/night</span>
    </div>
    
    <div className="savings-badge">
      <svg className="badge-icon">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span>Guests save ${discountAmount.toFixed(2)} per night!</span>
    </div>
  </div>
</div>
```

#### Styling
```css
.pricing-preview-card {
  background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%);
  border: 2px solid #10B981;
  border-radius: 16px;
  padding: 24px;
  margin: 24px 0;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #065F46;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.preview-icon {
  font-size: 24px;
}

.price-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label {
  font-size: 15px;
  color: #374151;
  font-weight: 500;
}

.price-value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.discount-row .price-value {
  color: #10B981;
}

.divider {
  height: 1px;
  background: #D1D5DB;
  margin: 8px 0;
}

.final-price-row {
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-top: 8px;
}

.final-price {
  font-size: 24px;
  color: #9D4EDD;
  font-weight: 700;
}

.savings-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #10B981;
  color: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
}

.badge-icon {
  width: 18px;
  height: 18px;
  stroke: white;
  stroke-width: 2;
  fill: none;
}
```

---

### 6. Discount Benefits Info Card

#### Component
```jsx
<div className="benefits-card">
  <div className="benefits-header">
    <span className="lightbulb-icon">💡</span>
    <h3>Discount Benefits</h3>
  </div>
  
  <ul className="benefits-list">
    <li>
      <svg className="check-icon">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span>Increase booking visibility in search results</span>
    </li>
    <li>
      <svg className="check-icon">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span>Attract price-conscious travelers</span>
    </li>
    <li>
      <svg className="check-icon">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span>Boost occupancy during off-season periods</span>
    </li>
    <li>
      <svg className="check-icon">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span>Build guest reviews faster with competitive pricing</span>
    </li>
  </ul>
</div>
```

#### Styling
```css
.benefits-card {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 16px;
  padding: 20px;
  margin: 24px 0;
}

.benefits-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.lightbulb-icon {
  font-size: 24px;
}

.benefits-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #92400E;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefits-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #78350F;
  font-size: 14px;
  line-height: 1.5;
}

.check-icon {
  width: 20px;
  height: 20px;
  min-width: 20px;
  stroke: #F59E0B;
  stroke-width: 2.5;
  fill: none;
  margin-top: 2px;
}
```

---

## State Management

### State Variables
```javascript
const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
const [discountPercentage, setDiscountPercentage] = useState(10);
const [customDiscount, setCustomDiscount] = useState('');
const [originalPrice, setOriginalPrice] = useState(150); // From previous pricing step
const [showValidationError, setShowValidationError] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
```

### Computed Values
```javascript
const discountAmount = useMemo(() => {
  if (!isDiscountEnabled) return 0;
  return (originalPrice * discountPercentage) / 100;
}, [isDiscountEnabled, discountPercentage, originalPrice]);

const finalPrice = useMemo(() => {
  return originalPrice - discountAmount;
}, [originalPrice, discountAmount]);

const isValidCustom = useMemo(() => {
  const value = parseInt(customDiscount);
  return value >= 5 && value <= 70;
}, [customDiscount]);
```

### Event Handlers
```javascript
const handleToggleDiscount = (newValue) => {
  setIsDiscountEnabled(newValue);
  
  // Reset to default if disabled
  if (!newValue) {
    setDiscountPercentage(10);
    setCustomDiscount('');
    setShowValidationError(false);
  }
  
  // Haptic feedback
  triggerHaptic('light');
};

const handleQuickSelect = (percentage) => {
  setDiscountPercentage(percentage);
  setCustomDiscount('');
  setShowValidationError(false);
  triggerHaptic('light');
  
  // Animate the percentage display
  animatePercentageChange(percentage);
};

const handleCustomInput = (e) => {
  const value = e.target.value;
  setCustomDiscount(value);
  
  // Real-time validation
  if (value) {
    const numValue = parseInt(value);
    if (numValue < 5 || numValue > 70) {
      setShowValidationError(true);
      setErrorMessage('Discount must be between 5% and 70%');
    } else {
      setShowValidationError(false);
      setErrorMessage('');
    }
  }
};

const applyCustomDiscount = () => {
  if (isValidCustom) {
    setDiscountPercentage(parseInt(customDiscount));
    setCustomDiscount('');
    triggerHaptic('success');
    animatePercentageChange(parseInt(customDiscount));
  }
};

const handlePercentageChange = (e) => {
  const value = parseInt(e.target.value) || 0;
  
  // Clamp value between 5 and 70
  const clampedValue = Math.min(Math.max(value, 5), 70);
  setDiscountPercentage(clampedValue);
};
```

---

## Animations & Interactions

### 1. Toggle Animation
```javascript
const toggleVariants = {
  off: {
    background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
  },
  on: {
    background: 'linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const thumbVariants = {
  off: { x: 0 },
  on: { 
    x: 24,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  }
};
```

### 2. Percentage Display Animation
```javascript
const animatePercentageChange = (newValue) => {
  const start = discountPercentage;
  const end = newValue;
  const duration = 500; // ms
  const startTime = Date.now();
  
  const animate = () => {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const eased = easeOutCubic(progress);
    const current = start + (end - start) * eased;
    
    setDiscountPercentage(Math.round(current));
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3);
};
```

### 3. Card Entrance Animation
```javascript
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: custom * 0.1,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  })
};

// Usage
<motion.div
  custom={0}
  initial="hidden"
  animate="visible"
  variants={cardVariants}
>
  {/* Toggle Card */}
</motion.div>

<motion.div
  custom={1}
  initial="hidden"
  animate="visible"
  variants={cardVariants}
>
  {/* Discount Selector */}
</motion.div>
```

### 4. Quick Select Button Animation
```css
.quick-select-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-select-btn:active {
  transform: scale(0.95);
}

@keyframes pulse-success {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.quick-select-btn.active {
  animation: pulse-success 0.3s ease-out;
}
```

### 5. Pricing Preview Pulse
```javascript
useEffect(() => {
  if (isDiscountEnabled) {
    const element = document.querySelector('.pricing-preview-card');
    element?.classList.add('pulse-animation');
    
    setTimeout(() => {
      element?.classList.remove('pulse-animation');
    }, 600);
  }
}, [discountPercentage, isDiscountEnabled]);
```

```css
@keyframes preview-pulse {
  0% { 
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.pulse-animation {
  animation: preview-pulse 0.6s ease-out;
}
```

---

## Flutter Implementation

### Screen Structure
```dart
class DiscountSettingsScreen extends StatefulWidget {
  final String propertyId;
  final double originalPrice;
  
  const DiscountSettingsScreen({
    Key? key,
    required this.propertyId,
    required this.originalPrice,
  }) : super(key: key);
  
  @override
  State<DiscountSettingsScreen> createState() => _DiscountSettingsScreenState();
}

class _DiscountSettingsScreenState extends State<DiscountSettingsScreen> 
    with SingleTickerProviderStateMixin {
  bool _isDiscountEnabled = false;
  int _discountPercentage = 10;
  final TextEditingController _customController = TextEditingController();
  late AnimationController _animationController;
  late Animation<int> _percentageAnimation;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
  }
  
  @override
  void dispose() {
    _customController.dispose();
    _animationController.dispose();
    super.dispose();
  }
  
  // ... rest of implementation
}
```

### Toggle Widget
```dart
class CustomToggle extends StatefulWidget {
  final bool value;
  final ValueChanged<bool> onChanged;
  final Gradient activeGradient;
  
  const CustomToggle({
    Key? key,
    required this.value,
    required this.onChanged,
    required this.activeGradient,
  }) : super(key: key);
  
  @override
  State<CustomToggle> createState() => _CustomToggleState();
}

class _CustomToggleState extends State<CustomToggle> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _position;
  late Animation<Color?> _backgroundColor;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
      value: widget.value ? 1.0 : 0.0,
    );
    
    _position = Tween<double>(begin: 0, end: 24).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOutCubic,
      ),
    );
  }
  
  @override
  void didUpdateWidget(CustomToggle oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      if (widget.value) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onChanged(!widget.value);
      },
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Container(
            width: 56,
            height: 32,
            decoration: BoxDecoration(
              gradient: widget.value ? widget.activeGradient : null,
              color: widget.value ? null : const Color(0xFFE5E7EB),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Stack(
              children: [
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOutCubic,
                  left: widget.value ? 27 : 3,
                  top: 3,
                  child: Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

### Percentage Display Widget
```dart
class DiscountPercentageDisplay extends StatelessWidget {
  final int percentage;
  final bool enabled;
  final ValueChanged<int> onChanged;
  
  const DiscountPercentageDisplay({
    Key? key,
    required this.percentage,
    required this.enabled,
    required this.onChanged,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF9FAFB), Color(0xFFF3F4F6)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TweenAnimationBuilder<int>(
                tween: IntTween(begin: percentage, end: percentage),
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeOutCubic,
                builder: (context, value, child) {
                  return Text(
                    value.toString(),
                    style: TextStyle(
                      fontSize: 64,
                      fontWeight: FontWeight.w700,
                      color: enabled 
                        ? const Color(0xFF9D4EDD)
                        : const Color(0xFF9CA3AF).withOpacity(0.4),
                      letterSpacing: -2,
                      height: 1,
                    ),
                  );
                },
              ),
              Text(
                '%',
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF6B7280),
                  height: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'OFF REGULAR PRICE',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF6B7280),
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }
}
```

### Quick Select Buttons
```dart
class QuickSelectButtons extends StatelessWidget {
  final int selectedPercentage;
  final bool enabled;
  final ValueChanged<int> onSelect;
  final List<int> options = const [5, 10, 15, 20, 25, 30];
  
  const QuickSelectButtons({
    Key? key,
    required this.selectedPercentage,
    required this.enabled,
    required this.onSelect,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Select:',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF6B7280),
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.5,
          ),
          itemCount: options.length,
          itemBuilder: (context, index) {
            final percentage = options[index];
            final isSelected = percentage == selectedPercentage;
            
            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: enabled ? () {
                    HapticFeedback.lightImpact();
                    onSelect(percentage);
                  } : null,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: isSelected
                        ? const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF9D4EDD), Color(0xFF00D4FF)],
                          )
                        : null,
                      color: isSelected ? null : Colors.white,
                      border: Border.all(
                        color: isSelected 
                          ? Colors.transparent 
                          : const Color(0xFFE5E7EB),
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$percentage%',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: isSelected 
                          ? Colors.white 
                          : const Color(0xFF374151),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
```

### Pricing Preview Card
```dart
class PricingPreviewCard extends StatelessWidget {
  final double originalPrice;
  final int discountPercentage;
  final bool enabled;
  
  const PricingPreviewCard({
    Key? key,
    required this.originalPrice,
    required this.discountPercentage,
    required this.enabled,
  }) : super(key: key);
  
  double get discountAmount => 
    enabled ? (originalPrice * discountPercentage / 100) : 0;
  
  double get finalPrice => originalPrice - discountAmount;
  
  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF0FDF4), Color(0xFFECFDF5)],
        ),
        border: Border.all(
          color: enabled ? const Color(0xFF10B981) : const Color(0xFFE5E7EB),
          width: 2,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('💰', style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 8),
              Text(
                'Pricing Preview',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF065F46),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildPriceRow(
            'Original Price:',
            '\$${originalPrice.toStringAsFixed(2)}/night',
            false,
          ),
          const SizedBox(height: 16),
          if (enabled) ...[
            _buildPriceRow(
              'Discount ($discountPercentage%):',
              '-\$${discountAmount.toStringAsFixed(2)}',
              true,
            ),
            const SizedBox(height: 16),
            Container(
              height: 1,
              color: const Color(0xFFD1D5DB),
              margin: const EdgeInsets.symmetric(vertical: 8),
            ),
            const SizedBox(height: 16),
          ],
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Final Price:',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF374151),
                  ),
                ),
                Text(
                  '\$${finalPrice.toStringAsFixed(2)}/night',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF9D4EDD),
                  ),
                ),
              ],
            ),
          ),
          if (enabled) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_circle,
                    color: Colors.white,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Guests save \$${discountAmount.toStringAsFixed(2)} per night!',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildPriceRow(String label, String value, bool isDiscount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: Color(0xFF374151),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: isDiscount ? const Color(0xFF10B981) : const Color(0xFF111827),
          ),
        ),
      ],
    );
  }
}
```

---

## Backend Integration

### Data Model
```dart
class DiscountSettings {
  final bool isEnabled;
  final int percentage;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? description;
  
  DiscountSettings({
    required this.isEnabled,
    required this.percentage,
    this.startDate,
    this.endDate,
    this.description,
  });
  
  Map<String, dynamic> toJson() => {
    'is_enabled': isEnabled,
    'percentage': percentage,
    'start_date': startDate?.toIso8601String(),
    'end_date': endDate?.toIso8601String(),
    'description': description,
  };
  
  factory DiscountSettings.fromJson(Map<String, dynamic> json) {
    return DiscountSettings(
      isEnabled: json['is_enabled'] ?? false,
      percentage: json['percentage'] ?? 0,
      startDate: json['start_date'] != null 
        ? DateTime.parse(json['start_date']) 
        : null,
      endDate: json['end_date'] != null 
        ? DateTime.parse(json['end_date']) 
        : null,
      description: json['description'],
    );
  }
}
```

### API Endpoint
```javascript
// POST /api/properties/:propertyId/discount
{
  "is_enabled": true,
  "percentage": 25,
  "start_date": "2025-01-01T00:00:00Z", // Optional
  "end_date": "2025-03-31T23:59:59Z",   // Optional
  "description": "Winter promotional discount"
}

// Response
{
  "success": true,
  "data": {
    "discount_id": "disc_abc123",
    "property_id": "prop_xyz789",
    "settings": {
      "is_enabled": true,
      "percentage": 25,
      "start_date": "2025-01-01T00:00:00Z",
      "end_date": "2025-03-31T23:59:59Z"
    },
    "pricing": {
      "original_price": 150.00,
      "discount_amount": 37.50,
      "final_price": 112.50
    }
  }
}
```

### Service Implementation
```dart
class DiscountService {
  final ApiClient _apiClient;
  
  DiscountService(this._apiClient);
  
  Future<void> saveDiscountSettings({
    required String propertyId,
    required DiscountSettings settings,
  }) async {
    try {
      final response = await _apiClient.post(
        '/api/properties/$propertyId/discount',
        data: settings.toJson(),
      );
      
      if (response.statusCode == 200) {
        print('Discount settings saved successfully');
      } else {
        throw Exception('Failed to save discount settings');
      }
    } catch (e) {
      print('Error saving discount: $e');
      rethrow;
    }
  }
  
  Future<DiscountSettings?> getDiscountSettings(String propertyId) async {
    try {
      final response = await _apiClient.get(
        '/api/properties/$propertyId/discount',
      );
      
      if (response.statusCode == 200) {
        return DiscountSettings.fromJson(response.data['data']['settings']);
      }
      return null;
    } catch (e) {
      print('Error fetching discount: $e');
      return null;
    }
  }
}
```

---

## Validation & Error Handling

### Validation Rules
```dart
class DiscountValidator {
  static const int minPercentage = 5;
  static const int maxPercentage = 70;
  
  static ValidationResult validatePercentage(int percentage) {
    if (percentage < minPercentage) {
      return ValidationResult.error(
        'Discount must be at least $minPercentage%'
      );
    }
    
    if (percentage > maxPercentage) {
      return ValidationResult.error(
        'Discount cannot exceed $maxPercentage%'
      );
    }
    
    return ValidationResult.success();
  }
  
  static ValidationResult validateDiscountSettings(DiscountSettings settings) {
    if (!settings.isEnabled) {
      return ValidationResult.success();
    }
    
    final percentageValidation = validatePercentage(settings.percentage);
    if (!percentageValidation.isValid) {
      return percentageValidation;
    }
    
    if (settings.startDate != null && settings.endDate != null) {
      if (settings.endDate!.isBefore(settings.startDate!)) {
        return ValidationResult.error(
          'End date must be after start date'
        );
      }
    }
    
    return ValidationResult.success();
  }
}

class ValidationResult {
  final bool isValid;
  final String? errorMessage;
  
  ValidationResult.success() : isValid = true, errorMessage = null;
  ValidationResult.error(this.errorMessage) : isValid = false;
}
```

### Error Display
```dart
class ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback? onDismiss;
  
  const ErrorBanner({
    Key? key,
    required this.message,
    this.onDismiss,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        border: Border.all(color: const Color(0xFFEF4444)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.error_outline,
            color: Color(0xFFDC2626),
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF991B1B),
              ),
            ),
          ),
          if (onDismiss != null)
            IconButton(
              icon: const Icon(Icons.close, size: 20),
              color: const Color(0xFFDC2626),
              onPressed: onDismiss,
            ),
        ],
      ),
    );
  }
}
```

---

## Accessibility

### Screen Reader Support
```dart
Semantics(
  label: 'Discount toggle',
  hint: isDiscountEnabled 
    ? 'Discount is currently enabled. Tap to disable.'
    : 'Discount is currently disabled. Tap to enable.',
  child: CustomToggle(
    value: isDiscountEnabled,
    onChanged: handleToggleDiscount,
  ),
)
```

### Focus Management
```dart
final FocusNode _customInputFocus = FocusNode();

// Auto-focus custom input when quick select is used
void _handleQuickSelect(int percentage) {
  setState(() {
    _discountPercentage = percentage;
  });
  
  // Move focus for better keyboard navigation
  FocusScope.of(context).requestFocus(_customInputFocus);
}
```

### High Contrast Mode
```dart
@override
Widget build(BuildContext context) {
  final isHighContrast = MediaQuery.of(context).highContrast;
  
  return Container(
    decoration: BoxDecoration(
      border: Border.all(
        color: isHighContrast 
          ? Colors.black 
          : const Color(0xFFE5E7EB),
        width: isHighContrast ? 3 : 1,
      ),
      borderRadius: BorderRadius.circular(16),
    ),
    // ... rest of widget
  );
}
```

---

## Complete React Implementation Example

```tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DiscountSettingsProps {
  propertyId: string;
  originalPrice: number;
  onContinue: (settings: DiscountSettings) => void;
  onSkip: () => void;
}

interface DiscountSettings {
  isEnabled: boolean;
  percentage: number;
}

export default function DiscountSettings({
  propertyId,
  originalPrice,
  onContinue,
  onSkip
}: DiscountSettingsProps) {
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [customDiscount, setCustomDiscount] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const quickSelectOptions = [5, 10, 15, 20, 25, 30];

  // Computed values
  const discountAmount = useMemo(() => {
    if (!isDiscountEnabled) return 0;
    return (originalPrice * discountPercentage) / 100;
  }, [isDiscountEnabled, discountPercentage, originalPrice]);

  const finalPrice = useMemo(() => {
    return originalPrice - discountAmount;
  }, [originalPrice, discountAmount]);

  const isValidCustom = useMemo(() => {
    const value = parseInt(customDiscount);
    return !isNaN(value) && value >= 5 && value <= 70;
  }, [customDiscount]);

  // Handlers
  const handleToggleDiscount = () => {
    setIsDiscountEnabled(!isDiscountEnabled);
    if (isDiscountEnabled) {
      setDiscountPercentage(10);
      setCustomDiscount('');
      setShowError(false);
    }
  };

  const handleQuickSelect = (percentage: number) => {
    setDiscountPercentage(percentage);
    setCustomDiscount('');
    setShowError(false);
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomDiscount(value);

    if (value) {
      const numValue = parseInt(value);
      if (numValue < 5 || numValue > 70) {
        setShowError(true);
        setErrorMessage('Discount must be between 5% and 70%');
      } else {
        setShowError(false);
        setErrorMessage('');
      }
    }
  };

  const applyCustomDiscount = () => {
    if (isValidCustom) {
      setDiscountPercentage(parseInt(customDiscount));
      setCustomDiscount('');
    }
  };

  const handleContinue = () => {
    const settings: DiscountSettings = {
      isEnabled: isDiscountEnabled,
      percentage: isDiscountEnabled ? discountPercentage : 0
    };
    onContinue(settings);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-5 py-4 z-10">
        <div className="flex items-center justify-between">
          <button className="p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Discount Settings</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="px-5 py-6 pb-32">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-2">Set Your Promotional Discount</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Attract more guests with special pricing offers
          </p>
        </motion.div>

        {/* Error Banner */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
            >
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200 flex-1">{errorMessage}</p>
              <button onClick={() => setShowError(false)}>
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Offer Discount</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Activate promotional pricing
            </p>
          </div>
          <button
            onClick={handleToggleDiscount}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              isDiscountEnabled
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500'
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <motion.div
              animate={{ x: isDiscountEnabled ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-md"
            />
          </button>
        </motion.div>

        {/* Discount Percentage Display */}
        <AnimatePresence>
          {isDiscountEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Large Display */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl py-8 text-center">
                <div className="flex items-start justify-center gap-2">
                  <motion.span
                    key={discountPercentage}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent"
                  >
                    {discountPercentage}
                  </motion.span>
                  <span className="text-5xl font-bold text-gray-600 dark:text-gray-400">%</span>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2 tracking-wider">
                  OFF REGULAR PRICE
                </p>
              </div>

              {/* Quick Select */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Quick Select:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {quickSelectOptions.map((percentage) => (
                    <motion.button
                      key={percentage}
                      onClick={() => handleQuickSelect(percentage)}
                      whileTap={{ scale: 0.95 }}
                      className={`py-3.5 rounded-xl font-semibold transition-all ${
                        discountPercentage === percentage
                          ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {percentage}%
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Custom Percentage:
                </label>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-1 pr-1.5 focus-within:border-purple-500">
                  <input
                    type="number"
                    value={customDiscount}
                    onChange={handleCustomInput}
                    placeholder="Enter custom %"
                    min="5"
                    max="70"
                    className="flex-1 px-3 py-2 bg-transparent border-none outline-none"
                  />
                  <span className="font-semibold text-gray-600">%</span>
                  <button
                    onClick={applyCustomDiscount}
                    disabled={!isValidCustom}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Valid range: 5% - 70%</p>
              </div>

              {/* Pricing Preview */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-500 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl">💰</span>
                  <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                    Pricing Preview
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Original Price:</span>
                    <span className="font-semibold">${originalPrice.toFixed(2)}/night</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({discountPercentage}%):</span>
                    <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-300 dark:bg-gray-600" />
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Final Price:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                      ${finalPrice.toFixed(2)}/night
                    </span>
                  </div>
                  <div className="bg-emerald-500 text-white rounded-xl p-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-semibold">
                      Guests save ${discountAmount.toFixed(2)} per night!
                    </span>
                  </div>
                </div>
              </div>

              {/* Benefits Card */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💡</span>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Discount Benefits
                  </h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'Increase booking visibility in search results',
                    'Attract price-conscious travelers',
                    'Boost occupancy during off-season periods',
                    'Build guest reviews faster with competitive pricing'
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-amber-900 dark:text-amber-100">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-5 flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-700 font-semibold"
        >
          Skip for Now
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold shadow-lg"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
```

---

## Summary

This Discount Settings step provides hotel managers with:

1. **Easy Toggle Control**: Simple on/off switch for discount activation
2. **Flexible Configuration**: Quick select buttons + custom input for any percentage
3. **Real-time Preview**: Live pricing calculations showing savings
4. **Professional Design**: Hotel Manager purple-cyan gradient branding
5. **Smooth Animations**: Polished interactions for percentage changes
6. **Clear Benefits**: Educational content about discount advantages
7. **Validation**: Enforced 5-70% range with helpful error messages
8. **Accessibility**: Screen reader support and keyboard navigation

**Next Steps**: Photos & Media Upload or Advanced Pricing Configuration

---

**Version**: 1.0.0  
**Last Updated**: December 26, 2025  
**Design System**: TripAvail Hotel Manager (Purple Cyan Flow)
