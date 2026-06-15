import { cn } from '@/lib/utils'
import { weeklyFrequencyLabels } from '@/constants/labels'

const OPTIONS = [1, 2, 3] as const

type PatientWeeklyFrequencyPickerProps = {
  value: number
  recommended: number
  onChange: (frequency: number) => void
}

export function PatientWeeklyFrequencyPicker({
  value,
  recommended,
  onChange,
}: PatientWeeklyFrequencyPickerProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold text-sm">Com que frequência deseja as sessões?</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Escolha quantas vezes por semana o profissional deve visitar o paciente
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((freq) => {
          const selected = value === freq
          const isRecommended = freq === recommended
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
