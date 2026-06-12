import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSearchField } from '@/components/forms/PatientSearchField'
import { ProfessionalSearchField } from '@/components/forms/ProfessionalSearchField'
import { CycleSearchField } from '@/components/forms/CycleSearchField'
import { RegionSelectField } from '@/components/forms/RegionSelectField'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { assessmentStatusLabels, cycleStatusLabels, paymentStatusLabels } from '@/constants/labels'
import {
  initialAssessmentsService,
  careCyclesService,
  careSessionsService,
  treatmentPausesService,
  medicalRecordsService,
  chargesService,
  transfersService,
  demandsService,
  internalExpensesService,
  supportTicketsService,
  legalTermsService,
  profilesService,
  delumaExportsService,
  contractTemplatesService,
  npsSurveysService,
} from '@/services/index'
import { edgeFunctions } from '@/services/edgeFunctions'
import { supabase } from '@/lib/supabase'
import { GenericDetailPage } from '@/pages/admin/GenericDetailPage'
import { professionalsService } from '@/services/index'
import { Button } from '@/components/ui/button'
import { demandListColumns } from '@/components/demands/demandListColumns'

const qk = {
  assessments: ['initial_assessments'] as const,
  cycles: ['care_cycles'] as const,
  records: ['medical_records'] as const,
  charges: ['charges'] as const,
  transfers: ['transfers'] as const,
  demands: ['demands'] as const,
  expenses: ['internal_expenses'] as const,
  tickets: ['support_tickets'] as const,
  terms: ['legal_terms'] as const,
  regions: ['regions'] as const,
  users: ['profiles'] as const,
  contracts: ['contracts'] as const,
  deluma: ['deluma_exports'] as const,
  nps: ['nps_surveys'] as const,
  reportsFaturamento: ['reports', 'faturamento'] as const,
  reportsConversao: ['reports', 'conversao'] as const,
  reportsHorasCrefito: ['reports', 'horas-crefito'] as const,
  reportsRepassesAging: ['reports', 'repasses-aging'] as const,
  reportsCatalog: ['reports', 'catalog'] as const,
}

const REPORT_CATALOG = [
  { id: 'faturamento', name: 'Faturamento', description: 'Receitas e cobranças por período', path: '/admin/relatorios/faturamento' },
  { id: 'conversao', name: 'Conversão', description: 'Funil de avaliações e adesão ao tratamento', path: '/admin/relatorios/conversao' },
  { id: 'horas-crefito', name: 'Horas CREFITO', description: 'Sessões realizadas e registro clínico', path: '/admin/relatorios/horas-crefito' },
  { id: 'nps', name: 'NPS', description: 'Net Promoter Score por ciclo', path: '/admin/relatorios/nps' },
  { id: 'repasses-aging', name: 'Aging repasses', description: 'Repasses pendentes por tempo de espera', path: '/admin/relatorios/repasses-aging' },
] as const

export function AssessmentsPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage
      title="Avaliações iniciais"
      queryKey={qk.assessments}
      queryFn={() => initialAssessmentsService.list('id, status, created_at, patient_id')}
      onRowClick={(r) => navigate(`/admin/avaliacoes/${r.id}`)}
      columns={[
        { key: 'id', header: 'ID', cell: (r) => String(r.id).slice(0, 8) },
        { key: 'status', header: 'Status', cell: (r) => assessmentStatusLabels[String(r.status)] ?? String(r.status) },
        { key: 'date', header: 'Criado em', cell: (r) => formatDateTime(String(r.created_at)) },
      ]}
    />
  )
}

export function AssessmentDetailPage() {
  return (
    <GenericDetailPage
      title="Avaliação"
      backPath="/admin/avaliacoes"
      queryKey={qk.assessments}
      queryFn={(id) => initialAssessmentsService.getById(id)}
      fields={[
        { key: 'status', label: 'Status' },
        { key: 'clinical_content', label: 'Conteúdo clínico' },
        { key: 'family_response', label: 'Resposta família' },
        { key: 'created_at', label: 'Criado em', format: 'datetime' },
      ]}
    />
  )
}

export function CyclesPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const schema = z.object({
    patient_id: z.string().uuid('Selecione um paciente'),
    session_count: z.coerce.number().refine((v) => v === 4 || v === 8 || v === 12, 'Use 4, 8 ou 12 sessões'),
    assigned_professional_id: z.string().uuid('Selecione um profissional').optional().or(z.literal('')),
  })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as never, defaultValues: { patient_id: '', session_count: 8, assigned_professional_id: '' } })
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) => careCyclesService.create({
      patient_id: v.patient_id,
      session_count: v.session_count,
      cycle_number: 1,
      status: 'rascunho',
      payment_status: 'pendente',
      patient_level: 'N1',
      session_unit_price_cents: 0,
      total_amount_cents: 0,
      assigned_professional_id: v.assigned_professional_id || null,
    }),
    queryKey: qk.cycles,
    onSuccess: () => { form.reset(); setOpen(false) },
  })

  return (
    <>
      <EntityListPage
        title="Ciclos de tratamento"
        queryKey={qk.cycles}
        queryFn={() => careCyclesService.list('id, cycle_number, session_count, status, payment_status, created_at')}
        onCreate={() => setOpen(true)}
        createLabel="Abrir ciclo"
        onRowClick={(r) => navigate(`/admin/ciclos/${r.id}`)}
        columns={[
          { key: 'cycle', header: 'Ciclo', cell: (r) => `#${String(r.cycle_number)}` },
          { key: 'sessions', header: 'Sessões', cell: (r) => String(r.session_count) },
          { key: 'status', header: 'Status', cell: (r) => cycleStatusLabels[String(r.status)] ?? String(r.status) },
          { key: 'payment', header: 'Pagamento', cell: (r) => paymentStatusLabels[String(r.payment_status)] ?? String(r.payment_status) },
        ]}
      />
      <CrudModal open={open} onOpenChange={setOpen} title="Abrir ciclo">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
            <FormField control={form.control} name="patient_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <FormControl>
                  <PatientSearchField value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="assigned_professional_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional (opcional)</FormLabel>
                <FormControl>
                  <ProfessionalSearchField value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="session_count" render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade de sessões</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="4">4 sessões</SelectItem>
                    <SelectItem value="8">8 sessões</SelectItem>
                    <SelectItem value="12">12 sessões</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
          </form>
        </Form>
      </CrudModal>
    </>
  )
}

export function CycleDetailPage() {
  return (
    <GenericDetailPage title="Ciclo" backPath="/admin/ciclos" queryKey={qk.cycles} queryFn={(id) => careCyclesService.getById(id)}
      fields={[
        { key: 'cycle_number', label: 'Número' },
        { key: 'session_count', label: 'Sessões' },
        { key: 'status', label: 'Status' },
        { key: 'total_amount_cents', label: 'Valor total', format: 'currency' },
      ]}
    />
  )
}

export function MedicalRecordsPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage
      title="Prontuários"
      description="Painel de conformidade CREFITO"
      queryKey={qk.records}
      queryFn={() => medicalRecordsService.list('id, record_type, created_at, patient_id')}
      onRowClick={(r) => navigate(`/admin/prontuarios/${r.patient_id}`)}
      columns={[
        { key: 'type', header: 'Tipo', cell: (r) => String(r.record_type) },
        { key: 'date', header: 'Data', cell: (r) => formatDateTime(String(r.created_at)) },
      ]}
    />
  )
}

export function MedicalRecordPatientPage() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  return (
    <GenericDetailPage title="Prontuário do paciente" backPath="/admin/prontuarios" queryKey={[...qk.records, pacienteId ?? '']}
      queryFn={async () => ({ patient_id: pacienteId })}
      fields={[{ key: 'patient_id', label: 'Paciente ID' }]}
    />
  )
}

export function CredenciamentoPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage
      title="Credenciamento"
      queryKey={['professionals', 'credenciamento']}
      queryFn={() => professionalsService.list('id, full_name, credentialing_status, profession')}
      onRowClick={(r) => navigate(`/admin/credenciamento/${r.id}`)}
      columns={[
        { key: 'name', header: 'Profissional', cell: (r) => String(r.full_name) },
        { key: 'status', header: 'Status', cell: (r) => String(r.credentialing_status) },
      ]}
    />
  )
}

export function CredenciamentoDetailPage() {
  return (
    <GenericDetailPage title="Credenciamento" backPath="/admin/credenciamento" queryKey={['professionals']}
      queryFn={(id) => professionalsService.getById(id)}
      fields={[
        { key: 'full_name', label: 'Nome' },
        { key: 'credentialing_status', label: 'Status' },
        { key: 'profession', label: 'Profissão' },
      ]}
    />
  )
}

export function DemandsPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const schema = z.object({
    patient_id: z.string().uuid('Selecione um paciente'),
    required_profession: z.enum(['FISIO', 'NUTI', 'MED', 'CUID', 'FONO']),
    region_id: z.string().uuid('Selecione uma região'),
  })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { patient_id: '', required_profession: 'FISIO', region_id: '' } })
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) => demandsService.create({ ...v, status: 'aberta' }),
    queryKey: qk.demands,
    onSuccess: () => { form.reset(); setOpen(false) },
  })
  return (
    <>
      <EntityListPage title="Demandas" queryKey={qk.demands} queryFn={() => demandsService.list()} onCreate={() => setOpen(true)}
        onRowClick={(r) => navigate(`/admin/demandas/${r.id}`)}
        columns={demandListColumns} />
      <CrudModal open={open} onOpenChange={setOpen} title="Nova demanda">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="patient_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente</FormLabel>
              <FormControl>
                <PatientSearchField value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="required_profession" render={({ field }) => (
            <FormItem>
              <FormLabel>Profissão requerida</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione a profissão" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FISIO">Fisioterapia</SelectItem>
                  <SelectItem value="NUTI">Nutrição</SelectItem>
                  <SelectItem value="MED">Medicina</SelectItem>
                  <SelectItem value="CUID">Cuidador</SelectItem>
                  <SelectItem value="FONO">Fonoaudiologia</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="region_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Região</FormLabel>
              <FormControl>
                <RegionSelectField value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
        </form></Form>
      </CrudModal>
    </>
  )
}

export function DemandDetailPage() {
  return <GenericDetailPage title="Demanda" backPath="/admin/demandas" queryKey={qk.demands} queryFn={(id) => demandsService.getById(id)} fields={[{ key: 'status', label: 'Status' }, { key: 'required_profession', label: 'Profissão' }]} />
}

export function ChargesPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const schema = z.object({
    patient_id: z.string().uuid('Selecione um paciente'),
    amount_cents: z.coerce.number().positive(),
    due_date: requiredString('Vencimento'),
    payment_method: z.enum(['PIX', 'BOLETO']),
  })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as never, defaultValues: { patient_id: '', amount_cents: 0, due_date: '', payment_method: 'PIX' } })
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) => edgeFunctions.createCharge(v),
    queryKey: qk.charges,
    onSuccess: () => { form.reset(); setOpen(false) },
  })
  return (
    <>
      <EntityListPage title="Cobranças" queryKey={qk.charges} queryFn={() => chargesService.list('id, amount_cents, payment_status, due_date')}
        onCreate={() => setOpen(true)}
        createLabel="Nova cobrança"
        onRowClick={(r) => navigate(`/admin/cobrancas/${r.id}`)}
        columns={[
          { key: 'amount', header: 'Valor', cell: (r) => formatCurrency(Number(r.amount_cents)) },
          { key: 'status', header: 'Status', cell: (r) => paymentStatusLabels[String(r.payment_status)] ?? String(r.payment_status) },
          { key: 'due', header: 'Vencimento', cell: (r) => formatDate(String(r.due_date)) },
        ]}
      />
      <CrudModal open={open} onOpenChange={setOpen} title="Nova cobrança (Asaas)">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="patient_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente</FormLabel>
              <FormControl>
                <PatientSearchField value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="amount_cents" render={({ field }) => (
            <FormItem><FormLabel>Valor (centavos)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="due_date" render={({ field }) => (
            <FormItem><FormLabel>Vencimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
        </form></Form>
      </CrudModal>
    </>
  )
}

export function ChargeDetailPage() {
  return <GenericDetailPage title="Cobrança" backPath="/admin/cobrancas" queryKey={qk.charges} queryFn={(id) => chargesService.getById(id)}
    fields={[{ key: 'amount_cents', label: 'Valor', format: 'currency' }, { key: 'payment_status', label: 'Status' }, { key: 'due_date', label: 'Vencimento', format: 'date' }]} />
}

export function TransfersPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage title="Repasses" queryKey={qk.transfers} queryFn={() => transfersService.list('id, pp_transfer_amount_cents, status, created_at')}
      onRowClick={(r) => navigate(`/admin/repasses/${r.id}`)}
      columns={[
        { key: 'amount', header: 'Repasse PP', cell: (r) => formatCurrency(Number(r.pp_transfer_amount_cents)) },
        { key: 'status', header: 'Status', cell: (r) => String(r.status) },
      ]}
    />
  )
}

export function TransferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const release = useCrudMutation({
    mutationFn: (_: void) => edgeFunctions.transferWallet({ transfer_id: id ?? '' }),
    queryKey: qk.transfers,
  })
  return (
    <div className="space-y-4">
      <GenericDetailPage title="Repasse" backPath="/admin/repasses" queryKey={qk.transfers} queryFn={(i) => transfersService.getById(i)}
        fields={[{ key: 'pp_transfer_amount_cents', label: 'Valor PP', format: 'currency' }, { key: 'status', label: 'Status' }]} />
      {id && (
        <div className="px-6">
          <button type="button" className="text-sm text-primary" disabled={release.isPending} onClick={() => release.mutate(undefined)}>
            Liberar repasse (Wallet)
          </button>
        </div>
      )}
    </div>
  )
}

export function CaixaPage() {
  const [open, setOpen] = useState(false)
  const schema = z.object({ expense_type: requiredString('Tipo'), amount_cents: z.coerce.number().positive(), reference_month: requiredString('Mês') })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as never, defaultValues: { expense_type: '', amount_cents: 0, reference_month: '' } })
  const create = useCrudMutation({ mutationFn: (v: z.infer<typeof schema>) => internalExpensesService.create(v), queryKey: qk.expenses, onSuccess: () => { form.reset(); setOpen(false) } })
  return (
    <>
      <EntityListPage title="Caixa" description="Despesas internas" queryKey={qk.expenses} queryFn={() => internalExpensesService.list()} onCreate={() => setOpen(true)}
        columns={[{ key: 'type', header: 'Tipo', cell: (r) => String(r.expense_type) }, { key: 'amount', header: 'Valor', cell: (r) => formatCurrency(Number(r.amount_cents)) }]} />
      <CrudModal open={open} onOpenChange={setOpen} title="Nova despesa">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="expense_type" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="amount_cents" render={({ field }) => (<FormItem><FormLabel>Valor (centavos)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
        </form></Form>
      </CrudModal>
    </>
  )
}

export function SessionsPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const schema = z.object({
    cycle_id: z.string().uuid('Selecione um ciclo'),
    professional_id: z.string().uuid('Selecione um profissional'),
    session_number: z.coerce.number().min(1),
    scheduled_at: requiredString('Data/hora'),
  })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as never, defaultValues: { cycle_id: '', professional_id: '', session_number: 1, scheduled_at: '' } })
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) => careSessionsService.create({ ...v, status: 'prevista' }),
    queryKey: ['care_sessions'],
    onSuccess: () => { form.reset(); setOpen(false) },
  })
  return (
    <>
      <EntityListPage
        title="Sessões"
        queryKey={['care_sessions']}
        queryFn={() => careSessionsService.list('id, session_number, scheduled_at, status, cycle_id')}
        onCreate={() => setOpen(true)}
        createLabel="Agendar sessão"
        onRowClick={(r) => navigate(`/admin/ciclos/${String(r.cycle_id)}`)}
        columns={[
          { key: 'num', header: 'Sessão', cell: (r) => `#${String(r.session_number)}` },
          { key: 'date', header: 'Agendado', cell: (r) => formatDateTime(String(r.scheduled_at)) },
          { key: 'status', header: 'Status', cell: (r) => String(r.status) },
        ]}
      />
      <CrudModal open={open} onOpenChange={setOpen} title="Agendar sessão">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="cycle_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Ciclo</FormLabel>
              <FormControl>
                <CycleSearchField value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="professional_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Profissional</FormLabel>
              <FormControl>
                <ProfessionalSearchField value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="scheduled_at" render={({ field }) => (
            <FormItem><FormLabel>Data/hora</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
        </form></Form>
      </CrudModal>
    </>
  )
}

export function TreatmentPausesPage() {
  const [open, setOpen] = useState(false)
  const schema = z.object({
    patient_id: z.string().uuid('Selecione um paciente'),
    reason: requiredString('Motivo'),
    paused_at: requiredString('Início'),
  })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as never, defaultValues: { patient_id: '', reason: '', paused_at: new Date().toISOString() } })
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof schema>) => treatmentPausesService.create(v),
    queryKey: ['treatment_pauses'],
    onSuccess: () => { form.reset(); setOpen(false) },
  })
  return (
    <>
      <EntityListPage
        title="Pausas de tratamento"
        queryKey={['treatment_pauses']}
        queryFn={() => treatmentPausesService.list()}
        onCreate={() => setOpen(true)}
        columns={[
          { key: 'reason', header: 'Motivo', cell: (r) => String(r.reason) },
          { key: 'start', header: 'Início', cell: (r) => formatDateTime(String(r.paused_at)) },
          { key: 'end', header: 'Retorno', cell: (r) => r.resumed_at ? formatDateTime(String(r.resumed_at)) : '—' },
        ]}
      />
      <CrudModal open={open} onOpenChange={setOpen} title="Registrar pausa">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="patient_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente</FormLabel>
              <FormControl>
                <PatientSearchField value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="reason" render={({ field }) => (
            <FormItem><FormLabel>Motivo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
        </form></Form>
      </CrudModal>
    </>
  )
}

export function DelumaExportPage() {
  const [generating, setGenerating] = useState(false)
  const month = new Date().toISOString().slice(0, 7)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await edgeFunctions.generateDelumaExport({ reference_month: month })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <EntityListPage
      title="Exportação DELUMA"
      description="Gere o arquivo XLSX do mês de referência."
      queryKey={qk.deluma}
      queryFn={() => delumaExportsService.list()}
      headerExtra={
        <Button type="button" size="sm" disabled={generating} onClick={handleGenerate}>
          {generating ? 'Gerando…' : `Gerar export ${month}`}
        </Button>
      }
      columns={[
        { key: 'month', header: 'Mês', cell: (r) => String(r.reference_month) },
        { key: 'date', header: 'Gerado em', cell: (r) => formatDateTime(String(r.generated_at ?? '')) },
      ]}
    />
  )
}

export function NpsReportPage() {
  return (
    <EntityListPage
      title="Relatório NPS"
      queryKey={qk.nps}
      queryFn={() => npsSurveysService.list('id, score, comment, rater_type, created_at')}
      columns={[
        { key: 'score', header: 'Nota', cell: (r) => String(r.score) },
        { key: 'type', header: 'Avaliador', cell: (r) => String(r.rater_type) },
        { key: 'date', header: 'Data', cell: (r) => formatDateTime(String(r.created_at)) },
      ]}
    />
  )
}

export function TermsConfigPage() {
  const [open, setOpen] = useState(false)
  const schema = z.object({ term_type: z.enum(['TERMO_ADESAO', 'DIRETRIZES', 'LGPD', 'DIRETRIZES_PP', 'LGPD_PP']), version: requiredString('Versão'), content: requiredString('Conteúdo') })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) as never, defaultValues: { term_type: 'TERMO_ADESAO', version: '1.0', content: '' } })
  const create = useCrudMutation({ mutationFn: (v: z.infer<typeof schema>) => legalTermsService.create({ ...v, is_current: false }), queryKey: qk.terms, onSuccess: () => { form.reset(); setOpen(false) } })
  return (
    <>
      <EntityListPage title="Termos legais" queryKey={qk.terms} queryFn={() => legalTermsService.list()} onCreate={() => setOpen(true)}
        columns={[{ key: 'type', header: 'Tipo', cell: (r) => String(r.term_type) }, { key: 'ver', header: 'Versão', cell: (r) => String(r.version) }]} />
      <CrudModal open={open} onOpenChange={setOpen} title="Novo termo" size="lg">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Conteúdo</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
        </form></Form>
      </CrudModal>
    </>
  )
}

export function ContractsConfigPage() {
  return <EntityListPage title="Templates de contrato" queryKey={['contract_templates']} queryFn={() => contractTemplatesService.list()}
        columns={[{ key: 'title', header: 'Título', cell: (r) => String(r.title) }, { key: 'prof', header: 'Profissão', cell: (r) => String(r.profession) }]} />
}

export function UsersConfigPage() {
  return <EntityListPage title="Usuários" queryKey={qk.users} queryFn={() => profilesService.list('id, email, full_name, primary_role, is_active')}
    columns={[
      { key: 'name', header: 'Nome', cell: (r) => String(r.full_name ?? '—') },
      { key: 'email', header: 'E-mail', cell: (r) => String(r.email) },
      { key: 'role', header: 'Perfil', cell: (r) => String(r.primary_role) },
    ]} />
}

export function SupportPage() {
  const [open, setOpen] = useState(false)
  const schema = z.object({ subject: requiredString('Assunto'), description: requiredString('Descrição') })
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { subject: '', description: '' } })
  const create = useCrudMutation({
    mutationFn: async (v: z.infer<typeof schema>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      return supportTicketsService.create({ ...v, status: 'aberto', user_id: user.id })
    },
    queryKey: qk.tickets,
    onSuccess: () => { form.reset(); setOpen(false) },
  })
  return (
    <>
      <EntityListPage title="Suporte" queryKey={qk.tickets} queryFn={() => supportTicketsService.list()} onCreate={() => setOpen(true)}
        columns={[{ key: 'subject', header: 'Assunto', cell: (r) => String(r.subject) }, { key: 'status', header: 'Status', cell: (r) => String(r.status) }]} />
      <CrudModal open={open} onOpenChange={setOpen} title="Novo ticket">
        <Form {...form}><form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="subject" render={({ field }) => (<FormItem><FormLabel>Assunto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
        </form></Form>
      </CrudModal>
    </>
  )
}

export function ReportsHubPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage
      title="Relatórios"
      description="Selecione um relatório para visualizar"
      queryKey={qk.reportsCatalog}
      queryFn={async () => ({
        data: REPORT_CATALOG.map((item) => ({ ...item })),
        count: REPORT_CATALOG.length,
      })}
      onRowClick={(r) => navigate(String(r.path))}
      columns={[
        { key: 'name', header: 'Relatório', cell: (r) => String(r.name), mobilePrimary: true },
        { key: 'description', header: 'Descrição', cell: (r) => String(r.description) },
      ]}
    />
  )
}

export function FaturamentoReportPage() {
  return (
    <EntityListPage
      title="Relatório de faturamento"
      description="Cobranças emitidas e status de pagamento"
      queryKey={qk.reportsFaturamento}
      queryFn={() => chargesService.list('id, amount_cents, payment_status, due_date, created_at')}
      columns={[
        { key: 'amount', header: 'Valor', cell: (r) => formatCurrency(Number(r.amount_cents)) },
        { key: 'status', header: 'Status', cell: (r) => paymentStatusLabels[String(r.payment_status)] ?? String(r.payment_status) },
        { key: 'due', header: 'Vencimento', cell: (r) => formatDate(String(r.due_date)) },
        { key: 'date', header: 'Emitido em', cell: (r) => formatDateTime(String(r.created_at)) },
      ]}
    />
  )
}

export function ConversaoReportPage() {
  return (
    <EntityListPage
      title="Relatório de conversão"
      description="Avaliações iniciais e resposta das famílias"
      queryKey={qk.reportsConversao}
      queryFn={() => initialAssessmentsService.list('id, status, family_response, created_at')}
      columns={[
        { key: 'status', header: 'Status', cell: (r) => assessmentStatusLabels[String(r.status)] ?? String(r.status) },
        { key: 'response', header: 'Resposta família', cell: (r) => String(r.family_response ?? '—') },
        { key: 'date', header: 'Data', cell: (r) => formatDateTime(String(r.created_at)) },
      ]}
    />
  )
}

export function HorasCrefitoReportPage() {
  return (
    <EntityListPage
      title="Relatório de horas CREFITO"
      description="Sessões agendadas e status de registro clínico"
      queryKey={qk.reportsHorasCrefito}
      queryFn={() => careSessionsService.list('id, session_number, scheduled_at, status, cycle_id')}
      columns={[
        { key: 'num', header: 'Sessão', cell: (r) => `#${String(r.session_number)}` },
        { key: 'date', header: 'Agendado', cell: (r) => formatDateTime(String(r.scheduled_at)) },
        { key: 'status', header: 'Status', cell: (r) => String(r.status) },
      ]}
    />
  )
}

export function RepassesAgingReportPage() {
  return (
    <EntityListPage
      title="Relatório de aging de repasses"
      description="Repasses pendentes e valores em aberto"
      queryKey={qk.reportsRepassesAging}
      queryFn={() => transfersService.list('id, pp_transfer_amount_cents, status, created_at')}
      columns={[
        { key: 'amount', header: 'Valor PP', cell: (r) => formatCurrency(Number(r.pp_transfer_amount_cents)) },
        { key: 'status', header: 'Status', cell: (r) => String(r.status) },
        { key: 'date', header: 'Criado em', cell: (r) => formatDateTime(String(r.created_at)) },
      ]}
    />
  )
}

export function AuditPage() {
  return <EntityListPage title="Auditoria" queryKey={['audit_logs']} queryFn={async () => {
    const { createCrudService } = await import('@/lib/createCrudService')
    return createCrudService('audit_logs').list()
  }} columns={[{ key: 'action', header: 'Ação', cell: (r) => String(r.action) }, { key: 'entity', header: 'Entidade', cell: (r) => String(r.entity_type) }]} />
}

export function SettingsPage() {
  return (
    <EntityListPage
      title="Configurações"
      description="Preferências gerais do painel administrativo"
      queryKey={['settings', 'preferences']}
      queryFn={async () => ({ data: [], count: 0 })}
      searchable={false}
      emptyMessage="Configurações avançadas em breve."
      columns={[
        { key: 'name', header: 'Preferência', cell: () => '—' },
        { key: 'value', header: 'Valor', cell: () => '—' },
      ]}
    />
  )
}

export function ProfessionalDetailPage() {
  return <GenericDetailPage title="Profissional" backPath="/admin/profissionais" queryKey={['professionals']} queryFn={(id) => professionalsService.getById(id)}
    fields={[{ key: 'full_name', label: 'Nome' }, { key: 'profession', label: 'Profissão' }, { key: 'credentialing_status', label: 'Status' }]} />
}
