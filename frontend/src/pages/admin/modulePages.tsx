import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowLeft, ClipboardList, Clock, PenLine, Search } from 'lucide-react'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudEmptyState } from '@/components/crud/CrudEmptyState'
import { ListToolbar } from '@/components/crud/list-page/ListToolbar'
import { CrudListPageLayout } from '@/components/crud/list-page/CrudListPageLayout'
import { StatsCardRow } from '@/components/crud/list-page/StatsCardRow'
import { buildEntityListStats } from '@/lib/buildEntityListStats'
import { buildChargesStatCards } from '@/lib/chargesListStats'
import {
  listStaffCharges,
  CHARGE_KIND_LABELS,
  formatChargeDueHint,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_ORDER,
  type ChargeListItem,
  type PaymentMethod,
  type PaymentStatus,
} from '@/services/charges'
import { FaturamentoCharts } from '@/components/admin/finance/FaturamentoCharts'
import { PaymentStatusBadge } from '@/components/admin/finance/PaymentStatusVisual'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
  transfersService,
  supportTicketsService,
  profilesService,
  contractTemplatesService,
  npsSurveysService,
} from '@/services/index'
import {
  listSubRepassesStaff,
  listStaffCycleTransfers,
  formatRepasseWaitingLabel,
  transferHasInvoice,
  type SubRepasseDetail,
  type TransferListItem,
} from '@/services/transfers'
import { RepasseStatusBadge } from '@/components/profissional/repasses/RepasseStatusVisual'
import {
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_ORDER,
  type TransferStatus,
} from '@/services/ppTransfers'
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
  nps: ['nps_surveys'] as const,
  reportsFaturamento: ['reports', 'faturamento'] as const,
  reportsConversao: ['reports', 'conversao'] as const,
  reportsHorasCrefito: ['reports', 'horas-crefito'] as const,
  reportsRepassesAging: ['reports', 'repasses-aging'] as const,
}

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
              queryKeys={[[...qk.assessments], [...qk.assessments, id]]}
            />
          </CascadeItem>
        )}

        {(assessmentRecord.status === 'em_analise' ||
          (assessmentRecord.status === 'avaliacao_feita' &&
            assessmentRecord.level_change_review_status !== 'pendente')) &&
          hasProposal && (
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
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')

  const statusSelect = (
    <Select
      value={statusFilter}
      onValueChange={(value) => setStatusFilter(value as 'all' | PaymentStatus)}
    >
      <SelectTrigger className="h-9 w-[168px] shrink-0">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os status</SelectItem>
        {PAYMENT_STATUS_ORDER.map((status) => (
          <SelectItem key={status} value={status}>
            {paymentStatusLabels[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const chargeStats = useMemo(
    () => (_rows: ChargeListItem[], filteredRows: ChargeListItem[]) =>
      buildChargesStatCards(filteredRows),
    [],
  )

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
      <EntityListPage<ChargeListItem>
        title="Cobranças"
        queryKey={qk.charges}
        queryFn={listStaffCharges}
        buildStats={chargeStats}
        statsColumns={4}
        onCreate={() => setOpen(true)}
        createLabel="Nova cobrança"
        searchPlaceholder="Pesquisar cobranças..."
        searchAccessory={statusSelect}
        filterResetKey={statusFilter}
        rowFilter={statusFilter === 'all' ? undefined : (row) => row.payment_status === statusFilter}
        getSearchText={(row) =>
          [
            row.patients?.full_name,
            row.description,
            CHARGE_KIND_LABELS[row.charge_kind],
            row.payment_method
              ? PAYMENT_METHOD_LABELS[row.payment_method as PaymentMethod] ?? row.payment_method
              : '',
            paymentStatusLabels[row.payment_status],
            formatCurrency(row.amount_cents),
            row.due_date ? formatDate(row.due_date) : '',
            formatDateTime(row.created_at),
          ]
            .filter(Boolean)
            .join(' ')
        }
        onRowClick={(r) => navigate(`/admin/cobrancas/${r.id}`)}
        columns={[
          {
            key: 'patient',
            header: 'Paciente',
            mobilePrimary: true,
            cell: (r) => r.patients?.full_name ?? '—',
          },
          {
            key: 'kind',
            header: 'Tipo',
            cell: (r) => CHARGE_KIND_LABELS[r.charge_kind] ?? r.charge_kind,
          },
          {
            key: 'amount',
            header: 'Valor',
            cell: (r) => formatCurrency(r.amount_cents),
          },
          {
            key: 'method',
            header: 'Método',
            mobileHidden: true,
            cell: (r) =>
              r.payment_method
                ? PAYMENT_METHOD_LABELS[r.payment_method as PaymentMethod] ?? r.payment_method
                : '—',
          },
          {
            key: 'due',
            header: 'Vencimento',
            cell: (r) => {
              const hint = formatChargeDueHint(r.due_date, r.payment_status)
              return (
                <div className="min-w-0">
                  <p className="tabular-nums">{r.due_date ? formatDate(r.due_date) : '—'}</p>
                  {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
                </div>
              )
            },
          },
          {
            key: 'status',
            header: 'Status',
            cell: (r) => (
              <PaymentStatusBadge
                status={r.payment_status}
                label={paymentStatusLabels[r.payment_status] ?? r.payment_status}
              />
            ),
          },
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

export function TransfersPage() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<'ciclo' | 'sub'>('ciclo')
  const [statusFilter, setStatusFilter] = useState<'all' | TransferStatus>('all')
  const [subSearch, setSubSearch] = useState('')

  const kindSelect = (
    <Select value={kind} onValueChange={(value) => setKind(value as 'ciclo' | 'sub')}>
      <SelectTrigger className="h-9 w-[132px] shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ciclo">Ciclo</SelectItem>
        <SelectItem value="sub">SUB avulso</SelectItem>
      </SelectContent>
    </Select>
  )

  const statusSelect = (
    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | TransferStatus)}>
      <SelectTrigger className="h-9 w-[168px] shrink-0">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os status</SelectItem>
        {TRANSFER_STATUS_ORDER.map((status) => (
          <SelectItem key={status} value={status}>
            {TRANSFER_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const toolbarFilters = (
    <div className="flex items-center gap-2 shrink-0">
      {statusSelect}
      {kindSelect}
    </div>
  )

  const { data: subRows, isLoading: subLoading, isFetching: subFetching, refetch: refetchSub } = useQuery({
    queryKey: ['sub-repasses'],
    queryFn: listSubRepassesStaff,
    enabled: kind === 'sub',
  })

  const filteredSubRows = useMemo(() => {
    if (!subRows?.length) return []
    let rows = subRows
    if (statusFilter !== 'all') {
      rows = rows.filter((row) => row.status === statusFilter)
    }
    const query = subSearch.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => {
      const haystack = [
        row.substitute?.full_name,
        row.patients?.full_name,
        row.care_cycles?.cycle_number != null ? `ciclo ${row.care_cycles.cycle_number}` : '',
        row.status,
        TRANSFER_STATUS_LABELS[row.status],
        formatCurrency(row.amount_cents),
        String(row.session_number),
        formatDateTime(row.created_at),
        row.transferred_at ? formatDateTime(row.transferred_at) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [subRows, subSearch, statusFilter])

  const subStatCards = useMemo(() => {
    const allRows = subRows ?? []
    const cards = buildEntityListStats(allRows, filteredSubRows, {
      title: 'Repasses',
      search: subSearch || (statusFilter !== 'all' ? statusFilter : ''),
      page: 0,
      pageSize: Math.max(filteredSubRows.length, 1),
      pageCount: filteredSubRows.length,
    })
    if (cards.length > 0) {
      return [{ ...cards[0], footer: 'Repasse avulso SUB por sessão' }, ...cards.slice(1)]
    }
    return cards
  }, [subRows, filteredSubRows, subSearch, statusFilter])

  if (kind === 'sub') {
    return (
      <CrudListPageLayout>
        <div className="space-y-4">
          <StatsCardRow cards={subStatCards} columns={4} isLoading={subLoading} />
          <ListToolbar
            search={subSearch}
            onSearchChange={setSubSearch}
            searchPlaceholder="Pesquisar repasses..."
            searchAccessory={toolbarFilters}
            onRefresh={() => void refetchSub()}
            isRefreshing={subFetching}
          />
          {subLoading ? (
            <p className="text-sm text-muted-foreground">Carregando repasses SUB…</p>
          ) : filteredSubRows.length === 0 ? (
            <CrudEmptyState
              message={
                subSearch.trim() || statusFilter !== 'all'
                  ? 'Nenhum repasse SUB encontrado com os filtros atuais.'
                  : 'Nenhum repasse SUB registrado.'
              }
              muted
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
              {filteredSubRows.map((row: SubRepasseDetail) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => navigate(`/admin/repasses/sub/${row.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(row.amount_cents)}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        SUB
                      </Badge>
                      <RepasseStatusBadge
                        status={row.status}
                        label={TRANSFER_STATUS_LABELS[row.status] ?? row.status}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.patients?.full_name ?? 'Paciente'} ·{' '}
                      {row.care_cycles?.cycle_number != null ? `Ciclo #${row.care_cycles.cycle_number}` : 'Ciclo'} ·{' '}
                      {row.substitute?.full_name ?? 'Substituto'} · Sessão {row.session_number}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      Gerado {formatDateTime(row.created_at)}
                      {row.transferred_at ? ` · Transferido ${formatDateTime(row.transferred_at)}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </CrudListPageLayout>
    )
  }

  return (
    <EntityListPage<TransferListItem>
      title="Repasses"
      description="Repasse pós-ciclo com NF"
      queryKey={qk.transfers}
      queryFn={listStaffCycleTransfers}
      searchPlaceholder="Pesquisar repasses..."
      searchAccessory={toolbarFilters}
      filterResetKey={`${kind}-${statusFilter}`}
      rowFilter={statusFilter === 'all' ? undefined : (row) => row.status === statusFilter}
      getSearchText={(row) => {
        const waiting = formatRepasseWaitingLabel(row.created_at, row.status)
        return [
          row.professionals?.full_name,
          row.care_cycles?.patients?.full_name,
          row.care_cycles?.cycle_number != null ? `ciclo ${row.care_cycles.cycle_number}` : '',
          formatCurrency(row.pp_transfer_amount_cents),
          row.status,
          TRANSFER_STATUS_LABELS[row.status] ?? '',
          formatDateTime(row.created_at),
          row.transferred_at ? formatDateTime(row.transferred_at) : '',
          waiting,
        ]
          .filter(Boolean)
          .join(' ')
      }}
      onRowClick={(r) => navigate(`/admin/repasses/${r.id}`)}
      columns={[
        {
          key: 'professional',
          header: 'Profissional',
          mobilePrimary: true,
          cell: (r) => r.professionals?.full_name ?? '—',
        },
        {
          key: 'patient',
          header: 'Paciente',
          cell: (r) => r.care_cycles?.patients?.full_name ?? '—',
        },
        {
          key: 'cycle',
          header: 'Ciclo',
          cell: (r) =>
            r.care_cycles?.cycle_number != null ? `#${r.care_cycles.cycle_number}` : '—',
        },
        {
          key: 'created_at',
          header: 'Gerado em',
          cell: (r) => {
            const waiting = formatRepasseWaitingLabel(r.created_at, r.status)
            return (
              <div className="min-w-0">
                <p className="tabular-nums">{formatDateTime(r.created_at)}</p>
                {waiting ? (
                  <p className="text-xs text-muted-foreground">{waiting} aguardando</p>
                ) : r.transferred_at ? (
                  <p className="text-xs text-muted-foreground">
                    Transferido {formatDateTime(r.transferred_at)}
                  </p>
                ) : null}
              </div>
            )
          },
        },
        {
          key: 'amount',
          header: 'Repasse PP',
          cell: (r) => formatCurrency(r.pp_transfer_amount_cents),
        },
        {
          key: 'nf',
          header: 'NF',
          mobileHidden: true,
          cell: (r) => {
            if (r.status === 'aguardando_nf') return 'Pendente'
            if (transferHasInvoice(r)) return 'Enviada'
            return '—'
          },
        },
        {
          key: 'status',
          header: 'Status',
          cell: (r) => (
            <RepasseStatusBadge
              status={r.status}
              label={TRANSFER_STATUS_LABELS[r.status] ?? r.status}
            />
          ),
        },
      ]}
    />
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

export { TermsConfigPage } from '@/pages/admin/config/TermsConfigPage'

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

export function FaturamentoReportPage() {
  return (
    <EntityListPage<ChargeListItem>
      title="Faturamento"
      description="Receitas e cobranças emitidas"
      queryKey={qk.reportsFaturamento}
      queryFn={listStaffCharges}
      showStats={false}
      renderAfterStats={(filteredRows) => <FaturamentoCharts rows={filteredRows} />}
      searchPlaceholder="Pesquisar faturamento..."
      getSearchText={(row) =>
        [
          row.patients?.full_name,
          row.description,
          CHARGE_KIND_LABELS[row.charge_kind],
          paymentStatusLabels[row.payment_status],
          formatCurrency(row.amount_cents),
          row.due_date ? formatDate(row.due_date) : '',
          formatDateTime(row.created_at),
        ]
          .filter(Boolean)
          .join(' ')
      }
      columns={[
        {
          key: 'patient',
          header: 'Paciente',
          cell: (r) => String(r.patients?.full_name ?? '—'),
          mobilePrimary: true,
        },
        {
          key: 'amount',
          header: 'Valor',
          cell: (r) => formatCurrency(r.amount_cents),
        },
        {
          key: 'status',
          header: 'Status',
          cell: (r) => <PaymentStatusBadge status={r.payment_status} />,
        },
        {
          key: 'kind',
          header: 'Tipo',
          cell: (r) => CHARGE_KIND_LABELS[r.charge_kind],
        },
        {
          key: 'due',
          header: 'Vencimento',
          cell: (r) => (r.due_date ? formatDate(r.due_date) : '—'),
        },
        {
          key: 'date',
          header: 'Emitido em',
          cell: (r) => formatDateTime(r.created_at),
        },
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
