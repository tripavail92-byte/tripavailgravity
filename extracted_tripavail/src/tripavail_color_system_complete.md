# TripAvail Complete Color System & Design Tokens

## 🎨 Brand Identity & Color Philosophy

The TripAvail color system is built around a **premium Rose-based palette** that conveys trust, warmth, and sophistication. Our color strategy emphasizes accessibility, emotional connection, and cross-platform consistency while maintaining the premium feel of a world-class travel platform.

### **Brand Personality Through Color**
- **Rose Primary (#E11D48)**: Trust, premium quality, travel passion
- **Sophisticated Gradients**: Modern, premium user experience
- **Neutral Foundation**: Clean, readable, professional
- **Cultural Sensitivity**: Pakistani market considerations with respectful color choices

---

## 🌈 Core Color Palette

### **1. Primary Brand Colors**

#### **Rose Primary System**
```css
/* Light Mode Primary */
--primary: #E11D48;                    /* Rose 600 - Main brand color */
--primary-foreground: #FFFFFF;         /* White text on primary */

/* Dark Mode Primary */
--primary-dark: #FB7185;               /* Rose 400 - Softer for dark mode */
--primary-foreground-dark: #FFFFFF;    /* White text on dark primary */
```

#### **Primary Color Variations**
```css
/* Rose Color Scale */
--rose-50: #FFF1F2;                    /* Lightest - backgrounds, subtle highlights */
--rose-100: #FFE4E6;                   /* Very light - hover states, gentle accents */
--rose-200: #FECDD3;                   /* Light - secondary backgrounds */
--rose-300: #FDA4AF;                   /* Medium light - borders, inactive states */
--rose-400: #FB7185;                   /* Medium - dark mode primary */
--rose-500: #F43F5E;                   /* Medium dark - hover states */
--rose-600: #E11D48;                   /* Primary brand color */
--rose-700: #BE123C;                   /* Dark - pressed states */
--rose-800: #9F1239;                   /* Darker - emphasized elements */
--rose-900: #881337;                   /* Darkest - high contrast */
```

### **2. Semantic Color System**

#### **Background Colors**
```css
/* Light Mode */
--background: #FFFFFF;                 /* Pure white main background */
--background-secondary: #F8FAFC;       /* Subtle gray for sections */
--background-tertiary: #F1F5F9;        /* Slightly darker for cards */

/* Dark Mode */
--background: #0A0A0A;                 /* Deep black main background */
--background-secondary: #1A1A1A;       /* Dark gray for cards */
--background-tertiary: #2A2A2A;        /* Lighter dark for elevated elements */
```

#### **Content Colors**
```css
/* Light Mode Text */
--foreground: oklch(0.145 0 0);        /* Near black - primary text */
--foreground-secondary: #64748B;       /* Slate 500 - secondary text */
--foreground-muted: #94A3B8;           /* Slate 400 - muted text */
--foreground-subtle: #CBD5E1;          /* Slate 300 - subtle text */

/* Dark Mode Text */
--foreground: #FFFFFF;                 /* Pure white - primary text */
--foreground-secondary: #E2E8F0;       /* Slate 200 - secondary text */
--foreground-muted: #CBD5E1;           /* Slate 300 - muted text */
--foreground-subtle: #94A3B8;          /* Slate 400 - subtle text */
```

#### **Interactive Element Colors**
```css
/* Cards & Surfaces */
--card: #FFFFFF;                       /* Light mode card background */
--card-dark: #1A1A1A;                  /* Dark mode card background */
--card-foreground: oklch(0.145 0 0);   /* Card text color */
--card-foreground-dark: #FFFFFF;       /* Dark mode card text */

/* Inputs & Form Elements */
--input-background: #F3F3F5;           /* Light input background */
--input-background-dark: #2A2A2A;      /* Dark input background */
--input-border: rgba(0, 0, 0, 0.1);    /* Light input border */
--input-border-dark: #3A3A3A;          /* Dark input border */

/* Borders & Dividers */
--border: rgba(0, 0, 0, 0.1);          /* Light mode borders */
--border-dark: #2A2A2A;                /* Dark mode borders */
--border-subtle: rgba(0, 0, 0, 0.05);  /* Very subtle borders */
--border-subtle-dark: #1F1F1F;         /* Dark mode subtle borders */
```

### **3. Status & Feedback Colors**

#### **Success Colors**
```css
--success: #10B981;                    /* Emerald 500 - success states */
--success-light: #D1FAE5;              /* Emerald 100 - success backgrounds */
--success-dark: #047857;               /* Emerald 700 - dark mode success */
--success-foreground: #FFFFFF;         /* White text on success */
```

#### **Warning Colors**
```css
--warning: #F59E0B;                    /* Amber 500 - warning states */
--warning-light: #FEF3C7;              /* Amber 100 - warning backgrounds */
--warning-dark: #D97706;               /* Amber 600 - dark mode warning */
--warning-foreground: #FFFFFF;         /* White text on warning */
```

#### **Error/Destructive Colors**
```css
--destructive: #EF4444;                /* Red 500 - error states */
--destructive-light: #FEE2E2;          /* Red 100 - error backgrounds */
--destructive-dark: #DC2626;           /* Red 600 - dark mode error */
--destructive-foreground: #FFFFFF;     /* White text on error */
```

#### **Information Colors**
```css
--info: #3B82F6;                       /* Blue 500 - info states */
--info-light: #DBEAFE;                 /* Blue 100 - info backgrounds */
--info-dark: #2563EB;                  /* Blue 600 - dark mode info */
--info-foreground: #FFFFFF;            /* White text on info */
```

---

## 🎨 Gradient System

### **1. Primary Brand Gradients**

#### **Rose Primary Gradients**
```css
/* Main brand gradient */
.gradient-rose-primary {
    background: linear-gradient(135deg, #E11D48 0%, #FB7185 100%);
}

/* Hover state for primary gradient */
.gradient-rose-primary-hover {
    background: linear-gradient(135deg, #BE123C 0%, #F43F5E 100%);
}

/* Active/pressed state */
.gradient-rose-primary-active {
    background: linear-gradient(135deg, #9F1239 0%, #E11D48 100%);
}
```

#### **Partner Mode Gradients**
```css
/* Partner mode gradient (purple to pink) */
.gradient-partner {
    background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
}

/* Partner mode hover state */
.gradient-partner-hover {
    background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
}

/* Partner mode active state */
.gradient-partner-active {
    background: linear-gradient(135deg, #6D28D9 0%, #BE185D 100%);
}
```

### **2. Functional Gradients**

#### **Success Gradients**
```css
.gradient-success {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

.gradient-success-subtle {
    background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
}
```

#### **Warning Gradients**
```css
.gradient-warning {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}

.gradient-warning-subtle {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
}
```

#### **Information Gradients**
```css
.gradient-info {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
}

.gradient-info-subtle {
    background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
}
```

### **3. Decorative & Premium Gradients**

#### **Luxury Gradients**
```css
/* Premium gold gradient */
.gradient-luxury {
    background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #EF4444 100%);
}

/* Platinum gradient */
.gradient-platinum {
    background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #94A3B8 100%);
}
```

#### **Travel-Themed Gradients**
```css
/* Ocean/beach gradient */
.gradient-ocean {
    background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%);
}

/* Sunset gradient */
.gradient-sunset {
    background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FECFEF 100%);
}

/* Mountain gradient */
.gradient-mountain {
    background: linear-gradient(135deg, #6B7280 0%, #4B5563 50%, #374151 100%);
}

/* Desert gradient */
.gradient-desert {
    background: linear-gradient(135deg, #FED7AA 0%, #FDBA74 50%, #FB923C 100%);
}
```

#### **Modern UI Gradients**
```css
/* Glass morphism gradient */
.gradient-glass {
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.1) 0%, 
        rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Dark glass morphism */
.gradient-glass-dark {
    background: linear-gradient(135deg, 
        rgba(0, 0, 0, 0.1) 0%, 
        rgba(0, 0, 0, 0.05) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### **4. Animation Gradients**

#### **Screen Transition Gradients**
```css
/* 3D flip animation gradient (from App.tsx) */
.gradient-flip-animation {
    background: linear-gradient(135deg, #E11D48 0%, #EC4899 50%, #8B5CF6 100%);
}

/* Loading/shimmer gradient */
.gradient-shimmer {
    background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.6) 50%, 
        transparent 100%);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
```

---

## 🌙 Dark Mode Color Strategy

### **Dark Mode Principles**
1. **Contrast Preservation**: Maintain WCAG AAA compliance
2. **Brand Consistency**: Rose colors adapt while keeping identity
3. **Eye Comfort**: Reduced blue light, warmer tones
4. **Premium Feel**: Deep blacks with subtle gradients

### **Dark Mode Color Mappings**
```css
.dark {
    /* Primary colors - softer in dark mode */
    --primary: #FB7185;                 /* Rose 400 instead of 600 */
    --primary-foreground: #FFFFFF;
    
    /* Backgrounds - deep blacks and grays */
    --background: #0A0A0A;              /* Deep black */
    --card: #1A1A1A;                    /* Dark gray cards */
    --secondary: #2A2A2A;               /* Lighter gray for emphasis */
    
    /* Text colors - high contrast whites */
    --foreground: #FFFFFF;              /* Pure white text */
    --muted-foreground: #A3A3A3;        /* Muted gray text */
    
    /* Interactive elements */
    --border: #2A2A2A;                  /* Dark borders */
    --input: #2A2A2A;                   /* Dark input backgrounds */
    --ring: #666666;                    /* Focus rings */
}
```

### **Dark Mode Gradients**
```css
/* Dark mode specific gradients */
.dark .gradient-rose-primary {
    background: linear-gradient(135deg, #FB7185 0%, #F472B6 100%);
}

.dark .gradient-partner {
    background: linear-gradient(135deg, #A78BFA 0%, #F472B6 100%);
}

.dark .gradient-glass {
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.05) 0%, 
        rgba(255, 255, 255, 0.02) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 📊 Chart & Data Visualization Colors

### **Chart Color Palette**
```css
--chart-1: oklch(0.646 0.222 41.116);  /* Warm orange */
--chart-2: oklch(0.6 0.118 184.704);    /* Cool blue */
--chart-3: oklch(0.398 0.07 227.392);   /* Deep purple */
--chart-4: oklch(0.828 0.189 84.429);   /* Bright green */
--chart-5: oklch(0.769 0.188 70.08);    /* Golden yellow */

/* Dark mode chart colors */
.dark {
    --chart-1: #FB7185;                 /* Rose */
    --chart-2: #F59E0B;                 /* Amber */
    --chart-3: #DB2777;                 /* Pink */
    --chart-4: #7C3AED;                 /* Violet */
    --chart-5: #06B6D4;                 /* Cyan */
}
```

### **Data Visualization Guidelines**
```css
/* Revenue/positive data */
.chart-positive {
    color: #10B981;                     /* Green for growth */
}

/* Expense/negative data */
.chart-negative {
    color: #EF4444;                     /* Red for decline */
}

/* Neutral data */
.chart-neutral {
    color: #6B7280;                     /* Gray for neutral */
}

/* Booking data */
.chart-bookings {
    color: #E11D48;                     /* Rose for bookings */
}

/* Review data */
.chart-reviews {
    color: #F59E0B;                     /* Amber for ratings */
}
```

---

## 🎭 Shadow & Elevation System

### **Shadow Definitions**
```css
/* Modern shadow system */
.shadow-modern {
    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 
                0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-airbnb {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.shadow-float {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
                0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Card elevation levels */
.shadow-card-1 {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.shadow-card-2 {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.12);
}

.shadow-card-3 {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.12);
}

.shadow-card-4 {
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

### **Dark Mode Shadows**
```css
.dark .shadow-modern {
    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.5), 
                0 4px 6px -2px rgba(0, 0, 0, 0.3);
}

.dark .shadow-card-1 {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.dark .shadow-card-2 {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.8);
}
```

---

## 🇵🇰 Pakistani Market Color Considerations

### **Cultural Color Meanings**
```css
/* Pakistani flag inspired colors */
--pakistan-green: #01411C;             /* Deep Islamic green */
--pakistan-green-light: #166534;       /* Lighter green for accents */
--pakistan-white: #FFFFFF;             /* Pure white */

/* Islamic/cultural considerations */
--islamic-gold: #D97706;               /* Traditional gold color */
--cultural-blue: #1E40AF;              /* Trust and stability */

/* Local brand colors for payment methods */
--easypaisa-green: #00A651;            /* EasyPaisa brand green */
--jazzcash-red: #ED1C24;               /* JazzCash brand red */
--hbl-blue: #005BAA;                   /* HBL bank blue */
--ubl-green: #0F7554;                  /* UBL bank green */
```

### **Cultural Usage Guidelines**
- **Green**: Use respectfully for positive actions, success states
- **Gold**: Premium features, loyalty programs, special offers
- **Red**: Use carefully - while it's used in payment brands, be mindful of cultural associations
- **Blue**: Trust, security, banking - excellent for financial features

---

## 📱 Flutter Color System Migration

### **Flutter ColorScheme Mapping**
```dart
// Light Theme
ColorScheme lightColorScheme = ColorScheme.fromSeed(
  seedColor: Color(0xFFE11D48),        // Rose 600
  brightness: Brightness.light,
  primary: Color(0xFFE11D48),          // Rose 600
  onPrimary: Color(0xFFFFFFFF),        // White
  secondary: Color(0xFFF43F5E),        // Rose 500
  onSecondary: Color(0xFFFFFFFF),      // White
  surface: Color(0xFFFFFFFF),          // White
  onSurface: Color(0xFF0F0F0F),        // Near black
  background: Color(0xFFFFFFFF),       // White
  onBackground: Color(0xFF0F0F0F),     // Near black
  error: Color(0xFFEF4444),            // Red 500
  onError: Color(0xFFFFFFFF),          // White
);

// Dark Theme
ColorScheme darkColorScheme = ColorScheme.fromSeed(
  seedColor: Color(0xFFFB7185),        // Rose 400
  brightness: Brightness.dark,
  primary: Color(0xFFFB7185),          // Rose 400
  onPrimary: Color(0xFFFFFFFF),        // White
  secondary: Color(0xFFF472B6),        // Rose 300
  onSecondary: Color(0xFF000000),      // Black
  surface: Color(0xFF1A1A1A),          // Dark gray
  onSurface: Color(0xFFFFFFFF),        // White
  background: Color(0xFF0A0A0A),       // Deep black
  onBackground: Color(0xFFFFFFFF),     // White
  error: Color(0xFFDC2626),            // Red 600
  onError: Color(0xFFFFFFFF),          // White
);
```

### **Custom Flutter Colors Extension**
```dart
extension TripAvailColors on ColorScheme {
  // Brand gradients as color lists for Flutter gradients
  List<Color> get rosePrimaryGradient => [
    Color(0xFFE11D48),  // Rose 600
    Color(0xFFFB7185),  // Rose 400
  ];
  
  List<Color> get partnerGradient => [
    Color(0xFF8B5CF6),  // Violet 500
    Color(0xFFEC4899),  // Pink 500
  ];
  
  List<Color> get successGradient => [
    Color(0xFF10B981),  // Emerald 500
    Color(0xFF059669),  // Emerald 600
  ];
  
  // Pakistani payment brand colors
  Color get easyPaisaGreen => Color(0xFF00A651);
  Color get jazzCashRed => Color(0xFFED1C24);
  Color get hblBlue => Color(0xFF005BAA);
  Color get ublGreen => Color(0xFF0F7554);
  
  // Status colors
  Color get warningColor => Color(0xFFF59E0B);
  Color get infoColor => Color(0xFF3B82F6);
  Color get successColor => Color(0xFF10B981);
}
```

### **Flutter Gradient Implementations**
```dart
// Primary brand gradient
LinearGradient rosePrimaryGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [
    Color(0xFFE11D48),  // Rose 600
    Color(0xFFFB7185),  // Rose 400
  ],
);

// Partner mode gradient
LinearGradient partnerGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [
    Color(0xFF8B5CF6),  // Violet 500
    Color(0xFFEC4899),  // Pink 500
  ],
);

// Glass morphism container
Container glassContainer = Container(
  decoration: BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Colors.white.withOpacity(0.1),
        Colors.white.withOpacity(0.05),
      ],
    ),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(
      color: Colors.white.withOpacity(0.2),
      width: 1,
    ),
  ),
  child: BackdropFilter(
    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
    child: YourContentWidget(),
  ),
);
```

---

## 🎯 Usage Guidelines & Best Practices

### **Color Usage Hierarchy**
1. **Primary Colors**: Main actions, navigation, brand elements
2. **Secondary Colors**: Supporting actions, less emphasized elements
3. **Semantic Colors**: Status indicators, feedback, alerts
4. **Neutral Colors**: Text, backgrounds, borders, subtle elements

### **Accessibility Standards**
- **WCAG AAA Compliance**: Minimum 7:1 contrast ratio for normal text
- **WCAG AA Compliance**: Minimum 4.5:1 contrast ratio for large text
- **Color Blind Friendly**: Never rely solely on color for information
- **High Contrast Mode**: Support system-level high contrast preferences

### **Animation & Transition Guidelines**
```css
/* Standard transition duration */
.transition-colors {
    transition: background-color 0.3s ease, 
                border-color 0.3s ease, 
                color 0.3s ease;
}

/* Hover state transitions */
.hover-transition {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus state transitions */
.focus-transition {
    transition: box-shadow 0.15s ease-in-out, 
                border-color 0.15s ease-in-out;
}
```

### **Color Testing Checklist**
- [ ] Test all colors in both light and dark modes
- [ ] Verify accessibility compliance with contrast checkers
- [ ] Test with color blindness simulators
- [ ] Validate on different devices and screen types
- [ ] Check cultural appropriateness for Pakistani market
- [ ] Test gradient performance on low-end devices

This comprehensive color system ensures consistency, accessibility, and premium user experience across all platforms while maintaining the sophisticated, trustworthy brand identity that TripAvail represents in the Pakistani travel market! 🎨✈️