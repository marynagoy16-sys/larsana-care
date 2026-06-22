import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, PauseCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import {
  formatPauseDuration,
  getTreatmentPauseStatusLabel,
  isTreatmentPauseActive,
} from '@/lib/treatmentPausesDisplay'
import { formatDateTime } from '@/lib/formatters'
import { careStatusLabels } from '@/constants/labels'
import { treatmentPausesService } from '@/services/index'
import { cn } from '@/lib/utils'

const PAUSE_DETAIL_SELECT = `
  id, patient_id, paused_at, resumed_at, reason, created_at, created_by,
  patients ( full_name, care_status ),
  creator:profiles!treatment_pauses_created_by_fkey ( full_name )
`

export function TreatmentPauseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/pausas')

  const { data: pause, isLoading } = useQuery({
    queryKey: ['treatment_pauses', id],
    queryFn: () => treatmentPausesService.getById(id!, PAUSE_DETAIL_SELECT),
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

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0">
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
        <CascadeReveal className="space-y-4">
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
              <div>
                <p className="text-muted-foreground">Registro criado em</p>
                <p className="font-medium">{formatDateTime(String(pause.created_at))}</p>
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
                {pause.reason?.trim() || 'Motivo não informado.'}
              </p>
            </div>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
