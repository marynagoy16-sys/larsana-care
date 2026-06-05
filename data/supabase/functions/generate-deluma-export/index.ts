import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface DelumaBody {
  reference_month: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as DelumaBody
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const filePath = `exports/${body.reference_month}-${Date.now()}.xlsx`

    const { data, error } = await supabase
      .from('deluma_exports')
      .insert({
        reference_month: `${body.reference_month}-01`,
        file_path: filePath,
        file_name: `deluma-${body.reference_month}.xlsx`,
      })
      .select('id, file_path')
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ export_id: data.id, storage_path: data.file_path }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar export'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
