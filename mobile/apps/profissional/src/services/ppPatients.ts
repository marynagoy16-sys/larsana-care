import { supabase } from '@/lib/supabase'

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

async function getCurrentProfessional(): Promise<{ id: string } | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return data
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

export async function getPPPatientDetail(id: string): Promise<{
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
  patient_addresses: Array<{
    full_address: string
    street: string | null
    neighborhood: string | null
    postal_code: string | null
    is_primary: boolean
  }> | null
  regions: { code: string; name: string } | null
  cities: { name: string } | null
  initial_assessments: Array<{
    id: string
    status: string
    created_at: string
  }> | null
} | null> {
  const professional = await getCurrentProfessional()
  if (!professional) return null

  const { data, error } = await supabase
    .from('patients')
    .select(`
      id, full_name, care_status, patient_level, diagnostic_hypothesis,
      attendance_period, clinical_summary, birth_date, sex, suggested_weekly_frequency,
      regions ( code, name ),
      cities ( name ),
      patient_addresses ( full_address, street, neighborhood, postal_code, is_primary ),
      initial_assessments ( id, status, created_at )
    `)
    .eq('id', id)
    .eq('allocated_professional_id', professional.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const evaluation_pending = await resolveEvaluationPending(id)

  return {
    ...(data as any),
    evaluation_pending,
  }
}

export type PPPatientProntuarioRecord = {
  id: string
  record_type: string
  content_richtext: string | null
  recorded_at: string
  created_at: string
  session_number: number | null
  cycle_number: number | null
}

export type PPPatientProntuarioCycle = {
  cycleId: string
  cycleNumber: number
  status: string | null
  records: PPPatientProntuarioRecord[]
}

export type PPPatientProntuario = {
  assessmentRecords: PPPatientProntuarioRecord[]
  cycles: PPPatientProntuarioCycle[]
}

function stripHtmlPreview(html: string | null, maxLength = 120): string {
  if (!html) return 'Sem conteúdo registrado.'
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

export { stripHtmlPreview as prontuarioContentPreview }

export async function getPPPatientProntuario(patientId: string): Promise<PPPatientProntuario | null> {
  const professional = await getCurrentProfessional()
  if (!professional) return null

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('allocated_professional_id', professional.id)
    .maybeSingle()

  if (patientError) throw patientError
  if (!patient) return null

  const [cyclesRes, recordsRes] = await Promise.all([
    supabase
      .from('care_cycles')
      .select('id, cycle_number, status')
      .eq('patient_id', patientId)
      .order('cycle_number', { ascending: false }),
    supabase
      .from('medical_records')
      .select(`
        id,
        record_type,
        content_richtext,
        recorded_at,
        created_at,
        care_sessions ( session_number ),
        care_cycles ( cycle_number, id )
      `)
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false }),
  ])

  if (cyclesRes.error) throw cyclesRes.error
  if (recordsRes.error) throw recordsRes.error

  const records = (recordsRes.data ?? []).map((row: any) => ({
    id: row.id,
    record_type: row.record_type,
    content_richtext: row.content_richtext,
    recorded_at: row.recorded_at,
    created_at: row.created_at,
    session_number: row.care_sessions?.session_number ?? null,
    cycle_number: row.care_cycles?.cycle_number ?? null,
  })) as PPPatientProntuarioRecord[]

  const assessmentRecords = records.filter((r) => r.record_type === 'avaliacao')
  const cycles = (cyclesRes.data ?? []).map((cycle) => ({
    cycleId: cycle.id,
    cycleNumber: cycle.cycle_number,
    status: cycle.status,
    records: records.filter(
      (r) => r.record_type === 'evolucao' && r.cycle_number === cycle.cycle_number,
    ),
  }))

  return { assessmentRecords, cycles }
}
