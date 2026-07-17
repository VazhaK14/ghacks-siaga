import { OfflineCallsScreen } from "@/features/offline-calls/offline-calls-screen";

export const handle = {
  dashboardSurface: "standard",
} as const;

export default function OfflineCallsRoute() {
  return <OfflineCallsScreen />;
}
