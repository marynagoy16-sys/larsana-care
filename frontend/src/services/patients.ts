import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'
import type { AddressStepValues, PatientWizardValues, ResponsibleStepValues } from '@/schemas/patient'

const PATIENT_DOCS_BUCKET = 'patient-documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export type Patient = Tables<'patients'>
export type PatientListItem = Patient & {
  regions?: { name: string; code: string } | null
  cities?: { name: string } | null
}

export interface PatientFilters {
  search?: string
  care_status?: string
  patient_level?: string
  region_id?: string
  is_data_complete?: boolean
  sem_pp?: boolean
  is_valor_social?: boolean
  page?: number
  pageSize?: number
  sortBy?: 'full_name' | 'created_at'
  sortDir?: 'asc' | 'desc'
}

export interface PatientStats {
  total: number
  ativos: number
  pausa: number
  incompletos: number
  sem_pp: number
  valor_social: number
}

const PAGE_SIZE = 20

export async function getPatientStats(): Promise<PatientStats> {
  const [totalRes, ativosRes, pausaRes, incompletosRes, semPpRes, valorSocialRes] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('care_status', 'ATIVO'),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('care_status', 'PAUSA'),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_data_complete', false),
    supabase.from('patients').select('*', { count: 'exact', head: true }).is('allocated_professional_id', null),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_valor_social', true),
  ])

  for (const res of [totalRes, ativosRes, pausaRes, incompletosRes, semPpRes, valorSocialRes]) {
    if (res.error) throw res.error
  }

  return {
    total: totalRes.count ?? 0,
    ativos: ativosRes.count ?? 0,
    pausa: pausaRes.count ?? 0,
    incompletos: incompletosRes.count ?? 0,
    sem_pp: semPpRes.count ?? 0,
    valor_social: valorSocialRes.count ?? 0,
  }
}

export async function listPatients(filters: PatientFilters = {}) {
  const page = filters.page ?? 0
  const pageSize = filters.pageSize ?? PAGE_SIZE
  const sortBy = filters.sortBy ?? 'created_at'
  const ascending = filters.sortDir === 'asc'

  let query = supabase
    .from('patients')
    .select('*, regions(name, code), cities(name)', { count: 'exact' })
    .order(sortBy, { ascending })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%`)
  }
  if (filters.care_status) {
    query = query.eq('care_status', filters.care_status as Patient['care_status'])
  }
  if (filters.patient_level) {
    query = query.eq('patient_level', filters.patient_level as Patient['patient_level'])
  }
  if (filters.region_id) {
    query = query.eq('region_id', filters.region_id)
  }
  if (filters.is_data_complete === false) {
    query = query.eq('is_data_complete', false)
  }
  if (filters.sem_pp) {
    query = query.is('allocated_professional_id', null)
  }
  if (filters.is_valor_social) {
    query = query.eq('is_valor_social', true)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data as PatientListItem[], count: count ?? 0 }
}

export async function getPatient(id: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*, regions(name, code), cities(name), patient_responsibles(*), patient_addresses(*), patient_documents(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function uploadPatientDocument(
  patientId: string,
  file: File,
  documentType: Tables<'patient_documents'>['document_type'],
) {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use PDF, JPEG, PNG ou WebP.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo excede o limite de 10 MB.')
  }

  const { data: { user } } = await supabase.auth.getUser()
  const storagePath = `${patientId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from(PATIENT_DOCS_BUCKET)
    .upload(storagePath, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('patient_documents')
    .insert({
      patient_id: patientId,
      document_type: documentType,
      storage_path: storagePath,
      file_name: file.name,
      uploaded_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePatientDocument(documentId: string) {
  const { data: doc, error: fetchError } = await supabase
    .from('patient_documents')
    .select('storage_path')
    .eq('id', documentId)
    .single()

  if (fetchError) throw fetchError

  if (doc?.storage_path) {
    await supabase.storage.from(PATIENT_DOCS_BUCKET).remove([doc.storage_path])
  }

  const { error } = await supabase.from('patient_documents').delete().eq('id', documentId)
  if (error) throw error
}

export async function upsertResponsible(
  patientId: string,
  values: ResponsibleStepValues & { id?: string },
) {
  const payload = {
    patient_id: patientId,
    full_name: values.full_name,
    cpf: values.cpf,
    email: values.email,
    phone: values.phone,
    backup_phone: values.backup_phone ?? null,
    is_primary: values.is_primary,
  }

  if (values.id) {
    const { data, error } = await supabase
      .from('patient_responsibles')
      .update(payload)
      .eq('id', values.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('patient_responsibles')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function upsertAddress(
  patientId: string,
  values: AddressStepValues & { id?: string },
) {
  const payload = {
    patient_id: patientId,
    street: values.street,
    number: values.number,
    complement: values.complement ?? null,
    neighborhood: values.neighborhood,
    postal_code: values.postal_code,
    city_id: values.city_id,
    full_address: values.full_address,
    is_primary: true,
  }

  if (values.id) {
    const { data, error } = await supabase
      .from('patient_addresses')
      .update(payload)
      .eq('id', values.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('patient_addresses')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createPatientWizard(
  values: PatientWizardValues,
  pendingFiles: { file: File; document_type: Tables<'patient_documents'>['document_type'] }[] = [],
) {
  const { patient, responsible, address } = values

  const { data: createdPatient, error: patientError } = await supabase
    .from('patients')
    .insert({
      full_name: patient.full_name,
      cpf: patient.cpf,
      birth_date: patient.birth_date,
      patient_level: patient.patient_level,
      care_status: patient.care_status,
      region_id: patient.region_id,
      city_id: patient.city_id,
      allocated_professional_id: patient.allocated_professional_id ?? null,
      suggested_weekly_frequency: patient.suggested_weekly_frequency ?? null,
      clinical_summary: patient.clinical_summary ?? null,
      is_valor_social: patient.is_valor_social,
      is_data_complete: true,
    } satisfies TablesInsert<'patients'>)
    .select()
    .single()

  if (patientError) throw patientError

  const { error: responsibleError } = await supabase.from('patient_responsibles').insert({
    patient_id: createdPatient.id,
    full_name: responsible.full_name,
    cpf: responsible.cpf,
    email: responsible.email,
    phone: responsible.phone,
    backup_phone: responsible.backup_phone ?? null,
    is_primary: responsible.is_primary,
  })

  if (responsibleError) throw responsibleError

  const { error: addressError } = await supabase.from('patient_addresses').insert({
    patient_id: createdPatient.id,
    street: address.street,
    number: address.number,
    complement: address.complement ?? null,
    neighborhood: address.neighborhood,
    postal_code: address.postal_code,
    city_id: address.city_id,
    full_address: address.full_address,
    is_primary: true,
  })

  if (addressError) throw addressError

  for (const doc of pendingFiles) {
    await uploadPatientDocument(createdPatient.id, doc.file, doc.document_type)
  }

  return createdPatient
}

export async function updatePatient(id: string, values: TablesUpdate<'patients'>) {
  const { data, error } = await supabase.from('patients').update(values).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePatient(id: string) {
  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) throw error
}
