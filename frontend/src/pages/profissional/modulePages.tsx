import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { PatientSearchField } from '@/components/forms/PatientSearchField'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import { sanitizeRichText } from '@/lib/sanitize'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { medicalRecordsService, transfersService, notificationsService } from '@/services/index'
import {
  getEvolutionSessionContext,
  listPendingEvolutionsForPp,
  pendingEvolutionDeadlineLabel,
  ppEvolutionsQueryKeys,
  type PendingEvolutionRow,
} from '@/services/ppEvolutions'
import { getCurrentProfessional } from '@/services/professionals'
import { getPPProfessionalCrefito } from '@/services/ppPatients'
import { GenericDetailPage } from '@/pages/admin/GenericDetailPage'
import { supabase } from '@/lib/supabase'

export { PPAgendaPage } from '@/pages/profissional/agenda/PPAgendaPage'
export { PPHomePage } from '@/pages/profissional/home/PPHomePage'
export { PPSessionDetailPage } from '@/pages/profissional/agenda/PPSessionDetailPage'

export { PPDemandsPage } from '@/pages/profissional/demands/PPDemandsPage'

export function PPEvolucoesPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage
      title="Evoluções pendentes"
      description="Sessões realizadas aguardando registro clínico (prazo 24h)"
      queryKey={ppEvolutionsQueryKeys.pending}
      queryFn={listPendingEvolutionsForPp}
      onRowClick={(r) => navigate(`/profissional/evolucao/nova?session=${r.id}`)}
      columns={[
        {
          key: 'patient',
          header: 'Paciente',
          cell: (r) => {
            const row = r as unknown as PendingEvolutionRow
            return row.care_cycles?.patients?.full_name ?? '—'
          },
        },
        {
          key: 'session',
          header: 'Sessão',
          cell: (r) => {
            const row = r as unknown as PendingEvolutionRow
            const cycle = row.care_cycles?.cycle_number
            return cycle != null ? `Ciclo ${cycle} · Sessão #${row.session_number}` : `#${row.session_number}`
          },
        },
        {
          key: 'date',
          header: 'Realizada em',
          cell: (r) => {
            const row = r as unknown as PendingEvolutionRow
            const ref = row.check_out_at ?? row.scheduled_at
            return ref ? formatDateTime(ref) : '—'
          },
        },
        {
          key: 'deadline',
          header: 'Prazo',
          cell: (r) => pendingEvolutionDeadlineLabel(r as unknown as PendingEvolutionRow),
        },
      ]}
    />
  )
}

const PP_EVOLUTION_FORM_ID = 'pp-evolution-form'

export function PPEvolucaoNovaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') ?? undefined
  const [open] = useState(true)
  const schema = z.object({
    patient_id: z.string().uuid('Selecione um paciente'),
    content_richtext: requiredString('Evolução'),
    crefto_number: requiredString('CREFITO'),
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
      return medicalRecordsService.create({
        patient_id: v.patient_id,
        content_richtext: sanitizeRichText(v.content_richtext),
        crefito_number: v.crefto_number,
        record_type: 'evolucao' as const,
        professional_id: professional.id,
        session_id: sessionContext?.sessionId ?? null,
        cycle_id: sessionContext?.cycleId ?? null,
      })
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
                      Ciclo {sessionContext.cycleNumber} · Sessão #{sessionContext.sessionNumber}
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
          <FormField control={form.control} name="crefto_number" render={({ field }) => (
            <FormItem><FormLabel>CREFITO</FormLabel><FormControl><Textarea rows={1} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </form>
      </Form>
    </CrudDrawer>
  )
}

export function PPRepassesPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage title="Repasses" queryKey={['pp', 'transfers']} queryFn={() => transfersService.list('id, pp_transfer_amount_cents, status')}
      onRowClick={(r) => navigate(`/profissional/repasses/${r.id}`)}
      columns={[{ key: 'amount', header: 'Valor', cell: (r) => formatCurrency(Number(r.pp_transfer_amount_cents)) }, { key: 'status', header: 'Status', cell: (r) => String(r.status) }]} />
  )
}

export function PPRepasseDetailPage() {
  return <GenericDetailPage title="Repasse" backPath="/profissional/repasses" queryKey={['pp', 'transfers']} queryFn={(id) => transfersService.getById(id)}
    fields={[{ key: 'pp_transfer_amount_cents', label: 'Valor', format: 'currency' }, { key: 'status', label: 'Status' }]} />
}

export { PPPacientesPage } from '@/pages/profissional/patients/PPPacientesPage'
export { PPPacienteDetailPage } from '@/pages/profissional/patients/PPPacienteDetailPage'
export { PPAvaliacoesPage } from '@/pages/profissional/assessments/PPAvaliacoesPage'
export { PPAvaliacaoDetailPage } from '@/pages/profissional/assessments/PPAvaliacaoDetailPage'
export { PPCredenciamentoPage } from '@/pages/profissional/credentialing/PPCredenciamentoPage'

export function PPPerfilPage() {
  return (
    <EntityListPage
      title="Perfil"
      description="Seus dados profissionais e credenciais"
      queryKey={['pp', 'profile']}
      queryFn={async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: [], count: 0 }
        const { data, error } = await supabase.from('professionals').select('id, full_name, profession, credentialing_status').eq('user_id', user.id)
        if (error) throw error
        return { data: (data ?? []) as (Record<string, unknown> & { id: string })[], count: data?.length ?? 0 }
      }}
      searchable={false}
      columns={[
        { key: 'name', header: 'Nome', cell: (r) => String(r.full_name) },
        { key: 'profession', header: 'Profissão', cell: (r) => String(r.profession) },
        { key: 'status', header: 'Credenciamento', cell: (r) => String(r.credentialing_status) },
      ]}
    />
  )
}

export function PPSimuladorPage() {
  return (
    <EntityListPage
      title="Simulador de repasse"
      description="Histórico de repasses para estimativa de ganhos"
      queryKey={['pp', 'simulador']}
      queryFn={() => transfersService.list('id, pp_transfer_amount_cents, status, created_at')}
      columns={[
        { key: 'amount', header: 'Valor', cell: (r) => formatCurrency(Number(r.pp_transfer_amount_cents)) },
        { key: 'status', header: 'Status', cell: (r) => String(r.status) },
        { key: 'date', header: 'Data', cell: (r) => formatDateTime(String(r.created_at)) },
      ]}
    />
  )
}

export function PPCartaoPage() {
  return (
    <EntityListPage
      title="Cartão de visita"
      description="Informações exibidas no cartão digital"
      queryKey={['pp', 'cartao']}
      queryFn={async () => ({ data: [], count: 0 })}
      searchable={false}
      emptyMessage="Cartão digital em breve."
      columns={[
        { key: 'field', header: 'Campo', cell: () => '—' },
        { key: 'value', header: 'Valor', cell: () => '—' },
      ]}
    />
  )
}

export function PPNotificacoesPage() {
  return <EntityListPage title="Notificações" queryKey={['pp', 'notifications']} queryFn={() => notificationsService.list()}
    columns={[{ key: 'title', header: 'Título', cell: (r) => String(r.title) }, { key: 'date', header: 'Data', cell: (r) => formatDateTime(String(r.created_at)) }]} />
}
