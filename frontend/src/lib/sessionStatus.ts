import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'

export type SessionStatusKey =
  | 'prevista'
  | 'realizada'
  | 'remarcada'
  | 'falta'
  | 'intercorrencia'

export type AgendaDisplayStatus = SessionStatusKey | 'evolucao_pendente'

export interface SessionStatusConfig {
  label: string
  icon: LucideIcon
  color: string
  badge: string
  agendaAccent: string
  /** Fundo esmaecido do card na timeline da agenda. */
  agendaFill: string
  /** Faixa lateral do card na timeline da agenda. */
  agendaBar: string
}

export const SESSION_STATUS_CONFIG: Record<SessionStatusKey, SessionStatusConfig> = {
  realizada: {
    label: 'Concluída',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    agendaAccent: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    agendaFill: 'bg-emerald-500/6',
    agendaBar: 'bg-emerald-500',
  },
  prevista: {
    label: 'Agendada',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
    agendaAccent: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/20',
    agendaFill: 'bg-amber-500/6',
    agendaBar: 'bg-amber-500',
  },
  remarcada: {
    label: 'Remarcada',
    icon: RefreshCw,
    color: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    agendaAccent: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
    agendaFill: 'bg-blue-500/6',
    agendaBar: 'bg-blue-500',
  },
  falta: {
    label: 'Falta',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    agendaAccent: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
    agendaFill: 'bg-amber-600/6',
    agendaBar: 'bg-amber-600',
  },
  intercorrencia: {
    label: 'Intercorrência',
    icon: AlertTriangle,
    color: 'text-destructive',
    badge: 'bg-destructive/10 text-destructive',
    agendaAccent: 'bg-destructive/10 text-destructive border-destructive/20',
    agendaFill: 'bg-destructive/6',
    agendaBar: 'bg-destructive',
  },
}

export const EVOLUCAO_PENDENTE_CONFIG: SessionStatusConfig = {
  label: 'Evolução pendente',
  icon: FileWarning,
  color: 'text-amber-600 dark:text-amber-400',
  badge: 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
  agendaAccent: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/20',
  agendaFill: 'bg-amber-500/8',
  agendaBar: 'bg-amber-500',
}

export function resolveAgendaDisplayStatus(
  status: string,
  hasEvolution: boolean,
): AgendaDisplayStatus {
  if (status === 'realizada' && !hasEvolution) return 'evolucao_pendente'
  return (status as SessionStatusKey) in SESSION_STATUS_CONFIG
    ? (status as SessionStatusKey)
    : 'prevista'
}

export function getAgendaStatusConfig(displayStatus: AgendaDisplayStatus): SessionStatusConfig {
  if (displayStatus === 'evolucao_pendente') return EVOLUCAO_PENDENTE_CONFIG
  return SESSION_STATUS_CONFIG[displayStatus]
}
