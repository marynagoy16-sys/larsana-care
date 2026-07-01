import { Text, View } from 'react-native'
import { Card } from '@/components/ui/Card'
import type { ExpenseListItem } from '@/services/expenses'
import { formatCurrency, formatReferenceMonth } from '@/lib/formatters'

export function ExpenseCard({ expense }: { expense: ExpenseListItem }) {
  return (
    <Card className="p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground">{expense.expense_type}</Text>
          <Text className="text-xs text-muted-foreground">
            {formatReferenceMonth(expense.reference_month)}
          </Text>
        </View>
        <Text className="text-lg font-bold text-foreground">{formatCurrency(expense.amount_cents)}</Text>
      </View>
    </Card>
  )
}
