import { AlertTriangle, Ban, CheckCircle2, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { paymentStatusLabels } from '@/constants/labels'
import { cn } from '@/lib/utils'
import type { PaymentStatus } from '@/services/charges'

const PAYMENT_STATUS_VISUAL: Record<
  PaymentStatus,
  { icon: LucideIcon; badgeClass: string; iconBg: string; iconColor: string }
> = {
  pendente: {
    icon: Clock,
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-800 dark:text-amber-200',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100',
  },
  pago: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-800 dark:text-emerald-200',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100',
  },
  vencido: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100 dark:bg-red-950/40',
    iconColor: 'text-red-800 dark:text-red-200',
    badgeClass:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100',
  },
  cancelado: {
    icon: Ban,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    badgeClass: 'border-border bg-muted text-muted-foreground',
  },
}

export function getPaymentStatusVisual(status: string | null | undefined) {
  if (status && status in PAYMENT_STATUS_VISUAL) {
    return PAYMENT_STATUS_VISUAL[status as PaymentStatus]
  }
  return PAYMENT_STATUS_VISUAL.pendente
}

export function PaymentStatusIcon({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const visual = getPaymentStatusVisual(status)
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

export function PaymentStatusBadge({
  status,
  label,
  className,
}: {
  status: string | null | undefined
  label?: string
  className?: string
}) {
  const visual = getPaymentStatusVisual(status)
  const text = label ?? paymentStatusLabels[String(status)] ?? String(status ?? '—')

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        visual.badgeClass,
        className,
      )}
    >
      {text}
    </span>
  )
}
