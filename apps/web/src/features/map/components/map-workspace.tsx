import { Skeleton } from "@siaga-app/ui/components/skeleton";
import {
  createContext,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  useAgencyBoardQuery,
  useReportDispatchQuery,
} from "@/features/dispatch/api";
import { useAnimatedDispatchTracking } from "@/features/dispatch/hooks";
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
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const reportDispatchQuery = useReportDispatchQuery(
    layout === "units" ? null : selectedReportId
  );
  const agencyBoardQuery = useAgencyBoardQuery(layout === "units");
  const animatedReportDispatch = useAnimatedDispatchTracking(
    reportDispatchQuery.data?.activeDispatch ?? null
  );
  const firstBoardDispatch =
    agencyBoardQuery.data?.find((agency) => agency.activeDispatch)
      ?.activeDispatch ?? null;
  const animatedBoardDispatch = useAnimatedDispatchTracking(firstBoardDispatch);

  const handleReportRemoved = useCallback((reportId: string) => {
    setSelectedReportId((currentReportId) =>
      currentReportId === reportId ? null : currentReportId
    );
  }, []);
  const connectionStatus = useReportLiveUpdates(handleReportRemoved);
  const handleSelectReport = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
    setSelectedAgencyId(null);
  }, []);
  const handleSelectAgency = useCallback((agencyId: string) => {
    setSelectedAgencyId(agencyId);
  }, []);

  const agencies = useMemo(() => {
    if (layout === "units") {
      return agencyBoardQuery.data ?? [];
    }
    if (animatedReportDispatch) {
      return [animatedReportDispatch.agency];
    }
    return reportDispatchQuery.data?.recommendations ?? [];
  }, [
    agencyBoardQuery.data,
    animatedReportDispatch,
    layout,
    reportDispatchQuery.data?.recommendations,
  ]);
  const dispatches = useMemo(() => {
    if (layout !== "units") {
      return animatedReportDispatch ? [animatedReportDispatch] : [];
    }

    return (agencyBoardQuery.data ?? []).flatMap((agency) => {
      if (!agency.activeDispatch) {
        return [];
      }
      if (
        animatedBoardDispatch &&
        agency.activeDispatch.id === animatedBoardDispatch.id
      ) {
        return [animatedBoardDispatch];
      }
      return [agency.activeDispatch];
    });
  }, [
    agencyBoardQuery.data,
    animatedBoardDispatch,
    animatedReportDispatch,
    layout,
  ]);

  const contextValue: MapWorkspaceContextValue = {
    connectionStatus,
    onSelectAgency: handleSelectAgency,
    onSelectReport: handleSelectReport,
    selectedAgencyId,
    selectedReportId,
  };

  if (!isClient) {
    return <MapLoadingFallback />;
  }

  return (
    <MapWorkspaceContext.Provider value={contextValue}>
      <div className="relative size-full min-h-0 overflow-hidden">
        <LazyMap
          agencies={agencies}
          dispatches={dispatches}
          layout={layout}
          onSelectAgency={handleSelectAgency}
          onSelectReport={handleSelectReport}
          points={mapPointsQuery.data ?? []}
          selectedAgencyId={selectedAgencyId}
          selectedReportId={selectedReportId}
        />
        <div className="pointer-events-none absolute inset-0 z-10">
          {children}
        </div>
      </div>
    </MapWorkspaceContext.Provider>
  );
}
