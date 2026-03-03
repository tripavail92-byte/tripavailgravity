import { useEffect, useState } from 'react'

type GeoCoords = { latitude: number; longitude: number }

type GeoStatus = 'idle' | 'unavailable' | 'checking' | 'granted' | 'denied' | 'error'

export function useGeolocationIfGranted() {
  const [coords, setCoords] = useState<GeoCoords | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setStatus('unavailable')
        return
      }

      // Never prompt; only fetch location if permission is already granted.
      const permissions = (navigator as any).permissions as
        | { query: (descriptor: { name: string }) => Promise<{ state: string }> }
        | undefined

      if (!permissions?.query) {
        setStatus('unavailable')
        return
      }

      setStatus('checking')
      try {
        const res = await permissions.query({ name: 'geolocation' })

        if (cancelled) return

        if (res.state !== 'granted') {
          setStatus(res.state === 'denied' ? 'denied' : 'unavailable')
          return
        }

        setStatus('granted')
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) return
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          () => {
            if (cancelled) return
            setStatus('error')
          },
          { enableHighAccuracy: false, maximumAge: 60_000, timeout: 7_000 },
        )
      } catch {
        if (cancelled) return
        setStatus('error')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [])

  return { coords, status }
}
