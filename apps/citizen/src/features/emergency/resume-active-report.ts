import {
  ACTIVE_SESSION_STATUSES,
  TERMINAL_REPORT_STATUSES,
} from "./derive-phase";
import type { ReporterReportListItem, ReportMode } from "./types";

const REPORT_MODE_BY_INTERACTION_MODE: Record<string, ReportMode> = {
  SILENT: "silent",
  TEXT: "text",
  VOICE: "voice",
};

const SESSION_ROUTE_BY_MODE: Record<ReportMode, string> = {
  silent: "/silent-session",
  text: "/chat",
  voice: "/voice-session",
};

export const getResumeRoute = (report: ReporterReportListItem): string => {
  if (TERMINAL_REPORT_STATUSES.has(report.status)) {
    return "/complete";
  }
  if (!ACTIVE_SESSION_STATUSES.has(report.status)) {
    return report.status === "HELP_ARRIVED" ? "/arrival" : "/dispatch";
  }
  const mode = report.interactionMode
    ? REPORT_MODE_BY_INTERACTION_MODE[report.interactionMode]
    : "text";
  return mode ? SESSION_ROUTE_BY_MODE[mode] : "/chat";
};

export const getReportMode = (
  report: ReporterReportListItem
): ReportMode | null =>
  report.interactionMode
    ? (REPORT_MODE_BY_INTERACTION_MODE[report.interactionMode] ?? null)
    : null;
