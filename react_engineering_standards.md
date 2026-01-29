# TripAvail - React Web Engineering Standards (World-Class)

> **Document Purpose**: Mandatory engineering standards for building scalable, accessible, high-performance React Web applications.

---

## 1️⃣ CORE PHILOSOPHY

### **Web-First, Not Mobile-Stretched**
- Desktop & keyboard are **primary** input methods
- Mobile layouts are responsive **fallbacks**, not the base
- Design for 1920px first, then adapt down to 320px

### **Design Tokens Over Pixels**
- Layout adapts via constraints and flow, not fixed numbers
- Use Tailwind's spacing scale, not arbitrary values
- Responsive breakpoints drive layout changes

### **Predictable Structure Beats Clever UI**
Users must always know:
- ✅ Where they are (breadcrumbs, active nav)
- ✅ What they can do (clear CTAs, enabled/disabled states)
- ✅ How to go back (browser back button works)

### **Non-Negotiable Principles**
- Performance (Core Web Vitals)
- Accessibility (WCAG AA minimum)
- Clarity (no mystery meat navigation)

---

## 2️⃣ THEMING & DESIGN TOKENS

### **Tailwind Config is the Single Source of Truth**

❌ **FORBIDDEN**:
```tsx
// Hard-coded colors
<div className="bg-[#3B82F6]">

// Arbitrary values
<div className="w-[347px]">

// Inline styles
<div style={{ color: '#FF0000' }}>
```

✅ **ALLOWED**:
```tsx
// Tailwind design tokens only
<div className="bg-primary-600 text-neutral-50">
<div className="w-full max-w-screen-xl">
```

### **Design Token System**

| Token Type | Defined In | Usage |
|------------|-----------|-------|
| **Colors** | `tailwind.config.js` → `colors` | `bg-primary-600`, `text-neutral-900` |
| **Typography** | `tailwind.config.js` → `fontSize` | `text-base`, `text-lg`, `font-semibold` |
| **Spacing** | Tailwind's default scale | `p-4`, `gap-6`, `space-y-8` |
| **Radius** | `tailwind.config.js` → `borderRadius` | `rounded-lg`, `rounded-xl` |
| **Shadows** | `tailwind.config.js` → `boxShadow` | `shadow-md`, `shadow-lg` |
| **Breakpoints** | `tailwind.config.js` → `screens` | `md:`, `lg:`, `xl:` |

### **Rule**: If a value is repeated → it becomes a token

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { /* extracted from existing screens */ },
        secondary: { /* extracted from existing screens */ },
      },
      maxWidth: {
        'content': '1280px', // Max content width
      },
    },
  },
}
```

---

## 2️⃣.1 ROLE-BASED BRAND THEMING (TripAvail-Specific) 🔒

### **Roles**

- 🧳 **Traveller** - Airbnb Rose
- 🏨 **Hotel Manager** - Purple Cyan Flow
- 🗺️ **Tour Operator** - Bright Coral

### **Rule**: Role branding is implemented ONLY via Tailwind design tokens and CSS variables

**Components must NEVER branch on role logic.**

---

### **Authoritative Brand Tokens**

#### 🧳 **Traveller** — Airbnb Rose
```css
--primary-gradient: linear-gradient(135deg, #FF385C 0%, #FF6B9D 100%);
--primary: #FF385C;
```

#### 🏨 **Hotel Manager** — Purple Cyan Flow
```css
--primary-gradient: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);
--primary: #9D4EDD;
```

#### 🗺️ **Tour Operator** — Bright Coral
```css
--primary: #FD5E53;
```

---

### **Implementation Pattern (Tailwind + CSS Vars)**

```css
/* globals.css */
:root[data-role="traveller"] {
  --primary-gradient: linear-gradient(135deg, #FF385C 0%, #FF6B9D 100%);
  --primary: #FF385C;
  --primary-hover: #E0304F;
  --primary-light: #FFE8ED;
}

:root[data-role="hotel-manager"] {
  --primary-gradient: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);
  --primary: #9D4EDD;
  --primary-hover: #8B44C7;
  --primary-light: #F3E8FF;
}

:root[data-role="tour-operator"] {
  --primary: #FD5E53;
  --primary-hover: #E34D44;
  --primary-light: #FFE9E7;
}
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },
      },
      backgroundImage: {
        'primary-gradient': 'var(--primary-gradient)',
      },
    },
  },
}
```

```tsx
// ✅ CORRECT: Use design tokens
<button className="bg-primary hover:bg-primary-hover text-white">
  Primary CTA
</button>

<div className="bg-primary-gradient">
  Hero section
</div>
```

---

### **🚫 Hard Rules**

❌ **FORBIDDEN**:
```tsx
// NO role branching in components
if (role === 'traveller') {
  return <button className="bg-rose-500">Book</button>
}

// NO inline gradients
<div style={{ background: 'linear-gradient(...)' }}>

// NO per-role components
if (role === 'hotel-manager') return <HotelButton />
```

✅ **CORRECT**:
```tsx
// Components are role-agnostic
<button className="bg-primary">Book</button>

// Role is set at root level via data attribute
<html data-role={activeRole}>
```

---

## 3️⃣ LAYOUT SYSTEM (Web-Grade)

### **3.1 Content Width Rules**

**Unbounded width is forbidden.**

```tsx
// ❌ WRONG: Full-width content
<div className="w-full">
  <p>This text will stretch to 3000px on ultrawide monitors</p>
</div>

// ✅ CORRECT: Constrained content
<div className="w-full max-w-content mx-auto px-6">
  <p>This text is readable on all screen sizes</p>
</div>
```

**Pattern**:
- Backgrounds may stretch to full width
- Content must be constrained to `max-w-content` (1280px)
- Use `mx-auto` to center content
- Use `px-4` or `px-6` for horizontal padding

### **3.2 Breakpoints (Mandatory)**

```typescript
// Use Tailwind's responsive prefixes
const breakpoints = {
  sm: '640px',  // Mobile landscape
  md: '768px',  // Tablet
  lg: '1024px', // Desktop
  xl: '1280px', // Large desktop
  '2xl': '1536px', // Ultra-wide
}
```

**Responsive Behavior**:

| Size | Behavior | Example |
|------|----------|---------|
| **Mobile** (`< 768px`) | Single column, stacked | `flex-col` |
| **Tablet** (`768px - 1024px`) | Two columns | `md:grid-cols-2` |
| **Desktop** (`≥ 1024px`) | Multi-panel | `lg:grid-cols-3` |

```tsx
// ✅ Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### **3.3 Spacing Strategy**

**Layout spacing → Tailwind scale**
```tsx
// ✅ Use Tailwind's spacing scale
<div className="space-y-6">      {/* 24px vertical spacing */}
<div className="gap-4">          {/* 16px gap */}
<div className="p-8">            {/* 32px padding */}
```

**Vertical rhythm → Typography-driven**
```tsx
// ✅ Spacing based on line height
<div className="space-y-4">      {/* 1rem = 16px */}
  <h1 className="text-3xl">Title</h1>
  <p className="text-base">Body text</p>
</div>
```

❌ **FORBIDDEN**:
```tsx
// No dynamic spacing based on viewport
<div style={{ height: `${window.innerHeight * 0.05}px` }}>

// No arbitrary values without justification
<div className="h-[347px]">
```

---

## 4️⃣ NAVIGATION & ROUTING

### **URL is the Source of Truth**

Every screen must map to a URL:
```
/                          → Home
/search                    → Search
/properties/:id            → Property detail
/properties/:id/booking    → Booking checkout
/trips                     → My trips
/trips/:id                 → Trip detail
```

### **Rules**:

❌ **FORBIDDEN**:
```tsx
// No navigation in render
<button onClick={() => navigate('/trips')}>

// No modal-only screens (must have URL)
<Modal> {/* This screen has no URL */}
```

✅ **ALLOWED**:
```tsx
// Navigation in event handlers
const handleViewTrips = () => {
  navigate('/trips')
}

// Modals with URL state
/properties/123?modal=booking
```

### **Breadcrumbs Required for Depth > 2**

```tsx
// ✅ Depth 3 requires breadcrumbs
// /properties/123/booking
<Breadcrumbs>
  <Link to="/">Home</Link>
  <Link to="/properties/123">Property Name</Link>
  <span>Booking</span>
</Breadcrumbs>
```

### **Browser Back Button Must Work**

- ✅ Refresh must not break state
- ✅ Back button returns to previous screen
- ✅ Forward button works as expected

---

## 5️⃣ INTERACTION MODEL (Web-Native)

### **Mouse, Keyboard & Focus**

All interactive elements must support:
- **Hover** (visual feedback)
- **Focus** (keyboard navigation)
- **Keyboard activation** (Enter/Space)

```tsx
// ❌ WRONG: No hover/focus states
<div onClick={handleClick}>Click me</div>

// ✅ CORRECT: Proper button with states
<button
  onClick={handleClick}
  className="
    bg-primary-600 hover:bg-primary-700 
    focus:ring-2 focus:ring-primary-500 focus:outline-none
    transition-colors duration-200
  "
>
  Click me
</button>
```

### **Focus Indicators Must Be Visible**

```tsx
// ✅ Always show focus ring
className="focus:ring-2 focus:ring-primary-500 focus:outline-none"

// ❌ Never hide focus
className="focus:outline-none" // ONLY if custom focus ring added
```

### **Cursor Feedback**

```tsx
// ✅ Interactive elements
className="cursor-pointer"

// ✅ Disabled elements
className="cursor-not-allowed opacity-50"

// ✅ Loading states
className="cursor-wait"
```

---

## 6️⃣ FORMS & INPUT

### **Keyboard-First UX**

- **Enter** submits form
- **Tab** moves to next field (logical order)
- **Escape** cancels/closes
- **Arrow keys** navigate dropdowns/lists

```tsx
// ✅ Form with keyboard support
<form onSubmit={handleSubmit}>
  <input
    type="text"
    onKeyDown={(e) => {
      if (e.key === 'Escape') handleCancel()
    }}
  />
  <button type="submit">Submit</button>
</form>
```

### **Validation**

- Errors appear **inline** (next to field)
- Errors are **human-readable**
- No silent failures
- No toast-only validation

```tsx
// ❌ WRONG: Toast-only error
toast.error('Invalid email')

// ✅ CORRECT: Inline error
<div>
  <input type="email" className={errors.email ? 'border-red-500' : ''} />
  {errors.email && (
    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
  )}
</div>
```

---

## 7️⃣ STATE MANAGEMENT

### **Principles**

- UI is **reactive**, not imperative
- Business logic **never** touches UI
- State rebuilds are **localized**

### **Rules**:

```tsx
// ✅ Business logic in services (packages/shared)
// packages/shared/src/bookings/service.ts
export class BookingService {
  async createBooking(data: CreateBookingInput) {
    // Business logic here
  }
}

// ✅ UI logic in components (packages/web)
// packages/web/src/components/BookingForm.tsx
export function BookingForm() {
  const { mutate, isLoading } = useMutation({
    mutationFn: bookingService.createBooking
  })
  
  // Only UI concerns here
}
```

### **State Boundaries**

```tsx
// ✅ Zustand: ONLY UI state
const useUIStore = create<UIStore>((set) => ({
  activeRole: 'traveller',
  isDrawerOpen: false,
  theme: 'light',
}))

// ✅ TanStack Query: ALL server data
const { data: bookings } = useQuery({
  queryKey: ['bookings', userId],
  queryFn: () => bookingService.getBookings(userId)
})
```

### **Localized Re-renders**

❌ **WRONG**: Rebuilding entire page
```tsx
const [count, setCount] = useState(0) // At page level
// Entire page re-renders when count changes
```

✅ **CORRECT**: Localized state
```tsx
// Extract component with local state
function Counter() {
  const [count, setCount] = useState(0)
  // Only Counter re-renders
}
```

---

## 8️⃣ PERFORMANCE ENGINEERING

### **Rendering**

**Lists → Virtualization (if > 50 items)**
```tsx
// ✅ For long lists
import { useVirtualizer } from '@tanstack/react-virtual'

// ✅ For short lists
{items.map(item => <Item key={item.id} />)}
```

**Heavy Components → Lazy Loading**
```tsx
// ✅ Code splitting
const HotelListingFlow = lazy(() => import('./HotelListingFlow'))

<Suspense fallback={<LoadingSpinner />}>
  <HotelListingFlow />
</Suspense>
```

**Memoization**
```tsx
// ✅ Expensive calculations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.price - b.price),
  [items]
)

// ✅ Callback stability
const handleClick = useCallback(() => {
  // handler
}, [dependencies])
```

### **Images**

```tsx
// ✅ CORRECT: Constrained, lazy-loaded, with fallback
<img
  src={property.image}
  alt={property.name}
  loading="lazy"
  className="w-full h-64 object-cover"
  onError={(e) => {
    e.currentTarget.src = '/placeholder.jpg'
  }}
/>
```

❌ **FORBIDDEN**:
```tsx
// Unconstrained images
<img src={url} /> // Will break layout

// No lazy loading
<img src={url} loading="eager" /> // Slows initial load

// No fallback
<img src={url} /> // Broken image icon on error
```

---

## 9️⃣ ACCESSIBILITY (WCAG-Aligned)

### **Mandatory**:

1. **Keyboard Navigation**
   ```tsx
   // All interactive elements must be keyboard accessible
   <button>Click me</button> // ✅ Focusable by default
   <div onClick={...}>Click me</div> // ❌ Not focusable
   ```

2. **Screen Reader Labels**
   ```tsx
   // ✅ Descriptive labels
   <button aria-label="Close modal">×</button>
   <img src="..." alt="Hotel exterior view" />
   
   // ❌ Missing labels
   <button>×</button> // Screen reader says "button"
   <img src="..." /> // Screen reader skips
   ```

3. **Contrast ≥ WCAG AA**
   - Text: 4.5:1 minimum
   - Large text: 3:1 minimum
   - Use contrast checker tools

4. **System Text Scaling Respected**
   ```tsx
   // ✅ Relative units
   className="text-base" // Respects user's font size
   
   // ❌ Fixed units
   style={{ fontSize: '16px' }} // Ignores user preference
   ```

5. **No Color-Only Meaning**
   ```tsx
   // ❌ Color-only status
   <div className="text-red-600">Error</div>
   
   // ✅ Icon + color
   <div className="text-red-600">
     <AlertIcon /> Error
   </div>
   ```

---

## 🔟 ERROR, LOADING & EMPTY STATES

### **Every Async View Must Define:**

```tsx
function BookingsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings
  })
  
  // ✅ Loading state
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  // ✅ Error state (with retry)
  if (error) {
    return (
      <ErrorState
        message="Failed to load bookings"
        onRetry={() => queryClient.invalidateQueries(['bookings'])}
      />
    )
  }
  
  // ✅ Empty state
  if (data.length === 0) {
    return (
      <EmptyState
        title="No bookings yet"
        description="Start exploring properties to make your first booking"
        action={<Button>Explore Properties</Button>}
      />
    )
  }
  
  // ✅ Success state
  return <BookingsGrid bookings={data} />
}
```

❌ **FORBIDDEN**: Blank screens

---

## 1️⃣1️⃣ CODE QUALITY RULES

### **TypeScript**

```tsx
// ✅ Explicit types for props
interface BookingCardProps {
  booking: Booking
  onCancel: (id: string) => void
}

// ✅ Type inference for simple cases
const [count, setCount] = useState(0) // number inferred

// ❌ Any types
const data: any = await fetch(...) // FORBIDDEN
```

### **Const Everywhere Possible**

```tsx
// ✅ Const for immutable values
const MAX_GUESTS = 10
const bookingId = '123'

// ✅ Let only when reassignment needed
let currentStep = 0
currentStep += 1
```

### **No Business Logic in Components**

```tsx
// ❌ WRONG: Business logic in component
function BookingForm() {
  const handleSubmit = async (data) => {
    const price = calculatePrice(data) // Business logic
    const tax = price * 0.1 // Business logic
    await supabase.from('bookings').insert({ ...data, price, tax })
  }
}

// ✅ CORRECT: Business logic in service
function BookingForm() {
  const { mutate } = useMutation({
    mutationFn: bookingService.createBooking // Service handles logic
  })
}
```

### **No TODOs in Production**

```tsx
// ❌ FORBIDDEN in main branch
// TODO: Add validation

// ✅ Create GitHub issue instead
// See issue #123 for validation improvement
```

### **No Commented-Out Code**

```tsx
// ❌ FORBIDDEN
// const oldFunction = () => { ... }

// ✅ Delete it (Git history preserves it)
```

### **shadcn/ui Variant Enforcement** 🔒

**All buttons, inputs, dialogs, and dropdowns must extend shadcn/ui primitives.**

**No custom HTML buttons allowed unless explicitly approved.**

```tsx
// ✅ CORRECT: Use shadcn/ui components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'

<Button variant="default" size="lg">Book Your Adventure</Button>
<Input placeholder="Search destinations" />
<Dialog>...</Dialog>
```

❌ **FORBIDDEN**:
```tsx
// Custom HTML button without approval
<button className="...custom styles...">Click me</button>

// Custom input without approval
<input className="...custom styles..." />
```

**Exception**: Custom components allowed ONLY if:
1. shadcn/ui doesn't provide the pattern
2. Design approval obtained
3. Component added to shared UI library

---

## 1️⃣1️⃣.1 PIXEL-MATCH FIDELITY RULE (TripAvail-Specific) 🔒

### **UI Must Match `extracted_tripavail_frontend_screens` Exactly**

**No visual refactors without design approval.**

**Spacing, font sizes, and alignment must not "approximate".**

---

### **Rules**:

❌ **"Looks close enough" is NOT acceptable**
```tsx
// WRONG: Approximating spacing
<div className="p-5">  {/* Original uses p-6 */}

// WRONG: Approximating font size
<h1 className="text-2xl">  {/* Original uses text-3xl */}

// WRONG: Approximating colors
<div className="bg-blue-500">  {/* Original uses bg-primary-600 */}
```

✅ **Exact match required**
```tsx
// CORRECT: Exact spacing from extracted screens
<div className="p-6">  {/* Matches original exactly */}

// CORRECT: Exact font size from extracted screens
<h1 className="text-3xl">  {/* Matches original exactly */}

// CORRECT: Exact colors from design system
<div className="bg-primary-600">  {/* Matches original exactly */}
```

---

### **Verification Process**:

1. **Screenshot Comparison**
   - Take screenshot of extracted screen
   - Take screenshot of new implementation
   - Overlay and compare pixel-by-pixel

2. **Diff-Based Comparison** (Encouraged)
   - Use tools like Percy, Chromatic, or manual diff
   - Flag any visual differences
   - Justify or fix differences

3. **Design Review**
   - Any deviation requires design approval
   - Document approved deviations
   - Update design system if pattern changes

---

### **Quality Bar**:

- ✅ A user familiar with extracted screens **cannot tell** which screens are new
- ✅ Visual consistency is **100%** across all screens
- ✅ Spacing, typography, colors match **exactly**
- ❌ "Close enough" fails review
- ❌ "Looks better" without approval fails review

---

## 1️⃣2️⃣ TESTING & PR RULES

### **PR Must Include:**

1. **Desktop + Tablet Screenshots**
   - Show before/after for UI changes
   - Include different screen sizes

2. **Keyboard Navigation Test**
   - Tab through all interactive elements
   - Verify focus indicators visible
   - Verify Enter/Space activate buttons

3. **URL Refresh Test**
   - Refresh page at each route
   - Verify state persists
   - Verify no errors

4. **Resize Test (320px → 1920px)**
   - No horizontal scroll
   - Content remains readable
   - Layout adapts at breakpoints

5. **Accessibility Check**
   - Run Lighthouse accessibility audit
   - Score ≥ 90
   - Fix any violations

---

## 1️⃣3️⃣ EXPLICIT ANTI-PATTERNS (Hard NO)

### ❌ **Mobile Bottom Sheets as Navigation**
```tsx
// FORBIDDEN: Bottom sheet for navigation
<BottomSheet>
  <Link to="/trips">My Trips</Link>
</BottomSheet>

// Use proper navigation drawer or menu
```

### ❌ **Full-Width Text Blocks**
```tsx
// FORBIDDEN: Unbounded text
<p className="w-full">Long paragraph...</p>

// CORRECT: Constrained text
<p className="max-w-prose">Long paragraph...</p>
```

### ❌ **Height-Driven Layouts**
```tsx
// FORBIDDEN: Fixed heights
<div className="h-screen">
  <div className="h-1/3">Header</div>
  <div className="h-2/3">Content</div>
</div>

// CORRECT: Content-driven heights
<div className="min-h-screen flex flex-col">
  <header>Header</header>
  <main className="flex-1">Content</main>
</div>
```

### ❌ **onClick Without Hover Feedback**
```tsx
// FORBIDDEN: No visual feedback
<div onClick={handleClick}>Click me</div>

// CORRECT: Hover + focus states
<button
  onClick={handleClick}
  className="hover:bg-gray-100 focus:ring-2"
>
  Click me
</button>
```

### ❌ **UI Logic Inside Services**
```tsx
// FORBIDDEN: Service showing toast
export class BookingService {
  async createBooking(data) {
    const result = await api.post('/bookings', data)
    toast.success('Booking created!') // UI logic in service!
    return result
  }
}

// CORRECT: Service returns data, component handles UI
export class BookingService {
  async createBooking(data) {
    return await api.post('/bookings', data)
  }
}

// Component handles UI feedback
const { mutate } = useMutation({
  mutationFn: bookingService.createBooking,
  onSuccess: () => toast.success('Booking created!')
})
```

---

## 📊 CHECKLIST FOR EVERY COMPONENT

Before committing, verify:

- [ ] Uses design tokens (no hard-coded colors/sizes)
- [ ] Content is constrained (max-w-content)
- [ ] Responsive at all breakpoints (320px - 1920px)
- [ ] Keyboard accessible (tab, enter, escape work)
- [ ] Focus indicators visible
- [ ] Screen reader labels present
- [ ] Loading/error/empty states defined
- [ ] No business logic in component
- [ ] No TODOs or commented code
- [ ] TypeScript types explicit
- [ ] Matches existing design system
- [ ] Matches extracted screens exactly (pixel-perfect)
- [ ] Uses shadcn/ui primitives (no custom HTML elements)
- [ ] Role-agnostic (no role branching in component)

---

## 🔒 TECHNOLOGY DECISIONS (LOCKED)

### **Approved Stack**

✅ **React Web** - Approved and locked
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand + TanStack Query
- Supabase backend

❌ **NOT Part of TripAvail**
- Flutter Web
- Vue.js
- Angular
- Svelte

### **Change Process**

**Technology decisions are locked.**

**Changes require executive re-approval.**

**Process**:
1. Document technical justification
2. Present to product owner
3. Get executive sign-off
4. Update technical execution plan
5. Communicate to entire team

**Rationale**: Prevents confusion, maintains consistency, protects investment in current stack.

---

*Last Updated: 2026-01-30*  
*Document Version: 1.1*  
*Status: MANDATORY STANDARDS*  
*TripAvail-Specific Additions: Role-based theming, shadcn/ui enforcement, pixel-match rule, technology lock*
