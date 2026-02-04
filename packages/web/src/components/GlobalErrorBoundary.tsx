import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Component, ErrorInfo, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
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
