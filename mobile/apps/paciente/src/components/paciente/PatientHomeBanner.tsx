import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { CreditCard, Send } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { formatAssessmentProposalSummary, formatFamilyDeadline } from '@/lib/formatters'
import { formatCurrency } from '@/lib/formatters'
import type { PatientHomeContext } from '@/services/patientPortal'

export function PatientHomeBanner({ context }: { context: PatientHomeContext }) {
  const router = useRouter()
  const { pendingProposal, pendingCharge } = context

  if (pendingProposal) {
    const summary = formatAssessmentProposalSummary(pendingProposal)
    const deadline = formatFamilyDeadline(pendingProposal)

    return (
      <View className="rounded-xl border border-amber-200 bg-amber-50/90 p-5">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Send size={20} color="#b45309" />
          </View>
          <View className="min-w-0 flex-1 gap-3">
            <View>
              <Text className="font-semibold text-amber-950">Proposta de tratamento disponível</Text>
              <Text className="mt-1 text-sm text-amber-900/85">
                {summary}
                {deadline !== '—' && deadline !== 'Após envio' ? ` · Prazo: ${deadline}` : ''}
              </Text>
            </View>
            <Button onPress={() => router.push('/(app)/proposta')}>Ver proposta e responder</Button>
          </View>
        </View>
      </View>
    )
  }

  if (pendingCharge) {
    return (
      <View className="rounded-xl border border-primary/25 bg-primary/5 p-5">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CreditCard size={20} color="#095742" />
          </View>
          <View className="min-w-0 flex-1 gap-3">
            <View>
              <Text className="font-semibold text-foreground">Pagamento pendente</Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                {formatCurrency(pendingCharge.amount_cents)}
                {pendingCharge.due_date ? ` · vence em ${pendingCharge.due_date}` : ''}
              </Text>
            </View>
            <Button onPress={() => router.push(`/(app)/pagamentos/${pendingCharge.id}`)}>
              Pagar agora
            </Button>
          </View>
        </View>
      </View>
    )
  }

  return null
}
