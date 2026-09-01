import { cn } from '@/lib/utils'

const SCORES = Array.from({ length: 11 }, (_, index) => index)

type NpsScorePickerProps = {
  value: number
  onChange: (score: number) => void
}

export function NpsScorePicker({ value, onChange }: NpsScorePickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-2" role="group" aria-label="Nota de 0 a 10">
        {SCORES.map((score) => {
          const selected = value === score
          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              aria-label={`Nota ${score}`}
              aria-pressed={selected}
              className={cn(
                'flex h-11 items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:bg-muted/40',
              )}
            >
              {score}
            </button>
          )
        })}
      </div>
    </div>
  )
}
