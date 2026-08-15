import { ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { patientLevelLabels, getPpTechnicalCategoryLabel } from '@/constants/labels'
import { Badge } from '@/components/ui/badge'
import { formatDistanceKm, haversineDistanceKm, type GeoPoint } from '@/lib/geo'
import { cn } from '@/lib/utils'
import type { DemandListItem } from '@/services/demands'

function getInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.replace(/\./g, '').charAt(0)?.toUpperCase())
    .join('')
}

function resolveDemandDistance(row: DemandListItem, origin: GeoPoint): string {
  if (row.location_lat == null || row.location_lng == null) return '—'
  const km = haversineDistanceKm(origin, { lat: row.location_lat, lng: row.location_lng })
  return formatDistanceKm(km)
}

function formatPatientLevel(level: string | null | undefined): string | null {
  if (!level) return null
  return patientLevelLabels[level] ?? level
}

interface DemandCompactCardProps {
  demand: DemandListItem
  origin: GeoPoint
  onClick?: () => void
  showChevron?: boolean
  className?: string
}

export function DemandCompactCard({
  demand,
  origin,
  onClick,
  showChevron = true,
  className,
}: DemandCompactCardProps) {
  const distance = resolveDemandDistance(demand, origin)
  const label = demand.patient_abbreviation
  const levelLabel = formatPatientLevel(demand.patient_level)
  const categoryLabel = demand.technical_category
    ? getPpTechnicalCategoryLabel(demand.technical_category)
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors',
        onClick && 'hover:bg-muted/30 active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Avatar className="h-10 w-10 shrink-0 border border-border">
        <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
          {getInitials(label)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {levelLabel && (
            <p className="truncate text-xs text-muted-foreground">{levelLabel}</p>
          )}
          {categoryLabel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
              {categoryLabel}
            </Badge>
          )}
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">{distance}</span>
      {showChevron && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  )
}

function resolveDemandDistanceKm(row: DemandListItem, origin: GeoPoint): number {
  if (row.location_lat == null || row.location_lng == null) return Number.POSITIVE_INFINITY
  return haversineDistanceKm(origin, { lat: row.location_lat, lng: row.location_lng })
}

export function sortDemandsByDistance(demands: DemandListItem[], origin: GeoPoint): DemandListItem[] {
  return [...demands].sort((a, b) => {
    const distanceA = resolveDemandDistanceKm(a, origin)
    const distanceB = resolveDemandDistanceKm(b, origin)
    if (distanceA !== distanceB) return distanceA - distanceB
    return (b.preference_match_score ?? 0) - (a.preference_match_score ?? 0)
  })
}

export function isDemandListSortedByDistance(
  demands: DemandListItem[],
  origin: GeoPoint,
): boolean {
  for (let index = 1; index < demands.length; index += 1) {
    const previous = resolveDemandDistanceKm(demands[index - 1]!, origin)
    const current = resolveDemandDistanceKm(demands[index]!, origin)
    if (current < previous) return false
  }
  return true
}
