export type SessionStatusKey =
  | 'prevista'
  | 'realizada'
  | 'remarcada'
  | 'falta'
  | 'intercorrencia'

export type AgendaDisplayStatus = SessionStatusKey | 'evolucao_pendente'

export interface SessionStatusConfig {
  label: string
  badge: string
  agendaBar: string
}

export const SESSION_STATUS_CONFIG: Record<SessionStatusKey, SessionStatusConfig> = {
  realizada: {
    label: 'Concluída',
    badge: 'bg-emerald-500/10 text-emerald-700',
    agendaBar: 'bg-emerald-500',
  },
  prevista: {
    label: 'Agendada',
    badge: 'bg-amber-500/10 text-amber-800',
    agendaBar: 'bg-amber-500',
  },
  remarcada: {
    label: 'Remarcada',
    badge: 'bg-blue-500/10 text-blue-700',
    agendaBar: 'bg-blue-500',
  },
  falta: {
    label: 'Falta',
    badge: 'bg-amber-500/10 text-amber-700',
    agendaBar: 'bg-amber-600',
  },
  intercorrencia: {
    label: 'Intercorrência',
    badge: 'bg-destructive/10 text-destructive',
    agendaBar: 'bg-destructive',
  },
}

export const EVOLUCAO_PENDENTE_CONFIG: SessionStatusConfig = {
  label: 'Evolução pendente',
  badge: 'bg-amber-500/10 text-amber-800',
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
