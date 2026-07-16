export const ACTIVE_REPORT_STATUSES = [
  "SUBMITTED",
  "AI_GATHERING",
  "READY_FOR_REVIEW",
  "DISPATCH_PENDING",
  "DISPATCHED",
  "HELP_EN_ROUTE",
  "HELP_ARRIVED",
] as const;

export type ActiveReportStatus = (typeof ACTIVE_REPORT_STATUSES)[number];

export type ReportCategory =
  | "UNCATEGORIZED"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type IncidentType =
  | "CRIME"
  | "FIRE"
  | "MEDICAL"
  | "TRAFFIC_ACCIDENT"
  | "NATURAL_DISASTER"
  | "DOMESTIC_VIOLENCE"
  | "MISSING_PERSON"
  | "OTHER";

export interface ActiveReportListItem {
  address: string | null;
  category: ReportCategory;
  createdAt: string;
  id: string;
  incidentType: IncidentType | null;
  latitude: number | null;
  longitude: number | null;
  status: ActiveReportStatus;
  summary: string | null;
  title: string | null;
  updatedAt: string;
}

export interface ActiveReportPage {
  activeCount: number;
  items: ActiveReportListItem[];
  nextCursor: string | null;
}

export interface ReportMapPoint {
  category: ReportCategory;
  id: string;
  latitude: number;
  longitude: number;
  status: ActiveReportStatus;
  title: string | null;
  updatedAt: string;
}

export interface ReportStatusHistoryItem {
  actorType: "REPORTER" | "AI_AGENT" | "OPERATOR" | "SYSTEM";
  createdAt: string;
  fromStatus: string | null;
  id: string;
  note: string | null;
  toStatus: string;
}

export interface ReportDetail {
  activeChannel: "VOICE" | "CHAT" | null;
  address: string | null;
  assignedOperator: {
    id: string;
    name: string;
  } | null;
  category: ReportCategory;
  contactPhone: string | null;
  createdAt: string;
  extractedData: unknown;
  handlingMode: "AI" | "HUMAN";
  id: string;
  incidentType: IncidentType | null;
  latestAnalysis: {
    category: ReportCategory;
    confidenceScore: number | null;
    createdAt: string;
    incidentType: IncidentType | null;
    modelVersion: string | null;
    recommendation: string | null;
    summary: string;
  } | null;
  latitude: number | null;
  longitude: number | null;
  recommendation: string | null;
  reporter: {
    email: string;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    id: string;
    name: string;
    phoneNumber: string | null;
  };
  status: ActiveReportStatus;
  statusHistory: ReportStatusHistoryItem[];
  summary: string | null;
  title: string | null;
  updatedAt: string;
}
