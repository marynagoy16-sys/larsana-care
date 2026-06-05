import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type City = Database['public']['Tables']['cities']['Row']
type Neighborhood = Database['public']['Tables']['neighborhoods']['Row']

export async function listRegions() {
  const { data, error } = await supabase.from('regions').select('*').order('code')
  if (error) throw error
  return data
}

export async function listCities(regionId?: string) {
  let query = supabase.from('cities').select('*').order('name')
  if (regionId) query = query.eq('region_id', regionId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function listNeighborhoods(cityId: string) {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('city_id', cityId)
    .order('name')
  if (error) throw error
  return data ?? []
}

export type RegionTableRow = Database['public']['Tables']['regions']['Row'] & {
  city_count: number
  neighborhood_count: number
}

export async function listRegionsWithStats(): Promise<RegionTableRow[]> {
  const regions = await listRegions()
  const cities = await listCities()

  const neighborhoodCountByCity = new Map<string, number>()
  if (cities.length > 0) {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('city_id')
      .in(
        'city_id',
        cities.map((city) => city.id),
      )
    if (error) throw error
    for (const neighborhood of data ?? []) {
      neighborhoodCountByCity.set(
        neighborhood.city_id,
        (neighborhoodCountByCity.get(neighborhood.city_id) ?? 0) + 1,
      )
    }
  }

  return regions.map((region) => {
    const regionCities = cities.filter((city) => city.region_id === region.id)
    const neighborhood_count = regionCities.reduce(
      (sum, city) => sum + (neighborhoodCountByCity.get(city.id) ?? 0),
      0,
    )
    return {
      ...region,
      city_count: regionCities.length,
      neighborhood_count,
    }
  })
}

export async function listRegionGeography(regionId: string) {
  const cities = await listCities(regionId)
  if (cities.length === 0) {
    return { cities: [] as City[], neighborhoodsByCity: {} as Record<string, Neighborhood[]> }
  }

  const { data: neighborhoods, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .in('city_id', cities.map((city) => city.id))
    .order('name')
  if (error) throw error

  const neighborhoodsByCity: Record<string, Neighborhood[]> = {}
  for (const neighborhood of neighborhoods ?? []) {
    if (!neighborhoodsByCity[neighborhood.city_id]) neighborhoodsByCity[neighborhood.city_id] = []
    neighborhoodsByCity[neighborhood.city_id].push(neighborhood)
  }

  return { cities, neighborhoodsByCity }
}

export async function syncRegionCities(
  regionId: string,
  municipalities: Array<{ id: string; name: string }>,
) {
  const existing = await listCities(regionId)
  const selectedIds = new Set(municipalities.map((m) => m.id))
  const existingByCatalogId = new Map(
    existing.filter((c) => c.sp_municipality_id).map((c) => [c.sp_municipality_id!, c]),
  )

  const toInsert = municipalities.filter((m) => !existingByCatalogId.has(m.id))
  if (toInsert.length > 0) {
    const { error } = await supabase.from('cities').insert(
      toInsert.map((m) => ({
        name: m.name,
        state: 'SP',
        region_id: regionId,
        sp_municipality_id: m.id,
      })),
    )
    if (error) throw error
  }

  const toDelete = existing.filter(
    (city) => city.sp_municipality_id && !selectedIds.has(city.sp_municipality_id),
  )
  for (const city of toDelete) {
    const { error } = await supabase.from('cities').delete().eq('id', city.id)
    if (error) throw error
  }

  return listCities(regionId)
}

export async function syncCityNeighborhoods(
  cityId: string,
  selected: Array<{ id?: string | null; name: string }>,
) {
  const existing = await listNeighborhoods(cityId)
  const selectedCatalogIds = new Set(selected.filter((s) => s.id).map((s) => s.id!))
  const selectedNames = new Set(selected.map((s) => normalizeName(s.name)))

  const existingByCatalog = new Map(
    existing.filter((n) => n.sp_neighborhood_id).map((n) => [n.sp_neighborhood_id!, n]),
  )

  const toInsert = selected.filter((s) => {
    if (s.id && existingByCatalog.has(s.id)) return false
    if (!s.id && existing.some((n) => normalizeName(n.name) === normalizeName(s.name))) return false
    return true
  })
  if (toInsert.length > 0) {
    const { error } = await supabase.from('neighborhoods').insert(
      toInsert.map((s) => ({
        city_id: cityId,
        name: s.name,
        sp_neighborhood_id: s.id ?? null,
      })),
    )
    if (error) throw error
  }

  const toDelete = existing.filter((n) => {
    if (n.sp_neighborhood_id) return !selectedCatalogIds.has(n.sp_neighborhood_id)
    return !selectedNames.has(normalizeName(n.name))
  })

  for (const neighborhood of toDelete) {
    const { error } = await supabase.from('neighborhoods').delete().eq('id', neighborhood.id)
    if (error) throw error
  }

  return listNeighborhoods(cityId)
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

export const regionsQueryKeys = {
  regions: ['regions'] as const,
  cities: (regionId?: string) => ['cities', regionId ?? 'all'] as const,
  geography: (regionId: string) => ['region_geography', regionId] as const,
  spNeighborhoods: (municipalityId: string) => ['sp_neighborhoods', municipalityId] as const,
}
