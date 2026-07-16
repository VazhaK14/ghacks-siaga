export type EmergencyCategory =
  | "Medis"
  | "Kebakaran"
  | "Bencana"
  | "Kriminal"
  | "Kecelakaan";

export type ReportMode = "voice" | "text" | "silent";

export type ConnectionTarget = "ai" | "operator";

export type IncidentPhase =
  | "idle"
  | "choosing-mode"
  | "connecting"
  | "active"
  | "dispatched"
  | "arrived"
  | "completed";

export interface IncidentState {
  category: EmergencyCategory | null;
  connectionTarget: ConnectionTarget;
  mode: ReportMode | null;
  phase: IncidentPhase;
}

export interface IncidentContextValue extends IncidentState {
  beginIncident: () => void;
  cancelIncident: () => void;
  completeIncident: () => void;
  setCategory: (category: EmergencyCategory) => void;
  setConnectionTarget: (target: ConnectionTarget) => void;
  setMode: (mode: ReportMode) => void;
  setPhase: (phase: IncidentPhase) => void;
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

export interface ChatMessage {
  id: string;
  message: string;
  sender: "SIAGA" | "KAMU";
}
