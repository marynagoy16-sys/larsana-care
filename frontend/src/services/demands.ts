import { supabase } from '@/lib/supabase'
import type { CrudRow } from '@/lib/createCrudService'
import {
  formatAttendancePeriod,
  formatPatientAbbreviation,
  formatPatientAge,
  formatPatientSex,
  resolveDiagnosticHypothesis,
} from '@/lib/patientDisplay'

type DemandPatientJoin = {
  full_name: string
  birth_date: string | null
  sex: string | null
  diagnostic_hypothesis: string | null
  attendance_period: string | null
  clinical_summary: string | null
}

export type DemandListItem = CrudRow & {
  demand_type: 'avaliacao' | 'continuidade'
  patient_abbreviation: string
  patient_sex: string
  patient_age: string
  diagnostic_hypothesis: string
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
    clinical_summary
  )
`

function mapDemandRow(row: CrudRow & { patients: DemandPatientJoin | null }): DemandListItem {
  const patient = row.patients

  return {
    ...row,
    demand_type: (row.demand_type as DemandListItem['demand_type']) ?? 'avaliacao',
    patient_abbreviation: formatPatientAbbreviation(patient?.full_name),
    patient_sex: formatPatientSex(patient?.sex),
    patient_age: formatPatientAge(patient?.birth_date),
    diagnostic_hypothesis: resolveDiagnosticHypothesis(
      patient?.diagnostic_hypothesis,
      patient?.clinical_summary,
    ),
    attendance_period: formatAttendancePeriod(patient?.attendance_period),
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
