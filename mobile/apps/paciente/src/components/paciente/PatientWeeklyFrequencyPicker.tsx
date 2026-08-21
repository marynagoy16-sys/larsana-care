import { Pressable, Text, View } from 'react-native'
import { formatCurrency } from '@/lib/formatters'
import type { ProposalOption } from '@/services/assessmentFamilyResponse'

const weeklyFrequencyLabels: Record<number, string> = {
  1: '1x/sem',
  2: '2x/sem',
  3: '3x/sem',
  4: '4x/sem',
  5: '5x/sem',
}

type PatientWeeklyFrequencyPickerProps = {
  value: number
  recommended: number
  options: ProposalOption[]
  onChange: (frequency: number) => void
}

export function PatientWeeklyFrequencyPicker({
  value,
  recommended,
  options,
  onChange,
}: PatientWeeklyFrequencyPickerProps) {
  const sorted = [...options].sort((a, b) => a.weekly_frequency - b.weekly_frequency)

  return (
    <View className="gap-3">
      <View>
        <Text className="font-semibold text-sm">Com que frequência deseja as sessões?</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          Escolha entre as opções sugeridas com base na avaliação do profissional
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {sorted.map((option) => {
          const freq = option.weekly_frequency
          const selected = value === freq
          const isRecommended = option.is_recommended || freq === recommended
          return (
            <Pressable
              key={freq}
              onPress={() => onChange(freq)}
              className={`min-w-[30%] flex-1 items-center gap-1 rounded-xl border px-2 py-4 ${
                selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <Text className={`text-lg font-bold ${selected ? 'text-primary' : 'text-foreground'}`}>
                {freq}x
              </Text>
              <Text className="text-[11px] text-muted-foreground text-center">
                {weeklyFrequencyLabels[freq] ?? `${freq}/sem`}
              </Text>
              <Text className="text-[11px] font-semibold text-foreground">
                {formatCurrency(option.total_amount_cents)}
              </Text>
              <Text className="text-[10px] text-muted-foreground">{option.session_count} sessões</Text>
              {isRecommended ? (
                <Text className="text-[10px] font-medium text-primary mt-0.5">Recomendado</Text>
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export function buildFrequencyDisclaimer(recommended: number): string {
  const dayWord = recommended === 1 ? 'sessão semanal' : 'sessões semanais'
  return `O fisioterapeuta recomendou ${recommended} ${dayWord}. Escolher uma frequência menor pode impactar os resultados do tratamento. Deseja seguir?`
}
