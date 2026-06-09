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
  Clock,
  CreditCard,
  Plus,
  User,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ProfessionalSearchField } from '@/components/forms/ProfessionalSearchField'
import { FormActions } from '@/components/crud/FormActions'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { cycleStatusLabels, paymentStatusLabels } from '@/constants/labels'
import { careSessionsService } from '@/services/index'
import { cn } from '@/lib/utils'
import { requiredString } from '@/schemas/common'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string
  session_number: number
  scheduled_at: string | null
  status: string
  professional_id: string
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
  patients: { full_name: string } | null
  professionals: { full_name: string; crefito_number: string | null; pp_class: string | null } | null
  care_sessions: Session[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SESSION_STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  realizada: { label: 'Realizada', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  prevista:  { label: 'Prevista',  icon: Clock,         color: 'text-muted-foreground' },
  faltou:    { label: 'Faltou',    icon: AlertTriangle, color: 'text-amber-500' },
  cancelada: { label: 'Cancelada', icon: AlertTriangle, color: 'text-destructive' },
}

const CYCLE_STATUS_COLORS: Record<string, string> = {
  ativo:     'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rascunho:  'bg-muted text-muted-foreground',
  encerrado: 'bg-secondary text-secondary-foreground',
  pausado:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pago:         'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pendente:     'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500',
  parcial:      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  inadimplente: 'bg-destructive/10 text-destructive',
}

// ─── Query ────────────────────────────────────────────────────────────────────

async function fetchCycleDetail(id: string): Promise<CycleDetail> {
  const { data, error } = await supabase
    .from('care_cycles')
    .select(`
      id, cycle_number, session_count, status, payment_status,
      total_amount_cents, session_unit_price_cents,
      started_at, created_at, patient_id, assigned_professional_id,
      patients ( full_name ),
      professionals ( full_name, crefito_number, pp_class ),
      care_sessions (
        id, session_number, scheduled_at, status, professional_id
      )
    `)
    .eq('id', id)
    .order('session_number', { referencedTable: 'care_sessions', ascending: true })
    .single()

  if (error) throw error
  return data as unknown as CycleDetail
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressCard({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const remaining = total - done
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progresso</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="font-display text-3xl font-bold tabular-nums">
          {done} <span className="text-muted-foreground font-normal text-xl">/ {total}</span>
        </p>
        {/* progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {remaining > 0 ? `${remaining} sessões restantes` : 'Ciclo completo 🎉'}
        </p>
      </CardContent>
    </Card>
  )
}

function PaymentCard({ amountCents, paymentStatus }: { amountCents: number; paymentStatus: string }) {
  const colorClass = PAYMENT_STATUS_COLORS[paymentStatus] ?? 'bg-muted text-muted-foreground'
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CreditCard size={12} /> Pagamento
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="font-display text-3xl font-bold tabular-nums">{formatCurrency(amountCents)}</p>
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', colorClass)}>
          {paymentStatusLabels[paymentStatus] ?? paymentStatus}
        </span>
      </CardContent>
    </Card>
  )
}

function ProfessionalCard({
  professional,
  ppPercent,
  amountCents,
  sessionCount,
}: {
  professional: CycleDetail['professionals']
  ppPercent?: number
  amountCents: number
  sessionCount: number
}) {
  if (!professional) return null
  const ppAmount = ppPercent ? Math.round((amountCents * ppPercent) / 100) : null
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User size={12} /> Profissional
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        <p className="font-semibold text-base leading-tight">{professional.full_name}</p>
        {professional.crefito_number && (
          <p className="text-xs text-muted-foreground">CREFITO {professional.crefito_number}</p>
        )}
        {professional.pp_class && (
          <Badge variant="secondary" className="mt-1">Classe {professional.pp_class}</Badge>
        )}
        {ppAmount && (
          <p className="text-xs text-primary font-medium pt-1">
            {formatCurrency(ppAmount)} · repasse após {sessionCount}/{sessionCount} sessões
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SessionCard({ session, index }: { session: Session; index: number }) {
  const cfg = SESSION_STATUS_CONFIG[session.status] ?? SESSION_STATUS_CONFIG.prevista
  const StatusIcon = cfg.icon
  const isDone = session.status === 'realizada'

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors min-w-[72px]',
        isDone
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-900/10'
          : 'border-border bg-card',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Sessão {index + 1}
      </p>
      {session.scheduled_at ? (
        <p className="text-sm font-bold tabular-nums leading-tight">
          {formatDate(session.scheduled_at)}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground italic">—</p>
      )}
      <StatusIcon size={16} className={cn('mt-0.5', cfg.color)} />
    </div>
  )
}

// ─── Add Session Modal ─────────────────────────────────────────────────────────

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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function CycleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [addSessionOpen, setAddSessionOpen] = useState(false)

  const { data: cycle, isLoading, isFetching } = useQuery({
    queryKey: ['care_cycle_detail', id],
    queryFn: () => fetchCycleDetail(id!),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  if (isLoading) {
    return (
      <CrudScrollPageLayout>
        <DetailPageSkeleton fields={6} />
      </CrudScrollPageLayout>
    )
  }

  if (!cycle) {
    return (
      <CrudScrollPageLayout>
        <p className="text-muted-foreground p-6">Ciclo não encontrado.</p>
      </CrudScrollPageLayout>
    )
  }

  const sessions = cycle.care_sessions ?? []
  const doneSessions = sessions.filter((s) => s.status === 'realizada').length
  const nextSessionNumber = sessions.length + 1
  const canAddSession = sessions.length < cycle.session_count
  const cycleStatusColor = CYCLE_STATUS_COLORS[cycle.status] ?? 'bg-muted text-muted-foreground'

  return (
    <CrudScrollPageLayout>
      <CascadeReveal className="space-y-5 pb-8">
        {/* ── Header ── */}
        <CascadeItem>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/ciclos')}>
                <ArrowLeft size={20} />
              </Button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-2xl font-bold">
                    Ciclo #{cycle.cycle_number}
                  </h2>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', cycleStatusColor)}>
                    {cycleStatusLabels[cycle.status] ?? cycle.status}
                  </span>
                </div>
                {cycle.patients && (
                  <p className="text-sm text-muted-foreground mt-0.5">{cycle.patients.full_name}</p>
                )}
              </div>
            </div>
            {isFetching && !isLoading && (
              <RefreshCw size={16} className="animate-spin text-muted-foreground" />
            )}
          </div>
        </CascadeItem>

        {/* ── Info cards ── */}
        <CascadeItem>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ProgressCard done={doneSessions} total={cycle.session_count} />
            <PaymentCard amountCents={cycle.total_amount_cents} paymentStatus={cycle.payment_status} />
            <ProfessionalCard
              professional={cycle.professionals}
              amountCents={cycle.total_amount_cents}
              sessionCount={cycle.session_count}
            />
          </div>
        </CascadeItem>

        {/* ── Session schedule ── */}
        <CascadeItem>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-muted-foreground" />
                <h3 className="font-semibold text-sm">Cronograma de sessões</h3>
                <Badge variant="secondary">{cycle.session_count} sessões</Badge>
              </div>
              {canAddSession && (
                <Button size="sm" variant="outline" onClick={() => setAddSessionOpen(true)}>
                  <Plus size={14} className="mr-1.5" />
                  Agendar sessão
                </Button>
              )}
            </div>

            <div className="p-5">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma sessão agendada ainda.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                  {sessions.map((session, i) => (
                    <SessionCard key={session.id} session={session} index={i} />
                  ))}
                  {/* placeholder slots */}
                  {Array.from({ length: cycle.session_count - sessions.length }).map((_, i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border/60 p-3 text-center opacity-40 min-w-[72px]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Sessão {sessions.length + i + 1}
                      </p>
                      <p className="text-xs text-muted-foreground italic">—</p>
                      <Clock size={14} className="text-muted-foreground mt-0.5" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 px-5 pb-4 text-xs text-muted-foreground">
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
        </CascadeItem>

        {/* ── Metadata ── */}
        <CascadeItem>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2 text-sm">
            <h3 className="font-semibold text-sm mb-3">Detalhes do ciclo</h3>
            {[
              { label: 'Valor por sessão', value: formatCurrency(cycle.session_unit_price_cents) },
              { label: 'Início', value: cycle.started_at ? formatDate(cycle.started_at) : '—' },
              { label: 'Abertura', value: formatDate(cycle.created_at) },
              { label: 'ID', value: cycle.id.slice(0, 8) },
            ].map((row) => (
              <div key={row.label} className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground sm:w-44 shrink-0">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </CascadeItem>
      </CascadeReveal>

      <AddSessionModal
        open={addSessionOpen}
        onOpenChange={setAddSessionOpen}
        cycleId={cycle.id}
        nextSessionNumber={nextSessionNumber}
      />
    </CrudScrollPageLayout>
  )
}
