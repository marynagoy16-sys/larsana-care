import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'expo-router'
import {
  ensureReferralCode,
  getCurrentProfessionalId,
  getPpPointsSettings,
  getProfessionalPointsProfile,
  patenteLabels,
  PATENTE_REPASSE_PERCENT,
  resolveNextPatenteTarget,
} from '@/services/ppPoints'

export default function MinhaEvolucaoScreen() {
  const router = useRouter()

  const { data: professionalId } = useQuery({
    queryKey: ['pp', 'professional_id'],
    queryFn: getCurrentProfessionalId,
  })

  const { data: settings } = useQuery({
    queryKey: ['pp_points_settings'],
    queryFn: getPpPointsSettings,
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['pp', 'points_profile', professionalId],
    queryFn: () => getProfessionalPointsProfile(professionalId!),
    enabled: !!professionalId,
  })

  const { data: referralCode } = useQuery({
    queryKey: ['pp', 'referral_code', professionalId],
    queryFn: () => ensureReferralCode(professionalId!),
    enabled: !!professionalId,
  })

  const patente = profile?.patente ?? 'ALUMINIO'
  const points = profile?.points_total ?? 0
  const nextTarget =
    settings && profile ? resolveNextPatenteTarget(points, settings, patente) : null

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Trophy size={20} color="#095742" />
          <Text className="font-display text-xl font-bold text-foreground">Minha evolução</Text>
        </View>
      </PageHeader>

      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-28">
        <View className="rounded-xl border border-border bg-card p-5 gap-2">
          <Text className="text-sm text-muted-foreground">Patente atual</Text>
          <Text className="font-display text-2xl font-bold text-foreground">{patenteLabels[patente]}</Text>
          <Text className="text-3xl font-bold text-foreground">
            {points} <Text className="text-base font-normal text-muted-foreground">pontos</Text>
          </Text>
          <Text className="text-sm text-muted-foreground">{PATENTE_REPASSE_PERCENT[patente]}% repasse</Text>
          {nextTarget && settings?.show_next_tier_hint ? (
            <Text className="text-sm text-muted-foreground">
              Faltam {Math.max(0, nextTarget.threshold - points)} pts para {patenteLabels[nextTarget.patente]}
            </Text>
          ) : null}
        </View>

        {patente === 'ALUMINIO' ? (
          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <Text className="font-semibold text-sm text-foreground">Indique um colega</Text>
            <Text className="text-sm text-muted-foreground">
              Ganhe 50 pontos por indicação (máx. 3) enquanto estiver na patente Alumínio.
            </Text>
            <Text className="text-xs text-muted-foreground">
              Indicações confirmadas: {profile?.referral_count_pre_bronze ?? 0}/3
            </Text>
            <Text className="rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-sm">
              {referralCode ?? '…'}
            </Text>
          </View>
        ) : null}

        <View className="rounded-xl border border-border bg-card p-5 gap-3">
          <Text className="font-semibold text-sm text-foreground">Próximos passos</Text>
          <Text className="text-sm text-muted-foreground">• Complete seu credenciamento para ganhar +300 pts</Text>
          <Text className="text-sm text-muted-foreground">• Conclua cursos no Academy para subir de patente</Text>
          <View className="flex-row flex-wrap gap-2 pt-1">
            <Button variant="outline" onPress={() => router.push('/(app)/credenciamento')}>
              Continuar cadastro
            </Button>
            <Button variant="outline" onPress={() => router.push('/(app)/academy')}>
              Ir ao Academy
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
