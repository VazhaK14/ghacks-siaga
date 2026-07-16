export const DASHBOARD_PERIODS = ["24H", "7D", "30D"] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export type DashboardReportCategory =
  | "UNCATEGORIZED"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DashboardIncidentType =
  | "CRIME"
  | "FIRE"
  | "MEDICAL"
  | "TRAFFIC_ACCIDENT"
  | "NATURAL_DISASTER"
  | "DOMESTIC_VIOLENCE"
  | "MISSING_PERSON"
  | "OTHER";

export type DashboardAgencyType =
  | "POLICE"
  | "FIRE_DEPARTMENT"
  | "AMBULANCE"
  | "SAR"
  | "OTHER";

export interface DashboardAttentionItem {
  address: string | null;
  ageMinutes: number;
  category: DashboardReportCategory;
  createdAt: string;
  id: string;
  incidentType: DashboardIncidentType | null;
  status: string;
  title: string | null;
}

export interface DashboardFlowPoint {
  bucketStart: string;
  incoming: number;
  resolved: number;
}

export interface DashboardIncidentBreakdownItem {
  count: number;
  incidentType: DashboardIncidentType | "UNCLASSIFIED";
}

export interface DashboardRecentActivityItem {
  category: DashboardReportCategory;
  createdAt: string;
  id: string;
  note: string | null;
  reportId: string;
  reportTitle: string | null;
  toStatus: string;
}

export interface DashboardSummary {
  activeTotal: number;
  availableUnits: number;
  awaitingReview: number;
  incomingDeltaPercent: number | null;
  incomingInPeriod: number;
  medianResponseDeltaPercent: number | null;
  medianResponseSeconds: number | null;
  resolvedDeltaPercent: number | null;
  resolvedInPeriod: number;
  totalUnits: number;
  urgentActive: number;
}

export interface DashboardUnitReadinessItem {
  activeDispatches: number;
  available: number;
  busy: number;
  offline: number;
  total: number;
  type: DashboardAgencyType;
}

export interface DashboardOverview {
  attentionQueue: DashboardAttentionItem[];
  flow: DashboardFlowPoint[];
  generatedAt: string;
  incidentBreakdown: DashboardIncidentBreakdownItem[];
  period: DashboardPeriod;
  recentActivity: DashboardRecentActivityItem[];
  summary: DashboardSummary;
  unitReadiness: DashboardUnitReadinessItem[];
}

export interface DashboardActiveReportRecord {
  address: string | null;
  category: DashboardReportCategory;
  createdAt: Date;
  id: string;
  incidentType: DashboardIncidentType | null;
  status: string;
  title: string | null;
}

export interface DashboardAgencyRecord {
  activeDispatches: number;
  availability: "AVAILABLE" | "BUSY" | "OFFLINE";
  type: DashboardAgencyType;
}

export interface DashboardDispatchRecord {
  arrivedAt: Date;
  requestedAt: Date;
}

export interface DashboardReportRecord {
  createdAt: Date;
  incidentType: DashboardIncidentType | null;
  resolvedAt: Date | null;
}

export interface DashboardStatusEventRecord {
  createdAt: Date;
  id: string;
  note: string | null;
  report: {
    category: DashboardReportCategory;
    id: string;
    title: string | null;
  };
  toStatus: string;
}

export interface DashboardSnapshot {
  activeReports: DashboardActiveReportRecord[];
  agencies: DashboardAgencyRecord[];
  dispatches: DashboardDispatchRecord[];
  reports: DashboardReportRecord[];
  statusEvents: DashboardStatusEventRecord[];
}
