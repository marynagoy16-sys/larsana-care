import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { asaasRequest, deleteAsaasPayment, getAsaasPixReceiverStatus, isAsaasEnabled, validateAsaasChargeAmountCents } from '../_shared/asaas.ts'
import { ensureAsaasCustomer, fetchPixQrCode } from '../_shared/charges.ts'

interface CreateChargeBody {
  patient_id: string
  amount_cents: number
  due_date: string
  payment_method: 'PIX' | 'BOLETO'
  description?: string
  cycle_id?: string
  charge_id?: string
  force_new_asaas_payment?: boolean
}

const STAFF_ROLES = new Set(['admin', 'financeiro'])
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

async function patientOwnsCharge(
  userClient: ReturnType<typeof createClient>,
  chargeId: string,
  patientId: string,
): Promise<boolean> {
  const { data: charge, error } = await userClient
    .from('charges')
    .select('id, patient_id, payment_status')
    .eq('id', chargeId)
    .maybeSingle()

  if (error || !charge) return false
  if (charge.patient_id !== patientId) return false
  if (charge.payment_status !== 'pendente') return false
  return true
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Método não permitido' })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return json(401, { error: 'Não autenticado' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(503, { error: 'Serviço indisponível' })
  }

  const accessToken = authHeader.slice(7).trim()
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken)
  if (userError || !userData.user) {
    return json(401, { error: 'Não autenticado' })
  }

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('primary_role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError || !profile?.is_active) {
    return json(403, { error: 'Sem permissão para criar cobrança' })
  }

  const role = String(profile.primary_role)
  const isStaff = STAFF_ROLES.has(role)
  const isPatient = role === 'paciente'

  if (!isStaff && !isPatient) {
    return json(403, { error: 'Sem permissão para criar cobrança' })
  }

  let body: CreateChargeBody
  try {
    body = (await req.json()) as CreateChargeBody
  } catch {
    return json(400, { error: 'Payload inválido' })
  }

  if (!UUID_RE.test(body.patient_id ?? '')) {
    return json(400, { error: 'Paciente inválido' })
  }

  if (isPatient) {
    if (!body.charge_id || !UUID_RE.test(body.charge_id)) {
      return json(403, { error: 'Paciente só pode sincronizar cobrança existente' })
    }

    const ownsCharge = await patientOwnsCharge(userClient, body.charge_id, body.patient_id)
    if (!ownsCharge) {
      return json(403, { error: 'Cobrança não encontrada ou sem acesso' })
    }
  }

  const amount = Number(body.amount_cents)
  if (!Number.isInteger(amount) || amount <= 0) {
    return json(400, { error: 'Valor inválido' })
  }

  if (!DATE_RE.test(body.due_date ?? '')) {
    return json(400, { error: 'Vencimento inválido' })
  }

  if (body.payment_method !== 'PIX' && body.payment_method !== 'BOLETO') {
    return json(400, { error: 'Meio de pagamento inválido' })
  }

  const description =
    typeof body.description === 'string' ? body.description.trim().slice(0, 500) : null

  if (!isPatient) {
    const { data: patient, error: patientError } = await userClient
      .from('patients')
      .select('id')
      .eq('id', body.patient_id)
      .maybeSingle()

    if (patientError || !patient) {
      return json(403, { error: 'Paciente não encontrado ou sem acesso' })
    }
  }

    const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let existingAsaasPaymentId: string | null = null
  if (body.charge_id) {
    const { data: existingCharge } = await admin
      .from('charges')
      .select('asaas_payment_id')
      .eq('id', body.charge_id)
      .maybeSingle()
    existingAsaasPaymentId = existingCharge?.asaas_payment_id ?? null
  }

  try {
    let asaasPaymentId: string | null = existingAsaasPaymentId
    let pixQrCode: string | null = null
    let pixCopyPaste: string | null = null
    let boletoUrl: string | null = null
    let pixReceiverReady = true
    let pixReceiverMessage: string | null = null

    const hasAsaas = isAsaasEnabled()

    if (hasAsaas) {
      const asaasAmountError = validateAsaasChargeAmountCents(amount)
      if (asaasAmountError) {
        return json(400, { error: asaasAmountError })
      }

      if (body.payment_method === 'PIX') {
        const pixStatus = await getAsaasPixReceiverStatus()
        pixReceiverReady = pixStatus.ready
        pixReceiverMessage = pixStatus.message
      }

      const shouldRefreshExistingPix =
        Boolean(asaasPaymentId)
        && body.payment_method === 'PIX'
        && !body.force_new_asaas_payment

      if (shouldRefreshExistingPix && asaasPaymentId) {
        const pix = await fetchPixQrCode(asaasPaymentId)
        pixQrCode = pix.encodedImage
        pixCopyPaste = pix.payload
        boletoUrl = null
      } else {
        if (body.force_new_asaas_payment && asaasPaymentId) {
          try {
            await deleteAsaasPayment(asaasPaymentId)
          } catch {
            // cobrança antiga pode já estar cancelada/expirada
          }
          asaasPaymentId = null
        }

        const customerId = await ensureAsaasCustomer(admin, body.patient_id)
        if (customerId) {
          const billingType = body.payment_method === 'PIX' ? 'PIX' : 'BOLETO'
          const payment = await asaasRequest('/payments', {
            method: 'POST',
            body: JSON.stringify({
              customer: customerId,
              billingType,
              value: amount / 100,
              dueDate: body.due_date,
              description: description ?? 'Ciclo de tratamento Larsana Care',
            }),
          })

          asaasPaymentId = payment?.id ? String(payment.id) : null
          if (body.payment_method === 'BOLETO') {
            boletoUrl = payment?.bankSlipUrl ?? null
          } else {
            boletoUrl = null
          }

          if (body.payment_method === 'PIX' && asaasPaymentId) {
            const pix = await fetchPixQrCode(asaasPaymentId)
            pixQrCode = pix.encodedImage
            pixCopyPaste = pix.payload
          }
        }
      }
    }

    let data: {
      id: string
      asaas_payment_id: string | null
      pix_qr_code: string | null
      pix_copy_paste: string | null
      boleto_url: string | null
    }

    if (body.charge_id) {
      const { data: updated, error: updateError } = await admin
        .from('charges')
        .update({
          asaas_payment_id: asaasPaymentId,
          pix_qr_code: pixQrCode,
          pix_copy_paste: pixCopyPaste,
          boleto_url: boletoUrl,
          payment_method: body.payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.charge_id)
        .select('id, asaas_payment_id, pix_qr_code, pix_copy_paste, boleto_url')
        .single()

      if (updateError) throw updateError
      data = updated
    } else if (isPatient) {
      return json(403, { error: 'Paciente só pode sincronizar cobrança existente' })
    } else {
      const { data: inserted, error } = await admin
        .from('charges')
        .insert({
          patient_id: body.patient_id,
          cycle_id: body.cycle_id ?? null,
          amount_cents: amount,
          due_date: body.due_date,
          payment_method: body.payment_method,
          payment_status: 'pendente',
          description,
          asaas_payment_id: asaasPaymentId,
          pix_qr_code: pixQrCode,
          pix_copy_paste: pixCopyPaste,
          boleto_url: boletoUrl,
        })
        .select('id, asaas_payment_id, pix_qr_code, pix_copy_paste, boleto_url')
        .single()

      if (error) throw error
      data = inserted
    }

    return json(200, {
      charge_id: data.id,
      asaas_payment_id: data.asaas_payment_id,
      pix_qr_code: data.pix_qr_code,
      pix_copy_paste: data.pix_copy_paste,
      boleto_url: data.boleto_url,
      asaas_enabled: hasAsaas,
      pix_receiver_ready: pixReceiverReady,
      pix_receiver_message: pixReceiverMessage,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar cobrança'
    return json(400, { error: message })
  }
})
