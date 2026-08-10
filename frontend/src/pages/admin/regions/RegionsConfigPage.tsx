import { useMemo, useState } from 'react'
import { Building2, MapPin, Settings2 } from 'lucide-react'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { RegionGeographyDrawer } from '@/components/regions/RegionGeographyDrawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listRegionsWithStats, regionsQueryKeys, type RegionTableRow } from '@/services/regions'
import type { Database } from '@/types/database'

type Region = Database['public']['Tables']['regions']['Row']

export function RegionsConfigPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [rows, setRows] = useState<RegionTableRow[]>([])

  const openDrawer = (region: Region) => {
    setSelectedRegion(region)
    setDrawerOpen(true)
  }

  const stats = useMemo(() => {
    const totalCities = rows.reduce((sum, row) => sum + row.city_count, 0)
    const totalNeighborhoods = rows.reduce((sum, row) => sum + row.neighborhood_count, 0)

    return [
      {
        label: 'Regiões',
        value: rows.length,
        icon: MapPin,
        footer: 'Regiões e cidades',
      },
      {
        label: 'Cidades',
        value: totalCities,
        icon: Building2,
        footer: 'Na cobertura operacional',
      },
      {
        label: 'Bairros',
        value: totalNeighborhoods,
        icon: Settings2,
        footer: 'Selecionados nas regiões',
      },
      {
        label: 'Catálogo SP',
        value: 645,
        icon: MapPin,
        footer: 'Municípios disponíveis no banco',
      },
    ]
  }, [rows])

  return (
    <>
      <EntityListPage
        title="Regiões e cidades"
        description="Configure cidades e bairros de cobertura por região operacional (A, B, C)"
        queryKey={regionsQueryKeys.regionsWithStats}
        queryFn={async () => {
          const data = await listRegionsWithStats()
          setRows(data)
          return { data, count: data.length }
        }}
        stats={stats}
        statsColumns={4}
        pageSizeDefault={10}
        searchPlaceholder="Pesquisar regiões..."
        emptyMessage="Nenhuma região cadastrada"
        exportFileName="regioes"
        onRowClick={(row) => openDrawer(row as RegionTableRow)}
        columns={[
          {
            key: 'code',
            header: 'Região',
            mobilePrimary: true,
            cell: (row) => (
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {String(row.code)}
                </span>
                <span className="font-medium">{String(row.name)}</span>
              </div>
            ),
          },
          {
            key: 'cities_description',
            header: 'Descrição',
            cell: (row) => String(row.cities_description ?? '—'),
          },
          {
            key: 'city_count',
            header: 'Cidades',
            cell: (row) => (
              <Badge variant="outline">
                {String(row.city_count)} cidade{Number(row.city_count) === 1 ? '' : 's'}
              </Badge>
            ),
          },
          {
            key: 'neighborhood_count',
            header: 'Bairros',
            cell: (row) => (
              <Badge variant="outline">
                {String(row.neighborhood_count)} bairro{Number(row.neighborhood_count) === 1 ? '' : 's'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: '',
            cell: (row) => (
              <Button
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation()
                  openDrawer(row as RegionTableRow)
                }}
              >
                <Settings2 className="mr-1.5 size-3.5" />
                Configurar
              </Button>
            ),
          },
        ]}
      />

      <RegionGeographyDrawer
        region={selectedRegion}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setSelectedRegion(null)
        }}
      />
    </>
  )
}
