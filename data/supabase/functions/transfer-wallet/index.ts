import { corsHeaders } from '../_shared/cors.ts'
import { asaasRequest, isAsaasEnabled } from '../_shared/asaas.ts'
import { requireStaff, serviceClient } from '../_shared/auth.ts'

interface TransferBody {
  transfer_id?: string
  assessment_repasse_id?: string
  sub_repasse_id?: string
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

    const body = (await req.json()) as TransferBody
    const supabase = serviceClient()

    if (body.assessment_repasse_id) {
      const { data: repasse, error: repasseError } = await supabase
        .from('assessment_pp_repasses')
        .select('id, status, amount_cents, professional_id, asaas_transfer_id')
        .eq('id', body.assessment_repasse_id)
        .maybeSingle()

      if (repasseError) throw repasseError
      if (!repasse) throw new Error('Repasse de avaliação não encontrado')

      if (repasse.status !== 'liberado') {
        throw new Error('Repasse de avaliação precisa estar liberado antes da transferência')
      }

      if (repasse.asaas_transfer_id) {
        return new Response(
          JSON.stringify({
            status: repasse.status,
            asaas_transfer_id: repasse.asaas_transfer_id,
            kind: 'assessment',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: professional, error: proError } = await supabase
        .from('professionals')
        .select('asaas_wallet_id, full_name')
        .eq('id', repasse.professional_id)
        .maybeSingle()

      if (proError) throw proError
      if (!professional?.asaas_wallet_id) {
        throw new Error('Wallet Asaas não configurado para este profissional')
      }

      const asaasTransfer = await asaasRequest('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          value: repasse.amount_cents / 100,
          walletId: professional.asaas_wallet_id,
          externalReference: repasse.id,
          description: `Repasse avaliação Larsana Care — ${professional.full_name ?? 'PP'}`,
        }),
      })

      const asaasTransferId = asaasTransfer?.id ? String(asaasTransfer.id) : null
      if (!asaasTransferId) {
        throw new Error('Asaas não retornou ID da transferência')
      }

      const { error: updateError } = await supabase
        .from('assessment_pp_repasses')
        .update({
          status: 'transferido',
          asaas_transfer_id: asaasTransferId,
          transferred_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', repasse.id)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({
          status: 'transferido',
          asaas_transfer_id: asaasTransferId,
          kind: 'assessment',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (body.sub_repasse_id) {
      const { data: repasse, error: repasseError } = await supabase
        .from('sub_pp_repasses')
        .select('id, status, amount_cents, session_number, substitute_professional_id, asaas_transfer_id')
        .eq('id', body.sub_repasse_id)
        .maybeSingle()

      if (repasseError) throw repasseError
      if (!repasse) throw new Error('Repasse SUB não encontrado')

      if (repasse.status !== 'liberado') {
        throw new Error('Repasse SUB precisa estar liberado antes da transferência')
      }

      if (repasse.asaas_transfer_id) {
        return new Response(
          JSON.stringify({
            status: repasse.status,
            asaas_transfer_id: repasse.asaas_transfer_id,
            kind: 'sub',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: professional, error: proError } = await supabase
        .from('professionals')
        .select('asaas_wallet_id, full_name')
        .eq('id', repasse.substitute_professional_id)
        .maybeSingle()

      if (proError) throw proError
      if (!professional?.asaas_wallet_id) {
        throw new Error('Wallet Asaas não configurado para este profissional')
      }

      const asaasTransfer = await asaasRequest('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          value: repasse.amount_cents / 100,
          walletId: professional.asaas_wallet_id,
          externalReference: repasse.id,
          description: `Repasse SUB Larsana Care — sessão ${repasse.session_number} — ${professional.full_name ?? 'PP'}`,
        }),
      })

      const asaasTransferId = asaasTransfer?.id ? String(asaasTransfer.id) : null
      if (!asaasTransferId) {
        throw new Error('Asaas não retornou ID da transferência')
      }

      const { error: updateError } = await supabase
        .from('sub_pp_repasses')
        .update({
          status: 'transferido',
          asaas_transfer_id: asaasTransferId,
          transferred_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', repasse.id)

      if (updateError) throw updateError

      const { data: proUser } = await supabase
        .from('professionals')
        .select('user_id')
        .eq('id', repasse.substitute_professional_id)
        .maybeSingle()

      if (proUser?.user_id) {
        await supabase.from('notifications').insert({
          user_id: proUser.user_id,
          type: 'repasse_liberado',
          title: 'Repasse SUB transferido',
          body: 'O valor do seu repasse avulso como substituto foi enviado para sua carteira Asaas.',
          payload: { sub_repasse_id: repasse.id, asaas_transfer_id: asaasTransferId },
        })
      }

      return new Response(
        JSON.stringify({
          status: 'transferido',
          asaas_transfer_id: asaasTransferId,
          kind: 'sub',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!body.transfer_id) {
      throw new Error('Informe transfer_id, assessment_repasse_id ou sub_repasse_id')
    }

    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .select('id, status, pp_transfer_amount_cents, professional_id, asaas_transfer_id')
      .eq('id', body.transfer_id)
      .maybeSingle()

    if (transferError) throw transferError
    if (!transfer) throw new Error('Repasse não encontrado')

    if (!['liberado'].includes(transfer.status)) {
      throw new Error('Repasse precisa estar com status liberado antes da transferência')
    }

    if (transfer.asaas_transfer_id) {
      return new Response(
        JSON.stringify({ status: transfer.status, asaas_transfer_id: transfer.asaas_transfer_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: professional, error: proError } = await supabase
      .from('professionals')
      .select('asaas_wallet_id, full_name')
      .eq('id', transfer.professional_id)
      .maybeSingle()

    if (proError) throw proError
    if (!professional?.asaas_wallet_id) {
      throw new Error('Wallet Asaas não configurado para este profissional')
    }

    const asaasTransfer = await asaasRequest('/transfers', {
      method: 'POST',
      body: JSON.stringify({
        value: transfer.pp_transfer_amount_cents / 100,
        walletId: professional.asaas_wallet_id,
        externalReference: transfer.id,
        description: `Repasse Larsana Care — ${professional.full_name ?? 'PP'}`,
      }),
    })

    const asaasTransferId = asaasTransfer?.id ? String(asaasTransfer.id) : null
    if (!asaasTransferId) {
      throw new Error('Asaas não retornou ID da transferência')
    }

    const { error: updateError } = await supabase
      .from('transfers')
      .update({
        status: 'transferido',
        asaas_transfer_id: asaasTransferId,
        transferred_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', transfer.id)

    if (updateError) throw updateError

    const { data: proUser } = await supabase
      .from('professionals')
      .select('user_id')
      .eq('id', transfer.professional_id)
      .maybeSingle()

    if (proUser?.user_id) {
      await supabase.from('notifications').insert({
        user_id: proUser.user_id,
        type: 'repasse_liberado',
        title: 'Repasse transferido',
        body: 'O valor do seu repasse foi enviado para sua carteira Asaas.',
        payload: { transfer_id: transfer.id, asaas_transfer_id: asaasTransferId },
      })
    }

    return new Response(
      JSON.stringify({ status: 'transferido', asaas_transfer_id: asaasTransferId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro na transferência'
    const status = message.includes('Não autenticado') || message.includes('Sem permissão') ? 401 : 400
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
