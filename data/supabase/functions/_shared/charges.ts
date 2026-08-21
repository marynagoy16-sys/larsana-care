import { asaasRequest } from './asaas.ts'

type SupabaseClient = ReturnType<typeof import('jsr:@supabase/supabase-js@2').createClient>

export async function ensureAsaasCustomer(
  supabase: SupabaseClient,
  patientId: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('asaas_customers')
    .select('asaas_customer_id')
    .eq('patient_id', patientId)
    .maybeSingle()

  if (existing?.asaas_customer_id) return existing.asaas_customer_id

  const { data: patient } = await supabase
    .from('patients')
    .select('full_name, cpf, asaas_customer_id')
    .eq('id', patientId)
    .maybeSingle()

  if (!patient) throw new Error('Paciente não encontrado')

  if (patient.asaas_customer_id) return patient.asaas_customer_id

  const created = await asaasRequest('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: patient.full_name,
      cpfCnpj: patient.cpf?.replace(/\D/g, '') ?? undefined,
    }),
  })

  if (!created?.id) return null

  await supabase.from('asaas_customers').upsert({
    patient_id: patientId,
    asaas_customer_id: created.id,
  })

  await supabase.from('patients').update({ asaas_customer_id: created.id }).eq('id', patientId)

  return created.id as string
}

export async function fetchPixQrCode(paymentId: string): Promise<{
  encodedImage: string | null
  payload: string | null
}> {
  const pix = await asaasRequest(`/payments/${paymentId}/pixQrCode`, { method: 'GET' })
  return {
    encodedImage: pix?.encodedImage ?? null,
    payload: pix?.payload ?? null,
  }
}
