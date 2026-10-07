import { corsHeaders } from '../_shared/cors.ts'

type LookupStatus = 'ativo' | 'inativo' | 'indisponivel'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as { document?: string; registration?: string }
    const document = (body.document ?? body.registration ?? '').replace(/\D/g, '')
    if (!document) {
      return Response.json({ status: 'indisponivel' satisfies LookupStatus, detail: 'Informe CPF ou número do CREFITO' }, { headers: corsHeaders })
    }

    const endpoint = Deno.env.get('CREFITO_LOOKUP_URL')
    if (!endpoint) {
      return Response.json(
        { status: 'indisponivel' satisfies LookupStatus, detail: 'Consulta pública do CREFITO-3 indisponível. A aprovação manual segue.' },
        { headers: corsHeaders },
      )
    }

    const response = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}documento=${document}`, {
      headers: { Accept: 'text/html,application/json' },
    })
    if (!response.ok) {
      return Response.json(
        { status: 'indisponivel' satisfies LookupStatus, detail: 'A consulta ao CREFITO-3 falhou. A aprovação manual segue.' },
        { headers: corsHeaders },
      )
    }

    const text = (await response.text()).toLowerCase()
    const status: LookupStatus = text.includes('inativo') ? 'inativo' : text.includes('ativo') ? 'ativo' : 'indisponivel'
    return Response.json({ status, detail: status === 'indisponivel' ? 'Não foi possível confirmar a situação.' : null }, { headers: corsHeaders })
  } catch {
    return Response.json(
      { status: 'indisponivel' satisfies LookupStatus, detail: 'A consulta ao CREFITO-3 falhou. A aprovação manual segue.' },
      { headers: corsHeaders },
    )
  }
})
