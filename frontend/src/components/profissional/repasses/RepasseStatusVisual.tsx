import { cn } from '@/lib/utils'
import { getRepasseStatusVisual } from '@/lib/repasseStatus'

type RepasseStatusIconProps = {
  status: string | null | undefined
  className?: string
}

export function RepasseStatusIcon({ status, className }: RepasseStatusIconProps) {
  const visual = getRepasseStatusVisual(status)
  const Icon = visual.icon

  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        visual.iconBg,
        visual.iconColor,
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </div>
  )
}

type RepasseStatusBadgeProps = {
  status: string | null | undefined
  label: string
  className?: string
}

export function RepasseStatusBadge({ status, label, className }: RepasseStatusBadgeProps) {
  const visual = getRepasseStatusVisual(status)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        visual.badgeClass,
        className,
      )}
    >
      {label}
    </span>
  )
}
