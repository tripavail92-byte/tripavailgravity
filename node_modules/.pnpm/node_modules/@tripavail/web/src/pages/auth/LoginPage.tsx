import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState<string | null>(null)

    const { signIn, signUp, isLoading } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        try {
            if (isLogin) {
                await signIn(email, password)
            } else {
                await signUp(email, password, fullName)
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-primary">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isLogin
                            ? 'Enter your credentials to access your account'
                            : 'Sign up to start your journey with TripAvail'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="fullname">Full Name</Label>
                                <Input
                                    id="fullname"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 font-medium text-center">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="link"
                        className="w-full"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin
                            ? "Don't have an account? Sign Up"
                            : "Already have an account? Sign In"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
