import { ArchivedReportsScreen } from "@/features/reports/components/archived-reports-screen";

export const handle = {
  dashboardSurface: "standard",
} as const;

export default function ReportsArchive() {
  return <ArchivedReportsScreen />;
}
