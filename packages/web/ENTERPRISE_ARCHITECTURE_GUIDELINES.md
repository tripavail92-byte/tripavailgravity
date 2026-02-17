# Enterprise Architecture Guidelines

## Overview
This document defines production-grade architecture patterns for the Tripfinal booking platform. Following these guidelines ensures cache correctness, data integrity, and scalability under load.

---

## ✅ Data Access Layers

### Rule: NO Direct Supabase Imports in Components

**Components should NEVER import supabase directly.**

```typescript
// ❌ FORBIDDEN
import { supabase } from '@/lib/supabase'

function MyComponent() {
  useEffect(() => {
    supabase.from('packages').select('*')  // NO!
  }, [])
}
```

```typescript
// ✅ CORRECT
import { useFeaturedPackages } from '@/queries/packageQueries'

function MyComponent() {
  const { data } = useFeaturedPackages()
}
```

### Architecture Layers (Strict)

```
Components (UI)
    ↓ (only imports)
Query Hooks (@/queries/*.ts)
    ↓ (only imports)
Service Functions (@/features/*/services/*.ts)
    ↓ (only imports)
Supabase Client (@/lib/supabase.ts)
```

**Enforcement:**
- Add ESLint rule: `no-restricted-imports` for `@/lib/supabase` in `src/components/**` and `src/pages/**`
- Code review checklist: No supabase imports outside query/service layers

---

## 🔑 Query Keys Must Encode All Inputs

Query keys MUST include all parameters that affect the query result.

**❌ Object Identity Trap (CRITICAL BUG):**
```typescript
// BAD: Object gets new identity every render → refetch loop
const key = packageKeys.list({ city, guests, page })

// Every render: new object → React Query sees new key → refetches
```

**✅ CORRECT: Serialize Primitives**
```typescript
// packages/web/src/queries/packageQueries.ts
export const packageKeys = {
  list: (filters?: { city?: string; guests?: number; page?: number }) => 
    [
      ...packageKeys.lists(), 
      filters?.city ?? '', 
      filters?.guests ?? 0, 
      filters?.page ?? 1
    ] as const,
}

// Usage - no object identity issues
const { data } = useQuery({
  queryKey: packageKeys.list({ city, guests, page }), // ✅ Serialized to primitives
  queryFn: () => fetchPackages({ city, guests, page })
})
```

**Why Primitive Serialization:**
- Query key: `['packages', 'list', 'Dubai', 2, 1]` 
- Same inputs = same array = same reference = no refetch
- Object inputs = new reference every render = refetch loop

**Already Implemented:**
- `packages/web/src/queries/packageQueries.ts` - Serializes `city`, `dates`, `guests`, `sort`, `page`
- `packages/web/src/queries/tourQueries.ts` - Serializes `location`, `dates`, `guests`, `tourType`, `page`
- `packages/web/src/queries/availabilityQueries.ts` - Availability scoped by schedule + dates

---

## 🎯 Availability Queries: Schedule-Scoped & Inventory-Critical

**Rule: Availability must be scoped to prevent cache bleed**

**❌ WRONG: Global availability cache**
```typescript
// BAD: No schedule scoping
queryKey: ['availability']

// Risk: User checks Schedule A, cache stores availability
// User navigates to Schedule B, gets stale Schedule A data
// Books unavailable slot → transaction conflict
```

**✅ CORRECT: Schedule-scoped availability**
```typescript
// packages/web/src/queries/availabilityQueries.ts
export const availabilityKeys = {
  packageAvailability: (packageId: string, checkIn: string, checkOut: string) =>
    ['availability', 'package', packageId, checkIn, checkOut] as const,
  
  tourSlots: (scheduleId: string) =>
    ['availability', 'tour-slots', scheduleId] as const,
}

// Usage
const { data: isAvailable } = usePackageAvailability(packageId, checkIn, checkOut)
const { data: slotsAvailable } = useTourAvailableSlots(scheduleId)
```

**StaleTime: 15-20 seconds** (inventory is real-time critical)

**Production Strategy:**
1. **Query Cache:** 15-20 second staleTime for instant UX
2. **Realtime Subscriptions:** Listen to `booking_holds` table for inventory changes
3. **Backend Transaction:** DB uses `select ... for update` row locks
4. **Optimistic UI:** Show "Confirming..." state during booking
5. **Conflict Handling:** Gracefully handle 409 errors, refresh availability

**Already Implemented:**
- `packages/web/src/queries/availabilityQueries.ts` - Schedule-scoped query hooks
- 15-20 second staleTime for inventory freshness
- Prefetch utilities for availability pre-loading

---

## 🔄 Cache Invalidation: Surgical, Not Blanket

**Rule: NEVER invalidate `packageKeys.all` or `tourKeys.all`**

```typescript
// ❌ FORBIDDEN: Nuclear option
queryClient.invalidateQueries({ queryKey: packageKeys.all })

// ✅ CORRECT: Surgical invalidation
if (variables.id) {
  queryClient.setQueryData(packageKeys.detail(variables.id), data)
}
if (data?.is_featured) {
  queryClient.invalidateQueries({ queryKey: packageKeys.featured() })
}
queryClient.invalidateQueries({ queryKey: packageKeys.lists() })
```

**Why Blanket Invalidation Fails:**
- Nukes traveler feed, search results, collections, admin lists, drafts
- Forces refetch of ALL queries on every mutation
- Creates cache stampede under load
- User loses scroll position, pagination state

**Already Implemented:**
- `packages/web/src/queries/packageQueries.ts` - `usePackageMutation()`
- `packages/web/src/queries/tourQueries.ts` - `useTourMutation()`

---

## 🔁 Error-Class Aware Retry

**Rule: Don't retry errors that won't succeed on retry**

✅ **DO RETRY:**
- Network errors (no status code)
- 408 Request Timeout
- 5xx Server errors
- Transient failures

❌ **DON'T RETRY:**
- 401/403 Auth errors → trigger re-auth
- 404 Not Found → data doesn't exist
- 429 Rate Limit → backend needs cooldown
- 4xx Client errors → request is malformed
- Supabase RLS "permission denied" → user lacks access

**Already Implemented:**
```typescript
// packages/web/src/lib/queryClient.ts
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  
  const status = err?.status || err?.response?.status
  
  if (status === 401 || status === 403) return false // Auth
  if (status === 404) return false // Not found
  if (status === 429) return false // Rate limit
  if (status >= 400 && status < 500 && status !== 408) return false // Client error
  
  return true // Network/server errors
}
```

---

## ⚡ Prefetch Throttling & Mobile Safety

**Rule: Prefetch must be throttled, cache-aware, and mobile-safe**

```typescript
// ✅ Production-safe prefetch
const prefetchThrottleMap = new Map<string, number>()
const PREFETCH_THROTTLE_MS = 200

export function prefetchPackage(queryClient, id) {
  // 1. Skip if already cached and fresh
  const state = queryClient.getQueryState(packageKeys.detail(id))
  if (state?.dataUpdatedAt && Date.now() - state.dataUpdatedAt < 3 * 60 * 1000) {
    return Promise.resolve()
  }

  // 2. Throttle rapid hover events
  if (Date.now() - (prefetchThrottleMap.get(id) || 0) < PREFETCH_THROTTLE_MS) {
    return Promise.resolve()
  }
  prefetchThrottleMap.set(id, Date.now())

  // 3. Respect save-data mode
  if (navigator.connection?.saveData) {
    return Promise.resolve()
  }

  return queryClient.prefetchQuery({ ... })
}
```

**Usage in Components:**
```tsx
<Link 
  onMouseEnter={() => prefetchPackage(queryClient, id)}
  onTouchStart={() => prefetchPackage(queryClient, id)}
>
```

**Already Implemented:**
- `packages/web/src/queries/packageQueries.ts` - `prefetchPackage()`
- `packages/web/src/queries/tourQueries.ts` - `prefetchTour()`

---

## ⏱️ StaleTime Strategy by Data Sensitivity

Different data has different freshness requirements:

| Data Type | StaleTime | Rationale |
|-----------|-----------|-----------|
| **Featured packages** | 8 minutes | Low change rate, marketing content |
| **Package/Tour details** | 3 minutes | Moderate change rate, descriptions stable |
| **Hotel search results** | 2 minutes | Conservative default |
| **Booking availability** | 0-30 seconds | Real-time critical, inventory changes rapidly |
| **Admin dashboards** | 30-60 seconds | Moderate freshness needed |
| **User profile** | 5 minutes | Rarely changes mid-session |

**Already Implemented:**
```typescript
// packages/web/src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes default
    }
  }
})

// packages/web/src/queries/packageQueries.ts
export function useFeaturedPackages() {
  return useQuery({
    queryKey: packageKeys.featured(),
    queryFn: fetchFeaturedPackages,
    staleTime: 8 * 60 * 1000, // 8 minutes - featured content is stable
  })
}
```

---

## 🎯 Booking Availability: Transaction-Authoritative

**Rule: Cache is for UX speed, DB transaction is the authority**

```typescript
// ❌ WRONG: Trusting cache for booking decisions
const { data: availability } = useQuery({
  queryKey: ['availability', roomId],
  staleTime: 5 * 60 * 1000 // 5 minutes - TOO LONG
})
if (availability?.available) {
  // User thinks they can book, but inventory might be gone
  submitBooking()
}

// ✅ CORRECT: Cache for UI, DB transaction for authority
const { data: availability } = useQuery({
  queryKey: ['availability', roomId],
  staleTime: 30 * 1000, // 30 seconds max
})

// Backend mutation handles race conditions
const { mutate: createBooking } = useMutation({
  mutationFn: async (bookingData) => {
    // Backend uses DB transaction + row-level locks
    // Returns 409 Conflict if inventory taken
    const { data, error } = await supabase.rpc('create_booking_atomic', bookingData)
    if (error?.code === 'P0001') throw new BookingConflictError()
    return data
  },
  onError: (error) => {
    if (error instanceof BookingConflictError) {
      toast.error('Room no longer available. Showing updated availability.')
      queryClient.invalidateQueries({ queryKey: ['availability', roomId] })
    }
  }
})
```

**Production Strategy:**
1. **UI Cache:** 15-30 second staleTime for availability queries
2. **Realtime Subscription:** Listen to `booking_holds` table for inventory changes
3. **Backend Transaction:** Use `select ... for update` row locks
4. **Optimistic UI:** Show "Confirming..." state during booking
5. **Conflict Handling:** Gracefully handle 409 errors, refresh availability

**TODO:** Implement availability realtime subscription:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('availability-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'booking_holds' },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['availability'] })
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

---

## � Booking Mutations: Availability Cache Invalidation

**Rule: Booking operations MUST invalidate availability cache to prevent stale data**

**❌ WRONG: No cache invalidation**
```typescript
// Service call without mutation hook
const booking = await packageBookingService.confirmBooking(bookingId)
// ❌ Other users still see stale "available" status for 15 seconds
```

**✅ CORRECT: Mutation with surgical invalidation**
```typescript
// packages/web/src/queries/bookingMutations.ts
export function useConfirmPackageBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ bookingId }: ConfirmBookingParams) => {
      return await packageBookingService.confirmBooking(bookingId)
    },
    onSuccess: (_data, variables) => {
      // CRITICAL: Invalidate availability for this package + dates
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.packageAvailability(
          variables.packageId,
          variables.checkIn,
          variables.checkOut
        )
      })
    }
  })
}
```

**Marketplace-Grade Pattern: Optimistic Updates**
```typescript
export function useOptimisticPackageBooking() {
  return useMutation({
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: availabilityKeys.packageAvailability(...) })
      queryClient.setQueryData(availabilityKeys.packageAvailability(...), false)
      return { previousValue }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(availabilityKeys.packageAvailability(...), context.previousValue)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.packageAvailability(...) })
    }
  })
}
```

**Already Implemented:**
- `packages/web/src/queries/bookingMutations.ts` - Booking mutations with cache invalidation

---

## �📋 Checklist: Before Production Deploy

- [ ] No direct `supabase` imports in components/pages
- [ ] All query keys include filter/pagination parameters
- [ ] No `invalidateQueries({ queryKey: packageKeys.all })`
- [ ] Error retry logic checks status codes
- [ ] Prefetch functions are throttled and mobile-safe
- [ ] StaleTime tuned per data sensitivity
- [ ] Availability uses realtime subscription OR polling ≤30s
- [ ] Booking mutations handle 409 Conflict gracefully
- [ ] Error boundaries wrap query-dependent components
- [ ] React Query Devtools only in development

---

## 🎓 Reference Implementation

**Good Examples:**
- `packages/web/src/queries/packageQueries.ts` - Query hooks with surgical invalidation
- `packages/web/src/queries/tourQueries.ts` - Tour queries with error-aware retry
- `packages/web/src/lib/queryClient.ts` - Enterprise QueryClient config
- `packages/web/src/components/QueryErrorBoundary.tsx` - Error recovery wrapper

**Anti-Patterns to Avoid:**
- ❌ `queryClient.invalidateQueries({ queryKey: packageKeys.all })`
- ❌ Direct supabase import in components
- ❌ Query keys without filter parameters
- ❌ Retrying 401/404/429 errors
- ❌ Prefetch without throttle/cache check
- ❌ Long staleTime for booking availability

---

## 🚀 Migration Path

If you find legacy code violating these patterns:

1. **Immediate:** Add TODO comment marking it as legacy
2. **Short-term:** Wrap in query hook (keep supabase call in hook temporarily)
3. **Medium-term:** Move supabase call to service function
4. **Long-term:** Replace with proper query hook

```typescript
// Legacy code (mark for refactor)
// TODO: Move to query hook + service layer
const { data } = await supabase.from('packages').select('*')
```

---

**Last Updated:** 2024-03-XX  
**Maintained By:** Engineering Team  
**Questions?** Review architectural decisions in session notes or ask CTO.
