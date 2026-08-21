import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { supabase } from '@/lib/supabase'

export function PacienteNpsPage() {
  const { cicloId } = useParams<{ cicloId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const navigate = useNavigate()

  const { data: sessionContext } = useQuery({
    queryKey: ['paciente', 'nps-context', sessionId],
    queryFn: async () => {
      if (!sessionId) return null
      const { data, error } = await supabase
        .from('care_sessions')
        .select(`
          id,
          session_number,
          professional_id,
          professionals ( full_name )
        `)
        .eq('id', sessionId)
        .maybeSingle()
      if (error) throw error
      return data as {
        id: string
        session_number: number
        professional_id: string
        professionals: { full_name: string } | null
      } | null
    },
    enabled: !!sessionId,
  })

  const schema = useMemo(
    () =>
      z.object({
        score: z.coerce.number().min(0).max(10),
        comment: z.string().optional(),
      }),
    [],
  )

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as never,
    defaultValues: { score: 10, comment: '' },
  })

  const create = useCrudMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const professionalId = sessionContext?.professional_id
      const { error } = await supabase.from('nps_surveys').insert({
        cycle_id: cicloId!,
        session_id: sessionId,
        score: values.score,
        comment: values.comment ?? null,
        rater_type: 'paciente',
        rater_user_id: user?.id ?? null,
        rated_entity_type: professionalId ? 'professional' : 'platform',
        rated_entity_id: professionalId ?? null,
      })
      if (error) throw error
    },
    queryKey: ['paciente', 'nps'],
    onSuccess: () => navigate('/paciente'),
  })

  const ppName = sessionContext?.professionals?.full_name

  return (
    <CrudModal open onOpenChange={(open) => !open && navigate('/paciente')} title="Como foi a visita?">
      <p className="text-sm text-muted-foreground mb-4">
        {ppName
          ? `Avalie a experiência com ${ppName} nesta terapia domiciliar.`
          : 'Sua opinião nos ajuda a melhorar o atendimento.'}
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota (0–10)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={10} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comentário (opcional)</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Conte como foi a visita em casa…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions onCancel={() => navigate('/paciente')} isSubmitting={create.isPending} submitLabel="Enviar" />
        </form>
      </Form>
    </CrudModal>
  )
}

export { PacienteHomePage } from '@/pages/paciente/PacienteHomePage'
export { PacientePropostaPage } from '@/pages/paciente/PacientePropostaPage'
export { PacientePagamentoDetailPage } from '@/pages/paciente/PacientePagamentoDetailPage'
export { PacienteContaPage } from '@/pages/paciente/PacienteContaPage'
export { PacienteAparenciaPage } from '@/pages/paciente/PacienteAparenciaPage'
export { PacientePerfilPage } from '@/pages/paciente/PacientePerfilPage'
export { PacientePagamentosPage } from '@/pages/paciente/PacientePagamentosPage'
export { PacienteDocumentosPage } from '@/pages/paciente/PacienteDocumentosPage'
export { PacienteNotificacoesPage } from '@/pages/paciente/PacienteNotificacoesPage'
export { PacienteAjudaPage } from '@/pages/paciente/PacienteAjudaPage'
export { PacienteTermosPage, PacienteTermoDetailPage } from '@/pages/paciente/PacienteTermosPage'
export { PacienteTratamentoPage } from '@/pages/paciente/PacienteTratamentoPage'
export { PacienteCicloDetailPage } from '@/pages/paciente/PacienteCicloDetailPage'
export { PacienteAceitePage } from '@/pages/paciente/PacienteAceitePage'
