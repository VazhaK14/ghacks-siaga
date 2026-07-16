export const DISPATCH_AGENCY_TYPES = [
  "POLICE",
  "FIRE_DEPARTMENT",
  "AMBULANCE",
  "SAR",
  "OTHER",
] as const;

export type DispatchAgencyType = (typeof DISPATCH_AGENCY_TYPES)[number];

export const DISPATCH_AGENCY_AVAILABILITIES = [
  "AVAILABLE",
  "BUSY",
  "OFFLINE",
] as const;

export type DispatchAgencyAvailability =
  (typeof DISPATCH_AGENCY_AVAILABILITIES)[number];

export const DISPATCH_STATUSES = [
  "REQUESTED",
  "ACKNOWLEDGED",
  "EN_ROUTE",
  "ARRIVED",
  "RETURNING_TO_BASE",
  "RETURNED_TO_BASE",
  "COMPLETED",
  "CANCELLED",
] as const;

export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export type DispatchIncidentType =
  | "CRIME"
  | "FIRE"
  | "MEDICAL"
  | "TRAFFIC_ACCIDENT"
  | "NATURAL_DISASTER"
  | "DOMESTIC_VIOLENCE"
  | "MISSING_PERSON"
  | "OTHER";

export interface DispatchAgency {
  address: string | null;
  availability: DispatchAgencyAvailability;
  contactPhone: string | null;
  id: string;
  jurisdiction: string | null;
  latitude: number;
  longitude: number;
  name: string;
  type: DispatchAgencyType;
}

export interface DispatchAgencyRecommendation extends DispatchAgency {
  distanceKm: number;
  etaMinutes: number;
  matchReason: string;
  recommended: boolean;
}

export interface DispatchDestination {
  address: string | null;
  latitude: number;
  longitude: number;
  title: string | null;
}

export interface DispatchRecord {
  acknowledgedAt: Date | null;
  agency: DispatchAgency;
  arrivedAt: Date | null;
  completedAt: Date | null;
  destination: DispatchDestination;
  dispatchedByOperatorId: string;
  enRouteAt: Date | null;
  estimatedArrivalAt: Date | null;
  estimatedReturnAt: Date | null;
  id: string;
  notes: string | null;
  reportId: string;
  requestedAt: Date;
  returnedAt: Date | null;
  returnStartedAt: Date | null;
  status: DispatchStatus;
  unitCode: string | null;
}

export interface DispatchTracking {
  acknowledgedAt: string | null;
  agency: DispatchAgency;
  arrivedAt: string | null;
  canResolve: boolean;
  completedAt: string | null;
  currentLatitude: number;
  currentLongitude: number;
  destination: DispatchDestination;
  enRouteAt: string | null;
  estimatedArrivalAt: string | null;
  estimatedReturnAt: string | null;
  id: string;
  notes: string | null;
  progressPercent: number;
  reportId: string;
  requestedAt: string;
  returnedAt: string | null;
  returnStartedAt: string | null;
  status: DispatchStatus;
  unitCode: string | null;
}

export interface DispatchReportContext {
  activeDispatch: DispatchRecord | null;
  agencies: DispatchAgency[];
  report: {
    address: string | null;
    category: string;
    id: string;
    incidentType: DispatchIncidentType | null;
    latitude: number | null;
    longitude: number | null;
    recommendation: string | null;
    status: string;
    summary: string | null;
    title: string | null;
  };
}

export interface ReportDispatchOverview {
  activeDispatch: DispatchTracking | null;
  canDispatch: boolean;
  dispatchBlockReason: string | null;
  incidentType: DispatchIncidentType | null;
  recommendations: DispatchAgencyRecommendation[];
  reportId: string;
}

export interface AgencyBoardItem extends DispatchAgency {
  activeDispatch: DispatchTracking | null;
}

export interface AgencyBoardRecord {
  activeDispatch: DispatchRecord | null;
  agency: DispatchAgency;
}

export type ReportClosureReason = "PRANK_CALL" | "INCOMPLETE_REPORT" | "OTHER";

export interface CloseReportResult {
  cancelledDispatchId: string | null;
  closedAt: string;
  reportId: string;
}

export type DispatchApplicationErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST";

export class DispatchApplicationError extends Error {
  readonly code: DispatchApplicationErrorCode;

  constructor(code: DispatchApplicationErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "DispatchApplicationError";
  }
}
