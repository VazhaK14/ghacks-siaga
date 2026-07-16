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
import { MapPinOffIcon, RefreshCwIcon } from "lucide-react";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  MapLayerMouseEvent,
} from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapView, {
  AttributionControl,
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
  RouteCoordinate,
} from "@/features/dispatch/types";
import { getReportTitle } from "../content";
import type {
  MapCanvasProps,
  MapWorkspaceLayout,
  ReportMapPoint,
} from "../types";

import "maplibre-gl/dist/maplibre-gl.css";

const JAKARTA_VIEW_STATE = {
  bearing: 0,
  latitude: -6.2088,
  longitude: 106.8456,
  pitch: 0,
  zoom: 11,
} as const;

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const SELECTED_REPORT_ZOOM = 15;
const SIDEBAR_BREAKPOINT = 768;
const DESKTOP_PANEL_BREAKPOINT = 1280;
const REPORTS_SOURCE_ID = "active-reports";
const REPORT_CLUSTER_LAYER_ID = "report-clusters";
const REPORT_CLUSTER_COUNT_LAYER_ID = "report-cluster-count";
const REPORT_POINT_LAYER_ID = "report-points";
const REPORT_WARNING_LAYER_ID = "report-warning-icons";
const INTERACTIVE_REPORT_LAYER_IDS = [
  REPORT_CLUSTER_LAYER_ID,
  REPORT_POINT_LAYER_ID,
  REPORT_WARNING_LAYER_ID,
] as const;

const REPORT_COLOR_EXPRESSION: ExpressionSpecification = [
  "match",
  ["get", "category"],
  "CRITICAL",
  "#d00416",
  "HIGH",
  "#d20000",
  "MEDIUM",
  "#ffdb43",
  "LOW",
  "#1fc16b",
  "#777777",
];

const getCameraPadding = (layout: MapWorkspaceLayout) => {
  if (
    layout === "monitor-collapsed" &&
    window.innerWidth >= DESKTOP_PANEL_BREAKPOINT
  ) {
    return {
      bottom: 32,
      left: 272,
      right: 416,
      top: 32,
    };
  }

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

  if (layout === "monitor-collapsed") {
    return {
      bottom: 32,
      left: 272,
      right: 416,
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

const buildRouteGeoJson = (
  dispatch: DispatchTracking,
  roadRoute?: RouteCoordinate[]
) => ({
  features: [
    {
      geometry: {
        coordinates: buildDispatchRouteCoordinates(dispatch, roadRoute),
        type: "LineString" as const,
      },
      properties: {},
      type: "Feature" as const,
    },
  ],
  type: "FeatureCollection" as const,
});

const buildReportsGeoJson = (points: ReportMapPoint[]) => ({
  features: points.map((point) => ({
    geometry: {
      coordinates: [point.longitude, point.latitude],
      type: "Point" as const,
    },
    properties: {
      category: point.category,
      id: point.id,
      title: getReportTitle(point),
    },
    type: "Feature" as const,
  })),
  type: "FeatureCollection" as const,
});

function DispatchRoute({
  dispatch,
  roadRoute,
}: {
  dispatch: DispatchTracking;
  roadRoute?: RouteCoordinate[];
}) {
  const typeConfig = AGENCY_TYPE_CONFIG[dispatch.agency.type];

  return (
    <Source
      data={buildRouteGeoJson(dispatch, roadRoute)}
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
  dispatchRoutes,
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
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isReportHovering, setIsReportHovering] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const mapContainer = mapRef.current?.getMap().getContainer();
      const { fullscreenElement } = document;
      setIsMapFullscreen(
        Boolean(
          mapContainer &&
            fullscreenElement &&
            (fullscreenElement === mapContainer ||
              fullscreenElement.contains(mapContainer))
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  const selectedPoint = points.find((point) => point.id === selectedReportId);
  const selectedAgency = agencies.find(
    (agency) => agency.id === selectedAgencyId
  );
  const reportGeoJson = useMemo(() => buildReportsGeoJson(points), [points]);

  const handleMapError = useCallback((event: MapErrorEvent) => {
    setMapError(event.error.message);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(null);
    setMapKey((currentKey) => currentKey + 1);
  }, []);

  const configureFlatMap = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    for (const layer of map.getStyle().layers ?? []) {
      if (layer.type === "fill-extrusion" && map.getLayer(layer.id)) {
        map.removeLayer(layer.id);
      }
    }
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

  const handleMapLoad = useCallback(() => {
    configureFlatMap();
    focusSelectedPoint();
  }, [configureFlatMap, focusSelectedPoint]);

  const handleReportLayerClick = useCallback(
    async (event: MapLayerMouseEvent): Promise<void> => {
      const [feature] = event.features ?? [];
      if (feature?.geometry.type !== "Point") {
        return;
      }

      const [longitude, latitude] = feature.geometry.coordinates;
      if (feature.layer.id === REPORT_CLUSTER_LAYER_ID) {
        const clusterId = feature.properties?.cluster_id;
        const source = mapRef.current?.getMap().getSource(REPORTS_SOURCE_ID) as
          | GeoJSONSource
          | undefined;
        if (typeof clusterId !== "number" || !source) {
          return;
        }
        const zoom = await source.getClusterExpansionZoom(clusterId);
        mapRef.current?.easeTo({
          center: [longitude, latitude],
          duration: 500,
          zoom,
        });
        return;
      }

      const reportId = feature.properties?.id;
      if (typeof reportId === "string") {
        onSelectReport(reportId);
      }
    },
    [onSelectReport]
  );
  const handleReportMouseEnter = useCallback(() => {
    setIsReportHovering(true);
  }, []);
  const handleReportMouseLeave = useCallback(() => {
    setIsReportHovering(false);
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
    <div
      className={cn(
        "size-full min-h-0 overflow-hidden bg-neutral-300 [--map-control-left-offset:0px] [--map-control-top-offset:3rem] md:[--map-control-left-offset:16rem] md:[--map-control-top-offset:1rem]",
        (layout === "monitor" || layout === "units") &&
          "xl:[--map-control-left-offset:39rem]",
        layout === "monitor-collapsed" && "xl:[--map-control-left-offset:17rem]"
      )}
    >
      <MapView
        attributionControl={false}
        cursor={isReportHovering ? "pointer" : "grab"}
        dragRotate={false}
        initialViewState={JAKARTA_VIEW_STATE}
        interactiveLayerIds={[...INTERACTIVE_REPORT_LAYER_IDS]}
        key={mapKey}
        mapStyle={MAP_STYLE_URL}
        maxPitch={0}
        maxZoom={18}
        minPitch={0}
        minZoom={9}
        onClick={handleReportLayerClick}
        onError={handleMapError}
        onLoad={handleMapLoad}
        onMouseEnter={handleReportMouseEnter}
        onMouseLeave={handleReportMouseLeave}
        ref={mapRef}
        renderWorldCopies={false}
        reuseMaps
        style={{ height: "100%", width: "100%" }}
        touchPitch={false}
      >
        <Source
          cluster
          clusterMaxZoom={13}
          clusterRadius={48}
          data={reportGeoJson}
          id={REPORTS_SOURCE_ID}
          type="geojson"
        >
          <Layer
            id={REPORT_CLUSTER_LAYER_ID}
            paint={{
              "circle-color": "#333333",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                10,
                23,
                30,
                28,
              ],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 3,
            }}
            type="circle"
          />
          <Layer
            id={REPORT_CLUSTER_COUNT_LAYER_ID}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["Noto Sans Regular"],
              "text-size": 11,
            }}
            paint={{
              "text-color": "#ffffff",
            }}
            type="symbol"
          />
          <Layer
            filter={["!", ["has", "point_count"]]}
            id={REPORT_POINT_LAYER_ID}
            paint={{
              "circle-color": REPORT_COLOR_EXPRESSION,
              "circle-radius": [
                "case",
                ["==", ["get", "id"], selectedReportId ?? ""],
                12,
                9,
              ],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": [
                "case",
                ["==", ["get", "id"], selectedReportId ?? ""],
                4,
                2,
              ],
            }}
            type="circle"
          />
          <Layer
            filter={["!", ["has", "point_count"]]}
            id={REPORT_WARNING_LAYER_ID}
            layout={{
              "text-allow-overlap": true,
              "text-field": "!",
              "text-font": ["Noto Sans Regular"],
              "text-size": [
                "case",
                ["==", ["get", "id"], selectedReportId ?? ""],
                14,
                11,
              ],
            }}
            paint={{
              "text-color": [
                "match",
                ["get", "category"],
                "MEDIUM",
                "#333333",
                "LOW",
                "#333333",
                "#ffffff",
              ],
              "text-halo-color": "rgba(255,255,255,0.18)",
              "text-halo-width": 0.5,
            }}
            type="symbol"
          />
        </Source>
        {dispatches.map((dispatch) => (
          <DispatchRoute
            dispatch={dispatch}
            key={`route-${dispatch.id}`}
            roadRoute={dispatchRoutes[dispatch.id]}
          />
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
          showCompass={false}
          style={{
            marginLeft: isMapFullscreen
              ? "0.5rem"
              : "var(--map-control-left-offset)",
            marginTop: "var(--map-control-top-offset)",
          }}
        />
        <GeolocateControl
          position="top-left"
          positionOptions={{ enableHighAccuracy: true }}
          showAccuracyCircle
          showUserLocation
          style={{
            marginLeft: isMapFullscreen
              ? "0.5rem"
              : "var(--map-control-left-offset)",
          }}
          trackUserLocation={false}
        />
        <FullscreenControl
          position="top-left"
          style={{
            marginLeft: isMapFullscreen
              ? "0.5rem"
              : "var(--map-control-left-offset)",
          }}
        />
        <ScaleControl
          maxWidth={120}
          position="bottom-left"
          style={{
            marginLeft: isMapFullscreen
              ? "0.5rem"
              : "var(--map-control-left-offset)",
          }}
          unit="metric"
        />
        <AttributionControl
          compact
          customAttribution="© OpenFreeMap · © OpenStreetMap"
          position="bottom-right"
        />
      </MapView>
    </div>
  );
}
