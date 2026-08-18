import { isSurfaceEnabled } from '@tripavail/shared'
import { Redirect, Stack } from 'expo-router'

/**
 * Launch scope: the entire hotel-manager back office (dashboard, list-hotel,
 * create-package, bookings, settings, setup) is gated until Phase 3. A legacy
 * manager who deep-links into any /manager/* route is redirected to the app
 * shell. Screens are kept intact behind this single group-level guard.
 */
export default function ManagerLayout() {
  if (!isSurfaceEnabled('hotels')) return <Redirect href="/(tabs)" />
  return <Stack screenOptions={{ headerShown: false }} />
}
