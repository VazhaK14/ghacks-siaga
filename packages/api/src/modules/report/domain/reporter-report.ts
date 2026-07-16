import type {
  ActiveReportStatus,
  IncidentType,
  ReportCategory,
  TerminalReportStatus,
} from "./entities";

export type ReporterReportStatus = ActiveReportStatus | TerminalReportStatus;
export type ReporterInteractionMode = "VOICE" | "TEXT" | "SILENT";
export type ReporterResponderPreference = "AI" | "OPERATOR";
export type ReporterAcknowledgementType = "HELP_VISIBLE" | "WITH_RESPONDER";

export interface ReporterMessage {
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
    | "SYSTEM";
}

export interface ReporterReportListItem {
  category: ReportCategory;
  createdAt: string;
  id: string;
  incidentType: IncidentType | null;
  interactionMode: ReporterInteractionMode | null;
  status: ReporterReportStatus;
  summary: string | null;
  title: string | null;
  updatedAt: string;
}

export interface ReporterReportDetail extends ReporterReportListItem {
  acknowledgements: ReporterAcknowledgementType[];
  address: string | null;
  assignedOperator: {
    id: string;
    name: string;
  } | null;
  callSession: {
    id: string;
    status: "CREATED" | "CONNECTING" | "ACTIVE" | "ENDING" | "ENDED" | "FAILED";
  } | null;
  cancellationRequest: {
    createdAt: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  } | null;
  latestDispatch: {
    agencyName: string | null;
    estimatedArrivalAt: string | null;
    status: string;
    unitCode: string | null;
  } | null;
  latitude: number | null;
  longitude: number | null;
  messages: ReporterMessage[];
  recommendation: string | null;
  recordingStatus:
    | "NOT_STARTED"
    | "RECORDING"
    | "FINALIZING"
    | "UPLOADING"
    | "READY"
    | "FAILED_FINAL"
    | "DELETED"
    | null;
  responderPreference: ReporterResponderPreference;
}

export interface CreateReporterReportInput {
  address?: string;
  idempotencyKey: string;
  incidentType?: IncidentType;
  interactionMode: ReporterInteractionMode;
  latitude?: number;
  longitude?: number;
  reporterId: string;
  responderPreference: ReporterResponderPreference;
}

export interface AppendReporterTextInput {
  content: string;
  idempotencyKey: string;
  reporterId: string;
  reportId: string;
}

export interface AssistantReportUpdate {
  category: ReportCategory;
  extractedData: Record<string, string>;
  incidentType: IncidentType | null;
  recommendation: string | null;
  reply: string;
  summary: string;
  title: string;
}

export interface ReporterReportRepository {
  acknowledge: (
    reportId: string,
    reporterId: string,
    type: ReporterAcknowledgementType
  ) => Promise<ReporterReportDetail>;
  activateSession: (
    reportId: string,
    reporterId: string
  ) => Promise<ReporterReportDetail>;
  appendReporterText: (
    input: AppendReporterTextInput
  ) => Promise<ReporterReportDetail>;
  applyAssistantUpdate: (
    reportId: string,
    update: AssistantReportUpdate
  ) => Promise<ReporterReportDetail>;
  create: (input: CreateReporterReportInput) => Promise<ReporterReportDetail>;
  endSession: (
    reportId: string,
    reporterId: string
  ) => Promise<ReporterReportDetail>;
  findMine: (
    reportId: string,
    reporterId: string
  ) => Promise<ReporterReportDetail | null>;
  listMine: (reporterId: string) => Promise<ReporterReportListItem[]>;
  prepareLiveSession: (
    reportId: string,
    reporterId: string
  ) => Promise<{
    interactionMode: ReporterInteractionMode;
    roomName: string;
  }>;
  requestCancellation: (
    reportId: string,
    reporterId: string,
    reason: string
  ) => Promise<ReporterReportDetail>;
  switchMode: (
    reportId: string,
    reporterId: string,
    mode: ReporterInteractionMode
  ) => Promise<ReporterReportDetail>;
  updateLocation: (
    reportId: string,
    reporterId: string,
    location: {
      address?: string;
      latitude: number;
      longitude: number;
    }
  ) => Promise<ReporterReportDetail>;
}

export interface LiveKitConnection {
  available: boolean;
  message: string | null;
  token: string | null;
  url: string | null;
}

export interface LiveKitTokenGateway {
  createReporterConnection: (input: {
    interactionMode: ReporterInteractionMode;
    reporterId: string;
    roomName: string;
  }) => Promise<LiveKitConnection>;
}

export interface CaseAssistant {
  analyze: (
    report: ReporterReportDetail
  ) => Promise<AssistantReportUpdate | null>;
}
