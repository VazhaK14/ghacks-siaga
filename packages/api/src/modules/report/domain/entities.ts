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

export const TERMINAL_REPORT_STATUSES = [
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;

export type TerminalReportStatus = (typeof TERMINAL_REPORT_STATUSES)[number];

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

export type ReportJsonValue =
  | boolean
  | number
  | string
  | null
  | ReportJsonValue[]
  | { [key: string]: ReportJsonValue };

export interface ReportEditableDetail {
  address: string | null;
  category: ReportCategory;
  extractedData: ReportJsonValue;
  incidentType: IncidentType | null;
  latitude: number | null;
  longitude: number | null;
  recommendation: string | null;
  summary: string | null;
  title: string | null;
}

export type ReportUpdateApplicationErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "NOT_FOUND"
  | "PRECONDITION_FAILED";

export class ReportUpdateApplicationError extends Error {
  readonly code: ReportUpdateApplicationErrorCode;

  constructor(code: ReportUpdateApplicationErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ReportUpdateApplicationError";
  }

  static withCause(
    code: ReportUpdateApplicationErrorCode,
    message: string,
    cause: unknown
  ): ReportUpdateApplicationError {
    const error = new ReportUpdateApplicationError(code, message);
    Object.defineProperty(error, "cause", {
      configurable: true,
      value: cause,
    });
    return error;
  }
}

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

export interface ArchivedReportListItem {
  address: string | null;
  assignedOperator: {
    id: string;
    name: string;
  } | null;
  category: ReportCategory;
  createdAt: string;
  id: string;
  incidentType: IncidentType | null;
  latestDispatch: {
    agencyName: string | null;
    status: string;
    unitCode: string | null;
  } | null;
  reporter: {
    id: string;
    isGuest: boolean;
    name: string;
  };
  status: TerminalReportStatus;
  summary: string | null;
  terminalAt: string;
  title: string | null;
}

export interface ArchivedReportPage {
  items: ArchivedReportListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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

export interface ArchivedReportDispatchItem {
  acknowledgedAt: string | null;
  agency: {
    name: string;
    type: string;
  } | null;
  arrivedAt: string | null;
  completedAt: string | null;
  dispatchedByOperator: {
    id: string;
    name: string;
  };
  enRouteAt: string | null;
  id: string;
  requestedAt: string;
  status: string;
  unitCode: string | null;
}

export interface ArchivedReportDetail {
  address: string | null;
  assignedOperator: {
    id: string;
    name: string;
  } | null;
  category: ReportCategory;
  closedAt: string | null;
  closureNote: string | null;
  closureReason: "PRANK_CALL" | "INCOMPLETE_REPORT" | "OTHER" | null;
  createdAt: string;
  dispatches: ArchivedReportDispatchItem[];
  id: string;
  incidentType: IncidentType | null;
  reporter: {
    email: string;
    id: string;
    isGuest: boolean;
    name: string;
    phoneNumber: string | null;
  };
  resolvedAt: string | null;
  status: TerminalReportStatus;
  statusHistory: ReportStatusHistoryItem[];
  summary: string | null;
  terminalAt: string;
  title: string | null;
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
  acknowledgements: ("HELP_VISIBLE" | "WITH_RESPONDER")[];
  acousticSignals: {
    code: string;
    confidence: number;
    createdAt: string;
    endedAt: string;
    id: string;
    startedAt: string;
    status: "INFERRED" | "CONFIRMED" | "REJECTED";
  }[];
  activeChannel: "VOICE" | "CHAT" | null;
  address: string | null;
  assignedOperator: {
    id: string;
    name: string;
  } | null;
  callSession: {
    id: string;
    status: "CREATED" | "CONNECTING" | "ACTIVE" | "ENDING" | "ENDED" | "FAILED";
  } | null;
  canClose: boolean;
  cancellationRequest: {
    createdAt: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  } | null;
  canEdit: boolean;
  canTakeOver: boolean;
  category: ReportCategory;
  closeBlockReason: string | null;
  contactPhone: string | null;
  createdAt: string;
  editBlockReason: string | null;
  extractedData: unknown;
  handlingMode: "AI" | "HUMAN";
  id: string;
  incidentType: IncidentType | null;
  intakeCompletedAt: string | null;
  intakeCompletionReason:
    | "ENOUGH_INFORMATION"
    | "URGENT_PARTIAL"
    | "QUESTION_LIMIT"
    | "USER_ENDED"
    | "TECHNICAL_FAILURE"
    | "ACOUSTIC_TRIGGER"
    | null;
  intakeQuestionCount: number;
  intakeStatus: "COLLECTING" | "FINALIZING" | "FINALIZED";
  interactionMode: "VOICE" | "TEXT" | "SILENT" | null;
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
  messages: {
    content: string;
    createdAt: string;
    id: string;
    senderType: "REPORTER" | "AI_AGENT" | "OPERATOR" | "SYSTEM";
    sequence: number;
    type:
      | "REPORTER_TEXT"
      | "OPERATOR_TEXT"
      | "AI_TEXT"
      | "TRANSCRIPT_FINAL"
      | "SUPPLEMENTAL_TEXT"
      | "SYSTEM";
  }[];
  missingCriticalFields: string[];
  recommendation: string | null;
  recording: {
    id: string;
    status:
      | "NOT_STARTED"
      | "RECORDING"
      | "FINALIZING"
      | "UPLOADING"
      | "READY"
      | "FAILED_FINAL"
      | "DELETED";
  } | null;
  reporter: {
    email: string;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    id: string;
    isGuest: boolean;
    name: string;
    phoneNumber: string | null;
  };
  responderPreference: "AI" | "OPERATOR";
  status: ActiveReportStatus;
  statusHistory: ReportStatusHistoryItem[];
  summary: string | null;
  takeoverBlockReason: string | null;
  title: string | null;
  updatedAt: string;
}
