import type { Session, User } from '@supabase/supabase-js'

import { isAbortError, isTimeoutError, withTimeout } from '@/lib/withTimeout'
import { supabase } from '@/lib/supabase'

type CacheEntry<T> = { value: T; at: number }

let sessionInFlight: Promise<Session | null> | null = null
let sessionCache: CacheEntry<Session | null> | null = null

let userInFlight: Promise<User | null> | null = null
let userCache: CacheEntry<User | null> | null = null

export function resetAuthCache() {
  sessionInFlight = null
  sessionCache = null
  userInFlight = null
  userCache = null
}

export async function getSessionCached(maxAgeMs = 1500): Promise<Session | null> {
  const now = Date.now()
  if (sessionCache && now - sessionCache.at < maxAgeMs) return sessionCache.value
  if (sessionInFlight) return sessionInFlight

  sessionInFlight = (async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getSession(),
        12000,
        'supabase.auth.getSession',
      )
      if (error) throw error
      sessionCache = { value: data.session, at: Date.now() }
      return data.session
    } catch (e) {
      if (isAbortError(e) || isTimeoutError(e)) {
        sessionCache = { value: null, at: Date.now() }
        return null
      }
      throw e
    } finally {
      sessionInFlight = null
    }
  })()

  return sessionInFlight
}

export async function getUserCached(maxAgeMs = 1500): Promise<User | null> {
  const now = Date.now()
  if (userCache && now - userCache.at < maxAgeMs) return userCache.value
  if (userInFlight) return userInFlight

  userInFlight = (async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getUser(),
        12000,
        'supabase.auth.getUser',
      )
      if (error) throw error
      userCache = { value: data.user, at: Date.now() }
      return data.user
    } catch (e) {
      if (isAbortError(e) || isTimeoutError(e)) {
        userCache = { value: null, at: Date.now() }
        return null
      }
      throw e
    } finally {
      userInFlight = null
    }
  })()

  return userInFlight
}
