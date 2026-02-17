import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { Button } from '@/components/ui/button'

/**
 * Enterprise Error Fallback Component
 * Displays when data fetching fails catastrophically
 */
function QueryErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Type guard for Error objects
  const errorMessage =
    error instanceof Error ? error.message : 'An unexpected error occurred while loading data.'
  const errorStack = error instanceof Error ? error.stack : String(error)

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
        <p className="text-muted-foreground">{errorMessage}</p>
        <div className="pt-4">
          <Button onClick={resetErrorBoundary} size="lg">
            Try Again
          </Button>
        </div>
        {import.meta.env.DEV && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto max-h-48">
              {errorStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * Query Error Boundary Wrapper
 * Enterprise pattern: Combines QueryErrorResetBoundary with ErrorBoundary
 * 
 * Usage:
 * <QueryErrorBoundaryWrapper>
 *   <ComponentThatUsesQueries />
 * </QueryErrorBoundaryWrapper>
 */
export function QueryErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={QueryErrorFallback}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
