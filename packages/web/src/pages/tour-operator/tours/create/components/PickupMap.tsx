import { AdvancedMarker, Map, Marker } from '@vis.gl/react-google-maps'
import { MapPin } from 'lucide-react'
import { memo } from 'react'

export type LatLng = { lat: number; lng: number }

export const PickupMap = memo(function PickupMap({
  center,
  zoom,
  markerPosition,
  onMapClick,
  onMarkerDragEnd,
  mapId,
}: {
  center: LatLng
  zoom: number
  markerPosition: LatLng | null
  onMapClick: (event: any) => void
  onMarkerDragEnd: (event: any) => void
  mapId?: string
}) {
  return (
    <Map
      center={center}
      zoom={zoom}
      mapId={mapId}
      gestureHandling="greedy"
      disableDefaultUI={true}
      onClick={onMapClick}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      {markerPosition ? (
        mapId ? (
          <AdvancedMarker position={markerPosition} draggable={true} onDragEnd={onMarkerDragEnd}>
            <div className="w-10 h-10 bg-primary rounded-full border-4 border-background shadow-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" fill="currentColor" />
            </div>
          </AdvancedMarker>
        ) : (
          <Marker position={markerPosition} draggable={true} onDragEnd={onMarkerDragEnd} />
        )
      ) : null}
    </Map>
  )
})
