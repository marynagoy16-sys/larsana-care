import { cn } from '@/lib/utils'

interface LarsanaPillCategoryChipProps {
  label: string
  code: string
  active?: boolean
  onClick?: () => void
}

export function LarsanaPillCategoryChip({ label, code, active, onClick }: LarsanaPillCategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-secondary',
      )}
    >
      <span className="text-xs opacity-80">{code}</span>
      {label}
    </button>
  )
}
