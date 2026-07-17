export const OPERATOR_CALL_PROVIDER = "LIVEKIT_CALLBACK";
export const OPERATOR_CALL_RING_TIMEOUT_MS = 45_000;

export type OperatorCallStatus = "CONNECTING" | "ACTIVE" | "ENDED" | "FAILED";

export type TranscriptSpeaker = "OPERATOR" | "REPORTER";

export interface CallTranscriptSegment {
  speaker: TranscriptSpeaker;
  text: string;
  timestampMs: number;
}

export interface OperatorCallSummary {
  callerCondition: string;
  confidencePercent: number;
  followUp: string;
  keyPoints: string[];
  summary: string;
}

export interface OperatorCallState {
  answeredAt: string | null;
  callSessionId: string;
  durationSeconds: number;
  expiresAt: string;
  operator: { id: string; name: string };
  reporter: { id: string; name: string };
  reportId: string;
  ringingAt: string;
  status: OperatorCallStatus;
  summary: OperatorCallSummary | null;
}

export interface OperatorCallConnection {
  available: boolean;
  message: string | null;
  token: string | null;
  url: string | null;
}

export type IncomingCallNotificationStatus =
  | "DELIVERED"
  | "FAILED"
  | "UNAVAILABLE";

export interface IncomingCallNotification {
  message: string | null;
  status: IncomingCallNotificationStatus;
}

export interface OperatorCallContext {
  category: string;
  incidentType: string | null;
  recommendation: string | null;
  reportId: string;
  summary: string | null;
  title: string | null;
}

export interface StartedOperatorCall {
  roomName: string;
  state: OperatorCallState;
}

export interface OperatorCallRepository {
  acceptForReporter: (
    callSessionId: string,
    reporterId: string
  ) => Promise<{ roomName: string; state: OperatorCallState }>;
  endForOperator: (
    callSessionId: string,
    operatorId: string
  ) => Promise<OperatorCallState>;
  endForReporter: (
    callSessionId: string,
    reporterId: string
  ) => Promise<OperatorCallState>;
  findContext: (callSessionId: string) => Promise<OperatorCallContext>;
  getForOperator: (
    callSessionId: string,
    operatorId: string
  ) => Promise<OperatorCallState>;
  getForReporter: (
    callSessionId: string,
    reporterId: string
  ) => Promise<OperatorCallState>;
  getRoomForOperator: (
    callSessionId: string,
    operatorId: string
  ) => Promise<string>;
  rejectForReporter: (
    callSessionId: string,
    reporterId: string
  ) => Promise<OperatorCallState>;
  saveSummary: (
    callSessionId: string,
    summary: OperatorCallSummary
  ) => Promise<OperatorCallState>;
  start: (reportId: string, operatorId: string) => Promise<StartedOperatorCall>;
}

export interface OperatorCallTokenGateway {
  createConnection: (input: {
    callSessionId: string;
    participantId: string;
    participantRole: "operator" | "reporter";
    roomName: string;
  }) => Promise<OperatorCallConnection>;
}

export interface IncomingCallNotifier {
  notify: (input: {
    callSessionId: string;
    reportId: string;
    reportTitle: string | null;
  }) => Promise<IncomingCallNotification>;
}

export interface OperatorCallSummaryGenerator {
  generate: (input: {
    context: OperatorCallContext;
    transcript: CallTranscriptSegment[];
  }) => Promise<OperatorCallSummary>;
}

export type OperatorCallErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND";

export class OperatorCallError extends Error {
  readonly code: OperatorCallErrorCode;

  constructor(
    code: OperatorCallErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.code = code;
    this.name = "OperatorCallError";
  }
}
