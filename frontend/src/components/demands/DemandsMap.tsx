import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { demandTypeLabels } from '@/constants/labels'
import { useMapOrigin } from '@/hooks/useMapOrigin'
import {
  formatDistanceKm,
  haversineDistanceKm,
  MAUA_CENTER,
  resolvePointsCenter,
  type GeoPoint,
} from '@/lib/geo'
import { cn } from '@/lib/utils'
import type { DemandListItem } from '@/services/demands'

export type DemandMapMarker = {
  id: string
  label: string
  demandType: DemandListItem['demand_type']
  neighborhood: string | null
  position: GeoPoint
  distanceKm: number | null
}

function buildDemandMarkers(demands: DemandListItem[], origin: GeoPoint): DemandMapMarker[] {
  return demands
    .filter((demand) => demand.location_lat != null && demand.location_lng != null)
    .map((demand) => {
      const position = { lat: demand.location_lat!, lng: demand.location_lng! }
      return {
        id: demand.id,
        label: demand.patient_abbreviation,
        demandType: demand.demand_type,
        neighborhood: demand.location_neighborhood,
        position,
        distanceKm: haversineDistanceKm(origin, position),
      }
    })
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
}

function createDemandPinIcon(selected: boolean, demandType: DemandListItem['demand_type']) {
  const color = demandType === 'continuidade' ? '#095742' : '#0369A1'
  const size = selected ? 36 : 32

  return L.divIcon({
    className: 'demand-map-pin-wrapper',
    html: `<span class="demand-map-pin${selected ? ' demand-map-pin--selected' : ''}" style="--pin-color:${color}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  })
}

function createOriginIcon() {
  return L.divIcon({
    className: 'demand-map-pin-wrapper',
    html: '<span class="demand-map-origin"><span class="demand-map-origin__core"></span></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

interface DemandsMapProps {
  demands: DemandListItem[]
  selectedId?: string | null
  onSelectDemand?: (demandId: string) => void
  className?: string
}

export function DemandsMap({
  demands,
  selectedId,
  onSelectDemand,
  className,
}: DemandsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const originMarkerRef = useRef<L.Marker | null>(null)

  const demandPoints = useMemo(
    () =>
      demands
        .filter((demand) => demand.location_lat != null && demand.location_lng != null)
        .map((demand) => ({ lat: demand.location_lat!, lng: demand.location_lng! })),
    [demands],
  )

  const mapFallbackCenter = useMemo(
    () => resolvePointsCenter(demandPoints.length > 0 ? demandPoints : [MAUA_CENTER]),
    [demandPoints],
  )

  const { origin, usingDeviceLocation } = useMapOrigin(mapFallbackCenter)

  const markers = useMemo(() => buildDemandMarkers(demands, origin), [demands, origin])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([mapFallbackCenter.lat, mapFallbackCenter.lng], 12)

    L.control.zoom({ position: 'topright' }).addTo(mapRef.current)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current)

    markersLayerRef.current = L.layerGroup().addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markersLayerRef.current = null
      originMarkerRef.current = null
    }
  }, [mapFallbackCenter.lat, mapFallbackCenter.lng])

  useEffect(() => {
    const map = mapRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    originMarkerRef.current?.remove()
    originMarkerRef.current = L.marker([origin.lat, origin.lng], { icon: createOriginIcon() })
      .bindTooltip(usingDeviceLocation ? 'Sua localização' : 'Referência de distância', {
        direction: 'top',
        offset: [0, -8],
      })
      .addTo(map)

    const bounds = L.latLngBounds([[origin.lat, origin.lng]])

    for (const marker of markers) {
      bounds.extend([marker.position.lat, marker.position.lng])

      const leafletMarker = L.marker([marker.position.lat, marker.position.lng], {
        icon: createDemandPinIcon(marker.id === selectedId, marker.demandType),
        zIndexOffset: marker.id === selectedId ? 1000 : 500,
      })

      const distanceLabel =
        marker.distanceKm != null ? formatDistanceKm(marker.distanceKm) : '—'

      leafletMarker.bindPopup(`
        <div class="demand-map-popup">
          <strong>${marker.label}</strong>
          <span>${demandTypeLabels[marker.demandType] ?? marker.demandType}</span>
          <span>${distanceLabel} de você</span>
          ${marker.neighborhood ? `<span>${marker.neighborhood}</span>` : ''}
        </div>
      `)

      leafletMarker.on('click', () => onSelectDemand?.(marker.id))
      leafletMarker.addTo(layer)
    }

    if (markers.length > 0) {
      map.fitBounds(bounds.pad(0.22), { animate: false, maxZoom: 14 })
    } else {
      map.setView([origin.lat, origin.lng], 12)
    }
  }, [markers, origin, selectedId, onSelectDemand, usingDeviceLocation])

  const missingLocationCount = demands.length - markers.length

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        'max-sm:-mx-[var(--shell-gap)] max-sm:w-[calc(100%+2*var(--shell-gap))] max-sm:rounded-none max-sm:border-x-0 max-sm:shadow-none',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={16} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Mapa das demandas</p>
            <p className="text-xs text-muted-foreground truncate">
              {markers.length} com localização
              {usingDeviceLocation ? ' · distâncias a partir de você' : ' · referência Mauá/SP'}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 gap-1">
          <Navigation size={12} />
          {markers.length}
        </Badge>
      </div>

      <div ref={containerRef} className="h-[260px] w-full sm:h-[300px] lg:h-[320px]" />

      {missingLocationCount > 0 && (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          {missingLocationCount} demanda{missingLocationCount > 1 ? 's' : ''} sem coordenadas no endereço e não
          aparece{missingLocationCount > 1 ? 'm' : ''} no mapa.
        </p>
      )}
    </div>
  )
}
