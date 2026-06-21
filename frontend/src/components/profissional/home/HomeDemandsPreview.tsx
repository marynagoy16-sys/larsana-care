import { Link } from 'react-router-dom'
import { DemandCompactCard, sortDemandsByDistance } from '@/components/demands/DemandCompactCard'
import { Button } from '@/components/ui/button'
import type { GeoPoint } from '@/lib/geo'
import type { DemandListItem } from '@/services/demands'

const MAX_PREVIEW = 3

interface HomeDemandsPreviewProps {
  demands: DemandListItem[]
  origin: GeoPoint
  onSelectDemand: (demandId: string) => void
}

export function HomeDemandsPreview({ demands, origin, onSelectDemand }: HomeDemandsPreviewProps) {
  const preview = sortDemandsByDistance(demands, origin).slice(0, MAX_PREVIEW)

  if (preview.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground">
        Nenhuma demanda aberta no momento.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {preview.map((demand) => (
        <DemandCompactCard
          key={demand.id}
          demand={demand}
          origin={origin}
          onClick={() => onSelectDemand(demand.id)}
        />
      ))}
    </div>
  )
}

interface HomeDemandsSectionHeaderProps {
  showViewAll?: boolean
}

export function HomeDemandsSectionHeader({ showViewAll = true }: HomeDemandsSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Oportunidades
      </h2>
      {showViewAll && (
        <Button variant="ghost" size="sm" className="h-auto px-0 text-primary" asChild>
          <Link to="/profissional/demandas">Ver todas</Link>
        </Button>
      )}
    </div>
  )
}
