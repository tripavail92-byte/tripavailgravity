import { QueryClient } from '@tanstack/react-query'

/**
 * Enterprise-grade Query Client configuration
 * Following best practices from Airbnb/Stripe architecture
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long before data is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes default
      
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
