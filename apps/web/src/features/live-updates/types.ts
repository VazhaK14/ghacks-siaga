export const OPERATIONAL_EVENT_NAMES = [
  "report.created",
  "report.updated",
  "report.removed",
  "dispatch.created",
  "dispatch.updated",
  "dispatch.arrived",
  "dispatch.completed",
  "dispatch.cancelled",
] as const;

export type OperationalEventName = (typeof OPERATIONAL_EVENT_NAMES)[number];

export interface OperationalLiveEvent {
  reportId?: string;
  type: OperationalEventName;
}

export type OperationalConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unavailable";
