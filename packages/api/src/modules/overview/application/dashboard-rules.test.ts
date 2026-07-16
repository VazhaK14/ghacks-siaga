import { describe, expect, test } from "bun:test";

import type { DashboardSnapshot } from "../domain/entities";
import {
  buildDashboardOverview,
  calculateMedian,
  getDashboardPeriodWindow,
} from "./dashboard-rules";

const NOW = new Date("2026-07-16T12:30:00.000Z");

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  activeReports: [],
  agencies: [],
  dispatches: [],
  reports: [],
  statusEvents: [],
};

describe("dashboard overview rules", () => {
  test("builds Jakarta-aligned hourly and daily windows", () => {
    const hourlyWindow = getDashboardPeriodWindow("24H", NOW);
    const dailyWindow = getDashboardPeriodWindow("7D", NOW);

    expect(hourlyWindow.bucketCount).toBe(24);
    expect(hourlyWindow.currentPeriodStart.toISOString()).toBe(
      "2026-07-15T13:00:00.000Z"
    );
    expect(dailyWindow.bucketCount).toBe(7);
    expect(dailyWindow.currentPeriodStart.toISOString()).toBe(
      "2026-07-09T17:00:00.000Z"
    );
  });

  test("calculates median response times for odd, even, and empty data", () => {
    expect(calculateMedian([])).toBeNull();
    expect(calculateMedian([30, 10, 20])).toBe(20);
    expect(calculateMedian([10, 20, 30, 40])).toBe(25);
  });

  test("aggregates flow, queue priority, unit readiness, and response metrics", () => {
    const snapshot: DashboardSnapshot = {
      activeReports: [
        {
          address: "Jakarta",
          category: "HIGH",
          createdAt: new Date("2026-07-16T11:30:00.000Z"),
          id: "high-new",
          incidentType: "FIRE",
          status: "READY_FOR_REVIEW",
          title: "High",
        },
        {
          address: "Jakarta",
          category: "CRITICAL",
          createdAt: new Date("2026-07-16T10:00:00.000Z"),
          id: "critical-old",
          incidentType: "MEDICAL",
          status: "DISPATCH_PENDING",
          title: "Critical",
        },
      ],
      agencies: [
        {
          activeDispatches: 0,
          availability: "AVAILABLE",
          type: "AMBULANCE",
        },
        {
          activeDispatches: 1,
          availability: "BUSY",
          type: "AMBULANCE",
        },
      ],
      dispatches: [
        {
          arrivedAt: new Date("2026-07-16T11:02:00.000Z"),
          requestedAt: new Date("2026-07-16T11:00:00.000Z"),
        },
      ],
      reports: [
        {
          createdAt: new Date("2026-07-16T11:15:00.000Z"),
          incidentType: "MEDICAL",
          resolvedAt: new Date("2026-07-16T12:00:00.000Z"),
        },
        {
          createdAt: new Date("2026-07-16T11:45:00.000Z"),
          incidentType: "FIRE",
          resolvedAt: null,
        },
      ],
      statusEvents: [
        {
          createdAt: new Date("2026-07-16T12:00:00.000Z"),
          id: "event",
          note: "Selesai",
          report: {
            category: "HIGH",
            id: "report",
            title: "Laporan",
          },
          toStatus: "RESOLVED",
        },
      ],
    };

    const overview = buildDashboardOverview({
      now: NOW,
      period: "24H",
      snapshot,
    });

    expect(overview.summary.activeTotal).toBe(2);
    expect(overview.summary.urgentActive).toBe(2);
    expect(overview.summary.awaitingReview).toBe(1);
    expect(overview.summary.medianResponseSeconds).toBe(120);
    expect(overview.attentionQueue.map((item) => item.id)).toEqual([
      "critical-old",
      "high-new",
    ]);
    expect(overview.unitReadiness[0]).toMatchObject({
      activeDispatches: 1,
      available: 1,
      busy: 1,
      total: 2,
      type: "AMBULANCE",
    });
    expect(
      overview.flow.reduce((total, point) => total + point.incoming, 0)
    ).toBe(2);
    expect(
      overview.flow.reduce((total, point) => total + point.resolved, 0)
    ).toBe(1);
  });

  test("returns empty operational values without fabricating trends", () => {
    const overview = buildDashboardOverview({
      now: NOW,
      period: "30D",
      snapshot: EMPTY_SNAPSHOT,
    });

    expect(overview.summary.medianResponseSeconds).toBeNull();
    expect(overview.summary.incomingDeltaPercent).toBeNull();
    expect(overview.flow).toHaveLength(30);
    expect(overview.attentionQueue).toEqual([]);
  });
});
