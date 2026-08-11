import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { DemandsMap } from '@/components/demands/DemandsMap'
import { demandListColumns } from '@/components/demands/demandListColumns'
import type { DataTableColumn } from '@/components/crud/DataTable'
import { Badge } from '@/components/ui/badge'
import { useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import { patientLevelLabels } from '@/constants/labels'
import {
  annotateDemandsWithHighlights,
  demandHighlightLabels,
  type DemandHighlightTag,
  type DemandListItemWithHighlights,
} from '@/lib/demandHighlights'
import { formatDistanceKm, haversineDistanceKm, MAUA_CENTER, resolvePointsCenter } from '@/lib/geo'
import { useMapOrigin } from '@/hooks/useMapOrigin'
import { demandsService, type DemandListItem } from '@/services/demands'
import { useQuery } from '@tanstack/react-query'

const PP_DEMANDS_QUERY_KEY = ['pp', 'demands'] as const

function buildDemandColumns(origin: { lat: number; lng: number }): DataTableColumn<DemandListItem>[] {
  const distanceColumn: DataTableColumn<DemandListItem> = {
    key: 'distance_km',
    header: 'Distância',
    mobileBadge: true,
    cell: (row) => {
      if (row.location_lat == null || row.location_lng == null) return '—'
      const km = haversineDistanceKm(origin, { lat: row.location_lat, lng: row.location_lng })
      return formatDistanceKm(km)
    },
  }

  const neighborhoodColumn: DataTableColumn<DemandListItem> = {
    key: 'location_neighborhood',
    header: 'Bairro',
    cell: (row) => row.location_neighborhood ?? '—',
  }

  const levelColumn: DataTableColumn<DemandListItem> = {
    key: 'patient_level',
    header: 'Nível',
    mobileSubtitle: true,
    cell: (row) => {
      if (!row.patient_level) return '—'
      return patientLevelLabels[row.patient_level] ?? row.patient_level
    },
  }

  const baseWithoutStatus = demandListColumns.filter((col) => col.key !== 'status')

  return [distanceColumn, neighborhoodColumn, levelColumn, ...baseWithoutStatus]
}

function DemandHighlightBadges({ tags }: { tags: DemandHighlightTag[] }) {
  return (
    <>
      {tags.map((tag) => (
        <Badge
          key={tag}
          className="h-5 shrink-0 border-0 bg-brand-gold px-1.5 py-0 text-[10px] font-semibold text-white dark:text-brand-care shadow-sm"
        >
          {demandHighlightLabels[tag]}
        </Badge>
      ))}
    </>
  )
}

export function PPDemandsPage() {
  const navigate = useNavigate()
  const { setFixedMain } = useImmersiveLayout()
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setFixedMain(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      setFixedMain(false)
    }
  }, [setFixedMain])

  const { data } = useQuery({
    queryKey: PP_DEMANDS_QUERY_KEY,
    queryFn: () => demandsService.listOpenForPp(),
  })

  const demands = data?.data ?? []

  const mapFallbackCenter = useMemo(() => {
    const points = demands
      .filter((demand) => demand.location_lat != null && demand.location_lng != null)
      .map((demand) => ({ lat: demand.location_lat!, lng: demand.location_lng! }))
    return resolvePointsCenter(points.length > 0 ? points : [MAUA_CENTER])
  }, [demands])

  const { origin } = useMapOrigin(mapFallbackCenter)
  const columns = useMemo(() => buildDemandColumns(origin), [origin])

  const highlightTagsByDemandId = useMemo(() => {
    const annotated = annotateDemandsWithHighlights(demands, origin)
    return new Map(
      annotated
        .filter((demand): demand is DemandListItemWithHighlights & { highlight_tags: DemandHighlightTag[] } =>
          Boolean(demand.highlight_tags?.length),
        )
        .map((demand) => [demand.id, demand.highlight_tags]),
    )
  }, [demands, origin])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden max-lg:h-full">
      <EntityListPage
        title="Demandas"
        queryKey={PP_DEMANDS_QUERY_KEY}
        queryFn={() => demandsService.listOpenForPp()}
        columns={columns}
        showStats={false}
        showToolbar={false}
        showPagination={false}
        searchable={false}
        mobileVariant="compact"
        mobileFlush
        splitScrollOnMobile
        layoutClassName="max-lg:space-y-0"
        tableSectionClassName="max-lg:px-0 lg:shell-content-x lg:pt-0"
        getMobileAvatarLabel={(row) => row.patient_abbreviation}
        getMobileTags={(row) => {
          const tags = highlightTagsByDemandId.get(row.id)
          return tags?.length ? <DemandHighlightBadges tags={tags} /> : null
        }}
        onRowClick={(row) => navigate(`/profissional/demandas/${row.id}`)}
        beforeTable={
          <DemandsMap
            demands={demands}
            selectedId={selectedDemandId}
            onSelectDemand={(id) => {
              setSelectedDemandId(id)
              navigate(`/profissional/demandas/${id}`)
            }}
          />
        }
      />
    </div>
  )
}
