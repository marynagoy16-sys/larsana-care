import { corsHeaders } from '../_shared/cors.ts'
import { asaasRequest, isAsaasEnabled } from '../_shared/asaas.ts'
import { requireStaff, serviceClient } from '../_shared/auth.ts'

interface CreateSubaccountBody {
  professional_id: string
}

function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

function extractPostalCode(address: string | null | undefined): string | null {
  if (!address) return null
  const match = address.match(/\b(\d{5})-?(\d{3})\b/)
  if (!match) return null
  return `${match[1]}${match[2]}`
}

function buildAccountPayload(pro: Record<string, unknown>) {
  const cpfCnpj = digitsOnly(String(pro.cpf_cnpj ?? ''))
  if (!cpfCnpj) {
    throw new Error('CPF/CNPJ do profissional é obrigatório para criar subconta Asaas')
  }

  const phone = digitsOnly(String(pro.phone ?? ''))
  if (phone.length < 10) {
    throw new Error('Telefone celular válido é obrigatório para criar subconta Asaas')
  }

  const address = String(pro.address ?? '').trim()
  if (!address) {
    throw new Error('Endereço do profissional é obrigatório para criar subconta Asaas')
  }

  const postalCode = extractPostalCode(address) ?? '01310100'

  const payload: Record<string, unknown> = {
    name: String(pro.full_name),
    email: String(pro.email),
    cpfCnpj,
    mobilePhone: phone,
    phone,
    incomeValue: 5000,
    address,
    addressNumber: 'S/N',
    province: 'Centro',
    postalCode,
  }

  if (pro.person_type === 'PJ') {
    payload.companyType = 'MEI'
  } else if (pro.birth_date) {
    payload.birthDate = String(pro.birth_date).slice(0, 10)
  }

  return payload
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requireStaff(req)

    if (!isAsaasEnabled()) {
      throw new Error('Integração Asaas não está habilitada')
    }

    const body = (await req.json()) as CreateSubaccountBody
    const supabase = serviceClient()

    const { data: pro, error: proError } = await supabase
      .from('professionals')
      .select('id, full_name, email, cpf_cnpj, phone, address, person_type, birth_date, asaas_wallet_id, credentialing_status')
      .eq('id', body.professional_id)
      .maybeSingle()

    if (proError) throw proError
    if (!pro) throw new Error('Profissional não encontrado')

    if (pro.asaas_wallet_id) {
      return new Response(
        JSON.stringify({
          professional_id: pro.id,
          asaas_wallet_id: pro.asaas_wallet_id,
          created: false,
          already_linked: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const accountPayload = buildAccountPayload(pro as Record<string, unknown>)
    const created = await asaasRequest('/accounts', {
      method: 'POST',
      body: JSON.stringify(accountPayload),
    })

    const walletId = created?.walletId ? String(created.walletId) : null
    if (!walletId) {
      throw new Error('Asaas não retornou walletId da subconta')
    }

    const { error: updateError } = await supabase
      .from('professionals')
      .update({ asaas_wallet_id: walletId, updated_at: new Date().toISOString() })
      .eq('id', pro.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        professional_id: pro.id,
        asaas_wallet_id: walletId,
        created: true,
        already_linked: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar subconta Asaas'
    const status = message.includes('Não autenticado') || message.includes('Sem permissão') ? 401 : 400
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
