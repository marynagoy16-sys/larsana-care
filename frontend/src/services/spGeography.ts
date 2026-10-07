import { supabase } from '@/lib/supabase'

export async function listSpMunicipalitiesByIds(ids: string[]) {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('sp_municipalities')
    .select('id, ibge_code, name, state')
    .in('id', ids)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function listSpMunicipalities(search?: string) {
  let query = supabase.from('sp_municipalities').select('id, ibge_code, name, state').order('name')
  if (search?.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function listSpNeighborhoods(municipalityId: string) {
  const pageSize = 1000
  const rows: { id: string; municipality_id: string; name: string }[] = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('sp_neighborhoods')
      .select('id, municipality_id, name')
      .eq('municipality_id', municipalityId)
      .order('name')
      .range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }

  return rows
}

export async function getSpMunicipalityById(id: string) {
  const { data, error } = await supabase.from('sp_municipalities').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
