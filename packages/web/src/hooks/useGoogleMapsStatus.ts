import { APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'

import { subscribeGoogleMapsAuthFailure } from '@/lib/googleMapsAuthFailure'

/**
 * True once Google Maps has failed to load/authenticate within the ambient `<APIProvider>`
 * (missing key, billing disabled, an API not enabled, a referrer restriction, or quota) —
 * or the key was never configured at all. Must be called from a component that is a
 * descendant of `<APIProvider>`. Safe to call from multiple components on the same page.
 */
export function useGoogleMapsUnavailable(hasApiKey: boolean): boolean {
  const status = useApiLoadingStatus()
  const [authFailed, setAuthFailed] = useState(false)

  useEffect(() => subscribeGoogleMapsAuthFailure(() => setAuthFailed(true)), [])

  return (
    !hasApiKey ||
    status === APILoadingStatus.AUTH_FAILURE ||
    status === APILoadingStatus.FAILED ||
    authFailed
  )
}
