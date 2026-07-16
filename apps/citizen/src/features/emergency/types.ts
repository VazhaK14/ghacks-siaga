import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import type { LucideIcon } from "lucide-react";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ReporterReport = RouterOutputs["report"]["getMine"];
export type ReporterReportListItem =
  RouterOutputs["report"]["listMine"][number];

export type EmergencyCategory =
  | "Medis"
  | "Kebakaran"
  | "Bencana"
  | "Kriminal"
  | "Kecelakaan";

export type ReportMode = "voice" | "text" | "silent";
export type ConnectionTarget = "ai" | "operator";

export interface IncidentLocation {
  accuracy: number | null;
  address: string;
  latitude: number;
  longitude: number;
}

export interface IncidentState {
  category: EmergencyCategory | null;
  connectionTarget: ConnectionTarget;
  idempotencyKey: string | null;
  location: IncidentLocation | null;
  mode: ReportMode | null;
  reportId: string | null;
}

export interface IncidentContextValue extends IncidentState {
  beginIncident: () => void;
  cancelIncident: () => void;
  setCategory: (category: EmergencyCategory) => void;
  setConnectionTarget: (target: ConnectionTarget) => void;
  setLocation: (location: IncidentLocation) => void;
  setMode: (mode: ReportMode) => void;
  setReportId: (reportId: string) => void;
}

export interface ReportModeOption {
  body: string;
  icon: LucideIcon;
  id: ReportMode;
  title: string;
}

export interface IncidentInstruction {
  id: string;
  text: string;
}
