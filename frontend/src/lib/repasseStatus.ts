import {
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  Unlock,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { TransferStatus } from '@/services/ppTransfers'

export type RepasseStatusVisual = {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  badgeClass: string
}

export const REPASSE_STATUS_VISUAL: Record<TransferStatus, RepasseStatusVisual> = {
  aguardando_nf: {
    icon: FileText,
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-800 dark:text-amber-200',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100',
  },
  aguardando_validacao: {
    icon: Clock,
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-800 dark:text-amber-200',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100',
  },
  liberado: {
    icon: Unlock,
    iconBg: 'bg-blue-100 dark:bg-blue-950/40',
    iconColor: 'text-blue-800 dark:text-blue-200',
    badgeClass:
      'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100',
  },
  transferido: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-800 dark:text-emerald-200',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100',
  },
  falhou: {
    icon: XCircle,
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

const DEFAULT_VISUAL: RepasseStatusVisual = {
  icon: Wallet,
  iconBg: 'bg-primary/10',
  iconColor: 'text-primary',
  badgeClass: 'border-border bg-muted text-muted-foreground',
}

export function getRepasseStatusVisual(status: string | null | undefined): RepasseStatusVisual {
  if (status && status in REPASSE_STATUS_VISUAL) {
    return REPASSE_STATUS_VISUAL[status as TransferStatus]
  }
  return DEFAULT_VISUAL
}
