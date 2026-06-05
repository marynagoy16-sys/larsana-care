import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateChargeBody {
  patient_id: string
  amount_cents: number
  due_date: string
  payment_method: 'PIX' | 'BOLETO'
  description?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as CreateChargeBody
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // TODO: integrar API Asaas com ASAAS_API_KEY
    const { data, error } = await supabase
      .from('charges')
      .insert({
        patient_id: body.patient_id,
        amount_cents: body.amount_cents,
        due_date: body.due_date,
        payment_method: body.payment_method,
        payment_status: 'pendente',
        description: body.description ?? null,
      })
      .select('id')
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ charge_id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar cobrança'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
