import { Calendar, ClipboardList, Clock, MapPin } from 'lucide-react'
import { MetricCardRow } from '@/components/dashboard/MetricCardRow'
import type { AgendaDaySummary } from '@/services/ppAgenda'

interface HomeDayKpiRowProps {
  summary: AgendaDaySummary
  pendingEvolutionsCount: number
  demandsCount: number
  nearbyDemandsCount: number
  isLoading?: boolean
}

export function HomeDayKpiRow({
  summary,
  pendingEvolutionsCount,
  demandsCount,
  nearbyDemandsCount,
  isLoading,
}: HomeDayKpiRowProps) {
  const demandsValue = nearbyDemandsCount > 0 ? nearbyDemandsCount : demandsCount
  const demandsLabel = nearbyDemandsCount > 0 ? 'Demandas próximas' : 'Demandas abertas'

  return (
    <MetricCardRow
      isLoading={isLoading}
      columns={4}
      cards={[
        {
          label: 'Sessões hoje',
          value: summary.total,
          icon: Calendar,
          href: '/profissional/agenda',
        },
        {
          label: 'Agendadas',
          value: summary.scheduled,
          icon: Clock,
          href: '/profissional/agenda',
        },
        {
          label: 'Evoluções pendentes',
          value: pendingEvolutionsCount,
          icon: ClipboardList,
          href: '/profissional/evolucoes',
        },
        {
          label: demandsLabel,
          value: demandsValue,
          icon: MapPin,
          href: '/profissional/demandas',
        },
      ]}
    />
  )
}
