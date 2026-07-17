import { describe, expect, test } from "bun:test";

import { getResumeRoute } from "./resume-active-report";
import type { ReporterReportListItem } from "./types";

const createReport = (
  status: ReporterReportListItem["status"]
): ReporterReportListItem => ({
  category: "HIGH",
  createdAt: "2026-07-17T00:00:00.000Z",
  id: "report-1",
  incidentType: "MEDICAL",
  interactionMode: "TEXT",
  status,
  summary: null,
  title: null,
  updatedAt: "2026-07-17T00:00:00.000Z",
});

describe("getResumeRoute", () => {
  test.each([
    "RESOLVED",
    "CLOSED",
    "CANCELLED",
  ] as const)("routes %s reports directly to completion", (status) => {
    expect(getResumeRoute(createReport(status))).toBe("/complete");
  });

  test("keeps operator-driven arrival and dispatch routes", () => {
    expect(getResumeRoute(createReport("HELP_ARRIVED"))).toBe("/arrival");
    expect(getResumeRoute(createReport("HELP_EN_ROUTE"))).toBe("/dispatch");
  });
});
