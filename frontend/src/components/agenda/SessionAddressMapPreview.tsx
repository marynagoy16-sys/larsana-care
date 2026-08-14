import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { buildGoogleMapsSearchUrl, buildOsmEmbedUrl, geocodeAddress, type GeoPoint } from '@/lib/geo'
import { cn } from '@/lib/utils'

type SessionAddressMapPreviewProps = {
  address: string
  neighborhood?: string | null
  latitude?: number | null
  longitude?: number | null
  className?: string
}

function resolveStoredPoint(latitude?: number | null, longitude?: number | null): GeoPoint | null {
  if (latitude == null || longitude == null) return null
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export function SessionAddressMapPreview({
  address,
  neighborhood,
  latitude,
  longitude,
  className,
}: SessionAddressMapPreviewProps) {
  const storedPoint = resolveStoredPoint(latitude, longitude)
  const geocodeQuery = [address, neighborhood, 'Brasil'].filter(Boolean).join(', ')

  const { data: geocodedPoint, isLoading } = useQuery({
    queryKey: ['geocode', geocodeQuery],
    queryFn: () => geocodeAddress(geocodeQuery),
    enabled: !storedPoint,
    staleTime: 1000 * 60 * 60 * 24,
  })

  const point = storedPoint ?? geocodedPoint ?? null
  const mapsUrl = buildGoogleMapsSearchUrl(address, neighborhood, point)

  if (isLoading && !point) {
    return (
      <div
        className={cn(
          'h-36 w-full animate-pulse rounded-xl border border-border bg-muted/40',
          className,
        )}
        aria-hidden
      />
    )
  }

  if (!point) return null

  const embedUrl = buildOsmEmbedUrl(point)

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block overflow-hidden rounded-xl border border-border bg-muted/20 transition-colors hover:bg-muted/30',
        className,
      )}
      aria-label="Abrir endereço no Google Maps"
    >
      <iframe
        title="Mapa do endereço"
        src={embedUrl}
        className="pointer-events-none h-36 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-center gap-1.5 border-t border-border/60 bg-background/80 px-3 py-2 text-xs font-medium text-primary">
        <MapPin size={14} className="shrink-0" />
        Abrir no Google Maps
      </div>
    </a>
  )
}
