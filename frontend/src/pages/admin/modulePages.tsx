import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowLeft, ClipboardList, Clock, PenLine, Search } from 'lucide-react'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PatientSearchField } from '@/components/forms/PatientSearchField'
import { ProfessionalSearchField } from '@/components/forms/ProfessionalSearchField'
import { CycleSearchField } from '@/components/forms/CycleSearchField'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import {
  buildAssessmentWorkflowStats,
  formatAssessmentProposalSummary,
  formatFamilyDeadline,
  formatFamilyResponse,
} from '@/lib/assessmentListDisplay'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { assessmentStatusLabels, medicalRecordTypeLabels, paymentStatusLabels } from '@/constants/labels'
import {
  initialAssessmentsService,
  careCyclesService,
  careSessionsService,
  medicalRecordsService,
  chargesService,
  transfersService,
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
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { AssessmentProposalSummary } from '@/components/assessments/AssessmentProposalSummary'
import { AssessmentSendProposalCard } from '@/components/assessments/AssessmentSendProposalCard'
import { AssessmentLevelReviewCard } from '@/components/assessments/AssessmentLevelReviewCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { estimateAssessmentProposalTotalCents } from '@/services/assessmentProposal'
import { sanitizeRichText } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

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

type AdminAssessmentRow = {
  id: string
  status: string
  created_at: string
  patient_id: string
  proposed_session_count: number
  proposed_patient_level: string
  proposed_weekly_frequency: number
  proposal_sent_at: string | null
  response_deadline_at: string | null
  family_response: string | null
  patients?: { full_name: string } | null
  evaluator?: { full_name: string } | null
}

async function listAdminAssessments(): Promise<{ data: AdminAssessmentRow[]; count: number }> {
  const { data, error } = await supabase
    .from('initial_assessments')
    .select(
      `id, status, created_at, patient_id,
      proposed_session_count, proposed_patient_level, proposed_weekly_frequency,
      proposal_sent_at, response_deadline_at, family_response,
      patients ( full_name ),
      evaluator:professionals!initial_assessments_evaluator_professional_id_fkey ( full_name )`,
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as AdminAssessmentRow[]
  return { data: rows, count: rows.length }
}

export function AssessmentsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<AdminAssessmentRow[]>([])

  const stats = useMemo(() => {
    const { total, awaitingSend, inReview, expired } = buildAssessmentWorkflowStats(rows)
    return [
      {
        label: 'Total',
        value: total,
        icon: ClipboardList,
        footer: 'Avaliações iniciais',
      },
      {
        label: 'Aguardando envio',
        value: awaitingSend,
        icon: Clock,
        footer: 'Proposta ainda não enviada',
      },
      {
        label: 'Em análise',
        value: inReview,
        icon: Search,
        footer: 'Família analisando a proposta',
      },
      {
        label: 'Vencidas',
        value: expired,
        icon: AlertTriangle,
        footer: 'Sem resposta no prazo',
      },
    ]
  }, [rows])

  return (
    <EntityListPage
      title="Avaliações iniciais"
      description="Fila de propostas pendentes e vencidas"
      queryKey={qk.assessments}
      queryFn={async () => {
        const result = await listAdminAssessments()
        setRows(result.data)
        return result
      }}
      stats={stats}
      statsColumns={4}
      searchPlaceholder="Pesquisar avaliações..."
      onRowClick={(r) => navigate(`/admin/avaliacoes/${r.id}`)}
      columns={[
        {
          key: 'patient',
          header: 'Paciente',
          mobilePrimary: true,
          cell: (r) => (
            <span className="font-medium">{r.patients?.full_name ?? 'Paciente'}</span>
          ),
        },
        {
          key: 'professional',
          header: 'Profissional',
          cell: (r) => r.evaluator?.full_name ?? '—',
        },
        {
          key: 'status',
          header: 'Status',
          mobileBadge: true,
          cell: (r) => assessmentStatusLabels[r.status] ?? r.status,
        },
        {
          key: 'proposal',
          header: 'Proposta',
          mobileSubtitle: true,
          cell: (r) => (
            <span className="text-muted-foreground">{formatAssessmentProposalSummary(r)}</span>
          ),
        },
        {
          key: 'deadline',
          header: 'Prazo família',
          mobileMeta: true,
          cell: (r) => formatFamilyDeadline(r),
        },
        {
          key: 'response',
          header: 'Resposta',
          mobileMeta: true,
          cell: (r) => formatFamilyResponse(r.family_response),
        },
        {
          key: 'proposal_sent_at',
          header: 'Proposta enviada em',
          mobileHidden: true,
          cell: (r) => (r.proposal_sent_at ? formatDateTime(r.proposal_sent_at) : '—'),
        },
        {
          key: 'created_at',
          header: 'Avaliado em',
          mobileMeta: true,
          cell: (r) => formatDate(r.created_at),
        },
      ]}
    />
  )
}

export function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/avaliacoes')
  const { data, isLoading } = useQuery({
    queryKey: [...qk.assessments, id],
    queryFn: () =>
      initialAssessmentsService.getById(
        id!,
        '*, patients ( full_name )',
      ),
    enabled: !!id,
  })

  const record = data as Record<string, unknown> | undefined
  const patientName =
    (record?.patients as { full_name?: string } | null | undefined)?.full_name ?? 'Paciente'

  const { data: totalAmountCents } = useQuery({
    queryKey: [
      ...qk.assessments,
      id,
      'proposal_total',
      record?.patient_id,
      record?.proposed_patient_level,
      record?.proposed_session_count,
    ],
    queryFn: () =>
      estimateAssessmentProposalTotalCents({
        patientId: String(record!.patient_id),
        patientLevel: String(record!.proposed_patient_level),
        sessionCount: Number(record!.proposed_session_count),
      }),
    enabled:
      !!record?.patient_id
      && !!record?.proposed_patient_level
      && record?.proposed_session_count != null,
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-display font-bold text-xl lg:text-2xl">Avaliação</span>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={8} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <PageHeader>
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground">Registro não encontrado.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const hasProposal = record!.primary_diagnosis != null
  const assessmentRecord = record!

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-display font-bold text-xl lg:text-2xl truncate min-w-0">{patientName}</h1>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
      <CascadeReveal className="space-y-6">
        {assessmentRecord.level_change_review_status === 'pendente' && (
          <CascadeItem>
            <AssessmentLevelReviewCard
              assessmentId={String(assessmentRecord.id)}
              suggestedLevel={String(assessmentRecord.suggested_patient_level)}
              requestedLevel={assessmentRecord.requested_patient_level as string | null}
              reason={assessmentRecord.patient_level_change_reason as string | null}
              queryKeys={[qk.assessments, [...qk.assessments, id]]}
            />
          </CascadeItem>
        )}

        {assessmentRecord.status === 'avaliacao_feita' && hasProposal && (
          <CascadeItem>
            <AssessmentSendProposalCard
              assessment={{
                id: String(assessmentRecord.id),
                patient_id: String(assessmentRecord.patient_id),
                status: String(assessmentRecord.status),
                proposed_session_count: Number(assessmentRecord.proposed_session_count),
                proposed_patient_level: String(assessmentRecord.proposed_patient_level),
                proposed_weekly_frequency: Number(assessmentRecord.proposed_weekly_frequency),
              }}
              patientName={patientName}
              totalAmountCents={totalAmountCents}
              queryKeys={[qk.assessments, [...qk.assessments, id], ['pp', 'assessments']]}
            />
          </CascadeItem>
        )}

        {hasProposal && (
          <CascadeItem>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-sm">Proposta clínica</h3>
                {Boolean(assessmentRecord.crefito_number) && (
                  <p className="text-xs text-muted-foreground mt-0.5">CREFITO {String(assessmentRecord.crefito_number)}</p>
                )}
              </div>
              <div className="p-5">
                <AssessmentProposalSummary
                  data={{
                    suggested_weekly_frequency: assessmentRecord.suggested_weekly_frequency as number | null,
                    proposed_weekly_frequency: Number(assessmentRecord.proposed_weekly_frequency),
                    proposed_session_count: Number(assessmentRecord.proposed_session_count),
                    suggested_patient_level: String(assessmentRecord.suggested_patient_level),
                    proposed_patient_level: String(assessmentRecord.proposed_patient_level),
                    patient_level_change_reason: assessmentRecord.patient_level_change_reason as string | null,
                    primary_diagnosis: String(assessmentRecord.primary_diagnosis),
                    comorbidities: assessmentRecord.comorbidities as string | null,
                    mobility: String(assessmentRecord.mobility),
                    clinical_content: assessmentRecord.clinical_content as string | null,
                  }}
                />
              </div>
            </div>
          </CascadeItem>
        )}

        {!hasProposal && Boolean(assessmentRecord.clinical_content) && (
          <CascadeItem>
            <div className="rounded-xl border border-border bg-card p-5 text-sm whitespace-pre-wrap">
              <p className="font-semibold mb-2">Conteúdo clínico</p>
              {String(assessmentRecord.clinical_content)}
            </div>
          </CascadeItem>
        )}

        <CascadeItem>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50">
              <span className="text-muted-foreground sm:w-40 shrink-0">Status</span>
              <span className="font-medium">
                {assessmentStatusLabels[String(assessmentRecord.status)] ?? String(assessmentRecord.status)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50">
              <span className="text-muted-foreground sm:w-40 shrink-0">Resposta família</span>
              <span className="font-medium">{String(assessmentRecord.family_response ?? '—')}</span>
            </div>
            {Boolean(assessmentRecord.proposal_sent_at) && (
              <div className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50">
                <span className="text-muted-foreground sm:w-40 shrink-0">Proposta enviada em</span>
                <span className="font-medium">{formatDateTime(String(assessmentRecord.proposal_sent_at))}</span>
              </div>
            )}
            {Boolean(assessmentRecord.response_deadline_at) && (
              <div className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50">
                <span className="text-muted-foreground sm:w-40 shrink-0">Prazo resposta</span>
                <span className="font-medium">{formatDateTime(String(assessmentRecord.response_deadline_at))}</span>
              </div>
            )}
            {Boolean(assessmentRecord.responded_at) && (
              <div className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50">
                <span className="text-muted-foreground sm:w-40 shrink-0">Respondido em</span>
                <span className="font-medium">{formatDateTime(String(assessmentRecord.responded_at))}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:gap-4 py-1">
              <span className="text-muted-foreground sm:w-40 shrink-0">Criado em</span>
              <span className="font-medium">{formatDateTime(String(assessmentRecord.created_at))}</span>
            </div>
          </div>
        </CascadeItem>
      </CascadeReveal>
    </CrudScrollPageLayout>
    </>
  )
}

export { CyclesListPage as CyclesPage } from './cycles/CyclesListPage'

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

export { MedicalRecordsListPage as MedicalRecordsPage } from './medical-records/MedicalRecordsListPage'

export function MedicalRecordPatientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/prontuarios')

  const { data: record, isLoading } = useQuery({
    queryKey: [...qk.records, id],
    queryFn: () =>
      medicalRecordsService.getById(
        id!,
        `id, record_type, content_richtext, recorded_at, crefito_number, session_id, cycle_id,
         patients ( full_name ),
         professionals ( full_name ),
         care_sessions ( session_number, scheduled_at ),
         care_cycles ( cycle_number )`,
      ),
    enabled: !!id,
  })

  const { data: versions = [] } = useQuery({
    queryKey: [...qk.records, id, 'versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_record_versions')
        .select('id, content_richtext, edited_at')
        .eq('medical_record_id', id!)
        .order('edited_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-display font-bold text-xl lg:text-2xl">Prontuário</span>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={6} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!record) {
    return (
      <>
        <PageHeader>
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground">Registro não encontrado.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const patient = record.patients as { full_name?: string } | null
  const professional = record.professionals as { full_name?: string } | null
  const session = record.care_sessions as { session_number?: number; scheduled_at?: string } | null
  const cycle = record.care_cycles as { cycle_number?: number } | null
  const typeLabel = medicalRecordTypeLabels[String(record.record_type)] ?? String(record.record_type)
  const content = record.content_richtext ? sanitizeRichText(String(record.content_richtext)) : ''

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg lg:text-xl truncate">
              {patient?.full_name ?? 'Prontuário'}
            </h1>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">{typeLabel}</Badge>
        </div>
      </PageHeader>
      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-4">
          <CascadeItem>
            <div className="rounded-xl border border-border bg-card p-5 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">Profissional</p>
                <p className="font-medium">{professional?.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CREFITO</p>
                <p className="font-medium">{String(record.crefito_number)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Registrado em</p>
                <p className="font-medium">{formatDateTime(String(record.recorded_at))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sessão / ciclo</p>
                <p className="font-medium">
                  {session?.session_number != null ? `Sessão ${session.session_number}` : '—'}
                  {cycle?.cycle_number != null ? ` · Ciclo ${cycle.cycle_number}` : ''}
                </p>
              </div>
            </div>
          </CascadeItem>

          <CascadeItem>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <PenLine size={12} />
                Registro clínico
              </div>
              {content ? (
                <div
                  className="prose prose-sm max-w-none text-sm text-foreground [&_p]:my-1"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Sem conteúdo registrado.</p>
              )}
            </div>
          </CascadeItem>

          {versions.length > 0 && (
            <CascadeItem>
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Histórico de edições
                </p>
                {versions.map((version) => (
                  <div
                    key={String(version.id)}
                    className={cn('rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2')}
                  >
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(String(version.edited_at))}
                    </p>
                    {version.content_richtext ? (
                      <div
                        className="prose prose-sm max-w-none text-sm text-foreground [&_p]:my-1"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeRichText(String(version.content_richtext)),
                        }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </CascadeItem>
          )}
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
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

export { TreatmentPausesListPage as TreatmentPausesPage } from './treatment-pauses/TreatmentPausesListPage'
export { TreatmentPauseDetailPage } from './treatment-pauses/TreatmentPauseDetailPage'

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
