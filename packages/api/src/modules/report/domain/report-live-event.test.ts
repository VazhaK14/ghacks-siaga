import { describe, expect, test } from "bun:test";

import { InMemoryReportEventBus } from "../infrastructure/in-memory-report-event-bus";
import {
  parseReportLiveEvent,
  type ReportLiveEvent,
} from "./report-live-event";

const REPORT_EVENT: ReportLiveEvent = {
  reportId: "report-1",
  type: "report.updated",
  updatedAt: "2026-07-16T09:00:00.000Z",
};

describe("report live events", () => {
  test("parses object and serialized events", () => {
    expect(parseReportLiveEvent(REPORT_EVENT)).toEqual(REPORT_EVENT);
    expect(parseReportLiveEvent(JSON.stringify(REPORT_EVENT))).toEqual(
      REPORT_EVENT
    );
  });

  test("rejects malformed events", () => {
    expect(parseReportLiveEvent("not-json")).toBeNull();
    expect(
      parseReportLiveEvent({
        reportId: "report-1",
        type: "unknown",
        updatedAt: REPORT_EVENT.updatedAt,
      })
    ).toBeNull();
  });

  test("broadcasts and unsubscribes listeners", async () => {
    const eventBus = new InMemoryReportEventBus();
    const receivedEvents: ReportLiveEvent[] = [];
    const unsubscribe = await eventBus.subscribe((event) => {
      receivedEvents.push(event);
      return Promise.resolve();
    });

    await eventBus.publish(REPORT_EVENT);
    await unsubscribe();
    await eventBus.publish({
      ...REPORT_EVENT,
      reportId: "report-2",
    });

    expect(receivedEvents).toEqual([REPORT_EVENT]);
  });
});
