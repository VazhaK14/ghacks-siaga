import { useReporterReportQuery } from "./api";
import { deriveReportPhase } from "./derive-phase";

export const useReportPhaseNavigation = (reportId: string | null) => {
  const reportQuery = useReporterReportQuery(reportId);
  const phase = deriveReportPhase(reportQuery.data?.status);
  return { phase, reportQuery };
};
