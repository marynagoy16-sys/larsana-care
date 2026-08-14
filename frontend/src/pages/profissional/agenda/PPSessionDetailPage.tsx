import { type ReactNode, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import { getAgendaStatusConfig } from '@/lib/sessionStatus'
import { cn } from '@/lib/utils'
import {
  describeSessionType,
  getAgendaSessionById,
  ppAgendaQueryKeys,
  type AgendaSessionItem,
} from '@/services/ppAgenda'

function buildGoogleMapsUrl(address: string, neighborhood?: string | null): string {
  const query = [address, neighborhood].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
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
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{children}</p>
    </div>
  )
}

function AddressField({ address, neighborhood }: { address: string; neighborhood?: string | null }) {
  const mapsUrl = buildGoogleMapsUrl(address, neighborhood)

  return (
    <DetailField label="Endereço do atendimento">
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-start gap-1.5 text-primary hover:underline"
      >
        <span>
          {address}
          {neighborhood ? (
            <>
              <span className="block text-muted-foreground mt-0.5 font-normal">{neighborhood}</span>
            </>
          ) : null}
        </span>
        <ExternalLink size={14} className="shrink-0 mt-0.5" />
      </a>
    </DetailField>
  )
}

function SessionDetailBody({
  session,
  isFetching,
  isLoading,
  mobile,
  onOpenEvolution,
  onOpenPatient,
}: {
  session: AgendaSessionItem
  isFetching: boolean
  isLoading: boolean
  mobile: boolean
  onOpenEvolution: () => void
  onOpenPatient: () => void
}) {
  const scheduledLabel = session.scheduledAt
    ? format(new Date(session.scheduledAt), "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })
    : format(session.start, "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })
  const showEvolutionFooter = session.displayStatus === 'evolucao_pendente'
  const statusCfg = getAgendaStatusConfig(session.displayStatus)

  const sessionInfoFields = (
    <>
      <DetailField label="Data e horário">
        <span className="capitalize">{scheduledLabel}</span>
      </DetailField>
      <DetailField label="Tipo">{describeSessionType(session)}</DetailField>
      {session.address ? (
        <AddressField address={session.address} neighborhood={session.neighborhood} />
      ) : session.neighborhood ? (
        <AddressField address={session.neighborhood} />
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
            <DetailField label="Ciclo e sessão">
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
                <DetailField label="Tipo">{describeSessionType(session)}</DetailField>
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
                  {session.address ? (
                    <a
                      href={buildGoogleMapsUrl(session.address, session.neighborhood)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                      {session.address}
                      <ExternalLink size={14} className="shrink-0" />
                    </a>
                  ) : null}
                  {session.neighborhood && (
                    <p className="text-muted-foreground mt-1">{session.neighborhood}</p>
                  )}
                </div>
              </div>
            </CascadeItem>
          )}
        </>
      )}

      <CascadeItem>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onOpenPatient}>
            Ver paciente
          </Button>
          {!mobile && showEvolutionFooter && (
            <Button onClick={onOpenEvolution}>Evoluir terapia</Button>
          )}
        </div>
      </CascadeItem>
    </CascadeReveal>
  )
}

export function PPSessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isLgUp = useIsLgUp()
  useMobileImmersive(true)
  const goBack = () => navigate('/profissional/agenda')

  const { data: session, isLoading, isFetching } = useQuery({
    queryKey: ppAgendaQueryKeys.session(id!),
    queryFn: () => getAgendaSessionById(id!),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const openEvolution = () => {
    if (!session) return
    navigate(`/profissional/evolucao/nova?session=${session.id}`)
  }

  const openPatient = () => {
    if (!session) return
    navigate(`/profissional/pacientes/${session.patientId}`)
  }

  const mobileTitle = session?.patientName ?? 'Terapia'
  const showEvolutionFooter = session?.displayStatus === 'evolucao_pendente'

  const evolutionFooter = showEvolutionFooter ? (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/65 backdrop-blur-xl backdrop-saturate-150 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] supports-[backdrop-filter]:bg-background/55">
      <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button className="h-12 w-full" onClick={openEvolution}>
          Evoluir terapia
        </Button>
      </div>
    </div>
  ) : null

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
          <p className="text-muted-foreground">Sessão não encontrada ou não alocada a você.</p>
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
          <p className="text-muted-foreground p-6">Sessão não encontrada ou não alocada a você.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const statusCfg = getAgendaStatusConfig(session.displayStatus)

  if (!isLgUp) {
    return (
      <MobileSessionLayout
        title={mobileTitle}
        onBack={goBack}
        scrollClassName={showEvolutionFooter ? 'pb-28' : 'pb-8'}
        footer={evolutionFooter}
      >
        <SessionDetailBody
          session={session}
          isFetching={isFetching}
          isLoading={isLoading}
          mobile
          onOpenEvolution={openEvolution}
          onOpenPatient={openPatient}
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
        <SessionDetailBody
          session={session}
          isFetching={isFetching}
          isLoading={isLoading}
          mobile={false}
          onOpenEvolution={openEvolution}
          onOpenPatient={openPatient}
        />
      </CrudScrollPageLayout>
    </>
  )
}
