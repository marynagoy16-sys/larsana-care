import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, CheckCircle, MapPin, Wallet, X, XCircle } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import {
  acceptDemand,
  declineDemand,
  getCurrentProfessionalId,
  getDemandDetail,
} from '@/services/demands'
import { supabase } from '@/lib/supabase'
import { getActivePricingVersion, getPricingBundle } from '@/services/pricing'
import {
  ASSESSMENT_APPROVED_PAYOUT_CENTS,
  ASSESSMENT_DECLINED_PAYOUT_CENTS,
  buildAvaliacaoSimulation,
  buildContinuidadeSimulation,
  findSessionPriceCents,
} from '@/lib/demandSimulation'
import { formatDemandLevelRegion, formatDemandLocation } from '@/lib/demandDisplay'
import { formatCurrency } from '@/lib/formatters'

function Badge({ label, variant }: { label: string; variant: 'primary' | 'secondary' }) {
  const bg = variant === 'primary' ? 'bg-primary' : 'bg-muted'
  const text = variant === 'primary' ? 'text-primary-foreground' : 'text-muted-foreground'
  return (
    <View className={`rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  )
}

function CardSection({ title, icon: Icon, children, variant }: { title: string; icon: any; children: React.ReactNode; variant?: 'default' | 'warning' }) {
  const borderColor = variant === 'warning' ? 'border-amber-200' : 'border-border'
  const bgColor = variant === 'warning' ? 'bg-amber-50/50' : 'bg-card'
  const iconColor = variant === 'warning' ? '#92400e' : '#49796B'
  return (
    <View className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden`}>
      <View className={`flex-row items-center gap-2 px-4 py-3 border-b ${variant === 'warning' ? 'border-amber-200/60' : 'border-border'}`}>
        <Icon size={16} color={iconColor} />
        <Text className={`text-sm font-semibold ${variant === 'warning' ? 'text-amber-900' : 'text-foreground'}`}>{title}</Text>
      </View>
      <View className="px-4 py-3">
        {children}
      </View>
    </View>
  )
}

export default function DemandDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [declineConfirmOpen, setDeclineConfirmOpen] = useState(false)
  const [credentialingGateOpen, setCredentialingGateOpen] = useState(false)

  const { data: demand, isLoading } = useQuery({
    queryKey: ['pp', 'demand_detail', id],
    queryFn: () => getDemandDetail(id!),
    enabled: !!id,
  })

  const { data: professionalId } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: getCurrentProfessionalId,
  })

  const { data: professional } = useQuery({
    queryKey: ['pp', 'professional_profile'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('professionals')
        .select('pp_class, credentialing_status')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const isCredentialed = professional?.credentialing_status === 'ativo'

  const { data: pricingContext } = useQuery({
    queryKey: ['demand_pricing', id, demand?.region_id, demand?.patients?.patient_level, professional?.pp_class],
    queryFn: async () => {
      const version = await getActivePricingVersion()
      if (!version) return null
      const bundle = await getPricingBundle(version.id)
      const regionId = demand?.region_id ?? demand?.patients?.region_id ?? null
      const patientLevel = demand?.patients?.patient_level ?? null
      const sessionPriceCents = findSessionPriceCents(bundle.entries, regionId, patientLevel)
      const ppClass = professional?.pp_class ?? 'BRONZE'
      return {
        sessionPriceCents,
        avaliacao: buildAvaliacaoSimulation({ sessionPriceCents, commissions: bundle.commissions, retention: bundle.retention, ppClass }),
        continuidade: buildContinuidadeSimulation({ sessionPriceCents, commissions: bundle.commissions, retention: bundle.retention, weeklyFrequency: demand?.patients?.suggested_weekly_frequency, ppClass }),
      }
    },
    enabled: !!demand,
  })

  const existingResponse =
    demand?.demand_responses?.find((r) => r.professional_id === professionalId) ?? null
  const hasResponded = !!existingResponse
  const demandClosed = demand?.status !== 'aberta'
  const showActions = !!demand && !hasResponded && !demandClosed

  const acceptMutation = useMutation({
    mutationFn: () => acceptDemand(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pp', 'demands'] })
      router.push(`/(app)/demandas/${result.demand_id}/agendar`)
    },
  })

  const declineMutation = useMutation({
    mutationFn: () =>
      declineDemand({
        demandId: id!,
        professionalId: professionalId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pp', 'demands'] })
      queryClient.invalidateQueries({ queryKey: ['pp', 'demand_detail', id] })
      setDeclineConfirmOpen(false)
      router.back()
    },
  })

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['bottom']}>
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  if (!demand) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <PageHeader>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft size={22} color="#095742" />
            </Pressable>
            <Text className="text-lg font-semibold text-foreground">Demanda</Text>
          </View>
        </PageHeader>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-muted-foreground">
            Demanda não encontrada ou não disponível.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const isAvaliacao = demand.demand_type === 'avaliacao'
  const regionCode = demand.regions?.code ?? demand.patients?.regions?.code ?? null
  const levelRegion = formatDemandLevelRegion(demand.patients?.patient_level, regionCode)
  const location = formatDemandLocation(demand, demand.demand_type)
  const simulation = isAvaliacao ? pricingContext?.avaliacao : pricingContext?.continuidade

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <View className="flex-1 flex-row items-center justify-between pr-2">
            <Text className="text-lg font-semibold text-foreground">Demanda</Text>
            <Badge label={isAvaliacao ? 'Avaliação' : 'Continuidade'} variant="primary" />
          </View>
        </View>
      </PageHeader>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32">
        <View className="rounded-xl border border-border bg-card overflow-hidden">
          <View className="border-b border-border bg-muted/20 px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isAvaliacao ? 'Avaliação inicial' : 'Continuidade'}
            </Text>
          </View>
          <View className="px-4 py-3 gap-3">
            <InfoRow label="Melhor período para o atendimento" value={demand.patients?.attendance_period ?? '—'} />
            <InfoRow label="Nível e Região" value={levelRegion} />
            <InfoRow label="Localização" value={location} />
            <InfoRow label="Hipótese Diagnóstica" value={demand.patients?.diagnostic_hypothesis ?? '—'} />
            <InfoRow label="Valor de Repasse" value={simulation?.rules.cycle2RepassePerSessionCents ? `${formatCurrency(simulation.rules.cycle2RepassePerSessionCents)} por atendimento` : '—'} />
          </View>
        </View>

        {!isAvaliacao && (
          <View className="rounded-xl border border-border bg-card overflow-hidden">
            <View className="border-b border-border bg-muted/20 px-4 py-3">
              <Text className="text-sm font-semibold text-foreground">Continuidade de atendimento — substituição de profissional</Text>
            </View>
            <View className="px-4 py-3 gap-2">
              <Text className="text-xs leading-5 text-muted-foreground">
                Este paciente já se encontra em tratamento ativo, não sendo necessária a realização de avaliação inicial.
              </Text>
              <Text className="text-xs leading-5 text-muted-foreground">
                Demanda destinada exclusivamente para substituição de profissional parceiro, garantindo a continuidade do plano terapêutico já estabelecido.
              </Text>
            </View>
          </View>
        )}

        {isAvaliacao && (
          <CardSection title="Regras de repasse" icon={Wallet}>
            {simulation ? (
              <View className="gap-2">
                <Text className="text-xs leading-5 text-foreground">
                  <Text className="font-bold">1º ciclo:</Text>{' '}
                  {simulation.rules.cycle1Percent}% por atendimento ({formatCurrency(simulation.rules.cycle1RepassePerSessionCents)})
                </Text>
                <Text className="text-xs leading-5 text-foreground">
                  <Text className="font-bold">2º ciclo em diante:</Text>{' '}
                  {simulation.rules.cycle2Percent}% por atendimento ({formatCurrency(simulation.rules.cycle2RepassePerSessionCents)})
                </Text>
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground">
                Não foi possível calcular: verifique região e nível do paciente na tabela vigente.
              </Text>
            )}
          </CardSection>
        )}

        <CardSection title="Condições do atendimento" icon={CheckCircle}>
          <View className="gap-2">
            <Text className="text-xs leading-5 text-muted-foreground">• Manutenção da frequência atual definida com o paciente</Text>
            <Text className="text-xs leading-5 text-muted-foreground">• Seguimento do plano terapêutico vigente</Text>
            <Text className="text-xs leading-5 text-muted-foreground">• Possibilidade de ajustes técnicos conforme evolução clínica (quando necessário)</Text>
          </View>
        </CardSection>

        <CardSection title="Repasse por atendimento" icon={Wallet}>
          {simulation ? (
            <View className="gap-2">
              <Text className="text-sm text-foreground">
                Considerar <Text className="font-bold">{simulation.rules.cycle2Percent}%</Text> do valor base (padrão do 2º ciclo):{' '}
                <Text className="font-bold">{formatCurrency(simulation.rules.cycle2RepassePerSessionCents)} por atendimento</Text>
              </Text>
              <Text className="text-xs text-muted-foreground">Sem desconto de avaliação.</Text>
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">
              Não foi possível calcular: verifique região e nível do paciente na tabela vigente.
            </Text>
          )}
        </CardSection>

        <CardSection title="Atenção" icon={AlertTriangle} variant="warning">
          <View className="gap-2">
            <Text className="text-xs leading-5 text-amber-900">• Atente-se à localização do paciente.</Text>
            <Text className="text-xs leading-5 text-amber-900">• Ao aceitar o paciente, verifique disponibilidade de horário na sua agenda para evitar remanejo desnecessário.</Text>
          </View>
        </CardSection>

        {isAvaliacao && (
          <CardSection title="Remuneração da avaliação" icon={CheckCircle}>
            <View className="gap-3">
              <View className="flex-row gap-3 items-start">
                <Text className="text-emerald-600 font-bold mt-0.5">✓</Text>
                <Text className="text-xs leading-5 text-muted-foreground">
                  <Text className="font-bold text-foreground">Avaliação aprovada:</Text>{' '}
                  {formatCurrency(ASSESSMENT_APPROVED_PAYOUT_CENTS)} no PIX em 7 dias e assume os atendimentos do(a) paciente (valor de adiantamento do primeiro ciclo).
                </Text>
              </View>
              <View className="flex-row gap-3 items-start">
                <Text className="text-muted-foreground font-bold mt-0.5">✗</Text>
                <Text className="text-xs leading-5 text-muted-foreground">
                  <Text className="font-bold text-foreground">Avaliação recusada:</Text>{' '}
                  {formatCurrency(ASSESSMENT_DECLINED_PAYOUT_CENTS)} em 30 dias.
                </Text>
              </View>
            </View>
          </CardSection>
        )}

        {hasResponded && (
          <View className="rounded-xl border border-border bg-muted/30 p-4 gap-3">
            <Text className="text-sm font-medium text-foreground">Você já respondeu esta demanda.</Text>
            <Text className="text-xs text-muted-foreground">
              Resposta:{' '}
              <Text className={existingResponse?.response === 'accepted' ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                {existingResponse?.response === 'accepted' ? 'Aceita' : 'Recusada'}
              </Text>
            </Text>
            {existingResponse?.response === 'accepted' && (
              <Button
                variant="default"
                onPress={() => {
                  if (isAvaliacao) {
                    router.push(`/(app)/pacientes/${demand.patient_id}`)
                  } else {
                    router.push('/(app)/agenda')
                  }
                }}
                className="w-full"
              >
                Ir para paciente
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {showActions && (
        <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/95 px-4 pt-3 pb-6">
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              onPress={() => setDeclineConfirmOpen(true)}
              className="flex-1 border-red-300 bg-red-50 text-red-700"
              disabled={acceptMutation.isPending || declineMutation.isPending}
            >
              Recusar
            </Button>
            <Button
              variant="default"
              onPress={() => {
                if (!isCredentialed) {
                  setCredentialingGateOpen(true)
                  return
                }
                acceptMutation.mutate()
              }}
              className="flex-1 bg-emerald-600"
              loading={acceptMutation.isPending}
              disabled={declineMutation.isPending}
            >
              Aceitar
            </Button>
          </View>
        </View>
      )}

      <Modal
        visible={credentialingGateOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCredentialingGateOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="rounded-2xl bg-card p-5 gap-4">
            <Text className="text-lg font-semibold text-foreground text-center">Finalizar credenciamento</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Você precisa concluir seu credenciamento antes de aceitar demandas.
            </Text>
            <Button
              variant="default"
              onPress={() => {
                setCredentialingGateOpen(false)
                router.push('/(app)/credenciamento')
              }}
            >
              Ir ao credenciamento
            </Button>
            <Button variant="outline" onPress={() => setCredentialingGateOpen(false)}>
              Voltar
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={declineConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeclineConfirmOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="rounded-2xl bg-card p-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Recusar demanda?</Text>
              <Pressable onPress={() => setDeclineConfirmOpen(false)} className="p-2">
                <X size={20} color="#49796B" />
              </Pressable>
            </View>
            <Text className="text-sm text-muted-foreground">
              A demanda será removida da sua lista de oportunidades.
            </Text>
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                onPress={() => setDeclineConfirmOpen(false)}
                className="flex-1"
                disabled={declineMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onPress={() => declineMutation.mutate()}
                className="flex-1 bg-red-600"
                loading={declineMutation.isPending}
              >
                Sim, recusar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
