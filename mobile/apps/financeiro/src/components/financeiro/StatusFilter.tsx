import { Pressable, ScrollView, Text, View } from 'react-native'
import { cn } from '@/lib/cn'

export type StatusFilterValue = 'todos' | 'pago' | 'pendente' | 'vencido'

const OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'vencido', label: 'Vencido' },
]

export function StatusFilter({
  value,
  onChange,
  options = OPTIONS,
}: {
  value: StatusFilterValue
  onChange: (v: StatusFilterValue) => void
  options?: { value: StatusFilterValue; label: string }[]
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
      <View className="flex-row gap-2">
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn(
              'rounded-full px-4 py-2',
              value === opt.value ? 'bg-primary' : 'border border-border bg-card',
            )}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                value === opt.value ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

export type TransferStatusFilter = 'todos' | 'pendente' | 'transferido'

const TRANSFER_OPTIONS: { value: TransferStatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'transferido', label: 'Transferido' },
]

export function TransferStatusFilterBar({
  value,
  onChange,
}: {
  value: TransferStatusFilter
  onChange: (v: TransferStatusFilter) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
      <View className="flex-row gap-2">
        {TRANSFER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn(
              'rounded-full px-4 py-2',
              value === opt.value ? 'bg-primary' : 'border border-border bg-card',
            )}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                value === opt.value ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
