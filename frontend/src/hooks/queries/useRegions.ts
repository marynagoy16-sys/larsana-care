import { useQuery } from '@tanstack/react-query'
import { listCities, listRegions, regionsQueryKeys } from '@/services/regions'

function normalizeRegions(data: unknown) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: ReturnType<typeof listRegions> extends Promise<infer T> ? T : never }).data
  }
  return []
}

export function useRegions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: regionsQueryKeys.regions,
    queryFn: listRegions,
    select: normalizeRegions,
    enabled: options?.enabled ?? true,
  })
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
