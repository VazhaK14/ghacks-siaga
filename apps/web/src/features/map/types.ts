import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

import type {
  DispatchAgency,
  DispatchTracking,
} from "@/features/dispatch/types";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ActiveReportPage = RouterOutputs["report"]["listActive"];
export type ActiveReportListItem = ActiveReportPage["items"][number];
export type ReportDetail = RouterOutputs["report"]["getDetail"];
export type ReportMapPoint =
  RouterOutputs["report"]["listActiveMapPoints"][number];

export type LiveConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unavailable";

export type MobileMapPanel = "list" | "detail" | null;
export type MapWorkspaceLayout = "default" | "monitor" | "units";

export interface DisplayError {
  message: string;
}

export interface MapCanvasProps {
  agencies: DispatchAgency[];
  dispatches: DispatchTracking[];
  layout: MapWorkspaceLayout;
  onSelectAgency: (agencyId: string) => void;
  onSelectReport: (reportId: string) => void;
  points: ReportMapPoint[];
  selectedAgencyId: string | null;
  selectedReportId: string | null;
}

export interface MapWorkspaceContextValue {
  connectionStatus: LiveConnectionStatus;
  onSelectAgency: (agencyId: string) => void;
  onSelectReport: (reportId: string) => void;
  selectedAgencyId: string | null;
  selectedReportId: string | null;
}
