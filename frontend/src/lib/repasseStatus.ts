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
    badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
  },
  aguardando_validacao: {
    icon: Clock,
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-800 dark:text-amber-200',
    badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
  },
  liberado: {
    icon: Unlock,
    iconBg: 'bg-blue-100 dark:bg-blue-950/40',
    iconColor: 'text-blue-800 dark:text-blue-200',
    badgeClass: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20',
  },
  transferido: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-800 dark:text-emerald-200',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  falhou: {
    icon: XCircle,
    iconBg: 'bg-red-100 dark:bg-red-950/40',
    iconColor: 'text-red-800 dark:text-red-200',
    badgeClass: 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/20',
  },
  cancelado: {
    icon: Ban,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground border-border',
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
