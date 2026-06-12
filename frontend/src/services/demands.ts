import { supabase } from '@/lib/supabase'
import type { CrudRow } from '@/lib/createCrudService'
import {
  formatPatientAbbreviation,
  formatPatientAge,
  formatPatientSex,
  resolveAttendancePeriod,
  resolveDiagnosticHypothesis,
  resolveLatestAssessmentStatus,
} from '@/lib/patientDisplay'

type DemandPatientJoin = {
  full_name: string
  birth_date: string | null
  sex: string | null
  diagnostic_hypothesis: string | null
  attendance_period: string | null
  clinical_summary: string | null
  suggested_weekly_frequency: number | null
  initial_assessments: Array<{ status: string; created_at: string }> | null
}

export type DemandListItem = CrudRow & {
  patient_abbreviation: string
  patient_sex: string
  patient_age: string
  diagnostic_hypothesis: string
  assessment_status: string | null
  attendance_period: string
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
    suggested_weekly_frequency,
    initial_assessments (
      status,
      created_at
    )
  )
`

function mapDemandRow(row: CrudRow & { patients: DemandPatientJoin | null }): DemandListItem {
  const patient = row.patients
  const assessmentStatus = resolveLatestAssessmentStatus(patient?.initial_assessments)

  return {
    ...row,
    patient_abbreviation: formatPatientAbbreviation(patient?.full_name),
    patient_sex: formatPatientSex(patient?.sex),
    patient_age: formatPatientAge(patient?.birth_date),
    diagnostic_hypothesis: resolveDiagnosticHypothesis(
      patient?.diagnostic_hypothesis,
      patient?.clinical_summary,
    ),
    assessment_status: assessmentStatus,
    attendance_period: resolveAttendancePeriod(
      patient?.attendance_period,
      patient?.suggested_weekly_frequency,
    ),
  }
}

export const demandsService = {
  async list() {
    const { data, error } = await supabase
      .from('demands')
      .select(DEMAND_LIST_SELECT)
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as unknown as Array<CrudRow & { patients: DemandPatientJoin | null }>
    const mapped = rows.map(mapDemandRow)

    return { data: mapped, count: mapped.length }
  },

  async getById(id: string, select = '*') {
    const { data, error } = await supabase.from('demands').select(select).eq('id', id).single()
    if (error) throw error
    return data as unknown as CrudRow
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
