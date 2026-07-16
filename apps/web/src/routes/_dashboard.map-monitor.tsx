import { MapMonitorScreen } from "@/features/map/components/map-monitor-screen";

export const handle = {
  fullBleed: true,
} as const;

export default function MapMonitor() {
  return <MapMonitorScreen />;
}
