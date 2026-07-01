import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Calendar, UserRound } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/formatters'
import type { ActiveCycleSummary } from '@/services/patientPortal'

export function PatientActiveTreatmentCard({ cycle }: { cycle: ActiveCycleSummary }) {
  const router = useRouter()
  const progress = cycle.session_count > 0 ? Math.round((cycle.completedSessions / cycle.session_count) * 100) : 0

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <View className="flex-row items-center justify-between gap-3 border-b border-border px-5 py-4">
        <View>
          <Text className="text-sm font-semibold text-foreground">Tratamento ativo</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">Ciclo #{cycle.cycle_number}</Text>
        </View>
        <Text className="text-sm font-semibold text-primary">{progress}%</Text>
      </View>
      <View className="gap-3 p-5">
        {cycle.professionalName ? (
          <View className="flex-row items-center gap-2">
            <UserRound size={16} color="#5A7920" />
            <Text className="text-sm text-muted-foreground">
              Profissional: <Text className="font-medium text-foreground">{cycle.professionalName}</Text>
            </Text>
          </View>
        ) : null}
        {cycle.nextSessionAt ? (
          <View className="flex-row items-center gap-2">
            <Calendar size={16} color="#5A7920" />
            <Text className="text-sm text-muted-foreground">
              Próxima sessão:{' '}
              <Text className="font-medium text-foreground">{formatDateTime(cycle.nextSessionAt)}</Text>
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-muted-foreground">Nenhuma sessão prevista no momento.</Text>
        )}
        <Text className="text-xs text-muted-foreground">
          {cycle.completedSessions} de {cycle.session_count} sessões realizadas
        </Text>
        <Button variant="outline" onPress={() => router.push(`/(app)/tratamento/ciclo/${cycle.id}`)}>
          Ver detalhes do ciclo
        </Button>
      </View>
    </View>
  )
}
