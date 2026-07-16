import { Skeleton } from "@siaga-app/ui/components/skeleton";
import {
  createContext,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";

import { useReportLiveUpdates, useReportMapPointsQuery } from "../api";
import type {
  MapCanvasProps,
  MapWorkspaceContextValue,
  MapWorkspaceLayout,
} from "../types";

const LazyMapCanvas = lazy(async () => {
  const { MapCanvas } = await import("./map-canvas");

  return { default: MapCanvas };
});

const MapWorkspaceContext = createContext<MapWorkspaceContextValue | null>(
  null
);

const subscribeToClient = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function MapLoadingFallback() {
  return (
    <div className="relative size-full min-h-0 overflow-hidden bg-neutral-300">
      <Skeleton className="absolute inset-0 size-full" />
      <span className="sr-only">Memuat peta</span>
    </div>
  );
}

function LazyMap(props: MapCanvasProps) {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <LazyMapCanvas {...props} />
    </Suspense>
  );
}

export function useMapWorkspace(): MapWorkspaceContextValue {
  const context = useContext(MapWorkspaceContext);
  if (!context) {
    throw new Error("useMapWorkspace must be used within MapWorkspace.");
  }

  return context;
}

export function MapWorkspace({
  children,
  layout,
}: {
  children: ReactNode;
  layout: MapWorkspaceLayout;
}) {
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot
  );
  const mapPointsQuery = useReportMapPointsQuery();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleReportRemoved = useCallback((reportId: string) => {
    setSelectedReportId((currentReportId) =>
      currentReportId === reportId ? null : currentReportId
    );
  }, []);
  const connectionStatus = useReportLiveUpdates(handleReportRemoved);
  const handleSelectReport = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
  }, []);

  const contextValue: MapWorkspaceContextValue = {
    connectionStatus,
    onSelectReport: handleSelectReport,
    selectedReportId,
  };

  if (!isClient) {
    return <MapLoadingFallback />;
  }

  return (
    <MapWorkspaceContext.Provider value={contextValue}>
      <div className="relative size-full min-h-0 overflow-hidden">
        <LazyMap
          layout={layout}
          onSelectReport={handleSelectReport}
          points={mapPointsQuery.data ?? []}
          selectedReportId={selectedReportId}
        />
        <div className="pointer-events-none absolute inset-0 z-10">
          {children}
        </div>
      </div>
    </MapWorkspaceContext.Provider>
  );
}
