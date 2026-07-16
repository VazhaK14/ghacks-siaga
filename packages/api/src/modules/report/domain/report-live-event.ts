export const REPORT_LIVE_CHANNEL = "reports:live";

export type ReportLiveEventType =
  | "report.created"
  | "report.updated"
  | "report.removed"
  | "dispatch.created"
  | "dispatch.updated"
  | "dispatch.arrived"
  | "dispatch.completed"
  | "dispatch.cancelled";

export interface ReportLiveEvent {
  dispatchId?: string;
  reportId: string;
  type: ReportLiveEventType;
  updatedAt: string;
}

export type ReportLiveEventListener = (event: ReportLiveEvent) => Promise<void>;

export type ReportLiveEventUnsubscribe = () => void | Promise<void>;

export interface ReportEventBus {
  publish: (event: ReportLiveEvent) => Promise<void>;
  subscribe: (
    listener: ReportLiveEventListener,
    onError?: (error: Error) => void
  ) => ReportLiveEventUnsubscribe | Promise<ReportLiveEventUnsubscribe>;
}

const REPORT_EVENT_TYPES = new Set<ReportLiveEventType>([
  "report.created",
  "report.updated",
  "report.removed",
  "dispatch.created",
  "dispatch.updated",
  "dispatch.arrived",
  "dispatch.completed",
  "dispatch.cancelled",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const parseReportLiveEvent = (
  value: unknown
): ReportLiveEvent | null => {
  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!isRecord(parsedValue)) {
    return null;
  }

  const { dispatchId, reportId, type, updatedAt } = parsedValue;
  if (
    typeof reportId !== "string" ||
    typeof type !== "string" ||
    !REPORT_EVENT_TYPES.has(type as ReportLiveEventType) ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }

  return {
    dispatchId: typeof dispatchId === "string" ? dispatchId : undefined,
    reportId,
    type: type as ReportLiveEventType,
    updatedAt,
  };
};
