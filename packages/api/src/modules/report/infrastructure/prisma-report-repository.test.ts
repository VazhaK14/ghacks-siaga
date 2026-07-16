import { describe, expect, test } from "bun:test";
import dotenv from "dotenv";

dotenv.config({ path: "apps/server/.env" });

const { PrismaReportRepository } = await import("./prisma-report-repository");
const { default: prisma } = await import("@siaga-app/db");

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
    expect(detail?.canEdit).toBe(detail?.editBlockReason === null);
  });

  test("updates detail directly and rejects a stale timestamp", async () => {
    const report = await prisma.emergencyReport.findFirst({
      where: {
        dispatches: { none: {} },
        isDemo: true,
        status: {
          in: [
            "SUBMITTED",
            "AI_GATHERING",
            "READY_FOR_REVIEW",
            "DISPATCH_PENDING",
            "DISPATCHED",
            "HELP_EN_ROUTE",
            "HELP_ARRIVED",
          ],
        },
      },
    });
    const operator = await prisma.user.findFirst({
      where: { role: "OPERATOR" },
    });

    expect(report).toBeDefined();
    expect(operator).toBeDefined();
    if (!(report && operator)) {
      return;
    }

    const originalTitle = report.title;
    const updatedTitle = `${report.title ?? "Laporan"} · edit test`;
    try {
      const updated = await repository.updateDetail({
        detail: {
          address: report.address,
          category: report.category,
          extractedData:
            typeof report.extractedData === "object" &&
            report.extractedData !== undefined
              ? report.extractedData
              : {},
          incidentType: report.incidentType,
          latitude: report.latitude,
          longitude: report.longitude,
          recommendation: report.recommendation,
          summary: report.summary,
          title: updatedTitle,
        },
        expectedUpdatedAt: report.updatedAt,
        operatorId: operator.id,
        reportId: report.id,
      });

      expect(updated.title).toBe(updatedTitle);
      await expect(
        repository.updateDetail({
          detail: {
            address: report.address,
            category: report.category,
            extractedData: {},
            incidentType: report.incidentType,
            latitude: report.latitude,
            longitude: report.longitude,
            recommendation: report.recommendation,
            summary: report.summary,
            title: "Edit basi",
          },
          expectedUpdatedAt: report.updatedAt,
          operatorId: operator.id,
          reportId: report.id,
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    } finally {
      await prisma.emergencyReport.update({
        data: {
          extractedData: report.extractedData ?? undefined,
          title: originalTitle,
        },
        where: { id: report.id },
      });
    }
  });

  test("keeps an early dispatch snapshot in sync with an edit", async () => {
    const reporter = await prisma.user.findFirst({
      where: { role: "REPORTER" },
    });
    const operator = await prisma.user.findFirst({
      where: { role: "OPERATOR" },
    });
    expect(reporter).toBeDefined();
    expect(operator).toBeDefined();
    if (!(reporter && operator)) {
      return;
    }

    const report = await prisma.emergencyReport.create({
      data: {
        address: "Alamat awal",
        category: "MEDIUM",
        latitude: -6.2,
        longitude: 106.8,
        reporterId: reporter.id,
        status: "DISPATCH_PENDING",
        title: "Judul awal",
      },
    });
    const dispatch = await prisma.dispatchRequest.create({
      data: {
        agencyType: "OTHER",
        dispatchedByOperatorId: operator.id,
        reportId: report.id,
        status: "REQUESTED",
        structuredReportSnapshot: {},
      },
    });

    try {
      const updated = await repository.updateDetail({
        detail: {
          address: "Alamat yang diperbarui",
          category: "HIGH",
          extractedData: { verified: true },
          incidentType: "OTHER",
          latitude: -6.21,
          longitude: 106.81,
          recommendation: "Kirim unit terdekat",
          summary: "Ringkasan yang diperbarui",
          title: "Judul yang diperbarui",
        },
        expectedUpdatedAt: report.updatedAt,
        operatorId: operator.id,
        reportId: report.id,
      });
      const storedDispatch = await prisma.dispatchRequest.findUniqueOrThrow({
        select: { structuredReportSnapshot: true },
        where: { id: dispatch.id },
      });
      const snapshot = storedDispatch.structuredReportSnapshot as {
        location?: { address?: string };
        report?: { title?: string };
      };

      expect(updated.canEdit).toBeTrue();
      expect(snapshot.report?.title).toBe("Judul yang diperbarui");
      expect(snapshot.location?.address).toBe("Alamat yang diperbarui");
    } finally {
      await prisma.emergencyReport.delete({ where: { id: report.id } });
    }
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
