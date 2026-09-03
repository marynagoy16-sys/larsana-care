import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import {
  buildFrequencyDisclaimer,
  PatientWeeklyFrequencyPicker,
} from '@/components/paciente/PatientWeeklyFrequencyPicker'
import { formatCurrency } from '@/lib/formatters'
import {
  acceptAssessmentProposal,
  assessmentFamilyResponseQueryKeys,
  getPatientProposalPreview,
} from '@/services/assessmentFamilyResponse'
import { loadPatientHome, patientPortalQueryKeys } from '@/services/patientPortal'

export default function PropostaScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [chosenFrequency, setChosenFrequency] = useState<number | null>(null)
  const [acceptAnexoI, setAcceptAnexoI] = useState(false)
  const [acceptAnexoII, setAcceptAnexoII] = useState(false)

  const homeQuery = useQuery({ queryKey: patientPortalQueryKeys.home, queryFn: loadPatientHome })
  const pendingAssessment = homeQuery.data?.pendingProposal

  const previewQuery = useQuery({
    queryKey: assessmentFamilyResponseQueryKeys.preview(pendingAssessment?.id ?? ''),
    queryFn: () => getPatientProposalPreview(pendingAssessment!.id),
    enabled: !!pendingAssessment?.id,
  })

  const recommended = previewQuery.data?.proposed_weekly_frequency ?? pendingAssessment?.proposed_weekly_frequency ?? 2
  const options = previewQuery.data?.options ?? []
  const selectedFrequency = chosenFrequency ?? recommended
  const selectedOption = options.find((o) => o.weekly_frequency === selectedFrequency)

  const acceptMutation = useMutation({
    mutationFn: (response: 'SIM' | 'NAO') =>
      acceptAssessmentProposal({
        assessmentId: pendingAssessment!.id,
        response,
        chosenWeeklyFrequency: response === 'SIM' ? selectedFrequency : undefined,
        acceptAnexoI: response === 'SIM' ? acceptAnexoI : undefined,
        acceptAnexoII: response === 'SIM' ? acceptAnexoII : undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      if (result.family_response === 'SIM' && result.charge_id) {
        router.replace(`/(app)/pagamentos/${result.charge_id}`)
        return
      }
      Alert.alert('Proposta recusada', 'Obrigado pelo retorno.')
      router.replace('/(app)/(tabs)/inicio')
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  const loading = homeQuery.isLoading || (pendingAssessment && previewQuery.isLoading)

  const canAccept = acceptAnexoI && acceptAnexoII && Boolean(selectedOption)

  const handleAccept = () => {
    if (selectedFrequency < recommended) {
      Alert.alert(
        'Frequência menor que a recomendada',
        buildFrequencyDisclaimer(recommended),
        [
          { text: 'Voltar', style: 'cancel' },
          { text: 'Sim, desejo seguir', onPress: () => acceptMutation.mutate('SIM') },
        ],
      )
      return
    }
    acceptMutation.mutate('SIM')
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <Text className="text-lg font-semibold">Proposta de tratamento</Text>
        </View>
      </PageHeader>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : !pendingAssessment || !previewQuery.data ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-medium">Nenhuma proposta pendente</Text>
          <Button variant="outline" className="mt-4" onPress={() => router.back()}>Voltar</Button>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 py-4 pb-36">
            <View className="rounded-xl border border-border bg-card p-5 gap-3">
              <Text className="font-semibold text-sm">Resumo da proposta</Text>
              <Text className="font-semibold">{previewQuery.data.patient_name}</Text>
              {previewQuery.data.professional_name ? (
                <Text className="text-sm text-muted-foreground">
                  Profissional: {previewQuery.data.professional_name}
                </Text>
              ) : null}
              <Text className="text-sm text-muted-foreground">
                {previewQuery.data.proposed_session_count} sessões · {previewQuery.data.proposed_patient_level} ·{' '}
                {previewQuery.data.proposed_weekly_frequency}x/sem recomendado
              </Text>
              {selectedOption ? (
                <View className="rounded-lg bg-muted/40 px-4 py-3">
                  <Text className="text-xs text-muted-foreground">Valor do ciclo escolhido</Text>
                  <Text className="text-xl font-bold text-primary">
                    {formatCurrency(selectedOption.total_amount_cents)}
                  </Text>
                  {selectedOption.assessment_credit_cents > 0 ? (
                    <Text className="text-xs text-primary mt-0.5">
                      Inclui desconto de {formatCurrency(selectedOption.assessment_credit_cents)} da avaliação paga
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            {options.length > 0 ? (
              <View className="rounded-xl border border-border bg-card p-5">
                <PatientWeeklyFrequencyPicker
                  value={selectedFrequency}
                  recommended={recommended}
                  options={options}
                  onChange={setChosenFrequency}
                />
              </View>
            ) : null}
            {selectedOption ? (
              <View className="rounded-xl border border-border bg-card p-5 gap-3">
                <Text className="font-semibold text-sm">Aceite comercial do ciclo</Text>
                <Text className="text-sm text-muted-foreground">
                  {selectedOption.session_count} terapias — total {formatCurrency(selectedOption.total_amount_cents)}
                </Text>
                <Pressable
                  className="flex-row items-start gap-3 rounded-lg border border-border p-3"
                  onPress={() => setAcceptAnexoI((v) => !v)}
                >
                  <View className={`mt-0.5 h-5 w-5 rounded border ${acceptAnexoI ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                  <Text className="flex-1 text-sm">
                    Li e aceito o Anexo I — Condições Comerciais com os valores acima.
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-row items-start gap-3 rounded-lg border border-border p-3"
                  onPress={() => setAcceptAnexoII((v) => !v)}
                >
                  <View className={`mt-0.5 h-5 w-5 rounded border ${acceptAnexoII ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                  <Text className="flex-1 text-sm">
                    Declaro ciência do Anexo II — Cancelamento e Reagendamento.
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
          <View className="border-t border-border bg-card px-4 py-4 gap-2">
            <Button onPress={handleAccept} loading={acceptMutation.isPending} disabled={!canAccept}>
              Aceitar e pagar
            </Button>
            <Button
              variant="outline"
              onPress={() =>
                Alert.alert(
                  'Recusar proposta?',
                  'Ao recusar, você não dará continuidade ao tratamento proposto. A taxa de avaliação já paga na solicitação não será reembolsada conforme os termos.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar recusa', style: 'destructive', onPress: () => acceptMutation.mutate('NAO') },
                  ],
                )
              }
              loading={acceptMutation.isPending}
            >
              Recusar proposta
            </Button>
          </View>
        </>
      )}
    </SafeAreaView>
  )
}
