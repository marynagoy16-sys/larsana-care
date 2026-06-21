import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { DemandsMap } from '@/components/demands/DemandsMap'
import { demandListColumns } from '@/components/demands/demandListColumns'
import type { DataTableColumn } from '@/components/crud/DataTable'
import { patientLevelLabels } from '@/constants/labels'
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

export function PPDemandsPage() {
  const navigate = useNavigate()
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null)

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

  return (
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
      getMobileAvatarLabel={(row) => row.patient_abbreviation}
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
  )
}
