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
      
      // Retry logic
      retry: 1, // Retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
})
