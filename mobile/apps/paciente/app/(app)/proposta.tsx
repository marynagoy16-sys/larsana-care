import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
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

  const homeQuery = useQuery({ queryKey: patientPortalQueryKeys.home, queryFn: loadPatientHome })
  const pendingAssessment = homeQuery.data?.pendingProposal

  const previewQuery = useQuery({
    queryKey: assessmentFamilyResponseQueryKeys.preview(pendingAssessment?.id ?? ''),
    queryFn: () => getPatientProposalPreview(pendingAssessment!.id),
    enabled: !!pendingAssessment?.id,
  })

  const recommended = previewQuery.data?.proposed_weekly_frequency ?? pendingAssessment?.proposed_weekly_frequency ?? 2
  const selectedFrequency = chosenFrequency ?? recommended

  const acceptMutation = useMutation({
    mutationFn: (response: 'SIM' | 'NAO') =>
      acceptAssessmentProposal({
        assessmentId: pendingAssessment!.id,
        response,
        chosenWeeklyFrequency: response === 'SIM' ? selectedFrequency : undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      if (result.family_response === 'SIM' && result.charge_id) {
        router.replace(`/(app)/pagamentos/${result.charge_id}`)
        return
      }
      Alert.alert('Proposta recusada', 'Foi gerada uma cobrança de R$ 50 referente à avaliação.')
      router.replace('/(app)/(tabs)/inicio')
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  const loading = homeQuery.isLoading || (pendingAssessment && previewQuery.isLoading)

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
            <View className="rounded-xl border border-border bg-card p-5 gap-2">
              <Text className="font-semibold">{previewQuery.data.patient_name}</Text>
              <Text className="text-sm text-muted-foreground">
                {previewQuery.data.proposed_session_count} sessões · {previewQuery.data.proposed_patient_level} · {previewQuery.data.proposed_weekly_frequency}x/sem
              </Text>
              {previewQuery.data.total_amount_cents != null ? (
                <Text className="text-lg font-bold text-primary">
                  {formatCurrency(previewQuery.data.total_amount_cents)}
                </Text>
              ) : null}
            </View>
            <View className="rounded-xl border border-border bg-card p-5 gap-3">
              <Text className="font-medium">Frequência semanal</Text>
              <Text className="text-sm text-muted-foreground">Recomendado: {recommended}x/semana</Text>
              <View className="flex-row flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => setChosenFrequency(freq)}
                    className={`rounded-full border px-4 py-2 ${selectedFrequency === freq ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    <Text className={selectedFrequency === freq ? 'font-semibold text-primary' : 'text-foreground'}>
                      {freq}x
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
          <View className="border-t border-border bg-card px-4 py-4 gap-2">
            <Button
              onPress={() => {
                if (selectedFrequency < recommended) {
                  Alert.alert(
                    'Frequência menor que a recomendada',
                    'Seguir com frequência abaixo da recomendada pode impactar os resultados. Deseja continuar?',
                    [
                      { text: 'Voltar', style: 'cancel' },
                      { text: 'Sim, desejo seguir', onPress: () => acceptMutation.mutate('SIM') },
                    ],
                  )
                  return
                }
                acceptMutation.mutate('SIM')
              }}
              loading={acceptMutation.isPending}
            >
              Aceitar e pagar
            </Button>
            <Button
              variant="outline"
              onPress={() =>
                Alert.alert('Recusar proposta?', 'Será gerada cobrança de R$ 50 da avaliação.', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Confirmar', style: 'destructive', onPress: () => acceptMutation.mutate('NAO') },
                ])
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
