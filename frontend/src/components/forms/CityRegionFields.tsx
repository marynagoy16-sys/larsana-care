import { useCallback } from 'react'
import { SearchCombobox } from '@/components/forms/SearchCombobox'
import { Input } from '@/components/ui/input'
import { useAllCities, useRegions } from '@/hooks/queries/useRegions'
import { getCitySearchOption, searchCities, syncCityRegion } from '@/services/regions'

interface CityRegionFieldsProps {
  cityId?: string
  regionId?: string
  onCityChange: (cityId: string, regionId: string) => void
  disabled?: boolean
  cityLabel?: string
  regionLabel?: string
}

export function CityRegionFields({
  cityId,
  regionId,
  onCityChange,
  disabled,
  cityLabel = 'Cidade',
  regionLabel = 'Região',
}: CityRegionFieldsProps) {
  const { data: cities = [], isLoading: citiesLoading } = useAllCities()
  const { data: regions = [], isLoading: regionsLoading } = useRegions()

  const handleSearch = useCallback(
    (query: string) => searchCities(query, cities),
    [cities],
  )

  const handleCityChange = useCallback(
    (nextCityId: string) => {
      const synced = syncCityRegion(nextCityId, cities)
      if (synced) onCityChange(synced.cityId, synced.regionId)
    },
    [cities, onCityChange],
  )

  const selectedRegion = regions.find((region) => region.id === regionId)
  const regionDisplay = selectedRegion
    ? `${selectedRegion.code} — ${selectedRegion.name}`
    : ''

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">{cityLabel}</label>
        <SearchCombobox
          value={cityId}
          onValueChange={handleCityChange}
          onSearch={handleSearch}
          resolveOption={getCitySearchOption}
          placeholder={citiesLoading ? 'Carregando cidades…' : 'Buscar cidade…'}
          emptyMessage="Nenhuma cidade encontrada"
          disabled={disabled || citiesLoading}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">{regionLabel}</label>
        <Input
          value={regionsLoading ? 'Carregando…' : regionDisplay}
          placeholder="Selecione a cidade"
          disabled
          readOnly
        />
      </div>
    </div>
  )
}

export function useCityRegionSync() {
  const { data: cities = [] } = useAllCities()

  return useCallback(
    (cityId: string) => syncCityRegion(cityId, cities),
    [cities],
  )
}
