import { useQuery } from '@tanstack/react-query'
import { listCities, listRegions } from '@/services/regions'

export function useRegions() {
  return useQuery({ queryKey: ['regions'], queryFn: listRegions })
}

export function useCities(regionId?: string) {
  return useQuery({
    queryKey: ['cities', regionId],
    queryFn: () => listCities(regionId),
    enabled: !!regionId,
  })
}
