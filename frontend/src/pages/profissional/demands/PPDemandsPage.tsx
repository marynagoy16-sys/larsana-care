import { useCallback, useEffect, useMemo, useState } from 'react'
import { sortDemandsByDistance } from '@/components/demands/DemandCompactCard'
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
import {
  buildAvaliacaoSimulation,
  buildContinuidadeSimulation,
  findSessionPriceCents,
} from '@/lib/demandSimulation'
import { formatCurrency } from '@/lib/formatters'
import { usePpDistanceOrigin } from '@/hooks/usePpDistanceOrigin'
import { useDemandNotificationSound } from '@/hooks/useDemandNotificationSound'
import { demandsService, type DemandListItem } from '@/services/demands'
import { getActivePricingVersion, getPricingBundle } from '@/services/pricing'
import { getCurrentProfessional } from '@/services/professionals'
import { useQuery } from '@tanstack/react-query'

const PP_DEMANDS_QUERY_KEY = ['pp', 'demands'] as const

function buildDemandColumns(
  origin: { lat: number; lng: number },
  repasseByDemandId: Map<string, number | null>,
): DataTableColumn<DemandListItem>[] {
  const distanceColumn: DataTableColumn<DemandListItem> = {
    key: 'distance_km',
    header: 'Distância',
    mobileBadge: true,
    cell: (row) => {
      if (row.location_lat == null || row.location_lng == null) {
        return <span className="text-xs text-muted-foreground">Loc. pendente</span>
      }
      const km = haversineDistanceKm(origin, { lat: row.location_lat, lng: row.location_lng })
      return formatDistanceKm(km)
    },
  }

  const repasseColumn: DataTableColumn<DemandListItem> = {
    key: 'repasse_per_session',
    header: 'Repasse/atend.',
    cell: (row) => {
      const cents = repasseByDemandId.get(String(row.id))
      if (cents == null) return '—'
      return `${formatCurrency(cents)}/atend.`
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

  return [distanceColumn, repasseColumn, neighborhoodColumn, levelColumn, ...baseWithoutStatus]
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

const PP_DEMANDS_PAGE_SIZE = 50

export function PPDemandsPage() {
  const navigate = useNavigate()
  const { setFixedMain } = useImmersiveLayout()
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null)
  const [visibleDemands, setVisibleDemands] = useState<DemandListItem[]>([])

  const handleVisibleRowsChange = useCallback((rows: DemandListItem[]) => {
    setVisibleDemands((current) => {
      if (
        current.length === rows.length &&
        current.every((row, index) => row.id === rows[index]?.id)
      ) {
        return current
      }
      return rows
    })
  }, [])

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

  const { data: pricingListContext } = useQuery({
    queryKey: ['pp', 'demands', 'pricing-list'],
    queryFn: async () => {
      const [version, professional] = await Promise.all([
        getActivePricingVersion(),
        getCurrentProfessional(),
      ])
      if (!version) return null
      const bundle = await getPricingBundle(version.id)
      return { bundle, ppClass: professional?.pp_class ?? null }
    },
  })

  const repasseByDemandId = useMemo(() => {
    const map = new Map<string, number | null>()
    if (!pricingListContext) return map
    for (const demand of demands) {
      const sessionPriceCents = findSessionPriceCents(
        pricingListContext.bundle.entries,
        demand.region_id,
        demand.patient_level,
      )
      const simulation =
        demand.demand_type === 'avaliacao'
          ? buildAvaliacaoSimulation({
              sessionPriceCents,
              commissions: pricingListContext.bundle.commissions,
              retention: pricingListContext.bundle.retention,
              ppClass: pricingListContext.ppClass,
            })
          : buildContinuidadeSimulation({
              sessionPriceCents,
              commissions: pricingListContext.bundle.commissions,
              retention: pricingListContext.bundle.retention,
              weeklyFrequency: null,
              ppClass: pricingListContext.ppClass,
            })
      map.set(String(demand.id), simulation?.rules.cycle2RepassePerSessionCents ?? null)
    }
    return map
  }, [demands, pricingListContext])

  const mapFallbackCenter = useMemo(() => {
    const source = visibleDemands.length > 0 ? visibleDemands : demands
    const points = source
      .filter((demand) => demand.location_lat != null && demand.location_lng != null)
      .map((demand) => ({ lat: demand.location_lat!, lng: demand.location_lng! }))
    return resolvePointsCenter(points.length > 0 ? points : [MAUA_CENTER])
  }, [visibleDemands, demands])

  const { origin, usingLiveLocation } = usePpDistanceOrigin(mapFallbackCenter)
  const rowsTransform = useCallback(
    (rows: DemandListItem[]) => sortDemandsByDistance(rows, origin),
    [origin],
  )
  const columns = useMemo(
    () => buildDemandColumns(origin, repasseByDemandId),
    [origin, repasseByDemandId],
  )

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

  useDemandNotificationSound(demands.length)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden max-lg:h-full">
      <EntityListPage
        title="Demandas"
        queryKey={PP_DEMANDS_QUERY_KEY}
        queryFn={() => demandsService.listOpenForPp()}
        columns={columns}
        rowsTransform={rowsTransform}
        loadMorePageSize={PP_DEMANDS_PAGE_SIZE}
        keepBeforeTableOnLoad
        showStats={false}
        showToolbar={false}
        showPagination={false}
        searchable={false}
        mobileVariant="compact"
        mobileFlush
        splitScrollOnMobile
        collapseBottomNavOnScroll
        layoutClassName="max-lg:space-y-0"
        tableSectionClassName="max-lg:px-0 lg:shell-content-x lg:pt-0"
        getMobileAvatarLabel={(row) => row.patient_abbreviation}
        getMobileTags={(row) => {
          const tags = highlightTagsByDemandId.get(row.id)
          return tags?.length ? <DemandHighlightBadges tags={tags} /> : null
        }}
        onRowClick={(row) => navigate(`/profissional/demandas/${row.id}`)}
        onVisibleRowsChange={handleVisibleRowsChange}
        beforeTable={
          <DemandsMap
            demands={visibleDemands}
            origin={origin}
            usingProfessionalAddress={usingLiveLocation}
            totalDemandCount={demands.length}
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
