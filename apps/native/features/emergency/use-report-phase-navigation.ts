import { useReporterReportQuery } from "./api";
import { deriveReportPhase } from "./derive-phase";

/**
 * Single derivation point for "what phase is this report in" — screens use
 * the returned `phase` to decide whether to redirect forward (see
 * ConnectingScreen/DispatchScreen/ArrivalScreen), instead of each screen
 * re-deriving its own status bucket.
 */
export function useReportPhaseNavigation(reportId: string | null) {
  const reportQuery = useReporterReportQuery(reportId);
  const phase = deriveReportPhase(reportQuery.data?.status);
  return { phase, reportQuery };
}
