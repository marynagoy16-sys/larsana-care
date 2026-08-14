import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { supabase } from '@/lib/supabase'
import { npsSurveysService } from '@/services/index'

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

export function PacienteNpsPage() {
  const cicloId = window.location.pathname.split('/').pop() ?? ''
  const [open] = useState(true)
  const schema = z.object({ score: z.coerce.number().min(0).max(10), comment: z.string().optional() })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as never, defaultValues: { score: 10 } })
  const navigate = useNavigate()
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) =>
      npsSurveysService.create({ ...v, cycle_id: cicloId, rater_type: 'paciente', rated_entity_type: 'larsana' }),
    queryKey: ['paciente', 'nps'],
    onSuccess: () => navigate('/paciente'),
  })
  return (
    <CrudModal open={open} onOpenChange={(o) => !o && navigate('/paciente')} title="Avalie o atendimento">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota (0-10)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={10} {...field} />
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

export { PacienteAceitePage } from '@/pages/paciente/PacienteAceitePage'
