import { Button } from "@siaga-app/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { MapPinOffIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useState } from "react";
import MapView, {
  FullscreenControl,
  GeolocateControl,
  type ErrorEvent as MapErrorEvent,
  NavigationControl,
  ScaleControl,
} from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

const JAKARTA_VIEW_STATE = {
  latitude: -6.2088,
  longitude: 106.8456,
  zoom: 11,
} as const;

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export function MapCanvas() {
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const handleMapError = useCallback((event: MapErrorEvent) => {
    setMapError(event.error.message);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(null);
    setMapKey((currentKey) => currentKey + 1);
  }, []);

  if (mapError) {
    return (
      <Empty className="size-full min-h-0 bg-neutral-200">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinOffIcon />
          </EmptyMedia>
          <EmptyTitle>Peta tidak dapat dimuat</EmptyTitle>
          <EmptyDescription>
            Periksa koneksi internet, lalu coba muat ulang peta.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleRetry} size="sm" type="button">
            <RefreshCwIcon data-icon="inline-start" />
            Coba lagi
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="size-full min-h-0 overflow-hidden bg-neutral-300">
      <MapView
        initialViewState={JAKARTA_VIEW_STATE}
        key={mapKey}
        mapStyle={MAP_STYLE_URL}
        onError={handleMapError}
        reuseMaps
        style={{ height: "100%", width: "100%" }}
      >
        <NavigationControl position="top-right" visualizePitch />
        <GeolocateControl
          position="top-right"
          positionOptions={{ enableHighAccuracy: true }}
          showAccuracyCircle
          showUserLocation
          trackUserLocation={false}
        />
        <FullscreenControl position="top-right" />
        <ScaleControl maxWidth={120} position="bottom-right" unit="metric" />
      </MapView>
    </div>
  );
}
