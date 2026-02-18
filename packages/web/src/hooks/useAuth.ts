import type { User } from '@supabase/supabase-js'
import { authService } from '@tripavail/shared/auth/service'
import { supabase } from '@/lib/supabase'
import { roleService } from '@tripavail/shared/roles/service'
import type { RoleType, UserRole } from '@tripavail/shared/roles/types'
import { create } from 'zustand'

interface AuthState {
  user: User | null
  activeRole: UserRole | null
  isLoading: boolean
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  devLogin: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  switchRole: (role: RoleType) => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  activeRole: null,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    try {
      const session = await authService.getSession()

      if (session?.user) {
        // Admin override: admin accounts should land in Admin UI, not traveller.
        const { data: adminRole, error: adminRoleError } = await supabase.rpc('get_admin_role', {
          p_user_id: session.user.id,
        })

        let activeRole: UserRole | null = !adminRoleError && adminRole
          ? {
              id: session.user.id,
              user_id: session.user.id,
              role_type: 'admin',
              is_active: true,
              profile_completion: 100,
              verification_status: 'approved',
            }
          : await roleService.getActiveRole(session.user.id)

        // Fallback: If no role found (e.g. new Google sign-up), default to Traveller
        if (!activeRole && !adminRole) {
          activeRole = {
            id: session.user.id,
            user_id: session.user.id,
            role_type: 'traveller',
            is_active: true,
            profile_completion: 20, // Give them a start
            verification_status: 'incomplete',
          }
        }

        set({ user: session.user, activeRole, isLoading: false, initialized: true })
      } else {
        set({ user: null, activeRole: null, isLoading: false, initialized: true })
      }

      // Listen for changes
      authService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: adminRole, error: adminRoleError } = await supabase.rpc('get_admin_role', {
            p_user_id: session.user.id,
          })

          let activeRole: UserRole | null = !adminRoleError && adminRole
            ? {
                id: session.user.id,
                user_id: session.user.id,
                role_type: 'admin',
                is_active: true,
                profile_completion: 100,
                verification_status: 'approved',
              }
            : await roleService.getActiveRole(session.user.id)

          // Fallback: If no role found, default to Traveller
          if (!activeRole && !adminRole) {
            activeRole = {
              id: session.user.id,
              user_id: session.user.id,
              role_type: 'traveller',
              is_active: true,
              profile_completion: 20,
              verification_status: 'incomplete',
            }
          }
          set({ user: session.user, activeRole, isLoading: false })
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, activeRole: null, isLoading: false })
        }
      })
    } catch (error) {
      // Ignore AbortErrors - they're expected in React Strict Mode
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[useAuth] Initialization aborted (expected in dev mode)')
        set({ isLoading: false, initialized: true })
      } else {
        console.error('Auth initialization failed:', error)
        set({ isLoading: false, initialized: true })
      }
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true })
    try {
      // Add 10 second timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Authentication timeout - please check your connection')), 10000)
      )
      
      const signInPromise = authService.signIn(email, password)
      
      await Promise.race([signInPromise, timeoutPromise])
      // State updated by onAuthStateChange listener
    } catch (error) {
      console.error('[useAuth] Sign in error:', error)
      set({ isLoading: false })
      throw error
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true })
    try {
      const appBaseUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || window.location.origin
      const normalizedBaseUrl = appBaseUrl.replace(/\/+$/, '')
      const redirectTo = `${normalizedBaseUrl}/auth/callback`
      await authService.signInWithGoogle(redirectTo)
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  devLogin: async () => {
    set({ isLoading: true })
    // Mock User Data
    const mockUser: User = {
      id: 'dev-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'dev@tripavail.com',
      phone: '',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'Dev Traveller', avatar_url: 'https://github.com/shadcn.png' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User

    // Mock Role Data
    const mockRole: UserRole = {
      id: 'dev-role-id',
      user_id: 'dev-user-id',
      role_type: 'traveller',
      is_active: true,
      // enabled_at: new Date().toISOString(), // Optional or non-existent in strict type
      profile_completion: 80,
      verification_status: 'approved',
    }

    // Simulate network delay
    setTimeout(() => {
      set({ user: mockUser, activeRole: mockRole, isLoading: false })
    }, 800)
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true })
    try {
      await authService.signUp(email, password, fullName)
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    try {
      await authService.signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
      // We continue to ensure local state is cleared
    } finally {
      set({ user: null, activeRole: null, isLoading: false })
    }
  },

  switchRole: async (roleType) => {
    const { user } = get()
    if (!user) return

    set({ isLoading: true })
    try {
      const result = await roleService.switchRole(user.id, roleType)

      // Update local state immediately for better UX
      if (result.status === 'success') {
        // Re-fetch to be safe or construct optimistic update
        const newRole = await roleService.getActiveRole(user.id)
        set({ activeRole: newRole, isLoading: false })
      }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))
