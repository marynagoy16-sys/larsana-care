import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { PatientSearchField } from '@/components/forms/PatientSearchField'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import { sanitizeRichText } from '@/lib/sanitize'
import { supabase } from '@/lib/supabase'
import { medicalRecordsService } from '@/services/index'
import {
  getEvolutionSessionContext,
  ppEvolutionsQueryKeys,
} from '@/services/ppEvolutions'
import { getCurrentProfessional } from '@/services/professionals'
import { getPPProfessionalCrefito } from '@/services/ppPatients'

export { PPAgendaPage } from '@/pages/profissional/agenda/PPAgendaPage'
export { PPHomePage } from '@/pages/profissional/home/PPHomePage'
export { PPSessionDetailPage } from '@/pages/profissional/agenda/PPSessionDetailPage'

export { PPDemandsPage } from '@/pages/profissional/demands/PPDemandsPage'

export { PPEvolucoesPage } from '@/pages/profissional/evolution/PPEvolucoesPage'

const PP_EVOLUTION_FORM_ID = 'pp-evolution-form'

export function PPEvolucaoNovaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') ?? undefined
  const [open] = useState(true)
  const schema = z.object({
    patient_id: z.string().uuid('Selecione um paciente'),
    content_richtext: requiredString('Evolução'),
    crefto_number: z.string().trim().min(3, 'CREFITO não cadastrado no perfil'),
  })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { patient_id: '', content_richtext: '', crefto_number: '' } })

  const { data: sessionContext } = useQuery({
    queryKey: [...ppEvolutionsQueryKeys.pending, 'session', sessionId],
    queryFn: () => getEvolutionSessionContext(sessionId!),
    enabled: !!sessionId,
  })

  const { data: professional } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: getCurrentProfessional,
  })

  const { data: defaultCrefito } = useQuery({
    queryKey: ['pp', 'crefito'],
    queryFn: getPPProfessionalCrefito,
  })

  useEffect(() => {
    if (sessionContext) {
      form.reset({
        patient_id: sessionContext.patientId,
        content_richtext: '',
        crefto_number: defaultCrefito ?? '',
      })
      return
    }
    if (defaultCrefito && !form.getValues('crefto_number')) {
      form.setValue('crefto_number', defaultCrefito)
    }
  }, [sessionContext, defaultCrefito, form])

  const create = useCrudMutation({
    mutationFn: async (v: z.infer<typeof schema>) => {
      if (!professional?.id) throw new Error('Profissional não encontrado')
      const created = await medicalRecordsService.create({
        patient_id: v.patient_id,
        content_richtext: sanitizeRichText(v.content_richtext),
        crefito_number: v.crefto_number,
        record_type: 'evolucao' as const,
        professional_id: professional.id,
        session_id: sessionContext?.sessionId ?? null,
        cycle_id: sessionContext?.cycleId ?? null,
      })
      if (sessionContext?.sessionId) {
        await supabase
          .from('care_sessions')
          .update({ status: 'realizada' })
          .eq('id', sessionContext.sessionId)
          .not('check_in_at', 'is', null)
      }
      return created
    },
    queryKey: ['pp'],
    onSuccess: () => navigate('/profissional/evolucoes'),
  })

  return (
    <CrudDrawer
      open={open}
      onOpenChange={(o) => !o && navigate('/profissional/evolucoes')}
      title="Nova evolução"
      size="lg"
      footer={
        <FormActions
          form={PP_EVOLUTION_FORM_ID}
          onCancel={() => navigate('/profissional/evolucoes')}
          isSubmitting={create.isPending}
          submitLabel="Salvar evolução"
        />
      }
    >
      <Form {...form}>
        <form
          id={PP_EVOLUTION_FORM_ID}
          onSubmit={form.handleSubmit((v) => create.mutate(v))}
          className="space-y-4"
        >
          <FormField control={form.control} name="patient_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente</FormLabel>
              {sessionContext ? (
                <>
                  <input type="hidden" {...field} />
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                    <p className="font-medium">{sessionContext.patientName}</p>
                    <p className="text-muted-foreground mt-0.5">
                      Ciclo {sessionContext.cycleNumber} · Terapia #{sessionContext.sessionNumber}
                    </p>
                  </div>
                </>
              ) : (
                <FormControl>
                  <PatientSearchField
                    value={field.value}
                    onChange={field.onChange}
                    showCreate={false}
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="content_richtext" render={({ field }) => (
            <FormItem><FormLabel>Evolução clínica</FormLabel><FormControl><Textarea rows={8} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          {(professional?.full_name || defaultCrefito) ? (
            <div className="space-y-2">
              <FormLabel>Profissional</FormLabel>
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium">{professional?.full_name ?? '—'}</p>
                {defaultCrefito ? (
                  <p className="text-muted-foreground mt-0.5">CREFITO {defaultCrefito}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          <FormField control={form.control} name="crefto_number" render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <input type="hidden" {...field} value={defaultCrefito ?? field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </form>
      </Form>
    </CrudDrawer>
  )
}

export { PPRepasseDetailPage } from '@/pages/profissional/account/PPRepasseDetailPage'

export { PPPacientesPage } from '@/pages/profissional/patients/PPPacientesPage'
export { PPPacienteDetailPage } from '@/pages/profissional/patients/PPPacienteDetailPage'
export { PPAvaliacoesPage } from '@/pages/profissional/assessments/PPAvaliacoesPage'
export { PPAvaliacaoDetailPage } from '@/pages/profissional/assessments/PPAvaliacaoDetailPage'
export { PPContaPage } from '@/pages/profissional/account/PPContaPage'
export { PPAparenciaPage } from '@/pages/profissional/account/PPAparenciaPage'
export { PPPerfilPage } from '@/pages/profissional/account/PPPerfilPage'
export { PPNotificacoesPage } from '@/pages/profissional/account/PPNotificacoesPage'
export { PPRepassesPage } from '@/pages/profissional/account/PPRepassesPage'
export { PPSimuladorPage } from '@/pages/profissional/account/PPSimuladorPage'
export { PPCartaoPage } from '@/pages/profissional/account/PPCartaoPage'
export { PPCredenciamentoPage } from '@/pages/profissional/credentialing/PPCredenciamentoPage'
