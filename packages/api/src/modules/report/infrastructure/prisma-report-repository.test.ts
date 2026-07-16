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

    expect(firstPage.activeCount).toBeGreaterThanOrEqual(
      firstPage.items.length
    );
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
    const [points, archived] = await Promise.all([
      repository.listActiveMapPoints(),
      repository.listArchived({ page: 1, pageSize: 10 }),
    ]);
    const archivedIds = new Set(archived.items.map((report) => report.id));

    expect(points.length).toBeGreaterThan(0);
    expect(
      points.every(
        (point) =>
          Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
      )
    ).toBeTrue();
    expect(points.every((point) => !archivedIds.has(point.id))).toBeTrue();
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

  test("returns terminal reports through the archive with pagination", async () => {
    const page = await repository.listArchived({ page: 1, pageSize: 1 });

    expect(page.items).toHaveLength(1);
    expect(page.total).toBeGreaterThanOrEqual(page.items.length);
    expect(page.totalPages).toBe(Math.ceil(page.total / page.pageSize));
    expect(["RESOLVED", "CLOSED", "CANCELLED"]).toContain(
      page.items[0]?.status
    );
  });

  test("returns read-only archived detail", async () => {
    const page = await repository.listArchived({
      page: 1,
      pageSize: 10,
      status: "RESOLVED",
    });
    const [report] = page.items;

    expect(report).toBeDefined();
    if (!report) {
      return;
    }

    const detail = await repository.findArchivedDetail(report.id);

    expect(detail?.status).toBe("RESOLVED");
    expect(detail?.reporter.name).toBe("Rani Pratama");
    expect(detail?.statusHistory.length).toBeGreaterThan(0);
  });
});
