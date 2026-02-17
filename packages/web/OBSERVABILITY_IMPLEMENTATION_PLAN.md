# 🔭 Observability Implementation Plan

**Status:** Phase 2 - Operational Excellence  
**Current Grade:** 🔴 F (Not Implemented)  
**Target Grade:** 🟢 A (Production Marketplace-Grade)  
**Timeline:** 3 Sprints (6 weeks)

---

## 📊 Executive Summary

**The Gap:**  
We have enterprise-grade architecture but zero visibility into production behavior.

**The Goal:**  
Know WHERE the system breaks BEFORE users complain, and WHY it's slow with data-driven precision.

**Success Criteria:**
- Error rate < 0.1% per query type
- 95p query latency < 500ms tracked continuously
- Booking conflict rate monitored with alerts
- Cache hit ratio > 70% measured
- Session replay for failed checkout flows

---

## 🎯 Implementation Phases

### **Phase 1: Foundation (Sprint 1 - Week 1-2)**
**Goal:** Basic error tracking + core metrics

- [ ] Sentry error tracking integration
- [ ] Basic query error monitoring
- [ ] Mutation failure tracking
- [ ] Error rate dashboard
- [ ] Production error alerting

**Effort:** 3-4 days  
**Impact:** HIGH - Immediately catch production errors

---

### **Phase 2: Performance (Sprint 2 - Week 3-4)**
**Goal:** Latency tracking + cache performance

- [ ] Query latency tracking (50p/95p/99p)
- [ ] Cache hit/miss ratio monitoring
- [ ] Prefetch effectiveness metrics
- [ ] Booking funnel analytics
- [ ] Performance degradation alerts

**Effort:** 4-5 days  
**Impact:** HIGH - Optimize based on real data

---

### **Phase 3: Elite (Sprint 3 - Week 5-6)**
**Goal:** Session replay + realtime monitoring

- [ ] Session replay for checkout failures
- [ ] Realtime availability sync
- [ ] A/B test infrastructure
- [ ] Custom business metrics dashboard
- [ ] Automated performance regression detection

**Effort:** 5-6 days  
**Impact:** MEDIUM - Debugging superpowers

---

## 🛠️ Technical Implementation

### 1. Error Tracking - Sentry Integration

#### **Installation**

```bash
pnpm add @sentry/react @sentry/vite-plugin
```

#### **Configuration**

```typescript
// packages/web/src/lib/sentry.ts
import * as Sentry from '@sentry/react'

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Session Replay (Phase 3)
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of error sessions
      
      integrations: [
        new Sentry.BrowserTracing({
          // React Router integration
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
        }),
        new Sentry.Replay({
          maskAllText: false, // Mask PII
          blockAllMedia: true,
        }),
      ],
      
      beforeSend(event, hint) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = hint.originalException
          
          // Don't send AbortController errors (user navigation)
          if (error?.name === 'AbortError') return null
          
          // Don't send network errors during offline
          if (!navigator.onLine) return null
        }
        
        return event
      },
    })
  }
}

// App entry point
// packages/web/src/main.tsx
import { initSentry } from './lib/sentry'
initSentry()
```

#### **React Query Integration**

```typescript
// packages/web/src/lib/queryClient.ts
import * as Sentry from '@sentry/react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error, query) => {
        // Send query errors to Sentry
        Sentry.captureException(error, {
          tags: {
            queryType: 'query',
            queryKey: query.queryKey[0] as string,
          },
          contexts: {
            query: {
              queryKey: JSON.stringify(query.queryKey),
              queryHash: query.queryHash,
              status: query.state.status,
              failureCount: query.state.failureCount,
              errorUpdateCount: query.state.errorUpdateCount,
            }
          },
          fingerprint: [
            'query-error',
            query.queryKey[0] as string,
            String((error as any)?.code || 'unknown')
          ]
        })
      }
    },
    mutations: {
      onError: (error, variables, context, mutation) => {
        Sentry.captureException(error, {
          tags: {
            queryType: 'mutation',
            mutationKey: mutation.options.mutationKey?.[0] as string,
          },
          contexts: {
            mutation: {
              mutationKey: JSON.stringify(mutation.options.mutationKey),
              variables: JSON.stringify(variables, null, 2),
            }
          },
          fingerprint: [
            'mutation-error',
            mutation.options.mutationKey?.[0] as string || 'unknown',
            String((error as any)?.code || 'unknown')
          ]
        })
      }
    }
  }
})
```

#### **Custom Error Boundaries**

```typescript
// packages/web/src/components/SentryErrorBoundary.tsx
import * as Sentry from '@sentry/react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'

export function SentryErrorBoundary({ children }: { children: React.ReactNode }) {
  const { reset } = useQueryErrorResetBoundary()
  
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback 
          error={error} 
          resetError={() => {
            reset()
            resetError()
          }}
        />
      )}
      showDialog
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
```

**Success Metrics:**
- All production errors captured ✅
- Query/mutation failures tagged by type ✅
- Error rate dashboard in Sentry ✅
- Slack/Email alerts for critical errors ✅

---

### 2. Performance Tracking - Query Latency Monitoring

#### **Lightweight Custom Metrics**

```typescript
// packages/web/src/lib/metrics/queryMetrics.ts
import * as Sentry from '@sentry/react'

interface QueryMetrics {
  queryKey: string
  duration: number
  cacheHit: boolean
  timestamp: number
}

class QueryMetricsTracker {
  private metrics: QueryMetrics[] = []
  private flushInterval: NodeJS.Timeout | null = null
  
  constructor() {
    // Flush metrics every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000)
  }
  
  track(metric: QueryMetrics) {
    this.metrics.push(metric)
    
    // Send slow queries immediately to Sentry
    if (metric.duration > 2000) {
      Sentry.captureMessage('Slow Query Detected', {
        level: 'warning',
        tags: {
          queryKey: metric.queryKey,
        },
        extra: {
          duration: metric.duration,
          cacheHit: metric.cacheHit,
        }
      })
    }
  }
  
  flush() {
    if (this.metrics.length === 0) return
    
    // Calculate percentiles per query type
    const byQueryKey = this.groupByQueryKey()
    
    Object.entries(byQueryKey).forEach(([queryKey, durations]) => {
      const sorted = durations.sort((a, b) => a - b)
      const p50 = this.percentile(sorted, 0.5)
      const p95 = this.percentile(sorted, 0.95)
      const p99 = this.percentile(sorted, 0.99)
      
      // Send to analytics backend (PostHog, Mixpanel, etc.)
      this.sendToAnalytics({
        event: 'query_performance',
        properties: {
          queryKey,
          count: durations.length,
          p50,
          p95,
          p99,
          avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        }
      })
      
      // Alert if 95p exceeds threshold
      if (p95 > 1000) {
        Sentry.captureMessage('Query Performance Degradation', {
          level: 'warning',
          tags: { queryKey },
          extra: { p50, p95, p99, count: durations.length }
        })
      }
    })
    
    this.metrics = []
  }
  
  private groupByQueryKey() {
    return this.metrics.reduce((acc, m) => {
      if (!acc[m.queryKey]) acc[m.queryKey] = []
      acc[m.queryKey].push(m.duration)
      return acc
    }, {} as Record<string, number[]>)
  }
  
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index] || 0
  }
  
  private sendToAnalytics(event: any) {
    // Integration with PostHog/Mixpanel/Custom backend
    if (window.posthog) {
      window.posthog.capture(event.event, event.properties)
    }
  }
  
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
  }
}

export const queryMetrics = new QueryMetricsTracker()
```

#### **Integration with QueryClient**

```typescript
// packages/web/src/lib/queryClient.ts
import { queryMetrics } from './metrics/queryMetrics'
import { queryCache } from '@tanstack/react-query'

// Track query performance globally
queryCache.subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'success') {
    const query = event.query
    const duration = Date.now() - (query.state.dataUpdatedAt || Date.now())
    const cacheHit = query.state.isFetching === false
    
    queryMetrics.track({
      queryKey: query.queryKey[0] as string,
      duration,
      cacheHit,
      timestamp: Date.now(),
    })
  }
})
```

**Success Metrics:**
- 95p latency tracked per query type ✅
- Slow query alerts (>2s) sent to Sentry ✅
- Performance degradation detected automatically ✅

---

### 3. Cache Performance Monitoring

#### **Cache Hit/Miss Tracking**

```typescript
// packages/web/src/lib/metrics/cacheMetrics.ts
import { queryCache } from '@tanstack/react-query'

class CacheMetricsTracker {
  private hits = 0
  private misses = 0
  private flushInterval: NodeJS.Timeout | null = null
  
  constructor() {
    this.setup()
    this.flushInterval = setInterval(() => this.flush(), 60000) // Every minute
  }
  
  private setup() {
    queryCache.subscribe((event) => {
      if (event.type === 'updated') {
        const query = event.query
        
        // Cache hit: data exists + not fetching
        if (query.state.data !== undefined && !query.state.isFetching) {
          this.hits++
        }
        
        // Cache miss: fetching new data
        if (query.state.isFetching && query.state.fetchStatus === 'fetching') {
          this.misses++
        }
      }
    })
  }
  
  flush() {
    const total = this.hits + this.misses
    if (total === 0) return
    
    const hitRatio = (this.hits / total) * 100
    
    // Send to analytics
    if (window.posthog) {
      window.posthog.capture('cache_performance', {
        hits: this.hits,
        misses: this.misses,
        hitRatio,
        total,
      })
    }
    
    // Alert if hit ratio drops below threshold
    if (hitRatio < 50) {
      Sentry.captureMessage('Low Cache Hit Ratio', {
        level: 'warning',
        extra: { hits: this.hits, misses: this.misses, hitRatio }
      })
    }
    
    // Reset
    this.hits = 0
    this.misses = 0
  }
  
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
  }
}

export const cacheMetrics = new CacheMetricsTracker()
```

**Success Metrics:**
- Cache hit ratio > 70% ✅
- Low cache performance alerts ✅
- Prefetch effectiveness measured ✅

---

### 4. Booking Funnel Analytics

#### **Critical Business Metrics**

```typescript
// packages/web/src/lib/analytics/bookingFunnel.ts
import * as Sentry from '@sentry/react'

export const bookingFunnel = {
  // Step 1: User views package/tour
  viewListing(type: 'package' | 'tour', id: string) {
    window.posthog?.capture('funnel_view_listing', { type, id })
  },
  
  // Step 2: User checks availability
  checkAvailability(type: 'package' | 'tour', id: string, dates: string) {
    window.posthog?.capture('funnel_check_availability', { type, id, dates })
  },
  
  // Step 3: Availability check result
  availabilityResult(type: 'package' | 'tour', id: string, available: boolean, cacheAge?: number) {
    window.posthog?.capture('funnel_availability_result', { 
      type, 
      id, 
      available,
      cacheAge 
    })
    
    // Track stale cache conflicts
    if (!available && cacheAge && cacheAge > 10000) {
      Sentry.captureMessage('Booking Conflict - Stale Cache', {
        level: 'warning',
        tags: { type, id },
        extra: { cacheAge }
      })
    }
  },
  
  // Step 4: User initiates checkout
  startCheckout(type: 'package' | 'tour', id: string, amount: number) {
    window.posthog?.capture('funnel_start_checkout', { type, id, amount })
  },
  
  // Step 5: Booking hold created
  bookingHoldCreated(type: 'package' | 'tour', bookingId: string, expiresIn: number) {
    window.posthog?.capture('funnel_booking_hold_created', { 
      type, 
      bookingId,
      expiresIn 
    })
  },
  
  // Step 6: Payment initiated
  paymentInitiated(bookingId: string, amount: number) {
    window.posthog?.capture('funnel_payment_initiated', { bookingId, amount })
  },
  
  // Step 7: Payment completed
  paymentCompleted(bookingId: string, amount: number, duration: number) {
    window.posthog?.capture('funnel_payment_completed', { 
      bookingId, 
      amount,
      duration 
    })
  },
  
  // Step 8: Booking confirmed
  bookingConfirmed(bookingId: string, amount: number, totalDuration: number) {
    window.posthog?.capture('funnel_booking_confirmed', { 
      bookingId, 
      amount,
      totalDuration 
    })
    
    // Success! Track conversion
    window.posthog?.capture('conversion_booking', {
      bookingId,
      revenue: amount,
    })
  },
  
  // Error states
  bookingFailed(step: string, reason: string, bookingId?: string) {
    window.posthog?.capture('funnel_booking_failed', { 
      step, 
      reason, 
      bookingId 
    })
    
    Sentry.captureMessage('Booking Funnel Failed', {
      level: 'error',
      tags: { step },
      extra: { reason, bookingId }
    })
  },
  
  // Hold expired
  bookingExpired(bookingId: string, step: string) {
    window.posthog?.capture('funnel_booking_expired', { bookingId, step })
    
    Sentry.captureMessage('Booking Hold Expired', {
      level: 'warning',
      tags: { step },
      extra: { bookingId }
    })
  }
}
```

#### **Usage in Components**

```typescript
// packages/web/src/pages/PackageDetailsPage.tsx
import { bookingFunnel } from '@/lib/analytics/bookingFunnel'

export function PackageDetailsPage() {
  const { id } = useParams()
  
  useEffect(() => {
    if (id) {
      bookingFunnel.viewListing('package', id)
    }
  }, [id])
  
  const handleCheckAvailability = async () => {
    bookingFunnel.checkAvailability('package', id, `${checkIn}-${checkOut}`)
    
    const startTime = Date.now()
    const available = await checkAvailability(id, checkIn, checkOut)
    const cacheAge = Date.now() - startTime
    
    bookingFunnel.availabilityResult('package', id, available, cacheAge)
  }
}
```

**Success Metrics:**
- Conversion rate by step tracked ✅
- Drop-off points identified ✅
- Stale cache conflicts measured ✅
- Hold expiration rate monitored ✅

---

### 5. Session Replay - Checkout Flow Debugging

#### **PostHog Session Replay** (Recommended - Free tier available)

```bash
pnpm add posthog-js
```

```typescript
// packages/web/src/lib/analytics/posthog.ts
import posthog from 'posthog-js'

export function initPostHog() {
  if (import.meta.env.PROD) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      
      // Session Replay
      session_recording: {
        recordCrossOriginIframes: false,
        maskAllInputs: true, // Mask credit card inputs
        maskTextSelector: '[data-sensitive]', // Custom masking
      },
      
      // Only record checkout sessions
      autocapture: {
        url_allowlist: ['/checkout/*'],
      },
      
      // Capture console errors
      capture_pageview: true,
      capture_pageleave: true,
    })
    
    // Identify user (after auth)
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        role: user.role,
      })
    }
  }
}
```

#### **Targeted Replay on Errors**

```typescript
// packages/web/src/lib/queryClient.ts
import posthog from 'posthog-js'

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error, variables, context, mutation) => {
        // Trigger session replay for booking failures
        if (mutation.options.mutationKey?.[0] === 'confirmBooking') {
          posthog?.capture('booking_mutation_failed', {
            error: error.message,
            variables,
            $session_recording: {
              forceRecord: true, // Force recording even if not already recording
            }
          })
        }
      }
    }
  }
})
```

**Success Metrics:**
- Failed checkout sessions recorded ✅
- UX issues identified visually ✅
- Payment errors debugged with full context ✅

---

### 6. Realtime Availability Monitoring (Enterprise)

#### **Supabase Realtime Integration**

```typescript
// packages/web/src/features/booking/hooks/useAvailabilityRealtime.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { availabilityKeys } from '@/queries/availabilityQueries'
import * as Sentry from '@sentry/react'

export function usePackageAvailabilityRealtime(
  packageId: string,
  checkIn: string,
  checkOut: string
) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const channel = supabase
      .channel(`package-bookings:${packageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'package_bookings',
          filter: `package_id=eq.${packageId}`
        },
        (payload) => {
          // Real-time booking update → invalidate availability
          queryClient.invalidateQueries({
            queryKey: availabilityKeys.packageAvailability(packageId, checkIn, checkOut)
          })
          
          // Track realtime sync events
          window.posthog?.capture('realtime_availability_sync', {
            packageId,
            event: payload.eventType,
          })
          
          Sentry.addBreadcrumb({
            category: 'realtime',
            message: `Package booking ${payload.eventType}`,
            data: { packageId, event: payload.eventType },
            level: 'info',
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR') {
          Sentry.captureMessage('Realtime Subscription Failed', {
            level: 'error',
            tags: { packageId },
          })
        }
      })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [packageId, checkIn, checkOut, queryClient])
}

// Usage in checkout page
export function PackageCheckoutPage() {
  const { packageId, checkIn, checkOut } = useCheckoutContext()
  
  // Enable realtime during checkout only
  usePackageAvailabilityRealtime(packageId, checkIn, checkOut)
}
```

**Success Metrics:**
- Zero stale availability during checkout ✅
- Realtime conflict prevention ✅
- Subscription health monitored ✅

---

## 📈 Dashboard Setup

### **Sentry Dashboard Widgets**

1. **Error Rate by Query Type**
   - Filter: `tags.queryType:query`
   - Group by: `tags.queryKey`
   - Chart: Time series

2. **Mutation Failure Rate**
   - Filter: `tags.queryType:mutation`
   - Group by: `tags.mutationKey`
   - Chart: Bar chart

3. **Slow Queries (>2s)**
   - Filter: `message:"Slow Query Detected"`
   - Group by: `tags.queryKey`
   - Alert: >10 occurrences in 1 hour

4. **Booking Conflicts**
   - Filter: `message:"Booking Conflict"`
   - Group by: `extra.cacheAge`
   - Alert: >5 occurrences in 1 hour

### **PostHog Funnel Analysis**

Create funnel:
1. `funnel_view_listing`
2. `funnel_check_availability`
3. `funnel_start_checkout`
4. `funnel_booking_hold_created`
5. `funnel_payment_initiated`
6. `funnel_booking_confirmed`

Track conversion rate and drop-off at each step.

---

## 💰 Cost Estimation

| Tool | Plan | Monthly Cost | Notes |
|------|------|--------------|-------|
| **Sentry** | Team | $26/month | 50K events, 500 replays |
| **PostHog** | Free → Scale | $0 → $200/month | 1M events free, then $0.00045/event |
| **DataDog** (Optional) | Pro | $15/host/month | Advanced metrics, APM |
| **LogRocket** (Optional) | Professional | $99/month | 10K sessions |

**Recommended Tier 1 (MVP):**
- Sentry Team: $26/month
- PostHog Free: $0/month
- **Total: $26/month**

**Recommended Tier 2 (Production):**
- Sentry Business: $80/month
- PostHog Scale: ~$200/month
- **Total: $280/month**

---

## ✅ Success Criteria (Phase Completion)

### **Phase 1 Complete When:**
- [ ] All production errors appear in Sentry
- [ ] Query/mutation errors tagged and groupable
- [ ] Slack alerts configured for critical errors
- [ ] Error rate < 0.5% for all query types

### **Phase 2 Complete When:**
- [ ] 95p latency tracked per query type
- [ ] Cache hit ratio > 70%
- [ ] Performance degradation alerts functional
- [ ] Slow query dashboard operational

### **Phase 3 Complete When:**
- [ ] Failed checkout sessions recorded
- [ ] Realtime availability sync enabled in checkout
- [ ] Booking funnel conversion tracked
- [ ] A/B test infrastructure ready

---

## 🚀 Quick Start Checklist

**Week 1: Get Sentry Running**
```bash
# 1. Install Sentry
pnpm add @sentry/react @sentry/vite-plugin

# 2. Get DSN from sentry.io
# 3. Add to .env
echo "VITE_SENTRY_DSN=https://xxx@sentry.io/xxx" >> .env.production

# 4. Initialize in main.tsx
# 5. Deploy and verify errors appear in dashboard
```

**Week 2: Add Query Metrics**
```bash
# 1. Copy queryMetrics.ts to src/lib/metrics/
# 2. Integrate with queryClient.ts
# 3. Deploy and verify slow query alerts
```

**Week 3-4: PostHog Analytics**
```bash
# 1. Sign up at posthog.com (free tier)
# 2. Add bookingFunnel.ts analytics
# 3. Instrument checkout flow
# 4. Create funnel dashboard
```

**Week 5-6: Session Replay + Realtime**
```bash
# 1. Enable PostHog session recording
# 2. Add realtime subscription hooks
# 3. Monitor for effectiveness
```

---

## 📚 Further Reading

- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [TanStack Query Devtools](https://tanstack.com/query/latest/docs/react/devtools)
- [PostHog Session Replay](https://posthog.com/docs/session-replay)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**Next Steps:**  
Start with Phase 1 - Sentry integration. This gives immediate value with minimal effort.

**Maintainer:** Engineering Team  
**Last Updated:** February 17, 2026  
**Status:** Ready for Implementation 🚀
