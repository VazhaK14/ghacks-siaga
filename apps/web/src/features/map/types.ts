import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

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
export type MapWorkspaceLayout = "default" | "monitor";

export interface DisplayError {
  message: string;
}

export interface MapCanvasProps {
  layout: MapWorkspaceLayout;
  onSelectReport: (reportId: string) => void;
  points: ReportMapPoint[];
  selectedReportId: string | null;
}

export interface MapWorkspaceContextValue {
  connectionStatus: LiveConnectionStatus;
  onSelectReport: (reportId: string) => void;
  selectedReportId: string | null;
}
