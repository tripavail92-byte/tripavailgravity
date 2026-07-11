import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Component, ErrorInfo, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { isChunkLoadError, reloadForFreshAssets } from '@/lib/chunkReload'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  isStaleChunk: boolean
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, isStaleChunk: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isStaleChunk: isChunkLoadError(error) }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // A failed lazy import is almost always a stale deploy, not a real crash: this tab loaded an
    // index.html that references a route chunk a newer deploy has since removed. Reload to fresh
    // assets rather than dead-ending the user. Guarded to reload at most once, so a chunk that is
    // truly broken shows the error below instead of looping.
    if (isChunkLoadError(error)) {
      reloadForFreshAssets()
      return
    }
    console.error('Uncaught error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Stale-chunk case: a reload is already in flight (or the operator can trigger it). Show a
      // calm "new version" message, never the red "something went wrong" — nothing is broken.
      if (this.state.isStaleChunk) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <RefreshCcw className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Updating to the latest version</CardTitle>
                <CardDescription>
                  A newer version of TripAvail is available. Reloading to get it…
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Button onClick={this.handleReload} variant="default" className="w-full sm:w-auto">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reload now
                </Button>
              </CardFooter>
            </Card>
          </div>
        )
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md shadow-lg border-red-100">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-700">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {this.state.error && (
                <div className="p-4 bg-gray-100 rounded-md text-xs font-mono text-gray-700 overflow-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={this.handleReload} variant="default" className="w-full sm:w-auto">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reload Application
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
