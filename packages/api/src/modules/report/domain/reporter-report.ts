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
export type ReporterIntakeStatus = "COLLECTING" | "FINALIZING" | "FINALIZED";
export type ReporterIntakeCompletionReason =
  | "ENOUGH_INFORMATION"
  | "URGENT_PARTIAL"
  | "QUESTION_LIMIT"
  | "USER_ENDED"
  | "TECHNICAL_FAILURE"
  | "ACOUSTIC_TRIGGER";
export type CriticalIntakeField =
  | "INCIDENT"
  | "LOCATION"
  | "IMMEDIATE_DANGER"
  | "PEOPLE_AFFECTED";
export type AssistantIntakeRecommendation =
  | "CONTINUE"
  | "FINALIZE"
  | "URGENT_FINALIZE";
export type AssistantDelivery = "CHAT" | "VOICE" | "SILENT";
export type ReporterTextSource =
  | "CHAT"
  | "VOICE_TRANSCRIPT"
  | "VOICE_SUPPORT_TRANSCRIPT"
  | "SILENT_TRANSCRIPT"
  | "SUPPORT_CHAT";

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
    | "SUPPLEMENTAL_TEXT"
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
  acousticSignals: ReporterAcousticSignal[];
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
  intakeCompletedAt: string | null;
  intakeCompletionReason: ReporterIntakeCompletionReason | null;
  intakeQuestionCount: number;
  intakeStatus: ReporterIntakeStatus;
  latestDispatch: {
    agencyName: string | null;
    estimatedArrivalAt: string | null;
    status: string;
    unitCode: string | null;
  } | null;
  latitude: number | null;
  longitude: number | null;
  messages: ReporterMessage[];
  missingCriticalFields: CriticalIntakeField[];
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
  source: ReporterTextSource;
}

export interface AssistantReportUpdate {
  category: ReportCategory;
  extractedData: Record<string, string>;
  incidentType: IncidentType | null;
  intakeRecommendation: AssistantIntakeRecommendation;
  missingCriticalFields: CriticalIntakeField[];
  recommendation: string | null;
  reply: string;
  summary: string;
  title: string;
}

export interface IntakeDecision {
  missingCriticalFields: CriticalIntakeField[];
  reason: ReporterIntakeCompletionReason | null;
  shouldFinalize: boolean;
}

export interface ReporterAcousticSignal {
  code:
    | "SCREAM"
    | "GUNSHOT"
    | "EXPLOSION"
    | "CRYING"
    | "GLASS_BREAKING"
    | "AGGRESSIVE_SHOUTING";
  confidence: number;
  createdAt: string;
  id: string;
}

export interface AppendAcousticSignalInput {
  code: ReporterAcousticSignal["code"];
  confidence: number;
  endedAt: Date;
  modelId: string;
  modelVersion?: string;
  reporterId: string;
  reportId: string;
  startedAt: Date;
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
  appendAcousticSignal: (
    input: AppendAcousticSignalInput
  ) => Promise<ReporterReportDetail>;
  appendReporterText: (
    input: AppendReporterTextInput
  ) => Promise<ReporterReportDetail>;
  applyAssistantUpdate: (
    reportId: string,
    update: AssistantReportUpdate,
    decision: IntakeDecision,
    delivery: AssistantDelivery
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

export interface RealtimeTranscriptionAccess {
  available: boolean;
  message: string | null;
  modelId: "scribe_v2_realtime";
  token: string | null;
}

export interface SynthesizedSpeech {
  audioBase64: string | null;
  available: boolean;
  message: string | null;
  mimeType: "audio/mpeg";
}

export interface VoiceAiGateway {
  createRealtimeTranscriptionAccess: () => Promise<RealtimeTranscriptionAccess>;
  synthesize: (text: string) => Promise<SynthesizedSpeech>;
}
