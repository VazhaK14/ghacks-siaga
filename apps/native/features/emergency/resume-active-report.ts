import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import type { useRouter } from "expo-router";

import type { IncidentContextValue, ReportMode } from "./types";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type ReporterReportListItem =
  RouterOutputs["report"]["listMine"][number];

const ACTIVE_SESSION_STATUSES = new Set([
  "SUBMITTED",
  "AI_GATHERING",
  "READY_FOR_REVIEW",
]);

const INTERACTION_MODE_TO_REPORT_MODE: Record<string, ReportMode> = {
  SILENT: "silent",
  TEXT: "text",
  VOICE: "voice",
};

const SESSION_ROUTE_BY_MODE: Record<
  ReportMode,
  "/voice-session" | "/chat" | "/silent-session"
> = {
  silent: "/silent-session",
  text: "/chat",
  voice: "/voice-session",
};

type IncidentSetters = Pick<IncidentContextValue, "setMode" | "setReportId">;
type ExpoRouter = ReturnType<typeof useRouter>;

export function resumeActiveReport(
  report: ReporterReportListItem,
  incident: IncidentSetters,
  router: ExpoRouter
) {
  incident.setReportId(report.id);

  if (ACTIVE_SESSION_STATUSES.has(report.status)) {
    const mode = report.interactionMode
      ? INTERACTION_MODE_TO_REPORT_MODE[report.interactionMode]
      : undefined;
    if (mode) {
      incident.setMode(mode);
      router.push(SESSION_ROUTE_BY_MODE[mode]);
      return;
    }
    router.push(SESSION_ROUTE_BY_MODE.text);
    return;
  }

  router.push("/dispatch");
}
