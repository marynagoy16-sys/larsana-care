import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  PenLine,
  Plus,
  User,
  AlertTriangle,
  Ban,
  RefreshCw,
  Circle,
  Activity,
  PauseCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnalyticsStatCard } from '@/components/dashboard/AnalyticsStatCard'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ProfessionalSearchField } from '@/components/forms/ProfessionalSearchField'
import { FormActions } from '@/components/crud/FormActions'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { cycleStatusLabels, paymentStatusLabels, ppClassLabels } from '@/constants/labels'
import { careSessionsService } from '@/services/index'
import { sanitizeRichText } from '@/lib/sanitize'
import { cn } from '@/lib/utils'
import { RescheduleSessionModal } from '@/components/cycles/RescheduleSessionModal'
import { CancelSessionModal } from '@/components/cycles/CancelSessionModal'
import { FinancialClosurePanel } from '@/components/cycles/FinancialClosurePanel'
import { InitiatePauseModal } from '@/components/cycles/InitiatePauseModal'
import { requiredString } from '@/schemas/common'

interface MedicalRecordSummary {
  id: string
  content_richtext: string | null
  crefito_number: string
  recorded_at: string
  professionals: { full_name: string } | null
}

interface Session {
  id: string
  session_number: number
  scheduled_at: string | null
  status: string
  professional_id: string
  medical_records: MedicalRecordSummary[] | MedicalRecordSummary | null
}

interface CycleDetail {
  id: string
  cycle_number: number
  session_count: number
  status: string
  payment_status: string
  total_amount_cents: number
  session_unit_price_cents: number
  started_at: string | null
  created_at: string
  patient_id: string
  assigned_professional_id: string
  reschedule_count_consecutive: number
  patients: { full_name: string } | null
  professionals: {
    full_name: string
    pp_class: string | null
    professional_councils: { council_type: string; registration_number: string }[] | { council_type: string; registration_number: string } | null
  } | null
  care_sessions: Session[]
}

interface SessionSlot {
  number: number
  session: Session | null
}

const SESSION_STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string; badge: string }> = {
  realizada: {
    label: 'Concluída',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  prevista: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
  },
  remarcada: {
    label: 'Remarcada',
    icon: RefreshCw,
    color: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  falta: {
    label: 'Falta',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  intercorrencia: {
    label: 'Intercorrência',
    icon: AlertTriangle,
    color: 'text-destructive',
    badge: 'bg-destructive/10 text-destructive',
  },
  cancelada_sem_justificativa: {
    label: 'Cancelada 50%',
    icon: Ban,
    color: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  },
}

const CYCLE_STATUS_COLORS: Record<string, string> = {
  ativo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rascunho: 'bg-muted text-muted-foreground',
  encerrado: 'bg-secondary text-secondary-foreground',
  em_pausa: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500',
  em_analise: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  fechado_financeiramente: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  aguardando_pagamento: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500',
  cancelado: 'bg-destructive/10 text-destructive',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pago: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500',
  vencido: 'bg-destructive/10 text-destructive',
  cancelado: 'bg-muted text-muted-foreground',
}

async function fetchCycleDetail(id: string): Promise<CycleDetail> {
  const { data, error } = await supabase
    .from('care_cycles')
    .select(`
      id, cycle_number, session_count, status, payment_status,
      total_amount_cents, session_unit_price_cents,
      started_at, created_at, patient_id, assigned_professional_id,
      reschedule_count_consecutive,
      patients ( full_name ),
      professionals (
        full_name,
        pp_class,
        professional_councils ( council_type, registration_number )
      ),
      care_sessions (
        id, session_number, scheduled_at, status, professional_id,
        medical_records (
          id, content_richtext, crefito_number, recorded_at,
          professionals ( full_name )
        )
      )
    `)
    .eq('id', id)
    .order('session_number', { referencedTable: 'care_sessions', ascending: true })
    .single()

  if (error) throw error
  return data as unknown as CycleDetail
}

function normalizeMedicalRecords(
  records: MedicalRecordSummary[] | MedicalRecordSummary | null | undefined,
): MedicalRecordSummary[] {
  if (!records) return []
  return Array.isArray(records) ? records : [records]
}

function getProfessionalCrefito(
  professional: CycleDetail['professionals'],
): string | null {
  const councils = professional?.professional_councils
  if (!councils) return null
  const list = Array.isArray(councils) ? councils : [councils]
  return list.find((c) => c.council_type === 'CREFITO')?.registration_number ?? null
}

function buildSessionSlots(cycle: CycleDetail): SessionSlot[] {
  const sessionsByNumber = new Map(
    (cycle.care_sessions ?? []).map((session) => [session.session_number, session]),
  )

  return Array.from({ length: cycle.session_count }, (_, index) => ({
    number: index + 1,
    session: sessionsByNumber.get(index + 1) ?? null,
  }))
}

function ProgressCard({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const remaining = total - done

  return (
    <AnalyticsStatCard
      label="Progresso"
      icon={Activity}
      value={`${done} / ${total}`}
      showLinkIcon={false}
      footer={
        <>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining > 0
              ? `${remaining} sessão${remaining === 1 ? '' : 'ões'} restante${remaining === 1 ? '' : 's'}`
              : 'Ciclo completo'}
          </p>
        </>
      }
    />
  )
}

function PaymentCard({
  amountCents,
  unitPriceCents,
  paymentStatus,
}: {
  amountCents: number
  unitPriceCents: number
  paymentStatus: string
}) {
  const colorClass = PAYMENT_STATUS_COLORS[paymentStatus] ?? 'bg-muted text-muted-foreground'

  return (
    <AnalyticsStatCard
      label="Pagamento"
      icon={CreditCard}
      value={formatCurrency(amountCents)}
      showLinkIcon={false}
      footer={
        <>
          <p className="text-xs text-muted-foreground">
            Valor por sessão:{' '}
            <span className="font-medium text-foreground">{formatCurrency(unitPriceCents)}</span>
          </p>
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', colorClass)}>
            {paymentStatusLabels[paymentStatus] ?? paymentStatus}
          </span>
        </>
      }
    />
  )
}

function ProfessionalCard({ professional }: { professional: CycleDetail['professionals'] }) {
  const crefitoNumber = professional ? getProfessionalCrefito(professional) : null

  return (
    <AnalyticsStatCard
      label="Profissional"
      icon={User}
      value={professional?.full_name ?? 'Não alocado'}
      showLinkIcon={false}
      valueClassName={cn(
        professional && 'text-lg sm:text-xl truncate proportional-nums',
        !professional && 'text-base sm:text-lg text-muted-foreground font-semibold',
      )}
      footer={
        professional ? (
          <>
            {crefitoNumber && (
              <p className="text-xs text-muted-foreground">CREFITO {crefitoNumber}</p>
            )}
            {professional.pp_class && (
              <Badge variant="secondary">{ppClassLabels[professional.pp_class] ?? professional.pp_class}</Badge>
            )}
          </>
        ) : undefined
      }
    />
  )
}

function RecordSignature({ record }: { record: MedicalRecordSummary }) {
  const professionalName = record.professionals?.full_name ?? 'Profissional'

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-1">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <PenLine size={12} />
        Assinatura do profissional
      </div>
      <p className="font-semibold text-sm pt-1">{professionalName}</p>
      <p className="text-xs text-muted-foreground">CREFITO {record.crefito_number}</p>
      <p className="text-xs text-muted-foreground">Registrado em {formatDateTime(record.recorded_at)}</p>
    </div>
  )
}

function SessionScheduleItem({
  slot,
  expanded,
  onToggle,
  onReschedule,
  onCancel,
  canReschedule,
  canCancel,
}: {
  slot: SessionSlot
  expanded: boolean
  onToggle: () => void
  onReschedule?: (session: Session) => void
  onCancel?: (session: Session) => void
  canReschedule?: boolean
  canCancel?: boolean
}) {
  const { session, number } = slot
  const status = session?.status ?? 'prevista'
  const cfg = SESSION_STATUS_CONFIG[status] ?? SESSION_STATUS_CONFIG.prevista
  const StatusIcon = cfg.icon
  const isDone = status === 'realizada'
  const records = normalizeMedicalRecords(session?.medical_records)
  const primaryRecord = records[0] ?? null
  const canExpand = isDone
  const showReschedule = canReschedule && session && (status === 'prevista' || status === 'remarcada')
  const showCancel = canCancel && session && (status === 'prevista' || status === 'remarcada')

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={canExpand ? onToggle : undefined}
          disabled={!canExpand}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-3 text-left transition-colors',
            canExpand && 'hover:bg-muted/30 cursor-pointer',
            !canExpand && 'cursor-default',
          )}
        >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs font-bold">
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Sessão {number}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {session?.scheduled_at ? formatDate(session.scheduled_at) : 'Data a definir'}
          </p>
        </div>

        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0', cfg.badge)}>
          <StatusIcon size={12} className={cfg.color} />
          {cfg.label}
        </span>

        {canExpand ? (
          <ChevronDown
            size={16}
            className={cn('shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
          />
        ) : (
          <Circle size={8} className="shrink-0 text-muted-foreground/30" />
        )}
        </button>

        {showReschedule && onReschedule && session && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => onReschedule(session)}
          >
            <RefreshCw size={14} className="mr-1" />
            Remarcar
          </Button>
        )}
        {showCancel && onCancel && session && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-orange-700 border-orange-200 hover:bg-orange-50"
            onClick={() => onCancel(session)}
          >
            <Ban size={14} className="mr-1" />
            Cancelar 50%
          </Button>
        )}
      </div>

      {expanded && isDone && (
        <div className="border-t border-border bg-muted/20 px-4 py-4 space-y-4">
          {primaryRecord?.content_richtext ? (
            <div
              className="prose prose-sm max-w-none text-sm text-foreground [&_p]:my-1"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(primaryRecord.content_richtext) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Evolução clínica ainda não registrada para esta sessão.</p>
          )}
          {primaryRecord && <RecordSignature record={primaryRecord} />}
        </div>
      )}
    </div>
  )
}

function SessionScheduleSection({
  cycle,
  slots,
  onAddSession,
  onReschedule,
  onCancel,
}: {
  cycle: CycleDetail
  slots: SessionSlot[]
  onAddSession: () => void
  onReschedule: (session: Session) => void
  onCancel: (session: Session) => void
}) {
  const [expandedSession, setExpandedSession] = useState<number | null>(null)
  const sessions = cycle.care_sessions ?? []
  const canAddSession = sessions.length < cycle.session_count
  const canReschedule = ['ativo', 'em_pausa'].includes(cycle.status)
  const canCancel = canReschedule && cycle.payment_status === 'pago'

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <h3 className="font-semibold text-sm">Cronograma de sessões</h3>
          <Badge variant="secondary">{cycle.session_count} sessões</Badge>
        </div>
        {canAddSession && (
          <Button size="sm" variant="outline" onClick={onAddSession}>
            <Plus size={14} className="mr-1.5" />
            Agendar sessão
          </Button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {slots.map((slot) => (
          <SessionScheduleItem
            key={slot.number}
            slot={slot}
            expanded={expandedSession === slot.number}
            onToggle={() =>
              setExpandedSession((current) => (current === slot.number ? null : slot.number))
            }
            onReschedule={onReschedule}
            onCancel={onCancel}
            canReschedule={canReschedule}
            canCancel={canCancel}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-4 px-5 pb-4 text-xs text-muted-foreground border-t border-border pt-3">
        {Object.entries(SESSION_STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <span key={key} className="flex items-center gap-1">
              <Icon size={12} className={cfg.color} />
              {cfg.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

const addSessionSchema = z.object({
  professional_id: z.string().uuid('Selecione um profissional'),
  scheduled_at: requiredString('Data/hora'),
})

function AddSessionModal({
  open,
  onOpenChange,
  cycleId,
  nextSessionNumber,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  cycleId: string
  nextSessionNumber: number
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof addSessionSchema>>({
    resolver: zodResolver(addSessionSchema) as never,
    defaultValues: { professional_id: '', scheduled_at: '' },
  })
  const create = useCrudMutation({
    mutationFn: (v: z.infer<typeof addSessionSchema>) =>
      careSessionsService.create({
        cycle_id: cycleId,
        professional_id: v.professional_id,
        session_number: nextSessionNumber,
        scheduled_at: v.scheduled_at,
        status: 'prevista',
      }),
    queryKey: ['care_cycles'],
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['care_cycle_detail', cycleId] })
    },
  })

  return (
    <CrudModal open={open} onOpenChange={onOpenChange} title={`Agendar sessão #${nextSessionNumber}`}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField
            control={form.control}
            name="professional_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional</FormLabel>
                <FormControl>
                  <ProfessionalSearchField value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduled_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e hora</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={create.isPending} />
        </form>
      </Form>
    </CrudModal>
  )
}

function CycleDetailPageHeader({
  onBack,
  cycleNumber,
  status,
  patientName,
  isFetching,
  loading,
  notFound,
}: {
  onBack: () => void
  cycleNumber?: number
  status?: string
  patientName?: string | null
  isFetching?: boolean
  loading?: boolean
  notFound?: boolean
}) {
  const cycleStatusColor = status ? CYCLE_STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground' : ''

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap min-w-0 flex-1">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 rounded-xl" aria-label="Voltar">
          <ArrowLeft size={20} />
        </Button>
        {loading ? (
          <div className="space-y-1.5 min-w-0">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : notFound ? (
          <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight">
            Ciclo não encontrado
          </h1>
        ) : (
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight">
                Ciclo #{cycleNumber}
              </h1>
              {status && (
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0', cycleStatusColor)}>
                  {cycleStatusLabels[status] ?? status}
                </span>
              )}
            </div>
            {patientName && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{patientName}</p>
            )}
          </div>
        )}
      </div>
      {isFetching && !loading && (
        <RefreshCw size={16} className="animate-spin text-muted-foreground shrink-0" />
      )}
    </div>
  )
}

export function CycleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [addSessionOpen, setAddSessionOpen] = useState(false)
  const [rescheduleSession, setRescheduleSession] = useState<Session | null>(null)
  const [cancelSession, setCancelSession] = useState<Session | null>(null)
  const [pauseModalOpen, setPauseModalOpen] = useState(false)

  const { data: cycle, isLoading, isFetching } = useQuery({
    queryKey: ['care_cycle_detail', id],
    queryFn: () => fetchCycleDetail(id!),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const goBack = () => navigate('/admin/ciclos')

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <CycleDetailPageHeader onBack={goBack} loading />
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={6} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!cycle) {
    return (
      <>
        <PageHeader>
          <CycleDetailPageHeader onBack={goBack} notFound />
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground p-6">Ciclo não encontrado.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const sessions = cycle.care_sessions ?? []
  const doneSessions = sessions.filter((s) => s.status === 'realizada').length
  const nextSessionNumber = sessions.length > 0
    ? Math.max(...sessions.map((s) => s.session_number)) + 1
    : 1
  const sessionSlots = buildSessionSlots(cycle)

  return (
    <>
      <PageHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap min-w-0 flex-1">
          <CycleDetailPageHeader
            onBack={goBack}
            cycleNumber={cycle.cycle_number}
            status={cycle.status}
            patientName={cycle.patients?.full_name}
            isFetching={isFetching}
          />
          {['ativo', 'em_analise'].includes(cycle.status) && (
            <Button variant="outline" size="sm" onClick={() => setPauseModalOpen(true)} className="shrink-0">
              <PauseCircle size={14} className="mr-1.5" />
              Registrar pausa
            </Button>
          )}
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          <CascadeItem>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              <ProgressCard done={doneSessions} total={cycle.session_count} />
              <PaymentCard
                amountCents={cycle.total_amount_cents}
                unitPriceCents={cycle.session_unit_price_cents}
                paymentStatus={cycle.payment_status}
              />
              <ProfessionalCard professional={cycle.professionals} />
            </div>
          </CascadeItem>

        <CascadeItem>
          <SessionScheduleSection
            cycle={cycle}
            slots={sessionSlots}
            onAddSession={() => setAddSessionOpen(true)}
            onReschedule={setRescheduleSession}
            onCancel={setCancelSession}
          />
        </CascadeItem>

        <CascadeItem>
          <FinancialClosurePanel
            cycleId={cycle.id}
            sessionsCompleted={doneSessions}
            sessionCount={cycle.session_count}
            cycleStatus={cycle.status}
            onClosed={() => queryClient.invalidateQueries({ queryKey: ['care_cycle_detail', id] })}
          />
        </CascadeItem>

        <CascadeItem>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Detalhes do ciclo</h3>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              {[
                { label: 'Valor por sessão', value: formatCurrency(cycle.session_unit_price_cents) },
                { label: 'Início', value: cycle.started_at ? formatDate(cycle.started_at) : '—' },
                { label: 'Remarcações consecutivas', value: String(cycle.reschedule_count_consecutive ?? 0) },
                { label: 'Abertura', value: formatDate(cycle.created_at) },
              ].map((row) => (
                <div key={row.label} className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground sm:w-44 shrink-0">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CascadeItem>
      </CascadeReveal>

      <AddSessionModal
        open={addSessionOpen}
        onOpenChange={setAddSessionOpen}
        cycleId={cycle.id}
        nextSessionNumber={nextSessionNumber}
      />

      {rescheduleSession && (
        <RescheduleSessionModal
          open={!!rescheduleSession}
          onOpenChange={(open) => !open && setRescheduleSession(null)}
          sessionId={rescheduleSession.id}
          sessionNumber={rescheduleSession.session_number}
          nextSequenceNumber={(cycle.reschedule_count_consecutive ?? 0) + 1}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['care_cycle_detail', id] })}
        />
      )}

      {cancelSession && (
        <CancelSessionModal
          open={!!cancelSession}
          onOpenChange={(open) => !open && setCancelSession(null)}
          sessionId={cancelSession.id}
          sessionNumber={cancelSession.session_number}
          scheduledAt={cancelSession.scheduled_at}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['care_cycle_detail', id] })}
        />
      )}

      <InitiatePauseModal
        open={pauseModalOpen}
        onOpenChange={setPauseModalOpen}
        cycleId={cycle.id}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['care_cycle_detail', id] })}
      />
      </CrudScrollPageLayout>
    </>
  )
}
