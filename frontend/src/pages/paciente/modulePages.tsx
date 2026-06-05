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
import { formatCurrency, formatDate } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { GenericDetailPage } from '@/pages/admin/GenericDetailPage'
import { npsSurveysService } from '@/services/index'
import { requiredString, phoneSchema, emailSchema } from '@/schemas/common'
import { MaskedInput } from '@/components/forms/MaskedInput'

export function PacienteHomePage() {
  return (
    <EntityListPage
      title="Início"
      description="Resumo dos seus ciclos de tratamento"
      queryKey={['paciente', 'home']}
      queryFn={async () => {
        const { data, error } = await supabase.from('care_cycles').select('id, cycle_number, status, session_count')
        if (error) throw error
        return { data: data ?? [], count: data?.length ?? 0 }
      }}
      columns={[
        { key: 'cycle', header: 'Ciclo', cell: (r) => `#${String(r.cycle_number)}` },
        { key: 'sessions', header: 'Sessões', cell: (r) => String(r.session_count) },
        { key: 'status', header: 'Status', cell: (r) => String(r.status) },
      ]}
    />
  )
}

export function PacienteTratamentoPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage title="Tratamento" queryKey={['paciente', 'cycles']} queryFn={async () => {
      const { data, error } = await supabase.from('care_cycles').select('id, cycle_number, status, session_count')
      if (error) throw error
      return { data: data ?? [], count: data?.length ?? 0 }
    }}
      onRowClick={(r) => navigate(`/paciente/tratamento/ciclo/${r.id}`)}
      columns={[{ key: 'cycle', header: 'Ciclo', cell: (r) => `#${String(r.cycle_number)}` }, { key: 'sessions', header: 'Sessões', cell: (r) => String(r.session_count) }, { key: 'status', header: 'Status', cell: (r) => String(r.status) }]} />
  )
}

export function PacienteCicloDetailPage() {
  return <GenericDetailPage title="Ciclo" backPath="/paciente/tratamento" queryKey={['paciente', 'cycles']} queryFn={async (id) => {
    const { data, error } = await supabase.from('care_cycles').select('*').eq('id', id).single()
    if (error) throw error
    return data as Record<string, unknown>
  }}
    fields={[{ key: 'cycle_number', label: 'Ciclo' }, { key: 'status', label: 'Status' }, { key: 'session_count', label: 'Sessões' }]} />
}

export function PacientePagamentosPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage title="Pagamentos" queryKey={['paciente', 'charges']} queryFn={async () => {
      const { data, error } = await supabase.from('charges_patient').select('*')
      if (error) throw error
      return { data: (data ?? []) as (Record<string, unknown> & { id: string })[], count: data?.length ?? 0 }
    }}
      onRowClick={(r) => navigate(`/paciente/pagamentos/${r.id}`)}
      columns={[
        { key: 'amount', header: 'Valor', cell: (r) => formatCurrency(Number(r.amount_cents)) },
        { key: 'status', header: 'Status', cell: (r) => String(r.payment_status) },
        { key: 'due', header: 'Vencimento', cell: (r) => formatDate(String(r.due_date)) },
      ]} />
  )
}

export function PacientePagamentoDetailPage() {
  return <GenericDetailPage title="Pagamento" backPath="/paciente/pagamentos" queryKey={['paciente', 'charges']} queryFn={async (id) => {
    const { data, error } = await supabase.from('charges_patient').select('*').eq('id', id).single()
    if (error) throw error
    return data as Record<string, unknown>
  }}
    fields={[{ key: 'amount_cents', label: 'Valor', format: 'currency' }, { key: 'payment_status', label: 'Status' }]} />
}

export function PacientePropostaPage() {
  const [open] = useState(true)
  const schema = z.object({ family_response: z.enum(['SIM', 'NAO'] as const) })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { family_response: 'SIM' } })
  const navigate = useNavigate()
  const submit = useCrudMutation({
    mutationFn: async (v: z.infer<typeof schema>) => {
      const { error } = await supabase.from('initial_assessments').update({ family_response: v.family_response }).limit(1)
      if (error) throw error
    },
    queryKey: ['paciente', 'assessments'],
    onSuccess: () => navigate('/paciente'),
  })
  return (
    <CrudModal open={open} onOpenChange={(o) => !o && navigate('/paciente')} title="Proposta de tratamento">
      <p className="text-sm text-muted-foreground mb-4">Aceita iniciar o tratamento domiciliar?</p>
      <Form {...form}><form onSubmit={form.handleSubmit((v) => submit.mutate(v))}>
        <FormActions onCancel={() => navigate('/paciente')} isSubmitting={submit.isPending} submitLabel="Confirmar SIM" />
      </form></Form>
    </CrudModal>
  )
}

export function PacienteDocumentosPage() {
  return <EntityListPage title="Documentos" queryKey={['paciente', 'documents']} queryFn={async () => {
    const { data, error } = await supabase.from('patient_documents').select('*')
    if (error) throw error
    return { data: data ?? [], count: data?.length ?? 0 }
  }} columns={[{ key: 'type', header: 'Tipo', cell: (r) => r.document_type }, { key: 'name', header: 'Arquivo', cell: (r) => r.file_name }]} />
}

export function PacienteContaPage() {
  const [open, setOpen] = useState(false)
  const schema = z.object({ full_name: requiredString('Nome'), email: emailSchema, phone: phoneSchema })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { full_name: '', email: '', phone: '' } })
  const update = useCrudMutation({
    mutationFn: async (v: z.infer<typeof schema>) => {
      const { error } = await supabase.from('patient_responsibles').update(v).limit(1)
      if (error) throw error
    },
    queryKey: ['paciente', 'responsible'],
    onSuccess: () => setOpen(false),
  })
  return (
    <>
      <EntityListPage
        title="Minha conta"
        description="Dados do responsável pelo paciente"
        queryKey={['paciente', 'responsible']}
        queryFn={async () => {
          const { data, error } = await supabase.from('patient_responsibles').select('id, full_name, email, phone')
          if (error) throw error
          return { data: (data ?? []) as (Record<string, unknown> & { id: string })[], count: data?.length ?? 0 }
        }}
        headerExtra={
          <button type="button" className="text-sm text-primary" onClick={() => setOpen(true)}>
            Editar responsável
          </button>
        }
        columns={[
          { key: 'name', header: 'Nome', cell: (r) => String(r.full_name) },
          { key: 'email', header: 'E-mail', cell: (r) => String(r.email) },
          { key: 'phone', header: 'Telefone', cell: (r) => String(r.phone) },
        ]}
      />
      <CrudModal open={open} onOpenChange={setOpen} title="Editar responsável">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => update.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><MaskedInput mask="phone" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={update.isPending} />
        </form></Form>
      </CrudModal>
    </>
  )
}

export function PacienteNpsPage() {
  const cicloId = window.location.pathname.split('/').pop() ?? ''
  const [open] = useState(true)
  const schema = z.object({ score: z.coerce.number().min(0).max(10), comment: z.string().optional() })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as never, defaultValues: { score: 10 } })
  const navigate = useNavigate()
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) => npsSurveysService.create({ ...v, cycle_id: cicloId, rater_type: 'paciente', rated_entity_type: 'larsana' }),
    queryKey: ['paciente', 'nps'],
    onSuccess: () => navigate('/paciente'),
  })
  return (
    <CrudModal open={open} onOpenChange={(o) => !o && navigate('/paciente')} title="Avalie o atendimento">
      <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
        <FormField control={form.control} name="score" render={({ field }) => (<FormItem><FormLabel>Nota (0-10)</FormLabel><FormControl><Input type="number" min={0} max={10} {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormActions onCancel={() => navigate('/paciente')} isSubmitting={create.isPending} submitLabel="Enviar" />
      </form></Form>
    </CrudModal>
  )
}

export function PacienteAceitePage() {
  return (
    <EntityListPage
      title="Aceite inicial"
      description="Termos de adesão e LGPD"
      queryKey={['paciente', 'terms']}
      queryFn={async () => {
        const { data, error } = await supabase.from('legal_terms').select('id, term_type, version, is_current')
        if (error) throw error
        return { data: data ?? [], count: data?.length ?? 0 }
      }}
      columns={[
        { key: 'type', header: 'Tipo', cell: (r) => String(r.term_type) },
        { key: 'version', header: 'Versão', cell: (r) => String(r.version) },
        { key: 'current', header: 'Vigente', cell: (r) => (r.is_current ? 'Sim' : 'Não') },
      ]}
    />
  )
}

export function PacienteAjudaPage() {
  return (
    <EntityListPage
      title="Ajuda"
      description="Perguntas frequentes e canais de suporte"
      queryKey={['paciente', 'ajuda']}
      queryFn={async () => ({ data: [], count: 0 })}
      searchable={false}
      emptyMessage="Central de ajuda em breve."
      columns={[
        { key: 'topic', header: 'Tópico', cell: () => '—' },
        { key: 'description', header: 'Descrição', cell: () => '—' },
      ]}
    />
  )
}
