import { supabase } from '@/lib/supabase'

export type DemandListItem = {
  id: string
  demand_type: 'avaliacao' | 'continuidade'
  status: string
  location_address: string | null
  location_neighborhood: string | null
  location_lat: number | null
  location_lng: number | null
  patient_abbreviation: string
  patient_level: string | null
  diagnostic_hypothesis: string
  attendance_period: string
  created_at: string
}

export type DemandDetail = {
  id: string
  patient_id: string
  demand_type: 'avaliacao' | 'continuidade'
  status: string
  required_profession: string
  notes: string | null
  created_at: string
  updated_at: string
  region_id: string | null
  assigned_professional_id: string | null
  patients: {
    full_name: string
    cpf: string | null
    birth_date: string | null
    sex: string | null
    diagnostic_hypothesis: string | null
    attendance_period: string | null
    clinical_summary: string | null
    patient_level: string | null
    care_status: string | null
    suggested_weekly_frequency: number | null
    region_id: string | null
    city_id: string | null
    regions: { code: string; name: string } | null
    cities: { name: string } | null
    patient_addresses: Array<{
      full_address: string
      street: string | null
      number: string | null
      complement: string | null
      neighborhood: string | null
      postal_code: string | null
      is_primary: boolean
    }> | null
  } | null
  regions: { code: string; name: string } | null
  professionals: { full_name: string; pp_class: string | null; profession: string | null } | null
  patient_addresses: {
    full_address: string
    street: string | null
    number: string | null
    complement: string | null
    neighborhood: string | null
    postal_code: string | null
  } | null
  demand_responses: Array<{
    id: string
    professional_id: string
    response: string
    decline_reason: string | null
    responded_at: string
    professionals: { full_name: string } | null
  }> | null
}

export type AcceptDemandResult = {
  demand_id: string
  patient_id: string
  demand_type: 'avaliacao' | 'continuidade'
}

const DEMAND_LIST_SELECT = `
  *,
  patients (
    full_name,
    birth_date,
    sex,
    diagnostic_hypothesis,
    attendance_period,
    clinical_summary,
    patient_level
  ),
  patient_addresses (
    full_address,
    neighborhood,
    latitude,
    longitude
  ),
  professionals ( full_name )
`

const DEMAND_DETAIL_SELECT = `
  *,
  patients (
    full_name, cpf, birth_date, sex, diagnostic_hypothesis, attendance_period,
    clinical_summary, patient_level, care_status, suggested_weekly_frequency,
    region_id, city_id,
    regions ( code, name ),
    cities ( name ),
    patient_addresses (
      full_address, street, number, complement, neighborhood, postal_code, is_primary
    )
  ),
  regions ( code, name ),
  professionals ( full_name, pp_class, profession ),
  patient_addresses (
    full_address, street, number, complement, neighborhood, postal_code
  ),
  demand_responses (
    id, professional_id, response, decline_reason, responded_at,
    professionals ( full_name )
  )
`

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return parts[0] ?? 'Paciente'
  return `${parts[0]} ${parts[parts.length - 1]?.charAt(0) ?? ''}.`
}

export async function listOpenDemandsForPp(): Promise<{ data: DemandListItem[]; count: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  let declinedDemandIds = new Set<string>()

  if (user) {
    const { data: pro } = await (supabase as any)
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (pro?.id) {
      const { data: declined } = await (supabase as any)
        .from('demand_responses')
        .select('demand_id')
        .eq('professional_id', pro.id)
        .eq('response', 'declined')
      declinedDemandIds = new Set((declined ?? []).map((row: { demand_id: string }) => row.demand_id))
    }
  }

  const { data, error } = await supabase
    .from('demands')
    .select(DEMAND_LIST_SELECT)
    .eq('status', 'aberta')
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as Array<{
    id: string
    demand_type: 'avaliacao' | 'continuidade'
    status: string
    created_at: string
    patients: {
      full_name: string
      diagnostic_hypothesis: string | null
      attendance_period: string | null
      patient_level: string | null
    } | null
    patient_addresses: {
      full_address: string
      neighborhood: string | null
      latitude: number | null
      longitude: number | null
    } | null
  }>

  const mapped: DemandListItem[] = rows
    .filter((row) => !declinedDemandIds.has(row.id))
    .map((row) => ({
    id: row.id,
    demand_type: row.demand_type,
    status: row.status,
    location_address: row.patient_addresses?.full_address ?? null,
    location_neighborhood: row.patient_addresses?.neighborhood ?? null,
    location_lat: row.patient_addresses?.latitude ?? null,
    location_lng: row.patient_addresses?.longitude ?? null,
    patient_abbreviation: abbreviateName(row.patients?.full_name ?? 'Paciente'),
    patient_level: row.patients?.patient_level ?? null,
    diagnostic_hypothesis: row.patients?.diagnostic_hypothesis ?? '—',
    attendance_period: row.patients?.attendance_period ?? '—',
    created_at: row.created_at,
  }))

  return { data: mapped, count: mapped.length }
}

export async function getDemandDetail(id: string): Promise<DemandDetail> {
  const { data, error } = await (supabase as any)
    .from('demands')
    .select(DEMAND_DETAIL_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as DemandDetail
}

export async function acceptDemand(demandId: string): Promise<AcceptDemandResult> {
  const { data, error } = await (supabase as any).rpc('accept_demand', { p_demand_id: demandId })
  if (error) throw error
  return data as unknown as AcceptDemandResult
}

export async function declineDemand({
  demandId,
  professionalId,
  reason = null,
}: {
  demandId: string
  professionalId: string
  reason?: string | null
}) {
  const { error } = await (supabase as any).from('demand_responses').insert({
    demand_id: demandId,
    professional_id: professionalId,
    response: 'declined',
    decline_reason: reason,
    responded_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function getCurrentProfessionalId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await (supabase as any)
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}
