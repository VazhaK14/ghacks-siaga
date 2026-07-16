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

export const ACTIVE_SESSION_STATUSES = new Set([
  "SUBMITTED",
  "AI_GATHERING",
  "READY_FOR_REVIEW",
]);

export type ReportPhase = "active" | "dispatched" | "arrived" | "completed";

export const deriveReportPhase = (status: string | undefined): ReportPhase => {
  if (status === undefined || ACTIVE_SESSION_STATUSES.has(status)) {
    return "active";
  }
  if (TERMINAL_REPORT_STATUSES.has(status)) {
    return "completed";
  }
  if (status === "HELP_ARRIVED") {
    return "arrived";
  }
  return "dispatched";
};
