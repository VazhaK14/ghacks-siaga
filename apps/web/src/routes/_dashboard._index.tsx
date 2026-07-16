import { DashboardScreen } from "@/features/overview/components/dashboard-screen";

export const handle = {
  dashboardSurface: "standard",
} as const;

export default function DashboardOverview() {
  return <DashboardScreen />;
}
