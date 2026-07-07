import type { User } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { create } from 'zustand'

import { supabase } from '@/lib/supabase'
import type { RoleType, UserRole } from '@tripavail/shared'

// Required for Google OAuth redirect on iOS
WebBrowser.maybeCompleteAuthSession()

function getAuthTokensFromUrl(url: string) {
  const parsed = new URL(url)
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''))

  return {
    access_token: parsed.searchParams.get('access_token') ?? hashParams.get('access_token'),
    refresh_token:
      parsed.searchParams.get('refresh_token') ?? hashParams.get('refresh_token'),
  }
}

// Mobile uses the mobile Supabase client directly — shared roleService
// uses a Vite-env-keyed client and is not compatible here.
async function fetchActiveRole(userId: string): Promise<UserRole | null> {
  const { data } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  return data as UserRole | null
}

// Partner type is a PERMANENT selection (hotel_manager OR tour_operator),
// derived from the existence of a partner role in user_roles — independent of
// the currently active role. Mirrors web useAuth.partnerType.
async function fetchPartnerType(
  userId: string,
): Promise<'hotel_manager' | 'tour_operator' | null> {
  const { data } = await supabase.from('user_roles').select('role_type').eq('user_id', userId)
  const partner = (data ?? []).find(
    (r: { role_type?: string | null }) =>
      r.role_type === 'hotel_manager' || r.role_type === 'tour_operator',
  )
  return (partner?.role_type as 'hotel_manager' | 'tour_operator') ?? null
}

interface AuthState {
  user: User | null
  activeRole: UserRole | null
  partnerType: 'hotel_manager' | 'tour_operator' | null
  initialized: boolean

  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  switchRole: (role: RoleType) => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  activeRole: null,
  partnerType: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const [role, partnerType] = await Promise.all([
          fetchActiveRole(session.user.id),
          fetchPartnerType(session.user.id),
        ])
        set({ user: session.user, activeRole: role, partnerType, initialized: true })
      } else {
        set({ initialized: true })
      }
    } catch {
      set({ initialized: true })
    }

    // Listen for future sign-in / sign-out events
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const [role, partnerType] = await Promise.all([
          fetchActiveRole(session.user.id),
          fetchPartnerType(session.user.id),
        ])
        set({ user: session.user, activeRole: role, partnerType })
      } else {
        set({ user: null, activeRole: null, partnerType: null })
      }
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signInWithGoogle: async () => {
    const redirectUri = Linking.createURL('/auth/callback')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUri },
    })
    if (error) throw error
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri)
      if (result.type === 'success' && result.url) {
        const { access_token, refresh_token } = getAuthTokensFromUrl(result.url)
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
        }
      }
    }
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, activeRole: null, partnerType: null })
  },

  switchRole: async (role) => {
    const { user } = get()
    if (!user) return
    const { error } = await supabase.rpc('switch_user_role', {
      p_user_id: user.id,
      p_role_type: role,
    })
    if (error) throw error
    const [newRole, partnerType] = await Promise.all([
      fetchActiveRole(user.id),
      fetchPartnerType(user.id),
    ])
    set({ activeRole: newRole, partnerType })
  },
}))
