export interface CallSummary {
  callerCondition: string;
  confidencePercent: number;
  followUp: string;
  keyPoints: string[];
  summary: string;
}

export type TranscriptSpeaker = "OPERATOR" | "REPORTER";

export interface CallTranscriptSegment {
  speaker: TranscriptSpeaker;
  text: string;
  timestampMs: number;
}

export type CallTranscriptionStatus =
  | "idle"
  | "connecting"
  | "active"
  | "unavailable"
  | "failed";

export type OperatorCallPhase =
  | "idle"
  | "requesting"
  | "ringing"
  | "connected"
  | "finalizing"
  | "completed"
  | "failed";

export interface OperatorCallSession {
  connectedAt: number | null;
  durationSeconds: number;
  error: string | null;
  interimOperatorText: string;
  interimReporterText: string;
  phase: OperatorCallPhase;
  summary: CallSummary | null;
  transcript: CallTranscriptSegment[];
}
