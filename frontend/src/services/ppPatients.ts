import { supabase } from '@/lib/supabase'
import { getCurrentProfessional } from '@/services/professionals'

export type PPPatientListItem = {
  id: string
  full_name: string
  care_status: string
  patient_level: string | null
  diagnostic_hypothesis: string | null
  attendance_period: string | null
  clinical_summary: string | null
  birth_date: string | null
  sex: string | null
  suggested_weekly_frequency: number | null
  evaluation_pending: boolean
}

export type PPPatientDetail = PPPatientListItem & {
  patient_addresses: Array<{
    full_address: string
    street: string | null
    number: string | null
    neighborhood: string | null
    postal_code: string | null
    is_primary: boolean
  }> | null
  regions: { code: string; name: string } | null
  cities: { name: string } | null
  initial_assessments: Array<{ id: string; status: string; created_at: string }> | null
}

const PATIENT_LIST_SELECT = `
  id,
  full_name,
  care_status,
  patient_level,
  diagnostic_hypothesis,
  attendance_period,
  clinical_summary,
  birth_date,
  sex,
  suggested_weekly_frequency,
  allocated_professional_id
`

const PATIENT_DETAIL_SELECT = `
  id,
  full_name,
  care_status,
  patient_level,
  diagnostic_hypothesis,
  attendance_period,
  clinical_summary,
  birth_date,
  sex,
  suggested_weekly_frequency,
  allocated_professional_id,
  regions ( code, name ),
  cities ( name ),
  patient_addresses (
    full_address, street, number, neighborhood, postal_code, is_primary
  ),
  initial_assessments ( id, status, created_at )
`

async function resolveEvaluationPending(patientId: string): Promise<boolean> {
  const [{ count: assessmentCount }, { count: cycleCount }] = await Promise.all([
    supabase
      .from('initial_assessments')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId),
    supabase
      .from('care_cycles')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId),
  ])

  return (assessmentCount ?? 0) === 0 && (cycleCount ?? 0) === 0
}

export async function listPPPatients(): Promise<{ data: PPPatientListItem[]; count: number }> {
  const professional = await getCurrentProfessional()
  if (!professional) return { data: [], count: 0 }

  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_LIST_SELECT)
    .eq('allocated_professional_id', professional.id)
    .order('full_name')

  if (error) throw error

  const rows = data ?? []
  const mapped = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      full_name: row.full_name,
      care_status: row.care_status,
      patient_level: row.patient_level,
      diagnostic_hypothesis: row.diagnostic_hypothesis,
      attendance_period: row.attendance_period,
      clinical_summary: row.clinical_summary,
      birth_date: row.birth_date,
      sex: row.sex,
      suggested_weekly_frequency: row.suggested_weekly_frequency,
      evaluation_pending: await resolveEvaluationPending(row.id),
    })),
  )

  return { data: mapped, count: mapped.length }
}

export async function getPPPatientDetail(id: string): Promise<PPPatientDetail | null> {
  const professional = await getCurrentProfessional()
  if (!professional) return null

  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_DETAIL_SELECT)
    .eq('id', id)
    .eq('allocated_professional_id', professional.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const evaluation_pending = await resolveEvaluationPending(id)

  return {
    ...(data as Omit<PPPatientDetail, 'evaluation_pending'>),
    evaluation_pending,
  }
}

export async function getPPProfessionalCrefito(): Promise<string | null> {
  const professional = await getCurrentProfessional()
  if (!professional) return null

  const { data, error } = await supabase
    .from('professional_councils')
    .select('registration_number')
    .eq('professional_id', professional.id)
    .eq('council_type', 'CREFITO')
    .maybeSingle()

  if (error) throw error
  return data?.registration_number ?? null
}
