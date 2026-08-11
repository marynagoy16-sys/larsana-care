import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Sparkles } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { CoverageMapIllustration } from '@/components/paciente/CoverageMapIllustration'
import { ServiceRequestTimeline } from '@/components/paciente/ServiceRequestTimeline'
import {
  getPatientServiceStatus,
  joinWaitlist,
  patientServiceQueryKeys,
  requestAttendance,
} from '@/services/patientServiceRequest'

function formatRegionLabel(regionCode?: string | null, regionName?: string | null): string | null {
  if (!regionName) return null
  if (regionCode && regionCode !== regionName) return `${regionCode} · ${regionName}`
  return regionName
}

export default function SolicitarScreen() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: patientServiceQueryKeys.status,
    queryFn: getPatientServiceStatus,
  })

  const requestMutation = useMutation({
    mutationFn: () => requestAttendance(),
    onSuccess: (result) => {
      if (!result.success && result.reason === 'no_coverage') {
        Alert.alert('Estamos chegando', result.message ?? 'Sua região ainda não possui cobertura.')
        return
      }
      queryClient.invalidateQueries({ queryKey: patientServiceQueryKeys.status })
      if (result.already_exists) {
        Alert.alert('Solicitação em andamento', 'Você já possui uma solicitação ativa.')
      } else {
        Alert.alert('Solicitação enviada', 'Estamos procurando um profissional parceiro para você.')
      }
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
  const serviceAvailable = data.service_available === true
  const showComingSoon = !serviceAvailable
  const busy = requestMutation.isPending || waitlistMutation.isPending || isRefetching

  const regionLabel = formatRegionLabel(data.region_code, data.region_name)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-5 py-4 pb-28">
        <CoverageMapIllustration variant={showComingSoon ? 'coming_soon' : 'searching'} />

        {regionLabel ? (
          <View className="flex-row items-center justify-center gap-2">
            <MapPin size={16} color="#49796B" />
            <Text className="text-sm text-muted-foreground">Região {regionLabel}</Text>
          </View>
        ) : null}

        {showComingSoon ? (
          <View className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 gap-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={18} color="#095742" />
              <Text className="font-semibold text-foreground">Estamos chegando!</Text>
            </View>
            <Text className="text-sm leading-5 text-muted-foreground">
              Ainda não temos profissionais parceiros atuando na sua região. Enquanto isso, explore o LarsanaPill
              com orientações e exercícios para casa.
            </Text>
            {!hasWaitlist ? (
              <Button onPress={() => waitlistMutation.mutate()} loading={waitlistMutation.isPending} disabled={busy}>
                Desejo iniciar tratamento
              </Button>
            ) : (
              <Text className="text-sm font-medium text-primary">Você já está na nossa lista de espera.</Text>
            )}
          </View>
        ) : (
          <View className="gap-3">
            {!hasActiveDemand ? (
              <>
                <Text className="text-sm text-muted-foreground">
                  Ao confirmar, enviaremos sua solicitação para profissionais parceiros disponíveis. Você não escolhe
                  o profissional — quem aceitar primeiro iniciará o contato com a Larsana.
                </Text>
                <Button onPress={() => requestMutation.mutate()} loading={requestMutation.isPending} disabled={busy}>
                  Solicitar profissional parceiro
                </Button>
              </>
            ) : (
              <Text className="text-sm font-medium text-primary">Sua solicitação já está em andamento.</Text>
            )}
          </View>
        )}

        {(hasActiveDemand || hasWaitlist) && (
          <ServiceRequestTimeline
            demand={data.active_demand}
            hasWaitlist={hasWaitlist}
            createdAt={data.active_demand?.created_at ?? data.waitlist?.created_at}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
