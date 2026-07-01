import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { TransferListItem } from '@/services/transfers'
import { formatCurrency, formatDate } from '@/lib/formatters'

export function TransferCard({ transfer }: { transfer: TransferListItem }) {
  const router = useRouter()
  const professionalName = transfer.professionals?.full_name ?? 'Profissional'

  return (
    <Pressable onPress={() => router.push(`/(app)/repasses/${transfer.id}`)}>
      <Card className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-lg font-bold text-foreground">
              {formatCurrency(transfer.pp_transfer_amount_cents)}
            </Text>
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>{professionalName}</Text>
            <Text className="text-xs text-muted-foreground">{formatDate(transfer.created_at)}</Text>
          </View>
          <Badge status={transfer.status} kind="transfer" />
        </View>
      </Card>
    </Pressable>
  )
}
