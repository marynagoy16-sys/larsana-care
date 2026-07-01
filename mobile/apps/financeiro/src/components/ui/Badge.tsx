import { Text, View } from 'react-native'
import { cn } from '@/lib/cn'
import { paymentStatusLabel, transferStatusLabel } from '@/lib/formatters'

type StatusKind = 'payment' | 'transfer'

const paymentStyles: Record<string, { bg: string; text: string }> = {
  pago: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  pendente: { bg: 'bg-amber-100', text: 'text-amber-800' },
  vencido: { bg: 'bg-red-100', text: 'text-red-800' },
  cancelado: { bg: 'bg-muted', text: 'text-muted-foreground' },
}

const transferStyles: Record<string, { bg: string; text: string }> = {
  aguardando_nf: { bg: 'bg-amber-100', text: 'text-amber-800' },
  aguardando_validacao: { bg: 'bg-amber-100', text: 'text-amber-800' },
  liberado: { bg: 'bg-blue-100', text: 'text-blue-800' },
  transferido: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  falhou: { bg: 'bg-red-100', text: 'text-red-800' },
}

export function Badge({
  status,
  kind = 'payment',
  className,
}: {
  status: string
  kind?: StatusKind
  className?: string
}) {
  const styles = kind === 'transfer' ? transferStyles : paymentStyles
  const style = styles[status] ?? { bg: 'bg-muted', text: 'text-muted-foreground' }
  const label = kind === 'transfer' ? transferStatusLabel(status) : paymentStatusLabel(status)

  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', style.bg, className)}>
      <Text className={cn('text-xs font-medium', style.text)}>{label}</Text>
    </View>
  )
}
