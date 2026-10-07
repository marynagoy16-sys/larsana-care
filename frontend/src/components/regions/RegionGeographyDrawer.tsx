import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, MapPin, X } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchCombobox } from '@/components/forms/SearchCombobox'
import { FormActions } from '@/components/crud/FormActions'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { cn } from '@/lib/utils'
import {
  getSpMunicipalityById,
  listSpMunicipalities,
  listSpMunicipalitiesByIds,
  listSpNeighborhoods,
} from '@/services/spGeography'
import {
  listRegionGeography,
  regionsQueryKeys,
  syncCityNeighborhoods,
  syncRegionCities,
} from '@/services/regions'
import { REGION_DRAWER_SHEET_CLASS } from '@/components/regions/regionDrawerShared'
import type { Database } from '@/types/database'

type Region = Database['public']['Tables']['regions']['Row']

interface RegionGeographyDrawerProps {
  region: Region | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function NeighborhoodCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors',
        checked ? 'border-primary/25 bg-primary/[0.06]' : 'border-border/60 bg-background hover:bg-muted/30',
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
      <span className="truncate">{label}</span>
    </label>
  )
}

export function RegionGeographyDrawer({ region, open, onOpenChange }: RegionGeographyDrawerProps) {
  const queryClient = useQueryClient()
  const [regionMunicipalityIds, setRegionMunicipalityIds] = useState<Set<string>>(new Set())
  const [activeMunicipalityId, setActiveMunicipalityId] = useState('')
  const [selectedNeighborhoodIds, setSelectedNeighborhoodIds] = useState<Record<string, Set<string>>>({})
  const [saving, setSaving] = useState(false)
  const selectionDirtyRef = useRef(false)

  const regionId = region?.id ?? ''
  const regionIdsKey = [...regionMunicipalityIds].sort().join(',')

  const { data: geography, isLoading: loadingGeography } = useQuery({
    queryKey: regionsQueryKeys.geography(regionId),
    queryFn: () => listRegionGeography(regionId),
    enabled: open && !!regionId,
  })

  const { data: regionMunicipalities = [], isLoading: loadingMunicipalities } = useQuery({
    queryKey: ['sp_municipalities', 'region', regionIdsKey],
    queryFn: () => listSpMunicipalitiesByIds([...regionMunicipalityIds]),
    enabled: open && regionMunicipalityIds.size > 0,
  })

  const { data: activeNeighborhoods = [], isLoading: loadingNeighborhoods } = useQuery({
    queryKey: regionsQueryKeys.spNeighborhoods(activeMunicipalityId),
    queryFn: () => listSpNeighborhoods(activeMunicipalityId),
    enabled: open && !!activeMunicipalityId,
  })

  const searchCities = useCallback(async (query: string) => {
    const results = await listSpMunicipalities(query)
    return results.slice(0, 20).map((m) => ({
      id: m.id,
      label: m.name,
      subtitle: `IBGE ${m.ibge_code}`,
    }))
  }, [])

  const resolveCity = useCallback(async (id: string) => {
    const municipality = await getSpMunicipalityById(id)
    return {
      id: municipality.id,
      label: municipality.name,
      subtitle: `IBGE ${municipality.ibge_code}`,
    }
  }, [])

  useEffect(() => {
    if (!open) {
      selectionDirtyRef.current = false
      setRegionMunicipalityIds(new Set())
      setActiveMunicipalityId('')
      setSelectedNeighborhoodIds({})
      return
    }
    if (!geography || selectionDirtyRef.current) return

    const ids = geography.cities
      .map((c) => c.sp_municipality_id)
      .filter(Boolean) as string[]

    setRegionMunicipalityIds(new Set(ids))
    setActiveMunicipalityId((current) => current || ids[0] || '')

    const hoodState: Record<string, Set<string>> = {}
    for (const city of geography.cities) {
      if (!city.sp_municipality_id) continue
      hoodState[city.sp_municipality_id] = new Set(
        (geography.neighborhoodsByCity[city.id] ?? [])
          .map((n) => n.sp_neighborhood_id)
          .filter(Boolean) as string[],
      )
    }
    setSelectedNeighborhoodIds(hoodState)
  }, [geography, open])

  const activeMunicipality = useMemo(
    () => regionMunicipalities.find((m) => m.id === activeMunicipalityId),
    [regionMunicipalities, activeMunicipalityId],
  )

  const selectedHoodCount = selectedNeighborhoodIds[activeMunicipalityId]?.size ?? 0

  const addCityToRegion = (municipalityId: string) => {
    selectionDirtyRef.current = true
    setRegionMunicipalityIds((current) => new Set([...current, municipalityId]))
    setActiveMunicipalityId(municipalityId)
  }

  const removeCityFromRegion = (municipalityId: string) => {
    selectionDirtyRef.current = true
    setRegionMunicipalityIds((current) => {
      const next = new Set(current)
      next.delete(municipalityId)
      return next
    })
    setSelectedNeighborhoodIds((current) => {
      const copy = { ...current }
      delete copy[municipalityId]
      return copy
    })
    if (activeMunicipalityId === municipalityId) {
      const remaining = [...regionMunicipalityIds].filter((id) => id !== municipalityId)
      setActiveMunicipalityId(remaining[0] ?? '')
    }
  }

  const toggleNeighborhood = (municipalityId: string, neighborhoodId: string, checked: boolean) => {
    selectionDirtyRef.current = true
    setSelectedNeighborhoodIds((current) => {
      const next = { ...current }
      const set = new Set(next[municipalityId] ?? [])
      if (checked) set.add(neighborhoodId)
      else set.delete(neighborhoodId)
      next[municipalityId] = set
      return next
    })
  }

  const selectAllNeighborhoods = () => {
    if (!activeMunicipalityId) return
    selectionDirtyRef.current = true
    setSelectedNeighborhoodIds((current) => ({
      ...current,
      [activeMunicipalityId]: new Set(activeNeighborhoods.map((n) => n.id)),
    }))
  }

  const handleSave = async () => {
    if (!region) return
    setSaving(true)
    try {
      const municipalities = regionMunicipalities.filter((m) => regionMunicipalityIds.has(m.id))
      const updatedCities = await syncRegionCities(
        region.id,
        municipalities.map((m) => ({ id: m.id, name: m.name })),
      )

      for (const city of updatedCities) {
        if (!city.sp_municipality_id) continue
        if (!Object.prototype.hasOwnProperty.call(selectedNeighborhoodIds, city.sp_municipality_id)) continue
        const selectedIds = selectedNeighborhoodIds[city.sp_municipality_id] ?? new Set()

        const catalog = await listSpNeighborhoods(city.sp_municipality_id)
        const selected = catalog.filter((n) => selectedIds.has(n.id))
        await syncCityNeighborhoods(
          city.id,
          selected.map((n) => ({ id: n.id, name: n.name })),
        )
      }

      await queryClient.invalidateQueries({ queryKey: regionsQueryKeys.geography(region.id) })
      await queryClient.invalidateQueries({ queryKey: regionsQueryKeys.cities(region.id) })
      await queryClient.invalidateQueries({ queryKey: regionsQueryKeys.cities() })
      await queryClient.invalidateQueries({ queryKey: regionsQueryKeys.regionsWithStats })
      await queryClient.invalidateQueries({ queryKey: regionsQueryKeys.allCities })
      toast.success('Região atualizada')
      onOpenChange(false)
    } catch (error) {
      toast.error(mapSupabaseError(error as Error))
    } finally {
      setSaving(false)
    }
  }

  const isLoading =
    loadingGeography || (regionMunicipalityIds.size > 0 && loadingMunicipalities)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={REGION_DRAWER_SHEET_CLASS}>
        <SheetTitle className="sr-only">
          {region ? `Configurar Região ${region.code}` : 'Configurar região'}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Selecione cidades e bairros de São Paulo para esta região operacional.
        </SheetDescription>

        {!region ? null : loadingGeography ? (
          <div className="space-y-4 p-5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-border px-5 pb-4 pt-5">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="mt-1 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold">Região {region.code}</h2>
                      <p className="text-xs text-muted-foreground">{region.name}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {regionMunicipalityIds.size} cidade{regionMunicipalityIds.size === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Adicionar cidade</p>
                <SearchCombobox
                  value=""
                  onValueChange={(id) => {
                    if (id) addCityToRegion(id)
                  }}
                  onSearch={searchCities}
                  resolveOption={resolveCity}
                  placeholder="Buscar município de SP..."
                  emptyMessage="Nenhum município encontrado"
                />
              </div>

              {regionMunicipalities.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {regionMunicipalities.map((m) => (
                    <Badge
                      key={m.id}
                      variant={m.id === activeMunicipalityId ? 'default' : 'secondary'}
                      className="cursor-pointer gap-1 pr-1"
                      onClick={() => setActiveMunicipalityId(m.id)}
                    >
                      {m.name}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-background/20"
                        aria-label={`Remover ${m.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCityFromRegion(m.id)
                        }}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : regionMunicipalityIds.size === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma cidade nesta região. Busque acima para adicionar.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Cidade para configurar bairros</p>
                    <Select value={activeMunicipalityId} onValueChange={setActiveMunicipalityId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionMunicipalities.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {activeMunicipalityId ? (
                    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                        <div>
                          <h3 className="font-semibold">{activeMunicipality?.name ?? 'Cidade'}</h3>
                          <p className="text-xs text-muted-foreground">
                            {selectedHoodCount} de {activeNeighborhoods.length} bairro(s) selecionado(s)
                          </p>
                        </div>
                        {activeNeighborhoods.length > 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={selectAllNeighborhoods}
                          >
                            Selecionar todos
                          </Button>
                        ) : null}
                      </div>

                      {loadingNeighborhoods ? (
                        <div className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          Carregando bairros...
                        </div>
                      ) : activeNeighborhoods.length === 0 ? (
                        <p className="pt-3 text-xs text-muted-foreground">
                          Sem bairros no catálogo para esta cidade. Rode o script{' '}
                          <code className="text-[10px]">seed-sp-geography.mjs --all</code>.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                          {activeNeighborhoods.map((hood) => (
                            <NeighborhoodCheckbox
                              key={hood.id}
                              id={`hood-${hood.id}`}
                              label={hood.name}
                              checked={selectedNeighborhoodIds[activeMunicipalityId]?.has(hood.id) ?? false}
                              onCheckedChange={(checked) =>
                                toggleNeighborhood(activeMunicipalityId, hood.id, checked)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  ) : null}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border px-5 py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSave()
                }}
              >
                <FormActions
                  onCancel={() => onOpenChange(false)}
                  isSubmitting={saving}
                  submitLabel="Salvar região"
                />
              </form>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
