import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CertificateBody {
  enrollment_id: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as CertificateBody
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: enrollment, error: enrollError } = await supabase
      .from('academy_enrollments')
      .select('id, professional_id, course_id, status')
      .eq('id', body.enrollment_id)
      .single()

    if (enrollError || !enrollment) throw new Error('Matrícula não encontrada')
    if (enrollment.status !== 'completed') throw new Error('Curso ainda não concluído')

    const storagePath = `certificates/${enrollment.professional_id}/${enrollment.course_id}.pdf`

    const { data: existing } = await supabase
      .from('academy_certificates')
      .select('id')
      .eq('enrollment_id', body.enrollment_id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('academy_certificates')
        .update({ storage_path: storagePath, issued_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      const { error: insertError } = await supabase.from('academy_certificates').insert({
        enrollment_id: body.enrollment_id,
        storage_path: storagePath,
        issued_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
    }

    return new Response(JSON.stringify({ storage_path: storagePath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar certificado'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
