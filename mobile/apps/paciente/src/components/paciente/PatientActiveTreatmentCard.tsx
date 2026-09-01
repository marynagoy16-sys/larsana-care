import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Calendar, UserRound } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/cn'
import type { ActiveCycleSummary } from '@/services/patientPortal'

type PatientActiveTreatmentCardProps = {
  cycle: ActiveCycleSummary
  professionalNameFallback?: string | null
  featured?: boolean
}

export function PatientActiveTreatmentCard({
  cycle,
  professionalNameFallback,
  featured = false,
}: PatientActiveTreatmentCardProps) {
  const router = useRouter()
  const professionalName = cycle.professionalName ?? professionalNameFallback ?? null
  const progressPct = cycle.session_count > 0 ? (cycle.completedSessions / cycle.session_count) * 100 : 0

  return (
    <View
      className={cn(
        'overflow-hidden rounded-xl bg-card',
        featured ? 'border-2 border-primary/25 shadow-md' : 'border border-border',
      )}
    >
      <View
        className={cn(
          'flex-row items-center justify-between gap-3 border-b px-5 py-4',
          featured ? 'border-primary/15 bg-primary/5' : 'border-border',
        )}
      >
        <View>
          <Text className={cn('font-semibold text-foreground', featured ? 'text-base' : 'text-sm')}>
            Tratamento ativo
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">Ciclo #{cycle.cycle_number}</Text>
        </View>
        <Text className="text-sm font-bold text-foreground">
          {cycle.completedSessions}/{cycle.session_count}
        </Text>
      </View>
      <View className="gap-4 p-5">
        <View className="h-1.5 overflow-hidden rounded-full bg-muted">
          <View className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
        </View>
        {professionalName ? (
          <View className="flex-row items-center gap-2">
            <UserRound size={16} color="#49796B" />
            <Text className="text-sm text-muted-foreground">
              Profissional: <Text className="font-medium text-foreground">{professionalName}</Text>
            </Text>
          </View>
        ) : null}
        {cycle.nextSessionAt ? (
          <View className="flex-row items-center gap-2">
            <Calendar size={16} color="#49796B" />
            <Text className="text-sm text-muted-foreground">
              Próxima terapia:{' '}
              <Text className="font-medium text-foreground">{formatDateTime(cycle.nextSessionAt)}</Text>
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground">Nenhuma terapia prevista no momento.</Text>
        )}
        <View className="gap-2">
          <Button onPress={() => router.push(`/(app)/tratamento/ciclo/${cycle.id}`)}>
            Ver detalhes do ciclo
          </Button>
          {featured ? (
            <Button variant="outline" onPress={() => router.push('/(app)/(tabs)/tratamento')}>
              Meu tratamento
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  )
}
