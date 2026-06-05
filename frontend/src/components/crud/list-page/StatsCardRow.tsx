import { MetricCardRow, type MetricCardItem } from '@/components/dashboard/MetricCardRow'

export type StatCardItem = MetricCardItem

interface StatsCardRowProps {
  cards: StatCardItem[]
  columns?: 2 | 3 | 4 | 5 | 6
  isLoading?: boolean
}

/** @deprecated Use MetricCardRow directly. Mantido para compatibilidade com listagens. */
export function StatsCardRow({ cards, columns = 6, isLoading }: StatsCardRowProps) {
  return <MetricCardRow cards={cards} columns={columns} isLoading={isLoading} />
}
