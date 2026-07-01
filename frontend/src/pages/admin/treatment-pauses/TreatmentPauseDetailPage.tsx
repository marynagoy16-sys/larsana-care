import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, PauseCircle, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { FinancialClosurePanel } from '@/components/cycles/FinancialClosurePanel'
import {
  formatPauseDuration,
  getTreatmentPauseStatusLabel,
  isTreatmentPauseActive,
  type TreatmentPauseListRow,
} from '@/lib/treatmentPausesDisplay'
import { formatDateTime } from '@/lib/formatters'
import { careStatusLabels, pauseTypeLabels } from '@/constants/labels'
import { treatmentPausesService } from '@/services/index'
import { resumeTreatment } from '@/services/financialClosure'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const PAUSE_DETAIL_SELECT = `
  id, patient_id, paused_at, resumed_at, reason, created_at, created_by,
  patients ( full_name, care_status ),
  creator:profiles!treatment_pauses_created_by_fkey ( full_name )
`

interface PauseEventRow {
  id: string
  cycle_id: string
  pause_type: string
  justification: string | null
  admin_decision: string | null
  financial_closure_id: string | null
  closed_at: string | null
  care_cycles: {
    id: string
    cycle_number: number
    status: string
    session_count: number
    care_sessions: { status: string }[]
  } | null
}

async function fetchPauseEvent(treatmentPauseId: string): Promise<PauseEventRow | null> {
  const { data, error } = await supabase
    .from('pause_events')
    .select(`
      id, cycle_id, pause_type, justification, admin_decision,
      financial_closure_id, closed_at,
      care_cycles (
        id, cycle_number, status, session_count,
        care_sessions ( status )
      )
    `)
    .eq('treatment_pause_id', treatmentPauseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as unknown as PauseEventRow | null
}

export function TreatmentPauseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const goBack = () => navigate('/admin/pausas')

  const { data: pause, isLoading } = useQuery({
    queryKey: ['treatment_pauses', id],
    queryFn: async () => {
      const row = await treatmentPausesService.getById(id!, PAUSE_DETAIL_SELECT)
      return row as unknown as TreatmentPauseListRow | null
    },
    enabled: !!id,
  })

  const { data: pauseEvent } = useQuery({
    queryKey: ['pause_events', id],
    queryFn: () => fetchPauseEvent(id!),
    enabled: !!id,
  })

  const resumeMutation = useMutation({
    mutationFn: () => resumeTreatment(pauseEvent!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment_pauses', id] })
      queryClient.invalidateQueries({ queryKey: ['pause_events', id] })
    },
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-display font-bold text-lg lg:text-xl">Pausa de tratamento</span>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={6} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!pause) {
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
          <p className="text-muted-foreground">Pausa não encontrada.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const patient = pause.patients as { full_name?: string; care_status?: string } | null
  const creator = pause.creator as { full_name?: string } | null
  const active = isTreatmentPauseActive(pause)
  const statusLabel = getTreatmentPauseStatusLabel(pause)
  const careStatus = patient?.care_status
    ? careStatusLabels[String(patient.care_status)] ?? String(patient.care_status)
    : '—'

  const cycle = pauseEvent?.care_cycles
  const sessionsCompleted = cycle?.care_sessions?.filter((s) => s.status === 'realizada').length ?? 0

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg lg:text-xl truncate">
              {patient?.full_name ?? 'Pausa de tratamento'}
            </h1>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'ml-auto shrink-0 font-normal',
              active
                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
                : 'bg-primary/10 text-primary border-primary/20',
            )}
          >
            {statusLabel}
          </Badge>
        </div>
      </PageHeader>
      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-4 pb-8">
          {active && pauseEvent && !pauseEvent.financial_closure_id && (
            <CascadeItem>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => resumeMutation.mutate()}
                  disabled={resumeMutation.isPending}
                >
                  <PlayCircle size={16} className="mr-1.5" />
                  Retomar tratamento
                </Button>
                {cycle && (
                  <Button variant="secondary" asChild>
                    <Link to={`/admin/ciclos/${cycle.id}`}>
                      Ver ciclo #{cycle.cycle_number}
                    </Link>
                  </Button>
                )}
              </div>
            </CascadeItem>
          )}

          <CascadeItem>
            <div className="rounded-xl border border-border bg-card p-5 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">Paciente</p>
                <Link
                  to={`/admin/pacientes/${String(pause.patient_id)}`}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {patient?.full_name ?? '—'}
                  <ExternalLink size={14} className="shrink-0" />
                </Link>
              </div>
              <div>
                <p className="text-muted-foreground">Status do paciente</p>
                <p className="font-medium">{careStatus}</p>
              </div>
              {pauseEvent && (
                <>
                  <div>
                    <p className="text-muted-foreground">Tipo de pausa</p>
                    <p className="font-medium">
                      {pauseTypeLabels[pauseEvent.pause_type] ?? pauseEvent.pause_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ciclo vinculado</p>
                    {cycle ? (
                      <Link
                        to={`/admin/ciclos/${cycle.id}`}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        Ciclo #{cycle.cycle_number}
                        <ExternalLink size={14} className="shrink-0" />
                      </Link>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </>
              )}
              <div>
                <p className="text-muted-foreground">Início da pausa</p>
                <p className="font-medium">{formatDateTime(String(pause.paused_at))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Retorno</p>
                <p className="font-medium">
                  {pause.resumed_at ? formatDateTime(String(pause.resumed_at)) : 'Ainda em pausa'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Duração</p>
                <p className="font-medium">
                  {formatPauseDuration(String(pause.paused_at), pause.resumed_at as string | null | undefined)}
                  {!active ? '' : ' (em andamento)'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Registrado por</p>
                <p className="font-medium">{creator?.full_name ?? '—'}</p>
              </div>
            </div>
          </CascadeItem>

          <CascadeItem>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <PauseCircle size={12} />
                Motivo da pausa
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {String(pauseEvent?.justification ?? pause.reason ?? '').trim() || 'Motivo não informado.'}
              </p>
              {pauseEvent?.admin_decision && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Decisão administrativa</p>
                  <p className="text-sm whitespace-pre-wrap">{pauseEvent.admin_decision}</p>
                </div>
              )}
            </div>
          </CascadeItem>

          {cycle && pauseEvent && !pauseEvent.financial_closure_id && (
            <CascadeItem>
              <FinancialClosurePanel
                cycleId={cycle.id}
                sessionsCompleted={sessionsCompleted}
                sessionCount={cycle.session_count}
                cycleStatus={cycle.status}
                onClosed={() => {
                  queryClient.invalidateQueries({ queryKey: ['pause_events', id] })
                  queryClient.invalidateQueries({ queryKey: ['treatment_pauses', id] })
                }}
              />
            </CascadeItem>
          )}
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
