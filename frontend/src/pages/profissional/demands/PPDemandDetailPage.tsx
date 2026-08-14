import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSuppressBottomNav } from '@/contexts/PageFooterContext'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import { cn } from '@/lib/utils'
import {
  AvaliacaoSections,
  buildDemandBriefProps,
  ContinuidadeSections,
  DemandBriefCard,
  DemandDetailPageHeader,
  useDemandPricingContext,
} from '@/components/demands/DemandDetailContent'
import { demandsService, type AcceptDemandResult } from '@/services/demands'
import { getCurrentProfessional } from '@/services/professionals'
import { demandResponsesService } from '@/services/index'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { formatDateTime } from '@/lib/formatters'

function resolveAcceptConfirmCopy(demandType: 'avaliacao' | 'continuidade') {
  if (demandType === 'avaliacao') {
    return {
      title: 'Assumir avaliação',
      description:
        'Você tem certeza que deseja assumir esta avaliação? Após aceitar, você será responsável pela realização do atendimento.',
    }
  }
  return {
    title: 'Assumir continuidade',
    description:
      'Você tem certeza que deseja assumir esta demanda de continuidade? Após aceitar, você será responsável pela realização dos atendimentos.',
  }
}

export function PPDemandDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate('/profissional/demandas')
  const [declineConfirmOpen, setDeclineConfirmOpen] = useState(false)
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false)
  const [credentialingGateOpen, setCredentialingGateOpen] = useState(false)
  const { collapsed: sidebarCollapsed } = useSidebarCollapsed()

  const { data: professional, isLoading: professionalLoading } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: getCurrentProfessional,
  })

  const { data: demand, isLoading, isFetching } = useQuery({
    queryKey: ['pp', 'demand_detail', id],
    queryFn: () => demandsService.getDetail(id!),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const { data: pricingContext, isLoading: pricingLoading } = useDemandPricingContext(
    demand,
    professional?.pp_class ?? null,
  )

  const existingResponse =
    demand?.demand_responses?.find((r) => r.professional_id === professional?.id) ?? null
  const hasResponded = !!existingResponse
  const demandClosed = demand?.status !== 'aberta'
  const showActionBar = !!demand && !hasResponded && !demandClosed
  const isCredentialed = professional?.credentialing_status === 'ativo'

  useSuppressBottomNav(showActionBar)

  const navigateAfterAccept = (result: AcceptDemandResult) => {
    navigate(`/profissional/demandas/${result.demand_id}/agendar`)
  }

  const acceptMutation = useCrudMutation({
    mutationFn: () => {
      if (!id) throw new Error('Demanda não encontrada')
      return demandsService.acceptDemand(id)
    },
    queryKey: ['pp', 'demands'],
    successMessage: 'Demanda assumida com sucesso',
    onSuccess: navigateAfterAccept,
  })

  const declineMutation = useCrudMutation({
    mutationFn: async () => {
      if (!professional?.id || !id) throw new Error('Profissional não encontrado')
      return demandResponsesService.create({
        demand_id: id,
        professional_id: professional.id,
        response: 'declined',
        decline_reason: null,
      })
    },
    queryKey: ['pp', 'demands'],
    successMessage: 'Recusa registrada',
    onSuccess: () => navigate('/profissional/demandas'),
  })

  const handleAcceptClick = () => {
    if (!isCredentialed) {
      setCredentialingGateOpen(true)
      return
    }
    setAcceptConfirmOpen(true)
  }

  const handleAcceptConfirm = () => {
    acceptMutation.mutate(undefined, { onSuccess: () => setAcceptConfirmOpen(false) })
  }

  const handleDeclineConfirm = () => {
    declineMutation.mutate(undefined, {
      onSuccess: () => setDeclineConfirmOpen(false),
    })
  }

  if (isLoading || professionalLoading) {
    return (
      <>
        <PageHeader loading>
          <DemandDetailPageHeader onBack={goBack} loading showPatientName={false} />
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={6} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!demand) {
    return (
      <>
        <PageHeader>
          <DemandDetailPageHeader onBack={goBack} showPatientName={false} />
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground p-6">Demanda não encontrada ou não disponível.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const isAvaliacao = demand.demand_type === 'avaliacao'
  const simulation = isAvaliacao ? pricingContext?.avaliacao : pricingContext?.continuidade
  const briefProps = buildDemandBriefProps(demand, simulation?.rules.cycle2RepassePerSessionCents ?? null)
  const actionsDisabled =
    hasResponded || demandClosed || acceptMutation.isPending || declineMutation.isPending
  const acceptConfirmCopy = resolveAcceptConfirmCopy(demand.demand_type)

  return (
    <>
      <PageHeader>
        <DemandDetailPageHeader
          demand={demand}
          onBack={goBack}
          isFetching={isFetching}
          showPatientName={false}
        />
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className={showActionBar ? 'space-y-5 pb-24' : 'space-y-5 pb-8 lg:pb-8'}>
          <CascadeItem>
            <DemandBriefCard
              demand={demand}
              {...briefProps}
              loading={pricingLoading}
            />
          </CascadeItem>

          {isAvaliacao ? (
            <AvaliacaoSections simulation={pricingContext?.avaliacao ?? null} loading={pricingLoading} />
          ) : (
            <ContinuidadeSections simulation={pricingContext?.continuidade ?? null} loading={pricingLoading} />
          )}

          {hasResponded && (
            <CascadeItem>
              <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 text-sm space-y-3">
                <div>
                  <p className="font-medium">Você já respondeu esta demanda.</p>
                  <p className="text-muted-foreground mt-1">
                    Resposta:{' '}
                    <Badge variant={existingResponse.response === 'accepted' ? 'default' : 'secondary'}>
                      {existingResponse.response === 'accepted' ? 'Aceita' : 'Recusada'}
                    </Badge>
                    {' · '}
                    {formatDateTime(existingResponse.responded_at)}
                  </p>
                </div>
                {existingResponse.response === 'accepted' && (
                  <Button
                    size="sm"
                    disabled={acceptMutation.isPending}
                    onClick={() => {
                      if (demand.status === 'aberta' && id) {
                        acceptMutation.mutate(undefined, {
                          onSuccess: (result) => navigate(`/profissional/pacientes/${result.patient_id}`),
                        })
                        return
                      }
                      navigate(`/profissional/pacientes/${demand.patient_id}`)
                    }}
                  >
                    {demand.status === 'aberta' ? 'Concluir alocação e ir ao paciente' : 'Ir para paciente'}
                  </Button>
                )}
              </div>
            </CascadeItem>
          )}
        </CascadeReveal>
      </CrudScrollPageLayout>

      {showActionBar && (
        <div
          className={cn(
            'fixed bottom-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur shadow-[0_-4px_24px_rgba(0,0,0,0.08)] supports-[backdrop-filter]:bg-background/90',
            'left-0 lg:transition-[left] lg:duration-300 lg:ease-in-out',
            sidebarCollapsed ? 'lg:left-[var(--sidebar-width-collapsed)]' : 'lg:left-[var(--sidebar-width)]',
          )}
        >
          <div className="grid grid-cols-2 gap-3 shell-content-x py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 hover:border-red-400 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
              disabled={actionsDisabled}
              onClick={() => setDeclineConfirmOpen(true)}
            >
              Recusar
            </Button>
            <Button
              type="button"
              className="h-12 w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              disabled={actionsDisabled}
              onClick={handleAcceptClick}
            >
              Aceitar
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={credentialingGateOpen} onOpenChange={setCredentialingGateOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md px-4 py-5 sm:w-full sm:px-6">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle>Finalizar credenciamento</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              Você precisa concluir seu credenciamento antes de aceitar demandas. Envie seus documentos e dados
              bancários para continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row-reverse sm:justify-end">
            <AlertDialogAction
              onClick={() => navigate('/profissional/credenciamento')}
              className="mt-0 w-full sm:w-auto"
            >
              Ir ao credenciamento
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 w-full sm:w-auto">Voltar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={acceptConfirmOpen} onOpenChange={setAcceptConfirmOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md px-4 py-5 sm:w-full sm:px-6">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle>{acceptConfirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              {acceptConfirmCopy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row-reverse sm:justify-end">
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleAcceptConfirm()
              }}
              disabled={acceptMutation.isPending}
              className="mt-0 w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 sm:w-auto"
            >
              {acceptMutation.isPending ? 'Confirmando...' : 'Sim, assumir'}
            </AlertDialogAction>
            <AlertDialogCancel disabled={acceptMutation.isPending} className="mt-0 w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={declineConfirmOpen} onOpenChange={setDeclineConfirmOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md px-4 py-5 sm:w-full sm:px-6">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle>Recusar demanda?</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              A demanda será removida da sua lista de oportunidades. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row-reverse sm:justify-end">
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeclineConfirm()
              }}
              disabled={declineMutation.isPending}
              className="mt-0 w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
            >
              {declineMutation.isPending ? 'Recusando...' : 'Sim, recusar'}
            </AlertDialogAction>
            <AlertDialogCancel disabled={declineMutation.isPending} className="mt-0 w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
