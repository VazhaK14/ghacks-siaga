import { MapPinIcon } from "lucide-react";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { useCallback, useRef } from "react";
import MapView, {
  type MapRef,
  Marker,
  type MarkerDragEvent,
  NavigationControl,
} from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

const JAKARTA_COORDINATES = {
  latitude: -6.2088,
  longitude: 106.8456,
} as const;

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

interface ReportLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (coordinates: { latitude: number; longitude: number }) => void;
}

export function ReportLocationPicker({
  latitude,
  longitude,
  onChange,
}: ReportLocationPickerProps) {
  const mapRef = useRef<MapRef>(null);
  const hasCoordinates = latitude !== null && longitude !== null;
  const handleMarkerDrag = useCallback(
    (event: MarkerDragEvent) => {
      onChange({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    },
    [onChange]
  );
  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      onChange({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    },
    [onChange]
  );
  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    map.jumpTo({ bearing: 0, pitch: 0 });
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    for (const layer of map.getStyle().layers ?? []) {
      if (layer.type === "fill-extrusion" && map.getLayer(layer.id)) {
        map.removeLayer(layer.id);
      }
    }
  }, []);

  return (
    <div className="h-64 overflow-hidden rounded-md border">
      <MapView
        dragRotate={false}
        initialViewState={{
          bearing: 0,
          latitude: latitude ?? JAKARTA_COORDINATES.latitude,
          longitude: longitude ?? JAKARTA_COORDINATES.longitude,
          pitch: 0,
          zoom: hasCoordinates ? 15 : 11,
        }}
        mapStyle={MAP_STYLE_URL}
        maxPitch={0}
        minPitch={0}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        pitchWithRotate={false}
        ref={mapRef}
        renderWorldCopies={false}
        style={{ height: "100%", width: "100%" }}
        touchPitch={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {hasCoordinates ? (
          <Marker
            anchor="bottom"
            draggable
            latitude={latitude}
            longitude={longitude}
            onDragEnd={handleMarkerDrag}
          >
            <MapPinIcon
              aria-label="Koordinat lokasi laporan"
              className="size-8 fill-destructive text-background drop-shadow-md"
            />
          </Marker>
        ) : null}
      </MapView>
    </div>
  );
}
