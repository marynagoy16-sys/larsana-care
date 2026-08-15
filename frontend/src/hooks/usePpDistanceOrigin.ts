import { useQuery } from '@tanstack/react-query'
import { MAUA_CENTER, type GeoPoint } from '@/lib/geo'
import { resolvePpProfessionalOrigin } from '@/services/ppLocation'

export function usePpDistanceOrigin(fallback: GeoPoint = MAUA_CENTER) {
  const query = useQuery({
    queryKey: ['pp', 'distance-origin'],
    queryFn: resolvePpProfessionalOrigin,
    staleTime: 1000 * 60 * 60 * 24,
  })

  return {
    origin: query.data ?? fallback,
    usingProfessionalAddress: query.data != null,
    isLoading: query.isLoading,
  }
}
