import { QueryClient } from '@tanstack/react-query'

/**
 * Enterprise-grade Query Client configuration
 * Following best practices from Airbnb/Stripe architecture
 * 
 * StaleTime Strategy by Data Sensitivity:
 * - Landing featured packages: 5-10 minutes (low change rate)
 * - Package/Tour details: 2-5 minutes (moderate change rate)
 * - Booking availability: 0-30 seconds (real-time critical)
 * - Admin dashboards: 30-60 seconds (moderate freshness needed)
 */

/**
 * ✅ Enterprise: Error-class aware retry logic
 * Don't retry errors that won't succeed on retry
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Max 1 retry for any error
  if (failureCount >= 1) return false

  // Extract error details
  const err = error as any
  const status = err?.status || err?.response?.status
  const code = err?.code
  const message = err?.message?.toLowerCase() || ''

  // ❌ DON'T RETRY: Auth errors
  if (status === 401 || status === 403) {
    console.warn('[QueryClient] Auth error - not retrying. Trigger re-auth.')
    return false
  }

  // ❌ DON'T RETRY: Not found
  if (status === 404) {
    return false
  }

  // ❌ DON'T RETRY: Rate limiting (429) - backend needs cooldown
  if (status === 429) {
    console.warn('[QueryClient] Rate limited - not retrying immediately')
    return false
  }

  // ❌ DON'T RETRY: Client errors (4xx except 408)
  if (status >= 400 && status < 500 && status !== 408) {
    return false
  }

  // ❌ DON'T RETRY: Supabase permission denied
  if (message.includes('permission denied') || message.includes('rls')) {
    return false
  }

  // ✅ RETRY: Network errors, timeouts, server errors (5xx)
  if (
    !status || // Network error
    status === 408 || // Request timeout
    status >= 500 // Server error
  ) {
    return true
  }

  // Default: don't retry unknown errors
  return false
}

/**
 * Exponential backoff with max cap
 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time: 2 minutes (conservative default)
      // Individual queries override this based on sensitivity
      staleTime: 2 * 60 * 1000,
      
      // Cache time: How long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Refetch behavior
      refetchOnWindowFocus: false, // Don't refetch on tab focus (reduce API calls)
      refetchOnMount: true, // Always refetch on component mount
      refetchOnReconnect: true, // Refetch on network reconnect
      
      // ✅ Enterprise: Error-class aware retry
      retry: shouldRetry,
      retryDelay,
    },
    mutations: {
      // ✅ Enterprise: Same smart retry for mutations
      retry: shouldRetry,
      retryDelay,
    },
  },
})
