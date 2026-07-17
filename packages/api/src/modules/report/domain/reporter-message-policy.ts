import type {
  AppendReporterTextInput,
  AssistantDelivery,
  ReporterIntakeStatus,
  ReporterInteractionMode,
} from "./reporter-report";

type ReporterMessageChannel = "CHAT" | "VOICE";
type ReporterMessageType =
  | "REPORTER_TEXT"
  | "TRANSCRIPT_FINAL"
  | "SUPPLEMENTAL_TEXT";

export const assistantDeliveryForSource = (
  source: AppendReporterTextInput["source"]
): AssistantDelivery => {
  if (source === "SILENT_TRANSCRIPT") {
    return "SILENT";
  }
  if (source === "VOICE_TRANSCRIPT" || source === "VOICE_SUPPORT_TRANSCRIPT") {
    return "VOICE";
  }
  return "CHAT";
};

const intakeSourceForMode = (
  mode: ReporterInteractionMode | null
): AppendReporterTextInput["source"] | null => {
  if (mode === "VOICE") {
    return "VOICE_TRANSCRIPT";
  }
  if (mode === "TEXT") {
    return "CHAT";
  }
  if (mode === "SILENT") {
    return "SILENT_TRANSCRIPT";
  }
  return null;
};

export const isReporterTextSourceAllowed = (
  mode: ReporterInteractionMode | null,
  intakeStatus: ReporterIntakeStatus,
  source: AppendReporterTextInput["source"]
): boolean => {
  if (intakeStatus === "COLLECTING") {
    return source === intakeSourceForMode(mode);
  }
  return (
    source === "SUPPORT_CHAT" ||
    (mode === "VOICE" && source === "VOICE_SUPPORT_TRANSCRIPT")
  );
};

export const reporterMessageChannelForSource = (
  source: AppendReporterTextInput["source"],
  mode: ReporterInteractionMode | null
): ReporterMessageChannel => {
  if (source === "SUPPORT_CHAT" || source === "CHAT") {
    return "CHAT";
  }
  return mode === "TEXT" ? "CHAT" : "VOICE";
};

export const reporterMessageTypeForSource = (
  source: AppendReporterTextInput["source"],
  intakeStatus: ReporterIntakeStatus
): ReporterMessageType => {
  if (intakeStatus !== "COLLECTING") {
    return "SUPPLEMENTAL_TEXT";
  }
  return source === "CHAT" ? "REPORTER_TEXT" : "TRANSCRIPT_FINAL";
};
