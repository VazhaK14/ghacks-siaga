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

// Client-only draft state for a SOS flow before/while a backend report
// exists. Once a report exists, its lifecycle phase is derived from the
// polled `report.status` (see derive-phase.ts) — not tracked here.
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
  icon:
    | "chatbox-ellipses-outline"
    | "volume-high-outline"
    | "volume-mute-outline";
  id: ReportMode;
  title: string;
}

export interface IncidentInstruction {
  id: string;
  text: string;
}
