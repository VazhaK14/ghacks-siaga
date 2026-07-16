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
  Layer,
  type ErrorEvent as MapErrorEvent,
  type MapRef,
  Marker,
  NavigationControl,
  ScaleControl,
  Source,
} from "react-map-gl/maplibre";

import { AGENCY_TYPE_CONFIG } from "@/features/dispatch/content";
import { buildDispatchRouteCoordinates } from "@/features/dispatch/route-geometry";
import type {
  DispatchAgency,
  DispatchTracking,
} from "@/features/dispatch/types";
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
    return layout === "monitor" || layout === "units"
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

interface AgencyMarkerProps {
  agency: DispatchAgency;
  isSelected: boolean;
  onSelectAgency: (agencyId: string) => void;
}

function AgencyMarker({
  agency,
  isSelected,
  onSelectAgency,
}: AgencyMarkerProps) {
  const typeConfig = AGENCY_TYPE_CONFIG[agency.type];
  const AgencyIcon = typeConfig.icon;
  const handleSelect = useCallback(() => {
    onSelectAgency(agency.id);
  }, [agency.id, onSelectAgency]);

  return (
    <Marker
      anchor="bottom"
      latitude={agency.latitude}
      longitude={agency.longitude}
    >
      <button
        aria-label={`Pilih ${agency.name}`}
        aria-pressed={isSelected}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-md border-2 shadow-lg ring-2 ring-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
          typeConfig.markerClassName,
          agency.availability !== "AVAILABLE" && "opacity-65",
          isSelected && "size-11 scale-110 ring-4 ring-primary-100"
        )}
        onClick={handleSelect}
        title={`${agency.name} · ${agency.availability}`}
        type="button"
      >
        <AgencyIcon aria-hidden className="size-4" />
        <span
          aria-hidden
          className={cn(
            "absolute -top-1 -right-1 size-3 rounded-full border-2 border-background",
            agency.availability === "AVAILABLE" && "bg-green-200",
            agency.availability === "BUSY" && "bg-yellow-200",
            agency.availability === "OFFLINE" && "bg-neutral-500"
          )}
        />
      </button>
    </Marker>
  );
}

const buildRouteGeoJson = (dispatch: DispatchTracking) => ({
  features: [
    {
      geometry: {
        coordinates: buildDispatchRouteCoordinates(dispatch),
        type: "LineString" as const,
      },
      properties: {},
      type: "Feature" as const,
    },
  ],
  type: "FeatureCollection" as const,
});

function DispatchRoute({ dispatch }: { dispatch: DispatchTracking }) {
  const typeConfig = AGENCY_TYPE_CONFIG[dispatch.agency.type];

  return (
    <Source
      data={buildRouteGeoJson(dispatch)}
      id={`dispatch-route-${dispatch.id}`}
      type="geojson"
    >
      <Layer
        id={`dispatch-route-outline-${dispatch.id}`}
        paint={{
          "line-color": "#ffffff",
          "line-opacity": 0.85,
          "line-width": 7,
        }}
        type="line"
      />
      <Layer
        id={`dispatch-route-line-${dispatch.id}`}
        paint={{
          "line-color": typeConfig.routeColor,
          "line-dasharray": [1.5, 1.5],
          "line-width": 4,
        }}
        type="line"
      />
    </Source>
  );
}

function DispatchVehicleMarker({ dispatch }: { dispatch: DispatchTracking }) {
  const typeConfig = AGENCY_TYPE_CONFIG[dispatch.agency.type];
  const VehicleIcon = typeConfig.vehicleIcon;

  return (
    <Marker
      anchor="center"
      latitude={dispatch.currentLatitude}
      longitude={dispatch.currentLongitude}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full border-2 shadow-xl ring-4 ring-background",
          typeConfig.markerClassName
        )}
        title={`${dispatch.unitCode ?? "Unit"} · ${dispatch.status}`}
      >
        <VehicleIcon aria-hidden className="size-5" />
      </span>
    </Marker>
  );
}

export function MapCanvas({
  agencies,
  dispatches,
  layout,
  onSelectAgency,
  onSelectReport,
  points,
  selectedAgencyId,
  selectedReportId,
}: MapCanvasProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const mapRef = useRef<MapRef>(null);
  const selectedPoint = points.find((point) => point.id === selectedReportId);
  const selectedAgency = agencies.find(
    (agency) => agency.id === selectedAgencyId
  );

  const handleMapError = useCallback((event: MapErrorEvent) => {
    setMapError(event.error.message);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(null);
    setMapKey((currentKey) => currentKey + 1);
  }, []);

  const focusSelectedPoint = useCallback(() => {
    if (selectedPoint && agencies.length > 0) {
      const visibleAgencies = selectedAgency ? [selectedAgency] : agencies;
      const coordinates = [
        [selectedPoint.longitude, selectedPoint.latitude],
        ...visibleAgencies.map((agency) => [agency.longitude, agency.latitude]),
      ];
      const longitudes = coordinates.map(([longitude]) => longitude);
      const latitudes = coordinates.map(([, latitude]) => latitude);

      mapRef.current?.fitBounds(
        [
          [Math.min(...longitudes), Math.min(...latitudes)],
          [Math.max(...longitudes), Math.max(...latitudes)],
        ],
        {
          duration: 900,
          maxZoom: 14,
          padding: getCameraPadding(layout),
        }
      );
      return;
    }

    const target = selectedAgency ?? selectedPoint;
    if (!target) {
      return;
    }

    mapRef.current?.easeTo({
      center: [target.longitude, target.latitude],
      duration: 900,
      padding: getCameraPadding(layout),
      zoom: selectedPoint ? SELECTED_REPORT_ZOOM : 14,
    });
  }, [agencies, layout, selectedAgency, selectedPoint]);

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
        (layout === "monitor" || layout === "units") &&
          "xl:[--map-control-left-offset:39rem]"
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
        {dispatches.map((dispatch) => (
          <DispatchRoute dispatch={dispatch} key={`route-${dispatch.id}`} />
        ))}
        {agencies.map((agency) => (
          <AgencyMarker
            agency={agency}
            isSelected={agency.id === selectedAgencyId}
            key={agency.id}
            onSelectAgency={onSelectAgency}
          />
        ))}
        {dispatches.map((dispatch) => (
          <DispatchVehicleMarker
            dispatch={dispatch}
            key={`vehicle-${dispatch.id}`}
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
