import { describe, expect, test } from "bun:test";
import dotenv from "dotenv";

dotenv.config({ path: "apps/server/.env" });

const { default: prisma } = await import("@siaga-app/db");
const { PrismaDispatchRepository } = await import(
  "./prisma-dispatch-repository"
);

describe("PrismaDispatchRepository report snapshot", () => {
  test("stores the report detail that was dispatched", async () => {
    const repository = new PrismaDispatchRepository();
    const report = await prisma.emergencyReport.findFirst({
      where: {
        dispatches: { none: {} },
        isDemo: true,
        latitude: { not: null },
        longitude: { not: null },
      },
    });
    const agency = await prisma.dispatchAgency.findFirst({
      where: { availability: "AVAILABLE", isActive: true },
    });
    const operator = await prisma.user.findFirst({
      where: { role: "OPERATOR" },
    });

    expect(report).toBeDefined();
    expect(agency).toBeDefined();
    expect(operator).toBeDefined();
    if (!(report && agency && operator)) {
      return;
    }

    const originalReportStatus = report.status;
    let dispatchId: string | null = null;
    try {
      const dispatch = await repository.createDispatch({
        agencyId: agency.id,
        estimatedArrivalAt: new Date(Date.now() + 60_000),
        operatorId: operator.id,
        reportId: report.id,
        unitCode: "TEST-01",
      });
      dispatchId = dispatch.id;
      const storedDispatch = await prisma.dispatchRequest.findUniqueOrThrow({
        select: {
          structuredReportSnapshot: true,
        },
        where: { id: dispatch.id },
      });
      const snapshot = storedDispatch.structuredReportSnapshot as {
        location?: { address?: string | null };
        report?: { title?: string | null };
      };

      expect(snapshot.report?.title).toBe(report.title);
      expect(snapshot.location?.address).toBe(report.address);
    } finally {
      if (dispatchId) {
        await prisma.dispatchRequest.delete({ where: { id: dispatchId } });
      }
      await prisma.dispatchAgency.update({
        data: { availability: agency.availability },
        where: { id: agency.id },
      });
      await prisma.emergencyReport.update({
        data: { status: originalReportStatus },
        where: { id: report.id },
      });
      await prisma.reportStatusEvent.deleteMany({
        where: {
          note: "Operator mengirim permintaan dispatch",
          reportId: report.id,
        },
      });
    }
  });

  test("closes a report and cancels an early dispatch atomically", async () => {
    const repository = new PrismaDispatchRepository();
    const reporter = await prisma.user.findFirst({
      where: { role: "REPORTER" },
    });
    const operator = await prisma.user.findFirst({
      where: { role: "OPERATOR" },
    });
    const agency = await prisma.dispatchAgency.findFirst({
      where: { availability: "AVAILABLE", isActive: true },
    });

    expect(reporter).toBeDefined();
    expect(operator).toBeDefined();
    expect(agency).toBeDefined();
    if (!(reporter && operator && agency)) {
      return;
    }

    const report = await prisma.emergencyReport.create({
      data: {
        category: "LOW",
        reporterId: reporter.id,
        status: "READY_FOR_REVIEW",
        title: "Laporan penutupan integration test",
      },
    });
    const dispatch = await prisma.dispatchRequest.create({
      data: {
        agencyId: agency.id,
        agencyType: agency.type,
        dispatchedByOperatorId: operator.id,
        reportId: report.id,
        status: "ACKNOWLEDGED",
        structuredReportSnapshot: {},
      },
    });
    await prisma.dispatchAgency.update({
      data: { availability: "BUSY" },
      where: { id: agency.id },
    });

    try {
      const result = await repository.closeReport({
        note: "Nomor pelapor tidak dapat memberikan detail",
        operatorId: operator.id,
        reason: "INCOMPLETE_REPORT",
        reportId: report.id,
      });
      const [closedReport, cancelledDispatch, releasedAgency] =
        await Promise.all([
          prisma.emergencyReport.findUniqueOrThrow({
            where: { id: report.id },
          }),
          prisma.dispatchRequest.findUniqueOrThrow({
            where: { id: dispatch.id },
          }),
          prisma.dispatchAgency.findUniqueOrThrow({
            where: { id: agency.id },
          }),
        ]);

      expect(result.cancelledDispatchId).toBe(dispatch.id);
      expect(closedReport.status).toBe("CLOSED");
      expect(closedReport.closureReason).toBe("INCOMPLETE_REPORT");
      expect(cancelledDispatch.status).toBe("CANCELLED");
      expect(cancelledDispatch.cancelledAt).not.toBeNull();
      expect(releasedAgency.availability).toBe("AVAILABLE");
    } finally {
      await prisma.emergencyReport.delete({ where: { id: report.id } });
      await prisma.dispatchAgency.update({
        data: { availability: agency.availability },
        where: { id: agency.id },
      });
    }
  });
});
