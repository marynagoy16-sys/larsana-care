import { useQuery } from '@tanstack/react-query'
import { listCities, listRegions, regionsQueryKeys } from '@/services/regions'

export function useRegions() {
  return useQuery({ queryKey: regionsQueryKeys.regions, queryFn: listRegions })
}

export function useAllCities() {
  return useQuery({
    queryKey: regionsQueryKeys.allCities,
    queryFn: () => listCities(),
  })
}

export function useCities(regionId?: string) {
  return useQuery({
    queryKey: regionsQueryKeys.cities(regionId),
    queryFn: () => listCities(regionId),
    enabled: !!regionId,
  })
}
