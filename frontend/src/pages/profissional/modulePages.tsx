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
import { careSessionsService, medicalRecordsService, transfersService, demandsService, demandResponsesService, initialAssessmentsService, notificationsService } from '@/services/index'
import { GenericDetailPage } from '@/pages/admin/GenericDetailPage'
import { supabase } from '@/lib/supabase'

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
    <EntityListPage title="Demandas" queryKey={['pp', 'demands']} queryFn={() => demandsService.list()}
      onRowClick={(r) => navigate(`/profissional/demandas/${r.id}`)}
      columns={[{ key: 'status', header: 'Status', cell: (r) => String(r.status) }, { key: 'prof', header: 'Profissão', cell: (r) => String(r.required_profession) }]} />
  )
}

export function PPDemandDetailPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const schema = z.object({ response: z.enum(['accepted', 'declined']), decline_reason: z.string().optional() })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { response: 'accepted' } })
  const id = window.location.pathname.split('/').pop() ?? ''
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) => demandResponsesService.create({ ...v, demand_id: id, professional_id: '' }),
    queryKey: ['pp', 'demand_responses'],
    onSuccess: () => { navigate('/profissional/demandas') },
  })
  return (
    <>
      <GenericDetailPage title="Demanda" backPath="/profissional/demandas" queryKey={['pp', 'demands']} queryFn={(i) => demandsService.getById(i)}
        fields={[{ key: 'status', label: 'Status' }, { key: 'required_profession', label: 'Profissão' }]} />
      <div className="px-6 pb-6"><button className="text-sm text-primary" onClick={() => setOpen(true)}>Responder demanda</button></div>
      <CrudDrawer open={open} onOpenChange={setOpen} title="Responder demanda">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="decline_reason" render={({ field }) => (
            <FormItem><FormLabel>Motivo (se recusar)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} submitLabel="Enviar" />
        </form></Form>
      </CrudDrawer>
    </>
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

export function PPPacientesPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage title="Meus pacientes" queryKey={['pp', 'patients']} queryFn={async () => {
      const { data, error } = await supabase.from('patients_pp').select('*')
      if (error) throw error
      return { data: (data ?? []) as (Record<string, unknown> & { id: string })[], count: data?.length ?? 0 }
    }}
      onRowClick={(r) => navigate(`/profissional/pacientes/${r.id}`)}
      columns={[{ key: 'name', header: 'Nome', cell: (r) => String(r.full_name) }, { key: 'status', header: 'Status', cell: (r) => String(r.care_status) }]} />
  )
}

export function PPPacienteDetailPage() {
  return <GenericDetailPage title="Paciente" backPath="/profissional/pacientes" queryKey={['pp', 'patients']} queryFn={async (id) => {
    const { data, error } = await supabase.from('patients_pp').select('*').eq('id', id).single()
    if (error) throw error
    return data as Record<string, unknown>
  }}
    fields={[{ key: 'full_name', label: 'Nome' }, { key: 'care_status', label: 'Status' }]} />
}

export function PPAvaliacoesPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage title="Avaliações" queryKey={['pp', 'assessments']} queryFn={() => initialAssessmentsService.list()}
      onRowClick={(r) => navigate(`/profissional/avaliacoes/${r.id}`)}
      columns={[{ key: 'status', header: 'Status', cell: (r) => String(r.status) }]} />
  )
}

export function PPAvaliacaoDetailPage() {
  return <GenericDetailPage title="Avaliação" backPath="/profissional/avaliacoes" queryKey={['pp', 'assessments']} queryFn={(id) => initialAssessmentsService.getById(id)}
    fields={[{ key: 'status', label: 'Status' }, { key: 'clinical_content', label: 'Conteúdo' }]} />
}

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
