import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

import type {
  DispatchAgency,
  DispatchTracking,
  RouteCoordinate,
} from "@/features/dispatch/types";
import type { OperationalConnectionStatus } from "@/features/live-updates/types";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ActiveReportPage = RouterOutputs["report"]["listActive"];
export type ActiveReportListItem = ActiveReportPage["items"][number];
export type ReportDetail = RouterOutputs["report"]["getDetail"];
export type ReportMapPoint =
  RouterOutputs["report"]["listActiveMapPoints"][number];

export type LiveConnectionStatus = OperationalConnectionStatus;

export type MobileMapPanel = "list" | "detail" | null;
export type MapWorkspaceLayout =
  | "default"
  | "monitor"
  | "monitor-collapsed"
  | "units";
export type CallSimulationPhase =
  | "idle"
  | "calling"
  | "connected"
  | "completed";

export interface CallSummary {
  callerCondition: string;
  confidencePercent: number;
  followUp: string;
  keyPoints: string[];
  summary: string;
}

export interface CallSimulationSession {
  connectedAt: number | null;
  durationSeconds: number;
  phase: CallSimulationPhase;
  summary: CallSummary | null;
}

export interface DisplayError {
  message: string;
}

export interface MapCanvasProps {
  agencies: DispatchAgency[];
  dispatches: DispatchTracking[];
  dispatchRoutes: Record<string, RouteCoordinate[]>;
  layout: MapWorkspaceLayout;
  onSelectAgency: (agencyId: string) => void;
  onSelectReport: (reportId: string) => void;
  points: ReportMapPoint[];
  selectedAgencyId: string | null;
  selectedReportId: string | null;
}

export interface MapWorkspaceContextValue {
  connectionStatus: LiveConnectionStatus;
  isMapFocusMode: boolean;
  onDismissReport: (reportId: string) => void;
  onSelectAgency: (agencyId: string) => void;
  onSelectReport: (reportId: string) => void;
  onToggleMapFocus: () => void;
  selectedAgencyId: string | null;
  selectedReportId: string | null;
}
