/**
 * Single source of truth for bucketing backend `ReportStatus` values, used
 * to derive what a screen should render/navigate to. Replaces the
 * previously-vestigial `IncidentState.phase` (which no screen actually read)
 * and consolidates what used to be three independently-duplicated status
 * sets (home-screen.tsx's ACTIVE_STATUSES, resume-active-report.ts's
 * ACTIVE_SESSION_STATUSES, history-screen.tsx's TERMINAL_STATUSES).
 */

export const ACTIVE_REPORT_STATUSES = new Set([
  "SUBMITTED",
  "AI_GATHERING",
  "READY_FOR_REVIEW",
  "DISPATCH_PENDING",
  "DISPATCHED",
  "HELP_EN_ROUTE",
  "HELP_ARRIVED",
]);

export const TERMINAL_REPORT_STATUSES = new Set([
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

// Statuses where the reporter is still in an active AI-intake session
// (voice/text/silent) — as opposed to already handed off to dispatch.
export const ACTIVE_SESSION_STATUSES = new Set([
  "SUBMITTED",
  "AI_GATHERING",
  "READY_FOR_REVIEW",
]);

export type ReportPhase = "active" | "dispatched" | "arrived" | "completed";

export function deriveReportPhase(status: string | undefined): ReportPhase {
  if (status === undefined) {
    return "active";
  }
  if (TERMINAL_REPORT_STATUSES.has(status)) {
    return "completed";
  }
  if (status === "HELP_ARRIVED") {
    return "arrived";
  }
  if (status === "DISPATCHED" || status === "HELP_EN_ROUTE") {
    return "dispatched";
  }
  return "active";
}
