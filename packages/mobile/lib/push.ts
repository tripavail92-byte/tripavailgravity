import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { type Href, router } from 'expo-router'

import { supabase } from '@/lib/supabase'

/**
 * Push notifications — Expo push pipeline.
 * The Expo push token is stored in auth user_metadata (`expo_push_token`),
 * deliberately avoiding any schema change to the shared backend. The
 * `send-push` edge function (supabase/functions/send-push) reads it back via
 * the admin API when a `notifications` row is inserted (DB webhook) and relays
 * through https://exp.host/--/api/v2/push/send.
 *
 * Expo Go note: remote push needs an EAS projectId (set after `eas init`);
 * until then registration is skipped silently. Foreground banners for
 * realtime events work regardless.
 */

// Show alerts even while the app is foregrounded (banner + list + sound).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', {
    name: 'TripAvail',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF385C',
  })
}

/** Register for remote push and persist the token. No-ops on denial/emulator-without-services. */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice && Platform.OS === 'ios') return null // iOS simulator can't receive push
    await ensureAndroidChannel()

    const existing = await Notifications.getPermissionsAsync()
    let granted = existing.granted
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync()
      granted = req.granted
    }
    if (!granted) return null

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    if (!projectId) return null // pre-EAS (Expo Go without eas init) — skip remote token

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data

    const { data } = await supabase.auth.getUser()
    const current = data.user?.user_metadata?.expo_push_token
    if (current !== token) {
      await supabase.auth.updateUser({
        data: { expo_push_token: token, expo_push_token_updated_at: new Date().toISOString() },
      })
    }
    return token
  } catch {
    return null
  }
}

function routeForNotification(content: Notifications.NotificationContent) {
  const meta = (content.data ?? {}) as Record<string, any>
  if (typeof meta.route === 'string') return meta.route
  if (meta.conversation_id) return `/messages/${meta.conversation_id}`
  if (meta.booking_id) return `/trips/${meta.booking_id}`
  if (meta.tour_id) return `/tours/${meta.tour_id}`
  return '/notifications'
}

/** Mount once (root layout). Registers on sign-in and routes notification taps. */
export function usePushNotifications(userId: string | null | undefined) {
  const registered = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || registered.current === userId) return
    registered.current = userId
    registerForPush()
  }, [userId])

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeForNotification(response.notification.request.content)
      router.push(route as Href)
    })
    return () => sub.remove()
  }, [])
}
