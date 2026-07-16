import prisma from "@siaga-app/db";
import {
  DispatchStatus,
  type ReportStatus as PrismaReportStatus,
  ReportStatus,
} from "@siaga-app/db/enums";
import type { DashboardSnapshot } from "../domain/entities";
import type { OverviewRepository } from "../domain/overview-repository";

const ACTIVE_REPORT_STATUSES: PrismaReportStatus[] = [
  ReportStatus.SUBMITTED,
  ReportStatus.AI_GATHERING,
  ReportStatus.READY_FOR_REVIEW,
  ReportStatus.DISPATCH_PENDING,
  ReportStatus.DISPATCHED,
  ReportStatus.HELP_EN_ROUTE,
  ReportStatus.HELP_ARRIVED,
];

const ACTIVE_DISPATCH_STATUSES = [
  DispatchStatus.REQUESTED,
  DispatchStatus.ACKNOWLEDGED,
  DispatchStatus.EN_ROUTE,
  DispatchStatus.ARRIVED,
  DispatchStatus.RETURNING_TO_BASE,
  DispatchStatus.RETURNED_TO_BASE,
] as const;

export class PrismaOverviewRepository implements OverviewRepository {
  async getDashboardSnapshot({
    previousPeriodStart,
  }: {
    previousPeriodStart: Date;
  }): Promise<DashboardSnapshot> {
    const [activeReports, reports, dispatches, agencies, statusEvents] =
      await Promise.all([
        prisma.emergencyReport.findMany({
          select: {
            address: true,
            category: true,
            createdAt: true,
            id: true,
            incidentType: true,
            status: true,
            title: true,
          },
          where: { status: { in: ACTIVE_REPORT_STATUSES } },
        }),
        prisma.emergencyReport.findMany({
          select: {
            createdAt: true,
            incidentType: true,
            resolvedAt: true,
          },
          where: {
            OR: [
              { createdAt: { gte: previousPeriodStart } },
              { resolvedAt: { gte: previousPeriodStart } },
            ],
          },
        }),
        prisma.dispatchRequest.findMany({
          select: {
            arrivedAt: true,
            requestedAt: true,
          },
          where: {
            arrivedAt: { not: null },
            requestedAt: { gte: previousPeriodStart },
          },
        }),
        prisma.dispatchAgency.findMany({
          include: {
            dispatches: {
              select: { id: true },
              where: { status: { in: [...ACTIVE_DISPATCH_STATUSES] } },
            },
          },
          where: { isActive: true },
        }),
        prisma.reportStatusEvent.findMany({
          include: {
            report: {
              select: {
                category: true,
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      ]);

    return {
      activeReports,
      agencies: agencies.map((agency) => ({
        activeDispatches: agency.dispatches.length,
        availability: agency.availability,
        type: agency.type,
      })),
      dispatches: dispatches.flatMap((dispatch) =>
        dispatch.arrivedAt
          ? [
              {
                arrivedAt: dispatch.arrivedAt,
                requestedAt: dispatch.requestedAt,
              },
            ]
          : []
      ),
      reports,
      statusEvents,
    };
  }
}
