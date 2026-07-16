import { Button } from "@siaga-app/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { cn } from "@siaga-app/ui/lib/utils";
import { MapPinIcon, MapPinOffIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import MapView, {
  FullscreenControl,
  GeolocateControl,
  type ErrorEvent as MapErrorEvent,
  type MapRef,
  Marker,
  NavigationControl,
  ScaleControl,
} from "react-map-gl/maplibre";

import { CATEGORY_CONFIG, getReportTitle } from "../content";
import type {
  MapCanvasProps,
  MapWorkspaceLayout,
  ReportMapPoint,
} from "../types";

import "maplibre-gl/dist/maplibre-gl.css";

const JAKARTA_VIEW_STATE = {
  latitude: -6.2088,
  longitude: 106.8456,
  zoom: 11,
} as const;

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const SELECTED_REPORT_ZOOM = 15;
const SIDEBAR_BREAKPOINT = 768;
const DESKTOP_PANEL_BREAKPOINT = 1280;

const getCameraPadding = (layout: MapWorkspaceLayout) => {
  if (window.innerWidth >= DESKTOP_PANEL_BREAKPOINT) {
    return layout === "monitor"
      ? {
          bottom: 32,
          left: 624,
          right: 416,
          top: 32,
        }
      : {
          bottom: 32,
          left: 272,
          right: 32,
          top: 32,
        };
  }

  if (window.innerWidth >= SIDEBAR_BREAKPOINT) {
    return {
      bottom: 32,
      left: 272,
      right: 32,
      top: 72,
    };
  }

  return {
    bottom: 72,
    left: 24,
    right: 24,
    top: 72,
  };
};

interface ReportMarkerProps {
  isSelected: boolean;
  onSelectReport: (reportId: string) => void;
  point: ReportMapPoint;
}

function ReportMarker({
  isSelected,
  onSelectReport,
  point,
}: ReportMarkerProps) {
  const category = CATEGORY_CONFIG[point.category];
  const handleSelect = useCallback(() => {
    onSelectReport(point.id);
  }, [onSelectReport, point.id]);

  return (
    <Marker
      anchor="bottom"
      latitude={point.latitude}
      longitude={point.longitude}
    >
      <button
        aria-label={`Pilih ${getReportTitle(point)}`}
        aria-pressed={isSelected}
        className={cn(
          "flex size-9 items-center justify-center rounded-full border-2 shadow-lg ring-4 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
          category.markerClassName,
          isSelected && "size-11 scale-110 ring-8"
        )}
        onClick={handleSelect}
        title={getReportTitle(point)}
        type="button"
      >
        <MapPinIcon aria-hidden className="size-4" />
      </button>
    </Marker>
  );
}

export function MapCanvas({
  layout,
  onSelectReport,
  points,
  selectedReportId,
}: MapCanvasProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const mapRef = useRef<MapRef>(null);
  const selectedPoint = points.find((point) => point.id === selectedReportId);

  const handleMapError = useCallback((event: MapErrorEvent) => {
    setMapError(event.error.message);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(null);
    setMapKey((currentKey) => currentKey + 1);
  }, []);

  const focusSelectedPoint = useCallback(() => {
    if (!selectedPoint) {
      return;
    }

    mapRef.current?.easeTo({
      center: [selectedPoint.longitude, selectedPoint.latitude],
      duration: 900,
      padding: getCameraPadding(layout),
      zoom: SELECTED_REPORT_ZOOM,
    });
  }, [layout, selectedPoint]);

  useEffect(() => {
    focusSelectedPoint();
  }, [focusSelectedPoint]);

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
    <div
      className={cn(
        "size-full min-h-0 overflow-hidden bg-neutral-300 [--map-control-left-offset:0px] [--map-control-top-offset:3rem] md:[--map-control-left-offset:16rem] md:[--map-control-top-offset:1rem]",
        layout === "monitor" && "xl:[--map-control-left-offset:39rem]"
      )}
    >
      <MapView
        initialViewState={JAKARTA_VIEW_STATE}
        key={mapKey}
        mapStyle={MAP_STYLE_URL}
        onError={handleMapError}
        onLoad={focusSelectedPoint}
        ref={mapRef}
        reuseMaps
        style={{ height: "100%", width: "100%" }}
      >
        {points.map((point) => (
          <ReportMarker
            isSelected={point.id === selectedReportId}
            key={point.id}
            onSelectReport={onSelectReport}
            point={point}
          />
        ))}

        <NavigationControl
          position="top-left"
          style={{
            marginLeft: "var(--map-control-left-offset)",
            marginTop: "var(--map-control-top-offset)",
          }}
          visualizePitch
        />
        <GeolocateControl
          position="top-left"
          positionOptions={{ enableHighAccuracy: true }}
          showAccuracyCircle
          showUserLocation
          style={{ marginLeft: "var(--map-control-left-offset)" }}
          trackUserLocation={false}
        />
        <FullscreenControl
          position="top-left"
          style={{ marginLeft: "var(--map-control-left-offset)" }}
        />
        <ScaleControl
          maxWidth={120}
          position="bottom-left"
          style={{ marginLeft: "var(--map-control-left-offset)" }}
          unit="metric"
        />
      </MapView>
    </div>
  );
}
