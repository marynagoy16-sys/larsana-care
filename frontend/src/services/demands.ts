import { supabase } from '@/lib/supabase'
import type { CrudRow } from '@/lib/createCrudService'
import {
  formatAttendancePeriod,
  formatPatientAbbreviation,
  formatPatientAge,
  formatPatientSex,
  resolveDiagnosticHypothesis,
} from '@/lib/patientDisplay'
import { scoreDemandPreferenceMatch, type PpTechnicalCategory } from '@/lib/ppTechnicalCategories'

type DemandPatientJoin = {
  full_name: string
  birth_date: string | null
  sex: string | null
  diagnostic_hypothesis: string | null
  attendance_period: string | null
  clinical_summary: string | null
  patient_level: string | null
  technical_category: string | null
}

type DemandAddressJoin = {
  full_address: string
  neighborhood: string | null
  latitude: number | null
  longitude: number | null
}

export type DemandListItem = CrudRow & {
  demand_type: 'avaliacao' | 'continuidade'
  technical_category: string | null
  patient_abbreviation: string
  patient_sex: string
  patient_age: string
  patient_level: string | null
  diagnostic_hypothesis: string
  attendance_period: string
  attendance_period_raw: string | null
  region_id: string | null
  assigned_professional_id: string | null
  assigned_professional_name: string | null
  location_lat: number | null
  location_lng: number | null
  location_address: string | null
  location_neighborhood: string | null
  preference_match_score?: 1 | 0 | -1
}

type DemandPatientDetail = {
  full_name: string
  cpf: string | null
  birth_date: string | null
  sex: string | null
  diagnostic_hypothesis: string | null
  attendance_period: string | null
  clinical_summary: string | null
  patient_level: string | null
  care_status: string | null
  technical_category: string | null
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
}

export type DemandDetail = CrudRow & {
  patient_id: string
  demand_type: 'avaliacao' | 'continuidade'
  status: string
  required_profession: string
  notes: string | null
  created_at: string
  updated_at: string
  region_id: string | null
  assigned_professional_id: string | null
  patients: DemandPatientDetail | null
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

const DEMAND_DETAIL_SELECT = `
  *,
  patients (
    full_name, cpf, birth_date, sex, diagnostic_hypothesis, attendance_period,
    clinical_summary, patient_level, care_status, suggested_weekly_frequency,
    technical_category,
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

const DEMAND_LIST_SELECT = `
  *,
  patients (
    full_name,
    birth_date,
    sex,
    diagnostic_hypothesis,
    attendance_period,
    clinical_summary,
    patient_level,
    technical_category
  ),
  patient_addresses (
    full_address,
    neighborhood,
    latitude,
    longitude
  ),
  professionals ( full_name )
`

function mapDemandRow(
  row: CrudRow & {
    patients: DemandPatientJoin | null
    patient_addresses: DemandAddressJoin | null
    professionals: { full_name: string } | null
  },
  preferences?: PpTechnicalCategory[] | null,
): DemandListItem {
  const patient = row.patients
  const address = row.patient_addresses
  const professional = row.professionals
  const technicalCategory = (row.technical_category as string | null)
    ?? patient?.technical_category
    ?? null

  return {
    ...row,
    demand_type: (row.demand_type as DemandListItem['demand_type']) ?? 'avaliacao',
    technical_category: technicalCategory,
    preference_match_score: scoreDemandPreferenceMatch(technicalCategory, preferences),
    patient_abbreviation: formatPatientAbbreviation(patient?.full_name),
    patient_sex: formatPatientSex(patient?.sex),
    patient_age: formatPatientAge(patient?.birth_date),
    patient_level: patient?.patient_level ?? null,
    diagnostic_hypothesis: resolveDiagnosticHypothesis(
      patient?.diagnostic_hypothesis,
      patient?.clinical_summary,
    ),
    attendance_period: formatAttendancePeriod(patient?.attendance_period),
    attendance_period_raw: patient?.attendance_period ?? null,
    region_id: (row.region_id as string | null) ?? null,
    assigned_professional_id: (row.assigned_professional_id as string | null) ?? null,
    assigned_professional_name: professional?.full_name ?? null,
    location_lat: address?.latitude ?? null,
    location_lng: address?.longitude ?? null,
    location_address: address?.full_address ?? null,
    location_neighborhood: address?.neighborhood ?? null,
  }
}

export const demandsService = {
  async listOpenForPp() {
    const { data: { user } } = await supabase.auth.getUser()
    let preferences: PpTechnicalCategory[] | null = null
    let professionalId: string | null = null
    let declinedDemandIds = new Set<string>()

    if (user) {
      const { data: pro } = await supabase
        .from('professionals')
        .select('id, patient_preferences')
        .eq('user_id', user.id)
        .maybeSingle()
      preferences = (pro?.patient_preferences ?? null) as PpTechnicalCategory[] | null
      professionalId = pro?.id ?? null

      if (professionalId) {
        const { data: declined } = await supabase
          .from('demand_responses')
          .select('demand_id')
          .eq('professional_id', professionalId)
          .eq('response', 'declined')
        declinedDemandIds = new Set((declined ?? []).map((row) => row.demand_id as string))
      }
    }

    const { data, error } = await supabase
      .from('demands')
      .select(DEMAND_LIST_SELECT)
      .eq('status', 'aberta')
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as unknown as Array<
      CrudRow & {
        patients: DemandPatientJoin | null
        patient_addresses: DemandAddressJoin | null
        professionals: { full_name: string } | null
      }
    >
    const mapped = rows
      .filter((row) => !declinedDemandIds.has(String(row.id)))
      .map((row) => mapDemandRow(row, preferences))
      .sort((a, b) => (b.preference_match_score ?? 0) - (a.preference_match_score ?? 0))

    return { data: mapped, count: mapped.length }
  },

  async acceptDemand(demandId: string): Promise<AcceptDemandResult> {
    const { data, error } = await supabase.rpc('accept_demand', { p_demand_id: demandId })
    if (error) throw error
    return data as unknown as AcceptDemandResult
  },

  async list() {
    const { data, error } = await supabase
      .from('demands')
      .select(DEMAND_LIST_SELECT)
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as unknown as Array<
      CrudRow & {
        patients: DemandPatientJoin | null
        patient_addresses: DemandAddressJoin | null
        professionals: { full_name: string } | null
      }
    >
    const mapped = rows.map((row) => mapDemandRow(row))

    return { data: mapped, count: mapped.length }
  },

  async getById(id: string, select = '*') {
    const { data, error } = await supabase.from('demands').select(select).eq('id', id).single()
    if (error) throw error
    return data as unknown as CrudRow
  },

  async getDetail(id: string): Promise<DemandDetail> {
    const { data, error } = await supabase
      .from('demands')
      .select(DEMAND_DETAIL_SELECT)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as DemandDetail
  },

  async create(values: Record<string, unknown>) {
    const { data, error } = await supabase.from('demands').insert(values as never).select().single()
    if (error) throw error
    return data as unknown as CrudRow
  },

  async update(id: string, values: Record<string, unknown>) {
    const { data, error } = await supabase.from('demands').update(values as never).eq('id', id).select().single()
    if (error) throw error
    return data as unknown as CrudRow
  },

  async remove(id: string) {
    const { error } = await supabase.from('demands').delete().eq('id', id)
    if (error) throw error
  },
}
