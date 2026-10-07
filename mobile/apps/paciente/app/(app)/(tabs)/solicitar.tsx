import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Sparkles } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { CoverageMapIllustration } from '@/components/paciente/CoverageMapIllustration'
import { ServiceRequestForm } from '@/components/paciente/ServiceRequestForm'
import { ServiceRequestTimeline } from '@/components/paciente/ServiceRequestTimeline'
import {
  completeAssessmentCheckout,
  getPatientServiceStatus,
  getPendingAssessmentRequestCharge,
  joinWaitlist,
  patientServiceQueryKeys,
  prepareServiceRequest,
} from '@/services/patientServiceRequest'
import { listPendingSchedulingProposalsForPatient } from '@/services/scheduling'
import { getAssignedProfessionalSummary } from '@/services/professionalRating'
import { patientPortalQueryKeys } from '@/services/patientPortal'
import {
  getActiveDemandStatusMessage,
  isProfessionalAssignedToDemand,
} from '@/lib/serviceRequestStatusCopy'

export default function SolicitarScreen() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: patientServiceQueryKeys.status,
    queryFn: getPatientServiceStatus,
  })

  const { data: pendingAssessmentCharge } = useQuery({
    queryKey: patientServiceQueryKeys.pendingAssessmentCharge(data?.patient_id ?? ''),
    queryFn: () => getPendingAssessmentRequestCharge(data!.patient_id!),
    enabled: Boolean(data?.linked && data?.patient_id && !data?.active_demand),
  })

  const { data: pendingProposals = [] } = useQuery({
    queryKey: ['paciente', 'scheduling_proposals'],
    queryFn: listPendingSchedulingProposalsForPatient,
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
        Alert.alert('Estamos chegando', result.message ?? 'Sua região ainda não possui cobertura.')
      }
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  const checkoutMutation = useMutation({
    mutationFn: async (input: { patientId: string; assessmentFeeCents: number }) =>
      completeAssessmentCheckout(input.patientId, input.assessmentFeeCents, 'PIX'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: patientServiceQueryKeys.status })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      if (data?.patient_id) {
        queryClient.invalidateQueries({
          queryKey: patientServiceQueryKeys.pendingAssessmentCharge(data.patient_id),
        })
      }
      if (result.alreadyPaid) {
        Alert.alert(
          'Solicitação enviada',
          'Estamos procurando um profissional parceiro para você.',
        )
        return
      }
      if (result.asaasSyncFailed) {
        Alert.alert(
          'Cobrança criada',
          'O PIX ainda não foi gerado. Na tela de pagamento, toque em "Gerar PIX" para tentar novamente.',
        )
      }
      router.push(`/(app)/pagamentos/${result.chargeId}`)
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  const waitlistMutation = useMutation({
    mutationFn: () => joinWaitlist(),
    onSuccess: (result) => {
      if (!result.success) {
        Alert.alert('Aviso', result.message ?? 'Não foi possível registrar.')
        return
      }
      queryClient.invalidateQueries({ queryKey: patientServiceQueryKeys.status })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      Alert.alert(
        'Interesse registrado',
        'Em breve nossa equipe entrará em contato. Obrigado por confiar na Larsana Care.',
      )
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['bottom']}>
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  if (isError || !data?.linked) {
    return (
      <SafeAreaView className="flex-1 bg-background px-4" edges={['bottom']}>
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-center text-muted-foreground">
            {!data?.linked
              ? 'Nenhum paciente vinculado à sua conta. Fale com a Larsana para continuar.'
              : 'Não foi possível carregar esta página.'}
          </Text>
          {!data?.linked ? null : (
            <Button variant="outline" onPress={() => refetch()}>
              Tentar novamente
            </Button>
          )}
        </View>
      </SafeAreaView>
    )
  }

  const hasActiveDemand = Boolean(data.active_demand)
  const hasWaitlist = Boolean(data.waitlist)
  const awaitingAssessmentPayment = Boolean(pendingAssessmentCharge) && !hasActiveDemand
  const serviceAvailable = data.service_available === true
  const showComingSoon = !serviceAvailable
  const busy =
    prepareMutation.isPending || checkoutMutation.isPending || waitlistMutation.isPending || isRefetching
  const isProfessionalAssigned = isProfessionalAssignedToDemand(data.active_demand)
  const mapVariant = showComingSoon
    ? 'coming_soon'
    : hasActiveDemand && isProfessionalAssigned
      ? 'assigned'
      : 'searching'

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-5 py-4 pb-28">
        <CoverageMapIllustration variant={mapVariant} />

        {showComingSoon ? (
          <View className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 gap-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={18} color="#095742" />
              <Text className="font-semibold text-foreground">Estamos chegando!</Text>
            </View>
            <Text className="text-sm leading-5 text-muted-foreground">
              Ainda não temos profissionais parceiros atuando na sua região.
            </Text>
            {!hasWaitlist ? (
              <Button onPress={() => waitlistMutation.mutate()} loading={waitlistMutation.isPending} disabled={busy}>
                Desejo iniciar tratamento
              </Button>
            ) : (
              <Text className="text-sm font-medium text-primary">Você já está na nossa lista de espera.</Text>
            )}
          </View>
        ) : awaitingAssessmentPayment && pendingAssessmentCharge ? (
          <View className="gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-5">
            <Text className="font-semibold text-foreground">Aguardando pagamento</Text>
            <Text className="text-sm leading-5 text-muted-foreground">
              Sua solicitação está quase pronta. Conclua o pagamento da avaliação para enviarmos o pedido aos
              profissionais parceiros.
            </Text>
            <Button onPress={() => router.push(`/(app)/pagamentos/${pendingAssessmentCharge.id}`)}>
              Continuar pagamento
            </Button>
          </View>
        ) : !hasActiveDemand ? (
          <View className="gap-4">
            <Text className="text-sm text-muted-foreground">
              Preencha os dados abaixo para enviar sua solicitação. Você não escolhe o profissional — quem aceitar
              primeiro iniciará o contato com a Larsana.
            </Text>
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
          </View>
        ) : (
          <Text className="text-sm font-medium text-primary">
            {getActiveDemandStatusMessage({
              isProfessionalAssigned,
              pendingScheduling,
              professionalName: assignedProfessional?.name,
            })}
          </Text>
        )}

        {(hasActiveDemand || hasWaitlist || awaitingAssessmentPayment) && (
          <ServiceRequestTimeline
            demand={data.active_demand}
            hasWaitlist={hasWaitlist}
            pendingScheduling={pendingScheduling}
            awaitingAssessmentPayment={awaitingAssessmentPayment}
            createdAt={
              pendingAssessmentCharge?.created_at
              ?? data.active_demand?.created_at
              ?? data.waitlist?.created_at
            }
            assignedProfessionalName={assignedProfessional?.name ?? null}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
