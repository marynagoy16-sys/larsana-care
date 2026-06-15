import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { FormActions } from '@/components/crud/FormActions'
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

const declineSchema = z.object({
  decline_reason: z.string().trim().min(3, 'Informe o motivo da recusa'),
})

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
  const [declineOpen, setDeclineOpen] = useState(false)
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false)
  const { collapsed: sidebarCollapsed } = useSidebarCollapsed()

  const declineForm = useForm<z.infer<typeof declineSchema>>({
    resolver: zodResolver(declineSchema),
    defaultValues: { decline_reason: '' },
  })

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

  useSuppressBottomNav(showActionBar)

  const navigateAfterAccept = (result: AcceptDemandResult) => {
    if (result.demand_type === 'continuidade') {
      navigate('/profissional/agenda')
      return
    }
    navigate(`/profissional/pacientes/${result.patient_id}`)
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
    mutationFn: async (values: { decline_reason: string }) => {
      if (!professional?.id || !id) throw new Error('Profissional não encontrado')
      return demandResponsesService.create({
        demand_id: id,
        professional_id: professional.id,
        response: 'declined',
        decline_reason: values.decline_reason,
      })
    },
    queryKey: ['pp', 'demands'],
    successMessage: 'Recusa registrada',
    onSuccess: () => navigate('/profissional/demandas'),
  })

  const handleAcceptConfirm = () => {
    acceptMutation.mutate(undefined, { onSuccess: () => setAcceptConfirmOpen(false) })
  }

  const handleDeclineSubmit = declineForm.handleSubmit((values) => {
    declineMutation.mutate(values, { onSuccess: () => setDeclineOpen(false) })
  })

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
                  {existingResponse.decline_reason && (
                    <p className="text-muted-foreground mt-2">Motivo: {existingResponse.decline_reason}</p>
                  )}
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
              onClick={() => setDeclineOpen(true)}
            >
              Recusar
            </Button>
            <Button
              type="button"
              className="h-12 w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              disabled={actionsDisabled}
              onClick={() => setAcceptConfirmOpen(true)}
            >
              Aceitar
            </Button>
          </div>
        </div>
      )}

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

      <CrudDrawer open={declineOpen} onOpenChange={setDeclineOpen} title="Recusar demanda">
        <Form {...declineForm}>
          <form onSubmit={handleDeclineSubmit} className="space-y-4">
            <FormField
              control={declineForm.control}
              name="decline_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da recusa</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Descreva por que não pode assumir este atendimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormActions
              onCancel={() => setDeclineOpen(false)}
              isSubmitting={declineMutation.isPending}
              submitLabel="Confirmar recusa"
              cancelLabel="Voltar"
            />
          </form>
        </Form>
      </CrudDrawer>
    </>
  )
}
