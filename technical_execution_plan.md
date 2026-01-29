# TripAvail - Technical Execution Plan

> **Document Purpose**: Production-grade technical plan for building TripAvail web portal (Phase 1) and future mobile app (Phase 2) with clear execution strategy, tech stack justifications, and quality standards.

---

## 1️⃣ STARTING POINT STRATEGY

### **Recommended Approach: Backend-First with Contracts**

```
Phase 0: Product Constraints Lock (Week 0)
  ↓
Phase 1A: Backend Foundation (Week 1-2)
  ↓
Phase 1B: Shared Contracts & Types (Week 2-3)
  ↓
Phase 1C: Frontend Development (Week 3-8)
  ↓
Phase 1D: Integration & Testing (Week 8-10)
```

### **Why Backend-First?**

#### **1. Database Schema is the Source of Truth**
- **Role switching logic** requires proper database constraints (partner role exclusivity)
- **RLS policies** must be defined before frontend can safely query data
- **Real-time subscriptions** need proper database triggers and channels
- **Data models** drive TypeScript types for frontend

#### **2. API Contracts Define Frontend Behavior**
- Frontend cannot be built without knowing API shapes
- Type safety requires backend types to be generated first
- Real-time channel names and events must be defined
- Authentication flows need backend endpoints

#### **3. Parallel Development After Foundation**
Once backend foundation is set:
- Frontend team can work independently
- Shared types ensure type safety
- Mock data can be replaced with real API calls
- No blocking dependencies

---

### **Execution Sequence (Detailed)**

#### **Week 0: Product Constraints Lock** ⚠️ **CRITICAL**

> **Purpose**: Lock product rules in writing BEFORE any code to prevent backend drift.

```markdown
# Product Constraints Document

## 1. Role Constraint (Mutual Exclusivity)
✓ Every user starts as Traveller
✓ Traveller can choose ONLY ONE partner role:
  - Hotel Manager OR Tour Operator (never both)
✓ This choice is permanent
✓ User can switch between: Traveller ↔ chosen partner role
✓ Database trigger enforces this constraint

## 2. Verification Semantics
✓ Traveller: Optional (unlocks verified badge)
✓ Hotel Manager: Required for publishing properties
✓ Tour Operator: Required for publishing tours
✓ Verification gates:
  - Publishing (draft → published)
  - Payout eligibility
  - Search visibility (may be reduced if unverified)

## 3. Booking Ownership Rules
✓ Traveller creates bookings
✓ Hotel Manager receives property bookings
✓ Tour Operator receives tour bookings
✓ Same user can have bookings in multiple roles
✓ Bookings are role-context aware

## 4. Data Persistence Rules
✓ All data linked to user_id (not role)
✓ Properties persist when switching to Traveller
✓ Tours persist when switching to Traveller
✓ Traveller bookings persist when switching to partner

## 5. Payment Gateway (Postponed Decision)
⚠️ Payment gateway choice not locked yet (Stripe vs Razorpay vs both)
⚠️ This decision will be made in Phase 4 (backend implementation)
⚠️ Booking checkout UI will be built with abstraction layer
✓ Payment integration will be pluggable (not hardcoded)

## 6. Frontend Design Constraint 🔒 **NON-NEGOTIABLE**

> **CRITICAL**: The frontend UI/UX is ALREADY DESIGNED.

✓ The folder `extracted_tripavail_frontend_screens` contains ~90% of the final frontend
✓ These screens are NOT references, NOT inspiration, NOT drafts
✓ **The web portal MUST look and behave EXACTLY like the existing screens**
✓ Any missing screens (e.g., Traveller booking checkout & confirmation) MUST:
  - Follow the same visual language
  - Follow the same navigation patterns
  - Feel like they were always part of the same app
✓ **Treat extracted frontend screens as the single source of truth for UI**

**Implementation Rule**:
- ❌ Do NOT redesign or "improve" existing screens
- ❌ Do NOT use different UI patterns or components
- ❌ Do NOT deviate from the established design system
- ✅ DO replicate the exact look, feel, and behavior
- ✅ DO extract and reuse existing components
- ✅ DO maintain visual consistency for new screens
```

**Deliverable**: `product_constraints.md` signed off by product owner

**Why This Matters**:
- ❌ Without this: Backend team makes assumptions → rewrites later
- ✅ With this: Clear constraints → correct implementation first time

> **Note on Verification Flow Visualization**: Verification state transitions (Pending → Approved → Rejected → Retry) will be documented with UI flow diagrams in Phase 4 when implementing the verification backend workflow.

---

#### **Week 1-2: Backend Foundation**

```sql
-- 1. Database Schema
✓ Create all tables (users, user_roles, properties, tours, bookings)
✓ Add constraints and triggers (partner role exclusivity)
✓ Set up RLS policies
✓ Create database functions (switch_user_role, etc.)

-- 2. Authentication
✓ Supabase Auth setup
✓ Email/password authentication
✓ Social auth (Google, Facebook) - optional
✓ JWT token management

-- 3. Real-time Channels
✓ Define channel naming conventions
✓ Set up postgres_changes listeners
✓ Test real-time subscriptions

-- 4. Core API Functions
✓ User management RPCs
✓ Role switching RPC
✓ CRUD operations for properties/tours
✓ Booking management RPCs
```

#### **Week 2-3: Shared Contracts & Types**

```typescript
// 1. Generate TypeScript types from Supabase
✓ Use supabase-js type generation
✓ Create shared types package
✓ Define API response/request interfaces

// 2. Create shared utilities
✓ API client wrapper
✓ Real-time service
✓ Role management service
✓ Validation schemas (Zod)

// 3. Set up monorepo structure
✓ Create packages/shared
✓ Configure TypeScript paths
✓ Set up build pipeline
```

#### **Week 3-8: Frontend Development**

```typescript
// 1. Core infrastructure (Week 3)
✓ Set up Vite + React + TypeScript
✓ Configure routing (React Router)
✓ Set up state management (Zustand/React Query)
✓ **Extract design system from existing screens**
✓ **Catalog existing components from extracted_tripavail_frontend_screens**
✓ **Create component library matching existing UI exactly**

// 2. Authentication & Role Switching (Week 4)
✓ Login/signup screens
✓ Role selection flow
✓ Role switching UI
✓ Protected routes

// 3. Traveller Screens (Week 5)
✓ Home/Dashboard
✓ Search & Results
✓ Property/Package details
✓ Booking flow (checkout + confirmation)
✓ Trips, Wishlist, Profile

// 4. Hotel Manager Screens (Week 6-7)
✓ Dashboard
✓ 10-step hotel listing flow
✓ 10-step package creation flow
✓ Calendar, Properties, Bookings

// 5. Tour Operator Screens (Week 7-8)
✓ Dashboard
✓ 7-step tour creation flow
✓ Tours, Calendar, Bookings

// 6. Shared Screens (Week 8)
✓ Verification
✓ Settings
✓ Help & Support
```

#### **Week 8-10: Integration & Testing**

```
✓ End-to-end testing (Playwright)
✓ Real-time functionality testing
✓ Role switching testing
✓ Payment integration testing
✓ Performance optimization
✓ Security audit
✓ Deployment setup
```

---

## 2️⃣ TECH STACK (Production-Grade)

### **Web Portal (Phase 1)**

#### **Frontend Framework**
```
React 18+ with TypeScript
├─ Vite (build tool)
├─ React Router v6 (routing)
└─ TanStack Query v5 (server state)
```

**Why React?**
- ✅ **Industry standard** - Largest ecosystem, best hiring pool
- ✅ **TypeScript support** - First-class type safety
- ✅ **Performance** - React 18 concurrent features, automatic batching
- ✅ **Mobile ready** - React Native shares component logic
- ✅ **Real-time friendly** - Hooks make subscriptions clean
- ✅ **Long-term support** - Meta-backed, not going anywhere

**Why Vite?**
- ✅ **Fast HMR** - Instant updates during development
- ✅ **Modern** - Native ESM, optimized builds
- ✅ **TypeScript** - Zero-config TypeScript support
- ✅ **Production-ready** - Rollup-based optimized builds

**Why TanStack Query?**
- ✅ **Server state management** - Built for API data
- ✅ **Caching** - Automatic background refetching
- ✅ **Real-time integration** - Works with Supabase subscriptions
- ✅ **DevTools** - Best-in-class debugging
- ✅ **TypeScript** - Excellent type inference

---

#### **State Management**
```
Zustand (client state) + TanStack Query (server state)
```

**Why Zustand?**
- ✅ **Simple** - Minimal boilerplate vs Redux
- ✅ **TypeScript** - Excellent type inference
- ✅ **Performance** - Selector-based re-renders
- ✅ **DevTools** - Redux DevTools integration
- ✅ **Small** - 1KB gzipped

> ⚠️ **CRITICAL RULE**: State Management Boundaries

**State Architecture** (Enforced):
```typescript
// ✅ Zustand: ONLY for UI state (no server data)
interface UIStore {
  // Role switcher state
  activeRole: 'traveller' | 'hotel_manager' | 'tour_operator'
  
  // UI preferences
  theme: 'light' | 'dark'
  language: 'en' | 'es' | 'fr'
  
  // Temporary UI state
  isDrawerOpen: boolean
  activeModal: string | null
  
  // ❌ NEVER put server data here
  // user: User          // WRONG - use TanStack Query
  // bookings: Booking[] // WRONG - use TanStack Query
}

// ✅ TanStack Query: ALL server data (no UI state)
- useQuery(['user', userId])           // User profile
- useQuery(['properties', ownerId])    // Properties
- useQuery(['tours', operatorId])      // Tours
- useQuery(['bookings', travellerId])  // Bookings
- Real-time subscriptions invalidate queries
```

**Why This Separation?**
- ✅ Prevents state chaos (single source of truth)
- ✅ Automatic cache invalidation (TanStack Query)
- ✅ Easy debugging (clear boundaries)
- ✅ Prevents stale data bugs

---

#### **Backend (Supabase)**
```
Supabase (PostgreSQL + Auth + Realtime + Storage)
```

**Why Supabase?**
- ✅ **PostgreSQL** - Industry-standard relational database
- ✅ **Built-in Auth** - JWT, RLS, social auth
- ✅ **Real-time** - Native WebSocket subscriptions
- ✅ **Row-Level Security** - Database-level authorization
- ✅ **Storage** - File uploads (property photos, documents)
- ✅ **Edge Functions** - Serverless functions when needed
- ✅ **Self-hostable** - Not locked into vendor
- ✅ **TypeScript SDK** - Type-safe API client
- ✅ **Mobile ready** - Same SDK for React Native

**Alternatives Considered**:
- ❌ Firebase - Vendor lock-in, NoSQL limitations for complex queries
- ❌ Custom Node.js - More work, need to build auth/realtime
- ❌ AWS Amplify - Complex, vendor lock-in

---

#### **Styling**
```
Tailwind CSS v4 + shadcn/ui
```

**Why Tailwind CSS?**
- ✅ **Utility-first** - Fast development
- ✅ **Consistent design** - Design tokens built-in
- ✅ **Performance** - Purges unused CSS
- ✅ **Responsive** - Mobile-first by default
- ✅ **Dark mode** - Built-in support
- ✅ **TypeScript** - Type-safe with tailwind-merge
- ✅ **Matches existing screens** - Can replicate extracted UI exactly

**Why shadcn/ui?**
- ✅ **Copy-paste components** - Own the code, not a dependency
- ✅ **Radix UI primitives** - Accessible by default
- ✅ **Customizable** - Full control over styling
- ✅ **TypeScript** - Fully typed
- ✅ **Modern** - Uses latest React patterns
- ✅ **Flexible** - Can be styled to match existing design system

> ⚠️ **CRITICAL**: Tailwind + shadcn/ui will be configured to match the EXISTING design system from `extracted_tripavail_frontend_screens`. Do NOT use default shadcn/ui styling - customize to match extracted screens exactly.

---

#### **Real-time Updates**
```
Supabase Realtime (WebSocket) + TanStack Query
```

**Architecture**:
```typescript
// Real-time service wraps Supabase channels
class RealtimeService {
  // Subscribe to role-specific updates
  subscribeToBookings(userId, role, onUpdate) {
    const channel = supabase.channel(`bookings:${userId}:${role}`)
    channel.on('postgres_changes', { ... }, (payload) => {
      // Invalidate TanStack Query cache
      queryClient.invalidateQueries(['bookings'])
      onUpdate(payload)
    })
  }
}
```

**Why This Approach?**
- ✅ **Type-safe** - TypeScript types for all events
- ✅ **Automatic UI updates** - Query invalidation triggers re-render
- ✅ **Optimistic updates** - TanStack Query mutations
- ✅ **Reconnection** - Supabase handles WebSocket reconnection
- ✅ **Scalable** - Channels are namespaced by user/role

---

### **Mobile App (Phase 2)**

#### **Framework**
```
React Native with Expo
```

**Why React Native?**
- ✅ **Code reuse** - Share business logic with web (60-80%)
- ✅ **Same language** - TypeScript across all platforms
- ✅ **Same backend** - Supabase SDK works identically
- ✅ **Performance** - Native performance for UI
- ✅ **Team efficiency** - Same developers can work on both
- ✅ **Mature ecosystem** - Production-ready libraries

**Why Expo?**
- ✅ **Fast development** - Over-the-air updates
- ✅ **Native modules** - Easy access to device features
- ✅ **Build service** - No need for Xcode/Android Studio
- ✅ **Push notifications** - Built-in service
- ✅ **App distribution** - TestFlight/Play Store automation

**Alternatives Considered**:
- ❌ Flutter - Different language (Dart), can't share code with web
- ❌ Native (Swift/Kotlin) - 2x development effort, different teams

---

## 3️⃣ CODEBASE STRATEGY

### **Monorepo Structure (Recommended)**

```
tripavail/
├── packages/
│   ├── shared/                    # Shared business logic
│   │   ├── src/
│   │   │   ├── auth/             # ✅ Domain: Authentication
│   │   │   │   ├── api.ts        # Auth API calls
│   │   │   │   ├── service.ts    # Auth business logic
│   │   │   │   ├── types.ts      # Auth types
│   │   │   │   └── hooks.ts      # useAuth, useSession
│   │   │   ├── bookings/         # ✅ Domain: Bookings
│   │   │   │   ├── api.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── types.ts
│   │   │   │   ├── validation.ts # Zod schemas
│   │   │   │   └── hooks.ts      # useBooking, useBookings
│   │   │   ├── properties/       # ✅ Domain: Properties
│   │   │   │   ├── api.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── types.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── hooks.ts      # useProperty, useProperties
│   │   │   ├── tours/            # ✅ Domain: Tours
│   │   │   │   ├── api.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── types.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── hooks.ts      # useTour, useTours
│   │   │   ├── verification/     # ✅ Domain: Verification
│   │   │   │   ├── api.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── hooks.ts      # useVerification
│   │   │   ├── availability/     # ✅ Domain: Availability/Calendar
│   │   │   │   ├── api.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── hooks.ts      # useAvailability
│   │   │   ├── roles/            # ✅ Domain: Role Management
│   │   │   │   ├── api.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── hooks.ts      # useRole, useSwitchRole
│   │   │   ├── realtime/         # ✅ Infrastructure: Real-time
│   │   │   │   ├── service.ts    # RealtimeService
│   │   │   │   ├── types.ts
│   │   │   │   └── hooks.ts      # useRealtimeSubscription
│   │   │   ├── core/             # ✅ Shared utilities (minimal)
│   │   │   │   ├── client.ts     # Supabase client singleton
│   │   │   │   ├── constants.ts  # App-wide constants
│   │   │   │   └── utils.ts      # Generic helpers
│   │   │   └── types/            # ✅ Shared types only
│   │   │       └── database.ts   # Generated from Supabase
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                       # Web app (React + Vite)
│   │   ├── src/
│   │   │   ├── components/       # UI components
│   │   │   │   ├── ui/          # shadcn/ui components
│   │   │   │   ├── traveller/
│   │   │   │   ├── hotel-manager/
│   │   │   │   ├── tour-operator/
│   │   │   │   └── shared/
│   │   │   ├── screens/          # Page components
│   │   │   │   ├── traveller/
│   │   │   │   ├── hotel-manager/
│   │   │   │   └── tour-operator/
│   │   │   ├── layouts/          # Layout components
│   │   │   ├── routes/           # Route definitions
│   │   │   ├── store/            # Zustand stores
│   │   │   ├── styles/           # Global styles
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── mobile/                    # Mobile app (React Native + Expo)
│       ├── src/
│       │   ├── components/       # Mobile UI components
│       │   ├── screens/          # Mobile screens
│       │   ├── navigation/       # React Navigation
│       │   ├── store/            # Zustand stores
│       │   └── App.tsx
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
│
├── supabase/                      # Supabase project
│   ├── migrations/               # Database migrations
│   ├── functions/                # Edge functions
│   └── config.toml
│
├── scripts/                       # Build/deployment scripts
├── .github/                       # CI/CD workflows
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # Monorepo config
└── turbo.json                     # Turborepo config
```

---

---

### **Why Domain Boundaries in `packages/shared`?**

#### **❌ BAD: Layer-based (causes chaos at scale)**
```
shared/
├── services/     (20+ files, hard to navigate)
├── utils/        (30+ files, becomes junk drawer)
├── helpers/      (15+ files, unclear ownership)
└── types/        (25+ files, scattered)
```

**Problems**:
- Hard to find booking-related code (scattered across 4 folders)
- Unclear ownership (who maintains `helpers/formatDate.ts`?)
- Circular dependencies (utils imports services imports utils)
- Difficult to delete features (code spread everywhere)

#### **✅ GOOD: Domain-based (scales to 100+ developers)**
```
shared/
├── bookings/     (all booking logic in one place)
├── properties/   (all property logic in one place)
├── tours/        (all tour logic in one place)
└── auth/         (all auth logic in one place)
```

**Benefits**:
- ✅ Easy to find code (everything booking-related in `bookings/`)
- ✅ Clear ownership (booking team owns `bookings/`)
- ✅ No circular dependencies (domains don't import each other)
- ✅ Easy to delete (delete `bookings/` folder)
- ✅ Easy to test (test entire domain in isolation)

**Import Rules**:
```typescript
// ✅ ALLOWED: Domain imports from core
import { supabase } from '@tripavail/shared/core'

// ✅ ALLOWED: Domain imports from realtime
import { RealtimeService } from '@tripavail/shared/realtime'

// ❌ FORBIDDEN: Domain imports from another domain
import { BookingService } from '@tripavail/shared/bookings' // in properties/
// Instead: Use API calls or events
```

---

### **Why Monorepo?**

#### **1. Code Sharing**
```typescript
// packages/shared/src/services/RoleService.ts
export class RoleService {
  async switchRole(userId: string, newRole: Role) {
    // This exact code works in both web and mobile
    await supabase.rpc('switch_user_role', { 
      p_user_id: userId, 
      p_new_role: newRole 
    })
  }
}

// packages/web/src/screens/RoleSwitcher.tsx
import { RoleService } from '@tripavail/shared'
const roleService = new RoleService()

// packages/mobile/src/screens/RoleSwitcher.tsx
import { RoleService } from '@tripavail/shared'
const roleService = new RoleService() // Same code!
```

#### **2. Type Safety Across Packages**
```typescript
// packages/shared/src/types/database.ts (generated)
export type Property = Database['public']['Tables']['properties']['Row']

// Both web and mobile get same types
import type { Property } from '@tripavail/shared/types'
```

#### **3. Atomic Changes**
```bash
# One PR can update shared logic + web + mobile
git commit -m "Add booking cancellation feature"
  - packages/shared/src/services/BookingService.ts
  - packages/web/src/screens/BookingDetail.tsx
  - packages/mobile/src/screens/BookingDetail.tsx
```

#### **4. Unified Tooling**
```json
// Run all tests with one command
"scripts": {
  "test": "turbo run test",
  "build": "turbo run build",
  "dev": "turbo run dev --parallel"
}
```

---

### **Monorepo Tools**

#### **Package Manager: pnpm**
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

**Why pnpm?**
- ✅ **Fast** - Faster than npm/yarn
- ✅ **Disk efficient** - Content-addressable storage
- ✅ **Strict** - Prevents phantom dependencies
- ✅ **Workspace support** - Built-in monorepo support

#### **Build System: Turborepo**
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

**Why Turborepo?**
- ✅ **Incremental builds** - Only rebuild what changed
- ✅ **Remote caching** - Share build cache across team
- ✅ **Parallel execution** - Fast builds
- ✅ **Simple config** - Minimal setup

---

### **Avoiding Rewrite When Moving Web → Mobile**

#### **Strategy: Platform-Agnostic Business Logic**

```typescript
// ✅ GOOD: Platform-agnostic (works everywhere)
// packages/shared/src/services/BookingService.ts
export class BookingService {
  async createBooking(data: CreateBookingInput) {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(data)
      .select()
      .single()
    
    if (error) throw new BookingError(error.message)
    return booking
  }
}

// ❌ BAD: Platform-specific (web-only)
export function createBooking(data: CreateBookingInput) {
  // Using window.fetch - doesn't work in React Native
  return fetch('/api/bookings', { ... })
}
```

#### **Shared Logic Percentage**

| Layer | Shared % | Platform-Specific |
|-------|----------|-------------------|
| **Business Logic** | 100% | 0% |
| **API Calls** | 100% | 0% |
| **Data Models** | 100% | 0% |
| **Validation** | 100% | 0% |
| **UI Components** | 0-20% | 80-100% |
| **Navigation** | 0% | 100% |
| **Styling** | 0% | 100% |

**Total Code Reuse**: ~60-70%

---

## 4️⃣ STANDARDS & QUALITY

### **Code Quality Standards**

#### **1. TypeScript Strict Mode**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Why Strict Mode?**
- ✅ Catches bugs at compile time
- ✅ Better IDE autocomplete
- ✅ Self-documenting code
- ✅ Easier refactoring

---

#### **2. Linting & Formatting**
```json
// package.json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

**Tools**:
- **ESLint** - Code quality rules
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **lint-staged** - Pre-commit hooks

**ESLint Config**:
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier' // Must be last
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/exhaustive-deps': 'error'
  }
}
```

---

#### **3. Code Organization Patterns**

**Feature-Based Structure** (not layer-based):
```
✅ GOOD: Feature-based
src/
├── features/
│   ├── booking/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── properties/
│   └── tours/

❌ BAD: Layer-based
src/
├── components/  (100+ files)
├── hooks/       (50+ files)
├── services/    (30+ files)
└── types/       (40+ files)
```

**Why Feature-Based?**
- ✅ Easy to find related code
- ✅ Easy to delete features
- ✅ Clear boundaries
- ✅ Better for teams

---

#### **4. Design Patterns**

**Service Layer Pattern**:
```typescript
// Separates business logic from UI
class BookingService {
  async createBooking(data: CreateBookingInput): Promise<Booking> {
    // Validation
    const validated = BookingSchema.parse(data)
    
    // Business logic
    const totalPrice = this.calculatePrice(validated)
    
    // Database call
    return await this.repository.create({ ...validated, totalPrice })
  }
}
```

**Repository Pattern**:
```typescript
// Abstracts database access
class BookingRepository {
  async create(data: BookingData): Promise<Booking> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(data)
      .select()
      .single()
    
    if (error) throw new DatabaseError(error)
    return booking
  }
}
```

**Custom Hooks Pattern**:
```typescript
// Encapsulates component logic
function useBooking(bookingId: string) {
  const queryClient = useQueryClient()
  
  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingService.getBooking(bookingId)
  })
  
  const cancelMutation = useMutation({
    mutationFn: () => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['booking', bookingId])
    }
  })
  
  return { booking: data, isLoading, cancel: cancelMutation.mutate }
}
```

---

### **Testing Strategy**

#### **Testing Pyramid**
```
        /\
       /E2E\         10% - End-to-end (Playwright)
      /------\
     /Integration\   30% - Integration (React Testing Library)
    /------------\
   /   Unit Tests  \ 60% - Unit (Vitest)
  /----------------\
```

#### **1. Unit Tests (Vitest)**
```typescript
// packages/shared/src/services/__tests__/RoleService.test.ts
import { describe, it, expect, vi } from 'vitest'
import { RoleService } from '../RoleService'

describe('RoleService', () => {
  it('should switch user role', async () => {
    const service = new RoleService()
    const result = await service.switchRole('user-id', 'hotel_manager')
    
    expect(result.activeRole).toBe('hotel_manager')
  })
  
  it('should throw error for invalid role', async () => {
    const service = new RoleService()
    
    await expect(
      service.switchRole('user-id', 'invalid' as any)
    ).rejects.toThrow('Invalid role')
  })
})
```

**Coverage Targets** (Realistic, Not Dogmatic):
- ✅ **90%+ for `packages/shared` business logic** (critical path)
- ✅ **70%+ for UI components** (focus on user flows)
- ❌ **Don't chase 80% global coverage** (diminishing returns)
- ❌ **Don't obsess over snapshot tests** (brittle, low value)

**What to Test**:
```typescript
// ✅ HIGH VALUE: Business logic
- RoleService.switchRole()
- BookingService.createBooking()
- Validation schemas (Zod)
- API error handling

// ✅ MEDIUM VALUE: User flows
- Login → Dashboard
- Booking checkout flow
- Role switching flow

// ❌ LOW VALUE: Don't over-test
- Formatting utilities (formatDate, formatCurrency)
- UI snapshots (brittle, break on style changes)
- Third-party library wrappers
```

**Why 90%+ for Shared Logic?**
- This code runs on both web AND mobile
- Bugs here affect all platforms
- High leverage (one test protects 2+ platforms)

---

#### **2. Integration Tests (React Testing Library)**
```typescript
// packages/web/src/screens/__tests__/BookingCheckout.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingCheckout } from '../BookingCheckout'

describe('BookingCheckout', () => {
  it('should complete booking flow', async () => {
    render(<BookingCheckout propertyId="123" />)
    
    // Fill form
    await userEvent.type(screen.getByLabelText('Name'), 'John Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'john@example.com')
    
    // Submit
    await userEvent.click(screen.getByRole('button', { name: 'Book Now' }))
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Booking confirmed!')).toBeInTheDocument()
    })
  })
})
```

---

#### **3. End-to-End Tests (Playwright)**
```typescript
// e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete booking flow', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Search property
  await page.goto('/search?location=Paris')
  await page.click('[data-testid="property-card"]:first-child')
  
  // Book
  await page.click('button:has-text("Book Now")')
  await page.fill('[name="guests"]', '2')
  await page.click('button:has-text("Confirm Booking")')
  
  // Verify
  await expect(page.locator('text=Booking confirmed')).toBeVisible()
})
```

**Run on**: Every PR, before deployment

---

### **Team Scalability**

#### **1. Documentation Standards**

**Code Comments**:
```typescript
/**
 * Switches the active role for a user.
 * 
 * @param userId - The UUID of the user
 * @param newRole - The role to switch to (hotel_manager or tour_operator)
 * @returns The updated user state with new active role
 * @throws {RoleError} If role is invalid or user doesn't have access
 * 
 * @example
 * ```ts
 * await roleService.switchRole('123', 'hotel_manager')
 * ```
 */
async switchRole(userId: string, newRole: Role): Promise<UserState> {
  // Implementation
}
```

**README per package**:
```markdown
# @tripavail/shared

Shared business logic for TripAvail web and mobile apps.

## Installation
\`\`\`bash
pnpm add @tripavail/shared
\`\`\`

## Usage
\`\`\`typescript
import { RoleService } from '@tripavail/shared'
\`\`\`

## Architecture
- `/api` - Supabase API calls
- `/services` - Business logic
- `/types` - TypeScript types
```

---

#### **2. Git Workflow**

**Branch Strategy**:
```
main (production)
  ↑
develop (staging)
  ↑
feature/booking-checkout
feature/role-switching
fix/payment-bug
```

**Commit Convention** (Conventional Commits):
```bash
feat(booking): add checkout flow
fix(auth): resolve token refresh issue
docs(readme): update setup instructions
test(booking): add integration tests
refactor(api): extract booking service
```

**PR Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
```

---

#### **3. CI/CD Pipeline**

**GitHub Actions Workflow**:
```yaml
# .github/workflows/ci.yml
name: CI

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test
      - run: pnpm run build
      
      - name: E2E Tests
        run: pnpm run test:e2e
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

**Deployment**:
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

#### **4. Code Review Standards**

**Review Checklist**:
- [ ] Code follows TypeScript strict mode
- [ ] Tests added for new features
- [ ] No console.logs or debugger statements
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Accessibility considered (ARIA labels)
- [ ] Mobile responsive (if UI change)
- [ ] Performance considered (memoization, lazy loading)
- [ ] Security considered (XSS, CSRF)
- [ ] Documentation updated

**Review SLA**:
- First review within 24 hours
- Approval within 48 hours
- At least 1 approval required
- All CI checks must pass

---

## 📊 SUMMARY

| Aspect | Decision | Justification |
|--------|----------|---------------|
| **Starting Point** | Backend-first with contracts | Database schema drives types, enables parallel development |
| **Web Framework** | React 18 + TypeScript + Vite | Industry standard, mobile-ready, best ecosystem |
| **State Management** | Zustand + TanStack Query | Simple client state + powerful server state |
| **Backend** | Supabase | PostgreSQL + Auth + Realtime + Storage in one |
| **Styling** | Tailwind CSS + shadcn/ui | Fast development, accessible, customizable |
| **Mobile Framework** | React Native + Expo | 60-70% code reuse, same team, same backend |
| **Monorepo** | pnpm + Turborepo | Code sharing, type safety, atomic changes |
| **Testing** | Vitest + RTL + Playwright | Fast unit tests, integration tests, E2E coverage |
| **Code Quality** | TypeScript strict + ESLint + Prettier | Catch bugs early, consistent code style |
| **CI/CD** | GitHub Actions + Vercel | Automated testing and deployment |

---

## 🚀 NEXT STEPS

### **Week 1: Setup**
1. Initialize monorepo with pnpm + Turborepo
2. Set up Supabase project
3. Create database schema and migrations
4. Set up CI/CD pipeline

### **Week 2: Backend Foundation**
1. Implement RLS policies
2. Create database functions (role switching, etc.)
3. Set up real-time channels
4. Generate TypeScript types

### **Week 3: Shared Package**
1. Create API client
2. Implement services (RoleService, BookingService, etc.)
3. Set up validation schemas (Zod)
4. Create shared hooks

### **Week 4+: Frontend Development**

> 🔒 **NON-NEGOTIABLE**: All screens must match `extracted_tripavail_frontend_screens` exactly.

1. **Week 4: Design System Extraction**
   - Analyze existing screens from `extracted_tripavail_frontend_screens`
   - Extract color palette, typography, spacing system
   - Configure Tailwind to match existing design tokens
   - Create component library matching existing UI components
   - Document design patterns and component usage

2. **Week 5: Authentication & Core**
   - Replicate existing login/signup screens exactly
   - Implement role selection flow (matching existing UI)
   - Build role switching UI (matching existing drawer/menu)
   - Set up protected routes

3. **Week 5-6: Traveller Screens**
   - Replicate existing Traveller screens pixel-perfect
   - Home/Dashboard (match existing)
   - Search & Results (match existing)
   - Property/Package details (match existing)
   - **NEW**: Booking checkout (follow existing visual language)
   - **NEW**: Booking confirmation (follow existing visual language)
   - Trips, Wishlist, Profile (match existing)

4. **Week 6-7: Hotel Manager Screens**
   - Replicate existing Hotel Manager screens exactly
   - Dashboard (match existing)
   - 10-step hotel listing flow (match existing)
   - 10-step package creation flow (match existing)
   - Calendar, Properties, Bookings (match existing)

5. **Week 7-8: Tour Operator Screens**
   - Replicate existing Tour Operator screens exactly
   - Dashboard (match existing)
   - 7-step tour creation flow (match existing)
   - Tours, Calendar, Bookings (match existing)

6. **Week 8: Shared Screens & Polish**
   - Verification (match existing)
   - Settings (match existing)
   - Help & Support (match existing)
   - Visual consistency audit
   - Ensure all new screens feel native to existing design

> **Note**: "Chosen partner role" refers to either Hotel Manager OR Tour Operator (never both), as per the role constraint product rule.

---

*Last Updated: 2026-01-29*  
*Document Version: 1.0*  
*Ready for execution - production-grade, scalable, maintainable*
