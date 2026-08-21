import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateChargeBody {
  patient_id: string
  amount_cents: number
  due_date: string
  payment_method: 'PIX' | 'BOLETO'
  description?: string
}

const ALLOWED_ROLES = new Set(['admin', 'financeiro'])
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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

  if (
    profileError ||
    !profile?.is_active ||
    !ALLOWED_ROLES.has(String(profile.primary_role))
  ) {
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

  const { data: patient, error: patientError } = await userClient
    .from('patients')
    .select('id')
    .eq('id', body.patient_id)
    .maybeSingle()

  if (patientError || !patient) {
    return json(403, { error: 'Paciente não encontrado ou sem acesso' })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // PIX/boleto Asaas remain unset until production payment is enabled.
  const { data, error } = await admin
    .from('charges')
    .insert({
      patient_id: body.patient_id,
      amount_cents: amount,
      due_date: body.due_date,
      payment_method: body.payment_method,
      payment_status: 'pendente',
      description,
    })
    .select('id')
    .single()

  if (error) {
    return json(400, { error: error.message })
  }

  return json(200, { charge_id: data.id })
})
