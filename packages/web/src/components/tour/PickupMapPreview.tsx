import { MapPin } from 'lucide-react'
import { useState } from 'react'

/**
 * The map in a pickup-point card. Google's static map when it loads; when it can't (no key, or the
 * key is refused — e.g. Maps billing switched off on the Cloud project, which returns a 403 that
 * leaves a broken image), an OpenStreetMap map of the same spot, which needs no key. Either way
 * the traveller sees where the pickup is, and clicking the map opens directions.
 */
export function PickupMapPreview({
  lat,
  lng,
  title,
  googleUrl,
  directionsUrl,
}: {
  lat: number
  lng: number
  title: string
  googleUrl: string | null
  directionsUrl: string | null
}) {
  const [googleFailed, setGoogleFailed] = useState(false)
  const valid =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

  if (!valid) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center bg-muted/40 text-muted-foreground">
        <MapPin className="h-8 w-8" />
      </div>
    )
  }

  const map =
    googleUrl && !googleFailed ? (
      <img
        src={googleUrl}
        alt={`Map of ${title}`}
        className="h-full min-h-[180px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={() => setGoogleFailed(true)}
      />
    ) : (
      // ~1 km around the pin, with OSM's own marker. pointer-events off so the card scrolls normally
      // on phones; the surrounding link handles the click.
      <iframe
        title={`Map of ${title}`}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008},${lat - 0.005},${lng + 0.008},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`}
        className="pointer-events-none h-full min-h-[260px] w-full border-0"
        loading="lazy"
      />
    )

  return directionsUrl ? (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Directions to ${title}`}
      className="block h-full min-h-[180px] md:min-h-full"
    >
      {map}
    </a>
  ) : (
    map
  )
}
