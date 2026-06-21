import { useEffect, useState } from 'react'
import type { GeoPoint } from '@/lib/geo'

export function useMapOrigin(fallback: GeoPoint) {
  const [origin, setOrigin] = useState<GeoPoint>(fallback)
  const [usingDeviceLocation, setUsingDeviceLocation] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setUsingDeviceLocation(true)
      },
      () => {
        setUsingDeviceLocation(false)
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    )
  }, [])

  return { origin, usingDeviceLocation }
}
