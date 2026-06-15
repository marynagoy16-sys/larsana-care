import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { careSessionsService, medicalRecordsService, transfersService, demandsService, notificationsService } from '@/services/index'
import { GenericDetailPage } from '@/pages/admin/GenericDetailPage'
import { supabase } from '@/lib/supabase'
import { demandListColumns } from '@/components/demands/demandListColumns'

export function PPAgendaPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage title="Agenda" queryKey={['pp', 'sessions']} queryFn={() => careSessionsService.list('id, scheduled_at, status, session_number')}
      onRowClick={(r) => navigate(`/profissional/agenda/${r.id}`)}
      columns={[
        { key: 'num', header: 'Sessão', cell: (r) => `#${r.session_number}` },
        { key: 'date', header: 'Data', cell: (r) => formatDateTime(String(r.scheduled_at)) },
        { key: 'status', header: 'Status', cell: (r) => String(r.status) },
      ]}
    />
  )
}

export function PPSessionDetailPage() {
  return <GenericDetailPage title="Sessão" backPath="/profissional/agenda" queryKey={['pp', 'sessions']} queryFn={(id) => careSessionsService.getById(id)}
    fields={[{ key: 'session_number', label: 'Número' }, { key: 'status', label: 'Status' }, { key: 'scheduled_at', label: 'Agendado', format: 'datetime' }]} />
}

export function PPDemandsPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage title="Demandas" queryKey={['pp', 'demands']} queryFn={() => demandsService.listOpenForPp()}
      onRowClick={(r) => navigate(`/profissional/demandas/${r.id}`)}
      columns={demandListColumns} />
  )
}

export function PPEvolucoesPage() {
  return (
    <EntityListPage title="Evoluções pendentes" queryKey={['pp', 'records']} queryFn={() => medicalRecordsService.list()}
      columns={[{ key: 'type', header: 'Tipo', cell: (r) => String(r.record_type) }, { key: 'date', header: 'Data', cell: (r) => formatDateTime(String(r.created_at)) }]} />
  )
}

export function PPEvolucaoNovaPage() {
  const navigate = useNavigate()
  const [open] = useState(true)
  const schema = z.object({
    patient_id: z.string().uuid('Selecione um paciente'),
    content_richtext: requiredString('Evolução'),
    crefto_number: requiredString('CREFITO'),
  })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { patient_id: '', content_richtext: '', crefto_number: '' } })
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) => medicalRecordsService.create({
      ...v,
      content_richtext: sanitizeRichText(v.content_richtext),
      record_type: 'evolucao' as const,
      professional_id: '',
    }),
    queryKey: ['pp', 'records'],
    onSuccess: () => navigate('/profissional/evolucoes'),
  })
  return (
    <CrudDrawer open={open} onOpenChange={(o) => !o && navigate('/profissional/evolucoes')} title="Nova evolução" size="lg">
      <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
        <FormField control={form.control} name="patient_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Paciente</FormLabel>
            <FormControl>
              <PatientSearchField value={field.value} onChange={field.onChange} showCreate={false} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="content_richtext" render={({ field }) => (
          <FormItem><FormLabel>Evolução clínica</FormLabel><FormControl><Textarea rows={8} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="crefto_number" render={({ field }) => (
          <FormItem><FormLabel>CREFITO</FormLabel><FormControl><Textarea rows={1} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormActions onCancel={() => navigate('/profissional/evolucoes')} isSubmitting={create.isPending} />
      </form></Form>
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

export function PPCredenciamentoPage() {
  const [step, setStep] = useState(0)
  const steps = ['Dados', 'Conselho', 'Documentos', 'Banco', 'Contrato']
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-bold">Credenciamento</h2>
        <p className="text-muted-foreground">Complete seu cadastro para ativar a conta.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {steps.map((s, i) => (
          <span key={s} className={`text-xs px-2 py-1 rounded-full ${i === step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{s}</span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Etapa atual: <strong>{steps[step]}</strong>. Preencha os dados no seu perfil e envie documentos pelo painel.
      </p>
      <div className="flex justify-between">
        <button type="button" className="text-sm text-muted-foreground" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Voltar</button>
        <button type="button" className="text-sm text-primary" disabled={step === steps.length - 1} onClick={() => setStep((s) => s + 1)}>Próximo</button>
      </div>
    </div>
  )
}

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
