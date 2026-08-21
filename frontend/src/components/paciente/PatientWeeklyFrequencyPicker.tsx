import { cn } from '@/lib/utils'
import { weeklyFrequencyLabels } from '@/constants/labels'
import { formatCurrency } from '@/lib/formatters'
import type { ProposalOption } from '@/services/assessmentFamilyResponse'

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
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold text-sm">Com que frequência deseja as sessões?</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Escolha entre as opções sugeridas com base na avaliação do profissional
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sorted.map((option) => {
          const freq = option.weekly_frequency
          const selected = value === freq
          const isRecommended = option.is_recommended || freq === recommended
          return (
            <button
              key={freq}
              type="button"
              onClick={() => onChange(freq)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border px-2 py-4 text-center transition-colors',
                selected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:bg-muted/40',
              )}
            >
              <span className={cn('text-lg font-bold', selected && 'text-primary')}>
                {freq}x
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {weeklyFrequencyLabels[freq]?.replace(' por semana', '/sem') ?? `${freq}/sem`}
              </span>
              <span className="text-[11px] font-semibold text-foreground">
                {formatCurrency(option.total_amount_cents)}
              </span>
              <span className="text-[10px] text-muted-foreground">{option.session_count} sessões</span>
              {isRecommended && (
                <span className="text-[10px] font-medium text-primary mt-0.5">Recomendado</span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function buildFrequencyDisclaimer(recommended: number): string {
  const dayWord = recommended === 1 ? 'sessão semanal' : 'sessões semanais'
  return `O fisioterapeuta recomendou ${recommended} ${dayWord}. Escolher uma frequência menor pode impactar os resultados do tratamento. Deseja seguir?`
}
