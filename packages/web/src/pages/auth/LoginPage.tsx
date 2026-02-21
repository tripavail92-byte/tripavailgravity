import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { signIn, signUp, signInWithGoogle, devLogin, isLoading, user, activeRole } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const redirectedRef = useRef(false)

  const redirectParam = searchParams.get('redirect')
  const safeRedirect = useMemo(() => {
    if (!redirectParam) return null
    // Prevent open-redirects: only allow same-site absolute paths.
    if (!redirectParam.startsWith('/')) return null
    if (redirectParam.startsWith('//')) return null
    // Avoid redirecting back into auth loop.
    if (redirectParam.startsWith('/auth')) return null
    return redirectParam
  }, [redirectParam])

  useEffect(() => {
    // Persist deep-link so OAuth callbacks / refresh don't lose it.
    if (safeRedirect) {
      try {
        sessionStorage.setItem('postAuthRedirect', safeRedirect)
      } catch {
        // ignore
      }
    }
  }, [safeRedirect])

  const notice = searchParams.get('notice')
  const showCheckoutNotice = notice === 'checkout'

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'signup') setIsLogin(false)
    if (mode === 'login') setIsLogin(true)
  }, [searchParams])

  useEffect(() => {
    console.log('[LoginPage] Auth state changed:', {
      user: !!user,
      activeRole: activeRole?.role_type,
    })

    if (redirectedRef.current) return

    // 1) Enterprise deep-link: if a redirect is present (or persisted), honor it ASAP.
    if (user && !isLoading) {
      let target: string | null = safeRedirect

      if (!target) {
        try {
          const stored = sessionStorage.getItem('postAuthRedirect')
          if (
            stored &&
            stored.startsWith('/') &&
            !stored.startsWith('//') &&
            !stored.startsWith('/auth')
          ) {
            target = stored
          }
        } catch {
          // ignore
        }
      }

      if (target) {
        redirectedRef.current = true
        try {
          sessionStorage.removeItem('postAuthRedirect')
        } catch {
          // ignore
        }
        console.log('[LoginPage] Redirecting to deep-link:', target)
        navigate(target)
        return
      }
    }

    // 2) Default behavior: role-based landing once role is known.
    if (user && activeRole) {
      {
        // Role-based default routing
        switch (activeRole.role_type) {
          case 'admin':
            console.log('[LoginPage] Navigating to admin dashboard')
            navigate('/admin/dashboard')
            break
          case 'hotel_manager':
            console.log('[LoginPage] Navigating to hotel manager dashboard')
            navigate('/manager/dashboard')
            break
          case 'tour_operator':
            console.log('[LoginPage] Navigating to tour operator dashboard')
            navigate('/operator/dashboard')
            break
          case 'traveller':
          default:
            console.log('[LoginPage] Navigating to homepage')
            navigate('/')
            break
        }
      }
    } else if (user && !activeRole && !isLoading) {
      // User authenticated but role not yet resolved: do nothing.
      // This avoids breaking deep-links while roles are still loading.
      console.log('[LoginPage] User authenticated but role not resolved yet')
    }
  }, [user, activeRole, navigate, searchParams, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password, fullName)
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Authentication failed')
      }
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
            {showCheckoutNotice && !isLogin
              ? 'Create an account to continue booking. You’ll be returned to checkout after signup.'
              : isLogin
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
                placeholder="name@example.com"
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

            {error && <div className="text-sm text-error font-medium text-center">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  await signInWithGoogle()
                } catch (err: unknown) {
                  if (err instanceof Error) {
                    setError(err.message)
                  } else {
                    setError('Google Sign-In failed')
                  }
                }
              }}
              disabled={isLoading}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Sign in with Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="link" className="w-full" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => devLogin()}
          >
            Dev: Bypass Auth
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
