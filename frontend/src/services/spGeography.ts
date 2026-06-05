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
  const { data, error } = await supabase
    .from('sp_neighborhoods')
    .select('id, municipality_id, name')
    .eq('municipality_id', municipalityId)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getSpMunicipalityById(id: string) {
  const { data, error } = await supabase.from('sp_municipalities').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
