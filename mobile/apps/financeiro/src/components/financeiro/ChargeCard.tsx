import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { ChargeListItem } from '@/services/charges'
import { formatCurrency, formatDate, getEffectivePaymentStatus } from '@/lib/formatters'

export function ChargeCard({ charge }: { charge: ChargeListItem }) {
  const router = useRouter()
  const status = getEffectivePaymentStatus(charge.payment_status, charge.due_date)
  const patientName = charge.patients?.full_name ?? 'Paciente'

  return (
    <Pressable onPress={() => router.push(`/(app)/cobrancas/${charge.id}`)}>
      <Card className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-lg font-bold text-foreground">{formatCurrency(charge.amount_cents)}</Text>
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>{patientName}</Text>
            {charge.due_date ? (
              <Text className="text-xs text-muted-foreground">Venc. {formatDate(charge.due_date)}</Text>
            ) : null}
          </View>
          <Badge status={status} kind="payment" />
        </View>
      </Card>
    </Pressable>
  )
}
