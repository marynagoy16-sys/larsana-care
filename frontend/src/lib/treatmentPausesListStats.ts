import { Database, PauseCircle, PlayCircle, Timer } from 'lucide-react'
import type { StatCardItem } from '@/components/crud/list-page/StatsCardRow'
import { isTreatmentPauseActive, type TreatmentPauseListRow } from '@/lib/treatmentPausesDisplay'

export function buildTreatmentPauseStatCards(rows: TreatmentPauseListRow[]): StatCardItem[] {
  const total = rows.length
  const active = rows.filter(isTreatmentPauseActive).length
  const resumed = total - active
  const recent = rows.filter((row) => {
    const paused = new Date(row.paused_at)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return paused >= cutoff
  }).length

  return [
    {
      label: 'Total',
      value: total,
      icon: Database,
      footer: 'Pausas registradas',
    },
    {
      label: 'Em pausa',
      value: active,
      icon: PauseCircle,
      footer: active > 0 ? 'Tratamentos suspensos' : 'Nenhuma pausa ativa',
    },
    {
      label: 'Retomadas',
      value: resumed,
      icon: PlayCircle,
      footer: total > 0 ? `${Math.round((resumed / total) * 100)}% encerradas` : '—',
    },
    {
      label: 'Últimos 30 dias',
      value: recent,
      icon: Timer,
      footer: 'Iniciadas no período',
    },
  ]
}
