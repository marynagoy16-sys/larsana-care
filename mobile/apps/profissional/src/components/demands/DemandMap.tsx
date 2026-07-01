import { useMemo } from 'react'
import { Platform, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

export interface DemandMapPoint {
  id: string
  lat: number
  lng: number
  title: string
  description?: string
}

interface DemandMapProps {
  origin: { lat: number; lng: number }
  points: DemandMapPoint[]
  initialRegion: {
    latitude: number
    longitude: number
    latitudeDelta: number
    longitudeDelta: number
  }
  onSelectPoint?: (id: string) => void
  selectedId?: string | null
  mapHeight?: number
}

export function DemandMap({ origin, points, initialRegion, onSelectPoint, mapHeight = 220 }: DemandMapProps) {
  if (Platform.OS === 'web') {
    const mapUrl = useMemo(() => {
      const markers = points.map((p) => `mlat=${p.lat}&mlon=${p.lng}`).join('&')
      const allLats = [origin.lat, ...points.map((p) => p.lat)]
      const allLngs = [origin.lng, ...points.map((p) => p.lng)]
      const minLat = Math.min(...allLats) - 0.05
      const maxLat = Math.max(...allLats) + 0.05
      const minLng = Math.min(...allLngs) - 0.05
      const maxLng = Math.max(...allLngs) + 0.05
      const bbox = `${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}`
      const layer = 'mapnik'
      const markerParam = markers ? `&${markers}` : ''
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=${layer}${markerParam}`
    }, [origin, points])

    return (
      <View style={{ height: mapHeight, width: '100%', overflow: 'hidden' }}>
        <iframe src={mapUrl} style={{ width: '100%', height: '100%', border: 'none' }} loading="lazy" />
      </View>
    )
  }

  return (
    <View style={{ height: mapHeight, width: '100%' }}>
      <MapView style={{ flex: 1 }} initialRegion={initialRegion}>
        <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }} pinColor="#5A7920" />
        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.lat, longitude: point.lng }}
            title={point.title}
            description={point.description}
            onPress={() => onSelectPoint?.(point.id)}
          />
        ))}
      </MapView>
    </View>
  )
}
