import type {
  ReportLiveEvent,
  ReportLiveEventListener,
  ReportLiveEventUnsubscribe,
} from "../domain/report-live-event";
import { getReportEventBus } from "../infrastructure/report-event-bus";

export const publishReportLiveEvent = (event: ReportLiveEvent): Promise<void> =>
  getReportEventBus().publish(event);

export const subscribeToReportLiveEvents = (
  listener: ReportLiveEventListener,
  onError?: (error: Error) => void
): ReportLiveEventUnsubscribe | Promise<ReportLiveEventUnsubscribe> =>
  getReportEventBus().subscribe(listener, onError);
