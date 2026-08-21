import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MAUA_CENTER, type GeoPoint } from '@/lib/geo'
import { getBrowserGeolocation, resolvePpProfessionalOrigin, savePpLiveLocation } from '@/services/ppLocation'

export function usePpDistanceOrigin(fallback: GeoPoint = MAUA_CENTER) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['pp', 'distance-origin'],
    queryFn: resolvePpProfessionalOrigin,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    let cancelled = false
    void getBrowserGeolocation().then(async (point) => {
      if (cancelled || !point) return
      try {
        await savePpLiveLocation(point)
        queryClient.setQueryData(['pp', 'distance-origin'], point)
      } catch {
        queryClient.setQueryData(['pp', 'distance-origin'], point)
      }
    })
    return () => {
      cancelled = true
    }
  }, [queryClient])

  return {
    origin: query.data ?? fallback,
    usingLiveLocation: query.data != null,
    isLoading: query.isLoading,
  }
}
