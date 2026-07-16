import { Skeleton } from "@siaga-app/ui/components/skeleton";
import { lazy, Suspense, useSyncExternalStore } from "react";

const LazyMapCanvas = lazy(async () => {
  const { MapCanvas } = await import("./map-canvas");

  return { default: MapCanvas };
});

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

export function MapMonitorScreen() {
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!isClient) {
    return <MapLoadingFallback />;
  }

  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <LazyMapCanvas />
    </Suspense>
  );
}
