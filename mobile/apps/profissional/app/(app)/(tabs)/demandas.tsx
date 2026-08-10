import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, MapPin, Navigation } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { listOpenDemandsForPp } from '@/services/demands'
import {
  haversineDistanceKm,
  formatDistanceKm,
  MAUA_CENTER,
  resolvePointsCenter,
  type GeoPoint,
} from '@/lib/geo'
import { DemandMap } from '@/components/demands/DemandMap'

function getInitialRegion(points: GeoPoint[]) {
  const center = resolvePointsCenter(points.length > 0 ? points : [MAUA_CENTER])
  const latitudes = points.map((p) => p.lat)
  const longitudes = points.map((p) => p.lng)
  const latDelta = latitudes.length > 1 ? Math.max(...latitudes) - Math.min(...latitudes) + 0.05 : 0.1
  const lngDelta = longitudes.length > 1 ? Math.max(...longitudes) - Math.min(...longitudes) + 0.05 : 0.1
  return {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  }
}

export default function DemandasScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'demands'],
    queryFn: listOpenDemandsForPp,
  })

  const demands = data?.data ?? []
  const origin = useMemo(() => MAUA_CENTER, [])

  const mapPoints = useMemo(
    () =>
      demands
        .filter((d) => d.location_lat != null && d.location_lng != null)
        .map((d) => ({
          id: d.id,
          lat: d.location_lat!,
          lng: d.location_lng!,
          title: d.patient_abbreviation,
          description: d.location_neighborhood ?? undefined,
        })),
    [demands],
  )

  const initialRegion = useMemo(() => getInitialRegion(mapPoints), [mapPoints])

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const hasCoordinates = mapPoints.length > 0
  const missingLocationCount = demands.length - mapPoints.length

  const handleNavigate = (id: string) => {
    router.push(`/(app)/demandas/${id}`)
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader title="Demandas" subtitle="Oportunidades domiciliares abertas" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="gap-3 pb-28">
          {hasCoordinates && (
            <View className="mx-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <View className="flex-row items-center justify-between gap-3 border-b border-border px-4 py-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  <MapPin size={16} color="#095742" />
                  <View className="min-w-0">
                    <Text className="text-sm font-semibold leading-tight text-foreground">Mapa das demandas</Text>
                    <Text className="text-xs text-muted-foreground">
                      {mapPoints.length} com localização
                    </Text>
                  </View>
                </View>
                <View className="shrink-0 flex-row items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <Navigation size={12} color="#49796B" />
                  <Text className="text-xs font-medium text-muted-foreground">{mapPoints.length}</Text>
                </View>
              </View>
              <DemandMap
                origin={origin}
                points={mapPoints}
                initialRegion={initialRegion}
                onSelectPoint={(id) => setSelectedId(id)}
                selectedId={selectedId}
                mapHeight={220}
              />
              {missingLocationCount > 0 && (
                <Text className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                  {missingLocationCount} demanda{missingLocationCount > 1 ? 's' : ''} sem coordenadas no endereço e não aparece{missingLocationCount > 1 ? 'm' : ''} no mapa.
                </Text>
              )}
            </View>
          )}

          {demands.length === 0 ? (
            <View className="mx-4 rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhuma demanda aberta no momento.
              </Text>
            </View>
          ) : (
            <View className="gap-3 px-4">
              {demands.map((demand) => {
                const distance =
                  demand.location_lat != null && demand.location_lng != null
                    ? haversineDistanceKm(origin, { lat: demand.location_lat, lng: demand.location_lng })
                    : null

                const isSelected = selectedId === demand.id

                return (
                  <Pressable
                    key={demand.id}
                    onPress={() => handleNavigate(demand.id)}
                    className={
                      'flex-row items-center gap-3 rounded-xl border bg-card px-4 py-3.5 active:bg-muted/30 ' +
                      (isSelected ? 'border-primary' : 'border-border')
                    }
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <MapPin size={18} color="#095742" />
                    </View>
                    <View className="min-w-0 flex-1 gap-1">
                      <Text className="font-medium text-foreground">{demand.patient_abbreviation}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {demand.demand_type === 'avaliacao' ? 'Avaliacao inicial' : 'Continuidade'}
                        {demand.patient_level ? ` · ${demand.patient_level}` : ''}
                      </Text>
                      {demand.location_neighborhood ? (
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {demand.location_neighborhood}
                        </Text>
                      ) : null}
                    </View>
                    <View className="items-end gap-0.5">
                      {distance != null ? (
                        <View className="flex-row items-center gap-1">
                          <Navigation size={12} color="#49796B" />
                          <Text className="text-xs font-medium text-primary">{formatDistanceKm(distance)}</Text>
                        </View>
                      ) : null}
                      <ChevronRight size={18} color="#49796B" />
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
