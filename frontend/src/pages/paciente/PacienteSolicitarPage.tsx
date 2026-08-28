import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Logo } from '@/components/shared/Logo'
import { CoverageMapIllustration } from '@/components/paciente/CoverageMapIllustration'
import { PatientHomeSchedulingBanner } from '@/components/paciente/PatientHomeSchedulingBanner'
import { PatientSchedulingProposalList } from '@/components/paciente/PatientSchedulingProposalList'
import { ServiceRequestForm } from '@/components/paciente/ServiceRequestForm'
import { ServiceRequestTimeline } from '@/components/paciente/ServiceRequestTimeline'
import { Button } from '@/components/ui/button'
import {
  completeAssessmentCheckout,
  getPatientServiceStatus,
  joinWaitlist,
  patientServiceQueryKeys,
  prepareServiceRequest,
} from '@/services/patientServiceRequest'
import { listPendingSchedulingProposalsForPatient } from '@/services/scheduling'
import { getAssignedProfessionalSummary } from '@/services/professionalRating'
import { patientPortalQueryKeys } from '@/services/patientPortal'
import { mapSupabaseError } from '@/lib/supabase-errors'

function PacienteSolicitarHeaderLogo() {
  return <Logo layout="horizontal" adaptToTheme style="v1" size="xs" />
}

export function PacienteSolicitarPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: patientServiceQueryKeys.status,
    queryFn: getPatientServiceStatus,
  })

  const { data: pendingProposals = [], refetch: refetchProposals } = useQuery({
    queryKey: ['paciente', 'scheduling_proposals', data?.patient_id, data?.active_demand?.id],
    queryFn: () =>
      listPendingSchedulingProposalsForPatient(
        data?.active_demand?.id
          ? { demandId: data.active_demand.id }
          : { patientId: data?.patient_id },
      ),
    enabled: Boolean(data?.linked),
  })

  const pendingScheduling = pendingProposals.some((p) => p.proposal_type !== 'remarcacao')

  const assignedPpId = data?.active_demand?.assigned_professional_id

  const { data: assignedProfessional } = useQuery({
    queryKey: ['paciente', 'assigned-pp', assignedPpId],
    queryFn: () => getAssignedProfessionalSummary(assignedPpId!),
    enabled: Boolean(assignedPpId),
  })

  const prepareMutation = useMutation({
    mutationFn: prepareServiceRequest,
    onSuccess: (result) => {
      if (!result.success && result.reason === 'no_coverage') {
        toast.info(result.message ?? 'Sua região ainda não possui cobertura.')
      }
    },
    onError: (err: Error) => toast.error(mapSupabaseError(err)),
  })

  const checkoutMutation = useMutation({
    mutationFn: async (input: {
      patientId: string
      assessmentFeeCents: number
    }) => completeAssessmentCheckout(input.patientId, input.assessmentFeeCents, 'PIX'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: patientServiceQueryKeys.status })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      if (result.alreadyPaid) {
        toast.success('Solicitação enviada', {
          description: 'Estamos procurando um profissional parceiro para você.',
        })
        return
      }
      if (result.asaasSyncFailed) {
        toast.warning('Cobrança criada, mas o PIX ainda não foi gerado', {
          description: 'Abra a tela de pagamento e toque em "Gerar PIX" para tentar novamente.',
        })
      }
      navigate(`/paciente/pagamentos/${result.chargeId}`)
    },
    onError: (err: Error) => toast.error(mapSupabaseError(err)),
  })

  const waitlistMutation = useMutation({
    mutationFn: () => joinWaitlist(),
    onSuccess: (result) => {
      if (!result.success) {
        toast.info(result.message ?? 'Não foi possível registrar.')
        return
      }
      queryClient.invalidateQueries({ queryKey: patientServiceQueryKeys.status })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      toast.success('Interesse registrado', {
        description: 'Em breve nossa equipe entrará em contato.',
      })
    },
    onError: (err: Error) => toast.error(mapSupabaseError(err)),
  })

  const busy = prepareMutation.isPending || checkoutMutation.isPending || waitlistMutation.isPending

  if (isLoading) {
    return (
      <>
        <PageHeader>
          <PacienteSolicitarHeaderLogo />
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  if (isError || !data?.linked) {
    return (
      <>
        <PageHeader>
          <PacienteSolicitarHeaderLogo />
        </PageHeader>
        <CrudScrollPageLayout>
          <div className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {!data?.linked
                ? 'Nenhum paciente vinculado à sua conta. Fale com a Larsana para continuar.'
                : 'Não foi possível carregar esta página.'}
            </p>
            {data?.linked ? (
              <Button variant="outline" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            ) : null}
          </div>
        </CrudScrollPageLayout>
      </>
    )
  }

  const hasActiveDemand = Boolean(data.active_demand)
  const hasWaitlist = Boolean(data.waitlist)
  const serviceAvailable = data.service_available === true
  const showComingSoon = !serviceAvailable

  return (
    <>
      <PageHeader>
        <PacienteSolicitarHeaderLogo />
      </PageHeader>
      <CrudScrollPageLayout>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-5 pb-8">
          <CoverageMapIllustration variant={showComingSoon ? 'coming_soon' : 'searching'} />

          {showComingSoon ? (
            <div className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <p className="font-semibold text-foreground">Estamos chegando!</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ainda não temos profissionais parceiros atuando na sua região. Enquanto isso, explore o LarsanaPill
                com orientações e exercícios para casa.
              </p>
              {!hasWaitlist ? (
                <Button onClick={() => waitlistMutation.mutate()} disabled={busy}>
                  Desejo iniciar tratamento
                </Button>
              ) : (
                <p className="text-sm font-medium text-primary">Você já está na nossa lista de espera.</p>
              )}
            </div>
          ) : !hasActiveDemand ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Preencha os dados abaixo para enviar sua solicitação. Você não escolhe o profissional — quem aceitar
                primeiro iniciará o contato com a Larsana.
              </p>
              <ServiceRequestForm
                submitting={busy}
                onPrepare={async (values) => {
                  const result = await prepareMutation.mutateAsync(values)
                  return {
                    canCheckout: Boolean(result.success && result.can_checkout),
                    noCoverage: result.reason === 'no_coverage',
                    assessmentFeeCents: result.assessment_fee_cents,
                    assessmentFeeMessage: result.assessment_fee_message,
                    patientId: result.patient_id,
                  }
                }}
                onCheckout={async ({ patientId, assessmentFeeCents }) => {
                  await checkoutMutation.mutateAsync({ patientId, assessmentFeeCents })
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">Sua solicitação já está em andamento.</p>
              {pendingScheduling ? (
                <>
                  <PatientSchedulingProposalList
                    proposals={pendingProposals}
                    onUpdated={() => {
                      void refetchProposals()
                      void queryClient.invalidateQueries({ queryKey: patientServiceQueryKeys.status })
                    }}
                  />
                  <PatientHomeSchedulingBanner />
                </>
              ) : null}
            </div>
          )}

          {(hasActiveDemand || hasWaitlist) && (
            <ServiceRequestTimeline
              demand={data.active_demand}
              hasWaitlist={hasWaitlist}
              pendingScheduling={pendingScheduling}
              createdAt={data.active_demand?.created_at ?? data.waitlist?.created_at}
              assignedProfessional={assignedProfessional ?? null}
            />
          )}
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
