import { MetricCard, type MetricCardProps } from '@/components/dashboard/MetricCard'
import { cn } from '@/lib/utils'

export type MetricCardItem = MetricCardProps

interface MetricCardRowProps {
  cards: MetricCardItem[]
  columns?: 2 | 3 | 4 | 5 | 6
  isLoading?: boolean
  className?: string
}

const columnClass = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
}

export function MetricCardRow({ cards, columns = 4, isLoading, className }: MetricCardRowProps) {
  return (
    <div className={cn('grid gap-4 items-stretch', columnClass[columns], className)}>
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} isLoading={isLoading ?? card.isLoading} />
      ))}
    </div>
  )
}
