import type {
  ReportEventBus,
  ReportLiveEvent,
  ReportLiveEventListener,
} from "../domain/report-live-event";

export class InMemoryReportEventBus implements ReportEventBus {
  private readonly listeners = new Set<ReportLiveEventListener>();

  publish = async (event: ReportLiveEvent): Promise<void> => {
    await Promise.all(
      Array.from(this.listeners, async (listener) => listener(event))
    );
  };

  subscribe = (listener: ReportLiveEventListener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };
}
