import { MapMonitorScreen } from "@/features/map/components/map-monitor-screen";

export const handle = {
  mapLayout: "monitor",
} as const;

export default function MapMonitor() {
  return <MapMonitorScreen />;
}
