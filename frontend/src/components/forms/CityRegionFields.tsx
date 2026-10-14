import { useCallback } from 'react'
import { SearchCombobox } from '@/components/forms/SearchCombobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllCities, useRegions } from '@/hooks/queries/useRegions'
import { getCitySearchOption, searchCities, syncCityRegion } from '@/services/regions'

interface CityRegionFieldsProps {
  cityId?: string
  regionId?: string
  onCityChange: (cityId: string, regionId: string) => void
  disabled?: boolean
  cityLabel?: string
  regionLabel?: string
  hideRegion?: boolean
}

export function CityRegionFields({
  cityId,
  regionId,
  onCityChange,
  disabled,
  cityLabel = 'Cidade',
  regionLabel = 'Região',
  hideRegion = false,
}: CityRegionFieldsProps) {
  const { data: cities = [], isLoading: citiesLoading } = useAllCities()
  const { data: regions = [], isLoading: regionsLoading } = useRegions()

  const handleSearch = useCallback(
    (query: string) => searchCities(query, cities),
    [cities],
  )

  const handleCityChange = useCallback(
    (nextCityId: string) => {
      if (!nextCityId) {
        onCityChange('', regionId ?? '')
        return
      }
      const synced = syncCityRegion(nextCityId, cities)
      if (synced) onCityChange(synced.cityId, synced.regionId)
    },
    [cities, onCityChange, regionId],
  )

  const handleRegionChange = useCallback(
    (value: string) => {
      const nextRegionId = value === '__none__' ? '' : value
      const cityStillValid = Boolean(
        cityId && cities.some((city) => city.id === cityId && city.region_id === nextRegionId),
      )
      onCityChange(cityStillValid && cityId ? cityId : '', nextRegionId)
    },
    [cities, cityId, onCityChange],
  )

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
          disabled={disabled}
        />
      </div>
      {!hideRegion ? (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">{regionLabel}</label>
          <Select
            value={regionId || '__none__'}
            onValueChange={handleRegionChange}
            disabled={disabled || regionsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={regionsLoading ? 'Carregando…' : 'Selecione a região'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Não informada</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.code} — {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
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
