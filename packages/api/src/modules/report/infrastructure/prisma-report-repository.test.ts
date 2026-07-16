import { describe, expect, test } from "bun:test";
import dotenv from "dotenv";

dotenv.config({ path: "apps/server/.env" });

const { PrismaReportRepository } = await import("./prisma-report-repository");

const CATEGORY_RANK = {
  CRITICAL: 4,
  HIGH: 3,
  LOW: 1,
  MEDIUM: 2,
  UNCATEGORIZED: 0,
} as const;

describe("PrismaReportRepository", () => {
  const repository = new PrismaReportRepository();

  test("returns active reports in priority order with a stable cursor", async () => {
    const firstPage = await repository.listActive({ limit: 5 });
    const secondPage = await repository.listActive({
      cursor: firstPage.nextCursor ?? undefined,
      limit: 5,
    });
    const firstPageIds = new Set(firstPage.items.map((report) => report.id));

    expect(firstPage.activeCount).toBe(13);
    expect(firstPage.items).toHaveLength(5);
    expect(firstPage.nextCursor).not.toBeNull();
    expect(
      secondPage.items.some((report) => firstPageIds.has(report.id))
    ).toBeFalse();

    for (const [index, report] of firstPage.items.entries()) {
      const nextReport = firstPage.items[index + 1];
      if (nextReport) {
        expect(CATEGORY_RANK[report.category]).toBeGreaterThanOrEqual(
          CATEGORY_RANK[nextReport.category]
        );
      }
    }
  });

  test("returns only active reports with usable map coordinates", async () => {
    const points = await repository.listActiveMapPoints();

    expect(points).toHaveLength(12);
    expect(
      points.every(
        (point) =>
          Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
      )
    ).toBeTrue();
  });

  test("returns operational detail and related data", async () => {
    const firstPage = await repository.listActive({ limit: 1 });
    const [firstReport] = firstPage.items;

    expect(firstReport).toBeDefined();
    if (!firstReport) {
      return;
    }

    const detail = await repository.findActiveDetail(firstReport.id);

    expect(detail?.reporter.name).toBe("Rani Pratama");
    expect(detail?.latestAnalysis).not.toBeNull();
    expect(detail?.statusHistory.length).toBeGreaterThan(0);
  });
});
