import { type ReactNode, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { SessionAddressMapPreview } from '@/components/agenda/SessionAddressMapPreview'
import { useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import { buildGoogleMapsSearchUrl } from '@/lib/geo'
import { getAgendaStatusConfig, canEvolveTherapy } from '@/lib/sessionStatus'
import { cn } from '@/lib/utils'
import {
  getAgendaSessionById,
  ppAgendaQueryKeys,
  type AgendaSessionItem,
} from '@/services/ppAgenda'
import {
  describeRegisteredAssessment,
  getPatientLatestAssessment,
  ppPatientQueryKeys,
} from '@/services/ppPatients'
import { PpRescheduleSlotsCard } from '@/components/profissional/agenda/PpRescheduleSlotsCard'
import { getAwaitingRescheduleRequestForSession } from '@/services/sessionReminderChat'
import { ppSessionCheckIn } from '@/services/ppSessions'
import { toast } from 'sonner'

function buildGoogleMapsUrl(
  address: string,
  neighborhood?: string | null,
  latitude?: number | null,
  longitude?: number | null,
): string {
  const lat = latitude != null ? Number(latitude) : null
  const lng = longitude != null ? Number(longitude) : null
  const point =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  return buildGoogleMapsSearchUrl(address, neighborhood, point)
}

function SessionAddressSection({
  address,
  neighborhood,
  latitude,
  longitude,
  showLabel = true,
}: {
  address: string
  neighborhood?: string | null
  latitude?: number | null
  longitude?: number | null
  showLabel?: boolean
}) {
  const mapsUrl = buildGoogleMapsUrl(address, neighborhood, latitude, longitude)

  const addressLink = (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-start gap-1.5 text-primary hover:underline"
    >
      <span>
        {address}
        {neighborhood ? (
          <span className="block text-muted-foreground mt-0.5 font-normal">{neighborhood}</span>
        ) : null}
      </span>
      <ExternalLink size={14} className="shrink-0 mt-0.5" />
    </a>
  )

  return (
    <div className="space-y-3">
      {showLabel ? (
        <DetailField label="Endereço do atendimento">{addressLink}</DetailField>
      ) : (
        addressLink
      )}

      <SessionAddressMapPreview
        address={address}
        neighborhood={neighborhood}
        latitude={latitude}
        longitude={longitude}
      />
    </div>
  )
}

function AddressField({
  address,
  neighborhood,
  latitude,
  longitude,
}: {
  address: string
  neighborhood?: string | null
  latitude?: number | null
  longitude?: number | null
}) {
  return (
    <SessionAddressSection
      address={address}
      neighborhood={neighborhood}
      latitude={latitude}
      longitude={longitude}
    />
  )
}

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsLgUp(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isLgUp
}

function useMobileImmersive(active: boolean) {
  const { setImmersive } = useImmersiveLayout()
  const isLgUp = useIsLgUp()

  useEffect(() => {
    if (!active || isLgUp) {
      setImmersive(false)
      return
    }
    setImmersive(true)
    return () => setImmersive(false)
  }, [active, isLgUp, setImmersive])
}

function MobileSessionLayout({
  title,
  onBack,
  children,
  footer,
  scrollClassName,
}: {
  title: string
  onBack: () => void
  children: ReactNode
  footer?: ReactNode
  scrollClassName?: string
}) {
  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 border-b border-border/50 bg-background/70 px-4 py-3 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/55">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 rounded-xl" aria-label="Voltar">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-display font-bold text-lg leading-none">{title}</h1>
      </div>

      <div
        className={cn(
          'flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-sidebar shell-content-x pt-3',
          scrollClassName,
        )}
      >
        {children}
      </div>

      {footer}
    </div>
  )
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{children}</p>
    </div>
  )
}

function SessionDetailBody({
  session,
  isFetching,
  isLoading,
  mobile,
  assessmentRegisteredMessage,
  onOpenEvolution,
  onOpenPatient,
  onCheckIn,
  checkInPending,
}: {
  session: AgendaSessionItem
  isFetching: boolean
  isLoading: boolean
  mobile: boolean
  assessmentRegisteredMessage?: string | null
  onOpenEvolution: () => void
  onOpenPatient: () => void
  onCheckIn: () => void
  checkInPending: boolean
}) {
  const scheduledLabel = session.scheduledAt
    ? format(new Date(session.scheduledAt), "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })
    : format(session.start, "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })
  const showClinicalAction = session.isAssessment
    ? !assessmentRegisteredMessage
    : canEvolveTherapy(session)
  const evolutionLocked = !session.isAssessment && !session.checkInAt && !session.hasEvolution
  const statusCfg = getAgendaStatusConfig(session.displayStatus)
  const clinicalActionLabel = session.isAssessment ? 'Registrar avaliação' : 'Evoluir terapia'

  const sessionInfoFields = (
    <>
      <DetailField label="Data e horário">
        <span className="capitalize">{scheduledLabel}</span>
      </DetailField>
      {session.address ? (
        <AddressField
          address={session.address}
          neighborhood={session.neighborhood}
          latitude={session.latitude}
          longitude={session.longitude}
        />
      ) : session.neighborhood ? (
        <AddressField address={session.neighborhood} latitude={session.latitude} longitude={session.longitude} />
      ) : null}
    </>
  )

  return (
    <CascadeReveal
      className={cn(
        'space-y-5 pb-8 transition-opacity duration-300',
        isFetching && !isLoading && 'opacity-60',
      )}
    >
      {mobile ? (
        <CascadeItem>
          <div className="space-y-4 text-sm">
            <DetailField label="Ciclo e terapia">
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  Ciclo {session.cycleNumber} · Terapia #{session.sessionNumber}
                </span>
                <Badge className={cn('shrink-0', statusCfg.badge)}>{statusCfg.label}</Badge>
              </span>
            </DetailField>
            {sessionInfoFields}
          </div>
        </CascadeItem>
      ) : (
        <>
          <CascadeItem>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-sm">Agendamento</h3>
              </div>
              <div className="p-5 grid gap-4 sm:grid-cols-2 text-sm">
                <DetailField label="Data e horário">
                  <span className="capitalize">{scheduledLabel}</span>
                </DetailField>
              </div>
            </div>
          </CascadeItem>

          {(session.address || session.neighborhood) && (
            <CascadeItem>
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground shrink-0" />
                  <h3 className="font-semibold text-sm">Endereço do atendimento</h3>
                </div>
                <div className="p-5 text-sm">
                  <SessionAddressSection
                    address={session.address ?? session.neighborhood!}
                    neighborhood={session.address ? session.neighborhood : null}
                    latitude={session.latitude}
                    longitude={session.longitude}
                    showLabel={false}
                  />
                </div>
              </div>
            </CascadeItem>
          )}
        </>
      )}

      <CascadeItem>
        <div className="flex flex-col gap-2">
          {!session.checkInAt ? (
            <Button onClick={onCheckIn} disabled={checkInPending} className="h-12 w-full">
              Check-in
            </Button>
          ) : null}
          {assessmentRegisteredMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
              {assessmentRegisteredMessage}
            </div>
          ) : showClinicalAction ? (
            <Button onClick={onOpenEvolution} className="h-12 w-full">
              {clinicalActionLabel}
            </Button>
          ) : evolutionLocked ? (
            <Button disabled className="h-12 w-full">
              Evoluir terapia após o check-in
            </Button>
          ) : null}
          <Button variant="outline" onClick={onOpenPatient} className="h-12 w-full">
            Ver paciente
          </Button>
        </div>
      </CascadeItem>
    </CascadeReveal>
  )
}

export function PPSessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isLgUp = useIsLgUp()
  useMobileImmersive(true)
  const goBack = () => navigate('/profissional/agenda')

  const { data: session, isLoading, isFetching } = useQuery({
    queryKey: ppAgendaQueryKeys.session(id!),
    queryFn: () => getAgendaSessionById(id!),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const { data: latestAssessment } = useQuery({
    queryKey: ppPatientQueryKeys.latestAssessment(session?.patientId ?? ''),
    queryFn: () => getPatientLatestAssessment(session!.patientId),
    enabled: !!session?.isAssessment && !!session?.patientId,
  })

  const assessmentRegisteredMessage =
    session?.isAssessment && latestAssessment
      ? describeRegisteredAssessment(latestAssessment.status)
      : null

  const { data: rescheduleRequest, refetch: refetchRescheduleRequest } = useQuery({
    queryKey: ['pp', 'reschedule-request', id],
    queryFn: () => getAwaitingRescheduleRequestForSession(id!),
    enabled: !!id && !!session,
  })

  const checkMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Sessão inválida')
      await ppSessionCheckIn(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ppAgendaQueryKeys.session(id!) })
      toast.success('Registro atualizado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openEvolution = () => {
    if (!session) return
    if (session.isAssessment) {
      navigate(`/profissional/pacientes/${session.patientId}/avaliacao`)
      return
    }
    navigate(`/profissional/evolucao/nova?session=${session.id}`)
  }

  const openPatient = () => {
    if (!session) return
    navigate(`/profissional/pacientes/${session.patientId}`)
  }

  const mobileTitle = session?.patientName ?? 'Terapia'

  if (isLoading) {
    if (!isLgUp) {
      return (
        <MobileSessionLayout title="Terapia" onBack={goBack} scrollClassName="pb-8">
          <DetailPageSkeleton fields={5} />
        </MobileSessionLayout>
      )
    }

    return (
      <>
        <PageHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-display font-bold text-xl">Terapia</span>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={5} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!session) {
    if (!isLgUp) {
      return (
        <MobileSessionLayout title="Terapia" onBack={goBack} scrollClassName="pb-8">
          <p className="text-muted-foreground">Terapia não encontrada ou não alocada a você.</p>
        </MobileSessionLayout>
      )
    }

    return (
      <>
        <PageHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-display font-bold text-xl">Terapia</span>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground p-6">Terapia não encontrada ou não alocada a você.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const statusCfg = getAgendaStatusConfig(session.displayStatus)

  const rescheduleCard = rescheduleRequest ? (
    <PpRescheduleSlotsCard
      requestId={rescheduleRequest.id}
      originalScheduledAt={rescheduleRequest.original_scheduled_at}
      deadline={rescheduleRequest.reschedule_deadline}
      onSubmitted={() => {
        void refetchRescheduleRequest()
      }}
    />
  ) : null

  if (!isLgUp) {
    return (
      <MobileSessionLayout
        title={mobileTitle}
        onBack={goBack}
        scrollClassName="pb-8"
      >
        {rescheduleCard ? <div className="mb-5">{rescheduleCard}</div> : null}
        <SessionDetailBody
          session={session}
          isFetching={isFetching}
          isLoading={isLoading}
          mobile
          assessmentRegisteredMessage={assessmentRegisteredMessage}
          onOpenEvolution={openEvolution}
          onOpenPatient={openPatient}
          onCheckIn={() => checkMutation.mutate()}
          checkInPending={checkMutation.isPending}
        />
      </MobileSessionLayout>
    )
  }

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl lg:text-2xl truncate">{session.patientName}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <Badge className={statusCfg.badge}>{statusCfg.label}</Badge>
              <span className="text-sm text-muted-foreground">
                Ciclo {session.cycleNumber} · Terapia #{session.sessionNumber}
              </span>
            </div>
          </div>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        {rescheduleCard ? <div className="mb-5">{rescheduleCard}</div> : null}
        <SessionDetailBody
          session={session}
          isFetching={isFetching}
          isLoading={isLoading}
          mobile={false}
          assessmentRegisteredMessage={assessmentRegisteredMessage}
          onOpenEvolution={openEvolution}
          onOpenPatient={openPatient}
          onCheckIn={() => checkMutation.mutate()}
          checkInPending={checkMutation.isPending}
        />
      </CrudScrollPageLayout>
    </>
  )
}
